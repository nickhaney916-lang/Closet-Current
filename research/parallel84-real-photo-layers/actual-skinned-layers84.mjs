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
function sample84(mesh,faceStride){
 if(!mesh?.isSkinnedMesh||mesh?.skeleton?.bones?.length!==163||
    typeof mesh.getVertexPosition!=='function'||
    !mesh.geometry?.getAttribute('position')?.isBufferAttribute||
    !mesh.geometry?.getAttribute('skinIndex')?.isBufferAttribute||
    !mesh.geometry?.getAttribute('skinWeight')?.isBufferAttribute)
   throw Error('source-163-bone-skinned-mesh-required');
 const g=mesh.geometry,position=g.getAttribute('position'),
  si=g.getAttribute('skinIndex'),sw=g.getAttribute('skinWeight');
 const uv=g.getAttribute('uv'),rest=g.getAttribute('dressRest'),
  shirtPanel=g.getAttribute('panelPosition'),
  pantsUV=g.getAttribute('pantsSourceUV'),
  pantsRest=g.getAttribute('pantsRest');
 const photoProjection=uv||rest||shirtPanel||pantsUV;
 const sourceOriginalRest=rest||shirtPanel||pantsRest;
 const mapped=!!photoProjection;
 const validSourceAttribute=(attr,size)=>!attr||
  (attr.isBufferAttribute&&attr.itemSize===size&&attr.count===position.count);

 if(si.count!==position.count||sw.count!==position.count||
    !mapped||!(sourceOriginalRest||uv)||
    !validSourceAttribute(uv,2)||
    !validSourceAttribute(rest,3)||
    !validSourceAttribute(shirtPanel,3)||
    !validSourceAttribute(pantsUV,2)||
    !validSourceAttribute(pantsRest,3)||
    (pantsUV&&!pantsRest)||
    (shirtPanel&&!g.getAttribute('panelNormal'))||
    (g.index&&g.index.count%3!==0)||
    (!g.index&&position.count%3!==0))
   throw Error('source-photo-projection-or-index-invalid');
 // P84 texture identity: a source garment's original UVs must be finite and
 // noncollapsed where present. P61's direct shader uses dressRest instead.
 // No inference about unphotographed backs or actual pixel pattern quality.
 for(let i=0;i<position.count;i++){
  if(uv&&(!Number.isFinite(uv.getX(i))||!Number.isFinite(uv.getY(i))))
   throw Error('source-projection-nonfinite');
  for(const xyz of [rest,shirtPanel,pantsRest])
   if(xyz&&![xyz.getX(i),xyz.getY(i),xyz.getZ(i)].every(Number.isFinite))
    throw Error('source-projection-nonfinite');
  if(pantsUV&&![pantsUV.getX(i),pantsUV.getY(i)].every(Number.isFinite))
   throw Error('source-projection-nonfinite');
 }
 if(uv){
  const at=i=>g.index?g.index.getX(i):i;
  for(let i=0;i<(g.index?.count??position.count);i+=3){
   const a=at(i),b=at(i+1),d=at(i+2);
   if(![a,b,d].every(j=>Number.isSafeInteger(j)&&j>=0&&j<position.count))
    throw Error('source-face-index-outside-vertex-range');
   const ux=uv.getX(b)-uv.getX(a),uy=uv.getY(b)-uv.getY(a);
   const vx=uv.getX(d)-uv.getX(a),vy=uv.getY(d)-uv.getY(a);
   if(Math.abs(ux*vy-uy*vx)<1e-12)
    throw Error('source-UV-collapsed');
  }
 }
 const faceCount=(g.index?.count??position.count)/3;
 if(!Number.isSafeInteger(faceCount)||faceCount<1||faceCount>300000||
    !Number.isSafeInteger(faceStride)||faceStride<1)
  throw Error('source-face-budget');
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
 // P84 bounded deterministic SOURCE-FACE sampling. This is a diagnostic,
 // never whole-garment collision clearance; omitted faces remain UNVERIFIED.
 const faces=new Float64Array(Math.ceil(faceCount/faceStride)*9);
 let sampledVertexIndex=0;
 for(let face=0;face<faceCount;face+=faceStride){
  for(let corner=0;corner<3;corner++){
   const i=face*3+corner,j=idx?idx.getX(i):i;
   if(!Number.isSafeInteger(j)||j<0||j>=position.count)
    throw Error('source-face-index-outside-vertex-range');
   faces.set(vertices.subarray(j*3,j*3+3),sampledVertexIndex*3);
   sampledVertexIndex++;
  }
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
  // Count the COMPLETE original face inventory before allocating world-space
  // buffers. A common stride preserves deterministic per-mesh distribution;
  // unlike silently truncating the last garment, both layers remain sampled.
  let fullSourceFaces=0,meshCount=0;
  for(const item of items){
   if(!item||!Array.isArray(item.meshes)||item.meshes.length>8)
    throw Error('source-photo-mesh-evidence-missing');
   for(const mesh of item.meshes){
    const count=(mesh?.geometry?.index?.count??mesh?.geometry?.getAttribute('position')?.count??0)/3;
    if(!Number.isSafeInteger(count)||count<1||count>300000)
     throw Error('source-face-budget');
    fullSourceFaces+=count;meshCount++;
   }
  }
  if(!Number.isSafeInteger(fullSourceFaces)||fullSourceFaces>300000||
    meshCount>16)throw Error('source-face-budget');
  let stride=1;
  const budgetAt=s=>items.reduce((n,item)=>n+item.meshes.reduce(
    (v,mesh)=>v+Math.ceil(
     ((mesh.geometry.index?.count??mesh.geometry.getAttribute('position').count)/3)/s
    ),0),0);
  while(budgetAt(stride)>maxFaces)stride++;
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
    const geometry=sample84(mesh,stride);
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
  // Original-source FACE inventory and analyzed STRIDE are counts only.
  // All omitted original triangle faces are unverified; the existing
  // independently conservative contact veto remains authoritative.
  const actuallyMeasured=receipt.originalSourceFaceCount??0;
  const rejected=receipt.status==='ORIGINAL_PHOTO_2D_FALLBACK';
  return Object.freeze({...receipt,
   actualSkinnedPoseSampled:!rejected,
   sourceBuffersPreserved:true,anatomicalBodyMeshes:bodies,
   fullOriginalSourceFaceCount:fullSourceFaces,
   sampledSourceFaceCount:actuallyMeasured,
   sourceFaceSamplingStride:stride,
   sourceFaceCoverageComplete:!rejected&&stride===1,
   originalFacesOmittedByBudget:fullSourceFaces-actuallyMeasured,
   sampledPoseIsNotWholeGarmentClearance:true,
   safe3D:false,contactClearanceProved:false,releaseAuthorized:false});
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
   'source-projection-nonfinite','source-UV-collapsed',
   'source-geometry-attribute-changed',
   'source-indices-or-material-changed']);
  return fallback(fixed.has(e?.message)?e.message:'unverified-source-pose');
 }
}
