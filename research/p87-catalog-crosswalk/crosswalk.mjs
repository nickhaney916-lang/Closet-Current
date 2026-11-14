/** Isolated #1149 contract. No persistence, network, or consumer 3D admission. */
import {buildOwnerWardrobeIndex,queryOwnerWardrobeIndex} from '../../public/native-owner-wardrobe-index-167.mjs';
import {digestBytes,jpegBytes} from '../../public/native-canonical-photo-source-167.mjs';
const fields=['category','itemType','pattern','sleeveLength','fit','color','material','brand','size','occasion','notes','seasons','name'];
const fail=reason=>{throw Error('P87 '+reason);};
const clone=x=>structuredClone(x);
function unitLineage(record,sourceValid){
 const pair=record.shoePair,fragments=record.combinedFragments70;
 const grouping=pair||fragments;
 const receipts=[record.reconciliation70,grouping?.companion?.reconciliation70].filter(Boolean);
 const bound=receipts.length===2&&receipts.every(r=>r.ownerId===record.ownerId&&r.sourceSha256===record.sourceSHA256&&/^[a-f0-9]{64}$/.test(r.maskSha256||''))&&receipts[0].maskSha256!==receipts[1].maskSha256;
 const ids=grouping?.componentIds;
 const components=Array.isArray(ids)&&ids.length===2&&ids[0]===record.id&&
  ids.every(id=>typeof id==='string'&&id.trim()===id&&id.length>0&&id.length<=200)&&ids[0]!==ids[1];
 const confirmed=sourceValid&&bound&&components&&grouping?.confirmedByOwner===true&&
  record.reconciliation70Status===(pair?'paired_confirmed':'fragments_confirmed')&&
  record.requiresOwnershipConfirmation!==true;
 return {kind:pair?'shoe-pair':fragments?'garment-fragments':'item',
  ownerConfirmed:!!confirmed,status:record.reconciliation70Status??null,
  componentIds:clone(grouping?.componentIds??[]),
  sourceMaskReceipts:receipts.map(r=>({ownerId:r.ownerId,sourceSHA256:r.sourceSha256,maskSHA256:r.maskSha256}))};
}
function reviewed(record){
 const out={...record};
 for(const key of fields){
  // Exact equality prevents stale confirmation from certifying a later prediction/edit.
  const evidence=record.confirmedDetails?.[key];
  const colorReviewed=key==='color'&&record.colorSource==='user'&&record.confirmedColor===true;
  if(!colorReviewed&&(evidence===undefined||JSON.stringify(evidence)!==JSON.stringify(record[key])))delete out[key];
 }
 if(record.requiresOwnershipConfirmation===true||record.reconciliation70Status==='unresolved'){delete out.category;delete out.itemType;}
 return out;
}
/** Session provider must return authoritative current owner/db/session/revision lease.
 * Revision changes on every edit, delete, revoke or restore, even within one account.
 * No cached retrieval: re-read and recheck lease after asynchronous byte validation.
 */
export function createCatalogCrosswalk({lease,readSavedItems,cryptoProvider=globalThis.crypto}={}){
 if(typeof lease!=='function'||typeof readSavedItems!=='function')fail('invalid-interface');
 function current(){const x=clone(lease());if(!x||typeof x.ownerId!=='string'||!x.ownerId.trim()||!['session','database','revision'].every(k=>typeof x[k]==='string'&&x[k]))fail('signed-lease-required');return x;}
 const key=x=>JSON.stringify([x.ownerId,x.session,x.database,x.revision]);
 async function snapshot(){
  const before=current(),records=clone(await readSavedItems(before));
  if(key(current())!==key(before))fail('stale-read');
  if(!Array.isArray(records))fail('snapshot-required');
  const originals=new Map(),raw=new Map(),cutoutVerified=new Set();
  for(const record of records){
   // Require explicit owner on this new boundary; legacy ownerless records need migration proof.
   if(record.ownerId!==before.ownerId)fail('record-owner-mismatch');
   if(typeof record.id!=='string'||!record.id||record.id.trim()!==record.id||record.id.length>200)fail('invalid-item-id');
   const image=record.originalPhoto?.image;
   let valid=false;
   // A matching digest alone cannot silently upgrade a deliberately unverified
   // source receipt. Both the saved receipt AND the original bytes must agree.
   if(!record.deleted&&!record.sourceRevoked&&record.sourceHashVerified===true&&image){
    try{const sha=await digestBytes(jpegBytes(image),cryptoProvider);valid=sha===record.sourceSHA256&&sha===record.originalPhoto.sha256;}catch{}
   }
   originals.set(record.id,valid?image:null);raw.set(record.id,record);
   const hint=record.segmentHint;
   // Shared-photo split pieces require their own genuine cutout bytes. A
   // claimed cutout SHA, model mask or ownerReviewedInstance boolean alone
   // never establishes a selectable inventory garment.
   if(valid&&hint?.verified===true&&hint.ownerReviewedInstance===true&&
      hint.clipped!==true&&hint.originalSHA256===record.sourceSHA256&&
      (hint.ownerId===undefined||hint.ownerId===before.ownerId)&&
      typeof hint.cutoutSHA256==='string'&&/^[0-9a-f]{64}$/.test(hint.cutoutSHA256)&&
      hint.cutoutSHA256!==record.sourceSHA256&&typeof hint.cutoutImage==='string'){
    try{
     if(await digestBytes(jpegBytes(hint.cutoutImage),cryptoProvider)===hint.cutoutSHA256)
      cutoutVerified.add(record.id);
    }catch{}
   }
  }
  if(key(current())!==key(before))fail('stale-source');
  const live=records.filter(r=>!r.deleted&&!r.sourceRevoked);
  const index=buildOwnerWardrobeIndex(before.ownerId,live.map(record=>{
   const row=reviewed(record),originalReady=!!originals.get(record.id);
   const segmented=!!(record.segmentHint||record.outfitSourceId||record.cropBounds);
   const distinctSegment=segmented&&cutoutVerified.has(record.id)&&
    typeof record.outfitSourceId==='string'&&record.outfitSourceId.trim()!=='';
   const single=record.singleGarmentVerified===true&&!segmented;
   const grouped=!!(record.shoePair||record.combinedFragments70);
   const resolvedUnit=!grouped||unitLineage(record,originalReady).ownerConfirmed;
   // Keep an unverified piece visible for review, but never let its
   // previously confirmed label make it selectable in an outfit. This is
   // stronger than merely suppressing the fallback photo and consumer 3D.
   if(!(originalReady&&(single||distinctSegment)&&resolvedUnit&&
        record.requiresOwnershipConfirmation!==true)){
    delete row.category;delete row.itemType;
   }
   return row;
  }));
  return {before,index,originals,raw};
 }
 return Object.freeze({
  async query(filters={}){filters=clone(filters);const {index,before}=await snapshot();return queryOwnerWardrobeIndex(index,before.ownerId,filters);},
  async item(id){
   const {index,originals,raw}=await snapshot(),row=index.entries.find(x=>x.id===id);
   if(!row)fail('item-unavailable');
   const record=raw.get(id),image=originals.get(id);
   return Object.freeze({ ...row, garmentId:record.garmentId??null,pairId:record.pairId??null,
    duplicateCandidate:clone(record.possibleDuplicate??null),
    sourceReferences:clone(record.sourceReferences??[]),
    sourceId:record.sourceId??null,outfitSourceId:record.outfitSourceId??null,
    unit:unitLineage(record,!!image),
    state:image&&record.researchArtifact?.sourceSHA256===row.source?'3D_RESEARCH_CANDIDATE':'2D_ONLY',
    fallbackCause:image?'consumer-3d-admission-unproven':'original-source-unavailable',
    fallback:image?Object.freeze({itemId:id,image,sourceSHA256:record.sourceSHA256}):null,
    // A label or caller-supplied certificate can never upgrade this to verified 3D.
    consumer3D:false});
  },
  async board(board){
   const stamp=JSON.stringify(board),selected=clone(board);
   const {index}=await snapshot(),slots={},used=new Set();
   if(JSON.stringify(board)!==stamp)fail('board-changed-during-read');
   board=selected;
   const dress=index.entries.find(r=>r.id===board?.slots?.top)?.category==='Dresses';
   for(const slot of ['top','bottom','layer','layer2','layer3','shoes','bag','accessory','finish']){
    if(dress&&['bottom','layer','layer2','layer3'].includes(slot))continue;
    const row=index.entries.find(r=>r.id===board?.slots?.[slot]);
    if(row?.slotIds.includes(slot)&&!used.has(row.id)){slots[slot]=row.id;used.add(row.id);}
   }
   return {slots,layerCount:slots.layer3?3:slots.layer2?2:slots.layer?1:0};
  }
 });
}

/** Native #1054 session-shape bridge. Read-only and unwired: the real controller
 * supplies its current auth/DB objects and a content revision that changes on
 * edits, deletion, revocation and restore. No JWT/cloud-auth claim is made here.
 */
export function createNativeCatalogCrosswalk({getSession,getRevision,readOwnerItems,cryptoProvider=globalThis.crypto}={}){
 if([getSession,getRevision,readOwnerItems].some(f=>typeof f!=='function'))fail('native-interface-required');
 const refs=new WeakMap();let sequence=0;
 const refId=ref=>{if(!refs.has(ref))refs.set(ref,++sequence);return refs.get(ref);};
 const reference=x=>x!==null&&(typeof x==='object'||typeof x==='function');
 const generation=x=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0||typeof x==='string'&&x.length>=8&&x.length<=160;
 const same=(a,b)=>a.ownerId===b.ownerId&&a.epoch===b.epoch&&a.operationEpoch===b.operationEpoch&&a.authRef===b.authRef&&a.privateDbRef===b.privateDbRef&&a.privateDbName===b.privateDbName;
 function active(){
  const s=getSession();
  if(!s||s.authenticated!==true||typeof s.ownerId!=='string'||!s.ownerId.trim()||
    !generation(s.epoch)||!generation(s.operationEpoch)||
    !reference(s.authRef)||!reference(s.privateDbRef)||s.authRef.user?.id!==s.ownerId||
    s.privateDbName!=='closet-current-user-'+s.ownerId||s.privateDbRef.name!==s.privateDbName)
   fail('native-signed-session-required');
  s.authRef.assertCurrent?.();
  return Object.freeze({ownerId:s.ownerId,epoch:s.epoch,operationEpoch:s.operationEpoch,
   authRef:s.authRef,privateDbRef:s.privateDbRef,privateDbName:s.privateDbName});
 }
 function capture(){
  const before=active(),revision=getRevision(before);
  if(!same(before,active()))fail('native-session-changed');
  if(!generation(revision))fail('native-content-revision-required');
  return {before,lease:{ownerId:before.ownerId,
   session:JSON.stringify([refId(before.authRef),before.epoch,before.operationEpoch]),
   database:String(refId(before.privateDbRef)),revision:JSON.stringify(revision)}};
 }
 const stamp=x=>JSON.stringify([x.ownerId,x.session,x.database,x.revision]);
 return createCatalogCrosswalk({cryptoProvider,lease:()=>capture().lease,
  async readSavedItems(expected){
   const captured=capture();
   const assertCurrent=()=>{if(stamp(capture().lease)!==stamp(expected))fail('native-session-or-content-changed');};
   assertCurrent();
   const records=await readOwnerItems(Object.freeze({...captured.before,assertCurrent}));
   assertCurrent();return records;
  }});
}
