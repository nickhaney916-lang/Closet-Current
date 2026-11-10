/**
 * STYLE-NEW-ITEM-01 — actual app UI + owner-private IndexedDB in Chromium and
 * WebKit. Auth is a synthetic fixture; no cloud writes, AI inference or device
 * camera is claimed. A JPEG data URL enters the actual camera candidate path.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {createHash} from 'node:crypto';

const root=resolve(process.env.APP_SOURCE_ROOT||'.'),out=process.env.OUTFIT_SAVE_OUT||'benchmark/outfit-save-recovery';
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/public\/[a-zA-Z0-9_./-]+$/.test(path)||path.split('/').includes('..'))throw Error('forbidden path');
  const file=resolve(root,'.'+path),bytes=await readFile(file);
  if(!file.startsWith(root+'/public/'))throw Error('outside public app');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port+'/public/index.html'; // P167 no research URL flags
const jpg=await sharp({create:{width:24,height:32,channels:3,background:'#426f54'}}).jpeg().toBuffer();
const dataURL='data:image/jpeg;base64,'+jpg.toString('base64');
const sha=()=>createHash('sha256').update(jpg).digest('hex');
const capturePhoto=await sharp(Buffer.from('<svg width="240" height="320" xmlns="http://www.w3.org/2000/svg"><rect width="240" height="320" fill="#f1eee7"/><path d="M74 38 42 58 18 126l37 14 15-34v174h100V106l15 34 37-14-24-68-32-20-26 18H100z" fill="#287346"/><path d="M115 55h10v224h-10z" fill="#e7eadf"/></svg>')).jpeg({quality:90}).toBuffer();
const cameraFrame='data:image/jpeg;base64,'+capturePhoto.toString('base64');
const owner='synthetic-style-owner-a';
const fixtures=[
 ['tee','Tops','T-shirt','Blue'],['polo','Tops','Polo','White'],
 ['jeans','Bottoms','Jeans','Blue'],['trousers','Bottoms','Trousers','Black'],['shorts','Bottoms','Shorts','Tan'],
 ['sneakers','Shoes','Sneakers','White'],['loafers','Shoes','Loafers','Brown'],['flats','Shoes','Flats','Black']
].map(([id,category,itemType,color])=>({id,ownerId:owner,name:id==='new-blouse'?'New reviewed blouse':itemType,
 category,itemType,color,colorSource:'user',pattern:'Solid',sleeveLength:'Unknown',seasons:[],image:dataURL,
 sourceSHA256:sha(),sourceHashVerified:true,sourcePhotoOriginal:true,userAdjusted:true,
 confirmedDetails:{category,itemType},localAnalyzed:true,indexingLevel:'specific-type',savedAt:new Date().toISOString()}));
const results=[],errors=[];
const axe=(await import('axe-core')).default;
async function audit(page,label){await page.addScriptTag({content:axe.source});const report=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));await writeFile(out+'/'+label+'-axe.json',JSON.stringify(report,null,2));assert.deepEqual(report.violations.map(v=>v.id),[],label+' accessibility');}
async function layout(page){const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,dialog:[...document.querySelectorAll('dialog[open]')].map(d=>({width:d.getBoundingClientRect().width,left:d.getBoundingClientRect().left}))}));assert.ok(size.scroll<=size.width,JSON.stringify(size));assert.ok(size.dialog.every(d=>d.left>=0&&d.width<=size.width),JSON.stringify(size));}

const provenance167=[];
try{
 const engines=process.env.STYLE_FOCUSED_ENGINE==='chromium'?[['chromium',chromium]]:[['chromium',chromium],['webkit',webkit]];
 for(const [engine,type] of engines){
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url());
     // Native File/Blob image decoding stays browser-local; these are not
     // external requests and must not be blocked by test-only HTTPS isolation.
     if(url.protocol==='blob:'||url.protocol==='data:')return route.continue();
     if(url.hostname==='127.0.0.1'||url.hostname==='localhost')return route.continue();
     if(url.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&url.pathname==='/auth/v1/token')
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_in:3600,user:{id:owner,email:'fixture@example.invalid',user_metadata:{username:'Fixture'}}})});
     return route.abort();
    });
    await context.addInitScript(()=>localStorage.setItem('closet-current-auth-v1',JSON.stringify({
     epoch:'synthetic-epoch',access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600
    })));
    await context.addInitScript(()=>{
     class ReviewOnlyWorker{
      constructor(){this.onmessage=null;this.terminated=false;}
      postMessage(data){const reply=value=>setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{id:data.id,...value}});},0);
       if(data.type==='load')reply({type:'ready'});
       else if(data.type==='classify')reply({type:'result',strong:false,categoryConfirmed:false,choices:[],details:{}});
      }
      terminate(){this.terminated=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:ReviewOnlyWorker});
    });
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(String(error)));
    try{
     await page.goto(host,{waitUntil:'domcontentloaded'});
     await page.evaluate(async()=>{await window.closetAuth.ready;await closetReady;await outfitBoardReady;});
     await page.evaluate(async rows=>{
      await writeAll(rows);items=(await readAll()).map(normalizeClothing);render();
      window.dispatchEvent(new Event('closet:style-owned-inventory-committed'));
     },fixtures);


     await page.evaluate(()=>switchView('stylist'));
     await page.getByRole('button',{name:'Create my outfits',exact:true}).click();
     await page.waitForFunction(()=>document.querySelectorAll('#styledCollectionResults .styled-outfit').length===3);
     const cards=page.locator('#styledCollectionResults .styled-outfit');
     await page.evaluate(()=>{window.savedCloud=window.closetCloud;window.saveCalls=0;window.closetCloud={beforeWrite:async()=>{if(++window.saveCalls===1)await new Promise((resolve,reject)=>window.releaseFailedSave=()=>reject(Error('Injected first outfit save failure')));}};});
     await cards.nth(0).getByRole('button',{name:'Save outfit',exact:true}).click();
     await page.waitForFunction(()=>Boolean(window.releaseFailedSave));
     await cards.nth(1).getByRole('button',{name:'Save outfit',exact:true}).click();
     await page.evaluate(()=>window.releaseFailedSave());
     await cards.nth(0).getByText(/Injected first outfit save failure/).waitFor();
     await cards.nth(1).getByRole('button',{name:'Saved',exact:true}).waitFor();
     const outcome=await page.evaluate(async()=>({memory:savedOutfitBoards.map(x=>x.name),stored:await new Promise(resolve=>{const r=db.transaction('state').objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result.saved.map(x=>x.name));})}));
     const baseline=process.env.EXPECT_BASELINE==='1';
     if(baseline){assert.equal(outcome.stored.length,2);assert.match(outcome.stored[0],/option 1/);assert.equal(outcome.memory.length,1);assert.match(outcome.memory[0],/option 1/);}
     else{
      assert.equal(outcome.stored.length,1);assert.match(outcome.stored[0],/option 2/);assert.deepEqual(outcome.memory,outcome.stored);
      await audit(page,engine+'-'+width+'-save-recovery');await layout(page);
     }
     await page.screenshot({path:out+'/'+engine+'-'+width+'-overlapping-save.png',fullPage:true});
     await page.evaluate(()=>window.closetCloud=window.savedCloud);
     if(!baseline){
      // Retry the failed first option; each successful save is retained once.
      await cards.nth(0).getByRole('button',{name:'Save outfit',exact:true}).click();await cards.nth(0).getByRole('button',{name:'Saved',exact:true}).waitFor();
      await page.reload();await page.evaluate(async()=>{await closetReady;await outfitBoardReady;switchView('builder');});
      assert.equal(await page.locator('#savedBoards button').count(),2);
      const names=await page.evaluate(()=>savedOutfitBoards.map(x=>x.name));assert.match(names[0],/option 2/);assert.match(names[1],/option 1/);
      await audit(page,engine+'-'+width+'-reopened');await page.screenshot({path:out+'/'+engine+'-'+width+'-reopened.png',fullPage:true});
      // Separate pages have independent JavaScript write queues but share the
      // same real IndexedDB owner store. Both Save buttons must survive.
      await page.locator('#boardSlots .board-slot-top').click();await page.locator('#boardPickerItems .board-pick').first().click();
      await page.locator('#boardName').fill('Tab A save');await page.locator('#boardName').press('Tab');
      await page.evaluate(()=>writes);
      const other=await context.newPage();
      try{
       await other.goto(host);await other.evaluate(async()=>{await closetReady;await outfitBoardReady;switchView('builder');});
       await other.locator('#boardName').fill('Tab B save');await other.locator('#boardName').press('Tab');await other.evaluate(()=>writes);
       for(const tab of [page,other])await tab.evaluate(()=>{window.closetCloud={beforeWrite:()=>new Promise(resolve=>window.releaseTabSave=resolve)};});
       await page.locator('#saveBoard').click();await other.locator('#saveBoard').click();
       for(const tab of [page,other])await tab.waitForFunction(()=>Boolean(window.releaseTabSave));
       await Promise.all([page,other].map(tab=>tab.evaluate(()=>window.releaseTabSave())));
       for(const tab of [page,other])await tab.waitForFunction(()=>/Outfit saved with/.test(document.getElementById('boardSaveStatus').textContent));
       await page.evaluate(()=>window.closetCloud=window.savedCloud);
       await page.reload();await page.evaluate(async()=>{await closetReady;await outfitBoardReady;switchView('builder');});
       const savedNames=await page.evaluate(()=>savedOutfitBoards.map(x=>x.name));assert.equal(savedNames.length,4);assert.ok(savedNames.includes('Tab A save'));assert.ok(savedNames.includes('Tab B save'));
      }finally{await other.close();}
      // Switch the synthetic account AND database while an old-owner save is
      // waiting. It must not write any original-owner outfit into B's store.
      await page.evaluate(()=>{window.savedCloud=window.closetCloud;window.closetCloud={beforeWrite:()=>new Promise(resolve=>window.releaseOwnerSave=resolve)};});
      await page.locator('#saveBoard').click();await page.waitForFunction(()=>Boolean(window.releaseOwnerSave));
      await page.evaluate(async()=>{
       window.originalDB=db;window.originalAuth=window.closetAuth;
       window.foreignDB=await new Promise((resolve,reject)=>{const r=indexedDB.open('closet-current-user-synthetic-style-owner-b',2);r.onupgradeneeded=()=>{r.result.createObjectStore('state',{keyPath:'id'});r.result.createObjectStore('items',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
       db=window.foreignDB;window.closetAuth={user:{id:'synthetic-style-owner-b'},assertCurrent(){}};window.releaseOwnerSave();
      });
      await page.waitForFunction(()=>/Could not save this outfit/.test(document.getElementById('boardSaveStatus').textContent));
      const isolation=await page.evaluate(async()=>{
       const get=database=>new Promise(resolve=>{const r=database.transaction('state').objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result);});
       return {foreign:await get(window.foreignDB),original:(await get(window.originalDB)).saved.length};
      });assert.equal(isolation.foreign,undefined);assert.equal(isolation.original,4);
      await page.evaluate(()=>{db=window.originalDB;window.closetAuth=window.originalAuth;window.closetCloud=window.savedCloud;window.foreignDB.close();});

     }
     results.push({engine,width,baseline,failedSaveInStoredList:baseline,successfulSaveRetained:true,retryReload:!baseline,twoRealTabs:!baseline,queuedOwnerSwapRefused:!baseline,outcome});
    }catch(error){await page.screenshot({path:out+'/'+engine+'-'+width+'-FAIL.png',fullPage:true});throw error;}
    finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 assert.deepEqual(errors,[]);await writeFile(out+'/results.json',JSON.stringify({cases:results,errors,syntheticAuth:true,physicalPhones:false,familyAlpha:'HOLD'},null,2));console.log(JSON.stringify(results));
}finally{server.close();}
