/**
 * Independent, OFFLINE original-photo provenance audit for the REAL stored
 * Closet Current schema. No production integration or network/database reads.
 *
 * Account owner is supplied ONLY by an already authenticated session AND the
 * matching IndexedDB handle; item records do not carry a universal accountId.
 * This is an additional client-side check, never a replacement for Auth/RLS.
 *
 * "original" means earliest JPEG retained by Closet Current, NOT camera/HEIC/
 * imported-file raw bytes. import/capture pipelines can re-encode/rescale.
 */
import {fingerprintOriginalPhoto} from './original-photo-fingerprint.mjs';

const sha=/^[0-9a-f]{64}$/;
function nonempty(value){return typeof value==='string'&&value.trim().length>0;}
function account(value){return nonempty(value)&&/^[a-f0-9-]{36}$/i.test(value);}
function assertContext(context){
 if(!context||!account(context.authenticatedUserId)||context.indexedDbName!=='closet-current-user-'+context.authenticatedUserId)throw Error('Authenticated account / local database mismatch');
 if(context.cloudOwnerId!==undefined&&context.cloudOwnerId!==context.authenticatedUserId)throw Error('Foreign cloud backup owner');
 if(context.currentUserId!==undefined&&context.currentUserId!==context.authenticatedUserId)throw Error('Authentication session changed');
 return context.authenticatedUserId;
}
function decodeImageJPEG(source){
 if(!nonempty(source)||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(source))throw Error('Saved photo must be a locally retained JPEG');
 let buffer;
 try{
  const data=source.slice('data:image/jpeg;base64,'.length);
  if(data.length%4!==0)throw Error('Invalid base64 photo');
  buffer=Uint8Array.from(atob(data),char=>char.charCodeAt(0));
  if(btoa(String.fromCharCode(...buffer))!==data)throw Error('Noncanonical base64 photo');
 }catch{throw Error('Corrupted JPEG encoding');}
 // Header/trailer screening is NOT a full JPEG decode or blankness check.
 if(buffer.length<8||buffer.length>8388608||buffer[0]!==0xff||buffer[1]!==0xd8||buffer.at(-2)!==0xff||buffer.at(-1)!==0xd9)
  throw Error('Corrupted retained JPEG');
 return buffer;
}
function shaHex(bytes,cryptoProvider){
 return fingerprintOriginalPhoto(bytes,cryptoProvider).then(r=>r.version);
}
function slotItems(document){
 const record=document?.state?.['outfit-board'];
 return [record?.current,...(Array.isArray(record?.saved)?record.saved:[])].filter(x=>x&&x.slots&&typeof x.slots==='object');
}
export async function auditRetainedPhotoProvenance(local,context,cryptoProvider=globalThis.crypto){
 const ownerId=assertContext(context);
 if(!local||!Array.isArray(local.items))throw Error('IndexedDB item records required');
 const ids=new Set(),result=new Map();
 for(const item of local.items){
  if(!item||!nonempty(item.id)||ids.has(item.id))throw Error('Duplicate or invalid garment ID');
  ids.add(item.id);
  // The public app normally stores image (cropped when outfit-split).
  // Outfit captures ALSO store originalPhoto.image (re-encoded full outfit).
  const hasOriginal=typeof item.originalPhoto?.image==='string';
  const original=hasOriginal?item.originalPhoto.image:item.image;
  const bytes=decodeImageJPEG(original);
  // Explicit source fields are optional in real IndexedDB; do not invent them.
  // Multi-piece outfitSourceId by itself is only an arbitrary grouping token.
  const originalSha256=await shaHex(bytes,cryptoProvider);
  const cropSha256=await shaHex(decodeImageJPEG(item.image),cryptoProvider);
  const recognitionSha256=typeof item.recognitionPhoto?.image==='string'?
   await shaHex(decodeImageJPEG(item.recognitionPhoto.image),cryptoProvider):null;
  const sourceGroup=nonempty(item.outfitSourceId)?item.outfitSourceId:null;
  if(item.originalPhoto?.image!==undefined&&typeof item.originalPhoto.image!=='string')throw Error('Malformed retained original-photo record');
  if(item.cloudSourceSha256!==undefined&&item.cloudSourceSha256!==originalSha256)throw Error('Stale original-photo SHA-256 metadata');
  result.set(item.id,Object.freeze({
   itemId:item.id,ownerId,originalSha256,cropSha256,recognitionSha256,
   sourceGroup,sourceKind:hasOriginal?'reencoded-outfit-full-frame':'app-retained-garment-jpeg',
   originalLength:bytes.byteLength,originalDistinctFromCrop:originalSha256!==cropSha256
  }));
 }
 for(const board of slotItems(local)){
  for(const id of Object.values(board.slots)){
   if(id!==undefined&&id!==null&&id!==''&&(!nonempty(id)||!result.has(id)))
    throw Error('Saved outfit references deleted or foreign local garment');
  }
 }
 return Object.freeze({ownerId,garments:result,appOriginalOnly:true,nativeFileSHA256Proven:false,
  deviceCloudAuthorizationProven:false});
}
export function snapshotSourceHashes(board,audit){
 if(!board||!board.slots||!audit?.garments)throw Error('Audited saved board required');
 const slots={},sourceHashes={},ids=new Set();
 for(const [slot,id] of Object.entries(board.slots)){
  if(!nonempty(id)||ids.has(id)||!audit.garments.has(id))throw Error('Missing, duplicate or deleted saved outfit garment');
  ids.add(id);slots[slot]=id;sourceHashes[slot]=audit.garments.get(id).originalSha256;
 }
 return Object.freeze({ownerId:audit.ownerId,slots,sourceHashes});
}
export function verifyRestoredSources(saved,audit){
 if(!saved||!audit?.garments||saved.ownerId!==audit.ownerId)throw Error('Foreign saved outfit owner');
 if(!saved.slots||!saved.sourceHashes)throw Error('Saved outfit lacks original-source hashes');
 const restored=snapshotSourceHashes(saved,audit);
 for(const [slot,hash] of Object.entries(restored.sourceHashes)){
  if(!sha.test(saved.sourceHashes[slot]||'')||hash!==saved.sourceHashes[slot])throw Error('Original source changed or unavailable');
 }
 if(Object.keys(saved.sourceHashes).length!==Object.keys(restored.sourceHashes).length)throw Error('Stale saved outfit source slots');
 return restored;
}
export async function verifyStoredCloudJPEG(path,bytes,context,cryptoProvider=globalThis.crypto){
 const ownerId=assertContext(context);
 if(typeof path!=='string')throw Error('Cloud photo path required');
 const match=path.match(/^([0-9a-f-]{36})\/([a-f0-9]{64})\.jpg$/i);
 if(!match||match[1]!==ownerId)throw Error('Foreign or malformed private cloud photo path');
 if(!(bytes instanceof Uint8Array))throw Error('Downloaded photo bytes required');
 const raw=new Uint8Array(bytes);
 if(raw.byteLength<8||raw.byteLength>8388608||raw[0]!==255||raw[1]!==216||raw.at(-2)!==255||raw.at(-1)!==217)throw Error('Corrupted cloud JPEG');
 const digest=await shaHex(raw,cryptoProvider);
 if(digest!==match[2])throw Error('Cloud object SHA-256 mismatch');
 return {ownerId,storedJPEGHash:digest,storedByteLength:raw.length,
  isNativeCameraOrImportSourceProven:false};
}
