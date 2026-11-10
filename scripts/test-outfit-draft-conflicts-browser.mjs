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

const root=resolve(process.env.APP_SOURCE_ROOT||'.'),out=process.env.CONFLICT_OUT||'benchmark/outfit-draft-conflicts';
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




     await page.evaluate(()=>switchView('builder'));
     await page.locator('#boardSlots .board-slot-top').click();await page.locator('#boardPickerItems .board-pick').first().click();await page.evaluate(()=>writes);
     const other=await context.newPage();
     try{
      await other.goto(host);await other.evaluate(async()=>{await closetReady;await outfitBoardReady;switchView('builder');});
      await page.locator('#boardName').fill('Newer draft from first tab');await page.locator('#boardName').press('Tab');await page.evaluate(()=>writes);
      await other.locator('#boardName').fill('Stale second-tab draft');await other.locator('#boardName').press('Tab');await other.evaluate(()=>writes);
      const storedName=await page.evaluate(()=>new Promise(resolve=>{const r=db.transaction('state').objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result.current.name);}));
      const baseline=process.env.EXPECT_BASELINE==='1';
      if(baseline){assert.equal(storedName,'Stale second-tab draft');results.push({engine,width,baseline:true,silentOverwrite:true});}
      else{
       assert.equal(storedName,'Newer draft from first tab');assert.equal(await other.locator('#boardName').inputValue(),'Stale second-tab draft');
       await other.getByRole('button',{name:'Load latest draft',exact:true}).waitFor();await other.getByRole('button',{name:'Save my draft instead',exact:true}).waitFor();
       for(const name of ['Load latest draft','Save my draft instead']){const box=await other.getByRole('button',{name,exact:true}).boundingBox();assert.ok(box.width>=44&&box.height>=44,'conflict resolution touch target');}
       await other.evaluate(()=>reloadCloudBoard());assert.equal(await other.locator('#boardName').inputValue(),'Stale second-tab draft','automatic refresh must retain local input');
       assert.equal(await other.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;}),true);
       await audit(other,engine+'-'+width+'-conflict');await layout(other);await other.screenshot({path:out+'/'+engine+'-'+width+'-conflict.png',fullPage:true});
       // Save a separate outfit while stale: preserve the newer shared draft.
       await other.locator('#saveBoard').click();await other.waitForFunction(()=>savedOutfitBoards.length===1);
       assert.equal(await other.evaluate(()=>new Promise(resolve=>{const r=db.transaction('state').objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result.current.name);})), 'Newer draft from first tab');
       await other.getByRole('button',{name:'Load latest draft',exact:true}).click();
       await other.waitForFunction(()=>document.getElementById('boardName').value==='Newer draft from first tab');
       assert.equal(await other.evaluate(()=>savedOutfitBoards.length),1);
       // Explicit overwrite is bound to the latest version actually observed.
       await page.locator('#boardName').fill('Third version');await page.locator('#boardName').press('Tab');await page.evaluate(()=>writes);
       await other.locator('#boardName').fill('Local version to keep');await other.locator('#boardName').press('Tab');await other.evaluate(()=>writes);
       await page.locator('#boardName').fill('Fourth version');await page.locator('#boardName').press('Tab');await page.evaluate(()=>writes);
       await other.getByRole('button',{name:'Save my draft instead',exact:true}).click();
       await other.evaluate(()=>writes);
       assert.equal(await other.evaluate(()=>new Promise(resolve=>{const r=db.transaction('state').objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result.current.name);})), 'Fourth version','stale override cannot erase unseen version');
       await other.getByRole('button',{name:'Save my draft instead',exact:true}).click();
       await other.waitForFunction(()=>/changes saved/.test(document.getElementById('boardSaveStatus').textContent));
       await other.reload();await other.evaluate(async()=>{await closetReady;await outfitBoardReady;switchView('builder');});
       assert.equal(await other.locator('#boardName').inputValue(),'Local version to keep');assert.equal(await other.evaluate(()=>savedOutfitBoards.length),1);
       await audit(other,engine+'-'+width+'-resolved');await other.screenshot({path:out+'/'+engine+'-'+width+'-resolved.png',fullPage:true});
       results.push({engine,width,baseline:false,staleDraftRefused:true,localInputRetained:true,appendPreservesRemoteDraft:true,loadLatest:true,automaticRefreshPreserved:true,unseenVersionOverrideRefused:true,explicitOverrideReload:true,savedOutfitsRetained:true});
      }
     }finally{await other.close();}
    }catch(error){await page.screenshot({path:out+'/'+engine+'-'+width+'-FAIL.png',fullPage:true});throw error;}
    finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 assert.deepEqual(errors,[]);await writeFile(out+'/results.json',JSON.stringify({cases:results,errors,syntheticAuth:true,physicalPhones:false,familyAlpha:'HOLD'},null,2));console.log(JSON.stringify(results));
}finally{server.close();}
