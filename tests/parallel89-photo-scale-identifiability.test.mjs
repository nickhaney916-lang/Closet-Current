/**
 * Adversarial SYNTHETIC math/identity tests only. Actual original Commons-0043
 * JPEG+review PNG and both original P541 163bone GLBs must be SHA-verified
 * and measured in genuine browser CI, NOT inferred from these fabricated rows.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {proveOriginalPhotoMetricNonIdentifiability89 as audit}
 from '../research/parallel89/skirt-photo-scale-identifiability89.mjs';

const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const CUTOUT='b9717f71fffb65beb7b17beebd54702333d41e34f10f214831251660b1664be4';
const RIG={female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'};
const bands=()=>[0,1,2,3,4,5,6].map(i=>({
 sourcePixelRow:24+i*25,widthPixels:45+i*8,centerPixels:90+i*3,p:.08+.14*i
}));
function fixture(avatar='female'){
 return {sourceId:'commons-0043',museumAccession:'5152.1',
  originalPhotoSHA256:PHOTO,originalCutoutSHA256:CUTOUT,
  originalSourcePhotoAndCutoutAttested:true,
  avatar,original163BoneGLBSHA256:RIG[avatar],
  rigBoneCount:163,pose:'source',
  outline:{
   schema:'P89-source-measured-skirt-silhouette/v1',
   pixelDimensions:[240,240],crop:[.2,.1,.7,.7],
   sourceRowWidths:bands(),
   maskHumanApproved:false,photoCameraAngleIndependentlyValidated:false,
   realPhysicalDimensionsMeasured:false,releaseAuthorized:false
  }};
}
test('two deliberately different unknown garment sizes and camera scales exactly reproduce all seven original-style front pixel rows',()=>{
 for(const avatar of ['female','male']){
  const input=fixture(avatar),r=audit(input);
  assert.equal(r.status,
   'TWO_DISTINCT_UNCALIBRATED_WORLDS_SAME_SEVEN_ORIGINAL_ALPHA_ROWS');
  assert.equal(r.sourceId,'commons-0043');
  assert.equal(r.museumAccession,'5152.1');
  assert.equal(r.avatar,avatar);
  assert.equal(r.independentlyAttestedOriginalPhotoAlphaBands,7);
  assert.equal(r.photographicLeftRightAndRowConstraintsReprojected,21);
  assert.equal(r.hypotheticalWorldAndCameraExamples.length,2);
  assert.notEqual(r.hypotheticalWorldAndCameraExamples[0].hypotheticalWaistHalfWidthMeters,
   r.hypotheticalWorldAndCameraExamples[1].hypotheticalWaistHalfWidthMeters);
  assert.notEqual(r.hypotheticalWorldAndCameraExamples[0].hypotheticalTopToHemDropMeters,
   r.hypotheticalWorldAndCameraExamples[1].hypotheticalTopToHemDropMeters);
  assert.notEqual(r.hypotheticalWorldAndCameraExamples[0].hypotheticalInvisibleRearDepthMeters,
   r.hypotheticalWorldAndCameraExamples[1].hypotheticalInvisibleRearDepthMeters);
  assert.ok(r.hypotheticalWorldAndCameraExamples.every(v=>
   v.maximumOriginalObservedFrontRowReprojectionErrorPixels<1e-8 &&
   v.realCameraOrObjectSizeEstimated===false));
  assert.equal(r.observedOneFrontalAlphaMaskCannotDetermineAbsoluteScale,true);
  assert.equal(r.unobservedRearDepthCanVaryWithoutChangingFrontProjection,true);
  assert.equal(r.exampleOrthographicProjectionNotProofOfTrueCameraType,true);
  assert.equal(r.unrelatedChineseSkirtMeasurementsMustNotBeSubstituted,true);
  assert.equal(r.realPhysicalGarmentMeasurementAvailable,false);
  assert.equal(r.calibratedActualCameraAvailable,false);
  assert.equal(r.consumer3DAdmitted,false);
  assert.equal(r.originalPhoto2DFallbackRequired,true);
  assert.equal(r.releaseAuthorized,false);
  assert.equal(r.familyAlpha,'HOLD');
 }
});
test('real source accession number and original image/cutout/rig digests cannot be substituted with similar museum garment records',()=>{
 for(const bad of [
  {sourceId:'commons-0053'},{museumAccession:'598'},
  {museumAccession:'599'},{museumAccession:'10128.1'},
  {museumAccession:'5152.1 ',originalPhotoSHA256:PHOTO},
  {museumAccession:5152.1},
  {originalPhotoSHA256:'0'.repeat(64)},
  {originalCutoutSHA256:'0'.repeat(64)},
  {originalSourcePhotoAndCutoutAttested:false},
  {originalSourcePhotoAndCutoutAttested:'true'},
  {avatar:'owner'}, {original163BoneGLBSHA256:RIG.male},
  {rigBoneCount:162},{rigBoneCount:0},{pose:'none'}
 ]){
  const res=audit({...fixture(),...bad});
  assert.equal(res.status,'ORIGINAL_PHOTO_NONIDENTIFIABILITY_EVIDENCE_INVALID',
   JSON.stringify(bad));
  assert.equal(res.originalPhoto2DFallbackRequired,true);
  assert.equal(res.consumer3DAdmitted,false);
 }
});
test('source alpha-row tampering, missing provenance, false physical calibration fail closed',()=>{
 for(const mutate of [
  o=>{o.sourceRowWidths[1].sourcePixelRow=24;},
  o=>{o.sourceRowWidths[4].sourcePixelRow=999;},
  o=>{o.sourceRowWidths[2].centerPixels=NaN;},
  o=>{o.sourceRowWidths[2].widthPixels=1000;},
  o=>{o.sourceRowWidths[0].widthPixels=-1;},
  o=>{o.sourceRowWidths[0].p=-.1;},
  o=>{o.sourceRowWidths[1].centerPixels=-1;},
  o=>{o.pixelDimensions=[1,240];},
  o=>{o.crop=['0',.1,.7,.7];},
  o=>{o.maskHumanApproved=true;},
  o=>{o.realPhysicalDimensionsMeasured=true;},
  o=>{o.photoCameraAngleIndependentlyValidated=true;},
  o=>{o.releaseAuthorized=true;},
  o=>{o.schema='forged-physical-widths';},
  o=>{o.sourceRowWidths=[];}
 ]){
  const opts=fixture(),before=JSON.stringify(opts);
  mutate(opts.outline);
  const r=audit(opts);
  assert.equal(r.status,'ORIGINAL_PHOTO_NONIDENTIFIABILITY_EVIDENCE_INVALID');
  assert.equal(r.consumer3DAdmitted,false);
  assert.equal(r.releaseAuthorized,false);
  assert.notEqual(JSON.stringify(opts),before,'mutation fixture should be different');
 }
});
test('every genuine named source pose is observational only, and source measured pixel data never changes',()=>{
 for(const avatar of ['female','male'])
  for(const pose of ['source','blend-25','blend-50','blend-75','relaxed']){
   const input=fixture(avatar);input.pose=pose;
   const original=JSON.stringify(input.outline);
   const r=audit(input);
   assert.equal(r.status,'TWO_DISTINCT_UNCALIBRATED_WORLDS_SAME_SEVEN_ORIGINAL_ALPHA_ROWS');
   assert.equal(r.pose,pose);
   assert.equal(r.originalSourceMaskAndRigUnchanged,true);
   assert.equal(JSON.stringify(input.outline),original);
   assert.equal(r.originalPhoto2DFallbackRequired,true);
  }
});
