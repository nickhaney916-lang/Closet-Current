import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';

// Real browser inputs and built auth controller; intercepted synthetic auth.
// No actual credentials, hosted requests, or real-owner acceptance claim.
const auth=await readFile('dist/auth.js');
const html='<!doctype html><meta name="viewport" content="width=device-width"><section id="authGate"><form id="authForm"><label id="usernameWrap">Username<input id="authUsername"></label><input id="authEmail" type="email" required><input id="authPassword" type="password" required><button id="authPasswordToggle" type="button">Show password</button><button id="authSubmit" type="submit">Log in</button><button id="authMode" type="button"></button><button id="authReset" type="button"></button><button id="authResend" type="button"></button><p id="authStatus"></p></form></section><section id="appShell" hidden><span id="accountLabel"></span><button id="logout">Log out</button></section><script src="/auth.js"></script>';
const server=createServer((req,res)=>{
 if(req.url==='/'){res.writeHead(200,{'content-type':'text/html'}).end(html);return;}
 if(req.url==='/blank'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><title>Storage fixture</title>');return;}
 if(req.url==='/auth.js'){res.writeHead(200,{'content-type':'text/javascript'}).end(auth);return;}
 res.writeHead(404).end();
});
const key='closet-current-auth-v1',owner='password-field-fixture-owner',password='fixture-only-password';
async function exercise(browser,engine,width,origin){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 try{
  let requests=0,allow=false;
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin===origin)return route.continue();
   if(url.origin==='https://hlkgymugtfbirlpunsra.supabase.co'&&url.pathname==='/auth/v1/token'&&url.searchParams.get('grant_type')==='password'&&req.method()==='POST'){
    requests++;
    assert.equal(req.postDataJSON().password,password);
    return route.fulfill(allow?{json:{user:{id:owner,email:'fixture@example.test'},access_token:'fixture-access',refresh_token:'fixture-refresh',expires_in:3600}}:{status:400,json:{error_code:'invalid_credentials',msg:'Invalid login credentials'}});
   }
   return route.abort();
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);
  const field=page.locator('#authPassword'),toggle=page.locator('#authPasswordToggle');
  await page.locator('#authEmail').fill('fixture@example.test');
  await field.fill(password);
  await toggle.click();
  assert.equal(await field.getAttribute('type'),'text');
  await page.locator('#authSubmit').click();
  await page.waitForFunction(()=>document.getElementById('authStatus').textContent.includes('Email or password is incorrect'));
  assert.equal(await field.inputValue(),password);
  assert.equal(await page.locator('#authGate').isVisible(),true);
  assert.equal(await page.evaluate(()=>window.closetAuth.user),null);
  await toggle.click();
  assert.equal(await field.getAttribute('type'),'password');
  await toggle.click();
  allow=true;
  await page.locator('#authSubmit').click();
  await page.waitForFunction(owner=>window.closetAuth.user?.id===owner,owner);
  assert.equal(await field.inputValue(),'');
  assert.equal(await field.getAttribute('type'),'password');
  assert.equal(await toggle.getAttribute('aria-pressed'),'false');
  assert.equal(await toggle.getAttribute('aria-label'),'Show password');
  assert.equal(await page.locator('#appShell').isVisible(),true);
  // Simulate an autofill/residual field value in the hidden login form.
  await page.evaluate(()=>{const field=document.getElementById('authPassword');field.value='fixture-residual';document.getElementById('authPasswordToggle').click();});
  const other=await context.newPage();
  await other.goto(origin+'/blank');
  await other.evaluate(key=>localStorage.removeItem(key),key);
  await page.waitForFunction(()=>window.closetAuth.user===null);
  assert.equal(await field.inputValue(),'');
  assert.equal(await field.getAttribute('type'),'password');
  assert.equal(await toggle.getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('#authGate').isVisible(),true);
  assert.equal(await page.locator('#appShell').isHidden(),true);
  assert.equal(requests,2);
  assert.deepEqual(errors,[]);
  console.log(engine,width,'PASS password field hygiene and retry');
 }finally{await context.close();}
}
try{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 for(const [engine,type] of Object.entries({chromium,webkit})){
  if(process.env.CC_PASSWORD_ENGINE&&process.env.CC_PASSWORD_ENGINE!==engine)continue;
  const browser=await type.launch();
  try{for(const width of [320,390,430])await exercise(browser,engine,width,origin);}
  finally{await browser.close();}
 }
}finally{server.close();}
