// Exact sealed PR181 baseline vs candidate; real local service workers, no
// hosted requests, sign-in, customer records, camera or file input.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {extname,resolve,sep} from 'node:path';
import {chromium,webkit} from 'playwright';
import {auditStagingSupportRoutes} from './audit-staging-support-routes.mjs';
const baseline=process.env.STAGING_ROUTE_BASELINE_DIR;
assert.ok(baseline,'Set STAGING_ROUTE_BASELINE_DIR to the sealed original PR181 bundle');
const original=await auditStagingSupportRoutes(baseline);
assert.equal(original.sealSha256,'6b482e98100196119d3002c283cbb1afe6ec4737a2b07a7fc2ad264f11099338','Baseline must exactly match the original downloaded PR181 artifact');
const candidate=await auditStagingSupportRoutes('staging-dist');
assert.notEqual(candidate.bundleFingerprint,original.bundleFingerprint,'Fixed staging worker needs a fresh immutable cache namespace');
const pages=['pilot-data-notice','saved-closet-audit','phone-photo-check'];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.bin':'application/octet-stream','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const results=[];
const selection=process.env.STAGING_ROUTE_ENGINE||'both';
assert.ok(['both','chromium','webkit'].includes(selection));
const chromeChannel=process.env.STAGING_ROUTE_CHROME_CHANNEL;
assert.ok(!chromeChannel||chromeChannel==='chrome');
async function check(directory,label,engine,engineName){
 const root=resolve(directory),report=await auditStagingSupportRoutes(root);
 const files=new Set(JSON.parse(await readFile(resolve(root,'staging-asset-seal.json'),'utf8')).files.map(x=>x.path));
 const seen=[],outside=[];let browser,originUnavailable=false;
 const server=createServer(async(req,res)=>{
  try{
   if(originUnavailable){req.socket.destroy();return;}
   const url=new URL(req.url,'http://local');seen.push(url.pathname);
   res.setHeader('Cache-Control','no-store');
   if(req.method!=='GET'){res.writeHead(405);return res.end('No writes');}
   if(url.pathname==='/__route-harness'){
    res.writeHead(200,{'Content-Type':'text/html'});return res.end('<!doctype html><title>Only local route QA</title>');
   }
   // Faithful to Pages' documented automatic extensionless HTML redirects.
   if(url.pathname.endsWith('.html')&&files.has(url.pathname.slice(1))){
    res.writeHead(301,{Location:url.pathname.replace(/\/index\.html$/,'/').replace(/\.html$/,'')+url.search});return res.end();
   }
   let path=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
   if(!files.has(path)&&files.has(path+'.html'))path+='.html';
   const full=resolve(root,path);if(!full.startsWith(root+sep))throw Error('invalid path');
   const bytes=await readFile(full);res.writeHead(200,{'Content-Type':mime[extname(full)]||'application/octet-stream'});res.end(bytes);
  }catch{res.writeHead(404);res.end('Not found');}
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const origin='http://127.0.0.1:'+server.address().port;
 try{
  browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox'],...(chromeChannel?{channel:chromeChannel}:{})}: {})});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'allow'});
  await context.route('**/*',route=>{
   if(new URL(route.request().url()).origin===origin)return route.continue();
   outside.push('blocked-external-'+route.request().method());return route.abort('blockedbyclient');
  });
  const page=await context.newPage();page.setDefaultTimeout(25000);
  const consoleErrors=[];page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text());});
  await page.goto(origin+'/__route-harness');
  await page.evaluate(()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}));
  await page.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated',null,{timeout:60000});
  const cached=await page.evaluate(async fingerprint=>{
   const cache=await caches.open('closet-current-staging-'+fingerprint),r=await cache.match('/pilot-data-notice.html');
   return {redirected:r.redirected,url:new URL(r.url).pathname,status:r.status};
  },report.bundleFingerprint);
  assert.deepEqual(cached,{redirected:true,url:'/pilot-data-notice',status:200});
  const navigations=[];
  for(const route of pages){
   const paths=label==='baseline'?['/'+route+'.html']:['/'+route+'.html','/'+route];
   for(const path of paths){
    // A Chrome error-page navigation can finish after goto rejects. Isolate
    // each expected failure in its own tab rather than racing the error page.
    const probe=label==='baseline'?await context.newPage():page;
    if(label!=='baseline')await page.goto(origin+'/__route-harness');
    probe.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text());});
    let response,error;
    try{response=await probe.goto(origin+path,{waitUntil:'domcontentloaded',timeout:15000});}catch(e){error=e;}
    if(label==='baseline'){
     assert.ok(error,'Original worker must reproduce redirected-navigation failure: '+path);
     assert.match(error.message,/net::ERR_FAILED|redirect|service worker/i);
     navigations.push({path,networkFailureReproduced:true});await probe.close();continue;
    }
    assert.ifError(error);assert.equal(response.status(),200);
    const body=await response.body(),expected=await readFile(resolve(root,route+'.html'));
    assert.equal(createHash('sha256').update(body).digest('hex'),createHash('sha256').update(expected).digest('hex'));
    assert.equal(await page.locator('h1').count(),1,'Real standalone page, not a silent SPA fallback');
    await page.locator('a[href="./"]').first().click();
    await page.waitForURL(origin+'/');assert.equal(await page.locator('#authGate').count(),1);
    navigations.push({path,status:200,exactPageBytes:true,returnToApp:true});
   }
  }
  const offline=[];
  if(label==='candidate'){
   // Actual app notice link remains in this browser tab; never hand Access
   // cookies to a different Android browser through a target=_blank launch.
   await page.goto(origin+'/');
   assert.equal(await page.locator('a[href="pilot-data-notice.html"][target="_blank"]').count(),0);
   assert.equal(await page.locator('a[href="saved-closet-audit.html"][target="_blank"]').count(),0);
   const before=context.pages().length;
   await page.getByRole('link',{name:'How are my photos stored?'}).click();
   await page.waitForURL(origin+'/pilot-data-notice.html');assert.equal(context.pages().length,before);
   // Playwright WebKit's offline navigation API produced an internal engine
   // error after online routes passed. Keep that limitation explicit; for
   // WebKit, take the local origin down instead and test its real worker cache.
   if(engine===chromium)await context.setOffline(true);else originUnavailable=true;
   for(const path of pages.flatMap(p=>['/'+p+'.html','/'+p])){
    const response=await page.goto(origin+path,{waitUntil:'domcontentloaded'});
    assert.equal(response.status(),200);assert.equal(await page.locator('h1').count(),1);offline.push(path);
   }
   const missing=await page.evaluate(async fingerprint=>{
    const cache=await caches.open('closet-current-staging-'+fingerprint);await cache.delete('/pilot-data-notice.html');
    return (await fetch('/pilot-data-notice')).status;
   },report.bundleFingerprint);
   assert.equal(missing,503,'Missing immutable HTML may not fall back to a newer network release');
   // A hostile cached Access response may not be laundered into release HTML.
   if(engine===chromium)await context.setOffline(false);else originUnavailable=false;
  }
  results.push({label,engine:engineName,realServiceWorker:true,canonicalRedirectCacheObserved:cached,navigations,offlineRoutes:offline,
   originalRedirectErrorsObserved:label==='baseline'?consoleErrors.filter(x=>/redirect|FetchEvent/i.test(x)).length:0,
   offlineSimulation:engine===chromium?'browser-offline':'origin-unavailable',playwrightOfflineApiVerified:engine===chromium,
   externalRequestsAllowed:0,externalAttemptsBlocked:outside.length,customerDataAccessed:false,physicalPhoneTested:false,hostedRoutesVerified:false});
  await context.close();
 }finally{await browser?.close();await new Promise(ok=>server.close(ok));}
}
// Chromium enforces redirect=manual on navigation; baseline is a negative control.
if(selection!=='webkit'){
 await check(baseline,'baseline',chromium,'Android Chromium emulation');
 await check('staging-dist','candidate',chromium,'Android Chromium emulation');
}
if(selection!=='chromium')await check('staging-dist','candidate',webkit,'iPhone WebKit emulation');
await mkdir('artifacts/issue185',{recursive:true});
await writeFile('artifacts/issue185/browser-routes-'+selection+'.json',JSON.stringify(results,null,2)+'\n');
console.log('ISSUE185_LOCAL_SERVICE_WORKER_ROUTES '+JSON.stringify(results));
