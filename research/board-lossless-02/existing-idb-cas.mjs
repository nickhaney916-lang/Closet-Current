/**
 * BOARD-LOSSLESS-02 existing account-owned IndexedDB state store. No new
 * object stores, version change, cloud upload, auth token or photo copying.
 *
 * Every write uses ONE readwrite transaction for 'outfit-board' + 'cloud-sync'
 * with strict expected snapshots; conflict aborts without touching older data.
 */
import {boardFingerprint02,validateBoard02} from './lossless-board.mjs';
const goodId=x=>typeof x==='string'&&x.length>0&&x.length<=160&&!/[\u0000-\u001f]/.test(x);
const snapshot=x=>JSON.stringify(x===undefined?null:x);
const cloudMarker=x=>x||null;
const clone=x=>structuredClone(x);
function checked(auth,lease){
 if(!lease||!goodId(lease.ownerId)||lease.authenticated!==true||
    !Number.isSafeInteger(lease.generation)||auth?.user?.id!==lease.ownerId||
    auth.getSessionGeneration()!==lease.generation)
  throw Error('BOARD02 private account session revoked or stale');
}
async function openExisting(owner,auth,lease){
 checked(auth,lease);
 // Without a version, this MUST NOT create a new owner database. Abort upgrade.
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('closet-current-user-'+owner);
  request.onupgradeneeded=()=>{try{request.transaction.abort();}catch{}};
  request.onerror=()=>reject(request.error||Error('BOARD02 existing private database missing'));
  request.onsuccess=()=>{
   const db=request.result;
   if(!db.objectStoreNames.contains('items')||!db.objectStoreNames.contains('state')){
    db.close();reject(Error('BOARD02 existing authenticated schema unavailable'));return;
   }
   try{checked(auth,lease);resolve(db);}catch(e){db.close();reject(e);}
  };
 });
}
function getSnapshot(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readonly');
  const items=tx.objectStore('items').getAll();
  const board=tx.objectStore('state').get('outfit-board');
  const cloud=tx.objectStore('state').get('cloud-sync');
  let result;
  items.onerror=()=>reject(items.error||Error('BOARD02 owner items read error'));
  board.onerror=()=>reject(board.error||Error('BOARD02 board read error'));
  cloud.onerror=()=>reject(cloud.error||Error('BOARD02 cloud revision read error'));
  tx.oncomplete=()=>resolve(result={items:items.result,board:board.result||{
   id:'outfit-board',current:{name:'My outfit',slots:{}},saved:[]},cloud:cloud.result||null});
  tx.onerror=()=>reject(tx.error||Error('BOARD02 snapshot transaction failed'));
  tx.onabort=()=>reject(tx.error||Error('BOARD02 snapshot transaction aborted'));
 });
}
export function createExistingBoard02IO(auth){
 if(!auth?.ready||typeof auth.getSessionGeneration!=='function')
  throw Error('BOARD02 native owner epoch required; PR550 research adapter first');
 async function read(lease){
  checked(auth,lease);
  const db=await openExisting(lease.ownerId,auth,lease);
  try{
   const value=await getSnapshot(db);
   checked(auth,lease);
   validateBoard02(value.board,{ownerId:lease.ownerId});
   for(const row of value.items)if(row?.ownerId!==undefined&&row.ownerId!==lease.ownerId)
    throw Error('BOARD02 cross-account wardrobe record in private DB');
   return {board:clone(value.board),items:clone(value.items),cloud:cloudMarker(value.cloud)};
  }finally{db.close();}
 }
 async function compareAndWrite({lease,expectedFingerprint,expectedCloud,nextBoard,operation}={}){
  checked(auth,lease);
  if(!['save-existing','save-new','delete'].includes(operation)||
     typeof expectedFingerprint!=='string'||expectedFingerprint.length>2_000_000||
     expectedCloud!==null&&expectedCloud!==undefined&&typeof expectedCloud!=='object')
   throw Error('BOARD02 invalid optimistic write contract');
  validateBoard02(nextBoard,{ownerId:lease.ownerId});
  const db=await openExisting(lease.ownerId,auth,lease);
  try{
   checked(auth,lease);
   return await new Promise((resolve,reject)=>{
    const tx=db.transaction('state','readwrite'),store=tx.objectStore('state');
    const old=store.get('outfit-board'),cloudReq=store.get('cloud-sync');
    let done=false,hasOld=false,hasCloud=false,oldVal,cloudVal,aborted=false;
    const fail=e=>{if(done)return;done=true;aborted=true;try{tx.abort();}catch{}reject(e);};
    const checkReady=()=>{
     if(!hasOld||!hasCloud||done)return;
     try{
      checked(auth,lease);
      const existing=oldVal||{id:'outfit-board',current:{name:'My outfit',slots:{}},saved:[]};
      validateBoard02(existing,{ownerId:lease.ownerId});
      if(boardFingerprint02(existing)!==expectedFingerprint)
       throw Error('BOARD02 CONFLICT: saved outfit changed in another tab or backup; reload');
      if(snapshot(cloudVal)!==snapshot(expectedCloud))
       throw Error('BOARD02 CONFLICT: cloud/backup revision changed; reload');
      const existingRev=cloudVal?.localRevision;
      if(existingRev!==undefined&&(!Number.isSafeInteger(existingRev)||existingRev<0||
        existingRev>=Number.MAX_SAFE_INTEGER))
       throw Error('BOARD02 cloud revision counter invalid');
      const nowRev=(existingRev||0)+1;
      // Keep every unrecognized state-level field and all untouched saved
      // records. No normalization, no item modification, no image copying.
      const next={...clone(existing),...clone(nextBoard),id:'outfit-board'};
      store.put(next);
      // Dirty marker in the SAME transaction as the lossless saved board.
      store.put({...clone(cloudVal||{id:'cloud-sync',baseVersion:0,baseDocument:null,
       localRevision:0}),id:'cloud-sync',dirty:true,localRevision:nowRev});
     }catch(e){fail(e);}
    };
    old.onsuccess=()=>{oldVal=old.result;hasOld=true;checkReady();};
    cloudReq.onsuccess=()=>{cloudVal=cloudReq.result||null;hasCloud=true;checkReady();};
    old.onerror=()=>fail(old.error||Error('BOARD02 read before compare failed'));
    cloudReq.onerror=()=>fail(cloudReq.error||Error('BOARD02 cloud marker read failed'));
    tx.oncomplete=()=>{
     if(done)return;done=true;
     try{checked(auth,lease);resolve({saved:true,operation,cloudDirty:true});}
     catch(e){reject(Error('BOARD02 session changed after transaction; reload before use'));}
    };
    tx.onerror=()=>{if(!done)fail(tx.error||Error('BOARD02 storage transaction failed'));};
    tx.onabort=()=>{if(!done)fail(tx.error||Error('BOARD02 storage transaction aborted'));};
   });
  }finally{db.close();}
 }
 return Object.freeze({read,compareAndWrite,productionModified:false,
  schemaMigrated:false,remoteCloudModified:false,releaseAuthorized:false});
}
