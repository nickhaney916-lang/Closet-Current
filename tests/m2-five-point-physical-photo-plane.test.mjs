import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateFivePointPlanarReference as evaluate} from
 '../research/parallel89/physical-five-point-photo-plane89.mjs';

// All positive points are SYNTHETIC and analytically known. This does not
// invent a real owner photograph, real camera calibration, source-approved
// garment segmentation or physically matched avatar.
const project=(X,Y)=>{
 const x=X/210,y=Y/297,den=1+.06*x+.02*y;
 return [(170+750*x+40*y)/den,(140+25*x+540*y)/den];
};
function scenario(){
 const sha='b'.repeat(64);
 return {
  photo:{sha256:sha,width:1200,height:900,orientation:1},
  trustedOriginal:{sha256:sha,width:1200,height:900,orientation:1,
   originalBytesRehashedByIndependentCaller:true},
  review:{oneGarment:true,flatReferenceAndGarment:true,
   allEdgesVisible:true,referenceCoplanarWithGarment:true},
  reference:{
   widthMm:210,heightMm:297,widthUncertaintyMm:.3,
   heightUncertaintyMm:.3,
   cornersPx:[[0,0],[210,0],[210,297],[0,297]]
    .map(([x,y])=>project(x,y)),
   holdout:{
    pixel:project(85,130),positionMm:[85,130],
    positionUncertaintyMm:.3,pixelUncertaintyPx:.25
   }
  }
 };
}
const closed=r=>{
 assert.equal(r.status,'NOT_PHYSICALLY_CALIBRATED');
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 assert.equal(r.familyAlpha,'HOLD');
 assert.equal(r.originalGarmentPhysicalPixelScaleMmPerPixel,null);
 assert.equal(r.photographedGarmentToAvatarRigUnitsPerMillimeter,null);
 assert.equal(r.independentMeasuredRealWorldSourceGeometryCertified,false);
 assert.equal(r.measuredWearerBodyGeometryAvailable,false);
 assert.equal(r.approvedSourcePhotoGarmentMaskAvailable,false);
 assert.equal(r.photographedGarmentOriginalReverseObserved,false);
};
test('analytically true nonorthogonal synthetic perspective: 4 corners plus INDEPENDENT fifth pass math only',()=>{
 const r=evaluate({...scenario(),measurementClass:'synthetic'});closed(r);
 assert.equal(r.reason,'RESEARCH_ONLY_SYNTHETIC_FIVE_POINT_REFERENCE_MATH_PASSED');
 assert.ok(r.referenceMath.independentFifthResidualMm<1e-6);
 assert.ok(r.referenceMath.maximumReferenceCornerReprojectionErrorMm<1e-6);
 assert.ok(r.referenceMath.independentlyDeclaredErrorBudgetMm<5);
 assert.ok(r.referenceMath.referencePlaneLocalScaleMmPerPixelMin>0);
 assert.ok(r.referenceMath.referencePlaneLocalScaleMmPerPixelMax<
  4*r.referenceMath.referencePlaneLocalScaleMmPerPixelMin);
 assert.equal(r.referenceMath.opticalModel,
  'planar-homography-on-claimed-coplanar-reference-only');
 assert.equal(r.referenceMath.userClaimsNotIndependentInstrumentAttestation,true);
});
test('same mathematical reference with owner claims NEVER certifies real-world body fit',()=>{
 const r=evaluate(scenario());closed(r);
 assert.equal(r.reason,
  'BLOCKED_REAL_CALIBRATION_INDEPENDENT_ATTESTATION_AND_BODY_REGISTRATION_PENDING');
 assert.ok(r.referenceMath.independentFifthResidualMm<1e-6);
});
test('a contradictory fifth observation falsifies the fitted four-corner projectivity',()=>{
 const x=scenario();x.reference.holdout.pixel[0]+=90;
 const r=evaluate({...x,measurementClass:'synthetic'});closed(r);
 assert.equal(r.reason,'BLOCKED_INDEPENDENT_FIFTH_POINT_DISAGREES');
 assert.ok(r.independentFifthResidualMm>r.independentlyDeclaredErrorBudgetMm);
});
test('cross-source original JPEG alteration and false trusted originals are refused',()=>{
 for(const change of [
  x=>x.photo.sha256='c'.repeat(64),
  x=>x.trustedOriginal.sha256='c'.repeat(64),
  x=>x.trustedOriginal.originalBytesRehashedByIndependentCaller=false,
  x=>x.trustedOriginal.width=1199,
  x=>x.trustedOriginal.orientation=2,
  x=>x.photo.sha256='non-verified'
 ]){
  const x=scenario();change(x);
  const r=evaluate({...x,measurementClass:'synthetic'});closed(r);
  assert.equal(r.reason,'BLOCKED_ORIGINAL_PHOTO_SOURCE_IDENTITY_NOT_ATTESTED');
 }
});
test('rotated and mirrored EXIF require original-pixel reorientation first',()=>{
 for(const orientation of [2,3,4,5,6,7,8]){
  const x=scenario();x.photo.orientation=orientation;
  x.trustedOriginal.orientation=orientation;
  const r=evaluate(x);closed(r);
  assert.equal(r.reason,'BLOCKED_UNMAPPED_EXIF_IMAGE_COORDINATES');
 }
});
test('missing photo review or fake garment coplanarity is refused',()=>{
 for(const change of [
  x=>x.review.flatReferenceAndGarment=false,
  x=>x.review.oneGarment=false,
  x=>x.review.allEdgesVisible=false,
  x=>x.review.referenceCoplanarWithGarment=false,
  x=>delete x.review.flatReferenceAndGarment,
  x=>x.review.sidesVisible=true
 ]){
  const x=scenario();change(x);
  const r=evaluate(x);closed(r);
  assert.ok(r.reason.startsWith('BLOCKED_'));
  assert.equal(r.referenceMath,undefined);
 }
});
test('missing physically measured target dimensions or holdout is explicitly blocked',()=>{
 for(const change of [
  x=>x.reference.widthMm=0,
  x=>x.reference.heightMm=Infinity,
  x=>x.reference.widthMm=1e8,
  x=>x.reference.widthUncertaintyMm=50,
  x=>x.reference.holdout.positionUncertaintyMm=50,
  x=>x.reference.holdout.pixelUncertaintyPx=50,
  x=>delete x.reference.holdout
 ]){
  const x=scenario();change(x);
  const r=evaluate(x);closed(r);
  assert.equal(r.reason,'BLOCKED_MISSING_OR_INVALID_INDEPENDENT_FIDUCIAL');
 }
});
test('out-of-frame, missing reference side or cropped fifth observation are rejected',()=>{
 for(const change of [
  x=>x.reference.cornersPx[0][0]=-3,
  x=>x.reference.cornersPx[2][1]=10000,
  x=>x.reference.holdout.pixel=[3,9999]
 ]){
  const x=scenario();change(x);
  const r=evaluate(x);closed(r);
  assert.equal(r.reason,'BLOCKED_TRUNCATED_OR_OUT_OF_FRAME_FIDUCIAL');
 }
});
test('collinear, bowed over and shuffled rectangle corner ordering reject homography',()=>{
 for(const change of [
  x=>x.reference.cornersPx=[[50,50],[100,100],[150,150],[200,200]],
  x=>{const q=x.reference.cornersPx;[q[1],q[2]]=[q[2],q[1]];},
  x=>x.reference.cornersPx[3]=x.reference.cornersPx[0].slice()
 ]){
  const x=scenario();change(x);
  const r=evaluate(x);closed(r);
  assert.equal(r.reason,'BLOCKED_FOLDED_SELF_INTERSECTING_OR_TOO_SMALL_REFERENCE');
 }
});
test('a holdout outside measured plane cannot test this projective region',()=>{
 const x=scenario();x.reference.holdout.positionMm=[250,130];
 const r=evaluate(x);closed(r);
 assert.equal(r.reason,'BLOCKED_INDEPENDENT_HOLDOUT_OUTSIDE_PHYSICAL_REFERENCE');
});
test('reusing a fitted corner cannot masquerade as an independent fifth check',()=>{
 const x=scenario();x.reference.holdout.pixel=x.reference.cornersPx[0].slice();
 x.reference.holdout.positionMm=[2,2];
 const r=evaluate(x);closed(r);
 assert.ok(r.reason==='BLOCKED_FOLDED_SELF_INTERSECTING_OR_TOO_SMALL_REFERENCE'||
  r.reason==='BLOCKED_NOT_INDEPENDENT_FIFTH_FIDUCIAL');
});
test('no original user photo or camera calibration is fabricated when given no input',()=>{
 const r=evaluate();closed(r);
 assert.equal(r.reason,'BLOCKED_ORIGINAL_PHOTO_SOURCE_IDENTITY_NOT_ATTESTED');
});
test('physical photo/source and all reference landmark arrays are immutable',()=>{
 const x=scenario(),before=JSON.stringify(x);
 evaluate({...x,measurementClass:'synthetic'});
 assert.equal(JSON.stringify(x),before);
});
test('a forged reference-only math result can never pass consumer admission',()=>{
 const x=scenario();x.reference.camIntrinsicsVerified=true;
 const r=evaluate({...x,measurementClass:'real-independent'});
 closed(r);
 assert.equal(r.reason,'BLOCKED_MISSING_OR_INVALID_INDEPENDENT_FIDUCIAL');
});
