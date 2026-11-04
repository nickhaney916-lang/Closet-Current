/**
 * RESTORE-ATOMIC-01 — isolated opt-in, owner-bound whole-closet recovery.
 * No network I/O, no production migration and no normalization of originals.
 * All existing items and the draft/looks/outfit-board states are replaced in
 * ONE IndexedDB readwrite transaction, or none of them are changed.
 */
import {validateBoard02} from '../board-lossless-02/lossless-board.mjs';

export const RESTORE01=Object.freeze({
 gate:'restoreAtomic01=research&nativeLossless04=research',
 format:4,atomicStores:['items','state'],productionAuthorized:false,
 signedSupabaseRLSVerified:false,physicalDevicesVerified:false,familyAlpha:'HOLD'
});
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const goodId=x=>typeof x==='string'&&x.length>0&&x.length<=160&&!/[\u0000-\u001f]/.test(x);
const sha=/^[0-9a-f]{64}$/;
const safeKey=k=>!['__proto__','prototype','constructor'].includes(k);
const allowedStates=new Set(['draft','looks','outfit-board']);
const clone=x=>structuredClone(x);
function walk(x,depth=0,seen=new WeakSet()){
 if(depth>36)throw Error('RESTORE01 metadata nesting limit');
 if(x===null||typeof x==='boolean')return;
 if(typeof x==='string'){if(x.length>110_000_000)throw Error('RESTORE01 oversized string');return;}
 if(typeof x==='number'){if(!Number.isFinite(x))throw Error('RESTORE01 nonfinite number');return;}
 if(typeof x!=='object'||seen.has(x))throw Error('RESTORE01 invalid metadata');
 if(Object.keys(x).length>1600)throw Error('RESTORE01 oversized metadata');
 seen.add(x);
 for(const [k,v] of Object.entries(x)){
  if(!safeKey(k))throw Error('RESTORE01 unsafe metadata key');
  walk(v,depth+1,seen);
 }
 seen.delete(x);
}
function ownerInTree(x,owner,depth=0){
 if(!x||typeof x!=='object'||depth>36)return;
 if(own(x,'ownerId')&&x.ownerId!==owner)throw Error('RESTORE01 foreign owner data');
 for(const v of Object.values(x))ownerInTree(v,owner,depth+1);
}
function hex(bytes){return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function photoProof(data,{hash=null}={}){
 if(typeof data!=='string'||!/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data))
  throw Error('RESTORE01 invalid JPEG source');
 const raw=atob(data.slice(23)),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 if(bytes.length<4||bytes.length>8_388_608||bytes[0]!==255||bytes[1]!==216)
  throw Error('RESTORE01 invalid original JPEG bytes');
 if(hash){
  if(!sha.test(hash))throw Error('RESTORE01 invalid original source SHA');
  const digest=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)));
  if(digest!==hash)throw Error('RESTORE01 original JPEG SHA mismatch');
 }
 return true;
}
async function inspectImages(x,visited=new WeakSet()){
 if(!x||typeof x!=='object'||visited.has(x))return 0;
 visited.add(x);let count=0;
 if(!Array.isArray(x)&&typeof x.image==='string'&&x.image){
  if(x.image.startsWith('closet-photo:'))throw Error('RESTORE01 unresolved remote photo');
  await photoProof(x.image,{hash:x.sha256||
   (x.originalPhoto?.image===x.image?
    (x.originalPhoto?.sha256||x.sourceSHA256||null):
    (!x.originalPhoto?.image?x.sourceSHA256||null:null))});
  count++;
 }
 for(const [key,value] of Object.entries(x)){
  if(key==='image')continue;
  count+=await inspectImages(value,visited);
 }
 return count;
}
function validateShape(value,{ownerId,mode='file'}={}){
 walk(value);
 if(!goodId(ownerId))throw Error('RESTORE01 active owner required');
 if(!object(value))throw Error('RESTORE01 backup must be an object');
 if(mode==='file'&&(value.format!=='closet-current'||value.version!==4||
     value.ownerId!==ownerId||!object(value.state)))
  throw Error('RESTORE01 owner-bound v4 backup required; unowned legacy backups need a reviewed migration');
 if(mode==='cloud'&&(value.schemaVersion!==1||!object(value.state)))
  throw Error('RESTORE01 malformed cloud document');
 if(!Array.isArray(value.items)||value.items.length>1000||
    Object.keys(value.state).some(k=>!allowedStates.has(k)))
  throw Error('RESTORE01 invalid wardrobe or backup state');
 if(value.ownerId!==undefined&&value.ownerId!==ownerId)
  throw Error('RESTORE01 foreign owner document');
 ownerInTree(value,ownerId);
 const seen=new Set();
 for(const item of value.items){
  if(!object(item)||!goodId(item.id)||seen.has(item.id))
   throw Error('RESTORE01 invalid or duplicate garment ID');
  seen.add(item.id);
  if(item.sourceSHA256!==undefined&&!sha.test(item.sourceSHA256))
   throw Error('RESTORE01 invalid garment source identity');
  if(item.originalPhoto?.sha256!==undefined&&!sha.test(item.originalPhoto.sha256))
   throw Error('RESTORE01 invalid original-photo identity');
  if(item.originalPhoto?.sha256&&!item.originalPhoto.image)
   throw Error('RESTORE01 missing pinned original JPEG');
  if(item.sourceSHA256&&!item.originalPhoto?.image&&!item.image)
   throw Error('RESTORE01 missing original image for pinned source');
 }
 for(const [id,row] of Object.entries(value.state)){
  if(!object(row)||row.id!==id)throw Error('RESTORE01 inconsistent state row identity');
  if(id==='draft'&&(!Array.isArray(row.batch)||row.batch.length>60))
   throw Error('RESTORE01 invalid draft');
  if(id==='looks'&&(!Array.isArray(row.looks)||row.looks.length>100))
   throw Error('RESTORE01 invalid inspiration looks');
  if(id==='outfit-board')validateBoard02(row,{ownerId});
 }
 return value;
}
export async function validateRestore01(value,{ownerId,mode='file'}={}){
 validateShape(value,{ownerId,mode});
 const count=await inspectImages(value);
 // Metadata retained unchanged, including temporarily missing outfit IDs.
 return Object.freeze({valid:true,photoFieldsVerified:count,
  itemCount:value.items.length,savedCount:value.state['outfit-board']?.saved.length||0,
  originalRecordsUnmodified:true,missingOutfitReferencesAllowed:true});
}
function itemsState(rows){
 return {items:rows.items,state:Object.fromEntries(rows.state.filter(x=>allowedStates.has(x.id)).map(x=>[x.id,x]))};
}
function readTxn(db,stores,mode,work){
 return new Promise((resolve,reject)=>{
  let tx;try{tx=db.transaction(stores,mode);work(tx,resolve,reject);}catch(e){reject(e);return;}
  tx.onerror=()=>reject(tx.error||Error('RESTORE01 IndexedDB failure'));
  tx.onabort=()=>reject(tx.error||Error('RESTORE01 transaction rolled back'));
 });
}
export async function readOwnerSnapshot01(db,assertLease){
 assertLease();
 const rows=await readTxn(db,['items','state'],'readonly',(tx,resolve)=>{
  const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
  tx.oncomplete=()=>resolve({items:a.result,state:b.result});
 });
 assertLease();
 return {rows,restore:itemsState(rows),fingerprint:JSON.stringify(rows)};
}
export function exportBackup01({ownerId,rows}){
 if(!goodId(ownerId)||!rows||!Array.isArray(rows.items)||!Array.isArray(rows.state))
  throw Error('RESTORE01 invalid export snapshot');
 const state=itemsState(rows).state;
 const value={format:'closet-current',version:4,ownerId,items:clone(rows.items),state:clone(state)};
 validateShape(value,{ownerId});
 return value;
}
export async function restoreOwner01({db,assertLease,backup,ownerId,expectedFingerprint,
 confirmed=false,onStage=null}={}){
 if(!confirmed)throw Error('RESTORE01 explicit replacement authorization required');
 if(!db||typeof db.transaction!=='function'||typeof assertLease!=='function'||
    typeof expectedFingerprint!=='string')
  throw Error('RESTORE01 owner database and compare-and-swap snapshot required');
 assertLease();await validateRestore01(backup,{ownerId});
 assertLease();
 const target=clone(backup),wanted=target.state;
 return new Promise((resolve,reject)=>{
  let tx,complete=false;
  const fail=e=>{if(complete)return;complete=true;try{tx?.abort();}catch{}reject(e);};
  try{
   tx=db.transaction(['items','state'],'readwrite');
   const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
   let ar,br;
   const stage=()=>{
    if(!ar||!br||complete)return;
    try{
     assertLease();
     if(JSON.stringify({items:ar,state:br})!==expectedFingerprint)
      throw Error('RESTORE01 CONFLICT: wardrobe, saved outfits or cloud revision changed');
     const marker=br.find(x=>x.id==='cloud-sync');
     if(marker?.localRevision!==undefined&&(!Number.isSafeInteger(marker.localRevision)||
       marker.localRevision<0||marker.localRevision>=Number.MAX_SAFE_INTEGER))
      throw Error('RESTORE01 invalid cloud revision counter');
     const items=tx.objectStore('items'),state=tx.objectStore('state');
     items.clear();
     for(const item of target.items)items.put(item);
     for(const id of allowedStates){
      if(own(wanted,id))state.put(wanted[id]);else state.delete(id);
     }
     // Backup is a pending local write; never acknowledge a stale remote base.
     state.put({...clone(marker||{id:'cloud-sync',baseVersion:0,baseDocument:null,
      localRevision:0}),id:'cloud-sync',dirty:true,
      localRevision:(marker?.localRevision||0)+1});
     if(onStage)onStage(); // fault injection: throwing aborts the entire transaction
     assertLease();
    }catch(e){fail(e);}
   };
   a.onsuccess=()=>{ar=a.result;stage();};
   b.onsuccess=()=>{br=b.result;stage();};
   a.onerror=()=>fail(a.error||Error('RESTORE01 items read error'));
   b.onerror=()=>fail(b.error||Error('RESTORE01 state read error'));
   tx.oncomplete=()=>{
    if(complete)return;complete=true;
    try{assertLease();resolve({restored:true,atomic:true,cloudDirty:true,
     photoFieldsVerified:true,items:target.items.length,
     saved:target.state['outfit-board']?.saved.length||0,releaseAuthorized:false});}
    catch(e){reject(Error('RESTORE01 session changed after commit; private view revoked; reload'));}
   };
   tx.onerror=()=>fail(tx.error||Error('RESTORE01 IndexedDB transaction failed'));
   tx.onabort=()=>fail(tx.error||Error('RESTORE01 IndexedDB rollback'));
  }catch(e){fail(e);}
 });
}
