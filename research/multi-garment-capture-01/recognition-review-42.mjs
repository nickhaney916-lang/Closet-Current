/**
 * COLOR46: A reviewed crop's pixel palette is an UNVERIFIED observation.
 * This function only constrains labels, and never infers a mask or certifies
 * garment color. It is independent of FashionCLIP's text-classification guess.
 */
export function boundedCropColor46(pixels,palette){
 if(!pixels||!Array.isArray(palette)||!palette.includes(pixels.primary))return null;
 const secondary=palette.includes(pixels.secondary)&&pixels.secondary!==pixels.primary?pixels.secondary:null;
 return {source:'reviewed-crop-pixels',primary:pixels.primary,secondary,needsConfirmation:true};
}

/**
 * SUBTYPE47: A conservative review gate informed by independently reproduced
 * high-confidence FashionCLIP confusions (PR #599): T-shirt / Sweatshirt,
 * Blouse / Tunic, and Sneakers / Ankle boots. This does NOT correct a model
 * prediction or establish category accuracy. It withholds an unsafe specific
 * subtype from the main AI suggestion, retaining a human-review comparison.
 * Broad category remains independently unverified until the person confirms.
 */
export const CONFUSABLE_SUBTYPES47=Object.freeze({
 Tops:Object.freeze({'T-shirt':'Sweatshirt','Sweatshirt':'T-shirt','Blouse':'Tunic','Tunic':'Blouse'}),
 Shoes:Object.freeze({'Sneakers':'Ankle boots','Ankle boots':'Sneakers'})
});
export function guardConfusableSubtype47(suggestion,schema){
 const category=suggestion?.category,choice=suggestion?.itemType;
 const alternative=CONFUSABLE_SUBTYPES47[category]?.[choice];
 if(!alternative||!Array.isArray(schema?.types?.[category])||
    !schema.types[category].includes(choice)||!schema.types[category].includes(alternative))
  return {suggestion,subtypeReview47:null};
 return {
  suggestion:{...suggestion,itemType:null},
  subtypeReview47:{
   candidate:choice,alternative,
   reason:'independently-observed-high-confidence-confusion',
   needsConfirmation:true
  }
 };
}

export function normalizeSuggestion42(result, schema, palette, categories) {
 const choice=result?.choices?.[0];
 const types=schema.types[choice?.category];
 const category=(result?.strong===true||result?.categoryConfirmed===true)&&
  categories.includes(choice?.category)&&Object.hasOwn(schema.types,choice?.category)&&Array.isArray(types)?choice.category:null;
 return {
  category,
  itemType:category&&result.strong===true&&!result.categoryOnly&&types.includes(choice.itemType)&&
   choice.itemType!=='Unknown'?choice.itemType:null,
  color:palette.includes(result?.details?.color)?result.details.color:null
 };
}

export async function recognizeReviewedCrop42({original,crop,version,signal,schema,palette,categories}) {
 signal.throwIfAborted();
 const profile=typeof location!=='undefined'&&new URLSearchParams(location.search).get('classificationAccuracy48')==='research'?'&recognitionProfile=accuracy48':'';
 const worker=new Worker('local-worker.mjs'+(version?'?v='+encodeURIComponent(version):'?')+profile,{type:'module'});
 try {
  const request=image=>new Promise((resolve,reject)=>{
   signal.throwIfAborted();
   const id=crypto.randomUUID();
   let settled=false;
   const cleanup=()=>{
    settled=true;
    clearTimeout(timer);
    signal.removeEventListener('abort',abort);
    worker.onmessage=null;
    worker.onerror=null;
   };
   const fail=()=>{cleanup();reject(Error('Local recognition unavailable'));};
   const abort=()=>{cleanup();reject(signal.reason);};
   const timer=setTimeout(fail,120000);
   signal.addEventListener('abort',abort,{once:true});
   worker.onerror=fail;
   worker.onmessage=({data})=>{
    if(settled||data?.id!==id)return;
    if(data.type==='error')fail();
    if(data.type==='result'){cleanup();resolve(data);}
   };
   try{worker.postMessage({type:'classify',id,image});}catch{fail();}
  });
  const originalContext=normalizeSuggestion42(await request(original),schema,palette,categories);
  const cropResult=await request(crop);
  const rawSuggestion=normalizeSuggestion42(cropResult,schema,palette,categories);
  const {suggestion,subtypeReview47}=guardConfusableSubtype47(rawSuggestion,schema);
  // A confident model does not imply an independently verified subtype:
  // known unsafe top/shoe pairs explicitly downgrade to category-only advice.
  // Never promote the full-original context into a missing crop label.
  return {source:'local-fashionclip',originalContext,...suggestion,
   ...(subtypeReview47?{subtypeReview47}:{}),
   colorSource:suggestion.color?'recognition':null,
   status:suggestion.itemType?'subtype-suggested':suggestion.category?'category-only':'abstained'};
 } finally {
  worker.terminate();
 }
}
