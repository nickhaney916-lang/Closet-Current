/**
 * OUTFIT-3D-01 private adapter for EXISTING app IndexedDB
 * closet-current-user-<authenticated owner>, stores items/state v2.
 * No new database, no migration, no cloud API, no photo export.
 */
const good=lease=>typeof lease?.ownerId==='string'&&lease.ownerId&&
 Number.isSafeInteger(lease.generation)&&lease.generation>=0&&lease.authenticated===true;
function leaseCheck(auth,lease){
 if(!good(lease)||auth?.user?.id!==lease.ownerId||
  auth.getSessionGeneration()!==lease.generation)
  throw Error('Authenticated owner changed before private IndexedDB transaction');
}
function openExisting(owner){
 if(typeof owner!=='string'||!owner||owner.length>160)throw Error('Owner ID required');
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('closet-current-user-'+owner);
  // Refuse opening an uninitialized database (including arbitrary new owner
  // names), rather than silently creating or populating a new user database.
  request.onupgradeneeded=()=>request.transaction.abort();
  request.onsuccess=()=>{
   const db=request.result;
   if(!db.objectStoreNames.contains('items')||!db.objectStoreNames.contains('state')){
    db.close();reject(Error('Existing signed-in closet database required'));return;
   }
   resolve(db);
  };
  request.onerror=()=>reject(request.error||Error('Private database unavailable'));
 });
}
export function createExistingClosetOutfitIO(auth){
 if(!auth?.ready||typeof auth.getSessionGeneration!=='function')
  throw Error('Actual Closet Current session required');
 async function readStore(lease,store,key=null){
  leaseCheck(auth,lease);const db=await openExisting(lease.ownerId);
  try{
   leaseCheck(auth,lease);
   const value=await new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readonly'),req=key===null?
     tx.objectStore(store).getAll():tx.objectStore(store).get(key);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||Error('Owner database read failed'));
    tx.onabort=()=>reject(tx.error||Error('Owner database read aborted'));
   });
   leaseCheck(auth,lease);return value;
  }finally{db.close();}
 }
 const readSavedItems=lease=>readStore(lease,'items');
 const loadOutfitState=async lease=>{
  const value=await readStore(lease,'state','outfit-board');
  return value||{current:{name:'My outfit',slots:{}},saved:[]};
 };
 const commitOutfitState=async({lease,expectedFingerprint,state,operation})=>{
  if(!['save','delete'].includes(operation)||typeof expectedFingerprint!=='string'||
   !state||!Array.isArray(state.saved)||!state.current)
   throw Error('Invalid existing outfit-board transaction');
  leaseCheck(auth,lease);
  const db=await openExisting(lease.ownerId);
  try{
   leaseCheck(auth,lease);
   return await new Promise((resolve,reject)=>{
    const tx=db.transaction('state','readwrite'),table=tx.objectStore('state');
    let failed=false;
    const fail=e=>{if(failed)return;failed=true;try{tx.abort();}catch{}reject(e);};
    const get=table.get('outfit-board');
    get.onerror=()=>fail(get.error||Error('Outfit-board read failed'));
    get.onsuccess=()=>{
     try{
      leaseCheck(auth,lease);
      const current=get.result||{current:{name:'My outfit',slots:{}},saved:[]};
      const actual=JSON.stringify({current:current.current||{},saved:current.saved||[]});
      if(actual!==expectedFingerprint)throw Error('Saved outfits changed; refresh before retrying');
      table.put({...current,id:'outfit-board',current:state.current,saved:state.saved});
     }catch(e){fail(e);}
    };
    tx.oncomplete=()=>{if(failed)return;try{leaseCheck(auth,lease);resolve({saved:true,operation});}catch(e){reject(e);}};
    tx.onabort=()=>{if(!failed)reject(tx.error||Error('Outfit-board transaction aborted'));};
    tx.onerror=()=>{if(!failed)reject(tx.error||Error('Outfit-board storage write failed'));};
   });
  }finally{db.close();}
 };
 return Object.freeze({readSavedItems,loadOutfitState,commitOutfitState,source:'existing-authenticated-IndexedDB',productionDeployed:false});
}
