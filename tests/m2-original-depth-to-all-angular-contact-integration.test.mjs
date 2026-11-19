import assert from 'node:assert/strict';
import test from 'node:test';
import {cameraAxisOriginalPhotoBodyWitness} from
 '../research/parallel89/donor-original-camera-axis-body-contact89.mjs';
const body=[[0,0,0],[2,0,0],[0,2,0]];
const photo=[[.25,.25,.5],[.75,.25,.5],[.25,.75,.5]];
const copy=t=>JSON.parse(JSON.stringify(t));
const repeat=(t,n=128)=>Array.from({length:n},()=>copy(t));
const actualRigUnitMesh=()=>({body:repeat(body),front:repeat(photo)});
test('coplanar contact from 0.5 actual depth, no rotation and actual full face veto',()=>{
 const a=actualRigUnitMesh(),bo=copy(a.body),fr=copy(a.front);
 const r=cameraAxisOriginalPhotoBodyWitness(a.body,a.front,{photoCentroidSamples:8});
 assert.equal(r.decision,'BLOCKED_ACTUAL_PHOTO_FRONT_ANATOMY_CAMERA_AXIS_CONTACT',
  JSON.stringify(r));
 assert.ok(Math.abs(r.trueOriginalDepthContactWitness.photoFrontToActualBodyDepthRigUnits-.5)<1e-9);
 assert.equal(r.trueOriginalDepthContactWitness.chosenExactDepthTranslationRigUnits,.5);
 assert.equal(r.trueOriginalDepthContactWitness.trialDepthAdjustmentRigUnits,0);
 assert.equal(r.trueOriginalDepthContactWitness.genuineSourceBodyTriangleContact,'COPLANAR_OVERLAP');
 assert.equal(r.sourcePhotoFacesIndexed,128);
 assert.equal(r.actualBodyFacesIndexed,128);
 assert.equal(r.entireOriginalBodyFacesIncludedIn2DProjectionGrid,true);
 assert.equal(r.trueOriginalContactProducedWithoutPhotoRotation,true);
 assert.equal(r.fullOriginalIndexedRealContactRefusal.contactDecision,
  'BLOCKED_ACTUAL_ORIGINAL_FRONT_BODY_CONTACT');
 assert.equal(r.fullOriginalIndexedRealContactRefusal.strictGeometricContactObserved,true);
 assert.equal(r.fullOriginalIndexedRealContactRefusal.pairEnumerationStoppedAfterRealContact,true);
 assert.equal(r.fullOriginalIndexedRealContactRefusal.fullOriginalIndexedScopeEvaluated,false);
 assert.equal(r.genuineBodyClothPhysicalFitCertified,false);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 assert.equal(r.familyAlpha,'HOLD');
 assert.deepEqual(a.body,bo);
 assert.deepEqual(a.front,fr);
});
test('slope in real body z gives a genuine depth ray not fake uniform-body plane',()=>{
 const sloped=[[0,0,0],[2,0,.4],[0,2,.2]];
 const r=cameraAxisOriginalPhotoBodyWitness(repeat(sloped),repeat(photo),{
  photoCentroidSamples:8,maxHitCandidates:2048});
 assert.equal(r.decision,'BLOCKED_ACTUAL_PHOTO_FRONT_ANATOMY_CAMERA_AXIS_CONTACT',
  JSON.stringify(r));
 assert.ok(r.trueOriginalDepthContactWitness.photoFrontToActualBodyDepthRigUnits>0);
 assert.ok(r.trueOriginalDepthContactWitness.photoFrontToActualBodyDepthRigUnits<.5);
 assert.ok(['CROSSING','COPLANAR_OVERLAP','TOUCHING'].includes(
  r.trueOriginalDepthContactWitness.genuineSourceBodyTriangleContact));
 assert.equal(r.noActualPhotographicCameraOrReferenceCalibration,true);
 assert.equal(r.consumer3DAdmitted,false);
});
test('XY disjoint actual source photo cannot silently become contact cleared',()=>{
 const moved=photo.map(p=>[p[0]+5,p[1]+5,p[2]]);
 const r=cameraAxisOriginalPhotoBodyWitness(repeat(body),repeat(moved),{
  photoCentroidSamples:8});
 assert.equal(r.decision,'BLOCKED_NO_DEPTH_ONLY_SOURCE_TO_BODY_CONTACT_WITNESS');
 assert.equal(r.actualRaySurfaceHitsInProvisionalRigUnits,0);
 assert.equal(r.trueOriginalDepthContactWitness,null);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
});
test('original photo that is behind body is not incorrectly counted as -Z contact',()=>{
 const backwards=photo.map(p=>[p[0],p[1],-.5]);
 const r=cameraAxisOriginalPhotoBodyWitness(repeat(body),repeat(backwards),{
  photoCentroidSamples:8});
 assert.equal(r.decision,'BLOCKED_NO_DEPTH_ONLY_SOURCE_TO_BODY_CONTACT_WITNESS');
 assert.equal(r.actualRaySurfaceHitsInProvisionalRigUnits,0);
 assert.equal(r.consumer3DAdmitted,false);
});
test('bounded candidate overflow fails closed, not a fabricated measured fit',()=>{
 const a=actualRigUnitMesh();
 const r=cameraAxisOriginalPhotoBodyWitness(a.body,a.front,{
  photoCentroidSamples:8,maxHitCandidates:1});
 assert.equal(r.decision,'BLOCKED_RAY_CANDIDATE_BUDGET',JSON.stringify(r));
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 assert.equal(r.familyAlpha,'HOLD');
});
test('no tiny subset can claim a full real mesh',()=>{
 assert.throws(()=>cameraAxisOriginalPhotoBodyWitness([body],[photo]),
  /full-original-real-body-and-front-face-scope-required/);
 assert.throws(()=>cameraAxisOriginalPhotoBodyWitness(repeat(body),repeat(photo,127)),
  /full-original-real-body-and-front-face-scope-required/);
});
test('invalid original vertex and unsafe scan parameters fail closed',()=>{
 const dirty=repeat(body);dirty[1][0][0]=Infinity;
 assert.throws(()=>cameraAxisOriginalPhotoBodyWitness(dirty,repeat(photo)),
  /nonfinite-original-body-surface/);
 assert.throws(()=>cameraAxisOriginalPhotoBodyWitness(repeat(body),repeat(photo),{
  photoCentroidSamples:10000}),/bounded-real-original-depth-ray-budget-required/);
 assert.throws(()=>cameraAxisOriginalPhotoBodyWitness(repeat(body),repeat(photo),{
  maxBackwardRigUnits:-1}),/bounded-real-original-depth-ray-budget-required/);
});

import {evaluateAllIndexedOriginalSpine04AngularBroadphase as sweep}
 from '../research/parallel89/all-indexed-original-angular-bvh89.mjs';
const otherBoneFrozen={actualRigBoneCount:163,singleMovingNamedBone:'spine04',
 allOtherBoneLocalTransformsFrozen:true,
 sourceCoordinatesReadFromOriginalPositionAttribute:true,
 originalSourceSkinnedMesh:true,
 originalJPEG_SHA256:'a'.repeat(64),
 actualLicensedRigSHA256:'b'.repeat(64)};
const poses=xyz=>Array.from({length:5},()=>Float64Array.from(xyz));
const ids=Uint32Array.from([0,1,2]);
function angularData(depth){
 const fp=photo.flat(),bp=body.flat();
 return {
  frontPoses:poses(fp.map((v,i)=>i%3===2?v-depth:v)),
  bodyPoses:poses(bp),
  frontIndices:ids,bodyIndices:ids,
  deltaRadians:24*Math.PI/180,expectedFrontFaces:1,
  expectedBodyFaces:1,sourceWitness:otherBoneFrozen
 };
}
test('end-to-end bounded depth-only original geometry moves researched floating source into contact BLOCK',()=>{
 const control=cameraAxisOriginalPhotoBodyWitness(repeat(body),repeat(photo),{
  photoCentroidSamples:8});
 assert.equal(control.decision,'BLOCKED_ACTUAL_PHOTO_FRONT_ANATOMY_CAMERA_AXIS_CONTACT');
 const depth=control.trueOriginalDepthContactWitness.chosenExactDepthTranslationRigUnits;
 const before=sweep(angularData(0));
 assert.equal(before.decision,'RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT');
 const after=sweep(angularData(depth));
 assert.equal(after.decision,'BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT');
 assert.equal(after.witness.normalizedTime,0);
 assert.equal(after.witness.contactClass,'COPLANAR_OVERLAP');
 assert.equal(after.allSubmittedOriginalFacesIndexed,true);
 assert.equal(after.consumer3DAdmitted,false);
 assert.equal(after.familyAlpha,'HOLD');
});
test('full angular gate cannot convert donor contact into physical fit even for all submitted faces',()=>{
 const result=sweep(angularData(.5));
 assert.equal(result.physicallyCalibratedSourceFit,false);
 assert.equal(result.fullOriginalPhysicalCollisionCertified,false);
 assert.equal(result.originalFabricDrapeCertified,false);
 assert.equal(result.consumer3DAdmitted,false);
 assert.equal(result.sourceOriginalPhoto2DFallbackRequired,true);
});
test('untested front and body source faces cannot be omitted from depth handoff',()=>{
 const result=sweep({...angularData(.5),expectedFrontFaces:35262,
  expectedBodyFaces:109064});
 assert.equal(result.decision,'BLOCKED_INCOMPLETE_ORIGINAL_INDEXED_SCOPE');
 assert.equal(result.consumer3DAdmitted,false);
});
