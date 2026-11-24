import test from 'node:test';
import assert from 'node:assert/strict';
import {assessMetricGarmentToWearerFit as assess,auditSampledOriginalFrontProportions as audit}
 from '../research/parallel89/measured-wearer-to-licensed-rig-garment-fit89.mjs';

const sourceSHA='a'.repeat(64),rigSHA='b'.repeat(64);
const span=(landmark,from,to,mm,uncertaintyMm)=>({
 landmark,rigA:from,rigB:to,measuredMm:mm,uncertaintyMm
});
const segmentData=()=>({
 rigMetricAnchors:[
  span('height',[0,0,0],[0,1.7,0],1700,5),
  span('shoulder',[0,0,0],[.4,0,0],400,2)
 ],
 rigMetricIndependentHoldout:
  span('torso',[0,0,0],[0,.6,0],600,3)
});
const sec=(landmark,body,garment,bu=3,gu=3)=>({
 landmark,bodyCircumferenceMm:body,garmentCircumferenceMm:garment,
 bodyUncertaintyMm:bu,garmentUncertaintyMm:gu,
 measuredAsCompleteClosedCircumference:true
});
const fixture=()=>{
 const refs=segmentData();
 return {
  source:{imageId:2551406,originalPhotoSHA256:sourceSHA},
  independentSourceWitness:{
   imageId:2551406,originalPhotoSHA256:sourceSHA,
   originalBytesRehashedByNativeCaller:true
  },
  licensedRig:{sha256:rigSHA,kind:'female',actualOriginalBoneCount:163},
  independentRigWitness:{
   sha256:rigSHA,kind:'female',actualOriginalBoneCount:163,
   originalSourceRigBytesVerifiedByNativeCaller:true,
   actualOriginalRigSourcePositionsVerified:true
  },
  measurements:{
   originalRigSHA256:rigSHA,sourcePhotoSHA256:sourceSHA,
   sourceRevision:'synthetic-not-a-real-person',
   garmentType:'skirt',
   ...refs,
   physicalCircumferenceSections:[
    sec('waist',750,810),sec('hip',990,1040)
   ]
  },
  measurementTrust:{
   originalRigSHA256:rigSHA,sourcePhotoSHA256:sourceSHA,
   sourceRevision:'synthetic-not-a-real-person',
   activeOwnerLeaseVerifiedByTrustedCaller:true,
   independentlyAuthenticatedMeasurementSpecimens:true
  }
 };
};
function safe(r){
 assert.equal(r.actualOwnerMeasuredPhysicalFitCertified,false);
 assert.equal(r.garmentToLicensedRigMeshFitted,false);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 assert.equal(r.familyAlpha,'HOLD');
 assert.equal(r.fitted3DGeometry,null===r.fitted3DGeometry?null:undefined);
}
test('synthetic scale consistent with TWO different rig landmarks and independent THIRD holdout',()=>{
 const r=assess(fixture());safe(r);
 assert.equal(r.decision,
  'BLOCKED_REAL_WORLD_METRIC_FIT_REQUIRES_APPROVED_CONTACT_AND_DRAPE');
 assert.ok(r.metricRigScaleIntervalMmPerRigUnit[0]>990);
 assert.ok(r.metricRigScaleIntervalMmPerRigUnit[1]<1010);
 assert.ok(r.independentlyMeasuredThirdLandmarkScaleIntervalMmPerRigUnit[0]<1000);
 assert.ok(r.independentlyMeasuredThirdLandmarkScaleIntervalMmPerRigUnit[1]>1000);
 assert.deepEqual(r.conditionalMeasuredGarmentBodyEase.map(x=>x.classification),[
  'MEASURED_CIRCUMFERENCE_CLEARANCE_POSSIBLE_NOT_FIT',
  'MEASURED_CIRCUMFERENCE_CLEARANCE_POSSIBLE_NOT_FIT'
 ]);
});
test('garment definitely smaller than body at waist is reported not hidden',()=>{
 const x=fixture();x.measurements.physicalCircumferenceSections[0]
  .garmentCircumferenceMm=700;
 const r=assess(x);safe(r);
 assert.equal(r.decision,'BLOCKED_MEASURED_GARMENT_DIMENSIONAL_DEFICIT');
 assert.deepEqual(r.anatomicalSectionsWithDefiniteMeasuredDeficit,['waist']);
 assert.ok(r.conditionalMeasuredGarmentBodyEase[0].maximumPossibleEaseMm<0);
});
test('measurement uncertainty crossing zero is labelled unresolved rather than a fit pass',()=>{
 const x=fixture();x.measurements.physicalCircumferenceSections[0]
  .garmentCircumferenceMm=752;
 const r=assess(x);safe(r);
 assert.equal(r.conditionalMeasuredGarmentBodyEase[0].classification,
  'MEASURED_CLEARANCE_UNCERTAIN');
});
test('independent original third landmark falsifies a plausible two-anchor rig scale',()=>{
 const x=fixture();
 x.measurements.rigMetricIndependentHoldout.measuredMm=750;
 const r=assess(x);safe(r);
 assert.equal(r.decision,'BLOCKED_INDEPENDENT_WEARER_RIG_HOLDOUT_CONTRADICTION');
});
test('two source-scale anatomical landmarks contradict one another',()=>{
 const x=fixture();
 x.measurements.rigMetricAnchors[1].measuredMm=550;
 const r=assess(x);safe(r);
 assert.equal(r.decision,'BLOCKED_CONTRADICTORY_RIG_METRIC_ANCHORS');
});
test('source or rig SHA or source revision drift prevents cross-user metric fitting',()=>{
 for(const change of [
  x=>x.measurements.sourcePhotoSHA256='c'.repeat(64),
  x=>x.measurementTrust.originalRigSHA256='c'.repeat(64),
  x=>x.measurements.sourceRevision='changed-source',
  x=>x.measurementTrust.activeOwnerLeaseVerifiedByTrustedCaller=false,
  x=>x.measurementTrust.independentlyAuthenticatedMeasurementSpecimens=false
 ]){
  const x=fixture();change(x);const r=assess(x);safe(r);
  assert.equal(r.decision,'BLOCKED_OWNER_SOURCE_RIG_AND_MEASUREMENTS_NOT_AUTHENTICATED');
 }
});
test('original photo byte identity is independently checked, not accepted from a self-reported SHA',()=>{
 for(const change of [
  x=>x.independentSourceWitness.originalPhotoSHA256='f'.repeat(64),
  x=>x.independentSourceWitness.imageId=0,
  x=>x.independentSourceWitness.originalBytesRehashedByNativeCaller=false,
  x=>x.source.originalPhotoSHA256='not-a-hash'
 ]){
  const x=fixture();change(x);const r=assess(x);safe(r);
  assert.equal(r.decision,'BLOCKED_ORIGINAL_GARMENT_SOURCE_IDENTITY_MISSING');
 }
});
test('wrong anatomical model, wrong original GLB or missing 163 bones cannot be fitted',()=>{
 for(const change of [
  x=>x.licensedRig.actualOriginalBoneCount=162,
  x=>x.independentRigWitness.sha256='c'.repeat(64),
  x=>x.independentRigWitness.kind='male',
  x=>x.independentRigWitness.actualOriginalRigSourcePositionsVerified=false
 ]){
  const x=fixture();change(x);const r=assess(x);safe(r);
  assert.equal(r.decision,'BLOCKED_GENUINE_LICENSED_RIG_PROVENANCE_MISSING');
 }
});
test('true native original photo and real licensed rig without real user measurement must block',()=>{
 const x=fixture();delete x.measurements;
 const r=assess(x);safe(r);
 assert.equal(r.decision,'BLOCKED_NO_REAL_GARMENT_OR_WEARER_MEASUREMENTS');
 assert.equal(r.actualLicensed163BoneRigKind,'female');
 assert.equal(r.licensedOriginalRigNotPhysicalWearerMeasurement,true);
});
test('fake exact flat widths cannot masquerade as body/garment circumferences',()=>{
 for(const change of [
  x=>x.measurements.physicalCircumferenceSections[0]
   .measuredAsCompleteClosedCircumference=false,
  x=>x.measurements.physicalCircumferenceSections[0].garmentCircumferenceMm=0,
  x=>x.measurements.physicalCircumferenceSections[1].bodyCircumferenceMm=NaN,
  x=>x.measurements.physicalCircumferenceSections[0].garmentUncertaintyMm=999,
  x=>x.measurements.physicalCircumferenceSections.pop()
 ]){
  const x=fixture();change(x);const r=assess(x);safe(r);
  assert.equal(r.decision,
   'BLOCKED_MISSING_DIRECT_MEASURED_MATCHED_BODY_GARMENT_SECTIONS');
 }
});
test('required anatomical levels differ by garment category and cannot be swapped',()=>{
 for(const [type,levels] of Object.entries({
  top:['chest','waist'],jacket:['chest','waist'],
  skirt:['waist','hip'],trousers:['waist','hip'],
  dress:['chest','waist','hip']})){
  const x=fixture();x.measurements.garmentType=type;
  x.measurements.physicalCircumferenceSections=levels.map(l=>sec(l,900,1000));
  const r=assess(x);safe(r);
  assert.equal(r.conditionalMeasuredGarmentBodyEase.length,levels.length);
 }
 const x=fixture();x.measurements.physicalCircumferenceSections.reverse();
 assert.equal(assess(x).decision,
  'BLOCKED_MISSING_DIRECT_MEASURED_MATCHED_BODY_GARMENT_SECTIONS');
});
test('too few independent body references or duplicate landmarks never establish a scale',()=>{
 for(const change of [
  x=>x.measurements.rigMetricAnchors.pop(),
  x=>x.measurements.rigMetricIndependentHoldout.landmark='shoulder',
  x=>x.measurements.rigMetricAnchors[0].rigB=[0,0,0],
  x=>x.measurements.rigMetricAnchors[1].uncertaintyMm=1000
 ]){
  const x=fixture();change(x);const r=assess(x);safe(r);
  assert.ok(r.decision.startsWith('BLOCKED_'));
  assert.equal(r.metricRigScaleIntervalMmPerRigUnit,undefined);
 }
});
test('unsupported garment category cannot silently default to skirt or top',()=>{
 const x=fixture();x.measurements.garmentType='unknown-shoe';
 const r=assess(x);safe(r);
 assert.equal(r.decision,'BLOCKED_UNSUPPORTED_MEASURED_GARMENT_TYPE');
});
test('inputs are never modified, and no actual body measurements appear in default output',()=>{
 const x=fixture(),serialized=JSON.stringify(x);
 assess(x);
 assert.equal(JSON.stringify(x),serialized);
});

test('different labels and reversed endpoints cannot reuse the same metric span',()=>{
 for(const variant of ['holdout','reversed-holdout','anchors']){
  const x=fixture(),m=x.measurements;
  if(variant==='anchors')m.rigMetricAnchors[1]={...m.rigMetricAnchors[0],landmark:'shoulder'};
  else{
   const a=m.rigMetricAnchors[1];
   m.rigMetricIndependentHoldout={...a,landmark:'torso'};
   if(variant==='reversed-holdout'){
    m.rigMetricIndependentHoldout.rigA=a.rigB;
    m.rigMetricIndependentHoldout.rigB=a.rigA;
   }
  }
  const r=assess(x);safe(r);
  assert.equal(r.decision,'BLOCKED_REUSED_RIG_LANDMARK_SPAN');
  assert.equal(r.metricRigScaleIntervalMmPerRigUnit,undefined);
 }
});
test('sparse measurement arrays fail closed without emitting a partial metric report',()=>{
 for(const [change,expected] of [
  [x=>{delete x.measurements.rigMetricAnchors[0];},'BLOCKED_MISSING_DISTINCT_REAL_BODY_RIG_LANDMARKS'],
  [x=>{delete x.measurements.rigMetricAnchors[0].rigA[0];},'BLOCKED_MISSING_DISTINCT_REAL_BODY_RIG_LANDMARKS'],
  [x=>{delete x.measurements.physicalCircumferenceSections[0];},'BLOCKED_MISSING_DIRECT_MEASURED_MATCHED_BODY_GARMENT_SECTIONS']
 ]){
  const x=fixture();change(x);const r=assess(x);safe(r);
  assert.equal(r.decision,expected);
  assert.equal(r.metricRigScaleIntervalMmPerRigUnit,undefined);
  assert.equal(r.conditionalMeasuredGarmentBodyEase,undefined);
 }
});

test('sampled source geometry distinguishes rigid motion, stretch, compression and collapse',()=>{
 const rest=[0,0,0,1,0,0,0,1,0],indices=[0,1,2];
 const poses=[[2,3,4,2,4,4,1,3,4],[0,0,0,2,0,0,0,2,0],
  [0,0,0,.5,0,0,0,.5,0],[0,0,0,1,0,0,2,0,0]];
 const input={rest,poses,indices,expectedFaces:1,expectedVertices:3},before=JSON.stringify(input);
 const r=audit(input);safe(r);assert.equal(JSON.stringify(input),before);
 const [rigid,stretch,compression,collapse]=r.sampledPoseDistortion;
 assert.equal(rigid.minimumEdgeLengthRatio,1);assert.equal(rigid.edgesOutsideResearchBand,0);
 assert.equal(stretch.maximumEdgeLengthRatio,2);assert.equal(stretch.maximumTriangleAreaRatio,4);
 assert.equal(compression.minimumEdgeLengthRatio,.5);assert.equal(compression.minimumTriangleAreaRatio,.25);
 assert.equal(collapse.collapsedFaces,1);assert.equal(collapse.minimumTriangleAreaRatio,0);
 assert.equal(r.continuousMotionOrMaterialStrainCertified,false);
 assert.equal(r.arbitraryResearchBandNotPhysicalFabricLimit,true);
});
test('sampled geometry audit counts shared indexed edges once and refuses missing or invalid source buffers',()=>{
 const rest=[0,0,0,1,0,0,0,1,0,1,1,0],indices=[0,1,2,1,3,2];
 const fixture=()=>({rest:[...rest],poses:[[...rest]],indices:[...indices],expectedFaces:2,expectedVertices:4});
 const good=audit(fixture());safe(good);assert.equal(good.uniqueOriginalFrontEdges,5);
 for(const change of [
  x=>{delete x.poses[0];},x=>{delete x.rest[0];},x=>{x.poses[0][0]=NaN;},
  x=>{x.indices[0]=4;},x=>{x.indices[0]=1;},x=>{x.rest[3]=0;},
  x=>{x.expectedFaces=1;},x=>{x.poses=[];}
 ]){
  const x=fixture();change(x);const r=audit(x);safe(r);
  assert.equal(r.decision,'BLOCKED_INVALID_SAMPLED_ORIGINAL_FRONT_GEOMETRY');
  assert.equal(r.sampledPoseDistortion,undefined);
 }
});
