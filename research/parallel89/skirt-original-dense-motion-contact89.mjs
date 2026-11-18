/**
 * P89 original Commons-0043 photographed skirt on original 163bone CC0 avatars.
 * Independent source-indexed original/registration triangle-BVH pairs at
 * 17 interpolated static poses, every 1/16 between SOURCE and RELAXED.
 *
 * These are STATIC witnesses only: no continuous-time CCD, closed body,
 * signed inside/outside, measured garment scale, real source photograph back
 * or owner visual signoff. Never authorize 3D from a zero crossing count.
 * No source IDs, sampled body coordinates or private account content returned.
 */
import {snapshotOriginalSkirtBvhContact89} from './source-contact-snapshot89.mjs';
export const DENSE_ORIGINAL_POSE_FRACTIONS89=
 Object.freeze(Array.from({length:17},(_,i)=>i/16));
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const refusal=reason=>Object.freeze({
 schema:'P89-original-rig-dense-finite-pose-BVH-gate/v1',
 status:'DENSE_ORIGINAL_SOURCE_BVH_EVIDENCE_UNVERIFIABLE',
 reason,originalPhoto2DFallbackRequired:true,
 selectedRegistrationAdmittedToConsumer:false,
 continuousSweptClothContactCertified:false,ownerApproved:false,
 consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const finite=Number.isFinite;
export function auditDenseOriginalPhotoSkirtTransition89({
 avatar,sourcePhotoSHA256,originalRigSHA256,sourceBodyTriangleCount,
 selectedRegistrationName,selectedRegistrationMeters,
 baselineFivePoseCounts,trialFivePoseCounts,
 actualRigBoneCount,photoBackObserved=false,physicalGarmentScaleKnown=false,
 sampleAtFraction,restore
}={}){
 if(!['female','male'].includes(avatar)||sourcePhotoSHA256!==PHOTO||
  originalRigSHA256!==RIG[avatar]||
  !Number.isSafeInteger(sourceBodyTriangleCount)||
  sourceBodyTriangleCount<1000||sourceBodyTriangleCount>500000||
  actualRigBoneCount!==163||
  !/^front-(15|30|35|40|45|50|55|60)mm$/.test(selectedRegistrationName)||
  !finite(selectedRegistrationMeters)||selectedRegistrationMeters<=0||
  selectedRegistrationMeters>.06001||
  Math.abs(Number(selectedRegistrationName.slice(6,-2))/1000-
    selectedRegistrationMeters)>1e-9||
  !Array.isArray(baselineFivePoseCounts)||baselineFivePoseCounts.length!==5||
  !Array.isArray(trialFivePoseCounts)||trialFivePoseCounts.length!==5||
  [...baselineFivePoseCounts,...trialFivePoseCounts].some(x=>
   !Number.isSafeInteger(x)||x<0)||
  typeof sampleAtFraction!=='function'||typeof restore!=='function'||
  photoBackObserved!==false||physicalGarmentScaleKnown!==false)
  return refusal('original-photo-163bone-selected-registration-and-unobserved-rear-required');
 let rows=[],reason=null,restored=false;
 try{
  for(let i=0;i<DENSE_ORIGINAL_POSE_FRACTIONS89.length;i++){
   const fraction=DENSE_ORIGINAL_POSE_FRACTIONS89[i];
   // Snapshot each original set before the user-supplied contact callback
   // can recycle/mutate its Set on the registration sample.
   const rawBefore=sampleAtFraction(fraction,'original');
   const before=snapshotOriginalSkirtBvhContact89(rawBefore,
    {bodyFaceCount:sourceBodyTriangleCount});
   if(!before)throw Error('original-source-contact-missing-or-spoofed');
   const rawAfter=sampleAtFraction(fraction,'selected');
   const after=snapshotOriginalSkirtBvhContact89(rawAfter,
    {bodyFaceCount:sourceBodyTriangleCount});
   if(!after)throw Error('selected-source-contact-missing-or-spoofed');
   if(i%4===0){
    const anchor=i/4;
    if(before.count!==baselineFivePoseCounts[anchor]||
     after.count!==trialFivePoseCounts[anchor])
     throw Error('dense-interpolation-does-not-reproduce-five-real-poses');
   }
   let introduced=0,resolved=0;
   for(const id of after.pairs)if(!before.pairs.has(id))introduced++;
   for(const id of before.pairs)if(!after.pairs.has(id))resolved++;
   if(before.count+introduced-resolved!==after.count)
    throw Error('original-source-face-contact-conservation-failed');
   rows.push(Object.freeze({
    fraction,originalStrictFacePairs:before.count,
    registeredStrictFacePairs:after.count,
    newlyIntroducedOriginalSourceFacePairs:introduced,
    resolvedOriginalSourceFacePairs:resolved,
    originalPlaneDepthMeters:before.maxDepth,
    registeredPlaneDepthMeters:after.maxDepth,
    registeredDepthNotWorse:after.maxDepth<=before.maxDepth+.0005,
    originalSourceFaceIdsAndBVHIndirectIndicesVerified:true
   }));
  }
 }catch(e){
  const known=new Set([
   'original-source-contact-missing-or-spoofed',
   'selected-source-contact-missing-or-spoofed',
   'dense-interpolation-does-not-reproduce-five-real-poses',
   'original-source-face-contact-conservation-failed'
  ]);
  reason=known.has(e.message)?e.message:'original-163bone-interpolation-or-source-BVH-unverifiable';
 }finally{
  try{restore();restored=true;}catch{reason='original-source-pose-or-geometry-not-restored';}
 }
 if(reason||!restored||rows.length!==17)return refusal(reason||'dense-source-evidence-incomplete');
 const sum=(key)=>rows.reduce((n,r)=>n+r[key],0);
 const introduced=sum('newlyIntroducedOriginalSourceFacePairs');
 const unchangedOrBetter=rows.every(r=>
  r.newlyIntroducedOriginalSourceFacePairs===0&&r.registeredDepthNotWorse);
 const allZero=rows.every(r=>r.registeredStrictFacePairs===0);
 return Object.freeze({
  schema:'P89-original-rig-dense-finite-pose-BVH-gate/v1',
  status:allZero&&unchangedOrBetter?
   'NO_TRANSVERSE_CROSSINGS_AT_SEVENTEEN_STATIC_POSES_NOT_SWEPT_FIT':
   'DENSE_SOURCE_COLLISIONS_OR_NEW_FACE_PAIRS_WITNESSED_BLOCKED',
  avatar,sourceId:'commons-0043',sourcePhotoSHA256,originalRigSHA256,
  originalNativeSkinnedAnatomicalBoneCount:163,
  originalBodySourceIndexedTriangleCount:sourceBodyTriangleCount,
  selectedRegistrationName,selectedRegistrationMeters,
  equalSixteenthOriginalSourceToRelaxedPoseFractions:true,
  testedStaticPoseFractions:DENSE_ORIGINAL_POSE_FRACTIONS89,
  previouslyTestedQuarterAnchorFractionsReproducedExactly:true,
  newIntermediatePoseSamplesPerAvatar:12,
  originalAndRegisteredSeparateAuthenticIndexedBVHSamples:34,
  perPoseSampleCounts:Object.freeze(rows),
  sumOriginalStrictFacePairs:sum('originalStrictFacePairs'),
  sumRegisteredStrictFacePairs:sum('registeredStrictFacePairs'),
  sumNewlyIntroducedOriginalSourceFacePairs:introduced,
  selectedGeometryNeverAutoCommitted:true,
  reusedMutableSamplePairSetsSnapshotted:true,
  sourcesAndOriginalRigRestored:true,
  sixteenUnverifiedBetweenSampleIntervalsRemain:true,
  staticFractionalSamplingCannotProveSweptContact:true,
  noOriginalAnatomicalSignedInsideOutsideOrClearanceCertified:true,
  originalGarmentBackUnphotographed:true,physicalGarmentScaleUnmeasured:true,
  photoFrontRegistrationNotHumanReviewed:true,
  originalPhoto2DFallbackRequired:true,
  selectedRegistrationAdmittedToConsumer:false,
  continuousSweptClothContactCertified:false,
  physicalPhoneTested:false,ownerApproved:false,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
