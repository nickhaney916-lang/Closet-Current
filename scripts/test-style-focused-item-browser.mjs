/**
 * STYLE-NEW-ITEM-01 — actual app UI + owner-private IndexedDB in Chromium and
 * WebKit. Auth is a synthetic fixture; no cloud writes, AI inference or device
 * camera is claimed. Garment records are synthetic test rows with local JPEGs.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {createHash} from 'node:crypto';

const root=resolve('.'),out='benchmark/style-focused-item-01';
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
const host='http://127.0.0.1:'+server.address().port+'/public/index.html?ownerReview145=research';
const jpg=await sharp({create:{width:24,height:32,channels:3,background:'#426f54'}}).jpeg().toBuffer();
const dataURL='data:image/jpeg;base64,'+jpg.toString('base64');
const sha=()=>createHash('sha256').update(jpg).digest('hex');
const capturePng=await sharp(Buffer.from('<svg width="240" height="320" xmlns="http://www.w3.org/2000/svg"><rect width="240" height="320" fill="#f1eee7"/><path d="M74 38 42 58 18 126l37 14 15-34v174h100V106l15 34 37-14-24-68-32-20-26 18H100z" fill="#287346"/><path d="M115 55h10v224h-10z" fill="#e7eadf"/></svg>')).png().toBuffer();
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
try{
 const engines=process.env.STYLE_FOCUSED_ENGINE==='chromium'?[['chromium',chromium]]:[['chromium',chromium],['webkit',webkit]];
 for(const [engine,type] of engines){
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url());
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
     await page.evaluate(()=>switchView('scan'));
     await page.locator('#clothingPhotos').setInputFiles({name:'new-reviewed-blouse.png',mimeType:'image/png',buffer:capturePng});
     try{await page.waitForFunction(()=>batch.some(x=>x.importFilename==='new-reviewed-blouse.png'),null,{timeout:20000});}
     catch(error){const state=await page.evaluate(()=>({importResult:window.__lastPhotoImportResult,
      message:document.getElementById('message')?.textContent,authOwner:window.closetAuth?.user?.id,
      dbName:db?.name,batch:batch.map(x=>({id:x.id,name:x.name,status:x.localStatus,scanFailed:x.scanFailed})),
      recognitionPhase:recognitionState.phase}));throw Error(String(error)+'; import diagnostics='+JSON.stringify(state));}
     await page.evaluate(()=>switchView('review'));
     await page.locator('#reviewGrid article.photo-result').getByRole('button',{name:'Adjust',exact:true}).click();
     await page.waitForFunction(()=>document.querySelector('dialog.photo-adjust[open]')!==null);
     await page.locator('dialog.photo-adjust input[aria-label="Item name"]').fill('New reviewed blouse');
     await page.locator('dialog.photo-adjust select[aria-label="Main category"]').selectOption('Tops');
     await page.locator('dialog.photo-adjust select[aria-label="Item type"]').selectOption('Blouse');
     await page.locator('dialog.photo-adjust input[aria-label="Color"]').fill('Green');
     await page.locator('dialog.photo-adjust form').evaluate(form=>form.requestSubmit());
     await page.waitForFunction(()=>items.some(x=>x.name==='New reviewed blouse'&&x.itemType==='Blouse')&&!document.querySelector('dialog.photo-adjust[open]'),null,{timeout:20000});
     const focusedId=await page.evaluate(()=>items.find(x=>x.name==='New reviewed blouse'&&x.itemType==='Blouse')?.id);
     assert.ok(focusedId);
     await page.evaluate(()=>{switchView('closet');const search=document.getElementById('search');search.value='New reviewed blouse';search.dispatchEvent(new Event('input',{bubbles:true}));});
     const closetOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
     assert.equal(closetOverflow,false,engine+' closet card overflow at '+width);
     await page.locator('#closetGrid .card').filter({hasText:'New reviewed blouse'}).getByRole('button',{name:'Get three outfit ideas'}).click();
     await page.waitForFunction(()=>document.querySelectorAll('#styledCollectionResults .styled-outfit').length===3,null,{timeout:15000});
     const generated=await page.evaluate(()=>({
      cards:[...document.querySelectorAll('#styledCollectionResults .styled-outfit')].map(card=>({
       focus:card.textContent.includes('New reviewed blouse'),
       figureCount:card.querySelectorAll('figure').length,
       labels:[...card.querySelectorAll('figcaption')].map(x=>x.textContent)
      })),selected:document.getElementById('stylistFocusItem').value,overflow:document.documentElement.scrollWidth>innerWidth+1,
      status:document.getElementById('stylistStatus').textContent
     }));
     assert.equal(generated.cards.length,3);assert.ok(generated.cards.every(x=>x.focus&&x.figureCount>=3));
     assert.equal(generated.selected,focusedId);
     assert.equal(generated.overflow,false,engine+' horizontal overflow at '+width);
     const card=page.locator('#styledCollectionResults .styled-outfit').first();
     await card.getByRole('button',{name:'Save outfit'}).click();
     await page.waitForFunction(()=>savedOutfitBoards.length===1,null,{timeout:10000});
     const saved=await page.evaluate(()=>savedOutfitBoards[0]);
     assert.ok(Object.values(saved.slots).includes(focusedId));
     assert.ok(Object.values(saved.slots).every(id=>fixtures.some(x=>x.id===id)||id===focusedId));
     await card.getByRole('button',{name:'Adjust on outfit board'}).click();
     await page.waitForFunction(()=>!document.getElementById('builder').hidden,null,{timeout:10000});
     const swap=await page.evaluate(focus=>({focus:currentBoard.slots.top,slot:currentBoard.slots.shoes,
      alternatives:items.filter(x=>x.category==='Shoes'&&x.id!==currentBoard.slots.shoes).map(x=>({id:x.id,name:x.name||x.itemType}))}),focusedId);
     assert.equal(swap.focus,focusedId);assert.ok(swap.alternatives.length>=1);
     await page.locator('#boardSlots .board-slot-shoes').click();
     await page.locator('#boardPickerItems .board-pick').filter({hasText:swap.alternatives[0].name}).click();
     await page.waitForFunction(({focus,id})=>currentBoard.slots.top===focus&&currentBoard.slots.shoes===id,{focus:focusedId,id:swap.alternatives[0].id},{timeout:10000});
     await page.locator('#saveBoard').click();
     await page.waitForFunction(()=>savedOutfitBoards.length===2,null,{timeout:10000});
     const swapped=await page.evaluate(()=>savedOutfitBoards[1]);
     assert.equal(swapped.slots.top,focusedId);assert.equal(swapped.slots.shoes,swap.alternatives[0].id);
     await page.evaluate(()=>switchView('stylist'));
     await page.screenshot({path:`${out}/${engine}-${width}-saved-three-owned-looks.png`,fullPage:true});
     await page.reload({waitUntil:'domcontentloaded'});
     await page.evaluate(async()=>{await window.closetAuth.ready;await closetReady;await outfitBoardReady;});
     const reopened=await page.evaluate(async()=>({
      owner:window.closetAuth.user.id,items:(await readAll()).map(x=>x.id),boards:savedOutfitBoards
     }));
     assert.equal(reopened.owner,owner);assert.equal(reopened.items.length,fixtures.length+1);
     assert.equal(reopened.boards.length,2);assert.ok(Object.values(reopened.boards[0].slots).includes(focusedId));
     assert.equal(reopened.boards[1].slots.top,focusedId);assert.equal(reopened.boards[1].slots.shoes,swap.alternatives[0].id);
     results.push({engine,width,threeFocusedOwnedLooks:true,uniqueLookCount:3,saveAndReload:true,
      ownerScopedIndexedDB:true,offHostCallsBlocked:true,syntheticAuth:true,syntheticGarments:true,
      cameraCapture:false,actualPhotoFileReviewAndManualCorrection:true,oneOwnedPieceSwap:true,saveAndReloadAfterSwap:true,physicalPhone:false,overflow:generated.overflow,labels:generated.cards.map(x=>x.labels)});
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 assert.equal(errors.length,0,errors.join('; '));
 const report={verdict:'PASS',feature:'Style around a newly reviewed and saved owned item',engines:engines.map(x=>x[0]),cases:results,
  screenshots:results.length,offHostCalls:0,syntheticAuth:true,syntheticGarments:true,
  cameraCapture:'synthetic imported PNG; camera device stream is not exercised',freshAIInference:false,
  physicalAndroid:false,physicalIPhone:false,cloudWrites:false,familyAlpha:'HOLD'};
 await writeFile(out+'/results.json',JSON.stringify(report,null,2));
 console.log('STYLE-NEW-ITEM-01 browser acceptance PASS',JSON.stringify({engines:engines.map(x=>x[0]),cases:results.length,screenshots:results.length}));
}catch(error){
 await writeFile(out+'/failure.json',JSON.stringify({error:String(error),cases:results},null,2));throw error;
}finally{await new Promise(resolve=>server.close(resolve));}
