// Real local app and IndexedDB; synthetic Auth/wardrobes/images, no inference.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {wardrobe,validateSynthetic,photo,hash} from '../benchmark/issue201-synthetic-wardrobes.mjs';
const root=resolve('dist'),results=[],mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  if(req.method!=='GET')throw Error('No server mutations');
  const url=new URL(req.url,'http://local'),p=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!p.startsWith(root+'/')||!mime[extname(p)])throw Error('No inference or real-photo asset service');
  res.writeHead(200,{'Content-Type':mime[extname(p)]});res.end(await readFile(p));
 }catch{res.writeHead(404);res.end('Unavailable in offline synthetic harness');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
try{
 for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--no-sandbox'],...(process.env.ISSUE201_CHROME_CHANNEL==='chrome'?{channel:'chrome'}:{})}:{})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   let blockedExternal=0,forbiddenWrites=0;const pageErrors=[];
   await context.route('**/*',async route=>{
    const request=route.request(),u=new URL(request.url());
    if(!['http:','https:'].includes(u.protocol))return route.continue();
    if(request.method()!=='GET'){forbiddenWrites++;return route.abort();}
    if(u.origin!==origin){blockedExternal++;return route.abort('internetdisconnected');}
    if(u.pathname==='/auth.js')return route.fulfill({contentType:'text/javascript',body:"window.closetAuth={user:{id:localStorage.getItem('issue201-owner')||'synthetic-a'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"});
    if(/\.(png|jpe?g|webp|svg)$/.test(u.pathname))return route.fulfill({contentType:'image/jpeg',body:Buffer.from(photo('local-figure-placeholder').split(',')[1],'base64')});
    if(/model|\.onnx|\.bin|\/api\//i.test(u.pathname))return route.abort();
    return route.continue();
   });
   const page=await context.newPage();page.on('pageerror',e=>pageErrors.push(e.message));page.on('dialog',d=>d.accept());
   async function ready(){await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady,inspirationReady]));}
   async function seed(owner){
    const f=wardrobe(owner);validateSynthetic(f);
    const selected=f.items.filter(x=>['new-top','pants','shorts','skirt','shoe-1','shoe-2','shoe-3'].includes(x.id));
    return page.evaluate(async records=>{
     const normalized=records.map(normalizeClothing);await writeAll(normalized);items.splice(0,items.length,...normalized);activeTrendLibrary=null;render();return JSON.stringify([...items].sort((a,b)=>a.id.localeCompare(b.id)));
    },selected);
   }
   async function style(){
    await page.evaluate(()=>switchView('closet'));await page.locator('#closetAllPieces').click();
    await page.locator('#closetGrid article[data-item-id="new-top"]').getByRole('button',{name:'Style this'}).click();
    await page.waitForFunction(()=>styledCollectionResults.length===3);
   }
   await page.goto(origin+'/');await ready();const originalA=await seed('synthetic-a');await style();
   const options=await page.evaluate(()=>styledCollectionResults.map(r=>({board:JSON.parse(JSON.stringify(r.board)),missing:r.missing})));
   assert.equal(new Set(options.map(x=>JSON.stringify(x.board.slots))).size,3);
   assert.equal(new Set(options.map(x=>x.board.slots.bottom)).size,3);
   assert.ok(options.every(x=>x.board.slots.top==='new-top'&&x.board.anchorItemId==='new-top'&&x.missing.length===0));
   const before=options[0].board;
   await page.locator('#styledCollectionResults .styled-outfit').first().getByRole('button',{name:'Swap shoes in option 1'}).click();
   await page.waitForFunction(previous=>styledCollectionResults[0].board.slots.shoes!==previous,before.slots.shoes);
   const swapped=await page.evaluate(()=>JSON.parse(JSON.stringify(styledCollectionResults[0].board)));
   assert.equal(Object.keys(before.slots).filter(k=>before.slots[k]!==swapped.slots[k]).length,1);assert.equal(swapped.anchorItemId,'new-top');
   assert.equal(hash(await page.evaluate(()=>JSON.stringify([...items].sort((a,b)=>a.id.localeCompare(b.id))))),hash(originalA),'swapping may not mutate source records');
   await page.locator('#styledCollectionResults .styled-outfit').first().getByRole('button',{name:'Save outfit'}).click();
   await page.waitForFunction(()=>savedOutfitBoards.length===1);
   await page.reload();await ready();
   const recovered=await page.evaluate(()=>JSON.parse(JSON.stringify(savedOutfitBoards[0])));
   assert.deepEqual(recovered.slots,swapped.slots);assert.equal(recovered.anchorItemId,'new-top');
   // IndexedDB getAll uses primary-key order, not the initial insertion order.
   assert.equal(hash(await page.evaluate(()=>JSON.stringify([...items].sort((a,b)=>a.id.localeCompare(b.id))))),hash(originalA),'reload preserves source bytes independent of record ordering');
   // Actual export/import handlers and real IndexedDB, not an invented restore.
   await page.evaluate(()=>switchView('closet'));await page.locator('.closet-backup summary').click();
   const downloadEvent=page.waitForEvent('download');await page.locator('#export').click();
   const download=await downloadEvent,exportText=await readFile(await download.path(),'utf8');
   const exported=JSON.parse(exportText);assert.equal(exported.ownerId,'synthetic-a');
   await page.evaluate(async image=>{
    const item=items.find(x=>x.id==='new-top');item.color='Red';item.image=image;await writeAll([item]);render();
   },photo('replacement-display-only'));
   await page.locator('#import').setInputFiles({name:'synthetic-issue201.json',mimeType:'application/json',buffer:Buffer.from(exportText)});
   await page.waitForFunction(()=>$('backupStatus').textContent.startsWith('Restored '));
   const restored=await page.evaluate(()=>{
    const board=savedOutfitBoards.find(b=>b.anchorItemId&&b.anchorItemId!=='new-top');
    return {board,item:items.find(x=>x.id===board?.anchorItemId),existing:items.find(x=>x.id==='new-top'),saved:savedOutfitBoards.length};
   });
   assert.ok(restored.board);assert.equal(restored.board.slots.top,restored.item.id);
   assert.equal(restored.item.color,'Blue');assert.equal(restored.existing.color,'Red');
   const expected=wardrobe().items[0];
   for(const field of ['originalPhoto','recognitionPhoto'])assert.equal(restored.item[field].image,expected[field].image);
   assert.equal(restored.item.outfitSourceId,expected.outfitSourceId);
   await page.reload();await ready();
   assert.equal(await page.evaluate(id=>savedOutfitBoards.some(b=>b.anchorItemId===id),restored.item.id),true);
   // Change identity without changing DB: actual UI/account guards must refuse.
   const mismatch=await page.evaluate(async()=>{
    window.closetAuth.user.id='synthetic-b';const refused=styleNewClosetItem('new-top')===false;let error='';
    try{await saveOwnedOutfitBoard({slots:{top:'new-top'}});}catch(e){error=e.message;}
    return {refused,error};
   });
   assert.equal(mismatch.refused,true);assert.match(mismatch.error,/account changed/);
   await page.evaluate(()=>localStorage.setItem('issue201-owner','synthetic-b'));await page.reload();await ready();
   assert.equal(await page.evaluate(()=>items.length+savedOutfitBoards.length),0);
   await seed('synthetic-b');await style();
   assert.notEqual(await page.evaluate(()=>items.find(x=>x.id==='new-top').originalPhoto.image),expected.originalPhoto.image);
   await page.locator('#styledCollectionResults .styled-outfit').first().getByRole('button',{name:'Save outfit'}).click();await page.waitForFunction(()=>savedOutfitBoards.length===1);
   await page.evaluate(()=>localStorage.setItem('issue201-owner','synthetic-a'));await page.reload();await ready();
   assert.equal(await page.evaluate(()=>savedOutfitBoards.length),restored.saved);
   assert.equal(await page.evaluate(id=>items.find(x=>x.id===id)?.originalPhoto.image,restored.item.id),expected.originalPhoto.image);
   // #204: original-only replacement must invalidate an already rendered card.
   await style();const savedCount=await page.evaluate(()=>savedOutfitBoards.length);
   await page.evaluate(async image=>{const item=items.find(x=>x.id==='new-top');item.originalPhoto.image=image;await writeAll([item]);},photo('original-only-replacement'));
   await page.locator('#styledCollectionResults .styled-outfit').first().getByRole('button',{name:'Save outfit'}).click();
   await page.waitForFunction(()=>styledCollectionResults[0].saveMessage?.includes('changed'));
   assert.equal(await page.evaluate(()=>savedOutfitBoards.length),savedCount);
   await style();await page.evaluate(()=>{items.find(x=>x.id==='new-top').originalPhoto.sha256='changed-hash-only';});
   await page.locator('#styledCollectionResults .styled-outfit').first().getByRole('button',{name:'Preview on model'}).click();
   await page.getByText('This outfit changed. Choose the current option again.').first().waitFor();
   assert.equal(await page.locator('#builder').isVisible(),false);
   // Queue a real board save behind a synthetic delayed write, then replace source.
   await style();await page.evaluate(()=>{writes=new Promise(resolve=>{window.issue204Release=resolve;});});
   await page.locator('#styledCollectionResults .styled-outfit').first().getByRole('button',{name:'Save outfit'}).click();
   await page.waitForFunction(()=>styledCollectionResults[0].savePending===true);
   await page.evaluate(()=>{items.find(x=>x.id==='new-top').outfitSourceId='queued-replacement-source';window.issue204Release();});
   await page.waitForFunction(()=>styledCollectionResults[0].savePending===false);
   assert.equal(await page.evaluate(()=>savedOutfitBoards.length),savedCount);
   // Valid original-only fallback remains visible and never overwrites stored image.
   await page.evaluate(async()=>{const item=items.find(x=>x.id==='new-top');item.image='';delete item.recognitionPhoto;await writeAll([item]);render();});
   await style();assert.ok((await page.locator('#styledCollectionResults').innerText()).includes('original photo fallback'));
   assert.equal(await page.evaluate(()=>items.find(x=>x.id==='new-top').image),'');
   const fallback=await page.evaluate(()=>items.find(x=>x.id==='new-top').originalPhoto.image);
   assert.equal(await page.locator('#stylistAnchorPhoto').getAttribute('src'),fallback);
   // No original or crop: metadata is retained, but no outfits may be fabricated.
   await page.evaluate(async()=>{const item=items.find(x=>x.id==='new-top');delete item.originalPhoto;await writeAll([item]);render();switchView('closet');});
   await page.locator('#closetAllPieces').click();await page.locator('#closetGrid article[data-item-id="new-top"]').getByRole('button',{name:'Style this'}).click();
   assert.equal(await page.evaluate(()=>styledCollectionResults.length),0);
   assert.match(await page.locator('#stylistStatus').innerText(),/readable local photo/);
   assert.equal(await page.evaluate(()=>items.find(x=>x.id==='new-top').color),'Red');
   // Plausible PNG headers without IDAT pixels: decoders must reject it.
   // Truncated JPEGs are unsuitable negatives because Chromium can repair them.
   const png=Buffer.alloc(45);Buffer.from([137,80,78,71,13,10,26,10]).copy(png);
   png.writeUInt32BE(13,8);png.write('IHDR',12);png.writeUInt32BE(2,16);png.writeUInt32BE(2,20);png[24]=8;png[25]=2;png.write('IEND',37);
   const corrupt='data:image/png;base64,'+png.toString('base64');
   await page.evaluate(async image=>{const item=items.find(x=>x.id==='new-top');item.image=image;await writeAll([item]);render();},corrupt);
   await page.locator('#closetGrid article[data-item-id="new-top"]').getByRole('button',{name:'Style this'}).click();
   await page.waitForFunction(()=>!$('createCollectionOutfits').disabled);
   assert.equal(await page.evaluate(()=>styledCollectionResults.length),0);
   assert.match(await page.locator('#stylistStatus').innerText(),/readable local photo/);

   assert.equal(forbiddenWrites,0);assert.deepEqual(pageErrors,[]);
   results.push({engine:name,threeDistinctCoreOutfits:true,pinAndOnePieceSwap:true,sourceHash:hash(expected.originalPhoto.image),saveReload:true,realIndexedDB:true,actualFileConflictRestore:true,sameIdAccountIsolation:true,originalReplacementDenied:true,hashChangePreviewDenied:true,queuedSourceChangeDenied:true,originalOnlyFallback:true,noPhotoKeptButNotRecommended:true,corruptPixelDecodeDenied:true,externalRequestsAllowed:0,externalGETsBlocked:blockedExternal,forbiddenWrites,physicalPhone:false,realisticRenderingEvaluated:false});
   await context.close();
  }finally{await browser.close();}
 }
 await mkdir('artifacts/issue201',{recursive:true});await writeFile('artifacts/issue201/browser-results.json',JSON.stringify(results,null,2)+'\n');
 console.log('ISSUE201_SYNTHETIC_BROWSERS '+JSON.stringify(results));
}finally{await new Promise(ok=>server.close(ok));}
