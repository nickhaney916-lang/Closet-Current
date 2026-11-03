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
 const src=identity(record);
 const raw=bytesFromDataJPEG(src.original);
 let byteVerified=false;
 if(raw&&src.consistent&&src.fromOriginal&&record.sourceHashVerified===true&&SHA.test(src.expected)){
  const checked=await verifyOriginalSourceBytes(raw,src.expected,cryptoProvider);
  byteVerified=checked.verified;
 }
 if(currentOwner()!==ownerId)throw Error('INDEX-04 owner changed during source proof');
 const garmentCount=record.outfitSourceId||record.segmentHint?2:1;
 const segment=record.segmentHint?.verified===true&&
  SHA.test(record.segmentHint.cutoutSHA256||'')&&
  record.segmentHint.originalSHA256===src.expected?{
   verified:true,cutoutSHA256:record.segmentHint.cutoutSHA256,
   originalSHA256:src.expected,clipped:record.segmentHint.clipped===true
  }:{verified:false,clipped:record.segmentHint?.clipped===true};
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
 const reasons=[...review.reviewReasons];
 if(!src.consistent)reasons.push('conflicting-original-source-hashes');
 if(!byteVerified)reasons.push('original-JPEG-identity-not-verified');
 if(!source.verified)reasons.push('single-garment-or-cutout-not-proven');
 if(duplicate.status!=='allow')reasons.push(duplicate.reason);
 if(record.userAdjusted===true)reasons.push('manual-correction-must-win');
 const unique=freeze([...new Set(reasons)]);
 const autoSaveSafe=review.autoIndex===true&&!review.needsReview&&
   duplicate.status==='allow'&&source.verified&&!record.userAdjusted&&
   currentOwner()===ownerId;
 // Do not return owner items, photo bytes, image URLs or decoded pixels.
 return freeze({autoSaveSafe,needsReview:!autoSaveSafe,reviewReasons:unique,
  sourceKind:source.verified?review.sourceKind:'unverified',
  duplicateStatus:duplicate.status,
  suggestion:freeze({category:safeName(review.category),
    itemType:safeName(review.itemType),color:safeName(review.colorSuggestion||review.color)})
 });
}
