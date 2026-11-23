import test from 'node:test';
import assert from 'node:assert/strict';
import {triageOriginalTwoAngleRectangleFirstWitness as triage} from
 '../research/parallel89/original-rectangle-first-witness-triage89.mjs';

const tri=(a,b,baseline=0)=>{
 const x=a*Math.PI/180,y=b*Math.PI/180,
  px=.07*Math.sin(x)+.03*Math.sin(y)*Math.cos(x),
  z=baseline+.15*Math.sin(x)+.13*Math.sin(y)+
   .05*Math.sin(x)*Math.sin(y);
 return Float64Array.from([px,0,z,px+1,0,z,px,1,z]);
};
function fixture(distance=3,cell=0){
 const pair=(a,b)=>({f:tri(a,b,distance),b:tri(a,b,0)});
 const grid=[-6,0,6].flatMap(a=>[-12,0,12].map(b=>pair(a,b)));
 const path=[[-6,-12],[-3,-6],[0,0],[3,6],[6,12]]
  .map(([a,b])=>pair(a,b));
 const held=[[-3,6],[3,-6]].map(([a,b])=>({
  anglesDeg:[a,b],frontVertices:tri(a,b,distance),
  bodyVertices:tri(a,b,0)}));
 return {rectangleAudit:{
   decision:'BLOCKED_UNRESOLVED_ORIGINAL_TWO_ANGLE_RECTANGLE_ENVELOPE_OVERLAP',
   entireTwoAngleRectangleIncluded:true,cells:4,consumer3DAdmitted:false,
   familyAlpha:'HOLD',originalFullFrontFaces:1,originalFullBodyFaces:1,
   originalWitness:{frontFace:0,bodyFace:0,cell}
  },
  frontGridPoses:grid.map(p=>p.f),bodyGridPoses:grid.map(p=>p.b),
  frontPathPoses:path.map(p=>p.f),bodyPathPoses:path.map(p=>p.b),
  independentOffDiagonalHoldouts:held,
  frontIndices:Uint32Array.from([0,1,2]),
  bodyIndices:Uint32Array.from([0,1,2]),
  expectedFrontFaces:1,expectedBodyFaces:1};
}
test('five REAL-pose-shaped samples of an unresolved envelope remain BLOCKED even when separated',()=>{
 const r=triage(fixture());
 assert.equal(r.decision,'BLOCKED_RECTANGLE_CONTINUOUS_BETWEEN_OR_OTHER_FACE_CONTACT_UNKNOWN');
 assert.equal(r.sourcePoseSamples,5);
 assert.equal(r.actualOriginalGridCornersExamined,4);
 assert.equal(r.actualOriginalIndependentCellCentersExamined,1);
 assert.equal(r.genuineOriginalIndexedFacePairsExamined,1);
 assert.equal(r.observedExactTriangleContactsAtSampledPoses,0);
 assert.equal(r.firstWitnessSampledOriginalPoseContacts.length,5);
 assert.ok(r.firstWitnessSampledOriginalPoseContacts.every(s=>s.contactClass==='NONE'));
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.familyAlpha,'HOLD');
});
test('true exact original triangle contact positively rejects at each sampled pose',()=>{
 const r=triage(fixture(0));
 assert.equal(r.decision,'BLOCKED_ACTUAL_ORIGINAL_RECTANGLE_SAMPLE_TRIANGLE_CONTACT');
 assert.equal(r.observedExactTriangleContactsAtSampledPoses,5);
 assert.ok(r.firstWitnessSampledOriginalPoseContacts.every(s=>s.contactClass==='COPLANAR_OVERLAP'));
 assert.equal(r.consumer3DAdmitted,false);
});
test('all four independent angle cells use exact correct original cell-center provenance',()=>{
 const centers=[[-3,-6],[-3,6],[3,-6],[3,6]];
 for(let i=0;i<4;i++){
  const r=triage(fixture(3,i));
  assert.equal(r.rectangleCell,i);
  assert.deepEqual(r.firstWitnessSampledOriginalPoseContacts[4].anglesDeg,centers[i]);
  assert.equal(r.firstWitnessSampledOriginalPoseContacts[4].poseKind,
   'actual-original-independent-cell-center');
  assert.equal(r.decision,'BLOCKED_RECTANGLE_CONTINUOUS_BETWEEN_OR_OTHER_FACE_CONTACT_UNKNOWN');
 }
});
test('forged green or unrecognized previous full-rectangle verdict rejects',()=>{
 const x=fixture();x.rectangleAudit.decision='RESEARCH_ONLY_WHOLE_TWO_ANGLE_RECTANGLE_AABB_SEPARATION';
 assert.equal(triage(x).decision,'BLOCKED_UNSUPPORTED_OR_UNVERIFIED_RECTANGLE_VERDICT');
 const y=fixture();y.rectangleAudit.consumer3DAdmitted=true;
 assert.equal(triage(y).decision,'BLOCKED_UNSUPPORTED_OR_UNVERIFIED_RECTANGLE_VERDICT');
});
test('different face count and first-witness index out of scope reject',()=>{
 const x=fixture();x.expectedBodyFaces=109064;
 assert.equal(triage(x).decision,'BLOCKED_MALFORMED_ORIGINAL_CONTACT_WITNESS');
 const y=fixture();y.rectangleAudit.originalWitness.frontFace=1;
 assert.equal(triage(y).decision,'BLOCKED_MALFORMED_ORIGINAL_CONTACT_WITNESS');
});
test('unsupported rectangle subdivision, malformed cell or missing original face array refuse',()=>{
 const x=fixture();x.rectangleAudit.cells=16;
 assert.equal(triage(x).decision,'BLOCKED_UNSUPPORTED_OR_UNVERIFIED_RECTANGLE_VERDICT');
 const y=fixture();y.rectangleAudit.originalWitness.cell=4;
 assert.equal(triage(y).decision,'BLOCKED_MALFORMED_ORIGINAL_CONTACT_WITNESS');
 const z=fixture();z.frontIndices=Uint32Array.from([0,1]);
 assert.equal(triage(z).decision,'BLOCKED_MALFORMED_ORIGINAL_CONTACT_WITNESS');
});
test('swapped off-diagonal independently measured center is refused',()=>{
 const x=fixture();x.independentOffDiagonalHoldouts.reverse();
 assert.equal(triage(x).decision,'BLOCKED_INCONSISTENT_ORIGINAL_POSE_DATA');
});
test('missing source grid or original path coordinate refutes exact witness diagnosis',()=>{
 const x=fixture();x.frontGridPoses.pop();
 assert.equal(triage(x).decision,'BLOCKED_INCONSISTENT_ORIGINAL_POSE_DATA');
 const y=fixture();y.bodyPathPoses.pop();
 assert.equal(triage(y).decision,'BLOCKED_INCONSISTENT_ORIGINAL_POSE_DATA');
});
test('nonfinite real original witness remains unknown without false fit clearance',()=>{
 const x=fixture();x.frontPathPoses[1][0]=NaN;
 const r=triage(x);
 assert.equal(r.decision,'BLOCKED_NONFINITE_ORIGINAL_WITNESS_TRIANGLE');
 assert.equal(r.consumer3DAdmitted,false);
});
test('out-of-range indexed original vertex is explicitly blocked',()=>{
 const x=fixture();x.frontIndices=Uint32Array.from([0,1,999]);
 assert.equal(triage(x).decision,'BLOCKED_ORIGINAL_FACE_INDEX_OUT_OF_RANGE');
});
test('all original grid/path/held-out coordinate arrays remain byte-position unchanged',()=>{
 const x=fixture(),g=Array.from(x.frontGridPoses[2]),
  p=Array.from(x.bodyPathPoses[1]),
  h=Array.from(x.independentOffDiagonalHoldouts[0].frontVertices);
 triage(x);
 assert.deepEqual(Array.from(x.frontGridPoses[2]),g);
 assert.deepEqual(Array.from(x.bodyPathPoses[1]),p);
 assert.deepEqual(Array.from(x.independentOffDiagonalHoldouts[0].frontVertices),h);
});
