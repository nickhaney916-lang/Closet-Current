/**
 * PHOTO117 isolated, genuine IndexedDB owner + source reviewed commit adapter.
 * RESEARCH ONLY. Not wired into default app, deployed cloud or existing staging.
 * The asynchronous SHA-256 photo proof remains in P116 INDEX04. This module
 * synchronously stages item-add and draft-removal in ONE readwrite transaction.
 */
import {evaluateOwnerSavedRecognition04} from '../index-04/verified-saved-recognition.mjs';
import {buildOwnerWardrobeIndex,previewOwnerWardrobeAddition} from '../wardrobe-index-01/owner-wardrobe-index.mjs';

const SHA=/^[a-f0-9]{64}$/;
const ownerOK=v=>typeof v==='string'&&v.length>0&&v.length<=128&&!v.includes('/');
const textOK=v=>typeof v==='string'&&v.length>0&&v.length<=200;
const seal=v=>{try{return JSON.stringify(v);}catch{throw Error('PHOTO117 invalid capture state');}};
const deny=reason=>{throw Error('PHOTO117 '+reason);};
const verdict=(status,extra={})=>Object.freeze({
 status,saved:status==='saved',needsReview:status!=='saved',
 releaseAuthorized:false,familyAlpha:'HOLD',...extra
});
function requireOwner(ownerId,currentOwner,db){
 if(!ownerOK(ownerId)||typeof currentOwner!=='function'||!db||
  db.name!=='closet-current-user-'+ownerId||
  !db.objectStoreNames?.contains('items')||
  !db.objectStoreNames?.contains('state')||
  currentOwner()!==ownerId)
  deny('signed owner-bound IndexedDB with items and state required');
}
function sourceIdentity(record){
 return seal({
  id:record?.id,ownerId:record?.ownerId,image:record?.image,
  originalImage:record?.originalPhoto?.image,
  originalSHA256:record?.originalPhoto?.sha256,
  recognitionImage:record?.recognitionPhoto?.image,
  sourceSHA256:record?.sourceSHA256,
  sourceHashVerified:record?.sourceHashVerified,
  singleGarmentVerified:record?.singleGarmentVerified,
  segmentHint:record?.segmentHint,
  outfitSourceId:record?.outfitSourceId,cropBounds:record?.cropBounds,
  color:record?.color,confirmedColor:record?.confirmedColor,
  category:record?.category,confirmedCategory:record?.confirmedCategory,
  itemType:record?.itemType,userAdjusted:record?.userAdjusted,
  possibleDuplicate:record?.possibleDuplicate,
  requiresOwnershipConfirmation:record?.requiresOwnershipConfirmation
 });
}
function assertDraft(draft,record,ownerId){
 if(!draft||draft.id!=='draft'||!Array.isArray(draft.batch))
  deny('current owner draft required');
 const matches=draft.batch.filter(row=>row&&row.id===record.id);
 if(matches.length!==1)deny('saved or removed captured draft cannot be reused');
 if(matches[0].ownerId!==undefined&&matches[0].ownerId!==ownerId)
  deny('cross-owner draft record');
 if(sourceIdentity(matches[0])!==sourceIdentity(record))
  deny('draft original JPEG, reviewed color or source claim changed');
}
async function readSnapshot(db){
 return await new Promise((resolve,reject)=>{
  let tx,items,draft;
  try{
   tx=db.transaction(['items','state'],'readonly');
   tx.objectStore('items').getAll().onsuccess=e=>{items=e.target.result;};
   tx.objectStore('state').get('draft').onsuccess=e=>{draft=e.target.result;};
   tx.oncomplete=()=>resolve({items,draft});
   tx.onerror=()=>reject(Error('PHOTO117 private wardrobe snapshot read failed'));
   tx.onabort=()=>reject(Error('PHOTO117 private wardrobe snapshot aborted'));
  }catch{reject(Error('PHOTO117 cannot open private wardrobe snapshot'));}
 });
}
function assertLive({ownerId,currentOwner,assertLease,record,recognition,independent,initial}){
 if(currentOwner()!==ownerId)deny('owner changed while committing');
 if(seal({record,recognition,independent})!==initial)
  deny('original photo, corrected color or recognition changed while committing');
 if(assertLease()!==true)deny('live capture lease revoked');
 // Recheck after even the lease callback; it might rotate account/source.
 if(currentOwner()!==ownerId||
    seal({record,recognition,independent})!==initial)
  deny('live owner or reviewed source rotated during commit gate');
}
function writeOnce({db,ownerId,currentOwner,assertLease,record,
 recognition,independent,initial,pre,decision,value}){
 return new Promise((resolve,reject)=>{
  let tx,liveItems,liveDraft,ready=0,abortCause=null;
  const verifyAndWrite=()=>{
   if(++ready!==2)return;
   try{
    assertLive({ownerId,currentOwner,assertLease,record,recognition,
      independent,initial});
    if(seal(liveItems)!==seal(pre.items)||seal(liveDraft)!==seal(pre.draft))
      deny('saved closet or draft changed after photo SHA proof');
    assertDraft(liveDraft,record,ownerId);
    const index=buildOwnerWardrobeIndex(ownerId,liveItems);
    const preview=previewOwnerWardrobeAddition(index,ownerId,value);
    if(preview.status!=='allow')
      deny('duplicate or ambiguous source must be manually reviewed');
    if(decision.autoSaveSafe!==true||
       decision.sourceKind!=='verified-original')
      deny('photo or per-garment recognition requires manual review');
    assertLive({ownerId,currentOwner,assertLease,record,recognition,
      independent,initial});
    const remaining=liveDraft.batch.filter(row=>row.id!==record.id);
    tx.objectStore('items').add(value); // never overwrite an existing id
    // A rejected late lease must abort this same transaction, undoing add().
    assertLive({ownerId,currentOwner,assertLease,record,recognition,
      independent,initial});
    tx.objectStore('state').put({...liveDraft,batch:remaining});
   }catch{
    abortCause=Error('PHOTO117 owner source/draft atomic save rejected');
    try{tx.abort();}catch{reject(abortCause);}
   }
  };
  try{
   tx=db.transaction(['items','state'],'readwrite');
   tx.objectStore('items').getAll().onsuccess=e=>{
    liveItems=e.target.result;verifyAndWrite();
   };
   tx.objectStore('state').get('draft').onsuccess=e=>{
    liveDraft=e.target.result;verifyAndWrite();
   };
   tx.oncomplete=()=>resolve(verdict('saved',{sourceKind:'verified-original'}));
   tx.onabort=()=>reject(abortCause||Error('PHOTO117 owner transaction aborted'));
   tx.onerror=()=>{}; // abort error is surfaced by tx.onabort
  }catch{reject(Error('PHOTO117 owner readwrite transaction unavailable'));}
 });
}
/**
 * Real IndexedDB readwrite transaction; all requests staged synchronously.
 * This adapter is NOT yet connected to the production saving workflow.
 * It enforces live owner, unchanged SHA-reviewed candidate, duplicate-free
 * current owner index and lossless draft preservation in one DB commit.
 */
export async function commitOriginalPhotoToPrivateCloset117({
 db,ownerId,currentOwner,record,recognition,independent=null,
 cryptoProvider=globalThis.crypto,assertLease=()=>true
}={}){
 requireOwner(ownerId,currentOwner,db);
 if(!record||typeof record!=='object'||!textOK(record.id)||
    record.ownerId!==ownerId||typeof assertLease!=='function')
  deny('owned captured garment record and live lease required');
 const initial=seal({record,recognition,independent});
 const sourceStart=sourceIdentity(record);
 const pre=await readSnapshot(db);
 requireOwner(ownerId,currentOwner,db);
 if(seal({record,recognition,independent})!==initial)
  deny('capture or recognition changed while reading private saved items');
 assertDraft(pre.draft,record,ownerId);
 buildOwnerWardrobeIndex(ownerId,pre.items);
 const decision=await evaluateOwnerSavedRecognition04({
  ownerId,currentOwner,record,recognition,independent,
  savedItems:pre.items,cryptoProvider
 });
 requireOwner(ownerId,currentOwner,db);
 if(seal({record,recognition,independent})!==initial||
    sourceIdentity(record)!==sourceStart)
  deny('original JPEG or review mutated since source proof');
 if(decision.autoSaveSafe!==true||
    decision.sourceKind!=='verified-original'||
    record.singleGarmentVerified!==true||
    !SHA.test(record.sourceSHA256||''))
  return verdict('review-required');
 const value=structuredClone({
  ...record,ownerId,
  category:decision.suggestion.category,itemType:decision.suggestion.itemType,
  color:decision.suggestion.color,
  sourceHashVerified:true,singleGarmentVerified:true,
  savedAt:new Date().toISOString(),indexedAt:new Date().toISOString()
 });
 return writeOnce({db,ownerId,currentOwner,assertLease,record,recognition,
  independent,initial,pre,decision,value});
}
