/**
 * MAIN1054 M157 — read-only admission for two separately owner-reviewed
 * PHOTO119 cutouts sharing one original JPEG. v3 must fail closed for
 * ambiguous MULTI24 crops, unreviewed masks and duplicated cutouts.
 * This proves signed owner *review provenance*, not physical-mask accuracy.
 * No persistence, network or 3D authorization.
 */
const SHA=/^[0-9a-f]{64}$/;
const PREFIX='data:image/jpeg;base64,';
const B64=/^[A-Za-z0-9+/]*={0,2}$/;
function boundedCutoutBytes(image){
 if(typeof image!=='string'||image.length>4_000_000||!image.startsWith(PREFIX))return null;
 const encoded=image.slice(PREFIX.length);
 if(!encoded.length||encoded.length%4!==0||!B64.test(encoded))return null;
 const padding=encoded.endsWith('==')?2:encoded.endsWith('=')?1:0;
 const predicted=encoded.length/4*3-padding;
 if(predicted<4||predicted>3_000_000)return null;
 try{
  const bytes=Uint8Array.from(atob(encoded),ch=>ch.charCodeAt(0));
  return bytes.length===predicted&&bytes[0]===255&&bytes[1]===216?bytes:null;
 }catch{return null;}
}
async function readReviewedPiece(row,owner,provider){
 // Retired owner-private sources are not active proof of an independently
 // reviewed sibling. Their historical crop hashes cannot resurrect the same
 // original under a fresh ID through v1-v3 restore.
 if(!row||Boolean(row.deleted)||Boolean(row.sourceRevoked)||
    typeof row!=='object'||Array.isArray(row)||row.ownerId!==owner||
    row.sourceHashVerified!==true||row.singleGarmentVerified!==false||
    row.ownerReviewed!==true||row.humanReviewedSource!==true||
    row.reviewProvenance!=='explicit-owner-claim-not-independent-review-evidence'||
    !SHA.test(row.sourceSHA256||'')||
    row.originalPhoto?.ownerId!==owner||
    row.originalPhoto.sha256!==row.sourceSHA256||
    typeof row.originalPhoto.image!=='string'||
    !row.originalPhoto.image.startsWith(PREFIX)||
    !SHA.test(row.cutoutSHA256||''))return null;
 const reviewed=row.confirmedDetailsSource31;
 if(reviewed?.basis!=='PHOTO119-explicit-owner-confirmation'||
    reviewed.ownerId!==owner||reviewed.itemId!==row.id||
    reviewed.sourceSHA256!==row.sourceSHA256||
    row.confirmedDetails?.category!==row.category||
    row.confirmedDetails?.itemType!==row.itemType||
    row.confirmedDetails?.color!==row.color||
    row.confirmedCategory!==true||row.confirmedColor!==true||
    row.colorSource!=='user')return null;
 const hint=row.segmentHint;
 if(!hint||hint.verified!==true||hint.ownerReviewedInstance!==true||
    hint.clipped===true||hint.originalSHA256!==row.sourceSHA256||
    hint.cutoutSHA256!==row.cutoutSHA256||
    row.cutoutSHA256===row.sourceSHA256||
    hint.cutoutImage===row.originalPhoto.image||
    (row.sourcePieceKey!==undefined&&
     (typeof row.sourcePieceKey!=='string'||
      !row.sourcePieceKey.startsWith(row.sourceSHA256+'/'))))return null;
 const bytes=boundedCutoutBytes(hint.cutoutImage);
 if(!bytes||!provider?.subtle?.digest)return null;
 const digest=new Uint8Array(await provider.subtle.digest('SHA-256',bytes));
 const actual=Array.from(digest,n=>n.toString(16).padStart(2,'0')).join('');
 if(actual!==row.cutoutSHA256)return null;
 return {source:row.sourceSHA256,cutout:actual,pieceKey:row.sourcePieceKey||null};
}
/**
 * true only for two independently cutout-SHA-verified PHOTO119 owner
 * confirmations, same authenticated camera original, different cutouts.
 * Exact original-photo SHA/bytes are separately reverified by export/import.
 */
export async function distinctReviewedSharedOriginal157(left,right,ownerId,provider=globalThis.crypto){
 if(typeof ownerId!=='string'||!ownerId||!provider?.subtle?.digest)return false;
 try{
  const a=await readReviewedPiece(left,ownerId,provider);
  const b=await readReviewedPiece(right,ownerId,provider);
  return !!(a&&b&&a.source===b.source&&a.cutout!==b.cutout&&
   (!a.pieceKey||!b.pieceKey||a.pieceKey!==b.pieceKey));
 }catch{return false;}
}
