/**
 * Closet Current Mission 2: independent contract compatibility gate.
 *
 * Read-only bridge between immutable Parallel 107 photo-measurement claims
 * and immutable P89 actual-original JPEG / licensed-163bone swept-geometry
 * browser evidence. NO consumer app, database, owner account, or fitted 3D.
 *
 * CRITICAL: a source SHA (or passed synthetic ruler arithmetic) is NOT a
 * camera-to-3D metric extrinsic, wearer measurement, mask, photographed rear,
 * cloth specimen, or signed approval. Fallback ALWAYS remains required.
 */
const SHA=/^[0-9a-f]{64}$/;
const validSha=x=>typeof x==='string'&&SHA.test(x);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exact=(v,a)=>Array.isArray(v)&&v.length===a.length&&
 v.every((x,i)=>x===a[i]);
const shape=(x,keys)=>obj(x)&&Object.keys(x).length===keys.length&&
 keys.every(k=>Object.hasOwn(x,k));
const forbidden={
 consumer3DAdmitted:false,sourceOriginalPhoto2DFallbackRequired:true,
 realGarmentMetricFitCertified:false,realWorldBodyRegistrationCertified:false,
 continuousAllJointFabricMotionCertified:false,familyAlpha:'HOLD'
};
const block=(decision,reasons=[],context={})=>({
 contract:'M2-original-photo-calibration-motion-handoff/RESEARCH/v1',
 decision,reasons,inputsAcceptedForResearchOnly:false,
 ...context,...forbidden
});
const trustedPhotoValid=p=>shape(p,['sha256','width','height','orientation'])&&
 validSha(p.sha256)&&Number.isSafeInteger(p.width)&&p.width>0&&
 p.width<=12000&&Number.isSafeInteger(p.height)&&p.height>0&&
 p.height<=12000&&Number.isSafeInteger(p.orientation)&&
 p.orientation>=1&&p.orientation<=8;
const sourceMatch=(p,q)=>trustedPhotoValid(p)&&trustedPhotoValid(q)&&
 ['sha256','width','height','orientation'].every(k=>p[k]===q[k]);

export function adjudicateOriginalPhotoCalibrationAndContact({
 calibrationHandoff,trustedPhoto,trustedRig,motionReceipt,
 activeOwnerSessionLease=null,
 independentCameraToRigCalibration=null,
 approvedFrontMask=null,verifiedGarmentRear=null,
 calibratedMaterialSample=null
}={}){
 if(!trustedPhotoValid(trustedPhoto)||!obj(trustedRig)||
  !validSha(trustedRig.sha256)||!['female','male'].includes(trustedRig.kind))
  return block('BLOCKED_MISSING_INDEPENDENT_ORIGINAL_PHOTO_AND_RIG_IDENTITY',
   ['trusted-original-source-or-licensed-rig-missing']);
 const binding={originalPhotoSHA256:trustedPhoto.sha256,
  licensedRigSHA256:trustedRig.sha256,licensedRigKind:trustedRig.kind};
 if(!obj(motionReceipt)||motionReceipt.schema!==
  'M2-original-Met-front-and-licensed-163bone-all-indexed-true-spine04-continuum-research/v1'||
  motionReceipt.originalMetImageId!==2551406||
  !validSha(motionReceipt.originalJPEG_SHA256)||
  motionReceipt.originalJPEG_SHA256!==trustedPhoto.sha256||
  motionReceipt.actualLicensedOriginalGLBSHA256!==trustedRig.sha256||
  motionReceipt.actualLicensed163boneRigKind!==trustedRig.kind)
  return block('BLOCKED_FOREIGN_OR_UNAUTHENTICATED_ORIGINAL_MOTION_SOURCE',
   ['motion-source-photo-or-rig-identity-not-locked'],binding);
 if(motionReceipt.originalSourceFrontIndexedFaces!==35262||
   motionReceipt.originalBodyIndexedFaces!==109064||
   !exact(motionReceipt.actualFiveGenuineSpine04AnglesDegrees,
    [-12,-6,0,6,12])||
   motionReceipt.trueOriginalFullIndexedFrontAndBodyVertexPosesGenerated!==true||
   motionReceipt.historicalZeroSeedFaultActuallyExcluded!==true||
   motionReceipt.trueOriginalSourceAndRigXYZUsedNotZeroVectors!==true||
   motionReceipt.provenanceOriginalJPEGAndGLBExternallySHAProvedByNativeHarness!==true)
  return block('BLOCKED_INCOMPLETE_OR_FALSE_TRUE_ORIGINAL_GEOMETRY_CLAIM',
   ['missing-original-full-indexed-or-163bone-coordinate-evidence'],binding);
 const baseline=motionReceipt.actualAllOriginalIndexedAngularBroadphase,
  depth=motionReceipt.actualAllOriginalIndexedDepthUncertaintySweptBVH;
 if(!obj(baseline)||!obj(depth)||
   baseline.originalFrontFaceCount!==35262||
   baseline.originalBodyFaceCount!==109064||
   depth.originalFrontFaceCount!==35262||
   depth.originalBodyFaceCount!==109064||
   baseline.allSubmittedOriginalFacesIndexed!==true||
   depth.allSubmittedOriginalFacesIndexed!==true||
   baseline.consumer3DAdmitted!==false||
   depth.consumer3DAdmitted!==false||
   baseline.physicallyCalibratedSourceFit!==false||
   depth.physicallyCalibratedSourceFit!==false||
   motionReceipt.consumer3DAdmitted!==false||
   motionReceipt.familyAlpha!=='HOLD')
  return block('BLOCKED_INCOMPLETE_OR_MUTATED_SWEEP_SAFETY_RECEIPT',
   ['invalid-original-motion-gate-or-release-assertion'],binding);
 if(!exact(motionReceipt.unmeasuredCameraAxisDepthIntervalRigUnits,
   [-.5,0])||
   !exact(depth.researchSourceFrontDepthIntervalRigUnits,[-.5,0])||
   depth.depthIntervalIsUnmeasuredCounterfactual!==true||
   motionReceipt.unmeasuredCounterfactualDepthNotCameraCalibrated!==true||
   motionReceipt.sourceCameraScaleMetricUnknown!==true||
   motionReceipt.originalGarmentActualBackUnseen!==true||
   motionReceipt.noApprovedGarmentAlpha!==true||
   motionReceipt.noMeasuredFabricSample!==true)
  return block('BLOCKED_UNTRUSTED_DEPTH_INTERVAL_OR_FAKE_MEASURED_SCALE',
   ['research-provisional-depth-must-stay-unmeasured'],binding);
 const blockedDepth=typeof depth.decision==='string'&&
  depth.decision.startsWith('BLOCKED_');
 if(!blockedDepth||
   !['BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT',
     'BLOCKED_UNRESOLVED_FULL_INDEXED_ANGULAR_CONTACT',
     'BLOCKED_ANGULAR_BVH_VISIT_BUDGET',
     'BLOCKED_ANGULAR_FACE_PAIR_BUDGET',
     'BLOCKED_ANGULAR_EXACT_SAMPLE_BUDGET'].includes(depth.decision))
  return block('BLOCKED_DEPTH_SWEEP_DECISION_FORGED_OR_NOT_PROVEN',
   ['measured-source-motion-contact-clearance-not-proven'],binding);
 if(!obj(calibrationHandoff)||calibrationHandoff.contract!==
  'parallel107-calibration-v1'||!obj(calibrationHandoff.evidence)||
   calibrationHandoff.consumer3DAdmitted!==false||
   calibrationHandoff.originalPhoto2DFallbackRequired!==true||
   calibrationHandoff.familyAlpha!=='HOLD')
  return block('BLOCKED_NO_VALID_PARALLEL107_HANDOFF',
   ['missing-or-modified-calibration-handoff'],binding);
 const evidence=calibrationHandoff.evidence;
 if(!obj(evidence.original)||!sourceMatch(evidence.original,trustedPhoto)||
  !shape(calibrationHandoff.fitGateInput||{},['originalPhotoSHA256'])||
  calibrationHandoff.fitGateInput.originalPhotoSHA256!==trustedPhoto.sha256)
  return block('BLOCKED_DIFFERENT_ORIGINAL_JPEG',
   ['parallel107-original-source-digest-or-orientation-does-not-match'],binding);
 if(evidence.consumer3DAdmitted!==false||
   evidence.originalPhoto2DFallbackRequired!==true||
   evidence.familyAlpha!=='HOLD')
  return block('BLOCKED_FORGED_PHOTO_CALIBRATION_ADMISSION',
   ['untrusted-approval-field-in-photo-evidence'],binding);
 // Handoff v1 contains neither the trusted lease nor a verifier signature.
 // Even if the producer already checked an active lease at evaluation time,
 // a serialized receipt cannot prove that the lease is CURRENT here.
 if(activeOwnerSessionLease!==null)
  return block('BLOCKED_REAUTHENTICATE_OWNER_SESSION_AT_FINAL_GATE',
   ['source-and-lease-consistency-is-not-authentication'],binding);
 if(evidence.evidenceClass==='synthetic'||
   evidence.status==='SYNTHETIC_REFERENCE_CHECK_PASSED')
  return block('BLOCKED_SYNTHETIC_REFERENCE_NOT_WEARABLE_EVIDENCE',
   ['arithmetic-demonstration-must-never-authorize-real-fitting'],binding);
 if(evidence.status!=='NOT_VERIFIED'||evidence.evidenceClass!=='unverified')
  return block('BLOCKED_UNRECOGNIZED_CALIBRATION_PROVENANCE',
   ['parallel107-never-attests-independent-real-camera-scale'],binding);
 if(independentCameraToRigCalibration!==null||approvedFrontMask!==null||
  verifiedGarmentRear!==null||calibratedMaterialSample!==null)
  return block('BLOCKED_UNVERIFIED_EXTERNAL_PHYSICAL_EVIDENCE',
   ['future-physical-evidence-cannot-self-attest-via-JSON'],binding);
 return block('BLOCKED_REAL_PHYSICAL_MEASUREMENT_AND_FIT_PENDING',
  ['source-sha-matches-but-independent-metric-registration-missing',
   'camera-focal-plane-and-wearer-rig-scale-unverified',
   'original-garment-rear-unknown',
   'original-photo-mask-not-human-approved',
   'fabric-specimen-and-multi-joint-drape-unverified',
   'counterfactual-depth-sweep-detects-real-contact'],{
   ...binding,
   inputsAcceptedForResearchOnly:true,
   trueOriginalFrontFacesCompared:35262,
   trueOriginalBodyFacesCompared:109064,
   sourceMatchedOnlyDoesNotAuthorizeWearable:true,
   realContactGateDecision:depth.decision,
   evidenceClass:'unverified',
   counterfactualResearchDepthIntervalRigUnits:[-.5,0],
   physicalScaleMillimetersPerRigUnit:null
  });
}
