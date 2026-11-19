/**
 * Genuine ORIGINAL museum-JPEG + licensed 163bone native browser receipt
 * reconciled with the ACTUAL immutable Parallel 107 producer module.
 * No private image/account, network or fabricated positive real fit.
 *
 * Requires read-only donor worktree at the immutable #1505 SHA and actual
 * P89 original source / body native browser run before invocation.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {adjudicateOriginalPhotoCalibrationAndContact as gate}
 from '../research/mission2-integration/original-calibration-contact-adjudication.mjs';
import {fittingHandoff,identifyOriginal}
 from '../.m2-immutable-p107-calibration/research/parallel107/calibration.mjs';
import {example,syntheticJpeg}
 from '../.m2-immutable-p107-calibration/research/parallel107/fixtures.mjs';

const originalMetSHA256=
 '780b082ff1408bc838d525364d95f455139e4c3c817fc39fe5dc1b756caca5c6';
const realRigHashes=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const original={sha256:originalMetSHA256,width:192,height:149,orientation:1};
const browser=process.env.P89_BROWSER||'chromium';
assert.ok(['chromium','webkit'].includes(browser),'native genuine browser required');
const folder='benchmark/parallel89-met-real-anatomy-uncalibrated-HOLD';
const originalExample=example(original);
const unverifiedProducer=fittingHandoff(
 JSON.stringify({...originalExample,references:[]}),original,null,'unverified');
const syntheticBoundMet=fittingHandoff(
 JSON.stringify(originalExample),original,null,'synthetic');
const foreignSyntheticOriginal=await identifyOriginal(await syntheticJpeg());
assert.notEqual(foreignSyntheticOriginal.sha256,original.sha256);
const foreignProducer=fittingHandoff(
 JSON.stringify(example(foreignSyntheticOriginal)),
 foreignSyntheticOriginal,null,'synthetic');
assert.equal(unverifiedProducer.contract,'parallel107-calibration-v1');
assert.equal(unverifiedProducer.evidence.status,'NOT_VERIFIED');
assert.equal(unverifiedProducer.evidence.original.sha256,original.sha256);
assert.equal(unverifiedProducer.fitGateInput.originalPhotoSHA256,original.sha256);
assert.equal(unverifiedProducer.consumer3DAdmitted,false);
assert.equal(syntheticBoundMet.evidence.evidenceClass,'synthetic');
assert.equal(syntheticBoundMet.consumer3DAdmitted,false);
assert.equal(foreignProducer.fitGateInput.originalPhotoSHA256,
 foreignSyntheticOriginal.sha256);

const receipts=[];
for(const kind of ['female','male']){
 const filename=join(folder,
  `${browser}-${kind}-ORIGINAL-FULL-INDEXED-163bone-ANGULAR-BVH-RESEARCH-HOLD.json`);
 const motion=JSON.parse(await readFile(filename,'utf8'));
 assert.equal(motion.originalJPEG_SHA256,original.sha256,
  'immutable TRUE original JPEG SHA not present in native rig receipt');
 assert.equal(motion.actualLicensedOriginalGLBSHA256,realRigHashes[kind]);
 assert.equal(motion.actualLicensed163boneRigKind,kind);
 assert.equal(motion.originalSourceFrontIndexedFaces,35262);
 assert.equal(motion.originalBodyIndexedFaces,109064);
 assert.equal(motion.provenanceOriginalJPEGAndGLBExternallySHAProvedByNativeHarness,true);
 assert.equal(motion.actualAllOriginalIndexedDepthUncertaintySweptBVH
  .decision,'BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT');
 assert.equal(motion.actualAllOriginalIndexedAngularBroadphase
  .decision,'RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT');
 const rig={sha256:realRigHashes[kind],kind};
 const make=calibrationHandoff=>gate({
  calibrationHandoff,trustedPhoto:original,
  trustedRig:rig,motionReceipt:motion
 });
 const sameSource=make(unverifiedProducer),
  foreign=make(foreignProducer),
  synthetic=make(syntheticBoundMet);
 assert.equal(sameSource.decision,'BLOCKED_REAL_PHYSICAL_MEASUREMENT_AND_FIT_PENDING');
 assert.equal(sameSource.inputsAcceptedForResearchOnly,true);
 assert.equal(sameSource.realContactGateDecision,
  'BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT');
 assert.equal(sameSource.physicalScaleMillimetersPerRigUnit,null);
 assert.equal(foreign.decision,'BLOCKED_DIFFERENT_ORIGINAL_JPEG');
 assert.equal(synthetic.decision,
  'BLOCKED_SYNTHETIC_REFERENCE_NOT_WEARABLE_EVIDENCE');
 assert.equal(sameSource.consumer3DAdmitted,false);
 assert.equal(foreign.consumer3DAdmitted,false);
 assert.equal(synthetic.consumer3DAdmitted,false);
 assert.equal(sameSource.familyAlpha,'HOLD');
 const forgedMotion=structuredClone(motion);
 forgedMotion.actualAllOriginalIndexedDepthUncertaintySweptBVH.decision=
  'RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT';
 const bogus=gate({calibrationHandoff:unverifiedProducer,trustedPhoto:original,
  trustedRig:rig,motionReceipt:forgedMotion});
 assert.equal(bogus.decision,'BLOCKED_DEPTH_SWEEP_DECISION_FORGED_OR_NOT_PROVEN');
 const differentRig=gate({calibrationHandoff:unverifiedProducer,trustedPhoto:original,
  trustedRig:{kind,sha256:'f'.repeat(64)},motionReceipt:motion});
 assert.equal(differentRig.decision,
  'BLOCKED_FOREIGN_OR_UNAUTHENTICATED_ORIGINAL_MOTION_SOURCE');
 const receipt={
  browser,originalMetImageId:2551406,originalJPEG_SHA256:original.sha256,
  licensedRigKind:kind,originalLicensedGLBSHA256:rig.sha256,
  genuineOriginalFrontFaces:motion.originalSourceFrontIndexedFaces,
  genuineOriginalBodyFaces:motion.originalBodyIndexedFaces,
  genuineNativeUnmeasuredDepthContact:
   motion.actualAllOriginalIndexedDepthUncertaintySweptBVH.decision,
  actualParallel107SameSourceHandoff:sameSource.decision,
  actualParallel107OtherJPEGHandoff:foreign.decision,
  actualParallel107SyntheticMetHandoff:synthetic.decision,
  bogusDeepSweptMotion:bogus.decision,
  foreignLicensedRig:differentRig.decision,
  p107OriginalReferenceEvidenceIndependentlyCalibrated:false,
  originalNativeMotionRigCoordinateScaleInCM:false,
  newPhysicalFitOr3DAuthorization:false,
  originalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,familyAlpha:'HOLD'
 };
 receipts.push(receipt);
 const target=join(folder,
  `${browser}-${kind}-ACTUAL-P107-CALIBRATION-vs-ORIGINAL-163bone-MOTION-BLOCKED-HOLD.json`);
 await writeFile(target,JSON.stringify(receipt,null,2)+'\n');
}
assert.equal(receipts.length,2);
assert.ok(receipts.every(x=>x.consumer3DAdmitted===false));
console.log('M2_TRUE_P107_TO_ORIGINAL_163BONE_COMPATIBILITY_VETO '+
 JSON.stringify({browser,originalJPEG_SHA256:originalMetSHA256,
  actualRealRigs:receipts.map(r=>r.licensedRigKind),
  realPhotoAndRigSourceMatchedBoth:true,
  exactSourceButNoPhysicalMeasurementsStillBlockedBoth:true,
  foreignOriginalJPEGRejectedBoth:true,
  syntheticOriginalPhotoMeasurementsRejectedBoth:true,
  trueOriginalAngularDepthContactBlockedBoth:true,
  noFamilyData:true,noAppModification:true,
  consumer3DAdmitted:false,familyAlpha:'HOLD'}));
