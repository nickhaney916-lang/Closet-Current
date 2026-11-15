import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';
import {mutateOwnerItem91} from './lib/owner-item-mutation91.mjs';
const engine=process.env.P91_ENGINE||'chromium';
assert.ok(['chromium','webkit'].includes(engine));
const server=createServer((req,res)=>{res.setHeader('content-type','text/html');res.end('<title>P91 disposable IDB regression</title>');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
const page=await browser.newPage();
const origin='http://127.0.0.1:'+server.address().port;
const results=[];
async function seed(){
 await page.goto(origin);
 await page.evaluate(async()=>{
  window.closetAuth={user:{id:'fixture-A'},assertCurrent(){if(this.user?.id!=='fixture-A')throw Error('fixture locked');}};
  window.db=await new Promise((resolve,reject)=>{
   const request=indexedDB.open('closet-current-user-fixture-A',1);
   request.onupgradeneeded=()=>request.result.createObjectStore('items',{keyPath:'id'});
   request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
  await new Promise((resolve,reject)=>{
   const tx=db.transaction('items','readwrite');
   tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error);
   tx.objectStore('items').put({id:1,ownerId:'fixture-A',color:'original',originalPhoto:{image:'data:image/jpeg;base64,'+'A'.repeat(900)}});
  });
  window.commits91=0;
  window.addEventListener('closet:style-owned-inventory-committed',()=>++window.commits91);
 });
}
async function hold(){
 await page.evaluate(()=>{
  window.release91=false;
  const tx=db.transaction('items','readonly'),store=tx.objectStore('items');
  function read(){store.get(1).onsuccess=()=>{if(!window.release91)read();};}
  read();
 });
}
async function pending(){await page.waitForFunction(()=>window.__ownerMutation91?.status==='pending');}
async function row(){return page.evaluate(()=>new Promise((resolve,reject)=>{
 const tx=db.transaction('items','readonly'),req=tx.objectStore('items').get(1);
 tx.oncomplete=()=>resolve(req.result);tx.onabort=tx.onerror=()=>reject(tx.error);
}));}
try{
 await seed();
 let navigations=0;page.on('framenavigated',()=>++navigations);
 const documentId=await page.evaluate(()=>window.documentId91=crypto.randomUUID());
 await page.evaluate(()=>history.replaceState(null,'','?export=fixture'));
 assert.equal(navigations,1);
 assert.equal(await page.evaluate(()=>window.documentId91),documentId);
 results.push('same-document history event distinguished from document replacement');
 let cdp;
 if(engine==='chromium'){
  cdp=await page.context().newCDPSession(page);
  const collected=page.evaluate(()=>new Promise(()=>{})).then(()=>null,error=>error);
  await cdp.send('HeapProfiler.collectGarbage');
  const error=await collected;
  assert.match(error.message,/Execution context was destroyed/);
  assert.equal(await page.evaluate(()=>window.documentId91),documentId);
  assert.equal(navigations,1);
  results.push('legacy generic context error reproduced under GC without navigation');
 }
 await hold();
 const committing=mutateOwnerItem91(page,{id:1,ownerId:'fixture-A',operation:'color'});
 await pending();
 if(cdp)await cdp.send('HeapProfiler.collectGarbage');
 assert.equal(await page.evaluate(()=>window.__ownerMutation91.status),'pending');
 await page.evaluate(()=>{window.release91=true;});
 await committing;
 assert.equal((await row()).color,'Disposable synthetic edit');
 assert.equal(await page.evaluate(()=>window.commits91),1);
 results.push('queued real IDB transaction survives GC; exactly one durable commit notification');
 await mutateOwnerItem91(page,{id:1,ownerId:'fixture-A',operation:'jpeg-byte'});
 assert.notEqual((await row()).originalPhoto.image,'data:image/jpeg;base64,'+'A'.repeat(900));
 results.push('JPEG-byte negative-test mutation completes');
 await seed();await hold();
 const aborting=mutateOwnerItem91(page,{id:1,ownerId:'fixture-A',operation:'color'}).then(()=>null,error=>error);
 await pending();
 await page.evaluate(()=>{window.__ownerMutation91.transaction.abort();window.release91=true;});
 assert.match((await aborting).message,/P91 IDB/);
 assert.equal((await row()).color,'original');
 assert.equal(await page.evaluate(()=>window.commits91),0);
 results.push('actual IDB abort rejected; no write or false commit notification');
 await seed();await hold();
 const switching=mutateOwnerItem91(page,{id:1,ownerId:'fixture-A',operation:'color'}).then(()=>null,error=>error);
 await pending();
 await page.evaluate(()=>{window.closetAuth.user={id:'fixture-B'};window.release91=true;});
 assert.match((await switching).message,/P91 owner|fixture locked|P91 IDB/);
 assert.equal((await row()).color,'original');
 assert.equal(await page.evaluate(()=>window.commits91),0);
 results.push('owner switch before write rejected and transaction aborted');
 await seed();await hold();
 const replacing=mutateOwnerItem91(page,{id:1,ownerId:'fixture-A',operation:'color'}).then(()=>null,error=>error);
 await pending();
 await page.reload({waitUntil:'domcontentloaded'});
 assert.match((await replacing).message,/document replaced|Execution context was destroyed/);
 results.push('document replacement fails acceptance; write never retried');
 console.log('P91_BROWSER_IDB_LIFECYCLE_PASS',JSON.stringify({engine,checks:results,release:'HOLD'}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
