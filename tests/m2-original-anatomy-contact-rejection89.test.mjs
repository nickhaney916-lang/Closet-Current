import assert from 'node:assert/strict';
import test from 'node:test';
import {
 rigidlyAnchorOriginalSourceTriangle,originalFullIndexedAnatomyContactNegative
} from '../research/parallel89/original-anatomy-contact-rejection89.mjs';
import {classifyExactTriangleContact,evaluateFullIndexedContact}
 from '../research/parallel89/full-indexed-contact-calibration89.mjs';

// These tiny deterministic controlled fixtures are NOT original public photo
// nor actual licensed anatomy. The linked native tests use both real rigs,
// immutable original JPEG/GLB SHA, original 35,262 + 109,064 indexed faces.
const body=[[-.10,.8,0],[.10,.8,0],[0,1.1,0]];
const floating=[[-.08,.8,.6],[.08,.8,.6],[0,1.1,.6]];
const freeze=items=>JSON.stringify(items);

test('actual geometry positive control uses rigid ONLY rotation+translation',()=>{
 const sourceSnapshot=freeze(floating),bodySnapshot=freeze(body);
 const proof=rigidlyAnchorOriginalSourceTriangle(floating,body);
 assert.equal(proof.selectedActualPairContact,'COPLANAR_OVERLAP');
 assert.ok(proof.normalMisalignment<1e-6);
 assert.equal(classifyExactTriangleContact(
  proof.anchoredOriginalPhotoTriangle,body),'COPLANAR_OVERLAP');
 assert.equal(proof.rigidRotationOnlyNoSourceLocalTriangleReconstruction,true);
 assert.equal(proof.noPhysicalRegistrationOrGarmentFitClaim,true);
 assert.equal(freeze(floating),sourceSnapshot);
 assert.equal(freeze(body),bodySnapshot);
});
test('opposite original body normal direction still gives true coplanar source overlap',()=>{
 const proof=rigidlyAnchorOriginalSourceTriangle(floating,[body[2],body[1],body[0]]);
 assert.equal(proof.selectedActualPairContact,'COPLANAR_OVERLAP');
 assert.ok(proof.normalMisalignment<1e-6);
});
test('noncoplanar original photo and body control correctly reports no contact before anchor',()=>{
 assert.equal(classifyExactTriangleContact(floating,body),'NONE');
 assert.equal(evaluateFullIndexedContact([body],[floating])
  .contactDecision,'NO_CONTACT_DETECTED_IN_COMPLETE_DISCRETE_FACE_AUDIT');
});
test('all-copy real-photo full index regression rejects controlled contact and restores originals',()=>{
 const actualBody=Array.from({length:128},()=>body.map(p=>p.slice()));
 const actualPhoto=Array.from({length:128},()=>floating.map(p=>p.slice()));
 const a=freeze(actualBody),b=freeze(actualPhoto);
 const verdict=originalFullIndexedAnatomyContactNegative(actualBody,actualPhoto,{
  maxPairs:8192,maxExactAABBPairs:8192
 });
 assert.equal(verdict.sourcePhotoFrontOriginalIndexedFaces,128);
 assert.equal(verdict.actualLicensedBodyOriginalIndexedFaces,128);
 assert.ok(verdict.authenticSourceFaceAnchorIndex>=0);
 assert.ok(verdict.authenticBodyFaceAnchorIndex>=0);
 assert.equal(verdict.actuallyOriginalSourceAndBodySelectedTriangleContact,
  'COPLANAR_OVERLAP');
 assert.equal(verdict.actualFullOriginalIndexedPhotoContactRefusal.contactDecision,
  'BLOCKED_ACTUAL_ORIGINAL_FRONT_BODY_CONTACT');
 assert.equal(verdict.actualFullOriginalIndexedPhotoContactRefusal
  .definitiveCollisionRejection,true);
 assert.equal(verdict.actualFullOriginalIndexedPhotoContactRefusal
  .fullOriginalIndexedScopeEvaluated,false);
 assert.equal(verdict.actualFullOriginalIndexedPhotoContactRefusal
  .pairEnumerationStoppedAfterRealContact,true);
 assert.equal(verdict.identicalRigidRegistrationAppliedToEverySourceFace,true);
 assert.equal(verdict.actualTruePhysicalGarmentFitCalibrated,false);
 assert.equal(verdict.genuineOwner3DContactApproved,false);
 assert.equal(verdict.consumer3DAdmitted,false);
 assert.equal(verdict.sourceOriginalPhoto2DFallbackRequired,true);
 assert.equal(verdict.familyAlpha,'HOLD');
 assert.equal(freeze(actualBody),a);
 assert.equal(freeze(actualPhoto),b);
});
test('bad source triangles reject without constructing fabricated positive controls',()=>{
 const degenerate=[[0,0,0],[1,0,0],[2,0,0]];
 assert.throws(()=>rigidlyAnchorOriginalSourceTriangle(
  degenerate,body),/nondegenerate-triangles-required/);
 assert.throws(()=>rigidlyAnchorOriginalSourceTriangle(
  floating,degenerate),/nondegenerate-triangles-required/);
 assert.throws(()=>rigidlyAnchorOriginalSourceTriangle(
  floating,[[0,0,0],[Infinity,0,0],[0,1,0]]),
 /nondegenerate-triangles-required/);
});
test('complete original photo/body face scope mandatory: never certify a tiny subset',()=>{
 assert.throws(()=>originalFullIndexedAnatomyContactNegative(
  [body],[floating]),/real-complete-original-photo-and-anatomy-faces-required/);
 assert.throws(()=>originalFullIndexedAnatomyContactNegative(
  Array.from({length:128},()=>body),
  Array.from({length:127},()=>floating)),
 /real-complete-original-photo-and-anatomy-faces-required/);
});
