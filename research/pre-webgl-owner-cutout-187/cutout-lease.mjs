/**
 * MAIN P187 — immutable read-only owner cutout/source/review lease.
 * Captures ONLY a currently P186-WebCrypto-verified owner reviewed original
 * + cutout, and checks all relevant in-place fields after asynchronous WebGL.
 *
 * All image strings remain in this private closure; the native public
 * controller returns only the P186 SHA metadata as an opaque WeakMap key.
 * Owner-approved is not independent annotation or 3D fabric certification.
 */
const SHA=/^[0-9a-f]{64}$/;
const failure=message=>{throw Error('P187 '+message);};
function photoReviewIdentity187(row){
 const h=row?.segmentHint||{},p=row?.originalPhoto||{};
 return [row?.id,row?.ownerId,row?.sourceId,row?.sourceSHA256,
  row?.sourceHash,row?.sourceHashVerified,
  row?.category,row?.itemType,row?.ownerReviewed,row?.humanReviewedSource,
  row?.reviewProvenance,row?.cutoutSHA256,
  p.sha256,p.image,
  h.verified,h.ownerReviewedInstance,h.originalSHA256,h.cutoutSHA256,h.cutoutImage];
}
export function captureReviewedCutoutLease187({
 row,receipt,ownerId,generation,revision
}={}){
 if(!row||typeof ownerId!=='string'||!ownerId||
  row.ownerId!==ownerId||!Number.isSafeInteger(generation)||
  !Number.isSafeInteger(revision)||revision<1||
  receipt?.ownerId!==ownerId||receipt?.garmentId!==row.id||
  receipt?.sourceId!=='commons-0016'||row.sourceId!==receipt.sourceId||
  !SHA.test(receipt?.originalSourceSHA256||'')||
  !SHA.test(receipt?.cutoutSHA256||'')||
  row.sourceSHA256!==receipt.originalSourceSHA256||
  row.cutoutSHA256!==receipt.cutoutSHA256||
  row.ownerReviewed!==true||row.humanReviewedSource!==true||
  receipt.originalJPEGBytesSHA256Verified!==true||
  receipt.cutoutJPEGBytesSHA256Verified!==true||
  receipt.reviewedInstance!==true||
  receipt.verifiedCutoutSeparatedFromOriginal!==true||
  receipt.releaseAuthorized!==false||receipt.familyAlpha!=='HOLD')
  failure('exact owner-reviewed double-JPEG proof and current wardrobe required');
 const source=photoReviewIdentity187(row);
 // Freeze externally visible status, but retain original photo bytes exclusively
 // within the assertCurrent closure, never on the returned receipt.
 const opaque=Object.freeze({...receipt});
 const assertCurrent=({
  row:currentRow,ownerId:currentOwner,generation:currentGeneration,
  revision:currentRevision
 }={})=>{
  if(currentRow!==row||currentOwner!==ownerId||
   currentGeneration!==generation||currentRevision!==revision)
   failure('owner, saved garment or wardrobe epoch changed; close 3D');
  const now=photoReviewIdentity187(currentRow);
  if(source.length!==now.length||now.some((v,i)=>v!==source[i]))
   failure('original JPEG, reviewed cutout or review decision changed; close 3D');
  return true;
 };
 return Object.freeze({receipt:opaque,assertCurrent});
}
