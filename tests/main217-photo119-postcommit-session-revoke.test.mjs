/**
 * M217: a source-verified PHOTO119 private IndexedDB transaction may already
 * be durable when another signed owner session starts BEFORE the oncomplete
 * callback. In that case return a reload-required refusal, never "saved" to
 * the newer auth session. Genuine fake-indexeddb and public licensed JPEG,
 * synthetic test owners only, no hosted account or customer image.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID,createHash,webcrypto} from 'node:crypto';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119} from '../public/native-reviewed-private-save-167.mjs';

const bytes=readFileSync('benchmark/fixtures/commons-0053.jpg');
const original='data:image/jpeg;base64,'+bytes.toString('base64');
const sha=createHash('sha256').update(bytes).digest('hex');
const record=owner=>({
 id:'m217-photographed-jeans',ownerId:owner,image:original,
 originalPhoto:{image:original,sha256:sha},
 sourceSHA256:sha,sourceHashVerified:true,
 category:'Uncategorized',itemType:'Unknown',color:'Unknown',
 singleGarmentVerified:false
});
const review=record=>({
 confirmed:true,recordId:record.id,originalSHA256:sha,
 category:'Bottoms',itemType:'Jeans',color:'Blue',
 singleGarmentConfirmed:true
});
const open=owner=>new Promise((resolve,reject)=>{
 const req=indexedDB.open('closet-current-user-'+owner,1);
 req.onupgradeneeded=()=>{
  req.result.createObjectStore('items',{keyPath:'id'});
  req.result.createObjectStore('state',{keyPath:'id'});
 };
 req.onsuccess=()=>resolve(req.result);
 req.onerror=()=>reject(req.error);
});
const put=(db,store,row)=>new Promise((resolve,reject)=>{
 const tx=db.transaction(store,'readwrite');
 tx.objectStore(store).put(row);
 tx.oncomplete=resolve;
 tx.onerror=tx.onabort=()=>reject(tx.error);
});
const snapshot=(db)=>new Promise((resolve,reject)=>{
 const tx=db.transaction(['items','state'],'readonly');
 const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
 tx.oncomplete=()=>resolve({items:a.result,state:b.result});
 tx.onerror=tx.onabort=()=>reject(tx.error);
});
async function fixture({revocation='none'}={}){
 const owner='m217-synthetic-'+randomUUID();
 const db=await open(owner),item=record(owner);
 await put(db,'state',{id:'draft',batch:[structuredClone(item)],
  unknownFuture:{preserve:true}});
 let lease=true,currentOwner=owner,commitReached=false;
 // This is an event-time lease revocation: real IDB operations execute
 // unchanged. Only the before-oncomplete callback session is switched.
 const proxy={
  name:db.name,objectStoreNames:db.objectStoreNames,
  transaction(names,mode){
   const tx=db.transaction(names,mode);
   if(mode!=='readwrite'||!Array.isArray(names)||!names.includes('items')||
      !names.includes('state'))return tx;
   return {
    objectStore:name=>tx.objectStore(name),
    abort:()=>tx.abort(),
    set onabort(fn){tx.onabort=fn;},
    set onerror(fn){tx.onerror=fn;},
    set oncomplete(fn){
     tx.oncomplete=e=>{
      commitReached=true;
      if(revocation==='same-owner-new-epoch')lease=false;
      if(revocation==='different-owner'){
       lease=false;currentOwner='m217-other-owner';
      }
      fn(e);
     };
    }
   };
  }
 };
 const args={
  db:proxy,ownerId:owner,currentOwner:()=>currentOwner,
  assertLease:()=>lease,
  record:item,review:review(item),cryptoProvider:webcrypto
 };
 return {db,owner,item,args,committed:()=>commitReached};
}
test('M217 real original image and SHA receipt are immutable public bytes',()=>{
 assert.equal(bytes[0],255);
 assert.equal(bytes[1],216);
 assert.match(sha,/^[a-f0-9]{64}$/);
});
test('M217 unchanged live signed owner explicitly reviewed photo still saves once',async()=>{
 const f=await fixture();
 try{
  const result=await commitHumanReviewedPhoto119(f.args);
  assert.equal(f.committed(),true);
  assert.equal(result.saved,true);
  assert.equal(result.familyAlpha,'HOLD');
  assert.equal(result.releaseAuthorized,false);
  const row=(await snapshot(f.db)).items;
  assert.equal(row.length,1);
  assert.equal(row[0].originalPhoto.image,original);
 }finally{f.db.close();}
});
for(const revocation of ['same-owner-new-epoch','different-owner']){
 test('M217 '+revocation+' after IndexedDB commit BEFORE oncomplete may never return saved',async()=>{
  const f=await fixture({revocation});
  try{
   await assert.rejects(
    commitHumanReviewedPhoto119(f.args),
    /PHOTO119_SESSION_REVOKED_AFTER_COMMIT_RELOAD/
   );
   assert.equal(f.committed(),true,'the test must cross a real IDB commit boundary');
   const state=await snapshot(f.db);
   // A completed IDB transaction cannot be rolled back. It is durable
   // in the original owner DB; the new account must reload, not see success.
   assert.equal(state.items.length,1);
   assert.equal(state.items[0].ownerId,f.owner);
   assert.equal(state.items[0].originalPhoto.image,original);
   assert.deepEqual(state.state.find(x=>x.id==='draft').unknownFuture,
    {preserve:true});
   assert.equal(state.state.find(x=>x.id==='draft').batch.length,0);
  }finally{f.db.close();}
 });
}
