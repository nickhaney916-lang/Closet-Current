// Research-only: bind TWO independent source-hash-verified, complete, blind
// human garment inventories to per-physical-item independently approved masks.
// This never manufactures human observations or upgrades model confidence.
// A CATEGORY/COUNT agreement does not establish specific shoe subtype truth.
import {reconcileBlindOriginalSubmissions} from './blind-original-review-submissions.mjs';
import {evaluateCompletePhysicalInventory} from './physical-garment-inventory.mjs';
const hash=/^[a-f0-9]{64}$/;
function counts(items) {
 const result=new Map();
 for(const item of items) {
  const category=item.category;
  result.set(category,(result.get(category)||0)+1);
 }
 return [...result].sort((a,b)=>a[0].localeCompare(b[0]));
}
const canonical=x=>JSON.stringify(counts(x));
const equal=(a,b)=>canonical(a)===canonical(b);
export function evaluateBlindLinkedPhysicalInventory({
 scene,lockedSource,firstPacket,firstSubmission,secondPacket,
 secondSubmission,physicalInventory,approvedMasks,modelProposals,
 minimumIoU=.5
}){
 if(!scene||scene.image!==scene.id+'.jpg'||!hash.test(scene.sourceSha256||'')||
    !lockedSource||lockedSource.id!==scene.id||
    lockedSource.image!==scene.image||
    lockedSource.sha256!==scene.sourceSha256||lockedSource.verified!==true||
    !lockedSource.attribution?.license||
    !(approvedMasks instanceof Map)||!(modelProposals instanceof Map))
  throw Error('An exact SHA-locked, licensed original and map inputs are required');
 const report=reconcileBlindOriginalSubmissions(
  firstPacket,firstSubmission,secondPacket,secondSubmission);
 const agreed=report.photos.find(x=>x.sourceId===scene.id);
 if(!agreed||agreed.sourceSha256!==scene.sourceSha256)
  throw Error('No two-blind-reviewer source SHA match for the original photograph');
 const blankResult=(status,reasons)=>({
  status,sourceId:scene.id,sourceSha256:scene.sourceSha256,
  blindReviewers:2,blindOriginalSourceVerified:true,reasons,
  reviewedCategoryCounts:null,approvedPhysicalGarments:0,
  detectionRecall:null,categoryConstrainedRecall:null,
  formConstrainedRecall:null,meanMatchedIoU:null,
  specificFootwearSubtypeAccuracy:null,physicalLayerRecall:null,
  trueIndependentInstanceIdentityVerified:false,
  productionRecognitionChanged:false,canPromoteModel:false,canRelease:false
 });
 if(agreed.needsThirdReviewer)
  return blankResult('blocked-blind-original-disagreement',[
   ...(!agreed.countAgreement?['count-disagreement']:[]),
   ...(!agreed.categoryAndFormMultisetAgreement?['form-disagreement']:[]),
   ...(!agreed.visibilityMultisetAgreement?['visibility-disagreement']:[]),
   ...(agreed.unresolvedFormOrVisibility?['unknown-or-partially-visible']:[])
  ]);
 const first=firstSubmission.sourceInventories.find(x=>x.sourceId===scene.id);
 const second=secondSubmission.sourceInventories.find(x=>x.sourceId===scene.id);
 if(!first||!second)throw Error('Missing full scene inventories');
 if(!physicalInventory)
  return blankResult('awaiting-independent-per-item-masks',['physical-inventory-not-supplied']);
 if(physicalInventory.image!==scene.image||
    physicalInventory.sourceSha256!==scene.sourceSha256||
    !Array.isArray(physicalInventory.targets))
  throw Error('Physical inventory original-photo identity mismatch');
 if(!equal(first.items,second.items)||!equal(first.items,physicalInventory.targets))
  return blankResult('blocked-physical-item-category-count-mismatch',[
   'blind-observed-physical-categories-do-not-match-all-approved-mask-targets'
  ]);
 // Only the existing full-photo physical inventory scorer can validate
 // annotation review status, category/form, distinct mask approvers, pixel
 // dimensions, and enforce one-to-one prediction / reference matching.
 // An invalid or missing annotation MUST THROW, not silently become a score.
 const scored=evaluateCompletePhysicalInventory(scene,physicalInventory,
  approvedMasks,modelProposals,{minimumIoU});
 if(scored.status!=='conditionally-scored-complete-human-inventory'||
    scored.approvedPhysicalGarments!==first.items.length||
    scored.referenceMasksIndependentlyApproved!==true||
    scored.completenessAttestationIsHumanProvided!==true)
  throw Error('Full-scene physical mask review did not complete');
 const countsByCategory=Object.fromEntries(counts(first.items));
 const shoesPresent=Boolean(countsByCategory.Shoes||countsByCategory.Hosiery);
 return {
  status:'conditionally-scored-sha-locked-blind-linked-physical-inventory',
  sourceId:scene.id,sourceSha256:scene.sourceSha256,blindReviewers:2,
  blindOriginalSourceVerified:true,reviewedCategoryCounts:countsByCategory,
  approvedPhysicalGarments:scored.approvedPhysicalGarments,
  modelProposals:scored.modelProposals,
  detectionRecall:scored.detectionRecall,
  categoryConstrainedRecall:scored.categoryConstrainedRecall,
  // Category-level known match does not prove sneaker vs ankle boot.
  formConstrainedRecall:scored.formConstrainedRecall,
  meanMatchedIoU:scored.meanMatchedIoU,
  supportedCategoryConstrainedRecall:scored.supportedCategoryConstrainedRecall,
  falseExtraProposals:scored.extraOrDuplicateProposals,
  missedPhysicalGarments:scored.missingGarments,
  footwearCategorySupportedByModel:scored.footwearCategorySupportedByModel,
  hosieryCategorySupportedByModel:scored.hosieryCategorySupportedByModel,
  specificFootwearSubtypeAccuracy:null,
  physicalLayerRecall:scored.detectionRecall,
  maskMatching:'one-to-one-approved-outlines-at-reference-resolution',
  categoryCountAndFormAgreementAcrossBlindHumans:true,
  humanAttestationCannotBeProvenFromJSON:true,
  trueIndependentInstanceIdentityVerified:false,
  unresolvedShoeSpecificFormEvidence:shoesPresent,
  noAutomaticClosetSaving:true,
  originalRgbChanged:false,
  modelWeightsOrThresholdsChanged:false,
  productionRecognitionChanged:false,
  canPromoteModel:false,canRelease:false
 };
}
