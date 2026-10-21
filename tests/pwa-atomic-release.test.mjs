import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('dist/sw.js','utf8');
const root='https://example.com/Closet-Current/';
const code=fs.readFileSync('dist/index.html','utf8');
const version=code.match(/auth\.js\?v=([a-f0-9]+)/)?.[1];
const asset='auth.js?v='+version;
assert.ok(version,'Built index must contain a version-locked auth script');

function worker({installFails=false,openFails=false}={}){
 const events={},cacheMap=new Map(),removed=[],networkCalls=[];
 const cache={
  async addAll(urls){
   if(installFails)throw Error('quota exceeded');
   for(const url of urls)
    cacheMap.set(url,new Response(url.endsWith('/index.html')?'<!doctype html>PINNED_OLD':'PINNED_OLD:'+url,{status:200}));
  },
  async match(key){return cacheMap.get(typeof key==='string'?key:key.url);},
  async put(key,value){throw Error('An installed release must NEVER be mutated by fetch.');}
 };
 const self={
  registration:{scope:root},
  location:{origin:'https://example.com'},
  clients:{claim:async()=>{}},
  addEventListener(type,callback){events[type]=callback;}
 };
 const caches={
  open:async()=>{if(openFails)throw Error('storage failure');return cache;},
  keys:async()=>[],
  delete:async id=>{removed.push(id);return true;}
 };
 const fetch=async request=>{networkCalls.push(request.url||request);return new Response('NEW_REPLACEMENT');};
 const context={self,caches,URL,Response,Set,fetch};
 vm.createContext(context);vm.runInContext(source,context);
 async function install(){
  let pending;events.install({waitUntil(p){pending=p;}});await pending;
 }
 async function request(url,method='GET'){
  let pending,called=false;
  events.fetch({request:{url,method},respondWith(p){called=true;pending=p;}});
  return {intercepted:called,response:called?await pending:null};
 }
 return {events,install,request,cacheMap,networkCalls,removed};
}
test('installed HTML and versioned JavaScript stay pinned even if public server changes to next release',async()=>{
 const w=worker();await w.install();
 const first=await w.request(root),second=await w.request(root+'index.html');
 const css=await w.request(root+'style.css?v='+version);
 const js=await w.request(root+asset);
 assert.equal(first.response.status,200);assert.equal(await first.response.text(),'<!doctype html>PINNED_OLD');
 assert.equal(await second.response.text(),'<!doctype html>PINNED_OLD');
 assert.ok((await js.response.text()).startsWith('PINNED_OLD:'));
 assert.ok((await css.response.text()).startsWith('PINNED_OLD:'));
 assert.equal(w.networkCalls.length,0,'No runtime network fetch can replace a precached immutable app asset');
});
test('unexpected missing release file refuses to substitute newer web code even online',async()=>{
 const w=worker();await w.install();w.cacheMap.delete(root+asset);
 const missing=await w.request(root+asset);
 assert.equal(missing.response.status,503);
 assert.match(await missing.response.text(),/Reconnect and reopen/);
 assert.equal(w.networkCalls.length,0,'Do not mix server new JS with cached old HTML');
});
test('missing cached shell refuses to cache newer login bundle and remains recoverable',async()=>{
 const w=worker();await w.install();w.cacheMap.delete(root+'index.html');
 const broken=await w.request(root);
 assert.equal(broken.response.status,503);
 assert.equal(w.networkCalls.length,0);
});
test('private API routes, external links and write methods bypass service worker caching',async()=>{
 const w=worker();await w.install();
 const excluded=[
 [root+'api/sync','GET'],['https://api.supabase.com/customer','GET'],
 [root+'anything/private-source-photo.jpg','GET'],[root+asset,'POST'],
 [root+'index.html?uncached=query','GET']
 ];
 for(const [url,method] of excluded){
  const answer=await w.request(url,method);
  assert.equal(answer.intercepted,false,'Private/unverified URL or write excluded: '+url);
 }
 assert.equal(w.networkCalls.length,0);
});
test('install must fail if complete versioned cache cannot be acquired',async()=>{
 const w=worker({installFails:true});
 await assert.rejects(()=>w.install(),/quota exceeded/);
});
test('cache storage errors fail closed without touching IndexedDB or fetching newer release code',async()=>{
 const w=worker({openFails:true});
 const r=await w.request(root);
 assert.equal(r.response.status,503);
 assert.equal(w.networkCalls.length,0);
});
test('installed cache URL list includes the exact built-version entrypoint and CSS',async()=>{
 const w=worker();await w.install();
 assert.ok(w.cacheMap.has(root+'index.html'));
 assert.ok(w.cacheMap.has(root+asset));
 assert.ok(w.cacheMap.has(root+'style.css?v='+version));
});
