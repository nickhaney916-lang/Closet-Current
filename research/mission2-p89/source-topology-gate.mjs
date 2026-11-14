/** P89: classify ORIGINAL-source geometric-zero self pairs; do NOT waive. */
import {validateActualSkinnedPhotoPoseContact88} from '../mission2-p88/sample-contact-gate.mjs';
const types54=Object.freeze([
 'sourceCoincidentFaceCandidates','sourceCoincidentEdgeCandidates',
 'sourceCoincidentSinglePointCandidates',
 'sourceCoincidentButUnsafeSkinRestOrPose',
 'sourceIndependentZeroDistancePairs'
]);
const types55=Object.freeze([
 'sourceTwoFaceOppositeWindingCandidates',
 'sourceTwoFaceSameWindingCandidates',
 'sourceThreePlusIncidentFaceNonmanifoldCandidates',
 'sourceUnsafeOrAmbiguousCoordinateGroupCandidates',
 'sourceEdgeUnpairedOrUnresolvedCandidates'
]);
const count=x=>Number.isSafeInteger(x)&&x>=0;
export function verifyActualPhotoSourceZeroTopology89(rows){
 const base=validateActualSkinnedPhotoPoseContact88(rows);
 const issues=[...base.issues];
 let zeroPairs=0,unsafeOrIndependent=0,edgePairs=0;
 for(let i=0;i<6;i++){
  const c=rows?.[i]?.contact,t=c?.sampledCandidateSelfSourceTopology54,
   e=c?.sampledCandidateSelfSourceEdgeWinding55;
  if(!t||!e){issues.push('missing original source topology and edge proof '+i);continue;}
  if(t.schema!=='M2-original-source-zero-contact-topology-C54'||
   t.classificationComplete!==true||
   !count(t.zeroDistancePairsClassified)||
   t.zeroDistancePairsClassified!==c.sampledCandidateSelfGeometricZeroOrOverlapUnresolved||
   !types54.every(k=>count(t[k]))||
   types54.reduce((n,k)=>n+t[k],0)!==t.zeroDistancePairsClassified||
   t.allSourceCorrespondencesCheckedAgainst163BonePose!==true||
   t.sourceCoincidenceNotAHumanVerifiedSewingSeam!==true||
   t.sourceCoordinateDuplicateNotPermissionToWeld!==true||
   t.releaseAuthorized!==false)
   issues.push('source-zero correspondence incomplete or mismatched '+i);
  if(e.schema!=='M2-original-photograph-source-edge-winding-C55'||
   e.sourceEdgeAuditComplete!==true||
   !count(e.sourceEdgePairsClassified)||
   e.sourceEdgePairsClassified!==t.sourceCoincidentEdgeCandidates||
   !types55.every(k=>count(e[k]))||
   types55.reduce((n,k)=>n+e[k],0)!==e.sourceEdgePairsClassified||
   e.sourceEdgeWindingOnlyCandidateNotSewnSeam!==true||
   e.oppositeWindingCannotAuthorizeWelding!==true||
   e.sourceManifoldEstimateNotPhysicalFabricCertificate!==true||
   e.photoUVSkinAndSourceMeshUnchanged!==true||
   e.releaseAuthorized!==false)
   issues.push('original source edge incidence/winding incomplete or unsafe '+i);
  if(c.sourceCoincidentOrTwoFaceEdgeCannotProveSewnSeam!==true||
   c.secondaryGarmentSurfacesAndRimsNotAudited!==true)
   issues.push('false sewn seam or full-garment certification '+i);
  if(count(t.zeroDistancePairsClassified))zeroPairs+=t.zeroDistancePairsClassified;
  if(types54.every(k=>count(t[k])))unsafeOrIndependent+=
   t.sourceCoincidentButUnsafeSkinRestOrPose+t.sourceIndependentZeroDistancePairs;
  if(count(e.sourceEdgePairsClassified))edgePairs+=e.sourceEdgePairsClassified;
 }
 return Object.freeze({
  schema:'M2-P89-authenticated-original-photo-self-zero-topology-six-pose',
  status:issues.length?'BLOCKED':'SOURCE_ZERO_TOPOLOGY_CLASSIFIED_NOT_CERTIFIED',
  completeOriginalSkinnedPoseProofs:rows?.length??0,
  classifiedGeometricZeroPairsAcrossSixPoses:zeroPairs,
  sourceIndependentOrSkinUnsafePairWitnesses:unsafeOrIndependent,
  originalEdgeIncidencePairsAudited:edgePairs,
  issues:[...new Set(issues)],
  originalPhotoAnd163BoneRigNotAltered:true,
  thisDoesNotValidateTrueSewnSeamsOrFabricDrape:true,
  continuousMotionCollisionUnverified:true,
  allSecondaryGarmentComponentsAndOpenRimsUnverified:true,
  independentVisualApproval:false,physicalPhones:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
