/** SYNTHETIC independent adversarial cases; genuine source acceptance
 * requires original licensed source JPEG and real P541 163bone browsers.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeSourceContourEndpointProvenance89 as measure,
 auditSourceContourEndpointProvenance89 as audit}
 from '../research/parallel89/skirt-original-contour-endpoint-provenance89.mjs';
import {summarizeOriginalContourConnectivity89 as previous}
 from '../research/parallel89/skirt-original-core-contour-connectivity89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const FEMALE='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
function fixture({type='closed',blend=false}={}){
 const pos=[
  -.2,.2,-.2, .2,.2,-.2, .2,1.8,-.2, -.2,1.8,-.2,
  -.2,.2,.2, .2,.2,.2, .2,1.8,.2, -.2,1.8,.2
 ];
 const all=[0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,
  3,7,6,3,6,2,0,4,7,0,7,3,1,2,6,1,6,5];
 if(type==='wall')all.splice(6);
 if(['uvsplit','skinchange','restchange','meshchange'].includes(type)){
  const dup=[0,4,7,3];
  for(const i of dup)pos.push(...pos.slice(i*3,i*3+3));
  all.splice(24,6,8,9,10,8,10,11);
 }
 const verts=pos.length/3;
 const bodyPositions=Float32Array.from(pos),restPositions=Float32Array.from(pos),
  bodyIndices=Uint16Array.from(all),coreBodyFaceMask=new Uint8Array(all.length/3).fill(1),
  skinIndices=new Uint16Array(verts*4),skinWeights=new Float32Array(verts*4),
  sourceMeshIds=new Uint16Array(verts);
 if(type==='restchange')restPositions[8*3]+=.02;
 if(type==='meshchange')sourceMeshIds.fill(1,8);
 for(let i=0;i<verts;i++){
  if(blend){skinIndices.set([0,1,2,0],i*4);skinWeights.set([.4,.35,.25,0],i*4);}
  else{skinIndices[4*i]=0;skinWeights[4*i]=1;}
 }
 if(type==='skinchange'){
  for(let i=8;i<12;i++){skinIndices[4*i]=1;skinWeights[4*i]=1;}
 }
 const skirtPositions=new Float32Array(343*3),skirtIndices=new Uint16Array(576*3);
 for(let row=0;row<7;row++)for(let i=0;i<49;i++){
  const k=3*(row*49+i),a=i*Math.PI/24;
  skirtPositions[k]=.45*Math.cos(a);
  skirtPositions[k+1]=.6+.12*row;
  skirtPositions[k+2]=.45*Math.sin(a);
 }
 for(let row=0,k=0;row<6;row++)for(let i=0;i<48;i++){
  const a=row*49+i,c=a+49;
  skirtIndices[k++]=a;skirtIndices[k++]=c;skirtIndices[k++]=a+1;
  skirtIndices[k++]=a+1;skirtIndices[k++]=c;skirtIndices[k++]=c+1;
 }
 const names=Array.from({length:163},(_,i)=>
  ({0:'spine04',1:'pelvisL',2:'upperleg01L'}[i]||'originalBone'+i));
 return {bodyPositions,restPositions,bodyIndices,skirtPositions,skirtIndices,
  coreBodyFaceMask,skinIndices,skinWeights,sourceMeshIds,
  sourceMeshNames:type==='meshchange'?['sourceA','sourceB']:['sourceA'],
  sourceBoneNamesByMesh:type==='meshchange'?[names,names.slice()]:[names]
 };
}
const count=(report,key)=>report.originalEndpointCauseTotals[key];
function checked(f){
 const snapshot=Object.fromEntries(Object.entries(f).filter(([,v])=>ArrayBuffer.isView(v))
  .map(([k,v])=>[k,v.slice()]));
 const p=previous(f),v=measure(f);
 assert.equal(v.schema,'P89-pure-original-source-contour-endpoint-rest-skin-face-proof/v1');
 assert.equal(v.originalSourceBodyIndexedTriangles,p.originalBodyIndexedTriangleCount);
 assert.equal(v.originalSourceIndexedOpenEndpointTotal,
  p.totalOriginalIndexGraphOpenEndpointsAcrossSevenRings);
 assert.equal(v.originalSevenSourceSkirtEndpointRings.length,7);
 for(let i=0;i<7;i++){
  const x=v.originalSevenSourceSkirtEndpointRings[i],
   y=p.originalSourceSevenRingContourConnectivity[i];
  assert.equal(x.originalSkirtRing,i);
  assert.equal(x.indexedGraphOpenEndpoints,
   y.original95OriginalIndexTopology.genuineIndexedOpenEndpoints);
  assert.equal(x.sourceOriginal95ContourSegments,y.original95NamedSourceContourSegments);
  assert.equal(Object.values(x.disjointIndexedEndpointProvenance)
   .reduce((s,n)=>s+n,0),x.indexedGraphOpenEndpoints);
 }
 assert.equal(Object.values(v.originalEndpointCauseTotals).reduce((s,n)=>s+n,0),
  v.originalSourceIndexedOpenEndpointTotal);
 assert.equal(v.sourceIndexOrRestSkinCandidateEndpointTotal+
  v.posedOnlyCoincidenceUntrustedEndpointTotal+
  v.originalNoMatchingEndpointTotal,v.originalSourceIndexedOpenEndpointTotal);
 assert.equal(v.originalPhoto2DFallbackRequired,true);
 assert.equal(v.sourceVirtualRestAndSkinEvidenceNeverSewn,true);
 assert.equal(v.originalOnlyWorldCoordinateMatchNotStitchable,true);
 assert.equal(v.sourceModelSignedBodyVolumeUnproved,true);
 assert.equal(v.consumer3DAdmitted,false);
 for(const [k,x] of Object.entries(snapshot))assert.deepEqual(f[k],x);
 return v;
}
test('strict original indexed cube true closed source ring has ZERO open graph endpoints and cannot authorize wearing',()=>{
 const v=checked(fixture());
 assert.equal(v.originalSourceIndexedOpenEndpointTotal,0);
 assert.equal(v.sourceIndexOrRestSkinCandidateEndpointTotal,0);
});
test('SOURCE index neighbors excluded by original anatomical core mask stay excluded, do not become wearable geometry',()=>{
 const f=fixture();f.coreBodyFaceMask[0]=0;f.coreBodyFaceMask[1]=0;
 const v=checked(f);
 assert.ok(count(v,'ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_MASK')>0);
 assert.equal(v.sourceOriginalFaceMaskExclusionsNeverPromoted,true);
});
test('open original source wall without any original neighbor leaves real unidentified endpoints',()=>{
 const v=checked(fixture({type:'wall'}));
 assert.ok(v.originalSourceIndexedOpenEndpointTotal>0);
 assert.ok(count(v,'NO_SOURCE_INDEX_OR_PROVENANCE_COMPATIBLE_NEIGHBOR')>0);
});
test('split original source UV position INDEX with identical rest+skin+mesh is a compatible VIRTUAL seam, never welded',()=>{
 const v=checked(fixture({type:'uvsplit'}));
 assert.ok(count(v,'POSSIBLE_ORIGINAL_UV_SPLIT_REST_SKIN_AND_MESH_COMPATIBLE')>0);
 assert.equal(v.sourceVirtualRestAndSkinEvidenceNeverSewn,true);
});
test('same posed positions but DIFFERENT original source rest position never qualifies as compatible index seam',()=>{
 const v=checked(fixture({type:'restchange'}));
 assert.ok(count(v,'POSED_COINCIDENT_DIFFERENT_ORIGINAL_REST')>0);
});
test('same posed and rest vertex coordinates but DIFFERENT original skin influence is untrusted',()=>{
 const v=checked(fixture({type:'skinchange'}));
 assert.ok(count(v,'POSED_COINCIDENT_DIFFERENT_ORIGINAL_SKIN')>0);
 assert.equal(count(v,'POSSIBLE_ORIGINAL_UV_SPLIT_REST_SKIN_AND_MESH_COMPATIBLE'),0);
});
test('same coordinates on ORIGINAL DIFFERENT BODY MESHES cannot count as legitimate stitch',()=>{
 const v=checked(fixture({type:'meshchange'}));
 assert.ok(count(v,'POSED_COINCIDENT_DIFFERENT_ORIGINAL_MESH')>0);
});
test('95%-named original spine/pelvis/leg blended skin never changes source or grants approved core clearance',()=>{
 const v=checked(fixture({type:'uvsplit',blend:true}));
 assert.equal(v.sourceOriginalStrictCoreFaces,0);
 assert.equal(v.source95CounterfactualExtraFaces,12);
 assert.equal(v.consumer3DAdmitted,false);
});
test('locked original photo/163bone and prior independent 7-height graph reject forged total and per-ring receipts',()=>{
 const f=fixture(),p=previous(f);
 const a={...f,avatar:'female',pose:'source',sourcePhotoSHA256:PHOTO,
  sourceAnatomyGLBSHA256:FEMALE,originalRig163Bones:true,
  selectedMeasuredFivePoseBvh:true,selectedActualWebGLPreview:true,
  priorOriginalIndexedContourGraph:p};
 const good=audit(a);
 assert.equal(good.status,'ORIGINAL_SOURCE_ENDPOINT_PROVENANCE_RESOLVED_RESEARCH_ONLY');
 assert.equal(good.originalSourceIndexedEndpointCountsIndependentlyReconciled,true);
 assert.equal(good.originalBodySignedVolumeCertified,false);
 for(const changed of [
  {sourcePhotoSHA256:'0'.repeat(64)},{avatar:'private'},
  {pose:'unknown'},{sourceAnatomyGLBSHA256:'0'.repeat(64)},
  {originalRig163Bones:false},{selectedMeasuredFivePoseBvh:false},
  {selectedActualWebGLPreview:false},
  {priorOriginalIndexedContourGraph:{...p,totalOriginalIndexGraphOpenEndpointsAcrossSevenRings:100}},
  {priorOriginalIndexedContourGraph:{...p,originalSourceSevenRingContourConnectivity:[]}},
  {coreBodyFaceMask:new Uint8Array(1)}
 ]){
  const o=audit({...a,...changed});
  assert.equal(o.status,'ORIGINAL_SOURCE_CONTOUR_ENDPOINT_PROVENANCE_UNVERIFIABLE');
  assert.equal(o.releaseAuthorized,false);assert.equal(o.originalPhoto2DFallbackRequired,true);
 }
});
test('nonfinite original rest/posed, foreign mesh, bad joint/weights and corrupted photo ring faces fail closed',()=>{
 const f=fixture();
 for(const bad of [
  {bodyPositions:Float32Array.from(f.bodyPositions,(x,i)=>i===0?NaN:x)},
  {restPositions:Float32Array.from(f.restPositions,(x,i)=>i===0?NaN:x)},
  {skirtPositions:Float32Array.from(f.skirtPositions,(x,i)=>i===0?NaN:x)},
  {bodyIndices:Uint16Array.from(f.bodyIndices,(x,i)=>i===0?999:x)},
  {skirtIndices:Uint16Array.from(f.skirtIndices,(x,i)=>i===0?999:x)},
  {sourceMeshIds:Uint16Array.from(f.sourceMeshIds,(x,i)=>i===0?99:x)},
  {skinIndices:Uint16Array.from(f.skinIndices,(x,i)=>i===0?163:x)},
  {skinWeights:Float32Array.from(f.skinWeights,(x,i)=>i===0?.5:x)},
  {coreBodyFaceMask:new Uint8Array(1)},
  {sourceBoneNamesByMesh:[['fake']]}
 ])assert.throws(()=>measure({...f,...bad}));
});