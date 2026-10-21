'use strict';
// Real production cloud client under a deterministic local two-device/RPC fixture.
// No hosted Supabase URL is contacted, no paid AI, no real account credentials.
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const engine=require('../public/cloud-backup-engine.js');
const client=fs.readFileSync('public/cloud-backup.js','utf8');
const A='a1111111-1111-4111-8111-111111111111';
const B='b2222222-2222-4222-8222-222222222222';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const doc=(name,id='shirt')=>({schemaVersion:1,items:[{id,category:'Tops',itemType:'T-shirt',name}],state:{}});
function database(owner,local,base){
 const content={items:new Map(local.items.map(x=>[x.id,structuredClone(x)])),
  state:new Map([['cloud-sync',{id:'cloud-sync',dirty:true,baseVersion:1,
   baseDocument:structuredClone(base),localRevision:1}]])};
 return {name:'closet-current-user-'+owner,content,
  transaction(names,mode){
   const tx={oncomplete:null,onerror:null,onabort:null,error:null};let awaiting=0;
   const request=read=>{awaiting++;const q={result:undefined,onsuccess:null};
    queueMicrotask(()=>{q.result=read();q.onsuccess?.();awaiting--;
     if(!awaiting)queueMicrotask(()=>tx.oncomplete?.());});return q;};
   tx.objectStore=name=>({
    get:key=>request(()=>structuredClone(content[name].get(key))),
    getAll:()=>request(()=>[...content[name].values()].map(x=>structuredClone(x))),
    put:item=>content[name].set(item.id,structuredClone(item)),
    delete:key=>content[name].delete(key),
    clear:()=>content[name].clear()
   });
   tx.abort=()=>tx.onabort?.();
   return tx;
  }
 };
}
function setup({remote=doc('Remote'),pauseFirst=false,failFirstRPC=false,loseFirstRPCReply=false}={}){
 const base=doc('Base'),local=doc('Local'),db=database(A,local,base);
 const initial=defer(),calls=[],timeoutJobs=new Map();
 let timeoutId=0,remoteCalls=0,saves=0,server={revision:2,document:structuredClone(remote)};
 const elements=new Map(['cloudStatus','cloudBanner','syncCloset','resolveCloudConflict'].map(id=>[id,{hidden:false,textContent:'',onclick:null}]));
 const listeners={};
 const auth={user:{id:A},getAccessToken:async()=>auth.user.id};
 const window={ClosetBackupEngine:engine,closetAuth:auth,addEventListener:(name,cb)=>(listeners[name]??=[]).push(cb)};
 const request=async(url,options)=>{
  const u=new URL(url);calls.push({path:u.pathname,owner:u.searchParams.get('owner_id'),auth:options.headers.Authorization});
  if(u.pathname==='/rest/v1/closet_backups'){
   remoteCalls++;if(pauseFirst&&remoteCalls===1)await initial.promise;
   return {ok:true,status:200,json:async()=>[structuredClone(server)]};
  }
  if(u.pathname==='/rest/v1/rpc/save_closet_backup'){
   saves++;const body=JSON.parse(options.body);
   assert.equal(body.p_expected_revision,server.revision,'RPC expected version must match remote');
   if(failFirstRPC&&saves===1)throw Error('Simulated offline before server writes');
   server={revision:server.revision+1,document:structuredClone(body.p_document)};
   if(loseFirstRPCReply&&saves===1)throw Error('Simulated response lost after server committed');
   return {ok:true,status:200,json:async()=>server.revision};
  }
  throw Error('Unexpected cloud request: '+u.pathname);
 };
 // Controlled timers: 20-second fetch aborts are cancelled by api(), but
 // delayed retry callbacks run only when a test explicitly invokes them.
 const timer=(fn,delay)=>{const id=++timeoutId;timeoutJobs.set(id,{fn,delay});return id;};
 const context={window,document:{getElementById:id=>elements.get(id)},navigator:{storage:{persist:async()=>true}},
  fetch:request,crypto:require('node:crypto').webcrypto,structuredClone,AbortController,
  setTimeout:timer,clearTimeout:id=>timeoutJobs.delete(id),setInterval:()=>0,
  atob,btoa,Uint8Array,Error,Map,Set,Array,Number,Promise};
 vm.createContext(context);vm.runInContext(client,context,{filename:'cloud-backup.js'});
 const callbacks={capture:run=>run(),canRestore:()=>true,restored:async()=>{}};
 const flush=async()=>{
  const scheduled=[...timeoutJobs].filter(([,job])=>job.delay<10000);
  for(const [id,job]of scheduled){timeoutJobs.delete(id);job.fn();}
  for(let i=0;i<30;i++)await tick();
 };
 const until=async check=>{for(let i=0;i<75&&!check();i++)await tick();assert.ok(check(),'Expected async cloud state');};
 return {cloud:window.closetCloud,window,db,base,local,callbacks,elements,calls,initial,
  get remoteCalls(){return remoteCalls},get saves(){return saves},get server(){return server},
  flush,until,listeners};
}
test('overlapping Keep both click is not downgraded to an ordinary sync',async()=>{
 const h=setup({pauseFirst:true});
 const first=h.cloud.start(h.db,h.callbacks);
 await h.until(()=>h.remoteCalls===1);
 await h.cloud.sync({keepBoth:true}); // User clicks while remote response is pending.
 h.initial.resolve();await first;await h.flush();
 await h.until(()=>h.saves===1);
 assert.equal(h.server.document.items.length,2,'Both physical edits must be preserved');
 assert.deepEqual(new Set(h.server.document.items.map(x=>x.name)),new Set(['Local (saved copy)','Remote']));
 assert.equal(h.elements.get('cloudStatus').textContent,'Cloud backup up to date');
 assert.equal(h.db.content.items.size,2,'Merged cloud copy must restore into owner closet');
 h.listeners.pagehide[0]();
});
test('manual Keep both survives network drop before RPC commit without forcing another click',async()=>{
 const h=setup({failFirstRPC:true});
 await h.cloud.start(h.db,h.callbacks); // Original safe conflict does not write.
 assert.equal(h.saves,0);
 assert.match(h.elements.get('cloudStatus').textContent,/Keep both versions/);
 await h.cloud.sync({keepBoth:true});
 assert.equal(h.saves,1);
 assert.match(h.elements.get('cloudStatus').textContent,/pending/);
 await h.flush();
 await h.until(()=>h.saves===2);
 assert.equal(h.server.document.items.length,2,'Retry must resolve conflict with both edits');
 assert.equal(h.db.content.items.size,2);
 h.listeners.pagehide[0]();
});
test('lost response after a successful conflict RPC never creates duplicate copies',async()=>{
 const h=setup({loseFirstRPCReply:true});
 await h.cloud.start(h.db,h.callbacks);
 await h.cloud.sync({keepBoth:true});
 assert.equal(h.saves,1);
 const originalIds=h.server.document.items.map(x=>x.id).sort();
 await h.flush();
 await h.until(()=>h.saves===2);
 assert.deepEqual(h.server.document.items.map(x=>x.id).sort(),originalIds);
 assert.equal(h.server.document.items.length,2);
 assert.equal(h.db.content.items.size,2);
 h.listeners.pagehide[0]();
});
test('ordinary background sync never silently merges same-field conflicts',async()=>{
 const h=setup();
 await h.cloud.start(h.db,h.callbacks);
 await h.cloud.sync();
 assert.equal(h.saves,0);
 assert.equal(h.server.document.items[0].name,'Remote');
 assert.equal(h.db.content.items.get('shirt').name,'Local');
 assert.match(h.elements.get('cloudStatus').textContent,/Keep both versions/);
 h.listeners.pagehide[0]();
});
test('user-approved conflict resolution does not cross accounts or local database owners',async()=>{
 const h=setup({pauseFirst:true});
 const first=h.cloud.start(h.db,h.callbacks);
 await h.until(()=>h.remoteCalls===1);
 await h.cloud.sync({keepBoth:true});
 h.window.closetAuth.user={id:B}; // page switches while async request is pending
 const newDb=database(B,doc('Other owner local'),doc('Other owner baseline'));
 await h.cloud.start(newDb,h.callbacks);
 h.initial.resolve();await first;
 assert.equal(h.saves,0,'Keep both from A cannot be reused by B');
 assert.equal(newDb.content.items.get('shirt').name,'Other owner local');
 assert.equal(h.db.content.items.get('shirt').name,'Local');
 h.listeners.pagehide[0]();
});
