/**
 * MAIN1054 M33 research-only opt-in bridge to the native Outfit Builder.
 * Every decision is read-only until the caller's existing owner-scoped IDB
 * transaction rechecks the exact private record against the sealed receipt.
 * No cloud, 3D, or production release authorization.
 */
import {createPickerAdmission32} from '../main1054-picker32/picker-admission.mjs';
import {createNativeCatalogCrosswalk} from '../p87-catalog-crosswalk/crosswalk.mjs';

const SLOTS=new Set(['top','bottom','layer','layer2','layer3','shoes','bag','accessory','finish']);
const fail=reason=>{throw Error('MAIN1054_M33 '+reason);};
const fields=['name','occasion','season','audience','size','budget','layerCount'];
const generation=x=>(typeof x==='number'&&Number.isSafeInteger(x)&&x>=0)||
 (typeof x==='string'&&x.length>=8&&x.length<=160);
const reference=x=>x!==null&&(typeof x==='object'||typeof x==='function');
const safeId=id=>typeof id==='string'&&id.trim()===id&&id.length>0&&id.length<=200;
function stampBoard(input){
 let board;
 try{board=structuredClone(input);}catch{fail('invalid-board');}
 if(!board||typeof board!=='object'||!board.slots||
    typeof board.slots!=='object'||Array.isArray(board.slots))fail('invalid-board');
 const slots=Object.entries(board.slots);
 if(slots.length>SLOTS.size||slots.some(([slot,id])=>!SLOTS.has(slot)||!safeId(id))||
    new Set(slots.map(([,id])=>id)).size!==slots.length)fail('invalid-slots');
 let stamp;
 try{stamp=JSON.stringify([slots.slice().sort(([a],[b])=>a.localeCompare(b)),
  fields.map(k=>board[k]??null),board.ideas??null]);}
 catch{fail('invalid-metadata');}
 if(typeof stamp!=='string'||stamp.length>16384)fail('invalid-metadata');
 return {board,slots,stamp};
}
function scope(getSession,getRevision){
 let s,revision;
 try{
  s=getSession();revision=getRevision(s);s?.authRef?.assertCurrent?.();
 }catch{fail('signed-owner-unavailable');}
 if(!s||s.authenticated!==true||!safeId(s.ownerId)||
    !generation(s.epoch)||!generation(s.operationEpoch)||!generation(revision)||
    !reference(s.authRef)||!reference(s.privateDbRef)||
    s.authRef.user?.id!==s.ownerId||
    s.privateDbName!=='closet-current-user-'+s.ownerId||
    s.privateDbRef.name!==s.privateDbName)
  fail('signed-owner-unavailable');
 return {ownerId:s.ownerId,epoch:s.epoch,operationEpoch:s.operationEpoch,
  authRef:s.authRef,privateDbRef:s.privateDbRef,privateDbName:s.privateDbName,revision};
}
const same=(a,b)=>a.ownerId===b.ownerId&&a.epoch===b.epoch&&
 a.operationEpoch===b.operationEpoch&&a.authRef===b.authRef&&
 a.privateDbRef===b.privateDbRef&&a.privateDbName===b.privateDbName&&
 a.revision===b.revision;

export function createNativeOutfitPicker33({
 getSession,getRevision,readOwnerItems,getBoard,cryptoProvider=globalThis.crypto
}={}){
 if([getSession,getRevision,readOwnerItems,getBoard].some(f=>typeof f!=='function'))
  fail('providers-required');
 const opts={getSession,getRevision,readOwnerItems,getBoard,cryptoProvider};
 const picker=createPickerAdmission32(opts),catalog=createNativeCatalogCrosswalk(opts);
 let serial=0,disposed=false;
 function assertLive(captured,boardStamp,ticket){
  if(disposed||ticket!==serial)fail('revoked');
  if(!same(captured,scope(getSession,getRevision)))fail('owner-or-content-changed');
  if(stampBoard(getBoard()).stamp!==boardStamp)fail('outfit-edited');
 }
 return Object.freeze({
  dispose(){disposed=true;++serial;picker.dispose();},
  invalidate(){++serial;picker.invalidate();},
  async authorize(slot,itemId){
   const ticket=++serial;
   try{
    if(disposed)fail('revoked');
    // M32 itself applies the source-verified, no-loss prospective slot gate.
    const result=await picker.authorize(slot,itemId);
    if(disposed||ticket!==serial)fail('superseded');
    return result;
   }catch{return Object.freeze({
    status:'blocked-review-or-refresh-required',consumer3D:false,
    persisted:false,releaseAuthorized:false
   });}
  },
  /**
   * Called for *every* pending draft/saved outfit write in M33 mode.
   * The returned closure contains private exact-row snapshots ONLY in memory;
   * each selected item must match in the same IDB transaction as the board
   * state put. No asynchronous work is permitted inside that transaction.
   */
  async prepareWrite(board){
   const ticket=++serial,begin=scope(getSession,getRevision);
   const target=stampBoard(board);
   assertLive(begin,target.stamp,ticket);
   const normalized=await catalog.board(target.board);
   assertLive(begin,target.stamp,ticket);
   if(Object.keys(normalized.slots||{}).length!==target.slots.length||
      target.slots.some(([slot,id])=>normalized.slots[slot]!==id))
    fail('ambiguous-or-incompatible-outfit');
   const inspected=new Map();
   for(const [slot,id] of target.slots){
    const item=await catalog.item(id);
    assertLive(begin,target.stamp,ticket);
    if(!item.slotIds?.includes(slot)||!item.fallback||
       item.fallback.itemId!==id||item.fallback.sourceSHA256!==item.source||
       item.consumer3D!==false)fail('unverified-source');
    inspected.set(id,item);
   }
   // Source-read and transaction compare are tied to the exact actual signed
   // auth and IDB handle. Re-read immediately before the atomic write.
   const assertSource=()=>assertLive(begin,target.stamp,ticket);
   const records=await readOwnerItems(Object.freeze({...begin,assertCurrent:assertSource}));
   assertSource();
   if(!Array.isArray(records))fail('owner-roster-unavailable');
   const snapshots=new Map();
   for(const [slot,id] of target.slots){
    const row=records.filter(r=>r?.id===id);
    const verified=inspected.get(id);
    if(row.length!==1)fail('missing-or-duplicate-private-row');
    const record=row[0],receipt=record.confirmedDetailsSource31;
    // No implicit promotion from legacy reviewed booleans, unsourced labels,
    // or a user-edited type after the original PHOTO119 approval.
    if(record.ownerId!==begin.ownerId||record.deleted||record.sourceRevoked||
       record.reviewProvenance!=='explicit-owner-claim-not-independent-review-evidence'||
       receipt?.basis!=='PHOTO119-explicit-owner-confirmation'||
       receipt.ownerId!==begin.ownerId||receipt.itemId!==id||
       receipt.sourceSHA256!==verified.source||
       record.sourceHashVerified!==true||
       record.originalPhoto?.sha256!==verified.source||
       record.originalPhoto?.image!==verified.fallback.image||
       record.category!==verified.category||
       record.itemType!==verified.itemType||
       record.color!==verified.color||
       record.confirmedDetails?.category!==record.category||
       record.confirmedDetails?.itemType!==record.itemType||
       record.confirmedDetails?.color!==record.color)
      fail('stale-or-unapproved-owner-receipt');
    // Serialization is transient, never logged, persisted or returned from
    // the public UI; it includes the actual original for exact row CAS.
    let serialized;
    try{serialized=JSON.stringify(record);}
    catch{fail('unserializable-private-row');}
    if(typeof serialized!=='string')fail('unserializable-private-row');
    snapshots.set(id,serialized);
   }
   assertSource();
   let consumed=false;
   return Object.freeze({
    itemIds:Object.freeze([...snapshots.keys()]),
    assertCurrent(){if(consumed)fail('consumed');assertSource();},
    matches(id,actual){
     if(consumed)return false;
     assertSource();
     if(!snapshots.has(id)||actual?.id!==id||actual.ownerId!==begin.ownerId)
      return false;
     try{return JSON.stringify(actual)===snapshots.get(id);}
     catch{return false;}
    },
    consume(){assertSource();consumed=true;},
    consumer3D:false,releaseAuthorized:false
   });
  }
 });
}
