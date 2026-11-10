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

const root=resolve('.'),out='benchmark/family-reliability-mobile';
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

     async function closet(){await page.evaluate(()=>{window.closetBrowseAll=true;switchView('closet');render();});}
     async function editor(id='tee'){await closet();await page.locator('[data-item-id="'+id+'"]').getByRole('button',{name:'Adjust details',exact:true}).click();return page.getByRole('dialog',{name:'Adjust clothing details'});}
     await closet();await audit(page,engine+'-'+width+'-closet');
     let dialog=await editor();await layout(page);await audit(page,engine+'-'+width+'-editor');await page.screenshot({path:out+'/'+engine+'-'+width+'-editor.png',fullPage:false});
     await dialog.getByLabel('Item name',{exact:true}).fill('My favorite blue shirt');
     await dialog.getByRole('button',{name:'Save changes',exact:true}).click();await dialog.waitFor({state:'detached'});
     assert.equal(await page.evaluate(async()=>(await readAll()).find(x=>x.id==='tee').name),'My favorite blue shirt');
     await page.waitForFunction(()=>document.activeElement?.textContent==='Adjust details');
     await page.evaluate(()=>render());
     assert.equal(await page.evaluate(()=>document.activeElement?.dataset.action),'edit-clothing','closet refresh must retain keyboard focus');
     // Close retains unsaved data only after an explicit discard decision.
     dialog=await editor();await dialog.getByLabel('Item name',{exact:true}).fill('Discard me');
     assert.equal(await page.evaluate(()=>{const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;}),true,'unsaved reload protected');
     page.once('dialog',d=>d.dismiss());await dialog.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await dialog.count(),1);
     page.once('dialog',d=>d.accept());await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
     assert.equal(await page.evaluate(async()=>(await readAll()).find(x=>x.id==='tee').name),'My favorite blue shirt');
     // Storage failure stays visible INSIDE the modal and preserves draft input.
     dialog=await editor();await dialog.getByLabel('Item name',{exact:true}).fill('Retry preserved draft');
     await page.evaluate(()=>{window.savedCloud=window.closetCloud;window.closetCloud={beforeWrite:async()=>{throw new DOMException('Injected quota failure','QuotaExceededError');}};});
     await dialog.getByRole('button',{name:'Save changes',exact:true}).click();await dialog.getByRole('status').filter({hasText:'Changes were not saved'}).waitFor();
     assert.equal(await dialog.getByLabel('Item name',{exact:true}).inputValue(),'Retry preserved draft');
     const statusBox=await dialog.getByRole('status').boundingBox();assert.ok(statusBox.y>=0&&statusBox.y+statusBox.height<=844,'save error visible without scrolling');
     await audit(page,engine+'-'+width+'-failed-save');await page.screenshot({path:out+'/'+engine+'-'+width+'-failed-save.png',fullPage:false});
     await page.evaluate(()=>window.closetCloud=window.savedCloud);await dialog.getByRole('button',{name:'Save changes',exact:true}).click();await dialog.waitFor({state:'detached'});
     // A separate tab's edit is preserved rather than overwritten.
     dialog=await editor();await dialog.getByLabel('Item name',{exact:true}).fill('Stale overwrite');
     await page.evaluate(async()=>{const row=(await readAll()).find(x=>x.id==='tee');await writeAll([{...row,name:'Changed in another tab'}]);});
     await dialog.getByRole('button',{name:'Save changes',exact:true}).click();await dialog.getByRole('status').filter({hasText:'Another tab changed'}).waitFor();
     assert.equal(await page.evaluate(async()=>(await readAll()).find(x=>x.id==='tee').name),'Changed in another tab');
     page.once('dialog',d=>d.accept());await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
     // Reload proves persisted editing and lossless cancellation.
     await page.reload();await page.evaluate(async()=>{await closetReady;await outfitBoardReady;});await closet();
     assert.equal(await page.locator('[data-item-id="tee"] h3').innerText(),'Changed in another tab');
     // A deleted row cannot be resurrected by an already-open editor.
     dialog=await editor();await page.evaluate(()=>removeItem('tee'));await dialog.getByRole('button',{name:'Save changes',exact:true}).click();
     await dialog.getByRole('status').filter({hasText:'Another tab changed'}).waitFor();assert.equal(await page.evaluate(async()=>(await readAll()).some(x=>x.id==='tee')),false);
     await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
     // Broken images explain the missing photo while preserving the item.
     await page.evaluate(async()=>{const row=(await readAll()).find(x=>x.id==='polo');await writeAll([{...row,image:'/public/fixture-missing-photo.jpg'}]);items=(await readAll()).map(normalizeClothing);render();});
     await page.locator('[data-item-id="polo"] .missing-photo').waitFor();await audit(page,engine+'-'+width+'-missing-photo');
     await page.screenshot({path:out+'/'+engine+'-'+width+'-missing-photo.png',fullPage:true});
     await page.evaluate(()=>switchView('builder'));await page.locator('#boardSlots .board-slot-bottom').click();
     await audit(page,engine+'-'+width+'-picker');await layout(page);await page.locator('#boardPickerItems .board-pick').first().click();
     await page.waitForFunction(()=>/changes saved/.test(document.getElementById('boardSaveStatus').textContent));
     await page.evaluate(()=>{window.closetCloud={beforeWrite:async()=>{throw Error('Injected storage failure');}};});
     await page.locator('#saveBoard').click();await page.waitForFunction(()=>/Could not save this outfit/.test(document.getElementById('boardSaveStatus').textContent));
     assert.equal(await page.evaluate(()=>savedOutfitBoards.length),0);
     await page.evaluate(()=>window.closetCloud=window.savedCloud);await page.locator('#saveBoard').click();await page.waitForFunction(()=>/Outfit saved with/.test(document.getElementById('boardSaveStatus').textContent));
     await page.reload();await page.evaluate(async()=>{await closetReady;await outfitBoardReady;switchView('builder');});
     assert.equal(await page.locator('#savedBoards button').count(),1);await page.locator('#savedBoards button').click();
     await audit(page,engine+'-'+width+'-saved-outfit');await layout(page);await page.screenshot({path:out+'/'+engine+'-'+width+'-saved-outfit.png',fullPage:true});
     await page.setViewportSize({width:844,height:390});await layout(page);await closet();dialog=await editor('polo');await layout(page);
     await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await page.setViewportSize({width,height:844});
     await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.main-nav .tab')).transitionDuration),'0s');
     results.push({engine,width,editPersisted:true,cancelPreserved:true,saveFailureRetry:true,staleEditRejected:true,deletedRowNotResurrected:true,missingPhotoExplained:true,outfitFailureRollback:true,outfitReload:true,portraitLandscape:true});
    }catch(error){await page.screenshot({path:out+'/'+engine+'-'+width+'-FAIL.png',fullPage:true});throw error;}
    finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 assert.deepEqual(errors,[]);await writeFile(out+'/results.json',JSON.stringify({cases:results,errors,syntheticAuth:true,physicalPhones:false,familyAlpha:'HOLD'},null,2));console.log(JSON.stringify(results));
}finally{server.close();}
