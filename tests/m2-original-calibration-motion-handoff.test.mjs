import test from 'node:test';
import assert from 'node:assert/strict';
import {adjudicateOriginalPhotoCalibrationAndContact as audit}
 from '../research/mission2-integration/original-calibration-contact-adjudication.mjs';

// STRUCTURAL UNIT TEST ONLY. True original photo, original GLB and BOTH
// browser receipts are checked independently by a dedicated native CI script.
const jpeg='a'.repeat(64),body='b'.repeat(64);
const trustedPhoto={sha256:jpeg,width:192,height:149,orientation:1};
const trustedRig={sha256:body,kind:'female'};
const depth={decision:'BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT',
 originalFrontFaceCount:35262,originalBodyFaceCount:109064,
 allSubmittedOriginalFacesIndexed:true,consumer3DAdmitted:false,
 physicallyCalibratedSourceFit:false,depthIntervalIsUnmeasuredCounterfactual:true,
 researchSourceFrontDepthIntervalRigUnits:[-.5,0]};
const baseline={decision:'RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT',
 originalFrontFaceCount:35262,originalBodyFaceCount:109064,
 allSubmittedOriginalFacesIndexed:true,consumer3DAdmitted:false,
 physicallyCalibratedSourceFit:false};
const motion={schema:'M2-original-Met-front-and-licensed-163bone-all-indexed-true-spine04-continuum-research/v1',
 originalMetImageId:2551406,originalJPEG_SHA256:jpeg,
 actualLicensedOriginalGLBSHA256:body,actualLicensed163boneRigKind:'female',
 originalSourceFrontIndexedFaces:35262,originalBodyIndexedFaces:109064,
 actualFiveGenuineSpine04AnglesDegrees:[-12,-6,0,6,12],
 trueOriginalFullIndexedFrontAndBodyVertexPosesGenerated:true,
 historicalZeroSeedFaultActuallyExcluded:true,
 trueOriginalSourceAndRigXYZUsedNotZeroVectors:true,
 provenanceOriginalJPEGAndGLBExternallySHAProvedByNativeHarness:true,
 actualAllOriginalIndexedAngularBroadphase:baseline,
 actualAllOriginalIndexedDepthUncertaintySweptBVH:depth,
 unmeasuredCameraAxisDepthIntervalRigUnits:[-.5,0],
 unmeasuredCounterfactualDepthNotCameraCalibrated:true,
 sourceCameraScaleMetricUnknown:true,originalGarmentActualBackUnseen:true,
 noApprovedGarmentAlpha:true,noMeasuredFabricSample:true,
 consumer3DAdmitted:false,familyAlpha:'HOLD'};
const evidence={status:'NOT_VERIFIED',evidenceClass:'unverified',
 original:trustedPhoto,consumer3DAdmitted:false,
 originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD'};
const handoff={contract:'parallel107-calibration-v1',evidence,
 fitGateInput:{originalPhotoSHA256:jpeg},
 consumer3DAdmitted:false,originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD'};
const input=()=>({calibrationHandoff:handoff,trustedPhoto,trustedRig,motionReceipt:motion});
const clone=x=>JSON.parse(JSON.stringify(x));
const check=(x,status)=>{assert.equal(x.decision,status);
 assert.equal(x.consumer3DAdmitted,false);
 assert.equal(x.sourceOriginalPhoto2DFallbackRequired,true);
 assert.equal(x.familyAlpha,'HOLD');
 assert.equal(x.realGarmentMetricFitCertified,false);
 assert.equal(x.realWorldBodyRegistrationCertified,false);
 assert.equal(x.continuousAllJointFabricMotionCertified,false);
};
test('same pinned photo and all-face motion still BLOCK real metric fitting',()=>{
 const x=audit(input());
 check(x,'BLOCKED_REAL_PHYSICAL_MEASUREMENT_AND_FIT_PENDING');
 assert.equal(x.inputsAcceptedForResearchOnly,true);
 assert.equal(x.trueOriginalFrontFacesCompared,35262);
 assert.equal(x.trueOriginalBodyFacesCompared,109064);
 assert.equal(x.physicalScaleMillimetersPerRigUnit,null);
 assert.equal(x.realContactGateDecision,'BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT');
});
test('foreign source measurement cannot ride another public source photo',()=>{
 const a=clone(input());a.calibrationHandoff.evidence.original.sha256='c'.repeat(64);
 check(audit(a),'BLOCKED_DIFFERENT_ORIGINAL_JPEG');
});
test('original digest is insufficient if orientation or dimensions do not match',()=>{
 for(const [key,value] of [['orientation',6],['width',400],['height',300]]){
  const a=clone(input());a.calibrationHandoff.evidence.original[key]=value;
  check(audit(a),'BLOCKED_DIFFERENT_ORIGINAL_JPEG');
 }
});
test('synthetic owner-ruler math is never calibrated wearable approval',()=>{
 const a=clone(input());
 a.calibrationHandoff.evidence.status='SYNTHETIC_REFERENCE_CHECK_PASSED';
 a.calibrationHandoff.evidence.evidenceClass='synthetic';
 check(audit(a),'BLOCKED_SYNTHETIC_REFERENCE_NOT_WEARABLE_EVIDENCE');
});
test('forged producer or consumer 3D authorization cannot be laundered',()=>{
 const a=clone(input());a.calibrationHandoff.consumer3DAdmitted=true;
 check(audit(a),'BLOCKED_NO_VALID_PARALLEL107_HANDOFF');
 const b=clone(input());b.motionReceipt.consumer3DAdmitted=true;
 check(audit(b),'BLOCKED_INCOMPLETE_OR_MUTATED_SWEEP_SAFETY_RECEIPT');
});
test('wrong rig original source cannot share a motion acceptance',()=>{
 for(const key of ['originalJPEG_SHA256','actualLicensedOriginalGLBSHA256']){
  const a=clone(input());a.motionReceipt[key]='f'.repeat(64);
  check(audit(a),'BLOCKED_FOREIGN_OR_UNAUTHENTICATED_ORIGINAL_MOTION_SOURCE');
 }
});
test('missing original complete front/body face scope is never complete',()=>{
 const a=clone(input());a.motionReceipt.originalSourceFrontIndexedFaces=96;
 check(audit(a),'BLOCKED_INCOMPLETE_OR_FALSE_TRUE_ORIGINAL_GEOMETRY_CLAIM');
 const b=clone(input());b.motionReceipt.actualAllOriginalIndexedDepthUncertaintySweptBVH
  .allSubmittedOriginalFacesIndexed=false;
 check(audit(b),'BLOCKED_INCOMPLETE_OR_MUTATED_SWEEP_SAFETY_RECEIPT');
});
test('turning unmeasured counterfactual depth into measured scale is rejected',()=>{
 const a=clone(input());a.motionReceipt.unmeasuredCounterfactualDepthNotCameraCalibrated=false;
 check(audit(a),'BLOCKED_UNTRUSTED_DEPTH_INTERVAL_OR_FAKE_MEASURED_SCALE');
 const b=clone(input());b.motionReceipt.actualAllOriginalIndexedDepthUncertaintySweptBVH
  .researchSourceFrontDepthIntervalRigUnits=[0,0];
 check(audit(b),'BLOCKED_UNTRUSTED_DEPTH_INTERVAL_OR_FAKE_MEASURED_SCALE');
});
test('even a forged no-contact sweep is never a garment clearance',()=>{
 const a=clone(input());a.motionReceipt.actualAllOriginalIndexedDepthUncertaintySweptBVH
  .decision='RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT';
 check(audit(a),'BLOCKED_DEPTH_SWEEP_DECISION_FORGED_OR_NOT_PROVEN');
});
test('serialized record cannot self authenticate active owner session',()=>{
 const a=clone(input());a.activeOwnerSessionLease={
  ownerId:'synthetic-owner',sessionId:'synthetic-session',
  revision:'synthetic-revision',expiresAt:9999999999999
 };
 check(audit(a),'BLOCKED_REAUTHENTICATE_OWNER_SESSION_AT_FINAL_GATE');
});
test('unreviewed mask, phantom rear or camera dimensions must not self-attest',()=>{
 for(const key of ['independentCameraToRigCalibration','approvedFrontMask',
   'verifiedGarmentRear','calibratedMaterialSample']){
  const a=clone(input());a[key]={verified:true};
  check(audit(a),'BLOCKED_UNVERIFIED_EXTERNAL_PHYSICAL_EVIDENCE');
 }
});
test('invalid source and missing producer remain blocked without leaking owner data',()=>{
 check(audit({}),'BLOCKED_MISSING_INDEPENDENT_ORIGINAL_PHOTO_AND_RIG_IDENTITY');
 const a=clone(input());a.calibrationHandoff=null;
 check(audit(a),'BLOCKED_NO_VALID_PARALLEL107_HANDOFF');
 const b=clone(input());b.trustedPhoto.sha256='invalid';
 check(audit(b),'BLOCKED_MISSING_INDEPENDENT_ORIGINAL_PHOTO_AND_RIG_IDENTITY');
});
