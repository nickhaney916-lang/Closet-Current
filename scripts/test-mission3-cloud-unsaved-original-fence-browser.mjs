// Native Chromium/WebKit: run exact cloud-backup.js apply() + actual
// cloud-backup-bridge.js canRestore callback with native IndexedDB.
// Synthetic JPEGs, owner IDs and cloud contents; no hosted network calls.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-cloud-unsaved-capture-fence-browser');
await mkdir(out,{recursive:true});
const root=resolve('public'),types={'.html':'text/html','.js':'text/javascript',
 '.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const source=(await readFile(resolve(root,'cloud-backup.js'),'utf8'));
const start=source.indexOf('async function apply(document,revision,expectedRevision,assertActive){');
const end=source.indexOf('const isCapacityError=',start);
assert.ok(start>=0&&end>start);
const applySource=source.slice(start,end);
const jpegBytes=await sharp({create:{width:90,height:64,channels:3,
 background:{r:55,g:120,b:175}}}).jpeg({quality:90}).toBuffer();
const jpeg='data:image/jpeg;base64,'+jpegBytes.toString('base64');
const sha=createHash('sha256').update(jpegBytes).digest('hex');
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!path.startsWith(root+'/')||pathname.includes('\\'))throw Error('path');
  res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','cache-control':'no-store'});
  res.end(await readFile(path));
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port,results=[];
try{
 for(const [engine,client] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const owner='a'+width+'5555-5555-4555-8555-555555555555';
   const foreign='b'+width+'6666-6666-4666-8666-666666666666';
   const browser=await client.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const errors=[],external=[];
   async function authorize(ctx,id){
    await ctx.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',
     body:"window.closetAuth={user:{id:'"+id+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    await ctx.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',
     body:"window.closetCloud={start:async (_db,cb)=>{window.__ownerCloudCallbacks=cb;return {started:true};},beforeWrite:async()=>{},changed:()=>{}};"}));
    await ctx.route('**/*',route=>{
     const t=new URL(route.request().url());
     if(t.hostname==='127.0.0.1'||['data:','blob:'].includes(t.protocol))return route.fallback();
     external.push(t.href);return route.abort();
    });
    await ctx.addInitScript(()=>{
     class SyntheticWorker{
      constructor(){this.onmessage=null;this.stopped=false;}
      postMessage(m){queueMicrotask(()=>{if(!this.stopped)this.onmessage?.({
       data:{id:m.id,type:m.type==='load'?'ready':'result',choices:[],details:{},strong:false}
      });});}
      terminate(){this.stopped=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:SyntheticWorker});
    });
   }
   const state=page=>page.evaluate(async()=>{
    let items,records;
    await new Promise((ok,fail)=>{
     const tx=db.transaction(['items','state'],'readonly');
     tx.objectStore('items').getAll().onsuccess=e=>items=e.target.result;
     tx.objectStore('state').getAll().onsuccess=e=>records=e.target.result;
     tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
    });
    return {items,state:Object.fromEntries(records.map(row=>[row.id,row]))};
   });
   try{
    await authorize(context,owner);
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.__ownerCloudCallbacks);
    // Execute the exact production apply() source, not a handwritten
    // approximation; only transport/decode are harmless synthetic fixtures.
    await page.addScriptTag({content:`(function(){
      const E=window.ClosetBackupEngine;
      const callbacks=window.__ownerCloudCallbacks;
      const markerDefault=()=>({id:'cloud-sync',localRevision:0,dirty:false,
       baseVersion:0,baseDocument:null});
      const decode=async document=>document;
      const transact=(stores,mode,fn)=>new Promise((resolve,reject)=>{
       const tx=db.transaction(stores,mode);let result;
       try{result=fn(tx);}catch(error){tx.abort();reject(error);return;}
       tx.oncomplete=()=>resolve(typeof result==='function'?result():result);
       tx.onerror=()=>reject(tx.error);
       tx.onabort=()=>reject(tx.error||Error('Transaction aborted'));
      });
      ${applySource}
      window.__actualCloudApply=(doc,revision,expected)=>apply(doc,revision,expected,()=>{
       window.closetAuth.assertCurrent();
      });
     })();`});
    await page.evaluate(async({owner,jpeg,sha})=>{
     const local={id:'saved-before',ownerId:owner,image:jpeg,category:'Tops',
      originalPhoto:{image:jpeg,sha256:sha},sourceSHA256:sha};
     await new Promise((ok,fail)=>{
      const tx=db.transaction(['items','state'],'readwrite');
      tx.objectStore('items').put(local);
      tx.objectStore('state').put({id:'draft',batch:[]});
      tx.objectStore('state').put({id:'cloud-sync',localRevision:0,dirty:false,
       baseVersion:0,baseDocument:null});
      tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
     });
     items=[local];render();
     window.__remote={items:[{...local,id:'remote-after'}],
      state:{draft:{id:'draft',batch:[]}}};
    },{owner,jpeg,sha});
    await page.evaluate(async({owner,jpeg,sha})=>{
     const notSaved={id:'pending-original',ownerId:owner,image:jpeg,
      originalPhoto:{image:jpeg,sha256:sha},sourceSHA256:sha};
     batch.push(notSaved);
     failedDraftCaptures.add(notSaved.id);
     render();
     window.__initialResult=await window.__actualCloudApply(window.__remote,6,0);
    },{owner,jpeg,sha});
    assert.equal(await page.evaluate(()=>window.__initialResult),false);
    assert.equal((await state(page)).items[0].id,'saved-before');
    assert.equal(await page.evaluate(()=>batch[0].id),'pending-original');
    assert.equal(await page.evaluate(()=>window.__ownerCloudCallbacks.canRestore()),false);
    await page.evaluate(async()=>{
     failedDraftCaptures.clear();
     captureProofTaking=true;
     window.__captureResult=await window.__actualCloudApply(window.__remote,6,0);
     captureProofTaking=false;
    });
    assert.equal(await page.evaluate(()=>window.__captureResult),false);
    assert.equal((await state(page)).items[0].id,'saved-before');
    // The early preflight approved; meanwhile the owner captured another
    // original. The actual IDB state.get callback MUST re-check and refuse.
    await page.evaluate(()=>{
     window.__ownerRestoreOriginalCapture=window.__ownerCloudCallbacks.capture;
     window.__restoreEntered=false;
     window.__restoreReleased=new Promise(ok=>{window.__restoreRelease=ok});
     window.__ownerCloudCallbacks.capture=async work=>{
      window.__restoreEntered=true;
      await window.__restoreReleased;
      return window.__ownerRestoreOriginalCapture(work);
     };
     window.__restoreOutcome=window.__actualCloudApply(window.__remote,6,0);
    });
    await page.waitForFunction(()=>window.__restoreEntered===true);
    await page.evaluate(()=>{
     failedDraftCaptures.add('captured-during-restore');
     window.__restoreRelease();
    });
    assert.equal(await page.evaluate(()=>window.__restoreOutcome),false);
    assert.equal((await state(page)).items[0].id,'saved-before');
    await page.evaluate(()=>{
     window.__ownerCloudCallbacks.capture=window.__ownerRestoreOriginalCapture;
     failedDraftCaptures.clear();batch=[];render();
    });
    const ok=await page.evaluate(()=>window.__actualCloudApply(window.__remote,6,0));
    assert.equal(ok,true);
    const after=await state(page);
    assert.deepEqual(after.items.map(row=>row.id),['remote-after']);
    assert.equal(after.state['cloud-sync'].baseVersion,6);
    assert.equal(await page.evaluate(()=>items[0].id),'remote-after');
    // Owner B has a separate private DB, not imported from owner A.
    const other=await browser.newContext({viewport:{width,height:844},
     isMobile:true,hasTouch:true,serviceWorkers:'block'});
    try{
     await authorize(other,foreign);
     const foreignPage=await other.newPage();
     foreignPage.on('pageerror',e=>errors.push(String(e)));
     await foreignPage.goto(origin+'/',{waitUntil:'domcontentloaded'});
     await foreignPage.evaluate(()=>closetReady);
     assert.deepEqual((await state(foreignPage)).items,[]);
    }finally{await other.close();}
    assert.deepEqual(errors,[]);
    results.push({engine,width,synthetic:true,failedOriginalRetained:true,
     activeCaptureRetained:true,midRestoreOwnerSourceChangeRejected:true,
     idleRestoreSucceeded:true,foreignOwnerIsolated:true,
     blockedOffHostRequests:external.length});
   }finally{await context.close();await browser.close();}
  }
 }
 await writeFile(resolve(out,'results.json'),JSON.stringify({
  status:'PASS',familyAlpha:'HOLD',synthetic:true,physicalDevices:false,
  hostedSupabase:false,cases:results
 },null,2));
 console.log('MISSION3 CLOUD RESTORE UNCOMMITTED ORIGINAL FENCE NATIVE PASS '+results.length+' cases');
}finally{await new Promise(ok=>server.close(ok));}
