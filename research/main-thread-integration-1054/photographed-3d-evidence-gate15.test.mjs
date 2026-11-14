import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessPhoto3DResearchGate1054 as assess} from './photographed-3d-evidence-gate15.mjs';

// M2 C61 source field schema reproduced from its actual JS; numbers below are
// manually transcribed from the 2026-11-14 source-authentic C61 CI #43540428624.
// Fixtures are NOT cryptographically attested real geometry or human labels.
const source='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const blob='76f5b3ec9e7fcb584829f25f6a31b9934087bdee';
const plan=()=>({ownerId:'synthetic-owner-private',status:'source-verified-2d-only',
 renderAuthorized3D:false,releaseAuthorized:false,familyAlpha:'HOLD',
 slots:[{slot:'top',itemId:'synthetic-owned-original',
  sourceSHA256:'a'.repeat(64),presentationMode:'verified-original-photo-2d',
  renderAuthorized3D:false}]});
function surface({right=false}={}){
 return {
  schema:'M2-C61-disposable-original-photo-source-triangle-strain',
  signedOriginalSourceFacesAnalyzed:3836,
  sourceFacesWithTemporaryPositionDifferences:2684,
  facesWithMaxEdgeStrainAbove2Percent:right?1820:1824,
  facesWithMaxEdgeStrainAbove5Percent:178,
  facesWithNormalTurnAbove10Degrees:0,
  facesWithAreaChangeAbove10Percent:90,
  facesWithReversedOrientation:0,
  sourceFacesDegenerateOrCollapsed:0,
  maxOriginalPhotoWorldEdgeRelativeStrain:0.130429,
  maxOriginalPhotoFaceNormalTurnDegrees:6.794,
  maxOriginalPhotoFaceAreaRelativeChange:0.145618,
  provisionalMeshDistortionGuardPassed:false,
  originalPhotoTextureRestUVAndSkinNeverEdited:true,
  sourceFaceLocationsOrIdentifiersWithheld:true,
  noActualRenderedPhotorealismOrFabricPhysicsCertificate:true,
  candidateNotAllowedInConsumer3D:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
function sample({right=false}={}){
 return {
  schema:'M2-original-licensed-disposable-upper-torso-clearance-trial-C60',
  outwardTrialMeters:0.006,
  baselineOriginalBodyStrictCrossings:196,
  trialOriginalBodyStrictCrossings:0,
  baselineOriginalSelfStrictCrossings:0,
  trialOriginalSelfStrictCrossings:0,
  completeOriginalBodyAndSelfAudit:true,
  allOriginalBodyCrossingsActuallyGone:true,
  noNewSelfStrictCrossings:true,
  originalPhotoMeshUVSkinMaterialsAndBoneMatricesUnmodified:true,
  allTrialVerticesRetainedInMemoryOnly:true,
  researchCandidateNotApprovedForConsumer3D:true,
  sourceOriginalPhotoSurfaceStrain61:surface({right}),
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
function evidence(){
 return {
  sourceTag:'commons-0053',
  originalSourceSHA256:source,sourceModuleBlobSHA:blob,
  sourceLockedForResearch:true,
  receipt:{
   schema:'M2-licensed-original-163bone-articulated-contact-C58',
   sourceFaceCount:3836,originalNeutralBodyAuditComplete:true,
   originalNeutralBodyStrictCrossings:196,
   originalBodyStrictTransverseCrossingsAcrossSamples:392,
   poseSampleCount:2,completeSelfPoseSweeps:2,completeBodyPoseSweeps:2,
   fullOriginalPhotoTrialAuditCompleted60:true,
   completeOriginalPhotographFaceStrainAudit61:true,
   noTrialPreviewGeometryCommitted60:true,
   noPhotographedSourceOr163BoneRigEdited60:true,
   researchDeformationNotActuallyRendered61:true,
   allTemporaryBoneQuaternionsRestored:true,
   exactNeutralWorldSkinnedDressRestored:true,
   disposableNeutralUpperTorsoTrial60:sample(),
   disposableArticulatedUpperTorsoTrials60:[sample(),sample({right:true})],
   releaseAuthorized:false,familyAlpha:'HOLD'
  }
 };
}
const evaluate=e=>assess({plan:plan(),mission2Evidence:e});
const reasons=r=>new Set(r.blockers);
test('M15 missing real photographic 3D source evidence preserves private original photo in 2D',()=>{
 const x=evaluate(null);
 assert.equal(x.presentationMode,'verified-original-photo-2d');
 assert.equal(x.status,'research-3d-blocked');
 assert.equal(x.renderAuthorized3D,false);
 assert.equal(x.releaseAuthorized,false);
 assert.equal(x.familyAlpha,'HOLD');
 assert.ok(reasons(x).has('no-photo-matched-3d-collision-and-strain-evidence'));
 assert.equal(x.signed163BoneFaceCount,null);
 assert.equal(x.sourceImagePixelsExposed,false);
});
test('M15 authentic C61 numeric evidence: 196 baseline → 0 disposable, BUT 178 strained faces and 90 area deviations reject 3D',()=>{
 const x=evaluate(evidence());
 assert.equal(x.signed163BoneFaceCount,3836);
 assert.deepEqual(x.neutralAndTwoSampledOriginalCrossings,[196,196,196]);
 assert.deepEqual(x.neutralAndTwoSampledTrialCrossings,[0,0,0]);
 assert.deepEqual(x.neutralAndTwoSampledFacesAbove5PercentStrain,[178,178,178]);
 assert.deepEqual(x.neutralAndTwoSampledFacesAbove10PercentAreaChange,[90,90,90]);
 assert.ok(reasons(x).has('photographed-source-fabric-strain-threshold-failed'));
 assert.ok(reasons(x).has('genuine-baseline-dress-body-triangle-crossings'));
 assert.ok(reasons(x).has('sampled-trial-never-rendered-or-applied'));
 assert.equal(x.renderAuthorized3D,false);
});
test('M15 attack: forged C61 distortion PASS with 178 real high-strain faces never grants 3D',()=>{
 const e=evidence();
 e.receipt.disposableNeutralUpperTorsoTrial60.sourceOriginalPhotoSurfaceStrain61.provisionalMeshDistortionGuardPassed=true;
 const x=evaluate(e);
 assert.equal(x.evidenceState,'invalid-or-incomplete');
 assert.equal(x.renderAuthorized3D,false);
});
test('M15 even zero measured collisions and perfect trial sample metrics do not certify real wearer',()=>{
 const e=evidence();
 for(const s of [e.receipt.disposableNeutralUpperTorsoTrial60,
  ...e.receipt.disposableArticulatedUpperTorsoTrials60]){
  s.baselineOriginalBodyStrictCrossings=0;
  s.trialOriginalBodyStrictCrossings=0;
  s.sourceOriginalPhotoSurfaceStrain61.facesWithMaxEdgeStrainAbove5Percent=0;
  s.sourceOriginalPhotoSurfaceStrain61.facesWithAreaChangeAbove10Percent=0;
  s.sourceOriginalPhotoSurfaceStrain61.provisionalMeshDistortionGuardPassed=true;
 }
 e.receipt.originalNeutralBodyStrictCrossings=0;
 e.receipt.originalBodyStrictTransverseCrossingsAcrossSamples=0;
 const x=evaluate(e);
 assert.ok(reasons(x).has('sampled-trial-never-rendered-or-applied'));
 assert.ok(reasons(x).has('licensed-demo-not-owner-photo-3d-reconstruction'));
 assert.equal(x.releaseAuthorized,false);
});
test('M15 altered Commons source hash or unpinned M2 helper SHA remains untrusted',()=>{
 for(const change of [{originalSourceSHA256:'f'.repeat(64)},{sourceModuleBlobSHA:'0'.repeat(40)},{sourceTag:'private-owner'}]){
  const e=evidence();Object.assign(e,change);
  assert.equal(evaluate(e).evidenceState,'invalid-or-incomplete');
 }
});
test('M15 missing arm pose cannot impersonate complete three-pose original garment source',()=>{
 const e=evidence();e.receipt.disposableArticulatedUpperTorsoTrials60.pop();
 assert.equal(evaluate(e).evidenceState,'invalid-or-incomplete');
});
test('M15 incomplete body or original facial strain budget rejects sampled candidate',()=>{
 for(const key of ['originalNeutralBodyAuditComplete',
  'fullOriginalPhotoTrialAuditCompleted60','completeOriginalPhotographFaceStrainAudit61']){
  const e=evidence();e.receipt[key]=false;
  assert.equal(evaluate(e).evidenceState,'invalid-or-incomplete');
 }
});
test('M15 broken skinned pose restore or source edit must not enter 3D gate',()=>{
 for(const key of ['allTemporaryBoneQuaternionsRestored',
  'exactNeutralWorldSkinnedDressRestored','noTrialPreviewGeometryCommitted60',
  'noPhotographedSourceOr163BoneRigEdited60']){
  const e=evidence();e.receipt[key]=false;
  assert.equal(evaluate(e).evidenceState,'invalid-or-incomplete');
 }
});
test('M15 non-finite/negative/or excessive triangle strain counts cannot assert verified geometry',()=>{
 for(const altered of [NaN,Infinity,-1,5000]){
  const e=evidence();
  e.receipt.disposableNeutralUpperTorsoTrial60.sourceOriginalPhotoSurfaceStrain61.facesWithMaxEdgeStrainAbove5Percent=altered;
  assert.equal(evaluate(e).evidenceState,'invalid-or-incomplete');
 }
});
test('M15 surface face budget must match actual 3,836 source faces',()=>{
 const e=evidence();
 e.receipt.disposableNeutralUpperTorsoTrial60.sourceOriginalPhotoSurfaceStrain61.signedOriginalSourceFacesAnalyzed=3835;
 assert.equal(evaluate(e).evidenceState,'invalid-or-incomplete');
});
test('M15 original M2 research candidate cannot declare itself consumer-ready or override HOLD',()=>{
 for(const tweak of [
  e=>e.receipt.disposableNeutralUpperTorsoTrial60.researchCandidateNotApprovedForConsumer3D=false,
  e=>e.receipt.disposableNeutralUpperTorsoTrial60.sourceOriginalPhotoSurfaceStrain61.candidateNotAllowedInConsumer3D=false,
  e=>e.receipt.disposableNeutralUpperTorsoTrial60.releaseAuthorized=true,
  e=>e.receipt.familyAlpha='OPEN',
 ]){
  const e=evidence();tweak(e);
  assert.equal(evaluate(e).evidenceState,'invalid-or-incomplete');
  assert.equal(evaluate(e).renderAuthorized3D,false);
 }
});
test('M15 fitted rendering must not be issued for unreviewed or unverified saved outfit',()=>{
 for(const delta of [
  {status:'source-unreviewed'}, {renderAuthorized3D:true},
  {releaseAuthorized:true},{familyAlpha:'GO'}, {slots:[]},
  {slots:[{slot:'top',itemId:'bad',sourceSHA256:'b',presentationMode:'verified-original-photo-2d',renderAuthorized3D:false}]}
 ]){
  assert.throws(()=>assess({plan:{...plan(),...delta},mission2Evidence:evidence()}),
   /signed 2D preflight required/);
 }
});
test('M15 receipt summary must not leak owner ID, original JPEG pixels or source images',()=>{
 const x=evaluate(evidence()),serialized=JSON.stringify(x);
 assert.equal(serialized.includes('synthetic-owner-private'),false);
 assert.equal(serialized.includes('synthetic-owned-original'),false);
 assert.equal(serialized.includes('data:image'),false);
 assert.equal(serialized.includes(source),false);
 assert.equal(x.savedWardrobeModified,false);
 assert.equal(x.trialAppliedToGarment,false);
});
test('M15 actual signed native 2D preview imports the M2 blocker before building image DOM',()=>{
 const src=readFileSync('research/main-thread-integration-1054/native-2d-preview.mjs','utf8');
 assert.match(src,/assessPhoto3DResearchGate1054\(\{plan:confirmed\}\)/);
 assert.match(src,/research3D\.renderAuthorized3D!==false/);
 assert.match(src,/3D fit not verified or authorized/);
});
test('M15 no credible physical device or human visual attestation can be inferred from sampled collision count',()=>{
 const x=evaluate(evidence());
 assert.ok(reasons(x).has('physical-device-3d-acceptance-not-verified'));
 assert.ok(reasons(x).has('independent-human-fabric-fit-review-not-established'));
 assert.ok(reasons(x).has('continuous-cloth-body-collision-clearance-unproven'));
});
test('M15 summary and arrays are immutable not mutable access-control permissions',()=>{
 const x=evaluate(evidence());
 assert.equal(Object.isFrozen(x),true);
 assert.equal(Object.isFrozen(x.blockers),true);
 assert.equal(Object.isFrozen(x.neutralAndTwoSampledTrialCrossings),true);
 assert.throws(()=>{x.renderAuthorized3D=true;},TypeError);
});
