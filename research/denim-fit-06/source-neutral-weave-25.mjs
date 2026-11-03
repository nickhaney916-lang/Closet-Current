/**
 * DENIM-TEXTILE-25: source-honest modeled twill relief on previously verified
 * P23 NONPHOTOGRAPHED surfaces. This is synthetic textile modeling, never a
 * claim that the rear or side was photographed or that source details exist.
 *
 * Front JPEG/alpha, source UV, skin, rest positions and geometry are unchanged.
 * Use the existing authenticated original-photo opacity mask from 3D30/P23.
 * No texture, generated image, network request or new garment mesh is created.
 */
import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';
import {requireSourceNeutralLight23} from './source-neutral-light-23.mjs';

export const DENIM_NEUTRAL_WEAVE25=Object.freeze({
 version:25,textureType:'modeled-neutral-twill-not-a-photograph',
 maxDiffuseVariation:.11, photographedFrontOpacityProtection:.10,
 originalSourcePhotoUntouched:true,originalSourceUVUntouched:true,
 unseenRearImageGenerated:false,geometryModified:false,
 physicallyMeasuredWeave:false,humanPhotorealismApproved:false,
 physicalPhoneApproved:false,familyAlpha:'HOLD',releaseAuthorized:false
});
const anchor='diffuseColor.rgb *= (1.0 + 0.28 * sourceNeutralFiberGrazing23 * sourceNeutralUnphotographed23);';
export function requireModeledNeutralWeave25(source,{enabled=false}={}){
 if(!enabled)return Object.freeze({enabled:false,originalSourcePhotoUntouched:true});
 const p=requireSourceNeutralLight23(source,{enabled:true});
 if(!p.enabled||!isSourceVerifiedDenimId(source.id)||source.releaseAuthorized!==false)
  throw Error('P25 source-neutral twill requires reviewed exact original denim and P23');
 return Object.freeze({enabled:true,...DENIM_NEUTRAL_WEAVE25});
}
/**
 * True P23 sourcePantsOpacity is 0 for the unphotographed rear, >=0.10 on
 * photographed front. Multiply by P23's identical authentic mask; do NOT
 * alter the actual 3D30 texture sampling or alpha, and never invent seams or
 * pockets behind the figure. Use UV as stable model-space coordinates ONLY;
 * it is NOT a source-photographed rear UV map. fwidth provides antialiasing
 * on narrow 320px phones so the modeled twill cannot shimmer into stripes.
 */
export function applyModeledNeutralWeave25Shader(fragmentShader,source,{enabled=false}={}){
 const proof=requireModeledNeutralWeave25(source,{enabled});
 if(!proof.enabled)return fragmentShader;
 if(typeof fragmentShader!=='string'||!fragmentShader.includes(anchor)||
    !fragmentShader.includes('sourceNeutralUnphotographed23')||
    !fragmentShader.includes('vPantsSourceUV')||
    !fragmentShader.includes('sourcePantsOpacity')||
    fragmentShader.includes('sourceNeutralTwill25'))
  throw Error('P25 refuses source-less or duplicate neutral textile shader');
 const twill=[
  anchor,
  'float sourceNeutralWarpPhase25 = dot(vPantsSourceUV, vec2(96.0,21.0));',
  'float sourceNeutralWeftPhase25 = dot(vPantsSourceUV, vec2(-24.0,82.0));',
  'float sourceNeutralWarpAA25 = clamp(1.0 - 0.45 * fwidth(sourceNeutralWarpPhase25), 0.0, 1.0);',
  'float sourceNeutralWeftAA25 = clamp(1.0 - 0.45 * fwidth(sourceNeutralWeftPhase25), 0.0, 1.0);',
  'float sourceNeutralTwill25 = 0.72 * sin(sourceNeutralWarpPhase25) * sourceNeutralWarpAA25 + 0.28 * sin(sourceNeutralWeftPhase25) * sourceNeutralWeftAA25;',
  'float sourceNeutralFabricRelief25 = 0.11 * sourceNeutralTwill25 * sourceNeutralUnphotographed23;',
  'diffuseColor.rgb *= (1.0 + sourceNeutralFabricRelief25);'
 ].join('\n');
 return fragmentShader.replace(anchor,twill);
}
export function installModeledNeutralWeave25(pants,source,{enabled=false}={}){
 if(!enabled)return pants;
 const proof=requireModeledNeutralWeave25(source,{enabled:true});
 const mesh=pants?.meshes?.[0],material=mesh?.material;
 if(pants?.meshes?.length!==1||!mesh?.isSkinnedMesh||
   !mesh?.geometry?.getAttribute?.('pantsSourceUV')||
   !mesh.geometry.getAttribute('pantsSourceFront')||
   !material?.isMeshStandardMaterial||
   pants?.stats?.sourceNeutralMaterial23!==true||
   pants?.stats?.sourceSHA256!==source.sourceSHA256||
   pants?.stats?.cutoutSHA256!==source.cutoutSHA256||
   pants?.stats?.photoApplied!==true||
   pants.stats.originalPhotoShaderProtected23!==true||
   pants.stats.unseenRearImageGenerated23!==false||
   typeof pants.dispose!=='function')
  throw Error('P25 requires original SHA-verified P23 fitted skinned denim with untouched photograph');
 const priorCompile=material.onBeforeCompile;
 const priorCache=material.customProgramCacheKey?.bind(material);
 material.onBeforeCompile=shader=>{
  priorCompile?.(shader);
  shader.fragmentShader=applyModeledNeutralWeave25Shader(shader.fragmentShader,source,{enabled:true});
  if(!shader.fragmentShader.includes('sourceNeutralFabricRelief25'))
   throw Error('P25 neutral-only textile shader did not compile');
  material.userData.cc25SourceNeutralWeaveCompiled=true;
 };
 material.customProgramCacheKey=()=>String(priorCache?.()||'source-denim-p23')+'-modeled-neutral-twill25';
 material.needsUpdate=true;
 return {...pants,stats:{...pants.stats,
  sourceNeutralModeledTwill25:true,
  sourceNeutralModeledVariation25:proof.maxDiffuseVariation,
  sourceNeutralTwillNotPhoto25:true,
  originalSourceJPEGUVSkinRestUnchanged25:true,
  noRearPhotoGenerated25:true,
  humanPhotorealismApproved25:false,
  physicalPhoneApproved25:false,
  releaseAuthorized:false},dispose(){pants.dispose();}};
}
