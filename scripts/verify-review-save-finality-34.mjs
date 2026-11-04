import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';

const root=resolve('.'),out=resolve('benchmark/review-save-finality-34');
await mkdir(out,{recursive:true});
const drawing=Buffer.from('<svg width="700" height="520" xmlns="http://www.w3.org/2000/svg"><rect width="700" height="520" fill="#eee"/><path d="M100 40 L170 15 L320 15 L390 40 L410 130 L330 175 L312 125 L310 460 L142 460 L145 125 L125 175Z" fill="#b32a3b"/><rect x="460" y="120" width="110" height="320" fill="#31598b"/></svg>');
const originalBytes=await sharp(drawing).jpeg({quality:87}).toBuffer();
const originalData='data:image/jpeg;base64,'+originalBytes.toString('base64');
const originalSHA=createHash('sha256').update(originalBytes).digest('hex');
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:15px system-ui;margin:12px;background:#fafafa}button{padding:8px}</style></head><body><main><h2>Local reviewed garment save</h2><section id="wholeOutfitCapture"></section><input id="outfitUpload" type="file" hidden><input id="outfitCamera" type="file" hidden></main></body></html>';
const allowed=new Set([
 '/research/multi-garment-capture-01/review-ui.mjs',
 '/research/multi-garment-capture-01/atomic-group.mjs',
 '/research/multi-garment-capture-01/review-triage-28.mjs',
 '/research/multi-garment-capture-01/flatlay-contrast-29.mjs',
 '/research/multi-garment-capture-01/scene-class-guard-32.mjs',
 '/research/multi-garment-capture-01/review-save-finality-34.mjs',
 '/research/capture-proof-01/source-proof.mjs'
]);
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(req.method!=='GET')throw Error('blocked method');
  if(path==='/'){res.writeHead(200,{'content-type':'text/html'}).end(html);return;}
  if(!allowed.has(path))throw Error('blocked path');
  res.writeHead(200,{'content-type':'text/javascript'}).end(await readFile(root+path));
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const cases=[],errors=[],blocked=[];
const digest=buf=>createHash('sha256').update(buf).digest('hex');
try{
 for(const [engine,launcher] of Object.entries({chromium,webkit})){
  const browser=await launcher.launch();
  try{
   for(const width of [320,390,430]){
    const ctx=await browser.newContext({viewport:{width,height:930},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    await ctx.route('**/*',route=>{
     const req=route.request();
     if(!req.url().startsWith(origin+'/')||!['GET','HEAD'].includes(req.method())){
      blocked.push({engine,width,method:req.method()});return route.abort();
     }
     return route.continue();
    });
    const page=await ctx.newPage();
    page.on('pageerror',error=>errors.push({engine,width,error:error.message.slice(0,160)}));
    await page.goto(origin,{waitUntil:'load'});
    await page.evaluate(async({originalData,originalSHA})=>{
     const owner='review34-account';
     const db=await new Promise((resolve,reject)=>{
      const r=indexedDB.open('closet-current-user-'+owner,1);
      r.onupgradeneeded=()=>r.result.createObjectStore('items',{keyPath:'id'});
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
     });
     const audit={owner,db,queued:0,onSavedCalls:0,refreshCalls:0};
     window.__audit34=audit;
     window.__original34=originalData;
     class FakeWorker{
      constructor(){this.closed=false;}
      postMessage(m){
       queueMicrotask(()=>{
        if(this.closed)return;
        this.onmessage?.({data:{id:m.id,type:'piece',piece:{
         instanceKey:'seg-4-10-10-80-80-1',
         cropBounds:{x:.13,y:.08,width:.43,height:.78},personDetected:false,
         hint:{categories:['Tops'],confidence:.99,clipped:false},
         colorEstimate:{color:'Red'}
        }}});
        this.onmessage?.({data:{id:m.id,type:'done'}});
       });
      }
      terminate(){this.closed=true;}
     }
     window.Worker=FakeWorker;
     const {mountMultiGarmentCapture24}=await import('/research/multi-garment-capture-01/review-ui.mjs');
     const mounted=mountMultiGarmentCapture24({
      doc:document,active:true,
      schema:{types:{Tops:['T-shirt'],Bottoms:['Jeans'],Dresses:['Dress'],Outerwear:['Jacket'],Shoes:['Sneakers']}},
      getOwner:()=>audit.owner,getDb:()=>audit.db,
      makeProof:async()=>({image:originalData,sourceSHA256:originalSHA,sourceHashVerified:true,
       originalPhoto:{image:originalData,sha256:originalSHA,width:700,height:520,origin:'synthetic-test'}}),
      queued:fn=>{
       audit.queued++;
       return new Promise((resolve,reject)=>{
        window.__releaseCommit34=()=>Promise.resolve().then(fn).then(resolve,reject);
       });
      },
      onSaved:async()=>{audit.onSavedCalls++;throw Error('intentional display notification fault');},
      refreshNative:async()=>{audit.refreshCalls++;throw Error('intentional closet display fault');}
     });
     if(!mounted.active)throw Error('native research review UI not mounted');
     window.__mounted34=mounted;
     const bytes=Uint8Array.from(atob(originalData.split(',')[1]),x=>x.charCodeAt(0));
     const file=new File([bytes],'synthetic-garment.jpg',{type:'image/jpeg'});
     const input=document.getElementById('outfitUpload');
     Object.defineProperty(input,'files',{configurable:true,value:[file]});
     input.dispatchEvent(new Event('change',{bubbles:true}));
    },{originalData,originalSHA});
    await page.waitForFunction(()=>document.querySelectorAll('article.multi24-card').length===1);
    const card=page.locator('article.multi24-card');
    assert.equal(await card.locator('select').first().inputValue(),'Uncategorized');
    await card.locator('select').first().selectOption('Tops');
    await card.locator('select').nth(1).selectOption('T-shirt');
    await card.locator('input[type=text]').fill('Red');
    await card.locator('input[type=checkbox]').check();
    const save=page.getByRole('button',{name:'Save confirmed pieces together'});
    await save.click();
    await page.waitForFunction(()=>window.__audit34.queued===1,{timeout:10000});
    const during=await page.evaluate(()=>{
     const root=document.getElementById('multi24Research');
     const cancel=[...root.querySelectorAll('button')].find(x=>x.textContent==='Cancel extraction');
     const all=[...root.querySelectorAll('button,article input,article select')];
     const disabled=all.every(x=>x.disabled);
     const color=root.querySelector('article input[type=text]');
     // Even a forced synthetic event on a disabled field cannot alter the
     // approved snapshot or undo an in-flight commit.
     color.value='Blue';
     color.dispatchEvent(new Event('input',{bubbles:true}));
     cancel.dispatchEvent(new MouseEvent('click',{bubbles:true}));
     const state=window.__mounted34.debug();
     return {disabled,cancelDisabled:cancel.disabled,remaining:state.pieces.length,
      saved:window.__audit34.onSavedCalls,reviewedColor:state.pieces[0]?.color,
      sourceUnchanged:root.querySelector('img.multi24-source').src===window.__original34,
      status:root.querySelector('.multi24-status').textContent};
    });
    assert.equal(during.disabled,true);
    assert.equal(during.cancelDisabled,true);
    assert.equal(during.remaining,1);
    assert.equal(during.saved,0);
    assert.equal(during.reviewedColor,'Red');
    assert.equal(during.sourceUnchanged,true);
    assert.match(during.status,/Saving is in progress|Saving the exact confirmed snapshot|Checking duplicate/);
    const pendingFile=engine+'-'+width+'-save-pending.png';
    const pendingImage=await page.screenshot({path:out+'/'+pendingFile,fullPage:true});
    await page.evaluate(()=>window.__releaseCommit34());
    await page.waitForFunction(()=>document.querySelector('.multi24-status')?.textContent.includes('saved together with the original photo SHA-256'));
    const result=await page.evaluate(async()=>{
     const audit=window.__audit34;
     const rows=await new Promise((resolve,reject)=>{
      const r=audit.db.transaction('items').objectStore('items').getAll();
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
     });
     const root=document.getElementById('multi24Research');
     const status=root.querySelector('.multi24-status').textContent;
     const cancel=[...root.querySelectorAll('button')].find(x=>x.textContent==='Cancel extraction');
     return {rows:rows.map(x=>({owner:x.ownerId,color:x.color,category:x.category,
      type:x.itemType,sourceSHA256:x.sourceSHA256,originalSHA256:x.originalPhoto?.sha256,
      sourceImageIntact:x.originalPhoto?.image===window.__original34,
      confirmed:x.extractionReview==='human-confirmed'})),
      status,remaining:window.__mounted34.debug().pieces.length,
      onSavedCalls:audit.onSavedCalls,refreshCalls:audit.refreshCalls,
      cancelEnabled:!cancel.disabled,addEnabled:!root.querySelector('.multi24-actions button:nth-child(1)').disabled};
    });
    assert.equal(result.rows.length,1);
    assert.deepEqual(result.rows[0],{owner:'review34-account',color:'Red',category:'Tops',type:'T-shirt',
     sourceSHA256:originalSHA,originalSHA256:originalSHA,sourceImageIntact:true,confirmed:true});
    assert.equal(result.remaining,0);
    assert.equal(result.onSavedCalls,1);
    assert.equal(result.refreshCalls,1);
    assert.equal(result.cancelEnabled,true);
    assert.ok(result.status.includes('closet display refresh failed after saving'));
    assert.ok(result.status.includes('Reload My Closet'));
    assert.doesNotMatch(result.status,/nothing saved|save rejected|no pieces saved/i);
    const completedFile=engine+'-'+width+'-saved-receipt.png';
    const completedImage=await page.screenshot({path:out+'/'+completedFile,fullPage:true});
    const screenshots=[];
    for(const [name,bytes] of [[pendingFile,pendingImage],[completedFile,completedImage]]){
     const metadata=await sharp(bytes).metadata();
     const stats=await sharp(bytes).stats();
     assert.equal(metadata.format,'png');assert.equal(metadata.width,width);
     assert.ok(bytes.length>8000&&metadata.height>500&&stats.channels[0].stdev>6);
     screenshots.push({filename:name,sha256:digest(bytes),width:metadata.width,height:metadata.height,bytes:bytes.length});
    }
    cases.push({engine,width,originalSHA256:originalSHA,
     confirmedSnapshotUnaffectedByStaleEdit:true,cancellationBlockedDuringSave:true,
     realIndexedDBSingleAtomicCommit:true,postCommitErrorReceiptHonest:true,
     sourceIdentityVerified:true,ownerIsolationOfSavedRecord:true,
     screenshots});
    await ctx.close();
   }
  }finally{await browser.close();}
 }
 assert.deepEqual(errors,[]);
 assert.deepEqual(blocked,[]);
 assert.equal(cases.length,6);
 const report={priority:'REVIEW-SAVE-FINALITY-34',actualBrowserCases:6,realBrowsers:2,
  fixture:'synthetic locally generated JPEG; fake worker proposal; REAL IndexedDB and real canonical WebCrypto SHA verification',
  realSegFormerRun:false,realCustomerData:false,unexpectedRequests:blocked,browserErrors:errors,
  originalSHA256:originalSHA,FamilyAlpha:'HOLD',cases};
 await writeFile(out+'/browser.json',JSON.stringify(report,null,2)+'\n');
 console.log('REVIEW34 REAL BROWSER INDEXEDDB: 6/6 cases; 12 verified PNGs; 6 persisted-save error receipts; no external requests; Family Alpha HOLD');
}finally{await new Promise(done=>server.close(done));}
