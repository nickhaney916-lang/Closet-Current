import {chromium,webkit,devices} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

// Both are desktop browser *emulations*: they do not establish physical
// Android camera or iPhone performance. No paid provider or private account.
const browserName=process.env.PHONE_BROWSER||'chromium';
if(!['chromium','webkit'].includes(browserName))throw Error('Only Chromium or WebKit browser emulation is supported');
const engine=browserName==='webkit'?webkit:chromium;
const root=resolve('dist'),output=resolve(process.argv[2]||'benchmark/phone-photo-flow/'+browserName);
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.bin':'application/octet-stream'};
const server=createServer(async(req,res)=>{try{
 const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));
 if(!file.startsWith(root+'/'))throw Error('Invalid path');
 res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(await readFile(file));
}catch{if(!res.headersSent)res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 await mkdir(output,{recursive:true});
 const fixtures=[
  {id:'commons-0001',file:'benchmark/photos/commons-0001.jpg'},
  {id:'commons-0090',file:'benchmark/photos/commons-0090.jpg'}
 ];
 const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 for(const fixture of fixtures){
  const bytes=await readFile(fixture.file);
  const source=locked.find(x=>x.id===fixture.id);
  const checksum=createHash('sha256').update(bytes).digest('hex');
  assert.ok(source?.verified&&source.sha256===checksum,
   'Only the unchanged SHA-locked licensed original can enter '+browserName+' model benchmarking');
  fixture.bytes=bytes;
 }
 browser=await engine.launch({headless:true,
  ...(browserName==='chromium'?{args:['--no-sandbox','--enable-unsafe-swiftshader']}: {})});
 const page=await browser.newPage({
  ...(browserName==='webkit'?{
    viewport:devices['iPhone 13'].viewport,deviceScaleFactor:3
  }:{viewport:{width:390,height:844},deviceScaleFactor:2}),
  isMobile:true,hasTouch:true,acceptDownloads:true,
  serviceWorkers:'block'
 }),pageErrors=[],networkRequests=[];
 page.on('request',req=>{
  // The model's WASM runtime and weights are allowed to download by GET.
  // These are not photo uploads. Check external WRITE requests and never
  // save their URLs, headers, query strings, request bodies or identifiers.
  const target=req.url();
  if(!target.startsWith('http://127.0.0.1:')&&
     !target.startsWith('blob:')&&!target.startsWith('data:')&&
     req.method()!=='GET')
   networkRequests.push(req.method());
 });page.on('pageerror',e=>pageErrors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/phone-photo-check.html');
 assert.equal(await page.locator('#run').isDisabled(),true);
 await page.locator('#photos').setInputFiles([
  {name:'PRIVATE_PHONE_GARMENT.jpg',mimeType:'image/jpeg',buffer:fixtures[0].bytes},
  {name:'PRIVATE_PHONE_NEGATIVE.jpg',mimeType:'image/jpeg',buffer:fixtures[1].bytes}
 ]);
 await page.locator('#category-0').selectOption('Tops');
 await page.locator('#type-0').selectOption('T-shirt');
 await page.locator('#color-0').selectOption('Multicolor'); // Independent label for blue, white and gray shirt.
 assert.equal(await page.locator('#run').isDisabled(),true);
 await page.locator('#category-1').selectOption('Uncategorized');await page.locator('#run').click();
 assert.equal(await page.locator('#category-0').isDisabled(),true);
 assert.equal(await page.locator('#color-0').isDisabled(),true,
  'source-color expectation must be locked before model inference');
 assert.equal(await page.locator('#photos').isDisabled(),true);
 await page.locator('#download').waitFor({state:'visible',timeout:480000});
 const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadPromise;const reportPath=join(output,'results.json');await download.saveAs(reportPath);
 const raw=await readFile(reportPath,'utf8'),report=JSON.parse(raw);assert.ok(!raw.includes('PRIVATE_PHONE'));assert.ok(!raw.includes('data:image'));assert.equal(report.summary.photos,2);assert.equal(report.summary.errors,0);assert.equal(report.summary.categoryMatches,1);
 // Native browser decode + re-encode can produce subtly different RGB.
 // A category-confirmed Unknown subtype is a safe review, not an error.
 assert.equal(report.summary.negativeRejected,1);
 assert.equal(report.summary.colorsLabeled,1,'independent garment color included in private test');
 assert.equal(report.photos[0].expectedColor,'Multicolor');
 assert.equal(report.photos[1].expectedColor,null);
 assert.equal(report.summary.modelColorMatches+report.summary.modelColorWrong+
  report.summary.modelColorMissing,1,'honestly account for unavailable model color predictions');
 assert.ok(report.photos[0].prediction.color===null||
  ['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple',
   'Yellow','Orange','Multicolor'].includes(report.photos[0].prediction.color));
 assert.equal(report.summary.incorrectAutomaticCategories,0);
 assert.equal(report.summary.incorrectAutomaticTypes,0);
 const garment=report.photos[0],negative=report.photos[1];
 assert.equal(garment.expectedCategory,'Tops');
 assert.equal(garment.prediction.category,'Tops');
 assert.equal(negative.categoryMatch,true);
 if(report.summary.typeMatches===0){
  assert.equal(garment.prediction.type,'Unknown');
  assert.equal(garment.strong,false);
  assert.equal(garment.categoryConfirmed,true);
  assert.equal(report.summary.review,1);
 }else{
  assert.equal(report.summary.typeMatches,1);
  assert.equal(garment.prediction.type,'T-shirt');
 }
 assert.equal(report.summary.typesChecked,1);assert.match(report.release,/^[a-f0-9]{12}$/);assert.equal(report.recognitionIndex,JSON.parse(await readFile('public/recognition-vectors.json','utf8')).sha256);
 assert.equal(await page.locator('#category-0').isDisabled(),true);
 const layout=await page.evaluate(()=>({
  width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
  photoCount:document.querySelectorAll('.photo').length
 }));
 assert.equal(layout.scrollWidth<=layout.width+1,true,
  browserName+' phone photo test must have no horizontal overflow');
 assert.equal(layout.photoCount,2);
 assert.deepEqual(networkRequests,[],
  'Browser-local inference must never submit photo data using an external write request');
 await page.screenshot({path:join(output,'phone-photo-flow.png'),fullPage:true});
 await page.locator('#restart').click();assert.equal(await page.locator('.photo').count(),0);assert.equal(await page.locator('#photos').isDisabled(),false);assert.equal(await page.locator('#download').isVisible(),false);
 await page.locator('#photos').setInputFiles({name:'PRIVATE_PHONE_RETRY.jpg',mimeType:'image/jpeg',buffer:fixtures[0].bytes});await page.locator('#category-0').selectOption('Tops');await page.locator('#run').click();await page.locator('#restart').click();
 await page.waitForTimeout(150);assert.equal(await page.locator('.photo').count(),0);assert.equal(await page.locator('#status').innerText(),'Choose your photos to begin.');assert.deepEqual(pageErrors,[]);
 await writeFile(join(output,'summary.json'),JSON.stringify({
  passed:true,realWorker:true,browser:browserName,
  phoneProfile:browserName==='webkit'?'iPhone 13 WebKit emulation':'Android Chromium emulation',
  physicallyTested:false,liveCameraTested:false,providerBills:0,
  originalSourceShaVerified:2,fixturePhotos:2,modelAssetsMayDownload:true,
  recognitionOriginalFirst:true,categoryMatches:report.summary.categoryMatches,
  negativeRejected:report.summary.negativeRejected,
  exactGarmentTypeAccepted:report.summary.typeMatches===1,
  garmentTypeReviewRequired:report.summary.typeMatches===0,
  noIncorrectAutomaticTypes:report.summary.incorrectAutomaticTypes===0,
  modelColorDiagnosticLabeledPhotos:report.summary.colorsLabeled,
  modelColorSuggestionsMatched:report.summary.modelColorMatches,
  modelColorUnavailable:report.summary.modelColorMissing,
  productionColorSaveOrRealCameraValidated:false,
  viewport:layout,lockedLabels:true,reportPrivacy:true,cancellation:true,
  externalWriteRequests:networkRequests.length,pageErrors
 },null,2));
 console.log('CROSS_ENGINE_REAL_PHOTO_PILOT '+JSON.stringify({
   browser:browserName,originalShaVerified:2,browserLocalInference:true,externalModelAssetDownloadsMayOccur:true,
   garmentCategoryCorrect:report.summary.categoryMatches,
   negativePhotosRejected:report.summary.negativeRejected,
   correctGarmentSubtypeAccepted:report.summary.typeMatches===1,
   categoryOnlyGarmentReview:report.summary.typeMatches===0,
   physicalPhoneTested:false,actualCameraTested:false,paidProviderCalls:0,
   privatePhotoBytesExported:false
  }));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
