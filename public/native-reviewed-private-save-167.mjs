/** P167 isolated app-build copy of proven research/manual-reviewed-private-save-119/reviewed-source-commit.mjs. No deployment or release. */
/**
 * PHOTO119 - explicit owner review of original JPEG -> atomic private closet.
 *
 * RESEARCH ONLY. This does not change the shipping app, authentication, cloud,
 * production, or existing staging. Real image bytes are verified via browser
 * SubtleCrypto, but category/type/color are user-confirmed labels, NOT claims
 * from an independently evaluated model.
 */
import {localCandidates} from './local-catalog.mjs';
import {verifyOriginalSourceBytes} from './native-original-index-gate-167.mjs';
import {buildOwnerWardrobeIndex,previewOwnerWardrobeAddition} from './native-owner-wardrobe-index-167.mjs';

const SHA=/^[a-f0-9]{64}$/;
const COLOR=/^[\p{L}\p{N}]+(?:[ /-][\p{L}\p{N}]+)*$/u;
const known=new Set(localCandidates.filter(x=>x.category!=='Uncategorized')
 .map(x=>x.category+'\u0000'+x.itemType));
const validText=(s,max=160)=>typeof s==='string'&&s.length>0&&
 s.length<=max&&s.trim()===s&&!s.startsWith('data:');
const validOwner=s=>validText(s,128)&&!s.includes('/');
const validColor=s=>validText(s,48)&&COLOR.test(s)&&s!=='Unknown';
const fail=reason=>{throw Error('PHOTO119 '+reason);};
const seal=x=>{try{return JSON.stringify(x);}catch{fail('nonserializable reviewed source');}};
const verdict=(status,kind)=>Object.freeze({
 status,saved:status==='saved',needsReview:status!=='saved',
 sourceKind:kind,ownerReviewBasis:'explicit-user-reviewed-not-model-ground-truth',
 independentPhotoAccuracyProven:false,independentHumanReviewerVerified:false,
 authenticatedCloudRLSVerified:false,productionAppIntegrated:false,
 familyAlpha:'HOLD',releaseAuthorized:false
});
function ownerBound(db,ownerId,currentOwner){
 if(!validOwner(ownerId)||typeof currentOwner!=='function'||!db||
  db.name!=='closet-current-user-'+ownerId||
  !db.objectStoreNames?.contains('items')||
  !db.objectStoreNames?.contains('state')||
  currentOwner()!==ownerId)
  fail('live signed-owner IndexedDB boundary required');
}
// Include actual original and cutout JPEG strings in a transient, in-memory
// consistency check. This string is NEVER written, returned, or logged.
function photoIdentity(record){
 return seal({
  id:record?.id,ownerId:record?.ownerId,sourceId:record?.sourceId,
  sourceSHA256:record?.sourceSHA256,sourceHashVerified:record?.sourceHashVerified,
  originalPhoto:record?.originalPhoto,
  image:record?.image,recognitionPhoto:record?.recognitionPhoto,
  cropBounds:record?.cropBounds,outfitSourceId:record?.outfitSourceId,
  segmentHint:record?.segmentHint
 });
}
function bytesFromJPEG(data){
 if(typeof data!=='string'||data.length>4000000||
    !/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data))
  return null;
 let decoded;
 try{decoded=atob(data.slice('data:image/jpeg;base64,'.length));}
 catch{return null;}
 if(decoded.length<4||decoded.length>3000000)return null;
 const n=decoded.length;
 if(decoded.charCodeAt(0)!==255||decoded.charCodeAt(1)!==216||
    decoded.charCodeAt(n-2)!==255||decoded.charCodeAt(n-1)!==217)
  return null;
 return Uint8Array.from(decoded,c=>c.charCodeAt(0));
}
function draftSourceMatches(draft,record,ownerId){
 if(!draft||draft.id!=='draft'||!Array.isArray(draft.batch))
  fail('saved owner capture draft is missing');
 const same=draft.batch.filter(x=>x?.id===record.id);
 if(same.length!==1)fail('missing or repeated private draft item');
 if(same[0].ownerId!==undefined&&same[0].ownerId!==ownerId)
  fail('foreign owner draft item');
 if(photoIdentity(same[0])!==photoIdentity(record))
  fail('source JPEG or cutout identity differs from saved draft');
}
async function snapshot(db){
 return new Promise((resolve,reject)=>{
  let items,draft,tx;
  try{
   tx=db.transaction(['items','state'],'readonly');
   tx.objectStore('items').getAll().onsuccess=e=>{items=e.target.result;};
   tx.objectStore('state').get('draft').onsuccess=e=>{draft=e.target.result;};
   tx.oncomplete=()=>resolve({items,draft});
   tx.onabort=()=>reject(Error('PHOTO119 original wardrobe snapshot aborted'));
   tx.onerror=()=>{};
  }catch{reject(Error('PHOTO119 owner snapshot failed'));}
 });
}
function validateReview(review,record,sourceSHA){
 if(!review||review.confirmed!==true||review.recordId!==record.id||
    review.originalSHA256!==sourceSHA||
    !known.has(review.category+'\u0000'+review.itemType)||
    !validColor(review.color))
  return null;
 const multi=!!(record.outfitSourceId||record.cropBounds||record.segmentHint);
 if(!multi){
  if(review.singleGarmentConfirmed!==true||review.instanceConfirmed===true||
     record.segmentHint!==undefined||record.outfitSourceId!==undefined||
     record.cropBounds!==undefined)
   return null;
  return Object.freeze({multi:false,kind:'human-reviewed-original-single'});
 }
 const hint=record.segmentHint;
 if(!hint||hint.verified!==true||hint.ownerReviewedInstance!==true||
    hint.clipped===true||hint.originalSHA256!==sourceSHA||
    !SHA.test(hint.cutoutSHA256||'')||
    hint.cutoutSHA256===sourceSHA||
    review.instanceConfirmed!==true||
    review.cutoutSHA256!==hint.cutoutSHA256||
    !validText(record.outfitSourceId,200))
  return null;
 return Object.freeze({multi:true,kind:'human-reviewed-source-bound-cutout'});
}
function checkLive({db,ownerId,currentOwner,assertLease,record,review,initial}){
 ownerBound(db,ownerId,currentOwner);
 if(seal({record,review})!==initial)
  fail('photograph, category, subtype or reviewed color changed');
 if(assertLease()!==true)fail('capture owner review lease revoked');
 ownerBound(db,ownerId,currentOwner);
 if(seal({record,review})!==initial)
  fail('source or owner review changed after lease check');
}
function transactionCommit({db,ownerId,currentOwner,assertLease,record,
 review,initial,pre,value,kind}){
 return new Promise((resolve,reject)=>{
  let tx,items,draft,got=0,abortReason=null;
  function abort(){
   abortReason=Error('PHOTO119 reviewed source, owner or draft commit rejected');
   try{tx.abort();}catch{reject(abortReason);}
  }
  function admit(){
   if(++got!==2)return;
   try{
    checkLive({db,ownerId,currentOwner,assertLease,record,review,initial});
    // Compare ALL private snapshot metadata, not just selected source ID.
    if(seal(items)!==seal(pre.items)||seal(draft)!==seal(pre.draft))
     fail('wardrobe or unsaved garment draft changed during original SHA proof');
    draftSourceMatches(draft,record,ownerId);
    const idx=buildOwnerWardrobeIndex(ownerId,items);
    const collision=previewOwnerWardrobeAddition(idx,ownerId,value);
    if(collision.status!=='allow')
     fail('original photo or cutout duplicate or ambiguous owner identity');
    checkLive({db,ownerId,currentOwner,assertLease,record,review,initial});
    const remaining=draft.batch.filter(x=>x.id!==record.id);
    tx.objectStore('items').add(value); // never overwrite existing saved ID
    // A lease/owner rotation after add() aborts BOTH stores together.
    checkLive({db,ownerId,currentOwner,assertLease,record,review,initial});
    tx.objectStore('state').put({...draft,batch:remaining});
    checkLive({db,ownerId,currentOwner,assertLease,record,review,initial});
   }catch{abort();}
  }
  try{
   tx=db.transaction(['items','state'],'readwrite');
   tx.objectStore('items').getAll().onsuccess=e=>{items=e.target.result;admit();};
   tx.objectStore('state').get('draft').onsuccess=e=>{draft=e.target.result;admit();};
   tx.oncomplete=()=>resolve(verdict('saved',kind));
   tx.onabort=()=>reject(abortReason||Error('PHOTO119 owner transaction aborted'));
   tx.onerror=()=>{}; // abort handled at transaction level
  }catch{reject(Error('PHOTO119 owner transaction unavailable'));}
 });
}
/**
 * A manually confirmed label is authoritative for this research save, NOT
 * unreviewed recognition. Single-garment claims require explicit confirmation.
 * Multi-garment claims require separately hashed cutout JPEG and human review
 * of this specific instance, without claiming an independently true mask.
 *
 * All IndexedDB write requests occur synchronously inside one readwrite
 * transaction with no awaited work between source recheck and commit.
 */
export async function commitHumanReviewedPhoto119({
 db,ownerId,currentOwner,record,review,
 cryptoProvider=globalThis.crypto,assertLease=()=>true
}={}){
 ownerBound(db,ownerId,currentOwner);
 if(!record||record.ownerId!==ownerId||!validText(record.id,200)||
    record.sourceHashVerified!==true||!SHA.test(record.sourceSHA256||'')||
    typeof assertLease!=='function')
  fail('exact owner captured source record required');
 const initial=seal({record,review});
 const sourceStart=photoIdentity(record);
 const pre=await snapshot(db);
 checkLive({db,ownerId,currentOwner,assertLease,record,review,initial});
 draftSourceMatches(pre.draft,record,ownerId);
 buildOwnerWardrobeIndex(ownerId,pre.items);
 const original=record.originalPhoto?.image;
 const sourceSHA=record.sourceSHA256;
 if(!original||record.originalPhoto?.sha256!==sourceSHA||
    (record.image!==original&&!record.segmentHint))
  return verdict('review-required','original-source-unverified');
 const originalBytes=bytesFromJPEG(original);
 if(!originalBytes)
  return verdict('review-required','original-source-unverified');
 const first=await verifyOriginalSourceBytes(originalBytes,sourceSHA,cryptoProvider);
 checkLive({db,ownerId,currentOwner,assertLease,record,review,initial});
 if(!first.verified)return verdict('review-required','original-source-unverified');
 const mode=validateReview(review,record,sourceSHA);
 if(!mode)return verdict('review-required','human-review-incomplete');
 if(mode.multi){
  if(record.segmentHint.cutoutImage===original||
     record.segmentHint.cutoutImage===record.image&&record.image===original)
   return verdict('review-required','cutout-source-unverified');
  const cutoutBytes=bytesFromJPEG(record.segmentHint.cutoutImage);
  if(!cutoutBytes)
   return verdict('review-required','cutout-source-unverified');
  const verified=await verifyOriginalSourceBytes(cutoutBytes,
   record.segmentHint.cutoutSHA256,cryptoProvider);
  checkLive({db,ownerId,currentOwner,assertLease,record,review,initial});
  if(!verified.verified)
   return verdict('review-required','cutout-source-unverified');
 }
 // Do not promote the original whole-photo classifier output to an individual
 // garment. Record only the exact human-reviewed category/subtype/color.
 const value=structuredClone({
  ...record,ownerId,category:review.category,itemType:review.itemType,
  color:review.color,name:review.name&&validText(review.name,120)
   ?review.name:review.color+' '+review.itemType,
  confirmedCategory:true,confirmedColor:true,colorSource:'user',
  userAdjusted:true,ownerReviewed:true,sourcePhotoOriginal:true,
  humanReviewedSource:true,sourceHashVerified:true,
  singleGarmentVerified:!mode.multi,
  ...(mode.multi?{cutoutSHA256:record.segmentHint.cutoutSHA256}:{}),
  reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',
  indexingLevel:'human-reviewed-specific-type',
  savedAt:new Date().toISOString(),indexedAt:new Date().toISOString()
 });
 checkLive({db,ownerId,currentOwner,assertLease,record,review,initial});
 if(photoIdentity(record)!==sourceStart)
  fail('original JPEG source changed during correction review');
 return transactionCommit({
  db,ownerId,currentOwner,assertLease,record,review,initial,pre,
  value,kind:mode.kind
 });
}
