/**
 * INDEX-04: opt-in recognition-to-private-saved-closet boundary.
 * This module is deliberately read-only. It never saves, deletes, uploads,
 * crops or rewrites original JPEGs; it only returns a safe decision.
 * Unproved real-world source identity MUST lead to a visible human review.
 */
import {reviewRecognitionForIndex,verifyOriginalSourceBytes} from '../index-03/recognition-index-gate.mjs';
import {buildOwnerWardrobeIndex,previewOwnerWardrobeAddition} from '../wardrobe-index-01/owner-wardrobe-index.mjs';

const SHA=/^[0-9a-f]{64}$/;
const jpeg=(v)=>typeof v==='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<4000000;
function bytesFromDataJPEG(photo){
 if(!jpeg(photo))return null;
 const payload=photo.slice('data:image/jpeg;base64,'.length);
 let binary;
 try{binary=atob(payload);}catch{return null;}
 if(binary.length<4||binary.length>3000000)return null;
 const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 if(bytes[0]!==255||bytes[1]!==216||bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)return null;
 return bytes;
}
const identity=record=>{
 const explicit=record.sourceSHA256||record.originalPhoto?.sha256||record.originalPhotoSHA256||'';
 const consistent=!record.sourceSHA256||!record.originalPhoto?.sha256||
  record.sourceSHA256===record.originalPhoto.sha256;
 const original=record.originalPhoto?.image||record.image;
 const recognized=record.recognitionPhoto?.image||record.image;
 const fromOriginal=typeof original==='string'&&original===recognized&&
  (!record.cropBounds||!!record.segmentHint)&&
  (!record.outfitSourceId||!!record.segmentHint);
 return {expected:explicit,consistent,original,fromOriginal};
};
const freeze=x=>Object.freeze(x);
function safeName(v){return typeof v==='string'?v.slice(0,80):'';}

/**
 * PHOTO114: only fields that influence original-photo source, recognition,
 * human corrections, independent subtype proof and prospective closet save.
 * Keep JPEG strings in transient in-memory comparisons only; NEVER export,
 * persist or log this fingerprint or the customer's saved records.
 *
 * A pending SHA-256 digest permits the event loop to process edits/logout.
 * The decision and the exact saved wardrobe must therefore be revalidated
 * after that await and every subsequent live-owner callback.
 */
function decisionFingerprint114(record,recognition,independent){
 return JSON.stringify({
  record:{
   id:record.id,ownerId:record.ownerId,userId:record.userId,accountId:record.accountId,
   image:record.image,sourceSHA256:record.sourceSHA256,
   originalPhotoSHA256:record.originalPhotoSHA256,
   originalPhoto:record.originalPhoto?{
    sha256:record.originalPhoto.sha256,image:record.originalPhoto.image,
    width:record.originalPhoto.width,height:record.originalPhoto.height
   }:null,
   recognitionPhoto:record.recognitionPhoto?{image:record.recognitionPhoto.image}:null,
   sourceHashVerified:record.sourceHashVerified,
   singleGarmentVerified:record.singleGarmentVerified,
   segmentHint:record.segmentHint?{
    verified:record.segmentHint.verified,
    cutoutImage:record.segmentHint.cutoutImage,
    ownerReviewedInstance:record.segmentHint.ownerReviewedInstance,
    originalSHA256:record.segmentHint.originalSHA256,
    cutoutSHA256:record.segmentHint.cutoutSHA256,
    clipped:record.segmentHint.clipped
   }:null,
   cropBounds:record.cropBounds,outfitSourceId:record.outfitSourceId,
   category:record.category,itemType:record.itemType,color:record.color,
   colorSource:record.colorSource,confirmedColor:record.confirmedColor,
   confirmedCategory:record.confirmedCategory,userAdjusted:record.userAdjusted,
   possibleDuplicate:record.possibleDuplicate,
   requiresOwnershipConfirmation:record.requiresOwnershipConfirmation
  },
  recognition:{
   strong:recognition?.strong,
   first:recognition?.choices?.[0]?{
    category:recognition.choices[0].category,
    itemType:recognition.choices[0].itemType
   }:null,
   categoryConfirmed:recognition?.categoryConfirmed,
   preprocessingRecovery:recognition?.preprocessingRecovery,
   reason:recognition?.reason,
   skirtDressConflictRequiresReview:
    recognition?.diagnostics?.skirtDressConflict?.requiresManualReview,
   proposedColor:recognition?.details?.color
  },
  independent:independent?{
   executed:independent.executed,fullVocabulary:independent.fullVocabulary,
   differentViews:independent.differentViews,
   primary:independent.primary?{
    category:independent.primary.category,itemType:independent.primary.itemType
   }:null,
   confirmation:independent.confirmation?{
    category:independent.confirmation.category,itemType:independent.confirmation.itemType
   }:null
  }:null
 });
}


/**
 * ownerId: the signed-in account ID, never caller-supplied from the candidate.
 * currentOwner(): live auth identity checked after the asynchronous SHA proof.
 * savedItems: real previously committed owner-scoped IndexedDB snapshot.
 * independent: actual second full-vocabulary inference evidence, if it exists;
 *              absence must not be substituted with duplicate model scores.
 */
export async function evaluateOwnerSavedRecognition04({
 ownerId,currentOwner,record,recognition,savedItems,independent=null,
 cryptoProvider=globalThis.crypto
}={}){
 if(typeof ownerId!=='string'||!ownerId||typeof currentOwner!=='function'||
    currentOwner()!==ownerId)throw Error('INDEX-04 signed-in owner required');
 if(!record||typeof record!=='object'||!record.id||!Array.isArray(savedItems))
  throw Error('INDEX-04 candidate and saved snapshot required');
 for(const k of ['ownerId','userId','accountId'])
  if(record[k]!==undefined&&record[k]!==ownerId)throw Error('INDEX-04 foreign candidate');
 // Validates every saved record, prevents stale owner details from being
 // included in a supposedly private index, and rejects duplicate saved IDs.
 const savedIndex=buildOwnerWardrobeIndex(ownerId,savedItems);
 // Snapshot after the first real signed-owner check and before SHA-256 yields.
 const inputFingerprint114=decisionFingerprint114(record,recognition,independent);
 const savedFingerprint114=JSON.stringify(savedIndex);
 const assertSourceUnchanged114=()=>{
  if(decisionFingerprint114(record,recognition,independent)!==inputFingerprint114)
   throw Error('INDEX-04 source, reviewed color or recognition changed during original JPEG proof');
  // Rebuild only normalized, private metadata; no saved photo bytes, links,
  // storage or customer item data are included in the comparator.
  const liveSavedIndex=buildOwnerWardrobeIndex(ownerId,savedItems);
  if(JSON.stringify(liveSavedIndex)!==savedFingerprint114)
   throw Error('INDEX-04 saved closet changed during original JPEG proof');
 };
 const src=identity(record);
 const raw=bytesFromDataJPEG(src.original);
 let byteVerified=false;
 if(raw&&src.consistent&&src.fromOriginal&&record.sourceHashVerified===true&&SHA.test(src.expected)){
  const checked=await verifyOriginalSourceBytes(raw,src.expected,cryptoProvider);
  byteVerified=checked.verified;
 }
 if(currentOwner()!==ownerId)throw Error('INDEX-04 owner changed during source proof');
 assertSourceUnchanged114();
 const garmentCount=record.outfitSourceId||record.segmentHint?2:1;
 // PHOTO116: SHA strings and an object flag are never cutout-byte evidence.
 // The original camera JPEG remains canonical. The cutout's own JPEG MUST
 // separately hash to its claimed digest, be different from the original,
 // and have an explicit instance-specific OWNER review. No source pixels leave
 // the local process and a digest alone does not prove true instance masking.
 const hint=record.segmentHint;
 const cutoutBytes=hint?.verified===true&&hint.ownerReviewedInstance===true&&
  hint.clipped!==true&&SHA.test(hint.cutoutSHA256||'')&&
  hint.originalSHA256===src.expected&&
  typeof hint.cutoutImage==='string'&&hint.cutoutImage!==src.original
  ?bytesFromDataJPEG(hint.cutoutImage):null;
 let verifiedCutoutBytes=false;
 if(byteVerified&&cutoutBytes){
  const cutoutProof=await verifyOriginalSourceBytes(
   cutoutBytes,hint.cutoutSHA256,cryptoProvider);
  verifiedCutoutBytes=cutoutProof.verified;
  if(currentOwner()!==ownerId)
   throw Error('INDEX-04 owner changed during cutout JPEG proof');
  assertSourceUnchanged114();
 }
 const segment=verifiedCutoutBytes?{
  verified:true,cutoutSHA256:hint.cutoutSHA256,
  originalSHA256:src.expected,clipped:false
 }:{verified:false,clipped:hint?.clipped===true};
 const singleGarmentVerified=record.singleGarmentVerified===true&&
  garmentCount===1&&!record.cropBounds;
 const source={verified:byteVerified&&
     (singleGarmentVerified||segment.verified),
  recognitionFromOriginal:src.fromOriginal,sha256:src.expected,
  originalWidth:record.originalPhoto?.width||undefined,
  originalHeight:record.originalPhoto?.height||undefined};
 const confirmedColor=record.confirmedColor===true||
  (record.colorSource==='user'&&typeof record.color==='string'&&!!record.color.trim());
 const review=reviewRecognitionForIndex({
  ownerId,recordOwnerId:ownerId,recognition,source,
  existing:{
   ownerId,userAdjusted:record.userAdjusted===true,
   confirmedCategory:record.confirmedCategory===true,
   confirmedColor,category:record.category,
   itemType:record.itemType,color:record.color,
   possibleDuplicate:record.possibleDuplicate===true,
   requiresOwnershipConfirmation:record.requiresOwnershipConfirmation===true
  },independent,garmentCount,segment
 });
 const candidate={
  id:record.id,ownerId,category:review.category,itemType:review.itemType,
  color:review.color,possibleDuplicate:record.possibleDuplicate===true,
  requiresOwnershipConfirmation:record.requiresOwnershipConfirmation===true,
  sourceHashVerified:source.verified,
  sourceSHA256:source.verified?src.expected:'',
  cutoutSHA256:segment.verified?segment.cutoutSHA256:'',
  singleGarmentVerified:source.verified&&singleGarmentVerified,
  segmentHint:record.segmentHint?.clipped?{clipped:true}:undefined
 };
 const duplicate=previewOwnerWardrobeAddition(savedIndex,ownerId,candidate);
 if(currentOwner()!==ownerId)throw Error('INDEX-04 owner changed during index comparison');
 assertSourceUnchanged114();
 const reasons=[...review.reviewReasons];
 if(!src.consistent)reasons.push('conflicting-original-source-hashes');
 if(!byteVerified)reasons.push('original-JPEG-identity-not-verified');
 if(!source.verified)reasons.push('single-garment-or-cutout-not-proven');
 // A photograph with multiple garments needs an individual human category/
 // subtype decision. A hash-verified cutout alone cannot prove segmentation,
 // nor that a whole-photo model prediction belongs to that cutout.
 if(garmentCount!==1)reasons.push('multi-garment-category-and-type-needs-owner-review');
 if(duplicate.status!=='allow')reasons.push(duplicate.reason);
 if(record.userAdjusted===true)reasons.push('manual-correction-must-win');
 const unique=freeze([...new Set(reasons)]);
 const ownerAtDecision114=currentOwner();
 if(ownerAtDecision114!==ownerId)
  throw Error('INDEX-04 owner changed before final automatic closet save decision');
 assertSourceUnchanged114();
 const autoSaveSafe=review.autoIndex===true&&!review.needsReview&&
   garmentCount===1&&duplicate.status==='allow'&&source.verified&&!record.userAdjusted;
 // Do not return owner items, photo bytes, image URLs or decoded pixels.
 return freeze({autoSaveSafe,needsReview:!autoSaveSafe,reviewReasons:unique,
  sourceKind:source.verified?review.sourceKind:'unverified',
  duplicateStatus:duplicate.status,
  suggestion:freeze({category:safeName(review.category),
    itemType:safeName(review.itemType),color:safeName(review.colorSuggestion||review.color)})
 });
}
