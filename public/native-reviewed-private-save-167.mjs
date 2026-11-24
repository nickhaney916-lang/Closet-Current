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
  segmentHint:record?.segmentHint,
  displayPreviewReceipt:record?.displayPreviewReceipt
 });
}
// M129: match the SHA-signed v3 import/export envelope without widening the
// display preview or verified segment. No nested group regex on camera photos.
function bytesFromJPEG(data,{original=false,preview=false}={}){
 const prefix='data:image/jpeg;base64,';
 const maxEncoded=original?11_200_000:preview?3_000_000:4_000_000;
 const maxBytes=original?8*1024*1024:preview?2_250_000:3_000_000;
 if(typeof data!=='string'||data.length>maxEncoded||!data.startsWith(prefix))
  return null;
 const encoded=data.slice(prefix.length);
 if(encoded.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))
  return null;
 const pad=encoded.endsWith('==')?2:encoded.endsWith('=')?1:0;
 const predicted=encoded.length/4*3-pad;
 if(predicted<4||predicted>maxBytes)return null;
 let decoded;
 try{decoded=atob(encoded);}
 catch{return null;}
 if(decoded.length!==predicted)return null;
 const n=decoded.length;
 if(decoded.charCodeAt(0)!==255||decoded.charCodeAt(1)!==216||
    decoded.charCodeAt(n-2)!==255||decoded.charCodeAt(n-1)!==217)
  return null;
 return Uint8Array.from(decoded,c=>c.charCodeAt(0));
}
function draftSourceMatches(draft,record,ownerId,{allowPreparedPreview=false}={}){
 if(!draft||draft.id!=='draft'||!Array.isArray(draft.batch))
  fail('saved owner capture draft is missing');
 const same=draft.batch.filter(x=>x?.id===record.id);
 if(same.length!==1)fail('missing or repeated private draft item');
 if(same[0].ownerId!==undefined&&same[0].ownerId!==ownerId)
  fail('foreign owner draft item');
 if(photoIdentity(same[0])===photoIdentity(record))return;
 // M138: a freshly prepared display thumbnail may be committed together
 // with explicit source-bound owner review, with no separate speculative
 // write to the durable unsaved draft. Only image + display receipt may
 // differ from its exact original-photo draft; the original SHA, owner,
 // crop/segment and all other SOURCE fields must remain unchanged.
 const prior=same[0];
 if(allowPreparedPreview&&!record.segmentHint&&
    prior.image===prior.originalPhoto?.image&&
    prior.originalPhoto?.image===record.originalPhoto?.image&&
    prior.displayPreviewReceipt===undefined&&
    record.displayPreviewReceipt?.displayOnly===true&&
    photoIdentity({...prior,image:record.image,
     displayPreviewReceipt:record.displayPreviewReceipt})===photoIdentity(record))
  return;
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
// Accept only the existing normalized optional clothing fields. This is
// owner-entered metadata, not evidence of model accuracy or 3D eligibility.
function reviewedWardrobeDetails(details){
 if(details===undefined)return {};
 if(!details||typeof details!=='object'||Array.isArray(details))return null;
 const enums={
  sleeveLength:['Unknown','Sleeveless','Short sleeve','Elbow length','Three-quarter sleeve','Long sleeve','Not applicable'],
  pattern:['Unknown','Solid','Striped','Floral','Plaid','Checked','Polka dot','Animal print','Graphic','Other'],
  fit:['Unknown','Fitted','Regular','Relaxed','Oversized','Not applicable']
 };
 const seasonOptions=['Spring','Summer','Fall','Winter','All seasons'];
 const textLimits={brand:120,size:120,material:120,occasion:120,notes:500};
 const keys=[...Object.keys(enums),'seasons',...Object.keys(textLimits)];
 if(Object.keys(details).length!==keys.length||keys.some(k=>!Object.hasOwn(details,k)))return null;
 const value={};
 for(const [key,options] of Object.entries(enums)){
  if(!options.includes(details[key]))return null;
  value[key]=details[key];
 }
 if(!Array.isArray(details.seasons)||details.seasons.some(s=>!seasonOptions.includes(s))||
    new Set(details.seasons).size!==details.seasons.length||
    (details.seasons.includes('All seasons')&&details.seasons.length!==1))return null;
 value.seasons=seasonOptions.filter(s=>details.seasons.includes(s));
 for(const [key,max] of Object.entries(textLimits)){
  if(typeof details[key]!=='string'||details[key].length>max)return null;
  value[key]=details[key];
 }
 return value;
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
    draftSourceMatches(draft,record,ownerId,{allowPreparedPreview:review?.previewConfirmed===true});
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
 draftSourceMatches(pre.draft,record,ownerId,{allowPreparedPreview:review?.previewConfirmed===true});
 buildOwnerWardrobeIndex(ownerId,pre.items);
 const original=record.originalPhoto?.image;
 const sourceSHA=record.sourceSHA256;
 if(!original||record.originalPhoto?.sha256!==sourceSHA)
  return verdict('review-required','original-source-unverified');
 const originalBytes=bytesFromJPEG(original,{original:true});
 if(!originalBytes)
  return verdict('review-required','original-source-unverified');
 const first=await verifyOriginalSourceBytes(originalBytes,sourceSHA,cryptoProvider);
 checkLive({db,ownerId,currentOwner,assertLease,record,review,initial});
 if(!first.verified)return verdict('review-required','original-source-unverified');
 const mode=validateReview(review,record,sourceSHA);
 if(!mode)return verdict('review-required','human-review-incomplete');
 const wardrobeDetails=reviewedWardrobeDetails(review.wardrobeDetails);
 if(wardrobeDetails===null)return verdict('review-required','invalid-owner-wardrobe-details');
 // A display preview is NOT a second photographed garment, verified cutout,
 // independently proven reduction of the original, or a release-eligible 3D.
 // Admit this owner-reviewed SOURCE+DISPLAY pair only when the actual JPEG
 // digest, exact owner/source receipt and owner's separate preview decision
 // agree. Missing receipts (the former P93 negative) still fail with NO write.
 let saveKind=mode.kind;
 if(!mode.multi){
  if(record.image!==original){
   const receipt=record.displayPreviewReceipt;
   if(!receipt||receipt.schema!=='photo119-owner-display-preview/v1'||
      receipt.ownerId!==ownerId||receipt.originalSHA256!==sourceSHA||
      receipt.displayOnly!==true||!SHA.test(receipt.previewSHA256||'')||
      review?.previewConfirmed!==true||
      review.previewSHA256!==receipt.previewSHA256)
    return verdict('review-required','display-preview-unverified');
   const displayBytes=bytesFromJPEG(record.image,{preview:true});
   if(!displayBytes)
    return verdict('review-required','display-preview-unverified');
   const displayProof=await verifyOriginalSourceBytes(
    displayBytes,receipt.previewSHA256,cryptoProvider);
   checkLive({db,ownerId,currentOwner,assertLease,record,review,initial});
   if(!displayProof.verified)
    return verdict('review-required','display-preview-unverified');
   saveKind='human-reviewed-original-single-display-preview';
  }else if(record.image.length>3_000_000){
   // The normal v3 backup must never accept an oversized DISPLAY field.
   return verdict('review-required','display-preview-required');
  }
 }
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
  ...record,...wardrobeDetails,ownerId,category:review.category,itemType:review.itemType,
  color:review.color,name:review.name&&validText(review.name,120)
   ?review.name:review.color+' '+review.itemType,
  // M31: PHOTO119's owner-confirmed original SHA and category/type/color are
  // accepted together INSIDE the same atomic item/draft commit. P87's
  // source-locked index must not infer these labels from old AI predictions or
  // broad ownerReviewed booleans. A later field edit fails exact-value match.
  confirmedDetails:{category:review.category,itemType:review.itemType,
   color:review.color},
  confirmedDetailsSource31:{ownerId,itemId:record.id,sourceSHA256:sourceSHA,
   basis:'PHOTO119-explicit-owner-confirmation'},
  confirmedCategory:true,confirmedColor:true,colorSource:'user',
  userAdjusted:true,ownerReviewed:true,sourcePhotoOriginal:true,
  humanReviewedSource:true,sourceHashVerified:true,
  singleGarmentVerified:!mode.multi,
  ...(mode.multi?{cutoutSHA256:record.segmentHint.cutoutSHA256}:{}),
  reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',
  indexingLevel:'human-reviewed-specific-type',
  savedAt:new Date().toISOString(),indexedAt:new Date().toISOString()
 });
 // This explicitly reviewed record no longer has a pending AI suggestion.
 if(review.wardrobeDetails!==undefined){delete value.localChoices;value.requiresOwnershipConfirmation=false;}
 checkLive({db,ownerId,currentOwner,assertLease,record,review,initial});
 if(photoIdentity(record)!==sourceStart)
  fail('original JPEG source changed during correction review');
 return transactionCommit({
  db,ownerId,currentOwner,assertLease,record,review,initial,pre,
  value,kind:saveKind
 });
}
