// Research-only coverage audit. Seed predictions are NEVER independent reference masks.
import {scoreApprovedIndividualInstance} from './garment-mask-metrics.mjs';
const ID=/^(?:commons|validation)-[0-9]{4}$/;
const SHA=/^[a-f0-9]{64}$/;
export function assessIndividualInstanceReview(index,seeds,approved=new Map()){
 if(index?.status!=='awaiting-independent-human-outlines'||
  index?.predictionMasksAreGroundTruth!==false||
  index?.automaticCustomerMaskPromotion!==false||
  !Array.isArray(index.cases)||index.cases.length<1||
  !Number.isInteger(index.pendingIndividualPredictions)||
  !(seeds instanceof Map)||!(approved instanceof Map))
  throw Error('Invalid independent-review queue and provenance');
 const sourceIds=new Set(),proposalIds=new Set(),rows=[],photoRows=[],unpaired=[];
 let originalsForReview=0;
 for(const scene of index.cases){
  if(!ID.test(scene?.id)||sourceIds.has(scene.id)||
   scene.image!==scene.id+'.jpg'||!SHA.test(scene.sourceSha256)||
   !Array.isArray(scene.candidateSeeds)||
   scene.allMasksUnapproved!==true||scene.userPhotoModified!==false)
   throw Error('Duplicate or unsafe source-photo review identity');
  sourceIds.add(scene.id);
  if(scene.exactOriginalIncludedForReview===true)originalsForReview++;
  let reviewed=0,scored=0;
  const namedTargets=new Map();
  for(const item of scene.candidateSeeds){
   if(typeof item.id!=='string'||
     !new RegExp('^'+scene.id+'-candidate-[0-9]{2}$').test(item.id)||
     proposalIds.has(item.id)||
     item.referenceStatus!=='pending-human-annotation'||
     item.approvedReference!==null||
     typeof item.prediction!=='string'||
     !item.prediction.startsWith('independent-outline-review/model-seeds/')||
     !item.prediction.endsWith(item.id+'.prediction.json'))
    throw Error('Unsafe or duplicated model proposal in review queue');
   proposalIds.add(item.id);
   const seed=seeds.get(item.id);
   if(!seed||seed.schemaVersion!==1||
    seed.modelProposalId!==item.id||
    seed.candidateOrdinal!==Number(item.id.slice(-2))||
    seed.image!==scene.image||seed.sourceSha256!==scene.sourceSha256||
    seed.modelGarmentLabel!==item.label||
    seed.reviewStatus!=='prediction-unreviewed'||
    seed.independentReference!==false||
    seed.canSaveToCustomerCloset!==false||
    seed.approvedBy!==null)
    throw Error('Altered or non-prediction model seed: '+item.id);
   const approval=approved.get(item.id);
   if(!approval){
    rows.push({modelProposalId:item.id,sourceId:scene.id,modelGarmentLabel:item.label,
      status:'awaiting-independent-garment-outline',instanceIoU:null,
      garmentCategoryAccuracy:null});
    continue;
   }
   // The scoring function requires identical model proposal, verified source,
   // human-identified physical garment, and two DIFFERENT reviewers.
   const score=scoreApprovedIndividualInstance(approval,seed);
   const target=approval.humanTargetLabel.trim().toLocaleLowerCase('en-US');
   if(namedTargets.has(target))unpaired.push({
     sourceId:scene.id,modelProposalIds:[namedTargets.get(target),item.id],
     issue:'same-human-target-label-on-several-model-proposals',
     confirmedSamePhysicalGarment:false
   });
   else namedTargets.set(target,item.id);
   reviewed++;scored++;
   rows.push({modelProposalId:item.id,sourceId:scene.id,
    modelGarmentLabel:item.label,humanTargetLabel:approval.humanTargetLabel.trim(),
    status:'conditional-reviewed-proposal-score',
    instanceIoU:score.intersectionOverUnion,
    garmentRecallAtReviewResolution:score.garmentRecall,
    foregroundPrecisionAtReviewResolution:score.garmentPrecision,
    garmentCategoryAccuracy:null,
    referenceSeedWasAI:score.referenceSeedWasAI,
    humanOutlineMayBeSeedBiased:true,
    verifiedSeparatePhysicalItem:false});
  }
  photoRows.push({id:scene.id,modelProposals:scene.candidateSeeds.length,
   independentlyApprovedProposals:reviewed,conditionallyScoredProposals:scored,
   independentPhysicalGarmentInventoryAvailable:false});
 }
 if(proposalIds.size!==index.pendingIndividualPredictions||seeds.size!==proposalIds.size||
    approved.size>proposalIds.size||
    [...approved.keys()].some(id=>!proposalIds.has(id)))
  throw Error('Missing or extra candidate/reference in review queue');
 const scored=rows.filter(r=>r.status==='conditional-reviewed-proposal-score').length;
 const outstanding=rows.length-scored;
 return {status:outstanding?'awaiting-independent-human-outlines':
   'awaiting-complete-independent-physical-garment-inventory',
  sourcePhotos:index.cases.length,priorityOriginalPhotosProvided:originalsForReview,
  modelProposals:rows.length,independentlyReviewedProposals:scored,
  awaitingReview:outstanding,duplicateHumanTargetWarnings:unpaired,
  perPhoto:photoRows,proposals:rows,
  aggregateGarmentInstanceAccuracy:null,aggregatePixelIoU:null,
  missingPhysicalGarmentRecall:null,
  allDistinctGarmentInstancesVerified:false,
  independentlyVerifiedPhysicalItemInventory:false,
  scoringIsConditionalOnHumanReview:true,
  canPromoteModel:false,autoSavedCustomerItems:0,
  originalSourceRgbModified:false};
}
