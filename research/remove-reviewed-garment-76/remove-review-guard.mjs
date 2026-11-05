/**
 * REMOVE76 — one garment's uncommitted human corrections are not equivalent
 * to an untouched model proposal. An accidental Remove detection tap must
 * never silently destroy a reviewed source-crop, category, type or color.
 *
 * Pure, source-owner-bound review decision only. Already committed wardrobe
 * rows are outside of this module and must never be deleted by review UI.
 */
import {hasUnsavedHumanReview68} from '../photo-switch-guard-68/source-discard-guard.mjs';
export function needsRemoveReviewConsent76({
 currentOwner,reviewOwner,dbName,piece,submitting=false
}={}){
 return submitting!==true&&typeof currentOwner==='string'&&
  currentOwner.length>0&&reviewOwner===currentOwner&&
  dbName==='closet-current-user-'+currentOwner&&
  hasUnsavedHumanReview68([piece]);
}
export const REMOVE_REVIEW_PROMPT76=
 'This garment has unsaved crop or clothing corrections. Remove this one garment from the current photo review? Choose Cancel to keep its crop, category, clothing type and color.';
