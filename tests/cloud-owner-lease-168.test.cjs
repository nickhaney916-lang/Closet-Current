'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {readFileSync}=require('node:fs');
const {webcrypto}=require('node:crypto');
const {indexedDB}=require('fake-indexeddb');
const leaseModule=require('../public/cloud-owner-lease-168.js');
const E=require('../public/cloud-backup-engine.js');
const source=readFileSync('public/cloud-backup.js','utf8');
const B='22222222-2222-4222-8222-222222222222';
const nextTick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
let counter=0;
function ownerUUID(){counter++;return '11111111-1111-4111-8111-'+counter.toString(16).padStart(12,'0');}
async function ownerDB(owner){
 const req=indexedDB.open('closet-current-user-'+owner,1);
 return new Promise((resolve,reject)=>{req.onupgradeneeded=()=>{req.result.createObjectStore('items',{keyPath:'id'});req.result.createObjectStore('state',{keyPath:'id'});};
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
}
function countRows(db){return new Promise((resolve,reject)=>{const q=db.transaction('items','readonly').objectStore('items').getAll();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
async function addRow(db,owner){return new Promise((resolve,reject)=>{const tx=db.transaction('items','readwrite');tx.objectStore('items').put({id:'owned-'+owner,ownerId:owner,category:'Tops',image:'data:image/jpeg;base64,/9j/2Q=='});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function boot({owner,db,tokenGate=null,fetchGate=null}){
 const state={epoch:'epoch-p168-auth-a',calls:[],tokens:0,restored:0,requests:0};
 const storage={getItem:key=>key==='closet-current-auth-v1'?JSON.stringify({epoch:state.epoch}):null};
 const auth={user:{id:owner},assertCurrent(){if(!this.user?.id)throw Error('Session ended');},
  async getAccessToken(){state.tokens++;if(tokenGate)await tokenGate.promise;return 'synthetic-test-bearer-A';}};
 const els=new Map(['cloudStatus','cloudBanner','syncCloset','resolveCloudConflict'].map(id=>[id,{hidden:false,textContent:'',onclick:null}]));
 const events=new Map();
 const win={ClosetBackupEngine:E,ClosetCloudOwnerLease168:leaseModule,closetAuth:auth,
  addEventListener(name,fn){events.set(name,fn);}};
 const fetch=async(url,init)=>{
  state.requests++;state.calls.push({url,method:init?.method,authorization:init?.headers?.Authorization,body:init?.body});
  if(fetchGate)await fetchGate.promise;
  if(url.includes('/rest/v1/closet_backups?'))return {ok:true,status:200,json:async()=>[]};
  if(url.includes('/rest/v1/rpc/save_closet_backup'))return {ok:true,status:200,json:async()=>1};
  throw Error('Unmocked private network route');
 };
 const context={window:win,location:{hostname:'isolated-p168.invalid',search:''},document:{getElementById:id=>els.get(id)},
  localStorage:storage,navigator:{storage:{persist:async()=>true}},fetch,
  setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>{},
  URLSearchParams,AbortController,Uint8Array,Promise,Map,Array,Error,RegExp,
  structuredClone,atob,btoa,crypto:webcrypto};
 vm.runInNewContext(source,context,{filename:'public/cloud-backup.js'});
 const settings={capture:work=>work(),canRestore:()=>true,restored:()=>{state.restored++;}};
 return {state,auth,storage,els,events,db,cloud:win.closetCloud,settings,
  switchTo(next){auth.user={id:next};state.epoch='epoch-p168-auth-b';},
  revoke(){auth.user=null;state.epoch='epoch-p168-revoked';}};
}
test('P168 exact-owner private lease rejects wrong DB, rotated epoch, and revoked session',async()=>{
 const owner=ownerUUID(),db=await ownerDB(owner);
 try{
  const o=boot({owner,db}),lease=leaseModule.capture({auth:o.auth,database:db,storage:o.storage});
  assert.equal(lease.owner,owner);
  assert.equal(leaseModule.assert(lease,{auth:o.auth,database:db,storage:o.storage}),true);
  o.state.epoch='epoch-p168-rotated';
  assert.throws(()=>leaseModule.assert(lease,{auth:o.auth,database:db,storage:o.storage}),e=>e.code==='cloud-owner-session-changed');
  o.revoke();
  assert.throws(()=>leaseModule.capture({auth:o.auth,database:db,storage:o.storage}),/P168 private cloud owner/);
  const foreign={name:'closet-current-user-'+B};
  assert.throws(()=>leaseModule.capture({auth:{...o.auth,user:{id:owner}},database:foreign,storage:o.storage}),/P168 private cloud owner/);
 }finally{db.close();}
});
test('P168 account switch while access token is pending sends zero private HTTP requests',async()=>{
 const owner=ownerUUID(),db=await ownerDB(owner),gate=deferred();
 try{
  await addRow(db,owner);
  const o=boot({owner,db,tokenGate:gate}),action=o.cloud.start(db,o.settings);
  for(let i=0;i<200&&o.state.tokens===0;i++)await nextTick();
  assert.equal(o.state.tokens,1,'must reach pending token request');
  o.switchTo(B);gate.resolve();await action;
  assert.equal(o.state.requests,0,'no stale-token cloud request');
  assert.match(o.els.get('cloudStatus').textContent,/paused after account change/);
  assert.equal((await countRows(db))[0].ownerId,owner);
 }finally{db.close();}
});
test('P168 account switch while GET response awaits cannot trigger restore or later backup RPC',async()=>{
 const owner=ownerUUID(),db=await ownerDB(owner),gate=deferred();
 try{
  await addRow(db,owner);
  const o=boot({owner,db,fetchGate:gate}),action=o.cloud.start(db,o.settings);
  for(let i=0;i<200&&o.state.requests===0;i++)await nextTick();
  assert.equal(o.state.requests,1,'must enter pending remote request');
  assert.match(o.state.calls[0].url,new RegExp('owner_id=eq\\.'+owner));
  o.switchTo(B);gate.resolve();await action;
  assert.equal(o.state.requests,1,'no later cloud RPC in foreign account');
  assert.equal(o.state.restored,0);
  assert.equal((await countRows(db))[0].ownerId,owner);
 }finally{db.close();}
});
test('P168 stable owner still performs an authenticated private remote read',async()=>{
 const owner=ownerUUID(),db=await ownerDB(owner);
 try{
  const o=boot({owner,db});
  await o.cloud.start(db,o.settings);
  assert.equal(o.state.requests,1);
  assert.equal(o.state.calls[0].authorization,'Bearer synthetic-test-bearer-A');
  assert.match(o.els.get('cloudStatus').textContent,/Your closet will back up automatically/);
 }finally{db.close();}
});
test('P168 new runtime guard is loaded before cloud backup and retains prior P145 research pause',()=>{
 const html=readFileSync('public/index.html','utf8');
 assert.ok(html.indexOf('cloud-owner-lease-168.js')<html.indexOf('cloud-backup.js'));
 for(const piece of ['assertLease(lease);','const lease=currentLease();',
  "e?.code==='cloud-owner-session-changed'",'pauseChangedOwner();',
  "if(stopForReview145())return {paused:true,reason:'owner-review-required'}",
  'tx.abort();return;','const revision=await response.json();assertLease(lease);'])
  assert.ok(source.includes(piece),'missing private cloud fence '+piece);
});
