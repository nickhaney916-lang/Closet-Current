import test from 'node:test';
import assert from 'node:assert/strict';
import {auditVirtualContourArrangement89 as audit}
 from '../research/parallel89/skirt-virtual-contour-arrangement89.mjs';
const box=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
function check(loops,center){
 const copy=structuredClone(loops),fixed=structuredClone(center);
 const v=audit(loops,center);
 assert.deepEqual(loops,copy);assert.deepEqual(center,fixed);
 assert.equal(v.classification,'COUNTERFACTUAL_2D_CONTOUR_RELATIONS_NOT_BODY_EXTERIOR');
 assert.equal(v.schema,'P89-genuine-source-virtual-seam-2d-arrangement/v1');
 assert.equal(v.originalSourceIndexedBodyExteriorProven,false);
 assert.equal(v.sealedSigned3DBodyProven,false);
 assert.equal(v.sourceSkirtCenterNotAnatomicalInteriorProof,true);
 assert.equal(v.originalUnobservedSkirtSpokeDirectionsUnresolved,true);
 assert.equal(v.consumer3DAdmitted,false);
 assert.equal(v.releaseAuthorized,false);
 assert.equal(v.originalPhoto2DFallbackRequired,true);
 assert.equal(v.loopPairCount,v.intersectingOrTouchingLoopPairs+
  v.containedNestedLoopPairs+v.disjointLoopPairs);
 assert.equal(v.simpleVirtualIndexLoopCount,
  v.sourceRingCenterInsideCandidateLoops+
  v.sourceRingCenterOutsideCandidateLoops+
  v.sourceRingCenterOnCandidateBoundary);
 return v;
}
test('single hypothetical simple square encloses photographed source skirt center but proves no anatomical exterior',()=>{
 const v=check([box(-2,-2,2,2)],[0,0]);
 assert.equal(v.uniqueSourceRingCenterEnclosingCandidateOnly,true);
 assert.equal(v.sourceRingCenterInsideCandidateLoops,1);
 assert.equal(v.loopPairCount,0);
});
test('two nested simple rings both enclose photographed center; no unique exterior can be asserted',()=>{
 const v=check([box(-3,-3,3,3),box(-1,-1,1,1)],[0,0]);
 assert.equal(v.containedNestedLoopPairs,1);
 assert.equal(v.sourceRingCenterInsideCandidateLoops,2);
 assert.equal(v.uniqueSourceRingCenterEnclosingCandidateOnly,false);
});
test('nested shell with center in annulus: one candidate contains source skirt center, still unproven',()=>{
 const v=check([box(-3,-3,3,3),box(1,1,2,2)],[0,0]);
 assert.equal(v.containedNestedLoopPairs,1);
 assert.equal(v.sourceRingCenterInsideCandidateLoops,1);
 assert.equal(v.uniqueSourceRingCenterEnclosingCandidateOnly,true);
 assert.equal(v.sealedSigned3DBodyProven,false);
});
test('two disjoint loops are not one enclosing body contour, even with shared garment origin',()=>{
 const v=check([box(-5,-2,-3,2),box(3,-2,5,2)],[0,0]);
 assert.equal(v.disjointLoopPairs,1);
 assert.equal(v.sourceRingCenterInsideCandidateLoops,0);
 assert.equal(v.uniqueSourceRingCenterEnclosingCandidateOnly,false);
});
test('two overlapping simple source loops have pair crossing (individual simple area is not enough)',()=>{
 const v=check([box(-2,-2,1,1),box(0,0,2,2)],[0,0]);
 assert.equal(v.intersectingOrTouchingLoopPairs,1);
 assert.equal(v.uniqueSourceRingCenterEnclosingCandidateOnly,false);
});
test('two exactly touching original virtual contours fail the inter-loop non-intersection guard',()=>{
 const v=check([box(0,0,1,1),box(1,0,2,1)],[0.5,0.5]);
 assert.equal(v.intersectingOrTouchingLoopPairs,1);
 assert.equal(v.uniqueSourceRingCenterEnclosingCandidateOnly,false);
});
test('photographed source skirt center on contour is ambiguous; neither inside nor outside',()=>{
 const v=check([box(-2,-2,2,2)],[2,1]);
 assert.equal(v.sourceRingCenterOnCandidateBoundary,1);
 assert.equal(v.uniqueSourceRingCenterEnclosingCandidateOnly,false);
});
test('winding direction does not turn a hypothetical source index seam into a sewn or signed original body',()=>{
 const v=check([box(-2,-2,2,2),box(3,3,4,4).reverse()],[0,0]);
 assert.equal(v.counterclockwiseCandidateLoops,1);
 assert.equal(v.clockwiseCandidateLoops,1);
 assert.equal(v.disjointLoopPairs,1);
});
test('adjacent duplicate original virtual seam points are not incorrectly considered contour intersections',()=>{
 const v=check([[[0,0],[2,0],[2,0],[2,2],[0,2],[0,0]]],[1,1]);
 assert.equal(v.sourceRingCenterInsideCandidateLoops,1);
});
test('no candidate loops is not silently accepted as a physical wearer',()=>{
 const v=check([],[0,0]);
 assert.equal(v.simpleVirtualIndexLoopCount,0);
 assert.equal(v.uniqueSourceRingCenterEnclosingCandidateOnly,false);
});
test('malformed source centers and loops fail before signed body approval',()=>{
 for(const [rings,center] of [
  [null,[0,0]], [[],null],[[],[0]], [[],[Infinity,1]],
  [[box(0,0,1,1)],['x',0]],
  [[[[0,0],[1,1],[NaN,0]]],[0,0]],
  [[[[0,0],[2,2],[0,2],[2,0]]],[0,0]],
  [Array.from({length:49},()=>box(0,0,1,1)),[0,0]],
  [[[[0,0],[2,0],[0,0]]],[0,0]]
 ])assert.throws(()=>audit(rings,center));
});
