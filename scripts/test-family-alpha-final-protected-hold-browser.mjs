/**
 * Family Alpha #255 - final complete staging preview HOLD bundle browser smoke.
 * ALL web requests are intercepted and fulfilled ONLY from local generated
 * fixtures. No real Cloudflare, Supabase, Resend, production or other APIs.
 * No family/user accounts, photos, tokens, Auth activation or deployment.
 */
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium,webkit} from 'playwright';
import {assertProtectedPreviewHold,STAGE_PREVIEW_OUTPUT} from './build-family-alpha-protected-preview-hold.mjs';
import {auditStageStaticAssets} from './audit-family-alpha-stage-assets-hold.mjs';

const STAGING='https://closet-current-staging.pages.dev';
const PREVIEW='https://a15254d6.closet-current-staging.pages.dev';
const PRODUCTION='https://closet-current.pages.dev';
const root=resolve(STAGE_PREVIEW_OUTPUT);
const mime={
 '.html':'text/html; charset=utf-8',
 '.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8',
 '.json':'application/json',
 '.webmanifest':'application/manifest+json',
 '.svg':'image/svg+xml',
 '.png':'image/png',
 '.jpg':'image/jpeg',
 '.jpeg':'image/jpeg',
 '.bin':'application/octet-stream'
};
const hosts=[STAGING,PREVIEW,PRODUCTION];
await assertProtectedPreviewHold();
const inventory=await auditStageStaticAssets();
assert.equal(inventory.releaseGate,'HOLD');
assert.equal(inventory.deployAllowed,false);
assert.equal(inventory.missingReferencedAssets,0);
let passed=0;
const snapshots=[];
for(const [browserName,driver] of [['Chromium',chromium],['WebKit',webkit]]){
 const browser=await driver.launch({
  headless:true,...(browserName==='Chromium'?{args:['--no-sandbox']}:{})
 });
 try{
  for(const width of [360,430]){
   for(const origin of hosts){
    const context=await browser.newContext({
     viewport:{width,height:820},deviceScaleFactor:2,
     serviceWorkers:'block',isMobile:true,hasTouch:true
    });
    const page=await context.newPage();
    const external=[],api=[],missing=[],errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    // Force a synthetic previous production login to remain isolated; the
    // staging bundle must not import or restore it.
    await page.addInitScript(()=>{
     localStorage.setItem('closet-current-auth-v1',JSON.stringify({
      access_token:'SYNTHETIC_OLD_PRODUCTION_TOKEN',
      refresh_token:'SYNTHETIC_OLD_PRODUCTION_REFRESH'
     }));
    });
    await page.route('**/*',async route=>{
     const request=route.request();
     const target=new URL(request.url());
     if(target.origin!==origin){
      external.push(request.url().split('?')[0]);
      return route.abort('blockedbyclient');
     }
     if(target.pathname.startsWith('/auth/v1/')||
        target.pathname.startsWith('/rest/v1/')||
        target.pathname.startsWith('/storage/v1/')){
      api.push(target.pathname);
      return route.abort('blockedbyclient');
     }
     if(request.method()!=='GET'){
      api.push(target.pathname+' '+request.method());
      return route.abort('blockedbyclient');
     }
     const clean=decodeURIComponent(target.pathname);
     const file=clean==='/'?'index.html':clean.slice(1);
     if(file.includes('\\')||file.split('/').includes('..')||
        !/^[-A-Za-z0-9_./]+$/.test(file)){
      missing.push('unsafe local file');
      return route.fulfill({status:404,body:'Not found'});
     }
     const absolute=resolve(root,file);
     if(!absolute.startsWith(root+sep)){
      missing.push('escaped package root');
      return route.fulfill({status:404,body:'Not found'});
     }
     try{
      const info=await stat(absolute);
      if(!info.isFile())throw Error('No packaged file');
      const body=await readFile(absolute);
      return route.fulfill({status:200,body,
       contentType:mime[extname(file)]||'application/octet-stream',
       headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
     }catch{
      // A browser's optional /favicon.ico is not an application reference.
      if(file!=='favicon.ico')missing.push(file);
      return route.fulfill({status:404,body:'Not found'});
     }
    });
    try{
     await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
     await page.waitForTimeout(350);
     const state=await page.evaluate(()=>({
      base:window.__CLOSET_ALPHA_STAGE_AUTH__?.base,
      stageReady:window.__CLOSET_ALPHA_STAGE_AUTH__?.ready,
      stageKey:window.__CLOSET_ALPHA_STAGE_AUTH__?.key,
      callback:window.__CLOSET_ALPHA_STAGE_AUTH__?.redirect,
      stageIntent:window.__CLOSET_ALPHA_STAGE_AUTH__?.intent,
      rolloutApproved:window.__CLOSET_ALPHA_PREVIEW_ROLLOUT__?.ownerApproved,
      rolloutAvatar:window.__CLOSET_ALPHA_PREVIEW_ROLLOUT__?.enablePhotoAvatar,
      currentOwner:window.closetAuth?.user,
      authPublicKey:window.closetAuth?.getPublicKey?.(),
      loginStatus:document.getElementById('authStatus')?.textContent,
      authGateHidden:document.getElementById('authGate')?.hidden,
      shellHidden:document.getElementById('appShell')?.hidden,
      previewHidden:document.getElementById('familyAlphaLocalPreview')?.hidden,
      previewStartDisabled:document.getElementById('familyAlphaPreviewStart')?.disabled,
      hasModernFigure:!!document.getElementById('reusableFigureStage'),
      cachedOldProductionLogin:!!localStorage.getItem('closet-current-auth-v1'),
      injectedStageSession:!!localStorage.getItem('closet-alpha-staging-auth-v1'),
      leakedLocalPreviewFlag:window.__CLOSET_CURRENT_FAMILY_ALPHA_LOCAL_PREVIEW__===true,
      ownerId:window.closetCloud?.getOwnerId?.(null)??null
     }));
     assert.equal(state.base,'https://fbnplztkbsteuzrmbgib.supabase.co');
     assert.equal(state.stageReady,false);
     assert.equal(state.stageKey,'');
     assert.equal(state.callback,'');
     assert.equal(state.stageIntent,'HOLD-NO-CALLBACK-OR-KEY');
     assert.equal(state.rolloutApproved,false);
     assert.equal(state.rolloutAvatar,false);
     assert.equal(state.currentOwner,null);
     assert.equal(state.authPublicKey,'');
     assert.match(state.loginStatus,/staging sign-in is not enabled/);
     assert.equal(state.authGateHidden,false);
     assert.equal(state.shellHidden,true);
     assert.equal(state.previewHidden,true);
     assert.equal(state.previewStartDisabled,true);
     assert.equal(state.hasModernFigure,true);
     assert.equal(state.cachedOldProductionLogin,true);
     assert.equal(state.injectedStageSession,false);
     assert.equal(state.leakedLocalPreviewFlag,false);
     assert.equal(state.ownerId,null);
     assert.deepEqual(external,[],'No external network or unapproved host traffic');
     assert.deepEqual(api,[],'Auth and Storage must be blocked in HOLD');
     assert.deepEqual(missing,[],'No missing browser startup assets');
     assert.deepEqual(errors,[],'No uncaught startup errors in final staged package');
     snapshots.push({browser:browserName,width,hostType:origin===STAGING?'protected-root':origin===PREVIEW?'deployment-preview':'production-spoof',
      auth:'BLOCKED',avatar:'BLOCKED',externalRequests:0,
      apiRequests:0,startupErrors:0,missingAssets:0});
     passed++;
    }finally{await context.close();}
   }
  }
 }finally{await browser.close();}
}
assert.equal(passed,12);
console.log('FAMILY_ALPHA_FINAL_STAGING_HELD_BROWSER_PASS '+JSON.stringify({
 testCases:passed,releaseGate:'HOLD',
 actualProviderCalls:0,
 stagingAuthEnabled:false,
 photoAvatarEnabled:false,
 scenarios:snapshots
}));
