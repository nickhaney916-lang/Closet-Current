/**
 * Closet Current MAIN P157 — genuine licensed HEAD/HAIR replacement on the
 * authenticated original 163-bone source-photograph outfit figure.
 *
 * Research-only, vendor models SHA-256 checked before THREE GLTFLoader parse.
 * No original JPEG/cutout, garment mesh/source, owner session, shader source
 * file or 163-bone skeleton mutation. The textured 80-bone source HEAD/Hair
 * is mounted to the genuine original Head bone, with source mannequin face
 * masked by a reversible, narrow render-time fragment mask at the head only.
 *
 * No claim of 10/10 human likeness or physically accepted phone performance.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as skeletonClone} from 'three/addons/utils/SkeletonUtils.js';

export const HEAD157=Object.freeze({
 priority:157,
 mainParent:'334d7d44e800f666370d0c10896fd3d46fc35aba',
 original163BoneDonor:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
 sourceOriginalMIT:'Microsoft Rocketbox; Copyright (c) 2020 Microsoft; MIT',
 sourceMaleFemaleOriginalBoneCount:80,
 sourceHumanFullBodyReplaced:false,
 originalSourceGarmentGeometryModified:false,
 originalSavedOwnerPhotoModified:false,
 originalSourceRigModified:false,
 realSignedHostedTwoOwnerAcceptance:false,
 independentVisualPhotorealismApproved:false,
 physicalAndroidIphoneApproved:false,
 familyAlpha:'HOLD',releaseAuthorized:false
});
const assets=Object.freeze({
 female:Object.freeze({
  filename:'female-licensed-face-hair-only.glb',
  sha:'dd3772a97d2459975b34f8b1ca7902cb7d7e47d20091766a342b53425c9202e4',
  names:['f007_head','f007_opacity'],size:3186360
 }),
 male:Object.freeze({
  filename:'male-licensed-face-hair-only.glb',
  sha:'a4aed621b347f5ed2c6564ca4bb66c8d18681d94e7d3fdc246fdd64adbcc1f72',
  names:['m006_head','m006_opacity'],size:3208432
 })
});
const GROUP='research-licensed-source-head-graft-157';
const fail=(msg)=>{const e=Error('HEAD157 '+msg);e.code='head157-research-refused';throw e;};
const finite=x=>Number.isFinite(x);
const within=(x,a,b)=>Math.max(a,Math.min(b,x));
const orig=new WeakMap();
const modified=new WeakMap();
function sha256(buffer){
 return crypto.subtle.digest('SHA-256',buffer).then(b=>[...new Uint8Array(b)]
  .map(x=>x.toString(16).padStart(2,'0')).join(''));
}
async function getHeadAsset(figure){
 const item=assets[figure];
 if(!item)return null;
 const src=new URL('./assets/'+item.filename,import.meta.url);
 // Never permit third-party fetches from user device; path resolves inside
 // the same research tree as the pinned JS module in the detached donor.
 if(src.origin!==new URL(import.meta.url).origin)
  fail('licensed source asset origin escaped isolated research preview');
 const response=await fetch(src.href,{credentials:'same-origin',cache:'no-store',
  mode:'same-origin',redirect:'error'});
 if(!response.ok)fail('pinned source GLB missing HTTP '+response.status);
 const array=await response.arrayBuffer();
 if(array.byteLength!==item.size)fail('original P156 head binary size changed');
 if(await sha256(array)!==item.sha)fail('pinned MIT head source SHA256 mismatch');
 const gltf=await new GLTFLoader().parseAsync(array,src.href.slice(0,src.href.lastIndexOf('/')+1));
 const scene=gltf.scene;
 if(!scene)fail('licensed head GLB scene absent');
 scene.updateMatrixWorld(true);
 const seen=new Set(),mats=new Set();
 let skinned=0,maxBone=0,triangles=0;
 scene.traverse(o=>{
  if(!o.isMesh)return;
  if(!o.isSkinnedMesh||!o.skeleton?.bones?.length)
   fail('unskinned or detached licensed face geometry refused');
  skinned++;maxBone=Math.max(maxBone,o.skeleton.bones.length);
  if(Array.isArray(o.material))for(const m of o.material)mats.add(m.name);
  else if(o.material)mats.add(o.material.name);
  if(o.geometry?.index)triangles+=o.geometry.index.count/3;
  else if(o.geometry?.attributes?.position)
   triangles+=o.geometry.attributes.position.count/3;
 });
 if(skinned<1||maxBone!==80||!assets[figure].names.every(m=>mats.has(m))||
    mats.size!==2||triangles<1000)
  fail('altered source skinned head, original mesh materials or provenance');
 const size=new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
 if(![size.x,size.y,size.z].every(finite)||size.y<.16||size.y>.75)
  fail('licensed original head dimensions outside anatomy range');
 return Object.freeze({scene,size,skinned,maxBone,materials:[...mats].sort(),
  triangles,sha256:item.sha,figure,bytes:array.byteLength});
}
// Never perform network or GLTF texture fetch as a top-level awaited ES
// module dependency: the authenticated native app imports this module during
// its own model-load transaction. Awaited imports would indefinitely block
// the modelReady lifecycle. The existing async showroom.load(kind) explicitly
// preloads its own exact SHA-verified head *after* the original 163-bone body
// is available, and the synchronous P150 shade() applies the ready graft.
const cached=new Map(),pending=new Map();
export async function preloadLicensedSourceHead157(figure){
 if(!Object.prototype.hasOwnProperty.call(assets,figure))
  fail('unknown source male/female figure in verified preview');
 if(cached.has(figure))return cached.get(figure);
 if(!pending.has(figure)){
  const promise=getHeadAsset(figure).then(candidate=>{
   cached.set(figure,candidate);
   console.info('P157_VERIFIED_REAL_SOURCE_ASSET',figure,candidate.sha256,
    candidate.materials.join(','),candidate.maxBone);
   return candidate;
  }).catch(error=>{
   console.error('P157_EXACT_SOURCE_ASSET_REFUSED',figure,String(error));
   cached.set(figure,null);
   return null;
  });
  pending.set(figure,promise);
 }
 return pending.get(figure);
}
const skeletons=o=>{
 const list=[];o.traverse(m=>{
  if(m.isSkinnedMesh&&!m.userData?.work56Garment&&!m.userData?.head157OriginalLicensed){
   list.push(m);
  }
 });return list;
};
function originalSource(root){
 if(!root?.traverse)fail('pinned original source body required');
 root.updateMatrixWorld(true);
 const originalMeshes=skeletons(root),bounds=new THREE.Box3(),tmp=new THREE.Vector3();
 let body=0,ownerGarments=0,maxBones=0,total=0;
 root.traverse(o=>{
  if(o.isSkinnedMesh&&o.userData?.work56Garment)ownerGarments++;
 });
 for(const o of originalMeshes){
  if(!o.geometry?.attributes?.position||!o.skeleton||
     typeof o.applyBoneTransform!=='function')
   fail('original source rig cannot supply posed source head');
  o.skeleton.update();o.updateWorldMatrix(true,false);
  maxBones=Math.max(maxBones,o.skeleton.bones.length);body++;
  const attr=o.geometry.attributes.position;
  for(let i=0;i<attr.count;i++){
   const p=o.applyBoneTransform(i,tmp.fromBufferAttribute(attr,i))
    .applyMatrix4(o.matrixWorld);
   if(![p.x,p.y,p.z].every(finite))
    fail('nonfinite donor source point');
   bounds.expandByPoint(p);total++;
  }
 }
 if(maxBones!==163||body<1||total<140||!finite(bounds.max.y))
  fail('exact original 163-bone source geometry missing');
 const midX=(bounds.min.x+bounds.max.x)/2,top=bounds.max.y;
 const head=new THREE.Box3();let headVertices=0;
 for(const o of originalMeshes){
  o.skeleton.update();o.updateWorldMatrix(true,false);
  const attr=o.geometry.attributes.position;
  for(let i=0;i<attr.count;i++){
   const p=o.applyBoneTransform(i,tmp.fromBufferAttribute(attr,i))
    .applyMatrix4(o.matrixWorld);
   if(p.y>=top-.345&&Math.abs(p.x-midX)<.205){
    head.expandByPoint(p);headVertices++;
   }
  }
 }
 if(headVertices<80||head.isEmpty())
  fail('actual original posed head surface not sampled');
 const faceBounds=head.clone();
 const d=head.getSize(new THREE.Vector3());
 const w=within(d.x,.12,.27),h=within(d.y,.18,.34),
  z=within(d.z,.10,.27);
 const cx=(head.min.x+head.max.x)/2,cz=(head.min.z+head.max.z)/2;
 const heads=[];
 root.traverse(o=>{
  if(o.isBone&&/head/i.test(o.name)&&!o.userData?.head157OriginalLicensed)
   heads.push(o);
 });
 heads.sort((a,b)=>
  b.getWorldPosition(new THREE.Vector3()).y-
  a.getWorldPosition(new THREE.Vector3()).y);
 if(!heads.length)fail('original 163-bone Head not available');
 return {headBone:heads[0],head,faceBounds,cx,cz,top,w,h,z,
  headVertices,bodyMeshes:body,garmentMeshes:ownerGarments,
  maxBones};
}
function originalCounts(root){
 let garments=0,sourceBody=0,bones=0;
 root.traverse(o=>{
  if(!o.isSkinnedMesh||o.userData?.head157OriginalLicensed)return;
  if(o.userData?.work56Garment)garments++;
  else{sourceBody++;bones=Math.max(bones,o.skeleton?.bones?.length||0);}
 });
 return {garments,sourceBody,bones};
}
function cleanupMask(root){
 const modifiedMats=modified.get(root)||[];
 for(const {mat,onBeforeCompile,customProgramCacheKey} of modifiedMats){
  mat.onBeforeCompile=onBeforeCompile;
  mat.customProgramCacheKey=customProgramCacheKey;
  mat.needsUpdate=true;
 }
 modified.delete(root);
}
export function clearLicensedSourceHead157(root){
 if(!root?.traverse)return false;
 const graft=root.getObjectByName(GROUP);
 if(graft){
  graft.parent?.remove(graft);
  // SkeletonUtils clones reference the globally cached immutable original
  // GLTF geometries and textures, so we do not dispose them on switch.
 }
 cleanupMask(root);
 const stash=orig.get(root)||[];
 for(const {object,visible} of stash)object.visible=visible;
 orig.delete(root);
 return Boolean(graft);
}
function clipOldSourceHeadOnly(root,coords){
 const parts=skeletons(root),toRestore=[];
 const cutoff=coords.top-coords.h*.84,half=coords.w*.69;
 const unique=new Set();
 for(const mesh of parts){
  for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
   if(!mat?.isMeshStandardMaterial||unique.has(mat))continue;
   unique.add(mat);
   const old=mat.onBeforeCompile,
    oldKey=mat.customProgramCacheKey;
   const marker='\n// P157 head-only original mannequin face suppression (render-only)\n';
   const wrapper=(shader,r)=>{
    old?.(shader,r);
    const vertexAnchor='#include <worldpos_vertex>',
      fragmentAnchor='#include <clipping_planes_fragment>';
    if(!shader.vertexShader.includes(vertexAnchor)||
       !shader.fragmentShader.includes(fragmentAnchor))
      fail('source PBR vertex/fragment interface changed');
    shader.vertexShader='varying vec3 vGraftWorld157;\n'+
     shader.vertexShader.replace(vertexAnchor,vertexAnchor+
      '\nvGraftWorld157=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader='varying vec3 vGraftWorld157;\n'+
     shader.fragmentShader.replace(fragmentAnchor,fragmentAnchor+
      '\n if(vGraftWorld157.y>'+cutoff.toFixed(7)+
      ' && abs(vGraftWorld157.x-'+coords.cx.toFixed(7)+
      ')<'+half.toFixed(7)+') discard;'+marker);
   };
   toRestore.push({mat,onBeforeCompile:old,customProgramCacheKey:oldKey});
   mat.onBeforeCompile=wrapper;
   mat.customProgramCacheKey=function(){
    return (oldKey?.call(this)||'')+'|source-head-mask157-'+
     cutoff.toFixed(6)+'-'+half.toFixed(6);
   };
   mat.needsUpdate=true;
  }
 }
 if(!toRestore.length)fail('no original source mannequin skin to mask');
 modified.set(root,toRestore);
 return {originalBodyOnlyRenderMask:true,bodyMaterialsMasked:toRestore.length,
  geometryReplaced:false,cutoff,halfWidth:half};
}
export function applyLicensedSourceHead157(root,figure){
 if(!root?.traverse||!['female','male'].includes(figure))
  fail('only original male/female authenticated source outfit allowed');
 const candidate=cached.get(figure);
 if(!candidate){
  // Nonblocking fail-closed original 3D owner outfit first. An unavailable
  // licensed-source head NEVER prevents 163-bone owned JPEG cloth rendering.
  // The original async loader will re-shade the verified head after actual
  // licensed same-origin SHA256 source verification finishes.
  return Object.freeze({figure,originalSourceRigBones:163,
   originalLicensedHeadRigBones:0,
   headAttachedToOriginal163Bone:false,
   originalSourceBodyGeometryIndicesChanged:false,
   originalSavedOwnerPhotoOrCutoutBytesChanged:false,
   originalGarmentMeshesBefore:0,
   originalGarmentMeshesAfter:0,
   oldFaceBodyMaterialMaskedWithoutGeometryChanges:false,
   familyAlpha:'HOLD',releaseAuthorized:false,
   originalSourceFallbackPreserved:true,
   reason:'LICENSED_ASSET_ASYNC_VERIFICATION_PENDING'});
 }
 if(root.getObjectByName(GROUP))fail('duplicate licensed head without cleanup');
 if(!root.getObjectByName('research-face-definition-131')||
    !root.getObjectByName('research-source-head-hair-153')||
    !root.getObjectByName('research-source-facial-contours-154'))
  fail('P154 baseline/source head correction not installed');
 const before=originalCounts(root),source=originalSource(root);
 if(before.bones!==163||source.maxBones!==163)
  fail('source saved-outfit garment body altered or missing');
 const box=new THREE.Box3().setFromObject(candidate.scene),
  center=box.getCenter(new THREE.Vector3()),
  dims=box.getSize(new THREE.Vector3());
 // Verified P156 license head-only mesh includes neck, scalp and hair; match
 // target donor face scale by measured width AND vertical height, avoiding
 // cartoon-size floating head or disproportionate neck.
 const sw=source.w/dims.x,sh=source.h/dims.y,
  scale=within(Math.sqrt(sw*sh)*1.025,.58,1.4);
 const fittedY=source.top-box.max.y*scale+.004,
  fittedX=source.cx-center.x*scale,
  fittedZ=source.cz-center.z*scale+.008;
 const worldMatrix=new THREE.Matrix4().makeScale(scale,scale,scale);
 worldMatrix.setPosition(fittedX,fittedY,fittedZ);
 const graft=new THREE.Group();
 graft.name=GROUP;
 graft.userData.head157OriginalLicensed=true;
 const actual=skeletonClone(candidate.scene);
 actual.traverse(o=>{
  if(o.isSkinnedMesh||o.isBone)o.userData.head157OriginalLicensed=true;
 });
 graft.add(actual);
 root.updateMatrixWorld(true);
 source.headBone.updateWorldMatrix(true,false);
 const localMatrix=source.headBone.matrixWorld.clone().invert().multiply(worldMatrix);
 graft.matrixAutoUpdate=false;graft.matrix.copy(localMatrix);
 source.headBone.add(graft);
 graft.updateMatrixWorld(true,true);
 const afterBox=new THREE.Box3().setFromObject(graft),
  afterSize=afterBox.getSize(new THREE.Vector3());
 if(afterBox.isEmpty()||afterSize.y<source.h*.62||afterSize.y>source.h*1.7||
    Math.abs(afterBox.max.y-source.top)>source.h*.23||
    Math.abs((afterBox.min.x+afterBox.max.x)/2-source.cx)>source.w*.3){
  source.headBone.remove(graft);
  fail('licensed face skull/neck actual donor alignment unacceptable');
 }
 const hidden=[];
 for(const name of ['research-face-definition-131',
  'research-source-head-hair-153','research-source-facial-contours-154',
  'research-procedural-hair-118']){
  const obj=root.getObjectByName(name);
  if(obj){hidden.push({object:obj,visible:obj.visible});obj.visible=false;}
 }
 orig.set(root,hidden);
 let mask=null;
 try{mask=clipOldSourceHeadOnly(root,source);}
 catch(e){clearLicensedSourceHead157(root);throw e;}
 const after=originalCounts(root);
 if(JSON.stringify(before)!==JSON.stringify(after)){
  clearLicensedSourceHead157(root);
  fail('original owner skinned source body or any photographed garment changed');
 }
 const seam=afterBox.min.y-mask.cutoff;
 if(!finite(seam)||seam<-.16||seam>.19){
  clearLicensedSourceHead157(root);
  fail('licensed head neck seam outside measured original collar');
 }
 const result=Object.freeze({
  figure,
  originalSourceRigBones:163,
  originalLicensedHeadRigBones:80,
  originalLicensedP156HeadSHA256:candidate.sha256,
  originalSourceHeadAndHairMaterials:candidate.materials,
  sourceHeadSkinnedMeshes:candidate.skinned,
  sourceHeadTriangles:candidate.triangles,
  headAttachedToOriginal163Bone:true,
  replacedPreviousOriginalMannequinFace:true,
  previousP131P153P154FacialLayersHidden:true,
  oldFaceBodyMaterialMaskedWithoutGeometryChanges:true,
  originalBodyMaterialCountMasked:mask.bodyMaterialsMasked,
  neckSeamSignedWorldY:seam,
  fittedHeadScale:scale,
  originalMeasuredHeadWidth:source.w,
  actualFittedHeadWidth:afterSize.x,
  actualHeadTopError:afterBox.max.y-source.top,
  originalGarmentMeshesBefore:before.garments,
  originalGarmentMeshesAfter:after.garments,
  originalSkinnedBodyMeshesBefore:before.sourceBody,
  originalSkinnedBodyMeshesAfter:after.sourceBody,
  originalSavedOwnerPhotoOrCutoutBytesChanged:false,
  originalSourceBodyGeometryIndicesChanged:false,
  originalOwnerGarmentGeometryChanged:false,
  sourceFullBodyAnatomyReplaced:false,
  fullHumanPhotorealismIndependentlyApproved:false,
  physicalPhoneApproved:false,
  familyAlpha:'HOLD',releaseAuthorized:false
 });
 return result;
}
