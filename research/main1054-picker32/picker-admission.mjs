/**
 * MAIN1054 M32 — research-only, fail-closed native picker action boundary.
 * Does not modify outfits, catalog rows, hosted services or rendering.
 * A consumer may use a positive result ONLY for an immediate guarded action;
 * durable outfit writes still need an owner/session/revision CAS.
 */
import {createNativeCatalogCrosswalk} from '../p87-catalog-crosswalk/crosswalk.mjs';

const SLOTS=new Set(['top','bottom','layer','layer2','layer3','shoes','bag','accessory','finish']);
const validId=x=>typeof x==='string'&&x.length>0&&x.length<=200&&x.trim()===x;
const generation=x=>(typeof x==='number'&&Number.isSafeInteger(x)&&x>=0)||
  (typeof x==='string'&&x.length>=8&&x.length<=160);
const reference=x=>x!==null&&(typeof x==='object'||typeof x==='function');
const reject=reason=>{throw Error('MAIN1054_M32 '+reason);};
const fields=['name','occasion','season','audience','size','budget','layerCount'];
const same=(a,b)=>a.ownerId===b.ownerId&&a.epoch===b.epoch&&
 a.operationEpoch===b.operationEpoch&&a.authRef===b.authRef&&
 a.privateDbRef===b.privateDbRef&&a.privateDbName===b.privateDbName;

function boardSnapshot(value){
 let board;
 try{board=structuredClone(value);}catch{reject('invalid-board');}
 if(!board||typeof board!=='object'||!board.slots||
    typeof board.slots!=='object'||Array.isArray(board.slots))
  reject('invalid-board');
 const slots=Object.entries(board.slots);
 if(slots.length>SLOTS.size||slots.some(([slot,id])=>!SLOTS.has(slot)||!validId(id))||
    new Set(slots.map(([,id])=>id)).size!==slots.length)
  reject('invalid-board-slots');
 let stamp;
 try{
  stamp=JSON.stringify([slots.slice().sort(([a],[b])=>a.localeCompare(b)),
   fields.map(key=>board[key]??null),board.ideas??null]);
 }catch{reject('invalid-board-metadata');}
 if(typeof stamp!=='string'||stamp.length>16384)reject('invalid-board-metadata');
 return {board,stamp};
}

export function createPickerAdmission32({
 getSession,getRevision,readOwnerItems,getBoard,
 cryptoProvider=globalThis.crypto
}={}){
 if([getSession,getRevision,readOwnerItems,getBoard].some(f=>typeof f!=='function'))
  reject('native-providers-required');
 let serial=0,disposed=false;
 const crosswalk=createNativeCatalogCrosswalk({
  getSession,getRevision,readOwnerItems,cryptoProvider
 });
 function capture(){
  if(disposed)reject('disposed');
  let s,revision;
  try{
   s=getSession();revision=getRevision(s);
   s?.authRef?.assertCurrent?.();
  }catch{reject('session-unavailable');}
  if(!s||s.authenticated!==true||!validId(s.ownerId)||
     !generation(s.epoch)||!generation(s.operationEpoch)||
     !reference(s.authRef)||!reference(s.privateDbRef)||
     s.authRef.user?.id!==s.ownerId||
     s.privateDbName!=='closet-current-user-'+s.ownerId||
     s.privateDbRef.name!==s.privateDbName||
     !generation(revision))
   reject('signed-session-and-content-revision-required');
  return {session:{ownerId:s.ownerId,epoch:s.epoch,
   operationEpoch:s.operationEpoch,authRef:s.authRef,
   privateDbRef:s.privateDbRef,privateDbName:s.privateDbName},revision};
 }
 function current(expected,boardStamp,request){
  if(disposed||request!==serial)reject('superseded');
  const now=capture();
  if(!same(expected.session,now.session)||expected.revision!==now.revision)
   reject('session-or-revision-changed');
  if(boardSnapshot(getBoard()).stamp!==boardStamp)reject('board-edited');
 }
 return Object.freeze({
  invalidate(){++serial;},
  dispose(){disposed=true;++serial;},
  /**
   * Validate an exact candidate selection against real source-hashed private
   * rows and P87/M31 confirmed-field receipts. No selected images leave here.
   * An approval is NOT a persisted outfit, JWT/RLS proof or 3D grant.
   */
  async authorize(slot,itemId){
   const request=++serial;
   try{
    if(!SLOTS.has(slot)||!validId(itemId))reject('invalid-selection');
    const before=capture(),snapshot=boardSnapshot(getBoard());
    const candidate=structuredClone(snapshot.board);
    candidate.slots={...candidate.slots};
    for(const [key,id] of Object.entries(candidate.slots))
     if(id===itemId)delete candidate.slots[key];
    candidate.slots[slot]=itemId;
    const item=await crosswalk.item(itemId);
    current(before,snapshot.stamp,request);
    // Unconfirmed/revoked items may remain available to review in My Closet.
    // They are never eligible to mutate a source-trusted outfit selection.
    if(!item.slotIds?.includes(slot)||item.consumer3D!==false||
       !item.fallback||item.fallback.itemId!==itemId||
       item.fallback.sourceSHA256!==item.source||
       typeof item.fallback.image!=='string')
     reject('unverified-garment');
    const checked=await crosswalk.board(candidate);
    current(before,snapshot.stamp,request);
    if(checked.slots?.[slot]!==itemId)reject('invalid-slot-or-uncertain-unit');
    // A conservative no-loss rule: if another previously selected piece
    // disappears from normalization, block rather than silently erasing it.
    // The actual editor must have the owner remove conflicting layers first.
    for(const [key,id] of Object.entries(snapshot.board.slots))
     if(id!==itemId&&checked.slots[key]!==id)
      reject('existing-outfit-slot-conflict');
    return Object.freeze({
     status:'authorized-for-immediate-2d-selection-only',
     itemId,slot,sourceSHA256:item.fallback.sourceSHA256,
     consumer3D:false,persisted:false,releaseAuthorized:false
    });
   }catch{
    // Do not reveal private account, original image, source errors or IDs on
    // a denied action. This is deliberately not a human-readable error log.
    return Object.freeze({
     status:'blocked-review-or-refresh-required',
     consumer3D:false,persisted:false,releaseAuthorized:false
    });
   }
  }
 });
}
