/**
 * #84 detached-donor adapter. Samples ACTUAL 163-bone skinned mesh vertices
 * at the current scene pose and performs a distinct-source layer audit.
 * Caller must already have verified source JPEG SHA, owner/review lease and
 * actual texture-on-mesh receipt. Nothing here substitutes for those guards.
 * No source XYZ, JPEG, indices, owner token or UV leaves the return value.
 */
import * as THREE from 'three';
import {auditDistinctPhotoLayers84,PARALLEL84_SOURCE_REGISTRY} from './layer-contact84.mjs';
const fallback=reason=>Object.freeze({
 schema:'parallel84-distinct-source-layer-contact/v1',
 status:'ORIGINAL_PHOTO_2D_FALLBACK',reason,
 safe3D:false,releaseAuthorized:false,humanRealismApproved:false,
 contactClearanceProved:false,originalGarmentGeometryEdited:false
});
function sample84(mesh,maxFaces){
 if(!mesh?.isSkinnedMesh||mesh?.skeleton?.bones?.length!==163||
    typeof mesh.getVertexPosition!=='function'||
    !mesh.geometry?.getAttribute('position')?.isBufferAttribute||
    !mesh.geometry?.getAttribute('skinIndex')?.isBufferAttribute||
    !mesh.geometry?.getAttribute('skinWeight')?.isBufferAttribute)
   throw Error('source-163-bone-skinned-mesh-required');
 const g=mesh.geometry,position=g.getAttribute('position'),
  si=g.getAttribute('skinIndex'),sw=g.getAttribute('skinWeight');
 if(si.count!==position.count||sw.count!==position.count||
    !(g.getAttribute('uv')||g.getAttribute('dressRest'))||
    (g.index&&g.index.count%3!==0)||
    (!g.index&&position.count%3!==0))
   throw Error('source-photo-projection-or-index-invalid');
 const faceCount=(g.index?.count??position.count)/3;
 if(faceCount<1||faceCount>maxFaces)throw Error('source-face-budget');
 const original=Object.entries(g.attributes).map(([name,attr])=>
  [name,attr,attr.array.slice()]);
 const idx=g.index,oldIndex=idx?.array.slice()??null,oldMaterial=mesh.material;
 mesh.updateWorldMatrix(true,false);
 mesh.skeleton.update();
 if(!Number.isFinite(mesh.matrixWorld.determinant())||
    Math.abs(mesh.matrixWorld.determinant())<1e-12)
   throw Error('singular-or-nonfinite-pose-world-matrix');
 const vertices=new Float64Array(position.count*3),v=new THREE.Vector3();
 for(let i=0;i<position.count;i++){
  mesh.getVertexPosition(i,v);
  v.applyMatrix4(mesh.matrixWorld);
  if(![v.x,v.y,v.z].every(Number.isFinite))
   throw Error('nonfinite-posed-source-vertex');
  vertices.set([v.x,v.y,v.z],3*i);
 }
 const faces=new Float64Array(faceCount*9);
 for(let i=0;i<faceCount*3;i++){
  const j=idx?idx.getX(i):i;
  if(!Number.isSafeInteger(j)||j<0||j>=position.count)
   throw Error('source-face-index-outside-vertex-range');
  faces.set(vertices.subarray(j*3,j*3+3),i*3);
 }
 for(const [name,attr,snapshot] of original){
  if(g.getAttribute(name)!==attr||attr.array.length!==snapshot.length||
     !snapshot.every((n,i)=>Object.is(attr.array[i],n)))
   throw Error('source-geometry-attribute-changed');
 }
 if(g.index!==idx||mesh.material!==oldMaterial||
    (idx&&(!oldIndex||!oldIndex.every((n,i)=>idx.array[i]===n))))
   throw Error('source-indices-or-material-changed');
 return faces;
}
export function auditActualSkinnedOutfitLayers84({
 root,items,avatar,pose='neutral',maxFaces=30000,
 maxComparisons=800000,maxCandidatePairs=100000,toleranceMeters=.00002
}={}){
 try{
  if(!root?.isObject3D||!Array.isArray(items)||items.length!==2||
     !Number.isSafeInteger(maxFaces)||maxFaces<2||maxFaces>60000)
   throw Error('real-disposable-anatomical-outfit-required');
  let bodies=0;
  root.updateMatrixWorld(true);
  root.traverse(x=>{
   if(x.isSkinnedMesh&&!x.userData?.work56Garment&&
      x.skeleton?.bones?.length===163)bodies++;
  });
  if(bodies<1||bodies>16)
   throw Error('real-anatomical-body-not-loaded');
  const meshes=new Set(),sourceItems=items.map(item=>{
   if(!item||!PARALLEL84_SOURCE_REGISTRY[item.sourceId]||
      PARALLEL84_SOURCE_REGISTRY[item.sourceId].sha!==item.sourceSHA256||
      PARALLEL84_SOURCE_REGISTRY[item.sourceId].slot!==item.slot||
      item.rearViewPhotographed===true||
      !Array.isArray(item.meshes)||item.meshes.length<1||
      item.meshes.length>8||item.originalPhotoSHA256Verified!==true||
      item.actualPhotoTexelsOnSkinnedMesh!==true||
      item.actual163BoneSourceMesh!==true||
      item.originalSourceGeometryUnmodified!==true)
    throw Error('source-photo-mesh-evidence-missing');
   const parts=[];
   for(const mesh of item.meshes){
    if(meshes.has(mesh)||!mesh?.isSkinnedMesh||
       !mesh.visible||mesh.userData?.work56Garment!==true)
     throw Error('duplicate-hidden-or-noncloth-source-mesh');
    meshes.add(mesh);
    const geometry=sample84(mesh,maxFaces);
    parts.push(geometry);
   }
   const length=parts.reduce((n,p)=>n+p.length,0);
   if(length/9>maxFaces)throw Error('source-parts-face-budget');
   const triangles=new Float64Array(length);
   let offset=0;
   for(const p of parts){triangles.set(p,offset);offset+=p.length;}
   return {
    slot:item.slot,sourceId:item.sourceId,
    sourceSHA256:item.sourceSHA256,
    originalPhotoSHA256Verified:item.originalPhotoSHA256Verified,
    actualPhotoTexelsOnSkinnedMesh:item.actualPhotoTexelsOnSkinnedMesh,
    actual163BoneSourceMesh:true,
    originalSourceGeometryUnmodified:true,
    rearViewPhotographed:item.rearViewPhotographed,
    triangles
   };
  });
  const receipt=auditDistinctPhotoLayers84({
   items:sourceItems,avatar,pose,maxFaces,
   maxComparisons,maxCandidatePairs,toleranceMeters
  });
  // No posed triangles are returned or retained. The 2D board still owns
  // unsupported clothes and any uncertain or crossing layered fabric.
  return Object.freeze({...receipt,actualSkinnedPoseSampled:true,
   anatomicalBodyMeshes:bodies,sourceBuffersPreserved:true});
 }catch(e){
  // Only fixed codes generated internally above; never echo owner or mesh data.
  const fixed=new Set(['real-disposable-anatomical-outfit-required',
   'real-anatomical-body-not-loaded','source-photo-mesh-evidence-missing',
   'duplicate-hidden-or-noncloth-source-mesh',
   'source-163-bone-skinned-mesh-required',
   'source-photo-projection-or-index-invalid',
   'source-face-budget','source-parts-face-budget',
   'singular-or-nonfinite-pose-world-matrix',
   'nonfinite-posed-source-vertex',
   'source-face-index-outside-vertex-range',
   'source-geometry-attribute-changed',
   'source-indices-or-material-changed']);
  return fallback(fixed.has(e?.message)?e.message:'unverified-source-pose');
 }
}
