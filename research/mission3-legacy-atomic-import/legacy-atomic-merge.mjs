/**
 * MISSION3-LEGACY-ATOMIC-IMPORT — research-only, no deployments.
 * Convert legacy v1–v3 merge semantics into ONE owner-private IndexedDB commit.
 * Clothes, inspiration and saved outfits change together, or not at all.
 * No network, hosted Supabase mutation or private owner data access.
 */
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const safeId=x=>typeof x==='string'&&x.length>0&&x.length<=100&&!/[\u0000-\u001f]/.test(x);
const img=/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
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
async function verifyImage(image,hash=null){
 if(typeof image!=='string'||image.length>3_000_000||!img.test(image))
  throw Error('LEGACY_ATOMIC_INVALID_JPEG');
 const bytes=Uint8Array.from(atob(image.slice('data:image/jpeg;base64,'.length)),x=>x.charCodeAt(0));
 if(bytes.length<4||bytes[0]!==255||bytes[1]!==216)
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
  await verifyImage(row.image,(!row.originalPhoto?.image||row.originalPhoto.image===row.image)
   ?row.sourceSHA256||row.originalPhoto?.sha256||null:null);
  if(row.originalPhoto?.image){
   await verifyImage(row.originalPhoto.image,row.originalPhoto.sha256||row.sourceSHA256||null);
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
