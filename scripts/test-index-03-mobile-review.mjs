/**
 * True headless Chromium at 320/390/430, real existing Closet Current My Closet
 * page, actual IndexedDB save/Adjust/reload. Auth is deliberately test-only.
 * Licensed original JPEG pixels; NO neural inference or physical phone claim.
 */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,extname,join} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('public'),out=resolve('benchmark/index-03/mobile');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css',
 '.json':'application/json','.bin':'application/octet-stream','.webmanifest':'application/manifest+json'};
const testAuth="window.closetAuth={user:{id:'index03-browser-owner'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;";
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/auth.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(testAuth);return;}
  const name=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));
  if(!name.startsWith(root+'/'))throw Error('Forbidden path');
  const data=await readFile(name);res.writeHead(200,{'Content-Type':types[extname(name)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
const sources=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
function photo(id){
 const meta=sources.find(x=>x.id===id),bytes=readFileSync(join('benchmark/fixtures',id+'.jpg'));
 assert.ok(meta?.verified&&meta.attribution?.license);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.sha256);
 return {image:'data:image/jpeg;base64,'+bytes.toString('base64'),sha256:meta.sha256};
}
const skirt=photo('commons-0041'),sneaker=photo('commons-0079');
const beforeRecords=[
 {id:'index03-skirt',ownerId:'index03-browser-owner',name:'Original skirt photo',
  category:'Dresses',itemType:'Casual dress',color:'Navy',colorSource:'user',
  image:skirt.image,originalPhoto:{image:skirt.image,sha256:skirt.sha256},
  sourceSHA256:skirt.sha256,sourceHashVerified:true,singleGarmentVerified:true,
  seasons:[],sleeveLength:'Unknown',pattern:'Unknown',fit:'Unknown',
  userAdjusted:true,notes:'',brand:'',material:'',size:'',occasion:''},
 {id:'index03-sneaker',ownerId:'index03-browser-owner',name:'Original sneaker photo',
  category:'Shoes',itemType:'Sneakers',color:'White',colorSource:'user',
  image:sneaker.image,originalPhoto:{image:sneaker.image,sha256:sneaker.sha256},
  sourceSHA256:sneaker.sha256,sourceHashVerified:true,singleGarmentVerified:true,
  seasons:[],sleeveLength:'Not applicable',pattern:'Unknown',fit:'Not applicable',
  userAdjusted:true,notes:'',brand:'',material:'',size:'',occasion:''}
];
const results=[],errors=[],outbound=[],blockedExternal=[],unsafeExternalAttempts=[];
await mkdir(out,{recursive:true});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:2,
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',route=>{
   if(route.request().url().startsWith(base+'/'))return route.continue();
   const request=route.request();
   const entry={url:request.url().split('?')[0],method:request.method(),
    bodyBytes:request.postData()?.length||0};
   blockedExternal.push(entry);
   if(entry.method!=='GET'||entry.bodyBytes>0)unsafeExternalAttempts.push(entry);
   return route.abort();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push('width '+width+': '+e.message));
  await page.goto(base+'/');await page.evaluate(()=>closetReady);
  await page.evaluate(async data=>{
   await writeAll(data);items=data.map(normalizeClothing);render();
  },beforeRecords);
  await page.locator('.tab[data-view="closet"]').click();
  await page.locator('#closetAllPieces').click();
  assert.equal(await page.locator('#closetGrid article').count(),2);
  const card=page.locator('#closetGrid article').filter({hasText:'Original skirt photo'});
  assert.ok((await card.locator('img').getAttribute('src')).startsWith('data:image/jpeg;base64,'));
  await page.screenshot({path:join(out,width+'-before.png'),fullPage:true});
  await card.getByRole('button',{name:'Adjust details'}).click();
  const dialog=page.locator('dialog.clothing-editor');
  await dialog.getByLabel('Main category').selectOption('Bottoms');
  await dialog.getByLabel('Item type').selectOption('Skirt');
  await dialog.getByLabel('Color',{exact:true}).fill('Cream');
  await dialog.getByRole('button',{name:'Save changes'}).click();
  await dialog.waitFor({state:'detached'});
  const after=await page.evaluate(()=>items.find(x=>x.id==='index03-skirt'));
  assert.equal(after.category,'Bottoms');assert.equal(after.itemType,'Skirt');assert.equal(after.color,'Cream');
  assert.equal(after.image,skirt.image);assert.equal(after.originalPhoto?.image,skirt.image);
  assert.equal(after.sourceSHA256,skirt.sha256);assert.equal(after.originalPhoto?.sha256,skirt.sha256);
  const other=await page.evaluate(()=>items.find(x=>x.id==='index03-sneaker'));
  assert.equal(other.itemType,'Sneakers');assert.equal(other.image,sneaker.image);
  assert.equal(other.originalPhoto?.sha256,sneaker.sha256);
  await page.screenshot({path:join(out,width+'-after.png'),fullPage:true});
  await page.reload();await page.evaluate(()=>closetReady);
  const persisted=await page.evaluate(()=>items.map(x=>({
   id:x.id,category:x.category,itemType:x.itemType,color:x.color,
   originalSHA256:x.originalPhoto?.sha256,image:x.image,originalImage:x.originalPhoto?.image
  })));
  assert.equal(persisted.length,2);
  const saved=persisted.find(x=>x.id==='index03-skirt'),unchanged=persisted.find(x=>x.id==='index03-sneaker');
  assert.equal(saved.category,'Bottoms');assert.equal(saved.itemType,'Skirt');assert.equal(saved.color,'Cream');
  assert.equal(saved.image,skirt.image);assert.equal(saved.originalImage,skirt.image);
  assert.equal(saved.originalSHA256,skirt.sha256);
  assert.equal(unchanged.category,'Shoes');assert.equal(unchanged.itemType,'Sneakers');
  assert.equal(unchanged.originalSHA256,sneaker.sha256);
  const ui=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
   reviewButton:!!document.querySelector('#closetGrid')}));
  assert.ok(ui.scrollWidth<=width+2,'Viewport horizontal overflow at '+width);
  results.push({width,realAppPage:true,realIndexedDB:true,licensedOriginalSHA256Verified:true,
   categoryCorrectionPersisted:true,otherItemUnchanged:true,originalBytesUnchanged:true,
   screenshotBefore:width+'-before.png',screenshotAfter:width+'-after.png',
   neuralInferenceMeasured:false,physicalHardwareTested:false,viewport:ui});
  await context.close();
 }
 console.log('Blocked pre-existing remote asset requests',JSON.stringify(blockedExternal));
 // The app may request third-party fonts/static assets. The browser blocks EVERY
 // off-host request; any attempted non-GET/body traffic fails photo-privacy QA.
 const report={verdict:errors.length||unsafeExternalAttempts.length?'REVIEW':'PASS',screenshots:6,results,errors,outbound,
  blockedExternalRequests:blockedExternal,unsafeExternalAttempts,
  realRecognitionMeasured:false,physicalAndroidOrIphoneTested:false,
  productionDeployed:false,familyAlpha:'HOLD'};
 await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));
 assert.equal(unsafeExternalAttempts.length,0,'External data-transfer attempt blocked: '+JSON.stringify(unsafeExternalAttempts));
 if(errors.length)throw Error('Page errors in mobile review QA: '+errors.join('; '));
 console.log(JSON.stringify({verdict:report.verdict,widths:results.map(x=>x.width),
  screenshots:6,allowedExternalRequests:outbound.length,blockedExternalRequests:blockedExternal.length,realRecognitionMeasured:false},null,2));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
