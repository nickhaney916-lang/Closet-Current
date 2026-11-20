import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateOriginalSimultaneousSpine03Spine04AngularBroadphase as evaluate}
 from '../research/parallel89/simultaneous-two-original-spine-joint-bvh89.mjs';

const radians=d=>d*Math.PI/180;
const T=[0,.25,.5,.75,1];
const faces=Uint32Array.from([0,1,2]);
const witness={
 actualRigBoneCount:163,
 simultaneousMovingNamedBones:['spine03','spine04'],
 other161BoneLocalTransformsFrozen:true,
 independentOriginalSourceJointPoses:true,
 sourceCoordinatesReadFromOriginalPositionAttribute:true,
 originalSourceSkinnedMesh:true,
 originalJPEG_SHA256:'a'.repeat(64),
 actualLicensedRigSHA256:'b'.repeat(64)
};
const originalTriangle=(a,b,{baseline=3,moving=true}={})=>{
 const x=radians(a),y=radians(b),
  xc=moving?.05*Math.sin(x)+.02*Math.sin(y)*Math.cos(x):0,
  yc=moving?.04*Math.sin(y)-.02*Math.sin(x)*Math.sin(y):0,
  z=baseline+(moving?.25*Math.sin(x)+.15*Math.sin(y)+
    .05*Math.sin(x)*Math.sin(y):0);
 return Float64Array.from([xc,yc,z,xc+1,yc,z,xc,yc+1,z]);
};
function setup({frontBaseline=3,bodyBaseline=0,
 frontMoving=true,bodyMoving=true}={}){
 const f=(a,b)=>originalTriangle(a,b,{baseline:frontBaseline,
   moving:frontMoving});
 const q=(a,b)=>originalTriangle(a,b,{baseline:bodyBaseline,
   moving:bodyMoving});
 const gridPairs=[-6,0,6].flatMap(a=>[-12,0,12].map(b=>[a,b]));
 const pathPairs=T.map(t=>[-6+12*t,-12+24*t]);
 const heldPairs=[[-3,6],[3,-6]];
 return {
  frontGridPoses:gridPairs.map(([a,b])=>f(a,b)),
  bodyGridPoses:gridPairs.map(([a,b])=>q(a,b)),
  frontPoses:pathPairs.map(([a,b])=>f(a,b)),
  bodyPoses:pathPairs.map(([a,b])=>q(a,b)),
  independentOffDiagonalHoldouts:heldPairs.map(([a,b])=>({
   anglesDeg:[a,b],frontVertices:f(a,b),bodyVertices:q(a,b)
  })),
  frontIndices:faces,bodyIndices:faces,
  expectedFrontFaces:1,expectedBodyFaces:1,
  sourceWitness:{...witness,
   simultaneousMovingNamedBones:[...witness.simultaneousMovingNamedBones]}
 };
}
test('two original simultaneous original-joint Fourier cross terms are enclosed through full path',()=>{
 const res=evaluate(setup());
 assert.equal(res.decision,'RESEARCH_ONLY_FULL_INDEXED_SIMULTANEOUS_TWO_JOINT_PATH_ENVELOPES_DISJOINT');
 assert.equal(res.fullOriginalTwoJointSimultaneousPathSweptBroadphaseCompleted,true);
 assert.equal(res.originalGrid3x3BothActualBonesPoseBuffersPresent,true);
 assert.equal(res.originalIndependentNonDiagonalPoseHoldoutsVerified,true);
 assert.equal(res.allSubmittedOriginalFacesIndexed,true);
 assert.equal(res.originalFrontFaceCount,1);
 assert.equal(res.originalBodyFaceCount,1);
 assert.ok(res.maxTwoAngleHarmonicResidualRigUnits<1e-8);
 assert.ok(res.maxConservativeEnvelopeInflationRigUnits>1e-4);
 assert.equal(res.arbitrary2DJointAngleRectangleAudited,false);
 assert.equal(res.consumer3DAdmitted,false);
 assert.equal(res.familyAlpha,'HOLD');
});
test('real original-surface contact while both spine joints move simultaneously must BLOCK',()=>{
 const res=evaluate(setup({frontBaseline:0,bodyBaseline:0}));
 assert.equal(res.decision,'BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT');
 assert.ok(['COPLANAR_OVERLAP','CROSSING','TOUCHING'].includes(res.witness.contactClass));
 assert.equal(res.consumer3DAdmitted,false);
});
test('conflicting independently HELD-OUT off-diagonal sample rejects forged bilinear model',()=>{
 const x=setup();x.independentOffDiagonalHoldouts[0].frontVertices[1]+=.15;
 const y=evaluate(x);
 assert.equal(y.decision,'BLOCKED_NONBILINEAR_TRUE_ORIGINAL_TWO_JOINT_MOTION');
 assert.ok(y.maxTwoAngleHarmonicResidualRigUnits>.1);
 assert.equal(y.consumer3DAdmitted,false);
});
test('invalid quarter-time simultaneous actual joint pose is rejected',()=>{
 const x=setup();x.frontPoses[1][2]+=.1;
 const y=evaluate(x);
 assert.equal(y.decision,'BLOCKED_NONBILINEAR_TRUE_ORIGINAL_TWO_JOINT_MOTION');
 assert.ok(y.maxTwoAngleHarmonicResidualRigUnits>.09);
});
test('incomplete original front/body indexed coverage cannot be substituted by sample',()=>{
 const x=setup();x.expectedFrontFaces=35262;x.expectedBodyFaces=109064;
 const y=evaluate(x);
 assert.equal(y.decision,'BLOCKED_INCOMPLETE_ORIGINAL_INDEXED_SCOPE');
});
test('wrong original named joint witness, unfrozen third bone, or unrecognized SHA never clears',()=>{
 const x=setup();x.sourceWitness.simultaneousMovingNamedBones.reverse();
 assert.equal(evaluate(x).decision,'BLOCKED_UNVERIFIED_ORIGINAL_SKELETON_WITNESS');
 const z=setup();z.sourceWitness.other161BoneLocalTransformsFrozen=false;
 assert.equal(evaluate(z).decision,'BLOCKED_UNVERIFIED_ORIGINAL_SKELETON_WITNESS');
 const y=setup();y.sourceWitness.originalJPEG_SHA256='synthetic';
 assert.equal(evaluate(y).decision,'BLOCKED_UNVERIFIED_ORIGINAL_SKELETON_WITNESS');
});
test('nonfinite authentic 3x3 original vertices, incorrect offset, missing holdouts fail closed',()=>{
 const x=setup();x.frontGridPoses[0][0]=NaN;
 assert.equal(evaluate(x).decision,'BLOCKED_NONFINITE_ORIGINAL_TWO_JOINT_GRID_OR_PATH');
 const missing=setup();missing.independentOffDiagonalHoldouts=[];
 assert.throws(()=>evaluate(missing),/original-all-face-angular-sweep-unsafe-input/);
 const bad=setup();bad.spine03AnglesDeg=[-10,0,10];
 assert.throws(()=>evaluate(bad),/original-all-face-angular-sweep-unsafe-input/);
});
test('single-sampled true geometric narrowphase cannot silently approve close overlapping envelopes',()=>{
 const x=setup({frontBaseline:.0005,bodyBaseline:0});
 const y=evaluate(x);
 assert.ok(y.decision.startsWith('BLOCKED_'));
 assert.equal(y.consumer3DAdmitted,false);
});
test('conservative resource caps reject rather than silently omit original body faces',()=>{
 const x=setup({frontBaseline:0,bodyBaseline:0});
 x.maxLeafPairTests=1;
 const y=evaluate(x);
 assert.ok(y.decision.startsWith('BLOCKED_'));
 assert.equal(y.consumer3DAdmitted,false);
});
test('all actual original source/grid/body arrays immutable after continuous two-joint analysis',()=>{
 const x=setup(),front=Array.from(x.frontPoses[1]),
  body=Array.from(x.bodyGridPoses[2]),
  hold=Array.from(x.independentOffDiagonalHoldouts[0].frontVertices);
 evaluate(x);
 assert.deepEqual(Array.from(x.frontPoses[1]),front);
 assert.deepEqual(Array.from(x.bodyGridPoses[2]),body);
 assert.deepEqual(Array.from(x.independentOffDiagonalHoldouts[0].frontVertices),hold);
});
test('reject unsupported simultaneous multi-axis or broader 2D motion model',()=>{
 const x=setup();x.kinematicModel='simultaneous-three-joints';
 assert.equal(evaluate(x).decision,'BLOCKED_UNVERIFIED_COMPLEX_SKIN_OR_FABRIC_MOTION');
});
test('contrived degenerate original source or body triangle never becomes motion safe',()=>{
 const x=setup();for(const a of x.frontPoses){
  a[3]=a[0];a[4]=a[1];a[5]=a[2];
 }
 const y=evaluate(x);
 assert.ok(y.decision.startsWith('BLOCKED_'));
 assert.equal(y.consumer3DAdmitted,false);
});
