// Conservative admission policy for visually overlapping garment subtypes.
// A model can be confident yet wrong when semantic labels share silhouettes.
// Preserve the verified broad category; require the wearer to confirm the subtype.
// No benchmark photo IDs, hashes, image sources or ground-truth labels are used.
const overlappingFamilies=Object.freeze({
  Tops:new Set(['Tunic']),
  Outerwear:new Set(['Blazer']),
  Shoes:new Set(['Ankle boots'])
});
export function requireSubtypeReview(result){
  if(!result?.strong||!Array.isArray(result.choices)||!result.choices.length)return result;
  const top=result.choices[0];
  if(!overlappingFamilies[top.category]?.has(top.itemType))return result;
  return {
    ...result,
    strong:false,
    categoryConfirmed:true,
    categoryOnly:true,
    choices:[{...top,itemType:'Unknown',sleeveLength:top.category==='Shoes'?'Not applicable':'Unknown'}],
    details:{},
    reason:'subtype_needs_review',
    diagnostics:{...result.diagnostics,reviewFamily:top.category,proposedSubtype:top.itemType}
  };
}
