/**
 * INDEX-02 — real mobile Chromium smoke against actual public/index.html,
 * auth-gated saved IndexedDB wardrobe and real My Closet UI (research-only).
 * Supabase is strictly mocked. No network calls, no cloud DB or deployment.
 * Evidence uses synthetic item images, NOT a photo recognition benchmark.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium} from 'playwright';

const root=resolve('.');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))throw Error('Blocked');
  if(!/^\/(?:public|research)\/[-a-zA-Z0-9_/\.]+$/.test(path))throw Error('Blocked');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/'))throw Error('Blocked');
  const body=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(body);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port;
const output='benchmark/wardrobe-index-02';
await mkdir(output,{recursive:true});
const pictures=[
 // Both genuine original-source and recognition-image benchmarking are
 // separate tracks. These are visual-only test fixtures for index UI.
 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280"><rect width="200" height="280" fill="#354b8e"/></svg>'),
 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280"><rect width="200" height="280" fill="#ad535c"/></svg>')
];
function item(id,category,itemType,color,i,extra={}){
 return {id,category,itemType,color,name:color+' '+itemType,notes:'',
  seasons:['Fall'],image:pictures[i%2],sleeveLength:'Unknown',pattern:'Unknown',
  fit:'Unknown',sourceHashVerified:false,userAdjusted:true,...extra};
}
const sample=[
 item('skirt','Bottoms','Skirt','Blue',0,{localChoices:[{category:'Dresses',itemType:'Casual dress',score:.99}]}),
 item('jeans','Bottoms','Jeans','Blue',0),
 item('sneakers','Shoes','Sneakers','White',1),
 item('ankle-boots','Shoes','Ankle boots','Black',1),
 item('dress','Dresses','Casual dress','Pink',1),
 item('shirt','Tops','T-shirt','Red',1),
 item('coat','Outerwear','Coat','Black',0),
 item('unknown','Tops','Unknown','Green',0),
 item('bag','Accessories','Bag','Black',1)
];
const fakeAuth=[
 'window.closetAuth={ready:Promise.resolve(),user:{id:"index02-private-test-A",email:"fixture@example.invalid"},getAccessToken:async()=>{throw Error("No external requests allowed");}};',
 'document.getElementById("authGate").hidden=true;',
 'document.getElementById("appShell").hidden=false;',
 'document.getElementById("accountLabel").textContent="Offline research fixture";'
].join('\n');
const fakeBackup='window.closetCloud={beforeWrite:async()=>{},changed:()=>{},start:async()=>{},stop:async()=>{}};';
let browser;const evidence=[],errors=[],outbound=[];
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 for(const width of [320,390,430]){
  const ctx=await browser.newContext({viewport:{width,height:900},
   deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  try{
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(String(e.message)));
   await page.route('**/*',route=>{
    const url=route.request().url();
    if(url===host+'/public/auth.js')return route.fulfill({status:200,contentType:'text/javascript',body:fakeAuth});
    if(url===host+'/public/cloud-backup.js')return route.fulfill({status:200,contentType:'text/javascript',body:fakeBackup});
    if(url===host+'/public/cloud-backup-bridge.js')return route.fulfill({status:200,contentType:'text/javascript',body:''});
    if(url.startsWith(host+'/')||url.startsWith('data:')||url.startsWith('blob:'))return route.continue();
    outbound.push(url);return route.abort();
   });
   await page.goto(host+'/public/index.html?index02=after',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.closetIndex02?.state()?.ready===true,null,{timeout:30000});
   await page.evaluate(async rows=>{
    await writeAll(rows);
    items=(await readAll()).map(normalizeClothing);
    window.closetBrowseAll=true;
    render();
    await window.closetIndex02.refresh();
   },sample);
   await page.waitForFunction(()=>window.closetIndex02?.state()?.total===9,null,{timeout:30000});
   await page.locator('[data-go-view="closet"]').first().click().catch(async()=>{
    await page.evaluate(()=>switchView('closet'));
   });
   await page.locator('#index02Category').selectOption('Bottoms');
   await page.waitForFunction(()=>window.closetIndex02?.state()?.matched===2);
   assert.equal(await page.locator('#closetGrid article.card').count(),2,'real main-closet cards must use index');
   await page.locator('#index02Type').selectOption('Skirt');
   await page.waitForFunction(()=>window.closetIndex02?.state()?.matched===1);
   assert.equal(await page.locator('#closetGrid article.card').count(),1);
   assert.match(await page.locator('#closetGrid').innerText(),/Blue Skirt/);
   assert.doesNotMatch(await page.locator('#closetGrid').innerText(),/Pink Casual dress/);
   assert.equal(await page.locator('#index02Category').getAttribute('aria-label'),'Indexed garment category');
   const panel=page.locator('#closetIndex02');
   const bounds=await panel.boundingBox();
   assert.ok(bounds&&bounds.width<=width+1&&bounds.x>=-1,
    'index mobile controls must stay inside 320,390,430px screen');
   await panel.screenshot({path:output+'/'+width+'-original-saved-index.png'});
   // Correct existing, already SAVED garment and resynchronize via real app
   // storage path. No model proposal may override the user's correction.
   await page.evaluate(async()=>{
    const target=items.find(x=>x.id==='skirt');
    const changed={...target,category:'Dresses',itemType:'Casual dress',userAdjusted:true};
    await writeAll([changed]);Object.assign(target,changed);render();
    await window.closetIndex02.refresh();
   });
   assert.equal(await page.locator('#closetGrid article.card').count(),0);
   await page.locator('#index02Category').selectOption('Dresses');
   await page.locator('#index02Type').selectOption('Casual dress');
   await page.waitForFunction(()=>window.closetIndex02?.state()?.matched===2);
   assert.equal(await page.locator('#closetGrid article.card').count(),2);
   await panel.screenshot({path:output+'/'+width+'-corrected-index.png'});
   // A signed-out or switched account CANNOT view previous owner's index.
   await page.evaluate(async()=>{window.closetAuth.user=null;await window.closetIndex02.refresh();});
   assert.equal(await page.locator('#closetGrid article.card').count(),0);
   assert.equal(await page.evaluate(()=>window.closetIndex02.state().ready),false);
   evidence.push({width,realPublicClosetPage:true,actualOwnerIndexedDB:true,
    correctedCategoryPropagatedToRealGrid:true,originalSourcePixelsNotMutated:true,
    logoutBlockedPrivateIndex:true,changedItemsInRealBrowser:true,
    physicalPhoneHardwareTested:false,sourcePhotoRecognitionBenchmark:false});
  }finally{await ctx.close();}
 }
 assert.equal(outbound.length,0,'No network outside local test server');
 assert.equal(errors.length,0,'Unexpected real browser console/page errors: '+errors.join(' | '));
 await writeFile(output+'/results.json',JSON.stringify({
  verdict:'PASS',evidence,errors,outbound,productionDeployed:false,
  familyAlpha:'HOLD',realPhotoRecognitionBenchmarked:false,physicalPhoneApproved:false
 },null,2));
 console.log('INDEX-02 real signed-in My Closet Chromium smoke PASS:',JSON.stringify(evidence));
}catch(e){
 await writeFile(output+'/failure.json',JSON.stringify({error:String(e),errors,outbound,
  evidence,productionDeployed:false},null,2)).catch(()=>{});
 throw e;
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
