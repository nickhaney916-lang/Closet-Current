import test from 'node:test';
import assert from 'node:assert/strict';
import {auditDenseOriginalPhotoSkirtTransition89,DENSE_ORIGINAL_POSE_FRACTIONS89}
 from '../research/parallel89/skirt-original-dense-motion-contact89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
const receipt=(pairs=[],depth=0)=>({
 count:pairs.length,pairs:new Set(pairs),maxDepth:depth,
 trueOriginalSkirtTriangleIndexStable:true,
 trueOriginalBodyTriangleIndexStable:true,
 originalFaceSourceResolution:'BVH_INDIRECT_RESOLVED_ORIGINAL_TRIANGLE_INDICES'
});
const base={
 avatar:'female',sourcePhotoSHA256:PHOTO,originalRigSHA256:RIG,
 sourceBodyTriangleCount:109064,
 selectedRegistrationName:'front-40mm',selectedRegistrationMeters:.04,
 actualRigBoneCount:163,photoBackObserved:false,physicalGarmentScaleKnown:false,
 baselineFivePoseCounts:[2,2,2,2,2],trialFivePoseCounts:[0,0,0,0,0]
};
function run(options={}){
 const events=[],x={...base,...options};
 x.sampleAtFraction=x.sampleAtFraction||((fraction,which)=>{
  events.push([fraction,which]);
  return which==='original'?receipt(['0|10','1|11'],.01):receipt([]);
 });
 x.restore=x.restore||(()=>{events.push('restored')});
 return {value:auditDenseOriginalPhotoSkirtTransition89(x),events};
}
test('seventeen original rig sixteenths, separately snapshotted original/selected BVH, remain static and held',()=>{
 const {value:r,events}=run();
 assert.equal(r.status,'NO_TRANSVERSE_CROSSINGS_AT_SEVENTEEN_STATIC_POSES_NOT_SWEPT_FIT');
 assert.deepEqual(r.testedStaticPoseFractions,DENSE_ORIGINAL_POSE_FRACTIONS89);
 assert.equal(r.perPoseSampleCounts.length,17);
 assert.equal(r.newIntermediatePoseSamplesPerAvatar,12);
 assert.equal(r.originalAndRegisteredSeparateAuthenticIndexedBVHSamples,34);
 assert.equal(r.sumOriginalStrictFacePairs,34);
 assert.equal(r.sumRegisteredStrictFacePairs,0);
 assert.equal(r.sumNewlyIntroducedOriginalSourceFacePairs,0);
 assert.equal(r.previouslyTestedQuarterAnchorFractionsReproducedExactly,true);
 assert.equal(r.continuousSweptClothContactCertified,false);
 assert.equal(r.noOriginalAnatomicalSignedInsideOutsideOrClearanceCertified,true);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 assert.deepEqual(events.filter(x=>Array.isArray(x)).length,34);
 assert.equal(events.at(-1),'restored');
});
test('new collision between tested quarter poses is witnessed and BLOCKED, not misrepresented as continuous clearance',()=>{
 const {value:r}=run({sampleAtFraction:(fraction,which)=>
  which==='original'?receipt(['0|10','1|11'],.01):
  fraction===.125?receipt(['2|34'],.005):receipt([])});
 assert.equal(r.status,'DENSE_SOURCE_COLLISIONS_OR_NEW_FACE_PAIRS_WITNESSED_BLOCKED');
 assert.equal(r.sumRegisteredStrictFacePairs,1);
 assert.equal(r.sumNewlyIntroducedOriginalSourceFacePairs,1);
 assert.equal(r.perPoseSampleCounts[2].fraction,.125);
 assert.equal(r.perPoseSampleCounts[2].newlyIntroducedOriginalSourceFacePairs,1);
 assert.equal(r.consumer3DAdmitted,false);
});
test('zero new face pairs does not mean zero contacts or fit',()=>{
 const {value:r}=run({sampleAtFraction:(fraction,which)=>
  which==='original'?receipt(['0|10','1|11'],.01):
   receipt(['1|11'],.005),
  trialFivePoseCounts:[1,1,1,1,1]});
 assert.equal(r.status,'DENSE_SOURCE_COLLISIONS_OR_NEW_FACE_PAIRS_WITNESSED_BLOCKED');
 assert.equal(r.sumNewlyIntroducedOriginalSourceFacePairs,0);
 assert.equal(r.sumRegisteredStrictFacePairs,17);
});
test('unexpected five-pose anchor mismatch cannot pass even when dense result has zero pairs',()=>{
 let restored=0;
 const {value:r}=run({
  baselineFivePoseCounts:[2,2,5,2,2],
  restore:()=>{restored++;}
 });
 assert.equal(r.status,'DENSE_ORIGINAL_SOURCE_BVH_EVIDENCE_UNVERIFIABLE');
 assert.equal(r.reason,'dense-interpolation-does-not-reproduce-five-real-poses');
 assert.equal(restored,1);
 assert.equal(r.consumer3DAdmitted,false);
});
test('reused and mutated raw BVH face pair Sets are snapshotted before next sample',()=>{
 const pairs=new Set(['0|10','1|11']);
 const raw={...receipt(),pairs,count:2,maxDepth:.01};
 const {value:r}=run({sampleAtFraction:(_,which)=>{
  pairs.clear();
  if(which==='original'){pairs.add('0|10');pairs.add('1|11');raw.count=2;raw.maxDepth=.01;}
  else{raw.count=0;raw.maxDepth=0;}
  return raw;
 }});
 assert.equal(r.status,'NO_TRANSVERSE_CROSSINGS_AT_SEVENTEEN_STATIC_POSES_NOT_SWEPT_FIT');
 assert.equal(r.sumOriginalStrictFacePairs,34);
});
test('original source-indexed triangle IDs, BVH proof and depths fail closed',()=>{
 for(const bad of [
  {...receipt(['576|10'])},
  {...receipt(['0|109064'])},
  {...receipt(['0|10']),maxDepth:NaN},
  {...receipt(['0|10']),trueOriginalBodyTriangleIndexStable:false},
  {...receipt(['0|10']),pairs:new Set(['00|10'])}
 ]){
  const {value:r}=run({sampleAtFraction:()=>bad});
  assert.equal(r.status,'DENSE_ORIGINAL_SOURCE_BVH_EVIDENCE_UNVERIFIABLE');
  assert.equal(r.consumer3DAdmitted,false);
 }
});
test('source ownership, 163bone avatar, exact published registration and unobserved back are mandatory',()=>{
 for(const patch of [
  {sourcePhotoSHA256:'bad'},
  {originalRigSHA256:'other'},
  {avatar:'unknown'},
  {actualRigBoneCount:162},
  {selectedRegistrationMeters:.04,selectedRegistrationName:'front-35mm'},
  {photoBackObserved:true},
  {physicalGarmentScaleKnown:true},
  {sourceBodyTriangleCount:600},
  {baselineFivePoseCounts:[2,2]},
  {selectedRegistrationName:'front-999mm'}
 ]){
  const {value:r,events}=run(patch);
  assert.equal(r.status,'DENSE_ORIGINAL_SOURCE_BVH_EVIDENCE_UNVERIFIABLE');
  assert.equal(r.consumer3DAdmitted,false);
  assert.equal(events.length,0);
 }
});
test('restoration failure and callback throw block dense evidence; never promote to consumer',()=>{
 const a=run({restore:()=>{throw Error('restore failed')}});
 assert.equal(a.value.reason,'original-source-pose-or-geometry-not-restored');
 const b=run({sampleAtFraction:()=>{throw Error('GPU context failed')}});
 assert.equal(b.value.reason,'original-163bone-interpolation-or-source-BVH-unverifiable');
 assert.equal(b.value.releaseAuthorized,false);
});
