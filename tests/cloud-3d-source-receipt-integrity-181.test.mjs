import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createCloudToNative3D180}
 from '../research/cloud-to-native-3d-180/owner-restore-3d-barrier.mjs';

// P181 independently reproduces the exact source receipt shape produced by
// P550 NATIVE91/NATIVE92, rather than a generic "attested" success bit.
const sha='a'.repeat(64);
const loc={protocol:'http:',hostname:'127.0.0.1',
 search:'?ownerReview145=research&ownerReview146=research&ownerCutout178=research&nativeLossless04=research&native3D05=research&cloud3D180=research'};
function setup(mode='pass'){
 const owner=randomUUID(),foreign=randomUUID();
 const saved=[{id:'saved-1',slots:{top:'shirt-1'}}];
 let generation=1,revision=1,reads=0,loads=0,hashes=0;
 const receipt=ids=>({ownerId:owner,sources:ids.map(id=>({id,sha256:sha}))});
 const board={
  status:()=>({active:true,dirty:false,selected:0,savedCount:saved.length}),
  readOnlySnapshot:()=>({saved:structuredClone(saved)}),
  readOnlyWardrobeRevision93:()=>({ownerId:owner,generation,revision}),
  readOnlyGarmentSources91(ids){
   reads++;
   if(mode==='missing-photo')throw Error('NATIVE91_MISSING_OR_CHANGED_ORIGINAL_SOURCE');
   if(mode==='read-error')throw Error('NATIVE91_OWNER_CHANGED');
   if(mode==='bad-source-owner')return {...receipt(ids),ownerId:foreign};
   if(mode==='changed-after-hash'&&reads>=2)return {ownerId:owner,sources:ids.map(id=>({id,sha256:'b'.repeat(64)}))};
   return receipt(ids);
  },
  async attestOriginalPhotoBytes92(ids){
   hashes++;
   if(mode==='revision-race')revision++;
   if(mode==='session-race')generation++;
   if(mode==='saved-race')saved[0].slots.top='different-after-crypto';
   if(mode==='void-receipt')return undefined;
   if(mode==='wrong-owner')return {...receipt(ids),ownerId:foreign};
   if(mode==='wrong-sha')return {ownerId:owner,sources:ids.map(id=>({id,sha256:'b'.repeat(64)}))};
   if(mode==='wrong-order')return {ownerId:owner,sources:ids.map(id=>({id:'foreign',sha256:sha}))};
   return receipt(ids);
  },
  async load({discard}={}){assert.equal(discard,false);loads++;return {loaded:true};}
 };
 const auth={user:{id:owner},getAccessToken:async()=>owner,assertCurrent(){}};
 const viewer={state:()=>({active:false,modelReady:false}),close(){}};
 const win={addEventListener(){},removeEventListener(){}};
 const db={name:'closet-current-user-'+owner};
 const gate=createCloudToNative3D180({auth,db,board,viewer,win,loc});
 return {owner,saved,board,gate,auth,db,viewer,win,
  stats:()=>({loads,hashes,reads})};
}
async function restored(x){
 const lease=x.gate.begin();
 try{
  assert.equal(await x.gate.consent(lease,async()=>true),true);
  return await x.gate.afterAtomicRestore(lease);
 }finally{x.gate.finish(lease);x.gate.dispose();}
}
test('P181 genuine matching NATIVE91/NATIVE92 original JPEG receipt is counted exactly once',async()=>{
 const x=setup();
 const out=await restored(x);
 assert.equal(out.restored,true);
 assert.equal(out.verifiedSourceReceiptsOnly,true);
 assert.equal(out.privateSourceIntegrity,true);
 assert.equal(out.originalJPEGsAttested,1);
 assert.equal(out.photoFallbackOutfits,0);
 assert.equal(x.stats().loads,1);
 assert.equal(x.stats().hashes,1);
});
test('P181 false, void, wrong owner, wrong source SHA and wrong garment identity never count as valid JPEG bytes',async()=>{
 for(const mode of ['void-receipt','wrong-owner','wrong-sha','wrong-order']){
  const x=setup(mode);
  await assert.rejects(restored(x),/P180 NATIVE92/,mode);
  assert.equal(x.gate.state().restores,0,mode);
  assert.equal(x.gate.state().originalJPEGsAttested,0,mode);
 }
});
test('P181 NATIVE91 wrong owner or unexpected errors fail closed, not a false 2D-only integrity pass',async()=>{
 for(const mode of ['bad-source-owner','read-error']){
  const x=setup(mode);
  await assert.rejects(restored(x),/NATIVE91/,mode);
  assert.equal(x.gate.state().restores,0,mode);
 }
});
test('P181 missing legacy original remains honest 2D fallback, never a JPEG attestation or arbitrary 3D pass',async()=>{
 const x=setup('missing-photo');
 const r=await restored(x);
 assert.equal(r.restored,true);
 assert.equal(r.privateSourceIntegrity,false);
 assert.equal(r.photoFallbackOutfits,1);
 assert.equal(r.originalJPEGsAttested,0);
 assert.equal(x.stats().hashes,0);
});
test('P181 rejects changed post-restore generation, revision, saved slots or receipt during asynchronous SHA',async()=>{
 for(const mode of ['revision-race','session-race','saved-race','changed-after-hash']){
  const x=setup(mode);
  await assert.rejects(restored(x),/P180/,mode);
  assert.equal(x.gate.state().restores,0,mode);
 }
});
test('P181 fails closed if underlying native source and revision APIs are absent',()=>{
 const x=setup();x.gate.dispose();
 for(const missing of ['readOnlyGarmentSources91','readOnlyWardrobeRevision93']){
  const board={...x.board};delete board[missing];
  assert.throws(()=>createCloudToNative3D180({
   auth:x.auth,db:x.db,board,viewer:x.viewer,win:x.win,loc
  }),/P180/,missing);
 }
});
test('P181 changes no shipping app and retains exact P180 opt-in and Family Alpha HOLD',()=>{
 const s=readFileSync('research/cloud-to-native-3d-180/owner-restore-3d-barrier.mjs','utf8');
 assert.ok(s.includes("['ownerReview145','ownerReview146','ownerCutout178','nativeLossless04'"));
 assert.ok(s.includes('privateSourceIntegrity:photoFallbackOutfits===0'));
 assert.ok(s.includes('JSON.stringify(verified)!==JSON.stringify(expected)'));
 assert.ok(s.includes('readOnlyWardrobeRevision93'));
});
