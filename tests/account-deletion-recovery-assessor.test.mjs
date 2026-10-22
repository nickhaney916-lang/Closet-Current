import test from 'node:test';
import assert from 'node:assert/strict';
import {createDeletionRecoveryAssessor} from '../supabase/functions/account-delete/recovery-assessor.mjs';
import {readFileSync} from 'node:fs';
const A='a1111111-1111-4111-8111-111111111111';
const B='b2222222-2222-4222-8222-222222222222';
const PHOTO='0'.repeat(64)+'.jpg';
const ticket='CC-INC-TESTONLY2026';
function setup(config={}){
 const calls=[];
 const state={lock:true,claim:true,photos:[PHOTO],backup:true,auth:'present',...config};
 const deps={
  enabled:config.enabled??true,
  async authorizeOperator(x){calls.push('authorize');assert.equal(x.uid,A);assert.equal(x.incidentTicket,ticket);
   return config.allowed!==false;},
  async readWriteLock(uid){calls.push('lock');assert.equal(uid,A);return state.lock;},
  async readCleanupClaim(uid){calls.push('claim');assert.equal(uid,A);return state.claim;},
  async listPhotos(uid,limit){calls.push('photos');assert.equal(uid,A);assert.equal(limit,1);return state.photos;},
  async hasBackup(uid){calls.push('backup');assert.equal(uid,A);return state.backup;},
  async readAuthState(uid){calls.push('auth');assert.equal(uid,A);return state.auth;}
 };
 const assessor=createDeletionRecoveryAssessor(deps);
 const request={uid:A,incidentTicket:ticket,operatorContext:{approvedOnly:true}};
 return {assessor,calls,state,request};
}
test('recovery assessment disabled by default, with no account state reads',async()=>{
 const h=setup({enabled:false});
 await assert.rejects(h.assessor.assess(h.request),/disabled/);
 assert.deepEqual(h.calls,[]);
});
test('operator-specific authorization is mandatory before the first inspection read',async()=>{
 const h=setup({allowed:false});
 await assert.rejects(h.assessor.assess(h.request),/not authorized/);
 assert.deepEqual(h.calls,['authorize']);
});
test('operator authorization cannot inspect another account by supplying a different valid UUID',async()=>{
 const h=setup({allowed:false});
 await assert.rejects(h.assessor.assess({...h.request,uid:B}));
 assert.deepEqual(h.calls,['authorize']);
});
test('forged identities, tickets or missing internal dependencies fail closed',async()=>{
 const h=setup();
 for(const bad of [{uid:'owner@example.com'},{uid:'../'+A},
  {incidentTicket:'CC-INC-xyz'},{incidentTicket:'INC-TRUSTME'}, {incidentTicket:''}])
 await assert.rejects(h.assessor.assess({...h.request,...bad}));
 assert.deepEqual(h.calls,[]);
 assert.throws(()=>createDeletionRecoveryAssessor({enabled:true,readWriteLock:()=>true}),/Missing/);
});
test('every partial-deletion stage is operator review only; no release, takeover or inferred completion',async()=>{
 const cases=[
  [{lock:false,claim:false,photos:[PHOTO],backup:true,auth:'present'},'NO_DELETION_LOCK'],
  [{lock:false,claim:true,photos:[PHOTO],backup:true,auth:'present'},'CLAIM_WITHOUT_WRITE_LOCK'],
  [{lock:false,claim:false,photos:[],backup:false,auth:'absent'},'AUTH_ABSENT_WITHOUT_TOMBSTONE'],
  [{lock:true,claim:false,photos:[PHOTO],backup:true,auth:'present'},'WRITE_LOCKED_NOT_CLAIMED'],
  [{lock:true,claim:false,photos:[],backup:false,auth:'absent'},'ORPHANED_WITHOUT_CLAIM'],
  [{lock:true,claim:true,photos:[PHOTO],backup:true,auth:'present'},'STORAGE_REMAINS_WORKER_STATUS_UNKNOWN'],
  [{lock:true,claim:true,photos:[],backup:true,auth:'present'},'BACKUP_REMAINS_WORKER_STATUS_UNKNOWN'],
  [{lock:true,claim:true,photos:[],backup:false,auth:'present'},'AUTH_REMAINS_WORKER_STATUS_UNKNOWN'],
  [{lock:true,claim:true,photos:[PHOTO],backup:false,auth:'absent'},'AUTH_REMOVED_WITH_PRIVATE_DATA_REMAINING'],
  [{lock:true,claim:true,photos:[],backup:true,auth:'absent'},'AUTH_REMOVED_WITH_PRIVATE_DATA_REMAINING'],
  [{lock:true,claim:true,photos:[],backup:false,auth:'absent'},'APPARENTLY_EMPTY_REQUIRES_INDEPENDENT_CONFIRMATION']
 ];
 for(const [state,expected] of cases){
  const h=setup(state),report=await h.assessor.assess(h.request);
  assert.equal(report.code,expected);
  assert.equal(Object.isFrozen(report),true);
  assert.equal(report.workerActiveOrStopped,'UNKNOWN');
  assert.equal(report.inventoryExhaustivelyVerified,false);
  assert.equal(report.deletionVerified,false);
  for(const deny of ['mayResumeAutomatically','mayReleaseTombstone',
   'mayStartCleanupWorker','mayChangeAuth'])assert.equal(report[deny],false,expected+' '+deny);
  if(expected==='NO_DELETION_LOCK')assert.equal(report.requiresSeparateOperatorReview,false);
  else assert.equal(report.requiresSeparateOperatorReview,true);
  assert.deepEqual(h.calls,['authorize','lock','claim','photos','backup','auth']);
 }
});
test('report cannot expose identifiers, email, private file names, keys or incident ticket',async()=>{
 const h=setup();
 const report=await h.assessor.assess(h.request);
 const json=JSON.stringify(report);
 for(const value of [A,B,PHOTO,ticket,'@','access_token','password','owner_id','filePath'])
  assert.equal(json.includes(value),false,value);
 assert.equal(report.privatePhotoObjectsPresent,true);
 assert.equal(Object.keys(report).includes('userId'),false);
});
test('non-boolean, malformed, ambiguous or failed reads never become an approved recovery receipt',async()=>{
 const cases=[
  {lock:1},{claim:'true'},{photos:{length:0}},{photos:[null]},
  {photos:['nested/'+PHOTO]},{photos:['not-hash.jpg']},{photos:[PHOTO,PHOTO]},
  {backup:null},{auth:'unknown'},{auth:{status:404}},{auth:false}
 ];
 for(const bad of cases){
  const h=setup(bad);
  await assert.rejects(h.assessor.assess(h.request),'must fail on '+JSON.stringify(bad));
 }
 const h=setup();h.state.photos=[PHOTO];
 const badDeps={
  enabled:true,authorizeOperator:()=>true,readWriteLock:()=>true,
  readCleanupClaim:()=>true,listPhotos:async()=>{throw Error('Storage timed out');},
  hasBackup:()=>false,readAuthState:()=> 'absent'
 };
 await assert.rejects(createDeletionRecoveryAssessor(badDeps).assess(h.request),/Storage timed out/);
});
test('server assessment remains separate from always-disabled deletion endpoint and browser bundle',()=>{
 const entry=readFileSync('supabase/functions/account-delete/index.ts','utf8');
 const product=readFileSync('public/cloud-backup.js','utf8');
 const module=readFileSync('supabase/functions/account-delete/recovery-assessor.mjs','utf8');
 assert.match(entry,/status:503/);
 assert.match(entry,/deletionCompleted:false/);
 assert.doesNotMatch(entry,/recovery-assessor|createDeletionRecoveryAssessor/);
 assert.doesNotMatch(product,/recovery-assessor|createDeletionRecoveryAssessor/);
 assert.doesNotMatch(module,/Deno\.serve|createClient|deleteUser\(|removePhotos\(|releaseLock|setTimeout|process\.env/);
});
