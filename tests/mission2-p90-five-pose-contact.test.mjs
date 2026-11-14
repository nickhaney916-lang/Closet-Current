import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyActualFivePosePhotoContact90,POSES90} from '../research/mission2-p90/five-pose-contact-gate.mjs';
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
  sourceCoincidentSinglePointCandidates:2,
  sourceCoincidentButUnsafeSkinRestOrPose:0,
  sourceIndependentZeroDistancePairs:0,
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

const ten=()=>{
 const six=tagged();
 return ['female','male'].flatMap(figure=>POSES90.map(pose=>{
  const src=six.find(x=>x.figure===figure&&x.pose===(pose==='blend-25'||pose==='blend-75'?'blend-50':pose));
  return {...structuredClone(src),pose};
 }));
};
const PASS='TEN_SOURCE_POSES_CHECKED_NOT_CONTINUOUS_COLLISION_CERTIFICATE';
test('ten synthetic numeric receipts preserve 6-pose base and add four genuine-stage requirements',()=>{
 const p=verifyActualFivePosePhotoContact90(ten());
 assert.equal(p.status,PASS);
 assert.equal(p.testedAvatarPoseSamples,10);
 assert.equal(p.additionalRealInterpolatedPoseSamples,4);
 assert.equal(p.countedOriginalSourceZeroContactPairs,40);
 assert.equal(p.countedOriginalSourceEdgePairCandidates,10);
 assert.equal(p.skinMismatchOrSourceIndependentContactPairs,0);
 assert.equal(p.realContinuousSweptClothContactUnmeasured,true);
 assert.equal(p.releaseAuthorized,false);
});
test('missing, reordered, duplicated or invented original 25/75% poses fail closed',()=>{
 const mutations=[
  rows=>rows.pop(), rows=>rows.reverse(),
  rows=>rows[1].pose='blend-50',
  rows=>rows[3].figure='male',
  rows=>rows.splice(6,1),rows=>rows.push({...rows[9]})
 ];
 for(const fn of mutations){
  const rows=ten();fn(rows);
  assert.equal(verifyActualFivePosePhotoContact90(rows).status,'BLOCKED');
 }
});
test('actual 25/75% source SHA, body, cloth shape, skeleton and 3D admission remain mandatory',()=>{
 const mutations=[
  c=>c.sourceDressOriginalSHA256='0'.repeat(64),
  c=>c.genuineSource163BoneSkeleton=false,
  c=>c.actualAnatomicalBodyFaces=0,
  c=>c.completedCandidateSelfDistanceAudit=false,
  c=>c.sampledCandidateBodyStrictPairWitnesses=1,
  c=>c.sampledCandidateSelfStrictPairWitnesses=1,
  c=>c.candidateSourceTriangleNormalsFlipped=1,
  c=>c.candidateSourceTriangleFacesAbove5PercentStrain=1,
  c=>c.continuousMotionCollisionCertification=true,
  c=>c.consumer3DAdmitted=true,
  c=>c.releaseAuthorized=true
 ];
 for(const fn of mutations){
  const rows=ten();fn(rows[8].contact);
  assert.equal(verifyActualFivePosePhotoContact90(rows).status,'BLOCKED');
 }
});
test('source-origin C54/C55 count, edge incidence and no-seam-waiver enforced at added poses',()=>{
 const mutations=[
  c=>c.sampledCandidateSelfSourceTopology54.zeroDistancePairsClassified=5,
  c=>c.sampledCandidateSelfSourceTopology54.sourceCoincidentSinglePointCandidates=1,
  c=>c.sampledCandidateSelfSourceTopology54.classificationComplete=false,
  c=>c.sampledCandidateSelfSourceTopology54.sourceCoincidenceNotAHumanVerifiedSewingSeam=false,
  c=>c.sampledCandidateSelfSourceEdgeWinding55.sourceEdgePairsClassified=0,
  c=>c.sampledCandidateSelfSourceEdgeWinding55.oppositeWindingCannotAuthorizeWelding=false,
  c=>c.sampledCandidateSelfSourceEdgeWinding55.sourceTwoFaceOppositeWindingCandidates=-1,
  c=>c.sourceCoincidentOrTwoFaceEdgeCannotProveSewnSeam=false
 ];
 for(const fn of mutations){
  const rows=ten();fn(rows[3].contact);
  assert.equal(verifyActualFivePosePhotoContact90(rows).status,'BLOCKED');
 }
});
test('P89 exact six core source/pose proof is mandatory even if four new stages pass',()=>{
 for(const mutate of [c=>c.sampledCandidateSelfStrictPairWitnesses=1,
  c=>c.sampledCandidateSelfSourceTopology54.classificationComplete=false,
  c=>c.sourceDressOriginalSHA256='0'.repeat(64)]){
  const rows=ten();mutate(rows[7].contact);
  assert.equal(verifyActualFivePosePhotoContact90(rows).status,'BLOCKED');
 }
});
test('intermediate source-independent and rest/skin-unsafe contact candidates cannot be accepted',()=>{
 for(const key of ['sourceIndependentZeroDistancePairs','sourceCoincidentButUnsafeSkinRestOrPose']){
  const rows=ten();rows[1].contact.sampledCandidateSelfSourceTopology54[key]++;
  rows[1].contact.sampledCandidateSelfSourceTopology54.sourceCoincidentSinglePointCandidates--;
  const x=verifyActualFivePosePhotoContact90(rows);
  assert.equal(x.status,'BLOCKED');
  assert.ok(x.skinMismatchOrSourceIndependentContactPairs>=1);
 }
});
