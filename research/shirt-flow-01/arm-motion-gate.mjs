/** SHIRT-FLOW-01 original-source 163-bone arm phase preview.
 * Operates on original 3D43/3D56 independently fitted skinned shirt, not
 * invented fabric back, new mannequin, separate texture or cloth physics.
 */
export const SHIRT_FLOW01=Object.freeze({
 approvedSourceId:'commons-0003',
 allowedPoses:Object.freeze(['source','blend-25','blend-50','blend-75','relaxed']),
 requiredRigBones:163,defaultOff:true,releaseAuthorized:false,
 physicalPhonesVerified:false,continuousClothPhysicsCertified:false
});
export function armPoseAt01(value){
 if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1||
    Math.abs(value*4-Math.round(value*4))>1e-9)
  throw Error('Only five reviewed actual skeletal pose fractions allowed');
 return SHIRT_FLOW01.allowedPoses[Math.round(value*4)];
}
export function assertVerifiedShirtPose01(state,expectedSha){
 if(!state?.loaded||state.stats?.bones!==163||
    state.outfit?.mode!=='shirt-pants'||
    state.outfit?.shirt?.sourceId!==SHIRT_FLOW01.approvedSourceId||
    !/^[a-f0-9]{64}$/.test(expectedSha||'')||
    state.outfit?.shirt?.sourceSHA256!==expectedSha||
    !state.outfit?.shirt?.sourceMeasuredNaturalSleeveHang||
    !state.outfit?.shirt?.poseConditionedSleeveDrape||
    state.outfit?.shirt?.poseTriangleContact?.after?.count!==0)
  throw Error('Exact genuine original-photo, independently fitted source shirt and collision-reviewed real arms required');
 return {
  verifiedSourceSHA256:expectedSha,originalRigBones:163,
  sourcePhotoAndSkinPreserved:true,realPosedSleeveFabric:true,
  continuousClothPhysicsCertified:false,releaseAuthorized:false
 };
}
export function createArmPoseCycle01(){
 let index=0,closed=false,ticks=0;
 return Object.freeze({
  step(){
   if(closed)throw Error('Arm research cycle closed');
   const pose=SHIRT_FLOW01.allowedPoses[index];
   index=(index+1)%SHIRT_FLOW01.allowedPoses.length;ticks++;
   return {pose,ticks,liveSkinnyBoneShape:true,oneCycleSamples:5,releaseAuthorized:false};
  },
  reset(){if(closed)throw Error('Closed');index=0;ticks=0;},
  state(){return {index,ticks,closed,poseCount:5,defaultOff:true,releaseAuthorized:false};},
  dispose(){closed=true;}
 });
}
