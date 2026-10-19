// End-to-end original PHOTO through the ACTUAL built Closet Current Add Clothes
// UI. FashionCLIP worker is not mocked. Auth is a synthetic local test owner.
// Public licensed JPEGs only. Browser model assets can download via GET;
// reject external image uploads, paid AI, fake garment ground-truth claims.
// This is desktop Chromium phone emulation, NOT physical Android hardware.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname,join} from 'node:path';
import assert from 'node:assert/strict';
const output=resolve(process.argv[2]||'test-results/pilot-real-original-import');
const root=resolve('dist'),types={'.html':'text/html','.js':'text/javascript',
 '.mjs':'text/javascript','.css':'text/css','.json':'application/json',
 '.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png',
 '.wasm':'application/wasm'};
const fixtures=[{id:'commons-0001',category:'Tops',name:'original-shirt.jpg'},
 {id:'commons-0090',category:'Uncategorized',name:'original-negative.jpg'}];
const locks=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
for(const f of fixtures){
 const locked=locks.find(x=>x.id===f.id);
 f.bytes=await readFile('benchmark/photos/'+f.id+'.jpg');
 assert.ok(locked?.verified&&locked.attribution?.license);
 assert.equal(createHash('sha256').update(f.bytes).digest('hex'),locked.sha256,
  'Do not test an altered or generatively retouched reference JPEG');
}
await mkdir(output,{recursive:true});
const srv=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+'/'))throw Error('Invalid path');
  const body=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});
  res.end(body);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>srv.listen(0,'127.0.0.1',done));
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:390,height:844},
  isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const errors=[],writes=[];
 await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
  "window.closetAuth={user:{id:'synthetic-real-image-pilot'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
 await context.route('https://raw.githubusercontent.com/**',route=>route.abort('internetdisconnected'));
 await context.route('**/*',route=>{
  const u=route.request().url(),method=route.request().method();
  if(!u.startsWith('http://127.0.0.1:')&&
     !u.startsWith('blob:')&&!u.startsWith('data:')&&
     method!=='GET'&&method!=='HEAD'){
   writes.push(method);return route.abort('blockedbyclient');
  }
  // Continue through the older synthetic-login and trend-network guards.
  // route.continue() would skip those handlers and contact real auth.
  return route.fallback();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+srv.address().port+'/');
 await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
 await page.locator('.tab[data-view="scan"]').click();
 await page.locator('#clothingPhotos').setInputFiles(fixtures.map(f=>({
  name:f.name,mimeType:'image/jpeg',buffer:f.bytes
 })));
 await page.waitForFunction(()=>window.__lastPhotoImportResult?.added===2,null,{timeout:25000});
 await page.waitForFunction(()=>!automaticRunning&&localPending.size===0&&!busy,null,{timeout:420000});
 const captured=await page.evaluate(()=>{
  const select=x=>({
   sourceName:x.importFilename||null,
   category:x.category,itemType:x.itemType,color:x.color||null,
   indexingLevel:x.indexingLevel||null,
   localAnalyzed:!!x.localAnalyzed,scanFailed:!!x.scanFailed,
   reviewNeeded:!!x.requiresOwnershipConfirmation||!!x.possibleDuplicate||
    x.category==='Uncategorized'||!!x.scanFailed,
   sourcePreserved:typeof x.image==='string'&&x.image.startsWith('data:image/jpeg;')&&
    (x.originalPhoto==null||x.originalPhoto.image===x.image),
   hasRecognitionOriginal:typeof recognitionSourcePhoto(x)==='string'&&
    recognitionSourcePhoto(x).startsWith('data:image/jpeg;'),
   // Private filenames are used for assertion only; never exported.
   originalBytesSaved:!!x.image
  });
  return {saved:items.filter(x=>x.importFilename?.startsWith('original-')).map(select),
   review:batch.filter(x=>x.importFilename?.startsWith('original-')).map(select),
   importResult:{added:__lastPhotoImportResult.added,
     errors:__lastPhotoImportResult.errors?.length||0},
   openedReview:document.getElementById('review').hidden===false};
 });
 assert.equal(captured.importResult.added,2);
 assert.equal(captured.importResult.errors,0);
 const photos=[...captured.saved,...captured.review];
 assert.equal(photos.length,2,'Both original licensed sources must remain auditable in app');
 assert.ok(photos.every(x=>x.sourcePreserved&&x.hasRecognitionOriginal),
  'Photo detection and indexing must preserve source RGB prior to clipping');
 const negative=photos.find(x=>x.sourceName==='original-negative.jpg'),
  shirt=photos.find(x=>x.sourceName==='original-shirt.jpg');
 assert.ok(negative&&shirt,'Keep the original-source IDs through Add Clothes');
 assert.equal(captured.saved.some(x=>x.sourceName==='original-negative.jpg'),false,
  'A nonclothing reference must not be auto-saved to a user closet');
 assert.equal(captured.saved.some(x=>x.sourceName==='original-shirt.jpg'&&x.category!=='Tops'),false,
  'Wrong broad garment category may not be trusted as an automatic save');
 if(shirt.category==='Tops')assert.ok(['T-shirt','Unknown'].includes(shirt.itemType),
  'Specific type can be correct or withheld for human review, never silently invented');
 // Validate local photo original is still saved in current IndexedDB after
 // a real model result; no fake completed garment is inserted by this test.
 const before=await page.evaluate(()=>[...items,...batch]
  .filter(x=>x.importFilename?.startsWith('original-'))
  .map(x=>({id:x.id,sourceName:x.importFilename,image:x.image,
   original:x.originalPhoto?.image||null,recognition:recognitionSourcePhoto(x)})));
 await page.reload();
 await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
 const after=await page.evaluate(()=>[...items,...batch]
  .filter(x=>x.importFilename?.startsWith('original-'))
  .map(x=>({id:x.id,sourceName:x.importFilename,image:x.image,
   original:x.originalPhoto?.image||null,recognition:recognitionSourcePhoto(x)})));
 assert.equal(after.length,before.length,'All saved/review photos must be restored');
 for(const x of before){
  const y=after.find(z=>z.id===x.id);
  assert.ok(y,'Photo id lost on reload');
  assert.equal(y.image,x.image);
  assert.equal(y.original,x.original);
  assert.equal(y.recognition,x.recognition);
 }
 assert.deepEqual(errors,[]);
 assert.deepEqual(writes,[],'No private image upload or billable AI request');
 const summary={
  status:'completed',client:'built-closet-current-real-model',
  originalsVerifiedBySha256:2,originalsPreservedThroughReload:after.length,
  appUIImportSucceeded:true,actualWorkerClassificationInvoked:true,
  garmentCategory:shirt.category,garmentSubtype:shirt.itemType,
  garmentSavedAutomatically:captured.saved.some(x=>x.sourceName==='original-shirt.jpg'),
  negativeAutoSaved:false,unfinishedGarmentRemainsReviewable:captured.review.some(x=>x.sourceName==='original-shirt.jpg'),
  realWorldGarmentAccuracy:null,actualPhysicalPhoneTested:false,
  liveCameraTested:false,hostedLoginTested:false,
  realTwoGarmentAIProviderCalls:0,paidCalls:0,externalWriteRequests:0,
  privateOriginalPhotosInReport:false,clientErrors:0
 };
 await writeFile(join(output,'summary.json'),JSON.stringify(summary,null,2));
 console.log('PILOT_REAL_ORIGINAL_APP_IMPORT '+JSON.stringify(summary));
 await context.close();
}finally{await browser?.close();await new Promise(done=>srv.close(done));}
