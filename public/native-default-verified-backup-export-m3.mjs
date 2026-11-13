/**
 * Mission 3 — unflagged v3 backup export from ONE signed-owner durable
 * IndexedDB snapshot. Saved pieces, looks and outfits only.
 *
 * The v3 schema cannot recover unfinished photo results. Block export rather
 * than suggest the owner's complete closet is backed up while draft JPEGs
 * are omitted. The opt-in, verified v4 lossless research path is unchanged.
 * Never access hosted/cloud data, change the database, or deploy.
 */
const imagePattern=/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
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
async function checkedJPEG(image,claimedHash=null){
 if(typeof image!=='string'||image.length>3_000_000||
    !imagePattern.test(image))fail('INVALID_JPEG');
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
 ownerDB,ownerId,assertLease,assertIdle=()=>{}
}={}){
 if(!ownerDB||typeof ownerId!=='string'||!ownerId||
    ownerDB.name!=='closet-current-user-'+ownerId||
    typeof assertLease!=='function'||typeof assertIdle!=='function')
  fail('SIGNED_OWNER_REQUIRED');
 const check=()=>{assertLease();assertIdle();};
 check();
 const snap=await durableRead(ownerDB,check);
 check();
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
  if(row.originalPhoto?.image)
   await checkedJPEG(row.originalPhoto.image,
    row.originalPhoto.sha256||row.sourceSHA256||null);
  else if(row.originalPhoto?.sha256||
          row.sourceSHA256&&row.sourceHashVerified===true)
   fail('MISSING_VERIFIED_ORIGINAL');
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
 }
 if(!items.length&&!looks.length&&!(outfitBoard?.saved?.length))
  fail('EMPTY_CLOSET');
 const data={format:'closet-current',version:3,items,looks};
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
