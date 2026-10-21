// Browser UI acceptance for Auth callbacks; real Chromium + WebKit DOM/touch.
// All network Auth calls are synthetic and intercepted BEFORE a request can
// reach any hosted Supabase project. This is not physical phone or SMTP QA.
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';

const auth=await readFile('public/auth.js','utf8');
const notice=await readFile('public/pilot-notice.js','utf8');
const fixture='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+
 '<section id="authGate"><form id="authForm">'+
 '<label id="usernameWrap" hidden>Username<input id="authUsername" value="phone_test" minlength="3"></label>'+
 '<label id="pilotNoticeWrap" hidden><input id="pilotNoticeAck" type="checkbox"></label>'+
 '<label>Email<input id="authEmail" type="email" required value="synthetic@example.invalid"></label>'+
 '<label>Password<input id="authPassword" type="password" minlength="8" required value="old-password-2026"></label>'+
 '<button type="button" id="authPasswordToggle" aria-label="Show password"></button>'+
 '<p id="authStatus" role="status"></p>'+
 '<button id="authSubmit" type="submit">Log in</button>'+
 '<button id="authMode" type="button">Create an account</button>'+
 '<button id="authReset" type="button">Reset password</button>'+
 '<button id="authResend" type="button">Resend email</button>'+
 '<button id="authRetry" hidden type="button">Retry saved login</button>'+
 '</form></section>'+
 '<div id="appShell" hidden><span id="accountLabel"></span>'+
 '<button id="logout" type="button">Log out</button></div>'+
 '<script src="/pilot-notice.js"></script><script src="/auth.js"></script></body></html>';
const server=createServer((req,res)=>{
 const path=new URL(req.url,'http://127.0.0.1').pathname;
 const send=(body,type)=>{res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);};
 if(path==='/auth.js')send(auth,'text/javascript');
 else if(path==='/pilot-notice.js')send(notice,'text/javascript');
 else if(path==='/'||path==='/Closet-Current/')send(fixture,'text/html');
 else{res.writeHead(404);res.end();}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
const base='http://127.0.0.1:'+server.address().port;
const browserCases=[['Android Chromium',chromium,'/'],['iPhone WebKit',webkit,'/Closet-Current/']];
const probeHash='abc12345deadbeef',owner='synthetic-owner-a',other='synthetic-owner-b';
const results=[];

function testFetchInit(scenario) {
 const state={calls:[],scenario};
 window.__authProbe=state;
 window.fetch=async function(url,options={}){
  const str=String(url);
  state.calls.push({path:str.slice(str.indexOf('/auth/v1/')),method:options.method||'GET'});
  if(!str.startsWith('https://hlkgymugtfbirlpunsra.supabase.co/auth/v1/'))
   throw new TypeError('Network denied: not a synthetic Auth endpoint');
  let body={};try{body=JSON.parse(options.body||'{}')}catch{}
  const reply=(payload,status=200)=>new Response(JSON.stringify(payload),{
   status,headers:{'Content-Type':'application/json'}
  });
  if(str.includes('/verify')){
   if(body.token_hash!=='abc12345deadbeef'||!['signup','recovery','email'].includes(body.type))
    return reply({error_code:'otp_expired',msg:'expired'},400);
   return reply({access_token:'synthetic-access-2026',refresh_token:'synthetic-refresh-2026',
    expires_in:3600,user:{id:'synthetic-owner-a',email:'synthetic@example.invalid'}});
  }
  if(str.endsWith('/user')&&(options.method||'GET')==='GET')
   return reply({id:scenario==='mismatch'?'synthetic-owner-b':'synthetic-owner-a',
    email:'synthetic@example.invalid'});
  if(str.endsWith('/user')&&options.method==='PUT')
   return reply({id:scenario==='reset_mismatch'?'synthetic-owner-b':'synthetic-owner-a',
    email:'synthetic@example.invalid'});
  if(str.includes('grant_type=refresh_token'))
   return reply({access_token:'rotated-access-2026',refresh_token:'rotated-refresh-2026',
    expires_in:3600,user:{id:'synthetic-owner-a',email:'synthetic@example.invalid'}});
  if(str.endsWith('/logout'))return reply({});
  return reply({error_code:'invalid_credentials'},400);
 };
}
async function newPage(context,scenario,url) {
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+url,{waitUntil:'load'});
 await page.waitForFunction(()=>document.getElementById('authStatus').textContent.length>0);
 return {page,errors};
}
async function oneEngine(label,engine,path){
 const browser=await engine.launch({headless:true,...(label.startsWith('Android')?{args:['--no-sandbox']}: {})});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,
  hasTouch:true,serviceWorkers:'block'});
 let checks=0;
 const casePage=async(scenario,link)=>{
  await context.addInitScript(testFetchInit,scenario);
  const x=await newPage(context,scenario,path+link);
  return x;
 };
 try{
  // Each scenario must use a distinct context to prevent a prior logged-in
  // synthetic identity from silently restoring the next one's closet.
  async function visit(scenario,link,fn){
   const isolated=await browser.newContext({viewport:{width:390,height:844},
    isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await isolated.addInitScript(testFetchInit,scenario);
   const {page,errors}=await newPage(isolated,scenario,path+link);
   try{
    await fn(page);
    assert.deepEqual(errors,[],'browser page unexpectedly threw an exception');
    checks++;
   }finally{await isolated.close();}
  }
  await visit('expired','#error_code=otp_expired',async page=>{
   await page.getByText(/expired or was already used/i).waitFor();
   assert.equal(await page.locator('#appShell').isHidden(),true);
   assert.equal(await page.evaluate(()=>window.__authProbe.calls.length),0);
   assert.equal(new URL(page.url()).hash,'');
  });
  await visit('bad-hash','?token_hash=short&type=signup',async page=>{
   await page.getByText(/could not be verified/i).waitFor();
   assert.equal(await page.locator('#appShell').isHidden(),true);
   assert.equal(await page.evaluate(()=>window.__authProbe.calls.length),0);
   assert.equal(new URL(page.url()).search,'');
  });
  await visit('code','?code=unmatched-pkce',async page=>{
   await page.getByText(/unsupported code callback/i).waitFor();
   assert.equal(await page.locator('#appShell').isHidden(),true);
   assert.equal(await page.evaluate(()=>window.__authProbe.calls.length),0);
   assert.equal(new URL(page.url()).search,'');
  });
  await visit('signup','?token_hash='+probeHash+'&type=signup',async page=>{
   await page.locator('#appShell').waitFor({state:'visible'});
   assert.equal(await page.locator('#authGate').isHidden(),true);
   assert.equal(await page.evaluate(()=>window.closetAuth.user?.id),owner);
   const paths=await page.evaluate(()=>window.__authProbe.calls.map(c=>c.path));
   assert.ok(paths.some(p=>p.includes('/verify')));
   assert.ok(paths.some(p=>p.endsWith('/user')));
   assert.equal(new URL(page.url()).search,'');
   assert.equal(await page.evaluate(()=>
    JSON.parse(localStorage.getItem('closet-current-auth-v1')).refresh_token),
    'synthetic-refresh-2026');
   await page.reload({waitUntil:'load'});
   await page.locator('#appShell').waitFor({state:'visible'});
   assert.equal(await page.evaluate(()=>window.closetAuth.user?.id),owner);
  });
  await visit('mismatch','?token_hash='+probeHash+'&type=email',async page=>{
   await page.getByText(/could not be verified/i).waitFor();
   assert.equal(await page.locator('#appShell').isHidden(),true);
   assert.equal(await page.evaluate(()=>window.closetAuth.user),null);
   assert.equal(await page.evaluate(()=>localStorage.getItem('closet-current-auth-v1')),null);
  });
  await visit('implicit','#access_token=synthetic-access-2026&refresh_token=synthetic-refresh-2026&type=signup',async page=>{
   await page.locator('#appShell').waitFor({state:'visible'});
   assert.equal(await page.evaluate(()=>window.closetAuth.user?.id),owner);
   assert.equal(new URL(page.url()).hash,'');
  });
  await visit('recovery','?token_hash='+probeHash+'&type=recovery',async page=>{
   await page.getByText(/Choose a new password/i).waitFor();
   assert.equal(await page.locator('#appShell').isHidden(),true);
   assert.equal(await page.evaluate(()=>window.closetAuth.user),null);
   assert.equal(new URL(page.url()).search,'');
   assert.equal(await page.locator('#authPassword').getAttribute('autocomplete'),'new-password');
   await page.locator('#authPasswordToggle').tap();
   assert.equal(await page.locator('#authPassword').getAttribute('type'),'text');
   await page.locator('#authPasswordToggle').tap();
   await page.locator('#authPassword').fill('new-password-2026');
   await page.locator('#authSubmit').tap();
   await page.locator('#appShell').waitFor({state:'visible'});
   assert.equal(await page.evaluate(()=>window.closetAuth.user?.id),owner);
   assert.ok((await page.evaluate(()=>window.__authProbe.calls)).some(x=>x.method==='PUT'));
  });
  await visit('reset_mismatch','?token_hash='+probeHash+'&type=recovery',async page=>{
   await page.getByText(/Choose a new password/i).waitFor();
   await page.locator('#authPassword').fill('new-password-2026');
   await page.locator('#authSubmit').tap();
   await page.getByText(/Session account changed/i).waitFor();
   assert.equal(await page.locator('#appShell').isHidden(),true);
   assert.equal(await page.evaluate(()=>window.closetAuth.user),null);
  });
  results.push({engine:label,viewport:'390x844',emulatedPhone:true,
   checkedScenarios:checks,privateClosetNeverUnlockedOnFailure:true,
   redirectsExercised:path==='/'?'root-path':'nested-path',
   hostedSupabaseRequests:0,actualPhysicalDevice:false,
   realInboxDelivery:false});
 }finally{await context.close();await browser.close();}
}
try{
 for(const [name,engine,path] of browserCases)await oneEngine(name,engine,path);
 console.log('AUTH_EMAIL_MOBILE_BROWSER_QA '+JSON.stringify({
  results,productionReleaseApproved:false,
  localBrowserOnly:true,hostedAuthSettingsVerified:false
 }));
}finally{await new Promise(resolve=>server.close(resolve))}
