'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {indexedDB}=require('fake-indexeddb');
const {createHash,randomUUID,webcrypto}=require('node:crypto');
const root=process.env.CLOUD_SOURCE_ROOT||'.';
const baseline=process.env.EXPECT_BASELINE==='1';
const source=fs.readFileSync(root+'/public/cloud-backup.js','utf8');
const engineText=fs.readFileSync(root+'/public/cloud-backup-engine.js','utf8');
const engineContext={module:{exports:{}}};vm.runInNewContext(engineText,engineContext);
const E=engineContext.module.exports;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const bytesFor=n=>Buffer.from([255,216,255,224,0,16,...Buffer.from('private-'+n),255,217]);
const resp=(body,bytes)=>({ok:true,status:200,json:async()=>body,
 arrayBuffer:async()=>bytes?.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {resolve,promise};};

test('parent decode held an unbounded Map; replacement has explicit bounded private photo cache',()=>{
 if(baseline){
  assert.match(source,/async function decode\([\s\S]*?const photos=new Map\(\);return E\.mapImages/);
  assert.equal(typeof E.createPhotoCache,'undefined');
 }else{
  assert.match(source,/async function decode\([\s\S]*?E\.createPhotoCache\(8\)/);
  assert.equal(typeof E.createPhotoCache,'function');
  assert.throws(()=>E.createPhotoCache(0));
  assert.throws(()=>E.createPhotoCache(33));
 }
});
test('concurrent requests for identical protected photo share exactly one pending download',async()=>{
 if(baseline)return;
 const c=E.createPhotoCache(8),gate=deferred();let reads=0;
 const fetcher=()=>{reads++;return gate.promise};
 const a=c.get('owner/sha1',fetcher),b=c.get('owner/sha1',fetcher);
 assert.equal(a,b);assert.equal(c.size(),1);
 gate.resolve('data:image/jpeg;base64,PHOTODATA');
 assert.equal(await a,'data:image/jpeg;base64,PHOTODATA');
 assert.equal(await b,await a);assert.equal(reads,1);
});

test('1,000 unique JPEGs cannot retain an unbounded second map of decoded photo promises',async()=>{
 if(baseline)return;
 const c=E.createPhotoCache(8);let max=0,reads=0;
 for(let i=0;i<1000;i++){
  const result=await c.get('owner/private-'+i,async()=>{reads++;return 'jpeg-'+i;});
  assert.equal(result,'jpeg-'+i);
  max=Math.max(max,c.size());
 }
 assert.equal(reads,1000);assert.equal(max,8);assert.equal(c.size(),8);
 assert.equal(await c.get('owner/private-999',()=>{throw Error('should reuse recent photo');}),'jpeg-999');
 assert.equal(reads,1000);
 assert.equal(await c.get('owner/private-0',async()=>{reads++;return 'jpeg-0';}),'jpeg-0');
 assert.equal(reads,1001,'oldest private photo is released from cache and safely re-fetchable');
});

test('failed owner-private JPEG read is evicted, retrying succeeds and no error is cached forever',async()=>{
 if(baseline)return;
 const c=E.createPhotoCache(8);
 await assert.rejects(c.get('owner/photo',async()=>{throw Error('temporary network fault');}),/fault/);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(c.size(),0);
 assert.equal(await c.get('owner/photo',async()=> 'recovered-jpeg'),'recovered-jpeg');
 assert.equal(c.size(),1);
});

test('array traversal keeps 1,000 original/cutout fields in order with bounded reusable photo cache',async()=>{
 if(baseline)return;
 const c=E.createPhotoCache(8),pieces=Array.from({length:1000},(_,i)=>({
  id:'garment-'+i,image:'owner/image-'+i,originalPhoto:{image:'owner/image-'+i},
  segmentHint:{cutoutImage:'owner/cutout-'+i}
 }));
 const mapped=await E.mapImages({schemaVersion:1,items:pieces,state:{}},
  image=>c.get(image,async()=> 'decoded:'+image));
 assert.equal(mapped.items.length,1000);
 assert.equal(c.size(),8);
 assert.equal(mapped.items[0].originalPhoto.image,'decoded:owner/image-0');
 assert.equal(mapped.items[999].segmentHint.cutoutImage,'decoded:owner/cutout-999');
 assert.equal(pieces[0].image,'owner/image-0');
});

async function opened(owner){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+owner,2);
  req.onupgradeneeded=()=>{
   req.result.createObjectStore('items',{keyPath:'id'});
   req.result.createObjectStore('state',{keyPath:'id'});
  };
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
}
async function all(db){
 return new Promise((resolve,reject)=>{
  const req=db.transaction('items').objectStore('items').getAll();
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
}

test('real legacy cloud controller restores 64 original JPEGs, retaining owner SHA and exact saved order',async()=>{
 const owner=randomUUID(),db=await opened(owner),refs=new Map(),rows=[],events=new Map();
 let photoReads=0;const readsByPath=new Map();
 for(let i=0;i<64;i++){
  const bytes=bytesFor(i),hash=sha(bytes),ref='closet-photo:'+owner+'/'+hash+'.jpg';
  refs.set(owner+'/'+hash+'.jpg',bytes);
  rows.push({id:'item-'+i,ownerId:owner,category:'Tops',color:'Blue',
   sourceHashVerified:true,sourceSHA256:hash,
   image:ref,originalPhoto:{image:ref,sha256:hash}});
 }
 const auth={user:{id:owner},assertCurrent(){},getAccessToken:async()=> 'synthetic-not-signed'};
 const window={ClosetBackupEngine:E,closetAuth:auth,addEventListener:(name,fn)=>events.set(name,fn)};
 const fetch=async(url,options={})=>{
  const parsed=new URL(url);
  if(parsed.pathname==='/rest/v1/closet_backups')return resp([{
   revision:1,document:{schemaVersion:1,items:rows,state:{}}
  }]);
  const prefix='/storage/v1/object/closet-private/';
  if(parsed.pathname.startsWith(prefix)){
   const key=parsed.pathname.slice(prefix.length);
   assert.ok(refs.has(key),'foreign or unrecognized private JPEG');
   assert.equal(options.method||'GET','GET');photoReads++;readsByPath.set(key,(readsByPath.get(key)||0)+1);
   return resp({},refs.get(key));
  }
  throw Error('Unexpected private cloud request '+parsed.pathname);
 };
 vm.runInNewContext(source,{window,document:{getElementById:()=>null},
  location:{hostname:'localhost',search:''},navigator:{storage:{persist:async()=>true}},
  crypto:webcrypto,URL,URLSearchParams,fetch,AbortController,Uint8Array,atob,btoa,
  setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>{},console});
 try{
  await window.closetCloud.start(db,{capture:work=>work(),canRestore:()=>true,async restored(){}});
  const values=await all(db);
  assert.equal(values.length,64);
   // This eight-entry LRU is intentionally bounded, so under concurrent
   // four-worker traversal a recently decoded JPEG may be evicted before
   // its second field is visited. Each original is referenced exactly twice:
   // no private object should be read more than those two references.
   assert.equal(readsByPath.size,64,'all unique owner-private originals were fetched');
   assert.ok(photoReads>=64&&photoReads<=128,'LRU eviction cannot cause unbounded re-reads');
   for(const count of readsByPath.values())assert.ok(count===1||count===2);
  for(let i=0;i<64;i++){
   const item=values.find(x=>x.id==='item-'+i);
   assert.ok(item.image.startsWith('data:image/jpeg;base64,'));
   assert.equal(sha(Buffer.from(item.originalPhoto.image.split(',')[1],'base64')),item.sourceSHA256);
  }
 }finally{events.get('pagehide')?.();db.close();}
});
