'use strict';
// Mission 3: prove an untrusted private cloud JSON HTTP body cannot exhaust
// mobile memory before parse or enter an automatic retry storm after failure.
const {test}=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const {indexedDB}=require('fake-indexeddb');
const {randomUUID,webcrypto}=require('node:crypto');
const E=require('../public/cloud-backup-engine.js');
const source=fs.readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
const maxJSON=33554432,maxSmall=65536;
const answer=x=>({ok:true,status:200,json:async()=>x});
const owned=(id,owner)=>({id,ownerId:owner,category:'Tops',color:'Red'});
async function dbFor(owner,dirty=false){
 const db=await new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,2);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
 await new Promise((resolve,reject)=>{
  const t=db.transaction(['items','state'],'readwrite');
  t.objectStore('items').put(owned('local-original',owner));
  t.objectStore('state').put({id:'cloud-sync',baseVersion:dirty?0:1,
   dirty,localRevision:4,baseDocument:{schemaVersion:1,items:[],state:{}}});
  t.oncomplete=resolve;t.onerror=()=>reject(t.error);
 });
 return db;
}
const get=(db,table,key)=>new Promise((resolve,reject)=>{
 const r=db.transaction(table).objectStore(table).get(key);
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
const all=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('items').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
async function fixture(kind,{dirty=false}={}){
 const owner=randomUUID(),db=await dbFor(owner,dirty);
 const logs={requests:0,rev:0,full:0,rpc:0,readers:0,reads:0,cancelled:0,jsonCalls:0},els=new Map();
 const element=id=>{if(!els.has(id))els.set(id,{hidden:false,textContent:'',onclick:null});
  return els.get(id);};
 const window={ClosetBackupEngine:E,closetAuth:{user:{id:owner},
  getAccessToken:async()=>owner,assertCurrent(){}},addEventListener(){}};
 const state={kind,good:false};
 function streamed(payload,limit='large'){
  let chunks,header=null;
  if(state.good||payload==='valid'){
   chunks=[Buffer.from(payload==='rpc'?'2':
    JSON.stringify(payload==='revision'?[{revision:2}]:
     [{revision:2,document:{schemaVersion:1,items:[owned('remote-correct',owner)],state:{}}}]))];
  }else if(state.kind==='header'){
   header=String((limit==='small'?maxSmall:maxJSON)+1);chunks=[Buffer.from('[]')];
  }else if(state.kind==='over'){
   chunks=[Buffer.from('['),Buffer.allocUnsafe(limit==='small'?maxSmall:maxJSON),Buffer.from(']')];
  }else if(state.kind==='invalid'){
   chunks=[Buffer.from([0x5b,0xff,0x5d])];
  }else throw Error('Unknown fixture kind');
  let offset=0;
  const reader={
   async read(){logs.reads++;return offset<chunks.length?
     {done:false,value:chunks[offset++]}:{done:true};},
   async cancel(){logs.cancelled++;offset=chunks.length;},
   releaseLock(){}
  };
  return {ok:true,status:200,headers:{get:n=>n==='content-length'?header:null},
   body:{getReader(){logs.readers++;return reader;},
    async cancel(){logs.cancelled++;}},
   json:async()=>{logs.jsonCalls++;throw Error('Must not buffer body via response.json');}};
 }
 const fetch=async(url,opts={})=>{
  logs.requests++;
  const u=new URL(url),method=opts.method||'GET';
  assert.equal(opts.headers?.Authorization,'Bearer '+owner);
  if(u.pathname==='/rest/v1/closet_backups'){
   assert.equal(u.searchParams.get('owner_id'),'eq.'+owner);
   if(u.searchParams.get('select')==='revision'){
    logs.rev++;
    return state.kind==='revision-header'&&!state.good?
     streamed('revision','small'):answer(dirty?[]:[{revision:2}]);
   }
   logs.full++;return streamed('document', 'large');
  }
  if(u.pathname==='/rest/v1/rpc/save_closet_backup'){
   assert.equal(method,'POST');logs.rpc++;return streamed('rpc','small');
  }
  throw Error('Unexpected private cloud endpoint '+u.pathname);
 };
 vm.runInNewContext(source,{window,document:{getElementById:element},
  location:{hostname:'localhost',search:''},navigator:{storage:{persist:async()=>true}},
  fetch,URL,URLSearchParams,crypto:webcrypto,TextDecoder,Uint8Array,atob,btoa,
  AbortController,console,setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>0});
 const start=()=>window.closetCloud.start(db,{capture:x=>x(),
  canRestore:()=>true,async restored(){}});
 return {owner,db,logs,state,window,start,get status(){return element('cloudStatus').textContent;},
  marker:()=>get(db,'state','cloud-sync'),rows:()=>all(db),
  manual:()=>element('syncCloset').onclick(),close:()=>db.close()};
}
test('exact verified baseline read unbounded cloud reply via response.json',()=>{
 if(baseline){
  assert.match(source,/const rows=await response\.json\(\)/);
  assert.match(source,/revision=await response\.json\(\)/);
 }else{
  assert.match(source,/readBoundedCloudJSON\(response,/);
  assert.doesNotMatch(source,/const rows=await response\.json\(\)/);
  assert.doesNotMatch(source,/revision=await response\.json\(\)/);
 }
});
for(const kind of ['header','over','invalid']){
 test(kind+' owner cloud document is quarantined without restore and survives owner restart',async()=>{
  if(baseline)return;
  const f=await fixture(kind);
  try{
   await f.start();
   assert.match(f.status,/Cloud photograph integrity check failed/);
   assert.equal((await f.marker()).integrityPause,true);
   assert.equal((await f.marker()).baseVersion,1);
   assert.deepEqual((await f.rows()).map(x=>x.id),['local-original']);
   assert.equal(f.logs.rpc,0);
   assert.equal(f.logs.jsonCalls,0);
   if(kind==='header')assert.equal(f.logs.readers,0);
   else{assert.equal(f.logs.readers,1);assert.ok(f.logs.cancelled>0||kind==='invalid');}
   const old=f.logs.requests;
   await f.window.closetCloud.sync();
   assert.equal(f.logs.requests,old,'no automatic untrusted cloud JSON retry');
   f.state.good=true;
   await f.manual();
   assert.equal((await f.marker()).baseVersion,2);
   assert.equal((await f.marker()).integrityPause,false);
   assert.deepEqual((await f.rows()).map(x=>x.id),['remote-correct']);
   assert.equal(f.status,'Cloud backup up to date');
  }finally{f.close();}
 });
}
test('oversized revision-only response stops before any full-wardrobe download',async()=>{
 if(baseline)return;
 const f=await fixture('revision-header');
 try{
  await f.start();
  assert.equal(f.logs.rev,1);
  assert.equal(f.logs.full,0);
  assert.equal(f.logs.readers,0);
  assert.ok(f.logs.cancelled>=1);
  assert.equal((await f.marker()).baseVersion,1);
  assert.equal((await f.marker()).integrityPause,true);
 }finally{f.close();}
});
test('cloud save RPC response is bounded; dirty owner keeps original items and cloud revision',async()=>{
 if(baseline)return;
 const f=await fixture('over',{dirty:true});
 try{
  await f.start();
  assert.equal(f.logs.rpc,1);
  assert.equal((await f.marker()).dirty,true);
  assert.equal((await f.marker()).baseVersion,0);
  assert.equal((await f.marker()).integrityPause,true);
  assert.deepEqual((await f.rows()).map(x=>x.id),['local-original']);
  assert.equal(f.logs.jsonCalls,0);
  assert.ok(f.logs.cancelled>=1);
  f.state.good=true;await f.manual();
  assert.equal((await f.marker()).baseVersion,2);
  assert.equal((await f.marker()).dirty,false);
  assert.equal((await f.marker()).integrityPause,false);
 }finally{f.close();}
});
test('small chunked valid remote JSON and signed-owner backup CAS remain compatible',async()=>{
 const f=await fixture('over');
 f.state.good=true;
 try{
  await f.start();
  assert.equal((await f.marker()).baseVersion,2);
  assert.equal((await f.marker()).integrityPause,undefined);
  assert.equal(f.logs.readers,baseline?0:1);
  assert.equal(f.status,'Cloud backup up to date');
 }finally{f.close();}
});
