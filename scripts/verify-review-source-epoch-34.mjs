/**
 * REVIEW-SOURCE-EPOCH-34. Real Chromium/WebKit native review-ui and genuine
 * browser IndexedDB against locally generated synthetic source JPEGs.
 * Worker proposals are explicitly simulated: no SegFormer quality claims.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const SHA=x=>createHash('sha256').update(x).digest('hex');
const root=resolve('.'),out=root+'/benchmark/review-source-epoch-34';
await mkdir(out,{recursive:true});
const patterns=[
 ['A','#db3541','#dcb9ae'],
 ['B','#376bd3','#e7c3c3'],
 ['C','#479c58','#f5dbac']
];
const sources={};
for(const [id,shirt,bg] of patterns){
 const svg='<svg width="520" height="400" xmlns="http://www.w3.org/2000/svg">'+
  '<rect width="520" height="400" fill="'+bg+'"/>'+
  '<path d="M150 60 L202 25 L318 25 L365 60 L435 180 L365 220 L335 170 L335 356 L178 356 L178 170 L119 218 L90 173 Z" fill="'+shirt+'"/>'+
  '<path d="M203 25 Q260 111 319 25" fill="none" stroke="#494949" stroke-width="6"/></svg>';
 const jpeg=await sharp(Buffer.from(svg)).jpeg({quality:91}).toBuffer();
 sources[id]={image:'data:image/jpeg;base64,'+jpeg.toString('base64'),
  sha256:SHA(jpeg),width:520,height:400};
}
const html='<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<style>body{font:15px/1.4 system-ui;margin:8px}main{max-width:850px;margin:auto}button{padding:8px;border:1px solid #bbb;border-radius:7px}</style>'+
 '</head><body><main><h2>Closet Current · source-epoch review safety</h2><section id="wholeOutfitCapture"></section>'+
 '<input id="outfitCamera" type="file" hidden><input id="outfitUpload" type="file" hidden></main></body></html>';
const server=createServer(async(req,res)=>{
 try{
  if(req.method!=='GET')throw Error('Writes forbidden');
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/'){res.writeHead(200,{'content-type':'text/html'}).end(html);return;}
  if(!/^\/research\/multi-garment-capture-01\/(review-ui|atomic-group|review-triage-28|flatlay-contrast-29|scene-class-guard-32)\.mjs$/.test(path)&&
     path!=='/research/capture-proof-01/source-proof.mjs')throw Error('Unapproved path '+path);
  res.writeHead(200,{'content-type':'text/javascript'}).end(await readFile(root+path));
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const cases=[],blocked=[],errors=[];
try{
 for(const [engine,launcher] of Object.entries({chromium,webkit})){
  const browser=await launcher.launch();
  try{
   for(const width of [320,390,430]){
    const ctx=await browser.newContext({viewport:{width,height:950},
     isMobile:true,hasTouch:true,serviceWorkers:'block'});
    await ctx.route('**/*',route=>{
     const req=route.request();
     if(!req.url().startsWith(origin+'/')||!['GET','HEAD'].includes(req.method())){
      blocked.push({engine,width,method:req.method()});return route.abort();
     }
     return route.continue();
    });
    const page=await ctx.newPage();
    page.on('pageerror',e=>errors.push({engine,width,error:e.message.slice(0,150)}));
    await page.goto(origin,{waitUntil:'load'});
    await page.evaluate(async sources=>{
     const db=await new Promise((resolve,reject)=>{
      const r=indexedDB.open('closet-current-user-owner34',1);
      r.onupgradeneeded=()=>r.result.createObjectStore('items',{keyPath:'id'});
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
     });
     const control={pending:new Map(),db,owner:'owner34',saved:0,refreshed:0,
      workerCount:0,staleCrop:null,sources};
     window.__race34=control;
     class FixtureWorker{
      constructor(){this.closed=false;this.onmessage=null;control.workerCount++;}
      postMessage(request){
       queueMicrotask(()=>{
        if(this.closed)return;
        const piece={instanceKey:'seg-4-10-12-100-120-1',
         cropBounds:{x:.12,y:.08,width:.7,height:.78},
         image:request.image,personDetected:false,
         hint:{categories:['Tops'],types:[],clipped:false,confidence:.99},
         colorEstimate:{color:'Red'}};
        this.onmessage?.({data:{id:request.id,type:'piece',piece}});
        this.onmessage?.({data:{id:request.id,type:'done',count:1}});
       });
      }
      terminate(){this.closed=true;}
     }
     window.Worker=FixtureWorker;
     window.openPhotoCrop=(_piece,handlers)=>{
      control.staleCrop=handlers.save;
      return new Promise(()=>{});
     };
     const {mountMultiGarmentCapture24}=await import('/research/multi-garment-capture-01/review-ui.mjs');
     control.module=mountMultiGarmentCapture24({
      active:true,doc:document,getOwner:()=>control.owner,getDb:()=>db,
      schema:{types:{Tops:['T-shirt'],Bottoms:['Jeans'],Dresses:['Dress'],Outerwear:['Jacket'],Shoes:['Sneakers']}},
      makeProof:file=>new Promise(resolve=>control.pending.set(file.name,()=>resolve({
       image:sources[file.name].image,sourceSHA256:sources[file.name].sha256,
       sourceHashVerified:true,
       originalPhoto:{image:sources[file.name].image,sha256:sources[file.name].sha256,
        width:sources[file.name].width,height:sources[file.name].height,origin:'fixture'},
      }))),
      queued:async run=>run(),onSaved:async rows=>{control.saved+=rows.length;},
      refreshNative:async()=>{control.refreshed++;}
     });
     if(!control.module.active)throw Error('Native multi24 review failed to mount');
     control.start=name=>control.module.startFile(new File([name],name,{type:'image/jpeg'}));
     control.resolve=name=>{
      const done=control.pending.get(name);
      if(!done)throw Error('Missing deferred proof '+name);
      control.pending.delete(name);done();
     };
     control.current=()=>document.querySelector('.multi24-source')?.src;
     control.card=()=>document.querySelector('article.multi24-card');
     control.dbRows=()=>new Promise((resolve,reject)=>{
      const r=db.transaction('items').objectStore('items').getAll();
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
     });
     control.confirm=()=>{
      const root=document.getElementById('multi24Research'),find=()=>control.card();
      let card=find();const category=card.querySelector('select');
      if(category.value!=='Uncategorized')throw Error('Unverified model class was prefilled');
      category.value='Tops';category.dispatchEvent(new Event('change',{bubbles:true}));
      card=find();const type=card.querySelectorAll('select')[1];
      type.value='T-shirt';type.dispatchEvent(new Event('change',{bubbles:true}));
      card=find();const color=card.querySelector('input[type=text]');
      color.value='Blue';color.dispatchEvent(new Event('input',{bubbles:true}));
      card=find();const check=card.querySelector('input[type=checkbox]');
      if(check.disabled)throw Error('Human fields did not unlock consent');
      check.checked=true;check.dispatchEvent(new Event('change',{bubbles:true}));
      const save=[...root.querySelectorAll('button')].find(x=>x.textContent==='Save confirmed pieces together');
      if(save.disabled)throw Error('Explicitly confirmed row should be saveable');
      return save;
     };
     return true;
    },sources);

    // The older source A resolves AFTER source B; A must never replace B.
    await page.evaluate(()=>{window.__race34.start('A');window.__race34.start('B');
     window.__race34.resolve('B');});
    await page.waitForFunction(()=>{
     const a=window.__race34;
     return a.current()===a.sources.B.image&&!!a.card();
    },null,{timeout:15000});
    await page.evaluate(()=>window.__race34.resolve('A'));
    await page.waitForTimeout(55);
    const first=await page.evaluate(()=>{
     const a=window.__race34;return{
      correctSource:a.current()===a.sources.B.image,
      currentSourceHash:a.module.debug().sourceSHA256,
      oneReviewCard:document.querySelectorAll('article.multi24-card').length===1,
      workerCount:a.workerCount,
      noSavedRows:a.saved===0
     };
    });
    assert.equal(first.correctSource,true);
    assert.equal(first.currentSourceHash,sources.B.sha256);
    assert.equal(first.oneReviewCard,true);
    assert.equal(first.workerCount,1,'stale first source must not launch a model');
    assert.equal(first.noSavedRows,true);

    // Open a crop editor for B, then replace the source with C. The older
    // editor must reject a write even with the SAME signed-in owner.
    await page.evaluate(()=>{
     const a=window.__race34;
     [...a.card().querySelectorAll('button')].find(x=>x.textContent==='Adjust crop/mask').click();
     if(!a.staleCrop)throw Error('Crop editor callback not captured');
     a.start('C');a.resolve('C');
    });
    await page.waitForFunction(()=>{
     const a=window.__race34;
     return a.current()===a.sources.C.image&&!!a.card();
    },null,{timeout:15000});
    const stale=await page.evaluate(async()=>{
     const a=window.__race34;
     let rejected=false;
     try{
      await a.staleCrop({image:a.sources.B.image,
       cropBounds:{x:.17,y:.17,width:.5,height:.5},maskApplied:false});
     }catch(e){rejected=/stale crop|Source changed/.test(String(e));}
     return {rejected,current:a.current()===a.sources.C.image,
      sourceSHA:a.module.debug().sourceSHA256,
      cropUnchanged:a.module.debug().pieces.length===1};
    });
    assert.equal(stale.rejected,true);
    assert.equal(stale.current,true);
    assert.equal(stale.sourceSHA,sources.C.sha256);
    assert.equal(stale.cropUnchanged,true);

    // An explicit human-reviewed C save, cancelled before async IDB lookup
    // completes, must not continue to a storage commit.
    await page.evaluate(()=>{
     const a=window.__race34,save=a.confirm();
     save.click();
     const root=document.getElementById('multi24Research');
     const cancel=[...root.querySelectorAll('button')].find(x=>x.textContent==='Cancel extraction');
     cancel.click();
    });
    await page.waitForTimeout(110);
    const afterCancel=await page.evaluate(async()=>{
     const a=window.__race34;
     return {rows:(await a.dbRows()).length,sourceCleared:
      document.querySelector('.multi24-source').getAttribute('src')===null,
      cards:document.querySelectorAll('article.multi24-card').length,
      onSaved:a.saved};
    });
    assert.deepEqual(afterCancel,{rows:0,sourceCleared:true,cards:0,onSaved:0},
     'cancelled source save cannot write or attach a stale row');

    // A new valid B source, with original source hash, human category, type
    // and color, must save into ACTUAL native browser IndexedDB.
    await page.evaluate(()=>{const a=window.__race34;a.start('B');a.resolve('B');});
    await page.waitForFunction(()=>{
     const a=window.__race34;
     return a.current()===a.sources.B.image&&!!a.card();
    },null,{timeout:15000});
    await page.evaluate(()=>window.__race34.confirm().click());
    await page.waitForFunction(()=>window.__race34.saved===1,null,{timeout:20000});
    const result=await page.evaluate(async()=>{
     const a=window.__race34,r=(await a.dbRows())[0];
     return {rows:(await a.dbRows()).length,owner:r.ownerId,
      sourceSHA:r.sourceSHA256,originalImageUnchanged:r.originalPhoto.image===a.sources.B.image,
      userConfirmed:r.userAdjusted===true&&r.extractionReview==='human-confirmed',
      category:r.category,itemType:r.itemType,color:r.color,
      photoOnly:r.photoOnly,threeDReady:r.threeDReady,
      onSaved:a.saved,refreshed:a.refreshed,
      noRemainingCards:document.querySelectorAll('article.multi24-card').length===0};
    });
    assert.deepEqual(result,{rows:1,owner:'owner34',sourceSHA:sources.B.sha256,
     originalImageUnchanged:true,userConfirmed:true,category:'Tops',
     itemType:'T-shirt',color:'Blue',photoOnly:true,threeDReady:false,
     onSaved:1,refreshed:1,noRemainingCards:true});
    const filename=engine+'-'+width+'.png';
    const png=await page.screenshot({path:out+'/'+filename,fullPage:true});
    const meta=await sharp(png).metadata();
    assert.equal(meta.format,'png');assert.equal(meta.width,width);
    assert.ok(meta.height>=550&&png.length>8500);
    cases.push({engine,width,filename,sha256:SHA(png),
     originalBSourceSHA:sources.B.sha256,staleSameOwnerPhotoIgnored:true,
     staleCropRejected:true,cancelledSaveNoWrites:true,
     finalValidSourceSavedInRealIDB:true,ownerBound:true,sourcePhotoSHAUnchanged:true,
     screenshotSource:'synthetic-licensed-internal-fixture',
     simulatedSegmentation:true,physicalPhone:false});
    await ctx.close();
   }
  }finally{await browser.close();}
 }
 assert.deepEqual(blocked,[],'unexpected external request');
 assert.deepEqual(errors,[],'browser runtime errors');
 assert.equal(cases.length,6);
 const result={priority:'REVIEW-SOURCE-EPOCH-34',baselinePR:589,
  exactParent:'79e957719bd90f7f1cd1ae71ec4bde5ff14ae93c',
  sourcePhotos:'three independently hashed locally generated synthetic JPEGs',
  sourceSHA:Object.fromEntries(Object.entries(sources).map(([k,v])=>[k,v.sha256])),
  actualBrowserEngines:['chromium','webkit'],viewportWidths:[320,390,430],
  realNativeIndexedDB:true,actualReviewUI:true,genuineSegFormerInference:false,
  benchmarkOfSegmentationAccuracy:false,physicalPhoneAcceptance:false,
  actualUISessions:6,externalRequests:blocked,errors,
  autoSave:false,familyAlpha:'HOLD',merged:false,deployed:false,cases};
 await writeFile(out+'/report.json',JSON.stringify(result,null,2)+'\n');
 console.log('REVIEW-EPOCH-34 source and save guards',JSON.stringify({
  browserCases:cases.length,actualNativeIDB:true,crossPhotoStaleProofBlocked:true,
  staleCropRejected:true,cancelledAsyncSaveNoWrites:true,
  fullValidHumanSaveVerified:true,unauthorizedRequests:blocked.length,
  userPhotoUploads:0,FamilyAlpha:'HOLD'}));
}finally{await new Promise(done=>server.close(done));}
