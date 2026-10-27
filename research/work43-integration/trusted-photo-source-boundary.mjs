/**
 * Family Alpha #45: protected-account read-only photo-board handoff contract.
 *
 * Standalone integration boundary, NOT installed into the current app UI.
 * Work #43 owns the actual three-outfit preview, swap and favorite wiring.
 * This intentionally does NOT delegate trust to Work #42's caller-owned
 * {ownerId,trustedSourceSha256,original} arguments. Read the exact canonical
 * stored item from the current account's private IndexedDB transaction, derive
 * the hash of its original source pixels, then hand it to unchanged #42 policy.
 *
 * No writes, cloud access, tokens, user photos, actual account tests, or deploy.
 */
const OWNER=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const ITEM=/^[a-z0-9:_-]{1,160}$/i;
const ACCEPTED_SLOTS=new Set(['top','bottom','dress','layer','layer2','layer3','shoes','accessory']);
const JPG='data:image/jpeg;base64,';
export const MAX_OUTFIT_PHOTOS=8;
const freeze=o=>Object.freeze(o);
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
function decodeSource(s){
 if(typeof s!=='string'||!s.startsWith(JPG)||s.length<=JPG.length+8||
  s.length>14_000_000)throw Error('Original JPEG missing or oversized');
 const encoded=s.slice(JPG.length);
 if(encoded.length%4!==0||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded))
  throw Error('Unsupported original JPEG encoding');
 const binary=atob(encoded),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 if(bytes.length<64||bytes.length>10*1024*1024||
  bytes[0]!==255||bytes[1]!==216||
  bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)
  throw Error('Original JPEG framing or size invalid');
 return bytes;
}
export function createTrustedOutfitPhotoSourceBoundary({
 getDatabase,readContext,verifySession,cryptoProvider=globalThis.crypto
}={}){
 if(typeof getDatabase!=='function'||typeof readContext!=='function'||
  typeof verifySession!=='function'||typeof cryptoProvider?.subtle?.digest!=='function')
  throw Error('Signed-in private wardrobe and digest providers required');
 let generation=0;
 function scope(){
  const c=readContext(),owner=c?.authenticatedUserId,db=getDatabase();
  if(!OWNER.test(owner||'')||c.currentUserId!==owner||c.cloudOwnerId!==owner||
     c.indexedDbName!=='closet-current-user-'+owner||
     !Number.isSafeInteger(c.sessionGeneration)||c.sessionGeneration<0||
     db?.name!=='closet-current-user-'+owner)
   throw Error('Current private signed-in wardrobe required');
  return {owner,epoch:c.sessionGeneration,db,revision:generation};
 }
 function same(a,b){
  return a.owner===b.owner&&a.epoch===b.epoch&&a.db===b.db&&a.revision===b.revision;
 }
 function current(expected){
  const now=scope();
  if(!same(expected,now))throw Error('Account, wardrobe or session changed');
  return now;
 }
 async function certify(s){
  const verified=await verifySession();
  current(s);
  if(verified?.ownerId!==s.owner||verified.sessionGeneration!==s.epoch)
   throw Error('Signed-in session certification changed');
 }
 function readSavedRow(db,itemId){
  return new Promise((resolve,reject)=>{
   let tx,value;
   try{
    tx=db.transaction('items','readonly');
    const request=tx.objectStore('items').get(itemId);
    request.onsuccess=()=>{value=request.result;};
    request.onerror=()=>reject(request.error||Error('Garment lookup failed'));
    tx.oncomplete=()=>resolve(value);
    tx.onabort=()=>reject(tx.error||Error('Private garment lookup interrupted'));
    tx.onerror=()=>reject(tx.error||Error('Private wardrobe unavailable'));
   }catch(e){try{tx?.abort();}catch{}reject(e);}
  });
 }
 function selectors(board){
  const slots=board?.slots;
  if(!slots||typeof slots!=='object'||Array.isArray(slots))throw Error('Trusted outfit selections missing');
  const entries=Object.entries(slots),ids=new Set();
  if(entries.length<1||entries.length>MAX_OUTFIT_PHOTOS)throw Error('Unsupported number of outfit garments');
  for(const [slot,id] of entries){
   if(!ACCEPTED_SLOTS.has(slot)||!ITEM.test(id||'')||ids.has(id))
    throw Error('Invalid or duplicate saved wardrobe selection');
   ids.add(id);
  }
  return entries;
 }
 function source(row){
  // Important: recognitionSourcePhoto() in the original application uses
  // the unmasked source crop for multi-item outfits. NEVER fall back to a
  // generated or mannequin-clipped display PNG when this crop is missing.
  const saved=row?.recognitionPhoto?.image;
  if(typeof saved==='string'&&saved.length)return saved;
  if(row?.outfitSourceId)throw Error('Unmasked original garment crop missing');
  return row?.image;
 }
 function invalidate(){generation++;}
 function getContextFor(snapshot){
  try{
   const s=scope();
   return same(snapshot.internal,s)
    ?{ownerId:s.owner,sessionId:s.owner+':'+s.epoch+':'+s.revision}
    :null;
  }catch{return null;}
 }
 async function resolveBoard(board){
  const start=scope(),entries=selectors(board);
  await certify(start);
  const items=[];
  for(const [slot,itemId]of entries){
   current(start);
   const row=await readSavedRow(start.db,itemId);
   current(start);
   if(row?.id!==itemId||row.saveFailed===true||
     row.recognitionReviewRequired===true||row.scanFailed===true||
     (row.ownerId&&row.ownerId!==start.owner))
    throw Error('Selected saved garment missing, unreviewed or changed');
   const bytes=decodeSource(source(row));
   const sha=hex(await cryptoProvider.subtle.digest('SHA-256',bytes));
   current(start);
   const original=new Blob([bytes],{type:'image/jpeg'});
   const label=typeof row?.name==='string'&&row.name.trim()
    ?row.name.trim().slice(0,80)
    :String(row?.itemType||slot).slice(0,80);
   items.push(freeze({
    id:itemId,slot,ownerId:start.owner,trustedSourceSha256:sha,
    original,label
   }));
  }
  await certify(start);
  current(start);
  // Work #42 can now digest independently. Ref objects are frozen, hashes
  // cannot be made "trusted" by the UI, and the only source is private IDB.
  const identity=freeze({ownerId:start.owner,sessionId:start.owner+':'+start.epoch+':'+start.revision});
  const output=freeze({items:freeze(items),context:identity,internal:freeze(start)});
  return freeze({
   items:output.items,context:identity,
   getContext:()=>getContextFor(output),
   isCurrent:()=>!!getContextFor(output),
   invalidationRequiredOnWardrobeChange:true
  });
 }
 return freeze({resolveBoard,invalidate});
}
