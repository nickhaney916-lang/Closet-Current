import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateAllIndexedOriginalSpine04AngularBroadphase as evaluate}
 from '../research/parallel89/all-indexed-original-angular-bvh89.mjs';

const theta=24*Math.PI/180,times=[0,.25,.5,.75,1],
 witness={actualRigBoneCount:163,singleMovingNamedBone:'spine04',
  allOtherBoneLocalTransformsFrozen:true,
  sourceCoordinatesReadFromOriginalPositionAttribute:true,
  originalSourceSkinnedMesh:true,originalJPEG_SHA256:'a'.repeat(64),
  actualLicensedRigSHA256:'b'.repeat(64)};
const plane=(z=0)=>[0,0,z,1,0,z,0,1,z];
const seq=fn=>times.map(t=>Float64Array.from(fn((t-.5)*theta)));
const stationary=z=>seq(()=>plane(z));
const config=(front=stationary(3),body=stationary(0))=>({
 frontPoses:front,bodyPoses:body,
 frontIndices:Uint32Array.from([0,1,2]),
 bodyIndices:Uint32Array.from([0,1,2]),
 expectedFrontFaces:1,expectedBodyFaces:1,
 deltaRadians:theta,sourceWitness:witness
});
const add=arr=>arr.map(p=>Array.from(p));
test('all original indexed disjoint angular envelopes: research only, never fitted',()=>{
 const x=evaluate(config());
 assert.equal(x.decision,'RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT');
 assert.equal(x.fullAllOriginalFrontAndBodyAngularBroadphaseCompleted,true);
 assert.equal(x.allOriginalBodyFacesPresentInSweptBVH,true);
 assert.equal(x.originalFrontFaceCount,1);assert.equal(x.originalBodyFaceCount,1);
 assert.equal(x.consumer3DAdmitted,false);
 assert.equal(x.realOriginalBodyClothFitCertified,false);
 assert.equal(x.sourceWitnessSelfReportedNotIndependentAuthentication,true);
 assert.equal(x.familyAlpha,'HOLD');
});
test('genuine original coplanar middle-pose direct contact blocks',()=>{
 const f=seq(a=>plane(3*Math.sin(a)));
 const x=evaluate(config(f));
 assert.equal(x.decision,'BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT');
 assert.equal(x.witness.normalizedTime,.5);
 assert.equal(x.witness.contactClass,'COPLANAR_OVERLAP');
 assert.equal(x.consumer3DAdmitted,false);
});
test('only BETWEEN original five discrete poses can touch -> unresolved BLOCK',()=>{
 const f=seq(a=>plane(3*Math.sin(a)));
 const x=evaluate(config(f,stationary(.1)));
 assert.equal(x.decision,'BLOCKED_UNRESOLVED_FULL_INDEXED_ANGULAR_CONTACT');
 assert.equal(x.fullAllOriginalFrontAndBodyAngularBroadphaseCompleted,true);
 assert.ok(x.overlappingOriginalAngularEnvelopes>0);
 assert.equal(x.exactDiscreteOriginalFaceTests,5);
});
test('ALL original face indexed scopes mandatory, no sampled omission',()=>{
 const x=evaluate({...config(),expectedFrontFaces:2});
 assert.equal(x.decision,'BLOCKED_INCOMPLETE_ORIGINAL_INDEXED_SCOPE');
 assert.equal(x.consumer3DAdmitted,false);
});
test('invalid actual original source hash/rig contract does not pass',()=>{
 const x=evaluate({...config(),sourceWitness:{...witness,
  actualLicensedRigSHA256:'INVALID'}});
 assert.equal(x.decision,'BLOCKED_UNVERIFIED_ORIGINAL_SKELETON_WITNESS');
});
test('nonlinear multi-bone animation explicitly denied',()=>{
 const x=evaluate({...config(),kinematicModel:'many-bones/cloth'});
 assert.equal(x.decision,'BLOCKED_UNVERIFIED_COMPLEX_SKIN_OR_FABRIC_MOTION');
});
test('quarter-pose nonharmonic forged middle deviation refused',()=>{
 const f=add(stationary(3));f[1][2]=10;
 const x=evaluate(config(f));
 assert.equal(x.decision,'BLOCKED_NONHARMONIC_TRUE_ORIGINAL_VERTEX_MOTION');
 assert.ok(x.maxHarmonicQuarterPoseResidualRigUnits>1);
});
test('nonfinite input vertex must fail closed',()=>{
 const f=add(stationary(3));f[4][5]=NaN;
 const x=evaluate(config(f));
 assert.equal(x.decision,'BLOCKED_NONFINITE_TRUE_ORIGINAL_VERTEX_TRAJECTORY');
});
test('missing source or body vertex index refused',()=>{
 const x=evaluate({...config(),bodyIndices:Uint32Array.from([0,1,4])});
 assert.equal(x.decision,'BLOCKED_ORIGINAL_VERTEX_INDEX_INVALID');
});
test('collapsed true original front or anatomical body face cannot create false clearance',()=>{
 const b=stationary(0).map(()=>Float64Array.from([0,0,0,0,0,0,0,0,0]));
 const x=evaluate(config(stationary(3),b));
 assert.equal(x.decision,'BLOCKED_DEGENERATE_TRUE_ORIGINAL_BODY_FACE');
});
test('actual maximum-face cap explicitly denies full coverage rather than sampling',()=>{
 const x=evaluate({...config(),maxTotalFaces:1});
 assert.equal(x.decision,'BLOCKED_ORIGINAL_ALL_FACE_CAP_OR_COUNT');
});
test('genuine exact leaf collision pair budget refuses rather than silent skipping',()=>{
 const cfg=config(seq(a=>plane(3*Math.sin(a))),stationary(.1));
 cfg.frontIndices=Uint32Array.from([0,1,2,0,1,2]);
 cfg.bodyIndices=Uint32Array.from([0,1,2,0,1,2]);
 cfg.expectedFrontFaces=2;cfg.expectedBodyFaces=2;
 cfg.maxLeafPairTests=1;
 const x=evaluate(cfg);
 assert.equal(x.decision,'BLOCKED_ANGULAR_FACE_PAIR_BUDGET');
 assert.equal(x.consumer3DAdmitted,false);
});
test('five genuine harmonic rotated original vertices yield finite true angular bounds',()=>{
 const front=seq(a=>{
  const rot=(x,y)=>[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a),3];
  return [...rot(0,0),...rot(1,0),...rot(0,1)];
 });
 const x=evaluate(config(front));
 assert.equal(x.decision,'RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT');
 assert.ok(x.maxHarmonicQuarterPoseResidualRigUnits<1e-8);
 assert.ok(x.maxConservativeEnvelopeInflationRigUnits>.0001);
 assert.ok(x.minimumOriginalFrontDoubleAreaRigUnitsSquared>.9);
});
test('resource caps on body BVH queries cannot silently claim contact safety',()=>{
 const cfg=config(seq(a=>plane(3*Math.sin(a))),stationary(.1));
 cfg.frontIndices=Uint32Array.from([0,1,2,0,1,2]);
 cfg.expectedFrontFaces=2;cfg.maxBodyBVHVisits=1;
 const x=evaluate(cfg);
 assert.equal(x.decision,'BLOCKED_ANGULAR_BVH_VISIT_BUDGET');
 assert.equal(x.fullAllOriginalFrontAndBodyAngularBroadphaseCompleted,false);
});
test('safe handling of strict malformed delta and declared counts',()=>{
 assert.throws(()=>evaluate({...config(),deltaRadians:Infinity}),
  /original-all-face-angular-sweep-unsafe-input/);
 assert.throws(()=>evaluate({...config(),maxNarrowphasePairs:0}),
  /original-all-face-angular-sweep-unsafe-input/);
 assert.throws(()=>evaluate({...config(),frontPoses:[]}),
  /original-all-face-angular-sweep-unsafe-input/);
});

test('angular padding is added ONCE per true vertex, not repeatedly per three face corners',()=>{
 // A fixed pair 0.00025 rig units apart is outside the symmetric 0.0001
 // per-vertex numerical margins. A historic face-loop implementation
 // erroneously added the same margin three times, inventing BVH overlaps.
 const x=evaluate(config(stationary(.00025),stationary(0)));
 assert.equal(x.decision,'RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT');
 assert.equal(x.overlappingOriginalAngularEnvelopes,0);
 assert.equal(x.maxConservativeEnvelopeInflationRigUnits,.0001);
 assert.equal(x.fullAllOriginalFrontAndBodyAngularBroadphaseCompleted,true);
 assert.equal(x.consumer3DAdmitted,false);
});
