import test from 'node:test';
import assert from 'node:assert/strict';
import {institutionalPartAAnchor as anchor,MET70759_OBJECT_DIMENSION_REFERENCE as ref}
 from '../research/parallel89/met70759-physical-garment-dimension-anchor89.mjs';

const source=()=>{
 const originalJPEG_SHA256='a'.repeat(64),
  decodedOriginalRGB_SHA256='b'.repeat(64);
 return {
  source:{objectId:70759,imageId:2551406,caption:'a) front',
   part:'a',accession:'1983.21a,b',
   originalJPEG_SHA256,decodedOriginalRGB_SHA256},
  trusted:{objectId:70759,imageId:2551406,
   sourcePhotoCaption:'a) front',originalJPEG_SHA256,
   decodedOriginalRGB_SHA256,
   independentOriginalSourceVerifiedByCaller:true}
 };
};
const closed=r=>{
 assert.equal(r.status,'NOT_PHYSICALLY_CALIBRATED');
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.familyAlpha,'HOLD');
 assert.equal(r.sourcePhoto2DFallbackRequired,true);
 assert.equal(r.localPhotoMillimetersPerPixel,null);
 assert.equal(r.photoToOriginalRigUnitsPerMillimeter,null);
 assert.equal(r.fullGarmentBodyContactCertified,false);
};
test('Met official original front part A has EXACT authentic inch to mm physical dimensions',()=>{
 const r=anchor(source());closed(r);
 assert.equal(r.reason,'REAL_CATALOGUED_GARMENT_PART_A_DIMENSIONS_ONLY');
 assert.equal(r.sourceMuseumCollectionObjectId,70759);
 assert.equal(r.sourceOriginalMuseumImageId,2551406);
 assert.equal(r.measuredPhysicalPart,'a');
 assert.deepEqual(r.physicalGarmentPartADimensionsInches,{
  length:39,bottomWidth:52.5,waistBandWidthExcludingLoopButton:28.5
 });
 assert.deepEqual(r.physicalGarmentPartADimensionsMillimeters,{
  length:990.6,bottomWidth:1333.5,waistBandWidthExcludingLoopButton:723.9
 });
 assert.equal(r.museumCatalogMeasurementUncertainty,'NOT_PUBLISHED');
 assert.equal(r.bottomWidthNotAutomaticallyCircumference,true);
 assert.equal(r.waistbandMeasurementExcludesLoopAndButton,true);
 assert.equal(r.partBMeasurementsNotApplicableToPartA,true);
 assert.equal(r.projectedImageContourNotMatchedToMeasuredSeamLandmarks,true);
});
test('real original public museum dimensions never grant perspective, rig fit, drape or back',()=>{
 const r=anchor(source());
 assert.equal(r.independentCameraIntrinsicsAndPlanePoseVerified,false);
 assert.equal(r.observedGarmentBack,false);
 assert.equal(r.observedPhysicalGarmentDrape,false);
 assert.equal(r.fullThreeDimensionalGarmentFitStatus,'UNVERIFIED');
 assert.equal(r.cameraAndProjectionCalibrationEvidenceStatus,'MISSING');
 closed(r);
});
test('a photo of item B is not entitled to item A published dimensions',()=>{
 for(const change of [
  x=>x.source.part='b',x=>x.source.caption='b) front',
  x=>x.source.imageId=2551408,
  x=>x.source.objectId=70760,
  x=>x.source.accession='1983.21b',
  x=>x.source.caption='rear'
 ]){
  const x=source();change(x);
  const r=anchor(x);closed(r);
  assert.equal(r.reason,'BLOCKED_WRONG_MUSEUM_OBJECT_PART_OR_ORIGINAL_IMAGE');
  assert.equal(r.physicalGarmentPartADimensionsMillimeters,undefined);
 }
});
test('wrong or altered original JPEG or decoded RGB blocks physical dimension association',()=>{
 for(const change of [
  x=>x.source.originalJPEG_SHA256='f'.repeat(64),
  x=>x.trusted.originalJPEG_SHA256='f'.repeat(64),
  x=>x.source.decodedOriginalRGB_SHA256='f'.repeat(64),
  x=>x.trusted.decodedOriginalRGB_SHA256='f'.repeat(64),
  x=>x.source.originalJPEG_SHA256='not-an-authentic-sha'
 ]){
  const x=source();change(x);
  const r=anchor(x);closed(r);
  assert.equal(r.reason,'BLOCKED_ORIGINAL_PHOTOGRAPH_OR_RGB_RECEIPT_MISMATCH');
 }
});
test('missing independent original source verification cannot introduce real dimensions',()=>{
 for(const change of [
  x=>x.trusted.independentOriginalSourceVerifiedByCaller=false,
  x=>x.trusted.sourcePhotoCaption='unknown',
  x=>x.trusted.imageId=2551408,
  x=>x.trusted.objectId=111
 ]){
  const x=source();change(x);
  const r=anchor(x);closed(r);
  assert.equal(r.reason,'BLOCKED_NATIVE_ORIGINAL_SOURCE_ATTESTATION_MISSING');
 }
});
test('missing source and injected costume measurements cannot override museum authority',()=>{
 const r=anchor({});closed(r);
 assert.equal(r.reason,'BLOCKED_WRONG_MUSEUM_OBJECT_PART_OR_ORIGINAL_IMAGE');
 const x=source();x.source.physicalGarmentPartADimensionsMillimeters={length:1};
 const output=anchor(x);closed(output);
 assert.equal(output.physicalGarmentPartADimensionsMillimeters.length,990.6);
});
test('published metadata does not claim photo-mm map or actual closed circumference',()=>{
 assert.equal(ref.objectId,70759);
 assert.equal(ref.photographedImageId,2551406);
 assert.equal(ref.originalPhotoCaption,'a) front');
 assert.equal(ref.partAInches.length,39);
 assert.equal(ref.partAInches.bottomWidth,52.5);
 const r=anchor(source());
 assert.equal(r.localPhotoMillimetersPerPixel,null);
 assert.equal(r.photoToOriginalRigUnitsPerMillimeter,null);
 assert.equal(r.bottomWidthNotAutomaticallyCircumference,true);
});
