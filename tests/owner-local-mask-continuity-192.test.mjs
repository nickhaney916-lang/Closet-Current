import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyLocalSourceContinuity192}
 from '../research/owner-local-mask-continuity-192/source-local-continuity.mjs';
import {verifyDecodedSourceContour191}
 from '../research/owner-source-mask-topology-191/source-contour-integrity.mjs';
const SOURCE='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const W=96,H=128;
const MASK='2'.repeat(64);
function draw(shrink=0){
 const data=new Uint8ClampedArray(W*H*4);
 for(let y=8;y<H-8;y++){
  const half=22+12*Math.sin(Math.PI*(y-8)/(H-16));
  const left=Math.ceil(W/2-half)+shrink,right=Math.floor(W/2+half)-shrink;
  for(let x=left;x<=right;x++){
   const i=(y*W+x)*4;
   data[i]=210;data[i+1]=220;data[i+2]=200;data[i+3]=255;
  }
 }
 return data;
}
const erase=(data,x0,x1,y0,y1)=>{
 const altered=data.slice();
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)
  altered[(y*W+x)*4+3]=0;
 return altered;
};
const raw=rgba=>Uint8Array.from({length:W*H},(_,i)=>rgba[i*4+3]>=160?1:0);
const admit=(source,owner)=>verifyDecodedSourceContour191({
 sourceData:source,ownerData:owner,width:W,height:H,
 sourceSHA256:SOURCE,ownerMaskSHA256:MASK
});
test('P192 original-source versus narrow reviewed blouse retains valid connected contour and honest claims',()=>{
 const p=admit(draw(),draw(2));
 assert.equal(p.ownerSourceInteriorContinuous192,true);
 assert.ok(p.inspectedOriginalSourceCoreRows192>=H*.2);
 assert.equal(p.maxConsecutiveConcerningRows192,0);
 assert.equal(p.independentHumanReviewVerified,false);
 assert.equal(p.generalGarmentSegmentationCertified,false);
 assert.equal(p.releaseAuthorized,false);
 assert.equal(p.familyAlpha,'HOLD');
});
test('P192 rejects an exterior-connected central slit that does not create an enclosed P191 hole',()=>{
 // Interior slit opens at the upper photo background and closes before hem;
 // most of the licensed blouse still overlaps, with one connected component.
 const src=draw(),owner=erase(draw(2),44,52,8,45);
 assert.throws(()=>admit(src,owner),/P192.*localized missing-fabric slit/);
});
test('P192 rejects a small interior tear with deceptively excellent global IoU',()=>{
 const src=draw(),owner=erase(draw(2),44,52,58,60);
 assert.throws(()=>admit(src,owner),/P192.*localized missing-fabric slit/);
});
test('P192 allows harmless tiny isolated pixel defects in otherwise valid source contour',()=>{
 const src=draw(),owner=erase(draw(2),48,49,55,56);
 const p=admit(src,owner);
 assert.equal(p.ownerSourceInteriorContinuous192,true);
 assert.ok(p.maxInteriorMissingRunPixels192<=1);
});
test('P192 rejects invalid raster size, missing source and sparse source rather than claiming segmentation',()=>{
 const src=raw(draw()),own=raw(draw(2));
 assert.throws(()=>verifyLocalSourceContinuity192({
  sourcePixels:src,ownerPixels:own,width:500,height:H
 }),/P192/);
 assert.throws(()=>verifyLocalSourceContinuity192({
  sourcePixels:new Uint8Array(W*H),ownerPixels:own,width:W,height:H
 }),/P192/);
 assert.throws(()=>verifyLocalSourceContinuity192({
  sourcePixels:src,ownerPixels:new Uint8Array(7),width:W,height:H
 }),/P192/);
});
