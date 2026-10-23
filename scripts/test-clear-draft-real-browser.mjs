// Synthetic loopback browser QA of actual IndexedDB transactions for Clear photos.
// Never fetches hosted apps, hosted Supabase, customer records or real pictures.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';
const source=await readFile('public/app.js','utf8');
const begin=source.indexOf('async function clearUnfinishedPhotosSafely(){');
const end=source.indexOf('\n// A sign-out must never silently discard',begin);
assert.ok(begin>=0&&end>begin,'Missing committed safe Clear handler');
const handler=source.slice(begin,end);
const server=createServer((req,res)=>{
 res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
 res.end('<!doctype html><title>Disposable local IndexedDB photo test</title><body>No customer data</body>');
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const results=[];
try {
 for(const [name,engine]of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox'],channel:'chrome'}:{})});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const errors=[],outside=[];
  try {
   await context.route('**/*',route=>{
    if(new URL(route.request().url()).origin===origin)return route.continue();
    outside.push(route.request().url());return route.abort('blockedbyclient');
   });
   const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   await page.goto(origin,{waitUntil:'load'});
   const report=await page.evaluate(async code=>{
    const database=await new Promise((resolve,reject)=>{
     const request=indexedDB.open('closet-current-user-owner-A',1);
     request.onupgradeneeded=()=>request.result.createObjectStore('state',{keyPath:'id'});
     request.onsuccess=()=>resolve(request.result);
     request.onerror=()=>reject(request.error);
    });
    const initial=[{id:'photo-1',image:'synthetic-blue-only'},{id:'photo-2',image:'synthetic-grey-only'}];
    const put=record=>new Promise((resolve,reject)=>{
     const tx=database.transaction('state','readwrite');
     tx.objectStore('state').put(record);
     tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
    });
    const get=()=>new Promise((resolve,reject)=>{
     const tx=database.transaction('state','readonly'),request=tx.objectStore('state').get('draft');
     request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    });
    await put({id:'draft',batch:initial});
    const make=abort=>{
     const wrappedDB={name:database.name,transaction(...args){
      const tx=database.transaction(...args);
      if(abort)queueMicrotask(()=>tx.abort());
      return tx;
     }};
     const fakeWindow={closetAuth:{user:{id:'owner-A'}},closetUnsavedDraftOwner:'owner-A'};
     const declarations=[
      'let db=database,batch=originalBatch,session=3,clearingDraft=false;',
      'let busy=false,cameraOpening=false,stream=null,saving=false,automaticRunning=false;',
      'let automaticQueue=[],localPending=new Set(),localJobs=new Map();',
      'let reports=[],renders=0;',
      "const elements={discard:{disabled:false},draftSaveStatus:{textContent:''},retryDraftSave:{hidden:false}};",
      'const $=id=>elements[id],message=m=>reports.push(m),render=()=>renders++,confirm=()=>true;',
      'const queued=work=>Promise.resolve().then(work);',
      code,
      'return {run:clearUnfinishedPhotosSafely,getBatch:()=>batch,getStatus:()=>elements,reports:()=>reports};'
     ].join('\n');
     const fn=new Function('window','database','originalBatch',declarations);
     return fn(fakeWindow,wrappedDB,structuredClone(initial));
    };
    const failed=make(true),failedResult=await failed.run(),afterFailure=await get();
    const failure={result:failedResult,visible:failed.getBatch().length,
      durable:afterFailure.batch.length,buttonEnabled:!failed.getStatus().discard.disabled,
      status:failed.getStatus().draftSaveStatus.textContent};
    const successful=make(false),successResult=await successful.run(),afterSuccess=await get();
    const success={result:successResult,visible:successful.getBatch().length,
      durable:afterSuccess.batch.length,buttonEnabled:!successful.getStatus().discard.disabled,
      ownerDatabase:database.name};
    database.close();
    return {failure,success};
   },handler);
   assert.equal(report.failure.result,false);
   assert.equal(report.failure.visible,2);
   assert.equal(report.failure.durable,2);
   assert.equal(report.failure.buttonEnabled,true);
   assert.match(report.failure.status,/Your photos are still here/);
   assert.equal(report.success.result,true);
   assert.equal(report.success.visible,0);
   assert.equal(report.success.durable,0);
   assert.equal(report.success.buttonEnabled,true);
   assert.equal(report.success.ownerDatabase,'closet-current-user-owner-A');
   assert.deepEqual(errors,[]);
   assert.deepEqual(outside,[]);
   results.push({browser:name,realIndexedDB:true,
    abortPreservedPhotos:true,successfulCommitClearedPhotos:true,
    applicationPageErrors:0,externalNetworkRequests:0,hostedTested:false,
    physicalPhoneTested:false,cloudPhotoErasureVerified:false});
  }finally{await context.close();await browser.close();}
 }
 console.log('REAL_BROWSER_CLEAR_DRAFT_DURABILITY '+JSON.stringify(results));
}finally{await new Promise(resolve=>server.close(resolve));}
