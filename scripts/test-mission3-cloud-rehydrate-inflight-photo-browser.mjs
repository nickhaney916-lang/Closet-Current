// Real Chromium/WebKit 320/390/430 source-executed cloud-bridge UI
// rehydration against signed synthetic owners, real IndexedDB and synthetic
// original JPEG/SHA. OFFLINE, NO DEPLOY, NO HOSTED SUPABASE.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-cloud-rehydrate-inflight-photo-browser');
await mkdir(out,{recursive:true});
const root=resolve('public'),mime={'.html':'text/html','.js':'text/javascript',
 '.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};
const jpeg=await sharp({create:{width:120,height:90,channels:3,
 background:{r:75,g:118,b:163}}}).jpeg({quality:88}).toBuffer();
const second=await sharp({create:{width:120,height:90,channels:3,
 background:{r:214,g:103,b:66}}}).jpeg({quality:88}).toBuffer();
const photo={image:'data:image/jpeg;base64,'+jpeg.toString('base64'),
 sha:createHash('sha256').update(jpeg).digest('hex')};
const newPhoto={image:'data:image/jpeg;base64,'+second.toString('base64'),
 sha:createHash('sha256').update(second).digest('hex')};
const server=createServer(async(req,res)=>{
 try{
  const pathName=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const full=resolve(root,'.'+(pathName==='/'?'/index.html':pathName));
  if(!full.startsWith(root+'/')||pathName.includes('\\'))throw Error('bad path');
  res.writeHead(200,{'content-type':mime[extname(full)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(await readFile(full));
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port,receipts=[];
try{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const owner='a'+width+'7777-7777-4777-8777-777777777777';
   const other='b'+width+'8888-8888-4888-8888-888888888888';
   const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
   const ctx=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const errors=[],external=[];
   async function setup(context,id){
    await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',
     body:"window.closetAuth={user:{id:'"+id+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    await context.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',
     body:"window.closetCloud={start:async(_db,callbacks)=>{window.__cloudCallbacks=callbacks;return {started:true};},beforeWrite:async()=>{},changed:()=>{}};"}));
    await context.route('**/*',route=>{
     const target=new URL(route.request().url());
     if(target.hostname==='127.0.0.1'||['data:','blob:'].includes(target.protocol))
      return route.fallback();
     external.push(target.href);return route.abort();
    });
    await context.addInitScript(()=>{
     class OfflineWorker{
      constructor(){this.onmessage=null;this.stopped=false;}
      postMessage(m){queueMicrotask(()=>{if(!this.stopped)this.onmessage?.({
       data:{id:m.id,type:m.type==='load'?'ready':'result',strong:false,choices:[],details:{}}
      });});}
      terminate(){this.stopped=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:OfflineWorker});
    });
   }
   try{
    await setup(ctx,owner);
    const page=await ctx.newPage();
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.__cloudCallbacks);
    await page.evaluate(async({owner,photo})=>{
     const saved=normalizeClothing({id:'saved-original',ownerId:owner,
      name:'Saved top',category:'Tops',image:photo.image,
      sourceSHA256:photo.sha,originalPhoto:{image:photo.image,sha256:photo.sha}});
     const pending=normalizeClothing({...saved,id:'previously-reviewed'});
     await new Promise((ok,fail)=>{
      const tx=db.transaction(['items','state'],'readwrite');
      tx.objectStore('items').put(saved);
      tx.objectStore('state').put({id:'draft',batch:[pending]});
      tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
     });
     items=[saved];batch=[pending];render();
     window.__savedOriginal=saved;
     window.__pendingOriginal=pending;
     window.__readOriginals={readAllFrom,readDraftFrom,reloadCloudLooks};
    },{owner,photo});
    // Pause after a real native IndexedDB saved-items read before the
    // bridge is allowed to publish any draft results.
    await page.evaluate(()=>{
     window.__holdReadStarted=false;
     window.__releaseRead=new Promise(ok=>{window.__allowRead=ok});
     readAllFrom=async connection=>{
      const saved=await window.__readOriginals.readAllFrom(connection);
      window.__holdReadStarted=true;
      await window.__releaseRead;return saved;
     };
     window.__oldCloudRehydrate=window.__cloudCallbacks.restored()
      .then(()=>({ok:true}),error=>({ok:false,message:String(error)}));
    });
    await page.waitForFunction(()=>window.__holdReadStarted);
    await page.evaluate(({owner,newPhoto})=>{
     const fresh=normalizeClothing({id:'camera-new-original',ownerId:owner,
      image:newPhoto.image,sourceSHA256:newPhoto.sha,sourceHashVerified:true,
      originalPhoto:{image:newPhoto.image,sha256:newPhoto.sha},category:'Uncategorized'});
     batch.push(fresh);failedDraftCaptures.add(fresh.id);
     render();
     window.__allowRead();
    },{owner,newPhoto});
    const first=await page.evaluate(()=>window.__oldCloudRehydrate);
    assert.equal(first.ok,false);
    assert.match(first.message,/CLOSET_CLOUD_RELOAD_LOCAL_PHOTO_CHANGED/);
    assert.deepEqual(await page.evaluate(()=>batch.map(row=>row.id)),
     ['previously-reviewed','camera-new-original']);
    assert.equal(await page.evaluate(()=>batch[1].originalPhoto.image),newPhoto.image);
    assert.equal(await page.evaluate(()=>items[0].id),'saved-original');
    await page.evaluate(()=>{
     readAllFrom=window.__readOriginals.readAllFrom;
     failedDraftCaptures.clear();
     batch=[window.__pendingOriginal];
    });
    // The remote data can be reloaded after the local capture is resolved.
    await page.evaluate(()=>window.__cloudCallbacks.restored());
    assert.deepEqual(await page.evaluate(()=>batch.map(row=>row.id)),['previously-reviewed']);
    assert.equal(await page.evaluate(()=>items[0].originalPhoto.image),photo.image);
    // A non-capture owner correction made in-place while a draft read is
    // in flight cannot be silently overwritten either.
    await page.evaluate(()=>{
     window.__draftReadStarted=false;
     window.__releaseDraft=new Promise(ok=>{window.__allowDraft=ok});
     readDraftFrom=async connection=>{
      const draft=await window.__readOriginals.readDraftFrom(connection);
      window.__draftReadStarted=true;
      await window.__releaseDraft;return draft;
     };
     window.__draftCloudRehydrate=window.__cloudCallbacks.restored()
      .then(()=>({ok:true}),error=>({ok:false,message:String(error)}));
    });
    await page.waitForFunction(()=>window.__draftReadStarted);
    await page.evaluate(()=>{
     batch[0].color='Owner confirmed coral';
     window.__allowDraft();
    });
    const changed=await page.evaluate(()=>window.__draftCloudRehydrate);
    assert.equal(changed.ok,false);
    assert.match(changed.message,/CLOSET_CLOUD_RELOAD_LOCAL_PHOTO_CHANGED/);
    assert.equal(await page.evaluate(()=>batch[0].color),'Owner confirmed coral');
    await page.evaluate(()=>{readDraftFrom=window.__readOriginals.readDraftFrom;});
    // A distinct owner never receives either private original upon load.
    const foreign=await browser.newContext({viewport:{width,height:844},
     isMobile:true,hasTouch:true,serviceWorkers:'block'});
    try{
     await setup(foreign,other);
     const p=await foreign.newPage();
     p.on('pageerror',e=>errors.push(String(e)));
     await p.goto(origin+'/',{waitUntil:'domcontentloaded'});
     await p.evaluate(()=>closetReady);
     assert.deepEqual(await p.evaluate(()=>items.map(x=>x.id)),[]);
     assert.deepEqual(await p.evaluate(()=>batch.map(x=>x.id)),[]);
    }finally{await foreign.close();}
    assert.deepEqual(errors,[]);
    receipts.push({engine:name,width,realBrowserIDB:true,sourceExecuted:true,
     pendingJPEGVisibleAfterDelayedRead:true,originalSHAUnchanged:true,
     inPlaceOwnerColorPreserved:true,cleanRestoreWorks:true,
     distinctOwnerIsolated:true,synthetic:true,
     offHostRequestsBlocked:external.length});
   }finally{await ctx.close();await browser.close();}
  }
 }
 assert.equal(receipts.length,6);
 await writeFile(resolve(out,'results.json'),JSON.stringify({status:'PASS',
  familyAlpha:'HOLD',actualPhones:false,hostedCloud:false,
  synthetic:true,cases:receipts},null,2));
 console.log('PASS: 6 native Chromium/WebKit owner-safe post-cloud-restore rehydration cases; HOLD #255');
}finally{await new Promise(ok=>server.close(ok));}
