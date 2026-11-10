'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto,randomUUID}=require('node:crypto');
const {indexedDB}=require('fake-indexeddb');

const source=fs.readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
const doc=who=>({schemaVersion:1,items:[{id:who+'-private-clothing',category:'Tops',color:who}],state:{}});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const response=value=>({ok:true,status:200,json:async()=>value});
async function database(owner){
 return new Promise((resolve,reject)=>{
  const open=indexedDB.open('closet-current-user-'+owner,1);
  open.onupgradeneeded=()=>{
   open.result.createObjectStore('items',{keyPath:'id'});
   open.result.createObjectStore('state',{keyPath:'id'});
  };
  open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);
 });
}
async function add(db,item){
 await new Promise((resolve,reject)=>{
  const tx=db.transaction('items','readwrite');
  tx.objectStore('items').put(item);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
}
async function clearItems(db){
 await new Promise((resolve,reject)=>{
  const tx=db.transaction('items','readwrite');
  tx.objectStore('items').clear();
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
}
function read(db){
 return new Promise((resolve,reject)=>{
  const query=db.transaction('items').objectStore('items').getAll();
  query.onsuccess=()=>resolve(query.result);query.onerror=()=>reject(query.error);
 });
}
async function fixture(){
 const ownerA=randomUUID(),ownerB=randomUUID();
 const dbA=await database(ownerA),dbB=await database(ownerB);
 await add(dbA,{id:'a-original',color:'A'});await add(dbB,{id:'b-original',color:'B'});
 const requestedA=deferred(),finishA=deferred();
 const events=new Map(),requests=[],auth={user:{id:ownerA},
  assertCurrent(){if(!this.user?.id)throw Error('session expired');},
  async getAccessToken(){if(!this.user?.id)throw Error('session expired');return 'synthetic-'+this.user.id;}
 };
 const window={ClosetBackupEngine:require('../public/cloud-backup-engine.js'),
  closetAuth:auth,addEventListener(type,fn){events.set(type,fn);}};
 const location={search:'',hostname:'localhost'};
 const fetch=async(url,options={})=>{
  requests.push({url,method:options.method||'GET'});
  if(url.includes('/rest/v1/closet_backups?')){
   const owner=new URL(url).searchParams.get('owner_id').slice(3);
   if(owner===ownerA){requestedA.resolve();await finishA.promise;return response([{revision:1,document:doc('a')}]);}
   if(owner===ownerB)return response([]);
   throw Error('unexpected owner in cloud read');
  }
  if(url.endsWith('/rpc/save_closet_backup'))return response(1);
  throw Error('unexpected cloud network operation '+url);
 };
 vm.runInNewContext(source,{
  window,location,URL,URLSearchParams,fetch,
  document:{getElementById:()=>null},navigator:{storage:{persist:async()=>true}},
  crypto:webcrypto,AbortController,setTimeout,clearTimeout,setInterval:()=>{},
  clearInterval:()=>{},Uint8Array,atob,btoa,console,
 });
 const settings={capture:work=>work(),canRestore:()=>true,async restored(){}};
 const close=()=>{
  events.get('pagehide')?.();dbA.close();dbB.close();
 };
 return {ownerA,ownerB,dbA,dbB,auth,window,events,settings,requestedA,finishA,requests,close};
}
test('remote restore queued for owner A never writes into account B after database replacement',async()=>{
 const f=await fixture();
 try{
  const old=f.window.closetCloud.start(f.dbA,f.settings);
  await f.requestedA.promise;
  f.auth.user={id:f.ownerB};
  const next=f.window.closetCloud.start(f.dbB,f.settings);
  f.finishA.resolve();
  await Promise.all([old,next]);
  const rows=await read(f.dbB);
  if(baseline){
   assert.ok(rows.some(x=>x.id==='a-private-clothing'),
    'the old controller must reproduce cross-owner cloud item contamination');
   assert.ok(rows.some(x=>x.id==='b-original'),
    'the B owner's private item remains alongside the leaked A item');
  }else{
   assert.deepEqual(rows.map(x=>x.id),['b-original'],
    'a stale owner A response must never replace B wardrobe');
   assert.equal((await read(f.dbA))[0].id,'a-original');
   assert.ok(f.requests.some(x=>x.url.includes('owner_id=eq.'+f.ownerB)),
    'new owner must be independently serviced rather than starved by stale sync');
  }
 }finally{f.finishA.resolve();f.close();}
});
test('session lock revokes an in-flight restore before touching private local items',async()=>{
 const f=await fixture();
 try{
  await clearItems(f.dbA); // A has no pending local writes: actual restore path.
  const pending=f.window.closetCloud.start(f.dbA,f.settings);
  await f.requestedA.promise;
  f.auth.user=null;f.events.get('closet:session-locked')?.();
  f.finishA.resolve();await pending;
  const ids=(await read(f.dbA)).map(x=>x.id);
  assert.deepEqual(ids,baseline?['a-private-clothing']:[]);
 }finally{f.finishA.resolve();f.close();}
});
test('a cloud controller must reject a foreign-owner IndexedDB connection before network requests',async()=>{
 const f=await fixture();
 try{
  const pending=f.window.closetCloud.start(f.dbB,f.settings);
  if(baseline){
   // Before the repair the foreign database was read and its private
   // contents were offered for upload to the incorrect cloud owner.
   await f.requestedA.promise;
   f.finishA.resolve();await pending;
   assert.ok(f.requests.some(x=>x.url.includes('owner_id=eq.'+f.ownerA)));
  }else{
   await pending;
   assert.equal(f.requests.length,0);
   assert.deepEqual((await read(f.dbB)).map(x=>x.id),['b-original']);
  }
 }finally{f.finishA.resolve();f.close();}
});
