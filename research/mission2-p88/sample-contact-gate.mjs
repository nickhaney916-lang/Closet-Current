/** P88 sampled genuine-source contact receipt gate: never a release permit. */
const SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const poses=['source','blend-50','relaxed'],figures=['female','male'];
const validInt=x=>Number.isSafeInteger(x)&&x>=0;
const validNumber=x=>Number.isFinite(x)&&x>=0;
export function validateActualSkinnedPhotoPoseContact88(rows){
 const issues=[],check=(v,msg)=>{if(!v)issues.push(msg);};
 check(Array.isArray(rows)&&rows.length===6,'exact six genuine source/pose receipts required');
 const expected=figures.flatMap(figure=>poses.map(pose=>({figure,pose})));
 let originalTotal=0,fittedTotal=0,selfTotal=0;
 for(let i=0;i<6;i++){
  const r=Array.isArray(rows)?rows[i]:null,c=r?.contact;
  check(r?.figure===expected[i].figure&&r?.pose===expected[i].pose,'authentic gender/pose order or coverage mismatch '+i);
  check(c?.schema==='M2-P88-original-photo-real-skinned-source-contact-sampled-v1','missing genuine source audit '+i);
  check(c?.originalSourceId==='commons-0053'&&c?.sourceDressOriginalSHA256===SHA,'photo source identity mismatch '+i);
  check(c?.genuineSource163BoneSkeleton===true,'actual anatomical skin missing '+i);
  check(validInt(c?.originalSourceTriangles)&&c.originalSourceTriangles>=3000&&
    validInt(c?.actualAnatomicalBodyFaces)&&c.actualAnatomicalBodyFaces>=100000,'original source geometric face counts absent '+i);
  const counters=['sampledBaselineBodyStrictPairWitnesses','sampledCandidateBodyStrictPairWitnesses',
  'sampledCandidateSelfStrictPairWitnesses','sampledCandidateBodyNearOrZeroUnresolved',
  'sampledCandidateSelfGeometricZeroOrOverlapUnresolved',
  'candidateSourceTriangleFacesAbove5PercentStrain','candidateSourceTriangleFacesAbove10PercentAreaDrift',
  'candidateSourceTriangleNormalsFlipped','candidateSourceTriangleFacesCollapsed'];
  check(counters.every(k=>validInt(c?.[k])),'invalid source contact/strain counters '+i);
  check(validNumber(c?.maximumSampledPhotoSourceEdgeStrain)&&
    validNumber(c?.maximumSampledPhotoSourceAreaDrift),'invalid original-face strain '+i);
  check(c?.completedOriginalBodyAudit===true&&c?.completedCandidateBodyAudit===true&&
    c?.completedCandidateSelfAudit===true&&c?.completedCandidateSelfDistanceAudit===true,
  'incomplete original source contact comparison '+i);
  check(c?.sourcePhotoRestUVSkinAndGeometryUnchanged===true&&
    c?.noOriginalSourceVerticesOrFaceIDsOrPhotoExported===true,
  'original photographed source mutability/privacy '+i);
  check(c?.geometricZeroOrNearNotProvenCollisionFree===true&&
    c?.continuousMotionCollisionCertification===false&&
    c?.independentPhotographicRealismApproved===false&&
    c?.consumer3DAdmitted===false&&c?.releaseAuthorized===false&&c?.familyAlpha==='HOLD',
  'false implied release, continuous collision or visual acceptance '+i);
  check(c?.sampledStrictBodyAndSelfNoncrossingWithShapeGuard===true&&
    c?.sampledStatus==='SAMPLED_STRICT_CROSSINGS_NOT_OBSERVED'&&
    c?.candidateSourceShapeGuardPassed===true&&
    c?.sampledCandidateBodyStrictPairWitnesses===0&&
    c?.sampledCandidateSelfStrictPairWitnesses===0&&
    c?.candidateSourceTriangleFacesAbove5PercentStrain===0&&
    c?.candidateSourceTriangleFacesAbove10PercentAreaDrift===0&&
    c?.candidateSourceTriangleNormalsFlipped===0&&
    c?.candidateSourceTriangleFacesCollapsed===0,
  'candidate has witnessed body/self crossing or photo surface distortion '+i);
  if(validInt(c?.sampledBaselineBodyStrictPairWitnesses)) originalTotal+=c.sampledBaselineBodyStrictPairWitnesses;
  if(validInt(c?.sampledCandidateBodyStrictPairWitnesses)) fittedTotal+=c.sampledCandidateBodyStrictPairWitnesses;
  if(validInt(c?.sampledCandidateSelfStrictPairWitnesses)) selfTotal+=c.sampledCandidateSelfStrictPairWitnesses;
 }
 return Object.freeze({
  schema:'M2-P88-six-real-source-posed-skinned-photo-strict-contact-gate',
  status:issues.length?'BLOCKED':'SAMPLED_STRICT_NONCROSSING_OBSERVED_NOT_RELEASE',
  sourceSHA256:SHA,sourcePoseChecks:rows?.length??0,
  actualOriginalBodyStrictWitnessesAcrossSixPoses:originalTotal,
  actualFittedBodyStrictWitnessesAcrossSixPoses:fittedTotal,
  actualFittedSelfStrictWitnessesAcrossSixPoses:selfTotal,
  issues:[...new Set(issues)],
  noRawSourcePhotoOrWorldPositions:true,
  untestedNearAndContinuousMotion:true,
  independentHumanReview:false,physicalPhone:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
