// Real Chromium/WebKit integration for exact public/cloud-backup-bridge.js
// and actual browser IndexedDB. Synthetic owner sessions; external traffic is
// intercepted and never reaches hosted auth, Storage or cloud backup.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const out=resolve(process.argv[2]||'benchmark/mission3-cloud-restore-owner-browser');
await mkdir(out,{recursive:true});
const jpeg='data:image/jpeg;base64,'+(await sharp({create:{width:320,height:320,
 channels:3,background:{r:90,g:110,b:173}}}).jpeg().toBuffer()).toString('base64');
const root=resolve('public'),types={'.html':'text/html','.js':'text/javascript',
 '.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const full=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!full.startsWith(root+'/')||pathname.includes('\\'))throw Error('Invalid path');
  const bytes=await readFile(full);
  res.writeHead(200,{'content-type':types[extname(full)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const cases=[],errors=[];
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const stage=width===320?'readAll':width===390?'looks':'board';
   const ownerA='a'+width+'0000-0000-4000-8000-000000000000';
   const ownerB='b'+width+'0000-0000-4000-8000-000000000000';
   const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
    hasTouch:true,serviceWorkers:'block'});
   const outside=[];
   try{
    await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
     "window.closetAuth={user:{id:'"+ownerA+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    await context.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',body:
     "window.closetCloud={start:async (ownerDB,callbacks)=>{window.__cloudRestoreDB=ownerDB;window.__cloudRestoreCallbacks=callbacks;return {started:true};},beforeWrite:async()=>{},changed:()=>{}};"}));
    await context.route('**/*',route=>{
     const target=new URL(route.request().url());
     if(target.protocol==='blob:'||target.protocol==='data:'||target.hostname==='127.0.0.1')
      return route.fallback();
     outside.push({method:route.request().method(),path:target.pathname,action:'blocked'});
     return route.abort();
    });
    await context.addInitScript(()=>{
     class OfflineWorker{
      constructor(){this.onmessage=null;this.terminated=false;}
      postMessage(message){setTimeout(()=>{
       if(!this.terminated)this.onmessage?.({data:{id:message.id,
        type:message.type==='load'?'ready':'result',choices:[],strong:false,details:{}}});
      },0);}
      terminate(){this.terminated=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:OfflineWorker});
    });
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push({engine,width,error:String(error)}));
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.__cloudRestoreCallbacks,{timeout:15000});
    await page.evaluate(async({ownerA,jpeg,stage})=>{
     const persist=(database,row)=>new Promise((done,reject)=>{
      const tx=database.transaction(['items','state'],'readwrite');
      tx.objectStore('items').put(row);
      tx.objectStore('state').put({id:'draft',batch:[]});
      tx.oncomplete=done;tx.onerror=()=>reject(tx.error);
     });
     await persist(db,normalizeClothing({id:'garment-A',ownerId:ownerA,
      name:'Owner A shirt',category:'Tops',color:'Blue',image:jpeg}));
     window.__originalReads={
      readAllFrom,readDraftFrom,reloadCloudLooks,reloadCloudBoard
     };
     window.__restoreStageStarted=false;
     const gate=new Promise(resolve=>{window.__releaseOldRestore=resolve;});
     if(stage==='readAll'){
      readAllFrom=async ownerDB=>{
       // Complete the actual IndexedDB read before suspending its response:
       // logout closes the old connection, so do not begin a *new* read
       // after the sign-out event has already revoked the database.
       const snapshot=await window.__originalReads.readAllFrom(ownerDB);
       window.__restoreStageStarted=true;await gate;
       return snapshot;
      };
     }else if(stage==='looks'){
      reloadCloudLooks=async opts=>{
       window.__restoreStageStarted=true;await gate;
       return window.__originalReads.reloadCloudLooks(opts);
      };
     }else{
      reloadCloudBoard=async opts=>{
       window.__restoreStageStarted=true;await gate;
       return window.__originalReads.reloadCloudBoard(opts);
      };
     }
     window.__oldRestoreOutcome=window.__cloudRestoreCallbacks.restored()
      .then(()=>({completed:true}),error=>({completed:false,error:String(error)}));
    },{ownerA,jpeg,stage});
    await page.waitForFunction(()=>window.__restoreStageStarted===true,{timeout:15000});
    const result=await page.evaluate(async({ownerB,jpeg})=>{
     window.dispatchEvent(new Event('closet:session-locked'));
     window.closetAuth.user={id:ownerB};
     db=await openDB();
     const b=normalizeClothing({id:'garment-B',ownerId:ownerB,
      name:'Owner B sneakers',category:'Shoes',itemType:'Sneakers',color:'Red',image:jpeg});
     await new Promise((done,reject)=>{
      const tx=db.transaction(['items','state'],'readwrite');
      tx.objectStore('items').put(b);
      tx.objectStore('state').put({id:'draft',batch:[]});
      tx.oncomplete=done;tx.onerror=()=>reject(tx.error);
     });
     items=[b];batch=[];render();
     window.__releaseOldRestore();
     const old=await window.__oldRestoreOutcome;
     const afterOld=await readAllFrom(db);
     const uiAfterOld={items:items.map(x=>({id:x.id,ownerId:x.ownerId})),
      persisted:afterOld.map(x=>({id:x.id,ownerId:x.ownerId})),
      old,oldCanRestore:window.__cloudRestoreCallbacks.canRestore(),
      count:document.getElementById('closetCount').textContent};
     readAllFrom=window.__originalReads.readAllFrom;
     readDraftFrom=window.__originalReads.readDraftFrom;
     reloadCloudLooks=window.__originalReads.reloadCloudLooks;
     reloadCloudBoard=window.__originalReads.reloadCloudBoard;
     await mission3ReloadOwnerCloudView(ownerWardrobeMutationLease(),{queueUnreviewed:false});
     const afterB=await readAllFrom(db);
     return {uiAfterOld,afterB:afterB.map(x=>({id:x.id,ownerId:x.ownerId})),
      owner:window.closetAuth.user.id,visible:items.map(x=>({id:x.id,ownerId:x.ownerId})),
      cloudStatus:document.getElementById('cloudStatus').textContent};
    },{ownerB,jpeg});
    assert.equal(result.owner,ownerB);
    assert.equal(result.uiAfterOld.old.completed,false);
    assert.match(result.uiAfterOld.old.error,/Private wardrobe changed accounts/);
    assert.equal(result.uiAfterOld.oldCanRestore,false);
    assert.deepEqual(result.uiAfterOld.items,[{id:'garment-B',ownerId:ownerB}]);
    assert.deepEqual(result.uiAfterOld.persisted,[{id:'garment-B',ownerId:ownerB}]);
    assert.deepEqual(result.afterB,[{id:'garment-B',ownerId:ownerB}]);
    assert.deepEqual(result.visible,[{id:'garment-B',ownerId:ownerB}]);
    assert.equal(result.uiAfterOld.count,'1');
    assert.equal(outside.some(x=>x.method!=='GET'),false,'Attempted external write');
    assert.equal(outside.every(x=>x.action==='blocked'),true);
    cases.push({engine,width,stage,source:'actual public/index.html + cloud-backup-bridge.js + native IndexedDB',
     staleRestoreRejected:true,currentOwnerUnchanged:true,freshOwnerReloadWorks:true,
     syntheticOwners:true,hostedCloud:false,physicalDevice:false,abortedExternalReads:outside});
   }finally{await context.close();await browser.close();}
  }
 }
 assert.equal(cases.length,6);assert.deepEqual(errors,[]);
 const receipt={kind:'mission3-cloud-restore-owner-refresh-browser',familyAlpha:'HOLD',
  realChromiumWebKit:true,nativeIndexedDB:true,hostedCloud:false,physicalDevices:false,cases,errors};
 const json=JSON.stringify(receipt,null,2)+'\n';
 await writeFile(resolve(out,'results.json'),json);
 await writeFile(resolve(out,'sha256.txt'),createHash('sha256').update(json).digest('hex')+'  results.json\n');
 console.log('PASS: six real Chromium/WebKit synthetic owner private cloud restore refresh cases');
}finally{server.close();}
