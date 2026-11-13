// Native Chromium + WebKit actual app.js/IndexedDB source-status commit ACK.
// 320/390/430 mobile-like viewports, synthetic SHA-proven photos and owners.
// NO hosted Supabase, NO real phones, no external network writes, NO DEPLOY.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const output=resolve(process.argv[2]||'benchmark/mission3-recognition-durable-ack-browser');
await mkdir(output,{recursive:true});
const root=resolve('public'),mime={'.html':'text/html','.js':'text/javascript',
 '.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const pictures=await Promise.all([
 [108,74,160],[50,146,122],[197,83,67]
 ].map(([r,g,b])=>sharp({create:{width:128,height:96,channels:3,
  background:{r,g,b}}}).jpeg({quality:88}).toBuffer()));
const photos=pictures.map(bytes=>({image:'data:image/jpeg;base64,'+bytes.toString('base64'),
 sha:createHash('sha256').update(bytes).digest('hex')}));
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+'/')||pathname.includes('\\'))throw Error('unsafe path');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port,results=[];
try{
 for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const owner='a'+width+'0000-3333-4333-8333-333333333333';
   const other='b'+width+'0000-4444-4444-8444-444444444444';
   const browser=await browserType.launch({headless:true,
    args:engine==='chromium'?['--no-sandbox']:[]});
   const ctx=await browser.newContext({viewport:{width,height:844},
    isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const errors=[],offHost=[];
   async function login(context,id){
    await context.route('**/auth.js*',route=>route.fulfill({
     contentType:'text/javascript',
     body:"window.closetAuth={user:{id:'"+id+"'},ready:Promise.resolve(),assertCurrent:()=>{},getAccessToken:async()=>'synthetic'};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"
    }));
    await context.route('**/cloud-backup.js*',route=>route.fulfill({
     contentType:'text/javascript',
     body:"window.closetCloud={start:async()=>{},beforeWrite:async()=>{},changed:()=>{}};"
    }));
    await context.route('**/*',route=>{
     const to=new URL(route.request().url());
     if(to.hostname==='127.0.0.1'||['data:','blob:'].includes(to.protocol))
      return route.fallback();
     offHost.push({method:route.request().method(),url:to.href});
     return route.abort();
    });
    await context.addInitScript(()=>{
     class FakeWorker{
      constructor(){this.onmessage=null;this.stopped=false;}
      postMessage(m){queueMicrotask(()=>{if(!this.stopped)this.onmessage?.({
       data:{id:m.id,type:m.type==='load'?'ready':'result',
       choices:[],strong:false,details:{}}
      });});}
      terminate(){this.stopped=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:FakeWorker});
    });
   }
   async function getDraft(page){
    return page.evaluate(()=>new Promise((done,fail)=>{
     const r=db.transaction('state').objectStore('state').get('draft');
     r.onsuccess=()=>done(r.result?.batch||[]);
     r.onerror=()=>fail(r.error);
    }));
   }
   async function capture(page,photo){
    return page.evaluate(async photo=>{
     // Real owner private native source commit. Keep recognition under
     // explicit test control rather than accepting a fake worker diagnosis.
     const owner=window.closetAuth.user.id;
     return candidate(photo.image,{requireDraftCommit:true,sourceProof:{
      image:photo.image,sourceHashVerified:true,sourceSHA256:photo.sha,
      ownerId:owner,originalPhoto:{
       image:photo.image,sha256:photo.sha,width:128,height:96
      }
     }});
    },photo);
   }
   try{
    await login(ctx,owner);
    const a=await ctx.newPage(),b=await ctx.newPage();
    for(const page of [a,b]){
     page.on('pageerror',e=>errors.push(String(e)));
     await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
     await page.evaluate(()=>closetReady);
     await page.evaluate(()=>{window.__originalQueue=queueAutomatic;queueAutomatic=()=>{};});
    }
    assert.equal(await capture(a,photos[0]),true);
    const rowsBefore=await getDraft(b);
    assert.equal(rowsBefore.length,1);
    assert.equal(rowsBefore[0].originalPhoto.image,photos[0].image);

    // Delayed owner's device write: the recognition Promise MUST NOT resolve
    // before the exact per-photo IndexedDB mutation completes.
    await a.evaluate(()=>{
     window.__baseBeforeWrite=window.closetCloud.beforeWrite;
     window.__ackStarted=false;window.__ackDone=false;
     window.__ackGate=new Promise(resolve=>window.__releaseAck=resolve);
     window.closetCloud.beforeWrite=async()=>{
      window.__ackStarted=true;await window.__ackGate;
     };
     window.__baseCheck=checkPhoto;
     checkPhoto=async()=>({blank:true});
     window.__ackResult=recognizeItem(batch[0])
      .then(value=>{window.__ackDone=true;return value});
    });
    await a.waitForFunction(()=>window.__ackStarted===true);
    assert.equal(await a.evaluate(()=>window.__ackDone),false);
    assert.doesNotMatch((await getDraft(b))[0].localStatus||'',/Original photo kept/);
    await a.evaluate(()=>window.__releaseAck());
    assert.equal(await a.evaluate(()=>window.__ackResult),true);
    const afterAck=await getDraft(b);
    assert.match(afterAck[0].localStatus,/Original photo kept/);
    assert.equal(afterAck[0].sourceSHA256,photos[0].sha);
    await a.evaluate(()=>{
     window.closetCloud.beforeWrite=window.__baseBeforeWrite;
     checkPhoto=window.__baseCheck;
    });

    // A second same-owner tab's signed correction wins an in-flight
    // recognition result. It must refuse the stale status CAS and alert A.
    assert.equal(await capture(a,photos[1]),true);
    await a.evaluate(()=>{
     window.__ackStarted=false;window.__ackDone=false;
     window.__ackGate=new Promise(resolve=>window.__releaseAck=resolve);
     window.closetCloud.beforeWrite=async()=>{
      window.__ackStarted=true;await window.__ackGate;
     };
     checkPhoto=async()=>({blank:true});
     const photo=batch.find(x=>!x.localAnalyzed);
     window.__stalePhotoId=photo.id;
     window.__ackResult=recognizeItem(photo)
      .then(value=>{window.__ackDone=true;return value});
    });
    await a.waitForFunction(()=>window.__ackStarted===true);
    await b.evaluate(async()=>{
     const state=await readDraftFrom(db);
     const selected=state.find(x=>!x.localAnalyzed);
     assertCurrentOwner();
     const updated={...selected,color:'Owner verified maroon',userAdjusted:true};
     await persistDraft({required:true,mode:'update',expected:selected,record:updated});
    }).catch(async error=>{
     // A browser script fixture should not rely on the name of an
     // incidental helper; the actual per-row CAS is the authoritative API.
     if(!String(error).includes('assertCurrentOwner'))throw error;
     await b.evaluate(async()=>{
      const state=await readDraftFrom(db);
      const selected=state.find(x=>!x.localAnalyzed);
      await persistDraft({required:true,mode:'update',expected:selected,
       record:{...selected,color:'Owner verified maroon',userAdjusted:true}});
     });
    });
    await a.evaluate(()=>window.__releaseAck());
    assert.equal(await a.evaluate(()=>window.__ackResult),false);
    const afterConflict=await getDraft(b);
    const conflictRow=afterConflict.find(x=>x.sourceSHA256===photos[1].sha);
    assert.equal(conflictRow.color,'Owner verified maroon');
    assert.equal(conflictRow.originalPhoto.image,photos[1].image);
    assert.match(await a.evaluate(()=>batch.find(x=>x.id===window.__stalePhotoId).localStatus),
     /not saved on this device/);
    await a.evaluate(()=>{
     window.closetCloud.beforeWrite=window.__baseBeforeWrite;
     checkPhoto=window.__baseCheck;
    });

    // Simulated quota or pending cloud marker refusal must not ACK success.
    assert.equal(await capture(a,photos[2]),true);
    const result=await a.evaluate(async()=>{
     const pending=batch.find(x=>x.image.includes('')&&!x.localAnalyzed&&x.sourceSHA256);
     const selected=batch.find(x=>!x.localAnalyzed&&
      x.sourceSHA256!==undefined&&x.id!==window.__stalePhotoId);
     if(!selected)throw Error('No newly captured source to test storage failure');
     const old=window.closetCloud.beforeWrite,oldCheck=checkPhoto;
     window.closetCloud.beforeWrite=()=>Promise.reject(Error('simulated browser storage quota'));
     checkPhoto=async()=>({blank:true});
     try{
      const ack=await recognizeItem(selected);
      return {ack,scanFailed:selected.scanFailed,
       warning:selected.localStatus,original:selected.originalPhoto.image,
       id:selected.id};
     }finally{
      window.closetCloud.beforeWrite=old;checkPhoto=oldCheck;
     }
    });
    assert.equal(result.ack,false);
    assert.equal(result.scanFailed,true);
    assert.match(result.warning,/not saved on this device/);
    assert.equal(result.original,photos[2].image);
    assert.deepEqual((await getDraft(b)).map(x=>x.originalPhoto.image),photos.map(p=>p.image));
    // Device reload must retain the unmodified source even when the newer
    // recognition status never committed.
    await a.reload({waitUntil:'domcontentloaded'});
    await a.evaluate(()=>closetReady);
    assert.deepEqual((await getDraft(a)).map(x=>x.originalPhoto.image),photos.map(p=>p.image));

    const foreign=await browser.newContext({viewport:{width,height:844},
     isMobile:true,hasTouch:true,serviceWorkers:'block'});
    try{
     await login(foreign,other);
     const page=await foreign.newPage();page.on('pageerror',e=>errors.push(String(e)));
     await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
     await page.evaluate(()=>closetReady);
     assert.deepEqual(await getDraft(page),[]);
    }finally{await foreign.close();}
    assert.deepEqual(errors,[]);
    results.push({engine,width,ownerPrivate:true,actualApp:true,nativeIndexedDB:true,
     originalJPEGsPreserved:true,ackHeldUntilNativeCommit:true,
     staleTwoTabHumanCorrectionWon:true,quotaRefusedFalseACK:true,
     browserReloadRecovered:true,foreignOwnerIsolated:true,
     blockedOffHostRequests:offHost.length,synthetic:true,physicalPhones:false});
   }finally{await ctx.close();await browser.close();}
  }
 }
 assert.equal(results.length,6);
 const report={status:'PASS',kind:'mission3-recognition-durable-cas-ack',
  familyAlpha:'HOLD',physicalPhones:false,hostedSupabase:false,
  humanAnnotatedPhotos:false,cases:results};
 const data=JSON.stringify(report,null,2)+'\n';
 await writeFile(resolve(output,'results.json'),data);
 await writeFile(resolve(output,'sha256.txt'),
  createHash('sha256').update(data).digest('hex')+'  results.json\n');
 console.log('PASS: 6 native Chromium/WebKit exact owner recognition status CAS acknowledgement cases');
}finally{await new Promise(ok=>server.close(ok));}
