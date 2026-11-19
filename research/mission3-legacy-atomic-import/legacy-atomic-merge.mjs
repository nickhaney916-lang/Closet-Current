/**
 * MISSION3-LEGACY-ATOMIC-IMPORT — research-only, no deployments.
 * Convert legacy v1–v3 merge semantics into ONE owner-private IndexedDB commit.
 * Clothes, inspiration and saved outfits change together, or not at all.
 * No network, hosted Supabase mutation or private owner data access.
 */
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const safeId=x=>typeof x==='string'&&x.length>0&&x.length<=100&&!/[\u0000-\u001f]/.test(x);
const jpegPrefix='data:image/jpeg;base64,';
// Linear-time alphabet check: a repeated {4} group can overflow V8's regexp
// stack on genuine multi-megabyte camera originals.
const base64Chars=/^[A-Za-z0-9+/]+={0,2}$/;
const sha=/^[0-9a-f]{64}$/;
function inspectTree(x,owner,depth=0,seen=new WeakSet()){
 if(depth>32)throw Error('LEGACY_ATOMIC_METADATA_DEPTH');
 if(x===null||typeof x==='boolean')return;
 if(typeof x==='string'){if(x.length>110_000_000)throw Error('LEGACY_ATOMIC_METADATA_LIMIT');return;}
 if(typeof x==='number'){if(!Number.isFinite(x))throw Error('LEGACY_ATOMIC_NONFINITE');return;}
 if(typeof x!=='object'||seen.has(x))throw Error('LEGACY_ATOMIC_INVALID_METADATA');
 if(Object.keys(x).length>1600)throw Error('LEGACY_ATOMIC_METADATA_LIMIT');
 seen.add(x);
 // Null is an unclaimed legacy owner tag, not an asserted second account.
 // Match the default import's raw JSON ownership gate exactly.
 if(plain(x)&&own(x,'ownerId')&&x.ownerId!==null&&x.ownerId!==owner)
  throw Error('LEGACY_ATOMIC_FOREIGN_OWNER');
 for(const [key,value] of Object.entries(x)){
  if(['__proto__','prototype','constructor'].includes(key))throw Error('LEGACY_ATOMIC_UNSAFE_KEY');
  inspectTree(value,owner,depth+1,seen);
 }
 seen.delete(x);
}
async function verifyImage(image,hash=null,{maxEncoded=3_000_000,maxBytes=2_250_000}={}){
 if(typeof image!=='string'||image.length>maxEncoded||!image.startsWith(jpegPrefix))
  throw Error('LEGACY_ATOMIC_INVALID_JPEG');
 const payload=image.slice(jpegPrefix.length);
 // Decode only canonical, padded Base64 and preflight decoded size before
 // allocating the original; keep the preview and camera-original limits.
 if(payload.length%4!==0||!base64Chars.test(payload))
  throw Error('LEGACY_ATOMIC_INVALID_JPEG');
 const padding=payload.endsWith('==')?2:payload.endsWith('=')?1:0;
 if(payload.length/4*3-padding>maxBytes)
  throw Error('LEGACY_ATOMIC_INVALID_JPEG_BYTES');
 let bytes;
 try{bytes=Uint8Array.from(atob(payload),x=>x.charCodeAt(0));}
 catch{throw Error('LEGACY_ATOMIC_INVALID_JPEG');}
 if(bytes.length<4||bytes.length>maxBytes||bytes[0]!==255||bytes[1]!==216)
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
export async function prepareLegacyAtomicM3({
 data,ownerDB,ownerId,assertLease,normalizeClothing,validLook,cleanOutfitBoard
}={}){
 if(!ownerDB||ownerDB.name!=='closet-current-user-'+ownerId||
  typeof assertLease!=='function')throw Error('LEGACY_ATOMIC_SIGNED_OWNER_REQUIRED');
 assertLease();
 const input=structuredClone(data);
 inspectTree(input,ownerId);
 if(!plain(input)||input.format!=='closet-current'||![1,2,3].includes(input.version)||
    !Array.isArray(input.items)||input.items.length>1000||
    (input.looks!==undefined&&(!Array.isArray(input.looks)||input.looks.length>100)))
  throw Error('LEGACY_ATOMIC_INVALID_BACKUP');
 const seen=new Set(),incoming=[];
 for(const row of input.items){
  if(!plain(row)||!safeId(row.id)||seen.has(row.id)||
   typeof row.image!=='string'||row.image.length>3_000_000)
   throw Error('LEGACY_ATOMIC_INVALID_GARMENT');
  seen.add(row.id);
  // Treat a verified provenance flag and both available SHA-256 receipts as
  // one coherent claim. The atomic module is independently callable: it must
  // not preserve contradictory provenance if a caller bypasses UI preflight.
  const sourceHash=row.sourceSHA256,originalHash=row.originalPhoto?.sha256;
  if((sourceHash!==undefined&&!sha.test(sourceHash))||
     (originalHash!==undefined&&!sha.test(originalHash))||
     (row.sourceHashVerified===true&&!sourceHash)||
     (sourceHash&&originalHash&&sourceHash!==originalHash))
   throw Error('LEGACY_ATOMIC_ORIGINAL_RECEIPT_CONFLICT');
  await verifyImage(row.image,(!row.originalPhoto?.image||row.originalPhoto.image===row.image)
   ?row.sourceSHA256||row.originalPhoto?.sha256||null:null);
  if(row.originalPhoto?.image){
   // The preview is capped at 3 MB encoded. Preserved camera originals
   // are a separate lossless asset: match default legacy preflight's 8 MiB
   // decoded/11.2 MB encoded bound instead of rejecting genuine source JPEGs.
   await verifyImage(row.originalPhoto.image,row.originalPhoto.sha256||row.sourceSHA256||null,
    {maxEncoded:11_200_000,maxBytes:8*1024*1024});
  }else if(row.originalPhoto?.sha256||row.sourceSHA256&&row.sourceHashVerified===true){
   throw Error('LEGACY_ATOMIC_MISSING_ORIGINAL');
  }
  assertLease();
  incoming.push(normalizeClothing({...row,id:row.id,
   image:row.image,name:String(row.name||'Closet piece').slice(0,120),
   color:String(row.color||'').slice(0,120),notes:String(row.notes||'').slice(0,500)}));
 }
 const looks=own(input,'looks')?input.looks.map(validLook):null;
 assertLease();
 const rows=await transactSnapshot(ownerDB,assertLease);
 assertLease();
 for(const row of rows.items)if(row.ownerId!==undefined&&row.ownerId!==ownerId)
  throw Error('LEGACY_ATOMIC_EXISTING_FOREIGN_OWNER');
 const allItems=new Map(rows.items.map(row=>[row.id,row]));
 // Legacy imports are merges, not permission to replace an owner's
 // independently saved camera original or provenance receipt. An incoming
 // row may update color/metadata or add a genuinely new ID, but collisions
 // with an existing source-pinned garment must retain its exact bytes and
 // source identity. Refuse before creating any write transaction.
 for(const row of incoming){
  const saved=allItems.get(row.id);
  if(!saved)continue;
  // A legacy backup with null/missing owner tags may be admitted as a *new*
  // unclaimed garment. It must not erase an existing item's independently
  // saved owner claim, or the camera original's owner claim, under the same ID.
  // Those claims survive only if the incoming row explicitly preserves them.
  if((saved.ownerId===ownerId&&row.ownerId!==ownerId)||
     (saved.originalPhoto?.ownerId===ownerId&&
       row.originalPhoto?.ownerId!==ownerId))
   throw Error('LEGACY_ATOMIC_EXISTING_OWNER_CLAIM_CONFLICT');
  // Older saved pieces may have only a preview JPEG, with no original-photo
  // receipt. That image is then the sole available source identity. Never
  // silently replace its pixels under the same saved ID during a merge;
  // require separate owner review rather than rewriting an existing outfit.
  if((!saved.originalPhoto?.image&&saved.image!==row.image)||
     (saved.originalPhoto?.image&&
       saved.originalPhoto.image!==row.originalPhoto?.image)||
     (saved.originalPhoto?.sha256&&
       saved.originalPhoto.sha256!==row.originalPhoto?.sha256)||
     (saved.sourceSHA256&&saved.sourceSHA256!==row.sourceSHA256)||
     (saved.sourceHashVerified===true&&row.sourceHashVerified!==true)||
     (saved.sourcePieceKey&&saved.sourcePieceKey!==row.sourcePieceKey)||
     (saved.ownerSourceReview88&&
       JSON.stringify(saved.ownerSourceReview88)!==
       JSON.stringify(row.ownerSourceReview88)))
    throw Error('LEGACY_ATOMIC_EXISTING_ORIGINAL_CONFLICT');
 }
 for(const row of incoming)allItems.set(row.id,row);
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
 if(own(input,'outfitBoard')&&input.outfitBoard!==null&&input.outfitBoard!==undefined){
  assertRawBoard(input.outfitBoard,ids);
  const closet=[...allItems.values()].map(normalizeClothing);
  const cleanCurrent=cleanOutfitBoard(input.outfitBoard.current||{},closet);
  const cleanSaved=input.outfitBoard.saved.map(row=>cleanOutfitBoard(row,closet));
  verifySlotsUnchanged(input.outfitBoard.current||{},cleanCurrent);
  input.outfitBoard.saved.forEach((row,i)=>verifySlotsUnchanged(row,cleanSaved[i]));
  board={id:'outfit-board',current:cleanCurrent,saved:cleanSaved};
 }
 // A backup with no outfit board must never silently corrupt already saved
 // outfits when an incoming item replaces a referenced garment's ID. A category
 // change can invalidate a slot; changing a shirt into a dress can also hide
 // previously valid bottoms. Do not rewrite the owner's saved selections.
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
export async function commitLegacyAtomicM3({
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
