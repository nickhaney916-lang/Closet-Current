// Mission 3: real native Chromium/WebKit and IndexedDB backup selection race.
// Two synthetic signed owners, abort all external traffic, no hosted credentials.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const out=resolve(process.argv[2]||'benchmark/mission3-edit-backup-owner-browser');
await mkdir(out,{recursive:true});
const jpeg='data:image/jpeg;base64,'+(await sharp({create:{
 width:320,height:320,channels:3,background:{r:60,g:110,b:180}
}}).jpeg().toBuffer()).toString('base64');
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
   const ownerA='a'+width+'0000-0000-4000-8000-000000000000';
   const ownerB='b'+width+'0000-0000-4000-8000-000000000000';
   const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
    hasTouch:true,serviceWorkers:'block'});
   const outside=[];
   try{
    await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
     "window.closetAuth={user:{id:'"+ownerA+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
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
    await page.evaluate(()=>closetReady);
    // Delayed File.text from A, but B must own the active private wardrobe
    // when decoding completes. The stale handler may neither confirm nor save.
    await page.evaluate(({ownerA,jpeg})=>{
     window.__backupConfirms=0;
     window.confirm=()=>{window.__backupConfirms++;return true;};
     const old={format:'closet-current',version:3,items:[{
      id:'stale-A-import',ownerId:ownerA,category:'Tops',
      color:'Blue',name:'Old owner shirt',image:jpeg}]};
     window.oldImportReadStarted=false;
     window.oldImportJSON=JSON.stringify(old);
     window.oldImportPending=document.getElementById('import').onchange({target:{
      files:[{size:window.oldImportJSON.length,text:()=>new Promise(resolve=>{
       window.oldImportReadStarted=true;window.finishOldImport=()=>resolve(window.oldImportJSON);
      })}],value:'selected'}});
    },{ownerA,jpeg});
    await page.waitForFunction(()=>window.oldImportReadStarted===true,{timeout:12000});
    const check=await page.evaluate(async({ownerB,jpeg})=>{
     window.dispatchEvent(new Event('closet:session-locked'));
     window.closetAuth.user={id:ownerB};
     db=await openDB();
     const b=normalizeClothing({id:'same-source-id',ownerId:ownerB,category:'Shoes',
      itemType:'Sneakers',color:'Red',colorSource:'user',name:'Current shoes',image:jpeg,
      originalPhoto:{image:jpeg,sha256:'b'.repeat(64)}});
     await new Promise((done,reject)=>{
      const tx=db.transaction('items','readwrite');
      tx.objectStore('items').put(b);tx.oncomplete=done;tx.onerror=()=>reject(tx.error);
     });
     items=[b];batch=[];render();
     window.finishOldImport();
     await window.oldImportPending;
     const stored=await readAllFrom(db);
     const first={stored:stored.map(x=>({id:x.id,ownerId:x.ownerId,color:x.color})),
      confirms:window.__backupConfirms};
     // Prove a live second owner can still intentionally restore their own
     // valid backup after the revoked first owner's completion.
     const valid={format:'closet-current',version:3,items:[{
      id:'new-B-import',ownerId:ownerB,category:'Tops',
      color:'Green',name:'Current owner shirt',image:jpeg}]};
     await document.getElementById('import').onchange({target:{
      files:[{size:5000,text:async()=>JSON.stringify(valid)}],value:'selected'}});
     const after=await readAllFrom(db);
     return {first,after:after.map(x=>({id:x.id,ownerId:x.ownerId})),
      confirms:window.__backupConfirms,owner:window.closetAuth.user.id};
    },{ownerB,jpeg});
    assert.equal(check.owner,ownerB);
    assert.deepEqual(check.first.stored,[{id:'same-source-id',ownerId:ownerB,color:'Red'}]);
    assert.equal(check.first.confirms,0);
    assert.equal(check.after.some(x=>x.id==='stale-A-import'),false);
    assert.equal(check.after.some(x=>x.id==='new-B-import'&&x.ownerId===ownerB),true);
    assert.equal(check.after.some(x=>x.id==='same-source-id'&&x.ownerId===ownerB),true);
    assert.equal(check.confirms,1);
    assert.equal(outside.some(x=>x.method!=='GET'),false,'External write attempted');
    assert.equal(outside.every(x=>x.action==='blocked'),true);
    cases.push({engine,width,syntheticOwners:true,nativeIndexedDB:true,
     oldOwnerDelayedImportRejected:true,currentOwnerValidImportWorks:true,
     noCrossAccountWrite:true,physicalPhone:false,hostedCloud:false,abortedExternalReads:outside});
   }finally{await context.close();await browser.close();}
  }
 }
 assert.equal(cases.length,6);
 assert.deepEqual(errors,[]);
 const result={kind:'mission3-edit-backup-owner-native-browser',
  familyAlpha:'HOLD',realChromiumWebKit:true,realIndexedDB:true,
  hostedSupabase:false,physicalDevices:false,cases,errors};
 const json=JSON.stringify(result,null,2)+'\n';
 await writeFile(resolve(out,'results.json'),json);
 await writeFile(resolve(out,'sha256.txt'),
  createHash('sha256').update(json).digest('hex')+'  results.json\n');
 console.log('PASS: six real Chromium/WebKit native delayed backup import owner-switch cases');
}finally{server.close();}
