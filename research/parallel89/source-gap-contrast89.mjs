/**
 * P89 genuine independent A/B audit of P84 licensed shirt SHOULDER-YOKE
 * research trial. Unsigned gap changes are witnesses, not physically signed
 * exterior clearances. Three real 163-bone poses × 3 source pair types.
 * No source photo pixels, vertices, person data or consumer 3D permissions.
 */
const POSES=['source','blend-50','relaxed'];
const PAIRS=['shirtBody','denimBody','shirtDenim'];
const SHIRT='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const DENIM='b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c';
const deny=reason=>Object.freeze({
 schema:'P89-source-shoulder-unsigned-gap-AB/v1',
 status:'SOURCE_SHOULDER_GAP_AB_REFUSED',reason,
 signedClearanceVerified:false,continuousClothMotionCertified:false,
 consumer3DAuthorized:false,sourcePhoto2DFallbackRequired:true,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
const check=(v,reason)=>{if(!v)throw Error(reason);};
const safe=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<2;
const round=x=>Math.round(x*1e6)/1e6;
const validateReport=(r,avatar)=>{
 check(r?.schema==='P89-original-source-unsigned-3d-surface-gap/v1'&&
  r.status==='THREE_ACTUAL_SOURCE_POSE_UNSIGNED_GAPS_MEASURED_NOT_CLEARANCE'&&
  r.avatar===avatar&&r.actualAnatomical163Bones===true&&
  r.originalPublicPhotoId==='commons-0003'&&
  r.originalShirtSHA256===SHIRT&&r.originalDenimSHA256===DENIM&&
  r.originalSourcePoses===3&&
  r.exactOriginalWorldSpaceTrianglesMeasured===true&&
  r.independentSignedDistanceOrBodyContainmentVerified===false&&
  r.dynamicSweptClothContactVerified===false&&
  r.independentPhotorealismApproved===false&&
  r.sourcePhoto2DFallbackRequired===true&&
  r.consumer3DAuthorized===false&&r.releaseAuthorized===false&&
  r.familyAlpha==='HOLD'&&Array.isArray(r.sourcePoseMeasurements)&&
  r.sourcePoseMeasurements.length===3,'unverified-real-original-source-AB');
 for(let i=0;i<3;i++){
  const row=r.sourcePoseMeasurements[i];
  check(row?.pose===POSES[i]&&row.nearSurfaceThresholdMeters===.002&&
   row.absenceOfTriangleCrossingsCannotCertifyPhysicalSeparation===true&&
   row.distances&&Object.keys(row.distances).sort().join('|')===
    [...PAIRS].sort().join('|'),'source-poses-or-pair-inventory-falsified');
  let near=false;
  for(const k of PAIRS){
   const d=row.distances[k];
   check(safe(d?.unsignedMinimumSurfaceDistanceMeters)&&
    d.distanceMeasuredOnAllSourceTriangles===true&&
    d.signedExteriorClearanceMeasured===false&&
    d.bodyContainmentMeasured===false&&
    d.continuousMovementMeasured===false&&
    Array.isArray(d.sourceTriangleCounts)&&d.sourceTriangleCounts.length===2&&
    d.sourceTriangleCounts.every(n=>Number.isSafeInteger(n)&&n>0),
    'forged-unsigned-source-distance');
   near||=d.unsignedMinimumSurfaceDistanceMeters<=.002;
   check(Number.isSafeInteger(row.originalTriangleCrossings?.[k])&&
    row.originalTriangleCrossings[k]>=0,
    'original-source-triangle-crossing-witness-missing');
  }
  check(near===row.someSourceSurfacesWithin2mm,
   'suppressed-original-body-near-contact');
 }
};
export function compareOriginalSourceShoulderGapAB89({
 avatar,baseline,trial,baselineShoulder,trialShoulder
}={}){
 try{
  check(['female','male'].includes(avatar),'authentic-anatomical-figure-required');
  validateReport(baseline,avatar);validateReport(trial,avatar);
  check(baseline.originalDenimSHA256===trial.originalDenimSHA256&&
   baseline.denimSourceId===trial.denimSourceId,
   'original-licensed-denim-pair-mismatch');
  check(baselineShoulder?.schema==='parallel84-source-bone-shoulder-yoke/v1'&&
   baselineShoulder.status==='BASELINE_UNMODIFIED'&&
   baselineShoulder.trialApplied===false&&
   baselineShoulder.releaseAuthorized===false,
   'unmodified-original-shirt-baseline-not-confirmed');
  check(trialShoulder?.schema==='parallel84-source-bone-shoulder-yoke/v1'&&
   trialShoulder.releaseAuthorized===false&&
   trialShoulder.sourcePhotoPreserved===true&&
   trialShoulder.sourceSkinUVPreserved===true&&
   trialShoulder.originalBodyUnchanged===true&&
   trialShoulder.sourceBackUnphotographed===true&&
   trialShoulder.continuousClothPhysicsValidated===false&&
   trialShoulder.humanVisualRealismApproved===false&&
   typeof trialShoulder.trialApplied==='boolean',
   'unproven-research-shoulder-trial');
  check(trialShoulder.trialApplied?
   trialShoulder.status==='SAMPLED_CONTACT_NONWORSENING_ONLY'&&
    trialShoulder.newlyIntroducedBodyTrianglePairs===0&&
    trialShoulder.newlyIntroducedLayerTrianglePairs===0:
   ['REFUSED_UNCHANGED','REFUSED_NEW_CONTACT'].includes(trialShoulder.status),
   'falsified-photo-preserving-source-shape-acceptance');
  const measurements=[];let newContactWorsening=false,geometryWorsened=false;
  let improved=0,worsened=0,stillNear=0;
  for(let i=0;i<3;i++){
   const a=baseline.sourcePoseMeasurements[i],b=trial.sourcePoseMeasurements[i];
   const distanceChange={};
   for(const k of PAIRS){
    const original=a.distances[k].unsignedMinimumSurfaceDistanceMeters,
     candidate=b.distances[k].unsignedMinimumSurfaceDistanceMeters,
     delta=round(candidate-original),
     crossingDelta=b.originalTriangleCrossings[k]-a.originalTriangleCrossings[k];
    distanceChange[k]=Object.freeze({
     originalUnsignedMeters:original,candidateUnsignedMeters:candidate,
     measuredDeltaMeters:delta,
     originalSurfaceNear2mm:original<=.002,
     candidateSurfaceNear2mm:candidate<=.002,
     researchGapImprovedAtLeastHalfMm:delta>=.0005,
     researchGapWorsenedAtLeastQuarterMm:delta<=-.00025,
     strictTriangleCrossingsOriginal:a.originalTriangleCrossings[k],
     strictTriangleCrossingsCandidate:b.originalTriangleCrossings[k],
     strictlyMoreCrossingWitnesses:crossingDelta>0
    });
    if(delta>=.0005)improved++;
    if(delta<=-.00025)worsened++;
    if(candidate<=.002)stillNear++;
    newContactWorsening||=crossingDelta>0;
    geometryWorsened||=delta<=-.00025;
    if(!trialShoulder.trialApplied)
     check(Math.abs(delta)<=.00002&&crossingDelta===0,
      'refused-original-research-trial-must-restore-all-original-geometry');
   }
   measurements.push(Object.freeze({pose:POSES[i],
    unsignedSeparationChanges:Object.freeze(distanceChange)}));
  }
  return Object.freeze({
   schema:'P89-source-shoulder-unsigned-gap-AB/v1',
   status:'ACTUAL_ORIGINAL_PHOTO_SHOULDER_AB_MEASURED_NOT_CLEARED',
   avatar,originalShirtSHA256:SHIRT,originalDenimSHA256:DENIM,
   sourceStaticPoseCount:3,sourcePairRelationshipCount:3,
   existingP84ResearchYokeTrialApplied:trialShoulder.trialApplied,
   researchYokeStatus:trialShoulder.status,
   measuredSourceGapChanges:measurements,
   changedGapImprovedAtLeastHalfMmCount:improved,
   changedGapWorsenedAtLeastQuarterMmCount:worsened,
   candidateStillNear2mmPairPoseCount:stillNear,
   someStaticCrossingCountWorsened:newContactWorsening,
   someUnsignedSurfaceGapWorsened:geometryWorsened,
   candidateResearchFitDoesNotProveOutsideBody:true,
   unphotographedRearNotReconstructed:true,
   originalSourcePhotosPreserved:true,
   humanSourceFidelityApproved:false,sourceSignedClearanceCertified:false,
   continuousSweptMotionCertified:false,
   sourcePhoto2DFallbackRequired:true,consumer3DAuthorized:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  return deny(String(e?.message??'unknown').replace(/[^a-z0-9-]/gi,'').slice(0,100));
 }
}
