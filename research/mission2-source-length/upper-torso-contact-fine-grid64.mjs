/**
 * Mission 2 C64 research-only 2.5/3/4mm LOCAL correction after the proven
 * P2-C63 2mm/25cm field. These are extra millimeters atop the C62 2mm
 * body-trial baseline, not millimeters from the original whole torso.
 * No source photo, owner wardrobe or THREE mesh is modified.
 */
export const LOCAL_FINE_TRIALS64=Object.freeze([
 Object.freeze({boostMeters:.0025,radiusMeters:.25}),
 Object.freeze({boostMeters:.003,radiusMeters:.25}),
 Object.freeze({boostMeters:.004,radiusMeters:.25})
]);
const deny=s=>{throw Error('M2 C64 photographed source fine local grid evidence '+s);};
export function summarizeOriginalClothFineGrid64(poseReports){
 if(!Array.isArray(poseReports)||poseReports.length!==3)
  deny('neutral plus two actually skinned 163-bone source poses required');
 const rows=poseReports.map((x,i)=>{
  if(x?.schema!=='M2-C63-source-contact-local-feather-fit-diagnostic'||
     x?.localCandidateEvaluations!==3||
     !Number.isSafeInteger(x.originalStrictBodyCrossingPairWitnessesAfter2mm)||
     x.originalStrictBodyCrossingPairWitnessesAfter2mm<=0||
     !Number.isSafeInteger(x.originalSourceClothFacesWithBodyCrossingAfter2mm)||
     x.originalSourceClothFacesWithBodyCrossingAfter2mm<1||
     !Array.isArray(x.perLocalCandidate)||x.perLocalCandidate.length!==3||
     x.candidateAlreadyRenderedInApp!==false||x.releaseAuthorized!==false)
   deny('actual original source face contact baseline, three profiles and HOLD required');
  return {
   poseIndex:i,
   originalStrictCrossingWitnessesAfter2mm:
    x.originalStrictBodyCrossingPairWitnessesAfter2mm,
   originalDistinctSourceContactFaceReferences:
    x.originalSourceClothFacesWithBodyCrossingAfter2mm,
   candidates:x.perLocalCandidate.map((c,j)=>{
    const wanted=LOCAL_FINE_TRIALS64[j];
    if(c.boostMeters!==wanted.boostMeters||
       c.radiusMeters!==wanted.radiusMeters||
       c.noGarmentSourceOrOwnerPhotoMutated!==true||
       c.noSourceTriangleIDsOrXYZExported!==true||
       c.releaseAuthorized!==false||
       !Number.isFinite(c.largestSourceFaceEdgeRelativeStrain)||
       !Number.isFinite(c.largestSourceFaceAreaRelativeChange)||
       typeof c.originalPhotoSurfaceStrainGuardPass!=='boolean'||
       typeof c.actualOriginalBodyContactEvaluated!=='boolean'||
       c.originalPhotoSurfaceStrainGuardPass!==c.actualOriginalBodyContactEvaluated)
     deny('true source geometry/face-witness candidate metadata missing or forged');
    if(c.actualOriginalBodyContactEvaluated&&
      (c.fullOriginalBodyAndSelfContactAuditCompleted!==true||
       !Number.isSafeInteger(c.sourceBodyStrictCrossingsAfterLocalTrial)||
       c.sourceBodyStrictCrossingsAfterLocalTrial<0||
       !Number.isSafeInteger(c.sourceFabricSelfStrictCrossingsAfterLocalTrial)||
       c.sourceFabricSelfStrictCrossingsAfterLocalTrial<0))
     deny('original 3D body and original cloth self strict contact incomplete');
    return {
     extraOutwardMeters:wanted.boostMeters,
     featherRadiusMeters:wanted.radiusMeters,
     originalSourceShapeGuardPassed:c.originalPhotoSurfaceStrainGuardPass,
     completeSourceBodySelfContactAudited:
      c.actualOriginalBodyContactEvaluated,
     originalStrictBodyWitnessesRemaining:
      c.actualOriginalBodyContactEvaluated?
       c.sourceBodyStrictCrossingsAfterLocalTrial:null,
     originalStrictClothSelfWitnesses:
      c.actualOriginalBodyContactEvaluated?
       c.sourceFabricSelfStrictCrossingsAfterLocalTrial:null,
     worstOriginalSourceEdgeStrain:c.largestSourceFaceEdgeRelativeStrain,
     worstSourceAreaDrift:c.largestSourceFaceAreaRelativeChange,
     sourceTrianglesOver5PercentStrain:c.facesAbove5PercentStrain,
     sourceTrianglesOver10PercentAreaDrift:c.facesAbove10PercentAreaChange,
     originalSourceNormalsFlipped:c.flippedSourceFaceCount,
     originalSourceFacesCollapsed:c.collapsedSourceFaceCount
    };
   })
  };
 });
 const common=LOCAL_FINE_TRIALS64.filter((p,k)=>
  rows.every(row=>{
   const c=row.candidates[k];
   return c.originalSourceShapeGuardPassed&&
    c.completeSourceBodySelfContactAudited&&
    c.originalStrictBodyWitnessesRemaining===0&&
    c.originalStrictClothSelfWitnesses===0;
  }));
 return Object.freeze({
  schema:'M2-C64-original-public-photograph-local-contact-fine-grid',
  originalSourceNeutralPlusArticulatedPoseCount:3,
  originalSourceStrictContactFaceIdentifiersNeverExported:true,
  sampledWorldOnlyNotActualSkinnedDressEdit:true,
  originalPhotographicTextureSkinUVRestUnchanged:true,
  perSourcePose:rows,
  candidateProfilesClearingAllSampledStrictBodyAndClothContactsWithShapeGuard:
   common.map(p=>({extraOutwardMeters:p.boostMeters,radiusMeters:p.radiusMeters})),
  anySampledPoseQualifiedLocalFit:common.length>0,
  authenticOwnerSourceReconstructionCertified:false,
  anyRealPhotographic3DPreviewRendered:false,
  continuousPoseClothCollisionSafeCertified:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
