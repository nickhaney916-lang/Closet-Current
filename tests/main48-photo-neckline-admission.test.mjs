import test from 'node:test';
import assert from 'node:assert/strict';
import {M47} from '../research/main1054-3d47/fragment-visibility-trial.mjs';
import {M48,auditNativePhotoNecklinePhysicalEdge48} from '../research/main1054-3d48/photo-neckline-edge-admission48.mjs';

// Synthetic interface fixture ONLY; actual source evidence must come from
// exact-head genuine native Chromium/WebKit M47 browser receipts in CI.
const variants=['P93','M45','M45_HOLE'];
const figures=['female','male'],poses=['source','blend-50','relaxed'],views=['front','side'];
function fixture(engine='chromium'){
 const scenes=[];
 for(const variant of variants)for(const figure of figures)
  for(const pose of poses)for(const view of views)scenes.push({
   variant,figure,pose,view,
   screenshotSHA256:'a'.repeat(64),nativeBrowserScreenshot:true,
   originalPhotographerSourceSHA256:M47.originalSHA256,
   actualBoneCount:163,originalGeometryAndPhotoUVUntouched:true,
   sourceGarmentParts:3,fittedVertices:12692,anatomicalBodyFaces:109064,
   sourceGarmentTriangles:3836,
   sampledCrossBodyStrictWitnesses:0,sampledSelfStrictWitnesses:0,
   ambiguousBodyNearUnresolved:20,ambiguousSelfNearUnresolved:6,
   photo2DFallbackRequired:true,releaseAuthorized:false
  });
 const comparisons={};
 for(const [before,after] of [['P93','M45'],['M45','M45_HOLE']]){
  comparisons[before+'__'+after]=[];
  for(const figure of figures)for(const pose of poses)for(const view of views)
   comparisons[before+'__'+after].push({
    figure,pose,view,changedRGBPixelsAbove8:73,
    sourceNecklineScreenRegionChanges:73,
    changesOutsideObservedNecklineROI:0,
    actualFragmentHoleIsNotPhysicalOpening:true,
    originalJpegAndUVUnchanged:true,releaseAuthorized:false
   });
 }
 return {
  schema:'MAIN1054_M47_ORIGINAL_P93_M45_BLEND_VS_TRUE_FRAGMENT_ALPHA_HOLE_AB/v1',
  engine,originalLicensedSourceSHA256:M47.originalSHA256,
  originalSourceRGBPreserved:true,originalWork47AndDonorManifestsUnchanged:true,
  actualResearchNativeWebGL2:true,exactAnatomical163Bones:true,
  realPhotographedMaskTextureCompared:true,
  originalPhotoUVProjectionCropIdentical:true,
  photoUVGeometryCrossConditionIdentityNotYetProven:false,
  noActualClothGeometryCutOrNewSeam:true,noPhysicalOriginalDressMeshHoleCreated:true,
  sourceAlphaOnlyVisibilityExperimentValid:true,
  sourceAlphaOnlyVisibilityChangeMeasured:true,
  noIndependentHumanOriginalTextureAcceptance:true,
  originalPhoto2DFallbackRequired:true,
  continuousClothBodyOrSelfCollisionNotCertified:true,
  sourcePhotoRearUnobserved:true,realOwnerSigned3DAdmitted:false,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD',
  variants,figures,poses,views,
  originalSourceP93AlphaChanged:12961,
  m45ExtraSourceAlphaTransparent:4890,
  incrementalTrueFragmentAlphaHoleChangedPixels:881,
  actualViewsWithIncrementalShaderCutoutPixels:12,
  sourceVisibilitySafety47:{
   schema:'MAIN1054_M47_AUTHENTIC_SOURCE_ALPHA_VISIBILITY_COMPARISON_CHECK/v1',
   actualSource3DScenes:36,matchedNative3DSourceMaskComparisons:12,
   originalLicensedJPEGVerified:true,
   originalProjectedPhotoCropSameAcrossAllVariants:true,
   alphaVisibilityCutNotPhysicalClothGeometry:true,
   humanPhotoAndMaterialReviewNotPerformed:true,
   contactSweepContinuousNotCertified:true,
   sourceBacksideNotPhotographed:true,
   noConsumer3DAdmission:true,releaseAuthorized:false
  },
  sourceCropRects:Object.fromEntries(variants.map(v=>[v,[.15,.12,.70,.81]])),
  scenes,comparisons
 };
}
test('M48 synthetic valid source contract still denies any physical garment promotion',()=>{
 for(const engine of ['chromium','webkit']){
  const verdict=auditNativePhotoNecklinePhysicalEdge48(fixture(engine),{expectedEngine:engine});
  assert.equal(verdict.schema,M48.schema);
  assert.equal(verdict.genuineSourceScenesAudited,36);
  assert.equal(verdict.observedFragmentVisibilityPixels,881);
  assert.equal(verdict.documentedTransparentSourceVs3DPhysicalEdgeGap,true);
  assert.equal(verdict.actualSewnCollarEdgeReconstructed,false);
  assert.equal(verdict.originalBacksidePhotographicallyObserved,false);
  assert.equal(verdict.consumer3DAdmitted,false);
  assert.equal(verdict.releaseAuthorized,false);
  assert.equal(verdict.familyAlpha,'HOLD');
 }
});
test('M48 rejects browser-label spoofing, release permission and invented sewn topology',()=>{
 const base=fixture();
 const trials=[
  {expectedEngine:'webkit'},
  {receipt:{...base,engine:'webkit'}},
  {receipt:{...base,releaseAuthorized:true}},
  {receipt:{...base,consumer3DAdmitted:true}},
  {receipt:{...base,noActualClothGeometryCutOrNewSeam:false}},
  {receipt:{...base,noPhysicalOriginalDressMeshHoleCreated:false}},
  {receipt:{...base,noIndependentHumanOriginalTextureAcceptance:false}},
  {receipt:{...base,realOwnerSigned3DAdmitted:true}},
  {receipt:{...base,sourcePhotoRearUnobserved:false}},
  {receipt:{...base,incrementalTrueFragmentAlphaHoleChangedPixels:0}},
  {receipt:{...base,originalLicensedSourceSHA256:'f'.repeat(64)}}
 ];
 for(const t of trials)
  assert.throws(()=>auditNativePhotoNecklinePhysicalEdge48(
   t.receipt||base,{expectedEngine:t.expectedEngine||'chromium'}),/BLOCKED/);
});
test('M48 rejects missing real source scenes, fake cropped ROI and changed geometry',()=>{
 const base=fixture();
 for(const receipt of [
  {...base,scenes:base.scenes.slice(1)},
  {...base,scenes:[...base.scenes.slice(0,-1),base.scenes[0]]},
  {...base,scenes:base.scenes.map((s,i)=>i===8?{...s,fittedVertices:13000}:s)},
  {...base,scenes:base.scenes.map((s,i)=>i===2?{...s,screenshotSHA256:'x'}:s)},
  {...base,sourceCropRects:{...base.sourceCropRects,M45:[.16,.12,.70,.81]}},
  {...base,sourceVisibilitySafety47:{...base.sourceVisibilitySafety47,contactSweepContinuousNotCertified:false}},
  {...base,comparisons:{...base.comparisons,
   M45__M45_HOLE:base.comparisons.M45__M45_HOLE.map((r,i)=>i===3?
    {...r,changesOutsideObservedNecklineROI:3}:r)}}
 ])assert.throws(()=>auditNativePhotoNecklinePhysicalEdge48(receipt,{expectedEngine:'chromium'}),/BLOCKED/);
});
