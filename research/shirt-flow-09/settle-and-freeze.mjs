/**
 * SHIRT-FIT-09: deterministically relax the already fitted, licensed-photo
 * shirt, then freeze the actual skinned garment mesh. Research only.
 * The contact callback must test the real skinned garment against the body
 * after EVERY 60 Hz step. No user's photos or source pixels are rewritten.
 */
export const SETTLE09 = Object.freeze({
 fixedStepSeconds:1/60,maxSteps:96,requiredStableFrames:5,
 maxVelocityMetersPerStep:0.00002,maxOffsetMeters:0.00006,
 physicalPhoneApproved:false,fullClothPhysicsCertified:false,releaseAuthorized:false
});
export function settleAndFreeze09({pose,step,freeze,settings={}}){
 if(typeof step!=='function'||typeof freeze!=='function')
  throw Error('Real cloth step and mesh snapshot freeze callbacks are required');
 if(typeof pose!=='number'||!Number.isFinite(pose)||pose<0||pose>1||
    Math.abs(pose*16-Math.round(pose*16))>1e-9)
  throw Error('Only verified source-to-relaxed 17 skeletal fitting phases');
 const opts={...SETTLE09,...settings};
 if(!Number.isInteger(opts.maxSteps)||opts.maxSteps<8||opts.maxSteps>240||
    !Number.isInteger(opts.requiredStableFrames)||opts.requiredStableFrames<2||
    opts.requiredStableFrames>opts.maxSteps)
  throw Error('Invalid bounded cloth relaxation budget');
 let consecutive=0,finalSample=null,steps=0,largestOffset=0;
 for(let n=0;n<opts.maxSteps;n++){
  const sample=step(pose,n);
  const c=sample?.contact?.after?.count;
  const state=sample?.motion;
  if(c!==0||!state||!Number.isFinite(state.velocity)||
     !Number.isFinite(state.displacement))
   throw Error('Cannot freeze unverified body-contact or nonfinite cloth state');
  if(sample.photoAndSkinPreserved!==true)
   throw Error('Original photographed pixels/UV/skin must remain immutable');
  steps++;finalSample=sample;
  largestOffset=Math.max(largestOffset,Math.abs(state.displacement));
  if(Math.abs(state.velocity)<=opts.maxVelocityMetersPerStep&&
     Math.abs(state.displacement)<=opts.maxOffsetMeters)consecutive++;
  else consecutive=0;
  if(consecutive>=opts.requiredStableFrames)break;
 }
 if(consecutive<opts.requiredStableFrames)
  throw Error('Photographed cloth failed to settle inside bounded fixed-step budget');
 const proof=Object.freeze({
  frozenSourcePhotographed3DMesh:true,
  bodyTriangleContactVerifiedEachStep:true,
  sourcePhotoUVAndSkinPreserved:true,
  pose,steps,stableFrames:consecutive,largestOffsetMeters:largestOffset,
  finalVelocityMetersPerStep:finalSample.motion.velocity,
  finalSpringOffsetMeters:finalSample.motion.displacement,
  fixedStepSeconds:SETTLE09.fixedStepSeconds,
  dynamicPlaybackRequired:false,physicsUsedOnlyForFitting:true,
  physicalPhoneApproved:false,fullClothPhysicsCertified:false,
  humanVisualApproved:false,releaseAuthorized:false
 });
 freeze(proof);
 return proof;
}
