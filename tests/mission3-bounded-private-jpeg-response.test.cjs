'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const {indexedDB}=require('fake-indexeddb');
const {randomUUID,createHash,webcrypto}=require('node:crypto');
const source=fs.readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
const E=require('../public/cloud-backup-engine.js');
const jpeg=Buffer.from([255,216,255,224,0,16,80,72,79,84,79,255,217]);
const sha=createHash('sha256').update(jpeg).digest('hex');
const photo='data:image/jpeg;base64,'+jpeg.toString('base64');
const max=8388608;
const okJson=value=>({status:200,ok:true,json:async()=>value});

async function ownerDB(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,2);
  r.onupgradeneeded=()=>{r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});};
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
const read=(db,store,key)=>new Promise((resolve,reject)=>{
 const r=db.transaction(store).objectStore(store).get(key);
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
const items=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('items').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
async function seed(db,owner,dirty){
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['state','items'],'readwrite');
  tx.objectStore('items').put({id:'original-local-owner',ownerId:owner,
   category:'Tops',color:'Red',image:photo,sourceSHA256:sha,
   sourceHashVerified:true,originalPhoto:{image:photo,sha256:sha}});
  tx.objectStore('state').put({id:'cloud-sync',baseVersion:dirty?0:1,
   baseDocument:{schemaVersion:1,items:[],state:{}},dirty:!!dirty,localRevision:6});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
}
async function fixture({variant='over',dirty=false}={}){
 const owner=randomUUID(),db=await ownerDB(owner);
 await seed(db,owner,dirty);
 const ref='closet-photo:'+owner+'/'+sha+'.jpg';
 const remote={revision:2,document:{schemaVersion:1,items:[{id:'remote-owner-photo',
  ownerId:owner,category:'Tops',color:'Navy',image:ref,sourceSHA256:sha,
  sourceHashVerified:true,originalPhoto:{image:ref,sha256:sha}}],state:{}}};
 const stats={bodyReaders:0,readerReads:0,cancelled:0,arrayBufferCalls:0,storageGets:0,
  storagePosts:0,saveRPCs:0};
 let repaired=variant==='good';
 const events=new Map(),elements=new Map();
 const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',onclick:null});
  return elements.get(id);};
 const window={ClosetBackupEngine:E,closetAuth:{user:{id:owner},
  getAccessToken:async()=>owner,assertCurrent(){}},
  addEventListener(name,fn){events.set(name,fn)}};
 const streamResponse=()=>{
  const effective=repaired?'good':variant;
  const oversized=Buffer.allocUnsafe(max);
  const chunks=effective==='good'?[jpeg.subarray(0,4),jpeg.subarray(4)]:
   [jpeg.subarray(0,4),oversized,Buffer.from([1])];
  let at=0;
  const body={
   getReader(){stats.bodyReaders++;return {
    async read(){stats.readerReads++;return at<chunks.length?
     {done:false,value:chunks[at++]}:{done:true};},
    async cancel(){stats.cancelled++;at=chunks.length;},
    releaseLock(){}
   };},
   async cancel(){stats.cancelled++;}
  };
  return {status:200,ok:true,
   headers:{get(name){return name==='content-length'&&effective==='header'?String(max+1):null;}},
   body,async arrayBuffer(){stats.arrayBufferCalls++;
    throw Error('unbounded response.arrayBuffer must not be used on browser streams');}
  };
 };
 const fetch=async(url,opts={})=>{
  const u=new URL(url),path=u.pathname,method=opts.method||'GET';
  if(path==='/rest/v1/closet_backups'){
   return okJson(dirty?[]:[u.searchParams.get('select')==='revision'
    ?{revision:remote.revision}:remote]);
  }
  if(path==='/rest/v1/rpc/save_closet_backup'){
   stats.saveRPCs++;return okJson(1);
  }
  if(path.startsWith('/storage/v1/object/closet-private/')){
   assert.equal(path.slice('/storage/v1/object/closet-private/'.length),owner+'/'+sha+'.jpg');
   if(method==='POST'){
    stats.storagePosts++;return {status:409,ok:false};
   }
   stats.storageGets++;return streamResponse();
  }
  throw Error('Unexpected cloud API '+path);
 };
 vm.runInNewContext(source,{window,document:{getElementById:el},
  navigator:{storage:{persist:async()=>true}},location:{hostname:'localhost',search:''},
  URL,URLSearchParams,fetch,crypto:webcrypto,Uint8Array,atob,btoa,AbortController,console,
  setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>0});
 return {db,owner,stats,window,start:()=>window.closetCloud.start(db,
  {capture:work=>work(),canRestore:()=>true,async restored(){}}),
  get status(){return el('cloudStatus').textContent;},
  marker:()=>read(db,'state','cloud-sync'),items:()=>items(db),
  manual:()=>el('syncCloset').onclick(),
  repair(){repaired=true;},
  close(){events.get('pagehide')?.();db.close();}
 };
}
test('verified parent buffered private storage responses before checking maximum',()=>{
 if(baseline){
  assert.match(source,/new Uint8Array\(await response\.arrayBuffer\(\)\)/);
  assert.match(source,/new Uint8Array\(await existing\.arrayBuffer\(\)\)/);
 }else{
  assert.match(source,/readBoundedPrivateJPEG/);
  assert.doesNotMatch(source,/new Uint8Array\(await response\.arrayBuffer\(\)\)/);
  assert.doesNotMatch(source,/new Uint8Array\(await existing\.arrayBuffer\(\)\)/);
 }
});
test('oversized chunked private JPEG is cancelled before cloud restore; original survives and owner can retry',async()=>{
 if(baseline)return;
 const f=await fixture({variant:'over'});
 try{
  await f.start();
  assert.match(f.status,/Cloud photograph integrity check failed/);
  assert.equal(f.stats.arrayBufferCalls,0);
  assert.equal(f.stats.storageGets,1);
  assert.ok(f.stats.cancelled>=1,'excess stream must be cancelled');
  assert.ok(f.stats.readerReads<=2,'must not read remainder after cap');
  assert.equal((await f.items())[0].id,'original-local-owner');
  assert.equal((await f.marker()).baseVersion,1);
  assert.equal((await f.marker()).integrityPause,true);
  f.repair();await f.manual();
  assert.equal((await f.marker()).baseVersion,2);
  assert.equal((await f.marker()).integrityPause,false);
  assert.equal((await f.items())[0].id,'remote-owner-photo');
  assert.equal(createHash('sha256').update(Buffer.from((await f.items())[0].image.split(',')[1],'base64')).digest('hex'),sha);
 }finally{f.close();}
});
test('Content-Length over 8 MiB prevents any stream reader creation',async()=>{
 if(baseline)return;
 const f=await fixture({variant:'header'});
 try{
  await f.start();
  assert.match(f.status,/Cloud photograph integrity check failed/);
  assert.equal(f.stats.bodyReaders,0);
  assert.equal(f.stats.readerReads,0);
  assert.equal(f.stats.arrayBufferCalls,0);
  assert.ok(f.stats.cancelled>=1);
  assert.equal((await f.items())[0].id,'original-local-owner');
  assert.equal((await f.marker()).integrityPause,true);
 }finally{f.close();}
});
test('conflicting immutable upload reads already-stored object through bounded stream and never publishes oversized source',async()=>{
 if(baseline)return;
 const f=await fixture({variant:'over',dirty:true});
 try{
  await f.start();
  assert.ok(f.stats.storagePosts>=1,'must exercise existing SHA-object collision');
  assert.equal(f.stats.storageGets,1);
  assert.equal(f.stats.arrayBufferCalls,0);
  assert.ok(f.stats.cancelled>=1);
  assert.equal(f.stats.saveRPCs,0);
  assert.equal((await f.items())[0].id,'original-local-owner');
  assert.equal((await f.marker()).dirty,true);
  assert.equal((await f.marker()).integrityPause,true);
 }finally{f.close();}
});
test('valid SHA-bound streamed JPEG accepted across multiple small chunks without full arrayBuffer clone',async()=>{
 const f=await fixture({variant:'good'});
 try{
  await f.start();
  assert.equal(f.status,'Cloud backup up to date');
  assert.equal(f.stats.arrayBufferCalls,0);
  assert.equal(f.stats.readerReads>=2,true);
  assert.equal((await f.marker()).baseVersion,2);
  assert.equal((await f.items())[0].id,'remote-owner-photo');
 }finally{f.close();}
});
