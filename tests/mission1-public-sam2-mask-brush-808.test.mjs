import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {correctPublicSAM2Overlay808} from '../public/mission1-public-sam2-mask-brush-808.mjs';

const SHA='e7a617cd23a159864f619e8397d48b684e47dddc4ad6b46b14481042019';
const MASK='f8c50688b5932ae8c879b24ea638ade7994b3c1563b501c93d576c7236cb1bf9';
const evidence=()=>({
 schema:'closet-current-m1-public-original-sam2-artifact-806/preview-only/v1',
 modelMaskPNG_SHA256:MASK,sourceSHA256:SHA,
 ownerId:'fixture-owner-A',sourceId:'fixture-public-photo-A',
 previewOnly:true,autoSaveAllowed:false,privatePersisted:false,
 externalUpload:false,maskVerifiedByHuman:false,currentBrowserDidNotRunSAM2:true
});
const box=()=>({
 schema:'closet-current-m1-owner-original-rectangle-800/review-only/v1',
 ownerId:'fixture-owner-A',sourceId:'fixture-public-photo-A',
 sourceSHA256:SHA,sourceWidth:1920,sourceHeight:2880,
 x0:360,y0:426,x1:1589,y1:2530,twoVerifiedOriginalJPEGCornerTaps:true
});
const point=()=>({
 schema:'closet-current-m1-owner-original-point-798/review-only/v1',
 ownerId:'fixture-owner-A',sourceId:'fixture-public-photo-A',
 sourceSHA256:SHA,sourceWidth:1920,sourceHeight:2880,
 pointX:955,pointY:1434,
 sourceBytesSHA256Verified:true,capturedFromOriginalJPEG:true
});
const setup=()=>{
 const width=64,height=96,overlay=new Uint8ClampedArray(width*height*4);
 for(let y=24;y<72;y++)for(let x=20;x<44;x++){
  const i=(y*width+x)*4;
  overlay[i]=25;overlay[i+1]=112;overlay[i+2]=222;overlay[i+3]=122;
 }
 return {state:{
  schema:'closet-current-m1-public-original-sam2-manual-808/transient/v1',
  evidence:evidence(),width,height,overlay,selectedPixels:24*48,
  manualEditCount:0
 },box:box(),point:point(),x:32,y:48};
};
test('P808 source-bound real-model-style mask can be locally erased/added, preserving initial image',()=>{
 const in0=setup(),old=in0.state;
 const erase=correctPublicSAM2Overlay808({...in0,mode:'erase',radius:4});
 assert.ok(erase.selectedPixels<old.selectedPixels);
 assert.equal(old.overlay[(48*64+32)*4+3],122,'prior source mask never mutated');
 assert.equal(erase.overlay[(48*64+32)*4+3],0);
 assert.equal(erase.manualEditCount,1);
 const restored=correctPublicSAM2Overlay808({...in0,state:erase,mode:'add',radius:4});
 assert.equal(restored.selectedPixels,old.selectedPixels);
 assert.equal(restored.overlay[(48*64+32)*4+3],122);
 assert.equal(restored.manualEditCount,2);
 for(const flag of ['modelPredictedPixelsHumanConfirmed','ownerApprovedMask',
  'autoSaveAllowed','externalUpload','privatePersisted','releaseAuthorized'])
  assert.equal(restored[flag],false,flag);
 assert.equal(restored.familyAlpha,'HOLD');
});
test('P808 never accepts cross-owner, cross-model PNG SHA, fake human approval or mutation of source identity',()=>{
 const inputs=[
  {state:{...setup().state,evidence:{...evidence(),ownerId:'other-owner'}}},
  {state:{...setup().state,evidence:{...evidence(),sourceSHA256:'0'.repeat(64)}}},
  {state:{...setup().state,evidence:{...evidence(),modelMaskPNG_SHA256:'f'.repeat(64)}}},
  {state:{...setup().state,evidence:{...evidence(),maskVerifiedByHuman:true}}},
  {state:{...setup().state,evidence:{...evidence(),autoSaveAllowed:true}}},
  {box:{...box(),ownerId:'other-owner'}},
  {box:{...box(),twoVerifiedOriginalJPEGCornerTaps:false}},
  {point:{...point(),sourceBytesSHA256Verified:false}},
  {point:{...point(),sourceSHA256:'f'.repeat(64)}}
 ];
 for(const item of inputs){
  const args=setup();
  assert.throws(()=>correctPublicSAM2Overlay808({...args,...item,mode:'erase'}),
   /exact P806 public SAM2/,JSON.stringify(Object.keys(item)));
 }
});
test('P808 rejects out-of-rectangle edits, oversized bitmap/brush and invalid model alpha',()=>{
 for(const invalid of [
  {x:2,y:2},{x:-1,y:48},{x:63,y:95},{x:1.4},
  {radius:13},{radius:0},{mode:'approve'},
  {state:{...setup().state,width:513}},
  {state:{...setup().state,overlay:new Uint8ClampedArray(2)}},
  {state:{...setup().state,selectedPixels:9000}}
 ]){
  assert.throws(()=>correctPublicSAM2Overlay808({...setup(),mode:'erase',...invalid}));
 }
});
test('P808 limits brush edit count, fails closed on no-op erase, unchanged alpha/source and no private save',()=>{
 const init=setup();
 assert.throws(()=>correctPublicSAM2Overlay808({...init,mode:'add'}),/no model pixels changed/);
 assert.throws(()=>correctPublicSAM2Overlay808({...init,mode:'erase',
  state:{...init.state,manualEditCount:1024}}),/budget exceeded/);
 const changed=correctPublicSAM2Overlay808({...init,x:14,y:24,radius:10,mode:'add'});
 assert.equal(changed.overlay[(2*64+2)*4+3],0);
 assert.ok(changed.selectedPixels>init.state.selectedPixels);
});
test('P808 correction algorithm has no network, storage or model runtime',()=>{
 const src=readFileSync('public/mission1-public-sam2-mask-brush-808.mjs','utf8');
 for(const term of ['fetch(', 'XMLHttpRequest', 'indexedDB.', 'localStorage.',
  'postMessage(', 'onnxruntime','InferenceSession','navigator.sendBeacon','store.put('])
  assert.equal(src.includes(term),false,term);
});
