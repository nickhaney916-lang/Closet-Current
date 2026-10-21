import {execFileSync} from 'node:child_process';
// Browser-level regression for the real "Style this" path. The actual
// production scripts run on an emulated 390px touch viewport. No accounts,
// vendor calls, paid inference, or unreviewed test photos are used.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';

const root=resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const filename=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!filename.startsWith(root+'/'))throw Error('Disallowed asset');
  const bytes=await readFile(filename);
  res.writeHead(200,{'Content-Type':types[extname(filename)]||'application/octet-stream'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const BASE='8fbe7096e655f06dd9d414521f32d1a11182c322';
const baselineImport=execFileSync('git',['show',BASE+':public/photo-import.js'],{encoding:'utf8'});
const baseApp=execFileSync('git',['show',BASE+':public/app.js'],{encoding:'utf8'});
const baselineDraft=baseApp.slice(baseApp.indexOf('function persistDraft()'),baseApp.indexOf('function readDraft()'));
const results=[];
try{
 for(const [label,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox']}: {})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
   await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
    "window.closetAuth={user:{id:'mobile-storage-local'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
   await context.route('**/cloud-backup-bridge.js*',route=>route.fulfill({contentType:'text/javascript',body:'// Local storage fixture; no hosted calls.'}));
   await context.route('https://raw.githubusercontent.com/**',route=>route.abort('internetdisconnected'));
   let page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const url='http://127.0.0.1:'+server.address().port+'/';await page.goto(url);await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady,inspirationReady]));
   const resources=await page.evaluate(async baseline=>{
    window.closetCloud={beforeWrite:async()=>{},changed(){}};queueAutomatic=()=>{};
    const source=document.createElement('canvas');source.width=4032;source.height=3024;const x=source.getContext('2d');x.fillStyle='#24567a';x.fillRect(0,0,4032,3024);x.fillStyle='#d4a023';for(let i=50;i<3900;i+=63)x.fillRect(i,50,12,2900);
    const blob=await new Promise(r=>source.toBlob(r,'image/jpeg',.96));source.width=source.height=0;
    window.testPhotoFile=new File([blob],'high-resolution.jpg',{type:'image/jpeg'});
    const nativeElement=document.createElement.bind(document),NativeImage=window.Image;
    let canvases=[],images=[];document.createElement=function(tag,...args){const el=nativeElement(tag,...args);if(tag==='canvas')canvases.push(el);return el;};
    window.Image=function(...args){const img=new NativeImage(...args);images.push(img);return img;};
    const old=(new Function(baseline+';return photoToJPEG;'))();
    try{
     const beforePhoto=await old(window.testPhotoFile);const before={retainedCanvasPixels:canvases.reduce((n,c)=>n+c.width*c.height,0),imageSourcesStillAttached:images.filter(i=>i.getAttribute('src')).length};
     for(const c of canvases)c.width=c.height=0;for(const i of images)i.removeAttribute('src');canvases=[];images=[];
     const photos=[];let ticks=0;const timer=setInterval(()=>ticks++,0);
     try{for(let n=0;n<3;n++)photos.push(await photoToJPEG(window.testPhotoFile));}finally{clearInterval(timer);}
     try{await photoToJPEG(new File(['broken image'],'broken.jpg',{type:'image/jpeg'}));throw Error('Bad decode accepted');}catch(e){if(e.message==='Bad decode accepted')throw e;}
     const after={retainedCanvasPixels:canvases.reduce((n,c)=>n+c.width*c.height,0),imageSourcesStillAttached:images.filter(i=>i.getAttribute('src')).length};
     const decoded=new NativeImage();decoded.src=photos[0];await decoded.decode();window.testOriginalPhoto=photos[0];
     return {before,after,sameEncodedPixels:beforePhoto===photos[0],source:[decoded.naturalWidth,decoded.naturalHeight],multipleHighResolutionPhotos:photos.length,timerTicks:ticks};
    }finally{document.createElement=nativeElement;window.Image=NativeImage;}
   },baselineImport);
   assert.deepEqual(resources.source,[3072,2304]);assert.equal(resources.sameEncodedPixels,true);assert.equal(resources.after.retainedCanvasPixels,0);assert.equal(resources.after.imageSourcesStillAttached,0);assert.ok(resources.before.retainedCanvasPixels>0);assert.ok(resources.timerTicks>0);
   const measurements=[];
   for(const count of [3,500]){
    await page.evaluate(async count=>{
     const records=Array.from({length:count},(_,n)=>normalizeClothing({id:'owned-'+n,name:'Saved correction '+n,category:'Tops',itemType:'T-shirt',color:'Blue',image:'data:image/jpeg;base64,/9j/2Q==',userAdjusted:true}));await writeAll(records);items=await readAll();
    },count);
    const measurement=await page.evaluate(async baseline=>{
     const old=(new Function(baseline+';return persistDraft;'))(),nativeClone=window.structuredClone;
     async function run(fn){
      let release;writes=new Promise(r=>release=r);batch=[];let calls=0,characters=0;
      window.structuredClone=value=>{calls++;characters+=Array.isArray(value)?value.reduce((n,x)=>n+(x.image?.length||0),0):0;return nativeClone(value);};
      const promises=[],start=performance.now();
      for(let n=0;n<20;n++){batch.push(normalizeClothing({id:'pending-'+n,name:'Pending '+n,image:window.testOriginalPhoto,category:'Uncategorized',localAnalyzed:true}));promises.push(fn());}
      const eagerCalls=calls;release();try{await Promise.all(promises);await writes;}finally{window.structuredClone=nativeClone;}
      return {snapshotCalls:calls,snapshotCharacters:characters,eagerCalls,elapsedMs:Math.round((performance.now()-start)*100)/100};
     }
     const before=await run(old),after=await run(persistDraft);
     const drafts=await readDraft();return {wardrobe:items.length,before,after,retainedDrafts:drafts.length,originalUnchanged:drafts.every(x=>x.image===window.testOriginalPhoto)};
    },baselineDraft);
    assert.equal(measurement.before.snapshotCalls,20);assert.equal(measurement.after.snapshotCalls,1);assert.equal(measurement.after.eagerCalls,0);assert.equal(measurement.retainedDrafts,20);assert.equal(measurement.originalUnchanged,true);assert.equal(measurement.wardrobe,count);measurements.push(measurement);
   }
   // A synchronous quota error keeps the previous durable draft and all saved
   // wardrobe rows, while preserving the new unsaved photo for explicit retry.
   const quota=await page.evaluate(async()=>{
    window.nativeTransaction=IDBDatabase.prototype.transaction;
    const previous=await readDraft(),saved=JSON.stringify(await readAll());
    IDBDatabase.prototype.transaction=function(...args){const tx=window.nativeTransaction.apply(this,args);if(args[1]!=='readwrite')return tx;const store=tx.objectStore.bind(tx);tx.objectStore=name=>{const s=store(name),put=s.put.bind(s);s.put=row=>{if(name==='state'&&row.id==='draft')throw new DOMException('Synthetic full storage','QuotaExceededError');return put(row);};return s;};return tx;};
    batch=[normalizeClothing({id:'quota-pending',name:'Not yet saved',category:'Uncategorized',image:window.testOriginalPhoto,localAnalyzed:true})];
    const succeeded=await persistDraft();IDBDatabase.prototype.transaction=window.nativeTransaction;
    switchView('review');return {succeeded,priorDraftPreserved:JSON.stringify(await readDraft())===JSON.stringify(previous),wardrobeUnchanged:JSON.stringify(await readAll())===saved,pending:batch.length,status:$('draftSaveStatus').textContent};
   });
   assert.equal(quota.succeeded,false);assert.equal(quota.priorDraftPreserved,true);assert.equal(quota.wardrobeUnchanged,true);assert.equal(quota.pending,1);assert.match(quota.status,/storage is full/);
   await page.locator('#retryDraftSave').tap();await page.waitForFunction(()=>document.getElementById('retryDraftSave').hidden);
   assert.equal(await page.evaluate(async()=>(await readDraft())[0].id),'quota-pending');
   // Pending draft work cannot even call the cloud preflight after account switch.
   const ownership=await page.evaluate(async()=>{let release;writes=new Promise(r=>release=r);let preflights=0;window.closetCloud.beforeWrite=async()=>preflights++;const p=persistDraft();window.closetAuth.user.id='different-owner';release();const result=await p;window.closetAuth.user.id='mobile-storage-local';return {result,preflights};});
   assert.deepEqual(ownership,{result:false,preflights:0});
   await page.reload();await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady,inspirationReady]));assert.equal(await page.evaluate(()=>items.length),500);assert.equal(await page.evaluate(()=>batch[0].id),'quota-pending');
   await page.evaluate(()=>switchView('review'));
   await mkdir('artifacts/mobile-memory-storage',{recursive:true});await page.screenshot({path:'artifacts/mobile-memory-storage/'+(engine===chromium?'android':'iphone')+'.png',fullPage:true});
   assert.deepEqual(errors,[]);results.push({browser:label,resources,measurements,quotaFailureSafe:true,explicitRetryAndReopen:true,accountSwitchBeforePreflightBlocked:true,physicalPhone:false,residentHeapMeasured:false,pageErrors:0});await context.close();
  }finally{await browser.close();}
 }
 console.log('MOBILE_MEMORY_STORAGE '+JSON.stringify(results));
}finally{await new Promise(ok=>server.close(ok));}
