/**
 * M181 negative-path acceptance on the REAL built normal user PWA (no flags).
 * Force ONLY an empty worker completion to test the native UI's failure path.
 * No real model is exercised here: never present as recognition accuracy proof.
 * All capture, owner review, signed original, save, DB and navigation are real.
 * Synthetic HTTP auth, no hosted data. Family Alpha #255 HOLD.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname,join} from 'node:path';
import {chromium,webkit} from 'playwright';
const engine=process.env.M181_ENGINE||'chromium';
assert.ok(['chromium','webkit'].includes(engine));
const width=Number(process.env.M181_WIDTH||390);
assert.ok([320,390,430].includes(width));
const photo=await readFile('benchmark/fixtures/commons-0003.jpg');
const sha=createHash('sha256').update(photo).digest('hex');
const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
assert.equal(locked.find(x=>x.id==='commons-0003')?.sha256,sha);
const root=resolve('dist');
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript',
 '.css':'text/css','.json':'application/json','.jpg':'image/jpeg',
 '.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(req.method!=='GET'||path.includes('\\')||path.includes('\0')||
     path.split('/').includes('..'))throw Error('invalid path');
  const target=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!target.startsWith(root+'/'))throw Error('not built PWA');
  const bytes=await readFile(target);
  res.writeHead(200,{'content-type':mime[extname(target)]||'application/octet-stream',
   'cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const auth='https://hlkgymugtfbirlpunsra.supabase.co';
const unexpected=[],blockedStaticGET=[],errors=[],stages=[];
let browser,context,page,stage='startup';
const tick=name=>{stage=name;stages.push(name);};
const count=()=>page.evaluate(()=>new Promise((ok,no)=>{
 const req=db.transaction('items','readonly').objectStore('items').count();
 req.onsuccess=()=>ok(req.result);req.onerror=()=>no(req.error);
}));
try{
 browser=await ({chromium,webkit})[engine].launch({
  headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 context=await browser.newContext({
  viewport:{width,height:920},isMobile:true,hasTouch:true,
  serviceWorkers:'block'});
 await context.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.origin===origin||u.protocol==='blob:'||u.protocol==='data:')
   return route.continue();
  if(u.origin===auth&&u.pathname.startsWith('/auth/v1/')){
   if(u.pathname==='/auth/v1/logout')
    return route.fulfill({status:204,body:''});
   if(u.pathname==='/auth/v1/token'){
    const info=JSON.parse(route.request().postData()||'{}');
    if(u.searchParams.get('grant_type')==='password'&&
       info.email==='m181-A@example.test')
     return route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({user:{id:'m181-A',email:info.email},
       access_token:'synthetic-m181',refresh_token:'m181-refresh',expires_in:3600})});
    if(u.searchParams.get('grant_type')==='refresh_token'&&
       info.refresh_token==='m181-refresh')
     return route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({user:{id:'m181-A',email:'m181-A@example.test'},
       access_token:'synthetic-m181',refresh_token:'m181-refresh',expires_in:3600})});
   }
  }
  // The app may ask for public fonts/source-pinned JS. Blocking these GETs
  // is intentional; none contains or transmits the original JPEG. An
  // unrecognized host or ANY attempted POST still fails the egress assertion.
  if(route.request().method()==='GET'&&
     ['fonts.googleapis.com','fonts.gstatic.com',
      'raw.githubusercontent.com','cdn.jsdelivr.net'].includes(u.hostname)){
   blockedStaticGET.push(u.hostname);return route.abort();
  }
  unexpected.push({host:u.hostname,method:route.request().method()});
  return route.abort();
 });
 await context.route('**/cloud-backup.js*',route=>route.fulfill({
  status:200,contentType:'text/javascript',
  body:'window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};'}));
 // Inject only a NEGATIVE terminal result, not pretend segmentation success.
 // Other workers keep their native implementation.
 await context.addInitScript(()=>{
  const NativeWorker=window.Worker;
  window.__m181NegativeWorkerCount=0;
  window.Worker=function(url,options){
   if(!String(url).startsWith('outfit-worker.mjs'))
    return new NativeWorker(url,options);
   window.__m181NegativeWorkerCount++;
   const fake={onmessage:null,onerror:null,terminated:false,
    postMessage(packet){queueMicrotask(()=>{
     if(!this.terminated)this.onmessage?.({
      data:{type:'done',id:packet.id,count:0}});
    });},
    terminate(){this.terminated=true;}
   };
   return fake;
  };
 });
 page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e.message).slice(0,130)));
 page.on('crash',()=>errors.push('page crashed'));
 tick('open-real-built-normal-home');
 await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});
 assert.equal(new URL(page.url()).search,'');
 await page.locator('#authEmail').fill('m181-A@example.test');
 await page.locator('#authPassword').fill('synthetic-only');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(()=>window.closetAuth?.user?.id==='m181-A'&&
  db?.name==='closet-current-user-m181-A'&&
  document.querySelector('#appShell')?.hidden===false,null,{timeout:30000});
 assert.equal(await count(),0);
 tick('home-to-real-whole-outfit-picker');
 await page.locator('#home button.home-action[data-go-view="scan"]').click();
 await page.locator('#captureOutfit').click();
 assert.equal(await page.locator('#wholeOutfitCapture').isVisible(),true);
 await page.locator('#outfitUpload').setInputFiles({
  name:'commons-0003.jpg',mimeType:'image/jpeg',buffer:photo});
 tick('native-terminal-zero-piece-recovery');
 await page.locator('#outfitRetry').waitFor({state:'visible',timeout:30000});
 const status=await page.locator('#outfitSplitStatus').innerText();
 assert.match(status,/No new clothing pieces were added/);
 assert.match(status,/Single item/);
 assert.match(status,/Nothing was saved/);
 assert.equal(await count(),0);
 assert.equal(await page.locator('#reviewGrid .photo-result').count(),0);
 tick('repeat-zero-worker-response-retryable-no-save');
 await page.locator('#outfitRetry').click();
 await page.waitForFunction(()=>window.__m181NegativeWorkerCount===2,null,
  {timeout:15000});
 await page.waitForFunction(()=>
  document.querySelector('#outfitRetry')?.hidden===false&&
  /No new clothing pieces were added/.test(
   document.querySelector('#outfitSplitStatus')?.textContent||''),null,
  {timeout:15000});
 assert.equal(await count(),0);
 tick('real-single-item-fallback-original-photo-review');
 await page.locator('#captureSingle').click();
 assert.equal(await page.locator('#scanner').isVisible(),true);
 await page.locator('details.saved-imports summary').click();
 await page.locator('#clothingPhotos').setInputFiles({
  name:'commons-0003.jpg',mimeType:'image/jpeg',buffer:photo});
 await page.locator('#reviewGrid .photo-result button:has-text("Adjust")')
  .first().waitFor({state:'visible',timeout:40000});
 assert.equal(await count(),0,'single fallback cannot silently save');
 tick('synthetic-test-owner-explicit-approval');
 await page.locator('#reviewGrid .photo-result button:has-text("Adjust")')
  .first().click();
 const editor=page.locator('dialog.photo-adjust');
 await editor.waitFor({state:'visible'});
 await editor.getByLabel('Item name').fill('M181 reviewed top');
 await editor.getByLabel('Main category').selectOption('Tops');
 await editor.getByLabel('Item type').selectOption('T-shirt');
 await editor.getByLabel('Color',{exact:true}).fill('Black');
 await editor.getByLabel('I verified the category, clothing type and color').check();
 await editor.getByLabel('I confirmed this photo shows one garment').check();
 await editor.getByRole('button',{name:'Save changes'}).click();
 await page.waitForFunction(()=>document.querySelector('#closetCount')?.textContent==='1',
  null,{timeout:30000});
 assert.equal(await count(),1);
 const saved=await page.evaluate(()=>new Promise((ok,no)=>{
  const req=db.transaction('items','readonly').objectStore('items').getAll();
  req.onsuccess=()=>ok(req.result.map(x=>({
   name:x.name,owner:x.ownerId,original:x.originalPhoto?.image,
   sourceSHA:x.sourceSHA256,ownerReviewed:x.ownerReviewed,
   ready3D:x.threeDReady
  })));req.onerror=()=>no(req.error);
 }));
 assert.equal(saved.length,1);
 assert.equal(saved[0].owner,'m181-A');assert.equal(saved[0].sourceSHA,sha);
 assert.equal(saved[0].ownerReviewed,true);assert.notEqual(saved[0].ready3D,true);
 const digest=createHash('sha256').update(Buffer.from(saved[0].original.split(',')[1],'base64')).digest('hex');
 assert.equal(digest,sha);
 assert.deepEqual(unexpected,[]);
 assert.deepEqual(errors,[]);
 const receipt={engine,width,stage:'PASS',stages,originalSHA256:sha,
  negativeWorkerInjectionOnly:true,genuineModelAccuracyTested:false,
  blockedStaticAssetRequests:blockedStaticGET.length,unapprovedOutboundRequests:unexpected.length,
  actualNormalAppDOMAndIDB:true,actualInstalledBrowser:true,
  syntheticAuth:true,syntheticOwnerLabels:true,hostedRLS:false,
  realPhone:false,garmentFitted3D:false,noSilentSave:true,familyAlpha:'HOLD'};
 const output=resolve('benchmark/main181-zero-result-native',engine,String(width));
 await mkdir(output,{recursive:true});
 await writeFile(join(output,'M181-NEGATIVE-NO-PIECE-RECOVERY.json'),
  JSON.stringify(receipt,null,2)+'\n');
 console.log('M181_NORMAL_NATIVE_ZERO_PROPOSAL_FAIL_CLOSED_PASS',
  JSON.stringify({engine,width,stages:stages.length,ownerReviewed:1,
   modelMockedForNegativeOnly:true,realModelTested:false}));
}catch(error){
 console.error('M181_NATIVE_NEGATIVE_PATH_FAIL',
  JSON.stringify({engine,width,stage,error:String(error),unexpected,errors}));
 process.exitCode=1;
}finally{
 await context?.close().catch(()=>{});
 await browser?.close().catch(()=>{});
 await new Promise(r=>server.close(r));
}
