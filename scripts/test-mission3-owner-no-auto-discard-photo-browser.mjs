// Real Chromium/WebKit Android/iPhone-like viewport regression, native IDB
// and actual app.js recognizeItem. Synthetic owner IDs & SHA-matched JPEGs;
// no hosted calls, no physical-device or human accuracy claim.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const output=resolve(process.argv[2]||'benchmark/mission3-owner-photo-no-auto-discard-browser');
await mkdir(output,{recursive:true});
const root=resolve('public');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const jpeg=async color=>sharp({create:{width:192,height:128,channels:3,background:color}}).jpeg({quality:88}).toBuffer();
const photos=await Promise.all([
 jpeg({r:110,g:165,b:183}),
 jpeg({r:42,g:65,b:96})
]).then(arr=>arr.map(raw=>({
 image:'data:image/jpeg;base64,'+raw.toString('base64'),
 sha:createHash('sha256').update(raw).digest('hex')
})));
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const full=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!full.startsWith(root+'/')||pathname.includes('\\'))throw Error('unsafe path');
  res.writeHead(200,{'content-type':types[extname(full)]||'application/octet-stream',
   'cache-control':'no-store'});
  res.end(await readFile(full));
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const receipts=[];
try{
 for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const owner='a'+width+'9999-9999-4999-8999-999999999999';
   const other='b'+width+'9999-9999-4999-8999-999999999999';
   const browser=await browserType.launch({headless:true,
    args:engine==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},
    isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const errors=[],offHost=[];
   const login=async(ctx,id)=>{
    await ctx.route('**/auth.js*',r=>r.fulfill({contentType:'text/javascript',
     body:"window.closetAuth={user:{id:'"+id+"'},ready:Promise.resolve(),assertCurrent:()=>{},getAccessToken:async()=>'synthetic'};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    await ctx.route('**/cloud-backup.js*',r=>r.fulfill({contentType:'text/javascript',
     body:"window.closetCloud={start:async()=>{},beforeWrite:async()=>{},changed:()=>{}};"}));
    await ctx.route('**/*',r=>{
     const target=new URL(r.request().url());
     if(target.hostname==='127.0.0.1'||['blob:','data:'].includes(target.protocol))
      return r.fallback();
     offHost.push({method:r.request().method(),href:target.href});
     return r.abort();
    });
    await ctx.addInitScript(()=>{
     class OfflineWorker{
      constructor(){this.onmessage=null;this.stopped=false;}
      postMessage(m){queueMicrotask(()=>{if(!this.stopped)this.onmessage?.({data:{
       id:m.id,type:m.type==='load'?'ready':'result',choices:[],strong:false,details:{}
      }});});}
      terminate(){this.stopped=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:OfflineWorker});
    });
   };
   const readDraft=page=>page.evaluate(async()=>{
    const request=db.transaction('state').objectStore('state').get('draft');
    return new Promise((ok,fail)=>{
     request.onsuccess=()=>ok(request.result?.batch||[]);
     request.onerror=()=>fail(request.error);
    });
   });
   try{
    await login(context,owner);
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>closetReady);
    const init=await page.evaluate(async({photos})=>{
     // Delay analysis on purpose. Source owner proof and actual device IDB
     // insert execute before any synthetic blank/duplicate model signal.
     window.__realQueueAutomatic=window.queueAutomatic;
     window.queueAutomatic=()=>{};
     const owner=window.closetAuth.user.id;
     const capture=source=>candidate(source.image,{requireDraftCommit:true,
      sourceProof:{image:source.image,sourceSHA256:source.sha,
       sourceHashVerified:true,ownerId:owner,
       originalPhoto:{image:source.image,sha256:source.sha,width:192,height:128}}});
     const accepted=[];
     for(const source of photos)accepted.push(await capture(source));
     return {accepted,ids:batch.map(x=>x.id)};
    },{photos});
    assert.deepEqual(init.accepted,[true,true]);
    assert.equal((await readDraft(page)).length,2);
    const blank=await page.evaluate(async()=>{
     window.__realCheckPhoto=checkPhoto;
     checkPhoto=async()=>({blank:true});
     const row=batch[0];
     await recognizeItem(row);await writes;
     checkPhoto=window.__realCheckPhoto;
     return {id:row.id,image:row.originalPhoto.image,status:row.localStatus};
    });
    assert.match(blank.status,/Original photo kept/);
    assert.equal(blank.image,photos[0].image);
    let rows=await readDraft(page);
    assert.deepEqual(rows.map(x=>x.originalPhoto.image),
     photos.map(p=>p.image));
    assert.deepEqual(rows.map(x=>x.sourceSHA256),photos.map(p=>p.sha));
    assert.equal(rows[0].localAnalyzed,true);

    const duplicate=await page.evaluate(async()=>{
     // A previous saved garment with the same source may appear after
     // capture; heuristic duplicate check must not silently delete new row.
     items.push({...batch[1],id:'already-saved-owner-garment'});
     window.__realCheckPhoto=checkPhoto;
     checkPhoto=async()=>({blank:false,signature:[33,22,11],aspect:1});
     const row=batch[1];
     await recognizeItem(row);await writes;
     checkPhoto=window.__realCheckPhoto;
     return {id:row.id,image:row.originalPhoto.image,
      status:row.localStatus,possibleDuplicate:row.possibleDuplicate};
    });
    assert.equal(duplicate.possibleDuplicate,true);
    assert.match(duplicate.status,/Original photo kept/);
    assert.equal(duplicate.image,photos[1].image);
    rows=await readDraft(page);
    assert.deepEqual(rows.map(x=>x.originalPhoto.image),photos.map(p=>p.image));
    assert.deepEqual(rows.map(x=>x.sourceSHA256),photos.map(p=>p.sha));

    // A true page reload, not just a model mock, must recover both originals.
    await page.reload({waitUntil:'domcontentloaded'});
    await page.evaluate(()=>closetReady);
    rows=await readDraft(page);
    assert.deepEqual(rows.map(x=>x.originalPhoto.image),photos.map(p=>p.image));
    assert.equal(await page.evaluate(()=>batch.length),2);

    // Owner explicitly removes *only* the first review JPEG.
    await page.evaluate(async id=>{
     const selected=batch.find(x=>x.id===id);
     await persistDraft({required:true,mode:'remove',expected:structuredClone(selected)});
     batch=batch.filter(x=>x.id!==id);
     render();
    },blank.id);
    rows=await readDraft(page);
    assert.deepEqual(rows.map(x=>x.originalPhoto.image),[photos[1].image]);
    const foreign=await browser.newContext({viewport:{width,height:844},
     isMobile:true,hasTouch:true,serviceWorkers:'block'});
    try{
     await login(foreign,other);
     const p=await foreign.newPage();
     p.on('pageerror',e=>errors.push(String(e)));
     await p.goto(origin+'/',{waitUntil:'domcontentloaded'});
     await p.evaluate(()=>closetReady);
     assert.deepEqual(await p.evaluate(()=>batch.map(x=>x.image)),[]);
     assert.deepEqual(await readDraft(p),[]);
    }finally{await foreign.close();}
    assert.deepEqual(errors,[]);
    receipts.push({engine,width,synthetic:true,nativeIndexedDB:true,
     blankOriginalRetained:true,duplicateOriginalRetained:true,
     ownerSHA256Preserved:true,realReloadRecoveredOriginals:true,
     ownerManualRemoveOnlyOne:true,foreignOwnerIsolated:true,
     offHostRequestsBlocked:offHost.length});
   }finally{await context.close();await browser.close();}
  }
 }
 assert.equal(receipts.length,6);
 await writeFile(resolve(output,'results.json'),JSON.stringify({status:'PASS',
  familyAlpha:'HOLD',realChromiumWebKit:true,physicalDevices:false,
  hostedCloud:false,independentHumanLabels:false,cases:receipts},null,2));
 console.log('PASS Mission 3 owner-retained original photo quality / exact-match: 6 native browser cases');
}finally{await new Promise(ok=>server.close(ok));}
