// Executed only AFTER generating the synthetic staging-dist/ bundle.
 // Real service-worker logic is run in isolated Node VM contexts; this does
 // not install on a physical device or open any real network connections.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const stage=JSON.parse(await readFile('staging-dist/staging-preflight.json','utf8'));
const staged=await readFile('staging-dist/sw.js','utf8');
const prod=await readFile('dist/sw.js','utf8');
const index=await readFile('staging-dist/index.html','utf8');
const origin=stage.stagingOrigin;
assert.equal(stage.backendProjectRef,'abcdefghijklmnopqrst','Only invented backend fixture is allowed');
assert.equal(origin,'https://preview.closet-current-staging.pages.dev/');
const root=origin,version=stage.bundleFingerprint;
assert.match(version,/^[a-f0-9]{12}$/);
assert.ok(staged.includes("const CACHE='closet-current-staging-"+version+"';"));
assert.ok(staged.includes("key.startsWith('closet-current-staging-')"));
assert.ok(!staged.includes("key.startsWith('closet-current-')"));
assert.ok(prod.includes("const CACHE='closet-current-"));
assert.ok(!prod.includes("const CACHE='closet-current-staging-"));
const assetMatch=index.match(/auth\.js\?v=([a-f0-9]{12})/);
assert.equal(assetMatch?.[1],version,'Auth script must be pinned to staged fingerprint');
const sentinel='closet-current-'+version;
const installed='closet-current-staging-'+version;
const oldStage='closet-current-staging-aaaaaaaaaaaa';
const fakeProduction='closet-current-'+version;
function mockWorker({installFails=false,cacheUnavailable=false,missing=[]}={}){
 const handlers=new Map(),storage=new Map(),deleted=[],calls=[];
 const entryCache=new Map();
 storage.set(installed,entryCache);
 storage.set(oldStage,new Map([['old',new Response('old')]]));
 storage.set(fakeProduction,new Map([['production',new Response('production')]]));
 storage.set('other-origin-app',new Map());
 const api={
  async open(key){
   if(cacheUnavailable)throw Error('Cache Storage unavailable');
   if(!storage.has(key))storage.set(key,new Map());
   const cache=storage.get(key);
   return {
    async addAll(urls){
     if(installFails)throw Error('Synthetic storage quota');
     for(const url of urls)cache.set(url,new Response(url.endsWith('/index.html')?'PINNED_STAGING_INDEX':'STAGING_RELEASE:'+url));
    },
    async match(key){
     const value=cache.get(typeof key==='string'?key:key.url);
     return value?.clone();
    },
    async put(){throw Error('Installed preview assets must remain immutable');}
   };
  },
  async keys(){return [...storage.keys()]},
  async delete(key){deleted.push(key);return storage.delete(key);}
 };
 const self={
  registration:{scope:origin},location:{origin:new URL(origin).origin},
  clients:{claim:async()=>{calls.push('claim')}},
  addEventListener(name,callback){handlers.set(name,callback)}
 };
 vm.runInNewContext(staged,{self,caches:api,URL,Response,Set});
 async function lifecycle(name){
  let promise;
  handlers.get(name)({waitUntil(value){promise=value}});
  if(!promise)throw Error('Missing service worker waitUntil '+name);
  await promise;
 }
 async function request(url,method='GET'){
  let promise,intercepted=false;
  handlers.get('fetch')({
   request:{url,method},
   respondWith(value){promise=value;intercepted=true;}
  });
  return {intercepted,response:intercepted?await promise:null};
 }
 return {lifecycle,request,storage,deleted,calls,entryCache};
}
const result={scope:origin,bundleFingerprint:version,isolatedCacheNamespace:true,
 productionCacheUntouched:false,obsoleteStageCacheEvicted:false,
 pinnedAppShell:false,pinnedScript:false,failClosedMissingAsset:false,
 privateAndLiveRoutesBypass:false,writeMethodsBypass:false,
 installQuotaFailureTest:false,cacheUnavailableDenied:false,
 runtimeNetworkRequests:0,hostedAccessVerified:false,physicalPhoneVerified:false,
 productionPromotion:'BLOCKED'};
const w=mockWorker();
await w.lifecycle('install');
const home=await w.request(root);
const html=await w.request(root+'index.html');
const auth=await w.request(root+'auth.js?v='+version);
assert.equal(home.intercepted,true);
assert.equal(await home.response.text(),'PINNED_STAGING_INDEX');
assert.equal(await html.response.text(),'PINNED_STAGING_INDEX');
assert.ok((await auth.response.text()).startsWith('STAGING_RELEASE:'));
assert.equal(w.entryCache.has(root+'index.html'),true);
result.pinnedAppShell=true;result.pinnedScript=true;
const missing=w.entryCache.delete(root+'auth.js?v='+version);
assert.equal(missing,true);
const broken=await w.request(root+'auth.js?v='+version);
assert.equal(broken.response.status,503);
assert.match(await broken.response.text(),/Reconnect and reopen/);
result.failClosedMissingAsset=true;
for(const url of [
 root+'auth.js?v='+version+'&user=private',
 root+'auth/v1/token',root+'storage/v1/object/closet-private/account/secret.jpg',
 root+'private-photo.jpg',
 'https://hlkgymugtfbirlpunsra.supabase.co/auth/v1/user',
 'https://qlwotqbqxpgkheitsboe.supabase.co/rest/v1/scores',
 'https://abcdefghijklmnopqrst.supabase.co/rest/v1/closet_backups',
 'https://other.example/script.js',
 root+'index.html?redirect_to=unsafe'
]){
 const answer=await w.request(url);
 assert.equal(answer.intercepted,false,'Worker touched non-release path '+url);
}
result.privateAndLiveRoutesBypass=true;
assert.equal((await w.request(root+'index.html','POST')).intercepted,false);
result.writeMethodsBypass=true;
await w.lifecycle('activate');
assert.equal(w.storage.has(oldStage),false,'Old staging cache not pruned');
assert.equal(w.storage.has(installed),true,'Installed staging cache deleted');
assert.equal(w.storage.has(fakeProduction),true,'Production-named cache was evicted');
assert.equal(w.storage.has('other-origin-app'),true,'Unrelated cache was evicted');
assert.deepEqual(w.deleted,[oldStage]);
result.productionCacheUntouched=true;result.obsoleteStageCacheEvicted=true;
await assert.rejects(mockWorker({installFails:true}).lifecycle('install'),/Synthetic storage quota/);
result.installQuotaFailureTest=true;
const unavailable=await mockWorker({cacheUnavailable:true}).request(root);
assert.equal(unavailable.response.status,503);
result.cacheUnavailableDenied=true;
console.log('STAGING_SERVICE_WORKER_CACHE_QA '+JSON.stringify(result));
