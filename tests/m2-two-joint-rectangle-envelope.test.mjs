import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateTwoJointOriginalRectangle as evaluate} from
 '../research/parallel89/two-joint-rectangle-safety89.mjs';
const rad=d=>d*Math.PI/180;
const triangle=(a,b,z=0)=>{
 const x=rad(a),y=rad(b),dx=.07*Math.sin(x)+.03*Math.sin(y)*Math.cos(x),
  dz=.15*Math.sin(x)+.13*Math.sin(y)+.05*Math.sin(x)*Math.sin(y);
 return Float64Array.from([dx,0,z+dz,dx+1,0,z+dz,dx,1,z+dz]);
};
function inputs({distance=5}={}){
 const pair=(a,b)=>({front:triangle(a,b,distance),body:triangle(a,b,0)});
 const grid=[-6,0,6].flatMap(a=>[-12,0,12].map(b=>pair(a,b)));
 const h=[[-3,6],[3,-6]];
 return {frontGridPoses:grid.map(p=>p.front),bodyGridPoses:grid.map(p=>p.body),
  independentOffDiagonalHoldouts:h.map(([a,b])=>({
   anglesDeg:[a,b],frontVertices:triangle(a,b,distance),bodyVertices:triangle(a,b,0)})),
  frontIndices:Uint32Array.from([0,1,2]),bodyIndices:Uint32Array.from([0,1,2]),
  expectedFrontFaces:1,expectedBodyFaces:1,
  sourceWitness:{actualRigBoneCount:163,
   simultaneousMovingNamedBones:['spine03','spine04'],
   other161BoneLocalTransformsFrozen:true,
   independentOriginalSourceJointPoses:true,
   sourceCoordinatesReadFromOriginalPositionAttribute:true,
   originalSourceSkinnedMesh:true,originalJPEG_SHA256:'a'.repeat(64),
   actualLicensedRigSHA256:'b'.repeat(64)}};
}
test('independent off-diagonal plus whole two-angle domain stays research-only',()=>{
 const r=evaluate(inputs());
 assert.equal(r.decision,'RESEARCH_ONLY_WHOLE_TWO_ANGLE_RECTANGLE_AABB_SEPARATION');
 assert.equal(r.entireTwoAngleRectangleIncluded,true);
 assert.equal(r.entireOriginalFaceBroadphaseCompleted,true);
 assert.equal(r.cells,4);
 assert.ok(r.verifiedOffDiagonalMaxResidualRigUnits<1e-8);
 assert.ok(r.conservativeMaxCellInflationRigUnits>0);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.familyAlpha,'HOLD');
});
test('actual source contact is conservative BLOCK not fitted 3D',()=>{
 const r=evaluate(inputs({distance:0}));
 assert.equal(r.decision,
  'BLOCKED_UNRESOLVED_ORIGINAL_TWO_ANGLE_RECTANGLE_ENVELOPE_OVERLAP');
 assert.equal(r.consumer3DAdmitted,false);
});
test('mixed off-diagonal deformation falsifies fixed-axis LBS',()=>{
 const i=inputs();i.independentOffDiagonalHoldouts[0].frontVertices[0]+=.3;
 assert.equal(evaluate(i).decision,
  'BLOCKED_NON_LBS_OR_INVALID_OFF_DIAGONAL_ORIGINAL_POSE');
});
test('third joint, forged SHA and incomplete provenance cannot pass',()=>{
 const i=inputs();i.sourceWitness.simultaneousMovingNamedBones.push('elbow');
 assert.equal(evaluate(i).decision,'BLOCKED_ORIGINAL_RIG_PROVENANCE_UNVERIFIED');
 const j=inputs();j.sourceWitness.originalJPEG_SHA256='bogus';
 assert.equal(evaluate(j).decision,'BLOCKED_ORIGINAL_RIG_PROVENANCE_UNVERIFIED');
});
test('missing original indexed faces cannot claim complete survey',()=>{
 const i=inputs();i.expectedBodyFaces=109064;
 assert.equal(evaluate(i).decision,'BLOCKED_INCOMPLETE_ORIGINAL_INDEXED_SCOPE');
});
test('nonfinite and degenerate source geometry fail closed',()=>{
 const i=inputs();i.frontGridPoses[0][1]=NaN;
 assert.equal(evaluate(i).decision,'BLOCKED_NONFINITE_ORIGINAL_POSITION');
 const j=inputs();j.frontGridPoses[0][3]=j.frontGridPoses[0][0];
 j.frontGridPoses[0][4]=j.frontGridPoses[0][1];
 j.frontGridPoses[0][5]=j.frontGridPoses[0][2];
 assert.equal(evaluate(j).decision,'BLOCKED_DEGENERATE_ORIGINAL_GRID_TRIANGLE');
});
test('budget exhaustion blocks without omitting original surfaces',()=>{
 const i=inputs();i.maxBVHVisits=1;
 assert.equal(evaluate(i).decision,'BLOCKED_RECTANGLE_BVH_VISIT_LIMIT');
});
test('original grid positions and held-out source are unchanged',()=>{
 const i=inputs(),a=Array.from(i.frontGridPoses[0]),
  b=Array.from(i.independentOffDiagonalHoldouts[0].bodyVertices);
 evaluate(i);
 assert.deepEqual(Array.from(i.frontGridPoses[0]),a);
 assert.deepEqual(Array.from(i.independentOffDiagonalHoldouts[0].bodyVertices),b);
});
test('unsupported subdivisions and incomplete original grid deny',()=>{
 const i=inputs();i.subdivisions=999;
 assert.equal(evaluate(i).decision,'BLOCKED_UNSAFE_OR_INCOMPLETE_RECTANGLE_INPUT');
 const j=inputs();j.bodyGridPoses.splice(8,1);
 assert.equal(evaluate(j).decision,'BLOCKED_UNSAFE_OR_INCOMPLETE_RECTANGLE_INPUT');
});
