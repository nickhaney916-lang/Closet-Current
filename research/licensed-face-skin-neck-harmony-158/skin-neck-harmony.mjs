/**
 * P158 — Source-authentic licensed-face to exposed original 163-bone body
 * chromatic harmonization. This is a reversible WebGL material override in
 * the PINNED DETACHED P541 research donor only. Absolutely no original
 * texture, source mesh vertex/index, head geometry, owned garment material,
 * wardrobe JPEG, owner storage, session or shipping code is ever modified.
 *
 * Original MIT face albedo is sampled at runtime from the SHA256-verified
 * P156 head-only GLB. The P118 skinned-body skin-only shader is nudged toward
 * the sampled source face (never edited or flattened). This is NOT a new
 * undressed source body, new wardrobe fit, physical skin contact, or 10/10
 * photorealism acceptance.
 */
import * as THREE from 'three';
export const SKIN_NECK_158=Object.freeze({
 priority:158,verifiedP157Parent:'1063f0f229b7b7b26e1eebb6c784706ebcc0661c',
 sourceRigBones:163,sourceLicensedHeadRigBones:80,
 originalHeadTextureModified:false,originalBodyGeometryModified:false,
 originalOwnedGarmentMaterialModified:false,sourceJPEGOrCutoutModified:false,
 independentHumanSkinSeamApproved:false,physicalPhoneApproved:false,
 familyAlpha:'HOLD',releaseAuthorized:false
});
const changed=new WeakMap();
const fail=(s)=>{const e=Error('SKIN158 '+s);e.code='skin158-research-refused';throw e;};
const clamp=(x,l,h)=>Math.max(l,Math.min(h,x));
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function colorFromVerifiedFace(candidate,figure){
 if(!candidate?.sha256||candidate.figure!==figure||candidate.maxBone!==80)
  fail('verified licensed head source required (not a user face or outfit)');
 const expected=figure==='female'
  ?'dd3772a97d2459975b34f8b1ca7902cb7d7e47d20091766a342b53425c9202e4'
  :'a4aed621b347f5ed2c6564ca4bb66c8d18681d94e7d3fdc246fdd64adbcc1f72';
 if(candidate.sha256!==expected)fail('P156 immutable MIT source SHA changed');
 const head=figure==='female'?'f007_head':'m006_head';
 let material;
 candidate.scene.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  for(const m of Array.isArray(o.material)?o.material:[o.material]){
   if(m?.name===head)material=m;
  }
 });
 const image=material?.map?.image;
 if(!image?.width||!image?.height||typeof document==='undefined')
  fail('real P156 facial albedo texture unreadable; no synthetic complexion');
 const canvas=document.createElement('canvas');
 const maxDim=512,r=Math.min(1,maxDim/Math.max(image.width,image.height));
 canvas.width=Math.max(1,Math.round(image.width*r));
 canvas.height=Math.max(1,Math.round(image.height*r));
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx)fail('browser cannot read verified public-license albedo');
 try{ctx.drawImage(image,0,0,canvas.width,canvas.height);}
 catch{fail('original licensed facial albedo cannot be rendered for palette measurement');}
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
 const candidates=[];
 for(let i=0;i<pixels.length;i+=16){
  const r=pixels[i],g=pixels[i+1],b=pixels[i+2],a=pixels[i+3];
  // Conservative warm-skin chroma on ORIGINAL LICENSED face-map only.
  // Excludes transparent hair, near-black strands and white sclera.
  if(a<235||r<56||r>244||g<31||g>223||b<18||b>212||
     r<g*1.065||g<b*1.02||r-g>94||g-b>78)continue;
  candidates.push([r,g,b]);
 }
 if(candidates.length<70)fail('no reliable genuine licensed skin pixels');
 const median=k=>{
  const s=candidates.map(v=>v[k]).sort((a,b)=>a-b);
  return s[Math.floor(s.length/2)];
 };
 const srgb=[median(0),median(1),median(2)];
 const tone=new THREE.Color().setRGB(srgb[0]/255,srgb[1]/255,
  srgb[2]/255,THREE.SRGBColorSpace);
 const original=[.66,.445,.36],weighted=[tone.r,tone.g,tone.b].map((v,i)=>
  clamp(original[i]*.15+v*.85,[.12,.055,.025][i],[.81,.66,.58][i]));
 if(!weighted.every(finite)||weighted[0]<=weighted[1]||
    weighted[1]<weighted[2]*.82)fail('source skin tone measurement implausible');
 const delta=Math.hypot(...weighted.map((v,i)=>v-original[i]));
 if(delta<.008)fail('no measurable skin-to-face harmonization change');
 return Object.freeze({figure,sha256:candidate.sha256,srgb,pixels:candidates.length,
  albedoPixelsMeasured:true,linearBodySkin:weighted,
  originalLinearBodySkin:original,skinDeltaLinear:delta});
}
function sourceMaterials(root){
 const owned=new Set(),source=new Set();
 let donorBones=0,garments=0;
 root.traverse(o=>{
  if(!o.isSkinnedMesh||o.userData?.head157OriginalLicensed)return;
  const list=Array.isArray(o.material)?o.material:[o.material];
  if(o.userData?.work56Garment){
   garments++;
   for(const m of list)if(m)owned.add(m);
  }else{
   donorBones=Math.max(donorBones,o.skeleton?.bones?.length||0);
   for(const m of list)if(m?.isMeshStandardMaterial)source.add(m);
  }
 });
 if(donorBones!==163||source.size<1)fail('original authenticated 163-bone skin source missing');
 for(const m of source)if(owned.has(m))
  fail('source material shared with owner-photographed garment');
 return {materials:[...source],garments,donorBones};
}
export function clearLicensedFaceSkinNeck158(root){
 const prior=changed.get(root);
 if(!prior)return false;
 for(const x of prior.entries){
  x.mat.onBeforeCompile=x.oldCompile;
  x.mat.customProgramCacheKey=x.oldKey;
  x.mat.needsUpdate=true;
 }
 changed.delete(root);
 return true;
}
export function applyLicensedFaceSkinNeck158(root,figure,source,candidate){
 if(!root?.traverse||!['female','male'].includes(figure)||
    !source?.headBone||source.maxBones!==163||
    !root.getObjectByName('research-licensed-source-head-graft-157'))
  fail('exact original source rig plus mounted verified P157 licensed head required');
 if(changed.has(root))fail('duplicate harmonization without verified cleanup');
 const palette=colorFromVerifiedFace(candidate,figure);
 const before=sourceMaterials(root);
 const original='vec3 skinTone118=vec3(.66,.445,.36)';
 const replacement='vec3 skinTone118=vec3('+
  palette.linearBodySkin.map(v=>v.toFixed(7)).join(',')+')';
 const entries=[];
 for(const mat of before.materials){
  const oldCompile=mat.onBeforeCompile,oldKey=mat.customProgramCacheKey;
  const fn=(shader,renderer)=>{
   oldCompile?.(shader,renderer);
   if(shader.fragmentShader.split(original).length!==2)
    fail('actual P118 skin-only GLSL shader marker absent; no arbitrary garment tinting');
   shader.fragmentShader=shader.fragmentShader.replace(original,replacement);
  };
  entries.push({mat,oldCompile,oldKey});
  mat.onBeforeCompile=fn;
  mat.customProgramCacheKey=function(){
   return (oldKey?.call(this)||'')+'|source-verified-facial-albedo-158-'+
    palette.sha256+'-'+palette.linearBodySkin.map(v=>v.toFixed(6)).join(',');
  };
  mat.needsUpdate=true;
 }
 changed.set(root,{entries});
 const after=sourceMaterials(root);
 if(after.garments!==before.garments||after.donorBones!==163){
  clearLicensedFaceSkinNeck158(root);
  fail('original source or photographed outfit counts changed');
 }
 // The original P157 measured-mask junction is retained intact.
 // This is a chromatic neck bridge, not an invented geometric skin weld.
 const cutoff=source.top-source.h*.84;
 return Object.freeze({
  figure,sourceP156HeadSHA256:palette.sha256,
  harmonyApplied:true,
  sourceFaceAlbedoSamplePixels:palette.pixels,
  sourceFaceAlbedoSRGB:palette.srgb,
  measuredSourceFaceLinearBodyTone:palette.linearBodySkin,
  originalFixedBodySkinLinearTone:palette.originalLinearBodySkin,
  actualBodySkinLinearChange:palette.skinDeltaLinear,
  matchedExposedBodyPBRMaterials:entries.length,
  sourceRigBones:163,licensedSourceHeadRigBones:80,
  originalOwnerGarmentMeshesBefore:before.garments,
  originalOwnerGarmentMeshesAfter:after.garments,
  sourceSkinNeckMaskCutoff:cutoff,
  originalNeckSkinGeometryModified:false,
  originalSourceClothTextureOrJPEGModified:false,
  licensedOriginalFaceTextureOrAlbedoModified:false,
  unlicensedUserFaceSampling:false,
  anatomicalNeckWeldIndependentlyApproved:false,
  skinColorHumanVisuallyApproved:false,
  familyAlpha:'HOLD',releaseAuthorized:false
 });
}
