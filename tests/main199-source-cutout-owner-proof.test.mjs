/**
 * M199: original JPEG SHA plus different crop hash is not independent
 * instance proof. Test BOTH actual native P99 and opt-in My Closet index.
 * Licensed Commons JPEG and synthetic owner only; no live auth or writes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as native from '../public/native-owner-wardrobe-index-167.mjs';
import * as research from '../research/wardrobe-index-01/owner-wardrobe-index.mjs';
import {preflightOwnedOutfit1054} from '../public/native-outfit-source-plan-p99.mjs';
import vm from 'node:vm';

const owner='main199-synthetic-owner';
const jpeg=readFileSync('benchmark/fixtures/commons-0053.jpg');
const sha=createHash('sha256').update(jpeg).digest('hex');
const image='data:image/jpeg;base64,'+jpeg.toString('base64');
const cropA='b'.repeat(64),cropB='c'.repeat(64);
function garment(id,crop,opts={}){
 return {
  id,ownerId:owner,category:'Tops',itemType:'T-shirt',color:'Black',
  sourceSHA256:sha,sourceHashVerified:true,
  originalPhoto:{sha256:sha,image},
  sourcePhotoOriginal:true,ownerReviewed:true,userAdjusted:true,
  singleGarmentVerified:false,outfitSourceId:'cut-'+id,
  segmentHint:{cutoutSHA256:crop,originalSHA256:sha,
   verified:true,ownerReviewedInstance:true,clipped:false},
  ...opts
 };
}
function lease(){
 const authRef={user:{id:owner},assertCurrent(){}};
 const privateDbRef={name:'closet-current-user-'+owner};
 return ()=>({authenticated:true,ownerId:owner,epoch:'main199-signed-epoch',
  operationEpoch:1,authRef,privateDbRef,privateDbName:privateDbRef.name});
}
function nativeNormalizer(){
 const runtime={URL,encodeURIComponent};
 vm.createContext(runtime);
 vm.runInContext(readFileSync('public/outfit-board-engine.js','utf8'),runtime);
 return (board,items)=>runtime.cleanOutfitBoard(board,items);
}
test('M199 real licensed JPEG digest is byte-exact',()=>{
 assert.equal(jpeg[0],255);assert.equal(jpeg[1],216);
 assert.equal(jpeg.at(-2),255);assert.equal(jpeg.at(-1),217);
 assert.equal(sha.length,64);
});
for(const [name,api] of [['native-P99',native],['opt-in-index',research]]){
 const ix=items=>api.buildOwnerWardrobeIndex(owner,items);
 test(name+' two genuinely verified instance receipts remain distinct and selectable',()=>{
  const a=garment('a',cropA),b=garment('b',cropB);
  const index=ix([a,b]);
  assert.equal(index.summary.sourcePairs.length,0);
  assert.deepEqual(index.entries.map(x=>x.sourceKind),['verified-cutout','verified-cutout']);
  assert.equal(api.previewOwnerWardrobeAddition(ix([a]),owner,b).status,'allow');
  assert.deepEqual(api.queryOwnerWardrobeIndex(index,owner,{slot:'top'}).ids,['a','b']);
 });
 for(const [label,patch] of [
  ['missing crop proof',{segmentHint:{cutoutSHA256:cropB,originalSHA256:sha}}],
  ['unreviewed crop',{segmentHint:{cutoutSHA256:cropB,originalSHA256:sha,verified:true,ownerReviewedInstance:false}}],
  ['unverified crop',{segmentHint:{cutoutSHA256:cropB,originalSHA256:sha,verified:false,ownerReviewedInstance:true}}],
  ['wrong original SHA in crop receipt',{segmentHint:{cutoutSHA256:cropB,originalSHA256:'d'.repeat(64),verified:true,ownerReviewedInstance:true}}],
  ['clipped source',{segmentHint:{cutoutSHA256:cropB,originalSHA256:sha,verified:true,ownerReviewedInstance:true,clipped:true}}],
  ['standalone unproved cutout SHA',{segmentHint:undefined,cutoutSHA256:cropB}],
  ['mismatched crop fields',{cutoutSHA256:cropA}],
  ['malformed cutout SHA',{segmentHint:{cutoutSHA256:'not-sha',originalSHA256:sha,verified:true,ownerReviewedInstance:true},singleGarmentVerified:true}]
 ]){
  test(name+' refuses '+label+' even for distinct source-crop hashes',()=>{
   const a=garment('a',cropA),b=garment('b',cropB,patch);
   const index=ix([a,b]);
   assert.equal(index.entries[1].sourceKind,'ambiguous-source');
   assert.ok(index.entries[1].reviewReasons.includes('shared-source-needs-cutout-proof'));
   assert.equal(index.summary.sourcePairs.length,1);
   assert.equal(index.summary.sourcePairs[0].status,'ambiguous');
   assert.equal(api.previewOwnerWardrobeAddition(ix([a]),owner,b).status,'review');
   assert.equal(api.previewOwnerWardrobeAddition(ix([]),owner,b).status,'review');
  });
 }
 test(name+' unverified or conflicting original digest never receives silent add allowance',()=>{
  for(const b of [
   garment('b',cropB,{sourceHashVerified:false}),
   garment('b',cropB,{originalPhoto:{sha256:'d'.repeat(64),image}})
  ]){
   const row=ix([b]).entries[0];
   assert.equal(row.sourceKind,'unverified');
   assert.equal(row.source,null,'unverified photo bytes are never marked proven');
   assert.deepEqual(api.previewOwnerWardrobeAddition(ix([]),owner,b),
    {status:'review',reason:'original-source-unverified'});
  }
 });
 test(name+' verified single-garment original remains allowed',()=>{
  const single=garment('only',cropA,{singleGarmentVerified:true,segmentHint:undefined});
  const row=ix([single]).entries[0];
  assert.equal(row.sourceKind,'verified-single');
  assert.equal(api.previewOwnerWardrobeAddition(ix([]),owner,single).status,'allow');
 });
}
test('M199 native actual private original-photo outfit preflight refuses unproved cutout',async()=>{
 const b=garment('bad',cropB,{segmentHint:{cutoutSHA256:cropB,originalSHA256:sha}});
 await assert.rejects(preflightOwnedOutfit1054({
  getSession:lease(),readOwnerItems:async()=>[structuredClone(b)],
  cleanBoard:nativeNormalizer(),board:{slots:{top:'bad'}}
 }),/MAIN1054 selected garment lacks confirmed original and review evidence/);
});
test('M199 native actual private original-photo outfit accepts owner-proved cutout',async()=>{
 const a=garment('ok',cropA);
 const result=await preflightOwnedOutfit1054({
  getSession:lease(),readOwnerItems:async()=>[structuredClone(a)],
  cleanBoard:nativeNormalizer(),board:{slots:{top:'ok'}}
 });
 assert.equal(result.slots.length,1);
 assert.equal(result.slots[0].sourceSHA256,sha);
 assert.equal(result.renderAuthorized3D,false);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.familyAlpha,'HOLD');
});
