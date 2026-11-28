import {hasOutfitOrganization,outfitBackupVersion,validateOutfitOrganization} from './outfit-organization.mjs';
import {distinctReviewedSharedOriginal157} from './native-reviewed-shared-original-157.mjs';
/**
 * MISSION3-DEFAULT-ATOMIC-IMPORT — DRAFT/HOLD release candidate.
 * Safely import v1-v3 wardrobe backups in ONE private IndexedDB transaction.
 * Protect source JPEGs, human edits and concurrent owner state. No network.
 */
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const safeId=x=>typeof x==='string'&&x.length>0&&x.length<=100&&!/[\u0000-\u001f]/.test(x);
// M98: linear Base64 guard; grouped repetition exhausts call stacks with
// camera-size originals. The preview and full-original limits remain distinct.
const jpegPrefix='data:image/jpeg;base64,';
const base64Chars=/^[A-Za-z0-9+/]*={0,2}$/;
const maxOriginalEncoded=11_200_000,maxOriginalBytes=8*1024*1024;
const sha=/^[0-9a-f]{64}$/;
function inspectTree(x,owner,depth=0,seen=new WeakSet()){
 if(depth>32)throw Error('LEGACY_ATOMIC_METADATA_DEPTH');
 if(x===null||typeof x==='boolean')return;
 if(typeof x==='string'){if(x.length>110_000_000)throw Error('LEGACY_ATOMIC_METADATA_LIMIT');return;}
 if(typeof x==='number'){if(!Number.isFinite(x))throw Error('LEGACY_ATOMIC_NONFINITE');return;}
 if(typeof x!=='object'||seen.has(x))throw Error('LEGACY_ATOMIC_INVALID_METADATA');
 if(Object.keys(x).length>1600)throw Error('LEGACY_ATOMIC_METADATA_LIMIT');
 seen.add(x);
 if(plain(x)&&own(x,'ownerId')&&x.ownerId!==owner)
  throw Error('LEGACY_ATOMIC_FOREIGN_OWNER');
 for(const [key,value] of Object.entries(x)){
  if(['__proto__','prototype','constructor'].includes(key))throw Error('LEGACY_ATOMIC_UNSAFE_KEY');
  inspectTree(value,owner,depth+1,seen);
 }
 seen.delete(x);
}
async function verifyImage(image,hash=null,{original=false}={}){
 // Keep strict preview bound; camera-original SHA receipts permit 8MiB source.
 const maxEncoded=original?maxOriginalEncoded:3_000_000;
 if(typeof image!=='string'||image.length>maxEncoded||
    !image.startsWith(jpegPrefix))throw Error('LEGACY_ATOMIC_INVALID_JPEG');
 const encoded=image.slice(jpegPrefix.length);
 if(encoded.length%4!==0||!base64Chars.test(encoded))
  throw Error('LEGACY_ATOMIC_INVALID_JPEG');
 const padding=encoded.endsWith('==')?2:encoded.endsWith('=')?1:0;
 const decodedLength=encoded.length/4*3-padding;
 if(decodedLength<4||decodedLength>maxOriginalBytes)
  throw Error('LEGACY_ATOMIC_INVALID_JPEG_BYTES');
 let bytes;
 try{bytes=Uint8Array.from(atob(encoded),x=>x.charCodeAt(0));}
 catch{throw Error('LEGACY_ATOMIC_INVALID_JPEG');}
 if(bytes.length!==decodedLength||bytes[0]!==255||bytes[1]!==216)
  throw Error('LEGACY_ATOMIC_INVALID_JPEG_BYTES');
 if(hash){
  if(!sha.test(hash))throw Error('LEGACY_ATOMIC_INVALID_SHA');
  const actual=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))]
   .map(x=>x.toString(16).padStart(2,'0')).join('');
  if(actual!==hash)throw Error('LEGACY_ATOMIC_JPEG_SHA_MISMATCH');
 }
}
function transactSnapshot(ownerDB,assertLease){
 assertLease();
 return new Promise((resolve,reject)=>{
  let tx;try{
   tx=ownerDB.transaction(['items','state'],'readonly');
   const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
   tx.oncomplete=()=>{try{assertLease();resolve({items:a.result,state:b.result});}catch(e){reject(e);}};
   tx.onerror=()=>reject(tx.error||Error('LEGACY_ATOMIC_READ_FAILED'));
   tx.onabort=()=>reject(tx.error||Error('LEGACY_ATOMIC_READ_ABORTED'));
  }catch(error){reject(error);}
 });
}
function assertRawBoard(board,ids){
 if(!plain(board)||!Array.isArray(board.saved)||board.saved.length>50||
    (board.current!==undefined&&!plain(board.current)))
  throw Error('LEGACY_ATOMIC_INVALID_BOARD');
 for(const part of [board.current||{},...board.saved]){
  if(!plain(part)||part.slots!==undefined&&!plain(part.slots))
   throw Error('LEGACY_ATOMIC_INVALID_OUTFIT');
  for(const id of Object.values(part.slots||{})){
   if(typeof id!=='string'||!ids.has(id))throw Error('LEGACY_ATOMIC_MISSING_OUTFIT_PIECE');
  }
 }
}
function verifySlotsUnchanged(raw,cleaned){
 for(const [slot,id] of Object.entries(raw?.slots||{})){
  if(cleaned.slots?.[slot]!==id)throw Error('LEGACY_ATOMIC_OUTFIT_CATEGORY_REVIEW_REQUIRED');
 }
}
export async function prepareDefaultAtomicM3({
 data,ownerDB,ownerId,assertLease,normalizeClothing,validLook,cleanOutfitBoard,assertCompleteWardrobe
}={}){
 if(!ownerDB||ownerDB.name!=='closet-current-user-'+ownerId||
  typeof assertLease!=='function')throw Error('LEGACY_ATOMIC_SIGNED_OWNER_REQUIRED');
 assertLease();
 const input=structuredClone(data);
 inspectTree(input,ownerId);
 if(!plain(input)||input.format!=='closet-current'||![1,2,3,outfitBackupVersion].includes(input.version)||
    !Array.isArray(input.items)||input.items.length>1000||
    (input.looks!==undefined&&(!Array.isArray(input.looks)||input.looks.length>100)))
  throw Error('LEGACY_ATOMIC_INVALID_BACKUP');
 const seen=new Set(),incoming=[],rawOwnerClaims=new Map();
 for(const row of input.items){
  if(!plain(row)||!safeId(row.id)||seen.has(row.id)||
   typeof row.image!=='string'||row.image.length>3_000_000)
   throw Error('LEGACY_ATOMIC_INVALID_GARMENT');
  seen.add(row.id);
  // A legacy missing owner is allowed on a NEW item but must never
  // silently replace an existing signed garment sharing its ID.
  rawOwnerClaims.set(row.id,own(row,'ownerId')?row.ownerId:null);
  await verifyImage(row.image,(!row.originalPhoto?.image||row.originalPhoto.image===row.image)
   ?row.sourceSHA256||row.originalPhoto?.sha256||null:null);
  if(row.originalPhoto?.image){
   // M99: a camera-size original must have a SHA receipt and all claimed
   // canonical-source SHA values must agree before any owner-private write.
   // Preserve compatibility with small unverified v1-v3 photographs.
   const originalSHA=row.originalPhoto.sha256||row.sourceSHA256||null;
   if(row.originalPhoto.sha256&&row.sourceSHA256&&
      row.originalPhoto.sha256!==row.sourceSHA256)
    throw Error('LEGACY_ATOMIC_ORIGINAL_SHA_CLAIM_CONFLICT');
   if((row.originalPhoto.image.length>3_000_000||
       row.sourceHashVerified===true)&&!originalSHA)
    throw Error('LEGACY_ATOMIC_ORIGINAL_SHA_REQUIRED');
   await verifyImage(row.originalPhoto.image,originalSHA,{original:true});
  }else if(row.originalPhoto?.sha256||row.sourceHashVerified===true){
   throw Error('LEGACY_ATOMIC_MISSING_ORIGINAL');
  }
  assertLease();
  incoming.push(normalizeClothing({...row,id:row.id,ownerId,
   image:row.image,name:String(row.name||'Closet piece').slice(0,120),
   color:String(row.color||'').slice(0,120),notes:String(row.notes||'').slice(0,500)}));
 }
 const looks=own(input,'looks')?input.looks.map(validLook):null;
 assertLease();
 const rows=await transactSnapshot(ownerDB,assertLease);
 assertLease();
 assertCompleteWardrobe?.(rows.items,rows.state,ownerId);
 for(const row of rows.items)if(row.ownerId!==undefined&&row.ownerId!==ownerId)
  throw Error('LEGACY_ATOMIC_EXISTING_FOREIGN_OWNER');
 const allItems=new Map(rows.items.map(row=>[row.id,row]));
 // A matching ID is not proof of the same physical garment. Never overwrite
 // an already owned original photograph, even with an explicit bulk-import
 // confirmation, unless the imported photo has the same canonical identity.
 // A v1-v3 import must never bypass the normal owner photo writers'
 // same-original duplicate fence simply by assigning a different garment ID.
 // P88 distinct photographed units still require a separately verified owner
 // instance receipt; legacy imports cannot mint one silently. All checks are
 // read-only preflight, before the single atomic items/state transaction.
 const samePinnedOriginal=(left,right)=>{
  // Exact JPEG identity still requires owner review when a legacy v1/v2
  // source lacks a SHA receipt or sourceHashVerified. Different saved IDs
  // or different crops never prove distinct photographed garments.
  // Base64 accepts several spellings of the same decoded final byte(s)
  // when padding bits are nonzero. No full JPEG decode/copy is required:
  // mask ONLY the unused low pad bits of the last sextet before comparing.
  const canonicalJPEG=image=>{
   const pads=image.endsWith('==')?2:image.endsWith('=')?1:0;
   if(!pads||!image.startsWith('data:image/jpeg;base64,'))return image;
   const idx=image.length-1-pads;
   const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
   const sextet=alphabet.indexOf(image[idx]);
   return sextet<0?image:
    image.slice(0,idx)+alphabet[sextet&(pads===2?48:60)]+image.slice(idx+1);
  };
  const pictures=value=>[value.image,value.originalPhoto?.image]
   .filter(image=>typeof image==='string'&&image.length>0)
   .map(canonicalJPEG);
  const rightPictures=new Set(pictures(right));
  if(pictures(left).some(image=>rightPictures.has(image)))return true;
  if(left.sourceHashVerified!==true&&right.sourceHashVerified!==true)return false;
  const pins=value=>[value.sourceSHA256,value.originalPhoto?.sha256]
   .filter(hash=>typeof hash==='string'&&sha.test(hash));
  const rightPins=new Set(pins(right));
  return pins(left).some(hash=>rightPins.has(hash));
 };
 for(const row of incoming){
  const prior=allItems.get(row.id);
  if(!prior){
   for(const saved of allItems.values()){
    if(samePinnedOriginal(saved,row)&&
       !await distinctReviewedSharedOriginal157(saved,row,ownerId))
     throw Error('LEGACY_ATOMIC_DUPLICATE_ORIGINAL_REQUIRES_OWNER_REVIEW');
    assertLease();
   }
  }
  if(prior){
   // Normalization stamps a new legacy record into the signed DB. For an
   // existing same-ID row, that stamp must NOT turn a missing legacy owner
   // claim into proof that the original saved owner/camera claim survived.
   if((prior.ownerId===ownerId&&rawOwnerClaims.get(row.id)!==ownerId)||
      (prior.originalPhoto?.ownerId===ownerId&&
       row.originalPhoto?.ownerId!==ownerId))
    throw Error('LEGACY_ATOMIC_EXISTING_OWNER_CLAIM_CONFLICT');
   // The same JPEG bytes do not authorize dropping verified-source or
   // independently recorded source-instance review provenance.
   if((prior.sourceHashVerified===true&&row.sourceHashVerified!==true)||
      (prior.sourcePieceKey&&prior.sourcePieceKey!==row.sourcePieceKey)||
       // v3 must not mint new cutout, owner review or PHOTO119 label
       // authority by replacing an already saved same-ID original.
       (prior.cutoutSHA256||null)!==(row.cutoutSHA256||null)||
       JSON.stringify(prior.segmentHint||null)!==
        JSON.stringify(row.segmentHint||null)||
       (prior.singleGarmentVerified??null)!==(row.singleGarmentVerified??null)||
       JSON.stringify(prior.confirmedDetailsSource31||null)!==
        JSON.stringify(row.confirmedDetailsSource31||null)||
       JSON.stringify(prior.confirmedDetails||null)!==
        JSON.stringify(row.confirmedDetails||null)||
       (prior.ownerReviewed??null)!==(row.ownerReviewed??null)||
       (prior.humanReviewedSource??null)!==(row.humanReviewedSource??null)||
       (prior.reviewProvenance||null)!==(row.reviewProvenance||null)||
      (prior.ownerSourceReview88&&
       JSON.stringify(prior.ownerSourceReview88)!==
       JSON.stringify(row.ownerSourceReview88)))
    throw Error('LEGACY_ATOMIC_EXISTING_ORIGINAL_CONFLICT');
   const photoIdentity=value=>JSON.stringify([
    value.image,value.originalPhoto?.image||null,
    value.sourceSHA256||null,value.originalPhoto?.sha256||null
   ]);
   if(photoIdentity(prior)!==photoIdentity(row))
    throw Error('LEGACY_ATOMIC_ORIGINAL_COLLISION_REVIEW_REQUIRED');
  }
  allItems.set(row.id,row);
 }
 if(allItems.size>1000)throw Error('LEGACY_ATOMIC_CLOSET_LIMIT');
 const ids=new Set(allItems.keys());
 const states=new Map(rows.state.map(row=>[row.id,row]));
 const existingLooks=states.get('looks')?.looks||[];
 if(!Array.isArray(existingLooks))throw Error('LEGACY_ATOMIC_EXISTING_LOOKS_INVALID');
 const nextLooks=looks===null?null:[...new Map(
  [...existingLooks,...looks].map(row=>[row.id,row])
 ).values()];
 if(nextLooks&&nextLooks.length>100)throw Error('LEGACY_ATOMIC_INSPIRATION_LIMIT');
 let board=null;
 const organized=input.version===outfitBackupVersion;
 const inputBoard=input.outfitBoard;
 if(organized&&input.ownerId!==ownerId)throw Error('Owner-bound version 5 backup required.');
 if(organized!==hasOutfitOrganization(inputBoard)||
    !organized&&Array.isArray(inputBoard?.saved)&&inputBoard.saved.some(row=>row&&own(row,'savedOutfitId')))
  throw Error('Unsupported outfit organization backup version.');
 if(own(input,'outfitBoard')&&input.outfitBoard!==null&&input.outfitBoard!==undefined){
  assertRawBoard(input.outfitBoard,ids);
  const closet=[...allItems.values()].map(normalizeClothing);
  const cleanCurrent=cleanOutfitBoard(input.outfitBoard.current||{},closet);
  const cleanSaved=input.outfitBoard.saved.map(row=>cleanOutfitBoard(row,closet));
  verifySlotsUnchanged(input.outfitBoard.current||{},cleanCurrent);
  input.outfitBoard.saved.forEach((row,i)=>verifySlotsUnchanged(row,cleanSaved[i]));
  const existing=states.get('outfit-board');
  if(!organized&&hasOutfitOrganization(existing))
   throw Error('Restore a version 5 backup to replace organized outfits.');
  board={id:'outfit-board',current:cleanCurrent,saved:cleanSaved};
  if(organized){
   validateOutfitOrganization(inputBoard,new Set(incoming.map(row=>row.id)),ownerId);
   board={...board,saved:structuredClone(inputBoard.saved),organization:structuredClone(inputBoard.organization)};
   if(existing?.saved?.length){
    const restoredIds=new Set(board.saved.map(row=>row.savedOutfitId));
    if(existing.saved.some(row=>!restoredIds.has(row.savedOutfitId)))
     throw Error('This backup would replace other saved outfits. Keep both backups and restore to an empty wardrobe.');
   }
  }
 }
 // An import without a replacement board must preserve all current/saved
 // outfit slots when a same-ID garment changes metadata. A T-shirt renamed
 // to a shoe or dress cannot silently invalidate a saved top or hide bottoms.
 if(board===null && incoming.length){
  const existingIDs=new Set(rows.items.map(row=>row.id));
  const replaced=new Set(incoming.filter(row=>existingIDs.has(row.id)).map(row=>row.id));
  const savedBoard=states.get('outfit-board');
  if(savedBoard&&replaced.size){
   const beforeCloset=rows.items.map(normalizeClothing);
   const afterCloset=[...allItems.values()].map(normalizeClothing);
   const outfits=[savedBoard.current,
    ...(Array.isArray(savedBoard.saved)?savedBoard.saved:[])];
   for(const outfit of outfits){
    if(!plain(outfit)||!plain(outfit.slots)||
       !Object.values(outfit.slots).some(id=>replaced.has(id)))continue;
    const before=cleanOutfitBoard(outfit,beforeCloset);
    const after=cleanOutfitBoard(outfit,afterCloset);
    for(const [slot,id] of Object.entries(before.slots))
     if(after.slots?.[slot]!==id)
      throw Error('LEGACY_ATOMIC_EXISTING_OUTFIT_CONFLICT');
   }
  }
 }
 const marker=states.get('cloud-sync')||{id:'cloud-sync',baseVersion:0,
  baseDocument:null,localRevision:0,dirty:false};
 if(!Number.isSafeInteger(marker.localRevision)||marker.localRevision<0||
    marker.localRevision>=Number.MAX_SAFE_INTEGER)
  throw Error('LEGACY_ATOMIC_INVALID_CLOUD_REVISION');
 assertLease();
 return Object.freeze({
  ownerId,expectedFingerprint:JSON.stringify(rows),
  incoming:structuredClone(incoming),
  looks:nextLooks===null?null:structuredClone(nextLooks),
  board:board===null?null:structuredClone(board),
  counts:Object.freeze({garments:incoming.length,looks:looks?.length||0,
   savedOutfits:board?.saved.length||0}),
  noDeploy:true,releaseAuthorized:false
 });
}
export async function commitDefaultAtomicM3({
 ownerDB,ownerId,assertLease,prepared,confirmed=false,onStage=null
}={}){
 if(confirmed!==true)throw Error('LEGACY_ATOMIC_OWNER_CONFIRMATION_REQUIRED');
 if(!ownerDB||ownerDB.name!=='closet-current-user-'+ownerId||
    typeof assertLease!=='function'||prepared?.ownerId!==ownerId)
  throw Error('LEGACY_ATOMIC_OWNER_LEASE_INVALID');
 assertLease();
 const plan=structuredClone(prepared);
 return new Promise((resolve,reject)=>{
  let tx,done=false;
  const fail=error=>{if(done)return;done=true;try{tx?.abort();}catch{}reject(error);};
  try{
   assertLease();
   tx=ownerDB.transaction(['items','state'],'readwrite');
   const itemStore=tx.objectStore('items'),stateStore=tx.objectStore('state');
   const a=itemStore.getAll(),b=stateStore.getAll();
   let items,states;
   const stage=()=>{
    if(!items||!states||done)return;
    try{
     assertLease();
     if(JSON.stringify({items,state:states})!==plan.expectedFingerprint)
      throw Error('LEGACY_ATOMIC_CONFLICT_REVIEW_AND_RETRY');
     const marker=states.find(row=>row.id==='cloud-sync')||
      {id:'cloud-sync',baseVersion:0,baseDocument:null,localRevision:0,dirty:false};
     if(!Number.isSafeInteger(marker.localRevision)||marker.localRevision<0||
        marker.localRevision>=Number.MAX_SAFE_INTEGER)
      throw Error('LEGACY_ATOMIC_CLOUD_REVISION_INVALID');
     for(const row of plan.incoming)itemStore.put(row);
     if(plan.looks!==null)stateStore.put({id:'looks',looks:plan.looks});
     if(plan.board!==null)stateStore.put(plan.board);
     stateStore.put({...marker,localRevision:marker.localRevision+1,dirty:true});
     if(onStage)onStage();
     assertLease();
    }catch(error){fail(error);}
   };
   a.onsuccess=()=>{items=a.result;stage();};
   b.onsuccess=()=>{states=b.result;stage();};
   a.onerror=()=>fail(a.error||Error('LEGACY_ATOMIC_ITEMS_READ_FAILED'));
   b.onerror=()=>fail(b.error||Error('LEGACY_ATOMIC_STATE_READ_FAILED'));
   tx.oncomplete=()=>{
    if(done)return;done=true;
    try{assertLease();resolve({committed:true,atomic:true,cloudDirty:true,
     counts:plan.counts,releaseAuthorized:false});}
    catch{reject(Error('LEGACY_ATOMIC_SESSION_REVOKED_AFTER_COMMIT_RELOAD'));}
   };
   tx.onerror=()=>fail(tx.error||Error('LEGACY_ATOMIC_TRANSACTION_FAILED'));
   tx.onabort=()=>fail(tx.error||Error('LEGACY_ATOMIC_TRANSACTION_ROLLED_BACK'));
  }catch(error){fail(error);}
 });
}
