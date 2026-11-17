/** P89 synthetic body-source localization tests. No synthetic fixture
 * establishes real 163-bone avatar geometry, signed body volume or a fit.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeOriginalBodyBoundaryRegions89 as measure,
 auditActualOriginalBodyBoundaryRegions89 as audit} from
 '../research/parallel89/skirt-original-source-boundary-regions89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const FEMALE='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
const names=first=>Array.from({length:163},(_,i)=>i===0?first:'sourceBone'+i);
function fixture({crossMeshes=true,broken=false}={}){
 const points=[
  0,0,0, 1,0,0, 0,1,0,
  1,0,0, 0,0,0, 1,-1,0
 ];
 if(broken)points[3]=2;
 return {
  posedPositions:Float32Array.from(points),
  restPositions:Float32Array.from(points),
  indices:Uint16Array.from([0,1,2,3,4,5]),
  skinIndices:new Uint16Array(6*4),
  skinWeights:Float32Array.from({length:24},(_,i)=>i%4===0?1:0),
  sourceMeshIds:Uint16Array.from([0,0,0,...Array(3).fill(crossMeshes?1:0)]),
  sourceMeshNames:['TorsoShell','ArmShell'],
  sourceBoneNamesByMesh:[names('spine'),names('hand')]
 };
}
function attest(f,exp){
 return audit({...f,
  avatar:'female',pose:'source',sourcePhotoSHA256:PHOTO,
  sourceAnatomyGLBSHA256:FEMALE,originalRig163Bones:true,
  selectedMeasuredFivePoseBvh:true,selectedActualWebGLPreview:true,
  independentSeamEvidence:{
   schema:'P89-pure-original-source-virtual-boundary-seam-evidence/v1',
   originalSourceBoundaryEdgeConservationVerified:true,
   originalSourceRestAndSkinAndMeshIdRequired:true,
   originalSourceBodyTriangleCount:2,
   rawOriginalSourceSingleFaceBoundaryEdges:6,
   compatibleOriginalRestAndSkinBoundaryEdges:exp.compat,
   geometryTwinsDifferentOriginalSourceMeshEdges:exp.foreign,
   sourceUnmatchedBoundaryEdges:exp.unmatched,
   geometricAmbiguousMultiCandidateBoundaryEdges:0,
   geometricTwinWindingConflictEdges:0,
   sourceGeometricallyCollapsedBoundaryEdges:0
  }
 });
}
test('two original indexed body triangles, distinct real mesh identities: map unmatched edges and cross-mesh coincidence separately',()=>{
 const f=fixture(),before=Object.fromEntries(Object.entries(f).filter(([,v])=>
  ArrayBuffer.isView(v)).map(([k,v])=>[k,v.slice()]));
 const x=measure(f);
 assert.equal(x.schema,'P89-pure-unmodified-anatomical-body-boundary-regions/v1');
 assert.equal(x.originalBodyIndexedTriangleCount,2);
 assert.equal(x.originalBodyIndexedBoundaryEdgeCount,6);
 assert.equal(x.sourceForeignMeshCoincidentTwinBoundaryEdges,2);
 assert.equal(x.sourceNoGeometricTwinBoundaryEdges,4);
 assert.equal(x.sourceCompatibleGeometricTwinBoundaryEdges,0);
 assert.equal(x.ambiguousBoundaryEdges,0);
 assert.equal(x.foreignSourceMeshAnatomicalRegions.sourceMeshPairBreakdown[0].label,'0<->1');
 assert.equal(x.foreignSourceMeshAnatomicalRegions.sourceMeshPairBreakdown[0].edges,2);
 assert.deepEqual(x.foreignSourceMeshAnatomicalRegions.originalSourceBoneRegionBreakdown.map(v=>v.label).sort(),
  ['ARMS_HANDS','TORSO_PELVIS']);
 assert.equal(x.foreignSourceMeshAnatomicalRegions.originalIndexedBoundaryEdgeCount,2);
 assert.equal(x.unmatchedSourceAnatomicalRegions.originalIndexedBoundaryEdgeCount,4);
 assert.equal(x.originalSourceBuffersNeverModified,true);
 assert.equal(x.realBodySignedExteriorContainmentNotCertified,true);
 for(const k of Object.keys(before))assert.deepEqual(f[k],before[k]);
});
test('same-original-mesh opposite-winding geometric edge twins are source-compatible candidates, never certified volume',()=>{
 const f=fixture({crossMeshes:false}),x=measure(f);
 assert.equal(x.originalBodyIndexedBoundaryEdgeCount,6);
 assert.equal(x.sourceCompatibleGeometricTwinBoundaryEdges,2);
 assert.equal(x.sourceForeignMeshCoincidentTwinBoundaryEdges,0);
 assert.equal(x.sourceNoGeometricTwinBoundaryEdges,4);
 assert.equal(x.releaseAuthorized,false);
});
test('source body edges lacking geometric twins are counted as unmatched, not invented as sewn seams',()=>{
 const f=fixture({broken:true}),x=measure(f);
 assert.ok(x.sourceNoGeometricTwinBoundaryEdges>=4);
 assert.equal(x.originalBodyIndexedBoundaryEdgeCount,6);
 assert.equal(x.sourceNoGeometricTwinBoundaryEdges+
  x.sourceCompatibleGeometricTwinBoundaryEdges+
  x.sourceForeignMeshCoincidentTwinBoundaryEdges+x.ambiguousBoundaryEdges,6);
 assert.equal(x.consumer3DAdmitted,false);
});
test('original bone naming and source height remain bounded, normalized, count-preserving aggregates',()=>{
 const x=measure(fixture());
 assert.equal(x.foreignSourceMeshAnatomicalRegions.originalBodyHeightBandsNormalizedNotMeasuredCentimeters,true);
 assert.equal(x.foreignSourceMeshAnatomicalRegions.onlyAggregateOriginalPublicBodyRegions,true);
 assert.equal(x.foreignSourceMeshAnatomicalRegions.originalSourceMeshBreakdown.reduce((n,v)=>n+v.edges,0),2);
 assert.equal(x.unmatchedSourceAnatomicalRegions.originalBodyRelativeHeightBreakdown.reduce((n,v)=>n+v.edges,0),4);
 assert.equal(x.sourceForeignMeshCoincidentTwinBoundaryEdges,2);
});
test('original public source gate refuses fake photo SHA, false 163-bone witness, forged counts and mismatched pose',()=>{
 const f=fixture(),expect={compat:0,foreign:2,unmatched:4};
 const good=attest(f,expect);
 assert.equal(good.status,'SOURCE_ANATOMICAL_GAPS_AND_FOREIGN_MESH_CONTACTS_NOT_SIGNED_VOLUME');
 assert.equal(good.sourceAnatomicalRegionEvidence.sourceNoGeometricTwinBoundaryEdges,4);
 assert.equal(good.originalPhoto2DFallbackRequired,true);
 assert.equal(good.consumer3DAdmitted,false);
 assert.equal(good.closedBodyVolumeCertified,false);
 assert.equal(good.signedExteriorContainmentCertified,false);
 assert.equal(good.releaseAuthorized,false);
 const forged=[
  {avatar:'owner'}, {pose:'continuous-motion'},
  {sourcePhotoSHA256:'f'.repeat(64)},
  {sourceAnatomyGLBSHA256:'f'.repeat(64)},
  {originalRig163Bones:false},{selectedActualWebGLPreview:false},
  {selectedMeasuredFivePoseBvh:false},
  {independentSeamEvidence:{schema:'user-claims-watertight'}},
  {independentSeamEvidence:{...good,
   schema:'P89-pure-original-source-virtual-boundary-seam-evidence/v1',
   originalSourceBoundaryEdgeConservationVerified:true,
   originalSourceRestAndSkinAndMeshIdRequired:true,
   sourceUnmatchedBoundaryEdges:0}}
 ];
 for(const v of forged){
  const old=audit({...f,avatar:'female',pose:'source',
   sourcePhotoSHA256:PHOTO,sourceAnatomyGLBSHA256:FEMALE,
   originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
   selectedActualWebGLPreview:true,
   independentSeamEvidence:{
    schema:'P89-pure-original-source-virtual-boundary-seam-evidence/v1',
    originalSourceBoundaryEdgeConservationVerified:true,
    originalSourceRestAndSkinAndMeshIdRequired:true,
    originalSourceBodyTriangleCount:2,
    rawOriginalSourceSingleFaceBoundaryEdges:6,
    compatibleOriginalRestAndSkinBoundaryEdges:0,
    geometryTwinsDifferentOriginalSourceMeshEdges:2,
    sourceUnmatchedBoundaryEdges:4,
    geometricAmbiguousMultiCandidateBoundaryEdges:0,
    geometricTwinWindingConflictEdges:0,
    sourceGeometricallyCollapsedBoundaryEdges:0
   },...v});
  assert.equal(old.status,'UNVERIFIED_ORIGINAL_ANATOMICAL_BOUNDARY_REGION_SOURCE');
  assert.equal(old.originalPhoto2DFallbackRequired,true);
  assert.equal(old.consumer3DAdmitted,false);
 }
 const wrong=attest(f,{compat:0,foreign:2,unmatched:3});
 assert.equal(wrong.status,'UNVERIFIED_ORIGINAL_ANATOMICAL_BOUNDARY_REGION_SOURCE');
});
test('reject bad geometry, foreign-source faces, fake skin bones or unspecified mesh names before any region evidence',()=>{
 const f=fixture();
 for(const change of [
  {posedPositions:Float32Array.from(f.posedPositions,(v,i)=>i===2?NaN:v)},
  {restPositions:new Float32Array(1)},
  {indices:Uint32Array.from(f.indices,(v,i)=>i===0?9999:v)},
  {skinIndices:Uint16Array.from(f.skinIndices,(v,i)=>i===0?163:v)},
  {skinWeights:Float32Array.from(f.skinWeights,(v,i)=>i===0?0.9:v)},
  {sourceMeshIds:Uint16Array.from(f.sourceMeshIds,(v,i)=>i===0?1:v)},
  {sourceMeshNames:['']},
  {sourceBoneNamesByMesh:[names('spine')]},
  {sourceBoneNamesByMesh:[names('spine'),names('')].map(v=>v.map(x=>x||''))}
 ])assert.throws(()=>measure({...f,...change}));
});
