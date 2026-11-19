/** Structural synthetic color/fabric coverage negatives. Real Met JPEG
 * pixel decode and exact SHA attestations run separately in genuine CI.
 * This test does NOT prove garment boundary, label or camera calibration. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {measureMet70759ColorFabricProjection89 as audit,
 MET70759_GALLERY_VIEW_NOTES89 as views}
 from '../research/parallel89/met-four-photo-chromatic-silhouette89.mjs';

const SHA='59c0e6568000b68678efb067a5cdd2f95eee3c1407b9927df82ac89af0124ec2';
function fabric(){
 const w=180,h=180,rgb=new Uint8Array(w*h*3).fill(246);
 for(let y=25;y<166;y++){
  const half=14+(y-25)*.28;
  for(let x=Math.ceil(w/2-half);x<=Math.floor(w/2+half);x++){
   const k=(y*w+x)*3;
   rgb[k]=38;rgb[k+1]=110;rgb[k+2]=197;
  }
 }
 return {rgb,width:w,height:h};
}
function sample(x={}){return audit({
 imageId:2551408,sourceSHA256:SHA,expectedSourceSHA256:SHA,
 decodedRGBSHA256:views[2].canonicalDecodedRGBSHA256,
 actualDecodedRGBHashIndependentlyChecked:true,
 originalMuseumObjectNumber:'1983.21a, b',actualOriginalJPEGAttested:true,
 ...fabric(),...x
});}
test('seven horizontal original-style color fabric rows measure a photographic proxy, never wearability',()=>{
 const r=sample();
 assert.equal(r.status,'ORIGINAL_MUSEUM_TEXTILE_COLOR_REGION_MEASURED_RESEARCH_ONLY');
 assert.equal(r.imageId,2551408);
 assert.equal(r.sourceImageCountInOfficialGallery,4);
 assert.equal(r.sourceImageRoleViewLabel,'b-decorated-side-candidate');
 assert.equal(r.photographicPartAndViewIndependentlyVerified,false);
 assert.equal(r.partBOrReverseRoleRemainsProvisional,true);
 assert.equal(r.sourcePixelDimensions[0],180);
 assert.equal(r.sevenMeasuredChromaticImageBands.length,7);
 assert.ok(r.sevenMeasuredChromaticImageBands.every(b=>
  b.observedColorFabricWidthPixels>0&&
  b.observedColorFabricWidthFraction>0&&
  b.observedColorFabricWidthFraction<1));
 assert.ok(r.bottomToUpperColorRegionWidthRatio>2);
 assert.equal(r.imageColorTextileProxyNotFullGarmentMask,true);
 assert.equal(r.creamWaistbandMayBeExcluded,true);
 assert.equal(r.catalogDimensionCannotConvertObservedPixelsWithoutCameraAndFlattening,true);
 assert.equal(r.immutableCatalogPartMeasurementsMm.length,2);
 assert.equal(r.immutableCatalogPartMeasurementsMm[1].recordedLengthMm,965.2);
 assert.equal(r.originalCameraFocalAndExtrinsicCalibrationMissing,true);
 assert.equal(r.physicalClothFitCertified,false);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.familyAlpha,'HOLD');
});
test('museum expressly captions only first gallery view as a) front, all other roles kept provisional',()=>{
 assert.deepEqual(views.map(v=>v.id),[2551406,2551407,2551408,2551409]);
 assert.equal(views[0].catalogCaptionExact,'a) front');
 assert.equal(views[0].sourcePartViewVerified,true);
 assert.ok(views.slice(1).every(v=>
  v.catalogCaptionExact===null&&v.sourcePartViewVerified===false));
 const x=sample({imageId:2551406,
  decodedRGBSHA256:views[0].canonicalDecodedRGBSHA256});
 assert.equal(x.status,'ORIGINAL_MUSEUM_TEXTILE_COLOR_REGION_MEASURED_RESEARCH_ONLY');
 assert.equal(x.sourceMuseumExactCaption,'a) front');
 assert.equal(x.photographicPartAndViewIndependentlyVerified,true);
 assert.equal(x.proposedPartForSourceResearch,'a');
 assert.equal(x.consumer3DAdmitted,false);
});
test('byte digest / museum object ID / original attestation spoof cannot manufacture accepted 2D evidence',()=>{
 for(const edit of [
  {imageId:0},{imageId:2551499},
  {sourceSHA256:'0'.repeat(64)},
  {sourceSHA256:SHA.toUpperCase()},
  {expectedSourceSHA256:'a'.repeat(64)},
  {decodedRGBSHA256:'0'.repeat(64)},
  {actualDecodedRGBHashIndependentlyChecked:false},
  {actualOriginalJPEGAttested:false},
  {actualOriginalJPEGAttested:'true'},
  {originalMuseumObjectNumber:'5152.1'},
  {originalMuseumObjectNumber:'1983.21a'},
  {width:2},{height:Infinity},
  {rgb:new Float32Array(180*180*3)},
  {rgb:new Uint8Array(5)}
 ]){
  const r=sample(edit);
  assert.equal(r.status,'MET_FOUR_GALLERY_COLOR_ENVELOPE_UNVERIFIABLE',
   JSON.stringify({...edit,rgb:undefined}));
  assert.equal(r.consumer3DAdmitted,false);
  assert.equal(r.mayCalibrateOriginalHonoluluGarment,false);
 }
});
test('unsegmented cream museum background is not an authentic textile mask',()=>{
 const r=sample({rgb:new Uint8Array(180*180*3).fill(246)});
 assert.equal(r.status,'MET_FOUR_GALLERY_COLOR_ENVELOPE_UNVERIFIABLE');
 assert.match(r.reason,/coverage/);
 assert.equal(r.consumer3DAdmitted,false);
});
test('original RGB input is not modified by color projection; removed fabric changes computed bands',()=>{
 const props=fabric(),original=props.rgb.slice();
 const r=sample(props);
 assert.deepEqual(props.rgb,original);
 const copy=props.rgb.slice();
 // Whiten only outer lower garment panels. True color proxy becomes narrower.
 for(let y=100;y<166;y++)for(let x=0;x<180;x++){
  if(x<80||x>100){
   const k=(y*180+x)*3;
   copy[k]=246;copy[k+1]=246;copy[k+2]=246;
  }
 }
 const modified=sample({...props,rgb:copy});
 assert.equal(modified.status,'ORIGINAL_MUSEUM_TEXTILE_COLOR_REGION_MEASURED_RESEARCH_ONLY');
 assert.ok(modified.sevenMeasuredChromaticImageBands[6].observedColorFabricWidthPixels<
  r.sevenMeasuredChromaticImageBands[6].observedColorFabricWidthPixels);
 assert.deepEqual(props.rgb,original);
});
