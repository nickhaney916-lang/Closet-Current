// Actual browser owner-session integration: unmodified app controller and native IDB.
// Only localhost and synthetic two-owner data. No real account or customer photo.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';

const out=resolve(process.argv[2]||'benchmark/mission3-private-mutation-browser');
await mkdir(out,{recursive:true});
const root=resolve('public');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const full=resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
  if(!full.startsWith(root+'/')||url.pathname.includes('\\'))throw Error('Unsafe path');
  const bytes=await readFile(full);
  res.writeHead(200,{'content-type':types[extname(full)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url='http://127.0.0.1:'+server.address().port;
const receipts=[],errors=[];
try{
 for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const ownerA='a'+width+'0000-0000-4000-8000-000000000000';
   const ownerB='b'+width+'0000-0000-4000-8000-000000000000';
   const browser=await browserType.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const blocked=[];
   try{
    await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',
     body:"window.closetAuth={user:{id:'"+ownerA+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    await context.route('**/*',route=>{
     const requestUrl=new URL(route.request().url());
     if(['blob:','data:'].includes(requestUrl.protocol)||requestUrl.hostname==='127.0.0.1')return route.fallback();
     blocked.push(requestUrl.origin);
     return route.abort();
    });
    await context.addInitScript(()=>{
     class OfflineWorker{
      constructor(){this.onmessage=null;this.terminated=false;}
      postMessage(msg){setTimeout(()=>{
       if(!this.terminated)this.onmessage?.({data:{id:msg.id,type:msg.type==='load'?'ready':'result',strong:false,categoryConfirmed:false,choices:[],details:{}}});
      },0);}
      terminate(){this.terminated=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:OfflineWorker});
    });
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push({engine,width,error:String(e)}));
    await page.goto(url+'/',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>closetReady);
    const receipt=await page.evaluate(async({ownerA,ownerB})=>{
     const delId='shared-delete',bulkId='shared-bulk',newId='new-owner-live';
     const open=owner=>new Promise((resolve,reject)=>{
      const req=indexedDB.open('closet-current-user-'+owner,2);
      req.onupgradeneeded=()=>{
       if(!req.result.objectStoreNames.contains('items'))req.result.createObjectStore('items',{keyPath:'id'});
       if(!req.result.objectStoreNames.contains('state'))req.result.createObjectStore('state',{keyPath:'id'});
      };
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
     });
     const put=(database,records)=>new Promise((resolve,reject)=>{
      const tx=database.transaction('items','readwrite');
      for(const row of records)tx.objectStore('items').put(row);
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
     });
     const get=(database,id)=>new Promise((resolve,reject)=>{
      const req=database.transaction('items','readonly').objectStore('items').get(id);
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
     });
     const rows=owner=>[
      {id:delId,ownerId:owner,category:'Tops',color:owner===ownerA?'Blue':'Red',image:'data:image/jpeg;base64,/9j/'},
      {id:bulkId,ownerId:owner,category:'Tops',color:owner===ownerA?'Black':'Green',image:'data:image/jpeg;base64,/9j/'}
     ];
     const dbA=db;
     if(dbA?.name!=='closet-current-user-'+ownerA)throw Error('Owner A wardrobe not loaded');
     await put(dbA,rows(ownerA));
     const dbB=await open(ownerB);await put(dbB,rows(ownerB));
     const savedQueued=queued;
     let release;
     const held=new Promise(yes=>release=yes);
     queued=fn=>held.then(fn);
     const deleting=removeItem(delId,await get(dbA,delId)).then(()=> 'resolved',()=> 'rejected');
     const bulk=writeAll([{id:bulkId,ownerId:ownerA,category:'Tops',color:'Purple',image:'data:image/jpeg;base64,/9j/'}]).then(()=> 'resolved',()=> 'rejected');
     window.dispatchEvent(new Event('closet:session-locked'));
     window.closetAuth.user={id:ownerB};db=dbB;items=rows(ownerB);batch=[];
     release();
     const [deleteStatus,bulkStatus]=await Promise.all([deleting,bulk]);
     const deleteRow=await get(dbB,delId),bulkRow=await get(dbB,bulkId);
     queued=fn=>Promise.resolve().then(fn);
     await writeAll([{id:newId,ownerId:ownerB,category:'Shoes',color:'Brown',image:'data:image/jpeg;base64,/9j/'}]);
     const saveRow=await get(dbB,newId);
     await removeItem(newId,saveRow);
     const afterRemoval=await get(dbB,newId);
     queued=savedQueued;
     dbB.close();
     return {deleteStatus,bulkStatus,
      newOwnerDeletionPrevented:deleteRow?.ownerId===ownerB,
      newOwnerOverwritePrevented:bulkRow?.ownerId===ownerB&&bulkRow.color==='Green',
      newOwnerSaveWorks:saveRow?.ownerId===ownerB,
      newOwnerDeleteWorks:afterRemoval===undefined};
    },{ownerA,ownerB});
    assert.deepEqual(Object.values(receipt),['rejected','rejected',true,true,true,true]);
    receipts.push({engine,width,...receipt,realIndexedDB:true,simulatedOwners:true,hostedAuth:false,physicalDevice:false,networkCallsBlocked:blocked.length});
   }finally{await context.close();await browser.close();}
  }
 }
 assert.equal(receipts.length,6);
 assert.deepEqual(errors,[]);
 const evidence={kind:'mission3-owner-private-mutators',familyAlpha:'HOLD',hostedSupabase:false,
  realChromiumWebKit:true,syntheticOwners:true,physicalDevice:false,releaseAuthorized:false,
  cases:receipts,errors};
 const json=JSON.stringify(evidence,null,2)+'\n';
 await writeFile(resolve(out,'results.json'),json);
 await writeFile(resolve(out,'sha256.txt'),createHash('sha256').update(json).digest('hex')+'  results.json\n');
 console.log('PASS: six actual browser IndexedDB account-switch mutation cases; no remote access');
}finally{server.close();}
