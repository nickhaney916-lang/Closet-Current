/**
 * MAIN1054 M51 — the REAL Closet Current app shell, not a synthetic page:
 * genuine public Commons-0053 JPEG -> native PHOTO119 atomic owner-reviewed
 * commit in actual native account IndexedDB -> real Outfit Builder board,
 * original-photo-only app preview and session/source revocation.
 *
 * All auth HTTP responses and explicit reviewed garment labels are SYNTHETIC.
 * This is neither hosted JWT/RLS nor independent category/color agreement.
 * Never deploy, merge or use real wardrobe photos. Family Alpha #255 HOLD.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {M48} from '../research/main1054-3d48/photo-neckline-edge-admission48.mjs';

const engine=process.env.M51_ENGINE;
assert.ok(['chromium','webkit'].includes(engine),'M51_ENGINE requires actual browser engine');
const sourceBytes=await readFile('benchmark/fixtures/commons-0053.jpg');
const hash=b=>createHash('sha256').update(b).digest('hex');
const originalSHA=hash(sourceBytes);
assert.equal(originalSHA,M48.sourceSHA256,'original public dress photograph SHA mismatch');
const originalJPEG='data:image/jpeg;base64,'+sourceBytes.toString('base64');
const root=resolve('.');
const out=join('benchmark','main51-real-app-owner-2d',engine);
await mkdir(out,{recursive:true});
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.json':'application/json','.css':'text/css','.svg':'image/svg+xml',
 '.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(req.method!=='GET'||!/^\/(public\/|research\/|node_modules\/)/.test(path)||
     path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('protected local app shell source');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/'))throw Error('source escaped git worktree');
  const data=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});
  res.end(data);
 }catch{res.writeHead(404);res.end('M51_NONPUBLIC_NOT_SERVED');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const authHost='https://hlkgymugtfbirlpunsra.supabase.co';
const cloudStub='window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};';
const failures=[],network=[],cases=[],screens=[],donor=[];
let counter=0,browser;
const authRoute=route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/auth/v1/logout')
  return route.fulfill({status:204,body:''});
 if(url.pathname==='/auth/v1/token'){
  let data={};try{data=JSON.parse(req.postData()||'{}');}catch{}
  const grant=url.searchParams.get('grant_type');
  let owner=null;
  if(grant==='password'&&/^m51-[AB]@example\.test$/.test(data.email||''))
   owner=data.email.split('@')[0];
  if(grant==='refresh_token'&&/^refresh-m51-[AB]$/.test(data.refresh_token||''))
   owner=data.refresh_token.slice('refresh-'.length);
  if(!owner)return route.fulfill({status:401,contentType:'application/json',
   body:JSON.stringify({msg:'Unapproved research credential'})});
  return route.fulfill({status:200,contentType:'application/json',
   body:JSON.stringify({user:{id:owner,email:owner+'@example.test'},
    access_token:'synthetic-m51-'+owner+'-'+(++counter),
    refresh_token:'refresh-'+owner,expires_in:3600})});
 }
 network.push({kind:'unapproved-auth',method:req.method()});
 return route.abort();
};
const signin=async(page,owner)=>{
 await page.locator('#authEmail').fill(owner+'@example.test');
 await page.locator('#authPassword').fill('research-fixture-only');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(id=>window.closetAuth?.user?.id===id&&
  db?.name==='closet-current-user-'+id&&
  document.getElementById('appShell')?.hidden===false,owner,{timeout:30000});
};
const count=page=>page.locator('#mission4Preview1054Photos img').count();
async function clickPreview(page,{approved=true}={}){
 await page.evaluate(()=>switchView('builder'));
 await page.locator('#mission4Preview1054Section button').waitFor({timeout:20000});
 await page.locator('#mission4Preview1054Section button').click();
 await page.waitForFunction(approve=>{
  const text=document.getElementById('mission4Preview1054Status')?.textContent||'';
  return approve?text.includes('2D only')||text.includes('Preview refused'):
   text.includes('Preview refused');
 },approved,{timeout:20000});
 const status=await page.locator('#mission4Preview1054Status').innerText();
 if(approved)assert.match(status,/original photo\(s\) verified.*2D only/,
  'native shell failed owner-approved original JPEG preview: '+status);
 else assert.match(status,/Preview refused/,'native shell failed to refuse unreviewed/photo change');
}
async function blank(page,why){
 const value=await page.evaluate(()=>{
  const state=mission4Preview1054Viewer?.status;
  return {count:document.querySelectorAll('#mission4Preview1054Photos img').length,
   hasOwnerPhotos:state?.hasOwnerPhotos,authorized3D:state?.renderAuthorized3D,
   release:state?.releaseAuthorized};
 });
 assert.equal(value.count,0,why+' still displayed an old owner JPEG');
 assert.equal(value.hasOwnerPhotos,false,why+' owner still has old JPEG');
 assert.equal(value.authorized3D,false,why+' admitted 3D');
 assert.equal(value.release,false,why+' authorized release');
}
let stage='startup',activeWidth=null;
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true,
  ...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 for(const width of [320,390,430]){
  activeWidth=width;
  const context=await browser.newContext({viewport:{width,height:880},
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const url=route.request().url();
   if(url.endsWith('/public/cloud-backup.js'))
    return route.fulfill({contentType:'text/javascript',body:cloudStub});
   if(url.startsWith(origin+'/')||url.startsWith('data:')||url.startsWith('blob:'+origin)){
    if(/\/(donor\/|research\/native-3d-05\/|research\/outfit-3d-01\/)/.test(url))
     donor.push({engine,width,kind:'forbidden3d'});
    return route.continue();
   }
   if(url.startsWith(authHost+'/auth/v1/'))return authRoute(route);
   // Native app styles/trends may request public optional assets. Never
   // allow them to touch the network in CI, but a blocked GET attempt is
   // not evidence of a user-photo exfiltration or failed local app login.
   const hostname=new URL(url).hostname;
   if(route.request().method()==='GET'&&
      ['fonts.googleapis.com','raw.githubusercontent.com'].includes(hostname))
    return route.abort();
   network.push({engine,width,kind:'unexpected-remote',host:hostname,
    method:route.request().method()});
   return route.abort();
  });
  const page=await context.newPage();
  page.on('pageerror',e=>failures.push({engine,width,kind:'js-exception',name:e.name}));
  page.on('crash',()=>failures.push({engine,width,kind:'crash'}));
  stage='open-actual-app';
  await page.goto(origin+'/public/index.html?mission4Preview=research',
   {waitUntil:'domcontentloaded'});
  stage='real-native-login-A';
  await signin(page,'m51-A');
  stage='preflight-unreviewed-original-draft';
  const prepared=await page.evaluate(async({image,sourceSHA})=>{
   const owner='m51-A',itemId='m51-A-licensed-dress';
   if(window.closetAuth?.user?.id!==owner||
      db?.name!=='closet-current-user-'+owner)
    throw Error('M51 original native signed account unavailable');
   const actualAuth=window.closetAuth,actualDB=db,originalEpoch=captureOperationEpoch;
   const record={id:itemId,ownerId:owner,category:'Uncategorized',
    itemType:'Unknown',color:'Unknown',singleGarmentVerified:false,
    sourceSHA256:sourceSHA,sourceHashVerified:true,
    originalPhoto:{image,sha256:sourceSHA},image};
   const review={confirmed:true,recordId:itemId,originalSHA256:sourceSHA,
    category:'Dresses',itemType:'Casual dress',color:'Black',
    singleGarmentConfirmed:true};
   const put=(store,id,value)=>new Promise((resolve,reject)=>{
    const tx=actualDB.transaction(store,'readwrite');
    tx.objectStore(store).put(value);tx.oncomplete=resolve;
    tx.onabort=tx.onerror=()=>reject(tx.error);
   });
   await put('state','draft',{id:'draft',batch:[structuredClone(record)]});
   const {preflightOwnedOutfit1054}=await import('../research/main-thread-integration-1054/source-to-outfit.mjs');
   let rejected=false;
   try{
    await preflightOwnedOutfit1054({getSession:currentPhotoOwnerSession167,
     readOwnerItems:signedOwnerSavedRows167,cleanBoard:cleanOutfitBoard,
     board:{name:'Pending unreviewed photo',slots:{top:itemId}}});
   }catch{rejected=true;}
   if(!rejected)throw Error('M51 silently saved unreviewed private source');
   return {ownerConfirmedReviewNotYetSaved:true,ownerSynthetic:true,
    realAppSignedAuth:true,liveBrowserPrivateDb:true};
  },{image:originalJPEG,sourceSHA:originalSHA});
  assert.equal(prepared.ownerConfirmedReviewNotYetSaved,true);
  stage='real-photo119-atomic-owner-review-save';
  const commit=await page.evaluate(async({image,sourceSHA})=>{
   const owner='m51-A',itemId='m51-A-licensed-dress';
   const auth=window.closetAuth,privateDB=db,epoch=captureOperationEpoch;
   const source={id:itemId,ownerId:owner,category:'Uncategorized',
    itemType:'Unknown',color:'Unknown',singleGarmentVerified:false,
    sourceSHA256:sourceSHA,sourceHashVerified:true,
    originalPhoto:{image,sha256:sourceSHA},image};
   const review={confirmed:true,recordId:itemId,originalSHA256:sourceSHA,
    category:'Dresses',itemType:'Casual dress',color:'Black',
    singleGarmentConfirmed:true};
   const {commitHumanReviewedPhoto119}=await import('/public/native-reviewed-private-save-167.mjs');
   const receipt=await commitHumanReviewedPhoto119({
    db:privateDB,ownerId:owner,currentOwner:()=>window.closetAuth?.user?.id,
    record:source,review,cryptoProvider:crypto,
    assertLease:()=>window.closetAuth===auth&&db===privateDB&&
     captureOperationEpoch===epoch&&auth.user?.id===owner
   });
   if(!receipt.saved||receipt.releaseAuthorized!==false)
    throw Error('M51 PHOTO119 original owner save returned NOT SAVED');
   const row=await new Promise((resolve,reject)=>{
    const r=privateDB.transaction('items','readonly').objectStore('items').get(itemId);
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   if(row?.sourceSHA256!==sourceSHA||row?.originalPhoto?.image!==image||
      row?.ownerReviewed!==true||row?.confirmedDetailsSource31?.sourceSHA256!==sourceSHA)
    throw Error('M51 saved actual private owner row lost genuine source or reviewed fields');
   const board={id:'outfit-board',current:{name:'Public licensed original 2D only',
    occasion:'Casual',slots:{top:itemId}},saved:[]};
   await new Promise((resolve,reject)=>{
    const tx=privateDB.transaction('state','readwrite');
    tx.objectStore('state').put(board);
    tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
   });
   return {saved:true,reviewedOriginalSource:true,
    exactSavedJpeg:true,sourceBoundHumanReview:true,
    originalReviewWasSynthetic:true,consumer3D:false,
    releaseAuthorized:false};
  },{image:originalJPEG,sourceSHA:originalSHA});
  assert.equal(commit.saved,true);
  stage='reload-actual-app-native-owner-board';
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.closetAuth?.user?.id==='m51-A'&&
    db?.name==='closet-current-user-m51-A'&&
    typeof currentBoard!=='undefined'&&
    currentBoard.slots?.top==='m51-A-licensed-dress',
   null,{timeout:30000});
  stage='actual-native-app-preview-button';
  await clickPreview(page);
  assert.equal(await count(page),1);
  const picture=await page.locator('#mission4Preview1054Photos img').evaluate(async im=>{
   await im.decode();
   return {src:im.getAttribute('src'),width:im.naturalWidth,height:im.naturalHeight,
    complete:im.complete};
  });
  assert.equal(picture.src,originalJPEG,'app displayed a substituted source JPEG');
  assert.ok(picture.width>=800&&picture.height>=800,'original dress image not decoded');
  assert.equal(await page.locator('#outfit3D01Canvas').count(),0,
   'unapproved photo to 3D viewer allocation');
  const png=await page.locator('#mission4Preview1054Section').screenshot();
  const filename=engine+'-'+width+'-native-owned-licensed-2d.png';
  await writeFile(join(out,filename),png);
  screens.push({width,sha256:hash(png),name:filename});
  stage='real-app-owner-session-and-board-revocation';
  await page.evaluate(()=>{
   currentBoard.occasion='Dinner';window.dispatchEvent(new Event('focus'));
  });
  await blank(page,'outfit occasion changed');
  await page.evaluate(()=>{currentBoard.occasion='Casual';});
  await clickPreview(page);
  await page.evaluate(()=>{
   const original=window.closetAuth;
   window.closetAuth={...original,user:original.user,assertCurrent:()=>{}};
   try{window.dispatchEvent(new Event('focus'));}
   finally{window.closetAuth=original;}
  });
  await blank(page,'same owner new auth reference');
  await clickPreview(page);
  await page.evaluate(()=>{
   const old=db;db={name:old.name};
   try{window.dispatchEvent(new Event('focus'));}
   finally{db=old;}
  });
  await blank(page,'same named private DB connection changed');
  await clickPreview(page);
  await page.evaluate(()=>{captureOperationEpoch++;window.dispatchEvent(new Event('focus'));});
  await blank(page,'native owner generation changed');
  await clickPreview(page);
  await page.evaluate(()=>window.dispatchEvent(new Event('closet:session-locked')));
  await blank(page,'native signed owner session locked');
  stage='tampered-actual-original-source-sha';
  // The real app revoked its live private DB after session lock. Reopen
  // ONLY the disposable synthetic owner A test IndexedDB, as original M18
  // does; never revive the revoked native app database/session lease.
  await page.evaluate(()=>new Promise((resolve,reject)=>{
   const open=indexedDB.open('closet-current-user-m51-A',2);
   open.onerror=()=>reject(open.error);
   open.onsuccess=()=>{
    const conn=open.result;
    let tx;
    try{tx=conn.transaction('items','readwrite');}
    catch(error){conn.close();reject(error);return;}
    const store=tx.objectStore('items'),r=store.get('m51-A-licensed-dress');
    r.onsuccess=()=>{
     const item=r.result;
     if(!item){conn.close();reject(Error('missing saved licensed original'));return;}
     item.originalPhoto.sha256='0'.repeat(64);
     store.put(item);
    };
    tx.oncomplete=()=>{conn.close();resolve();};
    tx.onabort=tx.onerror=()=>{conn.close();reject(tx.error);};
   };
  }));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.closetAuth?.user?.id==='m51-A'&&
   db?.name==='closet-current-user-m51-A',{timeout:30000});
  await clickPreview(page,{approved:false});
  assert.equal(await count(page),0);
  stage='native-app-full-owner-logout-and-owner-B';
  await page.locator('.account-menu summary').click();
  await page.locator('#logout').click();
  await page.waitForFunction(()=>document.getElementById('authGate')?.hidden===false,
   null,{timeout:30000});
  assert.equal(await count(page),0,'owner A original visible after actual logout');
  await signin(page,'m51-B');
  await page.evaluate(()=>switchView('builder'));
  await page.locator('#mission4Preview1054Section button').waitFor();
  await page.locator('#mission4Preview1054Section button').click();
  await page.waitForFunction(()=>document.getElementById('mission4Preview1054Status')
   ?.textContent.includes('Preview refused'),null,{timeout:20000});
  assert.equal(await count(page),0,'owner B saw previous owner A original photograph');
  assert.equal(await page.locator('#outfit3D01Canvas').count(),0);
  cases.push({width,engine,realNativeAppShell:true,
   actualPhoto119Save:true,actualReviewSynthetic:true,
   originalJpegDecoded:true,originalPhoto2DOnly:true,
   sourceTamperRejected:true,sameOwnerAuthSwapRevoked:true,
   sameNamedPrivateDbSwapRevoked:true,ownerGenerationRevoked:true,
   ownerALogoutRemovedImages:true,ownerBDeniedOldOwnerPhoto:true,
   threeDLoaded:false,consumer3D:false,releaseAuthorized:false,familyAlpha:'HOLD'});
  await context.close();
 }
 assert.deepEqual(failures,[],'browser page exception or crash');
 assert.deepEqual(network,[],'unauthorized remote call');
 assert.deepEqual(donor,[],'unauthorized 3D donor import');
 assert.equal(cases.length,3);
 assert.equal(screens.length,3);
 await writeFile(join(out,'M51-native-owner-source-2d-NOT-RELEASE.json'),
  JSON.stringify({schema:'MAIN1054_M51_REAL_APP_NATIVE_OWNER_PUBLIC_PHOTO_2D_ONLY/v1',
   engine,actualNativeAppShell:true,realChromeOrWebkit:true,
   sourceSHA256:originalSHA,screenshotCount:screens.length,
   photoReallyDecoded:true,actualBrowserPrivateIndexedDB:true,
   actualAppOwnerButtonUsed:true,realUserAccounts:false,
   syntheticReviewedCategoryColor:true,hostedJWTAndRLS:false,
   physicalAndroidIphone:false,independentHumanReview:false,
   consumer3D:false,releaseAuthorized:false,familyAlpha:'HOLD',
   screenshots:screens,cases},null,2)+'\n');
 console.log('MAIN51_ACTUAL_APP_ORIGINAL_OWNER_2D_HOLD',
  JSON.stringify({engine,widths:cases.map(x=>x.width),originalSourceVerified:true,
   realAppShell:true,originalReviewedSave:true,ownerAtoBDenied:true,
   no3D:true,releaseAuthorized:false,familyAlpha:'HOLD'}));
}catch(error){
 console.error('MAIN51_APP_SOURCE_FAIL',JSON.stringify({
  stage,width:activeWidth,engine,errorName:error?.name||'Error',
  message:String(error?.message||error).slice(0,250),
  pageErrors:failures.slice(0,6),network:network.slice(0,6)
 }));
 process.exitCode=1;
}finally{await browser?.close();await new Promise(done=>server.close(done));}
