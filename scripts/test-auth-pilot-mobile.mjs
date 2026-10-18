import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
// Synthetic-only auth provider, no real inbox, token, customer photo,
// Supabase project change or production deployment.
const root=resolve('dist'),output=resolve(process.argv[2]||'benchmark/auth-pilot');
const owner='a1111111-1111-4111-8111-111111111111';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css',
 '.json':'application/json','.svg':'image/svg+xml'};
const errors=[];
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+'/'))throw Error('Bad path');
  const body=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port+'/';
let browser;
try{
 await mkdir(output,{recursive:true});
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,
  hasTouch:true,serviceWorkers:'block'});
 const requests=[];let refreshCount=0;
 await context.route('https://hlkgymugtfbirlpunsra.supabase.co/**',async route=>{
  const url=new URL(route.request().url());const path=url.pathname;
  if(path==='/auth/v1/token'&&url.searchParams.get('grant_type')==='refresh_token'){
   refreshCount++;requests.push('refresh');
   return route.fulfill({status:refreshCount===1?503:200,contentType:'application/json',
    body:refreshCount===1?'{}':JSON.stringify({user:{id:owner,email:'synthetic@example.invalid'},
     access_token:'synthetic-fresh-access',refresh_token:'synthetic-fresh-refresh',expires_in:3600})});
  }
  if(path==='/rest/v1/closet_backups')return route.fulfill({status:200,contentType:'application/json',body:'[]'});
  return route.fulfill({status:404,contentType:'application/json',body:'{}'});
 });
 await context.addInitScript(()=>{
  localStorage.setItem('closet-current-auth-v1',JSON.stringify({
   refresh_token:'synthetic-starting-refresh',expires_at:0}));
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>document.getElementById('authRetry')?.hidden===false);
 assert.equal(await page.locator('#appShell').isVisible(),false);
 assert.equal(await page.locator('#authGate').isVisible(),true);
 assert.match(await page.locator('#authStatus').innerText(),/session is still saved/i);
 const savedBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('closet-current-auth-v1')));
 assert.equal(savedBefore.refresh_token,'synthetic-starting-refresh');
 await page.getByRole('button',{name:'Retry saved login'}).tap();
 await page.waitForFunction(()=>document.getElementById('authGate')?.hidden===true);
 assert.equal(await page.locator('#appShell').isVisible(),true);
 const savedAfter=await page.evaluate(()=>JSON.parse(localStorage.getItem('closet-current-auth-v1')));
 assert.equal(savedAfter.refresh_token,'synthetic-fresh-refresh');
 assert.deepEqual(requests,['refresh','refresh']);
 await context.close();
 // In a new browser context a forged HTTP-200 identity is still locked out.
 const badContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,
  hasTouch:true,serviceWorkers:'block'});
 await badContext.route('https://hlkgymugtfbirlpunsra.supabase.co/**',route=>{
  const url=new URL(route.request().url());
  return route.fulfill({status:200,contentType:'application/json',
   body:JSON.stringify(url.pathname==='/auth/v1/token'?{user:{id:'pretend-user'}}:{})});
 });
 const denied=await badContext.newPage();denied.on('pageerror',e=>errors.push(e.message));
 await denied.goto(base);
 await denied.locator('#authEmail').fill('synthetic@example.invalid');
 await denied.locator('#authPassword').fill('synthetic-password');
 await denied.getByRole('button',{name:'Log in',exact:true}).tap();
 await denied.pageWaitUnused?.();
 await denied.waitForFunction(()=>document.getElementById('authStatus')?.textContent.includes('No verified user session'));
 assert.equal(await denied.locator('#authGate').isVisible(),true);
 assert.equal(await denied.locator('#appShell').isVisible(),false);
 assert.equal(await denied.evaluate(()=>localStorage.getItem('closet-current-auth-v1')),null);
 await badContext.close();
 // Recovery must not let an Auth response for a different account unlock
 // the previously verified token's account or any other private closet.
 const recoveryContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,
  hasTouch:true,serviceWorkers:'block'});
 await recoveryContext.route('https://hlkgymugtfbirlpunsra.supabase.co/**',route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname==='/auth/v1/user')return route.fulfill({
   status:200,contentType:'application/json',
   body:JSON.stringify({id:req.method()==='PUT'?'different-user':owner,
    email:'synthetic@example.invalid'})});
  return route.fulfill({status:404,contentType:'application/json',body:'{}'});
 });
 const recovery=await recoveryContext.newPage();recovery.on('pageerror',e=>errors.push(e.message));
 await recovery.goto(base+'#access_token=test-recovery-access&refresh_token=test-recovery-refresh&type=recovery');
 await recovery.waitForFunction(()=>document.getElementById('authSubmit')?.textContent==='Save new password');
 assert.equal(await recovery.locator('#appShell').isVisible(),false);
 await recovery.locator('#authPassword').fill('synthetic-new-password');
 await recovery.getByRole('button',{name:'Save new password'}).tap();
 await recovery.waitForFunction(()=>document.getElementById('authStatus')?.textContent.includes('Session account changed'));
 assert.equal(await recovery.locator('#appShell').isVisible(),false);
 assert.equal(await recovery.evaluate(()=>localStorage.getItem('closet-current-auth-v1')),null);
 await recoveryContext.close();
 assert.deepEqual(errors,[]);
 const result={status:'passed',touchViewport:'390x844',
  offlineSessionRetained:true,manualRetryRestoredSameUser:true,rotatedRefreshTokenSaved:true,
  tokenlessSuccessRejected:true,mismatchedRecoveryRejected:true,
  noPrivateClosetUnlockWithoutSession:true,simulatedAuthOnly:true,
  realEmailDeliveryTested:false,realPhoneTested:false,liveSupabaseAuthTested:false,
  pageErrors:errors};
 await writeFile(output+'/results.json',JSON.stringify(result,null,2)+'\n');
 console.log('AUTH_PILOT_MOBILE '+JSON.stringify(result));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
