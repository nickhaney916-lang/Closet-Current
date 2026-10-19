// Human-review RECONCILIATION, not visual garment recognition or automatic truth.
// Exposes first/second observations to the adjudicator only. A third, independent
// reviewer receives SHA-locked originals WITHOUT prior answers, captions, models.
import {reconcileBlindOriginalSubmissions,validateBlindOriginalSubmission} from './blind-original-review-submissions.mjs';
const samePerson=(a,b)=>a.trim().toLocaleLowerCase('en-US')===b.trim().toLocaleLowerCase('en-US');
const safeSource=s=>s&&typeof s.sourceId==='string'&&
 /^(?:commons|validation)-\d{4}$/.test(s.sourceId)&&
 s.image===s.sourceId+'.jpg'&&/^[a-f0-9]{64}$/.test(s.sourceSha256)&&
 typeof s.license==='string'&&s.license.trim()&&
 !['originalSourceUrl','title','modelResult','manifestLabel'].some(k=>Object.hasOwn(s,k));
const sums=items=>{
 const tally=new Map();
 for(const item of items){
  const k=item.category+' / '+item.form.trim().replace(/\s+/g,' ').toLowerCase();
  tally.set(k,(tally.get(k)||0)+1);
 }
 return [...tally.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([form,count])=>({form,count}));
};
export function prepareIndependentAdjudication(firstPacket,first,secondPacket,second){
 const report=reconcileBlindOriginalSubmissions(firstPacket,first,secondPacket,second);
 if(firstPacket.originals.length!==report.sourcePhotos||
    secondPacket.originals.length!==report.sourcePhotos||
    firstPacket.originals.some(x=>!safeSource(x))||
    secondPacket.originals.some(x=>!safeSource(x)))
  throw Error('Unblinded or unverified first/second original-photo packets');
 const sourceMap=new Map(firstPacket.originals.map(x=>[x.sourceId,x]));
 const firstMap=new Map(first.sourceInventories.map(x=>[x.sourceId,x]));
 const secondMap=new Map(second.sourceInventories.map(x=>[x.sourceId,x]));
 const plan=report.photos.map(row=>{
  const a=firstMap.get(row.sourceId),b=secondMap.get(row.sourceId);
  if(!a||!b||!sourceMap.has(row.sourceId)||a.sourceSha256!==b.sourceSha256||
     a.sourceSha256!==row.sourceSha256)throw Error('Mismatched adjudication source');
  const reasons=[
   ...(row.countAgreement?[]:['different-visible-physical-item-count']),
   ...(row.categoryAndFormMultisetAgreement?[]:['different-category-or-specific-form']),
   ...(row.visibilityMultisetAgreement?[]:['different-occlusion-or-visibility']),
   ...(row.unresolvedFormOrVisibility?['unknown-or-partially-visible-item']:[])
  ];
  const maskStatus='independent-per-item-human-outlines-not-approved';
  return {sourceId:row.sourceId,sourceSha256:row.sourceSha256,
   adjudicationRequired:row.needsThirdReviewer,
   flaggedReasons:reasons,
   first:{count:a.items.length,forms:sums(a.items),
    unresolvedVisibility:a.items.filter(x=>x.visibility!=='visible').length,
    notes:a.uncertaintyNotes},
   second:{count:b.items.length,forms:sums(b.items),
    unresolvedVisibility:b.items.filter(x=>x.visibility!=='visible').length,
    notes:b.uncertaintyNotes},
   imageStillRequiresIndependentVisibleGarmentOutlineReview:true,
   physicalGarmentCount:null, approvedGarmentForms:null, maskStatus,
   modelTrainingOrAutoSaveApproved:false};
 });
 const disputed=plan.filter(x=>x.adjudicationRequired);
 const thirdPacket=disputed.length?{
  schemaVersion:1,reviewType:'independent-blind-original-photo-inventory',
  reviewerSlot:'third',reviewerAlias:null,reviewedAt:null,
  modelPredictionsIncluded:false,manifestCategoryLabelsIncluded:false,
  originalPhotosCopiedOrReencoded:false,photoCount:disputed.length,
  independentlyReviewed:false,allGarmentFormsVerified:false,
  instruction:'Independently examine the SHA-matched FULL ORIGINAL JPEG, without seeing either previous reviewer inventory, filename caption, expected form or model output. Record every separately visible garment and uncertain physical layer.',
  originals:disputed.map(r=>{
   const s=sourceMap.get(r.sourceId);
   return {sourceId:s.sourceId,image:s.image,sourceSha256:s.sourceSha256,license:s.license};
  })
 }:null;
 const adjudicatorOnly={
  schemaVersion:1,status:'observations-reconciled-independent-ground-truth-unverified',
  sourcePhotos:plan.length,reviewedByTwoIndependentAliases:true,
  reviewedOriginalsAreSourceShaMatched:true,reviewers:report.reviewerAliases,
  flaggedForBlindThirdReview:disputed.length,
  thirdReviewerSourceIds:disputed.map(x=>x.sourceId),
  firstTwoReviewerAgreementWithoutInstanceProof:plan.length-disputed.length,
  approvedPhysicalGarmentMasks:0,independentPhysicalGarmentCount:null,
  specificFootwearSubtypeAccuracy:null,layeredPhysicalGarmentRecall:null,
  modelPolicyImprovementMeasured:false,modelWeightsOrThresholdsModified:false,
  anyCustomerRecordsCreated:false,paidAIInvocations:0,
  canRelease:false,photos:plan
 };
 return {adjudicatorOnly,thirdBlindPacket:thirdPacket};
}
export function checkThirdIndependentSubmission(handoff,thirdSubmission){
 if(!handoff||!handoff.adjudicatorOnly||!handoff.thirdBlindPacket)
  throw Error('No independent third-review request exists');
 const check=validateBlindOriginalSubmission(handoff.thirdBlindPacket,thirdSubmission);
 if(check.reviewerSlot!=='third'||handoff.adjudicatorOnly.reviewers.some(n=>samePerson(n,check.reviewerAlias)))
  throw Error('Third reviewer must be independent of both previous reviewers');
 return {thirdSourceCount:check.sourcePhotos,
  thirdReviewer:check.reviewerAlias,
  thirdOriginalsShaVerified:true,
  thirdHumanObservations:check.visibleItemObservations,
  agreementOrDisagreementNeedsHumanAdjudication:true,
  approvedPixelMasks:0,physicalGarmentRecall:null,
  independentlyAdjudicatedGarmentTypes:null,
  customerAutoIndexingAllowed:false,productionModelChangeAllowed:false};
}