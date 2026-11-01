/**
 * SWEEP-04 — deterministic bounded phase clock and independent dense sample
 * contract for TRUE 163-bone photographed garment movement.
 * This is a phase sampler, NOT continuous mathematical swept-collision proof.
 */
import {WALK02,gait02Angles} from '../fabric-walk-02/anatomical-gait-driver.mjs';
import {fold03Signal} from '../fabric-folds-03/pose-conditioned-source-pleats.mjs';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const cycleMs=WALK02.cycleSeconds*1000;
export const SWEEP04=Object.freeze({
 originalRigBones:163,sourceSHA256:WALK02.sourceSHA256,
 cycleSeconds:WALK02.cycleSeconds,sampledPhaseCount:9,
 maxFrameSeconds:.05,maxPeriodGapSeconds:.2,
 defaultOff:true,releaseAuthorized:false,
 mathematicallyContinuousCollisionCertified:false,
 physicalDevicesTested:false
});
/** 9 real 3D/skinned-contact positions including both endpoints; endpoints
 * are the same complete pose. Every other phase lies BETWEEN earlier poses.
 */
export function gaitSweepPhases04(){
 return Object.freeze(Array.from({length:9},(_,i)=>i/8));
}
export function phaseContinuity04(a,b){
 if(!finite(a)||!finite(b)||a<0||a>1||b<0||b>1)
  throw Error('Finite loop phases [0,1] required');
 const dx=Math.min(Math.abs(a-b),1-Math.abs(a-b));
 const A=gait02Angles(a),B=gait02Angles(b);
 const realBoneDegrees=Math.max(
  Math.abs(A.leftHip-B.leftHip),Math.abs(A.rightHip-B.rightHip),
  Math.abs(A.leftKnee-B.leftKnee),Math.abs(A.rightKnee-B.rightKnee),
  Math.abs(A.pelvisYaw-B.pelvisYaw));
 return {shortestPhaseDistance:dx,realBoneDegrees,
  cyclicGaitCompatible:Math.abs(A.leftHip-B.leftHip)<=12.00001,
  originalRigBones:SWEEP04.originalRigBones};
}
export function createContinuousGaitClock04({periodMs=cycleMs}={}){
 if(!finite(periodMs)||periodMs<1000||periodMs>4000)
  throw Error('Real gait timing outside safe verified source bounds');
 let last=null,elapsed=0,ticks=0,clampedFrames=0,closed=false;
 return Object.freeze({
  tick(nowMs){
   if(closed||!finite(nowMs)||nowMs<0)throw Error('Valid monotonic real browser frame required');
   if(last!==null&&nowMs<last)throw Error('Monotonic timestamps only');
   const raw=last===null?1000/60:nowMs-last;
   const delta=Math.max(0,Math.min(raw,SWEEP04.maxFrameSeconds*1000));
   if(raw>SWEEP04.maxFrameSeconds*1000)clampedFrames++;
   last=nowMs;elapsed+=delta;ticks++;
   const phase=(elapsed%periodMs)/periodMs;
   const a=gait02Angles(phase);
   return {phase,deltaSeconds:delta/1000,ticks,clampedFrames,
    actualRealBonesDriven:true,hipDegrees:a.leftHip,kneeDegrees:a.leftKnee,
    originalSourceSHA256:SWEEP04.sourceSHA256,
    releaseAuthorized:false};
  },
  state(){return {ticks,clampedFrames,elapsedMs:elapsed,
   phase:(elapsed%periodMs)/periodMs,stopped:closed,
   exactSourceRig:true,releaseAuthorized:false};},
  reset(){if(closed)throw Error('Destroyed gait clock');last=null;elapsed=0;ticks=0;clampedFrames=0;},
  dispose(){closed=true;last=null;}
 });
}
export function sampleGaitDrapeContinuity04(phases=gaitSweepPhases04()){
 if(!Array.isArray(phases)&&!Object.isFrozen(phases))throw Error('Explicit gait sample sequence required');
 const list=Array.from(phases);
 if(list.length!==9||list.some((p,i)=>!finite(p)||p!==i/8))
  throw Error('Entire 9-sample authentic source gait cycle required');
 return Object.freeze(list.map((phase,index)=>{
  const bones=gait02Angles(phase),fold=fold03Signal(phase,Math.PI*.54,.72);
  const prior=index?phaseContinuity04(list[index-1],phase):null;
  return {index,phase,bones,fold,prior,actualOriginalBonePose:true,
   originalPhotographedDressFrontPreserved:true,sweptCollisionCertified:false};
 }));
}
