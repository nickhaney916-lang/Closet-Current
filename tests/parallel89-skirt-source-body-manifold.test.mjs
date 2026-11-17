/** P89 synthetic indexed-shell adversarial contracts only.
 * Genuine original public 163-bone GLBs run in real native Chromium/WebKit.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeIndexedBodyClosure89 as summarize,
 auditActualOriginalBodyClosure89 as audit} from
 '../research/parallel89/skirt-source-body-manifold89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const FEMALE='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
function cube(){
 const p=new Float32Array([
  -1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1,
  -1,-1,1, 1,-1,1, 1,1,1, -1,1,1
 ]);
 const i=new Uint16Array([
  0,2,1,0,3,2, 4,5,6,4,6,7,
  0,1,5,0,5,4, 3,7,6,3,6,2,
  0,4,7,0,7,3, 1,2,6,1,6,5
 ]);
 return {p,i};
}
function status(p,i){return summarize(p,i);}
test('genuine indexed triangulated synthetic cube has 18 exact opposite-wound twice-incident edges but cannot itself certify signed volume',()=>{
 const {p,i}=cube(),before=p.slice(),idx=i.slice(),t=status(p,i);
 assert.equal(t.originalIndexedTriangleCount,12);
 assert.equal(t.originalIndexedVertexCount,8);
 assert.equal(t.actualSourceIndexDistinctEdges,18);
 assert.equal(t.sourceOpenBoundaryEdgeCount,0);
 assert.equal(t.sourceNonmanifoldOverTwoFaceEdgeCount,0);
 assert.equal(t.sourceSameDirectionPairEdgeCount,0);
 assert.equal(t.sourceOppositeDirectionPairEdgeCount,18);
 assert.equal(t.sourceDisconnectedVertexIndexedIslands,1);
 assert.equal(t.indexedSourceDegenerateTriangleCount,0);
 assert.equal(t.originalIndexedEdgePairCandidateOnly,true);
 assert.equal(t.selfIntersectionFreeEmbeddedVolumeProven,false);
 assert.equal(t.signedInsideOutsideVerified,false);
 assert.equal(t.releaseAuthorized,false);
 assert.deepEqual(p,before);assert.deepEqual(i,idx);
});
test('open triangle source boundary cannot establish a body solid',()=>{
 const {p,i}=cube();
 const t=status(p,i.slice(0,-3));
 assert.equal(t.sourceOpenBoundaryEdgeCount,3);
 assert.equal(t.originalIndexedEdgePairCandidateOnly,false);
});
test('an edge with same-direction source faces fails orientation consistency',()=>{
 const {p,i}=cube();const reversed=i.slice();
 const k=0;[reversed[k+1],reversed[k+2]]=[reversed[k+2],reversed[k+1]];
 const t=status(p,reversed);
 assert.ok(t.sourceSameDirectionPairEdgeCount>=1);
 assert.equal(t.originalIndexedEdgePairCandidateOnly,false);
});
test('an original face reused three times creates nonmanifold edges and cannot be declared closed',()=>{
 const {p,i}=cube(),many=Uint16Array.from([...i,...i.slice(0,3)]);
 const t=status(p,many);
 assert.ok(t.sourceNonmanifoldOverTwoFaceEdgeCount>=3);
 assert.ok(t.maximumSourceIncidentFacesPerEdge>=3);
 assert.equal(t.originalIndexedEdgePairCandidateOnly,false);
});
test('coincident but split original UV/seam indices are not silently welded to forge topological closure',()=>{
 const {p,i}=cube(),copies=Float32Array.from([...p,...p]),shifted=Uint16Array.from(
  [...i.slice(0,18),...i.slice(18).map(v=>v+8)]);
 const t=status(copies,shifted);
 assert.ok(t.independentlyCoincidentButIndexSplitVertices>=8);
 assert.ok(t.sourceOpenBoundaryEdgeCount>0);
 assert.equal(t.originalSourceIndicesNeverWelded,true);
 assert.equal(t.originalIndexedEdgePairCandidateOnly,false);
});
test('forged source topology and NaN, out-of-range or degenerate original source faces fail closed',()=>{
 const {p,i}=cube();
 assert.throws(()=>status(Float32Array.from(p,(v,k)=>k===2?NaN:v),i),
  /nonfinite-source-vertex/);
 assert.throws(()=>status(p,Uint32Array.from(i,(v,k)=>k===0?99999:v)),
  /out-of-range-source-triangle-index/);
 const bad=i.slice();bad[1]=bad[0];
 const t=status(p,bad);
 assert.ok(t.indexedSourceDegenerateTriangleCount>=1);
 assert.equal(t.originalIndexedEdgePairCandidateOnly,false);
});
function nativeFixture(){
 const {p,i}=cube();
 // Structured synthetic fixture is deliberately NOT a genuine 163bone
 // source and must never be presented as native original body evidence.
 const bodyPositions=new Float32Array(360*3);
 bodyPositions.set(p);
 const bodyIndices=Uint16Array.from(
  Array.from({length:9},()=>[...i]).flat());
 const coreBodyFaceMask=Uint8Array.from(
  {length:bodyIndices.length/3},(_,n)=>n%2);
 const skirtPositions=new Float32Array(343*3);
 const skirtIndices=new Uint16Array(576*3);
 return {bodyPositions,bodyIndices,skirtPositions,skirtIndices,
  coreBodyFaceMask,avatar:'female',pose:'blend-50',
  sourcePhotoSHA256:PHOTO,sourceAnatomyGLBSHA256:FEMALE,
  originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
  selectedActualWebGLPreview:true};
}
test('source-locked function cannot approve any surrogate or forged source, even when caller supplies valid SHA strings',()=>{
 const x=nativeFixture(),out=audit(x);
 assert.equal(out.status,
  'ORIGINAL_BODY_OPEN_OR_NONMANIFOLD_CANNOT_PROVE_SIGNED_INSIDE_OUTSIDE');
 assert.equal(out.originalBodyWholeMeshFacesNotCoreFiltered,true);
 assert.equal(out.closedVolumeCertified,false);
 assert.equal(out.signedInsideOutsideVerified,false);
 assert.equal(out.releaseAuthorized,false);
 assert.equal(out.consumer3DAdmitted,false);
 assert.equal(out.originalPhoto2DFallbackRequired,true);
 for(const v of [
  {avatar:'person'}, {pose:'fabric simulation'},
  {sourcePhotoSHA256:'f'.repeat(64)},
  {sourceAnatomyGLBSHA256:'a'.repeat(64)},
  {originalRig163Bones:false},{selectedActualWebGLPreview:false},
  {selectedMeasuredFivePoseBvh:false},
  {coreBodyFaceMask:new Uint8Array(50)},
  {bodyIndices:new Uint16Array([0,1,2])}
 ]){
  const r=audit({...x,...v});
  assert.equal(r.status,'ORIGINAL_BODY_CLOSURE_UNVERIFIABLE');
  assert.equal(r.originalPhoto2DFallbackRequired,true);
  assert.equal(r.consumer3DAdmitted,false);
 }
});
