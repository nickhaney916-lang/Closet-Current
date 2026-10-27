/**
 * FAMILY ALPHA #255: actual GENERATED staging Auth code, two synthetic owners
 * and THREE independent Chromium browser contexts at the exact staging origin.
 * Fully intercepted network, no staging/prod requests, no credentials, no deploy.
 * This is browser session-isolation QA, NOT live RLS or four-family-user proof.
 */
import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const folder='dist-family-alpha-OWNER-ONLY-staging-qa/';
const [auth,config,index]=await Promise.all(
 ['auth.js','alpha-stage-config.js','index.html'].map(p=>readFile(folder+p,'utf8'))
);
const origin='https://closet-current-staging.pages.dev';
const base='https://fbnplztkbsteuzrmbgib.supabase.co';
const production='https://hlkgymugtfbirlpunsra.supabase.co';
const csp=index.match(/<meta http-equiv="Content-Security-Policy"[^>]+>/)?.[0];
assert.ok(csp?.includes("connect-src 'self' "+base+";"),'Use actual owner-only CSP');
assert.ok(!index.includes(production),'Never use production endpoint');
const a='a1111111-1111-4111-8111-111111111111';
const b='b2222222-2222-4222-8222-222222222222';
const emails=new Map([['alpha-a@example.invalid',a],['alpha-b@example.invalid',b]]);
const html='<html><head><meta charset="utf-8">'+csp+'</head><body>'+
 '<section id="authGate"><form id="authForm">'+
 '<input id="authEmail" type="email" required>'+
 '<input id="authPassword" type="password" required minlength="1">'+
 '<label id="usernameWrap" hidden><input id="authUsername"></label>'+
 '<button id="authPasswordToggle" type="button"></button>'+
 '<p id="authStatus"></p><button id="authSubmit" type="submit">Log in</button>'+
 '<button id="authMode" type="button" hidden></button>'+
 '<button id="authReset" type="button"></button>'+
 '<button id="authResend" type="button"></button>'+
 '</form></section><main id="appShell" hidden><span id="accountLabel"></span>'+
 '<button id="logout" type="button">Log out</button></main>'+
 '<script src="/alpha-stage-config.js"></script><script src="/auth.js"></script></body></html>';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const contexts=[],failures=[],requestStats={logins:0,refresh:0,logout:0};
async function openContext(name,email){
 const ctx=await browser.newContext({serviceWorkers:'block'});
 contexts.push(ctx);
 ctx.on('request',request=>{
  const url=request.url();
  if(url.startsWith('http')&&!url.startsWith(origin+'/')&&!url.startsWith(base+'/'))
   failures.push('Unexpected external request from '+name);
 });
 await ctx.route(origin+'/',route=>route.fulfill({status:200,contentType:'text/html',body:html}));
 await ctx.route(origin+'/alpha-stage-config.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:config}));
 await ctx.route(origin+'/auth.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:auth}));
 let serial=0;
 await ctx.route(base+'/**',async route=>{
  const request=route.request(),u=new URL(request.url());
  const cors={'access-control-allow-origin':origin,'vary':'Origin',
   'access-control-allow-headers':'apikey,content-type,authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
  let status=200,data;
  const body=request.postDataJSON()||{};
  if(u.pathname==='/auth/v1/token'&&u.searchParams.get('grant_type')==='password'){
   requestStats.logins++;
   const id=emails.get(body.email);
   if(!id||body.password!=='synthetic-not-a-real-password'){
    status=400;data={error_code:'invalid_credentials'};
   }else data={user:{id,email:body.email},access_token:'synthetic_access_'+id+'_'+name+'_'+ ++serial,
    refresh_token:'synthetic_refresh_'+id+'_'+name+'_'+serial,expires_in:3600};
  }else if(u.pathname==='/auth/v1/token'&&u.searchParams.get('grant_type')==='refresh_token'){
   requestStats.refresh++;
   const id=body.refresh_token?.includes('_'+a+'_')?a:
    body.refresh_token?.includes('_'+b+'_')?b:null;
   if(!id){status=401;data={error_code:'invalid_refresh_token'};}
   else data={user:{id,email:id===a?'alpha-a@example.invalid':'alpha-b@example.invalid'},
    access_token:'synthetic_access_'+id+'_'+name+'_'+ ++serial,
    refresh_token:'synthetic_refresh_'+id+'_'+name+'_'+serial,expires_in:3600};
  }else if(u.pathname==='/auth/v1/logout'){
   requestStats.logout++;data={};
  }else throw Error('Unexpected auth path in synthetic browser test: '+u.pathname);
  return route.fulfill({status,contentType:'application/json',headers:cors,body:JSON.stringify(data)});
 });
 const page=await ctx.newPage();
 page.on('pageerror',e=>failures.push('Page error in '+name+': '+e.name));
 await page.goto(origin+'/');
 const initial=await page.evaluate(()=>({loggedIn:Boolean(window.closetAuth?.user),hidden:document.getElementById('appShell').hidden}));
 assert.equal(initial.loggedIn,false);
 assert.equal(initial.hidden,true);
 await page.locator('#authEmail').fill(email);
 await page.locator('#authPassword').fill('synthetic-not-a-real-password');
 await page.locator('#authSubmit').click();
 const id=emails.get(email);
 await page.waitForFunction(expected=>window.closetAuth?.user?.id===expected,id,{timeout:10000});
 return {ctx,page,id,name};
}
async function state(person){
 return person.page.evaluate(()=>({
  id:window.closetAuth?.user?.id||null,
  appHidden:document.getElementById('appShell').hidden,
  gateHidden:document.getElementById('authGate').hidden,
  keyPresent:localStorage.getItem('closet-alpha-staging-auth-v1')!==null,
  productionKeyPresent:localStorage.getItem('closet-current-auth-v1')!==null,
 }));
}
try{
 const first=await openContext('samsung','alpha-a@example.invalid');
 const second=await openContext('chrome','alpha-b@example.invalid');
 const third=await openContext('another-device','alpha-a@example.invalid');
 for(const person of [first,second,third]){
  const now=await state(person);
  assert.equal(now.id,person.id);
  assert.equal(now.appHidden,false);
  assert.equal(now.gateHidden,true);
  assert.equal(now.keyPresent,true);
  assert.equal(now.productionKeyPresent,false);
 }
 // The same owner can be signed into separate browsers simultaneously.
 assert.equal((await state(first)).id,(await state(third)).id);
 assert.notEqual((await state(first)).id,(await state(second)).id);
 // A reload restores each browser from its own storage, not another browser's.
 for(const person of [second,first,third]){
  await person.page.reload();
  await person.page.waitForFunction(expected=>window.closetAuth?.user?.id===expected,
   person.id,{timeout:10000});
  assert.equal((await state(person)).id,person.id);
 }
 // Logging out in one browser must NOT log out either of the others.
 await first.page.locator('#logout').click();
 await first.page.waitForFunction(()=>window.closetAuth?.user===null&&
  document.getElementById('appShell').hidden===true,{timeout:10000});
 assert.equal((await state(first)).keyPresent,false);
 assert.equal((await state(second)).id,b);
 assert.equal((await state(third)).id,a);
 assert.equal((await state(second)).appHidden,false);
 assert.equal((await state(third)).appHidden,false);
 assert.deepEqual(failures,[]);
 assert.equal(requestStats.logins,3);
 assert.ok(requestStats.refresh>=3);
 assert.equal(requestStats.logout,1);
 console.log('TWO_BROWSER_STAGING_AUTH_SYNTHETIC_PASS '+JSON.stringify({
  contexts:3,distinctAccounts:2,
  sameAccountConcurrent:true,ownerSeparated:true,
  independentRestore:true,logoutIsolated:true,
  stagedOriginOnly:true,realCspApplied:true,releaseGate:'HOLD',
  liveSupabaseRequests:0,productionRequests:0,personalPhotos:0
 }));
}finally{
 await Promise.all(contexts.map(ctx=>ctx.close().catch(()=>{})));
 await browser.close();
}
