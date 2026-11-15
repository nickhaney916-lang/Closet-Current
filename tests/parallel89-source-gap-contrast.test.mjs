import test from 'node:test';
import assert from 'node:assert/strict';
import {compareOriginalSourceShoulderGapAB89} from '../research/parallel89/source-gap-contrast89.mjs';
const SHIRT='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const DENIM='b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c';
const poses=['source','blend-50','relaxed'];
const pairs=['shirtBody','denimBody','shirtDenim'];
const clone=v=>structuredClone(v);
/** Entirely synthetic authorization-adversarial records. Actual licensed
 * JPEG+rig+BVH A/B is separate Chromium/WebKit native CI.
 */
function mock(){
 const source=()=>'P89-original-source-unsigned-3d-surface-gap/v1';
 const row=(pose)=>({
  pose,nearSurfaceThresholdMeters:.002,
  absenceOfTriangleCrossingsCannotCertifyPhysicalSeparation:true,
  distances:Object.fromEntries(pairs.map((k,i)=>[k,{
   sourceTriangleCounts:[123,456],
   unsignedMinimumSurfaceDistanceMeters:[.00035,.00326,.0015][i],
   distanceMeasuredOnAllSourceTriangles:true,
   signedExteriorClearanceMeasured:false,bodyContainmentMeasured:false,
   continuousMovementMeasured:false
  }])),
  originalTriangleCrossings:{shirtBody:0,denimBody:0,shirtDenim:0},
  someSourceSurfacesWithin2mm:true
 });
 const report={
  schema:source(),
  status:'THREE_ACTUAL_SOURCE_POSE_UNSIGNED_GAPS_MEASURED_NOT_CLEARANCE',
  avatar:'male',actualAnatomical163Bones:true,
  originalPublicPhotoId:'commons-0003',originalShirtSHA256:SHIRT,
  originalDenimSHA256:DENIM,denimSourceId:'commons-public-domain-jeans-2005',
  originalSourcePoses:3,exactOriginalWorldSpaceTrianglesMeasured:true,
  independentSignedDistanceOrBodyContainmentVerified:false,
  dynamicSweptClothContactVerified:false,independentPhotorealismApproved:false,
  sourcePhoto2DFallbackRequired:true,consumer3DAuthorized:false,
  releaseAuthorized:false,familyAlpha:'HOLD',
  sourcePoseMeasurements:poses.map(row)
 };
 const baseline=report,trial=clone(report);
 const baselineShoulder={
  schema:'parallel84-source-bone-shoulder-yoke/v1',
  status:'BASELINE_UNMODIFIED',trialApplied:false,releaseAuthorized:false
 };
 const trialShoulder={
  schema:'parallel84-source-bone-shoulder-yoke/v1',
  status:'SAMPLED_CONTACT_NONWORSENING_ONLY',trialApplied:true,
  newlyIntroducedBodyTrianglePairs:0,newlyIntroducedLayerTrianglePairs:0,
  sourcePhotoPreserved:true,sourceSkinUVPreserved:true,
  originalBodyUnchanged:true,sourceBackUnphotographed:true,
  continuousClothPhysicsValidated:false,humanVisualRealismApproved:false,
  releaseAuthorized:false
 };
 return {avatar:'male',baseline,trial,baselineShoulder,trialShoulder};
}
test('original license-locked 3-pose research gap contrast measures improvements and worsening without authorizing consumer outfit',()=>{
 const x=mock();
 for(const row of x.trial.sourcePoseMeasurements){
  row.distances.shirtBody.unsignedMinimumSurfaceDistanceMeters=.00115;
  row.distances.shirtDenim.unsignedMinimumSurfaceDistanceMeters=.0012;
 }
 const r=compareOriginalSourceShoulderGapAB89(x);
 assert.equal(r.status,'ACTUAL_ORIGINAL_PHOTO_SHOULDER_AB_MEASURED_NOT_CLEARED');
 assert.equal(r.changedGapImprovedAtLeastHalfMmCount,3);
 assert.equal(r.changedGapWorsenedAtLeastQuarterMmCount,3);
 assert.equal(r.candidateStillNear2mmPairPoseCount,6);
 assert.equal(r.someUnsignedSurfaceGapWorsened,true);
 assert.equal(r.someStaticCrossingCountWorsened,false);
 assert.equal(r.existingP84ResearchYokeTrialApplied,true);
 assert.equal(r.measuredSourceGapChanges.length,3);
 assert.equal(r.measuredSourceGapChanges[0].unsignedSeparationChanges.shirtBody.measuredDeltaMeters,.0008);
 assert.equal(r.measuredSourceGapChanges[0].unsignedSeparationChanges.shirtDenim.measuredDeltaMeters,-.0003);
 for(const key of ['sourceSignedClearanceCertified','continuousSweptMotionCertified',
  'consumer3DAuthorized','releaseAuthorized'])
  assert.equal(r[key],false);
 assert.equal(r.sourcePhoto2DFallbackRequired,true);
 assert.equal(r.familyAlpha,'HOLD');
});
test('unapplied source shoulder geometry must produce exact unchanged BVH distances and zero crossing changes',()=>{
 const x=mock();
 x.trialShoulder.status='REFUSED_NEW_CONTACT';x.trialShoulder.trialApplied=false;
 const receipt=compareOriginalSourceShoulderGapAB89(x);
 assert.equal(receipt.status,'ACTUAL_ORIGINAL_PHOTO_SHOULDER_AB_MEASURED_NOT_CLEARED');
 assert.equal(receipt.existingP84ResearchYokeTrialApplied,false);
 assert.equal(receipt.changedGapImprovedAtLeastHalfMmCount,0);
});
test('new measured real-triangle crossing counts flagged as blocker even with positive unsigned gap',()=>{
 const x=mock();
 x.trial.sourcePoseMeasurements[1].originalTriangleCrossings.shirtBody=1;
 const receipt=compareOriginalSourceShoulderGapAB89(x);
 assert.equal(receipt.someStaticCrossingCountWorsened,true);
 assert.equal(receipt.consumer3DAuthorized,false);
});
const negatives=[
 ['fake owner or 3D approval',r=>r.trial.consumer3DAuthorized=true],
 ['unsigned cannot be signed clearance',r=>r.trial.independentSignedDistanceOrBodyContainmentVerified=true],
 ['invented photo backing',r=>r.trial.originalShirtSHA256='a'.repeat(64)],
 ['different denim source',r=>r.trial.originalDenimSHA256='b'.repeat(64)],
 ['other anatomy',r=>r.trial.avatar='female'],
 ['missing physical source pose',r=>r.trial.sourcePoseMeasurements.pop()],
 ['duplicate source pose',r=>r.trial.sourcePoseMeasurements[1].pose='source'],
 ['tampered early body near-contact flag',r=>r.baseline.sourcePoseMeasurements[1].someSourceSurfacesWithin2mm=false],
 ['nonfinite original triangles',r=>r.trial.sourcePoseMeasurements[2].distances.shirtBody.unsignedMinimumSurfaceDistanceMeters=Infinity],
 ['invented released fitting',r=>r.trialShoulder.releaseAuthorized=true],
 ['fake source UV unaffected',r=>r.trialShoulder.sourceSkinUVPreserved=false],
 ['false yoke acceptance',r=>r.trialShoulder.newlyIntroducedLayerTrianglePairs=1],
 ['original baseline actually changed',r=>r.baselineShoulder.trialApplied=true],
 ['hidden candidate 2D fallback',r=>r.trial.sourcePhoto2DFallbackRequired=false],
 ['refused original geometry secretly changed',r=>{
  r.trialShoulder.trialApplied=false;r.trialShoulder.status='REFUSED_NEW_CONTACT';
  r.trial.sourcePoseMeasurements[1].distances.shirtBody.unsignedMinimumSurfaceDistanceMeters=.001
 }]
];
for(const [name,mutate] of negatives)test('P89 photo-source shoulder gap comparison rejects '+name,()=>{
 const x=mock();mutate(x);
 const receipt=compareOriginalSourceShoulderGapAB89(x);
 assert.equal(receipt.status,'SOURCE_SHOULDER_GAP_AB_REFUSED');
 assert.equal(receipt.consumer3DAuthorized,false);
 assert.equal(receipt.sourcePhoto2DFallbackRequired,true);
 assert.equal(receipt.familyAlpha,'HOLD');
});
