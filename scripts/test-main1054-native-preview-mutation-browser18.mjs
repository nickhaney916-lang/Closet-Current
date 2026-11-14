/**
 * MAIN1054: authentic native app, real native auth.js, app IndexedDB and
 * outfit-board.js; only Supabase HTTP auth responses + synthetic JPEGs mocked.
 * Chromium/WebKit mobile viewport research, NO DEPLOY, no personal photos.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const root=resolve('.'),out=resolve('benchmark/main1054-native-preview-m18');
await mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const examples={};
for(const [name,color] of [['shirt','#315c94'],['pants','#a98a69'],['shoes','#b1b03f'],['other','#823a71']]){
 const b=await sharp({create:{width:128,height:160,channels:3,background:color}}).jpeg({quality:91}).toBuffer();
 examples[name]={sha:sha(b),image:'data:image/jpeg;base64,'+b.toString('base64')};
}
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.json':'application/json','.css':'text/css','.svg':'image/svg+xml',
 '.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(public\/|research\/|node_modules\/)/.test(path)||
   path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('blocked resource');
  const file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw Error('outside root');
  const bytes=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const host='http://127.0.0.1:'+server.address().port;
const authHost='https://hlkgymugtfbirlpunsra.supabase.co';
const results=[],errors=[],external=[],screens=[],mutationCases=[];
const cloudStub='window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};';
function fixture(owner){
 const item=(id,category,src)=>({
  id:owner+'-'+id,ownerId:owner,name:'Synthetic '+id,
  category,itemType:'Other',color:'Blue',colorSource:'user',
  sourceSHA256:examples[src].sha,sourceHashVerified:true,
  singleGarmentVerified:true,sourcePhotoOriginal:true,
  ownerReviewed:true,userAdjusted:true,confirmedCategory:true,confirmedColor:true,
  originalPhoto:{image:examples[src].image,sha256:examples[src].sha},
  image:examples[src].image,seasons:[]
 });
 return {items:[item('shirt','Tops','shirt'),item('pants','Bottoms','pants'),item('shoes','Shoes','shoes'),item('alternate','Tops','other')],
  board:{id:'outfit-board',current:{name:'Approved fixture outfit',
   slots:{top:owner+'-shirt',bottom:owner+'-pants',shoes:owner+'-shoes'}},saved:[]}};
}
let counter=0;
async function authRoute(route){
 const request=route.request(),url=new URL(request.url());
 if(url.pathname==='/auth/v1/logout')return route.fulfill({status:204,body:''});
 if(url.pathname==='/auth/v1/token'){
  let data={};try{data=JSON.parse(request.postData()||'{}')}catch{}
  const grant=url.searchParams.get('grant_type');
  const owner=grant==='password'&&/^m4-[AB]@example\.test$/.test(data.email||'')
   ?data.email.split('@')[0]:grant==='refresh_token'&&
     /^refresh-m4-[AB]$/.test(data.refresh_token||'')
    ?data.refresh_token.replace('refresh-',''):null;
  if(!owner)return route.fulfill({status:401,contentType:'application/json',
   body:JSON.stringify({msg:'Fixture auth denied'})});
  return route.fulfill({status:200,contentType:'application/json',
   body:JSON.stringify({user:{id:owner,email:owner+'@example.test'},
    access_token:'synthetic-m4-'+(++counter),
    refresh_token:'refresh-'+owner,expires_in:3600})});
 }
 return route.abort();
}
async function signin(page,owner){
 await page.locator('#authEmail').fill(owner+'@example.test');
 await page.locator('#authPassword').fill('Synthetic-Test-Only');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(o=>window.closetAuth?.user?.id===o&&
  db?.name==='closet-current-user-'+o,owner,{timeout:20000});
}
async function seed(page,owner){
 const f=fixture(owner);
 // Create fixture records using the real owner-named IndexedDB database,
 // not the app's mutable in-memory connection, which may be reopening.
 await page.evaluate(data=>new Promise((resolve,reject)=>{
  if(window.closetAuth?.user?.id!==data.owner)throw Error('fixture owner mismatch');
  const req=indexedDB.open('closet-current-user-'+data.owner,2);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains('items'))db.createObjectStore('items',{keyPath:'id'});
   if(!db.objectStoreNames.contains('state'))db.createObjectStore('state',{keyPath:'id'});
  };
  req.onerror=()=>reject(req.error);
  req.onsuccess=()=>{
   const connection=req.result;
   let tx;
   try{tx=connection.transaction(['items','state'],'readwrite');}
   catch(error){connection.close();reject(error);return;}
   for(const row of data.items)tx.objectStore('items').put(row);
   tx.objectStore('state').put(data.board);
   tx.oncomplete=()=>{connection.close();resolve();};
   tx.onerror=tx.onabort=()=>{const error=tx.error||Error('fixture IndexedDB seed refused');connection.close();reject(error);};
  };
 }),{...f,owner});
}
async function preview(page,expected){
 await page.evaluate(()=>switchView('builder'));
 await page.locator('#mission4Preview1054Section').waitFor();
 await page.locator('#mission4Preview1054Section button').click();
 await page.waitForFunction(()=>document.querySelectorAll(
  '#mission4Preview1054Photos img').length===3||
  document.querySelector('#mission4Preview1054Status')?.textContent.includes('Preview refused'),
  null,{timeout:20000});
 const refused=await page.locator('#mission4Preview1054Status').innerText();
 assert.ok(!refused.includes('Preview refused'),'native preview explicitly REFUSED despite original-source preflight');
 const data=await page.locator('#mission4Preview1054Photos img').evaluateAll(nodes=>
  nodes.map(x=>({complete:x.complete,width:x.naturalWidth,source:x.getAttribute('src')})));
 assert.equal(data.length,3);
 assert.ok(data.every(x=>x.complete&&x.width===128));
 assert.ok(data.some(x=>x.source===examples.shirt.image));
 assert.ok(data.every(x=>!x.source.includes('m4-A@')&&!x.source.includes('m4-B@')));
 const status=await page.locator('#mission4Preview1054Status').innerText();
 assert.match(status,/2D only/);assert.ok(!status.includes('3D fitted'));
 assert.equal(await page.evaluate(()=>!!document.querySelector(
  '[data-mission4-photo-preview]')),true);
 return data.length;
}
let browser,debugPage=null,debugStage='before-browser',debugEngine=null,debugWidth=null;
try{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:880},
     isMobile:true,hasTouch:true,serviceWorkers:'block'});
    await context.route('**/*',route=>{
     const url=route.request().url();
     if(url.endsWith('/public/cloud-backup.js'))return route.fulfill({
      contentType:'text/javascript',body:cloudStub});
     if(url.startsWith(host+'/')||url.startsWith('data:')||url.startsWith('blob:'+host))
      return route.continue();
     if(url.startsWith(authHost+'/auth/v1/'))return authRoute(route);
     external.push({engine:name,width,urlHost:new URL(url).hostname});
     return route.abort();
    });
    debugEngine=name;debugWidth=width;debugStage='new-page';
    const page=await context.newPage();debugPage=page;
    page.on('pageerror',error=>errors.push({engine:name,width,error:String(error)}));
    debugStage='first-document';
    await page.goto(host+'/public/index.html?mission4Preview=research',{waitUntil:'domcontentloaded'});
    debugStage='first-synthetic-signin';
    await signin(page,'m4-A');debugStage='seed-original-owner-records';await seed(page,'m4-A');
    debugStage='reload-document-after-seeding';
    await page.reload({waitUntil:'domcontentloaded'});
    debugStage='reload-signed-auth-and-private-db';
    await page.waitForFunction(()=>window.closetAuth?.user?.id==='m4-A'&&db?.name==='closet-current-user-m4-A');
    debugStage='reload-native-board-with-reviewed-original';
    await page.waitForFunction(()=>typeof currentBoard!=='undefined'&&currentBoard.slots?.top==='m4-A-shirt');
    // Call the SAME source-locked M4 preflight independently of UI. It is
    // synthetic-only, read-only and returns only status/count or static error.
    // If newly tightened M4 owner validation contradicts native auth fields,
    // explain the contract rejection instead of a misleading 30s UI timeout.
    debugStage='native-source-preflight';
    const check=await page.evaluate(async()=>{
     try{
      const {preflightOwnedOutfit1054}=await import('../research/main-thread-integration-1054/source-to-outfit.mjs');
      const output=await preflightOwnedOutfit1054({
       getSession:currentPhotoOwnerSession167,
       readOwnerItems:signedOwnerSavedRows167,
       cleanBoard:cleanOutfitBoard,
       board:structuredClone(currentBoard)
      });
      return {ok:true,count:output.slots.length,mode:output.status,
       noPrivatePixels:JSON.stringify(output).includes('data:image')===false};
     }catch(error){return {ok:false,reason:String(error?.message||error).slice(0,190)};}
    });
    console.log('MAIN1054_PUBLIC_SYNTHETIC_SOURCE_PREFLIGHT',JSON.stringify(check));
    assert.equal(check.ok,true,'source-authenticated M4 private outfit preflight refused '+(check.reason||''));
    assert.equal(check.count,3);
    assert.equal(check.noPrivatePixels,true);
    debugStage='preview-click-and-private-photo-verification';
    await preview(page,3);
    const file=name+'-'+width+'-ownerA-preview.png';
    await page.locator('#mission4Preview1054Section').screenshot({path:out+'/'+file});
    const bytes=await readFile(out+'/'+file);screens.push({name:file,sha256:sha(bytes),width,engine:name});
    // M18: Execute the ACTUAL native M17/M16 module inside the authenticated
    // owner synthetic local-browser page, not just a mocked EventTarget.
    // The additional original-photo row is legally synthetic and SHA-pinned;
    // no actual user or licensed garment pixels are supplied.
    const blank=async(label)=>{
     const count=await page.locator('#mission4Preview1054Photos img').count();
     assert.equal(count,0,'M18 '+label+' retained private original-photo pixels');
     const status=await page.evaluate(()=>mission4Preview1054Viewer?.status);
     assert.equal(status?.hasOwnerPhotos,false,'M18 '+label+' reports old photos');
     assert.equal(status?.renderAuthorized3D,false);
     mutationCases.push({engine:name,width,case:label,pass:true});
    };
    // A direct CURRENT BOARD edit does not rely on renderOutfitBoard() to
    // fire; M17's own focus observer must reject the old style context.
    await page.evaluate(()=>{
     currentBoard.occasion='Dinner';
     window.dispatchEvent(new Event('focus'));
    });
    await blank('native-live-outfit-occasion-on-focus');
    await page.evaluate(()=>{currentBoard.occasion='Casual';});
    await preview(page,3);

    // A same-signed-owner top swap may leave older JPEG DOM until the
    // viewer independently polls status; no explicit ordinary UI render.
    await page.evaluate(()=>{
     currentBoard.slots.top='m4-A-alternate';
     const status=mission4Preview1054Viewer.status;
     if(status.hasOwnerPhotos)throw Error('M18 old top source displayed');
    });
    await blank('native-live-top-slot-on-status');
    await page.evaluate(()=>{currentBoard.slots.top='m4-A-shirt';});
    await preview(page,3);

    // Auth object's identity (rather than ownerId/epoch) is captured by
    // source-exact Mission 3 provider on a real local signed browser page.
    await page.evaluate(()=>{
     const prior=window.closetAuth;
     window.closetAuth={...prior,user:prior.user,assertCurrent:()=>{}};
     try{window.dispatchEvent(new Event('focus'));}
     finally{window.closetAuth=prior;}
    });
    await blank('same-owner-auth-reference-on-focus');
    await preview(page,3);

    // The private IDB HANDLE can change without changing its db.name.
    await page.evaluate(()=>{
     const prior=db;
     db={name:prior.name};
     try{window.dispatchEvent(new Event('focus'));}
     finally{db=prior;}
    });
    await blank('same-name-private-db-reference-on-focus');
    await preview(page,3);

    // Actual native capture generation change must revoke a still-visible
    // previously verified 2D photo even for identical authenticated ID.
    await page.evaluate(()=>{
     captureOperationEpoch++;
     window.dispatchEvent(new Event('focus'));
    });
    await blank('same-owner-capture-generation-on-focus');
    await preview(page,3);

    // The real consumer app emits this inventory-commit event after source
    // changes. Exercise its actual browser event subscriber, not a proxy.
    await page.evaluate(()=>window.dispatchEvent(
     new Event('closet:style-owned-inventory-committed')));
    await blank('native-owned-wardrobe-commit-event');
    await preview(page,3);
    // User closes/cancels their authenticated session: private image pixels disappear.
    await page.evaluate(()=>window.dispatchEvent(new Event('closet:session-locked')));
    assert.equal(await page.locator('#mission4Preview1054Photos img').count(),0);
    results.push({engine:name,width,case:'native signed owner original photo preview',pass:true});
    // A changed JPEG digest cannot yield a new verified preview.
    await page.evaluate(()=>new Promise((resolve,reject)=>{
     const open=indexedDB.open('closet-current-user-m4-A',2);
     open.onerror=()=>reject(open.error);
     open.onsuccess=()=>{
      const connection=open.result,tx=connection.transaction('items','readwrite');
      const store=tx.objectStore('items'),r=store.get('m4-A-shirt');
      r.onsuccess=()=>{
       const item=r.result;
       if(!item){connection.close();reject(Error('synthetic item missing'));return;}
       item.originalPhoto.sha256='0'.repeat(64);store.put(item);
      };
      tx.oncomplete=()=>{connection.close();resolve();};
      tx.onerror=tx.onabort=()=>{const error=tx.error||Error('synthetic mutation rejected');
       connection.close();reject(error);};
     };
    }));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.evaluate(()=>switchView('builder'));
    await page.locator('#mission4Preview1054Section button').click();
    await page.waitForFunction(()=>document.querySelector(
     '#mission4Preview1054Status')?.textContent.includes('Preview refused'));
    assert.equal(await page.locator('#mission4Preview1054Photos img').count(),0);
    results.push({engine:name,width,case:'changed original source rejected',pass:true});
    debugStage='close-completed-width';await context.close();debugPage=null;
   }
  }finally{await browser.close();browser=null;}
 }
 assert.equal(errors.length,0,'native browser JS exceptions');
 assert.equal(results.length,12);
 assert.equal(mutationCases.length,36,'M18 exact six source mutation cases per browser/width');
 assert.ok(mutationCases.every(x=>x.pass===true));
 assert.equal(screens.length,6);
 for(const image of screens)assert.equal(sha(await readFile(out+'/'+image.name)),image.sha256);
 await writeFile(out+'/results-m18.json',JSON.stringify({results,mutationCases,screens,
  sourceFixture:'synthetic generated JPEG color panels, NOT real clothing photos',
  realModelInference:false,realPrivateCloud:false,physicalDevice:false,releaseAuthorized:false,
  familyAlpha:'HOLD'},null,2));
 console.log('MAIN1054 12/12 Chromium/WebKit native-auth photo preview scenarios passed; 6 synthetic screenshots');
 console.log('MAIN1054_M18 36/36 native-browser original-photo board, auth/DB/capture/commit revocation cases passed; baseline 12/12; synthetic signed owners and JPEGs only');
}catch(error){
 // The research fixture uses synthetic owners and generated JPEGs ONLY.
 // Emit redacted startup states so a browser regression is never dismissed as
 // "flaky" or mistaken for a successful 2D acceptance.
 let startup=null;
 try{
  startup=await debugPage?.evaluate(()=>({
   authenticated:!!window.closetAuth?.user?.id,
   rightSyntheticOwner:window.closetAuth?.user?.id==='m4-A',
   privateDbBound:typeof db!=='undefined'&&db?.name==='closet-current-user-m4-A',
   boardInitialized:typeof boardInitialized!=='undefined'&&boardInitialized===true,
   hasExpectedSourceSlot:typeof currentBoard!=='undefined'&&currentBoard?.slots?.top==='m4-A-shirt',
   recordCount:typeof items!=='undefined'&&Array.isArray(items)?items.length:null,
   visibleLogin:document.getElementById('authGate')?.hidden===false,
   previewPanel:!!document.getElementById('mission4Preview1054Section')
  }));
 }catch{}
 console.error('MAIN1054 failed',String(error),{
  stage:debugStage,engine:debugEngine,width:debugWidth,startup,errors,external
 });
 process.exitCode=1;
}
finally{if(browser)await browser.close();await new Promise(done=>server.close(done));}
