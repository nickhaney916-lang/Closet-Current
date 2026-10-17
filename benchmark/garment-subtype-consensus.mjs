// Review-only subtype reconciliation, never production inference or auto-saving.
// The semantic mask is a location cue; two independent image framings must
// agree on a catalog type, but agreement does not prove pixel-level separation.
// No benchmark's expected label is read or used as classifier evidence.
const SEMANTIC_ALLOW=Object.freeze({
  4:Object.freeze({Tops:['T-shirt','Blouse','Button-down shirt','Polo','Tank top','Sweater','Sweatshirt','Hoodie','Tunic'],
                  Outerwear:['Jacket','Coat','Blazer','Cardigan','Vest','Raincoat']}),
  5:Object.freeze({Bottoms:['Skirt']}),
  6:Object.freeze({Bottoms:['Jeans','Trousers','Leggings','Shorts','Joggers']}),
  7:Object.freeze({Dresses:['Casual dress','Shirt dress','Sweater dress','Formal dress','Jumpsuit','Romper']}),
  9:Object.freeze({Shoes:['Sneakers','Flats','Heels','Sandals','Ankle boots','Tall boots','Loafers']})
});
const isSha=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const verdict=(reason,base,detail={})=>({
  ...base,reason,status:'needs-review',catalogType:null,
  canAutoCreateItems:false,canOverwriteOriginal:false,
  originalPhotoPreserved:true,maskAccuracyMeasured:false,
  independentInstanceSeparationVerified:false,...detail
});

export function reconcileGarmentSubtype({
  sourceSha256,semanticClass,regionId,whole,confirmation,minScore=.62,minMargin=.15
}){
  const allowed=SEMANTIC_ALLOW[semanticClass];
  if(!isSha(sourceSha256)||!allowed||typeof regionId!=='string'||regionId.length===0
    ||regionId.length>100||!Number.isFinite(minScore)||minScore<.5||minScore>.95
    ||!Number.isFinite(minMargin)||minMargin<.05||minMargin>.5)
    throw Error('Invalid garment subtype source or class');

  const base={sourceSha256,semanticClass,regionId,possibleCategories:Object.keys(allowed)};
  const validView=view=>view&&typeof view.category==='string'&&typeof view.itemType==='string'
    &&Number.isFinite(view.score)&&view.score>=0&&view.score<=1
    &&Number.isFinite(view.secondScore)&&view.secondScore>=0&&view.secondScore<=1
    &&typeof view.sourceSha256==='string'&&isSha(view.sourceSha256)
    &&typeof view.frame==='string'&&view.frame.length>0&&view.frame.length<100;
  if(!validView(whole)||!validView(confirmation))
    return verdict('missing-or-invalid-independent-view',base);
  if(whole.sourceSha256!==sourceSha256||confirmation.sourceSha256!==sourceSha256)
    return verdict('source-photo-mismatch',base);
  if(whole.frame===confirmation.frame)
    return verdict('same-framing-not-independent-confirmation',base);

  const raw={views:[{frame:whole.frame,category:whole.category,itemType:whole.itemType,score:whole.score},
                  {frame:confirmation.frame,category:confirmation.category,itemType:confirmation.itemType,score:confirmation.score}]};
  const supported=view=>allowed[view.category]?.includes(view.itemType)===true;
  if(!supported(whole)||!supported(confirmation))
    return verdict('semantic-class-disagrees-with-candidate',base,raw);
  if(whole.category!==confirmation.category||whole.itemType!==confirmation.itemType)
    return verdict('two-framings-disagree',base,raw);
  if([whole,confirmation].some(v=>v.score<minScore||v.score-v.secondScore<minMargin))
    return verdict('weak-or-close-subtype-prediction',base,raw);

  return verdict('cross-view-subtype-consistent',base,{
    ...raw,status:'candidate-for-review',category:whole.category,
    catalogType:whole.itemType,subtypeEvidencePresent:true,
    // Still not an instance proof: classification cannot split a jacket
    // from a shirt sharing semantic class 4 or shorts from pants class 6.
    independentlyConfirmedType:false
  });
}

// One semantic region NEVER yields two wardrobe entries unless truly distinct,
// independently reviewed source-matched instance masks are available.
// This experiment deliberately does not accept a boolean "looks distinct".
export function reconcileOutfitInstances({sourceSha256,regions,subtypes}){
  if(!isSha(sourceSha256)||!Array.isArray(regions)||!Array.isArray(subtypes)
    ||regions.length>20||subtypes.length>20)throw Error('Invalid outfit evidence');
  const regionIds=new Set();
  for(const r of regions){
    if(!r||typeof r.regionId!=='string'||!r.regionId||
       regionIds.has(r.regionId)||![4,5,6,7,9].includes(r.semanticClass))
      throw Error('Duplicate or unknown semantic region');
    regionIds.add(r.regionId);
  }
  const byRegion=new Map();
  for(const s of subtypes){
    if(!s||s.sourceSha256!==sourceSha256||!regionIds.has(s.regionId))
      throw Error('Subtypes cannot be attached to other photographs or missing regions');
    const region=regions.find(r=>r.regionId===s.regionId);
    if(s.semanticClass!==region.semanticClass)
      throw Error('Subtype category mask mismatch');
    const items=byRegion.get(s.regionId)||[];items.push(s);byRegion.set(s.regionId,items);
  }
  const cases=[];
  for(const r of regions){
    const guesses=byRegion.get(r.regionId)||[];
    const approved=guesses.filter(s=>s.status==='candidate-for-review'&&typeof s.catalogType==='string');
    const collision=guesses.length>1;
    cases.push({regionId:r.regionId,semanticClass:r.semanticClass,proposedType:
      collision?null:approved[0]?.catalogType||null,
      conflict:collision?'multiple-subtypes-for-one-semantic-region':null,
      detectedWithoutCatalogType:approved.length===0,
      independentInstancesVerified:false,
      candidateCount:guesses.length});
  }
  return {sourceSha256,cases,regionsFound:regions.length,
    garmentCandidates:cases.filter(c=>c.proposedType!==null).length,
    autoCreatedItems:0,unverifiedDuplicatesCreated:0,
    productionAuthorized:false,sourcePhotoPreserved:true,
    unresolved:cases.filter(c=>c.conflict||c.detectedWithoutCatalogType).map(c=>c.regionId)};
}
