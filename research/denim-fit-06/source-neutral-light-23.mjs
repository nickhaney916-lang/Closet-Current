/**
 * P23: source-honest, opt-in physically based *unphotographed* neutral denim
 * lighting. Actual front JPEG and alpha are immutable; do not generate or
 * simulate a rear image or claim source-observed woven surface details.
 *
 * MeshStandardMaterial already uses actual 163-bone geometry and normals for
 * the BRDF; keep those true normals and only lower the extremely matte .96
 * baseline roughness where the original source pixels contribute nothing.
 */
import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';
export const DENIM_NEUTRAL_LIGHT23=Object.freeze({
 neutralRoughness:.68,originalRoughness:.96,
 neutralMaskStart:.01,neutralMaskEnd:.10,
 sourcePhotoPreserved:true,unseenRearImageGenerated:false,
 physicalPhoneApproved:false,humanVisualApproval:false,releaseAuthorized:false
});
export function requireSourceNeutralLight23(source,{enabled=false}={}){
 if(enabled!==true)return Object.freeze({enabled:false,sourcePhotoPreserved:true});
 if(!source||source.sourceAssetsVerified!==true||
    source.originalVerified!==true||source.cutoutVerified!==true||
    source.frontOrientationReviewed!==true||source.visibleSourceRGBPreserved!==true||
    source.ownerApproved!==false||source.releaseAuthorized!==false||
    typeof source.sourceSHA256!=='string'||!/^[a-f0-9]{64}$/.test(source.sourceSHA256)||
    typeof source.cutoutSHA256!=='string'||!/^[a-f0-9]{64}$/.test(source.cutoutSHA256)||
    !Array.isArray(source.neutralColorRGB)||source.neutralColorRGB.length!==3||
    source.neutralColorRGB.some(x=>!Number.isInteger(x)||x<0||x>255))
  throw Error('P23 refuses any source without original hash verified front JPEG and trustworthy neutral color');
 return Object.freeze({enabled:true,...DENIM_NEUTRAL_LIGHT23});
}
export function applySourceNeutralLight23Shader(fragmentShader,source,{enabled=false}={}){
 const proof=requireSourceNeutralLight23(source,{enabled});
 if(!proof.enabled)return fragmentShader;
 const colorFragment=fragmentShader.indexOf('sourcePantsOpacity');
 const roughnessFragment=fragmentShader.indexOf('#include <roughnessmap_fragment>');
 const lightingEnd=fragmentShader.indexOf('#include <lights_fragment_end>');
 if(colorFragment<0||roughnessFragment<0||lightingEnd<0||
    colorFragment>roughnessFragment||roughnessFragment>lightingEnd||
    fragmentShader.includes('sourceNeutralUnphotographed23'))
  throw Error('P23 missing authentic source front opacity gating or double-installed neutral lighting');
 // The existing physically based renderer uses actual mesh normal, real
 // studio lights and real garment geometry for highlights. No noise texture,
 // fake seams, fake wrinkles, back photo or source RGB mutation is allowed.
 // When original photographed pixels contribute >=10% this is EXACTLY the
 // earlier physically based BRDF, protecting visible photographic regions.
 const injection=[
  '#include <roughnessmap_fragment>',
  'float sourceNeutralUnphotographed23 = 1.0 - smoothstep(0.01,0.10,sourcePantsOpacity);',
  'roughnessFactor = mix(roughnessFactor,0.68,sourceNeutralUnphotographed23);'
 ].join('\n');
 // The first run produced zero changed 8-bit rendered RGB pixels: roughness
 // alone did not form a perceptible cloth highlight under the actual studio.
 // Add a *bounded* neutral-only Fresnel-like fiber grazing response derived
 // exclusively from real skinned garment normal, view direction and the
 // SHA-measured original neutral RGB. No painted pattern or pixel synthesis.
 // Reflected light remains the existing physical mesh/studio response.
 const sheen=[
  '#include <lights_fragment_end>',
  'float sourceNeutralFiberGrazing23=pow(1.0-clamp(dot(geometry.normal,geometry.viewDir),0.0,1.0),1.7);',
  'reflectedLight.indirectSpecular += diffuseColor.rgb * (0.19 * sourceNeutralFiberGrazing23 * sourceNeutralUnphotographed23);'
 ].join('\n');
 return fragmentShader.replace('#include <roughnessmap_fragment>',injection)
  .replace('#include <lights_fragment_end>',sheen);
}

/**
 * Isolated P23 wrapper. DO NOT edit the shared/photo-pinned 3D30 source
 * projection: the three original-source CI suites explicitly protect it.
 * Hook only this ephemeral, already SHA-validated garment material and
 * delegate all geometry, original JPEG resources and disposal to the parent.
 */
export function installSourceNeutralLight23(pants,source,{enabled=false}={}){
 if(!enabled)return pants;
 const proof=requireSourceNeutralLight23(source,{enabled:true});
 const mesh=pants?.meshes?.[0],material=mesh?.material;
 if(pants?.meshes?.length!==1||!mesh?.isSkinnedMesh||
    !material?.isMeshStandardMaterial||
    !isSourceVerifiedDenimId(source.id)||
    pants?.stats?.photoApplied!==true||
    pants.stats.sourceSHA256!==source.sourceSHA256||
    pants.stats.cutoutSHA256!==source.cutoutSHA256||
    typeof pants.dispose!=='function')
  throw Error('P23 source-honest BRDF requires original SHA-matched photo projected once onto genuine 163-bone sewn denim');
 const priorCompile=material.onBeforeCompile;
 const priorCache=material.customProgramCacheKey?.bind(material);
 material.onBeforeCompile=shader=>{
  priorCompile?.(shader);
  shader.fragmentShader=applySourceNeutralLight23Shader(shader.fragmentShader,source,{enabled:true});
 };
 material.customProgramCacheKey=()=>String(priorCache?.()||'source-denim')+'-neutral-physical-brdf23';
 material.needsUpdate=true;
 return {...pants,stats:{...pants.stats,
  sourceNeutralMaterial23:true,
  sourceNeutralOriginalRoughness23:proof.originalRoughness,
  sourceNeutralRoughness23:proof.neutralRoughness,
  originalPhotoShaderProtected23:true,
  unseenRearImageGenerated23:false,
  physicalPhoneApproved23:false,humanVisualApproval23:false,
  releaseAuthorized:false},dispose(){pants.dispose();}};
}
