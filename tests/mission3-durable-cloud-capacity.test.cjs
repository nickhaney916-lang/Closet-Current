'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),vm=require('node:vm');
const {randomUUID,webcrypto}=require('node:crypto');
const {indexedDB}=require('fake-indexeddb');
const E=require('../public/cloud-backup-engine.js');
const root=process.env.CLOUD_SOURCE_ROOT||'.';
const old=process.env.EXPECT_BASELINE==='1';
const cloudSource=readFileSync(root+'/public/cloud-backup.js','utf8');
const img='data:image/jpeg;base64,'+Buffer.from([255,216,255,224,0,16,68,85,82,65,66,76,69,255,217]).toString('base64');
const reply=(body,status=200)=>({status,ok:status>=200&&status<300,json:async()=>body});
const stateValue=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('state').objectStore('state').get('cloud-sync');
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
const itemsValue=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('items').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
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
async function ownerFixture(code=413){
 const owner=randomUUID(),db=await open(owner),requests=[],objects=new Map();
 const tx=db.transaction(['items','state'],'readwrite');
 for(let i=0;i<6;i++)tx.objectStore('items').put({
  id:'owner-'+i,ownerId:owner,category:'Tops',itemType:'T-shirt',
  color:'Navy',name:'Private item '+i,image:img,
  originalPhoto:{image:img},userAdjusted:true
 });
 tx.objectStore('state').put({id:'cloud-sync',baseVersion:0,localRevision:1,
  baseDocument:null,dirty:true});
 await new Promise((resolve,reject)=>{
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
 let serverStatus=code,revision=0,doc=null;
 const transport=async(url,options={})=>{
  const endpoint=new URL(url),method=options.method||'GET';
  requests.push({path:endpoint.pathname,method});
  if(endpoint.pathname==='/rest/v1/closet_backups'){
   assert.equal(endpoint.searchParams.get('owner_id'),'eq.'+owner);
   return reply(revision?[{revision,document:doc}]:[]);
  }
  if(endpoint.pathname==='/rest/v1/rpc/save_closet_backup'){
   assert.equal(method,'POST');
   doc=JSON.parse(options.body).p_document;revision++;
   return reply(revision);
  }
  const prefix='/storage/v1/object/closet-private/';
  if(endpoint.pathname.startsWith(prefix)){
   const path=endpoint.pathname.slice(prefix.length);
   assert.ok(path.startsWith(owner+'/'),'foreign photo path');
   if(method==='POST'){
    if(serverStatus)return reply({},serverStatus);
    if(objects.has(path))return reply({},409);
    objects.set(path,Buffer.from(options.body));return reply({});
   }
   const bytes=objects.get(path);
   if(!bytes)return reply({},404);
   return {...reply({}),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length)};
  }
  throw Error('Unexpected synthetic endpoint '+endpoint.pathname);
 };
 async function page(){
  const events=new Map(),timers=[],els=new Map();
  const node=id=>{
   if(!els.has(id))els.set(id,{hidden:false,textContent:'',onclick:null});
   return els.get(id);
  };
  const auth={user:{id:owner},assertCurrent(){},getAccessToken:async()=> 'synthetic-token'};
  const window={ClosetBackupEngine:E,closetAuth:auth,addEventListener(name,fn){events.set(name,fn)}};
  vm.runInNewContext(cloudSource,{window,
   document:{getElementById:node},location:{hostname:'localhost',search:''},
   navigator:{storage:{persist:async()=>true}},fetch:transport,URL,URLSearchParams,
   crypto:webcrypto,Uint8Array,atob,btoa,AbortController,console,
   setTimeout:(fn,ms)=>{timers.push(ms);return timers.length;},
   clearTimeout:()=>{},setInterval:()=>0
  });
  return {
   auth,window,timers,events,
   status:()=>node('cloudStatus').textContent,
   start:()=>window.closetCloud.start(db,{capture:work=>work(),canRestore:()=>true,async restored(){}}),
   manual:()=>node('syncCloset').onclick?.(),
   close:()=>events.get('pagehide')?.(),
   async trigger(){await events.get('online')?.();await events.get('focus')?.();window.closetCloud.changed();}
  };
 }
 return {owner,db,requests,objects,page,
  setFailure:value=>serverStatus=value,
  get revision(){return revision;},
  postCount:()=>requests.filter(x=>x.method==='POST'&&x.path.startsWith('/storage/')).length,
  snapshot:()=>itemsValue(db),
  marker:()=>stateValue(db),
  close:()=>db.close()
 };
}

test('413 paused upload survives full tab recreation without an automatic network read or new original JPEG upload',async()=>{
 const f=await ownerFixture(413);
 try{
  const first=await f.page();await first.start();
  assert.equal(f.revision,0);
  assert.match(first.status(),/too large/);
  assert.equal((await f.snapshot()).length,6);
  const marker=await f.marker();
  if(old)assert.equal(marker.capacityPause,undefined);
  else assert.equal(marker.capacityPause,413);
  first.close();
  const before=f.requests.length,posts=f.postCount();
  const second=await f.page();await second.start();
  if(old){
   assert.ok(f.requests.length>before,'old controller must retry after a reload');
  }else{
   assert.equal(f.requests.length,before,'durable pause forbids any network request after reload');
   assert.equal(f.postCount(),posts);
   assert.match(second.status(),/too large/);
   assert.equal((await f.marker()).capacityPause,413);
  }
  await second.trigger();
  if(!old)assert.equal(f.requests.length,before,'background online/focus cannot bypass restart pause');
  second.close();
 }finally{f.close();}
});

test('507 persisted capacity marker survives local new edits, then explicit Sync retries and clears it only after recovery',async()=>{
 const f=await ownerFixture(507);
 try{
  const first=await f.page();await first.start();first.close();
  const second=await f.page();await second.start();
  if(!old){
   assert.equal((await f.marker()).capacityPause,507);
   await second.window.closetCloud.beforeWrite(f.db);
   second.window.closetCloud.changed();
   assert.equal((await f.marker()).capacityPause,507);
   assert.match(second.status(),/capacity is full/);
   await second.manual();
   assert.equal((await f.marker()).capacityPause,507,
    'a failed manual retry must re-persist the capacity error');
   assert.equal(f.revision,0);
  }
  f.setFailure(null);
  await second.manual();
  assert.equal(f.revision,1);
  assert.equal((await f.snapshot()).length,6);
  const marker=await f.marker();
  assert.equal(marker.dirty,false);
  if(!old)assert.equal(marker.capacityPause,null);
  second.close();
  const third=await f.page();
  const before=f.requests.length,posts=f.postCount();
  await third.start();
  assert.ok(f.requests.length>before,'recovered owner may perform clean cloud revision check');
  assert.equal(f.postCount(),posts,'clean sync should not resend all original photos');
  assert.equal(third.status(),'Cloud backup up to date');
  third.close();
 }finally{f.close();}
});

test('persistent 413 block is scoped to exact owner IndexedDB; another signed owner can back up freely',async()=>{
 const a=await ownerFixture(413),b=await ownerFixture(null);
 try{
  const pageA=await a.page();await pageA.start();pageA.close();
  const pageB=await b.page();await pageB.start();
  assert.equal(b.revision,1,'owner B should publish to their independent cloud namespace');
  assert.equal((await b.snapshot()).length,6);
  assert.ok(b.objects.size>0);
  pageB.close();
  const before=a.requests.length;
  const again=await a.page();await again.start();
  if(!old)assert.equal(a.requests.length,before,'owner A remains blocked independently');
  assert.equal((await a.snapshot()).length,6);
  assert.equal(a.revision,0);
  again.close();
 }finally{a.close();b.close();}
});

test('temporary 503 never creates a durable capacity block and still recovers automatically',async()=>{
 const f=await ownerFixture(503);
 try{
  const first=await f.page();await first.start();
  assert.match(first.status(),/Retrying when connected/);
  const m=await f.marker();assert.ok(m.capacityPause==null);
  first.close();
  f.setFailure(null);
  const second=await f.page();await second.start();
  assert.equal(f.revision,1);
  assert.equal((await f.marker()).capacityPause==null,true);
  second.close();
 }finally{f.close();}
});
