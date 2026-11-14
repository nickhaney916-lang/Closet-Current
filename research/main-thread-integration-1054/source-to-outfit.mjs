/**
 * Main-thread #1054 integration research ONLY. No app wiring, writes, or remote calls.
 *
 * Hand off actual owned board slots to a source-honest 2D-only decision.
 * A later Mission 2 adapter must independently prove photographed geometry,
 * collisions, both rigs and source continuity before 3D can be authorized.
 * Same-owner re-login is NOT the same authentication session: identity-pin
 * real auth/DB references and capture generation around every asynchronous read.
 */
import {buildOwnerWardrobeIndex} from '../../public/native-owner-wardrobe-index-167.mjs';
import {jpegBytes,digestBytes} from '../../public/native-canonical-photo-source-167.mjs';

const SLOTS=new Set(['top','bottom','layer','layer2','layer3','shoes','bag','accessory','finish']);
const SHA=/^[0-9a-f]{64}$/;
const issue=reason=>{throw Error('MAIN1054 '+reason);};
const validId=id=>typeof id==='string'&&id.trim()===id&&id.length>0&&id.length<=200;

// M12: the native Style original-photo session already pins auth object,
// private IndexedDB handle and capture generation (Mission 3 #1100/#1104).
// Owner ID, persisted token epoch and DB *name* can survive same-owner re-login.
// This research handoff must reject a different live session across awaits.
const reference=x=>x!==null&&(typeof x==='object'||typeof x==='function');
const generation=x=>(typeof x==='number'&&Number.isSafeInteger(x)&&x>=0)||
  (typeof x==='string'&&x.length>=8&&x.length<=160);
function active(getSession){
 let s;
 try{s=typeof getSession==='function'&&getSession();}catch{
  issue('signed owner session and private database required');
 }
 if(!s||s.authenticated!==true||typeof s.ownerId!=='string'||!s.ownerId||
   !generation(s.epoch)||
   s.privateDbName!=='closet-current-user-'+s.ownerId||
   !reference(s.authRef)||!reference(s.privateDbRef)||
   s.authRef.user?.id!==s.ownerId||
   s.privateDbRef.name!==s.privateDbName||
   !generation(s.operationEpoch))
  issue('signed owner session and private database required');
 try{s.authRef.assertCurrent?.();}catch{
  issue('signed owner session and private database required');
 }
 // Return object references only in ephemeral local lease; never in result,
 // logs, saved wardrobe, model inference or any hosted network payload.
 return Object.freeze({ownerId:s.ownerId,epoch:s.epoch,
  privateDbName:s.privateDbName,authRef:s.authRef,
  privateDbRef:s.privateDbRef,operationEpoch:s.operationEpoch});
}
const same=(a,b)=>a.ownerId===b.ownerId&&a.epoch===b.epoch&&
 a.privateDbName===b.privateDbName&&a.authRef===b.authRef&&
 a.privateDbRef===b.privateDbRef&&a.operationEpoch===b.operationEpoch;
function assertLive(getSession,before){
 if(!same(before,active(getSession)))issue('owner session changed');
}
function fingerprint(item){
 // Local, transient data comparison. Never returned, persisted or logged.
 return JSON.stringify([
  item?.id,item?.ownerId,item?.userId,item?.accountId,item?.category,
  item?.itemType,item?.color,item?.colorSource,item?.ownerReviewed,
  item?.userAdjusted,item?.sourcePhotoOriginal,item?.sourceHashVerified,
  item?.singleGarmentVerified,item?.sourceSHA256,item?.originalPhoto?.sha256,
  item?.originalPhoto?.image,item?.segmentHint?.cutoutSHA256,
  item?.segmentHint?.originalSHA256,item?.segmentHint?.clipped,
  item?.segmentHint?.ownerReviewedInstance,item?.segmentHint?.verified,
  item?.outfitSourceId,item?.possibleDuplicate,item?.requiresOwnershipConfirmation
 ]);
}
function confirmed(row,item,ownerId){
 if(item.ownerId!==ownerId||item.ownerReviewed!==true||item.userAdjusted!==true||
   item.sourcePhotoOriginal!==true||item.sourceHashVerified!==true||
   !SHA.test(item.sourceSHA256||'')||
   item.originalPhoto?.sha256!==item.sourceSHA256||
   typeof item.originalPhoto?.image!=='string'||
   row.reviewReasons.length>0||
   !['verified-single','verified-cutout'].includes(row.sourceKind))
  issue('selected garment lacks confirmed original and review evidence');
 if(row.sourceKind==='verified-cutout'&&
   (item.segmentHint?.verified!==true||
    item.segmentHint?.ownerReviewedInstance!==true||
    item.segmentHint?.originalSHA256!==item.sourceSHA256||
    !SHA.test(item.segmentHint?.cutoutSHA256||'')||
    typeof item.outfitSourceId!=='string'||!item.outfitSourceId))
  issue('multi-garment segment needs owner-confirmed original/cutout proof');
}

/**
 * Purely read-only boundary; the supplied cleanBoard MUST be the real
 * public/outfit-board-engine.js cleanOutfitBoard in an integration caller.
 * It is intentionally dependency-injected because that legacy script is not
 * an ES module. A lossy normalization is a BLOCKER, never a silent success.
 *
 * Returns only metadata IDs / SHA, NOT private JPEG pixels or signed tokens.
 */
export async function preflightOwnedOutfit1054({getSession,readOwnerItems,cleanBoard,board}={}){
 const begin=active(getSession);
 if(typeof readOwnerItems!=='function'||typeof cleanBoard!=='function'||
   !board||typeof board!=='object'||!board.slots||
   typeof board.slots!=='object'||Array.isArray(board.slots))
  issue('actual private wardrobe and board adapter required');
 const raw=Object.entries(board.slots);
 if(!raw.length||raw.length>SLOTS.size||
   raw.some(([slot,id])=>!SLOTS.has(slot)||!validId(id))||
   new Set(raw.map(([,id])=>id)).size!==raw.length)
  issue('invalid or repeated outfit slot identity');
 const records=await readOwnerItems();
 assertLive(getSession,begin);
 const index=buildOwnerWardrobeIndex(begin.ownerId,records);
 const clean=cleanBoard(board,records);
 if(!clean?.slots||Object.keys(clean.slots).length!==raw.length||
   raw.some(([slot,id])=>clean.slots[slot]!==id))
  issue('native outfit normalization would silently lose selected garment');
 const chosen=new Set(raw.map(([,id])=>id));
 if(index.summary.sourcePairs.some(pair=>pair.ids.some(id=>chosen.has(id))))
  issue('selected garment has duplicate or ambiguous source identity');
 const byId=new Map(records.map(item=>[item.id,item]));
 const rows=new Map(index.entries.map(row=>[row.id,row]));
 const pinned=[];
 for(const [slot,id] of raw){
  const item=byId.get(id),row=rows.get(id);
  if(!item||!row||!row.slotIds.includes(slot))
   issue('missing or incompatible owned garment');
  confirmed(row,item,begin.ownerId);
  const bytes=jpegBytes(item.originalPhoto.image);
  if(bytes.length<80)issue('original JPEG has no usable source envelope');
  const actual=await digestBytes(bytes);
  assertLive(getSession,begin);
  if(actual!==item.sourceSHA256)issue('original JPEG SHA does not match saved source');
  pinned.push(Object.freeze({slot,itemId:id,sourceSHA256:actual,
   fingerprint:fingerprint(item)}));
 }
 const fresh=await readOwnerItems();
 assertLive(getSession,begin);
 // Detect a different tab adding a lookalike/duplicate while SHA awaits.
 const freshIndex=buildOwnerWardrobeIndex(begin.ownerId,fresh);
 if(freshIndex.summary.sourcePairs.some(pair=>pair.ids.some(id=>chosen.has(id))))
  issue('new ambiguous or duplicate source appeared during verification');
 const freshById=new Map(fresh.map(x=>[x.id,x]));
 for(const item of pinned)if(fingerprint(freshById.get(item.itemId))!==item.fingerprint)
  issue('saved garment changed during source verification');
 assertLive(getSession,begin);
 return Object.freeze({
  ownerId:begin.ownerId,sessionEpoch:begin.epoch,
  status:'source-verified-2d-only',
  renderAuthorized3D:false,
  photographed3DCompatibilityEstablished:false,
  imageDecodeEstablished:false,
  slots:Object.freeze(pinned.map(({slot,itemId,sourceSHA256})=>Object.freeze({
   slot,itemId,sourceSHA256,presentationMode:'verified-original-photo-2d',
   renderAuthorized3D:false
  }))),
  persisted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
