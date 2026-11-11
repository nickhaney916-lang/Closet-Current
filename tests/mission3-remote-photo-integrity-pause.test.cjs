'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const {randomUUID,createHash,webcrypto}=require('node:crypto');
const {indexedDB}=require('fake-indexeddb');
const E=require('../public/cloud-backup-engine.js');
const baseline=process.env.EXPECT_BASELINE==='1';
const source=fs.readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const photo=Buffer.from([255,216,255,224,0,16,82,69,77,79,84,69,255,217]);
const other=Buffer.from([255,216,255,224,0,16,66,65,68,67,76,79,85,68,255,217]);
const sha=createHash('sha256').update(photo).digest('hex');
const url='data:image/jpeg;base64,'+photo.toString('base64');
const reply=(body,status=200,bytes=null)=>({
 status,ok:status>=200&&status<300,json:async()=>body,
 arrayBuffer:async()=>{
  const buf=bytes||photo;
  return buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.length);
 }
});
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
const read=(db,store,id)=>new Promise((resolve,reject)=>{
 const request=db.transaction(store).objectStore(store).get(id);
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
});
const all=db=>new Promise((resolve,reject)=>{
 const request=db.transaction('items').objectStore('items').getAll();
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
});
async function fixture({failure='missing'}={}){
 const owner=randomUUID(),db=await open(owner);
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  tx.objectStore('items').put({id:'private-old-item',ownerId:owner,category:'Tops',
   color:'Red',image:url,originalPhoto:{image:url,sha256:sha}});
  tx.objectStore('state').put({id:'outfit-board',current:{slots:{top:'private-old-item'}},
   saved:[{id:'my-old-outfit',slots:{top:'private-old-item'}}]});
  tx.objectStore('state').put({id:'cloud-sync',baseVersion:1,
   baseDocument:{schemaVersion:1,items:[],state:{}},
   dirty:false,localRevision:8});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
 const ref='closet-photo:'+owner+'/'+sha+'.jpg';
 const document={schemaVersion:1,
  items:[{id:'new-cloud-owner-item',ownerId:owner,category:'Tops',color:'Blue',
   originalPhoto:{image:ref,sha256:sha}}],
  state:{'outfit-board':{id:'outfit-board',current:{slots:{top:'new-cloud-owner-item'}},
   saved:[{id:'new-cloud-outfit',slots:{top:'new-cloud-owner-item'}}]}}
 };
 let state=failure,restores=0;
 const events=new Map(),dom=new Map(),requests=[],timers=[];
 const element=id=>{
  if(!dom.has(id))dom.set(id,{hidden:false,onclick:null,textContent:''});
  return dom.get(id);
 };
 const window={ClosetBackupEngine:E,closetAuth:{
  user:{id:owner},getAccessToken:async()=> 'synthetic-'+owner,assertCurrent(){}
 },addEventListener(name,fn){events.set(name,fn)}};
 const fetch=async(path,opts={})=>{
  const uri=new URL(path),verb=opts.method||'GET';
  requests.push({path:uri.pathname,verb,select:uri.searchParams.get('select')});
  if(uri.pathname==='/rest/v1/closet_backups'){
   assert.equal(uri.searchParams.get('owner_id'),'eq.'+owner);
   return reply(uri.searchParams.get('select')==='revision'?[{revision:2}]:
    [{revision:2,document}]);
  }
  if(uri.pathname.startsWith('/storage/v1/object/closet-private/')){
   assert.equal(uri.pathname.slice('/storage/v1/object/closet-private/'.length),
    owner+'/'+sha+'.jpg');
   if(state==='missing')return reply({},404);
   if(state==='offline')return reply({},503);
   return reply({},200,state==='corrupt'?other:photo);
  }
  throw Error('Unexpected synthetic cloud call '+uri.pathname);
 };
 vm.runInNewContext(source,{window,fetch,URL,URLSearchParams,
  location:{hostname:'localhost',search:''},
  document:{getElementById:element},
  navigator:{storage:{persist:async()=>true}},
  crypto:webcrypto,AbortController,Uint8Array,atob,btoa,console,
  setTimeout:(fn,ms)=>{timers.push(ms);return timers.length;},
  clearTimeout:()=>{},setInterval:()=>0
 });
 return {owner,db,requests,timers,window,
  setFailure:value=>state=value,marker:()=>read(db,'state','cloud-sync'),
  board:()=>read(db,'state','outfit-board'),items:()=>all(db),
  get restores(){return restores;},
  status:()=>element('cloudStatus').textContent,
  manual:()=>element('syncCloset').onclick?.(),
  start:()=>window.closetCloud.start(db,{capture:fn=>fn(),canRestore:()=>true,
   async restored(){restores++;}}),
  async noise(){await events.get('online')?.();await events.get('focus')?.();window.closetCloud.changed();},
  close(){events.get('pagehide')?.();db.close();}
 };
}
for(const [failure,reason]of [['missing','REMOTE_PHOTO_MISSING'],
 ['corrupt','REMOTE_PHOTO_INTEGRITY']]){
 test('remote '+failure+' SHA reference does not rewrite local wardrobe and pauses repeated reload',async()=>{
  const f=await fixture({failure});
  try{
   await f.start();
   const m=await f.marker();
   if(baseline){
    assert.equal(m.remotePhotoPause,undefined);
    assert.match(f.status(),/Cloud connection unavailable/);
    assert.ok(f.timers.filter(ms=>ms<20000).length>=1);
   }else{
    assert.equal(m.remotePhotoPause.reason,reason);
    assert.equal(m.remotePhotoPause.revision,2);
    assert.match(f.status(),/Cloud restore is paused/);
    assert.equal(f.timers.filter(ms=>ms<20000).length,0);
   }
   assert.equal(m.baseVersion,1);
   assert.equal(m.localRevision,8);
   assert.equal((await f.items())[0].image,url);
   assert.equal((await f.board()).saved[0].id,'my-old-outfit');
   assert.equal(f.restores,0);
   if(!baseline){
    const before=f.requests.length;
    await f.start();
    await f.noise();
    await f.window.closetCloud.sync();
    assert.equal(f.requests.length,before,'reloaded pending error cannot redownload cloud originals');
    assert.equal((await f.marker()).remotePhotoPause.reason,reason);
   }
  }finally{f.close();}
 });
}
test('missing remote original recovers after owner deliberate Sync and repairs saved outfit atomically',async()=>{
 const f=await fixture({failure:'missing'});
 try{
  await f.start();assert.equal(f.restores,0);
  f.setFailure('valid');
  await f.manual();
  assert.equal(f.restores,1);
  assert.deepEqual((await f.items()).map(x=>x.id),['new-cloud-owner-item']);
  assert.equal((await f.items())[0].originalPhoto.image,url);
  assert.equal((await f.board()).saved[0].id,'new-cloud-outfit');
  assert.equal((await f.marker()).baseVersion,2);
  if(!baseline)assert.equal((await f.marker()).remotePhotoPause,null);
  assert.equal(f.status(),'Cloud backup up to date');
 }finally{f.close();}
});
test('SHA-tampered remote original re-p pauses if owner explicitly retries unchanged corrupted object',async()=>{
 const f=await fixture({failure:'corrupt'});
 try{
  await f.start();const before=f.requests.length;
  await f.manual();
  assert.ok(f.requests.length>before);
  assert.equal((await f.items())[0].id,'private-old-item');
  assert.equal((await f.marker()).baseVersion,1);
  if(!baseline){
   assert.equal((await f.marker()).remotePhotoPause.reason,'REMOTE_PHOTO_INTEGRITY');
   assert.equal(f.timers.filter(ms=>ms<20000).length,0);
  }
 }finally{f.close();}
});
test('transient remote photo HTTP 503 keeps connectivity backoff, never persists integrity pause',async()=>{
 const f=await fixture({failure:'offline'});
 try{
  await f.start();
  assert.match(f.status(),/Cloud connection unavailable/);
  assert.equal((await f.marker()).remotePhotoPause,undefined);
  assert.ok(f.timers.filter(ms=>ms<20000).length>0);
  f.setFailure('valid');
  await f.window.closetCloud.sync();
  assert.equal((await f.marker()).baseVersion,2);
  assert.equal(f.status(),'Cloud backup up to date');
 }finally{f.close();}
});
test('separate signed owner restore cannot inherit another owner local remote-photo integrity pause',async()=>{
 const a=await fixture({failure:'missing'}),b=await fixture({failure:'valid'});
 try{
  await a.start();await b.start();
  assert.equal((await a.items())[0].id,'private-old-item');
  assert.equal((await b.items())[0].id,'new-cloud-owner-item');
  assert.equal((await b.marker()).baseVersion,2);
  assert.equal(b.status(),'Cloud backup up to date');
 }finally{a.close();b.close();}
});
