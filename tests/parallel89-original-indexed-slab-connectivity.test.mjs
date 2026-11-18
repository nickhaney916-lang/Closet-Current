import test from 'node:test';
import assert from 'node:assert/strict';
import {auditOriginalIndexedSlabConnectivity89 as audit}
 from '../research/parallel89/skirt-original-indexed-slab-connectivity89.mjs';
const skirt=(reverse=false)=>{
 const p=new Float32Array(343*3);
 for(let row=0;row<7;row++)for(let k=0;k<49;k++){
  const i=3*(row*49+k),t=k*Math.PI/24;
  p[i]=.5*Math.cos(t);
  p[i+1]=reverse?1.32-row*.12:.6+row*.12;
  p[i+2]=.5*Math.sin(t);
 }
 return p;
};
const input=(pts,idx,reverse=false)=>({
 bodyPositions:Float32Array.from(pts),
 bodyIndices:Uint16Array.from(idx),
 selectedSourceFaceMask:new Uint8Array(idx.length/3).fill(1),
 skirtPositions:skirt(reverse)
});
const box=input([
 -.2,.2,-.2,.2,.2,-.2,.2,1.8,-.2,-.2,1.8,-.2,
 -.2,.2,.2,.2,.2,.2,.2,1.8,.2,-.2,1.8,.2
 ],[0,2,1,0,3,2,4,5,6,4,6,7,
 0,1,5,0,5,4,3,7,6,3,6,2,
 0,4,7,0,7,3,1,2,6,1,6,5]);
function check(x){
 const snap=Object.fromEntries(Object.entries(x)
  .map(([k,v])=>[k,v.slice()]));
 const r=audit(x);
 for(const [key,copy] of Object.entries(snap))assert.deepEqual(x[key],copy);
 assert.equal(r.schema,'P89-original-selected-body-indexed-edge-slab-bridge/v1');
 assert.equal(r.originalInterHeightSlabCount,6);
 assert.equal(r.originalAdjacentSlabSourceEdgeConnectivity.length,6);
 assert.equal(r.sourceIndexedLoopsAndExteriorNotProven,true);
 assert.equal(r.noInferredOrVirtualSeamBridges,true);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 for(const [i,b] of r.originalAdjacentSlabSourceEdgeConnectivity.entries()){
  assert.deepEqual(b.originalPhotoSkirtAdjacentHeightPair,[i,i+1]);
  assert.equal(b.lowerPlaneIndexedComponents,
   b.sourceIndexedEdgeConnectedBothPlanes+b.lowerOnlyIndexedComponents);
  assert.equal(b.upperPlaneIndexedComponents,
   b.sourceIndexedEdgeConnectedBothPlanes+b.upperOnlyIndexedComponents);
  assert.equal(b.onlyOriginalVertexIndexSharedEdgesCountAsConnections,true);
  assert.equal(b.originalSourceSharedEdgeMustIntersectOpenSlabInterior,true);
  assert.equal(b.boundaryOnlyAndOutsideSharedEdgesNeverJoinSlabFaces,true);
  assert.equal(b.originalSourceZeroLengthEdgesNeverJoinSlabFaces,true);
  assert.equal(b.originalIndexedSharedEdgeAdjacencies,
   b.originalIndexedSharedEdgesWithOpenSlabInterior+
   b.originalIndexedSharedEdgesOutsideOrOnSlabBoundary+
   b.originalIndexedZeroLengthSourceEdgesRejected);
  assert.equal(b.eligibleOriginalSelectedSourceFaces,
   b.selectedSourceFacesWithPositiveSlabInterior+
   b.selectedSourceFacesOnlyTouchingSlabBoundary);
  assert.ok(b.originalIndexedNonmanifoldEdgesWithinOpenSlab<=
   b.originalIndexedNonmanifoldEdges);
  assert.equal(b.restSkinCompatibleVirtualUVSeamsNeverJoined,true);
 }
 return r;
}
test('true indexed closed cube supports six direct source face-edge bridges but is NOT a signed wearable body proof',()=>{
 const r=check(box);
 assert.equal(r.selectedOriginalFaceCount,12);
 assert.equal(r.allSixSlabsHaveIndexedEdgeBridge,true);
 for(const s of r.originalAdjacentSlabSourceEdgeConnectivity){
  assert.equal(s.sourceIndexedEdgeConnectedBothPlanes,1);
  assert.equal(s.originalIndexedNonmanifoldEdges,0);
 }
});
test('descending original photographed seven-height skirt preserves original face-index bridging',()=>{
 const x={...box,skirtPositions:skirt(true)};
 assert.equal(check(x).heightOrder,'DESCENDING');
});
test('independent lower/upper source surfaces with genuine height gap have NO between-ring source-index span',()=>{
 const x=input([
  0,.2,0, 1,.2,0, 0,.87,1,
  0,.93,0, 1,1.8,0, 0,1.8,1
 ],[0,1,2,3,4,5]);
 const v=check(x);
 assert.equal(v.allSixSlabsHaveIndexedEdgeBridge,false);
 assert.equal(v.originalAdjacentSlabSourceEdgeConnectivity[2].sourceIndexedEdgeConnectedBothPlanes,0);
});
test('two real faces sharing one source vertex INDEX are NOT an edge-connected shell',()=>{
 const x=input([0,.2,0,1,1.8,0,0,1.8,1,-1,1.8,0,0,1.8,-1],
  [0,1,2,0,3,4]);
 const v=check(x);
 for(const s of v.originalAdjacentSlabSourceEdgeConnectivity){
  assert.equal(s.sourceIndexedEdgeConnectedBothPlanes,2);
  assert.equal(s.originalIndexedSharedEdgeAdjacencies,0);
 }
});
test('same-world-position UV seam twins with different exact source indices are never welded',()=>{
 const x=input([
  0,.2,0,1,1.8,0,0,1.8,1,
  0,.2,0,1,1.8,0,0,1.8,1
 ],[0,1,2,3,4,5]);
 const v=check(x);
 for(const s of v.originalAdjacentSlabSourceEdgeConnectivity){
  assert.equal(s.sourceIndexedEdgeConnectedBothPlanes,2);
  assert.equal(s.originalIndexedSharedEdgeAdjacencies,0);
 }
});
test('nonmanifold original three-face common edge is flagged not treated as valid shared-edge connectivity',()=>{
 const x=input([
  0,.2,0,1,1.8,0,0,1.8,1,0,1.8,-1,1,1.8,1
 ],[0,1,2,1,0,3,0,1,4]);
 const v=check(x);
 assert.equal(v.allSixSlabsHaveIndexedEdgeBridge,false);
 for(const s of v.originalAdjacentSlabSourceEdgeConnectivity)
  assert.ok(s.originalIndexedNonmanifoldEdges>=1);
});
test('source masked selection cannot treat excluded faces as a bridge',()=>{
 const x={...box,selectedSourceFaceMask:new Uint8Array(12)};
 const v=check(x);
 assert.equal(v.allSixSlabsHaveIndexedEdgeBridge,false);
 assert.equal(v.selectedOriginalFaceCount,0);
});
test('fail closed on bad original index, malformed photo, nonfinite vertices, missing mask, degenerate source faces and nonmonotonic bands',()=>{
 const wrong=skirt();wrong[3*(2*49)+1]=wrong[3*(1*49)+1];
 // Single modified vertex may not make averaged heights nonmonotonic.
 for(let i=0;i<49;i++)wrong[3*(2*49+i)+1]=.72;
 for(const bad of [
  {...box,bodyIndices:Uint16Array.from(box.bodyIndices,(v,i)=>i===0?999:v)},
  {...box,bodyPositions:Float32Array.from(box.bodyPositions,(v,i)=>i===0?NaN:v)},
  {...box,selectedSourceFaceMask:new Uint8Array(1)},
  {...box,selectedSourceFaceMask:new Uint8Array(12).fill(2)},
  {...box,skirtPositions:wrong},
  {...box,skirtPositions:new Float32Array(12)},
  {...box,bodyIndices:Uint16Array.from([0,0,2])}
 ])assert.throws(()=>audit(bad));
});

test('EXACT original index shared edge entirely ABOVE slab must not join two surfaces inside slab',()=>{
 const x=input([
  0,1.8,0, 1,1.8,0, 0,.2,1, 0,.2,-1
 ],[0,1,2,1,0,3]);
 const v=check(x);
 for(const part of v.originalAdjacentSlabSourceEdgeConnectivity){
  assert.equal(part.originalIndexedSharedEdgeAdjacencies,1);
  assert.equal(part.originalIndexedSharedEdgesWithOpenSlabInterior,0);
  assert.equal(part.originalIndexedSharedEdgesOutsideOrOnSlabBoundary,1);
  assert.equal(part.sourceIndexedEdgeConnectedBothPlanes,2,
   'two disconnected original surfaces must not be merged outside cropped slab');
 }
});
test('EXACT original index shared edge entirely BELOW slab also cannot join clipped face interiors',()=>{
 const x=input([0,.2,0,1,.2,0,0,1.8,1,0,1.8,-1],
  [0,1,2,1,0,3]);
 const v=check(x);
 for(const part of v.originalAdjacentSlabSourceEdgeConnectivity){
  assert.equal(part.originalIndexedSharedEdgeAdjacencies,1);
  assert.equal(part.originalIndexedSharedEdgesWithOpenSlabInterior,0);
  assert.equal(part.originalIndexedSharedEdgesOutsideOrOnSlabBoundary,1);
  assert.equal(part.sourceIndexedEdgeConnectedBothPlanes,2);
 }
});
test('shared edge ON photographed lower height boundary is not valid interior bridge',()=>{
 const x=input([0,.6,0,1,.6,0,0,1.8,1,0,1.8,-1],
  [0,1,2,1,0,3]);
 const v=check(x);
 const first=v.originalAdjacentSlabSourceEdgeConnectivity[0];
 assert.equal(first.originalIndexedSharedEdgeAdjacencies,1);
 assert.equal(first.originalIndexedSharedEdgesWithOpenSlabInterior,0);
 assert.equal(first.originalIndexedSharedEdgesOutsideOrOnSlabBoundary,1);
 assert.equal(first.sourceIndexedEdgeConnectedBothPlanes,2);
});
test('source shared edge physically spanning open slab is a genuine local edge bridge',()=>{
 const x=input([0,.2,0,1,1.8,0,0,1.8,1,0,1.8,-1],
  [0,1,2,1,0,3]);
 const v=check(x);
 for(const part of v.originalAdjacentSlabSourceEdgeConnectivity){
  assert.equal(part.originalIndexedSharedEdgeAdjacencies,1);
  assert.equal(part.originalIndexedSharedEdgesWithOpenSlabInterior,1);
  assert.equal(part.originalIndexedSharedEdgesOutsideOrOnSlabBoundary,0);
  assert.equal(part.sourceIndexedEdgeConnectedBothPlanes,1);
 }
});
test('zero-length source-index edge never authorizes geometric continuity',()=>{
 const x=input([0,.9,0,0,.9,0,1,1.8,0,-1,.2,0],
  [0,1,2,1,0,3]);
 const v=check(x);
 const middle=v.originalAdjacentSlabSourceEdgeConnectivity[2];
 assert.equal(middle.originalIndexedSharedEdgeAdjacencies,1);
 assert.equal(middle.originalIndexedSharedEdgesWithOpenSlabInterior,0);
 assert.equal(middle.originalIndexedZeroLengthSourceEdgesRejected,1);
 assert.equal(middle.originalIndexedSharedEdgesOutsideOrOnSlabBoundary,0);
 assert.equal(middle.sourceIndexedEdgeConnectedBothPlanes,0,
  'zero-length original indexed contact cannot join upper/lower-only faces');
});
