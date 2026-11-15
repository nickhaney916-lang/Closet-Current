/**
 * MAIN1054 / M59 — strictly opt-in, read-only owner PHOTO-ONLY outfit gallery
 * bridge for MULTI24 human-reviewed, physically unverified garment regions.
 *
 * This is not the strict preflightOwnedOutfit1054 verified-single/cutout path.
 * It NEVER admits 3D, fit, silhouette, physical garment count or automatic
 * segmentation accuracy. The only eligible view is an ORIGINAL JPEG gallery
 * with explicit "physical garment unit unverified" notice. No storage writes.
 */
import {buildOwnerWardrobeIndex} from '../../public/native-owner-wardrobe-index-167.mjs';
import {jpegBytes,digestBytes} from '../../public/native-canonical-photo-source-167.mjs';
import {unresolvedSegmentation54} from '../multi-garment-capture-01/atomic-group.mjs';

const SLOTS=new Set(['top','bottom','layer','layer2','layer3','shoes','bag','accessory','finish']);
const SHA=/^[0-9a-f]{64}$/;
const fail=reason=>{throw Error('MAIN59 '+reason);};
const isRef=x=>x!==null&&(typeof x==='object'||typeof x==='function');
const generation=x=>Number.isSafeInteger(x)&&x>=0||
 typeof x==='string'&&x.length>=8&&x.length<=160;
const validId=x=>typeof x==='string'&&x.length>0&&x.length<=200&&x.trim()===x;
function session(getSession){
 let x;try{x=getSession?.();}catch{fail('signed owner session unavailable');}
 if(!x||x.authenticated!==true||!validId(x.ownerId)||
  !generation(x.epoch)||!generation(x.operationEpoch)||
  x.privateDbName!=='closet-current-user-'+x.ownerId||
  !isRef(x.authRef)||!isRef(x.privateDbRef)||
  x.authRef.user?.id!==x.ownerId||
  x.privateDbRef.name!==x.privateDbName||
  typeof x.authRef.assertCurrent!=='function')
  fail('signed owner session unavailable');
 try{x.authRef.assertCurrent();}catch{fail('signed owner session unavailable');}
 return {ownerId:x.ownerId,epoch:x.epoch,operationEpoch:x.operationEpoch,
  authRef:x.authRef,privateDbRef:x.privateDbRef,privateDbName:x.privateDbName};
}
function assertSession(getSession,start){
 const now=session(getSession);
 if(start.ownerId!==now.ownerId||start.epoch!==now.epoch||
  start.operationEpoch!==now.operationEpoch||
  start.authRef!==now.authRef||start.privateDbRef!==now.privateDbRef||
  start.privateDbName!==now.privateDbName)
  fail('signed owner session changed during photo verification');
}
function boardStamp(board){
 if(!board||typeof board!=='object'||Array.isArray(board)||
  !board.slots||typeof board.slots!=='object'||Array.isArray(board.slots))
  fail('native outfit board unavailable');
 const entries=Object.entries(board.slots);
 if(!entries.length||entries.length>SLOTS.size||
    entries.some(([slot,id])=>!SLOTS.has(slot)||!validId(id))||
    new Set(entries.map(x=>x[1])).size!==entries.length)
  fail('invalid native selected garment IDs');
 let stamp;
 try{
  stamp=JSON.stringify([
   entries.slice().sort(([a],[b])=>a.localeCompare(b)),
   ['name','occasion','season','audience','size','budget','layerCount']
    .map(k=>board[k]??null),board.ideas??null
  ]);
 }catch{fail('outfit revision unavailable');}
 if(typeof stamp!=='string'||stamp.length>16384)
  fail('outfit revision unavailable');
 return {stamp,entries};
}
function approvedPhotoOnly(row,indexRow,owner){
 // Human review is evidence of an EDIT and CROP, NOT a verified individual
 // garment boundary. A source-mask uncertainty can never be overridden.
 if(row?.ownerId!==owner||row?.sourceHashVerified!==true||
  row?.extractionReview!=='human-confirmed'||row?.sourceCropReviewed!==true||
  row?.colorSource!=='user'||row?.userAdjusted!==true||
  row?.sourceExtraction!=='visible-only'||
  row?.derivedAssetType!=='reviewed-jpeg-crop'||
  row?.photoOnly!==true||row?.threeDReady!==false||
  row?.singleGarmentVerified!==false||
  row?.requiresOwnershipConfirmation!==false||
  row?.possibleDuplicate!==false||
  unresolvedSegmentation54(row.segmentHint)||
  !SHA.test(row?.sourceSHA256||'')||
  row?.originalPhoto?.sha256!==row.sourceSHA256||
  typeof row.originalPhoto.image!=='string'||
  row?.outfitSourceId!==row.sourceSHA256||
  row?.sourcePhotoId!==row.sourceSHA256||
  typeof row.sourcePieceKey!=='string'||
  !row.sourcePieceKey.startsWith(row.sourceSHA256+'/')||
  row.sourcePieceKey.length>220||
  row?.category!==indexRow?.category||
  row?.itemType!==indexRow?.itemType||
  row?.color!==indexRow?.color||
  indexRow?.sourceKind!=='ambiguous-source'||
  indexRow?.source!==row.sourceSHA256||
  indexRow.reviewReasons.length!==1||
  indexRow.reviewReasons[0]!=='shared-source-needs-cutout-proof')
  fail('saved reviewed photo lacks safe photo-only owner evidence');
}
/** Result contains NO JPEG bytes, auth refs, private DB or release authority. */
export async function preflightReviewedPhotoOnly59({
 getSession,readOwnerItems,cleanBoard,board
}={}){
 if(typeof getSession!=='function'||typeof readOwnerItems!=='function'||
  typeof cleanBoard!=='function')
  fail('native owner app adapters required');
 const start=session(getSession);
 const {stamp,entries}=boardStamp(board);
 const assertBoard=()=>{
  if(boardStamp(board).stamp!==stamp)
   fail('outfit board changed during source verification');
 };
 const first=await readOwnerItems();
 assertSession(getSession,start);assertBoard();
 const index=buildOwnerWardrobeIndex(start.ownerId,first);
 const native=cleanBoard(board,first);
 assertBoard();
 if(!native?.slots||Object.keys(native.slots).length!==entries.length||
    entries.some(([slot,id])=>native.slots[slot]!==id))
  fail('native outfit normalizer dropped or changed a selected piece');
 const selected=new Set(entries.map(x=>x[1]));
 if(index.summary.sourcePairs.some(p=>p.ids.some(id=>selected.has(id))))
  fail('duplicated or ambiguous same-original selected physical pieces');
 const byId=new Map(first.map(x=>[x.id,x]));
 const byIndex=new Map(index.entries.map(x=>[x.id,x]));
 const pinned=[];
 for(const [slot,id] of entries){
  const row=byId.get(id),idx=byIndex.get(id);
  if(!row||!idx||!idx.slotIds.includes(slot))
   fail('selected private garment absent or incompatible with slot');
  approvedPhotoOnly(row,idx,start.ownerId);
  assertBoard();
  const bytes=jpegBytes(row.originalPhoto.image);
  if(bytes.length<128)fail('original JPEG lacks a supported source envelope');
  const digest=await digestBytes(bytes);
  assertSession(getSession,start);assertBoard();
  if(digest!==row.sourceSHA256)
   fail('original JPEG bytes do not match saved SHA');
  // Keep full saved row only in the ephemeral local function, NEVER output it.
  pinned.push({slot,itemId:id,sourceSHA256:digest,record:JSON.stringify(row)});
 }
 const fresh=await readOwnerItems();
 assertSession(getSession,start);assertBoard();
 const freshIndex=buildOwnerWardrobeIndex(start.ownerId,fresh);
 if(freshIndex.summary.sourcePairs.some(p=>p.ids.some(id=>selected.has(id))))
  fail('new ambiguous duplicate source appeared during private recheck');
 const freshById=new Map(fresh.map(x=>[x.id,x]));
 for(const p of pinned){
  const current=freshById.get(p.itemId);
  if(!current||JSON.stringify(current)!==p.record)
   fail('owner garment changed during source verification');
  const idx=freshIndex.entries.find(x=>x.id===p.itemId);
  approvedPhotoOnly(current,idx,start.ownerId);
 }
 assertSession(getSession,start);assertBoard();
 return Object.freeze({
  status:'reviewed-original-gallery-only-physical-unit-unverified',
  unitIdentityVerified:false,
  fittedOutfitAuthorized:false,renderAuthorized3D:false,
  originalPhotoOnly:true,sourcePhotoOnlyResearch:true,
  slots:Object.freeze(pinned.map(p=>Object.freeze({
   slot:p.slot,itemId:p.itemId,sourceSHA256:p.sourceSHA256,
   presentationMode:'original-photo-gallery-only',
   physicalGarmentCountVerified:false,renderAuthorized3D:false
  }))),
  warning:'Photo-only: selected clothing regions were manually reviewed, but individual physical garment boundaries and fitted appearance remain unverified.',
  persisted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
