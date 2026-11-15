/**
 * MAIN1054 M47 — strictly research-only original P541 dress shader V-neck
 * alpha visibility hypothesis. Does NOT change the real dress geometry,
 * body, owner account or original photographer-source cutout.
 *
 * Actual P541 shader only mixes uDressImage RGB by alpha; zero alpha does
 * not remove a front dress fragment. Test a source-projected, FRONT-ONLY,
 * narrow V-neck discard against genuine P93/M45 on the exact 163-bone rig.
 *
 * A shader fragment disappearing is NOT proven tailored physical opening,
 * body clearance, seam/UV correspondence, human approved source fidelity,
 * viable continuous cloth, or permission to use private wardrobe 3D.
 */
export const M47=Object.freeze({
 schema:'MAIN1054_M47_ORIGINAL_PHOTO_BOUND_VNECK_SHADER_VISIBILITY_RESEARCH/v1',
 originalGitBlobSHA1:'4b70b9d794d9ce6ed8130f030d28b8685670dbf3',
 previousSource:'commons-0053',
 originalSHA256:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 p93SourceSHA256:'caf1e8b5e292e9397262333ba6a3d2f673bd6c81b6b1694b5abf69aa90676a31',
 m45SourceSHA256:'4ed9b90497cb0ae89c861f67e068df5a7ac98e55a2cf6e3c116aa2b5bcf19513',
 materialMode:'M45_HOLE_RESEARCH_ONLY',
 originalSourceSize:Object.freeze([1920,2880]),
 originalVNeckPixelBounds:Object.freeze([770,450,1230,730]),
 protectedFrontendMin:0.75,
 minSourceRGBUnchanged:true,
 zeroOriginalGeometryChange:true,
 zeroOriginalPhotoFileChanges:true,
 noConsumerSourceAdmission:true,
 noPhysicalNecklineVerified:true,
 noIndependentHumanVisualAcceptance:true,
 consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const refuse=s=>{throw Error('M47 ORIGINAL 163BONE LICENSED PHOTO SHADER BLOCKED: '+s);};
const anchor="'vec4 samplePixel=texture2D(uDressImage,uv);',";
const match=(hay,needle)=>hay.split(needle).length===2;
/** In-memory local HTTP research module only; never write it to donor file. */
export function createResearchVNeckFrontAlphaVisibility47({
 originalDressShaderJS,originalGitBlobSHA1,variant,approvedForRelease=false
}={}){
 if(typeof originalDressShaderJS!=='string'||
    originalGitBlobSHA1!==M47.originalGitBlobSHA1||
    variant!==M47.materialMode||approvedForRelease!==false||
    !match(originalDressShaderJS,anchor)||
    originalDressShaderJS.includes('discard;')||
    !originalDressShaderJS.includes("export const DRESS_RELEASE='HOLD';")||
    !originalDressShaderJS.includes("new T.SkinnedMesh(geometry,material)")||
    !originalDressShaderJS.includes("'diffuseColor.rgb=mix(diffuseColor.rgb,samplePixel.rgb,samplePixel.a*front*edge);',")||
    !originalDressShaderJS.includes("'float front=smoothstep(.15,.54,vDressNormal.z);',"))
  refuse('requires exact immutable, alpha-color-blended existing source shader and research-only variant');
 const sourceLeft=M47.originalVNeckPixelBounds[0]/1920,
  sourceRight=M47.originalVNeckPixelBounds[2]/1920,
  sourceTop=M47.originalVNeckPixelBounds[1]/2880,
  sourceBottom=M47.originalVNeckPixelBounds[3]/2880;
 if(!(sourceLeft>.3&&sourceRight<.7&&sourceTop>.1&&sourceBottom<.3))
  refuse('original photo bounded neckline constants invalid');
 // The UV is *exactly* the original P541 custom original-JPEG shader's
 // projection, not a fabricated mesh UV field. Texture.flipY is inherited.
 // Protect original bright piping by discarding ONLY source-PNG alpha below
 // .06, with M45's independent licensed RGB/white pixel guard enforced
 // before the candidate is passed to this renderer. Restrict to FRONT,
 // high centre blending and original-photo observed upper V ROI only.
 const expression=
  'if(front>0.75&&edge>0.55&&uv.x>='+sourceLeft.toFixed(9)+'&&'+
  'uv.x<='+sourceRight.toFixed(9)+'&&(1.-uv.y)>='+sourceTop.toFixed(9)+
  '&&(1.-uv.y)<='+sourceBottom.toFixed(9)+
  '&&samplePixel.a<0.06)discard;';
 const patched=originalDressShaderJS.replace(anchor,anchor+'\n  '+JSON.stringify(expression)+',');
 if(!match(patched,expression)||!patched.includes('discard;')||
    !patched.includes(anchor)||patched.length<=originalDressShaderJS.length)
  refuse('research alpha discard insertion missing');
 return Object.freeze({
  patchedResearchModuleText:patched,
  audit:Object.freeze({
   schema:M47.schema,sourcePhotoId:M47.previousSource,
   originalSHA256:M47.originalSHA256,
   sourceObservedVNeckBounds:M47.originalVNeckPixelBounds,
   onlyNativeOriginalPhotoDressShaderPatched:true,
   onlyFrontFacingSourceProjectedFragmentVisibility:true,
   sourceRGBAndAlphaDataImmutable:true,
   original3DGeometrySkinUVAndCameraImmutable:true,
   originalDonorModuleOnDiskUntouched:true,
   originalSourceVisualFidelityProven:false,
   sourcePixelAlphaZeroDoesNotMeanValidPhysicalHole:true,
   actualClothOrBodyClearanceNotCertified:true,
   viewerConsentForConsumer3D:false,
   independentHumanApproval:false,
   consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
  })
 });
}
const integer=x=>Number.isSafeInteger(x)&&x>=0;
export function judgeResearchVNeckVisibility47({
 variants,scenes,expectedComparisons=12,networkRequests=[],
 browserErrors=[],sourceCropRects,originalPhotoSourceSHA256,
 sourceBoundDelta,shaderPermission
}={}){
 const flags=['P93','M45','M45_HOLE'];
 if(!Array.isArray(variants)||JSON.stringify(variants)!==JSON.stringify(flags)||
    originalPhotoSourceSHA256!==M47.originalSHA256||
    !Array.isArray(scenes)||scenes.length!==36||
    !integer(expectedComparisons)||expectedComparisons!==12||
    !Array.isArray(networkRequests)||networkRequests.length||
    !Array.isArray(browserErrors)||browserErrors.length||
    !sourceBoundDelta||sourceBoundDelta.additionalM45AlphaRemoved!==4890||
    sourceBoundDelta.originalP93AlphaChanged!==12961||
    sourceBoundDelta.sourceRGBAAllRGBBytesIdentical!==true||
    sourceBoundDelta.releaseAuthorized!==false||
    shaderPermission!==false)
  refuse('native licensed source, 36 authentic scenes, safe original 2D admission or browser evidence missing');
 const crops=flags.map(x=>sourceCropRects?.[x]);
 if(crops.some(c=>!Array.isArray(c)||c.length!==4||
   c.some(x=>!Number.isFinite(x)||x<0||x>1)))
  refuse('actual shader original photograph UV crop is not independently observed');
 const one=JSON.stringify(crops[0]);
 if(crops.some(c=>JSON.stringify(c)!==one))
  refuse('different original image crop would confound source-accurate 3D A/B');
 const seen=new Set(),kinds=new Map();
 for(const s of scenes){
  const key=[s.variant,s.figure,s.pose,s.view].join('/');
  if(seen.has(key))refuse('duplicate native 3D source scene');
  seen.add(key);
  if(!flags.includes(s.variant)||!['female','male'].includes(s.figure)||
   !['source','blend-50','relaxed'].includes(s.pose)||
   !['front','side'].includes(s.view)||
   !integer(s.changedMaskSourceOriginalRGBPixels)&&s.changedMaskSourceOriginalRGBPixels!==undefined||
   s.actualBoneCount!==163||s.originalGeometryAndPhotoUVUntouched!==true||
   s.originalPhotographerSourceSHA256!==M47.originalSHA256||
   !integer(s.fittedVertices)||s.fittedVertices<1000||
   !integer(s.anatomicalBodyFaces)||s.anatomicalBodyFaces<100000||
   !integer(s.sourceGarmentTriangles)||s.sourceGarmentTriangles<3000||
   s.sampledCrossBodyStrictWitnesses!==0||s.sampledSelfStrictWitnesses!==0||
   !integer(s.ambiguousBodyNearUnresolved)||!integer(s.ambiguousSelfNearUnresolved)||
   s.releaseAuthorized!==false)
   refuse('real source joint pose/photographic mesh sample missing or false body clearance');
  const which=[s.figure,s.pose,s.view].join('/');
  const first=kinds.get(which);
  const physical=[s.fittedVertices,s.anatomicalBodyFaces,s.sourceGarmentTriangles,
   s.ambiguousBodyNearUnresolved,s.ambiguousSelfNearUnresolved];
  if(first&&JSON.stringify(first)!==JSON.stringify(physical))
   refuse('alpha fragment hypothesis must not alter true skinned mesh or body contact sample');
  kinds.set(which,physical);
 }
 if(kinds.size!==expectedComparisons)
  refuse('original photo pose/figure/camera coverage incomplete');
 return Object.freeze({
  schema:'MAIN1054_M47_AUTHENTIC_SOURCE_ALPHA_VISIBILITY_COMPARISON_CHECK/v1',
  matchedNative3DSourceMaskComparisons:kinds.size,
  actualSource3DScenes:scenes.length,
  originalProjectedPhotoCropSameAcrossAllVariants:true,
  originalLicensedJPEGVerified:true,
  originalPhotoAlphaMaskBoundedAndRGBAImmutable:true,
  originalSourceGeometryAndSkinnedPoseUnchanged:true,
  originalSourceBodyContactSamplesCount:kinds.size,
  unresolvedNearSourceBodyOrSelfContactNotRelease:true,
  alphaVisibilityCutNotPhysicalClothGeometry:true,
  humanPhotoAndMaterialReviewNotPerformed:true,
  contactSweepContinuousNotCertified:true,
  sourceBacksideNotPhotographed:true,
  noConsumer3DAdmission:true,
  releaseAuthorized:false,consumer3DAdmitted:false,familyAlpha:'HOLD'
 });
}
