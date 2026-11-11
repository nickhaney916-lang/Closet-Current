'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {indexedDB}=require('fake-indexeddb');
const {randomUUID,createHash,webcrypto}=require('node:crypto');
const root=process.env.CLOUD_SOURCE_ROOT||'.';
const baseline=process.env.EXPECT_BASELINE==='1';
const source=fs.readFileSync(root+'/public/cloud-backup.js','utf8');
const E=require('../public/cloud-backup-engine.js');
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
const toData=buffer=>'data:image/jpeg;base64,'+buffer.toString('base64');
const jpeg=(kind,n)=>Buffer.from([255,216,255,224,0,16,...Buffer.from(kind+':'+n.toString().padStart(4,'0')),255,217]);
const response=(value,bytes,status=200)=>({
 status,ok:status>=200&&status<300,json:async()=>value,
 arrayBuffer:async()=>bytes?.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length)
});
function photoRow(owner,i,kinds=32){
 const pair=i%kinds,original=jpeg('original',pair),cutout=jpeg('cutout',pair);
 const originalSHA=hash(original),cutoutSHA=hash(cutout);
 return {id:'private-clothing-'+i,ownerId:owner,category:'Tops',itemType:'T-shirt',
  color:'Navy',userAdjusted:true,sourceHashVerified:true,
  sourceSHA256:originalSHA,cutoutSHA256:cutoutSHA,
  image:toData(cutout),
  originalPhoto:{image:toData(original),sha256:originalSHA},
  segmentHint:{cutoutImage:toData(cutout),
   verified:true,ownerReviewedInstance:true,
   originalSHA256:originalSHA,cutoutSHA256:cutoutSHA}
 };
}
async function database(owner,items){
 const db=await new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+owner,2);
  req.onupgradeneeded=()=>{
   req.result.createObjectStore('items',{keyPath:'id'});
   req.result.createObjectStore('state',{keyPath:'id'});
  };
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  for(const item of items)tx.objectStore('items').put(item);
  tx.objectStore('state').put({id:'cloud-sync',baseVersion:0,baseDocument:null,
   dirty:true,localRevision:1});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
 return db;
}
async function readAll(db){
 return new Promise((resolve,reject)=>{
  const r=db.transaction('items').objectStore('items').getAll();
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function fixture({size=1,unique=1,failAt=0,digestDrift=false,interruptAt=0}={}){
 const owner=randomUUID(),rows=Array.from({length:size},(_,i)=>photoRow(owner,i,unique));
 const db=await database(owner,rows),events=new Map(),objects=new Map(),requests=[];
 let stored=null,postCount=0,maxPending=0,pending=0,digests=0,failurePending=failAt>0;
 let permission;
 const gate=interruptAt?new Promise(resolve=>permission=resolve):null;
 const blocking={resolve:()=>permission?.()};
 const auth={user:{id:owner},
  assertCurrent(){if(!this.user?.id)throw Error('Session expired');},
  getAccessToken:async()=> 'synthetic-private-test-token'
 };
 const window={ClosetBackupEngine:E,closetAuth:auth,addEventListener:(name,fn)=>events.set(name,fn)};
 const crypto=digestDrift?{randomUUID,subtle:{
  async digest(type,bytes){
   digests++;
   if(digests===2)return new Uint8Array(32).buffer;
   return webcrypto.subtle.digest(type,bytes);
  }
 }}:webcrypto;
 const fetch=async(url,options={})=>{
  const loc=new URL(url),verb=options.method||'GET';
  requests.push({path:loc.pathname,method:verb});
  if(loc.pathname==='/rest/v1/closet_backups'){
   assert.equal(loc.searchParams.get('owner_id'),'eq.'+owner);
   return response(stored?[stored]:[]);
  }
  if(loc.pathname==='/rest/v1/rpc/save_closet_backup'){
   assert.equal(verb,'POST');
   assert.equal(stored?.revision||0,JSON.parse(options.body).p_expected_revision);
   const body=JSON.parse(options.body);
   stored={revision:(stored?.revision||0)+1,document:body.p_document};
   return response(stored.revision);
  }
  const prefix='/storage/v1/object/closet-private/';
  if(loc.pathname.startsWith(prefix)){
   const key=loc.pathname.slice(prefix.length);
   assert.ok(key.startsWith(owner+'/'),'foreign owner path forbidden');
   if(verb==='POST'){
    pending++;maxPending=Math.max(maxPending,pending);postCount++;
    const bytes=Buffer.from(options.body);
    assert.equal(hash(bytes),key.split('/')[1].slice(0,-4),'original exact byte SHA');
    if(postCount===interruptAt&&gate)await gate;
    pending--;
    if(failurePending&&postCount===failAt){
     failurePending=false;return response({},undefined,503);
    }
    if(objects.has(key))return response({},undefined,409);
    objects.set(key,bytes);return response({key});
   }
   if(!objects.has(key))return response({},undefined,404);
   return response({},objects.get(key));
  }
  throw Error('Unexpected synthetic endpoint '+loc.pathname);
 };
 vm.runInNewContext(source,{
  window,location:{hostname:'localhost',search:''},
  navigator:{storage:{persist:async()=>true}},document:{getElementById:()=>null},
  crypto,fetch,URL,URLSearchParams,Uint8Array,atob,btoa,AbortController,
  setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,console
 });
 return {owner,rows,db,auth,window,blocking,requests,objects,
  get postCount(){return postCount;},get maxPending(){return maxPending;},
  get stored(){return stored;},
  start:()=>window.closetCloud.start(db,{capture:work=>work(),canRestore:()=>true,async restored(){}}),
  read:()=>readAll(db),
  close(){blocking.resolve();events.get('pagehide')?.();db.close();}
 };
}
test('parent retained all decoded private JPEG buffers; fixed manifest keeps only existing immutable data URL references',()=>{
 if(baseline){
  assert.match(source,/photos\.set\(path,bytes\)/);
  assert.match(source,/for\(const \[path,bytes\]of photos\)/);
 }else{
  assert.doesNotMatch(source,/photos\.set\(path,bytes\)/);
  assert.match(source,/photos\.set\(path,image\)/);
  assert.match(source,/for\(const \[path,image\]of photos\)/);
  assert.match(source,/if\(await hash\(bytes\)!==path\.split/);
 }
});
test('1,000 original/cutout wardrobes preserve every source and upload each SHA only once',async()=>{
 const f=await fixture({size:1000,unique:48});
 try{
  await f.start();
  assert.equal(f.stored.document.items.length,1000);
  assert.equal(f.objects.size,96,'48 originals plus 48 independently reviewed cutouts');
  assert.equal(f.postCount,96,'duplicate photo bytes are not uploaded repeatedly');
  assert.equal(f.maxPending,1,'only one decoded JPEG upload is in flight');
  assert.equal((await f.read()).length,1000);
  const saved=f.stored.document.items;
  for(const index of [0,47,500,999]){
   assert.equal(saved[index].id,'private-clothing-'+index);
   assert.equal(saved[index].sourceSHA256,f.rows[index].sourceSHA256);
   assert.equal(saved[index].originalPhoto.sha256,f.rows[index].originalPhoto.sha256);
   assert.equal(saved[index].segmentHint.cutoutSHA256,f.rows[index].cutoutSHA256);
   assert.ok(saved[index].image.startsWith('closet-photo:'+f.owner+'/'));
   assert.ok(saved[index].segmentHint.cutoutImage.startsWith('closet-photo:'+f.owner+'/'));
   assert.ok(saved[index].originalPhoto.image.startsWith('closet-photo:'+f.owner+'/'));
  }
  assert.equal(JSON.stringify(f.stored).includes('data:image'),false,
   'cloud JSON must not include original or reviewed cutout JPEG base64');
 }finally{f.close();}
});
test('a failed intermediate JPEG upload never publishes a partial backup; retry preserves the wardrobe',async()=>{
 const f=await fixture({size:12,unique:12,failAt:5});
 try{
  await f.start();
  assert.equal(f.stored,null);
  assert.equal((await f.read()).length,12);
  await f.window.closetCloud.sync();
  assert.ok(f.stored);
  assert.equal(f.stored.document.items.length,12);
  assert.equal(f.objects.size,24);
  assert.ok(f.postCount>24,'repeated objects are checked before eventual commit');
 }finally{f.close();}
});
test('changed digest at the upload boundary is detected before sending a private JPEG or publishing a revision',async()=>{
 const f=await fixture({size:1,unique:1,digestDrift:true});
 try{
  await f.start();
  if(baseline){
   assert.ok(f.stored,'legacy code failed to recheck the upload manifest digest');
   assert.ok(f.postCount>0);
  }else{
   assert.equal(f.stored,null,'tamper case must not publish a false cloud revision');
   assert.equal(f.postCount,0,'tamper case must fail before first JPEG upload');
  }
  assert.equal((await f.read()).length,1,'failed publish never deletes local photographs');
 }finally{f.close();}
});
test('owner account revocation while JPEG upload is suspended prevents any cloud revision',async()=>{
 const f=await fixture({size:2,unique:2,interruptAt:2});
 try{
  let pending=f.start();
  for(let i=0;i<100&&f.postCount<2;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.postCount,2);
  f.auth.user=null;f.blocking.resolve();
  await pending;
  assert.equal(f.stored,null);
  assert.equal((await f.read()).length,2);
 }finally{f.close();}
});
