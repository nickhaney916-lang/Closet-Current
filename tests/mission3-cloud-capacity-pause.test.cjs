'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {indexedDB}=require('fake-indexeddb');
const {randomUUID,webcrypto}=require('node:crypto');
const E=require('../public/cloud-backup-engine.js');
const source=fs.readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
const image='data:image/jpeg;base64,'+Buffer.from([255,216,255,224,0,16,71,65,82,77,69,78,84,255,217]).toString('base64');
const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
async function database(owner){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+owner,2);
  req.onupgradeneeded=()=>{
   req.result.createObjectStore('items',{keyPath:'id'});
   req.result.createObjectStore('state',{keyPath:'id'});
  };
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
}
async function seed(db){
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  for(let i=0;i<4;i++)tx.objectStore('items').put({
   id:'original-'+i,category:'Tops',itemType:'T-shirt',
   color:'Blue',image,originalPhoto:{image},userAdjusted:true
  });
  tx.objectStore('state').put({id:'cloud-sync',baseVersion:0,
   localRevision:4,dirty:true,baseDocument:null});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
}
const rows=db=>new Promise((resolve,reject)=>{
 const q=db.transaction('items').objectStore('items').getAll();
 q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
});
async function fixture(status=413){
 const owner=randomUUID(),db=await database(owner);await seed(db);
 const requests=[],events=new Map(),intervals=[],timers=[],elements=new Map(),objects=new Map();
 const el=id=>{
  if(!elements.has(id))elements.set(id,{hidden:false,onclick:null,textContent:''});
  return elements.get(id);
 };
 let failureStatus=status,revision=0,document=null;
 const auth={user:{id:owner},assertCurrent(){},getAccessToken:async()=> 'synthetic-only-'+owner};
 const window={ClosetBackupEngine:E,closetAuth:auth,
  addEventListener:(name,fn)=>events.set(name,fn)};
 const fetch=async(url,options={})=>{
  const pathname=new URL(url).pathname,verb=options.method||'GET';
  requests.push({pathname,verb});
  if(pathname==='/rest/v1/closet_backups')
   return response(revision?[{revision,document}]:[]);
  if(pathname==='/rest/v1/rpc/save_closet_backup'){
   assert.equal(verb,'POST');
   document=JSON.parse(options.body).p_document;
   revision++;return response(revision);
  }
  const prefix='/storage/v1/object/closet-private/';
  if(pathname.startsWith(prefix)){
   const key=pathname.slice(prefix.length);assert.ok(key.startsWith(owner+'/'));
   if(verb==='POST'){
    if(failureStatus)return response({},failureStatus);
    if(objects.has(key))return response({},409);
    objects.set(key,Buffer.from(options.body));return response({});
   }
   if(!objects.has(key))return response({},404);
   const bytes=objects.get(key);
   return {...response({}),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  }
  throw Error('Unexpected synthetic endpoint '+pathname);
 };
 vm.runInNewContext(source,{
  window,location:{hostname:'localhost',search:''},document:{getElementById:el},
  navigator:{storage:{persist:async()=>true}},fetch,URL,URLSearchParams,
  crypto:webcrypto,AbortController,Uint8Array,atob,btoa,console,
  setTimeout:(fn,delay)=>{timers.push(delay);return timers.length;},
  clearTimeout:()=>{},setInterval:fn=>{intervals.push(fn);return intervals.length;}
 });
 return {owner,db,window,auth,requests,events,intervals,timers,elements,objects,
  setFailure:code=>failureStatus=code,get revision(){return revision;},get document(){return document;},
  status:()=>el('cloudStatus').textContent,retryTimers:()=>timers.filter(delay=>delay<20000),read:()=>rows(db),
  async start(){await window.closetCloud.start(db,{capture:work=>work(),canRestore:()=>true,async restored(){}});},
  async on(name){return events.get(name)?.();},
  clickSync:()=>el('syncCloset').onclick(),
  close(){events.get('pagehide')?.();db.close();}
 };
}

test('413 photo-too-large rejection does not retry indefinitely or mislabel storage as connectivity',async()=>{
 const f=await fixture(413);
 try{
  await f.start();
  assert.equal(f.revision,0);assert.equal((await f.read()).length,4);
  if(baseline){
   assert.match(f.status(),/Retrying when connected/);
   assert.ok(f.retryTimers().length>0,'old implementation scheduled recurring 413 retries');
  }else{
   assert.match(f.status(),/too large/);
   assert.match(f.status(),/remain on this device/);
   assert.equal(f.retryTimers().length,0,'capacity rejection must pause automatic retry');
  }
  const before=f.requests.length;
  await f.on('online');await f.on('focus');
  for(const fn of f.intervals)await fn();
  f.window.closetCloud.changed();
  if(!baseline){
   assert.equal(f.requests.length,before,'automatic events cannot exhaust quota repeatedly');
   assert.equal(f.retryTimers().length,0);
   assert.match(f.status(),/too large/);
  }else assert.ok(f.requests.length>before,'legacy app kept retrying on reconnection');
 }finally{f.close();}
});

test('507 cloud-capacity rejection holds local photo/outfit state until deliberate Sync succeeds',async()=>{
 const f=await fixture(507);
 try{
  await f.start();
  assert.equal(f.revision,0);
  assert.equal((await f.read())[0].image,image);
  if(!baseline){
   assert.match(f.status(),/capacity is full/);
   const before=f.requests.length;
   await f.window.closetCloud.sync();
   assert.equal(f.requests.length,before,'silent automatic retry remains suppressed');
  }
  f.setFailure(null);
  await f.clickSync();
  assert.equal(f.revision,1,'manual retry must publish after cloud capacity is recovered');
  assert.equal(f.document.items.length,4);
  assert.equal((await f.read()).length,4);
  assert.equal(f.status(),'Cloud backup up to date');
 }finally{f.close();}
});

test('temporary 503 network failure keeps pre-existing automatic retry behavior',async()=>{
 const f=await fixture(503);
 try{
  await f.start();
  assert.equal(f.revision,0);
  assert.match(f.status(),/Retrying when connected/);
  assert.ok(f.retryTimers().length>=1);
  f.setFailure(null);
  await f.window.closetCloud.sync();
  assert.equal(f.revision,1);
  assert.equal(f.status(),'Cloud backup up to date');
  assert.equal((await f.read()).length,4);
 }finally{f.close();}
});

test('fresh owner-session controller start clears prior capacity rejection',async()=>{
 const f=await fixture(413);
 try{
  await f.start();
  f.setFailure(null);
  await f.start();
  assert.equal(f.revision,1,'new start invalidates old pause and creates fresh owner lease');
  assert.equal(f.status(),'Cloud backup up to date');
 }finally{f.close();}
});
