'use strict';
// Real Chromium/WebKit service-worker event behavior, synthetic low-volume cache manifest.
// Uses the generated production SW logic without changing application state or authentication.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const compiled=fs.readFileSync('dist/sw.js','utf8');
const index=fs.readFileSync('dist/index.html','utf8');
const original=index.match(/app\.js\?v=([a-f0-9]{12})/);
assert.ok(original,'exact built app release version required');
const oldVersion=original[1],newVersion=oldVersion==='ffffffffffff'?'eeeeeeeeeeee':'ffffffffffff';
let deployment='old';
const shell=(version)=>'<!doctype html><html><head><title>SW synthetic acceptance</title></head><body>'+
  '<script src="app.js?v='+version+'"></script>'+
  '<script>navigator.serviceWorker.register("./sw.js").catch(error=>console.error(error));</script>'+
  '</body></html>';
const worker=version=>{
 const assets=['index.html','app.js?v='+version,'scanner-errors.mjs'];
 const rewritten=compiled.replaceAll(oldVersion,version).replace(
  /const FILES=\[[^\n]*\];/,'const FILES='+JSON.stringify(assets)+';');
 assert.ok(rewritten.includes('const FILES='+JSON.stringify(assets)+';'),
   'replace only the generated asset manifest for low-volume synthetic test');
 return rewritten;
};
async function launchServer(){
 const server=http.createServer((request,response)=>{
  const url=new URL(request.url,'http://localhost');
  const version=deployment==='old'?oldVersion:newVersion;
  const resource=({ '/':'text/html; charset=utf-8',
    '/index.html':'text/html; charset=utf-8', '/sw.js':'text/javascript; charset=utf-8',
    '/app.js':'text/javascript; charset=utf-8','/scanner-errors.mjs':'text/javascript; charset=utf-8' })[url.pathname];
  if(!resource){response.writeHead(404);response.end('Not found');return;}
  const body=url.pathname==='/sw.js'?worker(version):
   url.pathname==='/'||url.pathname==='/index.html'?shell(version):
   url.pathname==='/app.js'?'window.TEST_ASSET_VERSION="'+deployment+'";':
   'export const TEST_STATIC_IMPORT="'+deployment+'";';
  response.writeHead(200,{'content-type':resource,'cache-control':'no-store'});
  response.end(body);
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 return {base:'http://127.0.0.1:'+server.address().port+'/',close:()=>new Promise(resolve=>server.close(resolve))};
}
const read=async(page,version)=>page.evaluate(async value=>{
 const out={};
 for(const resource of ['app.js?v='+value,'scanner-errors.mjs','index.html']){
  const response=await fetch(resource);
  out[resource]=response.status===200?await response.text():String(response.status);
 }
 return out;
},version);
async function controlled(browser,base){
 const context=await browser.newContext({serviceWorkers:'allow'});
 const page=await context.newPage();
 await page.goto(base,{waitUntil:'load',timeout:30000});
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:30000});
 return {context,page};
}
async function exercise(name,engine,base){
 const browser=await engine.launch({headless:true});
 const record=[];
 try{
  deployment='old';
  const initial=await controlled(browser,base);
  try{
   assert.equal(await initial.page.evaluate(()=>window.TEST_ASSET_VERSION),'old');
   const before=await read(initial.page,oldVersion);
   assert.match(before['app.js?v='+oldVersion],/VERSION="old"/);
   assert.match(before['scanner-errors.mjs'],/="old"/);
   assert.equal(before['index.html'],shell(oldVersion));
   deployment='new';
   const after=await read(initial.page,oldVersion);
   assert.match(after['app.js?v='+oldVersion],/VERSION="old"/,
     name+' reused stale app query must not load new bytes');
   assert.match(after['scanner-errors.mjs'],/="old"/,
     name+' old Worker static imports must not load new bytes');
   assert.equal(after['index.html'],shell(newVersion),
     name+' fresh online shell remains reachable');
   const inspect=async()=>initial.page.evaluate(async()=>{
    const keys=await caches.keys();
    return Promise.all(keys.map(async key=>{
     const cache=await caches.open(key);
     const value=await cache.match('index.html');
     const html=value?await value.text():'';
     return {cache:key,htmlVersion:html.match(/app\\.js\\?v=([a-f0-9]{12})/)?.[1]||'missing'};
    }));
   });
   const onlineCache=await inspect();
   await initial.context.setOffline(true);
   const offline=await read(initial.page,oldVersion);
   const offlineCache=await inspect();
   assert.equal(offline['index.html'],shell(oldVersion),
     name+' old offline shell remains paired with old scripts; online '+JSON.stringify(onlineCache)+
     ' offline '+JSON.stringify(offlineCache));
   assert.match(offline['app.js?v='+oldVersion],/VERSION="old"/);
   assert.match(offline['scanner-errors.mjs'],/="old"/);
   record.push({engine:name,phase:'old controlled client during new deployment',status:'PASS'});
  }finally{await initial.context.close();}
  deployment='new';
  const fresh=await controlled(browser,base);
  try{
   assert.equal(await fresh.page.evaluate(()=>window.TEST_ASSET_VERSION),'new');
   await fresh.context.setOffline(true);
   const offline=await read(fresh.page,newVersion);
   assert.equal(offline['index.html'],shell(newVersion));
   assert.match(offline['app.js?v='+newVersion],/VERSION="new"/);
   assert.match(offline['scanner-errors.mjs'],/="new"/);
   record.push({engine:name,phase:'fresh version activation and offline fallback',status:'PASS'});
  }finally{await fresh.context.close();}
 }finally{await browser.close();}
 return record;
}
(async()=>{
 const server=await launchServer();
 try{
  const matrix=[];
  matrix.push(...await exercise('Chromium',chromium,server.base));
  matrix.push(...await exercise('WebKit',webkit,server.base));
  console.log(JSON.stringify({status:'PASS',scope:'real browser SW fetch and cache behavior with synthetic small manifest',
    nativeModel:false,authenticatedOwner:false,physicalDevices:false,familyAlpha:'HOLD',matrix},null,2));
 }finally{await server.close();}
})().catch(error=>{console.error(error.stack||String(error));process.exitCode=1;});
