import test from 'node:test';
import assert from 'node:assert/strict';
import {validateActualSkinnedPhotoPoseContact88} from '../research/mission2-p88/sample-contact-gate.mjs';
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
test('six synthetic receipt fixtures are structurally accepted but not release evidence',()=>{
 const r=validateActualSkinnedPhotoPoseContact88(good());
 assert.equal(r.status,'SAMPLED_STRICT_NONCROSSING_OBSERVED_NOT_RELEASE');
 assert.equal(r.sourcePoseChecks,6);
 assert.equal(r.actualOriginalBodyStrictWitnessesAcrossSixPoses,1176);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.untestedNearAndContinuousMotion,true);
 assert.equal(r.physicalPhone,false);
 assert.ok(!JSON.stringify(r).includes('worldCoordinates'));
});
test('missing or duplicated figure/pose or missing an original source hash blocks',()=>{
 for(const mutate of [rows=>rows.pop(),rows=>rows[2].pose='source',
  rows=>rows[1].figure='male',rows=>rows[3].contact.sourceDressOriginalSHA256='0'.repeat(64)]){
  const rows=good();mutate(rows);
  assert.equal(validateActualSkinnedPhotoPoseContact88(rows).status,'BLOCKED');
 }
});
test('any genuine strict crossing, self crossing, or missing proof blocks',()=>{
 for(const mutate of [c=>c.sampledCandidateBodyStrictPairWitnesses=1,
  c=>c.sampledCandidateSelfStrictPairWitnesses=1,
  c=>c.completedCandidateBodyAudit=false,
  c=>c.completedCandidateSelfDistanceAudit=false,
  c=>c.sampledStrictBodyAndSelfNoncrossingWithShapeGuard=false,
  c=>c.sampledStatus='BLOCKED_INCOMPLETE',
  c=>c.genuineSource163BoneSkeleton=false]){
  const rows=good();mutate(rows[4].contact);
  assert.equal(validateActualSkinnedPhotoPoseContact88(rows).status,'BLOCKED');
 }
});
test('photographic strain, flipped/collapsed faces and fabricated release block',()=>{
 for(const mutate of [c=>c.candidateSourceShapeGuardPassed=false,
  c=>c.candidateSourceTriangleFacesAbove5PercentStrain=1,
  c=>c.candidateSourceTriangleFacesAbove10PercentAreaDrift=1,
  c=>c.candidateSourceTriangleNormalsFlipped=1,
  c=>c.candidateSourceTriangleFacesCollapsed=1,
  c=>c.continuousMotionCollisionCertification=true,
  c=>c.independentPhotographicRealismApproved=true,
  c=>c.releaseAuthorized=true,c=>c.familyAlpha='OPEN']){
  const rows=good();mutate(rows[0].contact);
  assert.equal(validateActualSkinnedPhotoPoseContact88(rows).status,'BLOCKED');
 }
});
test('nan/negative counters, missing source face counts or PSS-like invented claims block',()=>{
 for(const mutate of [c=>c.sampledCandidateBodyStrictPairWitnesses=NaN,
  c=>c.sampledCandidateBodyNearOrZeroUnresolved=-1,
  c=>c.maximumSampledPhotoSourceAreaDrift=Infinity,
  c=>c.actualAnatomicalBodyFaces=0,
  c=>c.originalSourceTriangles=0]){
  const rows=good();mutate(rows[5].contact);
  assert.equal(validateActualSkinnedPhotoPoseContact88(rows).status,'BLOCKED');
 }
});
test('real C52 collision utility refuses missing original photo rig and accidental client use',()=>{
 assert.throws(()=>auditPoseLinkedOriginalPhotoSkinnedFit88({}),/source\/163-bone identity mismatch/);
 assert.throws(()=>auditPoseLinkedOriginalPhotoSkinnedFit88({root:{isObject3D:true}}),/source\/163-bone identity mismatch/);
});
