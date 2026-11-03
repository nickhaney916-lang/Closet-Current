/**
 * DENIM-POSE-29: truthful photographed-source fitted/static versus bent/fallback
 * lifecycle. Pure decisions; never authorizes synthetic rear photos, fitted
 * geometry under a new pose, or an unaudited return to anatomical rest.
 */
export const POSE29=Object.freeze({
 allowed:Object.freeze(['source','left-12','right-12','both-16']),
 originalPhotoUnchanged:true,
 noSweptPhysicsClaim:true,
 bentRestFitApproval:false,
 humanRealismApproved:false,physicalDeviceApproved:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
export function decideDenimPose29({pose,previous=null,restFitWasFrozen=false,
 originalSourceSHA256,originalPhotoPreserved,realKneeContactCount,
 restRecoveryProof=null}={}){
 if(!POSE29.allowed.includes(pose)||typeof originalSourceSHA256!=='string'||
  !/^[a-f0-9]{64}$/.test(originalSourceSHA256)||
  !previous||typeof previous!=='object'||
  (previous.sourceSHA256&&previous.sourceSHA256!==originalSourceSHA256)||
  originalPhotoPreserved!==true||
  !Number.isSafeInteger(realKneeContactCount)||realKneeContactCount!==0)
  throw Error('P29 exact original photo, owner, verified source SHA, zero-contact knee pose and prior state required');
 if(pose==='source'){
  if(restRecoveryProof){
   if(restRecoveryProof.originalPhotoSHA256!==originalSourceSHA256||
    restRecoveryProof.sourceJPEGUVSkinRestProtected28!==true||
    restRecoveryProof.sourceNeutralSeamFlow28!==true||
    !Number.isSafeInteger(restRecoveryProof.bodyContactBefore)||
    !Number.isSafeInteger(restRecoveryProof.bodyContactAfter)||
    restRecoveryProof.bodyContactBefore<0||restRecoveryProof.bodyContactAfter<0||
    restRecoveryProof.bodyContactAfter>restRecoveryProof.bodyContactBefore||
    restRecoveryProof.trueBVHBodyContactNoNew!==true)
    throw Error('P29 cannot claim a restored source fit without genuine intact 163-bone photo and BVH proof');
   return Object.freeze({phase:'SOURCE_FIT_RESTORED',fitVisible:true,
    resumePending:false,sourceSHA256:originalSourceSHA256,
    pose:'source',contactCertified:true,modeledBackNotPhotographed:true,
    releaseAuthorized:false});
  }
  return Object.freeze({phase:'SOURCE_UNFITTED_REVIEW',fitVisible:false,
   resumePending:previous.resumePending===true||restFitWasFrozen,
   sourceSHA256:originalSourceSHA256,pose:'source',contactCertified:true,
   modeledBackNotPhotographed:true,releaseAuthorized:false});
 }
 return Object.freeze({phase:'BENT_SOURCE_ONLY',fitVisible:false,
   resumePending:previous.resumePending===true||restFitWasFrozen,
   sourceSHA256:originalSourceSHA256,pose,contactCertified:true,
   modeledBackNotPhotographed:true,releaseAuthorized:false});
}
