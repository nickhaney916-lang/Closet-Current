/** P90 authenticated original photographed 163-bone quarter-step poses.
 * Four NEW actual fitted measurements supplement, not replace, P88/P89 six
 * audited source/blend-50/relaxed observations. No swept-motion certificate.
 */
import {validateActualSkinnedPhotoPoseContact88} from '../mission2-p88/sample-contact-gate.mjs';
import {verifyActualPhotoSourceZeroTopology89} from '../mission2-p89/source-topology-gate.mjs';
const SOURCE='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const expected=Object.freeze([
 {figure:'female',pose:'blend-25'}, {figure:'female',pose:'blend-75'},
 {figure:'male',pose:'blend-25'}, {figure:'male',pose:'blend-75'}
]);
const counts54=Object.freeze([
 'sourceCoincidentFaceCandidates','sourceCoincidentEdgeCandidates',
 'sourceCoincidentSinglePointCandidates','sourceCoincidentButUnsafeSkinRestOrPose',
 'sourceIndependentZeroDistancePairs'
]);
const counts55=Object.freeze([
 'sourceTwoFaceOppositeWindingCandidates','sourceTwoFaceSameWindingCandidates',
 'sourceThreePlusIncidentFaceNonmanifoldCandidates',
 'sourceUnsafeOrAmbiguousCoordinateGroupCandidates',
 'sourceEdgeUnpairedOrUnresolvedCandidates'
]);
const int=x=>Number.isSafeInteger(x)&&x>=0;
const finite=x=>Number.isFinite(x)&&x>=0;
const sum=(v,keys)=>keys.reduce((a,k)=>a+v[k],0);
export function verifySourcePhotoQuarterSteps90(originalSix,quarterRows){
 const base=validateActualSkinnedPhotoPoseContact88(originalSix);
 const topology=verifyActualPhotoSourceZeroTopology89(originalSix);
 const issues=[...base.issues,...topology.issues];
 const check=(ok,reason)=>{if(!ok)issues.push(reason);};
 check(base.status==='SAMPLED_STRICT_NONCROSSING_OBSERVED_NOT_RELEASE',
  'original six-pose strict source audit not passed');
 check(topology.status==='SOURCE_ZERO_TOPOLOGY_CLASSIFIED_NOT_CERTIFIED',
  'original six-pose C54/C55 source topology not passed');
 check(Array.isArray(quarterRows)&&quarterRows.length===4,
  'exact four extra anatomical quarter-step sample observations required');
 let baseline=0,fitted=0,self=0,near=0,zeros=0;
 for(let i=0;i<4;i++){
  const r=Array.isArray(quarterRows)?quarterRows[i]:null,c=r?.contact;
  const suffix=' quarter step '+i;
  check(r?.figure===expected[i].figure&&r?.pose===expected[i].pose,
   'incorrect real quarter pose or gender order'+suffix);
  check(r?.rigBones===163&&int(r?.fittedVertices)&&r.fittedVertices>0&&
   finite(r?.maxInverseResidualMeters)&&r.maxInverseResidualMeters<=.00005&&
   r?.sourcePhotoOriginalUnchanged===true,
   'missing actual 163-bone source-skinned inverse fit receipt'+suffix);
  check(c?.schema==='M2-P88-original-photo-real-skinned-source-contact-sampled-v1'&&
   c?.originalSourceId==='commons-0053'&&c?.sourceDressOriginalSHA256===SOURCE&&
   c?.genuineSource163BoneSkeleton===true&&
   int(c?.originalSourceTriangles)&&c.originalSourceTriangles>=3000&&
   int(c?.actualAnatomicalBodyFaces)&&c.actualAnatomicalBodyFaces>=100000,
   'missing actual licensed photographed geometry'+suffix);
  const counters=[
   'sampledBaselineBodyStrictPairWitnesses','sampledCandidateBodyStrictPairWitnesses',
   'sampledCandidateSelfStrictPairWitnesses','sampledCandidateBodyNearOrZeroUnresolved',
   'sampledCandidateSelfGeometricZeroOrOverlapUnresolved',
   'candidateSourceTriangleFacesAbove5PercentStrain',
   'candidateSourceTriangleFacesAbove10PercentAreaDrift',
   'candidateSourceTriangleNormalsFlipped','candidateSourceTriangleFacesCollapsed'
  ];
  check(counters.every(k=>int(c?.[k]))&&
   finite(c?.maximumSampledPhotoSourceEdgeStrain)&&
   finite(c?.maximumSampledPhotoSourceAreaDrift),
   'missing or nonfinite original cloth distance/strain counters'+suffix);
  check(c?.completedOriginalBodyAudit===true&&
   c?.completedCandidateBodyAudit===true&&
   c?.completedCandidateSelfAudit===true&&
   c?.completedCandidateSelfDistanceAudit===true&&
   c?.sourcePhotoRestUVSkinAndGeometryUnchanged===true&&
   c?.noOriginalSourceVerticesOrFaceIDsOrPhotoExported===true,
   'incomplete body/cloth source or privacy audit'+suffix);
  check(c?.sampledStrictBodyAndSelfNoncrossingWithShapeGuard===true&&
   c?.sampledStatus==='SAMPLED_STRICT_CROSSINGS_NOT_OBSERVED'&&
   c?.candidateSourceShapeGuardPassed===true&&
   c?.sampledCandidateBodyStrictPairWitnesses===0&&
   c?.sampledCandidateSelfStrictPairWitnesses===0&&
   c?.candidateSourceTriangleFacesAbove5PercentStrain===0&&
   c?.candidateSourceTriangleFacesAbove10PercentAreaDrift===0&&
   c?.candidateSourceTriangleNormalsFlipped===0&&
   c?.candidateSourceTriangleFacesCollapsed===0,
   'actual fitted quarter-step crossing or photographed surface strain failure'+suffix);
  check(c?.geometricZeroOrNearNotProvenCollisionFree===true&&
   c?.continuousMotionCollisionCertification===false&&
   c?.independentPhotographicRealismApproved===false&&
   c?.consumer3DAdmitted===false&&c?.releaseAuthorized===false&&
   c?.familyAlpha==='HOLD'&&
   c?.sourceCoincidentOrTwoFaceEdgeCannotProveSewnSeam===true&&
   c?.secondaryGarmentSurfacesAndRimsNotAudited===true,
   'unearned seam/contact/drape/consumer approval'+suffix);
  const t=c?.sampledCandidateSelfSourceTopology54;
  const e=c?.sampledCandidateSelfSourceEdgeWinding55;
  check(t?.schema==='M2-original-source-zero-contact-topology-C54'&&
   t?.classificationComplete===true&&
   int(t?.zeroDistancePairsClassified)&&
   int(c?.sampledCandidateSelfGeometricZeroOrOverlapUnresolved)&&
   t.zeroDistancePairsClassified===c.sampledCandidateSelfGeometricZeroOrOverlapUnresolved&&
   counts54.every(k=>int(t?.[k]))&&
   sum(t,counts54)===t.zeroDistancePairsClassified&&
   t?.allSourceCorrespondencesCheckedAgainst163BonePose===true&&
   t?.sourceCoincidenceNotAHumanVerifiedSewingSeam===true&&
   t?.sourceCoordinateDuplicateNotPermissionToWeld===true&&
   t?.releaseAuthorized===false,
   'incomplete original rest/skin/source zero-distance correspondence'+suffix);
  check(e?.schema==='M2-original-photograph-source-edge-winding-C55'&&
   e?.sourceEdgeAuditComplete===true&&
   int(e?.sourceEdgePairsClassified)&&
   e.sourceEdgePairsClassified===t?.sourceCoincidentEdgeCandidates&&
   counts55.every(k=>int(e?.[k]))&&
   sum(e,counts55)===e.sourceEdgePairsClassified&&
   e?.sourceEdgeWindingOnlyCandidateNotSewnSeam===true&&
   e?.oppositeWindingCannotAuthorizeWelding===true&&
   e?.sourceManifoldEstimateNotPhysicalFabricCertificate===true&&
   e?.photoUVSkinAndSourceMeshUnchanged===true&&e?.releaseAuthorized===false,
   'incomplete authentic source edge-winding/incident-face classification'+suffix);
  if(int(c?.sampledBaselineBodyStrictPairWitnesses))baseline+=c.sampledBaselineBodyStrictPairWitnesses;
  if(int(c?.sampledCandidateBodyStrictPairWitnesses))fitted+=c.sampledCandidateBodyStrictPairWitnesses;
  if(int(c?.sampledCandidateSelfStrictPairWitnesses))self+=c.sampledCandidateSelfStrictPairWitnesses;
  if(int(c?.sampledCandidateBodyNearOrZeroUnresolved))near+=c.sampledCandidateBodyNearOrZeroUnresolved;
  if(int(c?.sampledCandidateSelfGeometricZeroOrOverlapUnresolved))zeros+=c.sampledCandidateSelfGeometricZeroOrOverlapUnresolved;
 }
 return Object.freeze({
  schema:'M2-P90-original-public-photo-ten-real-anatomical-pose-contact-v1',
  status:issues.length?'BLOCKED':'TEN_SAMPLED_AUTHENTIC_SKINNED_CONTACTS_OBSERVED_NOT_RELEASE',
  originalSourcePoseSamples:originalSix?.length??0,
  additionalQuarterStepSamples:quarterRows?.length??0,
  totalAnatomicalPoseSamples:(originalSix?.length??0)+(quarterRows?.length??0),
  originalBodyStrictWitnessesAtQuarterSteps:baseline,
  fittedBodyStrictWitnessesAtQuarterSteps:fitted,
  fittedSelfStrictWitnessesAtQuarterSteps:self,
  unresolvedFittedBodyNearOrZeroAtQuarterSteps:near,
  unresolvedFittedSelfZeroOrOverlapAtQuarterSteps:zeros,
  originalSixPoseContactGate:base.status,
  originalSixPoseTopologyGate:topology.status,
  issues:[...new Set(issues)],
  sampledPoseOnly:true,continuousSweptMotionSafetyCertified:false,
  unknownSecondaryGarmentAndOpenRims:true,sourceCoordinateOverlapNotSewnSeamCertificate:true,
  oneLicensedSourceDressNotAllClothingTypes:true,
  independentHumanPhotographicDrapeApproved:false,physicalPhoneVerified:false,
  owner3DAdmissionAuthorized:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
