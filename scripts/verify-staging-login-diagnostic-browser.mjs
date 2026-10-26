import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';

const folder='dist-family-alpha-OWNER-ONLY-staging-qa/';
const auth=await readFile(folder+'auth.js','utf8');
const config=await readFile(folder+'alpha-stage-config.js','utf8');
const actualIndex=await readFile(folder+'index.html','utf8');
const cspTag=actualIndex.match(/<meta http-equiv="Content-Security-Policy"[^>]+>/)?.[0];
if(!cspTag||!cspTag.includes("connect-src 'self' https://fbnplztkbsteuzrmbgib.supabase.co;"))
  throw Error('Owner-only staging artifact missing required exact-domain CSP');
const origin='https://closet-current-staging.pages.dev';
const url=origin+'/';
const tokenUrl='https://fbnplztkbsteuzrmbgib.supabase.co/auth/v1/token?grant_type=password';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const type of ['network','invalid','ui']){
  const page=await browser.newPage();
  let count=0;
  const errors=[];
  page.on('pageerror',err=>errors.push(err.name));
  const html='<html><head><meta charset="utf-8">'+cspTag+'</head><body><section id="authGate"><form id="authForm">'+
   '<input id="authEmail" type="email" required><input id="authPassword" type="password" required minlength="8">'+
   '<label id="usernameWrap" hidden><input id="authUsername"></label>'+
   '<button id="authPasswordToggle" type="button"></button><p id="authStatus"></p>'+
   '<button id="authSubmit" type="submit">Login</button>'+
   '<button id="authMode" type="button" hidden></button><button id="authReset" type="button"></button>'+
   '<button id="authResend" type="button"></button></form></section>'+
   '<div id="appShell" hidden>'+(type==='ui'?'':'<span id="accountLabel"></span>')+
   '<button id="logout"></button></div>'+
   '<script src="/alpha-stage-config.js"></script><script src="/auth.js"></script></body></html>';
  await page.route(url,route=>route.fulfill({status:200,contentType:'text/html',body:html}));
  await page.route(origin+'/alpha-stage-config.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:config}));
  await page.route(origin+'/auth.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:auth}));
  await page.route(tokenUrl,route=>{
   count++;
   if(type==='network')return route.abort('failed');
   const response=type==='invalid'?
    {error_code:'invalid_credentials',msg:'Invalid login credentials'}:
    {user:{id:'00000000-0000-4000-8000-000000000123',email:'synthetic@example.invalid'},
     access_token:'synthetic-never-real',refresh_token:'synthetic-never-real',expires_in:3600};
   return route.fulfill({status:type==='invalid'?400:200,
    headers:{'access-control-allow-origin':origin,'content-type':'application/json'},
    body:JSON.stringify(response)});
  });
  await page.goto(url);
  // Verify actual CSP is enforced, not merely present in the generated HTML.
  const forbidden=await page.evaluate(async()=>{
    try{await fetch('https://hlkgymugtfbirlpunsra.supabase.co/auth/v1/health',
      {headers:{apikey:'synthetic-not-real'}});return false;}catch{return true;}
  });
  if(!forbidden)throw Error('CSP unexpectedly allows production Supabase requests');
  await page.locator('#authEmail').fill('synthetic@example.invalid');
  await page.locator('#authPassword').fill('synthetic-not-a-real-password');
  await page.locator('#authSubmit').click();
  const expected={network:'NET-FETCH',invalid:'AUTH-REJECT',ui:'APP-TYPE'}[type];
  await page.waitForFunction(expected=>document.getElementById('authStatus').textContent.includes(expected),expected,{timeout:8000});
  const outcome=await page.evaluate(()=>({
    status:document.getElementById('authStatus').textContent,
    appVisible:!document.getElementById('appShell').hidden,
    sessionPresent:Boolean(window.closetAuth?.user)
  }));
  if(count!==1||errors.length||outcome.appVisible||outcome.sessionPresent||!outcome.status.includes(expected)||
    outcome.status.includes('synthetic@example.invalid')||
    outcome.status.includes('synthetic-not-a-real-password'))
   throw Error('Synthetic diagnostic test failed for '+type);
  console.log('STAGING_DIAGNOSTIC_SYNTHETIC_PASS '+type+' '+expected+
   ' appVisible='+outcome.appVisible+' sessionPresent='+outcome.sessionPresent);
  await page.close();
 }
}finally{await browser.close()}
