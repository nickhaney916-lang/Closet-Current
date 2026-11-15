import test from 'node:test';
import assert from 'node:assert/strict';
import {compareOriginalSourceQuarterStepAB89} from
 '../research/parallel89/source-quarter-compare89.mjs';
const s='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const d='b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c';
const poses=['blend-25','blend-75'];
const keys=['shirtBody','denimBody','shirtDenim'];
function evidence(){
 const report=()=>({
  schema:'P89-real-original-shirt-jeans-static-quarterstep-gap/v1',
  status:'ACTUAL_PUBLIC_SOURCE_STATIC_QUARTERSTEP_MEASURED_NOT_SWEPT',
  avatar:'female',realAnatomical163BoneRig:true,
  originalShirtSHA256:s,
  originalDenimSourceId:'commons-public-domain-jeans-2005',
  originalDenimSHA256:d,authenticQuarterPoseCount:2,
  allOriginalFacePairsExamined:true,
  originalSourceGeometryUnchanged:true,originalBonesRestored:true,
  signedExteriorClearanceCertified:false,bodyContainmentCertified:false,
  sweptContinuousCollisionCertified:false,
  realClothDynamicsCertified:false,
  originalPhoto2DFallbackRequired:true,consumer3DAuthorized:false,
  releaseAuthorized:false,familyAlpha:'HOLD',
  poseWitnesses:poses.map(pose=>({
   pose,originalAnatomicalBonePose:true,staticQuarterPoseOnly:true,
   sweptCollisionCertified:false,
   sourcePairs:Object.fromEntries(keys.map((key,i)=>[key,{
    unsignedMinimumSurfaceDistanceMeters:[.00034,.0031,.0015][i],
    originalTriangleCrossingPairs:0,
    exactOriginalTriangulatedSurfacesMeasured:true,
    signedInteriorExteriorNotMeasured:true,dynamicSweptClothNotMeasured:true
   }]))
  }))
 });
 return {avatar:'female',baseline:report(),trial:report()};
}
test('both legitimate intermediate poses remain only static research, no consumer 3D',()=>{
 const x=evidence(),r=compareOriginalSourceQuarterStepAB89(x);
 assert.equal(r.status,'QUARTER_STATIC_POSES_NO_NEW_WORSENING_NOT_SWEPT');
 assert.equal(r.trialRetainedForResearchOnly,true);
 assert.equal(r.authenticOriginalSourceQuarterPoseCount,2);
 assert.equal(r.quarterPoseChanges.length,2);
 assert.equal(r.continuousSweptMotionCertified,false);
 assert.equal(r.signedOutsideBodyClearanceCertified,false);
 assert.equal(r.sourcePhoto2DFallbackRequired,true);
 assert.equal(r.consumer3DAuthorized,false);
});
test('even one quarter-step contact count increase overrides any large gap improvement',()=>{
 const x=evidence();
 for(const pose of x.trial.poseWitnesses)
  pose.sourcePairs.shirtBody.unsignedMinimumSurfaceDistanceMeters=.0012;
 x.trial.poseWitnesses[1].sourcePairs.shirtDenim.originalTriangleCrossingPairs=1;
 const r=compareOriginalSourceQuarterStepAB89(x);
 assert.equal(r.status,'QUARTER_STATIC_POSE_SOURCE_WORSENING_WITNESSED');
 assert.equal(r.quarterPoseNewTriangleCrossings,true);
 assert.equal(r.trialRetainedForResearchOnly,false);
 assert.equal(r.continuousSweptMotionCertified,false);
});
test('40 micron source reduction allowed only as research; 60 micron source reduction vetoed',()=>{
 const x=evidence();
 for(const pose of x.trial.poseWitnesses)
  pose.sourcePairs.shirtBody.unsignedMinimumSurfaceDistanceMeters=.0003;
 let r=compareOriginalSourceQuarterStepAB89(x);
 assert.equal(r.quarterPoseGapShrinkExceeded50Microns,false);
 assert.equal(r.trialRetainedForResearchOnly,true);
 for(const pose of x.trial.poseWitnesses)
  pose.sourcePairs.shirtBody.unsignedMinimumSurfaceDistanceMeters=.00028;
 r=compareOriginalSourceQuarterStepAB89(x);
 assert.equal(r.quarterPoseGapShrinkExceeded50Microns,true);
 assert.equal(r.trialRetainedForResearchOnly,false);
 assert.equal(r.mostNegativeQuarterPoseGapDeltaMeters,-.00006);
});
const failures=[
 ['false continuous-motion release',x=>x.trial.sweptContinuousCollisionCertified=true],
 ['fake original JPEG hash',x=>x.trial.originalShirtSHA256='a'.repeat(64)],
 ['mixed original jeans identity',x=>x.trial.originalDenimSHA256='b'.repeat(64)],
 ['wrong original 163-bone avatar',x=>x.trial.avatar='male'],
 ['missing 75 percent pose',x=>x.trial.poseWitnesses.pop()],
 ['duplicate quarter pose',x=>x.trial.poseWitnesses[0].pose='blend-75'],
 ['forged negative triangle pair count',x=>x.trial.poseWitnesses[0].sourcePairs.shirtDenim.originalTriangleCrossingPairs=-1],
 ['hidden body penetration',x=>x.baseline.bodyContainmentCertified=true],
 ['invalid NaN geometry gap',x=>x.trial.poseWitnesses[1].sourcePairs.shirtBody.unsignedMinimumSurfaceDistanceMeters=NaN],
 ['unauthorized consumer 3D',x=>x.trial.consumer3DAuthorized=true],
 ['source geometry silently edited by audit',x=>x.trial.originalSourceGeometryUnchanged=false],
 ['unverified original poses',x=>x.trial.realAnatomical163BoneRig=false],
 ['hidden 2D original photo fallback',x=>x.trial.originalPhoto2DFallbackRequired=false]
];
for(const [label,mutation] of failures)
 test('P89 static quarter poses refuse '+label,()=>{
  const x=evidence();mutation(x);
  const r=compareOriginalSourceQuarterStepAB89(x);
  assert.equal(r.status,'QUARTERSTEP_SOURCE_COMPARISON_REFUSED');
  assert.equal(r.trialRetainedForResearchOnly,false);
  assert.equal(r.sourcePhoto2DFallbackRequired,true);
  assert.equal(r.consumer3DAuthorized,false);
  assert.equal(r.familyAlpha,'HOLD');
 });
