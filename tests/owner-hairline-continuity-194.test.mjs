import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyHairlineSourceContinuity194}
 from '../research/owner-hairline-continuity-194/hairline-source-proof.mjs';
import {verifyDecodedSourceContour191}
 from '../research/owner-source-mask-topology-191/source-contour-integrity.mjs';
const SOURCE='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const SHA='3'.repeat(64),W=96,H=128;
function blouse(shrink=0){
 const out=new Uint8ClampedArray(W*H*4);
 for(let y=8;y<H-8;y++){
  const half=22+12*Math.sin(Math.PI*(y-8)/(H-16));
  for(let x=Math.ceil(W/2-half)+shrink;x<=Math.floor(W/2+half)-shrink;x++){
   const p=(y*W+x)*4;
   out[p]=204;out[p+1]=215;out[p+2]=210;out[p+3]=255;
  }
 }
 return out;
}
function clear(src,x0,x1,y0,y1){
 const d=src.slice();
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)
  d[(y*W+x)*4+3]=0;
 return d;
}
const binary=rgba=>Uint8Array.from({length:W*H},(_,i)=>rgba[i*4+3]>=160?1:0);
const verify=(source,owner)=>verifyDecodedSourceContour191({
 sourceData:source,ownerData:owner,width:W,height:H,
 sourceSHA256:SOURCE,ownerMaskSHA256:SHA
});
test('P194 valid inward 4% owner-source contour remains fitted to one licensed blouse without claiming human review',()=>{
 const result=verify(blouse(),blouse(2));
 assert.equal(result.ownerSourceHairlineContinuous194,true);
 assert.ok(result.sourceInteriorExaminedRows194>H*.2);
 assert.equal(result.maxMissingComponentPixels194,0);
 assert.equal(result.independentHumanSegmentationReviewed,false);
 assert.equal(result.otherGarmentTypesCertified,false);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.familyAlpha,'HOLD');
});
test('P194 refuses a 3px connected hairline from original neckline despite high P191 overlap and sub-P192 row widths',()=>{
 const src=blouse(),owner=clear(blouse(2),47,50,0,60);
 assert.throws(()=>verify(src,owner),/P194 persistent narrow missing-fabric hairline/);
});
test('P194 detects a thin non-rectangular diagonal tear of long extent',()=>{
 const src=blouse(),owner=blouse(2);
 for(let y=8;y<65;y++){
  const x=46+Math.round((y-8)/28);
  for(let xx=x;xx<x+3;xx++)owner[(y*W+xx)*4+3]=0;
 }
 assert.throws(()=>verify(src,owner),/P194 persistent narrow missing-fabric hairline/);
});
test('P194 tolerates a benign isolated 3x2 alpha compression defect and unchanged source negative space',()=>{
 const src=blouse(),owner=clear(blouse(2),47,50,60,62);
 const result=verify(src,owner);
 assert.equal(result.ownerSourceHairlineContinuous194,true);
 assert.ok(result.maxMissingComponentPixels194<24);
});
test('P194 refuses nonbinary or oversized arrays and inadequate original garment interior',()=>{
 const src=binary(blouse()),owner=binary(blouse(2));
 for(const options of [
  {width:500},
  {height:300},
  {ownerPixels:new Uint8Array(2)},
  {sourcePixels:new Uint8Array(W*H)},
  {sourcePixels:[]}
 ]){
  assert.throws(()=>verifyHairlineSourceContinuity194({
   sourcePixels:src,ownerPixels:owner,width:W,height:H,...options
  }),/P194/);
 }
});
test('P194 rejects an interior narrow 2px strand that P192 can overlook only when sustained long enough',()=>{
 const src=binary(blouse()),own=binary(clear(blouse(2),47,49,22,72));
 assert.throws(()=>verifyHairlineSourceContinuity194({
  sourcePixels:src,ownerPixels:own,width:W,height:H
 }),/P194 persistent narrow missing-fabric hairline/);
});
