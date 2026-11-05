/**
 * SOURCE70 — pure file-size and owner/epoch preflight guards for two-phase
 * source replacement. No private image data, browser storage, network, model
 * or state mutation. A valid file size is NOT proof of JPEG authenticity:
 * makeProof + full source decode must complete before review replacement.
 */
export const MAX_REPLACEMENT_BYTES70=10*1024*1024;
export const MIN_REPLACEMENT_BYTES70=128;
export function validReplacementFile70(file){
 return !!file&&typeof file==='object'&&
  Number.isSafeInteger(file.size)&&file.size>=MIN_REPLACEMENT_BYTES70&&
  file.size<=MAX_REPLACEMENT_BYTES70&&typeof file.arrayBuffer==='function';
}
export function sourcePreflightStillCurrent70({
 selection,currentSelection,reviewEpoch,currentReviewEpoch,
 owner,currentOwner,dbName,submitting
}={}){
 return Number.isSafeInteger(selection)&&selection>0&&
  currentSelection===selection&&
  Number.isSafeInteger(reviewEpoch)&&reviewEpoch>=0&&
  currentReviewEpoch===reviewEpoch&&
  typeof owner==='string'&&owner.length>0&&
  owner===currentOwner&&
  dbName==='closet-current-user-'+owner&&
  submitting!==true;
}
