// Actual native Chromium/WebKit IndexedDB: new photo captures, recognition
// status, failed upload retry and cross-tab JPEG preservation. Synthetic only.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-capture-status-cas-browser');
await mkdir(out,{recursive:true});
const jpeg=(r,g,b)=>sharp({create:{width:96,height:72,channels:3,
 background:{r,g,b}}}).jpeg({quality:93}).toBuffer();
const buffers=await Promise.all([jpeg(43,118,195),jpeg(204,67,62),jpeg(80,160,70)]);
const sources=buffers.map(bytes=>({image:'data:image/jpeg;base64,'+bytes.toString('base64'),
 sha:createHash('sha256').update(bytes).digest('hex')}));
const root=resolve('public'),types={'.html':'text/html','.js':'text/javascript',
 '.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.css':'text/css'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+'/')||pathname.includes('\\'))throw Error('path');
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const results=[];
try{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const owner='a'+width+'1111-1111-4111-8111-111111111111';
   const stranger='b'+width+'2222-2222-4222-8222-222222222222';
   const browser=await engine.launch({headless:true,
    args:name==='chromium'?['--no-sandbox']:[]});
   const ctx=await browser.newContext({viewport:{width,height:844},
    isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const errors=[],offHost=[];
   async function login(context,id){
    await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',
     body:"window.closetAuth={user:{id:'"+id+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    await context.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',
     body:'window.closetCloud={start:async()=>({}),beforeWrite:async()=>{},changed:()=>{}};'}));
    await context.route('**/*',route=>{
     const url=new URL(route.request().url());
     if(url.hostname==='127.0.0.1'||['blob:','data:'].includes(url.protocol))
      return route.fallback();
     offHost.push(url.href);return route.abort();
    });
    await context.addInitScript(()=>{
     class SyntheticWorker{
      constructor(){this.onmessage=null;this.dead=false;}
      postMessage(msg){queueMicrotask(()=>{if(!this.dead)this.onmessage?.({
       data:{id:msg.id,type:msg.type==='load'?'ready':'result',choices:[],strong:false,details:{}}
      });});}
      terminate(){this.dead=true;}
     }
     Object.defineProperty(window,'Worker',{value:SyntheticWorker,configurable:true});
    });
   }
   async function getDraft(page){return page.evaluate(()=>new Promise((ok,fail)=>{
    const r=db.transaction('state').objectStore('state').get('draft');
    r.onsuccess=()=>ok(r.result?.batch||[]);r.onerror=()=>fail(r.error);
   }));}
   async function capture(page,source){
    return page.evaluate(async({image,sha})=>candidate(image,{
     requireDraftCommit:true,sourceProof:{image,sourceSHA256:sha,
      sourceHashVerified:true,originalPhoto:{image,sha256:sha,width:96,height:72}}
    }),source);
   }
   try{
    await login(ctx,owner);
    const a=await ctx.newPage(),b=await ctx.newPage();
    for(const p of [a,b]){
     p.on('pageerror',e=>errors.push(String(e)));
     await p.goto(origin+'/',{waitUntil:'domcontentloaded'});
     await p.evaluate(()=>closetReady);
     await p.evaluate(()=>{
      // Model guesses never start automatically during this storage race
      // test; explicitly invoke real recognition below.
      window.queueAutomatic=()=>{};
     });
    }
    assert.equal(await capture(a,sources[0]),true);
    assert.equal(await capture(b,sources[1]),true);
    let rows=await getDraft(b);
    assert.deepEqual(rows.map(x=>x.image),sources.slice(0,2).map(x=>x.image));
    assert.deepEqual(rows.map(x=>x.originalPhoto.sha256),sources.slice(0,2).map(x=>x.sha));
    // Actual recognition path performs an owner-private update, not an
    // outdated global whole-batch overwrite.
    await a.evaluate(async()=>{
     window.checkPhoto=async()=>({blank:false,signature:'native',aspect:4/3,colorEstimate:null});
     window.enableLocal=async()=>{localReady=true;};
     window.localRequest=async()=>({choices:[],strong:false,details:{}});
     await recognizeItem(batch[0]);
     await writes;
    });
    rows=await getDraft(b);
    assert.equal(rows.length,2);
    assert.equal(rows[1].originalPhoto.image,sources[1].image);
    assert.match(rows[0].localStatus,/Confirm garment category and color/);
    // Delayed A recognition must lose against B's later explicit human edit.
    await a.evaluate(()=>{
     window.checkPhoto=()=>new Promise(ok=>window.__releasePhotoQuality=ok);
    });
    const delayed=a.evaluate(async()=>{await recognizeItem(batch[0]);await writes;});
    await a.waitForFunction(()=>typeof window.__releasePhotoQuality==='function');
    await b.evaluate(async()=>{
     const current=await new Promise((ok,fail)=>{
      const r=db.transaction('state').objectStore('state').get('draft');
      r.onsuccess=()=>ok(r.result.batch.find(x=>x.image));
      r.onerror=()=>fail(r.error);
     });
     await commitReviewedDraftCAS([{before:current,after:{...current,
      color:'owner-confirmed silver',colorSource:'user'}}]);
    });
    await a.evaluate(()=>window.__releasePhotoQuality({
     blank:false,signature:'native-after-stale-edit',aspect:4/3,colorEstimate:null}));
    await delayed;
    rows=await getDraft(b);
    assert.equal(rows[0].color,'owner-confirmed silver');
    assert.equal(rows[1].originalPhoto.image,sources[1].image);
    // A failed initial write can retry just that source even after Tab B
    // has independently added another original. No recapture or ID change.
    await a.evaluate(()=>{window.__originalQueue=window.queued;
     window.queued=()=>Promise.reject(Error('simulated quota'));});
    await assert.rejects(capture(a,sources[2]),/not saved|capture|storage/i);
    await a.evaluate(()=>{window.queued=window.__originalQueue;});
    const failed=await a.evaluate(()=>[...failedDraftCaptures]);
    assert.equal(failed.length,1);
    assert.equal(await capture(a,sources[2]),true);
    rows=await getDraft(b);
    assert.equal(rows.length,3);
    assert.deepEqual(rows.map(x=>x.originalPhoto.image),sources.map(x=>x.image));
    // No implicit full-batch write is permitted under any condition.
    assert.equal(await a.evaluate(()=>persistDraft()),false);
    assert.equal((await getDraft(b)).length,3);
    // New owner sees its own (empty) IndexedDB without camera originals.
    const foreign=await browser.newContext({viewport:{width,height:844},
     isMobile:true,hasTouch:true,serviceWorkers:'block'});
    try{
     await login(foreign,stranger);
     const other=await foreign.newPage();
     other.on('pageerror',e=>errors.push(String(e)));
     await other.goto(origin+'/',{waitUntil:'domcontentloaded'});
     await other.evaluate(()=>closetReady);
     assert.equal((await getDraft(other)).length,0);
    }finally{await foreign.close();}
    assert.deepEqual(errors,[]);
    results.push({engine:name,width,status:'PASS',originals:rows.length,
     staleCorrection:'PRESERVED',retry:'ONE EXACT ORIGINAL',
     otherOwner:'PRIVATE',blockedOffHostRequests:offHost.length});
   }finally{await ctx.close();await browser.close();}
  }
 }
 const evidence={status:'PASS',synthetic:true,physicalDevices:false,hostedCloud:false,
  familyAlpha:'HOLD',cases:results};
 await writeFile(resolve(out,'results.json'),JSON.stringify(evidence,null,2));
 console.log('MISSION3 EXACT CAPTURE/RECOGNITION CAS NATIVE PASS '+results.length+' cases. HOLD #255.');
}finally{await new Promise(ok=>server.close(ok));}
