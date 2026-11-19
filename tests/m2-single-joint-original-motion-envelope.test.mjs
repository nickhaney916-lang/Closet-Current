import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateFixedAxisLbsRotationalEnvelope as evaluate}
 from '../research/parallel89/single-joint-rotation-envelope89.mjs';
const delta=24*Math.PI/180;
const grid=[0,.25,.5,.75,1];
const sha='a'.repeat(64);
const sourceWitness={realOriginalRigSHA256:sha,originalSourceJPEG_SHA256:sha,
 actualRigBoneCount:163,singleNamedMovingBone:'spine04',
 originalSourceSkinnedMesh:true,allOtherBoneLocalPosesUnchanged:true,
 originalRigAndSourceBuffersUnchanged:true};
const face=(x=0,y=0,z=0)=>[
 [x,y,z],[x+1,y,z],[x,y+1,z]
];
const stationary=(f)=>grid.map(()=>[f.map(p=>p.slice())]);
const harmonic=(fn)=>grid.map(t=>[fn((t-.5)*delta)]);
const baseline=()=>({angleDeltaRadians:delta,
 frontPoseFaces:stationary(face(0,0,3)),
 bodyPoseFaces:stationary(face()),
 totalOriginalFrontFaces:35000,totalOriginalBodyFaces:109000,
 sourceWitness});
test('genuine mathematically separated nonlinear envelopes remain only source SUBSET research',()=>{
 const proof=evaluate(baseline());
 assert.equal(proof.decision,'RESEARCH_ONLY_SAMPLED_ROTATIONAL_ENVELOPES_SEPARATED');
 assert.equal(proof.sampledOriginalFrontFaces,1);
 assert.equal(proof.sampledOriginalBodyFaces,1);
 assert.equal(proof.allOriginalFrontFacesSubmitted,false);
 assert.equal(proof.fullOriginalIndexedScopeEvaluated,false);
 assert.equal(proof.consumer3DAdmitted,false);
 assert.equal(proof.familyAlpha,'HOLD');
});

test('actual five-pose fixed-axis harmonic mid-bend face contact vetoes',()=>{
 const front=harmonic(a=>face(0,0,3*Math.sin(a)));
 const out=evaluate({...baseline(),frontPoseFaces:front});
 assert.equal(out.decision,'BLOCKED_REAL_POSE_FACE_CONTACT');
 assert.equal(out.contactWitness.normalizedTime,.5);
 assert.equal(out.contactWitness.contactClass,'COPLANAR_OVERLAP');
 assert.equal(out.originalFullSurfaceMotionContactCertified,false);
});

test('crossing possible strictly between discrete poses must BLOCK',()=>{
 const front=harmonic(a=>face(0,0,3*Math.sin(a)));
 const body=stationary(face(0,0,.1));
 const out=evaluate({...baseline(),frontPoseFaces:front,
  bodyPoseFaces:body});
 assert.equal(out.decision,'BLOCKED_UNRESOLVED_ROTATIONAL_CONTACT');
 assert.equal(out.completeEvaluated,true);
 assert.equal(out.overlappingEnvelopePairs,1);
 assert.equal(out.consumer3DAdmitted,false);
});

test('adversarial nonharmonic quarter-sample spike is blocked',()=>{
 const front=stationary(face(0,0,3));
 front[1][0][1][2]=5;
 const out=evaluate({...baseline(),frontPoseFaces:front});
 assert.equal(out.decision,'BLOCKED_NON_HARMONIC_ACTUAL_POSE_WITNESS');
 assert.ok(out.maximumQuarterPoseHarmonicResidualRigUnits>1);
});

test('all supplied faces plus forged original-looking source flags never authorize 3D',()=>{
 const v=baseline();
 v.totalOriginalFrontFaces=1;v.totalOriginalBodyFaces=1;
 const out=evaluate(v);
 assert.equal(out.decision,
  'RESEARCH_ONLY_COMPLETE_SUBMITTED_ROTATIONAL_ENVELOPES_SEPARATED');
 assert.equal(out.sourceWitnessSelfReportedNotCryptographicallyAuthenticated,true);
 assert.equal(out.fullOriginalIndexedScopeEvaluated,false);
 assert.equal(out.consumer3DAdmitted,false);
});

test('overlapping original face AABBs cannot defeat hard budget refusal',()=>{
 const f=face(0,0,0),b=face(.8,.8,0);
 const v={...baseline(),frontPoseFaces:grid.map(()=>[f,f,f]),
  bodyPoseFaces:grid.map(()=>[b,b,b]),maxCandidatePairs:1};
 const out=evaluate(v);
 assert.equal(out.decision,'BLOCKED_ROTATION_ENVELOPE_RESOURCE_LIMIT');
 assert.equal(out.completeEvaluated,false);
 assert.equal(out.consumer3DAdmitted,false);
});

test('unsupported multiple moving joints or generic simulation must be rejected',()=>{
 const out=evaluate({...baseline(),model:'multi-joint-or-cloth'});
 assert.equal(out.decision,'BLOCKED_NON_SINGLE_JOINT_MOTION_MODEL');
 assert.equal(out.consumer3DAdmitted,false);
});

test('real original malformed face or invalid angular motion rejects input',()=>{
 const val=baseline();
 for(const angle of [0,NaN,Infinity,.00001,3.2])
  assert.throws(()=>evaluate({...val,angleDeltaRadians:angle}),
   /single-joint-sweep-input-or-budget-invalid/);
 for(const limit of [0,NaN,Infinity,-2,1.2])
  assert.throws(()=>evaluate({...val,maxCandidatePairs:limit}),
   /single-joint-sweep-input-or-budget-invalid/);
 const invalid=stationary(face());
 invalid[2][0][2][0]=Infinity;
 assert.throws(()=>evaluate({...val,frontPoseFaces:invalid}),
  /single-joint-sweep-original-face-arrays-invalid/);
});

test('true nonzero sine/cosine world trajectories pass five-pose harmonic consistency',()=>{
 const front=harmonic(a=>face(
  .8*Math.cos(a)-.1*Math.sin(a),
  .5*Math.sin(a)+.1*Math.cos(a),2.5));
 const out=evaluate({...baseline(),frontPoseFaces:front});
 assert.equal(out.decision,'RESEARCH_ONLY_SAMPLED_ROTATIONAL_ENVELOPES_SEPARATED');
 assert.ok(out.maximumQuarterPoseHarmonicResidualRigUnits<1e-6);
 assert.ok(out.maximumConservativePerCoordinateInflationRigUnits>.0001);
});

test('fake reported source, no actual cryptographic authentication, cannot clear fit',()=>{
 const out=evaluate({...baseline(),sourceWitness:{actualRigBoneCount:163}});
 assert.equal(out.sourceWitnessSelfReportedNotCryptographicallyAuthenticated,true);
 assert.equal(out.originalRigContractStructurallyChecked,false);
 assert.equal(out.physicalFitCertified,false);
 assert.equal(out.consumer3DAdmitted,false);
});
