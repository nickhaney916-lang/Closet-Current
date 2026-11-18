import test from 'node:test';
import assert from 'node:assert/strict';
import {auditVirtualContourPlanarity89 as audit}
 from '../research/parallel89/skirt-virtual-loop-planarity89.mjs';
const square=[[0,0],[2,0],[2,2],[0,2]];
function blocked(points,status){
 const copy=structuredClone(points);
 const v=audit(points);
 assert.deepEqual(points,copy,'original source input was mutated');
 assert.equal(v.schema,'P89-counterfactual-virtual-loop-2d-planarity/v1');
 assert.equal(v.classification,status);
 assert.equal(v.originalIndexedGLBModified,false);
 assert.equal(v.hypotheticalVirtualSeamOnly,true);
 assert.equal(v.sourceBodySignedVolumeCertified,false);
 assert.equal(v.continuousGarmentContactProven,false);
 assert.equal(v.consumer3DAdmitted,false);
 assert.equal(v.originalPhoto2DFallbackRequired,true);
 return v;
}
test('clean nonzero area hypothetical 2D source ring is still not 3D wearable',()=>{
 const v=blocked(square,'SIMPLE_NONZERO_AREA');
 assert.equal(v.signedArea,4);
 const reverse=blocked(square.toReversed(),'SIMPLE_NONZERO_AREA');
 assert.equal(reverse.signedArea,-4);
});
test('genuine counterfactual seam duplicate adjacent points can close a 2D loop without real mesh joining',()=>{
 const v=blocked([[0,0],[2,0],[2,0],[2,2],[0,2],[0,0]],'SIMPLE_NONZERO_AREA');
 assert.equal(v.signedArea,4);
});
test('source UV graph bow-tie crossing is rejected even if signed shoelace area cancels',()=>{
 blocked([[0,0],[2,2],[0,2],[2,0]],'SELF_CROSSING_OR_TOUCHING');
});
test('nonadjacent vertex touches an original edge: not a simple loop',()=>{
 blocked([[0,0],[2,0],[2,2],[0,2],[1,0]],'SELF_CROSSING_OR_TOUCHING');
});
test('nonadjacent identical original-point revisits must not be collapsed',()=>{
 blocked([[0,0],[3,0],[3,3],[0,3],[1,1],[3,0],[0,2]],'SELF_CROSSING_OR_TOUCHING');
});
test('flat, collapsed and almost-zero-area source contour candidates are not called loops',()=>{
 blocked([[0,0],[1,0],[2,0]],'DEGENERATE_ZERO_AREA');
 blocked([[0,0],[0,0],[0,0]],'DEGENERATE_ZERO_AREA');
 blocked([[0,0],[2,0],[1,1e-12]],'DEGENERATE_ZERO_AREA');
});
test('reject malformed/unbounded original inputs, never authorize unproven garment',()=>{
 for(const x of [null,[],[[0,0]],[[0,0],[1,1],[0,NaN]],
  [[0,0],[2,0],[Infinity,1]],[[0,0],[2,0],[1,1e7]],
  Array.from({length:4097},(_,i)=>[i,0]),
  [[0,0],[1,0],[0,'2']],[[0,0],[1,0],[0,2,3]]]){
  assert.throws(()=>audit(x),/bounded-finite/);
 }
});
