'use strict';
// Mission 3: valid JSON can still be invalid owner-cloud REST/RPC shape.
// Verify no automatic retry storms or repeat CAS after a malformed success.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),vm=require('node:vm');
const {indexedDB}=require('fake-indexeddb');
const {randomUUID,webcrypto}=require('node:crypto');
const E=require('../public/cloud-backup-engine.js');
const source=readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
const empty=()=>({schemaVersion:1,items:[],state:{}});
const ok=value=>({ok:true,status:200,json:async()=>value});
const localItem=owner=>({id:'saved-local-original',ownerId:owner,category:'Tops',color:'Red'});
const remoteItem=owner=>({id:'saved-remote-original',ownerId:owner,category:'Tops',color:'Blue'});
async function createOwner({dirty=false,variant='duplicate'}={}){
 const owner=randomUUID(),db=await new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,2);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
 await new Promise((resolve,reject)=>{
  const t=db.transaction(['items','state'],'readwrite');
  t.objectStore('items').put(localItem(owner));
  t.objectStore('state').put({id:'cloud-sync',dirty,localRevision:8,
   baseVersion:dirty?0:1,baseDocument:empty()});
  t.oncomplete=resolve;t.onerror=()=>reject(t.error);
 });
 const stats={requests:0,revisionReads:0,documentReads:0,rpcPosts:0},
  els=new Map(),auth={user:{id:owner},getAccessToken:async()=>owner,assertCurrent(){}};
 const el=id=>{if(!els.has(id))els.set(id,{hidden:false,textContent:'',onclick:null});return els.get(id);};
 const app={ClosetBackupEngine:E,closetAuth:auth,addEventListener(){}};
 const state={repaired:false,serverCommitted:false,release:null,waiting:null};
 let committed=empty(),remoteRevision=dirty?0:2;
 const fetch=async(url,options={})=>{
  stats.requests++;
  const u=new URL(url),path=u.pathname,verb=options.method||'GET';
  assert.equal(options.headers.Authorization,'Bearer '+owner);
  if(path==='/rest/v1/closet_backups'){
   assert.equal(u.searchParams.get('owner_id'),'eq.'+owner);
   const revisionOnly=u.searchParams.get('select')==='revision';
   if(revisionOnly)stats.revisionReads++;else stats.documentReads++;
   if(!dirty&&!state.repaired&&revisionOnly){
    if(variant==='delayedDuplicate'){
     state.waiting=new Promise(resolve=>{state.release=resolve;});
     await state.waiting;
     return ok([{revision:2},{revision:3}]);
    }
    if(variant==='duplicate')return ok([{revision:2},{revision:3}]);
    if(variant==='null')return ok([null]);
    if(variant==='string')return ok([{revision:'2'}]);
    if(variant==='notArray')return ok({revision:2});
   }
   if(!remoteRevision)return ok([]);
   return ok([revisionOnly?{revision:remoteRevision}:
    {revision:remoteRevision,document:dirty?committed:
     {schemaVersion:1,items:[remoteItem(owner)],state:{}}}]);
  }
  if(path==='/rest/v1/rpc/save_closet_backup'){
   assert.equal(verb,'POST');stats.rpcPosts++;
   const body=JSON.parse(options.body);
   assert.equal(body.p_expected_revision,remoteRevision);
   assert.ok(Array.isArray(body.p_document.items));
   committed=body.p_document;remoteRevision++;
   state.serverCommitted=true;
   if(variant==='delayedCAS'&&!state.repaired){
    state.waiting=new Promise(resolve=>{state.release=resolve;});
    await state.waiting;
   }
   if(!state.repaired)return ok({revision:remoteRevision}); // valid JSON, invalid scalar shape
   return ok(remoteRevision);
  }
  throw Error('Unexpected cloud endpoint '+path);
 };
 vm.runInNewContext(source,{window:app,document:{getElementById:el},
  location:{hostname:'localhost',search:''},navigator:{storage:{persist:async()=>true}},
  fetch,URL,URLSearchParams,crypto:webcrypto,TextDecoder,
  Uint8Array,atob,btoa,AbortController,console,setTimeout:()=>1,
  clearTimeout:()=>{},setInterval:()=>0});
 const one=(store,key)=>new Promise((resolve,reject)=>{
  const r=db.transaction(store).objectStore(store).get(key);
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
 const rows=()=>new Promise((resolve,reject)=>{
  const r=db.transaction('items').objectStore('items').getAll();
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
 return {owner,db,stats,state,app,start:()=>app.closetCloud.start(db,
  {capture:fn=>fn(),canRestore:()=>true,async restored(){}}),
  resync:()=>app.closetCloud.sync(),manual:()=>el('syncCloset').onclick(),
  status:()=>el('cloudStatus').textContent,marker:()=>one('state','cloud-sync'),
  rows,close:()=>db.close()};
}
test('exact verified parent allowed stale response to pause a newer revision',()=>{
 if(baseline){
  assert.match(source,/async function writeIntegrityPause\(paused,assertActive\)/);
  assert.doesNotMatch(source,/expectedRevision!==null&&current\.localRevision!==expectedRevision/);
 }else{
  assert.match(source,/async function writeIntegrityPause\(paused,assertActive,expectedRevision=null\)/);
  assert.match(source,/expectedRevision!==null&&current\.localRevision!==expectedRevision/);
 }
});
async function waitForResponseHold(f){
 for(let tick=0;tick<40&&!f.state.release;tick++)
  await new Promise(resolve=>setImmediate(resolve));
 assert.equal(typeof f.state.release,'function','test must have blocked signed owner cloud response');
}
for(const [variant,dirty] of [['delayedDuplicate',false],['delayedCAS',true]]){
 test('stale malformed '+variant+' cannot quarantine a newer private saved garment revision',async()=>{
  const f=await createOwner({variant,dirty});
  try{
   const old=await f.marker();
   const firstSync=f.start();
   await waitForResponseHold(f);
   await f.app.closetCloud.beforeWrite(f.db);
   const updated=await f.marker();
   assert.equal(updated.localRevision,old.localRevision+1);
   assert.equal(updated.dirty,true);
   f.state.release();
   await firstSync;
   const done=await f.marker();
   assert.equal(done.localRevision,updated.localRevision);
   assert.equal(done.baseVersion,old.baseVersion);
   assert.equal(done.dirty,true);
   assert.deepEqual((await f.rows()).map(x=>x.id),['saved-local-original']);
   if(baseline){
    assert.equal(done.integrityPause,true,'verified parent wrongly quarantines newer owner revision');
    assert.match(f.status(),/Cloud photograph integrity check failed/);
   }else{
    assert.equal(done.integrityPause,undefined,'new owner save must not inherit prior response quarantine');
    assert.match(f.status(),/Saved on this device.*cloud backup pending/);
    assert.equal(f.stats.rpcPosts,dirty?1:0);
   }
  }finally{f.close();}
 });
}
