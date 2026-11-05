/**
 * CANCEL74 — cancellation of a local photograph extraction must not silently
 * destroy an authenticated owner's unsaved, human-reviewed source and crops.
 *
 * Browser-independent and side-effect free. Reuses the existing human-edit
 * signal (manual marks, reviewed crops, category/type/color or confirmation).
 * A logged-out or different owner must never preserve another user's photo.
 */
import {hasUnsavedHumanReview68} from '../photo-switch-guard-68/source-discard-guard.mjs';
export function needsCancelReviewConsent74({
 currentOwner,reviewOwner,dbName,pieces,submitting=false
}={}){
 return submitting!==true&&
  typeof currentOwner==='string'&&currentOwner.length>0&&
  reviewOwner===currentOwner&&dbName==='closet-current-user-'+currentOwner&&
  hasUnsavedHumanReview68(pieces);
}
export const CANCEL_REVIEW_PROMPT74=
 'You have clothing crops or details that have not been saved. Discard this unfinished review? Choose Cancel to keep the original photograph and your clothing corrections.';
