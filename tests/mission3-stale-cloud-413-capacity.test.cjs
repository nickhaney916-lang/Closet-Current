'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const {randomUUID,createHash,webcrypto}=require('node:crypto');
const {indexedDB}=require('fake-indexeddb');
const E=require('../public/cloud-backup-engine.js');
const baseline=process.env.EXPECT_BASELINE==='1';
const code=fs.readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const bytes=Buffer.from([255,216,255,224,0,16,68,69,76,69,84,69,255,217]);
const dataURL='data:image/jpeg;base64,'+bytes.toString('base64');
const sha=createHash('sha256').update(bytes).digest('hex');
const response=x=>({ok:true,status:200,json:async()=>x});
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
const get=(db,store,id)=>new Promise((resolve,reject)=>{
 const req=db.transaction(store).objectStore(store).get(id);
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});
const getAll=db=>new Promise((resolve,reject)=>{
 const req=db.transaction('items').objectStore('items').getAll();
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});
async function fixture({hold='storage',rejectCode=413}={}){
 const owner=randomUUID(),db=await open(owner);
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  tx.objectStore('items').put({id:'old-private-garment',
   ownerId:owner,category:'Tops',color:'Blue',
   image:dataURL,originalPhoto:{image:dataURL,sha256:sha},
   sourceSHA256:sha,sourceHashVerified:true,userAdjusted:true});
  tx.objectStore('state').put({id:'cloud-sync',baseVersion:0,
   baseDocument:null,dirty:true,localRevision:1});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
 let resolveGate,started;
 const gate=new Promise(resolve=>resolveGate=resolve);
 const reach=new Promise(resolve=>started=resolve);
 let remoteRevision=0;
 const published=[],uploads=[],requests=[],dom=new Map(),events=new Map(),timers=[];
 const element=id=>{
  if(!dom.has(id))dom.set(id,{hidden:false,onclick:null,textContent:''});
  return dom.get(id);
 };
 const window={ClosetBackupEngine:E,closetAuth:{
  user:{id:owner},assertCurrent(){},getAccessToken:async()=> 'synthetic-'+owner
 },addEventListener(name,fn){events.set(name,fn)}};
 const fetch=async(url,opts={})=>{
  const u=new URL(url),method=opts.method||'GET';
  requests.push({path:u.pathname,method});
  if(u.pathname==='/rest/v1/closet_backups'){
   assert.equal(u.searchParams.get('owner_id'),'eq.'+owner);
   if(hold==='revision'&&requests.filter(x=>x.path==='/rest/v1/closet_backups').length===1){
    started();await gate;
   }
   return response(remoteRevision?[{revision:remoteRevision}]:[]);
  }
  if(u.pathname.startsWith('/storage/v1/object/closet-private/')){
   assert.equal(u.pathname.slice('/storage/v1/object/closet-private/'.length),
    owner+'/'+sha+'.jpg');
   assert.equal(method,'POST');
   const body=Buffer.from(opts.body);
   assert.equal(createHash('sha256').update(body).digest('hex'),sha);
   uploads.push(body);
   if(hold==='storage'&&uploads.length===1){started();await gate;return {ok:false,status:rejectCode};}
   return response({});
  }
  if(u.pathname==='/rest/v1/rpc/save_closet_backup'){
   const request=JSON.parse(opts.body);
   assert.equal(request.p_expected_revision,remoteRevision);
   published.push(request.p_document);remoteRevision++;
   return response(remoteRevision);
  }
  throw Error('Unexpected synthetic private cloud endpoint '+u.pathname);
 };
 vm.runInNewContext(code,{window,fetch,URL,URLSearchParams,
  document:{getElementById:element},location:{hostname:'localhost',search:''},
  navigator:{storage:{persist:async()=>true}},
  crypto:webcrypto,Uint8Array,atob,btoa,AbortController,console,
  setTimeout:(fn,ms)=>{timers.push(ms);return timers.length;},
  clearTimeout:()=>{},setInterval:()=>0
 });
 async function edit(mode){
  await window.closetCloud.beforeWrite(db);
  await new Promise((resolve,reject)=>{
   const tx=db.transaction('items','readwrite');
   if(mode==='delete')tx.objectStore('items').delete('old-private-garment');
   else{
    const req=tx.objectStore('items').get('old-private-garment');
    req.onsuccess=()=>tx.objectStore('items').put({...req.result,color:'Teal'});
   }
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
  window.closetCloud.changed();
 }
 return {owner,db,window,requests,published,uploads,timers,edit,
  get revision(){return remoteRevision;},
  get rows(){return getAll(db);},
  marker:()=>get(db,'state','cloud-sync'),
  status:()=>element('cloudStatus').textContent,
  start:()=>window.closetCloud.start(db,{capture:fn=>fn(),
   canRestore:()=>true,async restored(){}}),
  async waitReached(){
   await Promise.race([reach,new Promise((_,reject)=>
    setTimeout(()=>reject(Error('Upload/revision fixture never reached')),12000))]);
  },
  release:()=>resolveGate(),
  close(){resolveGate();events.get('pagehide')?.();db.close();}
 };
}

test('exact verified parent persists 413 even if owner source revision changed',()=>{
 if(baseline){
  assert.match(code,/async function writeCapacityPause\(code,assertActive\)/);
  assert.doesNotMatch(code,/code===413&&expectedRevision!==null/);
 }else{
  assert.match(code,/async function writeCapacityPause\(code,assertActive,expectedRevision=null\)/);
  assert.match(code,/code===413&&expectedRevision!==null/);
 }
});
for(const change of ['delete','edit']){
 test('late HTTP 413 from old JPEG upload cannot stop newer private owner '+change,async()=>{
  const f=await fixture({hold:'storage',rejectCode:413});
  try{
   const original=f.start();
   await f.waitReached();
   await f.edit(change);
   const current=await f.marker();
   assert.equal(current.localRevision,2);
   assert.equal(current.dirty,true);
   f.release();await original;
   const after=await f.marker();
   assert.equal(after.localRevision,2);
   assert.equal(after.baseVersion,0);
   assert.equal(after.dirty,true);
   assert.deepEqual(f.published,[]);
   if(baseline){
    assert.equal(after.capacityPause,413,'parent incorrectly quarantines updated private owner wardrobe');
    assert.match(f.status(),/Cloud rejected a photograph as too large/);
   }else{
    assert.equal(after.capacityPause,undefined,'old JPEG source 413 must not poison new revision');
    assert.match(f.status(),/backup pending/);
   }
   const oldRequests=f.requests.length;
   if(baseline){
    await f.window.closetCloud.sync();
    assert.equal(f.requests.length,oldRequests,'stale 413 blocks normal automatic sync');
   }
   await f.window.closetCloud.sync(baseline?{retryPaused:true}:{});
   assert.equal(f.published.length,1);
   if(change==='delete'){
    assert.deepEqual(f.published[0].items,[]);
    assert.deepEqual(await f.rows,[]);
   }else{
    assert.deepEqual(f.published[0].items.map(x=>x.color),['Teal']);
    assert.equal((await f.rows)[0].color,'Teal');
   }
   assert.equal((await f.marker()).baseVersion,1);
   assert.equal((await f.marker()).dirty,false);
   assert.equal(f.status(),'Cloud backup up to date');
  }finally{f.close();}
 });
}
test('unchanged signed-owner first upload HTTP 413 remains durably paused until manual retry',async()=>{
 const f=await fixture({hold:'storage',rejectCode:413});
 try{
  const task=f.start();await f.waitReached();f.release();await task;
  assert.equal((await f.marker()).capacityPause,413);
  assert.match(f.status(),/Cloud rejected a photograph as too large/);
  const before=f.requests.length;
  await f.window.closetCloud.sync();
  assert.equal(f.requests.length,before);
  await f.window.closetCloud.sync({retryPaused:true});
  assert.equal(f.published.length,1);
  assert.equal((await f.marker()).baseVersion,1);
  assert.equal(f.status(),'Cloud backup up to date');
 }finally{f.close();}
});
test('HTTP 507 cloud-full remains a durable global stop even if user edits garment',async()=>{
 const f=await fixture({hold:'storage',rejectCode:507});
 try{
  const task=f.start();await f.waitReached();
  await f.edit('delete');f.release();await task;
  assert.equal((await f.marker()).capacityPause,507);
  assert.match(f.status(),/Cloud storage capacity is full/);
  assert.deepEqual(await f.rows,[]);
  const before=f.requests.length;
  await f.window.closetCloud.sync();
  assert.equal(f.requests.length,before,'local edits do not free owner cloud capacity');
  await f.window.closetCloud.sync({retryPaused:true});
  assert.equal(f.published.length,1);
  assert.deepEqual(f.published[0].items,[]);
  assert.equal((await f.marker()).baseVersion,1);
 }finally{f.close();}
});
