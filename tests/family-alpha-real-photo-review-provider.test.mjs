import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {prepareReviewedPhotoPresentation}
 from '../research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs';
import {syntheticGarment} from '../research/family-alpha-13/synthetic-garments.mjs';
const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222';
function jpeg(seed=12){const bytes=Buffer.alloc(130,seed);bytes[0]=255;bytes[1]=216;bytes[128]=255;bytes[129]=217;return 'data:image/jpeg;base64,'+bytes.toString('base64');}
function setup({type='Tops',busy=false,approve=true,review=true}={}){
 const scene=syntheticGarment(type,{background:busy?'busy':'plain'});
 const item={id:'my-shirt',name:'Personal synthetic shirt',category:type,image:jpeg(43),
  originalPhoto:{image:jpeg(22)},outfitSourceId:'synthetic-session-4'};
 const state={ownerId:A,epoch:1,current:item,decodeCalls:0,reviewCalls:0,imageCalls:0};
 const config={
  item,ownerId:A,getScope:()=>({ownerId:state.ownerId,epoch:state.epoch}),getItem:()=>state.current,
  cryptoProvider:webcrypto,decodeOriginal:async source=>{
   assert.equal(source,state.current.originalPhoto.image);
   state.decodeCalls++;return scene.frame;
  },makeTransparentImage:async prep=>{
   state.imageCalls++;return {naturalWidth:prep.width,naturalHeight:prep.height,complete:true,pixels:prep.rgba};
  },...(review?{reviewPreview:async v=>{
    state.reviewCalls++;assert.equal(v.itemId,item.id);assert.equal(v.ownerId,A);
    assert.equal(v.originalImage,item.originalPhoto.image);
    assert.equal(v.verifiedOriginalPixels,true);
    assert.equal(v.segmentationGroundTruthUnavailable,true);
    return approve;
   }}:{})
 };
 return {item,state,config};
}
test('actual retained original is processed and re-decoded for independent color audit before explicit approval',async()=>{
 const f=setup(),result=await prepareReviewedPhotoPresentation(f.config);
 assert.equal(result.status,'approved-for-staging-preview');
 assert.equal(result.presentation.sourceMaskGroundTruthUnverified,true);
 assert.equal(result.presentation.humanPreviewConfirmed,true);
 assert.equal(result.presentation.sourcePixelAuditPassed,true);
 assert.equal(result.presentation.stagingPreviewOnly,true);
 assert.equal(result.presentation.ownerId,A);
 assert.equal(result.originalPhotoPreserved,true);
 assert.equal(f.state.reviewCalls,1);assert.equal(f.state.decodeCalls,2);
 assert.equal(f.state.imageCalls,1);
 assert.ok(result.presentation.sourceVersion.startsWith('sha256:'));
});
test('no review callback means photo can never silently become an approved avatar image',async()=>{
 const f=setup({review:false});
 const result=await prepareReviewedPhotoPresentation(f.config);
 assert.equal(result.status,'review');
 assert.equal(result.reason,'explicit-preview-confirmation-required');
 assert.equal(result.presentation,null);assert.equal(f.state.imageCalls,0);
});
test('explicit user rejection never returns a garment to the renderer',async()=>{
 const f=setup({approve:false});
 const r=await prepareReviewedPhotoPresentation(f.config);
 assert.equal(r.status,'review');assert.equal(r.reason,'preview-not-approved');
 assert.equal(r.presentation,null);
});
test('ambiguous busy background fails before creating a transparent reviewable image',async()=>{
 const f=setup({busy:true});
 const r=await prepareReviewedPhotoPresentation(f.config);
 assert.equal(r.status,'review');assert.match(r.reason,/busy|ambiguous/);
 assert.equal(f.state.imageCalls,0);assert.equal(f.state.reviewCalls,0);
});
test('unsafe or missing actual retained JPEG cannot bypass the original-photo check',async()=>{
 const f=setup();f.state.current=f.config.item={...f.item,originalPhoto:{image:'not-jpeg'}};
 const r=await prepareReviewedPhotoPresentation(f.config);
 assert.equal(r.status,'reject');assert.equal(r.presentation,null);
 assert.equal(f.state.reviewCalls,0);
});
test('cross-account mismatch blocks before photo decoding or review',async()=>{
 const f=setup();f.state.ownerId=B;
 const r=await prepareReviewedPhotoPresentation(f.config);
 assert.equal(r.status,'reject');assert.match(r.reason,/account/);
 assert.equal(f.state.decodeCalls,0);assert.equal(f.state.reviewCalls,0);
});
test('retained original changes during independently decoded JPEG handling',async()=>{
 const f=setup(),originalDecoder=f.config.decodeOriginal;
 f.config.decodeOriginal=async src=>{
  const decoded=await originalDecoder(src);
  f.state.current={...f.state.current,originalPhoto:{image:jpeg(78)}};
  return decoded;
 };
 const result=await prepareReviewedPhotoPresentation(f.config);
 assert.equal(result.status,'reject');assert.equal(result.presentation,null);
 assert.equal(f.state.reviewCalls,0);
});
test('crop changes while review is open invalidate the original photo approval',async()=>{
 const f=setup();f.config.reviewPreview=async()=>{
  f.state.current={...f.state.current,image:jpeg(72)};
  return true;
 };
 const result=await prepareReviewedPhotoPresentation(f.config);
 assert.equal(result.status,'reject');assert.equal(result.presentation,null);
});
test('logout while user is inspecting mask cannot commit any old garment pixels',async()=>{
 const f=setup();f.config.reviewPreview=async()=>{f.state.epoch++;f.state.ownerId=B;return true;};
 const result=await prepareReviewedPhotoPresentation(f.config);
 assert.equal(result.status,'reject');assert.match(result.reason,/account/);
 assert.equal(result.presentation,null);
});
test('independent decoder with altered RGB cannot be passed as correct original source',async()=>{
 const f=setup(),originalDecoder=f.config.decodeOriginal;let call=0;
 f.config.decodeOriginal=async src=>{
  const frame=await originalDecoder(src);
  if(++call===2){
   const data=frame.data.slice();
   for(let i=0;i<data.length;i+=4)data[i]=255-data[i];
   return {...frame,data};
  }
  return frame;
 };
 const result=await prepareReviewedPhotoPresentation(f.config);
 assert.equal(result.status,'reject');assert.equal(result.reason,'pixels-do-not-match-retained-original');
 assert.equal(f.state.reviewCalls,0);
});
test('dresses use dress category but require the same JPEG/source/pixel review guard',async()=>{
 const f=setup({type:'Dresses'});
 const r=await prepareReviewedPhotoPresentation(f.config);
 assert.equal(r.status,'approved-for-staging-preview');
 assert.equal(r.presentation.itemId,f.item.id);
});
test('explicit supersession immediately denies processing without handing an image to a reviewer',async()=>{
 const f=setup(),originalDecoder=f.config.decodeOriginal;let active=true;
 f.config.isCurrent=()=>active;
 f.config.decodeOriginal=async jpeg=>{
  const frame=await originalDecoder(jpeg);active=false;return frame;
 };
 const r=await prepareReviewedPhotoPresentation(f.config);
 assert.equal(r.status,'reject');assert.equal(r.presentation,null);assert.equal(f.state.reviewCalls,0);
});
