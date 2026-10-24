/** Only fabricated browser Auth and API responses. No live Supabase calls. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
import {stageConfigScript,STAGE_BASE,PROD_BASE,OUT} from './build-family-alpha-staging-auth-hold.mjs';

const root=OUT,qaOrigin='https://alpha-stage-qa.example.invalid';
const pub='sb_publishable_SYNTHETIC_ONLY_FAKE_BROWSER_KEY_12345678';
const configApproved=stageConfigScript({
 approvedRedirect:qaOrigin+'/',publicKey:pub,enableForTesting:true
});
const fileContents=Object.fromEntries(await Promise.all(
 ['auth.js','cloud-backup.js','family-alpha-2d-auth-preflight.mjs','alpha-stage-config.js'].map(async f=>
  [f,await readFile(root+'/'+f,'utf8')]
 )));
const fakeHtml=\`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><body>
<div id="authGate"><p id="authStatus"></p><form id="authForm">
<input id="authEmail" type="email" value="fictional@example.invalid">
<input id="authPassword" type="password" value="invented-only">
<input id="authUsername" value="SyntheticAlpha">
<button type="submit" id="authSubmit">Log in</button></form>
<button id="authMode" type="button"></button>
<button id="authReset" type="button">Reset password</button>
<button id="authResend" type="button">Resend</button>
<button id="authPasswordToggle" type="button">Show password</button>
<div id="usernameWrap"></div>
</div>
<div id="appShell" hidden><span id="accountLabel"></span><button id="logout">Sign out</button></div>
<script src="/alpha-stage-config.js"></script>
<script src="/auth.js"></script>
<script src="/cloud-backup.js"></script>
</body></html>\`;
const results=[];
for(const [browserName,driver]of [['Chromium',chromium],['WebKit',webkit]]){
 const browser=await driver.launch({headless:true,...(browserName==='Chromium'?{args:['--no-sandbox']}:{})});
 try{
  for(const width of [320,390,430]){
   for(const [mode,origin,config] of [
    ['HOLD','http://alpha-hold.example.invalid',fileContents['alpha-stage-config.js']],
    ['QA-MOCK',qaOrigin,configApproved]
   ]){
    const context=await browser.newContext({
     viewport:{width,height:820},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'
    });
    const page=await context.newPage();
    const outside=[],api=[],errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
     localStorage.setItem('closet-current-auth-v1',JSON.stringify({
      access_token:'old-production-device-only-fake-token',refresh_token:'fake-saved-prod-refresh'
     }));
    });
    await page.route('**/*',async route=>{
     const req=route.request(),url=req.url();
     if(url===origin+'/'){
      return route.fulfill({status:200,contentType:'text/html',body:fakeHtml});
     }
     if(url.startsWith(origin+'/')){
      const file=new URL(url).pathname.slice(1);
      if(fileContents[file]||file==='alpha-stage-config.js')
       return route.fulfill({status:200,contentType:'text/javascript',
        body:file==='alpha-stage-config.js'?config:fileContents[file]});
      throw Error('Unexpected candidate path '+url);
     }
     if(url.startsWith(STAGE_BASE+'/')){
      api.push({url,method:req.method(),key:req.headers().apikey||null});
      if(mode!=='QA-MOCK')throw Error('BLOCKED candidate reached staging API');
      const suffix=url.slice(STAGE_BASE.length);
      if(suffix.includes('/token?grant_type=password'))
       return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
        access_token:'synthetic-stage-jwt',refresh_token:'synthetic-stage-refresh',
        user:{id:'a1111111-1111-4111-8111-111111111111',email:'fictional@example.invalid'},
        expires_in:3600
       })});
      if(suffix.includes('/recover?redirect_to=')||suffix.includes('/resend?redirect_to='))
       return route.fulfill({status:200,contentType:'application/json',body:'{}'});
      if(suffix==='/auth/v1/logout')
       return route.fulfill({status:200,contentType:'application/json',body:'{}'});
      throw Error('Unexpected synthetic stage Auth request '+url);
     }
     outside.push(url);
     return route.abort('blockedbyclient');
    });
    try{
     await page.goto(origin+'/',{waitUntil:'load'});
     const initial=await page.evaluate(()=>{
      const a=window.closetAuth,c=window.closetCloud,stage=window.__CLOSET_ALPHA_STAGE_AUTH__;
      return{
       stageReady:stage?.ready,stageBase:stage?.base,locked:Object.getOwnPropertyDescriptor(window,'__CLOSET_ALPHA_STAGE_AUTH__')?.writable===false,
       user:a?.user?.id||null,publicKey:a?.getPublicKey?.(),
       loginStatus:document.querySelector('#authStatus').textContent,
       appHidden:document.querySelector('#appShell').hidden,
       legacyProductionStoragePresent:localStorage.getItem('closet-current-auth-v1')!==null,
       stageStoragePresent:localStorage.getItem('closet-alpha-staging-auth-v1')!==null,
       cloudGetOwner:c?.getOwnerId?.({name:'fake'})??null
      };
     });
     assert.equal(initial.stageBase,STAGE_BASE);
     assert.equal(initial.locked,true);
     assert.equal(initial.legacyProductionStoragePresent,true);
     if(mode==='HOLD'){
      assert.equal(initial.stageReady,false);
      assert.equal(initial.appHidden,true);
      assert.equal(initial.user,null);
      assert.equal(initial.publicKey,'');
      assert.match(initial.loginStatus,/staging sign-in is not enabled/);
      assert.equal(initial.cloudGetOwner,null);
      assert.equal(initial.stageStoragePresent,false);
      assert.equal(api.length,0,'No Auth call when config missing');
     }else{
      assert.equal(initial.stageReady,true);
      assert.equal(initial.appHidden,true);
      assert.equal(initial.user,null);
      assert.equal(initial.publicKey,pub);
      await page.evaluate(async()=>{
       await document.getElementById('authReset').onclick();
      });
      assert.ok(api.some(x=>
       x.url.startsWith(STAGE_BASE+'/auth/v1/recover?redirect_to='+
        encodeURIComponent(qaOrigin+'/'))));
      await page.evaluate(async()=>{
       const f=document.getElementById('authForm');
       await f.onsubmit({preventDefault(){}});
      });
      const next=await page.evaluate(()=>({
       uid:window.closetAuth.user?.id,
       stageKey:window.closetAuth.getPublicKey(),
       appHidden:document.querySelector('#appShell').hidden,
       stageStorage:localStorage.getItem('closet-alpha-staging-auth-v1'),
       retainedLegacy:localStorage.getItem('closet-current-auth-v1')!==null
      }));
      assert.equal(next.uid,'a1111111-1111-4111-8111-111111111111');
      assert.equal(next.stageKey,pub);
      assert.equal(next.appHidden,false);
      assert.equal(next.retainedLegacy,true);
      assert.ok(next.stageStorage?.includes('synthetic-stage-jwt'));
      assert.ok(api.some(x=>x.url.startsWith(STAGE_BASE+'/auth/v1/token?grant_type=password')));
      assert.ok(api.every(x=>x.key===pub));
     }
     assert.equal(outside.length,0,'No production or outside traffic');
     assert.equal(errors.length,0,'No page exception');
     results.push({browser:browserName,width,mode,holdBlocked:mode==='HOLD',
      routedOnlyStaging:api.every(x=>x.url.startsWith(STAGE_BASE+'/')),
      traffic:api.length});
    }finally{await context.close();}
   }
  }
 }finally{await browser.close();}
}
assert.equal(results.length,12);
console.log('FAMILY_ALPHA_STAGE_AUTH_ROUTING_BROWSER_PASS '+JSON.stringify(results));
