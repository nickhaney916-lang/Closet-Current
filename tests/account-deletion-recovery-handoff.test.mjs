import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDeletionRecoveryHandoff} from '../supabase/functions/account-delete/recovery-handoff.mjs';
const A='a1111111-1111-4111-8111-111111111111';
const B='b2222222-2222-4222-8222-222222222222';
const INCIDENT='CC-INC-REVIEW2026';
const NOW=1792720000000; // fixed synthetic server clock; never real user data
const reviewState=()=>({
 code:'STORAGE_REMAINS_WORKER_STATUS_UNKNOWN',
 writeLocked:true,cleanupClaimed:true,privatePhotoObjectsPresent:true,
 backupPresent:true,authUserPresent:true,
 workerActiveOrStopped:'UNKNOWN',deletionVerified:false,
 mayResumeAutomatically:false,mayReleaseTombstone:false,
 mayStartCleanupWorker:false,mayChangeAuth:false,
 requiresSeparateOperatorReview:true,inventoryExhaustivelyVerified:false
});
function setup(opts={}){
 const calls=[],first=reviewState(),second={...first,...opts.second};
 const d={
  enabled:opts.enabled??true,
  async authorizeIncident(v){calls.push('authorize');
   assert.equal(v.uid,A);assert.equal(v.incidentTicket,INCIDENT);
   return opts.authorized!==false;},
  async serverNow(){calls.push('time');return opts.now??NOW;},
  async assess(){calls.push('assess');return calls.filter(c=>c==='assess').length===1?
   {...first,...opts.first}:second;},
  async readPhotoInventory(v){
   calls.push('inventory-'+v.stage);
   const second=v.stage==='after-approvals';
   const data=second?opts.secondInventory:opts.firstInventory;
   return {ownerScoped:true,filenamesEnumerated:true,photoBytesVerified:false,
    digest:second&&opts.changePhotoNames?'2'.repeat(64):'1'.repeat(64),
    count:1,pages:1,...data};
  },
  async verifyWorkerFenced(v){calls.push('fence-'+v.stage);
   if(opts.fenceError)throw Error('independent fencing failed');
   return {quiescent:opts.quiescent??true,fenceEnforced:opts.fenced??true,
    fenceEpoch:v.stage==='before-review'?'FENCE-2026CASEA123':
     opts.changedEpoch?'FENCE-2026CASEB456':'FENCE-2026CASEA123',
    verifiedAtMs:opts.fenceTime??NOW};},
  async verifyApproval(v){calls.push('approve-'+v.role);
   if(opts.approvalError)throw Error('approval backend unreachable');
   if(opts.badApprovalRole)return {verified:true,role:'invalid',
    boundToOwnerIncidentAndSnapshot:true,readOnlyReviewOnly:true,
    principalId:'auditor555',verifiedAtMs:NOW};
   return {verified:opts.approved!==false,role:v.role,
    boundToOwnerIncidentAndSnapshot:opts.bound!==false,
    readOnlyReviewOnly:opts.reviewOnly!==false,
    principalId:opts.sameReviewer?'incident999':
     v.role==='incident_owner'?'incident999':'security888',
    verifiedAtMs:opts.approvalTime??NOW};}
 };
 return {handoff:createDeletionRecoveryHandoff(d),calls,
  request:{uid:A,incidentTicket:INCIDENT,operatorContext:{internal:true},
   incidentApprovalProof:'opaque-reviewed-proof-1',
   securityApprovalProof:'opaque-reviewed-proof-2'}};
}
test('default-disabled module cannot inspect, attest, approve or access incident',async()=>{
 const x=setup({enabled:false});
 await assert.rejects(x.handoff.prepare(x.request),/disabled/);
 assert.deepEqual(x.calls,[]);
});
test('authorization runs BEFORE any private inspection, and denial reads nothing',async()=>{
 const x=setup({authorized:false});
 await assert.rejects(x.handoff.prepare(x.request),/not authorized/);
 assert.deepEqual(x.calls,['authorize']);
});
test('cannot use another owner or guess an incident ticket to access private context',async()=>{
 const x=setup();
 for(const arg of [{uid:'fake'},{uid:B},{incidentTicket:'ID-12345'},
  {incidentTicket:'CC-INC-trustme'},{incidentTicket:null}]){
  if(arg.uid===B){
   await assert.rejects(x.handoff.prepare({...x.request,...arg}),/Expected values/);
  }else await assert.rejects(x.handoff.prepare({...x.request,...arg}));
 }
 assert.deepEqual(x.calls.filter(c=>c!=='authorize'),[]);
});
test('approval proofs cannot be empty, reused or unbounded even when backend is present',async()=>{
 for(const changes of [{incidentApprovalProof:''},
  {securityApprovalProof:'first'},
  {securityApprovalProof:'opaque-reviewed-proof-1'},
  {incidentApprovalProof:'x'.repeat(8193)}]){
  const x=setup();
  await assert.rejects(x.handoff.prepare({...x.request,...changes}),/distinct opaque review proofs/);
  assert.deepEqual(x.calls,[]);
 }
});
test('review requires two different verified humans, correct role and exact incident/snapshot scope',async()=>{
 for(const config of [{sameReviewer:true},{approved:false},{bound:false},
  {reviewOnly:false},{badApprovalRole:true},{approvalTime:NOW-120001},
  {approvalTime:NOW+1},{approvalError:true}]){
  const x=setup(config);
  await assert.rejects(x.handoff.prepare(x.request),
   'must reject unverified operator proofs: '+JSON.stringify(config));
  assert.equal(x.calls.filter(c=>c==='assess').length,1);
 }
});
test('inspector outputs are not a destructive capability; no customer identity or secrets in packet',async()=>{
 const x=setup(),result=await x.handoff.prepare(x.request);
 assert.equal(Object.isFrozen(result),true);
 assert.equal(result.outcome,'READY_FOR_SEPARATE_MANUAL_INCIDENT_REVIEW');
 assert.equal(result.workerFenceObserved,true);
 assert.equal(result.recoveryAuthorized,false);
 for(const k of ['mayUnlock','mayRemoveClaim','mayRetryCleanup','mayDeleteStorage','mayDeleteAuth'])
  assert.equal(result[k],false);
 const json=JSON.stringify(result);
 for(const secret of [A,B,INCIDENT,'opaque-reviewed-proof-1','opaque-reviewed-proof-2',
  'incident999','security888','password','access_token','photo.jpg'])
  assert.equal(json.includes(secret),false,'Private identifier leaked: '+secret);
 assert.deepEqual(x.calls,['authorize','time','assess','fence-before-review',
  'inventory-before-approvals','approve-incident_owner','approve-security_reviewer',
  'assess','inventory-after-approvals','fence-after-review']);
});
test('no claim, no tombstone, or apparently unlocked account never enters incident handoff',async()=>{
 const changes=[{cleanupClaimed:false,code:'WRITE_LOCKED_NOT_CLAIMED'},
  {writeLocked:false,code:'CLAIM_WITHOUT_WRITE_LOCK'},
  {deletionVerified:true},{mayResumeAutomatically:true},
  {inventoryExhaustivelyVerified:true},{workerActiveOrStopped:'STOPPED'}];
 for(const first of changes){
  const x=setup({first});
  await assert.rejects(x.handoff.prepare(x.request));
  assert.deepEqual(x.calls.slice(0,3),['authorize','time','assess']);
  assert.equal(x.calls.some(c=>c.startsWith('approve-')),false);
 }
});
test('external worker fencing must be enforced and recent, never inferred from old claim',async()=>{
 for(const config of [{quiescent:false},{fenced:false},{fenceTime:NOW-120001},
  {fenceTime:NOW+500},{fenceError:true}]){
  const x=setup(config);
  await assert.rejects(x.handoff.prepare(x.request));
  assert.equal(x.calls.some(c=>c.startsWith('approve-')),false);
 }
});
test('mid-review Storage/backup/Auth change invalidates approvals and prevents handoff',async()=>{
 for(const second of [{privatePhotoObjectsPresent:false},
  {backupPresent:false},{authUserPresent:false},
  {code:'AUTH_REMOVED_WITH_PRIVATE_DATA_REMAINING'},
  {cleanupClaimed:false},{mayReleaseTombstone:true}]){
  const x=setup({second});
  await assert.rejects(x.handoff.prepare(x.request));
  assert.equal(x.calls.filter(c=>c==='assess').length,2);
  assert.equal(x.calls.includes('fence-after-review'),false);
 }
});
test('unchanged presence with changed photo names rejects incident review',async()=>{
 const x=setup({changePhotoNames:true});
 await assert.rejects(x.handoff.prepare(x.request),/inventory changed during review/);
 assert.equal(x.calls.includes('fence-after-review'),false);
 assert.equal(x.calls.filter(k=>k.startsWith('inventory-')).length,2);
});
test('missing, malformed, or wrong-scope inventory proof fails closed',async()=>{
 for(const firstInventory of [{ownerScoped:false},{filenamesEnumerated:false},
  {digest:'oops'},{count:0},{count:-1},{count:10001},
  {pages:0},{pages:102},{photoBytesVerified:true}]){
  const x=setup({firstInventory});
  await assert.rejects(x.handoff.prepare(x.request),/inventory unavailable/);
  assert.equal(x.calls.some(k=>k.startsWith('approve-')),false);
 }
});
test('independent worker fence rotation or failed second fence aborts review',async()=>{
 const x=setup({changedEpoch:true});
 await assert.rejects(x.handoff.prepare(x.request),/fence changed/);
 assert.equal(x.calls.at(-1),'fence-after-review');
});
test('missing server clock or forged future date rejects request before approval',async()=>{
 for(const time of [0,NaN,'now',-1,Number.MAX_SAFE_INTEGER+2]){
  const x=setup({now:time});
  await assert.rejects(x.handoff.prepare(x.request));
  assert.deepEqual(x.calls,['authorize','time']);
 }
});
test('required external privileged verification callbacks cannot be replaced by user claims',()=>{
 assert.throws(()=>createDeletionRecoveryHandoff({enabled:true,
  authorizeIncident:()=>true}),/Missing independent/);
});
test('handoff is never attached to live deletion endpoint or public app and has no dangerous API',()=>{
 const endpoint=readFileSync('supabase/functions/account-delete/index.ts','utf8');
 const module=readFileSync('supabase/functions/account-delete/recovery-handoff.mjs','utf8');
 assert.match(endpoint,/status:503/);
 assert.match(endpoint,/deletionCompleted:false/);
 assert.doesNotMatch(endpoint,/recovery-handoff|createDeletionRecoveryHandoff/);
 assert.doesNotMatch(readFileSync('public/closet-stylist.js','utf8'),/recovery-handoff/);
 assert.doesNotMatch(module,/Deno\.serve|supabase\.rpc|deleteUser\(|removePhotos\(|unlockAccount\(|storage\.remove/);
});
