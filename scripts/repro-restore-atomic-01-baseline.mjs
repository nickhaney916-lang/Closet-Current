/**
 * Original default consumer import regression reproduction. READ ONLY source,
 * synthetic browser owner and known licensed JPEG; intentionally proves that
 * the previously existing v3 importer can partially write items before
 * failing a later invalid outfit-board validation. Never runs on production.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('.'),out='benchmark/restore-atomic-01';
await mkdir(out,{recursive:true});
const photo=await readFile('benchmark/fixtures/commons-0053.jpg');
const server=createServer(async(req,res)=>{
 try{
  const u=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!u.startsWith('/public/')||u.includes('..')||u.includes('\\'))throw Error('disallowed');
  const path=resolve(root,'.'+u),bytes=await readFile(path);
  const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
   '.css':'text/css','.json':'application/json'};
  res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:390,height:900},acceptDownloads:true,serviceWorkers:'block'});
 await ctx.route('**/*',route=>{
  const url=route.request().url(),path=new URL(url).pathname;
  if(path==='/public/cloud-backup.js')return route.fulfill({contentType:'text/javascript',
   body:'window.closetCloud={start:async()=>{},beforeWrite:async()=>{},changed:()=>{},sync:async()=>{}};'});
  if(url.startsWith('http://127.0.0.1:'))return route.continue();
  if(path==='/auth/v1/token')return route.fulfill({contentType:'application/json',
   body:JSON.stringify({user:{id:'restore01-baseline',email:'baseline@example.test'},
    access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_in:3600})});
  return route.abort();
 });
 const page=await ctx.newPage();
 await page.goto('http://127.0.0.1:'+server.address().port+'/public/index.html');
 await page.locator('#authEmail').fill('baseline@example.test');
 await page.locator('#authPassword').fill('Synthetic-No-Real-Credentials');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(()=>typeof db!=='undefined'&&db?.name==='closet-current-user-restore01-baseline');
 const malformed={format:'closet-current',version:3,
  items:[{id:'baseline-partial-written',name:'Original garment',category:'Dresses',
   image:'data:image/jpeg;base64,'+photo.toString('base64')}],
  outfitBoard:{current:{name:'valid',slots:{}},saved:Array.from({length:51},()=>({slots:{}}))}};
 page.once('dialog',d=>d.accept());
 await page.locator('#import').setInputFiles({name:'repro.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(malformed))});
 await page.waitForFunction(()=>document.getElementById('message')?.textContent?.includes('Invalid outfit board backup'));
 const saved=await page.evaluate(()=>new Promise((resolve,reject)=>{
  const req=db.transaction('items').objectStore('items').getAll();
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 }));
 assert.equal(saved.length,1,'Original v3 path must demonstrate partial write despite failed board');
 assert.equal(saved[0].id,'baseline-partial-written');
 await page.screenshot({path:out+'/baseline-pre-fix-partial-import.png'});
 await writeFile(out+'/baseline-reproduction.json',JSON.stringify({
  originalDefaultImportBugReproduced:true,syntheticOwnerOnly:true,
  attemptedSavedOutfits:51,operationResult:'error',itemsUnexpectedlyPersisted:saved.length,
  sourcePath:'public/app.js',originalConsumerProductionUnmodified:true
 },null,2));
 console.log('RESTORE01 BASELINE BUG REPRODUCED: invalid outfit board after item write');
 await ctx.close();
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
