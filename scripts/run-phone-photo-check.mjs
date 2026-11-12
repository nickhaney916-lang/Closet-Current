import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import assert from 'node:assert/strict';

const root=resolve(process.env.M1_TRIAL_ROOT||'dist'),output=resolve(process.argv[2]||'benchmark/phone-photo-flow');
const engine=process.argv[3]||'chromium';
if(!['chromium','webkit'].includes(engine))throw Error('Unsupported recognition browser: '+engine);
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.bin':'application/octet-stream'};
const server=createServer(async(req,res)=>{try{
 const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));
 if(!file.startsWith(root+'/'))throw Error('Invalid path');
 res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(await readFile(file));
}catch{if(!res.headersSent)res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 await mkdir(output,{recursive:true});browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox','--enable-unsafe-swiftshader']}:{})});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true}),pageErrors=[],wireViolations=[],networkMethods=new Set();
 // Privacy regression: the original JPEG and identifying source filename
 // must never be put in a URL or any request body. This is a no-account GET-
 // only local model trial; CDN/weight downloads are allowed but uploads aren't.
 page.context().on('request',req=>{
  const method=req.method(),url=req.url(),body=req.postData()||'';
  networkMethods.add(method);
  if(!['GET','HEAD','OPTIONS'].includes(method))wireViolations.push('unexpected-upload-method:'+method);
  if(/PRIVATE_PHONE_|data:image\/(jpeg|png)|data%3Aimage|base64%2C/i.test(url)||/PRIVATE_PHONE_|data:image\/(jpeg|png)/i.test(body))
   wireViolations.push('original-image-or-file-identity-on-network');
 });page.on('pageerror',e=>pageErrors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/phone-photo-check.html');
 if(process.env.M1_TRIAL_ROOT){
  assert.equal(await page.getByText('Private diagnostic preview:',{exact:false}).count(),1);
  assert.equal(await page.getByText('Back to my closet',{exact:false}).count(),0);
 }
 assert.equal(await page.locator('#run').isDisabled(),true);
 await page.locator('#photos').setInputFiles([
  {name:'PRIVATE_PHONE_GARMENT.jpg',mimeType:'image/jpeg',buffer:await readFile('benchmark/photos/commons-0001.jpg')},
  {name:'PRIVATE_PHONE_NEGATIVE.jpg',mimeType:'image/jpeg',buffer:await readFile('benchmark/photos/commons-0090.jpg')}
 ]);
 await page.locator('#category-0').selectOption('Tops');await page.locator('#type-0').selectOption('T-shirt');
 // Exercise pre-inference optional color control without inventing ground-truth
 // for this publisher image. Color truth must be supplied by a real human.
 assert.equal(await page.locator('#color-0').isEnabled(),true);
 await page.locator('#color-0').selectOption('Blue');
 assert.equal(await page.locator('#color-0').inputValue(),'Blue');
 await page.locator('#color-0').selectOption('');
 assert.equal(await page.locator('#run').isDisabled(),true);
 await page.locator('#category-1').selectOption('Uncategorized');assert.equal(await page.locator('#color-1').isDisabled(),true);await page.locator('#run').click();
 assert.equal(await page.locator('#category-0').isDisabled(),true);assert.equal(await page.locator('#color-0').isDisabled(),true);assert.equal(await page.locator('#photos').isDisabled(),true);
 await page.locator('#download').waitFor({state:'visible',timeout:480000});
 const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadPromise;const reportPath=join(output,'results.json');await download.saveAs(reportPath);
 const raw=await readFile(reportPath,'utf8'),report=JSON.parse(raw);console.log('M1_P829_REAL_WORKER_SANITIZED_'+engine,JSON.stringify({summary:report.summary,photos:report.photos.map(p=>({id:p.id,expectedCategory:p.expectedCategory,expectedType:p.expectedType,category:p.prediction?.category,type:p.prediction?.type,strong:p.strong,categoryConfirmed:p.categoryConfirmed,categoryMatch:p.categoryMatch,typeMatch:p.typeMatch,error:p.error}))}));assert.ok(!raw.includes('PRIVATE_PHONE'));assert.ok(!raw.includes('data:image'));assert.equal(report.summary.photos,2);assert.equal(report.summary.errors,0);assert.equal(report.summary.colorsChecked,0);
 assert.equal(report.summary.colorMatches,0);
 assert.equal(report.summary.incorrectAutomaticColors,0);
 assert.equal(report.summary.incorrectAutomaticCategories,0);
 assert.ok(report.photos.every(x=>x.expectedColor===null&&
   (x.prediction?.color==null||['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange','Multicolor'].includes(x.prediction.color))));assert.equal(report.summary.incorrectAutomaticTypes,0);assert.equal(report.summary.negativeRejected,1);if(engine==='chromium'){assert.equal(report.summary.categoryMatches,1);assert.equal(report.summary.typeMatches,1);}else{assert.ok([0,1].includes(report.summary.categoryMatches));assert.ok([0,1].includes(report.summary.typeMatches));assert.ok(report.summary.typeMatches<=report.summary.categoryMatches);}assert.match(report.release,/^[a-f0-9]{12}$/);assert.equal(report.recognitionIndex,JSON.parse(await readFile('public/recognition-vectors.json','utf8')).sha256);
 assert.equal(await page.locator('#category-0').isDisabled(),true);
 const positiveRow=report.photos[0];
 const positiveVerdict=await page.locator('#result-0').innerText();
 if(positiveRow.categoryMatch===true&&positiveRow.typeMatch===true){
  assert.match(positiveVerdict,/Category and type matched/);
  assert.equal(await page.locator('#result-0').locator('..').locator('..').getAttribute('data-result-state'),positiveRow.strong?'pass':'review');
 }else if(positiveRow.categoryMatch===true){
  assert.match(positiveVerdict,/Category matched; clothing type did not/);
  assert.equal(await page.locator('#result-0').locator('..').locator('..').getAttribute('data-result-state'),'review');
 }else{
  assert.equal(positiveRow.strong,false,'wrong automatic category must NEVER pass');
  assert.match(positiveVerdict,/Needs manual review|Category needs correction/);
  assert.equal(await page.locator('#result-0').locator('..').locator('..').getAttribute('data-result-state'),'review');
 }
 assert.match(await page.locator('#result-1').innerText(),/Non-clothing correctly rejected/);
 assert.equal(await page.locator('#result-1').locator('..').locator('..').getAttribute('data-result-state'),'pass');
 assert.match(await page.locator('#summary').innerText(),/wrong automatic category results/);
 for(const width of [320,390,430]){
  await page.setViewportSize({width,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'horizontal overflow at '+width);
 }
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:join(output,'phone-photo-flow.png'),fullPage:true});
 await page.locator('#restart').click();assert.equal(await page.locator('.photo').count(),0);assert.equal(await page.locator('#photos').isDisabled(),false);assert.equal(await page.locator('#download').isVisible(),false);
 await page.locator('#photos').setInputFiles({name:'PRIVATE_PHONE_RETRY.jpg',mimeType:'image/jpeg',buffer:await readFile('benchmark/photos/commons-0001.jpg')});await page.locator('#category-0').selectOption('Tops');await page.locator('#run').click();await page.locator('#restart').click();
 await page.waitForTimeout(150);assert.equal(await page.locator('.photo').count(),0);assert.equal(await page.locator('#status').innerText(),'Choose your photos to begin.');assert.deepEqual(pageErrors,[]);
 assert.deepEqual(wireViolations,[],'no source JPEG, private file identity or upload on the wire');
 assert.ok(networkMethods.has('GET'),'real model and static files must load through real GET requests');
 await writeFile(join(output,'summary.json'),JSON.stringify({passed:true,engine,realWorker:true,fixturePhotos:2,viewports:[320,390,430],lockedLabels:true,visibleHonestVerdicts:true,reportPrivacy:true,noPhotoNetworkUpload:true,cancellation:true,pageErrors},null,2));
 console.log('Phone photo-check '+engine+' flow passed with real recognition, per-item blind verdicts and private filenames excluded.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
