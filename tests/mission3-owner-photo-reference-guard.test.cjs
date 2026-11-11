'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {randomUUID,createHash,webcrypto}=require('node:crypto');
const {indexedDB}=require('fake-indexeddb');
const E=require('../public/cloud-backup-engine.js');
const baseline=process.env.EXPECT_BASELINE==='1';
const cloudCode=fs.readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const data=Buffer.from([255,216,255,224,0,16,66,76,85,69,67,85,84,255,217]);
const sha=createHash('sha256').update(data).digest('hex');
const dataURL='data:image/jpeg;base64,'+data.toString('base64');
const response=x=>({ok:true,status:200,json:async()=>x,
 arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.length)});
const empty=()=>({schemaVersion:1,items:[],state:{}});
async function dbFor(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,2);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
const rows=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('items').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
const marker=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('state').objectStore('state').get('cloud-sync');
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
const item=(id,owner)=>({id,category:'Tops',color:'Navy',...(owner?{ownerId:owner}:{})});
async function fixture({foreign='image',bad=false,legacy=false,dirty=true}={}){
 const ownerA=randomUUID(),ownerB=randomUUID(),db=await dbFor(ownerA);
 const local=item('local-owner-A',ownerA);
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  tx.objectStore('items').put(local);
  tx.objectStore('state').put({id:'cloud-sync',baseVersion:4,
   baseDocument:empty(),dirty,localRevision:6});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
 const wrong='closet-photo:'+ownerB+'/'+sha+'.jpg';
 const correct='closet-photo:'+ownerA+'/'+sha+'.jpg';
 const remote=item('remote-owner-A',ownerA);
 if(foreign==='image')remote.originalPhoto={image:wrong,sha256:sha};
 if(foreign==='cutout')remote.segmentHint={
  cutoutImage:wrong,cutoutSHA256:sha,verified:false
 };
 if(foreign==='nested')remote.recognitionPhoto={nested:{image:wrong}};
 if(foreign==='url')remote.originalPhoto={image:'https://example.org/unsafe-photo.jpg',sha256:sha};
 if(foreign==='original-sha')remote.originalPhoto={
  image:correct,sha256:'0'.repeat(64)
 };
 if(foreign==='inline'){
  remote.segmentHint={
   cutoutImage:dataURL,cutoutSHA256:bad?'0'.repeat(64):sha,
   verified:true,ownerReviewedInstance:true,
   originalSHA256:sha
  };
  remote.sourceSHA256=sha;
  remote.cutoutSHA256=remote.segmentHint.cutoutSHA256;
  remote.originalPhoto={sha256:sha};
 }
 if(foreign==='good')remote.originalPhoto={image:correct,sha256:sha};
 if(foreign==='none')delete remote.originalPhoto;
 const cloud={revision:5,document:{schemaVersion:1,items:[remote],state:{}}};
 const requests=[],events=new Map(),elements=new Map();
 let saved=null,restores=0,revision=5;
 const window={ClosetBackupEngine:E,closetAuth:{
  user:{id:ownerA},assertCurrent(){},getAccessToken:async()=> 'synthetic-'+ownerA
 },addEventListener(name,fn){events.set(name,fn)}};
 const el=id=>{
  if(!elements.has(id))elements.set(id,{textContent:'',hidden:false,onclick:null});
  return elements.get(id);
 };
 const fetch=async(url,options={})=>{
  const u=new URL(url),verb=options.method||'GET';
  requests.push({path:u.pathname,verb,select:u.searchParams.get('select')});
  if(u.pathname==='/rest/v1/closet_backups'){
   assert.equal(u.searchParams.get('owner_id'),'eq.'+ownerA);
   if(u.searchParams.get('select')==='revision')return response([{revision}]);
   return response([{revision,document:cloud.document}]);
  }
  if(u.pathname==='/rest/v1/rpc/save_closet_backup'){
   saved=JSON.parse(options.body);
   assert.equal(saved.p_expected_revision,revision);
   cloud.document=saved.p_document;revision++;
   return response(revision);
  }
  if(u.pathname.startsWith('/storage/v1/object/closet-private/')){
   if(verb==='POST')return response({});
   assert.equal(u.pathname.slice('/storage/v1/object/closet-private/'.length),
    ownerA+'/'+sha+'.jpg','only signed owner private photo can be downloaded');
   return response({});
  }
  throw Error('Unexpected synthetic cloud endpoint '+u.pathname);
 };
 vm.runInNewContext(cloudCode,{window,fetch,URL,URLSearchParams,
  location:{hostname:'localhost',search:''},
  document:{getElementById:el},
  navigator:{storage:{persist:async()=>true}},
  crypto:webcrypto,AbortController,Uint8Array,atob,btoa,console,
  setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0
 });
 return {ownerA,ownerB,remote,db,requests,window,
  get saved(){return saved;},
  get revision(){return revision;},
  get restored(){return restores;},
  status:()=>el('cloudStatus').textContent,
  read:()=>rows(db),readMarker:()=>marker(db),
  start:()=>window.closetCloud.start(db,{capture:work=>work(),canRestore:()=>true,
   async restored(){restores++;}}),
  close(){events.get('pagehide')?.();db.close();}
 };
}

for(const kind of ['image','cutout','nested','url','original-sha']){
 test('owner-A dirty merge rejects untrusted remote '+kind+' photo before cloud publish',async()=>{
  const f=await fixture({foreign:kind});
  try{
   await f.start();
   if(baseline)assert.ok(f.saved,'exact parent must reproduce unsafe cloud merge publication');
   else{
    assert.equal(f.saved,null,'foreign or inconsistent photo cannot reach save RPC');
    assert.equal((await f.readMarker()).baseVersion,4);
    assert.equal((await f.readMarker()).dirty,true);
    assert.deepEqual((await f.read()).map(x=>x.id),['local-owner-A']);
    assert.match(f.status(),/Cloud photograph integrity check failed/);
    assert.equal((await f.readMarker()).integrityPause,true);
    assert.equal(f.requests.filter(x=>x.verb==='POST').length,0);
   }
  }finally{f.close();}
 });
}

test('legacy inline reviewed cutout SHA mismatch is rejected before three-way cloud merge',async()=>{
 const f=await fixture({foreign:'inline',bad:true});
 try{
  await f.start();
  if(baseline)assert.ok(f.saved,'previous cloud merge uploaded a falsely SHA-attested cutout');
  else{
   assert.equal(f.saved,null);
   assert.equal((await f.readMarker()).dirty,true);
   assert.deepEqual((await f.read()).map(x=>x.id),['local-owner-A']);
  }
 }finally{f.close();}
});

test('valid owner-private SHA object and local owner original remain recoverable',async()=>{
 const f=await fixture({foreign:'good',dirty:false});
 try{
  await f.start();
  assert.deepEqual((await f.read()).map(x=>x.id),['remote-owner-A']);
  assert.equal((await f.readMarker()).baseVersion,5);
  assert.equal(f.restored,1);
  assert.equal((await f.read())[0].originalPhoto.sha256,sha);
  assert.equal((await f.read())[0].originalPhoto.image,dataURL);
  assert.equal(f.saved,null);
 }finally{f.close();}
});

test('valid historically inline cutout with matching SHA still restores and merges',async()=>{
 const f=await fixture({foreign:'inline',bad:false,dirty:false});
 try{
  await f.start();
  assert.deepEqual((await f.read()).map(x=>x.id),['remote-owner-A']);
  assert.equal((await f.read())[0].segmentHint.cutoutImage,dataURL);
  assert.equal((await f.readMarker()).baseVersion,5);
  assert.equal(f.saved,null);
 }finally{f.close();}
});

test('non-photo owner data and older untagged garments remain valid for cloud restore',async()=>{
 const f=await fixture({foreign:'none',dirty:false});
 try{
  await f.start();
  assert.deepEqual((await f.read()).map(x=>x.id),['remote-owner-A']);
  assert.equal((await f.readMarker()).baseVersion,5);
 }finally{f.close();}
});
