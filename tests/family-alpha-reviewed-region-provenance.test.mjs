import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {prepareReviewedPhotoPresentation} from '../research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs';
import {fingerprintAlphaReviewContext} from '../public/family-alpha-2d-saved-board.mjs';

const owner='a1111111-1111-4111-8111-111111111111';
const jpeg=(seed)=>{
 const bytes=Uint8Array.from({length:160},(_,i)=>seed+i%17);
 bytes[0]=0xff;bytes[1]=0xd8;bytes.at(-2);bytes[bytes.length-2]=0xff;bytes[bytes.length-1]=0xd9;
 return 'data:image/jpeg;base64,'+Buffer.from(bytes).toString('base64');
};
const item=()=>({
 id:'synthetic-layered-top',category:'Tops',itemType:'T-shirt',color:'Blue',
 outfitSourceId:'outfit-synthetic-1',image:jpeg(17),
 originalPhoto:{image:jpeg(19)},
 recognitionPhoto:{image:jpeg(23)},
 segmentHint:{categories:['Tops'],types:['T-shirt'],clipped:false}
});
const frame=()=>({width:32,height:32,data:new Uint8ClampedArray(32*32*4)});
async function probeChange(change){
 const clothing=item(),firstContext=await fingerprintAlphaReviewContext(clothing,webcrypto);
 let reviews=0,decodeCalls=0;
 const result=await prepareReviewedPhotoPresentation({
  item:clothing,ownerId:owner,
  getScope:()=>({ownerId:owner,epoch:1}),
  getItem:()=>clothing,isCurrent:()=>true,cryptoProvider:webcrypto,
  decodeOriginal:async()=>{
   decodeCalls++;change(clothing);
   return frame();
  },
  reviewPreview:async()=>{reviews++;return true;}
 });
 return {clothing,firstContext,decodeCalls,reviews,result};
}
test('retained full outfit remains identical, but swapped garment-recognition JPEG aborts avatar approval',async()=>{
 const original=item().originalPhoto.image;
 const {result,reviews,decodeCalls,clothing,firstContext}=await probeChange(x=>{
  x.recognitionPhoto.image=jpeg(29);
 });
 assert.equal(decodeCalls,1);
 assert.equal(reviews,0,'mutated original garment source must never reach the approval button');
 assert.equal(result.status,'reject');
 assert.equal(result.reason,'account-or-photo-changed');
 assert.equal(clothing.originalPhoto.image,original);
 assert.notEqual(await fingerprintAlphaReviewContext(clothing,webcrypto),firstContext);
});
test('changing skirt/shorts region hint during async source decode revokes approval',async()=>{
 const {result,reviews}=await probeChange(x=>{
  x.segmentHint={categories:['Bottoms'],types:['Skirt'],clipped:false};
 });
 assert.equal(reviews,0);
 assert.equal(result.status,'reject');
 assert.equal(result.presentation,null);
});
test('changing recorded garment category/type after recognition but before approval fails closed',async()=>{
 const {result,reviews}=await probeChange(x=>{x.category='Bottoms';x.itemType='Shorts';});
 assert.equal(reviews,0);
 assert.equal(result.status,'reject');
});
test('changing the displayed JPEG without changing original scene or recognizer JPEG fails closed',async()=>{
 const {result,reviews}=await probeChange(x=>{x.image=jpeg(37);});
 assert.equal(reviews,0);
 assert.equal(result.status,'reject');
});
test('a legitimate unchanged original/region during decode is not rejected as a stale record',async()=>{
 const {result,decodeCalls}=await probeChange(()=>{});
 assert.equal(decodeCalls,1);
 assert.notEqual(result.reason,'account-or-photo-changed');
});
