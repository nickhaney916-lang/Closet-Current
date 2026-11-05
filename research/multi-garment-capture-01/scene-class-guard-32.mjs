/**
 * SCENE-CLASS-TRUST-32 — strictly review-only category defaults for multi-piece photos.
 *
 * Real original-photo SegFormer evidence (#588) mislabeled overlapping shirts
 * as skirt and a flat-lay outfit as a dress fragment. A segmentation pixel
 * confidence is NOT a calibrated garment-category probability. Genuine
 * SegFormer and instance-model benchmarks have inadequate independent accuracy.
 * Even when a worker claims personDetected=true, score=1, single category and
 * unclipped mask, the category and pixel color must NEVER pre-fill the owner's
 * authoritative review fields. Suggestions are display-only and unverified.
 *
 * Never changes logits, masks, originals, source hashes, owner data or saved
 * records. Every proposed garment still needs a human category, subtype,
 * color, a user-reviewed crop, and an explicit confirmation.
 */
export const SCENE32_MIN_UNCALIBRATED_MASK_SCORE=0.95;
const VALID_CATEGORIES=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes']);
const cleanColor=value=>typeof value==='string'&&value.trim().length>0&&
 value.trim().length<=120&&value.trim()!=='Unknown'?value.trim():'';

export function sceneReviewDefaults32(raw) {
 const h=raw?.hint;
 const categories=Array.isArray(h?.categories)?
  [...new Set(h.categories.filter(x=>VALID_CATEGORIES.has(x)))]:[];
 const hasPerson=raw?.personDetected===true;
 const safeShape=h?.clipped===false;
 const unique=categories.length===1;
 const reason=!hasPerson?'no-person-evidence':!unique?'ambiguous-category':
  !safeShape?'clipped-or-unverified-mask':'model-label-unverified';
 // LABEL59: mask confidence and person flags are not verified category OR
 // color correctness. Always leave editable owner fields at empty defaults.
 // Even an apparent 1.0 score cannot preselect or authorize later saving.
 return {
  category:'Uncategorized',
  color:'',
  reason,
  requiresExplicitClassification:true
 };
}

export function canConfirmScene32(piece,schema) {
 const types=schema?.types?.[piece?.category];
 return !!(piece&&VALID_CATEGORIES.has(piece.category)&&
  Array.isArray(types)&&types.includes(piece.itemType)&&
  cleanColor(piece.color)&&piece.cropReviewed===true);
}
