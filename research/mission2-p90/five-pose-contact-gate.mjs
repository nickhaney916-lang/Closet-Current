/** P90 measured source/blend25/blend50/blend75/relaxed (ten real pose samples).
 * Uses P89 verified exact six-pose core unchanged, and independently
 * validates both new 25%/75% intermediate samples per actual 163-bone figure.
 * Neither pose interpolation nor added samples certify swept collisions.
 */
import {verifyActualPhotoSourceZeroTopology89} from '../mission2-p89/source-topology-gate.mjs';

const SOURCE_SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
export const POSES90=Object.freeze(['source','blend-25','blend-50','blend-75','relaxed']);
const FIGURES=Object.freeze(['female','male']);
const C54=Object.freeze(['sourceCoincidentFaceCandidates','sourceCoincidentEdgeCandidates',
 'sourceCoincidentSinglePointCandidates','sourceCoincidentButUnsafeSkinRestOrPose',
 'sourceIndependentZeroDistancePairs']);
const C55=Object.freeze(['sourceTwoFaceOppositeWindingCandidates',
 'sourceTwoFaceSameWindingCandidates','sourceThreePlusIncidentFaceNonmanifoldCandidates',
 'sourceUnsafeOrAmbiguousCoordinateGroupCandidates','sourceEdgeUnpairedOrUnresolvedCandidates']);
const uint=n=>Number.isSafeInteger(n)&&n>=0;
const fin=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
const sum=(obj,keys)=>keys.reduce((a,k)=>a+obj[k],0);
function checkIntermediate(row,problems,index){
 const c=row?.contact,t=c?.sampledCandidateSelfSourceTopology54,
  e=c?.sampledCandidateSelfSourceEdgeWinding55;
 const require=(v,msg)=>{if(!v)problems.push(index+': '+msg);};
 require(c?.schema==='M2-P88-original-photo-real-skinned-source-contact-sampled-v1',
  'actual fitted original-source contact receipt missing');
 require(c?.originalSourceId==='commons-0053'&&c?.sourceDressOriginalSHA256===SOURCE_SHA,
  'exact licensed original JPEG identity incorrect');
 require(c?.genuineSource163BoneSkeleton===true&&
  uint(c?.originalSourceTriangles)&&c.originalSourceTriangles>=3000&&
  uint(c?.actualAnatomicalBodyFaces)&&c.actualAnatomicalBodyFaces>=100000,
  'genuine anatomical source triangles/bones missing');
 for(const key of ['sampledBaselineBodyStrictPairWitnesses','sampledCandidateBodyStrictPairWitnesses',
  'sampledCandidateSelfStrictPairWitnesses','sampledCandidateBodyNearOrZeroUnresolved',
  'sampledCandidateSelfGeometricZeroOrOverlapUnresolved',
  'candidateSourceTriangleFacesAbove5PercentStrain','candidateSourceTriangleFacesAbove10PercentAreaDrift',
  'candidateSourceTriangleNormalsFlipped','candidateSourceTriangleFacesCollapsed'])
  require(uint(c?.[key]),'invalid measured source-contact/strain counter '+key);
 require(fin(c?.maximumSampledPhotoSourceEdgeStrain)&&
  fin(c?.maximumSampledPhotoSourceAreaDrift),'nonfinite source triangle strain');
 require(c?.completedOriginalBodyAudit===true&&
  c?.completedCandidateBodyAudit===true&&
  c?.completedCandidateSelfAudit===true&&
  c?.completedCandidateSelfDistanceAudit===true,
  'incomplete independent genuine body/self original source audit');
 require(c?.sampledCandidateBodyStrictPairWitnesses===0&&
  c?.sampledCandidateSelfStrictPairWitnesses===0&&
  c?.candidateSourceShapeGuardPassed===true&&
  c?.candidateSourceTriangleFacesAbove5PercentStrain===0&&
  c?.candidateSourceTriangleFacesAbove10PercentAreaDrift===0&&
  c?.candidateSourceTriangleNormalsFlipped===0&&
  c?.candidateSourceTriangleFacesCollapsed===0&&
  c?.sampledStrictBodyAndSelfNoncrossingWithShapeGuard===true&&
  c?.sampledStatus==='SAMPLED_STRICT_CROSSINGS_NOT_OBSERVED',
  'original-photo geometric crossing or source-face strain failure');
 require(c?.sourcePhotoRestUVSkinAndGeometryUnchanged===true&&
  c?.noOriginalSourceVerticesOrFaceIDsOrPhotoExported===true&&
  c?.sourceCoincidentOrTwoFaceEdgeCannotProveSewnSeam===true&&
  c?.secondaryGarmentSurfacesAndRimsNotAudited===true&&
  c?.geometricZeroOrNearNotProvenCollisionFree===true&&
  c?.continuousMotionCollisionCertification===false&&
  c?.independentPhotographicRealismApproved===false&&
  c?.consumer3DAdmitted===false&&c?.releaseAuthorized===false&&c?.familyAlpha==='HOLD',
  'altered licensed source or fictional release/realism/swept approval');
 require(t?.schema==='M2-original-source-zero-contact-topology-C54'&&
  t?.classificationComplete===true&&
  C54.every(k=>uint(t?.[k]))&&uint(t?.zeroDistancePairsClassified)&&
  t.zeroDistancePairsClassified===c.sampledCandidateSelfGeometricZeroOrOverlapUnresolved&&
  sum(t,C54)===t.zeroDistancePairsClassified&&
  t?.allSourceCorrespondencesCheckedAgainst163BonePose===true&&
  t?.sourceCoincidenceNotAHumanVerifiedSewingSeam===true&&
  t?.sourceCoordinateDuplicateNotPermissionToWeld===true&&
  t?.releaseAuthorized===false,
  'incomplete authenticated photographed source zero-contact correspondence');
 require(e?.schema==='M2-original-photograph-source-edge-winding-C55'&&
  e?.sourceEdgeAuditComplete===true&&C55.every(k=>uint(e?.[k]))&&
  uint(e?.sourceEdgePairsClassified)&&
  e.sourceEdgePairsClassified===t?.sourceCoincidentEdgeCandidates&&
  sum(e,C55)===e.sourceEdgePairsClassified&&
  e?.sourceEdgeWindingOnlyCandidateNotSewnSeam===true&&
  e?.oppositeWindingCannotAuthorizeWelding===true&&
  e?.sourceManifoldEstimateNotPhysicalFabricCertificate===true&&
  e?.photoUVSkinAndSourceMeshUnchanged===true&&e?.releaseAuthorized===false,
  'source edge topology incomplete or claimed sewn seam');
}
export function verifyActualFivePosePhotoContact90(rows){
 const issues=[];
 if(!Array.isArray(rows)||rows.length!==10)
  issues.push('exact ten genuine source samples required');
 const expected=FIGURES.flatMap(figure=>POSES90.map(pose=>({figure,pose})));
 for(let i=0;i<10;i++)
  if(rows?.[i]?.figure!==expected[i].figure||rows?.[i]?.pose!==expected[i].pose)
   issues.push('figure/pose order/source sample missing or duplicated at '+i);
 const core=[0,2,4,5,7,9].map(i=>rows?.[i]);
 const parent=verifyActualPhotoSourceZeroTopology89(core);
 if(parent.status!=='SOURCE_ZERO_TOPOLOGY_CLASSIFIED_NOT_CERTIFIED')
  issues.push(...parent.issues.map(x=>'verified P89 core: '+x));
 for(const index of [1,3,6,8])checkIntermediate(rows?.[index],issues,index);
 let zeros=0,unsafe=0,edges=0,bodyCross=0,selfCross=0,
  originalBaseline=0,changed=0;
 for(const row of Array.isArray(rows)?rows:[]){
  const c=row?.contact,t=c?.sampledCandidateSelfSourceTopology54,
   e=c?.sampledCandidateSelfSourceEdgeWinding55;
  if(uint(t?.zeroDistancePairsClassified))zeros+=t.zeroDistancePairsClassified;
  if(uint(t?.sourceIndependentZeroDistancePairs)&&
     uint(t?.sourceCoincidentButUnsafeSkinRestOrPose))
   unsafe+=t.sourceIndependentZeroDistancePairs+t.sourceCoincidentButUnsafeSkinRestOrPose;
  if(uint(e?.sourceEdgePairsClassified))edges+=e.sourceEdgePairsClassified;
  if(uint(c?.sampledCandidateBodyStrictPairWitnesses))bodyCross+=c.sampledCandidateBodyStrictPairWitnesses;
  if(uint(c?.sampledCandidateSelfStrictPairWitnesses))selfCross+=c.sampledCandidateSelfStrictPairWitnesses;
  if(uint(c?.sampledBaselineBodyStrictPairWitnesses))originalBaseline+=c.sampledBaselineBodyStrictPairWitnesses;
  if(row?.pose==='blend-25'||row?.pose==='blend-75')changed++;
 }
 if(unsafe!==0)issues.push('unsafe/independent original source geometric-zero correspondence observed');
 return Object.freeze({
  schema:'M2-P90-genuine-original-photograph-five-sampled-skinned-poses',
  status:issues.length?'BLOCKED':'TEN_SOURCE_POSES_CHECKED_NOT_CONTINUOUS_COLLISION_CERTIFICATE',
  testedAvatarPoseSamples:rows?.length??0,additionalRealInterpolatedPoseSamples:changed,
  baselineOriginalBodyStrictPairWitnesses:originalBaseline,
  fittedBodyStrictPairWitnesses:bodyCross,fittedSelfStrictPairWitnesses:selfCross,
  countedOriginalSourceZeroContactPairs:zeros,
  countedOriginalSourceEdgePairCandidates:edges,
  skinMismatchOrSourceIndependentContactPairs:unsafe,
  issues:[...new Set(issues)],
  realContinuousSweptClothContactUnmeasured:true,
  photoHiddenSideAndDrapeNotRecovered:true,
  noHumanReviewOrPhysicalPhoneAcceptance:true,
  signedOwnerConsumerAdmission:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
