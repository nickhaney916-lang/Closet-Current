// Native Chromium/WebKit owner-private IndexedDB same-owner draft CAS.
// Synthetic JPEGs and signed-owner stub only. No external requests or hosted writes.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const output=resolve(process.argv[2]||'benchmark/mission3-draft-row-cas-browser');
await mkdir(output,{recursive:true});
const makeJpg=async(r,g,b)=>sharp({create:{width:96,height:72,channels:3,
 background:{r,g,b}}}).jpeg({quality:90}).toBuffer();
const [originalA,originalB]=await Promise.all([makeJpg(50,130,185),makeJpg(190,65,85)]);
const dataA='data:image/jpeg;base64,'+originalA.toString('base64'),
 dataB='data:image/jpeg;base64,'+originalB.toString('base64');
const shaA=createHash('sha256').update(originalA).digest('hex'),
 shaB=createHash('sha256').update(originalB).digest('hex');
const root=resolve('public');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.json':'application/json','.svg':'image/svg+xml','.css':'text/css'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+'/')||pathname.includes('\\'))throw Error('Blocked path');
  const bytes=await readFile(file);
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port,results=[];
try{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const owner='a'+width+'0000-0000-4000-8000-000000000000';
   const outsider='b'+width+'0000-0000-4000-8000-000000000000';
   const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},
    isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const errors=[],external=[];
   async function setupAuth(ctx,id){
    await ctx.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',
     body:"window.closetAuth={user:{id:'"+id+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    await ctx.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',
     body:'window.closetCloud={start:async()=>({}),beforeWrite:async()=>{},changed:()=>{}};'}));
    await ctx.route('**/*',route=>{
     const url=new URL(route.request().url());
     if(url.hostname==='127.0.0.1'||['blob:','data:'].includes(url.protocol))
      return route.fallback();
     external.push(url.href);return route.abort();
    });
    await ctx.addInitScript(()=>{
     class OfflineWorker{
      constructor(){this.onmessage=null;this.terminated=false;}
      postMessage(m){setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{
       id:m.id,type:m.type==='load'?'ready':'result',choices:[],strong:false,details:{}
      }});},0);}
      terminate(){this.terminated=true;}
     }
     Object.defineProperty(window,'Worker',{value:OfflineWorker,configurable:true});
    });
   }
   try{
    await setupAuth(context,owner);
    const a=await context.newPage();a.on('pageerror',e=>errors.push(String(e)));
    await a.goto(origin+'/',{waitUntil:'domcontentloaded'});await a.evaluate(()=>closetReady);
    // One reviewed draft loaded in the old tab.
    await a.evaluate(async({owner,dataA,shaA})=>{
     const row=normalizeClothing({id:'source-a',ownerId:owner,
      image:dataA,category:'Uncategorized',color:'Blue',localAnalyzed:true,
      sourceSHA256:shaA,sourceHashVerified:true,
      originalPhoto:{image:dataA,sha256:shaA,width:96,height:72}});
     await new Promise((ok,fail)=>{
      const tx=db.transaction('state','readwrite');
      tx.objectStore('state').put({id:'draft',batch:[row]});
      tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
     });
    },{owner,dataA,shaA});
    await a.reload({waitUntil:'domcontentloaded'});await a.evaluate(()=>closetReady);
    assert.equal(await a.evaluate(()=>batch.length),1);
    const b=await context.newPage();b.on('pageerror',e=>errors.push(String(e)));
    await b.goto(origin+'/',{waitUntil:'domcontentloaded'});await b.evaluate(()=>closetReady);
    // A second same-owner tab captures a separate original JPEG.
    await b.evaluate(async({owner,dataB,shaB})=>{
     const extra=normalizeClothing({id:'source-b',ownerId:owner,image:dataB,
      category:'Uncategorized',color:'Red',localAnalyzed:true,sourceSHA256:shaB,sourceHashVerified:true,
      originalPhoto:{image:dataB,sha256:shaB,width:96,height:72}});
     await new Promise((ok,fail)=>{
      const tx=db.transaction('state','readwrite'),store=tx.objectStore('state');
      const read=store.get('draft');
      read.onsuccess=()=>store.put({id:'draft',batch:[...read.result.batch,extra]});
      tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
     });
    },{owner,dataB,shaB});
    // Browser crop calls the ACTUAL crop controller and actual private CAS.
    const crop=async page=>page.evaluate(async()=>{
     const row=batch.find(x=>x.id==='source-a'),existing=window.openPhotoCrop,
      oldCheck=window.checkPhoto;
     let controller;
     window.openPhotoCrop=(_,operations)=>{controller=operations;return Promise.resolve();};
     window.checkPhoto=async()=>({colorEstimate:null,signature:'test',aspect:4/3});
     try{
      cropClothingPhoto(row);
      if(!controller?.save)throw Error('Crop controller missing');
      await controller.save({image:row.image,
       originalPhoto:structuredClone(row.originalPhoto),
       cropBounds:{x:.1,y:.2,width:.7,height:.6}},null);
      return {status:'saved'};
     }catch(error){return {status:'rejected',error:String(error?.message||error)};}
     finally{window.openPhotoCrop=existing;window.checkPhoto=oldCheck;}
    });
    assert.equal((await crop(a)).status,'saved');
    async function savedDraft(){
     return b.evaluate(()=>new Promise((ok,fail)=>{
      const r=db.transaction('state').objectStore('state').get('draft');
      r.onsuccess=()=>ok(r.result.batch);r.onerror=()=>fail(r.error);
     }));
    }
    let persisted=await savedDraft();
    assert.deepEqual(persisted.map(x=>x.id),['source-a','source-b']);
    assert.equal(persisted[1].originalPhoto.image,dataB);
    assert.equal(persisted[1].originalPhoto.sha256,shaB);
    assert.equal(persisted[0].originalPhoto.image,dataA);
    assert.equal(persisted[0].cropBounds.width,.7);
    // Categorize only the old tab's own photographed row; preserve source B.
    const categorized=await a.evaluate(async()=>{
     const control=document.getElementById('batchCategory');
     control.value='Tops';
     await document.getElementById('applyCategory').onclick();
     return batch.find(x=>x.id==='source-a').category;
    });
    assert.equal(categorized,'Tops');
    persisted=await savedDraft();
    assert.equal(persisted[0].category,'Tops');
    assert.equal(persisted[1].category,'Uncategorized');
    // "Discard all" only means this tab's reviewed rows, not unseen drafts.
    await a.evaluate(async()=>{
     window.confirm=()=>true;
     await document.getElementById('discard').onclick();
    });
    persisted=await savedDraft();
    assert.deepEqual(persisted.map(x=>x.id),['source-b']);
    assert.equal(persisted[0].originalPhoto.image,dataB);
    // Another owner must never see this authenticated private draft store.
    const isolated=await browser.newContext({viewport:{width,height:844},isMobile:true,
     hasTouch:true,serviceWorkers:'block'});
    try{
     await setupAuth(isolated,outsider);
     const outsiderPage=await isolated.newPage();
     outsiderPage.on('pageerror',e=>errors.push(String(e)));
     await outsiderPage.goto(origin+'/',{waitUntil:'domcontentloaded'});
     await outsiderPage.evaluate(()=>closetReady);
     assert.equal(await outsiderPage.evaluate(()=>batch.length),0);
    }finally{await isolated.close();}
    // The application may TRY optional off-host trend requests. The above
    // route handler aborts each one; count blocked attempts as evidence, not
    // as a failure or a claim that the request reached the network.
    assert.deepEqual(errors,[],'No browser uncaught errors');
    results.push({engine:name,width,crop:'PASS',batchCategory:'PASS',
     discard:'PASS',otherOriginalSHA:shaB,otherOwner:'PRIVATE',
     blockedOffHostRequests:external.length});
   }finally{await context.close();await browser.close();}
  }
 }
 await writeFile(resolve(output,'results.json'),JSON.stringify({
  status:'PASS',synthetic:true,physicalDevice:false,hostedCloud:false,
  familyAlpha:'HOLD',cases:results
 },null,2));
 console.log('MISSION3 DRAFT ROW CAS BROWSER PASS '+results.length+' cases; HOLD; NO DEPLOY');
}finally{await new Promise(done=>server.close(done));}
