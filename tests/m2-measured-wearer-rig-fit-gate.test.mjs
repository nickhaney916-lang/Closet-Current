import test from 'node:test';
import assert from 'node:assert/strict';
import {assessMetricGarmentToWearerFit as assess,auditSampledOriginalFrontProportions as audit,trialBoundedOriginalFrontCorrection as correct,trialCoordinatedOriginalFrontCorrection as coordinate,trialProgressiveOriginalFrontStabilization as progressive,trialObstacleGuardedOriginalFrontStabilization as guarded}
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

test('bounded local edge correction identifies original indexed witnesses and improves a distorted copy',()=>{
 const rest=[0,0,0,1,0,0,0,1,0],pose=[0,0,0,2,0,0,0,1,0],indices=[0,1,2];
 const input={rest,pose,indices,expectedFaces:1,expectedVertices:3},original=JSON.stringify(input);
 const r=correct(input);safe(r);
 assert.equal(r.decision,'RESEARCH_ONLY_BOUNDED_EDGE_CORRECTION_CANDIDATE');
 assert.deepEqual(r.before.worstOriginalEdge.vertexIndices,[0,1]);
 assert.deepEqual(r.before.worstOriginalFace.vertexIndices,[0,1,2]);
 assert.equal(r.before.maximumEdgeLengthRatio,2);
 assert.equal(r.after.maximumEdgeLengthRatio,1.96);
 assert.equal(r.after.maximumTriangleAreaRatio,1.96);
 assert.equal(r.maximumEndpointDisplacementRigUnits,.02);
 assert.equal(r.correctedPose[0]+r.correctedPose[3],pose[0]+pose[3]);
 assert.equal(r.correctedPose[6],pose[6]);
 assert.equal(JSON.stringify(input),original);
 assert.equal(r.correctionAppliedToLiveMesh,false);
 assert.equal(r.materialOrCollisionCertified,false);
});
test('bounded correction rejects rigid, collapsed, invalid and unimproved global shape',()=>{
 const rest=[0,0,0,1,0,0,0,1,0],indices=[0,1,2];
 for(const [pose,expected] of [
  [[2,3,4,2,4,4,1,3,4],'RESEARCH_ONLY_NO_SAFE_EDGE_CORRECTION_ATTEMPT'],
  [[0,0,0,1,0,0,2,0,0],'RESEARCH_ONLY_NO_SAFE_EDGE_CORRECTION_ATTEMPT'],
  [[NaN,0,0,1,0,0,0,1,0],'BLOCKED_INVALID_SAMPLED_ORIGINAL_FRONT_GEOMETRY'],
  [[0,0,0,2,0,0,0,2,0],'RESEARCH_ONLY_CORRECTION_REJECTED_NO_GLOBAL_IMPROVEMENT']
 ]){
  const r=correct({rest,pose,indices,expectedFaces:1,expectedVertices:3});safe(r);
  assert.equal(r.decision,expected);assert.equal(r.correctedPose,null);
  assert.equal(r.correctionAppliedToLiveMesh,false);
 }
});

test('coordinated correction improves adjacent stretched faces where single edge fails',()=>{
 const rest=[0,0,0,1,0,0,0,1,0,1,1,0],pose=[0,0,0,2,0,0,0,2,0,2,2,0],indices=[0,1,2,1,3,2];
 const x={rest,pose,indices,expectedFaces:2,expectedVertices:4},original=JSON.stringify(x);
 assert.equal(correct(x).correctedPose,null);
 const r=coordinate(x);safe(r);
 assert.equal(r.decision,'RESEARCH_ONLY_COORDINATED_CORRECTION_CANDIDATE');
 assert.equal(r.selectedDistortedEdges,5);assert.equal(r.movedVertices,4);
 assert.ok(r.after.maximumEdgeLengthRatio<2);
 assert.ok(r.after.maximumTriangleAreaRatio<4);
 assert.ok(r.maximumVertexStepFractionOfShortestIncidentRestEdge<=.020000000001);
 assert.equal(r.trials.at(-1).newBadEdges,0);assert.equal(r.trials.at(-1).newBadFaces,0);
 assert.equal(r.trials.at(-1).flippedOrOrthogonalFaces,0);
 assert.equal(JSON.stringify(x),original);
 assert.equal(r.correctionAppliedToLiveMesh,false);
});
test('coordinated correction refuses new neighboring distortion despite backtracking',()=>{
 const rest=[0,0,0,1,0,0,0,1,0,1,1,0],pose=[0,0,0,1.2,0,0,0,.9,0,.8,1,0],indices=[0,1,2,1,3,2];
 const r=coordinate({rest,pose,indices,expectedFaces:2,expectedVertices:4});safe(r);
 assert.equal(r.decision,'RESEARCH_ONLY_COORDINATED_CORRECTION_REJECTED');
 assert.equal(r.correctedPose,null);assert.equal(r.trials.length,4);
 assert.ok(r.trials.every(t=>t.newBadEdges>0));
});
test('coordinated correction refuses undistorted, collapsed and invalid inputs',()=>{
 const rest=[0,0,0,1,0,0,0,1,0],indices=[0,1,2];
 for(const [pose,expected] of [[rest,'RESEARCH_ONLY_NO_COORDINATED_CORRECTION_ATTEMPT'],
  [[0,0,0,1,0,0,2,0,0],'RESEARCH_ONLY_NO_COORDINATED_CORRECTION_ATTEMPT'],
  [[NaN,0,0,1,0,0,0,1,0],'BLOCKED_INVALID_SAMPLED_ORIGINAL_FRONT_GEOMETRY']]){
  const r=coordinate({rest,pose,indices,expectedFaces:1,expectedVertices:3});safe(r);
  assert.equal(r.decision,expected);assert.equal(r.correctedPose,null);
 }
});

test('progressive stabilization improves multiple passes but never rebases cumulative travel',()=>{
 const rest=[0,0,0,1,0,0,0,1,0,1,1,0],pose=[0,0,0,2,0,0,0,2,0,2,2,0],indices=[0,1,2,1,3,2];
 const x={rest,pose,indices,expectedFaces:2,expectedVertices:4},original=JSON.stringify(x);
 const r=progressive(x);safe(r);
 assert.equal(r.decision,'RESEARCH_ONLY_PROGRESSIVE_STABILIZATION_CANDIDATE');
 assert.equal(r.passes.length,2);assert.equal(r.stopReason,'CUMULATIVE_TRAVEL_LIMIT');
 assert.ok(r.after.maximumEdgeLengthRatio<r.passes[0].maximumEdgeLengthRatio);
 assert.ok(r.after.maximumTriangleAreaRatio<r.passes[0].maximumTriangleAreaRatio);
 assert.ok(r.maximumCumulativeTravelFraction<=.05);
 assert.ok(r.passes[1].maximumCumulativeTravelFraction>r.passes[0].maximumCumulativeTravelFraction);
 const first=coordinate(x),second=coordinate({...x,pose:first.correctedPose});
 assert.deepEqual(Array.from(r.correctedPose),Array.from(second.correctedPose));
 assert.equal(JSON.stringify(x),original);
 assert.equal(r.correctionAppliedToLiveMesh,false);
 assert.equal(r.materialOrCollisionCertified,false);
});
test('progressive stabilization refuses a neighboring-region regression without changing source',()=>{
 const rest=[0,0,0,1,0,0,0,1,0,1,1,0],pose=[0,0,0,1.2,0,0,0,.9,0,.8,1,0],indices=[0,1,2,1,3,2];
 const x={rest,pose,indices,expectedFaces:2,expectedVertices:4},original=JSON.stringify(x);
 const r=progressive(x);safe(r);assert.equal(r.correctedPose,null);
 assert.equal(r.stopReason,'RESEARCH_ONLY_COORDINATED_CORRECTION_REJECTED');
 assert.equal(r.passes.length,0);assert.equal(JSON.stringify(x),original);
});
test('progressive stabilization never alters rigid or invalid geometry',()=>{
 const rest=[0,0,0,1,0,0,0,1,0],indices=[0,1,2];
 for(const pose of [rest,[0,0,0,1,0,0,2,0,0],[NaN,0,0,1,0,0,0,1,0]]){
  const r=progressive({rest,pose,indices,expectedFaces:1,expectedVertices:3});safe(r);
  assert.equal(r.correctedPose,null);
 }
});

test('fixed body and layer swept bound guard preserves safe detached corrections',()=>{
 const x={rest:[0,0,0,1,0,0,0,1,0,1,1,0],pose:[0,0,0,2,0,0,0,2,0,2,2,0],indices:[0,1,2,1,3,2],expectedFaces:2,expectedVertices:4};
 const body={kind:'body',vertices:[0,0,3,2,0,3,0,2,3],indices:[0,1,2]};
 const layer={...body,kind:'layer',vertices:[0,0,-3,2,0,-3,0,2,-3]};
 const input={...x,obstacles:[body,layer]},original=JSON.stringify(input);
 const r=guarded(input);safe(r);assert.equal(r.passes.length,2);
 assert.equal(r.fixedObstacleFacesIndexed,2);assert.equal(r.suppliedLayerCount,1);
 assert.ok(r.correctionSegmentObstacleReceipts.every(p=>p.clear&&p.movingFacesExamined===2));
 assert.deepEqual(Array.from(r.correctedPose),Array.from(progressive(x).correctedPose));
 assert.equal(r.fullLayeredOutfitCollisionCertified,false);assert.equal(JSON.stringify(input),original);
});
test('unresolved swept body or layer overlap refuses correction with exact indexed witness',()=>{
 const x={rest:[0,0,0,1,0,0,0,1,0,1,1,0],pose:[0,0,0,2,0,0,0,2,0,2,2,0],indices:[0,1,2,1,3,2],expectedFaces:2,expectedVertices:4};
 const body={kind:'body',vertices:[0,0,3,2,0,3,0,2,3],indices:[0,1,2]};
 const near={vertices:[.5,.5,0,1,.5,0,.5,1,0],indices:[0,1,2]};
 for(const kind of ['body','layer']){
  const obstacles=kind==='body'?[{...near,kind}]:[body,{...near,kind}];
  const r=guarded({...x,obstacles});safe(r);assert.equal(r.correctedPose,null);
  assert.equal(r.stopReason,'SWEPT_OBSTACLE_OVERLAP_UNRESOLVED');
  assert.equal(r.correctionSegmentObstacleReceipts[0].obstacleKind,kind);
  assert.equal(r.correctionSegmentObstacleReceipts[0].frontFaceOrdinal,0);
  assert.equal(r.correctionSegmentObstacleReceipts[0].obstacleFaceOrdinal,0);
 }
});
test('obstacle guard refuses absent body, malformed bounds and out-of-range indices',()=>{
 const x={rest:[0,0,0,1,0,0,0,1,0],pose:[0,0,0,2,0,0,0,1,0],indices:[0,1,2],expectedFaces:1,expectedVertices:3};
 const body={kind:'body',vertices:[0,0,3,2,0,3,0,2,3],indices:[0,1,2]};
 for(const obstacles of [[],[{...body,kind:'layer'}],[body,body],[{...body,indices:[0,1,3]}],[{...body,vertices:[NaN,...body.vertices.slice(1)]}]]){
  const r=guarded({...x,obstacles});safe(r);assert.equal(r.correctedPose,null);
  assert.ok(r.decision.startsWith('BLOCKED_'));
 }
});

test('strict swept projection clears harmless overlapping bounding boxes, not unresolved contacts',()=>{
 const x={rest:[0,0,0,1,0,0,0,1,0],pose:[0,0,0,2,0,0,0,1,0],indices:[0,1,2],expectedFaces:1,expectedVertices:3};
 const far={kind:'body',vertices:[1.6,.8,0,1.8,.8,0,1.6,.9,0],indices:[0,1,2]};
 const near={kind:'layer',vertices:[.2,.2,0,.4,.2,0,.2,.4,0],indices:[0,1,2]};
 const input={...x,obstacles:[far]},original=JSON.stringify(input);
 const r=guarded(input);safe(r);
 assert.equal(r.decision,'RESEARCH_ONLY_PROGRESSIVE_STABILIZATION_CANDIDATE');
 assert.equal(r.conservativeSweptProjectionSeparation,true);
 assert.ok(r.passes.length>0);
 assert.ok(r.correctionSegmentObstacleReceipts.every(p=>p.clear&&p.separatedSweptPairs===1&&p.broadphasePairsExamined===1));
 assert.equal(JSON.stringify(input),original);
 const blocked=guarded({...x,obstacles:[far,near]});safe(blocked);
 assert.equal(blocked.correctedPose,null);
 const w=blocked.correctionSegmentObstacleReceipts[0];
 assert.equal(w.clear,false);assert.equal(w.separatedSweptPairs,1);
 assert.equal(w.broadphasePairsExamined,2);assert.equal(w.obstacleKind,'layer');
});
test('swept projection never clears touching or near ambiguous coplanar bounds',()=>{
 const x={rest:[0,0,0,1,0,0,0,1,0],pose:[0,0,0,2,0,0,0,1,0],indices:[0,1,2],expectedFaces:1,expectedVertices:3};
 for(const z of [0,1e-10]){
  const body={kind:'body',vertices:[0,1,z,.1,1,z,0,1.1,z],indices:[0,1,2]};
  const r=guarded({...x,obstacles:[body]});safe(r);
  assert.equal(r.correctedPose,null);
  assert.equal(r.stopReason,'SWEPT_OBSTACLE_OVERLAP_UNRESOLVED');
 }
});

test('nonincident self-contact blocks correction even with distant body and records indexed witness',()=>{
 const body={kind:'body',vertices:[0,0,3,2,0,3,0,2,3],indices:[0,1,2]};
 const x={rest:[0,0,0,1,0,0,0,1,0,.2,.2,0,.4,.2,0,.2,.4,0],
  pose:[0,0,0,2,0,0,0,1,0,.2,.2,0,.4,.2,0,.2,.4,0],
  indices:[0,1,2,3,4,5],expectedFaces:2,expectedVertices:6,obstacles:[body]};
 const original=JSON.stringify(x),r=guarded(x);safe(r);
 assert.equal(r.correctedPose,null);assert.equal(r.stopReason,'SWEPT_NONINCIDENT_SELF_OVERLAP_UNRESOLVED');
 assert.equal(r.correctionSegmentObstacleReceipts.length,0);
 const w=r.correctionSegmentNonincidentSelfReceipts[0];
 assert.equal(w.clear,false);assert.equal(w.frontFaceOrdinal,0);assert.equal(w.otherFrontFaceOrdinal,1);
 assert.equal(w.movingFacesIndexed,1);assert.equal(w.budgetExceeded,false);
 assert.equal(JSON.stringify(x),original);
 const clear=guarded({...x,rest:x.rest.map((v,i)=>i>=9&&i%3===2?2:v),
  pose:x.pose.map((v,i)=>i>=9&&i%3===2?2:v)});
 safe(clear);assert.ok(clear.correctedPose);
 assert.ok(clear.correctionSegmentNonincidentSelfReceipts.every(p=>p.clear));
});
test('shared indexed topology uses a separate incident guard, never full physical foldover certification',()=>{
 const x={rest:[0,0,0,1,0,0,0,1,0,1,1,0],pose:[0,0,0,2,0,0,0,2,0,2,2,0],
  indices:[0,1,2,1,3,2],expectedFaces:2,expectedVertices:4,
  obstacles:[{kind:'body',vertices:[0,0,3,2,0,3,0,2,3],indices:[0,1,2]}]};
 const r=guarded(x);safe(r);assert.ok(r.correctedPose);
 assert.ok(r.correctionSegmentNonincidentSelfReceipts.every(p=>p.clear&&p.incidentPairsExcluded===1));
 assert.equal(r.incidentFaceFoldoverOrStationarySelfContactCertified,false);
 assert.equal(r.unchangedFaceOrSelfContactCertified,false);
});
test('two moving nonincident surfaces are checked against each other',()=>{
 const x={rest:[0,0,0,1,0,0,0,1,0,.2,.2,0,1.2,.2,0,.2,1.2,0],
  pose:[0,0,0,2,0,0,0,2,0,.2,.2,0,2.2,.2,0,.2,2.2,0],
  indices:[0,1,2,3,4,5],expectedFaces:2,expectedVertices:6,
  obstacles:[{kind:'body',vertices:[0,0,3,2,0,3,0,2,3],indices:[0,1,2]}]};
 const r=guarded(x);safe(r);assert.equal(r.correctedPose,null);
 assert.equal(r.stopReason,'SWEPT_NONINCIDENT_SELF_OVERLAP_UNRESOLVED');
 assert.equal(r.correctionSegmentNonincidentSelfReceipts[0].movingFacesIndexed,2);
 assert.equal(r.correctionSegmentNonincidentSelfReceipts[0].broadphasePairsExamined,1);
});

test('incident shared-edge foldover blocks correction while an ordinary seam is separated',()=>{
 const body={kind:'body',vertices:[0,0,3,2,0,3,0,2,3],indices:[0,1,2]};
 const x={rest:[0,0,0,1,0,0,0,1,0,1,1,0],pose:[0,0,0,2,0,0,0,2,0,2,2,0],
  indices:[0,1,2,1,3,2],expectedFaces:2,expectedVertices:4,obstacles:[body]};
 const clear=guarded(x);safe(clear);assert.ok(clear.correctedPose);
 assert.ok(clear.correctionSegmentNonincidentSelfReceipts.every(p=>p.clear&&p.incidentPairsSeparated===1));
 const folded={...x,rest:[0,0,0,1,0,0,0,1,0,.3,.3,0],pose:[0,0,0,2,0,0,0,2,0,.6,.6,0]};
 const original=JSON.stringify(folded),r=guarded(folded);safe(r);
 assert.equal(r.correctedPose,null);assert.equal(r.stopReason,'SWEPT_INCIDENT_FOLDOVER_UNRESOLVED');
 const w=r.correctionSegmentNonincidentSelfReceipts[0];
 assert.equal(w.incidentPairsExcluded,1);assert.equal(w.incidentPairsSeparated,0);
 assert.equal(w.frontFaceOrdinal,0);assert.equal(w.otherFrontFaceOrdinal,1);
 assert.equal(JSON.stringify(folded),original);
});
test('shared-vertex rays must remain strictly separated throughout correction',()=>{
 const body={kind:'body',vertices:[0,0,3,2,0,3,0,2,3],indices:[0,1,2]};
 const x={rest:[0,0,0,1,0,0,0,1,0,-1,0,0,0,-1,0],
  pose:[0,0,0,2,0,0,0,2,0,-2,0,0,0,-2,0],indices:[0,1,2,0,3,4],
  expectedFaces:2,expectedVertices:5,obstacles:[body]};
 const clear=guarded(x);safe(clear);assert.ok(clear.correctedPose);
 assert.equal(clear.incidentMovingFaceFoldoverGuardEnabled,true);
 assert.ok(clear.correctionSegmentNonincidentSelfReceipts.every(p=>p.incidentPairsSeparated===1));
 const sameSide={...x,rest:[0,0,0,1,0,0,0,1,0,.5,0,0,0,.5,0],
  pose:[0,0,0,2,0,0,0,2,0,1,0,0,0,1,0]};
 const bad=guarded(sameSide);safe(bad);assert.equal(bad.correctedPose,null);
 assert.equal(bad.stopReason,'SWEPT_INCIDENT_FOLDOVER_UNRESOLVED');
});
