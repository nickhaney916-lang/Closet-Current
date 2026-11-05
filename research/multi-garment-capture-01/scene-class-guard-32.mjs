/**
 * SCENE-CLASS-TRUST-32 — strictly review-only category defaults for multi-piece photos.
 *
 * Real original-photo SegFormer evidence (#588) mislabeled overlapping shirts
 * as skirt and a flat-lay outfit as a dress fragment. A segmentation pixel
 * confidence is NOT a calibrated garment-category probability. In the absence
 * of affirmative person evidence, or with cropped/ambiguous/low-score regions,
 * the label must not pre-fill the user's category or color.
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
 const score=typeof h?.confidence==='number'?h.confidence:NaN;
 const strong=Number.isFinite(score)&&score>=SCENE32_MIN_UNCALIBRATED_MASK_SCORE&&score<=1;
 const unique=categories.length===1;
 const preselect=hasPerson&&safeShape&&strong&&unique;
 const reason=!hasPerson?'no-person-evidence':!unique?'ambiguous-category':
  !safeShape?'clipped-or-unverified-mask':'uncalibrated-mask-score';
 return {
  category:preselect?categories[0]:'Uncategorized',
  color:preselect?cleanColor(raw?.colorEstimate?.color):'',
  reason:preselect?'model-suggestion-requires-human-confirmation':reason,
  requiresExplicitClassification:!preselect
 };
}

export function canConfirmScene32(piece,schema) {
 const types=schema?.types?.[piece?.category];
 return !!(piece&&VALID_CATEGORIES.has(piece.category)&&
  Array.isArray(types)&&types.includes(piece.itemType)&&
  cleanColor(piece.color)&&piece.cropReviewed===true);
}
