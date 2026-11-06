/**
 * PHOTO-DENIM-INTERMEDIATE-KNEE-103 — pure sampled joint-range policy.
 *
 * Research-only pose for independently verified SOURCE JPEG skinned denim.
 * Bounds must remain within the previously tested 16-degree per-knee
 * anatomical range. No human realism/continuous cloth/phone approval.
 */
export const KNEE_ANGLES_103=Object.freeze([0,4,8,12,16]);
export function validatePhotographedDenimKnees103(left,right){
 if(typeof left!=='number'||typeof right!=='number'||
  !Number.isFinite(left)||!Number.isFinite(right)||
  left<0||right<0||left>16||right>16)
  throw Error('3D103 only finite independent knee rotations 0..16 degrees');
 // No smoothing from a previous frame: the caller always explicitly supplies
 // source-relative angles and the real renderer resets to source first.
 return Object.freeze({leftDegrees:left,rightDegrees:right,
  sourcePoseRelative:true,maximumDegrees:16,
  isLicensedGarmentOnly:true,continuousFabricMotionCertified:false,
  fullSweptCollisionCertified:false,physicalPhoneVerified:false,
  humanPhotorealismApproved:false,releaseAuthorized:false});
}
