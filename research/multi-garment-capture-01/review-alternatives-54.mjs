/**
 * REVIEW-ALTERNATIVES-54: uncertain FashionCLIP crop evidence is only a
 * suggestion for human comparison. Scores are relative ranks, not calibrated
 * probabilities. Do not infer from the original whole-outfit photograph.
 *
 * The output is ephemeral review UI data; confirmed fields are set only by
 * an explicit human button action followed by the existing save checkbox.
 */
const MAX_OPTIONS54=3;
const MAX_EVIDENCE_SCAN54=3;
const SUPPORTED54=Object.freeze(['Tops','Bottoms','Dresses','Outerwear','Shoes']);

function validCategory54(category,schema,categories){
 return typeof category==='string'&&
  SUPPORTED54.includes(category)&&Array.isArray(categories)&&categories.includes(category)&&
  Array.isArray(schema?.types?.[category]);
}
function boundedCandidate54(source,schema,categories){
 if(!source||typeof source!=='object'||Array.isArray(source)||!validCategory54(source.category,schema,categories))return null;
 const category=source.category,proposed=source.itemType??source.type??null;
 const itemType=typeof proposed==='string'&&proposed!=='Unknown'&&
  schema.types[category].includes(proposed)?proposed:null;
 return Object.freeze({category,itemType,needsConfirmation:true});
}

/**
 * Work from the CROP's original model response, not the person's whole photo,
 * metadata, color estimate, source model or the authoritative wardrobe.
 * Nothing here certifies a subtype, category, model accuracy or confidence.
 */
export function reviewAlternatives54(cropResult,schema,categories){
 if(cropResult?.strong===true||cropResult?.categoryConfirmed===true)return Object.freeze([]);
 if(!cropResult||typeof cropResult!=='object'||!schema?.types||!Array.isArray(categories))return Object.freeze([]);
 const d=cropResult.diagnostics;
 if(!d||typeof d!=='object'||Array.isArray(d))return Object.freeze([]);
 const raw=[];
 // Distinct diagnostic views may contradict; preserve both rather than
 // silently choosing the model's most confident-looking wrong answer.
 for(const key of ['branch','overall','confirmation','category']){
  if(!Array.isArray(d[key]))continue;
  for(const entry of d[key].slice(0,MAX_EVIDENCE_SCAN54)){
   const candidate=boundedCandidate54(entry,schema,categories);
   if(candidate)raw.push(candidate);
  }
 }
 const unique=[];const seen=new Set();
 const add=c=>{
  const key=c.category+'|'+(c.itemType||'');
  if(!seen.has(key)){seen.add(key);unique.push(c);}
 };
 // First preserve distinct broad categories where diagnostic views disagree.
 const broad=new Set();
 for(const c of raw){if(!broad.has(c.category)){add(c);broad.add(c.category);}}
 for(const c of raw)add(c);
 return Object.freeze(unique.slice(0,MAX_OPTIONS54));
}

/**
 * Explicit human review action. This modifies only the unsaved in-memory
 * selection; it does NOT confirm, save, infer color or rewrite the source JPEG.
 * The existing owner's submit transaction independently validates every field.
 */
export function applyReviewAlternative54(piece,choice,schema,categories){
 if(!piece||typeof piece!=='object'||piece.cropReviewed!==true||
    !choice||choice.needsConfirmation!==true)return false;
 const normalized=boundedCandidate54(choice,schema,categories);
 if(!normalized||normalized.category!==choice.category||
    normalized.itemType!==choice.itemType)return false;
 piece.category=normalized.category;
 piece.itemType=normalized.itemType||'Unknown';
 piece.confirmed=false;
 return true;
}
