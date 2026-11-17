/** P94 native P88 installed worker integration: copied byte-for-byte assertions from M58 96ba2f5ee2420de52f45911881fdcc139455c353; only source routing, output and viewport differ. */
/**
 * MAIN1054 M58: actual unmodified P88 module Worker, browser WASM fp32
 * SegFormer, SHA-locked public original JPEG, and native MULTI24 owner review.
 * NO mock Worker, NO fake logits, NO synthetic model replies.
 * Signed auth HTTP is deliberately synthetic; hosted RLS is NOT tested.
 *
 * P94 installed native worker; NO scratch donor extraction, model imitation or replacement default worker.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,extname} from 'node:path';
import {performance} from 'node:perf_hooks';
import {chromium,webkit} from 'playwright';
import {mutateOwnerItem91} from './lib/owner-item-mutation91.mjs';
// P96: Genuine model on a 4K-sized JPEG rendered from a legally licensed
// public donor; upscaling is NOT equivalent to captured native 4K detail.
const donor=await readFile('benchmark/fixtures/commons-0003.jpg');
const donorSHA=createHash('sha256').update(donor).digest('hex');
const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'))
 .find(x=>x.id==='commons-0003');
assert.ok(locked?.verified&&locked.sha256===donorSHA);
const rasterBrowser=await chromium.launch({headless:true,args:['--no-sandbox']});
let upscaled;
try{
 const rasterPage=await rasterBrowser.newPage();
 upscaled=await rasterPage.evaluate(async data=>{
  const source=new Image();source.src=data;await source.decode();
  const scale=4096/Math.max(source.naturalWidth,source.naturalHeight);
  const width=Math.round(source.naturalWidth*scale);
  const height=Math.round(source.naturalHeight*scale);
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw Error('no raster canvas');
  ctx.drawImage(source,0,0,width,height);
  return {width,height,jpeg:canvas.toDataURL('image/jpeg',.89)};
 },'data:image/jpeg;base64,'+donor.toString('base64'));
}finally{await rasterBrowser.close();}
const file=Buffer.from(upscaled.jpeg.split(',')[1],'base64');
const sha=createHash('sha256').update(file).digest('hex');
assert.ok(Math.max(upscaled.width,upscaled.height)===4096);
assert.ok(upscaled.width*upscaled.height<=24_000_000);
assert.ok(file.length>=128&&file.length<=8*1024*1024);
assert.notEqual(sha,donorSHA,'4K source must have its own SHA');
assert.equal(file[0],255);assert.equal(file[1],216);
const engine=process.env.M58_ENGINE||'chromium';
assert.ok(['chromium','webkit'].includes(engine),'Only the two pinned browser engines are allowed');
const width=Number(process.env.P94_WIDTH||390);
assert.ok([320,390,430].includes(width),'P94 requires the pinned mobile viewport widths');
const browserType=engine==='webkit'?webkit:chromium;
const out=resolve('benchmark/parallel96-highres-p88-browser',engine,String(width));
await mkdir(out,{recursive:true});
const root=resolve('.');
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.css':'text/css','.json':'application/json','.jpg':'image/jpeg',
 '.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(req.method!=='GET'||!['/public/','/research/','/benchmark/','/node_modules/'].some(prefix=>path.startsWith(prefix))||
     path.includes(String.fromCharCode(92))||path.includes(String.fromCharCode(0))||path.split('/').includes('..'))
   throw Error('not a source-only local asset');
  const absolute=resolve(root,'.'+path);
  if(!absolute.startsWith(root+'/'))throw Error('path escaped repository');
  const body=await readFile(absolute);
  res.writeHead(200,{'content-type':mime[extname(absolute)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('M58 fixture asset not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const auth='https://hlkgymugtfbirlpunsra.supabase.co';
const cloudStub='window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};';
const external=[],rejected=[],issues=[],modelResponses=[];
const navigationReasonsM69=[],mainFrameNavigationsM69=[],documentLifecycle91=[];
let browser,stage='startup';
const started=performance.now();
// M72: a real page reload runs the native refresh-token flow. This disposable
// auth fixture must support ONLY tokens it previously issued via a validated
// synthetic password login. Never accept a guessed owner from a refresh body.
const issuedSyntheticRefreshM72=new Map();
function authFixture(route){
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/auth/v1/logout')return route.fulfill({status:204,body:''});
 if(url.pathname==='/auth/v1/token'){
  const info=JSON.parse(req.postData()||'{}');
  const grant=url.searchParams.get('grant_type');
  const owner=grant==='password'&&
   /^m58-[AB]@example\.test$/.test(info.email||'')?
    info.email.split('@')[0]:
    grant==='refresh_token'?issuedSyntheticRefreshM72.get(info.refresh_token):null;
  if(!owner)return route.fulfill({status:401,contentType:'application/json',body:'{"error":"fixture-only"}'});
  const token='synthetic-m58-refresh-'+owner;
  issuedSyntheticRefreshM72.set(token,owner);
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   user:{id:owner,email:owner+'@example.test'},access_token:'synthetic-'+owner,
   refresh_token:token,expires_in:3600
  })});
 }
 issues.push('unexpected-auth-endpoint');return route.abort();
}
const countRows=page=>page.evaluate(()=>new Promise((resolve,reject)=>{
 const req=db.transaction('items','readonly').objectStore('items').count();
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
}));
try{
 browser=await browserType.launch(engine==='chromium'?{headless:true,args:['--no-sandbox']}:{headless:true});
 const context=await browser.newContext({
  viewport:{width,height:920},isMobile:true,hasTouch:true,acceptDownloads:true,
  serviceWorkers:'block'
 });
 await context.route('**/*',route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.href===origin+'/public/cloud-backup.js')
   return route.fulfill({status:200,contentType:'text/javascript',body:cloudStub});
  if(url.origin===origin||url.protocol==='blob:'||url.protocol==='data:')
   return route.continue();
  if(url.origin===auth&&url.pathname.startsWith('/auth/v1/'))
   return authFixture(route);
  // Strict public model asset egress only, and NEVER a POST from original.
  const h=url.hostname;
  const lib=h==='cdn.jsdelivr.net'&&
   url.pathname.startsWith('/npm/@huggingface/transformers@3.8.1/dist/')&&
   ['.js','.mjs','.wasm'].some(ext=>url.pathname.endsWith(ext));
  const hub=h==='huggingface.co'&&
   url.pathname.startsWith('/Xenova/segformer_b0_clothes/');
  const weights=h==='cdn-lfs.huggingface.co'||h.endsWith('.hf.co')||
   h==='cas-bridge.xethub.hf.co';
  if(req.method()==='GET'&&(lib||hub||weights)){
   external.push({host:h,type:lib?'pinned-browser-library':hub?'pinned-model-hub':'model-binary-cdn'});
   return route.continue();
  }
  // Third-party styles, analytics and all unrelated hosts cannot fetch originals.
  if(req.method()==='GET'&&
     ['fonts.googleapis.com','fonts.gstatic.com','raw.githubusercontent.com'].includes(h))
   return route.abort();
  rejected.push({host:h,method:req.method(),path:url.pathname.slice(0,100)});
  return route.abort();
 });
 await context.exposeBinding('__p91Lifecycle',(_source,event)=>{
  documentLifecycle91.push({event:event.type,document:event.document,stage,elapsedMs:Math.round(performance.now()-started)});
 });
 await context.addInitScript(()=>{
  window.__document91=crypto.randomUUID();
  for(const type of ['DOMContentLoaded','pageshow','pagehide','beforeunload'])
   window.addEventListener(type,()=>window.__p91Lifecycle({type,document:window.__document91}));
 });
 const page=await context.newPage();
 const actualWorkerPaths94=[];
 page.on('worker',worker=>{
  try{actualWorkerPaths94.push(new URL(worker.url()).pathname);}
  catch{actualWorkerPaths94.push('invalid-worker-url');}
 });
 // M69: reproducible no-deploy diagnostics for the intermittent A→B→A
 // navigation that can invalidate the M67 original-JPEG IDB mutation.
 // Record stage, navigation reason and PATH ONLY (never private URLs/tokens).
 const pathOnly=value=>{try{return new URL(value).pathname;}catch{return 'invalid';}};
 page.on('framenavigated',frame=>{
  if(frame===page.mainFrame())mainFrameNavigationsM69.push({
   stage,path:pathOnly(frame.url()),elapsedMs:Math.round(performance.now()-started)
  });
 });
 if(engine==='chromium'){
  const cdp=await context.newCDPSession(page);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  for(const name of ['Runtime.executionContextDestroyed','Runtime.executionContextsCleared','Page.frameNavigated','Page.navigatedWithinDocument'])
   cdp.on(name,()=>documentLifecycle91.push({event:name,stage,elapsedMs:Math.round(performance.now()-started)}));
  cdp.on('Page.frameRequestedNavigation',event=>{
   navigationReasonsM69.push({
    stage,reason:event.reason,disposition:event.disposition,
    path:pathOnly(event.url),elapsedMs:Math.round(performance.now()-started)
   });
  });
 }
 page.on('pageerror',e=>issues.push('pageerror-'+String(e.message).slice(0,120)));
 page.on('crash',()=>issues.push('browser-crash'));
 context.on('response',res=>{
  const u=new URL(res.url());
  if(u.hostname==='cdn.jsdelivr.net'||u.hostname==='huggingface.co'||u.hostname.endsWith('.hf.co')){
   modelResponses.push({host:u.hostname,status:res.status()});
  }
 });
 stage='sign-in';
 const params='multi24=research&parallel94Assembly=research&parallel96HiRes=research&captureProof01=after&index04=after&nativeLossless04=research&nativeIndex07=research&index02=after&restoreAtomic01=research&styleOwned03=research&nativeCorrection10=research&mission4Preview=research&reviewedPhotoGallery59=research';
 await page.goto(origin+'/public/index.html?'+params,{waitUntil:'domcontentloaded'});
 await page.locator('#authEmail').fill('m58-A@example.test');
 await page.locator('#authPassword').fill('fixture-only');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(()=>window.closetAuth?.user?.id==='m58-A'&&
  db?.name==='closet-current-user-m58-A',null,{timeout:45000});
 await page.waitForFunction(()=>window.multi24Research?.active===true&&
  window.multi24Research.debug().p88Transport57===true,null,{timeout:45000});
 stage='genuine worker original JPEG and live SegFormer';
 await page.evaluate(()=>switchView('scan'));
 await page.locator('#captureOutfit').click();
 await page.locator('#outfitUpload').setInputFiles({
  name:'commons-0003.jpg',mimeType:'image/jpeg',buffer:file
 });
 await page.waitForFunction(expected=>
   window.multi24Research?.debug().sourceSHA256===expected,
   sha,{timeout:45000});
 await page.waitForFunction(()=>{
  const d=window.multi24Research?.debug();
  return d&&!d.working&&(/unverified region|Automatic extraction unavailable|could not start|timed out/i.test(
   document.getElementById('multi24Status')?.textContent||''));
 },null,{timeout:420000});
 const state=await page.evaluate(()=>({
  debug:window.multi24Research?.debug(),
  status:document.getElementById('multi24Status')?.textContent||'',
  cards:document.querySelectorAll('#multi24Grid .multi24-card').length
 }));
 assert.ok(external.some(x=>x.type==='pinned-browser-library'),
  'No real worker attempted the pinned CDN import');
 assert.ok(external.some(x=>x.type==='pinned-model-hub')||
  modelResponses.some(x=>x.host==='huggingface.co'),
  'No genuine model hub request was attempted');
 assert.ok(modelResponses.some(x=>x.status>=200&&x.status<300),
  'No pinned model/library network resource succeeded');
 assert.equal(state.debug.sourceSHA256,sha);
 assert.equal(state.debug.p88Transport57,true);
 assert.equal(state.debug.parallel96HiRes,true);
 assert.ok(state.debug.inference96,'4K original did not open model-derivative adapter');
 assert.equal(state.debug.inference96.sourceSHA256,sha);
 assert.equal(state.debug.inference96.sourceWidth,upscaled.width);
 assert.equal(state.debug.inference96.sourceHeight,upscaled.height);
 assert.equal(Math.max(state.debug.inference96.modelWidth,state.debug.inference96.modelHeight),1536);
 assert.notEqual(state.debug.inference96.modelSHA256,sha,
  'model JPEG derivative mistaken for original SHA');
 assert.equal(state.debug.inference96.maskResolutionVerified,false);
 assert.ok(actualWorkerPaths94.includes('/public/outfit-worker-p94.mjs'),
  'P94 test did not execute installed native P88 Worker inside real application');
 assert.equal(actualWorkerPaths94.filter(p=>p.includes('/.m57-exact-p88-donor/')).length,0,
  'scratch donor unexpectedly served as P94 native integration Worker');
 assert.equal(state.debug.working,false);
 assert.ok(state.cards>0&&state.cards<=12,
  'Genuine P88 browser worker did not produce a bounded actual model proposal');
 assert.ok(/unverified region/.test(state.status),'Never call the proposals confirmed');
 assert.equal(await countRows(page),0,'A genuine worker auto-saved an unconfirmed garment');
 assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isDisabled(),true);
 assert.deepEqual(rejected,[],'unexpected outbound request may leak source image');
 assert.deepEqual(issues,[],'actual native browser errors');
 const receipt={
  schema:'PARALLEL96_4K_DERIVATIVE_REAL_P88_SOURCE_LOCKED_REVIEW/v1',
  source:'commons-0003-licensed-upscaled-4k',sourceSHA256:sha,originalJPEGBytes:file.length,
   licensedDonorSHA256:donorSHA,sourceWidth:upscaled.width,sourceHeight:upscaled.height,
   modelRasterWidth:state.debug.inference96.modelWidth,
   modelRasterHeight:state.debug.inference96.modelHeight,
   modelDerivativeSHA256:state.debug.inference96.modelSHA256,
   physicalNativeCamera4kTested:false,actualIndependent4kDetails:false,
   startupMs:'UNMEASURED',inferenceOnlyMs:'UNMEASURED',peakMemory:'UNMEASURED',
   fullSourceVsMaskPixelIoU:'UNMEASURED',
  sourceLicense:locked.attribution?.license,sourceVerified:true,
  actualBrowser:engine,viewportWidth:width,actualNativeApp:true,
  installedNativeP88Worker94:true,
  actualP88ModuleWorkerExecuted:true,noSyntheticWorker:true,
  actualModel:'Xenova/segformer_b0_clothes',modelRevision:'a2489ea8e7ec1ee912190546bad31a4906ccca76',
  browserModelRuntime:'wasm-fp32',
  modelWeightSHA256IndependentlyVerified:false,
  actualWorkerSourceBlob:'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
  sourceGroupsUnverified:state.cards,reviewStatus:state.status,
  modelHosts:[...new Set(external.map(x=>x.host))],
  modelHttpStatusSummary:Object.fromEntries([...new Set(modelResponses.map(x=>x.status))]
   .map(code=>[code,modelResponses.filter(x=>x.status===code).length])),
  unexpectedOutbound:rejected,
  elapsedWallMs:Math.round(performance.now()-started),
  syntheticLogin:true,localIndexedDBOnly:true,ownerPrivateSaves:0,
  humanAccuracyMeasured:false,independentSealedBlindHumanLabels:false,
  physicalDevice:false,hostedSignedRLS:false,full3DReady:false,
  familyAlpha:'HOLD',releaseAllowed:false
 };
 await writeFile(join(out,'P96-4K-SOURCE-LOCKED-BROWSER.json'),
  JSON.stringify(receipt,null,2)+'\n');
 console.log('P96_GENUINE_4K_DERIVATIVE_WASM_SOURCE_TO_NATIVE_REVIEW',JSON.stringify({
  engine,sourceSHA256:sha,groups:state.cards,realWorker:true,
  modelRequests:modelResponses.length,elapsedMs:receipt.elapsedWallMs,
  saved:0,hold:true
 }));
 // M58 follow-on: real model has finished. The earlier receipt proved ZERO
 // automatic saves. This second phase deliberately uses a SYNTHETIC test owner
 // to annotate a separate manual region, exercising the *real* crop, checkbox,
 // and atomic local IndexedDB write. These labels are NOT physical garment truth.
 stage='synthetic-owner-manual-crop-after-real-model';
 await page.getByRole('button',{name:'Add missed piece'}).click();
 const manuallyAdded=page.locator('#multi24Grid .multi24-card[data-review-tier="manual"]').last();
 await manuallyAdded.waitFor({timeout:20000});
 await manuallyAdded.getByRole('button',{name:'Adjust crop/mask'}).click();
 const cropEditor=page.locator('dialog.photo-crop-editor');
 await cropEditor.waitFor({state:'visible',timeout:20000});
 await cropEditor.getByRole('button',{name:'Save crop'}).click();
 await cropEditor.waitFor({state:'hidden',timeout:20000});
 await manuallyAdded.getByLabel('Main category').selectOption('Tops');
 await manuallyAdded.getByLabel('Specific type').selectOption('T-shirt');
 await manuallyAdded.getByLabel('Color (confirm visually)').fill('Blue');
 await manuallyAdded.getByLabel('I confirm this visible garment, category and color').check();
 assert.equal(await countRows(page),0,
  'synthetic owner gesture must not save without the explicit Save action');
 await page.getByRole('button',{name:'Save confirmed pieces together'}).click();
 await page.waitForFunction(()=>/saved together with the original photo SHA-256/.test(
  document.getElementById('multi24Status')?.textContent||''),null,{timeout:45000});
 assert.equal(await countRows(page),1,'exactly one explicit test-owner save');
 stage='verified-outfit-source-admission-check';
 const handoff=await page.evaluate(async()=> {
  const owner='m58-A';
  const items=await new Promise((resolve,reject)=>{
   const req=db.transaction('items','readonly').objectStore('items').getAll();
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>reject(req.error);
  });
  if(items.length!==1)throw Error('M58 private saved row count changed');
  const item=items[0],original=item.originalPhoto?.image||'';
  if(!original.startsWith('data:image/jpeg;base64,'))
   throw Error('M58 source original not retained');
  const bytes=Uint8Array.from(atob(original.slice('data:image/jpeg;base64,'.length)),x=>x.charCodeAt(0));
  const dig=await crypto.subtle.digest('SHA-256',bytes);
  const verifiedSHA=[...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const {buildOwnerWardrobeIndex}=await import('/public/native-owner-wardrobe-index-167.mjs');
  const index=buildOwnerWardrobeIndex(owner,items);
  const unit=index.entries.find(x=>x.id===item.id);
  const {preflightOwnedOutfit1054}=await import(
   '/research/main-thread-integration-1054/source-to-outfit.mjs');
  let admitted=false,refusal='';
  try{
   await preflightOwnedOutfit1054({
    getSession:currentPhotoOwnerSession167,
    readOwnerItems:signedOwnerSavedRows167,
    cleanBoard:cleanOutfitBoard,
    board:{name:'M58 synthetic test owner manual region',slots:{top:item.id}}
   });
   admitted=true;
  }catch(error){refusal=String(error?.message||error);}
  return {
   sourceSHA:item.sourceSHA256,originalSHA:item.originalPhoto?.sha256,rehash:verifiedSHA,
   sameOwner:item.ownerId===owner,reviewedCrop:item.sourceCropReviewed===true,
   ownerAdjusted:item.userAdjusted===true,
   singleGarmentVerified:item.singleGarmentVerified===true,
   ownerReviewed:item.ownerReviewed===true,
   sourcePhotoOriginal:item.sourcePhotoOriginal===true,
   photoOnly:item.photoOnly===true,threeDReady:item.threeDReady===true,
   sourceKind:unit?.sourceKind||'not-indexed',
   savedItemId:item.id,
   reviewedCategory:item.category,reviewedSubtype:item.itemType,
   admitted,refusal:refusal.slice(0,150)
  };
 });
 for(const value of [handoff.sourceSHA,handoff.originalSHA,handoff.rehash])
  assert.equal(value,sha,'original source SHA changed through explicit private save');
 assert.equal(handoff.sameOwner,true);
 assert.equal(handoff.reviewedCrop,true);
 assert.equal(handoff.ownerAdjusted,true);
 assert.equal(handoff.reviewedCategory,'Tops');
 assert.equal(handoff.reviewedSubtype,'T-shirt');
 assert.equal(handoff.sourceKind,'ambiguous-source',
  'unproven physical garment unit must remain ambiguous');
 assert.equal(handoff.singleGarmentVerified,false);
 assert.equal(handoff.ownerReviewed,false);
 assert.equal(handoff.sourcePhotoOriginal,false);
 assert.equal(handoff.photoOnly,true);
 assert.equal(handoff.threeDReady,false);
 assert.equal(handoff.admitted,false,
  'M51 must refuse a MULTI24 row lacking independently verified physical-unit evidence');
 assert.match(handoff.refusal,/MAIN1054/,'source-to-outfit preflight did not issue its own refusal');
 // A deliberately source-unverified MULTI24 row is STILL usable as an honest
 // original-photo-derived 2D card in the actual authenticated native builder.
 // Certification of the private photo or realistic 3D is a SEPARATE gate.
 stage='native owner saved outfit uses photo-only 2D fallback after real model';
 await page.evaluate(()=>switchView('builder'));
 await page.locator('#boardSlots .board-slot-top').click();
 await page.locator('#boardPicker').waitFor({state:'visible',timeout:20000});
 const ownedChoice=page.locator('#boardPickerItems button.board-pick').first();
 await ownedChoice.waitFor({timeout:20000});
 // M73: owner sees uncertainty before pressing the actual private picker
 // selection button. The app must not imply an uncertified cutout is fitted 3D.
 assert.match(await ownedChoice.innerText(),
  /Photo reference only.*garment outline unverified/i,
  'native closet picker concealed unverified garment outline');
 assert.match(await ownedChoice.getAttribute('aria-label'),
  /individual garment outline unverified.*Select for 2D outfit/i,
  'native picker accessibility name concealed source-only limitation');
 assert.equal(await ownedChoice.evaluate(e=>e.classList.contains('source-unverified')),
  true,'native picker lost the owner-photo source-only warning');
 await ownedChoice.click();
 await page.waitForFunction(id=>{
  const node=document.querySelector('#boardSlots .board-slot-top.owned img');
  return currentBoard.slots?.top===id&&!!node&&node.complete&&node.naturalWidth>0;
 },handoff.savedItemId,{timeout:30000});
 const normal2D=await page.locator('#boardSlots .board-slot-top.owned img')
  .evaluate(img=>({decoded:img.naturalWidth>0,
   sourceIsLocalJpeg:(img.getAttribute('src')||'').startsWith('data:image/jpeg;base64,')}));
 assert.equal(normal2D.decoded,true,"owner's original-photo-derived 2D outfit image was not decoded");
 assert.equal(normal2D.sourceIsLocalJpeg,true,'native photo card did not retain local JPEG');
 // M70: the actual default native board must say it has a photo reference,
 // not silently certify one physical garment, a verified segmentation or 3D.
 const defaultBoardTop=page.locator('#boardSlots .board-slot-top.owned');
 assert.match(await defaultBoardTop.innerText(),
  /Photo reference only.*garment outline unverified/i,
  'real native board hid the physical garment uncertainty on saved photo');
 assert.match(await defaultBoardTop.getAttribute('aria-label'),
  /individual garment outline unverified/i,
  'screen-reader label silently claimed the ambiguous photo was one garment');
 assert.equal(await defaultBoardTop.evaluate(e=>e.classList.contains('source-unverified')),
  true,'real native card lost its source-uncertainty state');
 stage='strict verified original preview and unsupported 3D must stay blocked';
 await page.locator('#mission4Preview1054Section button').waitFor({timeout:20000});
 await page.locator('#mission4Preview1054Section button').click();
 await page.waitForFunction(()=>document.getElementById('mission4Preview1054Status')
  ?.textContent.includes('Preview refused'),null,{timeout:20000});
 assert.equal(await page.locator('#mission4Preview1054Photos img').count(),0,
  'ambiguous physical source was incorrectly certified as exact verified garment');
 assert.equal(await page.locator('#outfit3D01Canvas').count(),0,
  'unverified garment was incorrectly admitted to original/photo 3D');
 // M60 integration: load byte-identical M59 gallery donors only in this
 // disposable CI checkout, after real P88 inference and actual private save.
 // Do not modify public/ or loosen M54 mask/physical-garment admission.
 stage='same-browser-real-worker-to-pinned-M59-original-photo-only-gallery';
 // Use the ACTUAL opt-in native Outfit Builder button; no test-only DOM
 // injection, direct mount calls, or synthetic wardrobe selection.
 await page.locator('#mission4PhotoOnly59Open').click();
 await page.waitForFunction(()=>document.querySelectorAll(
  '#mission4PhotoOnly59Photos img').length===1,null,{timeout:30000});
 const nativeGallery=await page.evaluate(()=>{
  const section=document.getElementById('mission4PhotoOnly59Section'),
   host=document.getElementById('mission4PhotoOnly59Photos');
  return {
   photoCount:host?.querySelectorAll('img').length||0,
   renderAuthorized3D:section?.dataset.render3d!=='denied',
   releaseAuthorized:section?.dataset.render3d!=='denied',
   warning:host?.querySelector('[data-physical-garment-unit]')?.textContent||'',
   src:host?.querySelector('img')?.getAttribute('src')||''
  };
 });
 assert.equal(nativeGallery.photoCount,1,'M59 failed on genuine-worker M58 private saved row');
 assert.equal(nativeGallery.renderAuthorized3D,false);
 assert.equal(nativeGallery.releaseAuthorized,false);
 assert.match(nativeGallery.warning,/physical garment boundaries/i);
 assert.equal(nativeGallery.src,'data:image/jpeg;base64,'+file.toString('base64'),
  'M59 gallery did not display exact rights-locked original JPEG');
 assert.equal(await page.locator('#outfit3D01Canvas').count(),0);
 // The original-photo gallery must immediately revoke on a native board edit.
 const previousOccasion=await page.locator('#boardOccasion').inputValue();
 const changedOccasion=previousOccasion==='Dinner'?'Work':'Dinner';
 // In nativeLossless04 mode the authoritative board is the signed-owner
 // controller, not an independent currentBoard JS variable. Trigger the REAL
 // occasion-select UI and verify its state before testing photo revocation.
 await page.locator('#boardOccasion').selectOption(changedOccasion);
 await page.waitForFunction(value=>
  window.nativeLossless04Bridge?.view()?.occasion===value,
  changedOccasion,{timeout:20000});
 await page.waitForFunction(()=>
  document.querySelectorAll('#mission4PhotoOnly59Photos img').length===0,
  null,{timeout:20000});
 assert.equal(await page.locator('#mission4PhotoOnly59Photos img').count(),0,
  'actual owner outfit UI change retained stale reviewed original photo');
 await page.locator('#boardOccasion').selectOption(previousOccasion);
 await page.waitForFunction(value=>
  window.nativeLossless04Bridge?.view()?.occasion===value,
  previousOccasion,{timeout:20000});
 await page.locator('#mission4PhotoOnly59Open').click();
 await page.waitForFunction(()=>document.querySelectorAll(
  '#mission4PhotoOnly59Photos img').length===1,null,{timeout:30000});
 assert.equal(await page.locator('#mission4PhotoOnly59Photos img').count(),1,
  'M59 failed to re-admit same reviewed original through native button');
 // BOARD04 photo-only slot selection remains an unsaved private draft until
 // the signed owner explicitly clicks native Save outfit. A v4 export must
 // NOT claim it contains that unsaved selection. Save via the real app button
 // and confirm the owner-bound saved outfit before any backup download.
 stage='persist-native-owner-outfit-before-v4-export';
 await page.locator('#saveBoard').click();
 await page.waitForFunction(id=>{
  const board=window.nativeLossless04Bridge;
  if(!board?.status()?.active||board.status().dirty||
     board.status().savedCount!==1)return false;
  return board.readOnlySnapshot().saved.some(outfit=>outfit.slots?.top===id);
 },handoff.savedItemId,{timeout:30000});
 const actualSavedOutfit=await page.evaluate(()=>{
  const saved=window.nativeLossless04Bridge.readOnlySnapshot().saved;
  return {count:saved.length,top:saved[0]?.slots?.top,
   originalPhotosRetained:window.nativeLossless04Bridge.status().active,
   threeDAuthorized:false};
 });
 assert.equal(actualSavedOutfit.count,1);
 assert.equal(actualSavedOutfit.top,handoff.savedItemId);
 assert.equal(actualSavedOutfit.originalPhotosRetained,true);

 // M61 — ONE ACTUAL native app session, continuing from a genuine P88 WASM
 // inference, owner-manual crop/explicit private save, native Outfit Builder
 // and strict 2D gallery. No separate synthetic re-seeding of saved garments.
 // Toggle the existing V4 handler at call-time (restoreAtomic01's opt-in
 // export handler has precedence, so turn that flag off, without reloading
 // or replacing the actual authenticated owner/session/IndexedDB).
 const sourceDocument91=await page.evaluate(()=>window.__document91);
 stage='same-real-worker-session-native-lossless-v4-export';
 await page.evaluate(()=>{
  const params=new URLSearchParams(location.search);
  params.delete('restoreAtomic01');
  params.set('losslessV4M3','research');
  history.replaceState(null,'',location.pathname+'?'+params.toString());
 });
 const downloadEvent=page.waitForEvent('download',{timeout:30000});
 const v4Notice=await page.evaluate(async()=>{
  await document.getElementById('export').onclick();
  return document.getElementById('message')?.textContent||'';
 });
 assert.match(v4Notice,/Complete private v4 backup exported/,
  'native signed-owner V4 export refused real-model-session private original');
 const download=await downloadEvent;
 assert.match(download.suggestedFilename(),/owner-backup-v4\.json/);
 const v4=JSON.parse(await readFile(await download.path(),'utf8'));
 assert.equal(v4.version,4);
 assert.equal(v4.ownerId,'m58-A');
 assert.equal(v4.items.length,1);
 const savedPhoto=v4.items[0];
 assert.equal(savedPhoto.id,handoff.savedItemId);
 assert.equal(savedPhoto.originalPhoto?.image,'data:image/jpeg;base64,'+file.toString('base64'));
 assert.equal(savedPhoto.sourceSHA256,sha);
 assert.equal(savedPhoto.originalPhoto.sha256,sha);
 assert.equal(savedPhoto.photoOnly,true);
 assert.equal(savedPhoto.sourceCropReviewed,true);
 assert.equal(savedPhoto.singleGarmentVerified,false);
 assert.equal(savedPhoto.threeDReady,false);
 assert.ok(v4.state?.['outfit-board']?.saved?.some(outfit=>
  outfit.slots?.top===handoff.savedItemId),
  'real saved owner outfit was not included in same-session v4 backup');
 const submitBackup=async(data,approved)=>page.evaluate(async({data,approved})=>{
  window.confirm=()=>approved;
  const json=JSON.stringify(data);
  await document.getElementById('import').onchange({
   target:{files:[{size:json.length,text:async()=>json}],value:'m61-private-backup'}
  });
  return document.getElementById('message')?.textContent||'';
 },{data,approved});
 const ownerSnapshot=()=>page.evaluate(async()=>{
  const tx=db.transaction(['items','state'],'readonly');
  return new Promise((resolve,reject)=>{
   const a=tx.objectStore('items').getAll();
   const b=tx.objectStore('state').get('outfit-board');
   const c=tx.objectStore('state').get('cloud-sync');
   tx.oncomplete=()=>resolve({
    owner:window.closetAuth?.user?.id,items:a.result.map(item=>({
     id:item.id,color:item.color,sourceSHA256:item.sourceSHA256,
     originalSHA:item.originalPhoto?.sha256,
     photoOnly:item.photoOnly,sourceCropReviewed:item.sourceCropReviewed,
     singleGarmentVerified:item.singleGarmentVerified,threeDReady:item.threeDReady
    })),
    top:b.result?.saved?.[0]?.slots?.top||null,
    savedOutfitCount:b.result?.saved?.length||0,
    cloudDirty:c.result?.dirty===true
   });
   tx.onerror=tx.onabort=()=>reject(tx.error);
  });
 });
 const initial=await ownerSnapshot();
 const tampered=structuredClone(v4);
 tampered.items[0].originalPhoto.sha256='f'.repeat(64);
 const rejectedSHA=await submitBackup(tampered,true);
 assert.match(rejectedSHA,/source|sha|jpeg|mismatch|M3_V4/i);
 assert.deepEqual(await ownerSnapshot(),initial,
  'v4 source tamper changed M58 owner/session wardrobe or outfit');
 const wrongOwner=structuredClone(v4);
 wrongOwner.ownerId='m58-B';
 const rejectedOwner=await submitBackup(wrongOwner,true);
 assert.match(rejectedOwner,/owner|bound|account/i);
 assert.deepEqual(await ownerSnapshot(),initial,
  'foreign-owner v4 restore changed M58 authenticated private rows');
 const declined=await submitBackup(v4,false);
 assert.match(declined,/cancel/i);
 assert.deepEqual(await ownerSnapshot(),initial,
  'native v4 cancellation changed genuine-model session private source');
 stage='same-real-worker-session-native-v4-atomic-restore';
 await mutateOwnerItem91(page,{id:handoff.savedItemId,ownerId:'m58-A',operation:'color'});
 assert.equal(await page.evaluate(()=>window.__document91),sourceDocument91,
  'export/restore mutation unexpectedly replaced the source document');
 assert.equal((await ownerSnapshot()).items[0].color,'Disposable synthetic edit');
 assert.equal(await page.locator('#mission4PhotoOnly59Photos img').count(),0);
 const restoredNotice=await submitBackup(v4,true);
 assert.match(restoredNotice,/restored.*v4|v4.*restored/i,
  'native V4 restore did not commit original in same P88-inference session');
 const after=await ownerSnapshot();
 assert.equal(after.owner,'m58-A');
 assert.equal(after.items.length,1);
 assert.equal(after.items[0].id,handoff.savedItemId);
 assert.equal(after.items[0].color,savedPhoto.color);
 assert.equal(after.items[0].sourceSHA256,sha);
 assert.equal(after.items[0].originalSHA,sha);
 assert.equal(after.items[0].photoOnly,true);
 assert.equal(after.items[0].sourceCropReviewed,true);
 assert.equal(after.items[0].singleGarmentVerified,false);
 assert.equal(after.items[0].threeDReady,false);
 assert.equal(after.top,handoff.savedItemId);
 assert.equal(after.savedOutfitCount,1);
 assert.equal(after.cloudDirty,true);
 // BOARD04's atomic v4 restore rehydrates the durable saved outfit list.
 // It intentionally starts with the separately persisted current board,
 // NOT an automatically selected saved outfit. The signed owner must open
 // the restored saved outfit explicitly through the actual native UI.
 stage='same-owner-reopen-actual-restored-saved-outfit';
 await page.waitForFunction(id=>{
  const board=window.nativeLossless04Bridge;
  return board?.status()?.active===true&&
   board.readOnlySnapshot().saved.some(row=>row.slots?.top===id)&&
   !!document.querySelector('#savedBoards button');
 },handoff.savedItemId,{timeout:30000});
 await page.locator('#savedBoards button').first().click();
 await page.waitForFunction(id=>{
  const board=window.nativeLossless04Bridge;
  return board?.status()?.selected===0&&
   typeof currentBoard!=='undefined'&&currentBoard.slots?.top===id;
 },handoff.savedItemId,{timeout:30000});
 await page.locator('#mission4PhotoOnly59Open').click();
 await page.waitForFunction(()=>document.querySelectorAll(
  '#mission4PhotoOnly59Photos img').length===1,null,{timeout:30000});
 const restoredGallery=await page.evaluate(()=>{
  const root=document.getElementById('mission4PhotoOnly59Section');
  const host=document.getElementById('mission4PhotoOnly59Photos');
  return {count:host?.querySelectorAll('img').length||0,
   fit:root?.dataset.render3d!=='denied',
   threeD:root?.dataset.render3d!=='denied',
   src:host?.querySelector('img')?.getAttribute('src'),
   warning:host?.querySelector('[data-physical-garment-unit]')?.textContent||''};
 });
 assert.equal(restoredGallery.count,1);
 assert.equal(restoredGallery.fit,false);
 assert.equal(restoredGallery.threeD,false);
 assert.equal(restoredGallery.src,'data:image/jpeg;base64,'+file.toString('base64'));
 assert.match(restoredGallery.warning,/physical garment boundaries/i);
 assert.equal(await page.locator('#outfit3D01Canvas').count(),0);
 console.log('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',
  JSON.stringify({engine,modelExecuted:true,manualSyntheticOwnerConfirmed:true,
   ownerPrivateSaved:1,exactOriginalSHA256:sha,realNativeOutfit:true,
   savedOutfitOwnerAction:true,restoredSavedOutfitCount:1,
   actualV4BrowserDownload:true,tamperDenied:true,otherOwnerDenied:true,
   cancelledRestoreUnchanged:true,atomicRestore:true,
   restoredOriginalPhotoGallery:true,physicalGarmentUnitsVerified:false,
   threeDAuthorized:false,hostedRLS:false,physicalPhone:false,
   familyAlpha:'HOLD',releaseAuthorized:false}));

 // After the REAL Worker + one explicitly synthetic owner A save + actual
 // 2D board selection, exercise the native LOGOUT/login B UI in this SAME
 // browser. No new model run, source mock or direct IndexedDB insertion.
 // This proves local owner-to-owner view isolation, NOT hosted signed RLS.
 stage='same-browser-native-owner-A-logout';
 await page.locator('.account-menu summary').click();
 // AUTH's logout handler locks the UI immediately, but only reloads after
 // awaiting /auth/v1/logout. Waiting for authGate alone races that reload
 // and can destroy a B-session page.evaluate many steps later.
 const logoutDocumentA=await page.evaluate(()=>window.__document91);
 const logoutReloadA=page.waitForEvent('load',{timeout:30000});
 await page.locator('#logout').click();
 await logoutReloadA;
 assert.notEqual(await page.evaluate(()=>window.__document91),logoutDocumentA,
  'logout did not replace the authenticated document');
 await page.waitForLoadState('domcontentloaded');
 await page.waitForFunction(()=>document.getElementById('authGate')?.hidden===false,
  null,{timeout:30000});
 assert.equal(await page.locator('#mission4Preview1054Photos img').count(),0,
  'owner A strict preview image remained after logout');
 assert.equal(await page.locator('#mission4PhotoOnly59Photos img').count(),0,
  'M59 lower-trust original gallery retained A source after logout');
 assert.equal(await page.locator('#multi24Research img[src^="data:image/"]').count(),0,
  'owner A review original remained in the DOM after logout');
 stage='same-browser-native-owner-B-private-indexeddb';
 await page.locator('#authEmail').fill('m58-B@example.test');
 await page.locator('#authPassword').fill('fixture-only');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(()=>window.closetAuth?.user?.id==='m58-B'&&
   db?.name==='closet-current-user-m58-B'&&
   document.getElementById('appShell')?.hidden===false,null,{timeout:30000});
 assert.equal(await countRows(page),0,
  'synthetic owner B can read source owner A private wardrobe rows');
 await page.evaluate(()=>switchView('builder'));
 await page.waitForFunction(()=>typeof currentBoard!=='undefined'&&
  document.getElementById('boardSlots')!==null,null,{timeout:20000});
 const bView=await page.evaluate(oldItemId=>({
  account:window.closetAuth?.user?.id,dbName:db?.name,
  oldOutfitSelected:currentBoard?.slots?.top===oldItemId,
  ownerOwnedPhotoCards:document.querySelectorAll('#boardSlots .owned img').length,
  ownerReviewOriginals:document.querySelectorAll('#multi24Research img[src^="data:image/"]').length,
  strictPreviewOriginals:document.querySelectorAll('#mission4Preview1054Photos img').length
 }),handoff.savedItemId);
 assert.equal(bView.account,'m58-B');
 assert.equal(bView.dbName,'closet-current-user-m58-B');
 assert.equal(bView.oldOutfitSelected,false,'B inherited A private outfit selection');
 assert.equal(bView.ownerOwnedPhotoCards,0,'B has A private photo in its outfit UI');
 assert.equal(bView.ownerReviewOriginals,0,'B has A private review source');
 assert.equal(bView.strictPreviewOriginals,0,'B has A strict preview source');
 assert.equal(await page.locator('#mission4PhotoOnly59Photos img').count(),0,
  'owner B can view owner A M59 research-gallery source');
 // M63: re-use the ACTUAL v4 JSON downloaded after A's genuine model/
 // explicitly reviewed private save. A valid, uncompromised A backup must
 // never be importable by newly signed-in B, even with B's consent. This
 // exercises the native import control rather than a standalone fixture.
 stage='same-browser-owner-B-must-reject-valid-owner-A-original-v4-backup';
 const ownerBBeforeForeignRestore=await ownerSnapshot();
 assert.equal(ownerBBeforeForeignRestore.owner,'m58-B');
 assert.equal(ownerBBeforeForeignRestore.items.length,0);
 assert.equal(ownerBBeforeForeignRestore.savedOutfitCount,0);
 const bForeignRestoreNotice=await submitBackup(v4,true);
 assert.match(bForeignRestoreNotice,/owner|account|bound|mismatch|private/i,
  'native v4 import did not explain refusal of genuine owner A backup to B');
 assert.deepEqual(await ownerSnapshot(),ownerBBeforeForeignRestore,
  'owner B changed after attempting to restore owner A valid private source');
 assert.equal(await page.locator('#boardSlots .owned img').count(),0,
  'owner B displayed A garment after rejected original v4 import');
 assert.equal(await page.locator('#mission4PhotoOnly59Photos img').count(),0,
  'owner B displayed A original after rejected cross-account v4 import');
 // M64: actively reopen the real, lazy consumer gallery as B after A's
 // review, private export, logout, and the rejected valid A backup import.
 // A harmless empty B board must refuse gallery admission, even if the
 // research button and its click handler survive the signed-owner swap.
 stage='same-browser-owner-B-must-reject-native-original-gallery-reentry';
 await page.locator('#mission4PhotoOnly59Open').click();
 await page.waitForFunction(()=>document.getElementById('mission4PhotoOnly59Status')
  ?.textContent.includes('Photo-only gallery refused'),null,{timeout:20000});
 assert.equal(await page.locator('#mission4PhotoOnly59Photos img').count(),0,
  'owner B re-opened original gallery and leaked A photo after session swap');
 assert.equal(await page.locator('#outfit3D01Canvas').count(),0,
  'cross-owner gallery reentry incorrectly admitted fitted 3D');
 assert.deepEqual(await ownerSnapshot(),ownerBBeforeForeignRestore,
  'owner B gallery reentry mutated private inventory/outfit after A import denial');
 assert.deepEqual(rejected,[],'synthetic owner switch caused forbidden external request');
 assert.deepEqual(issues,[],'native owner switch caused browser runtime error');
 console.log('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',JSON.stringify({
  engine,realWorkerFirst:true,explicitOwnerASave:1,ownerBPrivateRows:0,
  ownerAOriginalNotVisibleToB:true,ownerAOutfitNotVisibleToB:true,
  m59SourceOnlyGalleryUsesExactOriginal:true,
  m59BoardMutationRevoked:true,m59LogoutAndBRevoked:true,
  localIndexedDBOnly:true,syntheticAuth:true,hostedRLS:false,
  independentHumanLabelAccuracy:false,physicalPhone:false,
  familyAlpha:'HOLD',releaseAllowed:false
 }));
 console.log('M58_SYNTHETIC_OWNER_NATIVE_SAVE_TO_M51_FAIL_CLOSED',JSON.stringify({
  engine,originalSHA256:sha,actualP88InferenceFirst:true,
  syntheticOwnerManualCropAndConfirm:true,localExplicitSaveCount:1,
  sourceKind:handoff.sourceKind,verifiedOutfitAdmitted:false,
  sourceOriginalRehashed:true,sourcePhoto2DOnly:true,
  nativePrivate2DOutfitSelected:true,strictVerifiedPhotoPreviewRefused:true,
  ownerLabelsAreHumanGroundTruth:false,hostedRLS:false,physicalPhone:false,
  familyAlpha:'HOLD'
 }));
 // M66: A->B denial is not sufficient if the signed original owner
 // cannot recover their own verified local originals/outfit afterwards.
 // Use the ACTUAL native logout and login UI, same browser/IndexedDB, and
 // exactly the original single public JPEG saved earlier in this session.
 // Neither B nor A re-logins re-run the worker or seed a synthetic record.
 stage='same-browser-owner-B-logout-return-owner-A-private-recovery';
 await page.locator('.account-menu summary').click();
 const logoutDocumentB=await page.evaluate(()=>window.__document91);
 const logoutReloadB=page.waitForEvent('load',{timeout:30000});
 await page.locator('#logout').click();
 await logoutReloadB;
 assert.notEqual(await page.evaluate(()=>window.__document91),logoutDocumentB,
  'logout did not replace the authenticated document');
 await page.waitForLoadState('domcontentloaded');
 await page.waitForFunction(()=>document.getElementById('authGate')?.hidden===false,
  null,{timeout:30000});
 assert.equal(await page.locator('#mission4PhotoOnly59Photos img').count(),0,
  'B logout retained a prior owner original in the gallery');
 await page.locator('#authEmail').fill('m58-A@example.test');
 await page.locator('#authPassword').fill('fixture-only');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(()=>window.closetAuth?.user?.id==='m58-A'&&
  db?.name==='closet-current-user-m58-A'&&
  document.getElementById('appShell')?.hidden===false,null,{timeout:30000});
 await page.waitForFunction(()=>window.nativeLossless04Bridge?.status()?.active===true,
  null,{timeout:30000});
 const returnA=await ownerSnapshot();
 assert.equal(returnA.owner,'m58-A');
 assert.equal(returnA.items.length,1,
  'original owner lost manually confirmed private garment after B was denied');
 assert.equal(returnA.items[0].id,handoff.savedItemId);
 assert.equal(returnA.items[0].sourceSHA256,sha);
 assert.equal(returnA.items[0].originalSHA,sha);
 assert.equal(returnA.items[0].color,savedPhoto.color);
 assert.equal(returnA.items[0].singleGarmentVerified,false);
 assert.equal(returnA.items[0].threeDReady,false);
 assert.equal(returnA.savedOutfitCount,1,
  'original owner lost authentic native saved outfit after B import denial');
 assert.equal(returnA.top,handoff.savedItemId);
 await page.evaluate(()=>switchView('builder'));
 await page.waitForFunction(id=>window.nativeLossless04Bridge?.status()?.active&&
  window.nativeLossless04Bridge.readOnlySnapshot().saved.some(b=>b.slots?.top===id)&&
  !!document.querySelector('#savedBoards button'),handoff.savedItemId,{timeout:30000});
 await page.locator('#savedBoards button').first().click();
 await page.waitForFunction(id=>currentBoard?.slots?.top===id,
  handoff.savedItemId,{timeout:30000});
 await page.locator('#mission4PhotoOnly59Open').click();
 await page.waitForFunction(()=>document.querySelectorAll(
  '#mission4PhotoOnly59Photos img').length===1,null,{timeout:30000});
 const recoveredOriginal=await page.locator('#mission4PhotoOnly59Photos img')
  .first().getAttribute('src');
 assert.equal(recoveredOriginal,'data:image/jpeg;base64,'+file.toString('base64'),
  'returning signed owner A did not recover byte-identical original JPEG');
 assert.equal(await page.locator('#outfit3D01Canvas').count(),0,
  'returning owner original-photo-only gallery promoted unproven 3D');
 console.log('M66_OWNER_A_RETURN_PRIVATE_SOURCE_RECOVERY',JSON.stringify({
  engine,actualSourceWorkerRanOnce:true,ownerBImportRefused:true,
  ownerAReturnOriginalPhotoSHA256:sha,originalPrivateItems:1,
  savedOutfits:1,exactOriginalPhotoRecovered:true,
  noUnverified3D:true,syntheticAuthOnly:true,hostedRLS:false,
  physicalPhone:false,familyAlpha:'HOLD'
 }));
 // M67: A real browser-indexed private original can change AFTER the photo
 // has been displayed. The read-only gallery must invalidate that image and
 // refuse reentry when actual JPEG BYTES no longer match their saved SHA.
 // Restore only from A's original owner-scoped v4 export afterwards.
 // P91: keep A's recovered document through source-byte tamper; no
 // extra reload or navigation-error recovery is allowed here.
 await page.evaluate(()=>switchView('builder'));
 await page.waitForFunction(id=>window.nativeLossless04Bridge
  ?.readOnlySnapshot()?.saved?.some(b=>b.slots?.top===id)&&
  !!document.querySelector('#savedBoards button'),
  handoff.savedItemId,{timeout:30000});
 await page.locator('#savedBoards button').first().click();
 await page.waitForFunction(id=>currentBoard?.slots?.top===id,
  handoff.savedItemId,{timeout:30000});
 await page.locator('#mission4PhotoOnly59Open').click();
 await page.waitForFunction(()=>document.querySelectorAll(
  '#mission4PhotoOnly59Photos img').length===1,null,{timeout:30000});
 stage='same-owner-original-jpeg-byte-tamper-gallery-must-fail-closed';
 await mutateOwnerItem91(page,{id:handoff.savedItemId,ownerId:'m58-A',operation:'jpeg-byte'});
 await page.waitForFunction(()=>document.querySelectorAll(
  '#mission4PhotoOnly59Photos img').length===0,null,{timeout:20000});
 await page.locator('#mission4PhotoOnly59Open').click();
 await page.waitForFunction(()=>document.getElementById('mission4PhotoOnly59Status')
  ?.textContent.includes('Photo-only gallery refused'),null,{timeout:30000});
 assert.equal(await page.locator('#mission4PhotoOnly59Photos img').count(),0,
  'edited original JPEG bytes were displayed despite stored source SHA mismatch');
 assert.equal(await page.locator('#outfit3D01Canvas').count(),0,
  'byte-tampered original improperly obtained fitted 3D permission');
 assert.equal(await countRows(page),1,
  'read-only gallery attempted to delete or rewrite corrupt private item');
 stage='same-owner-atomic-v4-recovery-after-original-jpeg-tamper';
 const aRestoredNotice=await submitBackup(v4,true);
 assert.match(aRestoredNotice,/restored.*v4|v4.*restored/i,
  'native owner v4 restore did not recover byte-tampered source');
 await page.waitForFunction(id=>window.nativeLossless04Bridge?.status()?.active&&
  window.nativeLossless04Bridge.readOnlySnapshot().saved.some(b=>b.slots?.top===id)&&
  !!document.querySelector('#savedBoards button'),handoff.savedItemId,{timeout:30000});
 await page.locator('#savedBoards button').first().click();
 await page.waitForFunction(id=>currentBoard?.slots?.top===id,
  handoff.savedItemId,{timeout:30000});
 await page.locator('#mission4PhotoOnly59Open').click();
 await page.waitForFunction(()=>document.querySelectorAll(
  '#mission4PhotoOnly59Photos img').length===1,null,{timeout:30000});
 const restoredAfterTamper=await page.locator('#mission4PhotoOnly59Photos img')
  .first().getAttribute('src');
 assert.equal(restoredAfterTamper,'data:image/jpeg;base64,'+file.toString('base64'),
  'authenticated owner v4 restore did not recover original immutable photo');
 assert.equal(await page.locator('#outfit3D01Canvas').count(),0,
  'original-photo-only recovery obtained unsupported fitted 3D permission');
 console.log('M67_SOURCE_BYTE_TAMPER_REFUSED_AND_OWNER_V4_RECOVERY',JSON.stringify({
  engine,originalSourceRehashed:true,tamperedJPEGRefused:true,
  originalOwnerRestoredByRealApp:true,restoredJpegSHA256:sha,
  originalPhotoOnly:true,fitted3D:false,syntheticAuthOnly:true,
  hostedRLS:false,physicalPhone:false,familyAlpha:'HOLD'
 }));
 const lifecycle91={engine,browserVersion:browser.version(),elapsedMs:Math.round(performance.now()-started),
  uninterruptedSourceExportRestore:true,writeRetries:0,extraTamperReloads:0,ownerRecovery:true,
  originalPhotoByteTamperRefused:true,familyAlpha:'HOLD',releaseAuthorized:false,
  events:documentLifecycle91};
 await writeFile(join(out,'P91-LIFECYCLE.json'),JSON.stringify(lifecycle91,null,2));
 console.log('P91_FULL_JOURNEY_PASS',JSON.stringify({...lifecycle91,events:undefined}));
 await context.close();
}catch(e){
 console.error('M58_REAL_P88_WORKER_FAIL',JSON.stringify({
  stage,error:String(e?.stack||e).slice(0,950),
  external:external.slice(0,15),rejected:rejected.slice(0,15),issues:issues.slice(0,10),
  modelStatuses:modelResponses.slice(0,12),
  documentLifecycle91:documentLifecycle91.slice(-40),
  navigationReasonsM69:navigationReasonsM69.slice(-12),
  mainFrameNavigationsM69:mainFrameNavigationsM69.slice(-12)
 }));
 process.exitCode=1;
}finally{
 await browser?.close();await new Promise(resolve=>server.close(resolve));
}
