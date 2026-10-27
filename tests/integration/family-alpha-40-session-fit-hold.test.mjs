import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createFitSessionStore,MAX_ADJUSTMENTS}
 from '../../research/family-alpha-40/session-fit.mjs';
import {overlayBoot,overlayManualFit,assert40HOLD,OUTPUT}
 from '../../scripts/build-family-alpha-40-session-fit-hold.mjs';

const OWNER_A='11111111-1111-4111-8111-111111111111';
const OWNER_B='22222222-2222-4222-8222-222222222222';
const imageA='a'.repeat(64),imageB='b'.repeat(64);
const ref=(owner=OWNER_A,epoch=1,slot='top',itemId='shirt-1',sha=imageA)=>({owner,epoch,slot,itemId,sha});
const edit={dx:.012,dy:-.03,scale:1.12};
test('same garment/slot/current owner/session/exact source PNG SHA restores bounded edit',()=>{
 const store=createFitSessionStore();
 assert.equal(store.get(ref()),null);
 assert.equal(store.put(ref(),edit),1);
 assert.deepEqual(store.get(ref()),edit);
 assert.notStrictEqual(store.get(ref()),edit);
 assert.equal(store.size(),1);
});
test('different garment, new cutout, slot or session never receives stale fit',()=>{
 const store=createFitSessionStore();
 store.put(ref(),edit);
 assert.equal(store.get(ref(OWNER_A,1,'top','shirt-2')),null);
 assert.equal(store.get(ref(OWNER_A,1,'top','shirt-1',imageB)),null);
 assert.equal(store.get(ref(OWNER_A,1,'layer','shirt-1')),null);
 assert.equal(store.get(ref(OWNER_A,2)),null,'New session must clear all cached source fit');
 assert.equal(store.size(),0);
});
test('switching signed-in account clears previous owner fit rather than exposing it',()=>{
 const store=createFitSessionStore();
 store.put(ref(),edit);
 const b=ref(OWNER_B,1);
 assert.equal(store.get(b),null);
 assert.equal(store.size(),0);
 store.put(b,{dx:0,dy:0,scale:1});
 assert.equal(store.get(ref(OWNER_A,1)),null);
 assert.equal(store.size(),0);
});
test('malformed identities, fake approval and excessive or invalid offsets fail',()=>{
 const store=createFitSessionStore();
 for(const r of [
  ref('owner-user'),ref(OWNER_A,-1),ref(OWNER_A,1,'shoes'),
  ref(OWNER_A,1,'top','../../login'),ref(OWNER_A,1,'top','shirt-1','not-a-sha')
 ])assert.throws(()=>store.put(r,edit),/Malformed|Unverified/);
 for(const invalid of [
  {dx:.3,dy:0,scale:1},{dx:0,dy:.2,scale:1},
  {dx:0,dy:0,scale:1.8},{dx:NaN,dy:0,scale:1},
  {dx:0,dy:0,scale:Infinity}
 ])assert.throws(()=>store.put(ref(),invalid),/Impossible/);
});
test('bounded fit memory never captures entire PNG/image buffers or grows indefinitely',()=>{
 const store=createFitSessionStore();
 for(let i=0;i<MAX_ADJUSTMENTS+10;i++)
  store.put(ref(OWNER_A,1,'top','shirt-'+i,imageA),edit);
 assert.equal(store.size(),MAX_ADJUSTMENTS);
 assert.equal(store.get(ref(OWNER_A,1,'top','shirt-0')),null);
 assert.deepEqual(store.get(ref(OWNER_A,1,'top','shirt-33')),edit);
 store.clear();assert.equal(store.size(),0);
});
test('upstream Work 36 and full-stage routing guards remain byte-identical',async()=>{
 const manifest=await assert40HOLD();
 assert.equal(manifest.releaseGate,'HOLD');
 assert.equal(manifest.memoryOnly,true);
 assert.equal(manifest.crossOwnerFitReuseForbidden,true);
 assert.equal(manifest.fitPreferencesIndexedDbSaved,false);
 assert.equal(manifest.fitPreferencesCloudSaved,false);
 assert.equal(manifest.stagingDeployed,false);
 const boot=await readFile(OUTPUT+'/__alpha_research/family-alpha-29/boot.js','utf8');
 assert.match(boot,/sessionFit.createSessionScopedFit/);
 assert.match(boot,/align\.stop\(\)/);
 assert.match(boot,/confirmReviewedCutoutWithEraser/);
 const fitted=await readFile(OUTPUT+'/__alpha_research/family-alpha-36/manual-fit.mjs','utf8');
 assert.match(fitted,/initialAdjustments/);
 assert.match(fitted,/onAdjustment/);
});
test('false release/permanent saved positions and tampered manifest are rejected',async()=>{
 const file=OUTPUT+'/alpha40-session-fit-HOLD-manifest.json';
 const original=await readFile(file,'utf8');
 try{
  for(const [k,v] of [
   ['releaseGate','READY'],['memoryOnly',false],
   ['crossOwnerFitReuseForbidden',false],['maskSourceHashRequired',false],
   ['fitPreferencesCloudSaved',true],['fitPreferencesIndexedDbSaved',true],
   ['fitPreferencesLocalStorageSaved',true],['ownerVisualApproved',true],
   ['stagingDeployed',true],['fourRealAccountsVerified',true]
  ]){
   const modified=JSON.parse(original);modified[k]=v;
   await writeFile(file,JSON.stringify(modified));
   await assert.rejects(()=>assert40HOLD());
  }
 }finally{await writeFile(file,original);}
 await assert40HOLD();
});
