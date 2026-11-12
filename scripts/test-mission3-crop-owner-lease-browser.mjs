// Mission 3: actual photo-crop-editor + app.js + native IndexedDB browser
// integration across two synthetic signed owners. No physical camera or host data.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const out=resolve(process.argv[2]||'benchmark/mission3-crop-owner-browser');
await mkdir(out,{recursive:true});
const jpeg='data:image/jpeg;base64,'+(await sharp({create:{width:320,height:320,channels:3,background:{r:66,g:115,b:171}}}).jpeg().toBuffer()).toString('base64');
const root=resolve('public'),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const full=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!full.startsWith(root+'/')||pathname.includes('\\'))throw Error('Invalid path');
  const bytes=await readFile(full);
  res.writeHead(200,{'content-type':types[extname(full)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const cases=[],errors=[];
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const ownerA='a'+width+'0000-0000-4000-8000-000000000000';
   const ownerB='b'+width+'0000-0000-4000-8000-000000000000';
   const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const outside=[];
   try{
    await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
     "window.closetAuth={user:{id:'"+ownerA+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    await context.route('**/*',route=>{
     const target=new URL(route.request().url());
     if(target.protocol==='blob:'||target.protocol==='data:'||target.hostname==='127.0.0.1')return route.fallback();
     outside.push(target.pathname);
     if(target.pathname==='/rest/v1/closet_backups')return route.fulfill({contentType:'application/json',body:'[]'});
     return route.abort();
    });
    await context.addInitScript(()=>{
     class OfflineWorker{
      constructor(){this.onmessage=null;this.terminated=false;}
      postMessage(message){setTimeout(()=>{
       if(!this.terminated)this.onmessage?.({data:{id:message.id,type:message.type==='load'?'ready':'result',choices:[],strong:false,details:{}}});
      },0);}
      terminate(){this.terminated=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:OfflineWorker});
    });
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push({engine,width,error:String(error)}));
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>closetReady);
    await page.evaluate(async({ownerA,jpeg})=>{
     const old=normalizeClothing({id:'same-source-id',ownerId:ownerA,category:'Tops',itemType:'T-shirt',
      color:'Blue',colorSource:'user',image:jpeg,originalPhoto:{image:jpeg,sha256:'a'.repeat(64)}});
     batch=[old];items=[];
     await persistDraft({required:true});
     window.cropOld=old;
     window.cropOldColorCheck=false;
     let accept;
     const pending=new Promise(resolve=>{accept=resolve;});
     window.finishOldColor=()=>accept({colorEstimate:{color:'Blue'},signature:'old',aspect:1});
     checkPhoto=()=>{window.cropOldColorCheck=true;return pending;};
     cropClothingPhoto(old);
    },{ownerA,jpeg});
    await page.waitForSelector('dialog.photo-crop-editor[open]',{timeout:12000});
    await page.locator('dialog.photo-crop-editor button.primary').click();
    await page.waitForFunction(()=>window.cropOldColorCheck===true,{timeout:12000});
    const switching=await page.evaluate(async({ownerB,jpeg})=>{
     window.dispatchEvent(new Event('closet:session-locked'));
     window.closetAuth.user={id:ownerB};
     db=await openDB();
     const row=normalizeClothing({id:'same-source-id',ownerId:ownerB,category:'Shoes',itemType:'Sneakers',
      color:'Red',colorSource:'user',image:jpeg,originalPhoto:{image:jpeg,sha256:'b'.repeat(64)}});
     batch=[row];items=[];
     await persistDraft({required:true});
     const read=()=>new Promise((resolve,reject)=>{
      const request=db.transaction('state','readonly').objectStore('state').get('draft');
      request.onsuccess=()=>resolve(request.result?.batch||[]);request.onerror=()=>reject(request.error);
     });
     window.finishOldColor();
     return {before:(await read()).map(x=>({id:x.id,ownerId:x.ownerId,color:x.color}))};
    },{ownerB,jpeg});
    await page.waitForTimeout(80);
    const after=await page.evaluate(async({ownerB})=>{
     const read=()=>new Promise((resolve,reject)=>{
      const request=db.transaction('state','readonly').objectStore('state').get('draft');
      request.onsuccess=()=>resolve(request.result?.batch||[]);request.onerror=()=>reject(request.error);
     });
     const stored=await read();
     return {owner:window.closetAuth.user.id,
      stored:stored.map(x=>({id:x.id,ownerId:x.ownerId,color:x.color,hasCrop:!!x.cropBounds})),
      batch:batch.map(x=>({id:x.id,ownerId:x.ownerId,color:x.color,hasCrop:!!x.cropBounds})),
      staleDialogOpen:!!document.querySelector('dialog.photo-crop-editor[open]')};
    },{ownerB});
    assert.equal(after.owner,ownerB);
    assert.deepEqual(switching.before,[{id:'same-source-id',ownerId:ownerB,color:'Red'}]);
    assert.deepEqual(after.stored,[{id:'same-source-id',ownerId:ownerB,color:'Red',hasCrop:false}]);
    assert.deepEqual(after.batch,[{id:'same-source-id',ownerId:ownerB,color:'Red',hasCrop:false}]);
    assert.equal(after.staleDialogOpen,false);
    // The next account can still perform a normal crop and atomically write
    // its own private unsaved draft using the actual browser canvas and IDB.
    await page.evaluate(()=>{
     checkPhoto=async()=>({colorEstimate:{color:'Red'},signature:'new',aspect:1});
     cropClothingPhoto(batch[0]);
    });
    await page.waitForSelector('dialog.photo-crop-editor[open]',{timeout:12000});
    await page.locator('dialog.photo-crop-editor button.primary').click();
    await page.waitForFunction(()=>!!batch[0]?.cropBounds,{timeout:12000});
    const normal=await page.evaluate(async({ownerB})=>{
     const read=()=>new Promise((resolve,reject)=>{
      const request=db.transaction('state','readonly').objectStore('state').get('draft');
      request.onsuccess=()=>resolve(request.result?.batch||[]);request.onerror=()=>reject(request.error);
     });
     const stored=await read();
     return {correctOwner:stored.length===1&&stored[0].ownerId===ownerB,
      persistedCrop:stored[0]?.cropBounds?.width===1,
      originalJPEGRetained:stored[0]?.originalPhoto?.image===batch[0]?.originalPhoto?.image,
      currentCropVisible:!!batch[0]?.cropBounds};
    },{ownerB});
    assert.equal(normal.correctOwner,true);
    assert.equal(normal.persistedCrop,true);
    assert.equal(normal.originalJPEGRetained,true);
    assert.equal(normal.currentCropVisible,true);
    assert.equal(outside.filter(x=>x!=='/rest/v1/closet_backups').length,0);
    cases.push({engine,width,oldCropRejected:true,ownerBPrivateDraftUnchanged:true,newOwnerCropWorks:true,
     originalJPEGRetained:true,nativeIndexedDB:true,source:'actual public/index.html + app.js + crop editor',
     simulatedOwners:true,physicalDevice:false});
   }finally{await context.close();await browser.close();}
  }
 }
 assert.equal(cases.length,6);
 assert.deepEqual(errors,[]);
 const receipt={kind:'mission3-crop-owner-lease-browser',familyAlpha:'HOLD',realChromiumWebKit:true,
  realIndexedDB:true,hostedAuth:false,hostedSupabase:false,physicalDevices:false,cases,errors};
 const json=JSON.stringify(receipt,null,2)+'\n';
 await writeFile(resolve(out,'results.json'),json);
 await writeFile(resolve(out,'sha256.txt'),createHash('sha256').update(json).digest('hex')+'  results.json\n');
 console.log('PASS: six Chromium/WebKit native owner-private crop and account-switch cases; no hosted writes');
}finally{server.close();}
