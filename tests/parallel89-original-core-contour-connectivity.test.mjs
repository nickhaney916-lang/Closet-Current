/**
 * Pure synthetic geometric adversarial cases are NOT original P541
 * authenticity proof; real browser checks must use original public CC0
 * 163bone male/female GLBs and licensed Commons-0043 photographed skirt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeOriginalContourConnectivity89 as analyze,
 auditActualOriginalContourConnectivity89 as audit}
 from '../research/parallel89/skirt-original-core-contour-connectivity89.mjs';
import {summarizeOriginalCoreNoHitGeometry89 as previous}
 from '../research/parallel89/skirt-original-core-nohit-geometry89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
function fixture({shape='closed',mixed=false,mask=1}={}){
 const base=[
  -.2,.2,-.2, .2,.2,-.2, .2,1.8,-.2, -.2,1.8,-.2,
  -.2,.2,.2,  .2,.2,.2,  .2,1.8,.2, -.2,1.8,.2
 ];
 const body=[
  0,2,1,0,3,2, 4,5,6,4,6,7,
  0,1,5,0,5,4, 3,7,6,3,6,2,
  0,4,7,0,7,3, 1,2,6,1,6,5
 ];
 let sourceIds=new Uint16Array(8);
 if(shape==='single')body.splice(6);
 if(shape==='twoWalls')body.splice(12);
 if(shape==='split' || shape==='crossmesh'){
  base.push(...[base[0],base[1],base[2],
   base[4*3],base[4*3+1],base[4*3+2],
   base[7*3],base[7*3+1],base[7*3+2],
   base[3*3],base[3*3+1],base[3*3+2]]);
  const index=body.indexOf(0,24);
  assert.equal(index,24);
  body.splice(24,6,8,9,10,8,10,11);
  sourceIds=new Uint16Array(12);
  if(shape==='crossmesh')sourceIds.fill(1,8);
 }
 const p=new Float32Array(343*3),idx=new Uint16Array(576*3);
 for(let row=0;row<7;row++)for(let j=0;j<49;j++){
  const n=(49*row+j)*3,a=j*Math.PI/24;
  p[n]=.45*Math.cos(a);p[n+1]=.6+.12*row;
  p[n+2]=.45*Math.sin(a);
 }
 for(let row=0,k=0;row<6;row++)for(let j=0;j<48;j++){
  const a=row*49+j,b=a+49;
  idx[k++]=a;idx[k++]=b;idx[k++]=a+1;
  idx[k++]=a+1;idx[k++]=b;idx[k++]=b+1;
 }
 const sk=new Uint16Array(sourceIds.length*4),
  sw=new Float32Array(sourceIds.length*4);
 for(let i=0;i<sourceIds.length;i++){
  if(mixed){sk.set([0,1,2,0],4*i);sw.set([.4,.35,.25,0],4*i);}
  else{sk[4*i]=0;sw[4*i]=1;}
 }
 const bone=Array.from({length:163},(_,i)=>
  ({0:'spine04',1:'pelvisL',2:'upperleg01L'}[i]||'boneOriginal'+i));
 return {
  bodyPositions:Float32Array.from(base),
  bodyIndices:Uint16Array.from(body),
  skirtPositions:p,skirtIndices:idx,
  coreBodyFaceMask:new Uint8Array(body.length/3).fill(mask),
  skinIndices:sk,skinWeights:sw,sourceMeshIds:sourceIds,
  sourceMeshNames:shape==='crossmesh'?['sourceBodyA','sourceBodyB']:['sourceBodyA'],
  sourceBoneNamesByMesh:shape==='crossmesh'?[bone,bone.slice()]:[bone]
 };
}
function check(args){
 const saved=Object.fromEntries(Object.entries(args)
  .filter(([,x])=>ArrayBuffer.isView(x))
  .map(([k,v])=>[k,v.slice()]));
 const a=analyze(args),b=previous(args);
 assert.equal(a.originalSourceSkirtSpokeRayCount,336);
 assert.equal(a.originalBodyIndexedTriangleCount,b.originalIndexedBodyTriangleCount);
 assert.equal(a.genuineOriginalStrictCoreSourceFaceCount,
  b.originalStrictCoreFaceCount);
 assert.equal(a.hypothetical95AddedOriginalSourceFaces,
  b.original95PercentHypotheticalAddedFaces);
 assert.deepEqual(a.hypothetical95SourceRayCounts,
  b.original95PercentHypotheticalObservedRays);
 assert.equal(a.hypothetical95NoHitOriginalSkirtRays,
  b.original95PercentHypotheticalUnknownRays);
 assert.equal(a.originalSourceSevenRingContourConnectivity.length,7);
 for(let i=0;i<7;i++){
  const x=a.originalSourceSevenRingContourConnectivity[i],
   y=b.originalSourceSevenSkirtRingNoHitGeometry[i];
  assert.equal(x.original95NamedSourceContourSegments,
   y.originalSource95CorePlaneCutSegments);
  assert.equal(x.original95NoHitRayDirectionsCount,y.noHitRays);
  assert.equal(x.original95NoHitSectorSequenceRunLengths.reduce((s,n)=>s+n,0),
   y.noHitRays);
  assert.equal(x.original95OriginalIndexTopology.originalIndexedContourSegments,
   x.original95NamedSourceContourSegments);
  assert.equal(x.original95OriginalIndexTopology.originalIndexedClosedGraphCycles+
   x.original95OriginalIndexTopology.originalIndexedOpenGraphComponents+
   x.original95OriginalIndexTopology.originalIndexedBranchingGraphComponents,
   x.original95OriginalIndexTopology.originalIndexedGraphComponents);
 }
 assert.equal(a.virtualIndexTwinCoordinatesNotWelded,true);
 assert.equal(a.originalBodyNotProvenWatertightSignedVolume,true);
 assert.equal(a.noSourceOriginalModelMeshPhotoOrSkinMutation,true);
 assert.equal(a.originalPhoto2DFallbackRequired,true);
 assert.equal(a.consumer3DAdmitted,false);
 assert.equal(a.releaseAuthorized,false);
 for(const [k,v] of Object.entries(saved))assert.deepEqual(args[k],v);
 return a;
}
test('closed indexed original synthetic cube forms true indexed cycles at all seven skirt rings but cannot approve 3D',()=>{
 const r=check(fixture());
 assert.equal(r.totalOriginalIndexGraphOpenEndpointsAcrossSevenRings,0);
 assert.equal(r.totalOriginalIndexClosedGraphCyclesAcrossSevenRings,7);
 assert.equal(r.totalGeometricCoordinateMatchesWithDistinctSourceIndices,0);
 assert.equal(r.hypothetical95NoHitOriginalSkirtRays,0);
 assert.equal(r.originalBodyNotProvenWatertightSignedVolume,true);
});
test('genuine ORIGINAL indexed open wall has 2 graph endpoint identities per skirt band with NO false closed loop',()=>{
 const r=check(fixture({shape:'single'}));
 for(const row of r.originalSourceSevenRingContourConnectivity){
  assert.equal(row.original95OriginalIndexTopology.genuineIndexedOpenEndpoints,2);
  assert.equal(row.original95OriginalIndexTopology.originalIndexedClosedGraphCycles,0);
  assert.equal(row.original95OriginalIndexTopology.originalIndexedOpenGraphComponents,1);
 }
 assert.ok(r.hypothetical95NoHitOriginalSkirtRays>0);
});
test('two disjoint ORIGINAL indexed walls do not become closed shape because convex hull visually connects them',()=>{
 const r=check(fixture({shape:'twoWalls'}));
 for(const x of r.originalSourceSevenRingContourConnectivity){
  assert.ok(x.original95OriginalIndexTopology.genuineIndexedOpenEndpoints>=4);
  assert.equal(x.original95OriginalIndexTopology.originalIndexedClosedGraphCycles,0);
 }
});
test('UV split synthetic original GLB identical positions but different indices is a VIRTUAL seam, never graph-welded',()=>{
 const r=check(fixture({shape:'split'}));
 assert.ok(r.totalOriginalIndexGraphOpenEndpointsAcrossSevenRings>0);
 assert.ok(r.totalGeometricCoordinateMatchesWithDistinctSourceIndices>0);
 assert.equal(r.virtualIndexTwinCoordinatesNotWelded,true);
 assert.ok(r.originalSourceSevenRingContourConnectivity.every(x=>
  x.original95OriginalIndexTopology.originalIndexedClosedGraphCycles===0));
});
test('original GLB two source meshes with source-position coincidences remain separately indexed and never sewn',()=>{
 const r=check(fixture({shape:'crossmesh'}));
 assert.ok(r.originalSourceSevenRingContourConnectivity.some(x=>
  x.original95OriginalIndexTopology.coordinateEquivalentSeparateOriginalIndicesAcrossMeshes>0));
 assert.equal(r.virtualIndexTwinCoordinatesNotWelded,true);
});
test('95% original multiple low-dominance skin joints are an unchanged hypothetical only, never an approved source core mask',()=>{
 const r=check(fixture({mixed:true}));
 assert.equal(r.genuineOriginalStrictCoreSourceFaceCount,0);
 assert.equal(r.hypothetical95AddedOriginalSourceFaces,12);
 assert.equal(r.totalOriginalIndexClosedGraphCyclesAcrossSevenRings,7);
 assert.equal(r.consumer3DAdmitted,false);
});
test('original source exclusion mask must preserve unknown rather than connecting full original body',()=>{
 const r=check(fixture({mask:0}));
 assert.equal(r.genuineOriginalStrictCoreSourceFaceCount,0);
 assert.equal(r.hypothetical95AddedOriginalSourceFaces,0);
 assert.equal(r.hypothetical95NoHitOriginalSkirtRays,336);
 assert.ok(r.originalSourceSevenRingContourConnectivity.every(x=>
  x.original95OriginalIndexTopology.originalIndexedContourSegments===0));
});
test('genuine original JPEG/163bone identity and previous independent source contour source ray receipts fail-closed',()=>{
 const f=fixture(),prev=previous(f),base={...f,
  avatar:'female',pose:'source',sourcePhotoSHA256:PHOTO,
  sourceAnatomyGLBSHA256:RIG,originalRig163Bones:true,
  selectedMeasuredFivePoseBvh:true,selectedActualWebGLPreview:true,
  independentlyVerifiedOriginal95NoHitGeometry:prev
 };
 const valid=audit(base);
 assert.equal(valid.status,'ORIGINAL_SOURCE_CONTOUR_CONNECTIVITY_MAPPED_NOT_WEARABLE');
 assert.equal(valid.original7Ring336SourceRayCountsIndependentlyReconciled,true);
 assert.equal(valid.originalPhoto2DFallbackRequired,true);
 assert.equal(valid.originalBodyWatertightVolumeCertified,false);
 assert.equal(valid.releaseAuthorized,false);
 for(const changed of [
  {avatar:'owner'}, {pose:'moving'},
  {sourcePhotoSHA256:'0'.repeat(64)},
  {sourceAnatomyGLBSHA256:'0'.repeat(64)},
  {originalRig163Bones:false},
  {selectedMeasuredFivePoseBvh:false},
  {selectedActualWebGLPreview:false},
  {independentlyVerifiedOriginal95NoHitGeometry:{...prev,
   original95PercentHypotheticalUnknownRays:888}},
  {independentlyVerifiedOriginal95NoHitGeometry:{...prev,
   originalSourceSevenSkirtRingNoHitGeometry:[]}},
  {coreBodyFaceMask:new Uint8Array(1)}
 ]){
  const x=audit({...base,...changed});
  assert.equal(x.status,'SOURCE_CONTOUR_ORIGINAL_PROVENANCE_UNVERIFIABLE');
  assert.equal(x.releaseAuthorized,false);
  assert.equal(x.consumer3DAdmitted,false);
 }
});
test('true original indexed source positions, source-skin weights, source mesh identities and photo rings invalid fail-closed',()=>{
 const f=fixture();
 for(const changed of [
  {bodyPositions:Float32Array.from(f.bodyPositions,(v,i)=>i===0?NaN:v)},
  {skirtPositions:Float32Array.from(f.skirtPositions,(v,i)=>i===0?NaN:v)},
  {bodyIndices:Uint16Array.from(f.bodyIndices,(v,i)=>i===0?900:v)},
  {skirtIndices:Uint16Array.from(f.skirtIndices,(v,i)=>i===0?900:v)},
  {coreBodyFaceMask:new Uint8Array(1)},
  {skinIndices:Uint16Array.from(f.skinIndices,(v,i)=>i===0?163:v)},
  {skinWeights:Float32Array.from(f.skinWeights,(v,i)=>i===0?0.6:v)},
  {sourceMeshIds:Uint16Array.from(f.sourceMeshIds,(v,i)=>i===0?100:v)},
  {sourceMeshNames:['']},
  {sourceBoneNamesByMesh:[['invalid-bone-count']]}
 ])assert.throws(()=>analyze({...f,...changed}));
});
