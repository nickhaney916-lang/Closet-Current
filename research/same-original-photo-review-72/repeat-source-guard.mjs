/**
 * SAME-SOURCE72: A re-selection of the EXACT SAME sha256-verified original
 * must not discard a signed-in owner's unsaved manual garment review.
 * Comparing file names, pixels or timestamps is not enough: only original
 * JPEG source SHA and the existing owner-bound human review gate qualify.
 * Empty/no-human-review state still permits intentional reimport (e.g.
 * an already saved source used to review a missed garment or test duplicates).
 */
import {shouldAskBeforePhotoSwitch68} from '../photo-switch-guard-68/source-discard-guard.mjs';
export function keepHumanReviewOnSameSource72({
 currentSHA256,nextSHA256,currentOwner,reviewOwner,pieces,submitting=false
}={}){
 const valid=s=>typeof s==='string'&&/^[a-f0-9]{64}$/i.test(s);
 return valid(currentSHA256)&&valid(nextSHA256)&&
  currentSHA256.toLowerCase()===nextSHA256.toLowerCase()&&
  shouldAskBeforePhotoSwitch68({currentOwner,reviewOwner,pieces,submitting});
}
