/**
 * M59: ACTUAL native Closet Current private owner IndexedDB, verified manual
 * MULTI24 atomic save, native board, opt-in photo-only research gallery,
 * owner logout/cross-account revocation. No model accuracy or hosted auth
 * claim. Uses rights-locked original JPEG and synthetic human review.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
const engine=process.env.M59_ENGINE;
assert.ok(['chromium','webkit'].includes(engine),'M59_ENGINE must be chromium or webkit');
const bytes=await readFile('benchmark/fixtures/commons-0003.jpg');
const sha=createHash('sha256').update(bytes).digest('hex');
const rights=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'))
 .find(x=>x.id==='commons-0003');
assert.ok(rights?.verified&&rights.sha256===sha);
const image='data:image/jpeg;base64,'+bytes.toString('base64');
const out=resolve('benchmark/main59-native-photo-only',engine);
await mkdir(out,{recursive:true});
const root=resolve('.');
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.png':'image/png',
 '.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(req.method!=='GET'||!['/public/','/research/','/benchmark/','/node_modules/']
      .some(prefix=>path.startsWith(prefix))||
    path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('M59 disallowed source asset');
  const absolute=resolve(root,'.'+path);
  if(!absolute.startsWith(root+'/'))throw Error('escaped checkout');
  const body=await readFile(absolute);
  res.writeHead(200,{'content-type':mime[extname(absolute)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('M59 protected local-only fixture');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const authHost='https://hlkgymugtfbirlpunsra.supabase.co';
const cloudStub='window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};';
const issues=[],badNetwork=[],cases=[];
let browser,stage='boot',currentWidth;
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true,
  ...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 for(const width of [320,390,430]){
  currentWidth=width;
  const context=await browser.newContext({viewport:{width,height:880},
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.href===origin+'/public/cloud-backup.js')
    return route.fulfill({status:200,contentType:'text/javascript',body:cloudStub});
   if(url.origin===origin||url.protocol==='blob:'||url.protocol==='data:')
    return route.continue();
   if(url.origin===authHost&&url.pathname.startsWith('/auth/v1/')){
    if(url.pathname==='/auth/v1/logout')
     return route.fulfill({status:204,body:''});
    if(url.pathname==='/auth/v1/token'){
     const body=JSON.parse(request.postData()||'{}');
     const who=['m59-A','m59-B'].find(n=>body.email===n+'@example.test');
     if(!who)return route.fulfill({status:401,contentType:'application/json',body:'{}'});
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      user:{id:who,email:who+'@example.test'},
      access_token:'synthetic-m59-'+who,refresh_token:'refresh-m59-'+who,
      expires_in:3600
     })});
    }
   }
   if(request.method()==='GET'&&
     ['fonts.googleapis.com','fonts.gstatic.com','cdn.jsdelivr.net','raw.githubusercontent.com']
      .includes(url.hostname))
    return route.abort();
   badNetwork.push({engine,width,host:url.hostname,method:request.method()});
   return route.abort();
  });
  const page=await context.newPage();
  page.on('pageerror',e=>issues.push({engine,width,error:String(e.message).slice(0,90)}));
  page.on('crash',()=>issues.push({engine,width,error:'page crashed'}));
  const signin=async who=>{
   await page.locator('#authEmail').fill(who+'@example.test');
   await page.locator('#authPassword').fill('fixture-only');
   await page.locator('#authSubmit').click();
   await page.waitForFunction(id=>window.closetAuth?.user?.id===id&&
    db?.name==='closet-current-user-'+id&&
    document.getElementById('appShell')?.hidden===false,who,{timeout:45000});
  };
  stage='native login';
  await page.goto(origin+'/public/index.html?mission4Preview=research',
   {waitUntil:'domcontentloaded'});
  await signin('m59-A');
  stage='real atomic owner-reviewed manual private save';
  const persisted=await page.evaluate(async({image,sha})=>{
   const {atomicSaveGarments24}=await import('/research/multi-garment-capture-01/atomic-group.mjs');
   const owner='m59-A',id='m59-A-reviewed-public-photo',actualDb=db;
   if(window.closetAuth?.user?.id!==owner||actualDb.name!=='closet-current-user-'+owner)
    throw Error('M59 owner lease mismatch');
   const proof={image,sourceSHA256:sha,sourceHashVerified:true,
    originalPhoto:{image,sha256:sha}};
   const pieces=[{
    id,instanceKey:'manual-60-60-700-700',
    cropBounds:{x:.06,y:.06,width:.7,height:.7},image,
    manual:true,cropReviewed:true,confirmed:true,
    category:'Dresses',itemType:'Casual dress',color:'Black',hint:null
   }];
   const saved=await atomicSaveGarments24({
    db:actualDb,proof,pieces,ownerId:owner,
    currentOwner:()=>window.closetAuth?.user?.id
   });
   if(saved.length!==1||saved[0].photoOnly!==true||
    saved[0].singleGarmentVerified!==false||saved[0].threeDReady!==false)
    throw Error('M59 actual reviewed native save altered garment trust');
   const fetched=await new Promise((resolve,reject)=>{
    const req=actualDb.transaction('items').objectStore('items').get(id);
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
   });
   if(fetched?.sourceSHA256!==sha||fetched?.ownerId!==owner||
    fetched?.originalPhoto?.image!==image)
    throw Error('M59 private saved row changed original bytes or owner');
   const state={id:'outfit-board',
    current:{name:'M59 original photo research',occasion:'Casual',
     slots:{top:id}},saved:[]};
   await new Promise((resolve,reject)=>{
    const tx=actualDb.transaction('state','readwrite');
    tx.objectStore('state').put(state);
    tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
   });
   return {saved:1,photoOnly:true,physicalUnitsVerified:false,realIndexedDB:true};
  },{image,sha});
  assert.equal(persisted.saved,1);
  stage='reload real native owner board';
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.closetAuth?.user?.id==='m59-A'&&
    db?.name==='closet-current-user-m59-A'&&
    typeof currentBoard!=='undefined'&&
    currentBoard.slots?.top==='m59-A-reviewed-public-photo',
    null,{timeout:45000});
  stage='mount actual owner 2D research gallery';
  const mounted=await page.evaluate(async()=>{
   switchView('builder');
   const host=document.createElement('section');
   host.id='main59Gallery';
   const builder=document.getElementById('mission4Preview1054Section');
   if(!builder)throw Error('native Outfit Builder research section missing');
   builder.append(host);
   const {mountReviewedPhotoOnlyGallery59}=await import(
    '/research/master-consolidation-1054/reviewed-photo-only-gallery59.mjs'
   );
   const gallery=mountReviewedPhotoOnlyGallery59({
    target:host,getSession:currentPhotoOwnerSession167,
    readOwnerItems:signedOwnerSavedRows167,
    getBoard:()=>structuredClone(currentBoard),
    cleanBoard,events:window,doc:document
   });
   window.m59GalleryResearch=gallery;
   const result=await gallery.refresh();
   return {result,status:gallery.status,
    warning:host.querySelector('[data-physical-garment-unit]')?.textContent,
    images:[...host.querySelectorAll('img')].map(x=>x.src)};
  });
  assert.equal(mounted.result.photoCount,1);
  assert.equal(mounted.result.renderAuthorized3D,false);
  assert.equal(mounted.result.fittedOutfitAuthorized,false);
  assert.equal(mounted.status.originalPhotoCount,1);
  assert.equal(mounted.images[0],image,'actual owner gallery substituted original JPEG');
  assert.match(mounted.warning,/physical garment boundaries/i);
  assert.equal(await page.locator('#outfit3D01Canvas').count(),0);
  stage='native owner board mutation and logout revocation';
  await page.evaluate(()=>{
   currentBoard.occasion='Dinner';
   window.dispatchEvent(new Event('focus'));
  });
  assert.equal(await page.locator('#main59Gallery img').count(),0,
   'stale board still shows old original JPEG');
  await page.evaluate(()=>{currentBoard.occasion='Casual';});
  const restored=await page.evaluate(()=>window.m59GalleryResearch.refresh());
  assert.equal(restored.photoCount,1);
  await page.locator('.account-menu summary').click();
  await page.locator('#logout').click();
  await page.waitForFunction(()=>document.getElementById('authGate')?.hidden===false,
    null,{timeout:30000});
  assert.equal(await page.locator('#main59Gallery img').count(),0,
   'old owner original JPEG remains visible after real native logout');
  stage='native second synthetic owner isolation';
  await signin('m59-B');
  assert.equal(await page.locator('#main59Gallery img').count(),0);
  const safe=await page.evaluate(async()=>{
   const count=await new Promise((resolve,reject)=>{
    const req=db.transaction('items').objectStore('items').count();
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
   });
   return {count,owner:window.closetAuth?.user?.id,
    oldGallery:window.m59GalleryResearch?.status.originalPhotoCount??0};
  });
  assert.equal(safe.owner,'m59-B');assert.equal(safe.count,0);
  assert.equal(safe.oldGallery,0);
  cases.push({engine,width,realApp:true,sourceSHA256:sha,
   ownerAAtomicSavedRow:1,ownerBPrivateRows:0,
   exactOriginalRendered:true,syntheticOwnerReview:true,
   physicalUnitIdentityVerified:false,threeDAdmitted:false,
   staleBoardRevoked:true,logoutPhotoRevoked:true,
   ownerBOriginalLeak:false,releaseAuthorized:false,familyAlpha:'HOLD'});
  await context.close();
 }
 assert.deepEqual(issues,[]);
 assert.deepEqual(badNetwork,[]);
 assert.equal(cases.length,3);
 await writeFile(join(out,'M59-REAL-NATIVE-PHOTO-ONLY-GALLERY-NOT-RELEASE.json'),
  JSON.stringify({schema:'MAIN1054_M59_ACTUAL_NATIVE_REVIEWED_SOURCE_PHOTO_ONLY/v1',
   engine,sourceVerified:true,sourceSHA256:sha,realNativeApp:true,
   actualPrivateBrowserIndexedDB:true,humanTruthSynthetic:true,
   realIndependentLabelAccuracy:false,modelInferenceInThisWorkflow:false,
   3DAuthorized:false,actualHostedRLS:false,physicalPhone:false,
   familyAlpha:'HOLD',releaseAuthorized:false,cases},null,2)+'\n');
 console.log('M59_ACTUAL_NATIVE_PHOTO_ONLY_REVIEWED_GALLERY_PASS',
  JSON.stringify({engine,widths:cases.map(c=>c.width),
   originalSHA256:sha,ownerPrivateSave:true,
   photoOnlyGallery:true,ownerBLeak:false,threeD:false,familyAlpha:'HOLD'}));
}catch(e){
 console.error('M59_ACTUAL_NATIVE_GALLERY_FAIL',JSON.stringify({
  stage,width:currentWidth,engine,error:String(e?.stack||e).slice(0,1100),
  issues:issues.slice(0,5),badNetwork:badNetwork.slice(0,5)
 }));
 process.exitCode=1;
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
