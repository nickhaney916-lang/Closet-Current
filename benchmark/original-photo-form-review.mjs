// Quality gate for REAL previously run original-photo inference.
// File names/captions and zero-shot outputs are never garment truth.
// No user photos, model inference, customer writes or paid APIs.
const HASH=/^[a-f0-9]{64}$/;
const sourceId=/^(?:commons|validation)-\d{4}$/;
const forms={
 Tops:new Set(['T-shirt','Sweatshirt','Blouse','Tunic','Polo','Sweater','Cardigan','Shirt','Hoodie','Tank top']),
 Bottoms:new Set(['Skirt','Shorts','Jeans','Trousers','Leggings','Pants','Joggers']),
 Dresses:new Set(['Dress','Casual dress','Formal dress','Shirt dress','Sweater dress']),
 Outerwear:new Set(['Jacket','Blazer','Coat','Raincoat','Vest']),
 Shoes:new Set(['Sneakers','Ankle boots','Boots','Tall boots','Sandals','Flats','Loafers','Heels']),
 Accessories:new Set(['Scarf','Hat','Bag','Belt','Sunglasses'])
};
const hasText=v=>typeof v==='string'&&v.trim().length>0;
const unique=(rows,key)=>{const out=new Map();for(const item of rows){
 if(!item||!hasText(item[key])||out.has(item[key]))throw Error('Duplicate or missing '+key);
 out.set(item[key],item);
}return out;};
const titleCues=/(?:\band\b|\bwith\b|\bunderneath\b|\bover\b)/i;
export function originalFormReviewQueue(manifest,locked,results){
 if(!Array.isArray(manifest)||!Array.isArray(locked)||!Array.isArray(results)||
    !manifest.length)throw Error('Missing fixed source, locked originals or predictions');
 const locks=unique(locked,'id'),predictions=unique(results,'id'),seen=new Set(),rows=[];
 for(const item of manifest){
  if(!sourceId.test(item?.id||'')||seen.has(item.id)||item.mode!=='single'||
     item.verified!==true||!hasText(item.expectedCategory)||!hasText(item.expectedType))
   throw Error('Invalid or duplicate source manifest record');
  seen.add(item.id);
  const original=locks.get(item.id),result=predictions.get(item.id);
  if(!original||!result||original.image!==item.image||
     !HASH.test(original.sha256||'')||original.verified!==true||
     original.attribution?.source!==item.source||
     !hasText(original.attribution?.license))
   throw Error('Missing SHA-locked licensed original or real inference: '+item.id);
  const isClothing=item.expectedCategory!=='Uncategorized';
  if(isClothing&&!forms[item.expectedCategory]?.has(item.expectedType)&&
     !item.acceptedTypes?.some(t=>forms[item.expectedCategory]?.has(t)))
   throw Error('Unsupported reference category or specific form');
  const predictedCategory=result.prediction?.category||null,
   predictedType=result.prediction?.type||null;
  const accepted=[item.expectedType,...(item.acceptedTypes||[])];
  const broadMatch=isClothing&&predictedCategory===item.expectedCategory;
  const typeMatch=broadMatch&&accepted.includes(predictedType);
  // A museum file name only produces a CUE for independent whole-source
  // review. It does not prove a particular number of visible garments.
  const title=original.attribution.title||'';
  const mixedSourceTitleCue=titleCues.test(title)&&
   /\b(?:shirt|blouse|jacket|dress|skirt|trousers|sneakers|coat)\b/i.test(title);
  const issueTypes=[
   ...(mixedSourceTitleCue?['original-title-may-describe-multiple-items']:[]),
   ...(!predictedCategory&&isClothing?['garment-category-abstained']:[]),
   ...(result.strong===true&&broadMatch&&!typeMatch?['strong-specific-form-disagreement']:[]),
   ...(isClothing&&predictedCategory&&predictedCategory!==item.expectedCategory?['broad-category-disagreement']:[])
  ];
  rows.push({sourceId:item.id,image:item.image,sourceSha256:original.sha256,
   originalSourceUrl:original.attribution.source,attribution:{title,license:original.attribution.license},
   manifestLabel:{category:item.expectedCategory,type:item.expectedType,acceptedTypes:accepted},
   modelResult:{category:predictedCategory,type:predictedType,strong:result.strong===true,
     categoryMatchToUnadjudicatedManifest:broadMatch,formMatchToUnadjudicatedManifest:typeMatch},
   flags:issueTypes,physicalGarmentsInSource:null,reviewedPhysicalGarmentForms:null,
   firstReviewer:null,independentSecondReviewer:null,fullSourceItemRecall:null,
   independentlyApproved:false,canApproveTrainingOrRelease:false});
 }
 if(predictions.size!==rows.length||[...predictions.keys()].some(k=>!seen.has(k)))
  throw Error('Extra/missing original-photo inference records');
 const issues=rows.filter(x=>x.flags.length>0);
 return {schemaVersion:1,status:'requires-independent-full-original-source-review',
  evidence:'actual-model-results-and-sha-locked-licensed-originals',
  originalSourcePhotos:rows.length,clothingManifestPhotos:rows.filter(x=>x.manifestLabel.category!=='Uncategorized').length,
  flaggedSourceCount:issues.length,flaggedSourceIds:issues.map(x=>x.sourceId),
  strongWrongTypeVsManifestIds:rows.filter(x=>x.flags.includes('strong-specific-form-disagreement')).map(x=>x.sourceId),
  multipleItemTitleCueIds:rows.filter(x=>x.flags.includes('original-title-may-describe-multiple-items')).map(x=>x.sourceId),
  categoryAccuracyAfterIndependentReview:null,formAccuracyAfterIndependentReview:null,
  physicalItemRecall:null,independentHumanRecords:0,
  modelPolicyChanged:false,customerAutoSaves:0,productionReady:false,
  note:'File titles and existing manifest expected types may themselves be wrong. Review the full SHA-locked original, independently inventory garments and settle the specific form before treating a zero-shot type disagreement as an accuracy failure.',
  rows};
}
