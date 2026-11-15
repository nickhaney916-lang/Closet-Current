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
   isMobile:true,hasTouch:true,acceptDownloads:true,serviceWorkers:'block'});
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
     const grant=url.searchParams.get('grant_type');
     const who=['m59-A','m59-B'].find(n=>
      grant==='password'&&body.email===n+'@example.test'||
      grant==='refresh_token'&&body.refresh_token==='refresh-m59-'+n);
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
  await page.goto(origin+'/public/index.html?mission4Preview=research&losslessV4M3=research',
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
  try{
   await page.waitForFunction(()=>window.closetAuth?.user?.id==='m59-A'&&
     db?.name==='closet-current-user-m59-A'&&
     typeof currentBoard!=='undefined'&&
     currentBoard.slots?.top==='m59-A-reviewed-public-photo',
     null,{timeout:12000});
  }catch{
   // Safe fixture-only diagnostics; NEVER log original pixels or tokens.
   const diagnostic=await page.evaluate(async()=>{
    const owner=window.closetAuth?.user?.id||null;
    const dbName=typeof db!=='undefined'?db?.name:null;
    const board=typeof currentBoard!=='undefined'?currentBoard:null;
    const roster=typeof items!=='undefined'?items:null;
    let stored=null,row=null;
    try{
     if(db){
      const get=(store,id)=>new Promise((resolve,reject)=>{
       const req=db.transaction(store).objectStore(store).get(id);
       req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
      });
      stored=await get('state','outfit-board');
      row=await get('items','m59-A-reviewed-public-photo');
     }
    }catch{}
    return {owner,dbName,boardInitialized:typeof boardInitialized!=='undefined'&&boardInitialized,
     nativeCurrentSlots:board?.slots||null,storedBoardSlots:stored?.current?.slots||null,
     nativeRosterCount:Array.isArray(roster)?roster.length:null,
     nativeRosterContainsSaved:Array.isArray(roster)&&roster.some(x=>x.id==='m59-A-reviewed-public-photo'),
     savedItemExists:!!row,savedItemPhotoOnly:row?.photoOnly===true,
     savedItemCategory:row?.category||null,releaseAuthorized:false};
   });
   throw Error('M59 native saved lower-trust photo-only row reload gate blocked; safe diagnostic: '+JSON.stringify(diagnostic));
  }
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
    cleanBoard:cleanOutfitBoard,events:window,doc:document
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

  stage='actual native v4 full owner photo-only backup export';
  const pendingDownload=page.waitForEvent('download',{timeout:30000});
  const exportMessage=await page.evaluate(async()=>{
   await document.getElementById('export').onclick();
   return document.getElementById('message')?.textContent||'';
  });
  assert.match(exportMessage,/Complete private v4 backup exported/i,
   'native v4 export did not run after actual photo-only save');
  const downloaded=await pendingDownload;
  assert.match(downloaded.suggestedFilename(),/owner-backup-v4\.json/);
  const backup=JSON.parse(await readFile(await downloaded.path(),'utf8'));
  assert.equal(backup.format,'closet-current');
  assert.equal(backup.version,4);
  assert.equal(backup.ownerId,'m59-A');
  assert.equal(backup.items.length,1);
  const backedUp=backup.items[0];
  assert.equal(backedUp.id,'m59-A-reviewed-public-photo');
  assert.equal(backedUp.originalPhoto?.image,image);
  assert.equal(backedUp.originalPhoto?.sha256,sha);
  assert.equal(backedUp.sourceSHA256,sha);
  assert.equal(backedUp.ownerId,'m59-A');
  assert.equal(backedUp.photoOnly,true);
  assert.equal(backedUp.sourceCropReviewed,true);
  assert.equal(backedUp.singleGarmentVerified,false);
  assert.equal(backedUp.threeDReady,false);
  assert.equal(backup.state?.['outfit-board']?.current?.slots?.top,backedUp.id);
  // This helper invokes the ACTUAL native input handler; unlike a direct
  // module call it exercises app owner leases, validation, and confirmation.
  const importFile=async(data,accept)=>page.evaluate(async({data,accept})=>{
   window.confirm=()=>accept;
   const json=JSON.stringify(data);
   await document.getElementById('import').onchange({
    target:{files:[{size:json.length,text:async()=>json}],value:'m59-research-import'}
   });
   return document.getElementById('message')?.textContent||'';
  },{data,accept});
  const ownerSnapshot=()=>page.evaluate(async()=>{
   const owner=window.closetAuth?.user?.id;
   const transaction=db.transaction(['items','state'],'readonly');
   return new Promise((resolve,reject)=>{
    const item=transaction.objectStore('items').get('m59-A-reviewed-public-photo');
    const board=transaction.objectStore('state').get('outfit-board');
    const marker=transaction.objectStore('state').get('cloud-sync');
    transaction.oncomplete=()=>resolve({
     owner,itemExists:!!item.result,
     sourceSHA256:item.result?.sourceSHA256,
     originalSHA256:item.result?.originalPhoto?.sha256,
     color:item.result?.color,photoOnly:item.result?.photoOnly,
     cropReviewed:item.result?.sourceCropReviewed,
     physicalUnitVerified:item.result?.singleGarmentVerified,
     threeDReady:item.result?.threeDReady,
     boardTop:board.result?.current?.slots?.top||null,
     cloudDirty:marker.result?.dirty===true
    });
    transaction.onerror=transaction.onabort=()=>reject(transaction.error);
   });
  });
  const beforeImport=await ownerSnapshot();
  const corrupted=structuredClone(backup);
  corrupted.items[0].originalPhoto.sha256='f'.repeat(64);
  const badNotice=await importFile(corrupted,true);
  assert.match(badNotice,/source|sha|jpeg|M3_V4|identity|mismatch/i,
   'native v4 import failed to reject source hash tampering');
  assert.deepEqual(await ownerSnapshot(),beforeImport,
   'tampered v4 backup changed private owner record or native outfit');
  const foreign=structuredClone(backup);
  foreign.ownerId='m59-B';
  const wrongOwnerNotice=await importFile(foreign,true);
  assert.match(wrongOwnerNotice,/owner|bound|account/i,
   'native v4 import accepted another principal');
  assert.deepEqual(await ownerSnapshot(),beforeImport,
   'foreign-owner backup modified owner A wardrobe');
  const cancelled=await importFile(backup,false);
  assert.match(cancelled,/cancel/i,'real owner cancellation was ignored');
  assert.deepEqual(await ownerSnapshot(),beforeImport);
  stage='simulate local test-owner edit then actual v4 restore';
  await page.evaluate(async()=>{
   // Make an original-free metadata-only local edit in our disposable
   // synthetic A IDB. The verified backup must undo it exactly.
   const tx=db.transaction('items','readwrite');
   const store=tx.objectStore('items');
   const row=await new Promise((resolve,reject)=>{
    const r=store.get('m59-A-reviewed-public-photo');
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   if(!row)throw Error('M59 expected synthetic original row missing');
   row.color='Temporary edited color';
   store.put(row);
   await new Promise((resolve,reject)=>{
    tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
   });
   window.dispatchEvent(new Event('closet:style-owned-inventory-committed'));
  });
  assert.equal(await page.locator('#main59Gallery img').count(),0,
   'research gallery retained stale JPEG after private wardrobe mutation');
  assert.equal((await ownerSnapshot()).color,'Temporary edited color');
  const restoreMessage=await importFile(backup,true);
  assert.match(restoreMessage,/restored.*v4|v4.*restored/i,
   'native v4 import did not commit the owner-bound original');
  const afterRestore=await ownerSnapshot();
  assert.equal(afterRestore.owner,'m59-A');
  assert.equal(afterRestore.color,'Black');
  assert.equal(afterRestore.sourceSHA256,sha);
  assert.equal(afterRestore.originalSHA256,sha);
  assert.equal(afterRestore.photoOnly,true);
  assert.equal(afterRestore.cropReviewed,true);
  assert.equal(afterRestore.physicalUnitVerified,false);
  assert.equal(afterRestore.threeDReady,false);
  assert.equal(afterRestore.boardTop,backedUp.id);
  assert.equal(afterRestore.cloudDirty,true);
  // Reload the REAL app after its atomic restore. All bridge references must
  // be reacquired, not carried over from the old owner/DB session.
  stage='reopen original photo-only native board after same-owner v4 restore';
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.closetAuth?.user?.id==='m59-A'&&
   db?.name==='closet-current-user-m59-A'&&
   typeof currentBoard!=='undefined'&&
   currentBoard.slots?.top==='m59-A-reviewed-public-photo',
   null,{timeout:45000});
  const afterGallery=await page.evaluate(async()=>{
   switchView('builder');
   const host=document.createElement('section');
   host.id='main59Gallery';
   const builder=document.getElementById('mission4Preview1054Section');
   if(!builder)throw Error('M59 restored native builder unavailable');
   builder.append(host);
   const {mountReviewedPhotoOnlyGallery59}=await import(
    '/research/master-consolidation-1054/reviewed-photo-only-gallery59.mjs');
   const mounted=mountReviewedPhotoOnlyGallery59({
    target:host,getSession:currentPhotoOwnerSession167,
    readOwnerItems:signedOwnerSavedRows167,
    getBoard:()=>structuredClone(currentBoard),
    cleanBoard:cleanOutfitBoard,events:window,doc:document
   });
   window.m59GalleryResearch=mounted;
   const info=await mounted.refresh();
   const img=host.querySelector('img');
   return {info,original:img?.src,
    warning:host.querySelector('[data-physical-garment-unit]')?.textContent};
  });
  assert.equal(afterGallery.info.photoCount,1);
  assert.equal(afterGallery.info.renderAuthorized3D,false);
  assert.equal(afterGallery.info.fittedOutfitAuthorized,false);
  assert.equal(afterGallery.original,image,
   'native source view did not preserve original JPEG after v4 restore');
  assert.match(afterGallery.warning,/physical garment boundaries/i);
  assert.equal(await page.locator('#outfit3D01Canvas').count(),0);
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
   ownerBOriginalLeak:false,realV4BackupDownload:true,
   tamperedV4SourceRejected:true,foreignV4OwnerRejected:true,
   nativeOwnerCanceledV4Unchanged:true,atomicV4OwnerRestore:true,
   originalJPEGAndFlagsRestored:true,restoredNativeGallery:true,
   cloudRevisionDirtyAfterRestore:true,
   releaseAuthorized:false,familyAlpha:'HOLD'});
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
   threeDAuthorized:false,actualHostedRLS:false,physicalPhone:false,
   familyAlpha:'HOLD',releaseAuthorized:false,cases},null,2)+'\n');
 console.log('M60_ACTUAL_NATIVE_PHOTO_ONLY_V4_RESTORED_GALLERY_PASS',
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
