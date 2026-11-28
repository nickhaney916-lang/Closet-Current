/**
 * P99 NORMAL-APP E2E, HOLD #255. Unflagged built Home -> gallery -> Adjust
 * (explicit TEST owner) -> private closet -> Outfit Builder -> source-verified
 * 2D -> native v3 download/restore. Genuine Chromium/WebKit engine.
 * Synthetic auth HTTP, synthetic human labels: NOT hosted RLS or real accuracy.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {createPhotoContainmentAudit} from './p1607-photo-containment.mjs';
const engine=process.env.P99_ENGINE||'chromium';
const width=Number(process.env.P99_WIDTH||390);
assert(['chromium','webkit'].includes(engine)&&[320,390,430].includes(width));
const loadOriginal=async name=>{
 const bytes=await readFile('benchmark/fixtures/'+name+'.jpg');
 assert.equal(bytes[0],255);assert.equal(bytes[1],216);
 return {name,bytes,sha:createHash('sha256').update(bytes).digest('hex'),
  url:'data:image/jpeg;base64,'+bytes.toString('base64')};
};
const originals=await Promise.all(['commons-0003','commons-0023'].map(loadOriginal));
assert.notEqual(originals[0].sha,originals[1].sha);
const secondOriginal=process.env.P1607_AUDIT==='1'?await loadOriginal('commons-0002'):null;
const audit=secondOriginal?createPhotoContainmentAudit(originals,secondOriginal):null;
const cacheOnly=Boolean(audit&&process.env.P1607_CACHE_ONLY==='1');
const checkServiceWorker=Boolean(audit&&(engine==='chromium'||cacheOnly));
const title=label=>audit?label+' '+audit.canary:label;
const shirtName=title('P99 Black Shirt'),jeansName=title('P99 Blue Jeans'),outfitName=title('P99 Unflagged Saved Outfit');
const clean=value=>audit?.redact(value)??String(value);
const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
for(const source of secondOriginal?[...originals,secondOriginal]:originals)
 assert.equal(locked.find(x=>x.id===source.name)?.sha256,source.sha);
if(secondOriginal)assert.ok(originals.every(source=>source.sha!==secondOriginal.sha));
const out=resolve('benchmark/parallel99-normal-journey',engine,String(width));
await mkdir(out,{recursive:true});
const root=resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.jpg':'image/jpeg',
 '.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const authOrigin='https://hlkgymugtfbirlpunsra.supabase.co';
const cloudStub='window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};';
const fixtureScripts=new Map();
const integrity=bytes=>'sha384-'+createHash('sha384').update(bytes).digest('base64');
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(audit&&pathname.startsWith('/auth/v1/')){
   let input={};
   try{
    let body='';
    for await(const chunk of req){body+=chunk;if(body.length>8192)throw Error('auth fixture too large');}
    input=JSON.parse(body||'{}');
   }catch{res.writeHead(400).end();return;}
   const result=authReply(new URL(req.url,'http://localhost'),input);
   res.writeHead(result.status,{'content-type':'application/json','cache-control':'no-store'});
   res.end(result.body);return;
  }
  if(req.method!=='GET'||pathname.includes('\\')||pathname.includes('\0')||
    pathname.split('/').includes('..'))throw Error('invalid path');
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+'/'))throw Error('nonpublic path');
  let bytes=await readFile(file);
  if(fixtureScripts.has(pathname))bytes=fixtureScripts.get(pathname).bytes;
  if(audit&&['/','/index.html','/sw.js'].includes(pathname)){
   let source=bytes.toString();
   // Keep both integrity checks active for the loopback-only auth and cloud fixtures.
   for(const {before,after} of fixtureScripts.values()){
    assert.ok(source.includes(before),'built fixture integrity entry is missing');
    source=source.replaceAll(before,after);
   }
   bytes=Buffer.from(source);
  }
  const localWorkerOnly=audit&&/^\/(local|outfit)-worker\.mjs$/.test(pathname);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store',
   // Playwright routing does not consistently cover WebKit worker loads
   // when the actual service worker controls the page. Keep this audit's
   // worker assets loopback-only and exercise the normal unavailable path.
   ...(localWorkerOnly?{'content-security-policy':"script-src 'self'; connect-src 'self' data: blob:"}:{})
  });res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
if(audit){
 for(const [path,replace] of [
  ['/auth.js',source=>{
   assert.ok(source.includes(authOrigin),'exact browser auth configuration changed');
   return source.replace(authOrigin,origin);
  }],
  ['/cloud-backup.js',()=>cloudStub],
 ]){
  const original=await readFile(join(root,path));
  const bytes=Buffer.from(replace(original.toString()));
  fixtureScripts.set(path,{bytes,before:integrity(original),after:integrity(bytes)});
 }
}
const stages=[],errors=[],outbound=[],started=Date.now();
let browser,context,page,stage='startup',backup=null;
const seenRefresh=new Map();
const receipt=()=>({engine,width,stage,stages,errors:errors.slice(0,8),
 outbound:outbound.slice(0,8),elapsedMs:Date.now()-started,
 licensedPublicJpegs:originals.map(x=>({id:x.name,sha256:x.sha})),
 normalMode:true,researchFlags:false,syntheticOwnerLabels:true,fixtureScriptIntegrity:audit!==null,
 syntheticAuth:true,realInstalledModelPredictionsVerified:false,
 verifiedHostedRLS:false,physicalPhone:false,photoFitted3D:false,
 familyAlpha:'HOLD',releaseAuthorized:false});
const advance=value=>{stage=value;stages.push(value);};
function authReply(url,input){
 if(url.pathname==='/auth/v1/logout')return {status:204,body:''};
 if(url.pathname!=='/auth/v1/token'){
  errors.push('auth endpoint mismatch');return {status:404,body:'{}'};
 }
 const grant=url.searchParams.get('grant_type');
 const owner=grant==='password'&&/^p99-[AB]@example\.test$/.test(input.email||'')?
  input.email.split('@')[0]:grant==='refresh_token'?seenRefresh.get(input.refresh_token):null;
 if(!owner)return {status:401,body:'{}'};
 const token='p99-refresh-'+owner;
 seenRefresh.set(token,owner);
 return {status:200,body:JSON.stringify({
  user:{id:owner,email:owner+'@example.test'},access_token:'p99-token-'+owner,
  refresh_token:token,expires_in:3600
 })};
}
function authRoute(route){
 const req=route.request();
 let input={};try{input=JSON.parse(req.postData()||'{}');}catch{}
 return route.fulfill({...authReply(new URL(req.url()),input),contentType:'application/json'});
}
const rowCount=()=>page.evaluate(()=>new Promise((resolve,reject)=>{
 const r=db.transaction('items','readonly').objectStore('items').count();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
}));
async function signIn(owner){
 await page.locator('#authEmail').fill(owner+'@example.test');
 await page.locator('#authPassword').fill('synthetic fixture only');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(id=>window.closetAuth?.user?.id===id&&
  db?.name==='closet-current-user-'+id&&
  document.querySelector('#appShell')?.hidden===false,owner,{timeout:30000});
}
async function addFromNormalChooser(source,name,category,subtype,color,secondOwner=false){
 advance('home-add-gallery-'+category);
 await page.locator('nav.main-nav button.tab[data-view="home"]').click();
 await page.locator('#home button.home-action[data-go-view="scan"]').click();
 assert.equal(await page.locator('#scan').isVisible(),true);
 await page.locator('details.saved-imports summary').click();
 assert.equal(await rowCount(),category==='Tops'?0:1,'no model auto-save before explicit review');
 await page.locator('#clothingPhotos').setInputFiles({
  name:source.name+'.jpg',mimeType:'image/jpeg',buffer:source.bytes
 });
 await page.locator('#reviewGrid .photo-result button:has-text("Adjust")').first()
  .waitFor({state:'visible',timeout:35000});
 const before=await rowCount();
 assert.equal(before,category==='Tops'?0:1,'unreviewed model output silently saved');
 advance('explicit-owner-review-'+category);
  // Verify the selected current photo and capture actual trusted click evidence.
  const adjust=page.locator('#reviewGrid .photo-result button:has-text("Adjust")').first();
  await page.waitForFunction(sha=>{
   const item=batch[0],card=document.querySelector('#reviewGrid .photo-result');
   return item?.sourceSHA256===sha&&card?.querySelector('img')?.getAttribute('src')===item.image;
  },source.sha);
  await adjust.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
  await page.evaluate(sha=>{
   window.__p99AdjustReceipt={trusted:false,matched:false,sourceMatched:false,pending:null};
   document.addEventListener('click',event=>{
    const target=event.target?.closest?.('#reviewGrid .photo-result button');
    const card=target?.closest('.photo-result'),item=batch[0];
    window.__p99AdjustReceipt={
     trusted:event.isTrusted,matched:target?.textContent==='Adjust',
     sourceMatched:item?.sourceSHA256===sha&&card?.querySelector('img')?.getAttribute('src')===item.image,
     pending:item?localPending.has(item.id):null
    };
   },{capture:true,once:true});
  },source.sha);
  const editor=page.locator('dialog.photo-adjust');
  try{
   await adjust.click();
   await editor.waitFor({state:'visible'});
   const click=await page.evaluate(()=>window.__p99AdjustReceipt);
   assert.equal(click.trusted,true,'owner review requires a trusted click');
   assert.equal(click.matched,true,'owner review must target Adjust');
   assert.equal(click.sourceMatched,true,'owner review must target the exact original');
  }catch(error){
   const receipt=await page.evaluate(sha=>({
    click:window.__p99AdjustReceipt,ownerReady:!!window.closetAuth?.user?.id,
    firstSourceMatches:batch[0]?.sourceSHA256===sha,
    pending:batch[0]?localPending.has(batch[0].id):null,
    reviewCards:document.querySelectorAll('#reviewGrid .photo-result').length,
    openDialogs:document.querySelectorAll('dialog[open]').length
   }),source.sha).catch(()=>({unavailable:true}));
   console.log('MAIN1054_REVIEW_DIAGNOSTIC',JSON.stringify({engine,width,category,...receipt}));
   throw error;
  }
 await editor.getByLabel('Item name').fill(name);
 if(audit){
  await editor.locator('details.optional-details summary').click();
  await editor.getByLabel('Notes',{exact:true}).fill('Private review '+(secondOwner?audit.secondCanary:audit.canary));
 }
 await editor.getByLabel('Main category').selectOption(category);
 await editor.getByLabel('Item type').selectOption(subtype);
 await editor.getByLabel('Color',{exact:true}).fill(color);
 await editor.getByLabel('I verified the category, clothing type and color').check();
 await editor.getByLabel('I confirmed this photo shows one garment').check();
 await editor.getByRole('button',{name:'Save changes'}).click();
 await page.waitForFunction(n=>document.querySelector('#closetCount')?.textContent===String(n),
  before+1,{timeout:30000});
 await editor.waitFor({state:'hidden',timeout:15000});
 assert.equal(await rowCount(),before+1);
}
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true,
  ...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 context=await browser.newContext({
  viewport:{width,height:920},isMobile:true,hasTouch:true,
  serviceWorkers:checkServiceWorker?'allow':'block',acceptDownloads:true
 });
 if(audit){
  await audit.watchObjectURLs(context);
  context.on('request',request=>audit.request(request,origin,origin));
  await context.routeWebSocket('**/*',socket=>socket.close());
 }
 await context.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.origin===origin||u.protocol==='blob:'||u.protocol==='data:')
   return route.continue();
  if(!audit&&u.origin===authOrigin&&u.pathname.startsWith('/auth/v1/'))
   return authRoute(route);
  outbound.push({host:u.hostname,method:route.request().method()});
  return route.abort();
 });
 // Only cloud transport is fake; all visible capture, review, board, source,
 // export/import UI and IndexedDB are actual PWA code.
 if(!audit)await context.route('**/cloud-backup.js*',route=>
  route.fulfill({status:200,contentType:'text/javascript',body:cloudStub}));
 page=await context.newPage();
 audit?.attach(page);
 page.on('pageerror',e=>errors.push('pageerror: '+clean(e.message).slice(0,120)));
 page.on('crash',()=>errors.push('browser crash'));
 advance('open-unflagged-native-home');
 await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});
 assert.equal(new URL(page.url()).search,'','normal app must not require query flags');
 await signIn('p99-A');
 if(checkServiceWorker)await page.waitForFunction(async ()=>(await caches.keys()).some(name=>name.startsWith('closet-current-')),
  null,{timeout:20000});
 assert.equal(await page.locator('#home').isVisible(),true);
 advance('default-unreviewed-source-preview-refuses');
 await page.locator('#moreMenu summary').click();
 await page.locator('#moreMenu button.tab[data-view="builder"]').click();
 await page.locator('#mission4Preview1054Section button').click();
 await page.waitForFunction(()=>/Preview refused|Choose a signed-owner saved outfit/i.test(
  document.querySelector('#mission4Preview1054Status')?.textContent||''),null,{timeout:15000});
 assert.equal(await page.locator('#mission4Preview1054Photos img').count(),0);
 await page.locator('nav.main-nav button.tab[data-view="home"]').click();
 await addFromNormalChooser(originals[0],shirtName,'Tops','T-shirt','Black');
 await addFromNormalChooser(originals[1],jeansName,'Bottoms','Jeans','Blue');
 advance('owner-private-closet-and-source-check');
 await page.locator('nav.main-nav button.tab[data-view="closet"]').click();
 assert.equal(await page.locator('#closetCount').innerText(),'2');
 const sourceAudit=await page.evaluate(async()=>{
  const read=await new Promise((resolve,reject)=>{
   const r=db.transaction('items').objectStore('items').getAll();
   r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  return Promise.all(read.map(async x=>{
   const base64=(x.originalPhoto?.image||'').split(',')[1]||'';
   const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
   const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
   const sha=[...digest].map(n=>n.toString(16).padStart(2,'0')).join('');
   return {name:x.name,sha,receipt:x.sourceSHA256,
    ownerPrivate:x.ownerId==='p99-A',ownerReviewed:x.ownerReviewed===true,
    colorSource:x.colorSource,ready3D:x.threeDReady===true};
  }));
 });
 for(const [name,source] of [[shirtName,originals[0]],[jeansName,originals[1]]]){
  const row=sourceAudit.find(r=>r.name===name);assert(row,'reviewed normal row absent');
  assert.equal(row.sha,source.sha);assert.equal(row.receipt,source.sha);
  assert.equal(row.ownerPrivate,true);assert.equal(row.ownerReviewed,true);
  assert.equal(row.colorSource,'user');assert.equal(row.ready3D,false);
 }
 advance('normal-chooser-cancel-duplicate-and-oversize-no-write');
 await page.locator('nav.main-nav button.tab[data-view="home"]').click();
 await page.locator('#home button.home-action[data-go-view="scan"]').click();
 await page.locator('#clothingPhotos').setInputFiles([]);
 assert.equal(await rowCount(),2,'cancelled chooser changed saved closet');
 await page.locator('#clothingPhotos').setInputFiles({
  name:'duplicate-original.jpg',mimeType:'image/jpeg',buffer:originals[0].bytes
 });
 await page.waitForFunction(()=>!photoImportActive,null,{timeout:20000});
 assert.equal(await rowCount(),2,'duplicate saved the same source twice');
 assert.equal(await page.evaluate(()=>window.__lastPhotoImportResult?.results?.[0]?.status),'duplicate');
 await page.locator('#clothingPhotos').setInputFiles({
  name:'oversized.jpg',mimeType:'image/jpeg',buffer:Buffer.alloc(10*1024*1024+1)
 });
 await page.waitForFunction(()=>!photoImportActive,null,{timeout:20000});
 assert.equal(await rowCount(),2,'oversized file changed saved closet');
 assert.equal(await page.evaluate(()=>window.__lastPhotoImportResult?.results?.[0]?.status),'rejected');
 advance('native-outfit-builder-via-more-menu');
 await page.locator('#moreMenu summary').click();
 await page.locator('#moreMenu button.tab[data-view="builder"]').click();
 assert.equal(await page.locator('#builder').isVisible(),true);
 assert.equal(await page.locator('#mission4Preview1054Section button').isVisible(),true,
  'P99 verified original 2D control missing in standard app');
 for(const [slot,name] of [['top',shirtName],['bottom',jeansName]]){
  await page.locator('#boardSlots .board-slot-'+slot).click();
  await page.locator('#boardPicker').waitFor({state:'visible'});
  await page.locator('#boardPickerItems button.board-pick').filter({hasText:name}).click();
 }
 await page.locator('#boardName').fill(outfitName);
 await page.locator('#boardOccasion').selectOption('Dinner');
 await page.locator('#saveBoard').click();
 await page.waitForFunction(name=>document.querySelector('#savedBoards')?.textContent?.includes(name),outfitName,{timeout:25000});
 advance('source-attested-default-outfit-preview');
 await page.locator('#mission4Preview1054Section button').click();
 await page.waitForFunction(()=>document.querySelectorAll(
  '#mission4Preview1054Photos img').length===2,null,{timeout:30000});
 const imgURLs=await page.locator('#mission4Preview1054Photos img').evaluateAll(
  imgs=>imgs.map(img=>img.getAttribute('src')));
 for(const original of originals)assert(imgURLs.includes(original.url),
  'verified display substituted a thumbnail or other source');
 assert.match(await page.locator('#mission4Preview1054Status').innerText(),/2D only/);
 assert.equal(await page.locator('#outfit3D01Canvas').count(),0);
 const firstStorage=await audit?.storage(page);
 if(checkServiceWorker)assert.ok(firstStorage.cacheEntries>0,'static service worker cache was not populated');
 if(!cacheOnly){
  advance('normal-v3-private-export');
  await page.locator('nav.main-nav button.tab[data-view="closet"]').click();
  await page.locator('details.closet-backup summary').click();
  const downloadPromise=page.waitForEvent('download',{timeout:25000});
  await page.locator('#export').click();
  const downloaded=await downloadPromise;
  backup=await readFile(await downloaded.path());
  const data=JSON.parse(backup.toString());
  assert.equal(data.version,3);assert.equal(data.items.length,2);
  assert(data.outfitBoard?.saved?.some(x=>x.name===outfitName));
  await audit?.verifyObjectURLCleanup(page);
  advance('normal-reload-and-restore');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#appShell')?.hidden===false&&
   document.querySelector('#closetCount')?.textContent==='2',null,{timeout:30000});
  await page.locator('#moreMenu summary').click();
  await page.locator('#moreMenu button.tab[data-view="builder"]').click();
  assert(await page.locator('#savedBoards').innerText().then(t=>
   t.includes(outfitName)));
  // Genuine file input + browser confirmation; never write IndexedDB directly.
  page.on('dialog',dialog=>dialog.accept());
  await page.locator('nav.main-nav button.tab[data-view="closet"]').click();
  await page.locator('#import').setInputFiles({
   name:'p99-native-v3-backup.json',mimeType:'application/json',buffer:backup
  });
  await page.waitForFunction(()=>/restored|imported/i.test(
   document.querySelector('#message')?.textContent||''),null,{timeout:30000});
  if(!await page.locator('#moreMenu').evaluate(e=>e.open))await page.locator('#moreMenu summary').click();
  await page.locator('#moreMenu button.tab[data-view="builder"]').click();
  await page.locator('#savedBoards button').filter({hasText:outfitName}).first().click();
  await page.locator('#mission4Preview1054Section button').click();
  await page.waitForFunction(()=>document.querySelectorAll(
   '#mission4Preview1054Photos img').length===2,null,{timeout:30000});
  advance('offline-warm-session-original-preview');
  await context.setOffline(true);
  try{
   await page.locator('#mission4Preview1054Section button').click();
   await page.waitForFunction(()=>document.querySelectorAll('#mission4Preview1054Photos img').length===2,
    null,{timeout:20000});
  }finally{await context.setOffline(false);}
  advance('source-mutation-revokes-current-original-pixels');
  await page.evaluate(()=>{
   const selected=items.find(x=>x.id===currentBoard.slots.top);
   selected.originalPhoto.image='data:image/jpeg;base64,AA==';
   renderOutfitBoard();
  });
  assert.equal(await page.locator('#mission4Preview1054Photos img').count(),0);
  await page.locator('#mission4Preview1054Section button').click();
  assert.equal(await page.locator('#mission4Preview1054Photos img').count(),0);
 }
 advance('logout-and-other-owner-no-original-pixels');
 await page.locator('.account-menu summary').click();
 await page.locator('#logout').click();
 await page.waitForFunction(()=>document.querySelector('#authGate')?.hidden===false,
  null,{timeout:30000});
 assert.equal(await page.locator('#mission4Preview1054Photos img').count(),0);
 await signIn('p99-B');
 assert.equal(await page.locator('#closetCount').innerText(),'0',
  'different owner received saved first-owner clothes');
 await page.locator('#moreMenu summary').click();
 await page.locator('#moreMenu button.tab[data-view="builder"]').click();
 assert.equal(await page.locator('#mission4Preview1054Photos img').count(),0);
 await page.locator('#mission4Preview1054Section button').click();
 assert.equal(await page.locator('#mission4Preview1054Photos img').count(),0);
 if(audit){
  await audit.storage(page,{secondOwner:true});
  await addFromNormalChooser(secondOriginal,'Owner B '+audit.secondCanary,'Tops','T-shirt','Blue',true);
  const ownOriginal=await page.evaluate(expected=>{
   return items.length===1&&items[0].ownerId==='p99-B'&&items[0].sourceSHA256===expected;
  },secondOriginal.sha);
  assert.equal(ownOriginal,true,'second owner must retain their distinct source');
 }
 const secondStorage=await audit?.storage(page,{secondOwner:true});
 const containment=audit?.verify();
 if(audit)console.log('P1607_PHOTO_CONTAINMENT_PASS',JSON.stringify({
  engine,browserVersion:browser.version(),width,firstStorage,secondStorage,serviceWorker:checkServiceWorker,
  fullJourney:!cacheOnly,objectURLsRevoked:!cacheOnly,...containment
 }));
 advance('final-success');
 assert.deepEqual(errors,[],'native browser page exception');
 if(!cacheOnly){
  await writeFile(join(out,'P99-NORMAL-APP.json'),JSON.stringify({
   ...receipt(),normalPhotoCapture:true,explicitReviewCount:2,reviewedPrivateItems:2,
   normalBuilderSaved:true,attested2DOriginals:2,v3Restore:true,
   changedSourceRevocation:true,threeDDenied:true,
   cancelledChooserNoWrite:true,duplicateNoWrite:true,oversizeNoWrite:true,
   warmOfflinePreview:true,ownerSwapNoDisclosure:true,unreviewedPreviewRefused:true
  },null,2)+'\n');
  console.log('P99_NORMAL_APP_PASS',JSON.stringify({engine,width,
   reviewedItems:2,attested2D:2,v3Restore:true,sourceRevoked:true,hold:true}));
 }
}catch(error){
 errors.push(clean(error.message||error).slice(0,300));
 await writeFile(join(out,'P99-NORMAL-APP-FAIL.json'),
  JSON.stringify(receipt(),null,2)+'\n');
 if(page&&!audit){try{await page.screenshot({path:join(out,'P99-SCREEN.png')});}catch{}}
 throw Error('P99 '+engine+' '+width+' '+stage+': '+clean(error.message||error).slice(0,350));
}finally{
 await context?.close();await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
