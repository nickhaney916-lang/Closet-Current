'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {randomUUID,webcrypto}=require('node:crypto');
const fake=require('fake-indexeddb');
const {indexedDB,IDBObjectStore}=fake;
const source=fs.readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const E=require('../public/cloud-backup-engine.js'),baseline=process.env.EXPECT_BASELINE==='1';
const jpeg='data:image/jpeg;base64,'+Buffer.from([255,216,1,2,3,4,255,217]).toString('base64');
const empty={schemaVersion:1,items:[],state:{}};
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const response=body=>({ok:true,status:200,json:async()=>body});

async function open(owner){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+owner,2);
  req.onupgradeneeded=()=>{
   req.result.createObjectStore('items',{keyPath:'id'});
   req.result.createObjectStore('state',{keyPath:'id'});
  };
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
}
async function seed(db,{size=0,dirty=false,baseVersion=5,localRevision=7}={}){
 const tx=db.transaction(['items','state'],'readwrite');
 for(let i=0;i<size;i++)tx.objectStore('items').put({
  id:'garment-'+i,category:'Tops',color:'Blue',image:jpeg,
  name:'Owner-only garment '+i
 });
 tx.objectStore('state').put({
  id:'cloud-sync',baseVersion,localRevision,dirty,baseDocument:empty,
  needsRestore:false
 });
 await new Promise((resolve,reject)=>{
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
async function all(db){
 return new Promise((resolve,reject)=>{
  const request=db.transaction('items').objectStore('items').getAll();
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });
}
async function fixture({size=0,dirty=false,baseVersion=5,remoteRevision=5,
                       remoteRows=[],holdRemote=false}={}){
 const owner=randomUUID(),db=await open(owner);
 await seed(db,{size,dirty,baseVersion});
 const requests=[],events=new Map(),waiting=deferred(),unblock=deferred();
 const elements=new Map();
 function element(id){
  if(!elements.has(id))elements.set(id,{textContent:'',hidden:false,onclick:null});
  return elements.get(id);
 }
 const window={ClosetBackupEngine:E,
  closetAuth:{user:{id:owner},assertCurrent(){},getAccessToken:async()=> 'synthetic-not-signed-'+owner},
  addEventListener:(name,fn)=>events.set(name,fn)
 };
 const remote={revision:remoteRevision,document:{
  schemaVersion:1,items:remoteRows,state:{}
 }};
 let saved=null;
 const fetch=async(url,opts={})=>{
  const p=new URL(url),verb=opts.method||'GET';
  requests.push({method:verb,path:p.pathname});
  if(p.pathname==='/rest/v1/closet_backups'){
   assert.equal(p.searchParams.get('owner_id'),'eq.'+owner);
   waiting.resolve();if(holdRemote)await unblock.promise;
   return response(remoteRevision?[remote]:[]);
  }
  if(p.pathname==='/rest/v1/rpc/save_closet_backup'){
   saved=JSON.parse(opts.body);return response(remoteRevision+1);
  }
  if(p.pathname.startsWith('/storage/v1/object/closet-private/')){
   assert.equal(verb,'POST');
   return response({});
  }
  throw Error('unexpected synthetic endpoint '+p.pathname);
 };
 vm.runInNewContext(source,{window,location:{hostname:'localhost',search:''},
  navigator:{storage:{persist:async()=>true}},
  document:{getElementById:element},fetch,URL,URLSearchParams,
  crypto:webcrypto,Uint8Array,atob,btoa,AbortController,
  setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>{},console});
 return {owner,db,window,requests,waiting,unblock,elements,
  get saved(){return saved;},
  start:()=>window.closetCloud.start(db,{capture:work=>work(),canRestore:()=>true,
   async restored(){}}),
  rows:()=>all(db),
  close(){unblock.resolve();events.get('pagehide')?.();db.close();}
 };
}
async function withGetAllCount(run){
 const original=IDBObjectStore.prototype.getAll;
 let total=0,items=0,state=0;
 IDBObjectStore.prototype.getAll=function(...args){
  total++;
  if(this.name==='items')items++;if(this.name==='state')state++;
  return original.apply(this,args);
 };
 try{return await run(()=>({total,items,state}));}
 finally{IDBObjectStore.prototype.getAll=original;}
}

test('clean 1,000-item private wardrobe avoids getAll clones on open/focus/resync',async()=>{
 const f=await fixture({size:1000});
 try{
  await withGetAllCount(async counts=>{
   await f.start();await f.window.closetCloud.sync();await f.window.closetCloud.sync();
   const reads=counts();
   if(baseline){
    assert.ok(reads.items>=3,'parent must clone the full wardrobe every clean sync');
    assert.ok(reads.state>=3);
   }else{
    assert.equal(reads.total,0,'clean sync must read only revision markers');
    assert.equal(f.elements.get('cloudStatus').textContent,'Cloud backup up to date');
   }
  });
  assert.equal((await f.rows()).length,1000,'no clean sync may delete or replace owner photos');
  assert.equal(f.saved,null);
  assert.equal(f.requests.filter(x=>x.path==='/rest/v1/closet_backups').length,3);
 }finally{f.close();}
});

test('dirty wardrobe still takes complete local snapshot and publishes all images',async()=>{
 const f=await fixture({size:20,dirty:true});
 try{
  await withGetAllCount(async counts=>{
   await f.start();
   const c=counts();assert.ok(c.items>0&&c.state>0,
    'dirty owner backup must retain the full original JPEG snapshot');
  });
  assert.ok(f.saved,'dirty backup must publish');
  assert.equal(f.saved.p_document.items.length,20);
  assert.equal((await f.rows()).length,20);
 }finally{f.close();}
});

test('first-time local legacy closet still migrates rather than being mistaken for empty',async()=>{
 const f=await fixture({size:15,baseVersion:0});
 try{
  await withGetAllCount(async counts=>{
   await f.start();assert.ok(counts().items>0);
  });
  assert.equal(f.saved.p_document.items.length,15);
  assert.equal((await f.rows()).length,15);
 }finally{f.close();}
});

test('clean local wardrobe still restores an independently newer remote revision',async()=>{
 const f=await fixture({size:300,remoteRevision:6,remoteRows:[
  {id:'new-owner-remote-piece',category:'Tops',name:'Restored privately'}
 ]});
 try{
  await withGetAllCount(async counts=>{
   await f.start();
   if(baseline)assert.ok(counts().items>0);
   else assert.equal(counts().items,0);
  });
  assert.deepEqual((await f.rows()).map(x=>x.id),['new-owner-remote-piece']);
  assert.equal(f.saved,null,'restore cannot manufacture a write RPC');
 }finally{f.close();}
});

test('concurrent local dirty flag never gets overwritten by stale up-to-date message',async()=>{
 const f=await fixture({size:50,holdRemote:true});
 try{
  const pending=f.start();
  await f.waiting.promise;
  await f.window.closetCloud.beforeWrite(f.db);
  f.window.closetCloud.changed();
  f.unblock.resolve();await pending;
  const status=f.elements.get('cloudStatus').textContent;
  if(baseline)assert.equal(status,'Cloud backup up to date',
    'parent must reproduce incorrect clean UI after a concurrent edit');
  else assert.equal(status,'Saved on this device · cloud backup pending');
  assert.equal((await f.rows()).length,50);
  assert.equal(f.saved,null);
 }finally{f.close();}
});
