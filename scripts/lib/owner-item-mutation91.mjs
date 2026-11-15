import {randomUUID} from 'node:crypto';

// Test-only IndexedDB mutation. Never return an unrooted pending browser
// promise over CDP, and never retry a write after document/owner replacement.
export async function mutateOwnerItem91(page,{id,ownerId,operation}){
 const token=randomUUID();
 await page.evaluate(({id,ownerId,operation,token})=>{
  if(!['color','jpeg-byte'].includes(operation))throw Error('P91 unknown mutation');
  if(window.__ownerMutation91)throw Error('P91 mutation already pending');
  const ownerDB=db,auth=window.closetAuth;
  const assertOwner=()=>{
   auth.assertCurrent();
   if(db!==ownerDB||window.closetAuth!==auth||auth.user?.id!==ownerId||
      ownerDB.name!=='closet-current-user-'+ownerId)
    throw Error('P91 owner/document lease changed');
  };
  assertOwner();
  const tx=ownerDB.transaction('items','readwrite');
  // Root the operation AND transaction until its terminal event. Request
  // success is not durable acknowledgement; completion/abort handlers must
  // be installed before issuing the request, including in WebKit.
  const state={token,status:'pending',transaction:tx,ownerDB,auth};
  window.__ownerMutation91=state;
  tx.onabort=tx.onerror=()=>{
   state.status='failed';state.error='P91 IDB '+(tx.error?.name||'AbortError');
  };
  tx.oncomplete=()=>{
   try{
    assertOwner();
    window.dispatchEvent(new Event('closet:style-owned-inventory-committed'));
    state.status='committed';
   }catch{state.status='failed';state.error='P91 committed under changed owner lease';}
  };
  const store=tx.objectStore('items'),request=store.get(id);
  request.onsuccess=()=>{
   try{
    assertOwner();
    const record=request.result;
    if(!record||record.ownerId!==ownerId)throw Error('P91 owner item missing');
    if(operation==='color')record.color='Disposable synthetic edit';
    else{
     const image=record.originalPhoto?.image;
     if(typeof image!=='string'||!image.startsWith('data:image/jpeg;base64,')||image.length<500)
      throw Error('P91 original source missing');
     const i=Math.floor(image.length*0.65);
     record.originalPhoto.image=image.slice(0,i)+(image[i]==='A'?'B':'A')+image.slice(i+1);
    }
    store.put(record);
   }catch{
    state.status='failed';state.error='P91 mutation refused by owner/source guard';
    tx.abort();
   }
  };
 },{id,ownerId,operation,token});
 await page.waitForFunction(({token,ownerId})=>{
   const state=window.__ownerMutation91;
   if(!state||state.token!==token)throw Error('P91 document replaced during mutation');
   if(db!==state.ownerDB||window.closetAuth!==state.auth||state.auth.user?.id!==ownerId)
    throw Error('P91 owner lease replaced during mutation');
   state.auth.assertCurrent();
   if(state.status==='failed')throw Error(state.error);
   return state.status==='committed';
  },{token,ownerId},{timeout:30000});
 // Cleanup only after acknowledged success. Any failed operation terminates
 // acceptance and the caller closes the disposable context; no ignored errors.
 await page.evaluate(token=>{
  if(window.__ownerMutation91?.token!==token)throw Error('P91 document replaced before acknowledgement');
  delete window.__ownerMutation91;
 },token);
}
