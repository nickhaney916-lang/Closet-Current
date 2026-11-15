/**
 * Separate P89 signed-UNKNOWN original public photo source quarter-step A/B.
 * Two additional static poses are not swept continuous collision proof.
 */
const LABELS=['shirtBody','denimBody','shirtDenim'];
const POSES=['blend-25','blend-75'];
const fail=reason=>Object.freeze({
 schema:'P89-original-photo-quarter-pose-surface-gap-AB/v1',
 status:'QUARTERSTEP_SOURCE_COMPARISON_REFUSED',reason,
 trialRetainedForResearchOnly:false,
 sourcePhoto2DFallbackRequired:true,consumer3DAuthorized:false,
 signedOutsideBodyClearanceCertified:false,
 continuousSweptMotionCertified:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const ok=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<2;
const check=(x,reason)=>{if(!x)throw Error(reason);};
const record=(r,avatar)=>{
 check(r?.schema==='P89-real-original-shirt-jeans-static-quarterstep-gap/v1'&&
  r.status==='ACTUAL_PUBLIC_SOURCE_STATIC_QUARTERSTEP_MEASURED_NOT_SWEPT'&&
  r.avatar===avatar&&r.realAnatomical163BoneRig===true&&
  r.authenticQuarterPoseCount===2&&r.allOriginalFacePairsExamined===true&&
  r.originalSourceGeometryUnchanged===true&&r.originalBonesRestored===true&&
  r.signedExteriorClearanceCertified===false&&
  r.bodyContainmentCertified===false&&
  r.sweptContinuousCollisionCertified===false&&
  r.realClothDynamicsCertified===false&&
  r.originalPhoto2DFallbackRequired===true&&
  r.consumer3DAuthorized===false&&r.releaseAuthorized===false&&r.familyAlpha==='HOLD'&&
  Array.isArray(r.poseWitnesses)&&r.poseWitnesses.length===2,
  'real-original-quarterstep-receipt-required');
 for(let i=0;i<2;i++){
  const row=r.poseWitnesses[i];
  check(row?.pose===POSES[i]&&row.originalAnatomicalBonePose===true&&
   row.staticQuarterPoseOnly===true&&row.sweptCollisionCertified===false&&
   Object.keys(row.sourcePairs??{}).sort().join('|')===[...LABELS].sort().join('|'),
   'original-quarterstep-pose-and-source-pair-inventory-required');
  for(const label of LABELS){
   const v=row.sourcePairs[label];
   check(ok(v?.unsignedMinimumSurfaceDistanceMeters)&&
    Number.isSafeInteger(v.originalTriangleCrossingPairs)&&
    v.originalTriangleCrossingPairs>=0&&
    v.exactOriginalTriangulatedSurfacesMeasured===true&&
    v.signedInteriorExteriorNotMeasured===true&&
    v.dynamicSweptClothNotMeasured===true,
    'real-posed-source-contact-distance-required');
  }
 }
};
export function compareOriginalSourceQuarterStepAB89({avatar,baseline,trial}={}){
 try{
  check(['male','female'].includes(avatar),'original-anatomical-figure-required');
  record(baseline,avatar);record(trial,avatar);
  check(baseline.originalShirtSHA256===trial.originalShirtSHA256&&
   baseline.originalDenimSHA256===trial.originalDenimSHA256&&
   baseline.originalDenimSourceId===trial.originalDenimSourceId,
   'incompatible-original-photo-sources');
  let worseGap=false,newCrossing=false,improved=0,minDelta=0;
  const quarterPoseChanges=[];
  for(let i=0;i<2;i++){
   const b=baseline.poseWitnesses[i],t=trial.poseWitnesses[i],deltas={};
   for(const k of LABELS){
    const before=b.sourcePairs[k],after=t.sourcePairs[k];
    const delta=Math.round((after.unsignedMinimumSurfaceDistanceMeters-
     before.unsignedMinimumSurfaceDistanceMeters)*1e6)/1e6;
    const newContacts=after.originalTriangleCrossingPairs>
     before.originalTriangleCrossingPairs;
    worseGap||=delta<-.00005;
    newCrossing||=newContacts;
    improved+=Number(delta>=.0005);
    minDelta=Math.min(minDelta,delta);
    deltas[k]=Object.freeze({originalUnsignedDistanceMeters:before.unsignedMinimumSurfaceDistanceMeters,
     candidateUnsignedDistanceMeters:after.unsignedMinimumSurfaceDistanceMeters,
     changeMeters:delta,worsenedByMoreThan50Microns:delta<-.00005,
     newStrictCrossingWitnesses:newContacts});
   }
   quarterPoseChanges.push(Object.freeze({pose:POSES[i],sourcePairChanges:deltas}));
  }
  const accepted=!worseGap&&!newCrossing;
  return Object.freeze({
   schema:'P89-original-photo-quarter-pose-surface-gap-AB/v1',
   status:accepted?'QUARTER_STATIC_POSES_NO_NEW_WORSENING_NOT_SWEPT':
    'QUARTER_STATIC_POSE_SOURCE_WORSENING_WITNESSED',
   avatar,authenticOriginalSourceQuarterPoseCount:2,
   quarterPoseChanges,quarterPoseGapShrinkExceeded50Microns:worseGap,
   quarterPoseNewTriangleCrossings:newCrossing,
   quarterPoseImprovedAtLeastHalfMmCount:improved,
   mostNegativeQuarterPoseGapDeltaMeters:minDelta,
   trialRetainedForResearchOnly:accepted,
   originalPhotoGeometryUnchangedInAudit:true,
   staticQuarterstepNotContinuousMotion:true,
   signedOutsideBodyClearanceCertified:false,
   continuousSweptMotionCertified:false,
   sourcePhoto2DFallbackRequired:true,consumer3DAuthorized:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const reason=String(e?.message||'unknown').replace(/[^a-z0-9-]/gi,'').slice(0,90);
  return fail(reason);
 }
}
