'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const {randomUUID,createHash,webcrypto}=require('node:crypto');
const {indexedDB}=require('fake-indexeddb');
const root=process.env.CLOUD_SOURCE_ROOT||'.',baseline=process.env.EXPECT_BASELINE==='1';
const engineSource=readFileSync(root+'/public/cloud-backup-engine.js','utf8');
const cloudSource=readFileSync(root+'/public/cloud-backup.js','utf8');
const eContext={module:{exports:{}}};vm.runInNewContext(engineSource,eContext);
const E=eContext.module.exports;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const jpeg=tag=>Buffer.from([255,216,255,224,0,16,...Buffer.from(tag),255,217]);
const data=bytes=>'data:image/jpeg;base64,'+bytes.toString('base64');

test('large wardrobe photo queue is bounded and preserves every original/cutout in order',async()=>{
 const original=Array.from({length:64},(_,i)=>({id:'item-'+i,
  image:'garment-'+i,originalPhoto:{image:'original-'+i},
  segmentHint:{cutoutImage:'cutout-'+i,cutoutSHA256:'hash-'+i},
  category:'Tops',color:i%2?'Blue':'Red'}));
 let active=0,peak=0,calls=0;
 const mapped=await E.mapImages({schemaVersion:1,items:original,state:{}},async image=>{
  active++;calls++;peak=Math.max(peak,active);
  await new Promise(resolve=>setImmediate(resolve));
  active--;return 'private:'+image;
 });
 if(baseline){
  assert.ok(peak>4,'parent must expose unbounded image transformation');
  assert.equal(calls,128,'parent skips the reviewed cutout field');
  assert.equal(mapped.items[0].segmentHint.cutoutImage,'cutout-0');
 }else{
  assert.ok(peak>0&&peak<=4,'photo processing must have a strict global concurrency bound');
  assert.equal(calls,192,'64 item images + 64 originals + 64 reviewed cutouts');
  for(let i=0;i<64;i++){
   assert.equal(mapped.items[i].id,'item-'+i);
   assert.equal(mapped.items[i].image,'private:garment-'+i);
   assert.equal(mapped.items[i].originalPhoto.image,'private:original-'+i);
   assert.equal(mapped.items[i].segmentHint.cutoutImage,'private:cutout-'+i);
   assert.equal(original[i].segmentHint.cutoutImage,'cutout-'+i,'source must remain immutable');
  }
 }
});

test('maximum 1,000-piece photo map has no lost IDs and rejects prototype pollution',async()=>{
 const originals=Array.from({length:1000},(_,i)=>({id:'photo-'+i,image:'RAW'+i}));
 const result=await E.mapImages({schemaVersion:1,items:originals,state:{}},async image=>'stored:'+image);
 assert.equal(result.items.length,1000);
 assert.equal(result.items[0].image,'stored:RAW0');
 assert.equal(result.items[999].image,'stored:RAW999');
 assert.equal(originals[0].image,'RAW0');
 await assert.rejects(()=>E.mapImages(JSON.parse('{"items":[],"__proto__":{"admin":true}}'),async x=>x));
 assert.equal({}.admin,undefined);
});

async function fixture(mode){
 const owner=randomUUID(),db=await new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,2);
  r.onupgradeneeded=()=>{
   if(!r.result.objectStoreNames.contains('items'))r.result.createObjectStore('items',{keyPath:'id'});
   if(!r.result.objectStoreNames.contains('state'))r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
 const original=jpeg('owner-original'),cutout=jpeg('reviewed-cutout');
 const originalSHA=sha(original),cutoutSHA=sha(cutout),refs=new Map([
  [owner+'/'+originalSHA+'.jpg',original],
  [owner+'/'+cutoutSHA+'.jpg',cutout]
 ]);
 const cutoutRef='closet-photo:'+owner+'/'+cutoutSHA+'.jpg';
 const hint={cutoutImage:mode==='reference'||mode==='wrong-reference'?cutoutRef:data(cutout),
  cutoutSHA256:mode==='wrong-legacy'||mode==='wrong-reference'?'0'.repeat(64):cutoutSHA};
 const garment={id:'private-shirt',ownerId:owner,
  image:'closet-photo:'+owner+'/'+originalSHA+'.jpg',
  originalPhoto:{image:'closet-photo:'+owner+'/'+originalSHA+'.jpg',sha256:originalSHA},
  segmentHint:hint,sourceSHA256:originalSHA,cutoutSHA256:cutoutSHA,
  category:'Tops',itemType:'T-shirt',color:'Navy'};
 const remote={revision:1,document:{schemaVersion:1,items:[garment],state:{}}};
 let photoReads=0;const events=new Map();
 const window={ClosetBackupEngine:E,
  closetAuth:{user:{id:owner},assertCurrent(){},getAccessToken:async()=> 'synthetic-owner-'+owner},
  addEventListener:(name,fn)=>events.set(name,fn)};
 const response=(body)=>({ok:true,status:200,json:async()=>body});
 const fetch=async(url)=>{
  if(url.includes('/rest/v1/closet_backups?'))return response([remote]);
  const marker='/storage/v1/object/closet-private/';
  if(url.includes(marker)){
   const key=url.split(marker)[1];if(!refs.has(key))throw Error('unowned cloud object');
   photoReads++;const bytes=refs.get(key);
   return {...response({}),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length)};
  }
  throw Error('unexpected cloud request');
 };
 vm.runInNewContext(cloudSource,{window,location:{search:'',hostname:'localhost'},navigator:{storage:{persist:async()=>true}},
  document:{getElementById:()=>null},fetch,URLSearchParams,crypto:webcrypto,Uint8Array,atob,btoa,
  AbortController,setTimeout,clearTimeout,setInterval:()=>{},console});
 const rows=()=>new Promise((resolve,reject)=>{
  const q=db.transaction('items').objectStore('items').getAll();
  q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
 });
 return {owner,window,db,rows,get photoReads(){return photoReads;},
  start:()=>window.closetCloud.start(db,{capture:work=>work(),canRestore:()=>true,async restored(){}}),
  close(){events.get('pagehide')?.();db.close();}};
}

test('historical SHA-correct inline reviewed JPEG restores without losing its owner source',async()=>{
 const f=await fixture('legacy');
 try{
  await f.start();
  const rows=await f.rows();assert.equal(rows.length,1);
  assert.ok(rows[0].segmentHint.cutoutImage.startsWith('data:image/jpeg;base64,'));
  assert.equal(rows[0].originalPhoto.sha256,rows[0].sourceSHA256);
  assert.equal(f.photoReads,1,'same original SHA is fetched only once');
 }finally{f.close();}
});

test('tampered legacy cutout receipt cannot be restored as private approved clothing',async()=>{
 const f=await fixture('wrong-legacy');
 try{
  await f.start();
  const rows=await f.rows();
  assert.equal(rows.length,baseline?1:0,'new restoration must fail closed on cutout receipt mismatch');
 }finally{f.close();}
});

test('new private cutout reference is SHA checked independently before wardrobe restore',async()=>{
 if(baseline)return;
 for(const mode of ['reference','wrong-reference']){
  const f=await fixture(mode);
  try{
   await f.start();const rows=await f.rows();
   if(mode==='reference'){
    assert.equal(rows.length,1);
    assert.ok(rows[0].segmentHint.cutoutImage.startsWith('data:image/jpeg;base64,'));
    assert.equal(f.photoReads,2,'original and reviewed cutout fetched as separate protected objects');
   }else assert.equal(rows.length,0,'mismatched reviewed SHA must not touch local clothing');
  }finally{f.close();}
 }
});
