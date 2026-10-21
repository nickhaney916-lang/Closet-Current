// Real product DOM/CSS/Auth and IndexedDB, with all hosted replies synthetic.
// No live emails, production accounts, customer photos or physical phones.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname,
   file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));
  if(!file.startsWith(root+'/'))throw Error('Unsafe path');
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));

const AUTH_STORE='closet-current-auth-v1',A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222';
const endpoint='https://hlkgymugtfbirlpunsra.supabase.co/auth/v1/';
const baseURL='http://127.0.0.1:'+server.address().port+'/';
const session=id=>({access_token:'synthetic-access-'+id,refresh_token:'synthetic-refresh-'+id,expires_in:3600,
 user:{id,email:(id===A?'a':'b')+'@example.invalid'}});
try{
 for(const [label,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox']}:{})});
  let scenarios=0;
  try{
   async function run(mode,fn,init){
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const calls=[],errors=[];let refreshCount=0;
    if(init)await ctx.addInitScript(init);
    await ctx.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',body:
     'window.closetCloud={beforeWrite:async()=>{},changed(){},start(){}};'}));
    await ctx.route('https://**',route=>route.abort('internetdisconnected'));
    await ctx.route(endpoint+'**',async route=>{
     const req=route.request(),url=req.url();
     if(!url.startsWith(endpoint))return route.abort('internetdisconnected');
     let body={};try{body=req.postDataJSON()||{};}catch{}
     const path=new URL(url).pathname.replace('/auth/v1/','');
     const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS','Access-Control-Allow-Headers':'apikey,content-type,authorization'};
     if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
     calls.push({path,method:req.method(),type:body.type||null});
     const reply=(data,status=200)=>route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(data)});
     if(path.startsWith('resend')||path.startsWith('recover'))return reply({});
     if(path.startsWith('signup'))return reply({user:{id:A,email:'a@example.invalid'}});
     if(path==='verify')return reply(session(body.type==='recovery'?B:A));
     if(path==='user'&&req.method()==='GET')return reply(session(req.headers().authorization?.endsWith(A)?A:B).user);
     if(path==='user'&&req.method()==='PUT')return mode==='expired-reset'?reply({error_code:'session_not_found'},401):reply(session(B).user);
     if(path.includes('grant_type=refresh_token')){
      if(mode==='offline-resume'&&refreshCount++===0)return reply({error_code:'temporarily_unavailable'},503);
      return reply(session(body.refresh_token?.endsWith(A)?A:B));
     }
     if(path.includes('grant_type=password'))return reply(session(body.email==='a@example.invalid'?A:B));
     if(path==='logout')return reply({});
     return reply({error_code:'invalid_credentials'},400);
    });
    const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
    try{await fn(page,calls,ctx);assert.deepEqual(errors,[]);scenarios++;}
    finally{await ctx.close();}
   }
   await run('expired',async(page,calls)=>{
    await page.goto(baseURL+'#error_code=otp_expired&type=recovery');
    await page.getByText(/expired or was already used/).waitFor();
    assert.equal(new URL(page.url()).hash,'');assert.equal(calls.length,0);
    assert.equal(await page.locator('#authResend').isVisible(),true);assert.equal(await page.locator('#authReset').isVisible(),true);
    const layout=[];
    for(const width of [320,390,430]){
     await page.setViewportSize({width,height:844});
     const bounds=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,
      heights:['authSubmit','authMode','authReset','authResend','authPasswordToggle'].map(id=>document.getElementById(id).getBoundingClientRect().height),
      inputSize:getComputedStyle(document.getElementById('authPassword')).fontSize}));
     assert.equal(bounds.overflow,false);assert.ok(bounds.heights.every(x=>x>=48));assert.equal(bounds.inputSize,'16px');layout.push(width);
    }
    await page.locator('#authPasswordToggle').click();assert.equal(await page.locator('#authPassword').getAttribute('type'),'text');
    await page.locator('#authPasswordToggle').click();assert.equal(await page.locator('#authPassword').getAttribute('type'),'password');
    await page.locator('#authEmail').fill('a@example.invalid');
    await page.locator('#authResend').click();await page.getByText(/fresh confirmation link has been requested/).waitFor();
    assert.equal(calls.filter(x=>x.path.startsWith('resend')).length,1,JSON.stringify(calls));assert.equal(calls[0].type,'signup');
    await page.locator('#authReset').click();await page.getByText(/If the address is registered/).waitFor();
    assert.equal(calls.filter(x=>x.path.startsWith('recover')).length,1);
    assert.equal(await page.locator('#appShell').isHidden(),true);
   });
   await run('resume',async(page)=>{
    await page.goto(baseURL);await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),
     {key:AUTH_STORE,value:{refresh_token:'synthetic-refresh-'+A,owner_id:A}});
    await page.goto(baseURL+'?token_hash=syntheticRecoveryHash&type=recovery');
    await page.getByText(/Choose a new password/).waitFor();
    assert.equal(await page.locator('#appShell').isHidden(),true);assert.equal(new URL(page.url()).search,'');
    assert.equal(await page.locator('#authMode').innerText(),'Back to log in');
    const marker=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),AUTH_STORE);assert.equal(marker.recovery_user_id,B);
    await page.reload();await page.getByText(/Choose a new password/).waitFor();
    assert.equal(await page.locator('#authEmail').inputValue(),'b@example.invalid');assert.equal(await page.locator('#appShell').isHidden(),true);
    await page.locator('#authPassword').fill('synthetic-new-password');await page.locator('#authSubmit').click();
    await page.waitForFunction(()=>window.closetAuth.user?.id==='b2222222-2222-4222-8222-222222222222');
    const saved=await page.evaluate(async key=>{await closetReady;const s=JSON.parse(localStorage.getItem(key));return {owner:s.owner_id,recovery:s.recovery===true,db:db.name};},AUTH_STORE);
    assert.deepEqual(saved,{owner:B,recovery:false,db:'closet-current-user-'+B});
   });
   await run('expired-reset',async(page,calls)=>{
    await page.goto(baseURL+'?token_hash=syntheticRecoveryHash&type=recovery');await page.getByText(/Choose a new password/).waitFor();
    await page.locator('#authPassword').fill('synthetic-new-password');await page.locator('#authSubmit').click();
    await page.getByText(/password reset session expired/).waitFor();
    assert.equal(await page.locator('#authEmail').isEnabled(),true);assert.equal(await page.locator('#authReset').isVisible(),true);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),AUTH_STORE),null);
    assert.equal(calls.filter(x=>x.path.startsWith('recover')).length,0,'expired update never automatically resends');
    await page.locator('#authReset').click();await page.getByText(/If the address is registered/).waitFor();
    assert.equal(calls.filter(x=>x.path.startsWith('recover')).length,1);
   });
   await run('offline-resume',async(page,calls)=>{
    await page.goto(baseURL);await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),
     {key:AUTH_STORE,value:{refresh_token:'synthetic-refresh-'+B,owner_id:B,recovery:true,recovery_user_id:B}});
    await page.reload();await page.getByText(/Could not restore your saved login/).waitFor();
    assert.equal(calls.filter(x=>x.path.includes('refresh_token')).length,1);
    await page.locator('#authRetry').click();await page.getByText(/Choose a new password/).waitFor();
    assert.equal(await page.locator('#appShell').isHidden(),true);
    await page.locator('#authMode').click();await page.getByText(/request a fresh password reset email/).waitFor();
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),AUTH_STORE),null);
    assert.equal(calls.some(x=>x.path==='logout'),false);
   });
   await run('shared-device',async(page)=>{
    await page.goto(baseURL);
    await page.locator('#authMode').click();await page.locator('#authUsername').fill('pilot_tester');
    await page.locator('#authEmail').fill('a@example.invalid');await page.locator('#authPassword').fill('synthetic-password');
    await page.locator('#pilotNoticeAck').check();await page.locator('#authSubmit').click();await page.getByText(/Check your email to confirm/).waitFor();
    assert.equal(await page.locator('#appShell').isHidden(),true);
    await page.goto(baseURL+'?token_hash=syntheticSignupHash&type=signup');
    await page.waitForFunction(()=>window.closetAuth.user?.id==='a1111111-1111-4111-8111-111111111111');await page.evaluate(()=>closetReady);
    const photo=await page.evaluate(async()=>{
     const canvas=document.createElement('canvas');canvas.width=90;canvas.height=120;canvas.getContext('2d').fillRect(0,0,90,120);
     const image=canvas.toDataURL('image/jpeg');await writeAll([{id:'only-A',name:'A private photo',category:'Tops',itemType:'T-shirt',color:'Black',image}]);return image;
    });
    await page.locator('.account-menu>summary').click();await Promise.all([page.waitForEvent('load'),page.locator('#logout').click()]);
    await page.locator('#authGate').waitFor({state:'visible'});
    await page.locator('#authEmail').fill('b@example.invalid');await page.locator('#authPassword').fill('synthetic-password');await page.locator('#authSubmit').click();
    await page.waitForFunction(()=>window.closetAuth.user?.id==='b2222222-2222-4222-8222-222222222222');await page.evaluate(()=>closetReady);
    const second=await page.evaluate(async()=>({name:db.name,records:await readAll()}));
    assert.equal(second.name,'closet-current-user-'+B);assert.deepEqual(second.records,[]);
    await page.evaluate(async()=>{const canvas=document.createElement('canvas');canvas.width=90;canvas.height=120;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,90,120);await writeAll([{id:'only-B',name:'B private photo',category:'Shoes',itemType:'Sneakers',color:'White',image:canvas.toDataURL('image/jpeg')}]);});
    await page.locator('.account-menu>summary').click();await Promise.all([page.waitForEvent('load'),page.locator('#logout').click()]);await page.locator('#authGate').waitFor({state:'visible'});
    await page.locator('#authEmail').fill('a@example.invalid');await page.locator('#authPassword').fill('synthetic-password');await page.locator('#authSubmit').click();
    await page.waitForFunction(()=>window.closetAuth.user?.id==='a1111111-1111-4111-8111-111111111111');await page.evaluate(()=>closetReady);
    const restored=await page.evaluate(async()=>({name:db.name,records:await readAll()}));assert.equal(restored.name,'closet-current-user-'+A);
    assert.equal(restored.records.length,1);assert.equal(restored.records[0].id,'only-A');assert.equal(restored.records[0].image,photo);
   });
   await run('blocked-storage',async(page)=>{
    await page.goto(baseURL);await page.locator('#authEmail').fill('a@example.invalid');await page.locator('#authPassword').fill('synthetic-password');await page.locator('#authSubmit').click();
    await page.getByText(/Allow site storage/).waitFor();assert.equal(await page.locator('#appShell').isHidden(),true);
    assert.equal(await page.evaluate(()=>window.closetAuth.user),null);
   },()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='closet-current-auth-v1')throw new DOMException('blocked','SecurityError');return set.call(this,key,value);};});
   console.log('AUTH_RECOVERY_ONBOARDING '+JSON.stringify({browser:label,scenarios,realProductDOM:true,layoutWidths:[320,390,430],minTapHeight:48,
    recoveryReloadLocked:true,expiredResetRecoverable:true,sharedDeviceTwoOwnerPhotosIsolated:true,localMocksOnly:true,liveEmailVerified:false,physicalPhoneTested:false}));
  }finally{await browser.close();}
 }
}finally{await new Promise(resolve=>server.close(resolve));}
