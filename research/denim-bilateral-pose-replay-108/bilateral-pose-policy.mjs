/**
 * Closet Current PHOTO108 — immutable bilateral sampled-pose itinerary.
 * Source-true independent anatomical knees, 0..16 degrees.
 *
 * No timers/animation service or invented physical cloth simulation.
 * Snapshots sample real source photo skinned garment mesh at each pose.
 */
export const SOURCE_BILATERAL_SEQUENCE_108=Object.freeze([
 Object.freeze([0,0]),
 Object.freeze([4,0]),
 Object.freeze([8,0]),
 Object.freeze([16,0]),
 Object.freeze([16,16]),
 Object.freeze([0,16]),
 Object.freeze([0,8]),
 Object.freeze([0,0]),
 Object.freeze([16,0]),
 Object.freeze([0,0])
]);
export function validateBilateralSourcePose108(left,right){
 if(typeof left!=='number'||typeof right!=='number'||
  !Number.isFinite(left)||!Number.isFinite(right)||
  left<0||right<0||left>16||right>16)
  throw Error('PHOTO108: finite independently set original 163-bone knee angles 0..16 required');
 return Object.freeze({
  leftDegrees:left,rightDegrees:right,
  isSourceRelative:true,poseSamplesOnly:true,
  genuineOriginal163BoneGarmentRequired:true,
  alwaysRebuildFromSource:true,
  acceptsAutoAnimation:false,
  fullSweptCollisionCertified:false,
  actualDynamicClothPhysicsCertified:false,
  humanPhotorealismCertified:false,
  physicallyTestedOnPhones:false,
  releaseAuthorized:false
 });
}
