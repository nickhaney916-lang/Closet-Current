import {wardrobeKey} from './workflow.mjs';
const KEY='family-alpha-new-clothes-favorites';
/** Operates only on the supplied current account's existing private database. */
export function createNewClothesStore({getDatabase,queue,readContext}){
 function database(){const db=getDatabase(),c=readContext();if(!db||c.authenticatedUserId!==c.currentUserId||c.cloudOwnerId!==c.authenticatedUserId||db.name!=='closet-current-user-'+c.authenticatedUserId)throw Error('Private database required');return db;}
 function read(id){const db=database(),owner=readContext().authenticatedUserId,epoch=readContext().sessionGeneration;return new Promise((resolve,reject)=>{const tx=db.transaction('state'),r=tx.objectStore('state').get(id);r.onerror=()=>reject(r.error);tx.onabort=()=>reject(tx.error);tx.oncomplete=()=>{try{if(database()!==db||readContext().authenticatedUserId!==owner||readContext().sessionGeneration!==epoch)throw Error('Account changed');resolve(r.result);}catch(e){reject(e);}};});}
 function commit(kind,payload,options){const db=database();return queue(()=>new Promise((resolve,reject)=>{
  let tx,out;
  try{options.guard();if(database()!==db)throw Error('Account changed');
   tx=db.transaction(['items','state'],'readwrite');
   tx.oncomplete=()=>resolve(out);tx.onabort=()=>reject(tx.error||Error('Save cancelled'));tx.onerror=()=>reject(tx.error);
   const clothes=tx.objectStore('items').getAll(),state=tx.objectStore('state'),r=state.get(kind==='favorite'?KEY:'outfit-board');
   let rowsReady=false,recordReady=false;
   const finish=()=>{if(!rowsReady||!recordReady)return;try{
    options.guard();if(database()!==db||wardrobeKey(clothes.result)!==options.wardrobe)throw Error('Saved clothes changed');
    if(kind==='favorite'){
     if(payload.ownerId!==readContext().authenticatedUserId)throw Error('Foreign favorite');
     const favorites=r.result?.values||[];if(favorites.length>=50)throw Error('You can save up to 50 favorites');
     state.put({id:KEY,values:[...favorites,payload]});out=payload;
    }else{
     if(JSON.stringify(r.result)!==JSON.stringify(options.expectedBoard))throw Error('Outfit Builder changed. Try restoring again.');
     out={...(r.result||{id:'outfit-board',saved:[]}),current:structuredClone(payload)};state.put(out);
    }
   }catch(e){tx.abort();reject(e);}};
   clothes.onsuccess=()=>{rowsReady=true;finish();};r.onsuccess=()=>{recordReady=true;finish();};
  }catch(e){try{tx?.abort();}catch{}reject(e);}
 }));}
 return {readFavorites:async()=> (await read(KEY))?.values||[],readBoard:()=>read('outfit-board'),saveFavorite:(v,o)=>commit('favorite',v,o),restoreBoard:(v,o)=>commit('restore',v,o)};
}
