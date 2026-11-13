// Native Chromium/WebKit owner-private photo refresh. All images and account
// identities are synthetic. Route every off-host request to abort. NO DEPLOY.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-safe-draft-refresh-browser');
await mkdir(out,{recursive:true});
const make=async(r,g,b)=>sharp({create:{width:96,height:72,channels:3,
 background:{r,g,b}}}).jpeg({quality:91}).toBuffer();
const bytes=await Promise.all([make(45,122,184),make(212,96,44)]);
const sources=bytes.map(data=>({
 image:'data:image/jpeg;base64,'+data.toString('base64'),
 sha:createHash('sha256').update(data).digest('hex')
}));
const root=resolve('public');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.json':'application/json','.svg':'image/svg+xml','.css':'text/css'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!path.startsWith(root+'/')||pathname.includes('\\'))throw Error('Disallowed path');
  const body=await readFile(path);
  res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port;
const results=[];
try{
 for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const owner='a'+width+'3333-3333-4333-8333-333333333333';
   const otherOwner='b'+width+'4444-4444-4444-8444-444444444444';
   const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
   const c=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const pageErrors=[],blockedRequests=[];
   async function setup(context,ownerId){
    await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',
     body:"window.closetAuth={user:{id:'"+ownerId+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    await context.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',
     body:'window.closetCloud={start:async()=>({}),beforeWrite:async()=>{},changed:()=>{}};'}));
    await context.route('**/*',route=>{
     const t=new URL(route.request().url());
     if(t.hostname==='127.0.0.1'||['data:','blob:'].includes(t.protocol))
      return route.fallback();
     blockedRequests.push({host:t.hostname,path:t.pathname});
     return route.abort();
    });
    await context.addInitScript(()=>{
     class SyntheticWorker{
      constructor(){this.onmessage=null;this.terminated=false;}
      postMessage(m){queueMicrotask(()=>{if(!this.terminated)this.onmessage?.({
       data:{id:m.id,type:m.type==='load'?'ready':'result',strong:false,choices:[],details:{}}
      });});}
      terminate(){this.terminated=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:SyntheticWorker});
    });
   }
   const draft=page=>page.evaluate(()=>new Promise((resolve,reject)=>{
    const r=db.transaction('state').objectStore('state').get('draft');
    r.onsuccess=()=>resolve(r.result?.batch||[]);
    r.onerror=()=>reject(r.error);
   }));
   try{
    await setup(c,owner);
    const a=await c.newPage(),b=await c.newPage();
    for(const page of [a,b]){
     page.on('pageerror',e=>pageErrors.push(String(e)));
     await page.goto(url+'/',{waitUntil:'domcontentloaded'});
     await page.evaluate(()=>closetReady);
     await page.evaluate(()=>{queueAutomatic=()=>{};});
    }
    async function capture(page,source){
     return page.evaluate(async({image,sha})=>candidate(image,{
      sourceProof:{image,sourceSHA256:sha,sourceHashVerified:true,
       originalPhoto:{image,sha256:sha,width:96,height:72}},
      requireDraftCommit:true
     }),source);
    }
    assert.equal(await capture(a,sources[0]),true);
    assert.equal(await capture(b,sources[1]),true);
    assert.equal(await a.evaluate(()=>batch.length),1);
    await a.evaluate(()=>switchView('review'));
    // The visible button must reflect a real control after page readiness.
    await a.getByRole('button',{name:'Refresh photo results'}).click();
    assert.equal(await a.evaluate(()=>batch.length),2);
    assert.equal(await a.evaluate(()=>batch[1].originalPhoto.image),sources[1].image);
    assert.equal(await a.evaluate(()=>batch[1].originalPhoto.sha256),sources[1].sha);
    assert.deepEqual((await draft(b)).map(x=>x.id),
     await a.evaluate(()=>batch.map(x=>x.id)));
    // Another tab can update human color. Refresh must consume only its
    // verified same-source draft, keeping all immutable original JPEG bytes.
    await b.evaluate(async()=>{
     const current=await new Promise((ok,fail)=>{
      const r=db.transaction('state').objectStore('state').get('draft');
      r.onsuccess=()=>ok(r.result.batch[1]);r.onerror=()=>fail(r.error);
     });
     await commitReviewedDraftCAS([{before:current,after:{...current,
      color:'Owner-confirmed teal',colorSource:'user',userAdjusted:true}}]);
    });
    await a.getByRole('button',{name:'Refresh photo results'}).click();
    assert.equal(await a.evaluate(()=>batch[1].color),'Owner-confirmed teal');
    assert.equal(await a.evaluate(()=>batch[1].originalPhoto.image),sources[1].image);
    // Simulate a failed required capture still present on this screen.
    await a.evaluate(()=>failedDraftCaptures.add(batch[0].id));
    await a.getByRole('button',{name:'Refresh photo results'}).click();
    assert.match(await a.locator('#message').innerText(),/Finish the current scan/);
    assert.equal(await a.evaluate(()=>batch.length),2);
    await a.evaluate(()=>failedDraftCaptures.clear());
    // Removal in another tab may be intentional OR a pending local source
    // may have failed to save; never silently hide the local image.
    await b.evaluate(async()=>{
     const first=await new Promise((ok,fail)=>{
      const r=db.transaction('state').objectStore('state').get('draft');
      r.onsuccess=()=>ok(r.result.batch[0]);r.onerror=()=>fail(r.error);
     });
     await commitReviewedDraftCAS([{before:first,after:null}]);
    });
    await a.getByRole('button',{name:'Refresh photo results'}).click();
    assert.match(await a.locator('#message').innerText(),/No photos were hidden/);
    assert.equal(await a.evaluate(()=>batch.length),2);
    assert.equal(await a.evaluate(()=>batch[0].originalPhoto.image),sources[0].image);
    assert.equal((await draft(b)).length,1,'Refresh must never rewrite private draft store');
    // Distinct owner opens an independent IndexedDB and sees no source images.
    const foreign=await browser.newContext({viewport:{width,height:844},
     isMobile:true,hasTouch:true,serviceWorkers:'block'});
    try{
     await setup(foreign,otherOwner);
     const p=await foreign.newPage();
     p.on('pageerror',e=>pageErrors.push(String(e)));
     await p.goto(url+'/',{waitUntil:'domcontentloaded'});
     await p.evaluate(()=>closetReady);
     await p.evaluate(()=>switchView('review'));
     await p.getByRole('button',{name:'Refresh photo results'}).click();
     assert.equal(await p.evaluate(()=>batch.length),0);
    }finally{await foreign.close();}
    assert.deepEqual(pageErrors,[]);
    results.push({engine:engineName,width,case:'PASS',syntheticOriginals:2,
     refreshedHumanColor:true,failedSaveRetained:true,deletedSourceRetained:true,
     distinctOwnerIsolated:true,blockedOffHostRequests:blockedRequests.length});
   }finally{await c.close();await browser.close();}
  }
 }
 await writeFile(resolve(out,'results.json'),JSON.stringify({status:'PASS',synthetic:true,
  physicalDevice:false,hostedCloud:false,familyAlpha:'HOLD',cases:results},null,2));
 console.log('MISSION3 SAFE PHOTO RESULTS REFRESH PASS '+results.length+' native engine/viewport cases; HOLD #255');
}finally{await new Promise(ok=>server.close(ok));}
