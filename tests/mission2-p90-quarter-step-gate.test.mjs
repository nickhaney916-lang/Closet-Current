// P90 fixtures are synthetic; only the genuine Chromium/WebKit CI can claim
// measurements on the photographed dress and true 163-bone avatars.
import test from 'node:test';
import assert from 'node:assert/strict';
import {verifySourcePhotoQuarterSteps90} from '../research/mission2-p90/quarter-step-gate.mjs';
const SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const baselinePoses=['source','blend-50','relaxed'],newPoses=['blend-25','blend-75'];
const c54=()=>({
 schema:'M2-original-source-zero-contact-topology-C54',
 zeroDistancePairsClassified:4,classificationComplete:true,
 sourceCoincidentFaceCandidates:0,sourceCoincidentEdgeCandidates:1,
 sourceCoincidentSinglePointCandidates:3,
 sourceCoincidentButUnsafeSkinRestOrPose:0,sourceIndependentZeroDistancePairs:0,
 allSourceCorrespondencesCheckedAgainst163BonePose:true,
 sourceCoincidenceNotAHumanVerifiedSewingSeam:true,
 sourceCoordinateDuplicateNotPermissionToWeld:true,releaseAuthorized:false
});
const c55=()=>({
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
 photoUVSkinAndSourceMeshUnchanged:true,releaseAuthorized:false
});
const contact=()=>({
 schema:'M2-P88-original-photo-real-skinned-source-contact-sampled-v1',
 originalSourceId:'commons-0053',sourceDressOriginalSHA256:SHA,
 originalSourceTriangles:3836,actualAnatomicalBodyFaces:109064,
 genuineSource163BoneSkeleton:true,
 sampledBaselineBodyStrictPairWitnesses:196,
 sampledCandidateBodyStrictPairWitnesses:0,
 sampledCandidateSelfStrictPairWitnesses:0,
 sampledCandidateBodyNearOrZeroUnresolved:20,
 sampledCandidateSelfGeometricZeroOrOverlapUnresolved:4,
 candidateSourceTriangleFacesAbove5PercentStrain:0,
 candidateSourceTriangleFacesAbove10PercentAreaDrift:0,
 candidateSourceTriangleNormalsFlipped:0,
 candidateSourceTriangleFacesCollapsed:0,
 maximumSampledPhotoSourceEdgeStrain:.024,
 maximumSampledPhotoSourceAreaDrift:.049,
 completedOriginalBodyAudit:true,completedCandidateBodyAudit:true,
 completedCandidateSelfAudit:true,completedCandidateSelfDistanceAudit:true,
 sourcePhotoRestUVSkinAndGeometryUnchanged:true,
 noOriginalSourceVerticesOrFaceIDsOrPhotoExported:true,
 sampledStrictBodyAndSelfNoncrossingWithShapeGuard:true,
 sampledStatus:'SAMPLED_STRICT_CROSSINGS_NOT_OBSERVED',
 candidateSourceShapeGuardPassed:true,
 geometricZeroOrNearNotProvenCollisionFree:true,
 continuousMotionCollisionCertification:false,
 independentPhotographicRealismApproved:false,consumer3DAdmitted:false,
 sourceCoincidentOrTwoFaceEdgeCannotProveSewnSeam:true,
 secondaryGarmentSurfacesAndRimsNotAudited:true,
 sampledCandidateSelfSourceTopology54:c54(),
 sampledCandidateSelfSourceEdgeWinding55:c55(),
 releaseAuthorized:false,familyAlpha:'HOLD'
});
const row=(figure,pose,extra=false)=>({
 figure,pose,contact:contact(),
 ...(extra?{
  rigBones:163,fittedVertices:3836,maxInverseResidualMeters:.00001,
  sourcePhotoOriginalUnchanged:true
 }:{})
});
function fixture(){
 return {
  six:['female','male'].flatMap(g=>baselinePoses.map(p=>row(g,p))),
  four:['female','male'].flatMap(g=>newPoses.map(p=>row(g,p,true)))
 };
}
test('passes 6 + 4 complete source-pose fixtures while refusing full release',()=>{
 const {six,four}=fixture(),r=verifySourcePhotoQuarterSteps90(six,four);
 assert.equal(r.status,'TEN_SAMPLED_AUTHENTIC_SKINNED_CONTACTS_OBSERVED_NOT_RELEASE');
 assert.equal(r.totalAnatomicalPoseSamples,10);
 assert.equal(r.additionalQuarterStepSamples,4);
 assert.equal(r.originalBodyStrictWitnessesAtQuarterSteps,784);
 assert.equal(r.fittedBodyStrictWitnessesAtQuarterSteps,0);
 assert.equal(r.unresolvedFittedSelfZeroOrOverlapAtQuarterSteps,16);
 assert.equal(r.continuousSweptMotionSafetyCertified,false);
 assert.equal(r.releaseAuthorized,false);
});
const mutations={
 'original baseline missing':(a,b)=>a.pop(),
 'baseline self-contact':a=>a[1].contact.sampledCandidateSelfStrictPairWitnesses=1,
 'baseline topology mismatch':a=>a[2].contact.sampledCandidateSelfSourceTopology54.zeroDistancePairsClassified=3,
 'quarter-step missing':(a,b)=>b.pop(),
 'fake continuous pose':(a,b)=>b[0].pose='blend-50',
 'quarter-step reversed':(a,b)=>{[b[0],b[1]]=[b[1],b[0]];},
 'changed avatar identity':(a,b)=>b[1].figure='male',
 'wrong skeleton bone count':(a,b)=>b[0].rigBones=162,
 'no fitted pose vertices':(a,b)=>b[0].fittedVertices=0,
 'inverse fit residual out of budget':(a,b)=>b[0].maxInverseResidualMeters=.00010,
 'altered original photo':(a,b)=>b[1].sourcePhotoOriginalUnchanged=false,
 'wrong licensed photo digest':(a,b)=>b[3].contact.sourceDressOriginalSHA256='0'.repeat(64),
 'fitted body crossing':(a,b)=>b[2].contact.sampledCandidateBodyStrictPairWitnesses=1,
 'fitted cloth self crossing':(a,b)=>b[0].contact.sampledCandidateSelfStrictPairWitnesses=1,
 'shape guard failed':(a,b)=>b[0].contact.candidateSourceShapeGuardPassed=false,
 'strain violation':(a,b)=>b[1].contact.candidateSourceTriangleFacesAbove5PercentStrain=1,
 'area distortion violation':(a,b)=>b[3].contact.candidateSourceTriangleFacesAbove10PercentAreaDrift=1,
 'face flipped':(a,b)=>b[0].contact.candidateSourceTriangleNormalsFlipped=1,
 'collapsed face':(a,b)=>b[2].contact.candidateSourceTriangleFacesCollapsed=1,
 'missed body sampling':(a,b)=>b[1].contact.completedCandidateBodyAudit=false,
 'missed self distance':(a,b)=>b[1].contact.completedCandidateSelfDistanceAudit=false,
 'photo UV changed':(a,b)=>b[2].contact.sourcePhotoRestUVSkinAndGeometryUnchanged=false,
 'invented certified sewn seam':(a,b)=>b[3].contact.sourceCoincidentOrTwoFaceEdgeCannotProveSewnSeam=false,
 'forgot secondary cloth':(a,b)=>b[3].contact.secondaryGarmentSurfacesAndRimsNotAudited=false,
 'missing source C54':(a,b)=>delete b[2].contact.sampledCandidateSelfSourceTopology54,
 'C54 zero unaccounted':(a,b)=>b[0].contact.sampledCandidateSelfSourceTopology54.sourceCoincidentSinglePointCandidates=2,
 'C54 skin mismatch':(a,b)=>b[0].contact.sampledCandidateSelfSourceTopology54.allSourceCorrespondencesCheckedAgainst163BonePose=false,
 'missing C55':(a,b)=>delete b[1].contact.sampledCandidateSelfSourceEdgeWinding55,
 'C55 fake incident count':(a,b)=>b[1].contact.sampledCandidateSelfSourceEdgeWinding55.sourceTwoFaceOppositeWindingCandidates=2,
 'C55 unauthorized welding':(a,b)=>b[1].contact.sampledCandidateSelfSourceEdgeWinding55.oppositeWindingCannotAuthorizeWelding=false,
 'pretend swept collision is certified':(a,b)=>b[2].contact.continuousMotionCollisionCertification=true,
 'pretend independently approved':(a,b)=>b[0].contact.independentPhotographicRealismApproved=true,
 'pretend consumer admission':(a,b)=>b[0].contact.consumer3DAdmitted=true,
 'remove Family Alpha hold':(a,b)=>b[1].contact.familyAlpha='READY',
 'fake release authority':(a,b)=>b[1].contact.releaseAuthorized=true,
 'invalid near distances':(a,b)=>b[1].contact.sampledCandidateBodyNearOrZeroUnresolved=NaN
};
for(const [name,fn] of Object.entries(mutations))
 test('blocks '+name,()=>{
  const {six,four}=fixture();fn(six,four);
  assert.equal(verifySourcePhotoQuarterSteps90(six,four).status,'BLOCKED');
 });
