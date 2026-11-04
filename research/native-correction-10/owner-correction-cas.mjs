/**
 * NATIVE-CORRECTION-CAS-10 — owner-private, source-preserving saved clothing
 * detail correction. This writer is invoked ONLY from the existing native
 * Adjust dialog behind an explicit research flag. Board/outfit data untouched.
 * Fail closed if another tab changed ANY saved row while editor was open.
 * No production release, external requests, fabricated category or 3D fit.
 */
export const NATIVE_CORRECTION_10=Object.freeze({
 gate:'nativeCorrection10=research&nativeIndex07=research&nativeLossless04=research',
 ownerScopedCAS:true,originalPhotoSHA256RequiredWhenPresent:true,
 compareCompletePreviousRow:true,atomicDraftAndItem:true,
 clothingIdImmutable:true,originalPhotographImmutable:true,
 noOutfitMutation:true,cloudWritesTriggered:false,
 productionAuthorized:false,familyAlpha:'HOLD',signedCloudRLSVerified:false
});
const SHA=/^[a-f0-9]{64}$/i;
const goodId=x=>typeof x==='string'&&x.length>0&&x.length<=160&&!/[\u0000-\u001f]/.test(x);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const immutable=['id','ownerId','userId','accountId','sourceSHA256',
 'sourceHashVerified','originalPhoto','originalPhotoSHA256','image',
 'recognitionPhoto','sourceIdentity','sourceJPEG'];
const deep=x=>JSON.stringify(x);
function ownerProof(record,owner){
 if(!record||typeof record!=='object'||Array.isArray(record)||!goodId(record.id))
  throw Error('CORRECTION10_INVALID_SAVED_ITEM');
 for(const key of ['ownerId','userId','accountId'])
  if(own(record,key)&&record[key]!==owner)
   throw Error('CORRECTION10_FOREIGN_OWNER_REFUSED');
}
function identity(before,after){
 for(const key of immutable){
  if(own(before,key)!==own(after,key)||
   deep(before[key])!==deep(after[key]))
   throw Error('CORRECTION10_ORIGINAL_PHOTO_OR_IDENTITY_CHANGED_'+key);
 }
}
export function validateNativeCorrection10({before,after,ownerId}={}){
 if(!goodId(ownerId))throw Error('CORRECTION10_SIGNED_OWNER_REQUIRED');
 ownerProof(before,ownerId);ownerProof(after,ownerId);
 identity(before,after);
 if(typeof after.category!=='string'||typeof after.itemType!=='string'||
    typeof after.name!=='string'||typeof after.color!=='string'||
    after.userAdjusted!==true)
  throw Error('CORRECTION10_EXPLICIT_HUMAN_REVIEW_REQUIRED');
 const sha=before.sourceSHA256||before.originalPhoto?.sha256||'';
 if(sha&&(!SHA.test(sha)||before.originalPhoto?.sha256!==sha||
    !before.sourceHashVerified))
  throw Error('CORRECTION10_UNVERIFIED_OR_CONFLICTING_SOURCE_HASH');
 return Object.freeze({ownerId,originalSHA:sha||null,unchangedIdentity:true});
}
// Verification is performed on the actual original data bytes, not on
// sourceHashVerified flags alone. For legacy rows without a SHA lock, do not
// mint one or claim the photo is ready for 3D. Owner identity is still checked.
export async function verifyNativeCorrectionSource10(before,{
 cryptoApi=globalThis.crypto,atobFn=globalThis.atob
}={}){
 const hash=before.sourceSHA256||before.originalPhoto?.sha256;
 if(!hash)return {verified:false,legacyPhotoOnly:true};
 const photo=before.originalPhoto?.image;
 if(typeof photo!=='string'||!/^data:image\/jpeg;base64,[a-z0-9+/=]+$/i.test(photo))
  throw Error('CORRECTION10_CANONICAL_ORIGINAL_JPEG_MISSING');
 const payload=photo.slice(photo.indexOf(',')+1);
 const decoded=atobFn(payload),bytes=new Uint8Array(decoded.length);
 for(let i=0;i<decoded.length;i++)bytes[i]=decoded.charCodeAt(i);
 if(bytes.length<4||bytes[0]!==255||bytes[1]!==216||
    bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)
  throw Error('CORRECTION10_NOT_CANONICAL_JPEG');
 const actual=Array.from(new Uint8Array(await cryptoApi.subtle.digest('SHA-256',bytes)))
  .map(v=>v.toString(16).padStart(2,'0')).join('');
 if(actual.toLowerCase()!==hash.toLowerCase())
  throw Error('CORRECTION10_ORIGINAL_JPEG_SHA256_MISMATCH');
 return {verified:true,sha256:actual};
}
export async function commitNativeCorrection10({
 db,ownerId,before,after,nextBatch,assertOwner=()=>{},
 cryptoApi=globalThis.crypto,atobFn=globalThis.atob
}={}){
 if(!db||db.name!=='closet-current-user-'+ownerId||
    typeof db.transaction!=='function')
  throw Error('CORRECTION10_OWNER_PRIVATE_DATABASE_REQUIRED');
 if(nextBatch!==null&&!Array.isArray(nextBatch))throw Error('CORRECTION10_DRAFT_LIST_REQUIRED');
 const decision=validateNativeCorrection10({before,after,ownerId});
 assertOwner();
 const original=await verifyNativeCorrectionSource10(before,{cryptoApi,atobFn});
 assertOwner(); // account may rotate while async crypto hashes JPEG
 // IndexedDB serializes the read/compare/write transaction across tabs.
 // A mismatch aborts BOTH clothing and draft mutations (no lost update).
 return new Promise((resolve,reject)=>{
  let settled=false,tx,conflict=null;
  const bad=e=>{if(settled)return;settled=true;reject(e);};
  try{
   assertOwner();
   tx=db.transaction(nextBatch===null?['items']:['items','state'],'readwrite');
   const items=tx.objectStore('items'),state=nextBatch===null?null:tx.objectStore('state');
   const request=items.get(before.id);
   request.onsuccess=()=>{
    try{
     assertOwner();
     if(deep(request.result)!==deep(before))
      throw Error('CORRECTION10_STALE_SAVED_GARMENT_REOPEN_EDITOR');
     identity(request.result,after);
     items.put(structuredClone(after));
     if(state)state.put({id:'draft',batch:structuredClone(nextBatch)});
    }catch(error){conflict=error;try{tx.abort();}catch{}}
   };
   request.onerror=()=>{conflict=request.error||Error('CORRECTION10_READ_FAILED');};
   tx.oncomplete=()=>{
    if(settled)return;settled=true;
    resolve({saved:true,ownerPrivate:true,originalJPEGVerified:original.verified,
     originalSHA256:decision.originalSHA,originalIDsPreserved:true,
     atomicItemAndDraft:nextBatch!==null,draftUntouched:nextBatch===null,
     boardUnmodified:true,
     productionAuthorized:false,familyAlpha:'HOLD'});
   };
   tx.onabort=()=>bad(conflict||tx.error||Error('CORRECTION10_ATOMIC_WRITE_ABORTED'));
   tx.onerror=()=>bad(conflict||tx.error||Error('CORRECTION10_ATOMIC_WRITE_FAILED'));
  }catch(error){try{tx?.abort();}catch{}bad(error);}
 });
}
