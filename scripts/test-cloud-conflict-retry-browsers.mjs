// Two real browser engines, mocked REST/RPC and real per-account IndexedDB.
// An in-flight Keep both click must cause two distinct edits to be saved.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const owner='a1111111-1111-4111-8111-111111111111';
const base={schemaVersion:1,items:[{id:'shirt',category:'Tops',name:'Base'}],state:{}};
const source=await readFile('public/cloud-backup.js','utf8');
const engine=await readFile('public/cloud-backup-engine.js','utf8');
const html='<html><body><p id="cloudStatus"></p><p id="cloudBanner"></p><button id="syncCloset" hidden>Sync</button><button id="resolveCloudConflict">Keep both versions</button></body></html>';
const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(html);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const results=[];
try{
 for(const [label,type] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await type.launch({headless:true,...(label.startsWith('Android')?{args:['--no-sandbox']}: {})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   let releaseFirst,firstSeen;
   const holdFirst=new Promise(resolve=>releaseFirst=resolve);
   const started=new Promise(resolve=>firstSeen=resolve);
   let reads=0,saves=0;
   let remote={revision:2,document:{schemaVersion:1,items:[{id:'shirt',category:'Tops',name:'Remote'}],state:{}}};
   await page.route('https://hlkgymugtfbirlpunsra.supabase.co/**',async route=>{
    const request=route.request(),url=new URL(request.url()),headers=request.headers();
    assert.equal(headers.authorization,'Bearer '+owner,'No remote request from wrong owner');
    if(url.pathname==='/rest/v1/closet_backups'){
     reads++;if(reads===1){firstSeen();await holdFirst;}
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([remote])});
    }
    if(url.pathname==='/rest/v1/rpc/save_closet_backup'){
     const body=request.postDataJSON();
     assert.equal(body.p_expected_revision,remote.revision);
     saves++;remote={revision:remote.revision+1,document:structuredClone(body.p_document)};
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(remote.revision)});
    }
    throw Error('Unexpected remote path '+url.pathname);
   });
   await page.goto('http://127.0.0.1:'+server.address().port+'/');
   await page.addScriptTag({content:engine});
   await page.evaluate(async ({owner,base})=>{
    window.closetAuth={user:{id:owner},getAccessToken:async()=>owner};
    window.testDb=await new Promise((resolve,reject)=>{
     const r=indexedDB.open('closet-current-user-'+owner,2);
     r.onupgradeneeded=()=>{r.result.createObjectStore('items',{keyPath:'id'});r.result.createObjectStore('state',{keyPath:'id'});};
     r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });
    await new Promise((resolve,reject)=>{
     const tx=window.testDb.transaction(['items','state'],'readwrite');
     tx.objectStore('items').put({id:'shirt',category:'Tops',name:'Local'});
     tx.objectStore('state').put({id:'cloud-sync',baseVersion:1,baseDocument:base,localRevision:1,dirty:true});
     tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });
   },{owner,base});
   await page.addScriptTag({content:source});
   await page.evaluate(()=>{void window.closetCloud.start(window.testDb,{capture:run=>run(),canRestore:()=>true,restored:async()=>{}});});
   await started;
   await page.locator('#resolveCloudConflict').click();
   releaseFirst();
   await page.waitForFunction(()=>document.getElementById('cloudStatus').textContent==='Cloud backup up to date',{timeout:15000});
   const local=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const r=window.testDb.transaction('items').objectStore('items').getAll();
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   }));
   const names=local.map(x=>x.name).sort(),remoteNames=remote.document.items.map(x=>x.name).sort();
   assert.deepEqual(names,['Local (saved copy)','Remote']);
   assert.deepEqual(remoteNames,names,'Cloud and local should contain the same two edits');
   assert.equal(saves,1,'Only a single conflict-resolution RPC needed');
   assert.equal(errors.length,0,JSON.stringify(errors));
   results.push({browser:label,overlappingKeepBothRetained:true,
    distinctEditsSaved:2,cloudAndLocalMatch:true,
    noCrossOwnerRequests:true,syntheticBackend:true,physicalDeviceTested:false});
   await context.close();
  }finally{await browser.close();}
 }
 console.log('CLOUD_CONFLICT_KEEP_BOTH_MOBILE '+JSON.stringify(results));
}finally{server.close();}
