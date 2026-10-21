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
function database(initial=[],owner=A){
 const content={items:new Map(initial.map(x=>[x.id,structuredClone(x)])),state:new Map()};
 return {
  name:'closet-current-user-'+owner,
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
  request:async(url,opt)=>{seen.push({url,token:opt.headers.Authorization});return {ok:true,status:200,json:async()=>url.includes('/rpc/save_closet_backup')?1:[]};}
 });
 const dbA=database([{id:'a-local'}]),dbB=database([{id:'b-local'}],B);
 const pending=h.cloud.start(dbA,h.callbacks);await tick();
 h.window.closetAuth.user={id:B};const fresh=h.cloud.start(dbB,h.callbacks);
 first.resolve(A);await Promise.all([pending,fresh]);
 assert.equal(seen.some(x=>x.token==='Bearer '+A),false);
 assert.equal(seen.filter(x=>x.url.includes('closet_backups?')).length,1);
 assert.match(seen[0].url,/owner_id=eq\.b222/);
 assert.deepEqual([...dbA.content.items.keys()],['a-local']);
 assert.deepEqual([...dbB.content.items.keys()],['b-local']);
 assert.equal(h.elements.get('cloudStatus').textContent,'Cloud backup up to date');
});
test('late response from old account cannot restore or overwrite new account closet',async()=>{
 const old=defer();let firstRequest=false;
 const h=setup({request:async(url)=>{
  if(url.includes('owner_id=eq.'+A)){firstRequest=true;return old.promise;}
  return {ok:true,status:200,json:async()=>url.includes('/rpc/save_closet_backup')?2:[{revision:1,document:doc('remote-b')}]};
 }});
 const dbA=database([{id:'private-a'}]),dbB=database([{id:'private-b'}],B);
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

test('a second manual cloud sync during an active request is replayed rather than silently skipped',async()=>{
 const first=defer();let reads=0;
 const h=setup({request:async(url)=>{
  if(url.includes('/rest/v1/closet_backups')){
   reads++;if(reads===1)return first.promise;
  }
  return {ok:true,status:200,json:async()=>[]};
 }});
 const db=database();
 const pending=h.cloud.start(db,h.callbacks);
 for(let i=0;i<8&&!reads;i++)await tick();
 assert.equal(reads,1);
 await h.cloud.sync(); // Collides with an already-running getRemote.
 first.resolve({ok:true,status:200,json:async()=>[]});
 await pending;
 for(let i=0;i<20&&reads<2;i++)await new Promise(resolve=>setTimeout(resolve,5));
 assert.equal(reads,2,'Lost an explicitly requested second cloud pass');
 assert.equal(h.elements.get('cloudStatus').textContent,'Your closet will back up automatically');
});

test('cloud start cannot pair account B access token with old account A IndexedDB',async()=>{
 const requests=[];
 const h=setup({request:async(url,opts)=>{
  requests.push({url,auth:opts.headers.Authorization});
  return {ok:true,status:200,json:async()=>[]};
 }});
 const oldDatabase=database([{id:'private-a'}],A);
 h.window.closetAuth.user={id:B};
 await h.cloud.start(oldDatabase,h.callbacks);
 await h.cloud.sync();
 await h.cloud.beforeWrite(oldDatabase);
 h.cloud.changed();
 assert.equal(requests.length,0,'never upload or read another account local wardrobe');
 assert.deepEqual([...oldDatabase.content.items.keys()],['private-a']);
 assert.equal(oldDatabase.content.state.has('cloud-sync'),false);
 assert.match(h.elements.get('cloudStatus').textContent,/belongs to another account/);
});
test('a blocked stale database can recover safely with the new owner database',async()=>{
 const remote=[];
 const h=setup({token:()=>Promise.resolve(h.window.closetAuth.user.id),request:async(url,opts)=>{
  remote.push({url,auth:opts.headers.Authorization});
  return {ok:true,status:200,json:async()=>[]};
 }});
 const oldDB=database([{id:'private-a'}],A),newDB=database([],B);
 h.window.closetAuth.user={id:B};
 await h.cloud.start(oldDB,h.callbacks);
 assert.equal(remote.length,0);
 await h.cloud.start(newDB,h.callbacks);
 assert.equal(remote.length,1);
 assert.match(remote[0].url,/owner_id=eq\.b222/);
 assert.equal(remote[0].auth,'Bearer '+B);
 assert.deepEqual([...oldDB.content.items.keys()],['private-a']);
 assert.equal(h.elements.get('cloudStatus').textContent,'Your closet will back up automatically');
});
test('BFCache resume does not reactivate an old database under a new signed-in identity',async()=>{
 const queries=[];
 const h=setup({request:async(url)=>{queries.push(url);return {ok:true,status:200,json:async()=>[]};}});
 const oldDB=database([],A);
 await h.cloud.start(oldDB,h.callbacks);
 assert.equal(queries.length,1);
 h.listeners.pagehide[0]();
 h.window.closetAuth.user={id:B};
 h.listeners.pageshow[0]({persisted:true});
 await h.cloud.sync();
 await h.cloud.beforeWrite(oldDB);
 assert.equal(queries.length,1);
 assert.equal(oldDB.content.state.has('cloud-sync'),false);
 assert.match(h.elements.get('cloudStatus').textContent,/belongs to another account/);
});
test('cloud operation remains owner-bound if database binding changes mid-token refresh',async()=>{
 const delayed=defer(),requests=[];
 const h=setup({token:async()=>delayed.promise,request:async(...args)=>{requests.push(args);return {ok:true,status:200,json:async()=>[]};}});
 const dbA=database([],A);
 const pending=h.cloud.start(dbA,h.callbacks);await tick();
 dbA.name='closet-current-user-'+B;
 delayed.resolve(A);await pending;
 assert.equal(requests.length,0,'no stale cloud request may follow mismatched DB binding');
});
