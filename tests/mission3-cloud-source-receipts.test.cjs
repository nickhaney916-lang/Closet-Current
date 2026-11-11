'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const {randomUUID,createHash,webcrypto}=require('node:crypto');
const {indexedDB}=require('fake-indexeddb');
const original=Buffer.from([255,216,255,224,0,16,79,82,73,71,73,78,65,76,255,217]);
const cutout=Buffer.from([255,216,255,224,0,16,67,85,84,79,85,84,33,33,255,217]);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalSHA=sha(original),cutoutSHA=sha(cutout),data=b=>'data:image/jpeg;base64,'+b.toString('base64');
const engine=require('../public/cloud-backup-engine.js');
const source=fs.readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
const response=(value,bytes)=>({
 ok:true,status:200,json:async()=>value,
 arrayBuffer:async()=>bytes?.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)
});
function garment(owner,refs=false){
 const ref=(b,h)=>refs?'closet-photo:'+owner+'/'+h+'.jpg':data(b);
 return {id:'source-reviewed-shirt',ownerId:owner,category:'Tops',itemType:'T-shirt',
  color:'Blue',image:ref(cutout,cutoutSHA),
  sourceSHA256:originalSHA,sourceHashVerified:true,
  originalPhoto:{image:ref(original,originalSHA),sha256:originalSHA},
  cutoutSHA256,
  segmentHint:{verified:true,ownerReviewedInstance:true,
   originalSHA256:originalSHA,cutoutSHA256,
   cutoutImage:ref(cutout,cutoutSHA)}
 };
}
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
async function add(db,value){
 await new Promise((resolve,reject)=>{
  const tx=db.transaction('items','readwrite');tx.objectStore('items').put(value);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
}
async function read(db){
 return new Promise((resolve,reject)=>{
  const r=db.transaction('items').objectStore('items').getAll();
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function fixture({remote=null,local=null}={}){
 const owner=randomUUID(),db=await open(owner),requests=[],events=new Map();
 const refs=new Map([[owner+'/'+originalSHA+'.jpg',original],
                      [owner+'/'+cutoutSHA+'.jpg',cutout]]);
 if(local)await add(db,local(owner));
 const window={ClosetBackupEngine:engine,closetAuth:{
  user:{id:owner},assertCurrent(){},getAccessToken:async()=> 'synthetic-not-signed-'+owner
 },addEventListener(name,fn){events.set(name,fn);}};
 let stored=remote?{revision:1,document:remote(owner)}:null;
 const fetch=async(url,options={})=>{
  const verb=options.method||'GET',path=new URL(url).pathname;
  requests.push({verb,path});
  if(path==='/rest/v1/closet_backups'){
   const requested=new URL(url).searchParams.get('owner_id');
   assert.equal(requested,'eq.'+owner);return response(stored?[stored]:[]);
  }
  if(path==='/rest/v1/rpc/save_closet_backup'){
   const body=JSON.parse(options.body);
   assert.equal(body.p_expected_revision,stored?.revision||0);
   stored={revision:(stored?.revision||0)+1,document:body.p_document};
   return response(stored.revision);
  }
  const prefix='/storage/v1/object/closet-private/';
  if(path.startsWith(prefix)){
   const key=path.slice(prefix.length);
   assert.ok(key.startsWith(owner+'/'));
   if(verb==='POST'){
    const b=Buffer.from(options.body);refs.set(key,b);return response({});
   }
   assert.ok(refs.has(key),'missing synthetic private JPEG');
   return response({},refs.get(key));
  }
  throw Error('Unexpected synthetic endpoint '+path);
 };
 vm.runInNewContext(source,{window,location:{hostname:'localhost',search:''},navigator:{
  storage:{persist:async()=>true}
 },document:{getElementById:()=>null},fetch,URL,URLSearchParams,crypto:webcrypto,
  Uint8Array,atob,btoa,AbortController,setTimeout:()=>0,clearTimeout:()=>{},
  setInterval:()=>0,console});
 return {owner,db,window,requests,refs,
  get remote(){return stored;},
  start:()=>window.closetCloud.start(db,{capture:work=>work(),canRestore:()=>true,async restored(){}}),
  rows:()=>read(db),
  close(){events.get('pagehide')?.();db.close();}
 };
}
const published=f=>f.requests.some(x=>x.path==='/rest/v1/rpc/save_closet_backup');
const writes=f=>f.requests.filter(x=>x.verb==='POST'&&x.path.includes('/storage/v1/object/'));

test('valid source + reviewed cutout upload content-addressed owner-private objects and preserve receipts',async()=>{
 const f=await fixture({local:owner=>garment(owner)});
 try{
  await f.start();assert.equal((await f.rows()).length,1);
  assert.ok(published(f),'valid original should publish');
  assert.equal(writes(f).length,2);
  const doc=f.remote.document.items[0];
  assert.equal(doc.sourceSHA256,originalSHA);
  assert.equal(doc.originalPhoto.sha256,originalSHA);
  assert.equal(doc.segmentHint.cutoutSHA256,cutoutSHA);
  assert.equal(doc.originalPhoto.image,'closet-photo:'+f.owner+'/'+originalSHA+'.jpg');
  assert.equal(doc.segmentHint.cutoutImage,'closet-photo:'+f.owner+'/'+cutoutSHA+'.jpg');
 }finally{f.close();}
});

test('locally tampered original-JPEG receipt cannot publish a claimed verified cloud backup',async()=>{
 const f=await fixture({local:owner=>{
  const row=garment(owner);
  row.originalPhoto.sha256='0'.repeat(64);row.sourceSHA256='0'.repeat(64);
  row.segmentHint.originalSHA256='0'.repeat(64);
  return row;
 }});
 try{
  await f.start();
  assert.equal(published(f),baseline);
  if(!baseline)assert.equal(writes(f).length,0,'must fail before first photo upload');
  assert.equal((await f.rows())[0].originalPhoto.sha256,'0'.repeat(64),
   'failed sync must not rewrite or erase local evidence');
 }finally{f.close();}
});

test('locally altered reviewed cutout cannot publish a conflicting cutout receipt',async()=>{
 const f=await fixture({local:owner=>{
  const row=garment(owner);
  row.cutoutSHA256='f'.repeat(64);row.segmentHint.cutoutSHA256=row.cutoutSHA256;
  return row;
 }});
 try{
  await f.start();
  assert.equal(published(f),baseline);
  if(!baseline)assert.equal(writes(f).length,0,'must not upload incomplete partial backup');
  assert.equal((await f.rows()).length,1);
 }finally{f.close();}
});

test('incoming original JPEG with valid Storage object but false source SHA is refused before local mutation',async()=>{
 const f=await fixture({remote:owner=>{
  const row=garment(owner,true);
  row.sourceSHA256='0'.repeat(64);row.originalPhoto.sha256='0'.repeat(64);
  row.segmentHint.originalSHA256='0'.repeat(64);
  return {schemaVersion:1,items:[row],state:{}};
 }});
 try{
  await f.start();
  assert.equal((await f.rows()).length,baseline?1:0);
  assert.equal(published(f),false);
 }finally{f.close();}
});

test('source SHA and original photo receipt mismatch rejects even with unaltered JPEG bytes',async()=>{
 const f=await fixture({local:owner=>{
  const row=garment(owner);
  row.sourceSHA256='a'.repeat(64);
  return row;
 }});
 try{
  await f.start();assert.equal(published(f),baseline);
  assert.equal((await f.rows()).length,1);
 }finally{f.close();}
});

test('unverified old photo without claimed SHA remains recoverable without fabricated verification',async()=>{
 const f=await fixture({local:owner=>({
  id:'legacy-untested',ownerId:owner,image:data(original),
  category:'Tops',color:'Blue',sourceHashVerified:false
 })});
 try{
  await f.start();
  assert.equal(published(f),true);
  assert.equal(f.remote.document.items[0].sourceHashVerified,false);
  assert.equal((await f.rows()).length,1);
 }finally{f.close();}
});
