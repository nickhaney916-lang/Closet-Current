/** Source/owner-bound P174 physical bilateral sewn shoulder evidence.
 * Requires exact P173 original owner JPEG+163-bone mesh admission; never
 * treats original owner camera JPEG as an arbitrary fitted 3D mesh. */
export const ORIGINAL_SHIRT174='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const deny=reason=>Object.freeze({admitted:false,reason,
 mode:'verified-original-photo-2d-fallback',arbitraryOwnerPhoto3DApproved:false,
 humanPhotorealismApproved:false,releaseAuthorized:false,familyAlpha:'HOLD'});
export function inspectNativeShoulder174({selection,sources,render,proof173}={}){
 if(!selection?.ownerId||!selection.slots?.top||
    sources?.ownerId!==selection.ownerId||!Array.isArray(sources.sources)||
    !proof173?.admitted||proof173.mode!=='verified-public-photo-physical-torso-research-3d'||
    proof173.selectedItemId!==selection.slots.top||
    proof173.ownerId!==selection.ownerId)
  return deny('owner-signed-P173-physical-source-fit-required');
 const original=sources.sources.find(x=>x?.id===selection.slots.top);
 if(!original||original.sha256!==ORIGINAL_SHIRT174||
    proof173.sourceSHA256!==original.sha256)
  return deny('saved-owner-original-source-photo-mismatched');
 if(!render?.privateVisible||render.viewerReady!==true||render.bones!==163||
    render.productionDeployed===true||render.releaseAuthorized===true||
    !['shirt','shirt-pants'].includes(render.viewerMode))
  return deny('native-original-163-bone-shirt-view-not-active');
 const receipt=render.fitReceipts171?.shirt,real=receipt?.armhole174;
 if(receipt?.sourceSHA256!==original.sha256||
    receipt?.photoFabricPBR164!==true||
    receipt.receipt?.accepted!==true||
    receipt.receipt?.sourceSHA256!==original.sha256||
    receipt.receipt?.common163BoneSkeletonChecked!==true||
    receipt.receipt?.originalPhotoPixelsUsed!==true)
  return deny('actual-original-P60-P164-photo-skinned-mesh-proof-required');
 if(!real||real.sourcePhotoShoulderSleeve174!==true||
    real.shoulder174SourceSHA!==original.sha256||
    real.shoulder174OriginalPixelsUVSkinAnd163BonesPreserved!==true||
    real.shoulder174RearPhotoVerified!==false||
    real.shoulder174HumanApproved!==false||
    real.shoulder174AllPoseCollisionCertified!==false||
    real.releaseAuthorized!==false||
    !Number.isSafeInteger(real.shoulder174MovedVertices)||
    real.shoulder174MovedVertices<40||
    !Number.isFinite(real.shoulder174MaxMeters)||
    real.shoulder174MaxMeters<.0025||real.shoulder174MaxMeters>.00961||
    !Number.isSafeInteger(real.shoulder174ProtectedCenter)||
    real.shoulder174ProtectedCenter<100||
    !Number.isSafeInteger(real.shoulder174SharedSeams)||
    real.shoulder174SharedSeams<6||
    !Number.isFinite(real.shoulder174GapBefore)||
    real.shoulder174GapBefore>5e-5||
    !Number.isFinite(real.shoulder174GapAfter)||
    real.shoulder174GapAfter>5e-5||
    ['L','R'].some(s=>!real.shoulder174Sides?.[s]||
     !['moved','caps','shells','shared'].every(k=>
      Number.isSafeInteger(real.shoulder174Sides[s][k]))||
     real.shoulder174Sides[s].moved<15||
     real.shoulder174Sides[s].caps<5||
     real.shoulder174Sides[s].shells<5||
     real.shoulder174Sides[s].shared<3))
  return deny('missing-bilateral-physical-sleeve-seam-movement-or-source-integrity');
 return Object.freeze({admitted:true,
  mode:'source-verified-bilateral-physical-armhole-research-3d',
  ownerId:selection.ownerId,itemId:original.id,sourceSHA256:original.sha256,
  actual163BoneSkinnedSeamsMoved:true,
  movedVertices:real.shoulder174MovedVertices,
  maximumDisplacementMeters:real.shoulder174MaxMeters,
  bothCapsAndTorsoJointPreserved:true,originalPhotoAndUVPreserved:true,
  noFabricatedRearPhoto:true,arbitraryOwnerPhoto3DApproved:false,
  humanPhotorealismApproved:false,allPoseCollisionCertified:false,
  physicalPhoneVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'});
}
