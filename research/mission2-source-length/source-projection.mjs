/** Registered planar FRONT photograph projection. Never fabricates unseen rear texels. */
import * as THREE from 'three';
import {auditOriginalPhotoTexelRegistration,auditOriginalPhotoProjectedTriangles} from './source-texel-audit.mjs';
const UV='vec2 panel=vec2(.5+vPanel.x/uPhotoSpan.x,(vPanel.y-1.11)/uPhotoSpan.y);';
const CHEST='float chest=1.-smoothstep(.22,.29,abs(vPanel.x));';
const fail=m=>{throw Error('M2 source projection '+m);};
export function patchSourceProjectionShader(shader,projection){
 if(!Array.isArray(projection)||projection.length!==4||!projection.every(Number.isFinite)||
    projection[1]<.5||projection[1]>1.6||projection[2]<.6||projection[2]>1.2||
    !shader.vertexShader.includes('#include <worldpos_vertex>')||
    !shader.fragmentShader.includes(UV)||!shader.fragmentShader.includes(CHEST))fail('pinned original source shader and bounded projection required');
 shader.uniforms.uM2SourceProjection={value:new THREE.Vector4(...projection)};
 shader.vertexShader=shader.vertexShader.replace('void main() {','attribute vec3 sourceProjectionPosition; varying vec3 vSourceProjectionPosition;\nvoid main() {')
  .replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvSourceProjectionPosition=sourceProjectionPosition;');
 shader.fragmentShader=shader.fragmentShader.replace('void main() {','varying vec3 vSourceProjectionPosition; uniform vec4 uM2SourceProjection;\nvoid main() {')
  .replace(UV,'vec2 panel=vec2(.5+(vSourceProjectionPosition.x-uM2SourceProjection.x)/uM2SourceProjection.y,(vSourceProjectionPosition.y-uM2SourceProjection.w)/uM2SourceProjection.z);')
  .replace(CHEST,'float chest=1.; // Original source alpha/front guards still apply to photographed sleeves.')
  .replace('front*(1.-smoothstep(.115,.195,abs(vPanel.x)))*necklineInterior','front*chest*necklineInterior')
  .replace('photo.a*smoothstep(.95,1.,interiorAlpha)','photo.a*smoothstep(.95,.975,interiorAlpha)');
}
export function prepareSourceProjection(shirt,staged,projection){
 const materials=new Set(),photos=[],attributes=[],overrides=new Map(staged.map(r=>[r.mesh,r.next]));
 for(const mesh of shirt.meshes){
  const list=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  for(const material of list)if(material?.isMeshStandardMaterial&&typeof material.onBeforeCompile==='function'&&material.onBeforeCompile!==THREE.MeshStandardMaterial.prototype.onBeforeCompile)materials.add(material);
  const p=mesh.geometry.getAttribute('position'),array=overrides.get(mesh)||p.array;
  if(p.itemSize!==3||array.length!==p.count*3)fail('registered source vertices required');
  const coords=new Float32Array(array.length),v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){v.fromArray(array,i*3).applyMatrix4(mesh.matrixWorld);v.toArray(coords,i*3);}
  if(!coords.every(Number.isFinite))fail('finite source projection coordinates required');
  attributes.push({mesh,coords});
 }
 if(!materials.size)fail('actual existing original-photo shader required');
 // Existing source shaders are wrapped by source-seam/detail callbacks.
 // Inspect their EFFECT on the real standard shader, not Function.toString.
 for(const material of materials){
  const probe={uniforms:THREE.UniformsUtils.clone(THREE.ShaderLib.standard.uniforms),
   vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};
  material.onBeforeCompile.call(material,probe);
  if(!probe.uniforms.uPhoto?.value?.isTexture)fail('original source photo sampler missing');
  photos.push(probe.uniforms.uPhoto.value);
  patchSourceProjectionShader(probe,projection);
 }
 const compiled=new Set(),runtime={compiledMaterialCount:0,originalPhotoTexelEvidence:null};
 // Actual GLSL photo projection is defined by SOURCE positions, not
 // standard mesh UVs. Face-level coverage is captured read-only, once.
 const triangleProjectionAudit=auditOriginalPhotoProjectedTriangles(attributes,projection);
 const recheck=()=>Object.freeze({...auditOriginalPhotoTexelRegistration(
  attributes,projection,photos),triangleProjectionAudit});
 // This is source texture registration evidence, not independent pixel match
 // or owner validation. The pixel sampler can be unavailable before decode.
 runtime.originalPhotoTexelEvidence=recheck();
 return {materialCount:materials.size,runtime,commit(){
  for(const {mesh,coords} of attributes)mesh.geometry.setAttribute('sourceProjectionPosition',new THREE.BufferAttribute(coords,3));
  for(const material of materials){
   const original=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material);
   material.onBeforeCompile=function(shader,renderer){original.call(this,shader,renderer);patchSourceProjectionShader(shader,projection);
    compiled.add(material);runtime.compiledMaterialCount=compiled.size;
    runtime.originalPhotoTexelEvidence=recheck();
    // Research donor-only diagnostics. Never expose the original photograph,
    // individual source colors or per-vertex/source UV correspondences.
    console.info('M2_SOURCE_FRONT_TEXEL_COUNTS_ONLY:'+JSON.stringify(runtime.originalPhotoTexelEvidence));};
   material.customProgramCacheKey=()=>key()+';M2_REGISTERED_FRONT_SOURCE_PROJECTION_V1';
   material.needsUpdate=true;
  }
 }};
}
