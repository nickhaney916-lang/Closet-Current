/** Mission 1 P865 source-executing NATIVE browser original photo acceptance.
 * Synthetic JPEGs with real bytes/native IDB; simulated auth/quality flags.
 * Desktop browsers at mobile CSS widths are NOT physical devices.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';

const root=resolve('public');
const output=resolve(process.argv[2]||'benchmark/mission1-original-photo-browser-865');
await mkdir(output,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const photos=await Promise.all([
 sharp({create:{width:192,height:128,channels:3,background:{r:34,g:41,b:51}}}).jpeg({quality:83}).toBuffer(),
 sharp({create:{width:192,height:128,channels:3,background:{r:170,g:92,b:56}}}).jpeg({quality:84}).toBuffer()
]).then(xs=>xs.map(bytes=>({
 image:'data:image/jpeg;base64,'+bytes.toString('base64'),
 sha256:createHash('sha256').update(bytes).digest('hex')
})));
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const filename=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!filename.startsWith(root+'/')||path.includes('\\'))throw Error('unsafe path');
  res.writeHead(200,{'content-type':types[extname(filename)]||'application/octet-stream','cache-control':'no-store'});
  res.end(await readFile(filename));
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const cases=[];
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const owner='a'+width+'7777-7777-4777-8777-777777777777';
   const stranger='b'+width+'7777-7777-4777-8777-777777777777';
   const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const pageErrors=[],offhost=[];
   try{
    await context.route('**/auth.js*',r=>r.fulfill({contentType:'text/javascript',
     body:"window.closetAuth={user:{id:'"+owner+"'},ready:Promise.resolve(),assertCurrent:()=>{},getAccessToken:async()=>null};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    await context.route('**/cloud-backup.js*',r=>r.fulfill({contentType:'text/javascript',
     body:"window.closetCloud={start:async()=>{},beforeWrite:async()=>{},changed:()=>{}};"}));
    await context.route('**/*',r=>{
     const url=new URL(r.request().url());
     if(url.hostname==='127.0.0.1'||url.protocol==='blob:'||url.protocol==='data:')return r.fallback();
     offhost.push({href:url.href,method:r.request().method()});return r.abort();
    });
    await context.addInitScript(()=>{
     class InertWorker{
      constructor(){this.onmessage=null;this.stopped=false;}
      postMessage(m){queueMicrotask(()=>{if(!this.stopped)this.onmessage?.({data:{
       type:m.type==='load'?'ready':'result',id:m.id,choices:[],strong:false,details:{}
      }});});}
      terminate(){this.stopped=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:InertWorker});
    });
    const page=await context.newPage();
    page.on('pageerror',e=>pageErrors.push(String(e)));
    const readDraft=()=>page.evaluate(async()=>{
     const request=db.transaction('state').objectStore('state').get('draft');
     return new Promise((ok,fail)=>{request.onsuccess=()=>ok(request.result?.batch||[]);request.onerror=()=>fail(request.error);});
    });
    const checkJpegs=(rows,expected)=>{
     assert.deepEqual(rows.map(x=>x.image),expected.map(x=>x.image));
     assert.deepEqual(rows.map(x=>createHash('sha256').update(Buffer.from(x.image.slice('data:image/jpeg;base64,'.length),'base64')).digest('hex')),
      expected.map(x=>x.sha256),'native IDB original JPEG bytes are unchanged');
    };
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>closetReady);
    const init=await page.evaluate(async({photos})=>{
     // Turn off automatic model starts so both accepted originals are durable
     // before exercising exact source-level recognizeItem() decisions.
     window.queueAutomatic=()=>{};
     const decisions=photos.map(p=>candidate(p.image));
     await persistDraft();
     return {decisions,ids:batch.map(x=>x.id),dbName:db.name};
    },{photos});
    assert.deepEqual(init.decisions,[true,true]);
    assert.equal(init.dbName,'closet-current-user-'+owner);
    let rows=await readDraft();
    assert.equal(rows.length,2);
    checkJpegs(rows,photos);
    const blank=await page.evaluate(async()=>{
     const original=checkPhoto;
     checkPhoto=async()=>({blank:true,captureGuidance:{advice:['Try brighter lighting']}});
     const item=batch[0];
     try{await recognizeItem(item);await persistDraft();}
     finally{checkPhoto=original;}
     return {id:item.id,analyzed:item.localAnalyzed,review:item.requiresOwnershipConfirmation,status:item.localStatus};
    });
    assert.equal(blank.analyzed,true);
    assert.equal(blank.review,true);
    assert.match(blank.status,/Original photo kept/);
    rows=await readDraft();checkJpegs(rows,photos);

    const dupe=await page.evaluate(async()=>{
     // A separately saved item can become visible after capture acceptance.
     const prior={...batch[1],id:'PREEXISTING_GARMENT'};
     items.push(prior);
     const original=checkPhoto;
     checkPhoto=async()=>({blank:false,signature:[11,15,21],aspect:1});
     const item=batch[1];
     try{await recognizeItem(item);await persistDraft();}
     finally{checkPhoto=original;}
     return {id:item.id,analyzed:item.localAnalyzed,review:item.requiresOwnershipConfirmation,
      duplicate:item.possibleDuplicate,status:item.localStatus,previousItemStillOwned:items.some(x=>x.id==='PREEXISTING_GARMENT')};
    });
    assert.equal(dupe.analyzed,true);
    assert.equal(dupe.review,true);
    assert.equal(dupe.duplicate,true);
    assert.equal(dupe.previousItemStillOwned,true);
    assert.match(dupe.status,/Original photo kept/);
    rows=await readDraft();checkJpegs(rows,photos);

    // Reload tests actual IDB durability, not merely remaining JS memory.
    await page.reload({waitUntil:'domcontentloaded'});
    await page.evaluate(()=>closetReady);
    rows=await readDraft();checkJpegs(rows,photos);
    assert.equal(await page.evaluate(()=>batch.length),2);
    assert.equal(await page.evaluate(()=>batch.every(x=>x.localAnalyzed===true)),true);

    // Exact same origin and browser storage, but a different owner namespace.
    const foreign=await page.evaluate(async stranger=>{
     const own=window.closetAuth.user;
     try{
      window.closetAuth.user={id:stranger};
      const foreignDb=await openDB();
      try{
       const req=foreignDb.transaction('state').objectStore('state').get('draft');
       const list=await new Promise((ok,fail)=>{req.onsuccess=()=>ok(req.result?.batch||[]);req.onerror=()=>fail(req.error);});
       return {name:foreignDb.name,ids:list.map(x=>x.id)};
      }finally{foreignDb.close();}
     }finally{window.closetAuth.user=own;}
    },stranger);
    assert.equal(foreign.name,'closet-current-user-'+stranger);
    assert.deepEqual(foreign.ids,[]);

    // Use real app Adjust/Remove button, not privileged direct IDB removal.
    await page.evaluate(()=>switchView('review'));
    await page.locator('#reviewGrid').getByRole('button',{name:'Adjust'}).first().click();
    await page.getByRole('button',{name:'Remove photo'}).click();
    await page.waitForFunction(()=>batch.length===1);
    await page.evaluate(()=>persistDraft());
    rows=await readDraft();
    checkJpegs(rows,[photos[1]]);
    assert.equal(await page.evaluate(()=>batch[0].id),dupe.id);
    assert.deepEqual(pageErrors,[]);
    assert.ok(offhost.every(x=>x.method==='GET'&&(
     x.href.startsWith('https://fonts.googleapis.com/css2?')||
     x.href.startsWith('https://raw.githubusercontent.com/nickhaney916-lang/Closet-Current/main/public/trend-data.json?')
    )),'all attempted off-host traffic must be allowlisted public GETs and blocked');
    cases.push({engine,width,nativeBrowser:true,syntheticPhoto:true,blankOriginalRetained:true,
     exactSourceReviewRetained:true,sha256Unchanged:true,reloadRecovered:true,
     sameOriginForeignOwnerSeparated:true,ownerExplicitRemoveOne:true,offhostRequestsBlocked:offhost.length});
   }finally{await context.close();await browser.close();}
  }
 }
 assert.equal(cases.length,6);
 await writeFile(resolve(output,'results.json'),JSON.stringify({
  status:'PASS',familyAlpha:'HOLD',physicalDevices:0,
  realModelInference:0,independentHumanLabels:0,cases
 },null,2));
 console.log('M1_P865_NATIVE_BROWSER_ORIGINAL_PHOTO '+JSON.stringify({
  cases:cases.length,browsers:['chromium','webkit'],widths:[320,390,430],
  sha256Preserved:true,durableReload:true,explicitRemove:true,
  physicalDevices:0,modelAccuracy:'UNKNOWN'
 }));
}finally{await new Promise(resolve=>server.close(resolve));}
