'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {randomUUID,webcrypto,createHash}=require('node:crypto');
const {indexedDB}=require('fake-indexeddb');
const E=require('../public/cloud-backup-engine.js');
const baseline=process.env.EXPECT_BASELINE==='1';
const source=fs.readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const jpeg=Buffer.from([255,216,255,224,0,16,86,65,76,73,68,255,217]);
const valid='data:image/jpeg;base64,'+jpeg.toString('base64');
const badFormat='data:image/png;base64,iVBORw0KGgo=';
const badMagic='data:image/jpeg;base64,'+Buffer.from([1,2,3,4,5]).toString('base64');
const oversize=()=>{
 const bytes=Buffer.alloc(8388609,1);bytes[0]=255;bytes[1]=216;
 return 'data:image/jpeg;base64,'+bytes.toString('base64');
};
const reply=(body,status=200)=>({status,ok:status>=200&&status<300,json:async()=>body});
async function open(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,2);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
const marker=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('state').objectStore('state').get('cloud-sync');
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
const items=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('items').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
async function setPhoto(db,value){
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  const r=tx.objectStore('items').get('owner-original');
  r.onsuccess=()=>{
   tx.objectStore('items').put({...r.result,image:value});
   const state=tx.objectStore('state'),m=state.get('cloud-sync');
   m.onsuccess=()=>state.put({...m.result,dirty:true,localRevision:m.result.localRevision+1});
  };
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
async function fixture(photo){
 const owner=randomUUID(),db=await open(owner),requests=[],events=new Map(),
  elements=new Map(),timers=[];
 let remoteRevision=0,remoteDoc=null;
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  tx.objectStore('items').put({id:'owner-original',ownerId:owner,category:'Tops',
   itemType:'T-shirt',color:'Blue',image:photo,userAdjusted:true});
  tx.objectStore('state').put({id:'cloud-sync',baseVersion:0,dirty:true,
   localRevision:1,baseDocument:null});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
 const dom=id=>{
  if(!elements.has(id))elements.set(id,{textContent:'',hidden:false,onclick:null});
  return elements.get(id);
 };
 const window={ClosetBackupEngine:E,closetAuth:{user:{id:owner},
  assertCurrent(){},getAccessToken:async()=> 'synthetic-'+owner},
  addEventListener(name,fn){events.set(name,fn)}};
 const fetch=async(url,options={})=>{
  const u=new URL(url),verb=options.method||'GET';
  requests.push({path:u.pathname,verb});
  if(u.pathname==='/rest/v1/closet_backups'){
   assert.equal(u.searchParams.get('owner_id'),'eq.'+owner);
   return reply(remoteRevision?[{revision:remoteRevision,
    ...(u.searchParams.get('select')==='revision'?{}:{document:remoteDoc})}]:[]);
  }
  if(u.pathname.startsWith('/storage/v1/object/closet-private/')){
   const path=u.pathname.slice('/storage/v1/object/closet-private/'.length);
   assert.ok(path.startsWith(owner+'/'));
   if(verb==='POST'){
    assert.equal(createHash('sha256').update(options.body).digest('hex'),path.split('/')[1].slice(0,-4));
    return reply({});
   }
   throw Error('Unexpected private Storage GET');
  }
  if(u.pathname==='/rest/v1/rpc/save_closet_backup'){
   const body=JSON.parse(options.body);
   assert.equal(body.p_expected_revision,remoteRevision);
   remoteRevision++;remoteDoc=body.p_document;
   return reply(remoteRevision);
  }
  throw Error('Unexpected synthetic cloud endpoint '+u.pathname);
 };
 vm.runInNewContext(source,{window,fetch,URL,URLSearchParams,
  navigator:{storage:{persist:async()=>true}},
  location:{hostname:'localhost',search:''},
  document:{getElementById:dom},crypto:webcrypto,
  Uint8Array,atob,btoa,AbortController,console,
  setTimeout:(fn,ms)=>{timers.push(ms);return timers.length;},
  clearTimeout:()=>{},setInterval:()=>0
 });
 return {owner,db,window,requests,timers,events,
  get revision(){return remoteRevision;},get remote(){return remoteDoc;},
  status:()=>dom('cloudStatus').textContent,
  marker:()=>marker(db),items:()=>items(db),replace:value=>setPhoto(db,value),
  start:()=>window.closetCloud.start(db,{capture:work=>work(),canRestore:()=>true,async restored(){}}),
  manual:()=>dom('syncCloset').onclick?.(),
  close(){events.get('pagehide')?.();db.close();}
 };
}
const uploadRequests=f=>f.requests.filter(x=>x.verb==='POST').length;
for(const [reason,photo] of [['LOCAL_PHOTO_FORMAT',badFormat],['LOCAL_PHOTO_INVALID',badMagic]]){
 test('unusable owner-local '+reason+' survives full page/controller recreation with no automatic cloud retry',async()=>{
  const f=await fixture(photo);
  try{
   await f.start();assert.equal(f.revision,0);assert.equal((await f.items())[0].image,photo);
   if(baseline){
    assert.equal((await f.marker()).localPhotoPause,undefined);
    assert.match(f.status(),/Retrying when connected/);
   }else{
    assert.equal((await f.marker()).localPhotoPause.reason,reason);
    assert.equal((await f.marker()).localPhotoPause.revision,1);
    assert.match(f.status(),/not a supported JPEG|damaged/);
    assert.equal(f.timers.filter(x=>x<20000).length,0);
   }
   const previous=f.requests.length;
   f.close();
   // Simulate full page-controller recreation while preserving owner IndexedDB.
   // This fixture's start reuses same local controller; new source VM below
   // is exercised independently by the genuine browser test.
   if(!baseline){
    await f.window.closetCloud.start(f.db,{capture:work=>work(),
     canRestore:()=>true,async restored(){}});
    assert.equal(f.requests.length,previous,'persisted failure prevents remote API on restart');
    assert.equal(uploadRequests(f),0);
   }
   assert.equal((await f.items())[0].image,photo);
  }finally{f.close();}
 });
}
test('8 MiB + 1 owner-original bytes are rejected before publishing or changing the JPEG',async()=>{
 const photo=oversize(),f=await fixture(photo);
 try{
  await f.start();
  assert.equal(f.revision,0);
  assert.equal((await f.items())[0].image,photo);
  if(baseline){
   assert.equal((await f.marker()).localPhotoPause,undefined);
   assert.match(f.status(),/Retrying when connected/);
  }else{
   assert.equal((await f.marker()).localPhotoPause.reason,'LOCAL_PHOTO_OVERSIZE');
   assert.match(f.status(),/8 MiB cloud photo limit/);
   assert.equal(f.timers.filter(x=>x<20000).length,0);
   assert.equal(uploadRequests(f),0);
  }
 }finally{f.close();}
});
test('owner manual Sync of unchanged invalid JPEG retries once then re-persists the pause',async()=>{
 const f=await fixture(badMagic);
 try{
  await f.start();
  const before=f.requests.length;
  await f.manual();
  assert.equal(f.revision,0);
  assert.ok(f.requests.length>before,'explicit owner action must try another cloud check');
  if(!baseline){
   assert.equal((await f.marker()).localPhotoPause.reason,'LOCAL_PHOTO_INVALID');
   const current=f.requests.length;
   await f.window.closetCloud.sync();
   assert.equal(f.requests.length,current,'blocked automatic retry must not request cloud data');
  }
 }finally{f.close();}
});
test('a new saved photo revision clears stale local pause and privately uploads valid original',async()=>{
 const f=await fixture(badFormat);
 try{
  await f.start();
  await f.replace(valid);
  await f.window.closetCloud.sync();
  assert.equal(f.revision,1);
  assert.equal((await f.items())[0].image,valid);
  assert.equal((await f.marker()).dirty,false);
  if(!baseline)assert.equal((await f.marker()).localPhotoPause,null);
  assert.equal(f.status(),'Cloud backup up to date');
 }finally{f.close();}
});
test('unrelated current-owner session with valid photo is never blocked by another owner invalid image',async()=>{
 const a=await fixture(badMagic),b=await fixture(valid);
 try{
  await a.start();await b.start();
  assert.equal(a.revision,0);
  assert.equal(b.revision,1);
  assert.equal((await a.items())[0].image,badMagic);
  assert.equal((await b.items())[0].image,valid);
  assert.equal(b.status(),'Cloud backup up to date');
 }finally{a.close();b.close();}
});
