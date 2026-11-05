/**
 * MIXED80 — preserving useful newly confirmed garments while avoiding
 * accidentally re-importing a previously saved garment from the same source.
 *
 * No IDB writes or mutations, no automatic skipping. The actual UI must
 * request explicit owner consent before using the fresh selection.
 * The final atomic-save transaction ALWAYS rechecks all duplicate/CAS gates.
 */
import {pieceKey24,SHA24} from './atomic-group.mjs';
import {nearDuplicateSourceRegions67} from './source-near-duplicate-67.mjs';

export const MIXED_REVIEW_PROMPT80=
 'Some confirmed garments are already saved from this original photo. Save only the newly confirmed garments and exclude the already-saved review cards? Existing closet items will not be overwritten, and corrections to them will not be applied. Choose Cancel to keep every review card unchanged.';

export function partitionPreviouslySaved80({saved,pieces,proof,ownerId}={}){
 if(!Array.isArray(saved)||!Array.isArray(pieces)||
  !proof?.sourceHashVerified||!SHA24.test(proof.sourceSHA256||'')||
  proof.originalPhoto?.sha256!==proof.sourceSHA256||
  typeof ownerId!=='string'||!ownerId)
  throw Error('MIXED80 invalid signed-owner original photo selection');
 const fresh=[],duplicates=[],exact=[],near=[];
 for(const piece of pieces){
  // All user confirmations and crop validity have already passed through
  // snapshotConfirmations34. This conservative preflight cannot save them.
  const sourcePieceKey=pieceKey24(proof.sourceSHA256,piece.instanceKey);
  const sameOwnerRows=saved.filter(x=>x&&x.ownerId===ownerId);
  const isExact=sameOwnerRows.some(x=>x.id===piece.id||
   x.sourcePieceKey===sourcePieceKey);
  const preview={
   id:piece.id,ownerId,sourcePieceKey,sourceSHA256:proof.sourceSHA256,
   sourceHashVerified:true,originalPhoto:{sha256:proof.sourceSHA256},
   sourceCropReviewed:piece.cropReviewed===true,extractionReview:piece.confirmed===true?'human-confirmed':'unverified',
   category:piece.category,itemType:piece.itemType,color:piece.color,
   extractionBounds:piece.cropBounds
  };
  const isNear=!isExact&&nearDuplicateSourceRegions67(sameOwnerRows,[preview]).length>0;
  if(isExact||isNear){
   duplicates.push(piece);
   if(isExact)exact.push(piece);else near.push(piece);
  }else fresh.push(piece);
 }
 return {fresh,duplicates,exact,near};
}
