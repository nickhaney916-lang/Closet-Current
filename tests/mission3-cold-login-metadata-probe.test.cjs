'use strict';
// Mission 3: prove a fresh account probes IndexedDB COUNT before cloning 1,000 JPEGs.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const {randomUUID,webcrypto}=require('node:crypto');
const {indexedDB,IDBObjectStore}=require('fake-indexeddb');
const E=require('../public/cloud-backup-engine.js');
const source=readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
const empty=()=>({schemaVersion:1,items:[],state:{}});
const response=value=>({ok:true,status:200,json:async()=>value});
let itemReads=0,itemCounts=0;
const rawGetAll=IDBObjectStore.prototype.getAll,rawCount=IDBObjectStore.prototype.count;
IDBObjectStore.prototype.getAll=function(...args){if(this.name==='items')itemReads++;return rawGetAll.apply(this,args);};
IDBObjectStore.prototype.count=function(...args){if(this.name==='items')itemCounts++;return rawCount.apply(this,args);};
async function open(owner){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+owner,2);
  req.onupgradeneeded=()=>{req.result.createObjectStore('items',{keyPath:'id'});req.result.createObjectStore('state',{keyPath:'id'});};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
}
const read=(db,store,key)=>new Promise((resolve,reject)=>{
 const req=db.transaction(store).objectStore(store).get(key);
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});
const count=db=>new Promise((resolve,reject)=>{
 const req=db.transaction('items').objectStore('items').count();
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});
async function setup({countLocal=0,remote=false}={}){
 const owner=randomUUID(),db=await open(owner);
 const local=Array.from({length:countLocal},(_,i)=>{
  // Each source is unique; all JPEG payloads remain owner-owned in IndexedDB.
  // These are small synthetic marker JPEGs, NOT 1,000 genuine full-res photos.
  const bytes=Buffer.from([255,216,255,224,0,16,i&255,(i>>8)&255,86,70,255,217]);
  return {id:'owner-piece-'+String(i).padStart(4,'0'),ownerId:owner,
    category:'Tops',color:'Blue',image:'data:image/jpeg;base64,'+bytes.toString('base64')};
 });
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  for(const row of local)tx.objectStore('items').put(row);
  tx.objectStore('state').put({id:'cloud-sync',baseVersion:0,baseDocument:null,
    localRevision:3,dirty:false});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
 const root={ClosetBackupEngine:E,closetAuth:{user:{id:owner},getAccessToken:async()=>owner,assertCurrent(){}},addEventListener(){}};
 const elements=new Map(),requests=[],selects=[];
 const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',onclick:null});return elements.get(id);};
 const doc={schemaVersion:1,items:[{id:'remote-first',ownerId:owner,category:'Tops',color:'Navy'}],state:{}};
 const fetch=async(url,options={})=>{
  const u=new URL(url),method=options.method||'GET';requests.push({path:u.pathname,method});
  if(u.pathname==='/rest/v1/closet_backups'){
   const select=u.searchParams.get('select');selects.push(select);
   assert.equal(u.searchParams.get('owner_id'),'eq.'+owner);
   return response(remote?[select==='revision'?{revision:1}:{revision:1,document:doc}]:[]);
  }
  if(u.pathname==='/rest/v1/rpc/save_closet_backup'){
   throw Error('Unexpected remote publish in cold-start probe');
  }
  if(u.pathname.startsWith('/storage/v1/object/closet-private/')){
   assert.equal(method,'POST');return {ok:false,status:413};
  }
  throw Error('Unexpected endpoint '+u.pathname);
 };
 vm.runInNewContext(source,{window:root,document:{getElementById:el},
  location:{hostname:'localhost',search:''},navigator:{storage:{persist:async()=>true}},
  URL,URLSearchParams,fetch,crypto:webcrypto,Uint8Array,atob,btoa,AbortController,console,
  setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0});
 const start=()=>root.closetCloud.start(db,{capture:work=>work(),canRestore:()=>true,async restored(){}});
 return {owner,db,start,selects,requests,status:()=>el('cloudStatus').textContent,
  marker:()=>read(db,'state','cloud-sync'),close:()=>db.close()};
}
test('first-login uninitialized cloud marker does not demand full items.getAll just to probe',()=>{
 if(baseline){
  assert.match(source,/if\(m\.dirty\|\|!m\.baseVersion\)/);
  assert.doesNotMatch(source,/hasLocalWardrobe/);
 }else{
  assert.match(source,/async function hasLocalWardrobe/);
  assert.match(source,/tx\.objectStore\('items'\)\.count\(\)/);
  assert.doesNotMatch(source,/if\(m\.dirty\|\|!m\.baseVersion\)/);
 }
});
test('new empty owner performs no original-JPEG clone or cloud publish',async()=>{
 const f=await setup();itemReads=0;itemCounts=0;
 try{
  await f.start();
  assert.equal(itemReads,baseline?1:0,'first login does not need getAll() when closet empty');
  assert.equal(itemCounts,baseline?0:1,'small count probe used once');
  assert.deepEqual(f.selects,['revision']);
  assert.equal(f.status(),'Your closet will back up automatically');
  assert.equal((await f.marker()).baseVersion,0);
  assert.equal(f.requests.filter(r=>r.method==='POST').length,0);
 }finally{f.close();}
});
test('1,000 distinct private-photo records get exactly one needed full clone, not two',async()=>{
 const f=await setup({countLocal:1000});itemReads=0;itemCounts=0;
 try{
  await f.start(); // deliberately reject first private upload with 413.
  assert.equal(itemReads,baseline?2:1,'never clone 1,000 originals just to decide if there are items');
  assert.equal(itemCounts,baseline?0:1);
  assert.equal((await f.marker()).dirty,true);
  assert.equal((await f.marker()).baseVersion,0);
  assert.equal((await count(f.db)),1000);
  assert.equal(f.status().includes('Cloud rejected a photograph as too large'),true);
  assert.equal(f.requests.filter(r=>r.path.endsWith('/save_closet_backup')).length,0);
 }finally{f.close();}
});
test('first-login empty local wardrobe still accepts a newer owner-specific cloud original record',async()=>{
 const f=await setup({remote:true});itemReads=0;itemCounts=0;
 try{
  await f.start();
  assert.equal(itemReads,baseline?1:0);
  assert.equal(itemCounts,baseline?0:1);
  assert.deepEqual(f.selects,['revision','revision,document']);
  assert.equal((await f.marker()).baseVersion,1);
  assert.equal((await read(f.db,'items','remote-first')).ownerId,f.owner);
  assert.equal(f.status(),'Cloud backup up to date');
 }finally{f.close();}
});
