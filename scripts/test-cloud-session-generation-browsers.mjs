// Exercise actual IndexedDB and the production cloud client in mobile-sized
// Chromium and WebKit. All cloud/auth replies are local synthetic fixtures.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const engine=await readFile('public/cloud-backup-engine.js','utf8');
const sync=await readFile('public/cloud-backup.js','utf8');
const A='a1111111-1111-4111-8111-111111111111';
const B='b2222222-2222-4222-8222-222222222222';
const server=createServer((req,res)=>{
 res.writeHead(200,{'content-type':'text/html'});
 res.end('<html><body><p id="cloudStatus"></p><p id="cloudBanner"></p><button id="syncCloset"></button><button id="resolveCloudConflict"></button></body></html>');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const results=[];
try{
 for(const [label,engineBrowser] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engineBrowser.launch({headless:true,...(label.startsWith('Android')?{args:['--no-sandbox']}: {})});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
   const page=await ctx.newPage(),errors=[],remoteRequests=[];
   page.on('pageerror',e=>errors.push(e.message));
   let releaseA,receivedA;
   const holdA=new Promise(resolve=>{releaseA=resolve;});
   const onA=new Promise(resolve=>{receivedA=resolve;});
   await page.route('https://hlkgymugtfbirlpunsra.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    remoteRequests.push({owner:url.searchParams.get('owner_id'),token:req.headers().authorization});
    const owner=url.searchParams.get('owner_id')?.slice(3);
    if(url.pathname==='/rest/v1/closet_backups'){
     if(owner===A){receivedA();await holdA;}
     const item=owner===A?'old-a':'new-b';
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{
      revision:1,document:{schemaVersion:1,items:[{id:item,category:'Tops',name:item}],state:{}}
     }])});
    }
    return route.fulfill({status:404,body:'{}',contentType:'application/json'});
   });
   await page.goto('http://127.0.0.1:'+server.address().port+'/');
   await page.addScriptTag({content:engine});
   await page.evaluate(({A,B})=>{
    window.closetAuth={ready:Promise.resolve(),user:{id:A},
     getAccessToken:async()=>window.closetAuth.user.id};
    window.TEST_OWNERS={A,B};window.TEST_DBS={};
    window.newDB=async owner=>new Promise((resolve,reject)=>{
     const request=indexedDB.open('test-private-'+owner,1);
     request.onupgradeneeded=()=>{const db=request.result;
      db.createObjectStore('items',{keyPath:'id'});db.createObjectStore('state',{keyPath:'id'});};
     request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    });
    window.callbacks={
     capture:fn=>fn(),canRestore:()=>true,restored:async()=>{}
    };
   },{A,B});
   await page.addScriptTag({content:sync});
   await page.evaluate(async()=>{window.TEST_DBS.A=await newDB(window.TEST_OWNERS.A);window.TEST_DBS.B=await newDB(window.TEST_OWNERS.B);void window.closetCloud.start(window.TEST_DBS.A,window.callbacks);});
   await onA;
   await page.evaluate(()=>{window.closetAuth.user={id:window.TEST_OWNERS.B};void window.closetCloud.start(window.TEST_DBS.B,window.callbacks);});
   await page.waitForFunction(()=>document.getElementById('cloudStatus').textContent==='Cloud backup up to date');
   releaseA();await page.evaluate(async()=>{await new Promise(resolve=>setTimeout(resolve,100));});
   const check=await page.evaluate(async()=>{
    const read=db=>new Promise((resolve,reject)=>{
     const tx=db.transaction('items','readonly'),r=tx.objectStore('items').getAll();
     r.onsuccess=()=>resolve(r.result.map(x=>x.id));r.onerror=()=>reject(r.error);
    });
    return {A:await read(window.TEST_DBS.A),B:await read(window.TEST_DBS.B),
     status:document.getElementById('cloudStatus').textContent};
   });
   assert.deepEqual(check.A,[]);
   assert.deepEqual(check.B,['new-b']);
   assert.equal(check.status,'Cloud backup up to date');
   assert.deepEqual(errors,[]);
   assert.equal(remoteRequests.length,2);
   assert.equal(remoteRequests[0].token,'Bearer '+A);
   assert.equal(remoteRequests[1].token,'Bearer '+B);
   results.push({browser:label,newAccountRestored:true,previousAccountUntouched:true,
    staleResponseIgnored:true,realDeviceHardware:false,networkUploads:0});
   await ctx.close();
  }finally{await browser.close();}
 }
 console.log('CLOUD_OWNER_SESSION_MOBILE '+JSON.stringify(results));
}finally{server.close();}
