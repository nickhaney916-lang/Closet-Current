/** 3D-58: true licensed-source garment-detail preservation in the research
 * renderer. Does not recolor, sharpen, resample, crop or mutate garment bytes.
 * Improves WebGL *sampling only* at oblique angles and enables bounded 2x
 * mobile render resolution before presenting the same CSS-sized screenshot.
 *
 * Never manipulate a source texture or garment material if no original,
 * licensed uPhoto/uPantsOriginalPhoto sampler is present. Unlike a generic
 * filter applied to a screenshot, this maintains true original garment
 * detail for all posed anatomical male/female front/side views.
 */
import * as THREE from 'three';

const ORIGINAL_SAMPLERS=Object.freeze(['uPhoto','uPantsOriginalPhoto']);
const uniqueMaterials=root=>{
 const seen=new Set(),out=[];
 root.traverse(m=>{
  if(!m.isMesh||!m.userData.work56Garment)return;
  for(const material of Array.isArray(m.material)?m.material:[m.material]){
   if(material?.isMeshStandardMaterial&&!seen.has(material)){
    seen.add(material);out.push(material);
   }
  }
 });
 return out;
};
const dimensions=image=>({
 width:image?.naturalWidth||image?.videoWidth||image?.width||0,
 height:image?.naturalHeight||image?.videoHeight||image?.height||0
});
export function configureOriginalPhotoSampling(root,renderer,{enabled=false}={}){
 if(!enabled)return {enabled:false,materialCount:0,configuredSamplers:0,images:[],releaseAuthorized:false};
 if(!root?.traverse||!renderer?.capabilities?.getMaxAnisotropy)
  throw Error('3D58 original licensed garment renderer not initialized');
 const maxDevice=renderer.capabilities.getMaxAnisotropy();
 if(!Number.isFinite(maxDevice)||maxDevice<1)
  throw Error('3D58 actual renderer anisotropy support invalid');
 const targetAnisotropy=Math.min(8,maxDevice);
 const materials=uniqueMaterials(root);
 if(!materials.length)throw Error('3D58 no actual original photograph skinned garment materials');
 const configured=new Map(),images=new Map();
 for(const material of materials){
  if(material.userData.cc58SharpOriginalPhotoInstalled)continue;
  const previous=material.onBeforeCompile;
  if(typeof previous!=='function')continue;
  material.onBeforeCompile=(shader,webgl)=>{
   previous.call(material,shader,webgl);
   for(const name of ORIGINAL_SAMPLERS){
    const texture=shader.uniforms[name]?.value;
    if(!texture?.isTexture)continue;
    const {width,height}=dimensions(texture.image);
    if(width<64||height<64)throw Error('3D58 original source garment texture unexpectedly small');
    // Never change texture.image, channel, colorSpace, flipY, wrap,
    // photographed RGB/alpha, UV registration or source identity.
    if(texture.colorSpace!==THREE.SRGBColorSpace)
     throw Error('3D58 original photographed colors must remain source-sRGB');
    texture.anisotropy=targetAnisotropy;
    texture.minFilter=THREE.LinearMipmapLinearFilter;
    texture.magFilter=THREE.LinearFilter;
    texture.generateMipmaps=true;
    texture.needsUpdate=true;
    configured.set(name,texture);
    images.set(name,{width,height,anisotropy:texture.anisotropy,sourceUnchanged:true});
   }
  };
  material.userData.cc58SharpOriginalPhotoInstalled=true;
  material.needsUpdate=true;
 }
 return {
  enabled:true,materialCount:materials.length,targetAnisotropy,
  originalSourcesByteUnchanged:true,
  sourceColorSpaceUnchanged:true,
  sourceUVAndRigUnchanged:true,
  get configuredSamplers(){return configured.size;},
  get images(){return [...images.entries()].map(([sampler,value])=>({sampler,...value}));},
  releaseAuthorized:false,humanVisualApproved:false,physicalPhoneTested:false
 };
}

/** Bounded mobile GPU pixel cost. The default viewer keeps its original 1.5x
 * behavior; this research flag renders 2 physical pixels per CSS pixel,
 * never exceeding 2x even on high-DPR phones.
 */
export function originalSourceDisplayPixelRatio(deviceRatio,{enabled=false}={}){
 if(!Number.isFinite(deviceRatio)||deviceRatio<=0)throw Error('3D58 invalid device pixel ratio');
 return enabled?2:Math.min(1.5,deviceRatio);
}
