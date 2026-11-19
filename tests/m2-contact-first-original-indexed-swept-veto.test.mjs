import test from 'node:test';
import assert from 'node:assert/strict';
import {checkOriginalIndexedContactBeforeSweptBVH as check}
 from '../research/parallel89/contact-first-original-indexed-swept-veto89.mjs';
const pose=z=>Float64Array.from([0,0,z,1,0,z,0,1,z]);
const sha='a'.repeat(64);
const cfg=()=>({
 frontPoses:Array.from({length:5},()=>pose(.5)),
 bodyPoses:Array.from({length:5},()=>pose(0)),
 frontIndices:Uint32Array.from([0,1,2]),
 bodyIndices:Uint32Array.from([0,1,2]),
 expectedFrontFaces:1,expectedBodyFaces:1,
 originalFrontFace:0,originalBodyFace:0,rigDepthShift:.5,
 sourceWitness:{originalJPEG_SHA256:sha,originalLicensedRigSHA256:sha,
  actualRigBoneCount:163,correctedPositionAttributeWorldSkinning:true,
  oneNamedJointOnly:'spine04',otherBoneLocalPosesFrozen:true}
});
test('exact original front contact before BVH is a sound EARLY BLOCK',()=>{
 const x=check(cfg());
 assert.equal(x.decision,'BLOCKED_TRUE_ORIGINAL_INDEXED_CONTACT_BEFORE_BVH');
 assert.equal(x.witnessClass,'COPLANAR_OVERLAP');
 assert.equal(x.soundEarlyExitRequiresNoAdditionalPairs,true);
 assert.equal(x.fullOriginalAngularBroadphaseCompleted,false);
 assert.equal(x.noFullNegativeContactClaim,true);
 assert.equal(x.originalBodyGarmentPhysicalFitCertified,false);
 assert.equal(x.consumer3DAdmitted,false);
 assert.equal(x.familyAlpha,'HOLD');
});
test('separated original full-scope photo never converts to physical clearance',()=>{
 const x=check({...cfg(),rigDepthShift:0});
 assert.equal(x.decision,'BLOCKED_UNPROVEN_ORIGINAL_TRUE_FACE_CONTACT');
 assert.equal(x.consumer3DAdmitted,false);
});
test('all 5 pose finite coordinates and full original indexed faces mandatory',()=>{
 const s=cfg();s.frontPoses[3][7]=NaN;
 assert.equal(check(s).decision,'BLOCKED_NONFINITE_ORIGINAL_SKINNED_VERTEX');
 const bad=cfg();bad.expectedFrontFaces=2;
 assert.equal(check(bad).decision,'BLOCKED_ORIGINAL_WITNESS_INCOMPLETE_INDEXED_SCOPE');
});
test('malformed original front index and impossible source witness both blocked',()=>{
 const missing=cfg();missing.bodyIndices=Uint32Array.from([0,1,3]);
 assert.equal(check(missing).decision,'BLOCKED_ORIGINAL_INDEX_OUTSIDE_TRUE_VERTEX_BUFFER');
 const absent=cfg();delete absent.sourceWitness.oneNamedJointOnly;
 assert.equal(check(absent).decision,'BLOCKED_UNVERIFIED_ORIGINAL_RIG_IDENTITY_OR_SKINNING');
});
test('false camera orientation, negative depth or oversized resource cap cannot falsely clear',()=>{
 assert.equal(check({...cfg(),rigDepthShift:-1}).decision,
  'BLOCKED_ORIGINAL_CONTACT_WITNESS_INVALID');
 assert.equal(check({...cfg(),maxTotalInputScalars:15}).decision,
  'BLOCKED_ORIGINAL_WITNESS_VERTEX_SHAPE_OR_CAP');
});
test('contact witness cannot mutate authentic source or body buffers',()=>{
 const s=cfg();
 const front=Array.from(s.frontPoses[2]),body=Array.from(s.bodyPoses[2]);
 check(s);
 assert.deepEqual(Array.from(s.frontPoses[2]),front);
 assert.deepEqual(Array.from(s.bodyPoses[2]),body);
});
