'use strict';
// Runs the exact generated dist/sw.js inside a synthetic CacheStorage/FetchEvent
// harness. The real app build and JavaScript are used, not copied SW functions.
// This is application cache-protocol evidence, never a native WebKit/ONNX test.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const test=require('node:test');
const vm=require('node:vm');
const {URL,Response}=globalThis;
const compiled=fs.readFileSync('dist/sw.js','utf8');
const oldShell=fs.readFileSync('dist/index.html','utf8');
const match=oldShell.match(/app\.js\?v=([a-f0-9]{12})/);
assert.ok(match,'generated app must reference a pinned 12-hex release URL');
const oldVersion=match[1], nextVersion=oldVersion==='ffffffffffff'?'eeeeeeeeeeee':'ffffffffffff';
const newShell=oldShell.replaceAll('?v='+oldVersion,'?v='+nextVersion);
const origin='https://closet-current.example.invalid/';
const oldApp='// application-script-content: original reviewed version';
const nextApp='// application-script-content: new incompatible deployment';

function response(body,status=200) {
 return { ok:status>=200&&status<300,redirected:false,type:'basic',status,
  async text(){return body;},clone(){return response(body,status);},
  body };
}
function cacheHarness() {
 const stores=new Map();
 let deployed='old';
 const network=async request=>{
  if(deployed==='offline')throw Error('simulated network disconnection');
  const url=new URL(typeof request==='string'?request:request.url);
  const isNew=deployed==='new';
  const text=url.pathname==='/index.html'||url.pathname==='/'?
    (isNew?newShell:oldShell):
    url.pathname==='/app.js'?(isNew?nextApp:oldApp):
    'synthetic static resource for '+url.pathname;
  return response(text);
 };
 const cacheApi={
  async open(name){
   if(!stores.has(name))stores.set(name,new Map());
   const table=stores.get(name);
   return {
    async addAll(urls){for(const url of urls)table.set(url,(await network(url)).clone());},
    async match(request){return table.get(typeof request==='string'?request:request.url)?.clone();},
    async put(request,value){table.set(typeof request==='string'?request:request.url,value.clone());},
    async delete(request){return table.delete(typeof request==='string'?request:request.url);},
   };
  },
  async keys(){return [...stores.keys()];},
  async delete(key){return stores.delete(key);},
 };
 function worker(version=oldVersion) {
  const listeners=new Map();
  const source=compiled.replaceAll(oldVersion,version);
  const self={
   registration:{scope:origin},
   location:{origin:new URL(origin).origin},
   clients:{async claim(){}},
   addEventListener:(name,fn)=>listeners.set(name,fn),
  };
  vm.runInNewContext(source,{self,caches:cacheApi,fetch:network,URL,Response});
  async function dispatch(kind,request){
   const listener=listeners.get(kind);
   assert.ok(listener,'missing original '+kind+' handler');
   let pending;
   if(kind==='fetch'){
    listener({request:{method:'GET',url:new URL(request,origin).href},
     respondWith(value){pending=value;}});
   }else listener({waitUntil(value){pending=value;}});
   assert.ok(pending,'SW did not wait for '+kind+' event');
   return pending;
  }
  return {dispatch};
 }
 return {worker,stores,setDeployed:value=>deployed=value};
}

test('cold installation, unchanged reload and offline cache preserve the current built shell',async()=>{
 const h=cacheHarness(),sw=h.worker();
 await sw.dispatch('install');
 assert.equal((await sw.dispatch('fetch','index.html')).body,oldShell);
 assert.equal((await sw.dispatch('fetch','app.js?v='+oldVersion)).body,oldApp);
 h.setDeployed('offline');
 assert.equal((await sw.dispatch('fetch','index.html')).body,oldShell);
 assert.equal((await sw.dispatch('fetch','app.js?v='+oldVersion)).body,oldApp);
});

test('an old page keeps its exact versioned application script after a new deployment',async()=>{
 const h=cacheHarness(),sw=h.worker();
 await sw.dispatch('install');
 h.setDeployed('new');
 const result=await sw.dispatch('fetch','app.js?v='+oldVersion);
 assert.equal(result.body,oldApp,
  'old versioned URL must not fetch new app bytes from a server that ignores the query');
});

test('an old active SW must not overwrite cached old HTML with a newer incompatible shell',async()=>{
 const h=cacheHarness(),sw=h.worker();
 await sw.dispatch('install');
 h.setDeployed('new');
 assert.equal((await sw.dispatch('fetch','index.html')).body,newShell,
  'an online user can still reach the new shell while its new SW installs');
 h.setDeployed('offline');
 assert.equal((await sw.dispatch('fetch','index.html')).body,oldShell,
  'old SW offline shell must remain paired with its own cached assets');
 assert.equal((await sw.dispatch('fetch','app.js?v='+oldVersion)).body,oldApp);
});

test('new SW installation/activation supplies a coherent newer shell and script offline',async()=>{
 const h=cacheHarness(),old=h.worker();
 await old.dispatch('install');await old.dispatch('activate');
 h.setDeployed('new');
 const next=h.worker(nextVersion);
 await next.dispatch('install');await next.dispatch('activate');
 h.setDeployed('offline');
 assert.equal((await next.dispatch('fetch','index.html')).body,newShell);
 assert.equal((await next.dispatch('fetch','app.js?v='+nextVersion)).body,nextApp);
});

test('a missing cached versioned script does not silently masquerade as a matching old asset',async()=>{
 const h=cacheHarness(),sw=h.worker();
 await sw.dispatch('install');
 const cache=h.stores.get('closet-current-'+oldVersion);
 assert.ok(cache,'the actual generated SW must open its content-version cache');
 cache.delete(new URL('app.js?v='+oldVersion,origin).href);
 h.setDeployed('new');
 const result=await sw.dispatch('fetch','app.js?v='+oldVersion);
 assert.equal(result.status,503,'missing pinned JS must fail closed, not silently load incompatible new bytes');
});
