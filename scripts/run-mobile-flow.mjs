import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),out=resolve(process.argv[2]||'benchmark/mobile-flow');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.bin':'application/octet-stream','.css':'text/css'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+'/'))throw Error('Forbidden');res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(await readFile(file));}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const errors=[];
try{
 await mkdir(out,{recursive:true});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--use-file-for-fake-video-capture='+resolve('benchmark/mobile-camera.y4m') ]});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,permissions:['camera'],serviceWorkers:'block'});
 // Use a test identity only. No production login, credentials or auth messages.
 await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:"window.closetAuth={user:{id:'mobile-flow-test'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.evaluate(()=>closetReady);
 // Exercise the actual shared crop/mask dialog on a touch-size browser viewport.
 await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=240;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#dc1e1e';ctx.fillRect(0,0,240,240);
  window.maskInteractionSaved=null;
  await window.openPhotoCrop({image:canvas.toDataURL('image/jpeg',.95)},{
   analyze:async()=>null,save:async(photo)=>{window.maskInteractionSaved=photo;}
  });
 });
 const maskDialog=page.locator('dialog.photo-crop-editor');
 await maskDialog.getByRole('button',{name:'Erase background'}).click();
 const frame=maskDialog.locator('.crop-frame'),rect=await frame.boundingBox();
 assert.ok(rect&&rect.width>0&&rect.height>0,'Mask editor must display a usable touch surface');
 await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
 await page.mouse.down();await page.mouse.move(rect.x+rect.width*.6,rect.y+rect.height/2,{steps:6});await page.mouse.up();
 await maskDialog.getByRole('button',{name:'Save crop'}).click();
 await maskDialog.waitFor({state:'detached'});
 const masked=await page.evaluate(async()=>{
  const saved=window.maskInteractionSaved;
  const image=new Image();image.src=saved.image;await image.decode();
  const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
  const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
  return {center:[...ctx.getImageData(120,120,1,1).data],corner:[...ctx.getImageData(5,5,1,1).data],original:saved.originalPhoto?.image};
 });
 assert.ok(masked.center[0]>240&&masked.center[1]>230&&masked.center[2]>230,'Erase brush must remove red fabric from center');
 assert.ok(masked.corner[0]>150&&masked.corner[1]<90,'Unpainted pixels must remain red');
 assert.ok(masked.original?.startsWith('data:image/jpeg;base64,'),'Original photo must survive mask edits');
 await page.locator('.tab[data-view="scan"]').click();await page.locator('#start').click();
 await page.waitForFunction(()=>document.querySelector('#video').readyState>=2&&document.querySelector('#video').videoWidth>0);
 const camera=await page.locator('#video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight}));
 assert.deepEqual(camera,{width:1920,height:1080});
 await page.locator('#takePhoto').click();await page.locator('#scanResults .photo-result').waitFor();
 const image=await page.locator('#scanResults .photo-result img').evaluate(async img=>{await img.decode();return {width:img.naturalWidth,height:img.naturalHeight};});assert.deepEqual(image,camera);
 await page.locator('#scanResults .photo-result button').filter({hasText:'Adjust'}).click();
 const dialog=page.locator('dialog.photo-adjust');await dialog.getByLabel('Item name',{exact:true}).fill('Phone test blue top');
 await dialog.locator('label').filter({hasText:/^Main category/}).locator('select').selectOption('Tops');await dialog.locator('label').filter({hasText:/^Item type/}).locator('select').selectOption('T-shirt');await dialog.getByLabel('Color',{exact:true}).fill('Blue');await dialog.getByLabel('Summer',{exact:true}).check();
 await dialog.getByRole('button',{name:'Save changes',exact:true}).click();await dialog.waitFor({state:'detached'});
 await page.waitForFunction(()=>localPending.size===0&&!automaticRunning,null,{timeout:300000});
 assert.equal(await page.evaluate(()=>localReady&&!recognitionUnavailable),true,'Actual recognition worker must finish successfully.');
 await page.locator('.tab[data-view="closet"]').click();await page.locator('#search').fill('Phone test');await page.locator('.closet-refine').evaluate(el=>el.open=true);await page.locator('#filter').selectOption('Tops');await page.locator('#seasonFilter').selectOption('Summer');assert.equal(await page.locator('#closetGrid article').count(),1);
 await page.reload();await page.evaluate(()=>closetReady);await page.locator('.tab[data-view="closet"]').click();await page.locator('#search').fill('Phone test');assert.equal(await page.locator('#closetGrid article').count(),1);
 const saved=await page.evaluate(()=>items.find(x=>x.name==='Phone test blue top'));assert.equal(saved.category,'Tops');assert.equal(saved.itemType,'T-shirt');assert.equal(saved.userAdjusted,true);assert.equal(saved.color,'Blue');assert.deepEqual(saved.seasons,['Summer']);
 // Exercise the production crop button and production save callback, not a test-only callback.
 await page.evaluate(async()=>{
  const item=items.find(x=>x.name==='Phone test blue top');
  const crop=document.createElement('canvas');crop.width=240;crop.height=240;
  const ctx=crop.getContext('2d');ctx.fillStyle='#e11e1e';ctx.fillRect(0,0,240,240);
  const value={...item,image:crop.toDataURL('image/jpeg',.95),originalPhoto:null,cropBounds:null,color:'',colorSource:'photo-estimate'};
  await writeAll([value]);Object.assign(item,value);render();
 });
 await page.locator('.tab[data-view="closet"]').click();
 await page.locator('#search').fill('Phone test');
 await page.locator('#closetGrid article button').filter({hasText:'Crop photo'}).click();
 const persistenceDialog=page.locator('dialog.photo-crop-editor');
 await persistenceDialog.getByRole('button',{name:'Erase background'}).click();
 const persistenceFrame=await persistenceDialog.locator('.crop-frame').boundingBox();
 await page.mouse.click(persistenceFrame.x+persistenceFrame.width/2,persistenceFrame.y+persistenceFrame.height/2);
 await persistenceDialog.getByRole('button',{name:'Save crop'}).click();
 await persistenceDialog.waitFor({state:'detached'});
 await page.reload();await page.evaluate(()=>closetReady);
 const persistedMask=await page.evaluate(()=>{
  const item=items.find(x=>x.name==='Phone test blue top');
  return {image:item.image,original:item.originalPhoto?.image,color:item.color,method:item.colorMethod,category:item.category,type:item.itemType};
 });
 assert.ok(persistedMask.image?.startsWith('data:image/jpeg;base64,'),'Edited garment image must persist');
 assert.ok(persistedMask.original?.startsWith('data:image/jpeg;base64,'),'Original image must persist after reload');
 assert.equal(persistedMask.category,'Tops');assert.equal(persistedMask.type,'T-shirt');
 assert.equal(persistedMask.color,'Red');assert.equal(persistedMask.method,'garment-mask');
 await page.locator('.tab[data-view="scan"]').click();await page.locator('summary').filter({hasText:'Add saved photos or a video'}).click();await page.locator('#clothingPhotos').setInputFiles(resolve('benchmark/photos/commons-0002.jpg'));
 await page.waitForFunction(()=>items.length===2&&localPending.size===0,null,{timeout:300000});
 const automatic=await page.evaluate(()=>items.find(x=>x.name!=='Phone test blue top'));assert.equal(automatic.category,'Tops');assert.equal(automatic.itemType,'T-shirt');assert.notEqual(automatic.userAdjusted,true);
 await page.locator('.tab[data-view="closet"]').click();await page.locator('#search').fill('');await page.locator('#closetAllPieces').click();assert.equal(await page.locator('#closetGrid article').count(),2);
 // Real-photo batch: import licensed, independently sourced garment photographs.
 const realCases=[
  ['commons-0003','Tops'],['commons-0021','Bottoms'],['commons-0024','Bottoms'],
  ['commons-0033','Bottoms'],['commons-0035','Bottoms'],['commons-0045','Bottoms'],
  ['commons-0049','Dresses'],['commons-0053','Dresses'],
  ['commons-0060','Outerwear'],['commons-0065','Outerwear'],['commons-0070','Outerwear'],
  ['commons-0079','Shoes'],['commons-0083','Shoes'],['commons-0094','Shoes']
 ];
 // Account for every submitted photograph even when quality checks skip an item.
 const initialIds=await page.evaluate(()=>items.map(x=>x.id));
 await page.locator('#clothingPhotos').setInputFiles(realCases.map(([id])=>resolve('benchmark/photos/'+id+'.jpg')));
 await page.waitForFunction(()=>!busy&&!!window.__lastPhotoImportResult,null,{timeout:90000});
 try{await page.waitForFunction(()=>!automaticRunning&&localPending.size===0,null,{timeout:90000});}catch(error){console.warn('Recognition did not settle:',error.message);}
 const observed=await page.evaluate(ids=>({
  imports:window.__lastPhotoImportResult,
  newItems:items.filter(x=>!ids.includes(x.id)).map(x=>({filename:x.importFilename||null,category:x.category,itemType:x.itemType,color:x.color||null,needsReview:!!x.needsReview,scanFailed:!!x.scanFailed})),
  pending:batch.map(x=>({filename:x.importFilename||null,category:x.category,itemType:x.itemType,color:x.color||null,needsReview:!!x.needsReview,scanFailed:!!x.scanFailed,localStatus:x.localStatus||null,possibleDuplicate:!!x.possibleDuplicate,segmentHint:x.segmentHint||null,recognitionDiagnostics:x.recognitionDiagnostics||null})),
  busy,localPending:localPending.size,automaticRunning,
  message:document.querySelector('#message')?.textContent||null
 }),initialIds);
 const realResults=realCases.map(([id,expected])=>{
  const filename=id+'.jpg',outcome=observed.imports.results.find(x=>x.name===filename);
  const item=[...observed.newItems,...observed.pending].find(x=>x.filename===filename);
  return {id,expected,importStatus:outcome?.status||'unaccounted',importReason:outcome?.reason||null,...(item||{}),correctCategory:!!item&&item.category===expected};
 });
 const evaluated=realResults.filter(x=>x.category&&!x.scanFailed);
 // Review-only suggestions are measured separately from saved categories:
 // they must never inflate the app's automatic recognition accuracy.
 const reviewSuggestions=realResults.filter(x=>x.recognitionDiagnostics?.outerwearRecovery?.outerwearReviewSuggested).map(x=>({
  id:x.id,expected:x.expected,suggestedCategory:'Outerwear',
  suggestedType:x.recognitionDiagnostics.outerwearRecovery.fullCatalogEvidence?.whole?.top?.[0]?.type||null,
  correct:x.expected==='Outerwear',savedCategory:x.category
 }));
 const report={cases:realResults,submitted:realCases.length,imported:observed.imports.added,evaluated:evaluated.length,categoryAccuracy:evaluated.length?evaluated.filter(x=>x.correctCategory).length/evaluated.length:null,allSubmittedAccuracy:realResults.filter(x=>x.correctCategory).length/realCases.length,uncategorizedCases:realResults.filter(x=>x.category==='Uncategorized').map(x=>({id:x.id,expected:x.expected,diagnostics:x.recognitionDiagnostics||null})),uncategorizedCount:realResults.filter(x=>x.category==='Uncategorized').length,reviewSuggestions,reviewSuggestionCount:reviewSuggestions.length,reviewSuggestionCorrect:reviewSuggestions.filter(x=>x.correct).length,reviewSuggestionIncorrect:reviewSuggestions.filter(x=>!x.correct).length,reviewSuggestionPrecision:reviewSuggestions.length?reviewSuggestions.filter(x=>x.correct).length/reviewSuggestions.length:null,importDiagnostics:observed,pageErrors:errors};
 await writeFile(out+'/real-photo-indexing.json',JSON.stringify(report,null,2));
 console.log('REAL_PHOTO_INDEXING '+JSON.stringify(report));
 console.log('REAL_PHOTO_REVIEW_SUGGESTIONS '+JSON.stringify({count:reviewSuggestions.length,correct:reviewSuggestions.filter(x=>x.correct).length,incorrect:reviewSuggestions.filter(x=>!x.correct)}));
 // A wrong review hint is actionable evidence, even though suggestions never
 // auto-save. Keep the benchmark passing while exposing every false hint.
 if(reviewSuggestions.some(x=>!x.correct))console.warn('REAL_PHOTO_FALSE_REVIEW_SUGGESTION '+JSON.stringify(reviewSuggestions.filter(x=>!x.correct)));
 if(realResults.some(x=>x.importStatus==='added'&&(!x.category||x.category==='Uncategorized')))console.warn('REAL_PHOTO_REVIEW_REQUIRED '+JSON.stringify(realResults.filter(x=>x.importStatus==='added'&&(!x.category||x.category==='Uncategorized'))));
 if(realResults.some(x=>x.importStatus==='unaccounted'))throw Error('Some submitted photos have no import outcome');
 // Guard the verified 12/14 baseline and prevent false automatic labels.
 // Uncategorized is a safe fallback, but a wrong saved category is not.
 const incorrectlyCategorized=realResults.filter(x=>x.category&&x.category!=='Uncategorized'&&x.category!==x.expected);
 assert.deepEqual(incorrectlyCategorized.map(x=>({id:x.id,expected:x.expected,actual:x.category})),[],
  'Recognition must not silently save a wrong category');
 assert.ok(realResults.filter(x=>x.correctCategory).length>=12,
  'Real-photo category accuracy must not regress below the verified 12/14 baseline');
 assert.equal(observed.imports.added,realCases.length,'Every real photo must import');
 // Preserve the known ambiguous skirt/coat outcomes until genuinely
 // independent recognition evidence resolves them. A dress or top must never
 // be silently substituted for the expected garment.
 for(const [id,expected] of [['commons-0045','Bottoms'],['commons-0070','Outerwear']]){
  const sample=realResults.find(x=>x.id===id);
  assert.ok(sample, 'Missing ambiguity regression fixture: '+id);
  assert.ok(sample.category===expected||sample.category==='Uncategorized',
   id+' must not receive a conflicting automatic category');
  if(sample.category===expected)assert.equal(sample.itemType,id==='commons-0045'?'Skirt':'Coat',
   id+' must not be automatically saved with an incorrect garment subtype');
 }
 const verifiedJacket=realResults.find(x=>x.id==='commons-0065');
 assert.equal(verifiedJacket?.category,'Outerwear','Previously recovered jacket must remain recognized');
 assert.equal(verifiedJacket?.itemType,'Jacket','Previously recovered jacket subtype must remain stable');
 // Regression: independent jacket evidence must offer a review-only category
 // action that updates the real editor fields, without saving automatically.
 const jacket=realResults.find(x=>x.id==='commons-0060');
 if(jacket?.recognitionDiagnostics?.outerwearRecovery?.outerwearReviewSuggested){
  const state=await page.evaluate(()=>{
   const item=batch.find(x=>x.importFilename==='commons-0060.jpg');
   assertItem: if(!item)break assertItem;
   adjustPhoto(item);
   return {found:!!item};
  });
  assert.equal(state.found,true,'Jacket should remain available for manual review');
  const dialog=page.locator('dialog.clothing-editor');
  const reviewText=await dialog.locator('.recognition-review-suggestion').innerText();
  assert.match(reviewText,/Two photo checks suggest Outerwear/);
  assert.match(reviewText,/Jacket/,'Both views should agree on the suggested garment type');
  await dialog.getByRole('button',{name:'Use Outerwear category'}).click();
  assert.equal(await dialog.locator('select[aria-label="Main category"]').inputValue(),'Outerwear');
  assert.equal(await dialog.locator('select[aria-label="Item type"]').inputValue(),'Unknown');
  await dialog.getByRole('button',{name:'Cancel'}).click();
  const after=await page.evaluate(()=>batch.find(x=>x.importFilename==='commons-0060.jpg')?.category);
  assert.equal(after,'Uncategorized','Cancel must not silently save the suggested category');
 }
 assert.deepEqual(errors,[]);await page.screenshot({path:out+'/closet.png',fullPage:true});
 const result={viewport:{width:390,height:844},camera,image,manualSave:true,searchAndFilters:true,reloadPersistence:true,automaticPhotoIndexing:true,realRecognitionWorker:true,auth:'test identity stub; production auth not tested',hardware:'Chromium fake camera; physical phone not tested',pageErrors:errors};await writeFile(out+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
