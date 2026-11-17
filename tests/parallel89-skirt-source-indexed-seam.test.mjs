/** Synthetic seam contracts are not genuine CC0 GLB acceptance.
 * Native true Commons-0043 / P541 male+female 163-bone checks use CI.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeOriginalBodyIndexedSeams89 as measure,
 auditRealOriginalBodySeams89 as audit} from
 '../research/parallel89/skirt-source-indexed-seam89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const FEMALE='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
// Fully closed, mutually opposite-wound synthetic cube source face list.
const p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
 [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
const faces=[
 [0,2,1],[0,3,2],[4,5,6],[4,6,7],
 [0,1,5],[0,5,4],[3,7,6],[3,6,2],
 [0,4,7],[0,7,3],[1,2,6],[1,6,5]
];
function fixture({facesUsed=faces}={}){
 const rest=[],index=[],skinIdx=[],skinW=[],mesh=[];
 for(const face of facesUsed)for(const i of face){
  rest.push(...p[i]);index.push(index.length);
  skinIdx.push(0,0,0,0);
  skinW.push(1,0,0,0);
  mesh.push(0);
 }
 const posedPositions=new Float32Array(rest),restPositions=new Float32Array(rest);
 return {posedPositions,restPositions,indices:Uint16Array.from(index),
  skinIndices:Uint16Array.from(skinIdx),skinWeights:Float32Array.from(skinW),
  sourceMeshIds:Uint16Array.from(mesh)};
}
test('source original index-split closed cube yields opposite-wound proven virtual edge twins with all original sources immutable',()=>{
 const a=fixture(),snap={
  position:a.posedPositions.slice(),rest:a.restPositions.slice(),index:a.indices.slice(),
  skin:a.skinIndices.slice(),weights:a.skinWeights.slice(),meshes:a.sourceMeshIds.slice()};
 const r=measure(a);
 assert.equal(r.originalSourceBodyTriangleCount,12);
 assert.equal(r.rawOriginalSourceSingleFaceBoundaryEdges,36);
 assert.equal(r.originalSourceGeometryTwinPairs,18);
 assert.equal(r.compatibleOriginalRestAndSkinTwinEdgePairs,18);
 assert.equal(r.compatibleOriginalRestAndSkinBoundaryEdges,36);
 assert.equal(r.unresolvedOriginalBoundaryEdges,0);
 assert.equal(r.originalSourceBoundaryEdgeConservationVerified,true);
 assert.equal(r.geometryTwinsDifferentOriginalSourceMeshEdges,0);
 assert.equal(r.geometryTwinsDifferentOriginalRestPoseEdges,0);
 assert.equal(r.geometryTwinsDifferentOriginalSkinInfluenceEdges,0);
 assert.equal(r.virtualTwinsNeverProofOfSealedPhysicalAnatomy,true);
 assert.equal(r.releaseAuthorized,false);
 assert.deepEqual(a.posedPositions,snap.position);
 assert.deepEqual(a.restPositions,snap.rest);
 assert.deepEqual(a.indices,snap.index);
 assert.deepEqual(a.skinIndices,snap.skin);
 assert.deepEqual(a.skinWeights,snap.weights);
 assert.deepEqual(a.sourceMeshIds,snap.meshes);
});
test('source original open synthetic surface leaves genuine unmatched boundary, never fabricated seam closure',()=>{
 const a=fixture({facesUsed:faces.slice(0,-1)}),r=measure(a);
 assert.equal(r.rawOriginalSourceSingleFaceBoundaryEdges,33);
 assert.ok(r.sourceUnmatchedBoundaryEdges>=3);
 assert.ok(r.unresolvedOriginalBoundaryEdges>=3);
 assert.equal(r.releaseAuthorized,false);
});
test('spatially coincident rest vertices with different source skin indices cannot become proven virtual stitches',()=>{
 const a=fixture();
 a.skinIndices[0]=1;
 const r=measure(a);
 assert.ok(r.originalSourceGeometryTwinPairs>=10);
 assert.ok(r.geometryTwinsWithConflictingOriginalProvenanceEdges>0);
 assert.ok(r.geometryTwinsDifferentOriginalSkinInfluenceEdges>0);
 assert.equal(r.originalGeometryTwinMismatchReasonsExhaustive,true);
 assert.ok(r.unresolvedOriginalBoundaryEdges>0);
});
test('same posed positions but changed real source rest positions reject claimed original seam equivalence',()=>{
 const a=fixture();
 a.restPositions[0]+=.004;
 const r=measure(a);
 assert.ok(r.geometryTwinsWithConflictingOriginalProvenanceEdges>0);
 assert.ok(r.geometryTwinsDifferentOriginalRestPoseEdges>0);
 assert.ok(r.unresolvedOriginalBoundaryEdges>0);
});
test('matching world positions across different source anatomical mesh IDs are never automatically stitched',()=>{
 const a=fixture();
 a.sourceMeshIds[0]=1;
 const r=measure(a);
 assert.ok(r.geometryTwinsWithConflictingOriginalProvenanceEdges>0);
 assert.ok(r.geometryTwinsDifferentOriginalSourceMeshEdges>0);
 assert.ok(r.unresolvedOriginalBoundaryEdges>0);
});
test('ambiguous geometric overlaid source face and duplicate edge occupancy cannot qualify as unique topological seam',()=>{
 const a=fixture({facesUsed:[...faces,faces[0]]});
 const r=measure(a);
 assert.ok(r.geometricAmbiguousMultiCandidateBoundaryEdges>0);
 assert.ok(r.unresolvedOriginalBoundaryEdges>0);
 assert.equal(r.releaseAuthorized,false);
});
test('untrusted source provenance and fake human/mesh identities are blocked without exporting data',()=>{
 const a=fixture();
 for(const overrides of [
  {avatar:'owner'},{pose:'fabric-motion'},
  {sourcePhotoSHA256:'f'.repeat(64)},
  {sourceAnatomyGLBSHA256:'f'.repeat(64)},
  {originalRig163Bones:false},{selectedActualWebGLPreview:false},
  {selectedMeasuredFivePoseBvh:false},
  {originalBodyTopologyBoundaryEdges:17},
  {restPositions:new Float32Array(1)},
  {skinWeights:new Float32Array(1)},
  {skinWeights:Float32Array.from(a.skinWeights,(v,i)=>i===0?NaN:v)},
  {posedPositions:Float32Array.from(a.posedPositions,(v,i)=>i===0?NaN:v)},
  {indices:Uint32Array.from(a.indices,(v,i)=>i===0?99999:v)}
 ]){
  const result=audit({...a,avatar:'female',pose:'source',
   sourcePhotoSHA256:PHOTO,sourceAnatomyGLBSHA256:FEMALE,
   originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
   selectedActualWebGLPreview:true,
   originalBodyTopologyBoundaryEdges:36,...overrides});
  assert.equal(result.status,'SOURCE_ORIGINAL_BODY_SEAM_PROVENANCE_UNVERIFIABLE');
  assert.equal(result.releaseAuthorized,false);
  assert.equal(result.sourcePhoto2DFallbackRequired,true);
 }
});
test('even exact source-provenance twin equivalence can never admit a 3D wearable via this research gate',()=>{
 const a=fixture(),r=audit({...a,avatar:'female',pose:'source',
  sourcePhotoSHA256:PHOTO,sourceAnatomyGLBSHA256:FEMALE,
  originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
  selectedActualWebGLPreview:true,originalBodyTopologyBoundaryEdges:36});
 assert.equal(r.status,'ALL_ORIGINAL_BOUNDARIES_VIRTUALLY_PAIRED_NOT_WATERTIGHT_PROOF');
 assert.equal(r.virtualSeamEvidence.compatibleOriginalRestAndSkinTwinEdgePairs,18);
 assert.equal(r.trueClosedBodyVolumeCertified,false);
 assert.equal(r.signedExteriorContainmentCertified,false);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.releaseAuthorized,false);
});
