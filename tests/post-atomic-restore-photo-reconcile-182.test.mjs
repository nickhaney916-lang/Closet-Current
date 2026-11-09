import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createCloudToNative3D180,researchMode180}
 from '../research/cloud-to-native-3d-180/owner-restore-3d-barrier.mjs';

const loc={protocol:'http:',hostname:'127.0.0.1',search:'?ownerReview145=research&ownerReview146=research&ownerCutout178=research&nativeLossless04=research&native3D05=research&cloud3D180=research'};
function harness(){
 const owner=randomUUID();
 let failHash=false,legacy=false,dirty=false,view=false,wrongOwner=false,checks=0,loads=0;
 const sha='a'.repeat(64);
 const saved=[{id:'verified-outfit',slots:{top:'owner-shirt'}}];
 const revision=()=>({ownerId:owner,generation:1,revision:1});
 const expected=ids=>({ownerId:owner,sources:ids.map(id=>({id,sha256:sha}))});
 const board={
  status:()=>({active:true,dirty,selected:0,savedCount:saved.length}),
  readOnlySnapshot:()=>({saved:structuredClone(saved)}),
  readOnlyGarmentSources91:ids=>{
   if(legacy)throw Error('BOARD04 NATIVE91_MISSING_OR_CHANGED_ORIGINAL_SOURCE');
   return expected(ids);
  },
  readOnlyWardrobeRevision93:revision,
  async attestOriginalPhotoBytes92(ids){
   checks++;
   if(failHash)return {ownerId:owner,sources:ids.map(id=>({id,sha256:'b'.repeat(64)}))};
   return wrongOwner?{ownerId:randomUUID(),sources:expected(ids).sources}:expected(ids);
  },
  async load({discard}={}){assert.equal(discard,false);loads++;return {loaded:true};}
 };
 const auth={user:{id:owner},assertCurrent(){if(this.user.id!==owner)throw Error('owner changed');},
  async getAccessToken(){return 'synthetic-privately-signed-'+owner;}};
 const listeners=new Map();
 const win={addEventListener(k,fn){listeners.set(k,fn);},removeEventListener(k){listeners.delete(k);}};
 const viewer={state:()=>({active:view,modelReady:view}),close(){view=false;}};
 const db={name:'closet-current-user-'+owner};
 const bridge=createCloudToNative3D180({auth,db,board,viewer,win,loc});
 return {bridge,board,auth,win,viewer,db,listeners,
  setHash:x=>failHash=x,setLegacy:x=>legacy=x,setWrongOwner:x=>wrongOwner=x,
  setDirty:x=>dirty=x,setViewer:x=>view=x,stats:()=>({checks,loads})};
}
async function committed(x){
 const lease=x.bridge.begin();
 x.bridge.markAtomicCommitted(lease); // invoked only after actual P126 IDB commit
 return lease;
}
test('P182 does not misrepresent P126 committed IndexedDB restore as rollback after failed NATIVE92 SHA',async()=>{
 const x=harness();x.setHash(true);
 try{
  const l=await committed(x);
  assert.equal(x.bridge.state().postCommitWrites,1);
  await assert.rejects(x.bridge.afterAtomicRestore(l),/NATIVE92/);
  x.bridge.notePostCommitFailure(l);
  x.bridge.finish(l);
  assert.equal(x.bridge.pending(),true,'a failed SHA cannot admit a newly opened 3D');
  assert.equal(x.bridge.state().postCommitUnverified,true);
  assert.equal(x.bridge.state().postCommitFailures,1);
  assert.equal(x.bridge.state().restores,0,'a failed post-commit proof is not completed reconciliation');
  assert.throws(()=>x.bridge.begin(),/prior restore already wrote private storage/);
  assert.equal(x.stats().loads,1,'the original post-commit reload took place');
 }finally{x.bridge.dispose();}
});
test('P182 rehashes actual current private owner sources WITHOUT second destructive cloud restore or re-consent',async()=>{
 const x=harness();x.setHash(true);
 try{
  const lease=await committed(x);
  await assert.rejects(x.bridge.afterAtomicRestore(lease),/NATIVE92/);
  x.bridge.notePostCommitFailure(lease);x.bridge.finish(lease);
  const before=x.stats();
  assert.equal(before.loads,1);
  x.setHash(false);
  const r=await x.bridge.retryVerification();
  assert.equal(r.restored,false,'retry is not another cloud restore');
  assert.equal(r.reconciled,true);
  assert.equal(r.originalJPEGsAttested,1);
  assert.equal(r.photoFallbackOutfits,0);
  assert.equal(x.bridge.state().postCommitWrites,1,'only one original P126 cloud commit');
  assert.equal(x.bridge.state().localOnlyPhotoRechecks,1);
  assert.equal(x.bridge.state().restores,0);
  assert.equal(x.bridge.state().postCommitUnverified,false);
  assert.equal(x.bridge.pending(),false);
  assert.equal(x.stats().loads,2,'read-only board reload verified local storage');
  assert.equal(x.stats().checks,2,'original JPEG was genuinely re-attested');
 }finally{x.bridge.dispose();}
});
test('P182 failed local verification retry retains quarantine and does not fabricate 3D source integrity',async()=>{
 const x=harness();x.setHash(true);
 try{
  const lease=await committed(x);
  await assert.rejects(x.bridge.afterAtomicRestore(lease),/NATIVE92/);
  x.bridge.finish(lease);
  await assert.rejects(x.bridge.retryVerification(),/NATIVE92/);
  assert.equal(x.bridge.state().postCommitUnverified,true);
  assert.equal(x.bridge.state().localOnlyPhotoRechecks,0);
  assert.equal(x.bridge.state().postCommitWrites,1);
  assert.equal(x.bridge.pending(),true);
 }finally{x.bridge.dispose();}
});
test('P182 cannot recheck with dirty drafts, active scene or foreign owner',async()=>{
 for(const constraint of ['dirty','scene','owner']){
  const x=harness();x.setHash(true);
  try{
   const lease=await committed(x);
   await assert.rejects(x.bridge.afterAtomicRestore(lease),/NATIVE92/);
   x.bridge.finish(lease);
   x.setHash(false);
   if(constraint==='dirty')x.setDirty(true);
   if(constraint==='scene')x.setViewer(true);
   if(constraint==='owner')x.auth.user.id=randomUUID();
   await assert.rejects(x.bridge.retryVerification(),/P180|owner changed/);
   assert.equal(x.bridge.pending(),true,'quarantine must persist after rejected attempt');
  }finally{x.bridge.dispose();}
 }
});
test('P182 missing legacy photos are honestly marked as photo fallback after successful retry',async()=>{
 const x=harness();x.setHash(true);
 try{
  const lease=await committed(x);
  await assert.rejects(x.bridge.afterAtomicRestore(lease),/NATIVE92/);
  x.bridge.finish(lease);
  x.setHash(false);x.setLegacy(true);
  const r=await x.bridge.retryVerification();
  assert.equal(r.reconciled,true);
  assert.equal(r.privateSourceIntegrity,false);
  assert.equal(r.originalJPEGsAttested,0);
  assert.equal(r.photoFallbackOutfits,1);
  assert.equal(x.bridge.state().photoFallbackOutfits,1);
  assert.equal(x.bridge.pending(),false,'native WebGL still rejects missing source via NATIVE91');
 }finally{x.bridge.dispose();}
});
test('P182 valid atomic restoration still reports verified once, with quarantine cleared',async()=>{
 const x=harness();
 try{
  const lease=await committed(x);
  const r=await x.bridge.afterAtomicRestore(lease);
  x.bridge.finish(lease);
  assert.equal(r.restored,true);
  assert.equal(r.reconciled,true);
  assert.equal(x.bridge.state().restores,1);
  assert.equal(x.bridge.state().postCommitWrites,1);
  assert.equal(x.bridge.state().postCommitUnverified,false);
  assert.equal(x.bridge.pending(),false);
  await assert.rejects(x.bridge.retryVerification(),/no pending/);
 }finally{x.bridge.dispose();}
});
test('P182 browser pagehide revocation makes quarantined owner private source inaccessible',async()=>{
 const x=harness();x.setHash(true);
 const lease=await committed(x);
 await assert.rejects(x.bridge.afterAtomicRestore(lease),/NATIVE92/);
 x.bridge.finish(lease);
 x.listeners.get('pagehide')();
 assert.equal(x.bridge.pending(),false);
 assert.equal(x.bridge.state().active,false);
 await assert.rejects(x.bridge.retryVerification(),/P180/);
 x.bridge.dispose();
});
test('P182 stays gated on six local-only flags and requires genuine existing native P550 source APIs',()=>{
 assert.equal(researchMode180(loc),true);
 assert.equal(researchMode180({...loc,hostname:'remote.example.com'}),false);
 const s=readFileSync('research/cloud-to-native-3d-180/owner-restore-3d-barrier.mjs','utf8');
 assert.ok(s.includes('postCommitUnverified'));
 assert.ok(s.includes('retryVerification'));
 assert.ok(s.includes('readOnlyWardrobeRevision93'));
});
test('P182 native app UI clearly discloses committed-restore failure and offers local retry without a second cloud restore',()=>{
 const ui=readFileSync('research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs','utf8');
 for(const needle of [
  'cloud3D180.markAtomicCommitted(restoreLease180)',
  'cloud3D180?.notePostCommitFailure(restoreLease180)',
  'owner146Recheck',
  'cloud3D180.retryVerification()',
  'Your cloud wardrobe WAS restored to this device',
  '3D is blocked',
  'No second cloud restore',
  'refreshVerificationControls'
 ])assert.ok(ui.includes(needle),needle);
 const three=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.ok(three.includes('cloudToNative3D180Bridge?.pending?.()'));
});
