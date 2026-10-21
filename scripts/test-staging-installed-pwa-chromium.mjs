// Real Chromium service-worker install/activation/cache test of the GENERATED
// staging-dist build. Runs only on a disposable 127.0.0.1 origin, never on
// hosted Pages/Supabase, never signs in or loads customer data.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname,resolve,sep} from 'node:path';
import {chromium} from 'playwright';

const stage=JSON.parse(await readFile('staging-dist/staging-preflight.json','utf8'));
assert.equal(stage.backendProjectRef,'abcdefghijklmnopqrst');
assert.equal(stage.stagingOrigin,'https://preview.closet-current-staging.pages.dev/');
assert.equal(stage.privateCloudflareAccessPolicyVerified,false);
assert.equal(stage.productionReleaseApproved,false);
const fingerprint=stage.bundleFingerprint;
assert.match(fingerprint,/^[a-f0-9]{12}$/);
const versionCache='closet-current-staging-'+fingerprint;
const olderCache='closet-current-staging-aaaaaaaaaaaa';
const prodCache='closet-current-123456789abc';
const releaseIndex=await readFile('staging-dist/index.html','utf8');
const releaseAuth=await readFile('staging-dist/auth.js','utf8');
const root=resolve('staging-dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json',
 '.webmanifest':'application/manifest+json','.svg':'image/svg+xml',
 '.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.bin':'application/octet-stream'};
const substitutions=new Map(),seen=[];
const server=createServer(async(req,res)=>{
 const pathname=new URL(req.url||'/','http://localhost').pathname;
 seen.push({method:req.method,path:pathname});
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 try{
  if(pathname==='/__sw-harness.html'){
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
   return res.end('<!doctype html><html><head><title>Offline PWA QA</title></head><body>Only synthetic tests</body></html>');
  }
  if(pathname==='/__private-fixture'){
   res.writeHead(200,{'Content-Type':'text/plain'});return res.end('UNCACHED_PRIVATE_NETWORK');
  }
  if(req.method!=='GET'){
   res.writeHead(405,{'Content-Type':'text/plain'});return res.end('NETWORK_METHOD_DENIED');
  }
  if(substitutions.has(pathname)){
   res.writeHead(200,{'Content-Type':'text/plain'});return res.end(substitutions.get(pathname));
  }
  const name=resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));
  if(!name.startsWith(root+sep)){res.writeHead(403);return res.end('Forbidden');}
  const bytes=await readFile(name);
  res.writeHead(200,{'Content-Type':types[extname(name)]||'application/octet-stream'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes)});
const localOrigin='http://127.0.0.1:'+server.address().port;
let browser;
const outside=[];
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({serviceWorkers:'allow',isMobile:true,hasTouch:true,
  viewport:{width:390,height:844},deviceScaleFactor:3});
 try{
  context.on('request',request=>{
   if(new URL(request.url()).origin!==localOrigin)outside.push(request.url());
  });
  const page=await context.newPage();
  page.setDefaultTimeout(40000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(localOrigin+'/__sw-harness.html',{waitUntil:'load'});
  const secure=await page.evaluate(()=>({secure:isSecureContext,serviceWorkers:!!navigator.serviceWorker}));
  assert.deepEqual(secure,{secure:true,serviceWorkers:true},
   'Loopback must be a trustworthy service-worker origin');
  // Artificial Cache Storage entries simulate hypothetical namespace
  // collisions. A staging worker must never delete the production-like one.
  await page.evaluate(async({olderCache,prodCache})=>{
   for(const name of [olderCache,prodCache,'other-project-cache']){
    const cache=await caches.open(name);
    await cache.put('/__synthetic-sentinel',new Response('keep '+name));
   }
  },{olderCache,prodCache});
  await page.evaluate(()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}));
  await page.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated',
    null,{timeout:60000});
  const state=await page.evaluate(async()=>({
   keys:await caches.keys(),controller:navigator.serviceWorker.controller?.state,
   registered:(await navigator.serviceWorker.getRegistration('/'))?.active?.state
  }));
  assert.equal(state.controller,'activated');
  assert.ok(state.keys.includes(versionCache),'Generated staging cache not installed');
  assert.ok(!state.keys.includes(olderCache),'Obsolete staging cache not removed');
  assert.ok(state.keys.includes(prodCache),'Production-named cache was removed');
  assert.ok(state.keys.includes('other-project-cache'),'Unrelated cache removed');
  // Fetches from the *actual active* service worker must return the immutable
  // pre-cached bytes, never newer server content under an old ?v= alias.
  const first=await page.evaluate(async version=>{
   const [home,auth]=await Promise.all([
    fetch('/index.html'),fetch('/auth.js?v='+version)]);
   return {homeStatus:home.status,homeText:await home.text(),
    authStatus:auth.status,authText:await auth.text()};
  },fingerprint);
  assert.equal(first.homeStatus,200);assert.equal(first.homeText,releaseIndex);
  assert.equal(first.authStatus,200);assert.equal(first.authText,releaseAuth);
  substitutions.set('/index.html','UNTRUSTED_NEW_HTML');
  substitutions.set('/auth.js','UNTRUSTED_NEW_AUTH_SCRIPT');
  const before=seen.length;
  const pinned=await page.evaluate(async version=>{
   const [home,auth]=await Promise.all([fetch('/index.html'),fetch('/auth.js?v='+version)]);
   return {home:await home.text(),auth:await auth.text()};
  },fingerprint);
  assert.equal(pinned.home,releaseIndex);
  assert.equal(pinned.auth,releaseAuth);
  assert.equal(seen.length,before,
   'Active worker fetched mutable server assets instead of immutable cache');
  // A real offline browser must retain the pre-cached shell and script.
  await context.setOffline(true);
  const offline=await page.evaluate(async version=>{
   const [home,auth]=await Promise.all([fetch('/'),fetch('/auth.js?v='+version)]);
   return {homeStatus:home.status,homeText:await home.text(),
    authStatus:auth.status,authText:await auth.text()};
  },fingerprint);
  assert.equal(offline.homeStatus,200);
  assert.equal(offline.homeText,releaseIndex);
  assert.equal(offline.authStatus,200);
  assert.equal(offline.authText,releaseAuth);
  // Remove an installed asset from the REAL Cache Storage while offline.
  // Old app must respond 503; it must NEVER fetch a new script as fallback.
  const missing=await page.evaluate(async({fingerprint,versionCache})=>{
   const cache=await caches.open(versionCache);
   const deleted=await cache.delete('/auth.js?v='+fingerprint);
   const response=await fetch('/auth.js?v='+fingerprint);
   return {deleted,status:response.status,body:await response.text()};
  },{fingerprint,versionCache});
  assert.equal(missing.deleted,true);
  assert.equal(missing.status,503);
  assert.match(missing.body,/Reconnect and reopen/);
  // Unrelated customer-photo/API paths must NOT be served from the PWA cache.
  const external=await page.evaluate(async()=>{
   try{await fetch('/__private-fixture');return 'unexpected-offline-response';}
   catch{return 'offline-network-rejected';}
  });
  assert.equal(external,'offline-network-rejected');
  await context.setOffline(false);
  const bypass=await page.evaluate(async version=>{
   const a=await fetch('/__private-fixture');
   const b=await fetch('/auth.js?v='+version,{method:'POST',body:'synthetic'});
   return {privateStatus:a.status,privateText:await a.text(),
    postStatus:b.status,postText:await b.text()};
  },fingerprint);
  assert.deepEqual(bypass,{privateStatus:200,privateText:'UNCACHED_PRIVATE_NETWORK',
   postStatus:405,postText:'NETWORK_METHOD_DENIED'});
  const keys=await page.evaluate(()=>caches.keys());
  assert.ok(keys.includes(prodCache),'Production cache unexpectedly evicted');
  assert.ok(!keys.includes(olderCache),'Old staging cache survived activation');
  assert.deepEqual(errors,[],'Browser runtime errors');
  assert.deepEqual(outside,[],'External network request attempted');
  const report={engine:'Android Chromium (Playwright)',realBrowserServiceWorker:true,
   localhostOnly:true,syntheticBackendOnly:true,release:fingerprint,
   stagingNamespace:versionCache,productionNamedCachePreserved:true,
   olderStagingCacheRemoved:true,immutableAppShellAndScript:true,
   offlinePinnedShellAndScript:true,missingCacheAssetFailedClosed503:true,
   nonReleasePathNotCached:true,postNeverCached:true,
   externalNetworkRequests:0,hostedSupabaseContacted:false,
   hostedCloudflareAccessTested:false,installedPhysicalPhoneTested:false,
   iphoneServiceWorkerTested:false,productionPromotion:'BLOCKED'};
  console.log('STAGING_REAL_CHROMIUM_SW_QA '+JSON.stringify(report));
 }finally{await context.close();}
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
