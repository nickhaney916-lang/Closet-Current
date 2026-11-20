import assert from 'node:assert/strict';
import test from 'node:test';
import {evaluateTwoSequentialOriginalNamedSpineJoints as evaluate}
 from '../research/parallel89/two-sequential-original-spine-joint-audit89.mjs';
import {evaluateOriginalSingleMovingNamedJointAngularBroadphase as single}
 from '../research/parallel89/parameterized-original-named-joint-angular-bvh89.mjs';

const deg=Math.PI/180;
const f=t=>Float64Array.from([0,0,t,1,0,t,0,1,t]);
const poses=fn=>[0,.25,.5,.75,1].map(t=>f(fn(t)));
const witness={
 actualRigBoneCount:163,allOtherBoneLocalTransformsFrozen:true,
 sourceCoordinatesReadFromOriginalPositionAttribute:true,
 originalSourceSkinnedMesh:true,originalJPEG_SHA256:'a'.repeat(64),
 actualLicensedRigSHA256:'b'.repeat(64)
};
const cfg=(bodyStageB=()=>0)=>({
 segments:[
  {movingNamedJoint:'spine03',anglesDeg:[-6,-3,0,3,6],
   otherOriginalSpineJointHeldDeg:-12,
   frontPoses:poses(()=>3),bodyPoses:poses(()=>0)},
  {movingNamedJoint:'spine04',anglesDeg:[-12,-6,0,6,12],
   otherOriginalSpineJointHeldDeg:6,
   frontPoses:poses(()=>3),bodyPoses:poses(bodyStageB)}
 ],
 frontIndices:Uint32Array.from([0,1,2]),
 bodyIndices:Uint32Array.from([0,1,2]),
 expectedFrontFaces:1,expectedBodyFaces:1,sourceWitness:witness
});

test('complete genuine-math consecutive two LBS segments remain RESEARCH ONLY, never wearable',()=>{
 const x=evaluate(cfg());
 assert.equal(x.decision,'RESEARCH_ONLY_TWO_SEQUENTIAL_FIXED_AXIS_JOINT_SEGMENTS_DISJOINT');
 assert.equal(x.bothSegmentsComputed,true);
 assert.equal(x.completeTwoSequentialSegmentEnvelopeChecks,true);
 assert.equal(x.continuousJoinVerifiedForEveryOriginalSourceAndBodyVertex,true);
 assert.deepEqual(x.twoNamedSequentialOriginalJoints,['spine03','spine04']);
 assert.equal(x.concurrentTwoJointMotionAudited,false);
 assert.equal(x.consumer3DAdmitted,false);
 assert.equal(x.familyAlpha,'HOLD');
 for(const s of x.segmentAudits){
  assert.equal(s.decision,'RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT');
  assert.equal(s.originalFrontFaceCount,1);
  assert.equal(s.originalBodyFaceCount,1);
  assert.equal(s.fullAllOriginalFrontAndBodyAngularBroadphaseCompleted,true);
 }
});
test('segment B real exact TRUE contact rejects entire ordered motion',()=>{
 const d=24*deg;
 const x=evaluate(cfg(t=>3*Math.sin(d*t)/Math.sin(d)));
 assert.equal(x.decision,'BLOCKED_TRUE_ORIGINAL_CONTACT_ON_SEQUENTIAL_JOINT_PATH');
 assert.equal(x.decisiveJoint,'spine04');
 assert.equal(x.actualContactWitness.normalizedTime,1);
 assert.equal(x.actualContactWitness.contactClass,'COPLANAR_OVERLAP');
 assert.equal(x.consumer3DAdmitted,false);
});
test('between quarter-pose contact possibility cannot claim safe even with no observed sample hit',()=>{
 const d=24*deg;
 const x=evaluate(cfg(t=>2.9*Math.sin(d*t)/Math.sin(d)));
 assert.equal(x.decision,'BLOCKED_UNRESOLVED_OR_BUDGETED_SEQUENTIAL_JOINT_PATH');
 assert.equal(x.exactUnresolvedCause,'BLOCKED_UNRESOLVED_FULL_INDEXED_ANGULAR_CONTACT');
 assert.equal(x.consumer3DAdmitted,false);
});
test('nonfinite/discontinuous original joint boundary BLOCKS before math evaluator',()=>{
 const x=cfg();x.segments[1].frontPoses[0][0]=.01;
 const y=evaluate(x);
 assert.equal(y.decision,'BLOCKED_DISCONNECTED_OR_NONFINITE_ACTUAL_SKELETAL_POSE_PATH');
 assert.ok(y.maximumOriginalPoseJoinXYZDifferenceRigUnits>.001);
 const z=cfg();z.segments[1].bodyPoses[0][1]=NaN;
 assert.equal(evaluate(z).decision,'BLOCKED_DISCONNECTED_OR_NONFINITE_ACTUAL_SKELETAL_POSE_PATH');
});
test('refuse simultaneously changing both bones and any false joint sequencing',()=>{
 const x=cfg();x.segments[0].movingNamedJoint='spine03+spine04';
 assert.equal(evaluate(x).decision,'BLOCKED_UNVERIFIED_ORIGINAL_JOINT_SEQUENCE_OR_AXES');
 const z=cfg();z.segments[0].otherOriginalSpineJointHeldDeg=0;
 assert.equal(evaluate(z).decision,'BLOCKED_UNVERIFIED_ORIGINAL_JOINT_SEQUENCE_OR_AXES');
 const w=cfg();w.segments.reverse();
 assert.equal(evaluate(w).decision,'BLOCKED_UNVERIFIED_ORIGINAL_JOINT_SEQUENCE_OR_AXES');
});
test('missing second actual segment and unsupported angle path fail shut',()=>{
 const x=cfg();x.segments.pop();
 assert.equal(evaluate(x).decision,'BLOCKED_INCOMPLETE_SEQUENTIAL_ORIGINAL_JOINT_PATH');
 const y=cfg();y.segments[1].anglesDeg=[0,6,12,18,24];
 assert.equal(evaluate(y).decision,'BLOCKED_UNVERIFIED_ORIGINAL_JOINT_SEQUENCE_OR_AXES');
});
test('original JPEG/model source SHA, 163 bones and frozen source/pose must be asserted',()=>{
 const x=cfg();x.sourceWitness.originalJPEG_SHA256='foreign';
 assert.equal(evaluate(x).decision,'BLOCKED_UNVERIFIED_ORIGINAL_RIG_SOURCE_OR_LOCAL_BONE_POSES');
 const y=cfg();y.sourceWitness.allOtherBoneLocalTransformsFrozen=false;
 assert.equal(evaluate(y).decision,'BLOCKED_UNVERIFIED_ORIGINAL_RIG_SOURCE_OR_LOCAL_BONE_POSES');
});
test('full original face counts cannot hide sampled-only geometry',()=>{
 const x=cfg();x.expectedFrontFaces=35262;x.expectedBodyFaces=109064;
 assert.equal(evaluate(x).decision,'BLOCKED_INCOMPLETE_TRUE_ORIGINAL_INDEXED_FACE_COVERAGE');
});
test('actual original 3D arrays immutable through two full audits',()=>{
 const x=cfg(),start=x.segments[1].bodyPoses[3].slice(),
  front=x.segments[0].frontPoses[0].slice();
 evaluate(x);
 assert.deepEqual(x.segments[1].bodyPoses[3],start);
 assert.deepEqual(x.segments[0].frontPoses[0],front);
});
test('resource exhaustion NEVER reports full two-joint clearance',()=>{
 const d=24*deg;
 const x=evaluate({...cfg(t=>2.9*Math.sin(d*t)/Math.sin(d)),
  maxNarrowphasePairs:1});
 assert.ok(x.decision.startsWith('BLOCKED_'));
 assert.equal(x.consumer3DAdmitted,false);
 assert.equal(x.concurrentTwoJointMotionAudited,false);
});
test('single-axis original mathematical evaluator accepts only explicitly named bone',()=>{
 const x=cfg();const s=x.segments[0];
 const base={frontPoses:s.frontPoses,bodyPoses:s.bodyPoses,
  frontIndices:x.frontIndices,bodyIndices:x.bodyIndices,
  deltaRadians:12*deg,expectedFrontFaces:1,expectedBodyFaces:1,
  sourceWitness:{...witness,singleMovingNamedBone:'spine03'}};
 assert.equal(single({...base,movingNamedJoint:'spine03'}).decision,
  'RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT');
 assert.equal(single({...base,movingNamedJoint:'shoulder01'}).decision,
  'BLOCKED_UNSUPPORTED_SINGLE_NAMED_ORIGINAL_JOINT');
});
test('both intervals must independently validate harmonic quarter-pose witness',()=>{
 const x=cfg();x.segments[0].frontPoses[1][2]=100;
 const y=evaluate(x);
 assert.equal(y.decision,'BLOCKED_UNRESOLVED_OR_BUDGETED_SEQUENTIAL_JOINT_PATH');
 assert.equal(y.exactUnresolvedCause,'BLOCKED_NONHARMONIC_TRUE_ORIGINAL_VERTEX_MOTION');
 assert.equal(y.consumer3DAdmitted,false);
});
