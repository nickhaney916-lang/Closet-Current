import test from 'node:test';
import assert from 'node:assert/strict';
import {validateActualSkinnedPhotoPoseContact88} from '../research/mission2-p88/sample-contact-gate.mjs';
import {verifyActualPhotoSourceZeroTopology89} from '../research/mission2-p89/source-topology-gate.mjs';
import {auditPoseLinkedOriginalPhotoSkinnedFit88} from '../research/mission2-source-length/actual-photo-contact-52.mjs';
const SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const good=()=>['female','male'].flatMap(figure=>['source','blend-50','relaxed'].map(pose=>({
 figure,pose,contact:{
  schema:'M2-P88-original-photo-real-skinned-source-contact-sampled-v1',
  originalSourceId:'commons-0053',sourceDressOriginalSHA256:SHA,
  originalSourceTriangles:3836,actualAnatomicalBodyFaces:109064,
  genuineSource163BoneSkeleton:true,
  sampledBaselineBodyStrictPairWitnesses:196,
  sampledCandidateBodyStrictPairWitnesses:0,
  sampledCandidateSelfStrictPairWitnesses:0,
  sampledCandidateBodyNearOrZeroUnresolved:20,
  sampledCandidateSelfGeometricZeroOrOverlapUnresolved:4,
  completedOriginalBodyAudit:true,completedCandidateBodyAudit:true,
  completedCandidateSelfAudit:true,completedCandidateSelfDistanceAudit:true,
  candidateSourceShapeGuardPassed:true,
  candidateSourceTriangleFacesAbove5PercentStrain:0,
  candidateSourceTriangleFacesAbove10PercentAreaDrift:0,
  candidateSourceTriangleNormalsFlipped:0,
  candidateSourceTriangleFacesCollapsed:0,
  maximumSampledPhotoSourceEdgeStrain:.024,
  maximumSampledPhotoSourceAreaDrift:.049,
  sampledStrictBodyAndSelfNoncrossingWithShapeGuard:true,
  sampledStatus:'SAMPLED_STRICT_CROSSINGS_NOT_OBSERVED',
  sourcePhotoRestUVSkinAndGeometryUnchanged:true,
  noOriginalSourceVerticesOrFaceIDsOrPhotoExported:true,
  geometricZeroOrNearNotProvenCollisionFree:true,
  continuousMotionCollisionCertification:false,
  independentPhotographicRealismApproved:false,consumer3DAdmitted:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 }})));

const tagged=()=>good().map(row=>{
 const t={
  schema:'M2-original-source-zero-contact-topology-C54',
  zeroDistancePairsClassified:4,classificationComplete:true,
  sourceCoincidentFaceCandidates:1,
  sourceCoincidentEdgeCandidates:1,
  sourceCoincidentSinglePointCandidates:0,
  sourceCoincidentButUnsafeSkinRestOrPose:1,
  sourceIndependentZeroDistancePairs:1,
  allSourceCorrespondencesCheckedAgainst163BonePose:true,
  sourceCoincidenceNotAHumanVerifiedSewingSeam:true,
  sourceCoordinateDuplicateNotPermissionToWeld:true,
  releaseAuthorized:false
 };
 const e={
  schema:'M2-original-photograph-source-edge-winding-C55',
  sourceEdgeAuditComplete:true,sourceEdgePairsClassified:1,
  sourceTwoFaceOppositeWindingCandidates:1,
  sourceTwoFaceSameWindingCandidates:0,
  sourceThreePlusIncidentFaceNonmanifoldCandidates:0,
  sourceUnsafeOrAmbiguousCoordinateGroupCandidates:0,
  sourceEdgeUnpairedOrUnresolvedCandidates:0,
  sourceEdgeWindingOnlyCandidateNotSewnSeam:true,
  oppositeWindingCannotAuthorizeWelding:true,
  sourceManifoldEstimateNotPhysicalFabricCertificate:true,
  photoUVSkinAndSourceMeshUnchanged:true,
  releaseAuthorized:false
 };
 row.contact.sampledCandidateSelfSourceTopology54=t;
 row.contact.sampledCandidateSelfSourceEdgeWinding55=e;
 row.contact.sourceCoincidentOrTwoFaceEdgeCannotProveSewnSeam=true;
 row.contact.secondaryGarmentSurfacesAndRimsNotAudited=true;
 return row;
});
test('complete synthetic topological correspondence proves classification NOT seam approval',()=>{
 const rows=tagged(),g=verifyActualPhotoSourceZeroTopology89(rows);
 assert.equal(g.status,'SOURCE_ZERO_TOPOLOGY_CLASSIFIED_NOT_CERTIFIED');
 assert.equal(g.completeOriginalSkinnedPoseProofs,6);
 assert.equal(g.classifiedGeometricZeroPairsAcrossSixPoses,24);
 assert.equal(g.sourceIndependentOrSkinUnsafePairWitnesses,12);
 assert.equal(g.originalEdgeIncidencePairsAudited,6);
 assert.equal(g.releaseAuthorized,false);assert.equal(g.independentVisualApproval,false);
});
test('false topological categories or missing correspondence fail closed',()=>{
 const cases=[
  c=>c.sampledCandidateSelfSourceTopology54.zeroDistancePairsClassified=2,
  c=>c.sampledCandidateSelfSourceTopology54.sourceIndependentZeroDistancePairs=0,
  c=>c.sampledCandidateSelfSourceTopology54.classificationComplete=false,
  c=>c.sampledCandidateSelfSourceTopology54.sourceCoincidenceNotAHumanVerifiedSewingSeam=false,
  c=>delete c.sampledCandidateSelfSourceTopology54,
  c=>c.sampledCandidateSelfSourceEdgeWinding55.sourceEdgePairsClassified=2,
  c=>c.sampledCandidateSelfSourceEdgeWinding55.sourceTwoFaceOppositeWindingCandidates=2,
  c=>c.sampledCandidateSelfSourceEdgeWinding55.sourceEdgeAuditComplete=false,
  c=>c.sampledCandidateSelfSourceEdgeWinding55.oppositeWindingCannotAuthorizeWelding=false,
  c=>c.sampledCandidateSelfSourceEdgeWinding55.photoUVSkinAndSourceMeshUnchanged=false,
  c=>c.sourceCoincidentOrTwoFaceEdgeCannotProveSewnSeam=false,
  c=>c.secondaryGarmentSurfacesAndRimsNotAudited=false
 ];
 for(const update of cases){const rows=tagged();update(rows[1].contact);
  assert.equal(verifyActualPhotoSourceZeroTopology89(rows).status,'BLOCKED');
 }
});
test('P88 original source authentic strict-collision and shape guard still mandatory',()=>{
 for(const change of [c=>c.sampledCandidateBodyStrictPairWitnesses=1,
  c=>c.sampledCandidateSelfStrictPairWitnesses=1,
  c=>c.candidateSourceShapeGuardPassed=false,
  c=>c.releaseAuthorized=true,
  c=>c.sourceDressOriginalSHA256='0'.repeat(64)]){
  const rows=tagged();change(rows[5].contact);
  assert.equal(verifyActualPhotoSourceZeroTopology89(rows).status,'BLOCKED');
 }
});
test('never accept arbitrary counts, missing pose, fabricated phone or untested seam',()=>{
 for(const change of [rows=>rows.pop(),
  rows=>rows[0].pose='unknown',
  rows=>rows[2].contact.sampledCandidateSelfSourceEdgeWinding55.sourceEdgePairsClassified=NaN,
  rows=>rows[0].contact.continuousMotionCollisionCertification=true]){
   const rows=tagged();change(rows);
   assert.equal(verifyActualPhotoSourceZeroTopology89(rows).status,'BLOCKED');
  }
});
