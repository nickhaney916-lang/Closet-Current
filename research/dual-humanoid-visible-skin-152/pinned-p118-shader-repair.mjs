/**
 * P152: precise source-scoped repair for P118's invalid Three.js PBR
 * roughness GLSL injection. Original fragment shader declares
 * 'roughnessFactor' WITHIN #include <roughnessmap_fragment>. P118's
 * preceding assignment references that undeclared identifier, causing
 * WebGL fragment shader compilation failure and invisible source body.
 *
 * Only repair a detached, exact SHA-pinned P150/P118 research donor; do NOT
 * patch production, staging or parallel #57 PR #706.
 */
export const VISIBLE_SKIN_152=Object.freeze({
 priority:152,
 parentMain:'d8f66ee67489e3a6d136f41f2c6f310054a266a5',
 parallelPR150:'6e576da9d7ff6a0a439a7762cf333670d20f0131',
 donorPR541:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
 sourceResearchOnly:true,familyAlpha:'HOLD',releaseAuthorized:false,
 expectedShaderProblem:'roughnessFactor assigned before #include <roughnessmap_fragment>',
 garmentGeometryChanged:false,originalPhotoJPEGSHAChanged:false,
 original163BoneRigChanged:false
});
const old="    roughnessFactor=mix(roughnessFactor,.70+skinCloud118*.035,uNaturalSkin118*(1.0-baseCoverage));\n    ${rough}";
const fixed="    ${rough}\n    roughnessFactor=mix(roughnessFactor,.70+skinCloud118*.035,uNaturalSkin118*(1.0-baseCoverage));";
export function repairPinnedP118Shader152(source){
 if(typeof source!=='string'||source.length<1000||
    source.split(old).length!==2||source.includes(fixed))
  throw Error('P152 refused unpinned or already changed P118 fragment shader source');
 if(!source.includes("const rough='#include <roughnessmap_fragment>';")||
    !source.includes("if(!shader.fragmentShader.includes(rough))")||
    !source.includes('diffuseColor.rgb=mix(diffuseColor.rgb,neutralCloth,baseCoverage);'))
  throw Error('P152 refused unknown original studio skin shader contract');
 const result=source.replace(old,fixed);
 if(result.replace(fixed,old)!==source)
  throw Error('P152 shader patch touched unrelated source');
 return Object.freeze({content:result,changedOnlyRoughnessOrder:true,
  preserveSkinTone:true,preserveSourceGeometry:true,releaseAuthorized:false});
}
export function assertP152ShaderScope(fragment){
 if(typeof fragment!=='string'||!fragment.includes('#include <roughnessmap_fragment>'))
  throw Error('P152 original Three.js roughness token required');
 const include=fragment.indexOf('#include <roughnessmap_fragment>');
 const assignment=fragment.indexOf('roughnessFactor=mix(roughnessFactor,');
 if(assignment<0||assignment<=include)
  throw Error('P152 source fragment references roughnessFactor before its declaration');
 return true;
}
