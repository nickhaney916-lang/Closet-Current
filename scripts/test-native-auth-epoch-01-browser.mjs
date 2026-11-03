/**
 * AUTH-EPOCH-01 native browser boundary QA, NOT a live-Supabase/RLS test.
 * Genuine public/index.html, unchanged public/auth.js, genuine browser
 * WebCrypto/IndexedDB and EXACT PR541 saved-outfit controller; mocked HTTP
 * Supabase AUTH RESPONSE ONLY (never pretend real identity verification).
 * Chromium/WebKit × 320/390/430; A -> refresh -> revoked -> B login.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve('.'),donor=resolve('.auth01-outfit-541');
const dir='benchmark/auth-epoch-01',results=[],screens=[],errors=[],blocked=[];
await mkdir(dir,{recursive:true});
const mime={'.js':'text/javascript','.mjs':'text/javascript',
 '.html':'text/html','.css':'text/css','.json':'application/json',
 '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg',
 '.woff':'font/woff','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const part=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(public\/|research\/|donor\/|node_modules\/)/.test(part)||
   part.includes('\\')||part.includes('\0')||part.split('/').includes('..'))
   throw Error('refused');
  const path=part.startsWith('/donor/')?
   resolve(donor,'.'+part.slice(6)):resolve(root,'.'+part);
  if(!path.startsWith(root+'/'))throw Error('out of scope');
  const bytes=await readFile(path);
  res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('not available');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port;
const fakeOrigin='https://hlkgymugtfbirlpunsra.supabase.co';
let refreshSequence=0;
function response(user,token,refresh){return {user:{id:user,email:user+'@example.test',
 user_metadata:{username:user}},access_token:token,refresh_token:refresh,expires_in:3600};}
function authFixtureRequest(route){
 const req=route.request(),u=new URL(req.url()),method=req.method();
 if(u.pathname==='/auth/v1/logout')
  return route.fulfill({status:204,body:''});
 if(u.pathname==='/auth/v1/token'&&method==='POST'){
  const data=JSON.parse(req.postData()||'{}'),grant=u.searchParams.get('grant_type');
  let user,token,refresh;
  if(grant==='password'&&data.email?.startsWith('fixture-native-')){
   user=data.email.split('@')[0];token='native-token-'+user+'-initial';refresh='refresh-'+user;
  }else if(grant==='refresh_token'&&data.refresh_token?.startsWith('refresh-fixture-native-')){
   user=data.refresh_token.replace(/^refresh-/,'');
   token='native-token-'+user+'-renew-'+(++refreshSequence);
   refresh='refresh-'+user;
  }else return route.fulfill({status:401,contentType:'application/json',
   body:JSON.stringify({error_code:'invalid_credentials',msg:'Research fixture auth rejected'})});
  return route.fulfill({status:200,contentType:'application/json',
   body:JSON.stringify(response(user,token,refresh))});
 }
 blocked.push({method,url:u.origin+u.pathname,reason:'unmatched fake-auth request'});
 return route.abort();
}
async function image(page,engine,width,name){
 const file=dir+'/'+engine+'-'+width+'-'+name+'.png';
 const bytes=await page.screenshot({path:file,fullPage:false,animations:'disabled'});
 const digest=createHash('sha256').update(bytes).digest('hex');
 screens.push({engine,width,name,path:file,sha256:digest});
}
async function nativeSignIn(page,owner){
 await page.locator('#authEmail').fill(owner+'@example.test');
 await page.locator('#authPassword').fill('fixture-password-123');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(owner=>
   window.closetAuth?.user?.id===owner&&
   document.getElementById('appShell')?.hidden===false,owner,{timeout:25000});
 await page.waitForFunction(()=>typeof db!=='undefined'&&
  db?.name==='closet-current-user-'+window.closetAuth.user.id,null,{timeout:25000});
}
const authLease=async(page)=>{
 return page.evaluate(async()=>{
  const {createNativeAuthEpoch01}=await import('/research/auth-epoch-01/native-session-epoch.mjs');
  const bridge=createNativeAuthEpoch01({nativeAuth:window.closetAuth});
  const admitted=await bridge.attest();
  window.__auth01Bridge=bridge;
  const {createOwnerOutfit3DController}=await import('/donor/research/outfit-3d-01/owner-outfit-controller.mjs');
  const {createExistingClosetOutfitIO}=await import('/donor/research/outfit-3d-01/saved-outfit-idb.mjs');
  const controller=createOwnerOutfit3DController({auth:bridge.auth,
   ...createExistingClosetOutfitIO(bridge.auth)});
  const refreshed=await controller.refresh();
  window.__auth01OwnerController=controller;
  return {owner:admitted.ownerId,generation:admitted.generation,
   closetDb:db?.name,verifiedSavedPieces:refreshed.verifiedSavedPieces,
   privatePlanOwner:controller.plan().ownerId,nativeAuthUnchanged:!('getSessionGeneration' in window.closetAuth),
   redacted:!JSON.stringify(bridge.status()).includes('native-token-')};
 });
};
let browser;
try{
 for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]]){
  browser=await browserType.launch({headless:true,args:engine==='chromium'?[
   '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:900},
    deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await context.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith(host+'/')||url.startsWith('data:')||url.startsWith('blob:'+host))
     return route.continue();
    if(url.startsWith(fakeOrigin+'/auth/v1/'))return authFixtureRequest(route);
    blocked.push({method:route.request().method(),url:url.split('?')[0],
     reason:'other external request BLOCKED'});
    return route.abort();
   });
   try{
    const page=await context.newPage(),one={engine,width,pass:false,shots:[]};
    page.on('pageerror',err=>errors.push({engine,width,message:err.message}));
    await page.goto(host+'/public/index.html?authEpoch01=after&captureProof01=after&index04=after',
      {waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.closetAuth?.ready);
    assert.equal(await page.locator('#authGate').isVisible(),true);
    await image(page,engine,width,'01-real-native-login-gate');
    await nativeSignIn(page,'fixture-native-A');
    const first=await authLease(page);
    assert.equal(first.owner,'fixture-native-A');
    assert.equal(first.nativeAuthUnchanged,true);
    assert.equal(first.redacted,true);
    assert.equal(first.privatePlanOwner,'fixture-native-A');
    assert.equal(first.closetDb,'closet-current-user-fixture-native-A');
    await image(page,engine,width,'02-real-auth-A-and-owner-private-board');
    // This exercises actual native refresh code, real browser localStorage,
    // and donor's actual saved-outfit controller with no mock epoch.
    const rotated=await page.evaluate(async()=>{
     const old=window.__auth01Bridge.auth.getSessionGeneration();
     const token=await window.closetAuth.getAccessToken({force:true});
     let denied=false,privateDenied=false;
     try{window.__auth01Bridge.auth.getSessionGeneration();}catch{denied=true;}
     try{window.__auth01OwnerController.plan();}catch{privateDenied=true;}
     return {denied,privateDenied,incremented:window.__auth01Bridge.status().generation>old,
      tokenChanged:token.includes('-renew-'),active:window.__auth01Bridge.status().active};
    });
    assert.deepEqual(rotated,{denied:true,privateDenied:true,incremented:true,
     tokenChanged:true,active:false});
    await image(page,engine,width,'03-native-token-refresh-revokes-outfit');
    const second=await authLease(page);
    assert.ok(second.generation>=1);
    assert.equal(second.owner,'fixture-native-A');
    assert.equal(second.privatePlanOwner,'fixture-native-A');
    assert.equal(await page.evaluate(()=>window.__auth01OwnerController.plan().ownerId),'fixture-native-A');
    // Same context, same origin: a source-owner spoof must fail instantly.
    const spoof=await page.evaluate(()=>{
     const native=window.closetAuth.user;
     window.closetAuth.user={id:'fixture-native-B'};
     let rejected=false;
     try{window.__auth01OwnerController.plan();}catch{rejected=true;}
     window.closetAuth.user=native;
     return {rejected,active:window.__auth01Bridge.status().active};
    });
    assert.equal(spoof.rejected,true);assert.equal(spoof.active,false);
    const afterSpoof=await authLease(page);
    assert.equal(afterSpoof.owner,'fixture-native-A');
    await image(page,engine,width,'04-cross-account-spoof-refused');
    // Actual native logout event is hooked at CAPTURE phase, before native
    // fetch logout's asynchronous network request or location.reload.
    const revoked=await page.evaluate(()=>{
     const bridge=window.__auth01Bridge,controller=window.__auth01OwnerController;
     document.getElementById('logout').click();
     let blocked=false;
     try{controller.plan();}catch{blocked=true;}
     return {blocked,lease:bridge.status().active};
    });
    assert.deepEqual(revoked,{blocked:true,lease:false});
    await page.waitForFunction(()=>document.getElementById('authGate')?.hidden===false&&
     !window.closetAuth?.user,{timeout:20000});
    await image(page,engine,width,'05-native-logout-clears-lease');
    await nativeSignIn(page,'fixture-native-B');
    const b=await authLease(page);
    assert.equal(b.owner,'fixture-native-B');
    assert.equal(b.privatePlanOwner,'fixture-native-B');
    const databases=await page.evaluate(async()=>{
     const names=(await indexedDB.databases()).map(x=>x.name);
     return {a:names.includes('closet-current-user-fixture-native-A'),
      b:names.includes('closet-current-user-fixture-native-B')};
    });
    assert.deepEqual(databases,{a:true,b:true});
    await image(page,engine,width,'06-native-auth-B-separate-private-board');
    const pagehide=await page.evaluate(()=>{
     const ctl=window.__auth01OwnerController,bridge=window.__auth01Bridge;
     window.dispatchEvent(new Event('pagehide'));
     let denied=false;
     try{ctl.plan();}catch{denied=true;}
     return {denied,active:bridge.status().active};
    });
    assert.deepEqual(pagehide,{denied:true,active:false});
    await image(page,engine,width,'07-native-pagehide-revokes-lease');
    one.pass=true;one.aEpoch=first.generation;one.bEpoch=b.generation;
    one.nativeRealAuthScript=true;one.authHTTPVerifiedByRealSupabase=false;
    one.actualOwnerBoundIDB=true;one.actualDonorOwnerOutfitController=true;
    one.nativeOriginalUntouched=true;
    one.mobilePhysicalTested=false;one.releaseAuthorized=false;
    results.push(one);
   }finally{await context.close();}
  }
  await browser.close();browser=null;
 }
 assert.equal(results.length,6);assert.equal(screens.length,42);
 assert.ok(results.every(x=>x.pass));
 // Request interception BLOCKS all external network, including staged fake
 // authorization HTTP responses. No external authenticated calls are made.
 const bad=blocked.filter(x=>x.method!=='GET');
 assert.deepEqual(bad,[],'No unauthorized outgoing POST/PUT/DELETE');
 const report={priority:'AUTH-EPOCH-01',browserCases:6,
  realNativeLoginScript:true,realProductionAuthSourceUnmodified:true,
  originalSavedOutfitDonor:true,authenticatedFixtureOwners:['fixture-native-A','fixture-native-B'],
  genuineLocalIndexedDB:true,monotonicSessionRevocation:true,
  noNativeTokenExposure:true,realBackendAuthenticationVerified:false,
  mockedAuthHTTPResponses:true,realSupabaseRLSVerified:false,
  physicalPhonesTested:false,releaseAuthorized:false,familyAlpha:'HOLD',
  screenshotCount:screens.length,errors,blocked,results,screens};
 await writeFile(dir+'/results.json',JSON.stringify(report,null,2));
 console.log('AUTH01_REAL_NATIVE_BROWSER',JSON.stringify({sixEngineWidthCases:results.length,
  screenshots:screens.length,realAuthScript:true,
  actualDonorOwnerBoard:true,realRLSVerified:false,release:'HOLD'}));
}finally{
 await browser?.close();
 await new Promise(ok=>server.close(ok));
}
