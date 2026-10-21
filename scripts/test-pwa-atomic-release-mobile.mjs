// Browser-level service-worker test with real built files on a loopback origin.
// Synthetic server update, no customer data, real devices, or production deployment.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import {join,normalize,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=process.cwd(),dist=join(root,'dist');
const builtIndex=await fs.readFile(join(dist,'index.html'),'utf8');
const version=builtIndex.match(/auth\.js\?v=([a-f0-9]+)/)?.[1];
assert.ok(version);
const requestCount=new Map();
let updated=false;
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const path=url.pathname.replace(/^\/+/,''),name=path||'index.html';
  requestCount.set(name,(requestCount.get(name)||0)+1);
  if(name==='__test__'){
   res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
   res.end('<!doctype html><html><body>SW release test page</body></html>');
   return;
  }
  if(name==='api/private'){
   res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
   res.end(JSON.stringify({api:true}));return;
  }
  if(updated&&(name==='index.html'||name==='auth.js')){
   res.writeHead(200,{'Content-Type':name.endsWith('.js')?'application/javascript':'text/html',
    'Cache-Control':'no-store'});
   res.end(name==='index.html'?'<!doctype html><title>INCOMPATIBLE_NEW_SERVER_INDEX</title>':
    "'use strict';globalThis.NEW_SERVER_AUTH=true;");
   return;
  }
  const clean=normalize(name);
  if(clean.startsWith('..')||clean.startsWith('/')||clean.includes('\0')){res.writeHead(403);res.end();return;}
  const content=await fs.readFile(join(dist,clean));
  const type=({'.js':'application/javascript','.mjs':'application/javascript','.json':'application/json',
   '.css':'text/css','.html':'text/html','.webmanifest':'application/manifest+json','.png':'image/png',
   '.svg':'image/svg+xml','.woff2':'font/woff2','.bin':'application/octet-stream'})[extname(clean)]||'application/octet-stream';
  res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(content);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port,origin='http://127.0.0.1:'+port+'/';
const results=[];
try{
 for(const [name,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  updated=false;
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,
    isMobile:true,hasTouch:true,serviceWorkers:'allow'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'__test__');
   const before=await page.evaluate(async()=>{
    const r=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
    await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller)await new Promise((resolve,reject)=>{
     let timer=setTimeout(()=>reject(Error('SW controller unavailable')),12000);
     navigator.serviceWorker.addEventListener('controllerchange',()=>{
      clearTimeout(timer);resolve();
     },{once:true});
    });
    const db=await new Promise((resolve,reject)=>{
     const request=indexedDB.open('closet-current-user-fake-local-fixture',1);
     request.onupgradeneeded=()=>request.result.createObjectStore('saved');
     request.onsuccess=()=>resolve(request.result);
     request.onerror=()=>reject(request.error);
    });
    await new Promise((resolve,reject)=>{
     const tx=db.transaction('saved','readwrite');
     tx.objectStore('saved').put('PRIVATE_LOCAL_PHOTO_MUST_SURVIVE','original');
     tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });
    db.close();
    return {controlled:!!navigator.serviceWorker.controller};
   },{});
   // Inject a real compiled build version without deriving a URL in the service worker.
   // The first call is repeated with its exact version after binding it below.
   assert.equal(before.controlled,true);
   await page.evaluate(value=>{globalThis.__versionForTest=value;},version);
   // Re-evaluate exact asset after binding version, since the first unversioned
   // fetch intentionally goes straight to network and is not used as evidence.
   const baseline=await page.evaluate(async()=>({
    html:await (await fetch('./index.html')).text(),
    js:await (await fetch('./auth.js?v='+globalThis.__versionForTest)).text()
   }));
   assert.equal(baseline.html,builtIndex);
   assert.ok(baseline.js.includes('closetAuth'));
   const indexNetworkBefore=requestCount.get('index.html')||0;
   const scriptNetworkBefore=requestCount.get('auth.js')||0;
   updated=true;
   const after=await page.evaluate(async()=>({
    html:await (await fetch('./index.html')).text(),
    js:await (await fetch('./auth.js?v='+globalThis.__versionForTest)).text(),
    remote:await (await fetch('./api/private')).json()
   }));
   assert.equal(after.html,builtIndex,'Old worker serves same-release HTML despite newer server');
   assert.equal(after.js,baseline.js,'Old worker serves same-release auth JS despite newer server');
   assert.deepEqual(after.remote,{api:true},'Private API must bypass service worker');
   assert.equal(requestCount.get('index.html'),indexNetworkBefore,'Stale SW cannot re-download changed index');
   assert.equal(requestCount.get('auth.js'),scriptNetworkBefore,'Stale SW cannot re-download changed scripts');
   await context.setOffline(true);
   const offline=await page.evaluate(async()=>{
    const html=await (await fetch('./')).text();
    const js=await (await fetch('./auth.js?v='+globalThis.__versionForTest)).text();
    const db=await new Promise((resolve,reject)=>{
     const q=indexedDB.open('closet-current-user-fake-local-fixture',1);
     q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
    });
    const retained=await new Promise((resolve,reject)=>{
     const q=db.transaction('saved').objectStore('saved').get('original');
     q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
    });
    db.close();
    let apiUnavailable=false;
    try{await fetch('./api/private');}catch{apiUnavailable=true;}
    return {html,js,retained,apiUnavailable};
   });
   assert.equal(offline.html,builtIndex);
   assert.equal(offline.js,baseline.js);
   assert.equal(offline.retained,'PRIVATE_LOCAL_PHOTO_MUST_SURVIVE');
   assert.equal(offline.apiUnavailable,true);
   assert.deepEqual(errors,[]);
   results.push({browser:name,realServiceWorkerInstalled:true,
    onlineNewServerReleaseDidNotOverwriteCachedOldBundle:true,
    originalOfflineBundleReopened:true,
    customerLikeIndexedDBFixturePreserved:true,
    privateApiNotCached:true,physicalDevice:false,productionDeploy:false});
   await context.close();
  }finally{await browser.close();}
 }
}finally{await new Promise(resolve=>server.close(resolve));}
console.log(JSON.stringify({status:'PASS',results,actualRealWorldPhoneTested:false,productionApproval:false}));
