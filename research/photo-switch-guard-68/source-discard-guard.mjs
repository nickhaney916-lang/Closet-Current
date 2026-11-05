/**
 * PHOTO-SWITCH-REVIEW-GUARD-68 — protect unpublished manual review from
 * accidental replacement by a newly selected camera/import JPEG.
 *
 * This is deliberately separate from the auth/session-lock cleanup:
 * explicit owner logout MUST revoke sensitive images without prompting.
 * A genuine next photo chosen by the same signed-in owner may require
 * confirmation if any human-touched review state exists.
 *
 * Model-only unreviewed automatic proposals are not human work and may be
 * replaced without a disruptive dialog. This module has no browser state,
 * image copies, storage, network calls or automated classification.
 */
export function hasUnsavedHumanReview68(pieces){
 if(!Array.isArray(pieces))return false;
 return pieces.some(p=>{
  if(!p||typeof p!=='object'||Array.isArray(p))return false;
  // A user clicking Add missed piece, adding crop/segmentation edits,
  // manually choosing any detail, or checking confirmation is work, even
  // if they have not yet met the strict final-save confirmation gates.
  if(p.manual===true||p.cropReviewed===true||p.confirmed===true||
     p.userAdjusted===true)return true;
  if(typeof p.category==='string'&&p.category!=='Uncategorized'&&p.category!=='')return true;
  if(typeof p.itemType==='string'&&p.itemType!=='Unknown'&&p.itemType!=='')return true;
  if(typeof p.color==='string'&&p.color.trim().length>0)return true;
  return false;
 });
}
export function shouldAskBeforePhotoSwitch68({currentOwner,reviewOwner,pieces,submitting=false}={}){
 // A switched/logged-out owner must NEVER be allowed to preserve the
 // previous owner's private source. Session cleanup is authoritative.
 return submitting!==true&&typeof currentOwner==='string'&&currentOwner.length>0&&
  currentOwner===reviewOwner&&hasUnsavedHumanReview68(pieces);
}
export const DISCARD_PROMPT68='You have clothing crops or details that are not saved. Discard that review and open the newly selected photo? Choose Cancel to keep your current photo and corrections.';
