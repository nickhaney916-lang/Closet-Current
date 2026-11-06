/**
 * COLOR87: actual native browser canvas crop → pixel-background warning →
 * human confirmation → original-SHA-verified owner-private atomic save.
 * White/blue test images are SYNTHETIC, not human-annotated model accuracy.
 * Local model workers are QA mocks that abstain; no real model is measured.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const root=resolve('.'),dir=resolve('benchmark/color-background-live-87');
await mkdir(dir,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const white={r:255,g:255,b:255},blue={r:19,g:39,b:218};
const sq=await sharp({create:{width:420,height:410,channels:3,background:blue}}).png().toBuffer();
const risky=await sharp({create:{width:800,height:750,channels:3,background:white}})
 .composite([{input:sq,left:190,top:170}]).jpeg({quality:96}).toBuffer();
const safe=await sharp({create:{width:800,height:750,channels:3,background:blue}})
 .jpeg({quality:96}).toBuffer();
assert.notEqual(sha(risky),sha(safe));
const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.css':'text/css','.json':'application/json','.bin':'application/octet-stream',
 '.jpg':'image/jpeg','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(public|research|benchmark|node_modules)\//.test(pathname)||
     pathname.split('/').includes('..')||pathname.includes('\\')||pathname.includes('\0'))
   throw Error('Forbidden file');
  const path=resolve(root,'.'+pathname);
  if(!path.startsWith(root+'/'))throw Error('Outside repository');
  const bytes=await readFile(path);
  res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port,auth='https://hlkgymugtfbirlpunsra.supabase.co';
const report={schema:'color-background-live-87/v1',engineeringOnly:true,
 sourceNature:'generated synthetic test photos',actualModelExecuted:false,
 independentHumanColorLabels:false,physicalPhoneTested:false,
 output:['warning on opaque white background','normal pixel hint on solid blue'],
 cases:[],screenshots:[],unexpectedUploads:[]};
let browser;
const storage=page=>page.evaluate(()=>new Promise((resolve,reject)=>{
 const req=db.transaction('items').objectStore('items').getAll();
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
}));
async function login(page,owner){
 await page.locator('#authEmail').fill(owner+'@example.test');
 await page.locator('#authPassword').fill('fixture-only');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(id=>window.closetAuth?.user?.id===id&&
  db?.name==='closet-current-user-'+id,owner,{timeout:30000});
}
function authHTTP(route){
 const u=new URL(route.request().url());
 if(u.pathname==='/auth/v1/logout')return route.fulfill({status:204,body:''});
 if(u.pathname==='/auth/v1/token'){
  const body=JSON.parse(route.request().postData()||'{}'),grant=u.searchParams.get('grant_type');
  const owner=grant==='password'&&/^multi24-[AB]@example\.test$/.test(body.email||'')?
   body.email.split('@')[0]:grant==='refresh_token'&&
    /^multi24-refresh-multi24-[AB]$/.test(body.refresh_token||'')?
     body.refresh_token.slice('multi24-refresh-'.length):null;
  if(!owner)return route.fulfill({status:401,contentType:'application/json',body:'{"error":"Unknown fixture account"}'});
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   user:{id:owner,email:owner+'@example.test'},access_token:'fixture-'+owner,
   refresh_token:'multi24-refresh-'+owner,expires_in:3600})});
 }
 return route.abort();
}
async function shot(page,width,engine,stage){
 const png=await page.screenshot({animations:'disabled',fullPage:true});
 const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
 assert.equal(meta.width,width);assert.ok(meta.height>=920&&png.length>5000);
 assert.ok(stats.channels.some(x=>x.stdev>6),'Screenshot cannot be blank');
 const file=engine+'-'+width+'-'+stage+'.png';await writeFile(dir+'/'+file,png);
 report.screenshots.push({file,engine,width,stage,height:meta.height,sha256:sha(png)});
}
try{
 for(const [engine,launcher]of [['chromium',chromium],['webkit',webkit]])
 for(const width of [320,390,430]){
  browser=await launcher.launch({headless:true,...engine==='chromium'?
   {args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{}});
  const context=await browser.newContext({viewport:{width,height:920},
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const request=route.request(),url=request.url();
   if(url===origin+'/public/cloud-backup.js')
    return route.fulfill({status:200,contentType:'text/javascript',
     body:'window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};'});
   if(url.startsWith(origin+'/')||url.startsWith('data:')||url.startsWith('blob:'+origin))
    return route.continue();
   if(url.startsWith(auth+'/auth/v1/'))return authHTTP(route);
   if(request.method()!=='GET')report.unexpectedUploads.push({engine,width,method:request.method(),host:new URL(url).hostname});
   return route.abort();
  });
  const page=await context.newPage();
  await page.addInitScript({content:await readFile('research/color-background-live-ui-87/classifier-fixture.js','utf8')});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=origin+'/public/index.html?multi24=research&captureProof01=after&index04=after&nativeLossless04=research&nativeIndex07=research&index02=after&restoreAtomic01=research&styleOwned03=research&nativeCorrection10=research&recognitionReview42=research';
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await login(page,'multi24-A');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.multi24Research?.active===true&&
   window.closetIndex02?.state()?.ready===true,null,{timeout:45000});
  await page.evaluate(()=>switchView('scan'));
  await page.locator('#captureOutfit').click();

  // Case 1: Original synthetic opaque photo where background white outvotes blue center.
  await page.locator('#outfitUpload').setInputFiles({name:'blue-fabric-white-background.jpg',mimeType:'image/jpeg',buffer:risky});
  await page.waitForFunction(hash=>window.multi24Research?.debug().sourceSHA256===hash,
   sha(risky),{timeout:30000});
  await page.waitForFunction(()=>!window.multi24Research?.debug().working,null,{timeout:30000});
  await page.getByRole('button',{name:'Add missed piece'}).click();
  let card=page.locator('#multi24Grid .multi24-card').first();
  await card.getByRole('button',{name:'Adjust crop/mask'}).click();
  let crop=page.locator('dialog.photo-crop-editor');
  await crop.waitFor({state:'visible'});
  await crop.getByRole('button',{name:'Whole photo'}).click();
  await crop.getByRole('button',{name:'Save crop'}).click();
  await crop.waitFor({state:'hidden',timeout:30000});
  assert.equal(await card.getAttribute('data-crop-reviewed55'),'confirmed');
  await card.getByRole('button',{name:'Suggest category, type and color'}).click();
  await card.locator('[data-recognition42="result"]').waitFor({timeout:45000});
  const warning=card.locator('[data-color-risk85="review-required"]');
  await warning.waitFor({state:'visible'});
  assert.match(await warning.innerText(),/Pixel-color estimate withheld.*crop edges may be background/i);
  assert.equal(await card.locator('[data-color-review46="unverified"]').count(),0,
   'The actual browser UI must not display an opaque background as the garment color');
  assert.deepEqual([await card.getByLabel('Main category').inputValue(),
   await card.getByLabel('Specific type').inputValue(),
   await card.getByLabel('Color (confirm visually)').inputValue()],
   ['Uncategorized','Unknown','']);
  const before=await storage(page);assert.equal(before.length,0,'Unreviewed crop must never write');
  await shot(page,width,engine,'01-white-background-color-warning-before-human-review');
  await card.getByLabel('Main category').selectOption('Tops');
  await card.getByLabel('Specific type').selectOption('T-shirt');
  await card.getByLabel('Color (confirm visually)').fill('Blue');
  await card.getByLabel('I confirm this visible garment, category and color').check();
  await page.getByRole('button',{name:'Save confirmed pieces together'}).click();
  await page.waitForFunction(()=>items.length===1,null,{timeout:30000});
  const after=await storage(page);
  assert.equal(after.length,1);
  assert.equal(after[0].color,'Blue');assert.equal(after[0].colorSource,'user');
  assert.equal(after[0].sourceSHA256,sha(risky));
  assert.equal(after[0].originalPhoto.sha256,sha(risky));
  assert.equal(after[0].originalPhoto.image,'data:image/jpeg;base64,'+risky.toString('base64'));
  assert.equal(after[0].ownerId,'multi24-A');
  assert.equal(after[0].recognitionSuggestion42?.colorReview46,undefined,
   'Unsafe pixel color suggestion must not be saved as metadata');
  await shot(page,width,engine,'02-human-blue-color-privately-saved');
  await page.getByRole('button',{name:'Cancel extraction'}).click();

  // Case 2: All-blue source must preserve legitimate unverified pixel advice.
  await page.locator('#outfitUpload').setInputFiles({name:'solid-blue-garment.jpg',mimeType:'image/jpeg',buffer:safe});
  await page.waitForFunction(hash=>window.multi24Research?.debug().sourceSHA256===hash,sha(safe),{timeout:30000});
  await page.waitForFunction(()=>!window.multi24Research?.debug().working,null,{timeout:30000});
  await page.getByRole('button',{name:'Add missed piece'}).click();
  card=page.locator('#multi24Grid .multi24-card').first();
  await card.getByRole('button',{name:'Adjust crop/mask'}).click();
  crop=page.locator('dialog.photo-crop-editor');await crop.waitFor({state:'visible'});
  await crop.getByRole('button',{name:'Whole photo'}).click();
  await crop.getByRole('button',{name:'Save crop'}).click();
  await crop.waitFor({state:'hidden',timeout:30000});
  await card.getByRole('button',{name:'Suggest category, type and color'}).click();
  await card.locator('[data-recognition42="result"]').waitFor({timeout:45000});
  assert.equal(await card.locator('[data-color-risk85="review-required"]').count(),0,
   'Same-color background/center should not be spuriously suppressed');
  const normal=card.locator('[data-color-review46="unverified"]');
  await normal.waitFor({state:'visible'});
  assert.match(await normal.innerText(),/Reviewed crop pixel color.*Blue.*unverified/i);
  assert.equal(await card.getByLabel('Color (confirm visually)').inputValue(),'');
  await shot(page,width,engine,'03-solid-blue-pixel-advice-still-unverified');
  await card.getByLabel('Main category').selectOption('Tops');
  await card.getByLabel('Specific type').selectOption('T-shirt');
  await card.getByLabel('Color (confirm visually)').fill('Blue');
  await card.getByLabel('I confirm this visible garment, category and color').check();
  await page.getByRole('button',{name:'Save confirmed pieces together'}).click();
  await page.waitForFunction(()=>items.length===2,null,{timeout:30000});
  const two=await storage(page);
  assert.equal(two.length,2);assert.deepEqual(new Set(two.map(x=>x.sourceSHA256)),new Set([sha(risky),sha(safe)]));
  assert.ok(two.every(x=>x.ownerId==='multi24-A'&&x.color==='Blue'&&x.colorSource==='user'));
  await shot(page,width,engine,'04-two-owner-private-human-confirmed-sources');

  await page.locator('.account-menu summary').click();
  await page.locator('#logout').click();
  await page.waitForFunction(()=>document.getElementById('authGate')?.hidden===false,null,{timeout:30000});
  assert.equal(await page.locator('#multi24Research img[src^="data:image/"]').count(),0);
  await login(page,'multi24-B');
  assert.equal((await storage(page)).length,0,'Other account cannot see A synthetic original photo');
  await shot(page,width,engine,'05-logout-and-owner-B-private-empty');
  assert.ok(errors.length===0,'Unexpected app errors: '+JSON.stringify(errors));
  const worker=await page.evaluate(()=>window.__color87WorkerFixture);
  assert.equal(worker.classification,4,'Two original + two reviewed JPEG classifier requests per test photo');
  assert.equal(worker.detection,2,'Two genuine outfit intake requests per reviewer');
  report.cases.push({engine,width,riskySourceSHA256:sha(risky),safeSourceSHA256:sha(safe),
   opaqueBackgroundHintSuppressed:true,solidColorHintUnverified:true,manualPrivateSaves:2,
   humanColorNotAutofilled:true,sourceSHAUnchanged:true,workerSimulated:true,ownerIsolation:true});
  await context.close();await browser.close();browser=null;
 }
 await writeFile(dir+'/acceptance.json',JSON.stringify(report,null,2)+'\n');
 console.log('COLOR87 native 6/6 Chromium/WebKit 320/390/430 two-source UI workflows PASS: white-backdrop false-pixel-color withheld; solid-blue pixel advice unverified; explicit human-confirmed original-SHA-verified two private saves; owner-B isolation; '+report.screenshots.length+' real browser screenshot SHA receipts. Synthetic input and mocked workers: NOT model accuracy.');
}finally{await browser?.close().catch(()=>{});await new Promise(r=>server.close(r));}
