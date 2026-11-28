import {hasOutfitOrganization,outfitBackupVersion,validateOutfitOrganization} from './outfit-organization.mjs';
import {distinctReviewedSharedOriginal157} from './native-reviewed-shared-original-157.mjs';
/**
 * Mission 3 — unflagged v3 backup export from ONE signed-owner durable
 * IndexedDB snapshot. Saved pieces, looks and outfits only.
 *
 * The v3 schema cannot recover unfinished photo results. Block export rather
 * than suggest the owner's complete closet is backed up while draft JPEGs
 * are omitted. The opt-in, verified v4 lossless research path is unchanged.
 * Never access hosted/cloud data, change the database, or deploy.
 */
// M101 source-only original JPEG validation must mirror the native importer
// without weakening preview bounds or the signed owner / snapshot checks.
const imagePattern=/^data:image\/jpeg;base64,[A-Za-z0-9+/]*={0,2}$/;
const shaPattern=/^[0-9a-f]{64}$/;
const mime='data:image/jpeg;base64,';
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const fail=(code)=>{throw Error('M3_EXPORT_'+code);};
function inspectOwner(value,owner,depth=0,seen=new WeakSet()){
 if(depth>32)fail('METADATA_DEPTH');
 if(value===null||typeof value==='boolean')return;
 if(typeof value==='string'){if(value.length>110_000_000)fail('METADATA_LIMIT');return;}
 if(typeof value==='number'){if(!Number.isFinite(value))fail('METADATA_NONFINITE');return;}
 if(typeof value!=='object'||seen.has(value))fail('METADATA_INVALID');
 if(Object.keys(value).length>1600)fail('METADATA_LIMIT');
 seen.add(value);
 if(!Array.isArray(value)&&own(value,'ownerId')&&value.ownerId!==owner)
  fail('FOREIGN_OWNER');
 for(const [key,child] of Object.entries(value)){
  if(['__proto__','constructor','prototype'].includes(key))fail('UNSAFE_KEY');
  inspectOwner(child,owner,depth+1,seen);
 }
 seen.delete(value);
}
// Mirror the importer's pad-bit canonicalization: two legal Base64
// spellings may decode to the same JPEG and must never appear distinct.
function canonicalJPEG(image){
 const pads=image.endsWith('==')?2:image.endsWith('=')?1:0;
 if(!pads||!image.startsWith(mime))return image;
 const idx=image.length-1-pads;
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
 const sextet=alphabet.indexOf(image[idx]);
 return sextet<0?image:
  image.slice(0,idx)+alphabet[sextet&(pads===2?48:60)]+image.slice(idx+1);
}
async function checkedJPEG(image,claimedHash=null,{maxEncoded=3_000_000,maxBytes=2_250_000}={}){
 if(typeof image!=='string'||image.length>maxEncoded||
    !imagePattern.test(image)||(image.length-mime.length)%4!==0)
  fail('INVALID_JPEG');
 const encoded=image.slice(mime.length);
 const padding=encoded.endsWith('==')?2:encoded.endsWith('=')?1:0;
 const predicted=encoded.length/4*3-padding;
 if(predicted<4||predicted>maxBytes)fail('INVALID_JPEG_BYTES');
 let bytes;
 try{bytes=Uint8Array.from(atob(image.slice(mime.length)),v=>v.charCodeAt(0));}
 catch{fail('INVALID_JPEG');}
 if(bytes.length<4||bytes[0]!==0xff||bytes[1]!==0xd8)
  fail('INVALID_JPEG_BYTES');
 if(claimedHash){
  if(!shaPattern.test(claimedHash))fail('INVALID_SHA');
  const verified=Array.from(new Uint8Array(
   await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
  if(verified!==claimedHash)fail('PHOTO_SHA_MISMATCH');
 }
}
async function durableRead(ownerDB,assertLease){
 assertLease();
 return new Promise((resolve,reject)=>{
  try{
   const tx=ownerDB.transaction(['items','state'],'readonly');
   const items=tx.objectStore('items').getAll();
   const state=tx.objectStore('state').getAll();
   tx.oncomplete=()=>{
    try{assertLease();resolve({items:items.result,state:state.result});}
    catch(error){reject(error);}
   };
   tx.onerror=()=>reject(tx.error||Error('M3_EXPORT_READ_FAILED'));
   tx.onabort=()=>reject(tx.error||Error('M3_EXPORT_READ_ABORTED'));
  }catch(error){reject(error);}
 });
}
export async function exportDurableOwnerBackupM3({
 ownerDB,ownerId,assertLease,assertIdle=()=>{},assertCompleteWardrobe
}={}){
 if(!ownerDB||typeof ownerId!=='string'||!ownerId||
    ownerDB.name!=='closet-current-user-'+ownerId||
    typeof assertLease!=='function'||typeof assertIdle!=='function')
  fail('SIGNED_OWNER_REQUIRED');
 const check=()=>{assertLease();assertIdle();};
 check();
 const snap=await durableRead(ownerDB,check);
 check();
 assertCompleteWardrobe?.(snap.items,snap.state,ownerId);
 if(!Array.isArray(snap.items)||!Array.isArray(snap.state))fail('INVALID_STATE');
 const state=new Map();
 for(const row of snap.state){
  if(!row||typeof row.id!=='string'||state.has(row.id))
   fail('INVALID_STATE');
  state.set(row.id,row);
 }
 // v3 has no draft/state import. A saved-only download while any original
 // remains in Photo results would silently exclude it permanently.
 const review=state.get('draft');
 if(review&&( !Array.isArray(review.batch)||review.batch.length ))
  fail('UNFINISHED_PHOTOS_NOT_IN_V3');
 const items=[];
 const ids=new Set();
 // Maintain O(1) expected canonical photo/source lookup even with large
 // wardrobes. Rehash cutout only for exact image/source collisions.
 const priorByPicture=new Map(),priorByReceipt=new Map();
 if(snap.items.length>1000)fail('TOO_MANY_GARMENTS');
 for(const row of snap.items){
  if(!row||typeof row.id!=='string'||!row.id||row.id.length>100||
     ids.has(row.id))fail('INVALID_GARMENT');
  ids.add(row.id);
  inspectOwner(row,ownerId);
  await checkedJPEG(row.image,
   !row.originalPhoto?.image||row.originalPhoto.image===row.image
    ?row.sourceSHA256||row.originalPhoto?.sha256||null
    :null);
  if(row.originalPhoto?.image){
   const receipt=row.originalPhoto.sha256||row.sourceSHA256||null;
   if(row.originalPhoto.sha256&&row.sourceSHA256&&
      row.originalPhoto.sha256!==row.sourceSHA256)
    fail('SOURCE_SHA_CLAIM_CONFLICT');
   if((row.originalPhoto.image.length>3_000_000||
       row.sourceHashVerified===true)&&!receipt)
    fail('SOURCE_SHA_REQUIRED');
   await checkedJPEG(row.originalPhoto.image,receipt,
    {maxEncoded:11_200_000,maxBytes:8*1024*1024});
  }else if(row.originalPhoto?.sha256||row.sourceHashVerified===true)
   fail('MISSING_VERIFIED_ORIGINAL');
  const pictures=new Set([row.image,row.originalPhoto?.image]
   .filter(image=>typeof image==='string'&&image.length)
   .map(canonicalJPEG));
  const canonicalReceipt=row.originalPhoto?.sha256||row.sourceSHA256||null;
  const conflicts=new Set();
  for(const image of pictures)
   for(const previous of priorByPicture.get(image)||[])conflicts.add(previous);
  if(canonicalReceipt)
   for(const previous of priorByReceipt.get(canonicalReceipt)||[])
    conflicts.add(previous);
  for(const previous of conflicts){
   if(!await distinctReviewedSharedOriginal157(previous,row,ownerId))
    fail('SHARED_ORIGINAL_RESTORE_UNSUPPORTED');
   check();
  }
  for(const image of pictures){
   const rows=priorByPicture.get(image)||[];
   rows.push(row);priorByPicture.set(image,rows);
  }
  if(canonicalReceipt){
   const rows=priorByReceipt.get(canonicalReceipt)||[];
   rows.push(row);priorByReceipt.set(canonicalReceipt,rows);
  }
  check();
  // Older v1-v3 rows legitimately lacked an owner ID; stamp only the
  // exported copy. Never modify real on-device originals to do this.
  items.push({...structuredClone(row),ownerId});
 }
 const rawLooks=state.get('looks')?.looks||[];
 if(!Array.isArray(rawLooks)||rawLooks.length>100)fail('INVALID_LOOKS');
 const looks=structuredClone(rawLooks);
 inspectOwner(looks,ownerId);
 const storedBoard=state.get('outfit-board');
 let outfitBoard;
 const organized=hasOutfitOrganization(storedBoard);
 if(storedBoard){
  inspectOwner(storedBoard,ownerId);
  if(!Array.isArray(storedBoard.saved)||storedBoard.saved.length>50||
     !storedBoard.current||typeof storedBoard.current!=='object')
   fail('INVALID_BOARD');
  for(const board of [storedBoard.current,...storedBoard.saved]){
   if(!board||typeof board!=='object'||Array.isArray(board)||
      !board.slots||typeof board.slots!=='object'||Array.isArray(board.slots))
    fail('INVALID_BOARD');
   for(const id of Object.values(board.slots)){
    if(typeof id!=='string'||!ids.has(id))fail('MISSING_OUTFIT_PIECE');
   }
  }
  outfitBoard={current:structuredClone(storedBoard.current),
   saved:structuredClone(storedBoard.saved)};
  if(organized)outfitBoard.organization=structuredClone(validateOutfitOrganization(storedBoard,ids,ownerId));
 }
 if(!items.length&&!looks.length&&!(outfitBoard?.saved?.length)&&!organized)
  fail('EMPTY_CLOSET');
 const data={format:'closet-current',version:organized?outfitBackupVersion:3,items,looks};
 if(organized)data.ownerId=ownerId;
 if(outfitBoard)data.outfitBoard=outfitBoard;
 check();
 const json=JSON.stringify(data);
 // The default v1-v3 importer rejects files above this limit.
 if(new TextEncoder().encode(json).byteLength>100*1024*1024)
  fail('EXCEEDS_IMPORT_LIMIT');
 check();
 return Object.freeze({data,json,counts:Object.freeze({
  garments:items.length,looks:looks.length,
  savedOutfits:outfitBoard?.saved?.length||0
 }),ownerId,durableSnapshot:true,pendingDraftsOmitted:0,
  losslessPendingDraftExport:false,releaseAuthorized:false});
}
