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
 const confirmed=sourceValid&&bound&&grouping?.confirmedByOwner===true&&
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
  const originals=new Map(),raw=new Map();
  for(const record of records){
   // Require explicit owner on this new boundary; legacy ownerless records need migration proof.
   if(record.ownerId!==before.ownerId)fail('record-owner-mismatch');
   if(typeof record.id!=='string'||!record.id||record.id.trim()!==record.id||record.id.length>200)fail('invalid-item-id');
   const image=record.originalPhoto?.image;
   let valid=false;
   if(!record.deleted&&!record.sourceRevoked&&image){
    try{const sha=await digestBytes(jpegBytes(image),cryptoProvider);valid=sha===record.sourceSHA256&&sha===record.originalPhoto.sha256;}catch{}
   }
   originals.set(record.id,valid?image:null);raw.set(record.id,record);
  }
  if(key(current())!==key(before))fail('stale-source');
  const live=records.filter(r=>!r.deleted&&!r.sourceRevoked);
  const index=buildOwnerWardrobeIndex(before.ownerId,live.map(reviewed));
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
