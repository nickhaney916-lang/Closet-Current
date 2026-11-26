/**
 * STYLE-NEW-ITEM-01 — actual app UI + owner-private IndexedDB in Chromium and
 * WebKit. Auth is a synthetic fixture; no cloud writes, AI inference or device
 * camera is claimed. A JPEG file enters the normal gallery import and review path.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {createHash} from 'node:crypto';

const importMatrix=process.env.ASSIGNMENT_29==='1';
const root=resolve('.'),out=importMatrix?'benchmark/assignment-29':'benchmark/native-canonical-closet-style-167';
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
const captureSource=sharp(Buffer.from('<svg width="240" height="320" xmlns="http://www.w3.org/2000/svg"><rect width="240" height="320" fill="#f1eee7"/><path d="M74 38 42 58 18 126l37 14 15-34v174h100V106l15 34 37-14-24-68-32-20-26 18H100z" fill="#287346"/><path d="M115 55h10v224h-10z" fill="#e7eadf"/></svg>'));
const capturePhoto=await (importMatrix?captureSource.withMetadata({orientation:6}):captureSource).jpeg({quality:90}).toBuffer();
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
const importCases=[];
const heic=importMatrix?await readFile('tests/fixtures/assignment-29-synthetic.heic'):null;
async function rejectThenRecover(page,engine,width){
 const file=(name,mimeType,buffer)=>({name,mimeType,buffer});
 const source=sharp({create:{width:24,height:32,channels:4,background:'#34825580'}});
 const oversized=Buffer.from(capturePhoto);
 const frame=oversized.indexOf(Buffer.from([255,192]));
 assert.ok(frame>0);
 oversized.writeUInt16BE(12000,frame+5);
 oversized.writeUInt16BE(12000,frame+7);
 const brokenDecode=Buffer.from(capturePhoto);
 brokenDecode[frame+4]=16; // A baseline JPEG cannot use this sample precision.
 const unsupported=[
  file('alpha.png','image/png',await source.clone().png().toBuffer()),
  file('photo.webp','image/webp',await source.clone().webp().toBuffer()),
  file('synthetic.heic','image/heic',heic),
  file('drawing.svg','image/svg+xml',Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')),
  file('empty.jpg','image/jpeg',Buffer.alloc(0)),
  file('truncated.jpg','image/jpeg',capturePhoto.subarray(0,-2)),
  file('corrupt-header.jpg','image/jpeg',Buffer.from('ffd8ffe000004a4649460000ffd9','hex')),
  file('oversized.jpg','image/jpeg',oversized),
  file('mismatched.png','image/png',capturePhoto),
  file('wrong-extension.webp','image/jpeg',capturePhoto),
  file('corrupt-scan.jpg','image/jpeg',brokenDecode)
 ];
 const input=page.locator('#clothingPhotos');
 await input.dispatchEvent('cancel');
 assert.equal(await page.evaluate(async()=> (await readDraft()).length),0);
 await input.setInputFiles(unsupported[4]);
 await page.waitForFunction(()=>window.__lastPhotoImportResult?.results[0]?.name==='empty.jpg');
 assert.equal(await page.evaluate(async()=> (await readDraft()).length),0);
 const browserDecoding={};
 for(const fixture of unsupported.slice(0,3)){
  browserDecoding[fixture.mimeType]=await page.evaluate(async url=>{
   const image=new Image();image.src=url;
   try{await image.decode();return true;}catch{return false;}
  },'data:'+fixture.mimeType+';base64,'+fixture.buffer.toString('base64'));
 }
 assert.equal(browserDecoding['image/png'],true);
 assert.equal(browserDecoding['image/webp'],true);
 const start=performance.now();
 await input.setInputFiles([...unsupported,file('new-reviewed-blouse.jpg','image/jpeg',capturePhoto)]);
 await page.waitForFunction(count=>window.__lastPhotoImportResult?.results.length===count,unsupported.length+1);
 const evidence=await page.evaluate(async()=>{
  const row=batch[0];
  const image=new Image();image.src=row.image;await image.decode();
  return {results:window.__lastPhotoImportResult,drafts:(await readDraft()).map(x=>x.id),
   saved:(await readAll()).length,review:!document.getElementById('review').hidden,
   photoWidth:image.naturalWidth,photoHeight:image.naturalHeight,photo:row.originalPhoto.sha256,
   orientation:row.originalPhoto.orientation,raw:row.originalPhoto.originalFileSha256};
 });
 assert.equal(evidence.results.added,1);
 assert.equal(evidence.results.errors.length,unsupported.length);
 assert.equal(evidence.saved,fixtures.length);
 assert.equal(evidence.drafts.length,1);
 assert.equal(evidence.review,true);
 assert.deepEqual([evidence.photoWidth,evidence.photoHeight,evidence.orientation],[320,240,6]);
 assert.equal(evidence.photo,createHash('sha256').update(capturePhoto).digest('hex'));
 assert.equal(evidence.raw,evidence.photo);
 assert.match(evidence.results.errors[7],/dimensions.*40 megapixel/);
 assert.match(evidence.results.errors[0],/export a JPEG/);
 assert.match(evidence.results.errors[9],/contradicts/);
 assert.match(evidence.results.errors[10],/browser could not open|dimensions could not be verified/);
 await input.setInputFiles(file('retry.jpg','application/octet-stream',capturePhoto));
 await page.waitForFunction(()=>window.__lastPhotoImportResult?.results[0]?.name==='retry.jpg');
 const retry=await page.evaluate(async()=>({result:window.__lastPhotoImportResult,drafts:(await readDraft()).length}));
 assert.equal(retry.result.results[0].status,'duplicate');
 assert.equal(retry.drafts,1);
 importCases.push({engine,width,elapsedMs:Math.round(performance.now()-start),browserDecoding,...evidence,retry});
 console.log('A29 import matrix',JSON.stringify(importCases.at(-1)));
}
const results=[],errors=[];
const provenance167=[];
try{
 const engines=process.env.STYLE_FOCUSED_ENGINE==='chromium'?[['chromium',chromium]]:[['chromium',chromium],['webkit',webkit]];
 for(const [engine,type] of engines){
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  try{
   for(const width of [320,390,430]){
    let sessionOwner=owner;
    const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url());
     // Native File/Blob image decoding stays browser-local; these are not
     // external requests and must not be blocked by test-only HTTPS isolation.
     if(url.protocol==='blob:'||url.protocol==='data:')return route.continue();
     if(url.hostname==='127.0.0.1'||url.hostname==='localhost')return route.continue();
     if(url.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&url.pathname==='/auth/v1/token')
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_in:3600,user:{id:sessionOwner,email:'fixture@example.invalid',user_metadata:{username:'Fixture'}}})});
     return route.abort();
    });
    await context.addInitScript(()=>{
     if(!localStorage.getItem('closet-current-auth-v1'))localStorage.setItem('closet-current-auth-v1',JSON.stringify({
     epoch:'synthetic-epoch',access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600
     }));
    });
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
     // Use the ACTUAL native Add clothing photos file input (not direct
     // candidate() injection) on a normal, flag-free app URL.
     if(importMatrix)await rejectThenRecover(page,engine,width);
     else await page.locator('#clothingPhotos').setInputFiles({
       name:'new-reviewed-blouse.jpg',mimeType:'image/jpeg',buffer:capturePhoto
     });
     try{await page.waitForFunction(()=>batch.some(x=>x.importFilename==='new-reviewed-blouse.jpg'),null,{timeout:20000});}
     catch(error){
       const sourceDiagnostic=await page.evaluate(async original=>{
         try{
           const bytes=new Uint8Array(await(await fetch(original)).arrayBuffer());
           const file=new File([bytes],'probe-new-reviewed-blouse.jpg',{type:'image/jpeg'});
           const mod=await import('/public/native-canonical-photo-source-167.mjs');
           const sniffed=mod.sniffPhotoMime(bytes);
           const direct=await mod.importCanonicalPhoto(file);
           return {directOriginalImported:true,sniffed,originalSHA:direct.sourceSHA256,
             size:file.size,dimensions:[direct.originalPhoto.width,direct.originalPhoto.height]};
         }catch(e){return {directOriginalImported:false,message:String(e?.message||e),
           name:e?.name,stack:String(e?.stack||'').slice(0,1200)};}
       },cameraFrame);
       const state=await page.evaluate(()=>({importResult:window.__lastPhotoImportResult,
      message:document.getElementById('message')?.textContent,authOwner:window.closetAuth?.user?.id,
      dbName:db?.name,batch:batch.map(x=>({id:x.id,name:x.name,status:x.localStatus,scanFailed:x.scanFailed})),
      recognitionPhase:recognitionState.phase}));throw Error(String(error)+'; independent original JPEG diagnostic='+JSON.stringify(sourceDiagnostic)+'; import diagnostics='+JSON.stringify(state));}
     await page.evaluate(()=>switchView('review'));
     await page.locator('#reviewGrid article.photo-result').getByRole('button',{name:'Adjust',exact:true}).click();
     await page.waitForFunction(()=>document.querySelector('dialog.photo-adjust[open]')!==null);
     await page.locator('dialog.photo-adjust input[aria-label="Item name"]').fill('New reviewed blouse');
     await page.locator('dialog.photo-adjust select[aria-label="Main category"]').selectOption('Tops');
     await page.locator('dialog.photo-adjust select[aria-label="Item type"]').selectOption('Blouse');
     await page.locator('dialog.photo-adjust input[aria-label="Color"]').fill('Green');
     await page.locator('dialog.photo-adjust input[aria-label="I verified the category, clothing type and color"]').check();
     await page.locator('dialog.photo-adjust input[aria-label="I confirmed this photo shows one garment"]').check();
     await page.locator('dialog.photo-adjust form').evaluate(form=>form.requestSubmit());
     await page.waitForFunction(()=>items.some(x=>x.name==='New reviewed blouse'&&x.itemType==='Blouse')&&!document.querySelector('dialog.photo-adjust[open]'),null,{timeout:20000});
     const focusedId=await page.evaluate(()=>items.find(x=>x.name==='New reviewed blouse'&&x.itemType==='Blouse')?.id);
     assert.ok(focusedId);
     const source167=await page.evaluate(async id=>{
       const saved=(await readAll()).find(x=>x.id===id);
       const bytes=saved?.originalPhoto?.image?
         new Uint8Array(await(await fetch(saved.originalPhoto.image)).arrayBuffer()):null;
       const digest=bytes?[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))]
         .map(x=>x.toString(16).padStart(2,'0')).join(''):null;
       return {id:saved?.id,ownerId:saved?.ownerId,dbName:db?.name,
         savedSourceSHA:saved?.sourceSHA256,actualSourceSHA:digest,
         originalImageMatchesSaved:saved?.originalPhoto?.image===saved?.image,
         sourcePhotoOriginal:saved?.sourcePhotoOriginal,sourceHashVerified:saved?.sourceHashVerified,
         ownerReviewed:saved?.ownerReviewed,humanReviewedSource:saved?.humanReviewedSource,
         confirmedCategory:saved?.confirmedCategory,confirmedColor:saved?.confirmedColor,
         singleGarmentVerified:saved?.singleGarmentVerified,
         userAdjusted:saved?.userAdjusted,reviewProvenance:saved?.reviewProvenance,
         originalPhotoFromFile:saved?.originalPhoto?.origin,
         ordinaryAppURL:!location.search,standaloneAppBuildModulesReady:
           !!document.querySelector('#styledCollectionResults')};
     },focusedId);
     assert.equal(source167.id,focusedId);
     assert.equal(source167.ownerId,owner);
     assert.equal(source167.dbName,'closet-current-user-'+owner);
     assert.equal(source167.savedSourceSHA,createHash('sha256').update(capturePhoto).digest('hex'));
     assert.equal(source167.actualSourceSHA,source167.savedSourceSHA);
     assert.equal(source167.originalImageMatchesSaved,true);
     assert.equal(source167.originalPhotoFromFile,'import');
     assert.equal(source167.ordinaryAppURL,true);
     for(const f of ['sourcePhotoOriginal','sourceHashVerified','ownerReviewed','humanReviewedSource',
       'confirmedCategory','confirmedColor','singleGarmentVerified','userAdjusted'])
       assert.equal(source167[f],true,'persisted original owner-reviewed requirement: '+f);
     assert.equal(source167.reviewProvenance,'explicit-owner-claim-not-independent-review-evidence');
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
     await page.waitForFunction(()=>document.querySelectorAll(
       '#styledCollectionResults button[data-style-photo-preview-165]').length===3,null,{timeout:15000});
     await page.locator('#styledCollectionResults .styled-outfit').first()
       .locator('button[data-style-photo-preview-165]').click();
     await page.waitForFunction(()=>!!document.querySelector(
       '#styledCollectionResults .style-original-photo-preview-165 img'),null,{timeout:15000});
     const preview167=await page.evaluate(async()=>{
       const wrap=document.querySelector('#styledCollectionResults .style-original-photo-preview-165');
       const img=wrap?.querySelector('img');
       const bytes=img?.src?new Uint8Array(await(await fetch(img.src)).arrayBuffer()):null;
       const hash=bytes?[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))]
         .map(x=>x.toString(16).padStart(2,'0')).join(''):null;
       return {mode:wrap?.dataset.garmentPreviewMode,sha:hash,
         imageVisible:!!img?.complete&&img?.naturalWidth>0,
         disclosure:wrap?.querySelector('[data-three-d-fitted]')?.textContent,
         no3D:wrap?.querySelector('[data-three-d-fitted]')?.dataset.threeDFitted==='false',
         alt:img?.alt,sourceSavedRow:styledCollectionResults[0].focusItemId,
         noHorizontalOverflow:document.documentElement.scrollWidth<=innerWidth+1};
     });
     assert.equal(preview167.mode,'verified-original-photo-2d');
     assert.equal(preview167.sha,source167.savedSourceSHA);
     assert.equal(preview167.imageVisible,true);
     assert.equal(preview167.no3D,true);
     assert.equal(preview167.sourceSavedRow,focusedId);
     assert.equal(preview167.noHorizontalOverflow,true);
     assert.match(preview167.disclosure,/3D fitting is not yet verified/);
     await page.screenshot({path:out+'/'+engine+'-'+width+'-native-verified-original-2d.png',fullPage:true});
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
     provenance167.push({engine,width,owner,sha:source167.savedSourceSHA,mode:preview167.mode,photoVerified:true,realNativeUpload:true,humanReviewed:true,threeOutfits:true,oneShoeSwap:true,no3DFittingClaim:true});
     await page.screenshot({path:`${out}/${engine}-${width}-saved-three-owned-looks.png`,fullPage:true});
     await page.reload({waitUntil:'domcontentloaded'});
     await page.evaluate(async()=>{await window.closetAuth.ready;await closetReady;await outfitBoardReady;});
     const reopened=await page.evaluate(async()=>({
      owner:window.closetAuth.user.id,items:(await readAll()).map(x=>x.id),boards:savedOutfitBoards
     }));
     assert.equal(reopened.owner,owner);assert.equal(reopened.items.length,fixtures.length+1);
     assert.equal(reopened.boards.length,2);assert.ok(Object.values(reopened.boards[0].slots).includes(focusedId));
     assert.equal(reopened.boards[1].slots.top,focusedId);assert.equal(reopened.boards[1].slots.shoes,swap.alternatives[0].id);
     if(importMatrix){
      sessionOwner='synthetic-style-owner-b';
      await page.reload({waitUntil:'domcontentloaded'});
      const other=await page.evaluate(async()=>{
       await window.closetAuth.ready;await closetReady;await outfitBoardReady;
       return {owner:window.closetAuth.user.id,items:(await readAll()).length,
        drafts:(await readDraft()).length,boards:savedOutfitBoards.length};
      });
      assert.deepEqual(other,{owner:sessionOwner,items:0,drafts:0,boards:0});
      Object.assign(importCases.at(-1),{
       ownerIsolation:other,savedOnceAfterReload:true,verifiedOriginal2D:true
      });
     }
     results.push({engine,width,threeFocusedOwnedLooks:true,uniqueLookCount:3,saveAndReload:true,
      ownerScopedIndexedDB:true,offHostCallsBlocked:true,syntheticAuth:true,syntheticGarments:true,
      fileImport:true,
      manualCorrection:true,oneOwnedPieceSwap:true,saveAndReloadAfterSwap:true,physicalPhone:false,overflow:generated.overflow,labels:generated.cards.map(x=>x.labels)});
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 assert.equal(errors.length,0,errors.join('; '));
 const report={verdict:'PASS',feature:'Style around a newly reviewed and saved owned item',engines:engines.map(x=>x[0]),cases:results,
  screenshots:results.length,offHostCalls:0,syntheticAuth:true,syntheticGarments:true,
  realFilePickerImport:true,freshAIInference:false,
  physicalAndroid:false,physicalIPhone:false,cloudWrites:false,familyAlpha:'HOLD'};
 if(importMatrix)await writeFile(out+'/photo-import-matrix.json',JSON.stringify(importCases,null,2));
 await writeFile(out+'/results.json',JSON.stringify(report,null,2));
if(provenance167.length!==6||provenance167.some(x=>x.mode!=='verified-original-photo-2d'||!x.realNativeUpload))
 throw Error('P167 source verified ordinary app owner-styling browser evidence incomplete');
await writeFile(out+'/canonical-original-acceptance.json',JSON.stringify({
 priority:167,verdict:'PASS',cases:provenance167,
 sameOriginalSHAInAllSix:new Set(provenance167.map(x=>x.sha)).size===1,
 realFilePickerImport:true,normalFlagFreeAppURL:true,ownerHumanReviewed:true,
 nativePrivateAtomicSave:true,threeOwnedOutfits:true,shoeSwapTwoBoardsAfterReload:true,
 userFacingVerifiedOriginal2D:true,arbitraryGarment3DFitted:false,
 syntheticAuth:true,realPhysicalPhoneCamera:false,hostedCloudRLS:false,
 productionOrExistingStagingModified:false,familyAlpha:'HOLD',releaseAuthorized:false
},null,2));
console.log('P167_NATIVE_FLAG_FREE_REAL_BROWSER_OWNER_ORIGINAL_SHA_PASS '+JSON.stringify({
cases:6,engines:['chromium','webkit'],widths:[320,390,430],nativeVerified2D:true,familyAlpha:'HOLD'}));

 console.log('STYLE-NEW-ITEM-01 browser acceptance PASS',JSON.stringify({engines:engines.map(x=>x[0]),cases:results.length,screenshots:results.length}));
}catch(error){
 await writeFile(out+'/failure.json',JSON.stringify({error:String(error),cases:results},null,2));throw error;
}finally{await new Promise(resolve=>server.close(resolve));}
