// Blind original-source physical garment form review. Never show manifest
// labels, model guesses, disagreement flags or frame scores to reviewers.
const HASH=/^[a-f0-9]{64}$/;
export function blindOriginalFormReviewPacket(queue,reviewerSlot){
 if(queue?.schemaVersion!==1||queue.status!=='requires-independent-full-original-source-review'||
    !['first','second'].includes(reviewerSlot)||!Array.isArray(queue.rows)||
    queue.rows.length!==queue.originalSourcePhotos||!queue.rows.length||
    queue.customerAutoSaves!==0||queue.independentHumanRecords!==0)
  throw Error('Untrusted or previously reviewed original-source queue');
 const seen=new Set();
 const originals=queue.rows.map(r=>{
  if(!/^(commons|validation)-\d{4}$/.test(r?.sourceId||'')||
     seen.has(r.sourceId)||!HASH.test(r.sourceSha256||'')||
     r.originalSourceUrl!==r.attribution?.source&&r.attribution?.source!==undefined||
     typeof r.originalSourceUrl!=='string'||!r.originalSourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:')||
     r.independentlyApproved!==false||r.physicalGarmentsInSource!==null)
   throw Error('Untrusted original photograph');
  seen.add(r.sourceId);
  return {sourceId:r.sourceId,image:r.image,sourceSha256:r.sourceSha256,
   originalSourceUrl:r.originalSourceUrl,license:r.attribution?.license,
   // Explicitly blank; no inference from captions, file titles or predictions.
   inspectedEntireOriginal:null,sourceVisiblePhysicalGarments:[],
   allVisiblePhysicalGarmentsRecorded:null,ambiguityNotes:null};
 });
 if(originals.some(r=>typeof r.license!=='string'||!r.license))
  throw Error('Photo license missing');
 return {schemaVersion:1,reviewType:'independent-blind-original-photo-inventory',
  reviewerSlot,reviewerAlias:null,reviewedAt:null,
  modelPredictionsIncluded:false,manifestCategoryLabelsIncluded:false,
  originalPhotosCopiedOrReencoded:false,photoCount:originals.length,
  independentlyReviewed:false,allGarmentFormsVerified:false,
  instruction:'Inspect every complete source photo BEFORE viewing any model result or manifest labels. Record each distinct VISIBLE garment category and specific form, including unknown/uncertain and background negative controls. Never infer covered garments. Do not copy a garment from another reviewer. Source URL and SHA bind the review to the exact original.',
  originals};
}
