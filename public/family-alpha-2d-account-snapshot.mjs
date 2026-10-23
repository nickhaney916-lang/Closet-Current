import {renderAlphaAuthenticatedBoard} from './family-alpha-2d-auth-preflight.mjs';

/**
 * Development-only adapter that binds the existing Auth and private IndexedDB
 * account instance to the source-bound 2D avatar. NO live UI registration.
 *
 * Source authorization is still upstream: this local transaction does NOT
 * prove deployed Supabase RLS or that a prepared mask belongs to a real photo.
 */
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function scope({auth,cloud,database}){
 const ownerId=auth?.user?.id,epoch=auth?.getSessionGeneration?.();
 if(typeof ownerId!=='string'||!ID.test(ownerId)||
  !Number.isSafeInteger(epoch)||epoch<1||database?.name!=='closet-current-user-'+ownerId||
  typeof cloud?.getOwnerId!=='function'||cloud.getOwnerId(database)!==ownerId)
  throw new Error('Family Alpha active private account scope unavailable');
 return Object.freeze({ownerId,epoch,indexedDbName:database.name});
}
function same(options,initial){
 const current=scope(options);
 if(current.ownerId!==initial.ownerId||current.epoch!==initial.epoch||
  current.indexedDbName!==initial.indexedDbName)
  throw new Error('Family Alpha saved wardrobe owner changed while reading');
}

/** Read actual items + outfit-board record in ONE IndexedDB readonly transaction. */
export async function readAlphaSavedWardrobe(options){
 const {database}=options||{};
 const initial=scope(options);
 if(typeof database.transaction!=='function'||
  !database.objectStoreNames?.contains?.('items')||
  !database.objectStoreNames?.contains?.('state'))
  throw new Error('Family Alpha saved wardrobe stores unavailable');
 const record=await new Promise((resolve,reject)=>{
  let tx,items,board,failed=false;
  const fail=()=>{if(!failed){failed=true;reject(new Error('Family Alpha private wardrobe read failed'));}};
  try{
   tx=database.transaction(['items','state'],'readonly');
   const clothes=tx.objectStore('items').getAll();
   const outfit=tx.objectStore('state').get('outfit-board');
   clothes.onsuccess=()=>{items=clothes.result;};
   outfit.onsuccess=()=>{board=outfit.result;};
   clothes.onerror=fail;outfit.onerror=fail;
   tx.onerror=fail;tx.onabort=fail;
   tx.oncomplete=()=>{
    if(failed)return;
    if(!Array.isArray(items)||!board||board.id!=='outfit-board'||
     !board.current||!board.current.slots||Array.isArray(board.current.slots)||
     typeof board.current.slots!=='object')return fail();
    resolve({board:board.current,items});
   };
  }catch{fail();}
 });
 same(options,initial);
 return Object.freeze({ownerId:initial.ownerId,indexedDbName:initial.indexedDbName,
  board:record.board,items:record.items});
}

/**
 * Caller-supplied mask preparation is still a mandatory, reviewed dependency.
 * No arbitrary fallback to the cropped image or a color proxy is permitted.
 */
export function createAlphaLiveOptions({
 auth,cloud,database,preparePresentations,fetchFn,publicKey,cryptoProvider
}={}){
 if(typeof preparePresentations!=='function'||typeof fetchFn!=='function'||
  typeof publicKey!=='string'||!publicKey)
  throw new Error('Family Alpha verified image, fetch and public key providers required');
 const options={auth,cloud,database};
 return Object.freeze({
  auth,database,publicKey,cryptoProvider,fetchFn,
  getCloudOwnerId:()=>cloud?.getOwnerId?.(database),
  getSessionGeneration:()=>auth?.getSessionGeneration?.(),
  loadScopedWardrobe:async({ownerId,indexedDbName,database:requestedDb})=>{
   if(requestedDb!==database)throw new Error('Foreign IndexedDB connection');
   const result=await readAlphaSavedWardrobe(options);
   if(result.ownerId!==ownerId||result.indexedDbName!==indexedDbName)
    throw new Error('Foreign wardrobe owner or local database');
   return result;
  },
  preparePresentations
 });
}
export async function renderAlphaLiveSnapshot(container,config){
 return renderAlphaAuthenticatedBoard(container,createAlphaLiveOptions(config));
}
