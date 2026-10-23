// Synthetic service-contract acceptance. No real accounts or external services.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {fixture,A,B,INCIDENT,jpeg,digest} from './helpers/issue196-deletion-fixture.mjs';
import {createAccountDeletionCoordinator} from '../supabase/functions/account-delete/deletion-coordinator.mjs';
import {createDeletionRecoveryHandoff} from '../supabase/functions/account-delete/recovery-handoff.mjs';
const require=createRequire(import.meta.url),cloud=require('../public/cloud-backup-engine.js'),file=require('../public/wardrobe-backup-engine.js');
const baseline='50223902df0ae54ff15bb89bd9100ddc76bb3581';
test.after(()=>{if(globalThis.issue196NetworkGuard)assert.equal(globalThis.issue196NetworkGuard.attempts(),0,'lifecycle suite attempted network I/O');});
function isolatedB(h){const before=h.fingerprint(B);return ()=>assert.equal(h.fingerprint(B),before,'other owner bytes, backup, Auth and locks unchanged');}
function noCompletion(h){assert.equal(h.receipts.length,0,'interrupted attempt must not publish success');}
const attemptStages=['verifySession','verifyPassword','lockWrites','claimCleanup','listPhotos','removePhotos','deleteBackup','hasBackup','deleteUser','verifyUserDeleted'];

test('issue196: genuine synthetic JPEGs and complete >2-page inventory include shared sources and unreferenced uploads',async()=>{
 const h=fixture(),unchanged=isolatedB(h),document=h.backups.get(A),references=new Set();
 await cloud.mapImages(document,async p=>{references.add(p);assert.ok(h.objects.has(p.slice(13)));return p;});
 assert.equal(references.size,5);assert.equal(h.names(A).length,237);
 assert.equal(h.names(A).length-references.size,232,'orphans not discoverable from backup alone');
 assert.equal(document.items[0].originalPhoto.image,document.items[1].originalPhoto.image);
 assert.equal(document.state.draft.batch[0].originalPhoto.image,document.items[0].originalPhoto.image);
 const originalPath=h.refs[A].original.slice(13),bytes=h.objects.get(originalPath);
 assert.equal(bytes.readUInt16BE(0),0xffd8);assert.equal(bytes.readUInt16BE(bytes.length-2),0xffd9);
 assert.equal(originalPath.split('/')[1],digest(bytes)+'.jpg');
 const result=await h.run();assert.deepEqual(result,{completed:true,deletedPhotoObjects:237,backupRemoved:true,authUserRemoved:true,needsLocalDeviceCleanup:true});
 assert.equal(h.names(A).length,0);assert.equal(h.backups.has(A),false);assert.equal(h.users.has(A),false);
 assert.equal(h.calls.filter(c=>c.stage==='removePhotos').length,3);unchanged();
 assert.ok(h.locks.has(A)&&h.claims.has(A),'completion never removes write tombstone or claim');
 assert.ok(h.calls.findIndex(c=>c.stage==='deleteBackup')>h.calls.map(c=>c.stage).lastIndexOf('removePhotos'));
 assert.ok(h.calls.findIndex(c=>c.stage==='deleteUser')>h.calls.findIndex(c=>c.stage==='hasBackup'));
});

test('issue196: upload-success/backup-save-failure orphan is swept by owner inventory rather than metadata references',async()=>{
 const h=fixture(),before=structuredClone(h.backups.get(A));
 const orphan=h.write(h.token(A),'photo',jpeg('upload-acknowledged-before-failed-RPC'));
 assert.ok(!JSON.stringify(before).includes(orphan));
 assert.deepEqual(h.backups.get(A),before,'failed RPC modeled as no metadata commit');
 const receipt=await h.run();assert.equal(receipt.deletedPhotoObjects,238);
 assert.equal(h.objects.has(orphan.slice(13)),false);assert.equal(h.backups.has(A),false);
});

test('issue196: disabled coordinator and shipped HTTP handler cannot activate deletion',async()=>{
 const h=fixture();await assert.rejects(h.run(A,false),/disabled/);assert.equal(h.calls.length,0);
 let handler;vm.runInNewContext(readFileSync('supabase/functions/account-delete/index.ts','utf8'),{Deno:{serve:fn=>{handler=fn;}},Response,JSON});
 const response=handler();assert.equal(response.status,503);assert.equal((await response.json()).deletionCompleted,false);
 assert.equal(h.names(A).length,237);noCompletion(h);
});

for(const stage of attemptStages)for(const when of ['before','after']){
 test('issue196: interruption '+when+' '+stage+' gives no false receipt, preserves B and retains lock/claim',async()=>{
  const h=fixture({count:7}),unchanged=isolatedB(h);Object.assign(h.fault,{stage,when});
  await assert.rejects(h.run(),new RegExp('synthetic interruption '+stage+' '+when));noCompletion(h);unchanged();
  const snapshot={locked:h.locks.has(A),claimed:h.claims.has(A),photos:h.names(A).length,backup:h.backups.has(A),auth:h.users.has(A)};
  // Read-only recovery never certifies apparent emptiness or authorizes writes.
  h.fault.stage=null;const state=await h.assess();
  assert.equal(state.deletionVerified,false);assert.equal(state.inventoryExhaustivelyVerified,false);
  for(const k of ['mayResumeAutomatically','mayReleaseTombstone','mayStartCleanupWorker','mayChangeAuth'])assert.equal(state[k],false);
  assert.equal(state.workerActiveOrStopped,'UNKNOWN');
  assert.deepEqual({locked:h.locks.has(A),claimed:h.claims.has(A),photos:h.names(A).length,backup:h.backups.has(A),auth:h.users.has(A)},snapshot);
  if(snapshot.claimed){
   await assert.rejects(h.run(),/claimed|verify-bearer/,'explicit retry cannot take over claimed cleanup');noCompletion(h);unchanged();
   assert.ok(h.locks.has(A)&&h.claims.has(A));
  }
 });
}

test('issue196: second-page crash keeps partial state and refuses a new cleanup worker',async()=>{
 const h=fixture(),unchanged=isolatedB(h);Object.assign(h.fault,{stage:'removePhotos',when:'after',occurrence:2});
 await assert.rejects(h.run(),/interruption/);assert.equal(h.names(A).length,37);
 assert.ok(h.backups.has(A)&&h.users.has(A));h.fault.stage=null;
 const state=await h.assess();assert.equal(state.code,'STORAGE_REMAINS_WORKER_STATUS_UNKNOWN');
 await assert.rejects(h.run(),/claimed/);assert.equal(h.names(A).length,37);noCompletion(h);unchanged();
});

test('issue196: lock and claim false results stop before Storage enumeration',async()=>{
 for(const name of ['lockWrites','claimCleanup']){
  const h=fixture(),before=h.fingerprint(A),deps={...h.deps,[name]:async()=>false};
  await assert.rejects(createAccountDeletionCoordinator({enabled:true,...deps}).deleteAccount(h.request()),/write lock|claimed/);
  assert.ok(!h.calls.some(c=>c.stage==='listPhotos'));
  assert.equal(h.names(A).length,237);assert.ok(h.users.has(A)&&h.backups.has(A));
  if(name==='lockWrites')assert.equal(h.fingerprint(A),before);
 }
});

test('issue196: simultaneous workers have exactly one cleanup claim and one success',async()=>{
 const h=fixture(),unchanged=isolatedB(h);
 const results=await Promise.allSettled([h.run(),h.run()]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.match(results.find(r=>r.status==='rejected').reason.message,/claimed/);
 assert.equal(h.receipts.length,1);assert.equal(h.calls.filter(c=>c.stage==='removePhotos').length,3);unchanged();
});

test('issue196: modeled in-flight upload serializes before lock, is inventoried, and old JWT/queued sync cannot resurrect data',async()=>{
 const h=fixture(),unchanged=isolatedB(h),upload=h.beginUpload(A,jpeg('in-flight'));
 let atLock;const waiting=new Promise(resolve=>{atLock=resolve;});h.setHook(async stage=>{if(stage==='lockWrites')atLock();});
 const deletion=h.run();await waiting;assert.equal(h.locks.has(A),false,'model lock waits for preexisting write');
 upload.release();await upload.committed;const receipt=await deletion;
 assert.equal(receipt.deletedPhotoObjects,238);assert.equal(h.names(A).length,0);
 for(const kind of ['photo','backup'])assert.throws(()=>h.write(h.token(A),kind),/write barrier/);
 // B has the same photo hash but no A tombstone and remains writable.
 h.write(h.token(B),'photo',jpeg('B-still-usable'));
 assert.equal(h.names(B).length,6);assert.equal(h.users.has(B),true);
 // Existing B records unchanged except the deliberately added synthetic photo.
 h.objects.delete(B+'/'+digest(jpeg('B-still-usable'))+'.jpg');unchanged();
});

for(const name of ['unexpected.txt','nested/photo.jpg',B+'/'+digest(jpeg('foreign'))+'.jpg'])
 test('issue196: forbidden object '+name.split('/')[0]+' stops before erasing unknown paths',async()=>{
  const h=fixture(),unchanged=isolatedB(h);h.objects.set(A+'/'+name,jpeg('unknown'));
  await assert.rejects(h.run(),/Unrecognized private photo paths/);noCompletion(h);unchanged();
  assert.ok(h.objects.has(A+'/'+name));assert.ok(h.backups.has(A)&&h.users.has(A));
  assert.ok(h.locks.has(A)&&h.claims.has(A),'unknown inventory requires manual incident; no unlock');
 });

test('issue196: fake Storage success and backup/Auth non-removal never become success',async()=>{
 for(const stage of ['removePhotos','deleteBackup','deleteUser']){
  const h=fixture({count:7}),unchanged=isolatedB(h),deps={...h.deps,[stage]:async()=>{}};
  await assert.rejects(createAccountDeletionCoordinator({enabled:true,...deps}).deleteAccount(h.request()),/photos remain|backup still exists|Auth account deletion unverified/);
  noCompletion(h);unchanged();
 }
});

test('issue196: partial Storage removal followed by quota error remains an incident, not an automatic retry',async()=>{
 const h=fixture(),unchanged=isolatedB(h),deps={...h.deps,removePhotos:async(uid,paths)=>{
  await h.raw.removePhotos(uid,paths.slice(0,3));const e=Error('synthetic service quota');e.name='QuotaExceededError';throw e;
 }};
 await assert.rejects(createAccountDeletionCoordinator({enabled:true,...deps}).deleteAccount(h.request()),/quota/);
 assert.equal(h.names(A).length,234);assert.ok(h.backups.has(A)&&h.users.has(A));
 assert.equal((await h.assess()).code,'STORAGE_REMAINS_WORKER_STATUS_UNKNOWN');
 await assert.rejects(h.run(),/claimed/);noCompletion(h);unchanged();
});

test('issue196: caller-selected B and wrong reauthentication cannot delete B through A session',async()=>{
 const h=fixture(),unchanged=isolatedB(h);
 const result=await createAccountDeletionCoordinator({enabled:true,...h.deps}).deleteAccount({...h.request(),owner_id:B,user:{id:B}});
 assert.equal(result.completed,true);unchanged();
 const x=fixture(),before=x.fingerprint(A);
 await assert.rejects(createAccountDeletionCoordinator({enabled:true,...x.deps}).deleteAccount({...x.request(),password:'wrong-password'}),/reauthenticate/);
 assert.equal(x.fingerprint(A),before);noCompletion(x);
});

test('issue196: recovery uses actual interrupted state; review packet is not an executor or erasure receipt',async()=>{
 const h=fixture();Object.assign(h.fault,{stage:'deleteBackup',when:'after'});await assert.rejects(h.run(),/interruption/);h.fault.stage=null;
 const before=h.fingerprint(A),now=1792720000000,request={uid:A,incidentTicket:INCIDENT,operatorContext:{syntheticReviewer:true},incidentApprovalProof:'synthetic-review-proof-one',securityApprovalProof:'synthetic-review-proof-two'};
 const deps={enabled:true,authorizeIncident:async({uid})=>uid===A,assess:()=>h.assess(),serverNow:async()=>now,
  readPhotoInventory:async()=>{
   const names=h.names(A);
   return {ownerScoped:true,filenamesEnumerated:true,photoBytesVerified:false,
    count:names.length,pages:Math.ceil((names.length+1)/100),
    digest:digest(Buffer.from(JSON.stringify({owner:A,names})))};
  },
  verifyWorkerFenced:async()=>({quiescent:true,fenceEnforced:true,fenceEpoch:'FENCE-SYNTHETIC196',verifiedAtMs:now}),
  verifyApproval:async({role})=>({verified:true,role,boundToOwnerIncidentAndSnapshot:true,readOnlyReviewOnly:true,principalId:role==='incident_owner'?'reviewer_one':'reviewer_two',verifiedAtMs:now})};
 const receipt=await createDeletionRecoveryHandoff(deps).prepare(request);
 assert.equal(receipt.snapshotCode,'AUTH_REMAINS_WORKER_STATUS_UNKNOWN');
 for(const k of ['deletionVerified','recoveryAuthorized','mayUnlock','mayRemoveClaim','mayRetryCleanup','mayDeleteStorage','mayDeleteAuth'])assert.equal(receipt[k],false);
 assert.equal(h.fingerprint(A),before);noCompletion(h);
 for(const secret of [A,B,INCIDENT,request.incidentApprovalProof,request.securityApprovalProof])assert.ok(!JSON.stringify(receipt).includes(secret));
 await assert.rejects(createDeletionRecoveryHandoff({...deps,verifyWorkerFenced:async()=>({quiescent:false})}).prepare(request),/fenced/);
 let reads=0;
 await assert.rejects(createDeletionRecoveryHandoff({...deps,authorizeIncident:async()=>false,assess:async()=>{reads++;return h.assess();}}).prepare(request),/not authorized/);
 assert.equal(reads,0);assert.equal(h.fingerprint(A),before);
});

test('issue196: cloud cleanup does not erase local/offline exports; actual backup validator/merge can reintroduce removed data',async()=>{
 const h=fixture(),localBefore=JSON.stringify(h.local.get(A)),exportBefore=h.exports.get(A);await h.run();
 assert.equal(JSON.stringify(h.local.get(A)),localBefore);assert.equal(h.exports.get(A),exportBefore);
 const c={structuredClone};vm.createContext(c);
 for(const path of ['taxonomy.js','outfit-board-engine.js'])vm.runInContext(readFileSync('public/'+path,'utf8'),c);
 const exportData=JSON.parse(exportBefore);
 const incoming=file.validate(exportData,A,{normalizeItem:c.normalizeClothing,normalizeLook:x=>x,cleanBoard:c.cleanOutfitBoard});
 const restored=file.merge({items:[],looks:[],outfitBoard:{current:{slots:{}},saved:[]}},incoming,{makeId:()=> 'synthetic-copy',cleanBoard:c.cleanOutfitBoard});
 assert.equal(restored.items.length,2);assert.ok(restored.items[0].originalPhoto.image.startsWith('data:image/jpeg;'));
 assert.throws(()=>file.validate(exportData,B,{normalizeItem:c.normalizeClothing,normalizeLook:x=>x,cleanBoard:c.cleanOutfitBoard}),/another account/);
 assert.ok(!('draft' in incoming),'file export/restore differs from cloud draft coverage');
 assert.ok(!exportBefore.includes('unfinished-draft'));
});

test('issue196: a late inventory phantom cannot be certified complete',async()=>{
 const h=fixture({count:7}),deps={...h.deps,listPhotos:async(uid,n)=>{
  const list=await h.deps.listPhotos(uid,n);
  if(n===1&&list.length===0){h.put(uid,jpeg('late-phantom'));return h.raw.listPhotos(uid,n);}return list;
 }};
 await assert.rejects(createAccountDeletionCoordinator({enabled:true,...deps}).deleteAccount(h.request()),/Private photos remain/);
 noCompletion(h);assert.ok(h.backups.has(A)&&h.users.has(A));
});

test('issue196: deleting B preserves all A bytes, account records and full-scene references',async()=>{
 const h=fixture(),before=h.fingerprint(A),receipt=await h.run(B);
 assert.equal(receipt.deletedPhotoObjects,5);assert.equal(h.fingerprint(A),before);
 assert.equal(h.names(B).length,0);assert.equal(h.backups.has(B),false);assert.equal(h.users.has(B),false);
});

test('issue196: presence-only recovery snapshot cannot prove a stable byte inventory; packet never grants deletion',async()=>{
 const h=fixture();Object.assign(h.fault,{stage:'claimCleanup',when:'after'});await assert.rejects(h.run(),/interruption/);h.fault.stage=null;
 const before=h.names(A).length,now=1792720000000;
 await assert.rejects(createDeletionRecoveryHandoff({enabled:true,
  authorizeIncident:async()=>true,assess:()=>h.assess(),serverNow:async()=>now,
  readPhotoInventory:async()=>{
   const names=h.names(A);
   return {ownerScoped:true,filenamesEnumerated:true,photoBytesVerified:false,
    count:names.length,pages:Math.ceil((names.length+1)/100),
    digest:digest(Buffer.from(JSON.stringify({owner:A,names})))};
  },
  verifyWorkerFenced:async()=>({quiescent:true,fenceEnforced:true,fenceEpoch:'FENCE-SYNTHETIC196',verifiedAtMs:now}),
  verifyApproval:async({role})=>{
   if(role==='security_reviewer')h.put(A,jpeg('presence-unchanged-new-byte-inventory'));
   return {verified:true,role,boundToOwnerIncidentAndSnapshot:true,readOnlyReviewOnly:true,principalId:role==='incident_owner'?'reviewer_one':'reviewer_two',verifiedAtMs:now};
  }
 }).prepare({uid:A,incidentTicket:INCIDENT,operatorContext:{syntheticReviewer:true},incidentApprovalProof:'synthetic-review-proof-one',securityApprovalProof:'synthetic-review-proof-two'}),/inventory changed during review/);
 assert.equal(h.names(A).length,before+1);
 // The changed object set must now STOP review rather than issue a misleading
 // diagnostic packet. Still no executor, no claim release, and no deletion.
 // Negative control: a lying fence adapter can hide mutation behind the same
 // presence booleans. This is an acknowledged executor/inventory GAP, not a
 // successful recovery test or a claim actual fencing is implemented.
 noCompletion(h);
});

test('issue196: source fixture pins review baseline and contains no real retention or hosted completion claim',()=>{
 assert.match(baseline,/^[a-f0-9]{40}$/);
 const source=readFileSync('tests/helpers/issue196-deletion-fixture.mjs','utf8');
 assert.doesNotMatch(source,/process\.env|https?:\/\/|fetch\s*\(|createClient\s*\(/);
 assert.match(readFileSync('supabase/functions/account-delete/index.ts','utf8'),/status:503/);
});
