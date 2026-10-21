// Generated staging bundle in real browser engines; all external requests intercepted.
// No database, SMTP, customer account, or inference provider is contacted.
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
const root=resolve('staging-dist');
const proof=JSON.parse(await readFile(root+'/staging-preflight.json','utf8'));
assert.equal(proof.backendProjectRef,'abcdefghijklmnopqrst','Browser QA must use the invented fixture only');
const backend='https://'+proof.backendProjectRef+'.supabase.co';
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(root+'/')){res.writeHead(403);res.end();return;}
  const body=await readFile(file);
  const type={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.bin':'application/octet-stream'}[extname(file)]||'application/octet-stream';
  res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes)});
const origin='http://127.0.0.1:'+server.address().port;
const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const results=[];
try{
 for(const [name,engine]of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(name.startsWith('Android')?{args:['--no-sandbox']}: {})});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const calls=[],live=[],blocked=[];let errors=[];
  try{
   await context.route('**/*',async route=>{
    const url=route.request().url();
    if(new URL(url).origin===origin)return route.continue();
    // Route interception runs before any external request leaves the browser.
    if(url.includes('hlkgymugtfbirlpunsra')||url.includes('qlwotqbqxpgkheitsboe')){live.push(url);return route.abort();}
    if(!url.startsWith(backend+'/')){blocked.push(new URL(url).origin);return route.abort();}
    const parsed=new URL(url);calls.push({path:parsed.pathname,search:parsed.search,method:route.request().method()});
    let body={};
    if(parsed.pathname==='/auth/v1/token')body={access_token:'synthetic-stage-access',refresh_token:'synthetic-stage-refresh',expires_in:3600,user:{id:owner,email:'synthetic@example.invalid'}};
    else if(parsed.pathname==='/auth/v1/user')body={id:owner,email:'synthetic@example.invalid'};
    else if(parsed.pathname.startsWith('/rest/v1/closet_backups'))body=[];
    else if(parsed.pathname==='/rest/v1/rpc/save_closet_backup')body=1;
    else if(parsed.pathname==='/auth/v1/recover')body={};
    else {blocked.push(parsed.pathname);return route.abort();}
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body),headers:{'Access-Control-Allow-Origin':'*'}});
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin,{waitUntil:'load'});
   await page.waitForFunction(()=>window.closetAuth&&document.getElementById('authSubmit'));
   assert.match(await page.locator('#stagingBanner').textContent(),/PRIVATE STAGING/);
   assert.equal(await page.locator('#appShell').isVisible(),false);
   assert.equal(calls.length,0,'Signed-out app made a staging backend request');
   await page.locator('#authEmail').fill('synthetic@example.invalid');
   await page.locator('#authHelp > summary').click();
   await page.locator('#authReset').click();
   await page.waitForFunction(()=>document.getElementById('authStatus').textContent.includes('will arrive'));
   const recovery=calls.find(c=>c.path==='/auth/v1/recover');assert.ok(recovery);
   assert.equal(new URLSearchParams(recovery.search).get('redirect_to'),proof.stagingOrigin);
   await page.locator('#authPassword').fill('synthetic-password-2026');
   await page.locator('#authSubmit').click();
   await page.waitForFunction(()=>window.closetAuth?.user?.id==='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
   await page.waitForFunction(()=>window.closetCloud&&document.getElementById('cloudStatus').textContent.includes('back up automatically'));
   assert.equal(await page.locator('#appShell').isVisible(),true);
   await page.evaluate(()=>window.closetCloud.sync());
   assert.ok(calls.filter(c=>c.path.startsWith('/rest/v1/closet_backups')).length>=2,'Cloud sync did not reach the staging-only mock');
   const before=calls.length;
   const refusal=await page.evaluate(async()=>{try{await tryOnRequest('synthetic',{action:'start'});return 'unexpected success';}catch(e){return e.message;}});
   assert.match(refusal,/Paid AI is disabled/);assert.equal(calls.length,before,'Paid try-on attempted a network request');
   assert.deepEqual(live,[],'Attempted to access a live database');
   assert.deepEqual(errors,[],'Generated app threw browser exceptions');
   results.push({engine:name,login:true,stagingEmailCallback:true,stagingBackup:true,paidTryOnBlocked:true,liveDatabaseRequests:0,externalRequestsIntercepted:true,otherExternalOriginsBlocked:[...new Set(blocked)],physicalPhoneValidated:false});
  }finally{await context.close();await browser.close();}
 }
 console.log('STAGING_RUNTIME_BROWSER_QA '+JSON.stringify({results,realHostedIsolationVerified:false,productionPromotion:'BLOCKED'}));
}finally{await new Promise(resolve=>server.close(resolve));}
