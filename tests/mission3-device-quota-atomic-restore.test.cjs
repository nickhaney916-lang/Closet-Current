'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {indexedDB,IDBObjectStore}=require('fake-indexeddb');
const {randomUUID,createHash,webcrypto}=require('node:crypto');
const source=fs.readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
const E=require('../public/cloud-backup-engine.js');
const photo=Buffer.from([255,216,255,224,0,16,82,69,83,84,79,82,69,255,217]);
const sha=createHash('sha256').update(photo).digest('hex');
const response=body=>({ok:true,status:200,json:async()=>body});
const storageError=()=>Object.assign(new Error('Synthetic device IndexedDB storage capacity exceeded'),{name:'QuotaExceededError'});
async function database(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,2);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function writeOld(db){
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  tx.objectStore('items').put({id:'old-local-photo',category:'Tops',color:'Red',
   image:'data:image/jpeg;base64,'+photo.toString('base64'),userAdjusted:true});
  tx.objectStore('state').put({id:'outfit-board',current:{slots:{top:'old-local-photo'}},
   saved:[{id:'old-outfit',name:'Original private outfit',slots:{top:'old-local-photo'}}]});
  tx.objectStore('state').put({id:'cloud-sync',baseVersion:1,
   baseDocument:{schemaVersion:1,items:[],state:{}},
   localRevision:7,dirty:false});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
const readOne=(db,store,key)=>new Promise((resolve,reject)=>{
 const r=db.transaction(store).objectStore(store).get(key);
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
const readAll=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('items').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
async function fixture(){
 const owner=randomUUID(),db=await database(owner);
 await writeOld(db);
 const ref='closet-photo:'+owner+'/'+sha+'.jpg';
 const garment=id=>({id,ownerId:owner,category:'Tops',color:'Navy',userAdjusted:true,
  image:ref,sourceSHA256:sha,sourceHashVerified:true,
  originalPhoto:{image:ref,sha256:sha}});
 const remote={revision:2,document:{
  schemaVersion:1,items:[garment('remote-one'),garment('remote-two')],
  state:{'outfit-board':{
   id:'outfit-board',current:{slots:{top:'remote-one'}},
   saved:[{id:'remote-outfit',name:'Restored owner outfit',slots:{top:'remote-one'}}]
  }}
 }};
 const events=new Map(),elements=new Map(),requests=[],scheduled=[];
 const elem=id=>{if(!elements.has(id))elements.set(id,{textContent:'',hidden:false,onclick:null});return elements.get(id)};
 const window={ClosetBackupEngine:E,closetAuth:{
  user:{id:owner},assertCurrent(){},getAccessToken:async()=> 'synthetic-owner-'+owner
 },addEventListener(name,fn){events.set(name,fn)}};
 const fetch=async(url,opts={})=>{
  const parsed=new URL(url),method=opts.method||'GET';requests.push({path:parsed.pathname,method});
  if(parsed.pathname==='/rest/v1/closet_backups'){
   assert.equal(parsed.searchParams.get('owner_id'),'eq.'+owner);
   return response([remote]);
  }
  const prefix='/storage/v1/object/closet-private/';
  if(parsed.pathname.startsWith(prefix)){
   assert.equal(method,'GET');
   assert.equal(parsed.pathname.slice(prefix.length),owner+'/'+sha+'.jpg');
   return {...response({}),arrayBuffer:async()=>photo.buffer.slice(photo.byteOffset,photo.byteOffset+photo.length)};
  }
  throw Error('Unexpected synthetic cloud endpoint '+parsed.pathname);
 };
 vm.runInNewContext(source,{window,document:{getElementById:elem},
  location:{hostname:'localhost',search:''},navigator:{storage:{persist:async()=>true}},
  fetch,URL,URLSearchParams,crypto:webcrypto,Uint8Array,atob,btoa,AbortController,console,
  setTimeout:(fn,ms)=>{scheduled.push(ms);return scheduled.length;},
  clearTimeout:()=>{},setInterval:()=>0});
 return {db,owner,window,events,requests,scheduled,status:()=>elem('cloudStatus').textContent,
  rows:()=>readAll(db),marker:()=>readOne(db,'state','cloud-sync'),
  board:()=>readOne(db,'state','outfit-board'),
  start:()=>window.closetCloud.start(db,{capture:fn=>fn(),canRestore:()=>true,async restored(){}}),
  manual:()=>elem('syncCloset').onclick(),
  async autoEvents(){await events.get('online')?.();await events.get('focus')?.();window.closetCloud.changed();},
  close(){events.get('pagehide')?.();db.close();}
 };
}
async function withQuota(throwFor,exercise){
 const original=IDBObjectStore.prototype.put;
 let injected=0,enabled=true;
 IDBObjectStore.prototype.put=function(value,...rest){
  if(enabled&&throwFor(this.name,value)){
   injected++;
   throw storageError();
  }
  return original.call(this,value,...rest);
 };
 try{return await exercise({
  get injected(){return injected;},
  recover(){enabled=false;}
 });}
 finally{IDBObjectStore.prototype.put=original;}
}
test('verified parent lacks explicit quota abort and device-storage pause; repair installs both',()=>{
 if(baseline){
  assert.doesNotMatch(source,/restoreError=null/);
  assert.doesNotMatch(source,/pausedDeviceStorage/);
 }else{
  assert.match(source,/restoreError=null/);
  assert.match(source,/pausedDeviceStorage=true/);
  assert.match(source,/tx\.abort\(\)/);
 }
});
test('quota during first restored garment put leaves exact original wardrobe and saved outfit atomic',async()=>{
 if(baseline)return; // older asynchronous event handler threw uncaught in fake-indexeddb
 const f=await fixture();
 try{
  await withQuota((store,row)=>store==='items'&&row?.id==='remote-one',async guard=>{
   await f.start();
   assert.ok(guard.injected>0,'synthetic IndexedDB quota must be exercised');
   assert.match(f.status(),/Device storage is full/);
   assert.equal((await f.rows()).length,1);
   assert.equal((await f.rows())[0].id,'old-local-photo');
   assert.equal((await f.board()).saved[0].id,'old-outfit');
   const marker=await f.marker();
   assert.equal(marker.baseVersion,1);
   assert.equal(marker.localRevision,7);
   assert.equal(marker.dirty,false);
   const before=f.requests.length;
   await f.window.closetCloud.sync();await f.autoEvents();
   assert.equal(f.requests.length,before,'known local quota failure must not repeatedly redownload photos');
   assert.ok(f.scheduled.length<=1);
   guard.recover();await f.manual();
   assert.deepEqual((await f.rows()).map(row=>row.id),['remote-one','remote-two']);
   assert.equal((await f.board()).saved[0].id,'remote-outfit');
   assert.equal((await f.marker()).baseVersion,2);
   assert.equal(f.status(),'Cloud backup up to date');
  });
 }finally{f.close();}
});
test('quota on final cloud revision marker after garment inserts aborts ALL item/outfit changes',async()=>{
 if(baseline)return;
 const f=await fixture();
 try{
  await withQuota((store,row)=>store==='state'&&row?.id==='cloud-sync'&&row.baseVersion===2,async guard=>{
   await f.start();
   assert.equal(guard.injected,1,'synthetic quota hits the final revision put');
   assert.equal((await f.rows())[0].id,'old-local-photo');
   assert.equal((await f.board()).saved[0].id,'old-outfit');
   assert.equal((await f.marker()).baseVersion,1);
   assert.match(f.status(),/Device storage is full/);
   guard.recover();await f.manual();
   assert.deepEqual((await f.rows()).map(row=>row.id),['remote-one','remote-two']);
   assert.equal((await f.board()).saved[0].id,'remote-outfit');
   assert.equal((await f.marker()).baseVersion,2);
  });
 }finally{f.close();}
});
test('successful restore with no quota errors retains SHA-verifiable originals and same owner revision',async()=>{
 const f=await fixture();
 try{
  await f.start();
  const rows=await f.rows();
  assert.equal(rows.length,2);
  for(const row of rows){
   assert.equal(row.sourceSHA256,sha);
   assert.ok(row.originalPhoto.image.startsWith('data:image/jpeg;base64,'));
   assert.equal(createHash('sha256').update(Buffer.from(row.originalPhoto.image.split(',')[1],'base64')).digest('hex'),sha);
  }
  assert.equal((await f.board()).saved[0].id,'remote-outfit');
  assert.equal((await f.marker()).baseVersion,2);
  assert.equal(f.status(),'Cloud backup up to date');
 }finally{f.close();}
});
