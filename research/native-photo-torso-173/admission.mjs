/**
 * MAIN P173 — read-only admission of a genuinely deformed photographed shirt
 * from the P172 physical-source-garment donor into the P171 saved-outfit viewer.
 * This is source/owner-bound research evidence, not an inference engine,
 * collision certification, or a claim of human photorealism.
 */
export const SHIRT_SOURCE_173=Object.freeze({
  id:'commons-0003',
  sha256:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
  contourGitCommit:'88d2fdb412f84b0498c86bfa17f4b391425e1958',
  fittedGeometryKind:'source-skin-bound-physical-torso-contour'
});
const no=reason=>Object.freeze({
 admitted:false,mode:'verified-original-photo-2d-fallback',reason,
 arbitraryOwnerPhoto3DApproved:false,photorealismApproved:false,
 physicalPhoneVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const hex=/^[a-f0-9]{64}$/;
export function inspectNativePhotoTorso173({selection,sources,render,proof171}={}){
 if(!selection?.ownerId||!selection?.slots?.top||sources?.ownerId!==selection.ownerId||
    !Array.isArray(sources.sources)||!proof171?.admitted||
    proof171.mode!=='verified-public-photo-skeleton-bound-research-3d')
  return no('signed-owner-P171-source-admission-required');
 if(!render?.privateVisible||render.viewerReady!==true||render.bones!==163||
    render.productionDeployed===true||render.releaseAuthorized===true)
  return no('real-private-163-bone-source-WebGL-not-current');
 if(!['shirt','shirt-pants'].includes(render.viewerMode))
  return no('only-source-verified-shirt-is-contoured');
 const shirt=sources.sources.find(x=>x?.id===selection.slots.top);
 if(!shirt||!hex.test(shirt.sha256||'')||shirt.sha256!==SHIRT_SOURCE_173.sha256)
  return no('saved-shirt-is-not-exact-original-verified-source-photo');
 if(!proof171.renderedItems?.some(x=>x.part==='shirt'&&
     x.itemId===shirt.id&&x.sha256===shirt.sha256))
  return no('source-SHA-owner-saved-outfit-not-matched-to-P171');
 const evidence=render.fitReceipts171?.shirt;
 const p60=evidence?.receipt;
 const shape=evidence?.torsoContour173;
 if(!p60||p60.accepted!==true||
    p60.mode!=='source-photo-on-anatomical-skinned-mesh'||
    p60.sourceId!==SHIRT_SOURCE_173.id||
    p60.sourceSHA256!==shirt.sha256||
    p60.common163BoneSkeletonChecked!==true||
    p60.originalPhotoPixelsUsed!==true||
    evidence.photoFabricPBR164!==true||evidence.sourceSHA256!==shirt.sha256)
  return no('actual-source-3d-P60-P164-photo-mesh-proof-unavailable');
 if(!shape||shape.sourcePhotoTorsoContour172!==true||
    shape.originalFrontPhotoSourceSHA172!==shirt.sha256||
    shape.sourcePhotoPixelsAndRigUnchanged172!==true||
    shape.anatomical163BoneSkeletonPreserved172!==true||
    shape.originalPhotographedBackVerified!==false||
    shape.humanVisualApproved!==false||
    shape.releaseAuthorized!==false||
    !Number.isSafeInteger(shape.physicalTorsoContourMovedVertices172)||
    shape.physicalTorsoContourMovedVertices172<=30||
    !Number.isSafeInteger(shape.physicalTorsoContourFrontVertices172)||
    shape.physicalTorsoContourFrontVertices172<=30||
    !Number.isSafeInteger(shape.physicalTorsoContourProtectedBackVertices172)||
    shape.physicalTorsoContourProtectedBackVertices172<20||
    !Number.isFinite(shape.physicalTorsoContourMaxMeters172)||
    shape.physicalTorsoContourMaxMeters172<.006||
    shape.physicalTorsoContourMaxMeters172>.0201)
  return no('source-verified-original-shirt-has-no-measured-physical-torso-deformation');
 return Object.freeze({
  admitted:true,mode:'verified-public-photo-physical-torso-research-3d',
  ownerId:selection.ownerId,selectedItemId:shirt.id,
  sourceSHA256:shirt.sha256,actualSkinnedMeshChanged:true,
  physicalTorsoMovedVertices:shape.physicalTorsoContourMovedVertices172,
  physicalTorsoMaxMoveMeters:shape.physicalTorsoContourMaxMeters172,
  verifiedOriginalPhotoPixelsAndRig:true,
  independentP171SourceAndOwnerAdmitted:true,
  arbitraryOwnerPhoto3DApproved:false,photorealismApproved:false,
  originalRearPhotoVerified:false,allPoseCollisionCertified:false,
  physicalPhoneVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
export function requireNativePhotoTorso173(input){
 const result=inspectNativePhotoTorso173(input);
 if(!result.admitted)throw Error('P173 measured photographed 3D shirt unavailable: '+result.reason);
 return result;
}
