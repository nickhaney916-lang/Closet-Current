/**
 * P23: source-honest, opt-in physically based *unphotographed* neutral denim
 * lighting. Actual front JPEG and alpha are immutable; do not generate or
 * simulate a rear image or claim source-observed woven surface details.
 *
 * MeshStandardMaterial already uses actual 163-bone geometry and normals for
 * the BRDF; keep those true normals and only lower the extremely matte .96
 * baseline roughness where the original source pixels contribute nothing.
 */
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
 if(colorFragment<0||roughnessFragment<0||colorFragment>roughnessFragment||
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
 return fragmentShader.replace('#include <roughnessmap_fragment>',injection);
}
