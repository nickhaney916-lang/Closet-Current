'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/cloud-backup.js','utf8');
const engine=require('../public/cloud-backup-engine.js');
const A='a1111111-1111-4111-8111-111111111111';
const B='b2222222-2222-4222-8222-222222222222';
const defer=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const doc=id=>({schemaVersion:1,items:[{id,category:'Tops',name:id}],state:{}});
function database(initial=[]){
 const content={items:new Map(initial.map(x=>[x.id,structuredClone(x)])),state:new Map()};
 return {
  content,
  transaction(names,mode){
   const tx={oncomplete:null,onerror:null,onabort:null,error:null};
   let count=0;
   function request(action){
    count++;const q={result:undefined,onsuccess:null};
    queueMicrotask(()=>{q.result=action();q.onsuccess?.();count--;if(!count)queueMicrotask(()=>tx.oncomplete?.());});
    return q;
   }
   tx.objectStore=name=>({
    get:key=>request(()=>structuredClone(content[name].get(key))),
    getAll:()=>request(()=>[...content[name].values()].map(x=>structuredClone(x))),
    put:value=>{content[name].set(value.id,structuredClone(value));},
    delete:key=>{content[name].delete(key);},
    clear:()=>{content[name].clear();}
   });
   tx.abort=()=>tx.onabort?.();
   return tx;
  }
 };
}
function setup({token,request}={}){
 const elements=new Map(),listeners={};
 for(const id of ['cloudStatus','cloudBanner','syncCloset','resolveCloudConflict'])elements.set(id,{hidden:false,textContent:'',onclick:null});
 const events=[],window={ClosetBackupEngine:engine,closetAuth:{user:{id:A},getAccessToken:token|| (async()=>A)},addEventListener:(name,fn)=>{(listeners[name]??=[]).push(fn);}};
 const context={window,document:{getElementById:id=>elements.get(id)},navigator:{storage:{persist:async()=>true}},
  fetch:async (...args)=>{events.push(args);return request?request(...args):{ok:true,status:200,json:async()=>[]};},
  crypto:require('node:crypto').webcrypto,structuredClone,AbortController,setTimeout,clearTimeout,
  setInterval:()=>0,atob,btoa,Uint8Array,Error,Map,Set,Array,Number,Promise};
 vm.runInNewContext(source,context,{filename:'cloud-backup.js'});
 const callbacks={capture:fn=>fn(),canRestore:()=>true,restored:async()=>{}};
 return {cloud:window.closetCloud,window,callbacks,events,elements,listeners};
}
test('token resolving after another account logs in cannot send a stale owner cloud request',async()=>{
 const first=defer(),seen=[];
 const h=setup({
  token:()=>h.window.closetAuth.user.id===A?first.promise:Promise.resolve(B),
  request:async(url,opt)=>{seen.push({url,token:opt.headers.Authorization});return {ok:true,status:200,json:async()=>[]};}
 });
 const dbA=database([{id:'a-local'}]),dbB=database([{id:'b-local'}]);
 const pending=h.cloud.start(dbA,h.callbacks);await tick();
 h.window.closetAuth.user={id:B};const fresh=h.cloud.start(dbB,h.callbacks);
 first.resolve(A);await Promise.all([pending,fresh]);
 assert.equal(seen.some(x=>x.token==='Bearer '+A),false);
 assert.equal(seen.length,1);
 assert.match(seen[0].url,/owner_id=eq\.b222/);
 assert.deepEqual([...dbA.content.items.keys()],['a-local']);
 assert.deepEqual([...dbB.content.items.keys()],['b-local']);
 assert.equal(h.elements.get('cloudStatus').textContent,'Cloud backup up to date'==='nonsense'?'wrong':'Your closet will back up automatically');
});
test('late response from old account cannot restore or overwrite new account closet',async()=>{
 const old=defer();let firstRequest=false;
 const h=setup({request:async(url)=>{
  if(url.includes('owner_id=eq.'+A)){firstRequest=true;return old.promise;}
  return {ok:true,status:200,json:async()=>[{revision:1,document:doc('remote-b')}]};
 }});
 const dbA=database([{id:'private-a'}]),dbB=database([{id:'private-b'}]);
 const pending=h.cloud.start(dbA,h.callbacks);
 for(let i=0;i<8&&!firstRequest;i++)await tick();
 assert.equal(firstRequest,true);
 h.window.closetAuth.user={id:B};const fresh=h.cloud.start(dbB,h.callbacks);
 old.resolve({ok:true,status:200,json:async()=>[{revision:1,document:doc('remote-a')}]});
 await Promise.all([pending,fresh]);await tick();
 assert.deepEqual([...dbA.content.items.keys()],['private-a']);
 // B may merge its own local piece into the remote B closet; A must never appear.
 assert.equal(dbB.content.items.has('remote-a'),false);
 assert.equal(dbB.content.items.has('private-a'),false);
 assert.equal(dbB.content.items.has('private-b'),true);
});
test('sign-out before response and bfcache pagehide stop stale restore and dirty markers',async()=>{
 const wait=defer();let fetchStarted=false;
 const h=setup({request:async()=>{fetchStarted=true;return wait.promise;}});
 const dbA=database([{id:'private-a'}]);
 const pending=h.cloud.start(dbA,h.callbacks);
 for(let i=0;i<8&&!fetchStarted;i++)await tick();
 assert.equal(fetchStarted,true);
 h.listeners.pagehide[0]();
 h.window.closetAuth.user=null;
 wait.resolve({ok:true,status:200,json:async()=>[{revision:1,document:doc('remote-a')}]});
 await pending;
 await h.cloud.beforeWrite(dbA);
 h.cloud.changed();
 assert.deepEqual([...dbA.content.items.keys()],['private-a']);
 assert.equal(dbA.content.state.has('cloud-sync'),false);
});
