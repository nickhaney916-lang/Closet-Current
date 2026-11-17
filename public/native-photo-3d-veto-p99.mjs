/**
 * MAIN1054 M15 — read-only cross-mission original-photo 3D admission audit.
 * The genuine Mission 2 C60/C61 record is a sampled/temporary 163-bone
 * source experiment. NEVER use its original-license measurements to admit an
 * arbitrary owner's garment, infer photos, repair geometry or enable 3D.
 *
 * Source receipt field names follow M2 C52/C60/C61 actual research modules.
 * No browser worker, private photo, network, IDB or model dependency.
 */
const SOURCE_TAG='commons-0053';
const SOURCE_SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const SURFACE_BLOB_SHA='76f5b3ec9e7fcb584829f25f6a31b9934087bdee';
const SHA=/^[0-9a-f]{64}$/;
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const reason=(set,x)=>set.add(x);
function validPlan(plan){
 return !!plan&&plan.status==='source-verified-2d-only'&&
  plan.renderAuthorized3D===false&&plan.releaseAuthorized===false&&
  plan.familyAlpha==='HOLD'&&
  typeof plan.ownerId==='string'&&plan.ownerId.length>0&&
  Array.isArray(plan.slots)&&plan.slots.length>0&&
  plan.slots.every(s=>s&&typeof s.itemId==='string'&&s.itemId&&
   typeof s.slot==='string'&&SHA.test(s.sourceSHA256||'')&&
   s.presentationMode==='verified-original-photo-2d'&&
   s.renderAuthorized3D===false);
}
function validSample(sample,faces){
 const s=sample?.sourceOriginalPhotoSurfaceStrain61;
 if(!sample||sample.schema!=='M2-original-licensed-disposable-upper-torso-clearance-trial-C60'||
  sample.completeOriginalBodyAndSelfAudit!==true||
  !integer(sample.baselineOriginalBodyStrictCrossings)||
  !integer(sample.trialOriginalBodyStrictCrossings)||
  !integer(sample.baselineOriginalSelfStrictCrossings)||
  !integer(sample.trialOriginalSelfStrictCrossings)||
  sample.originalPhotoMeshUVSkinMaterialsAndBoneMatricesUnmodified!==true||
  sample.allTrialVerticesRetainedInMemoryOnly!==true||
  sample.researchCandidateNotApprovedForConsumer3D!==true||
  sample.releaseAuthorized!==false||sample.familyAlpha!=='HOLD'||
  !s||s.schema!=='M2-C61-disposable-original-photo-source-triangle-strain'||
  s.signedOriginalSourceFacesAnalyzed!==faces||
  s.originalPhotoTextureRestUVAndSkinNeverEdited!==true||
  s.noActualRenderedPhotorealismOrFabricPhysicsCertificate!==true||
  s.candidateNotAllowedInConsumer3D!==true||
  s.releaseAuthorized!==false||s.familyAlpha!=='HOLD')return false;
 const counters=['facesWithMaxEdgeStrainAbove2Percent',
  'facesWithMaxEdgeStrainAbove5Percent','facesWithNormalTurnAbove10Degrees',
  'facesWithAreaChangeAbove10Percent','facesWithReversedOrientation',
  'sourceFacesDegenerateOrCollapsed','sourceFacesWithTemporaryPositionDifferences'];
 if(!counters.every(k=>integer(s[k])&&s[k]<=faces)||
  ![s.maxOriginalPhotoWorldEdgeRelativeStrain,s.maxOriginalPhotoFaceNormalTurnDegrees,
    s.maxOriginalPhotoFaceAreaRelativeChange].every(x=>Number.isFinite(x)&&x>=0))
  return false;
 // A forged "PASS" with known-bad numerical metrics must NOT bypass this.
 const computed=s.sourceFacesDegenerateOrCollapsed===0&&
  s.facesWithReversedOrientation===0&&
  s.facesWithMaxEdgeStrainAbove5Percent===0&&
  s.facesWithNormalTurnAbove10Degrees===0&&
  s.facesWithAreaChangeAbove10Percent===0;
 return s.provisionalMeshDistortionGuardPassed===computed;
}

/**
 * Accepts only a preverified M4 ORIGINAL-PHOTO 2D plan, and optional M2
 * experimental evidence. Results are a coarse, private-data-free diagnostic
 * NOT a capability grant. No evidence can mint a 3D permission.
 */
export function assessPhoto3DResearchGate1054({plan,mission2Evidence=null}={}){
 if(!validPlan(plan))
  throw Error('MAIN1054 original-photo signed 2D preflight required');
 const blockers=new Set(['3d-reconstruction-not-proven',
  'independent-human-fabric-fit-review-not-established',
  'continuous-cloth-body-collision-clearance-unproven',
  'physical-device-3d-acceptance-not-verified']);
 let evidenceState='unavailable',faceCount=0,
  sampledOriginalCrossings=null,sampledTrialCrossings=null,
  trialFacesAbove5PercentStrain=null,trialFacesAbove10PercentArea=null;
 if(mission2Evidence===null){
  reason(blockers,'no-photo-matched-3d-collision-and-strain-evidence');
 }else{
  const wrapper=mission2Evidence,receipt=wrapper?.receipt;
  const matches=wrapper?.sourceTag===SOURCE_TAG&&
   wrapper?.originalSourceSHA256===SOURCE_SHA&&
   wrapper?.sourceModuleBlobSHA===SURFACE_BLOB_SHA&&
   wrapper?.sourceLockedForResearch===true;
  const base=receipt&&
   receipt.schema==='M2-licensed-original-163bone-articulated-contact-C58'&&
   receipt.sourceFaceCount===3836&&
   receipt.originalNeutralBodyAuditComplete===true&&
   receipt.poseSampleCount===2&&receipt.completeSelfPoseSweeps===2&&
   receipt.completeBodyPoseSweeps===2&&
   integer(receipt.originalNeutralBodyStrictCrossings)&&
   integer(receipt.originalBodyStrictTransverseCrossingsAcrossSamples)&&
   receipt.fullOriginalPhotoTrialAuditCompleted60===true&&
   receipt.completeOriginalPhotographFaceStrainAudit61===true&&
   receipt.noTrialPreviewGeometryCommitted60===true&&
   receipt.noPhotographedSourceOr163BoneRigEdited60===true&&
   receipt.researchDeformationNotActuallyRendered61===true&&
   receipt.allTemporaryBoneQuaternionsRestored===true&&
   receipt.exactNeutralWorldSkinnedDressRestored===true&&
   receipt.releaseAuthorized===false&&receipt.familyAlpha==='HOLD'&&
   validSample(receipt.disposableNeutralUpperTorsoTrial60,receipt.sourceFaceCount)&&
   Array.isArray(receipt.disposableArticulatedUpperTorsoTrials60)&&
   receipt.disposableArticulatedUpperTorsoTrials60.length===2&&
   receipt.disposableArticulatedUpperTorsoTrials60.every(x=>
    validSample(x,receipt.sourceFaceCount));
  if(!matches||!base){
   evidenceState='invalid-or-incomplete';
   reason(blockers,'mission2-genuine-source-or-pose-proof-incomplete');
  }else{
   evidenceState='authentic-source-shape-research-receipt-not-cryptographically-attested';
   faceCount=receipt.sourceFaceCount;
   const samples=[receipt.disposableNeutralUpperTorsoTrial60,
    ...receipt.disposableArticulatedUpperTorsoTrials60];
   sampledOriginalCrossings=samples.map(x=>x.baselineOriginalBodyStrictCrossings);
   sampledTrialCrossings=samples.map(x=>x.trialOriginalBodyStrictCrossings);
   trialFacesAbove5PercentStrain=samples.map(x=>
    x.sourceOriginalPhotoSurfaceStrain61.facesWithMaxEdgeStrainAbove5Percent);
   trialFacesAbove10PercentArea=samples.map(x=>
    x.sourceOriginalPhotoSurfaceStrain61.facesWithAreaChangeAbove10Percent);
   if(samples.some(x=>x.baselineOriginalBodyStrictCrossings>0))
    reason(blockers,'genuine-baseline-dress-body-triangle-crossings');
   if(samples.some(x=>x.trialOriginalBodyStrictCrossings>0||
     x.trialOriginalSelfStrictCrossings>x.baselineOriginalSelfStrictCrossings))
    reason(blockers,'disposable-trial-still-has-collision-witnesses');
   if(samples.some(x=>!x.sourceOriginalPhotoSurfaceStrain61.provisionalMeshDistortionGuardPassed))
    reason(blockers,'photographed-source-fabric-strain-threshold-failed');
   // This 163-bone test garment cannot stand in for a different private
   // physical item, even if its image happened to share a digest.
   reason(blockers,'licensed-demo-not-owner-photo-3d-reconstruction');
   reason(blockers,'sampled-trial-never-rendered-or-applied');
  }
 }
 return Object.freeze({
  status:'research-3d-blocked',
  presentationMode:'verified-original-photo-2d',
  renderAuthorized3D:false,
  releaseAuthorized:false,
  familyAlpha:'HOLD',
  evidenceState,
  signed163BoneFaceCount:faceCount||null,
  neutralAndTwoSampledOriginalCrossings:sampledOriginalCrossings?
   Object.freeze([...sampledOriginalCrossings]):null,
  neutralAndTwoSampledTrialCrossings:sampledTrialCrossings?
   Object.freeze([...sampledTrialCrossings]):null,
  neutralAndTwoSampledFacesAbove5PercentStrain:trialFacesAbove5PercentStrain?
   Object.freeze([...trialFacesAbove5PercentStrain]):null,
  neutralAndTwoSampledFacesAbove10PercentAreaChange:trialFacesAbove10PercentArea?
   Object.freeze([...trialFacesAbove10PercentArea]):null,
  blockers:Object.freeze([...blockers]),
  ownerIdentifiersExposed:false,
  sourceImagePixelsExposed:false,
  savedWardrobeModified:false,
  trialAppliedToGarment:false
 });
}
