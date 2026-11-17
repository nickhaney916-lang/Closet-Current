/**
 * M190 — A tombstoned/revoked original must not be a live duplicate of the
 * replacement saved garment. Actual native owner index used by P99 preflight.
 * Public licensed JPEG; synthetic signed owner; no hosted account or write.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {
 buildOwnerWardrobeIndex,queryOwnerWardrobeIndex,
 previewOwnerWardrobeAddition
} from '../public/native-owner-wardrobe-index-167.mjs';
import {preflightOwnedOutfit1054} from '../public/native-outfit-source-plan-p99.mjs';

const OWNER='m190-fake-owner';
const jpeg=readFileSync('benchmark/fixtures/commons-0053.jpg');
const sha=createHash('sha256').update(jpeg).digest('hex');
const image='data:image/jpeg;base64,'+jpeg.toString('base64');
const valid=(id='current-top',extra={})=>({
 id,ownerId:OWNER,category:'Tops',itemType:'T-shirt',color:'Black',
 ownerReviewed:true,userAdjusted:true,sourcePhotoOriginal:true,
 sourceHashVerified:true,singleGarmentVerified:true,
 sourceSHA256:sha,originalPhoto:{sha256:sha,image},
 ...extra
});
const ix=items=>buildOwnerWardrobeIndex(OWNER,items);
const old=(flag)=>valid('old-top',{[flag]:true});
function lease(){
 const authRef={user:{id:OWNER},assertCurrent(){}};
 const privateDbRef={name:'closet-current-user-'+OWNER};
 return ()=>({authenticated:true,ownerId:OWNER,
  epoch:'m190-owner-active-lease',operationEpoch:32,
  authRef,privateDbRef,privateDbName:privateDbRef.name});
}
function nativeNormalizer(){
 const runtime={URL,encodeURIComponent};
 vm.createContext(runtime);
 vm.runInContext(readFileSync('public/outfit-board-engine.js','utf8'),runtime);
 return (board,rows)=>runtime.cleanOutfitBoard(board,rows);
}
test('M190 baseline uses real licensed original JPEG bytes and verified SHA',()=>{
 assert.equal(jpeg[0],255);assert.equal(jpeg[1],216);
 assert.equal(jpeg.at(-2),255);assert.equal(jpeg.at(-1),217);
 assert.equal(sha.length,64);
});
for(const flag of ['deleted','sourceRevoked']){
 test('M190 '+flag+' archived source does not falsely collide with current owner original',()=>{
  const index=ix([old(flag),valid()]);
  assert.equal(index.summary.sourcePairs.length,0);
  assert.deepEqual(queryOwnerWardrobeIndex(index,OWNER,{slot:'top'}).ids,['current-top']);
  const retired=index.entries.find(x=>x.id==='old-top');
  assert.deepEqual(retired.slotIds,[]);
  assert.ok(retired.reviewReasons.includes(flag==='deleted'?'deleted-record':'source-revoked'));
  assert.equal(index.summary.ready,1,'revoked row cannot be counted as ready');
 });
 test('M190 '+flag+' allows replacement for retired original but never a retired candidate',()=>{
  const retired=ix([old(flag)]);
  const accepted=previewOwnerWardrobeAddition(retired,OWNER,valid());
  assert.equal(accepted.status,'allow','old revoked garment cannot block legitimate owned replacement');
  const rejected=previewOwnerWardrobeAddition(ix([]),OWNER,old(flag));
  assert.equal(rejected.status,'reject');
  assert.equal(rejected.reason,'retired-or-revoked-candidate');
 });
}
test('M190 genuine still-active verified duplicate is rejected',()=>{
 const a=ix([valid('first-top'),valid('second-top')]);
 assert.equal(a.summary.sourcePairs.length,1);
 assert.equal(a.summary.sourcePairs[0].status,'duplicate');
 const result=previewOwnerWardrobeAddition(ix([valid('first-top')]),OWNER,valid('next-top'));
 assert.equal(result.status,'reject');
 assert.equal(result.reason,'verified-source-and-segment-duplicate');
});
test('M190 shared original with independently verified distinct cutouts remains independent',()=>{
 const a=valid('cut-a',{singleGarmentVerified:false,
  segmentHint:{cutoutSHA256:'b'.repeat(64),originalSHA256:sha,verified:true,ownerReviewedInstance:true}});
 const b=valid('cut-b',{singleGarmentVerified:false,
  segmentHint:{cutoutSHA256:'c'.repeat(64),originalSHA256:sha,verified:true,ownerReviewedInstance:true}});
 assert.equal(ix([a,b]).summary.sourcePairs.length,0);
});
test('M190 actual P99 source preflight accepts the active replacement with retired original in DB',async()=>{
 const records=[old('deleted'),valid()];
 const result=await preflightOwnedOutfit1054({
  getSession:lease(),
  readOwnerItems:async()=>structuredClone(records),
  cleanBoard:nativeNormalizer(),
  board:{slots:{top:'current-top'}}
 });
 assert.equal(result.slots.length,1);
 assert.equal(result.slots[0].itemId,'current-top');
 assert.equal(result.slots[0].sourceSHA256,sha);
 assert.equal(result.renderAuthorized3D,false);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.familyAlpha,'HOLD');
});
test('M190 never promotes a retired original into actual P99 2D source proof',async()=>{
 await assert.rejects(preflightOwnedOutfit1054({
  getSession:lease(),
  readOwnerItems:async()=>[old('sourceRevoked')],
  cleanBoard:nativeNormalizer(),
  board:{slots:{top:'old-top'}}
 }),/MAIN1054/);
});
