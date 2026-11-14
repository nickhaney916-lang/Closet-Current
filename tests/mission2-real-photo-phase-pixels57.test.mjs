import test from 'node:test';
import assert from 'node:assert/strict';
import {comparePhotoPhaseRGB57,summarizeMeasuredPhasePixels57,
 PHASES57,WIDTHS57,STAGES57}
 from '../research/mission2-source-length/photo-phase-pixel-diff57.mjs';
const ones=(n,value=0)=>new Uint8Array(n).fill(value);
const sample=(opts={})=>{
 const rows=[];
 for(const phase of PHASES57.slice(1))
  for(const width of WIDTHS57)
   for(const stage of STAGES57){
    const changed=stage===STAGES57[0]?0:(opts.noMovement?0:42);
    rows.push({
     phase,width,stage,
     measuredRGBPixels:1000,
     changedRGBPixelsAboveThreshold:changed,
     changedRGBPixelFraction:changed/1000,
     maxRGBChannelDifference:changed?16:0,
     originalRGBBytesExposed:false,
     sourceClothingPhotorealismApproved:false,
     releaseAuthorized:false
    });
   }
 return rows;
};
test('C57: true original 2x2 RGB bytes quantify changed pixels without revealing RGB',()=>{
 const a=ones(12),b=ones(12);
 b[0]=10;b[6]=8;b[11]=21;
 const x=comparePhotoPhaseRGB57(a,b,2,2);
 assert.equal(x.measuredRGBPixels,4);
 assert.equal(x.changedRGBPixelsAboveThreshold,2);
 assert.equal(x.maxRGBChannelDifference,21);
 assert.equal(x.changedRGBPixelFraction,.5);
 assert.equal(x.meanAbsoluteRGBChannelDifference,(10+8+21)/12);
 assert.equal(JSON.stringify(x).includes('RGBBytes'),true);
 assert.equal(x.originalRGBBytesExposed,false);
 assert.equal(x.releaseAuthorized,false);
});
test('C57: identical source-rendered screenshot has zero motion pixels and no visual certification',()=>{
 const a=ones(12,120),b=new Uint8Array(a);
 const x=comparePhotoPhaseRGB57(a,b,2,2);
 assert.equal(x.changedRGBPixelsAboveThreshold,0);
 assert.equal(x.maxRGBChannelDifference,0);
 assert.equal(x.sourceClothingPhotorealismApproved,false);
});
test('C57: all 36 side/front/rear actual-photo view comparisons are completely accounted',()=>{
 const rows=sample(),s=summarizeMeasuredPhasePixels57(rows);
 assert.equal(s.schema,'M2-C57-real-original-licensed-photo-WebGL-five-phase-pixel-receipt');
 assert.equal(s.actualSourcePhaseComparisons,36);
 assert.equal(s.fullSourcePhoto3DViewsMeasured,45);
 assert.equal(s.changedFrontSourcePhotoViews,0);
 assert.equal(s.changedSideRearSourcePhotoViews,24);
 assert.equal(s.widthsWithVerifiedMovingSideRear,3);
 assert.equal(s.perStageMotionPixelsVerified.length,36);
 assert.equal(s.sourcePhotoPixelsOrPrivateIDsExported,false);
 assert.equal(s.screenshotDifferencesNotHumanRealismApproval,true);
 assert.equal(s.releaseAuthorized,false);
});
test('C57: digest changes alone are insufficient, no changed RGB means no movement witnesses',()=>{
 const s=summarizeMeasuredPhasePixels57(sample({noMovement:true}));
 assert.equal(s.widthsWithVerifiedMovingSideRear,0);
 assert.equal(s.changedSideRearSourcePhotoViews,0);
 assert.equal(s.largestRGBPixelsChangedAbove8,0);
});
test('C57: missing, duplicate or invented real phase stage comparisons fail closed',()=>{
 const rows=sample();
 for(const change of [
  r=>r.pop(),
  r=>r[0].phase=.125,
  r=>r[0].width=375,
  r=>r[0].stage='invented-apparel',
  r=>r[0].changedRGBPixelsAboveThreshold=-1,
  r=>r[0].measuredRGBPixels=1,
  r=>r[0].originalRGBBytesExposed=true,
  r=>r[0].releaseAuthorized=true,
  r=>r[0].maxRGBChannelDifference=Infinity,
  r=>r[0].changedRGBPixelFraction=.8
 ]){
  const clone=structuredClone(rows);
  change(clone);
  assert.throws(()=>summarizeMeasuredPhasePixels57(clone));
 }
});
test('C57: malformed raw image dimensions or threshold never become a reassuring measurement',()=>{
 const a=ones(12),b=ones(12);
 for(const op of [
  ()=>comparePhotoPhaseRGB57(a,b,0,2),
  ()=>comparePhotoPhaseRGB57(a,b,2,3),
  ()=>comparePhotoPhaseRGB57(a,b,2,2,{threshold:256}),
  ()=>comparePhotoPhaseRGB57(a,b,2,2,{threshold:-1}),
  ()=>comparePhotoPhaseRGB57(a,b,2,2,{threshold:1.5}),
  ()=>comparePhotoPhaseRGB57([0,1,2],b,2,2),
  ()=>comparePhotoPhaseRGB57(a,ones(10),2,2)
 ])assert.throws(op);
});
