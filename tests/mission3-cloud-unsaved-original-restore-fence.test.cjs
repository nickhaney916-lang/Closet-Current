'use strict';
// Execute exact public/cloud-backup-bridge.js & cloud-backup.js functions
// against native-semantics fake-indexeddb. All owner identities and JPEG
// references are synthetic. No hosted backup or private customer data.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {randomUUID}=require('node:crypto');
const vm=require('node:vm');
const {indexedDB}=require('fake-indexeddb');
const bridge=readFileSync('public/cloud-backup-bridge.js','utf8');
const cloud=readFileSync('public/cloud-backup.js','utf8');
function section(src,start,end){
 const a=src.indexOf(start),b=src.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Expected source region '+start);
 return src.slice(a,b);
}
const predicate=section(bridge,'function mission3CloudRestoreReviewIdle(){','function nativeLossless04RestoreSafe(){');
const transact=section(cloud,'function transact(stores,mode,fn){','async function marker(){');
const apply=section(cloud,'async function apply(document,revision,expectedRevision,assertActive){','const isCapacityError=');
assert.match(bridge,/mission3CloudRestoreReviewIdle\(\)&&/);
assert.match(apply,/if\(callbacks\.canRestore&&!callbacks\.canRestore\(\)\)return;/);
const photo='data:image/jpeg;base64,/9j/AA==';
const saved=id=>({id,ownerId:'owner-a',category:'Tops',image:photo,
 originalPhoto:{image:photo,sha256:'a'.repeat(64)}});
function deferred(){let resolve;const promise=new Promise(ok=>resolve=ok);return {promise,resolve};}
async function open(){
 const owner=randomUUID(),name='closet-current-user-'+owner;
 const db=await new Promise((ok,fail)=>{
  const r=indexedDB.open(name,1);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error);
 });
 await new Promise((ok,fail)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  tx.objectStore('items').put(saved('local-before'));
  tx.objectStore('state').put({id:'draft',batch:[saved('local-review-before')]});
  tx.objectStore('state').put({id:'cloud-sync',localRevision:0,dirty:false,
   baseVersion:0,baseDocument:null});
  tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
 });
 return db;
}
async function current(db){
 let items,state;
 await new Promise((ok,fail)=>{
  const tx=db.transaction(['items','state'],'readonly');
  tx.objectStore('items').getAll().onsuccess=e=>items=e.target.result;
  tx.objectStore('state').getAll().onsuccess=e=>state=e.target.result;
  tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
 });
 return {items,state:Object.fromEntries(state.map(x=>[x.id,x]))};
}
function setup(db){
 const gate=deferred(),entered=deferred(),flags={
  failedDraftCaptures:new Set(),localPending:new Set(),automaticQueue:[],
  captureProofTaking:false,photoImportActive:false,videoImportActive:false,
  cameraOpening:false,stream:null,saving:false
 };
 let restored=0,held=false;
 const ctx={db,Promise,URLSearchParams,location:{search:''},window:{},E:{
   stateIds:['draft','outfit-board','inspiration-looks']
  },
  markerDefault:()=>({id:'cloud-sync',baseVersion:0,baseDocument:null,
   localRevision:0,dirty:false}),
  decode:async document=>structuredClone(document),
  callbacks:{
   canRestore:()=>ctx.mission3CloudRestoreReviewIdle(),
   capture:async work=>{if(held){entered.resolve();await gate.promise;}return work();},
   restored:async()=>{restored++;}
  },
  structuredClone,...flags
 };
 vm.createContext(ctx);
 for(const src of [predicate,transact,apply])vm.runInContext(src,ctx);
 const remote={items:[saved('cloud-after')],state:{
  draft:{id:'draft',batch:[saved('cloud-review-after')]}
 }};
 return {ctx,db,remote,gate,entered,setHold:v=>{held=v},
  get restored(){return restored},
  restore:()=>ctx.apply(remote,6,0,()=>{})};
}
test('every unfinished or uncommitted capture state blocks private cloud restoration',async()=>{
 const db=await open();
 try{
  const f=setup(db),checks=[
   c=>c.failedDraftCaptures.add('unsaved-photo'),
   c=>c.localPending.add('recognition-in-progress'),
   c=>c.automaticQueue.push('queued-scan'),
   c=>{c.captureProofTaking=true},
   c=>{c.photoImportActive=true},
   c=>{c.videoImportActive=true},
   c=>{c.cameraOpening=true},
   c=>{c.stream={getTracks:()=>[]}},
   c=>{c.saving=true}
  ];
  for(const makeBusy of checks){
   const c=setup(db);
   makeBusy(c.ctx);
   assert.equal(c.ctx.mission3CloudRestoreReviewIdle(),false);
   assert.equal(await c.restore(),false);
   const state=await current(db);
   assert.deepEqual(state.items.map(x=>x.id),['local-before']);
   assert.deepEqual(state.state.draft.batch.map(x=>x.id),['local-review-before']);
   assert.equal(c.restored,0);
  }
 }finally{db.close();}
});
test('restoration rechecks failed original AFTER queued restore capture resumes, before clear',async()=>{
 const db=await open();
 try{
  const f=setup(db);f.setHold(true);
  const pending=f.restore();await f.entered.promise;
  f.ctx.failedDraftCaptures.add('one-owner-visible-original');
  f.gate.resolve();
  assert.equal(await pending,false);
  const state=await current(db);
  assert.deepEqual(state.items.map(x=>x.id),['local-before']);
  assert.deepEqual(state.state.draft.batch.map(x=>x.id),['local-review-before']);
  assert.equal(state.state['cloud-sync'].baseVersion,0);
  assert.equal(f.restored,0);
 }finally{db.close();}
});
test('successful idle restoration atomically replaces items and drafts after all fences',async()=>{
 const db=await open();
 try{
  const f=setup(db);
  assert.equal(f.ctx.mission3CloudRestoreReviewIdle(),true);
  assert.equal(await f.restore(),true);
  const state=await current(db);
  assert.deepEqual(state.items.map(x=>x.id),['cloud-after']);
  assert.deepEqual(state.state.draft.batch.map(x=>x.id),['cloud-review-after']);
  assert.equal(state.state['cloud-sync'].baseVersion,6);
  assert.equal(state.state['cloud-sync'].dirty,false);
  assert.equal(f.restored,1);
 }finally{db.close();}
});
test('existing dirty local backup marker prevents remote restore even when capture is idle',async()=>{
 const db=await open();
 try{
  await new Promise((ok,fail)=>{
   const tx=db.transaction('state','readwrite');
   tx.objectStore('state').put({id:'cloud-sync',localRevision:8,dirty:true,baseVersion:0});
   tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
  });
  const f=setup(db);
  assert.equal(await f.restore(),false);
  assert.deepEqual((await current(db)).items.map(x=>x.id),['local-before']);
  assert.equal(f.restored,0);
 }finally{db.close();}
});
test('restore guard calls the live callback inside an IDB request and never leaves partially cleared items',()=>{
 const region=apply.slice(apply.indexOf('r.onsuccess=()=>{'),apply.indexOf('applied=true;'));
 assert.match(region,/assertActive\(\);\s*\/\/ The earlier checks/);
 assert.match(region,/if\(callbacks\.canRestore&&!callbacks\.canRestore\(\)\)return;/);
 assert.ok(region.indexOf('callbacks.canRestore')<region.indexOf('store.clear()'));
 assert.ok(region.indexOf('callbacks.canRestore')<region.indexOf('state.delete(id)'));
});
