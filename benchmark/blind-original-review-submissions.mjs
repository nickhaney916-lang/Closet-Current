// A completed BLIND source inventory is one reviewer's observation,
// not garment ground truth or a physical-instance mask. Reviewers cannot be
// inferred from filename, account, model data, file title or a checked box.
const SHA=/^[a-f0-9]{64}$/;
const NAME=/^[^\n\r<>]{2,80}$/;
const ID=/^(?:commons|validation)-\d{4}$/;
const CATEGORIES=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes','Hosiery','Accessories','Uncertain']);
const SHAPES=new Set(['visible','partially-visible','uncertain']);
const exactKeys=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(o,k));
const limitedText=(s,max=120)=>typeof s==='string'&&s.length<=max&&
 !/[<>\x00-\x08\x0b\x0e-\x1f]/.test(s);
const identity=s=>typeof s==='string'&&NAME.test(s)&&!/^anonymous|^reviewer\s*[12ab]?$|^test$/i.test(s.trim());
const uniqueIds=(array,key)=>{
 const map=new Map();
 for(const x of array){if(!x||map.has(x[key]))throw Error('Duplicate or missing source '+key);map.set(x[key],x);}
 return map;
};
export function validateBlindOriginalSubmission(packet,submission){
 if(packet?.schemaVersion!==1||packet.reviewType!=='independent-blind-original-photo-inventory'||
   !['first','second','third'].includes(packet.reviewerSlot)||packet.modelPredictionsIncluded!==false||
   packet.manifestCategoryLabelsIncluded!==false||packet.originalPhotosCopiedOrReencoded!==false||
   packet.independentlyReviewed!==false||packet.allGarmentFormsVerified!==false||
   !Array.isArray(packet.originals)||packet.photoCount!==packet.originals.length||
   !packet.photoCount||packet.photoCount>80||
   packet.originals.some(x=>Object.hasOwn(x||{},'originalSourceUrl')||
     Object.hasOwn(x||{},'title')||Object.hasOwn(x||{},'modelResult')||
     Object.hasOwn(x||{},'manifestLabel')))
  throw Error('Untrusted blind source packet');
 if(!exactKeys(submission,['schemaVersion','reviewType','reviewerSlot','reviewerAlias','reviewedAt',
    'originalJpegsVerified','modelAnswersNotShown','sourceInventories'])||
   submission.schemaVersion!==1||submission.reviewType!=='independent-blind-source-submission'||
   submission.reviewerSlot!==packet.reviewerSlot||!identity(submission.reviewerAlias)||
   submission.originalJpegsVerified!==true||submission.modelAnswersNotShown!==true||
   !Number.isFinite(Date.parse(submission.reviewedAt))||
   !/^\d{4}-\d\d-\d\dT/.test(submission.reviewedAt)||
   !Array.isArray(submission.sourceInventories)||
   submission.sourceInventories.length!==packet.photoCount)
  throw Error('Invalid, incomplete or AI-exposed blind reviewer submission');
 const sourceMap=uniqueIds(packet.originals,'sourceId'),submissionMap=uniqueIds(submission.sourceInventories,'sourceId');
 let total=0,unknown=0;const rows=[];
 for(const [sourceId,original] of sourceMap){
  const scene=submissionMap.get(sourceId);
  if(!ID.test(sourceId)||!SHA.test(original.sourceSha256||'')||
    !exactKeys(scene,['sourceId','sourceSha256','originalJpegShaVerified','fullSourceInspected',
      'allVisibleItemsRecorded','items','uncertaintyNotes'])||
    scene.sourceSha256!==original.sourceSha256||scene.originalJpegShaVerified!==true||
    scene.fullSourceInspected!==true||scene.allVisibleItemsRecorded!==true||
    !Array.isArray(scene.items)||scene.items.length>20||
    !limitedText(scene.uncertaintyNotes,500))
   throw Error('Original source JPEG not verified or whole scene not independently inventoried: '+sourceId);
  const localIds=new Set(),items=[];
  for(const item of scene.items){
   if(!exactKeys(item,['localItemId','category','form','visibility','evidence'])||
      !/^(?:g[0-9]{2})$/.test(item.localItemId||'')||
      localIds.has(item.localItemId)||!CATEGORIES.has(item.category)||
      !limitedText(item.form,80)||!item.form.trim()||
      !SHAPES.has(item.visibility)||!limitedText(item.evidence,500)||
      !item.evidence.trim())
    throw Error('Incomplete or speculative visible garment review: '+sourceId);
   localIds.add(item.localItemId);
   if(item.category==='Uncertain'||item.form==='Unknown')unknown++;
   items.push({...item});
  }
  if(!scene.items.length&&!scene.uncertaintyNotes.trim())
   throw Error('Zero-garment source requires negative-control scene rationale: '+sourceId);
  total+=items.length;
  rows.push({sourceId,sourceSha256:original.sourceSha256,itemCount:items.length,
   visibleForms:items.map(x=>({category:x.category,form:x.form,visibility:x.visibility})),
   // Two people can AGREE that an item is unknown or partly covered.
   // That agreement is not an independently verified form or physical mask.
   unresolvedFormOrVisibility:items.some(x=>x.category==='Uncertain'||
     /^(unknown|uncertain)$/i.test(x.form.trim())||x.visibility!=='visible'),
   sourceFullyInspected:true,photoHashVerified:true});
 }
 if(submissionMap.size!==sourceMap.size)throw Error('Unexpected extra original source');
 return {reviewerSlot:submission.reviewerSlot,reviewerAlias:submission.reviewerAlias,
  reviewedAt:submission.reviewedAt,sourcePhotos:rows.length,visibleItemObservations:total,
  unknownFormObservations:unknown,rows,oneReviewerVerifiedSubmission:true,
  independentGarmentGroundTruth:false,independentPixelMasksApproved:false,
  measuredRecall:null,canPromoteModel:false};
}
// Compare two human-submitted INDEPENDENT blind inventories. Agreement on a
// quantity/form, even if exact, cannot verify separate-instance outlines.
export function reconcileBlindOriginalSubmissions(firstPacket,first,secondPacket,second){
 const a=validateBlindOriginalSubmission(firstPacket,first);
 const b=validateBlindOriginalSubmission(secondPacket,second);
 if(a.reviewerSlot!=='first'||b.reviewerSlot!=='second'||
    a.reviewerAlias.trim().toLocaleLowerCase('en-US')===
      b.reviewerAlias.trim().toLocaleLowerCase('en-US'))
  throw Error('The two independent reviewers must have different identities');
 const photos=[];
 const two=new Map(b.rows.map(x=>[x.sourceId,x]));
 for(const row of a.rows){
  const other=two.get(row.sourceId);
  if(!other||other.sourceSha256!==row.sourceSha256)
   throw Error('Comparing different original source photographs');
  const tally=items=>{const map=new Map();for(const x of items){
   const key=x.category+'::'+x.form.trim().toLocaleLowerCase('en-US');
   map.set(key,(map.get(key)||0)+1);
  }return [...map].sort((x,y)=>x[0].localeCompare(y[0]));};
  const formAgreement=JSON.stringify(tally(row.visibleForms))===JSON.stringify(tally(other.visibleForms));
  const unresolvedFormOrVisibility=row.unresolvedFormOrVisibility||other.unresolvedFormOrVisibility;
  const visibilityAgreement=JSON.stringify(
   [...row.visibleForms.map(x=>x.visibility)].sort())===
   JSON.stringify([...other.visibleForms.map(x=>x.visibility)].sort());
  photos.push({sourceId:row.sourceId,sourceSha256:row.sourceSha256,
   firstObservedCount:row.itemCount,secondObservedCount:other.itemCount,
   countAgreement:row.itemCount===other.itemCount,
   categoryAndFormMultisetAgreement:formAgreement,
   visibilityMultisetAgreement:visibilityAgreement,
   unresolvedFormOrVisibility,
   needsThirdReviewer:row.itemCount!==other.itemCount||!formAgreement||
     !visibilityAgreement||unresolvedFormOrVisibility,
   actualPhysicalGarmentCount:null,instanceCorrespondenceVerified:false,
   sourcePixelOutlinesApproved:false});
 }
 return {schemaVersion:1,status:'human-observations-await-independent-adjudication',
  blindReviewers:2,sourcePhotos:photos.length,
  sourceHashIdentitiesMatch:true,
  reviewerAliases:[a.reviewerAlias,b.reviewerAlias],
  countsDisagree:photos.filter(x=>!x.countAgreement).map(x=>x.sourceId),
  categoryOrSpecificFormDisagree:photos.filter(x=>!x.categoryAndFormMultisetAgreement).map(x=>x.sourceId),
  unknownOrPartiallyVisiblePhotos:photos.filter(x=>x.unresolvedFormOrVisibility).map(x=>x.sourceId),
  photosNeedingThirdReviewer:photos.filter(x=>x.needsThirdReviewer).map(x=>x.sourceId),
  photosWithSameLabelsNotInstanceVerified:photos.filter(x=>!x.needsThirdReviewer).map(x=>x.sourceId),
  physicalGarmentRecall:null,independentMaskIoU:null,
  independentlyApprovedPhysicalInventories:0,approvedModelAccuracy:null,
  mayTrainOrAdjustModel:false,autoSavedGarments:0,paidProviderCalls:0,canRelease:false,
  photos};
}
