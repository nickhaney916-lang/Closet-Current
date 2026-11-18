/** Synthetic geometry contracts ONLY. Original SHA-pinned licensed photograph,
 * genuine P541 163-bone original rig and P84 indexed BVH are tested
 * independently in native Chromium / WebKit no-deploy CI. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {auditOriginalUpperSkirtInwardSourceWitness89 as audit}
 from '../research/parallel89/skirt-original-upper-inward-witness89.mjs';
import {auditSelectedOriginalSkirtRadialGap89}
 from '../research/parallel89/skirt-source-radial-gap89.mjs';
import {auditOriginalWholeBodyCoreRayCauses89}
 from '../research/parallel89/skirt-original-ray-coverage-causes89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
function fixture({clothRadius=.12,bodyRadii=[.2],meshSplit=false}={}){
 const cloth=[],skirtIx=[];
 for(let row=0;row<7;row++)for(let j=0;j<=48;j++){
  const a=j*Math.PI/24;
  cloth.push(clothRadius*Math.sin(a),1.6-row*.12,
   clothRadius*Math.cos(a));
  if(row<6&&j<48){
   const v=row*49+j,w=v+49;
   skirtIx.push(v,v+1,w,v+1,w+1,w);
  }
 }
 const verts=[],faces=[],meshIds=[],radiusMap=[];
 for(let shell=0;shell<bodyRadii.length;shell++){
  const offset=verts.length/3,r=bodyRadii[shell];
  for(const y of [.2,2])for(let j=0;j<=160;j++){
   const t=j*2*Math.PI/160;
   verts.push(r*Math.sin(t),y,r*Math.cos(t));
   meshIds.push(meshSplit?shell:0);
   radiusMap.push(r);
  }
  for(let j=0;j<160;j++){
   const a=offset+j,b=offset+j+161;
   faces.push(a,b,a+1,a+1,b,b+1);
  }
 }
 const mask=Uint8Array.from({length:faces.length/3},(_,i)=>i===2?0:1);
 const n=verts.length/3,weights=new Float32Array(4*n);
 for(let i=0;i<n;i++)weights[4*i]=1;
 const sourceMeshNames=meshSplit?bodyRadii.map((_,i)=>'originalBody'+i):
  ['originalBody'];
 const sourceBoneNamesByMesh=sourceMeshNames.map(()=>Array.from(
  {length:163},(_,i)=>i===0?'spine01':'sourceBone'+i));
 return {
  skirtPositions:new Float32Array(cloth),skirtIndices:new Uint16Array(skirtIx),
  bodyPositions:new Float32Array(verts),bodyIndices:new Uint16Array(faces),
  coreBodyFaceMask:mask,restPositions:new Float32Array(verts),
  skinIndices:new Uint16Array(4*n),skinWeights:weights,
  sourceMeshIds:Uint16Array.from(meshIds),
  sourceMeshNames,sourceBoneNamesByMesh,
  avatar:'female',pose:'source',sourcePhotoSHA256:PHOTO,
  sourceAnatomyGLBSHA256:RIG,originalRig163Bones:true,
  selectedActualWebGLPreview:true,selectedFivePoseBvhVerified:true
 };
}
function attested(x){
 const p=auditSelectedOriginalSkirtRadialGap89({...x,
  selectedMeasuredFivePoseBvh:true});
 assert.equal(p.schema,'P89-actual-original-163bone-source-radial-body-gap/v1');
 const full=auditOriginalWholeBodyCoreRayCauses89({
  ...x,priorExactRadialReceipt:p
 });
 assert.equal(full.status,
  'ORIGINAL_SOURCE_BODY_RAY_COVERAGE_CAUSES_MEASURED_NO_FIT_AUTHORIZED');
 return {...x,priorExactRadialReceipt:p,priorWholeVsCoreReceipt:full};
}
function checked(x){
 const originals=Object.fromEntries(Object.entries(x).filter(([,v])=>
  ArrayBuffer.isView(v)).map(([k,v])=>[k,v.slice()]));
 const r=audit(x);
 assert.equal(r.schema,'P89-original-upper-skirt-source-inward-ray-anatomy/v1');
 assert.notEqual(r.status,'ORIGINAL_UPPER_SOURCE_INWARD_PROVENANCE_UNVERIFIABLE',
  JSON.stringify(r));
 assert.equal(r.originalCoreSourceInwardRayCount+
  r.originalCoreSourceNearRayCount+
  r.originalCoreSourceOutwardRayCount+
  r.originalCoreSourceUnknownRayCount,48);
 assert.equal(r.originalInwardTopSectorWitnesses.length,
  r.originalCoreSourceInwardRayCount);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 assert.equal(r.noOriginalFaceIdsOrOriginalSourceBodyCoordinatesReleased,true);
 assert.equal(r.neverWeldOrFillOriginalHumanSurface,true);
 assert.equal(JSON.stringify(r).includes('faceIndex'),false);
 for(const [k,v] of Object.entries(originals))assert.deepEqual(x[k],v);
 return r;
}
test('original small photographed source skirt radial inward is localized to original mesh and 163bone spine names without releasing source faces',()=>{
 const r=checked(attested(fixture()));
 assert.equal(r.status,
  'ORIGINAL_UPPER_INWARD_SOURCE_RAY_BONE_MESH_WITNESSED_NOT_WEARABLE');
 assert.ok(r.originalCoreSourceInwardRayCount>=40);
 assert.equal(r.raysWithFirstOriginalBodyHitAlreadyBeyondSkirt,
  r.originalCoreSourceInwardRayCount);
 assert.ok(r.originalInwardTopSectorWitnesses.every(x=>
  x.farSourceOriginalMeshAndBoneProof.originalSourceMeshes.includes('originalBody')&&
  x.farSourceOriginalMeshAndBoneProof.originalDominant163BoneNames.includes('spine01')&&
  x.farSourceOriginalMeshAndBoneProof.originalBoneAnatomicalRegions.includes('ORIGINAL_TORSO_HIP')&&
  x.originalNearestSourceBodyRayMeters>x.trueOriginalSkirtRayDistanceMeters&&
  x.originalRayDistanceBeyondSkirtMeters>0));
});
test('true original large photo skirt contains no top-band inward rays but is NOT physically approved',()=>{
 const r=checked(attested(fixture({clothRadius:.3})));
 assert.equal(r.status,'NO_ORIGINAL_UPPER_INWARD_RAY_OBSERVED_NOT_BODY_FIT');
 assert.equal(r.originalCoreSourceInwardRayCount,0);
 assert.equal(r.originalInwardTopSectorWitnesses.length,0);
 assert.equal(r.consumer3DAdmitted,false);
});
test('two concentric original source faces yield distinct nearer/farther ray depths; do not mistake farthest as signed penetration',()=>{
 const r=checked(attested(fixture({bodyRadii:[.08,.2],clothRadius:.12,
  meshSplit:true})));
 assert.ok(r.originalCoreSourceInwardRayCount>0);
 assert.ok(r.raysWithFarthestOriginalBodyHitBeyondNearerSourceHit>0);
 assert.ok(r.originalInwardTopSectorWitnesses.some(w=>
  w.originalNearAndFarDistancePattern===
   'ORIGINAL_FIRST_HIT_NEARER_BUT_FAR_FACE_BEHIND_SKIRT'&&
  w.independentlyDistinctSourceRayDepthCount>=2&&
  w.farSourceOriginalMeshAndBoneProof.originalSourceMeshes.includes('originalBody1')));
 assert.equal(r.positionalRayHitIsNotSignedExteriorOrActualFabricPenetration,true);
});
test('mutated previous original radial band-specific counts fail rather than source attribution',()=>{
 const x=attested(fixture());
 const r=audit({...x,priorExactRadialReceipt:{
  ...x.priorExactRadialReceipt,
  sevenOriginalSourceSkirtBands:x.priorExactRadialReceipt.sevenOriginalSourceSkirtBands.map((v,i)=>
   i===0?{...v,exactRayObservedInwardSectors:0}:v)
 }});
 assert.equal(r.status,'ORIGINAL_UPPER_SOURCE_INWARD_PROVENANCE_UNVERIFIABLE');
 assert.equal(r.reason,'independent-original-upper-ray-to-registered-receipt-mismatch');
});
test('corrupted original source bone/mesh name provenance fails closed; no inferred anatomical label',()=>{
 const x=attested(fixture());
 for(const bad of [
  {sourceMeshNames:['']},
  {sourceMeshNames:['bad\u0000label']},
  {sourceBoneNamesByMesh:[['spine01']]},
  {sourceMeshIds:new Uint16Array(x.sourceMeshIds.length).fill(99)},
  {skinIndices:new Uint16Array(x.skinIndices.length).fill(163)},
  {skinWeights:new Float32Array(2)},
  {restPositions:new Float32Array(3)}
 ]){
  const r=audit({...x,...bad});
  assert.equal(r.status,'ORIGINAL_UPPER_SOURCE_INWARD_PROVENANCE_UNVERIFIABLE');
  assert.equal(r.releaseAuthorized,false);
 }
});
test('incorrect original rig/photo or forged selected source BVH acceptance never returns anatomical source proof',()=>{
 const x=attested(fixture());
 for(const bad of [
  {sourcePhotoSHA256:'bad'}, {sourceAnatomyGLBSHA256:'bad'},
  {originalRig163Bones:false},{selectedActualWebGLPreview:false},
  {selectedFivePoseBvhVerified:false},{avatar:'unknown'},
  {pose:'unknown'},{priorWholeVsCoreReceipt:null},
  {coreBodyFaceMask:new Uint8Array(3)},
  {bodyIndices:Uint16Array.from([65535,...x.bodyIndices])},
  {skirtPositions:Float32Array.from(x.skirtPositions,(n,i)=>
   i===0?Infinity:n)}
 ]){
  const r=audit({...x,...bad});
  assert.equal(r.status,'ORIGINAL_UPPER_SOURCE_INWARD_PROVENANCE_UNVERIFIABLE');
 }
});
test('source proof mismatch across original 7 bands is still BLOCKED, never silently attributed to top band',()=>{
 const x=attested(fixture());
 const r=audit({...x,priorWholeVsCoreReceipt:{
  ...x.priorWholeVsCoreReceipt,
  originalCoreSourceExactInwardRaySectors:99
 }});
 assert.equal(r.status,'ORIGINAL_UPPER_SOURCE_INWARD_PROVENANCE_UNVERIFIABLE');
 assert.equal(r.reason,'original-ray-source-inward-witness-unreconciled-across-seven-bands');
});
test('nothing is inferred without the independent original source body radial and whole-source prior witnesses',()=>{
 const x=fixture();
 const r=audit(x);
 assert.equal(r.status,'ORIGINAL_UPPER_SOURCE_INWARD_PROVENANCE_UNVERIFIABLE');
 assert.equal(r.reason,
  'original-indexed-rest-skin-mesh-and-two-independent-ray-receipts-required');
});
