// Mission 3 — actual default Export button, Chromium and WebKit native
// IndexedDB at mobile viewports. Synthetic SHA/JPEG, signed owners only;
// block every off-host request. No physical phone, hosted cloud or deploy.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const output=resolve(process.argv[2]||'benchmark/mission3-default-export-owner-snapshot-browser');
await mkdir(output,{recursive:true});
const raw=await sharp({create:{width:160,height:112,channels:3,
 background:{r:68,g:111,b:165}}}).jpeg().toBuffer();
const image='data:image/jpeg;base64,'+raw.toString('base64');
const sha=createHash('sha256').update(raw).digest('hex');
const root=resolve('public'),
 types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const full=resolve(root,'.'+(p==='/'?'/index.html':p));
  if(!full.startsWith(root+'/')||p.includes('\\'))throw Error('Outside test root');
  res.writeHead(200,{'content-type':types[extname(full)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(await readFile(full));
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port,cases=[];
try{
 for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const owner='a'+width+'0000-5678-4567-8567-567856785678';
   const other='b'+width+'0000-5678-4567-8567-567856785678';
   const browser=await browserType.launch({headless:true,
    args:engine==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},
    isMobile:true,hasTouch:true,acceptDownloads:true,serviceWorkers:'block'});
   const errors=[],offHost=[];
   async function login(ctx,id){
    await ctx.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',
     body:"window.closetAuth={user:{id:'"+id+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    await ctx.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',
     body:"window.closetCloud={start:async()=>{},beforeWrite:async()=>{},changed:()=>{}};"}));
    await ctx.route('**/*',route=>{
     const url=new URL(route.request().url());
     if(url.hostname==='127.0.0.1'||['blob:','data:'].includes(url.protocol))
      return route.fallback();
     offHost.push({method:route.request().method(),url:url.href});
     return route.abort();
    });
    await ctx.addInitScript(()=>{
     class OfflineWorker{
      constructor(){this.onmessage=null;this.terminated=false;}
      postMessage(m){queueMicrotask(()=>{if(!this.terminated)this.onmessage?.({
       data:{id:m.id,type:m.type==='load'?'ready':'result',choices:[],strong:false,details:{}}
      });});}
      terminate(){this.terminated=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:OfflineWorker});
    });
   }
   try{
    await login(context,owner);
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady,inspirationReady]));
    // Write in IDB as a different same-owner tab would, leaving the first
    // tab's in-memory arrays intentionally stale.
    await page.evaluate(async({image,sha,owner})=>{
     const exact={id:'source-blue',ownerId:owner,name:'Blue owner original',
      category:'Tops',itemType:'T-shirt',color:'Blue',image,
      sourceSHA256:sha,sourceHashVerified:true,
      originalPhoto:{image,sha256:sha,width:160,height:112},userAdjusted:true};
     await new Promise((ok,fail)=>{
      const tx=db.transaction(['items','state'],'readwrite');
      tx.objectStore('items').put(exact);
      tx.objectStore('state').put({id:'looks',looks:[{
       id:'blue-look',title:'Blue inspiration',pieces:[]
      }]});
      tx.objectStore('state').put({id:'outfit-board',
       current:{name:'Saved blue outfit',slots:{top:'source-blue'}},
       saved:[{name:'Next week',slots:{top:'source-blue'}}]});
      tx.objectStore('state').put({id:'draft',batch:[]});
      tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
     });
     window.__countURLCalls=0;
     const original=URL.createObjectURL;
     URL.createObjectURL=function(blob){window.__countURLCalls++;return original.call(URL,blob);};
    },{image,sha,owner});
    const pendingDownload=page.waitForEvent('download',{timeout:8000}).catch(()=>null);
    // Exercise the exact production onclick and await its async owner-private
    // snapshot. A refused export must surface its reason rather than spend
    // 30 seconds waiting for a nonexistent browser download event.
    const exportStatus=await page.evaluate(async()=>{
     await $('export').onclick();
     return {message:$('message').textContent,
      created:window.__countURLCalls,
      boardDirty:boardHasUnsavedDraft(),drafts:batch.length,
      active:automaticRunning,failed:failedDraftCaptures.size};
    });
    assert.ok(exportStatus.created>0,'Default export refused: '+JSON.stringify(exportStatus));
    const file=await pendingDownload;
    assert.ok(file,'No browser download despite verified export: '+JSON.stringify(exportStatus));
    assert.match(file.suggestedFilename(),/closet-current-backup\.json/);
    const data=JSON.parse(await readFile(await file.path(),'utf8'));
    assert.deepEqual(data.items.map(x=>x.id),['source-blue']);
    assert.equal(data.items[0].originalPhoto.image,image);
    assert.equal(data.items[0].sourceSHA256,sha);
    assert.equal(data.items[0].userAdjusted,true);
    assert.equal(data.looks[0].title,'Blue inspiration');
    assert.equal(data.outfitBoard.saved[0].slots.top,'source-blue');
    assert.equal(data.version,3);
    assert.equal(data.items[0].ownerId,owner);
    assert.equal(await page.evaluate(()=>items.length),0,
     'stale on-screen card array cannot dictate exported owner JPEGs');
    assert.match(await page.evaluate(()=>$('message').textContent),
     /verified private storage/);

    // Another same-owner tab creates an unfinished original AFTER exporter
    // loaded the stale card list. The default v3 format cannot carry it.
    await page.evaluate(async({image,sha,owner})=>{
     await new Promise((ok,fail)=>{
      const tx=db.transaction('state','readwrite');
      tx.objectStore('state').put({id:'draft',batch:[{
       id:'unreviewed-source',ownerId:owner,image,
       originalPhoto:{image,sha256:sha},sourceSHA256:sha,
       sourceHashVerified:true,localAnalyzed:false
      }]});
      tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
     });
    },{image,sha,owner});
    const before=await page.evaluate(()=>window.__countURLCalls);
    await page.evaluate(()=>$('export').onclick());
    assert.equal(await page.evaluate(()=>window.__countURLCalls),before,
     'no backup blob was created while pending original was omitted');
    assert.match(await page.evaluate(()=>$('message').textContent),
     /Unfinished photos/);

    // Remove the synthetic draft and inject an incorrect original SHA.
    await page.evaluate(async()=>{
     await new Promise((ok,fail)=>{
      const tx=db.transaction(['items','state'],'readwrite');
      tx.objectStore('state').put({id:'draft',batch:[]});
      const req=tx.objectStore('items').get('source-blue');
      req.onsuccess=()=>tx.objectStore('items').put({
       ...req.result,sourceSHA256:'f'.repeat(64),
       originalPhoto:{...req.result.originalPhoto,sha256:'f'.repeat(64)}
      });
      tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
     });
    });
    await page.evaluate(()=>$('export').onclick());
    assert.equal(await page.evaluate(()=>window.__countURLCalls),before);
    assert.match(await page.evaluate(()=>$('message').textContent),
     /PHOTO_SHA_MISMATCH/);

    // Session expires after an asynchronous pending write tail; a former
    // owner must not download/announce a backup into the next account.
    await page.evaluate(async()=>{
     let release;
     window.__releaseOldExport=()=>release();
     writes=new Promise(resolve=>release=resolve);
     window.__oldExportPromise=$('export').onclick();
     await Promise.resolve();
     captureOperationEpoch++;
     window.closetAuth.user={id:'other-user'};
     window.__releaseOldExport();
     await window.__oldExportPromise;
    });
    assert.equal(await page.evaluate(()=>window.__countURLCalls),before,
     'old owner must never issue a late downloadable file');

    const second=await browser.newContext({viewport:{width,height:844},
     isMobile:true,hasTouch:true,serviceWorkers:'block'});
    try{
     await login(second,other);
     const next=await second.newPage();
     next.on('pageerror',e=>errors.push(String(e)));
     await next.goto(origin+'/',{waitUntil:'domcontentloaded'});
     await next.evaluate(()=>closetReady);
     assert.deepEqual(await next.evaluate(()=>items),[]);
     const state=await next.evaluate(()=>new Promise((ok,fail)=>{
      const req=db.transaction('items').objectStore('items').getAll();
      req.onsuccess=()=>ok(req.result);req.onerror=()=>fail(req.error);
     }));
     assert.deepEqual(state,[]);
    }finally{await second.close();}
    assert.deepEqual(errors,[]);
    assert.equal(offHost.some(x=>x.method!=='GET'),false);
    cases.push({engine,width,realBrowser:true,defaultExport:true,
     actualAppAndNativeIDB:true,sourceSHA256Preserved:true,
     staleOnScreenArrayIgnored:true,ownerPendingDraftBlocked:true,
     sourceTamperBlocked:true,revokedOwnerDownloadBlocked:true,
     signedAccountIsolation:true,syntheticJPEG:true,physicalDevice:false,
     blockedOffHostRequests:offHost.length});
   }finally{await context.close();await browser.close();}
  }
 }
 assert.equal(cases.length,6);
 const report={status:'PASS',kind:'mission3-default-export-owner-snapshot',
  familyAlpha:'HOLD',realChromiumWebKit:true,nativeIndexedDB:true,
  physicalDevices:false,hostedSupabase:false,independentHumanLabels:false,cases};
 const json=JSON.stringify(report,null,2)+'\n';
 await writeFile(resolve(output,'results.json'),json);
 await writeFile(resolve(output,'sha256.txt'),
  createHash('sha256').update(json).digest('hex')+'  results.json\n');
 console.log('PASS: 6 Chromium/WebKit native durable backup export, pending JPEG and owner-revocation cases');
}finally{await new Promise(ok=>server.close(ok));}
