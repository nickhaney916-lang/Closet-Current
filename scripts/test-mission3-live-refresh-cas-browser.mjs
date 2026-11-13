// Mission 3 — exact live auth.js refresh CAS under real Chromium + WebKit
// synthetic same-origin cross-tab token rotation and owner-private IDB.
// No hosted requests, no private owner data, no deployment.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const root=resolve('public'),out=resolve(process.argv[2]||'benchmark/mission3-live-refresh-cas-browser');
await mkdir(out,{recursive:true});
const jpeg=await sharp({create:{width:128,height:96,channels:3,background:{r:97,g:132,b:174}}}).jpeg({quality:90}).toBuffer();
const photo='data:image/jpeg;base64,'+jpeg.toString('base64');
const sourceSHA256=createHash('sha256').update(jpeg).digest('hex');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.css':'text/css'};
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(p==='/'?'/index.html':p));
  if(!file.startsWith(root+'/')||p.includes('\\'))throw Error('local file only');
  const buffer=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(buffer);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port,
 STORE='closet-current-auth-v1',cases=[],errors=[];
const signed=(user,tag)=>({user:{id:user,email:'owner@synthetic.invalid'},access_token:'access-'+tag,refresh_token:'refresh-'+tag,expires_in:3600});
function held(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]])
 for(const width of [320,390,430]){
  const A='a'+width+'0000-0000-4000-8000-000000000000';
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const offHost=[];let mode='online',heldRoute=null,release=null;
  try{
   await context.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',body:
    'window.closetCloud={start:async()=>({started:true}),beforeWrite:async()=>{},changed:()=>{}};'}));
   // Real auth.js, only synthetic signed auth replies. Explicitly deny all other external requests.
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.hostname==='127.0.0.1'||['blob:','data:'].includes(u.protocol))return route.fallback();
    offHost.push({url:u.pathname,method:route.request().method});return route.abort();
   });
   await context.route('https://hlkgymugtfbirlpunsra.supabase.co/auth/v1/**',route=>{
    if(mode==='hold'){
     heldRoute=route;
     return new Promise(res=>{release=async(response)=>{await route.fulfill(response);res();};});
    }
    if(mode==='invalid')return route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error_code:'invalid_grant',message:'Invalid synthetic refresh'})});
    if(mode==='server-down')return route.abort('internetdisconnected');
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(signed(A,'verified-'+mode))});
   });
   await context.addInitScript(()=>{
    class WorkerOffline{
     constructor(){this.onmessage=null;this.terminated=false;}
     postMessage(m){setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{id:m.id,type:m.type==='load'?'ready':'result',choices:[],strong:false,details:{}}});},0);}
     terminate(){this.terminated=true;}
    }
    Object.defineProperty(window,'Worker',{value:WorkerOffline,configurable:true});
   });
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push({engine,width,error:String(e)}));
   await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
   // Auth is locked. Seed synthetic credential then reload for real verified refresh.
   const initial=JSON.stringify({epoch:'stable-signed-session-'+width,access_token:'access-old',refresh_token:'refresh-old',expires_at:9999999999});
   await page.evaluate(({STORE,initial})=>localStorage.setItem(STORE,initial),{STORE,initial});
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(owner=>window.closetAuth.user?.id===owner&&!document.getElementById('appShell').hidden,A,{timeout:15000});
   await page.evaluate(()=>closetReady);
   await page.evaluate(async({A,photo,sourceSHA256})=>{
    const value={id:'sha-backed-owned-original',ownerId:A,
     name:'Signed owner synthetic blue top',category:'Tops',itemType:'T-shirt',image:photo,
     sourceSHA256,sourceHashVerified:true,
     originalPhoto:{image:photo,sha256:sourceSHA256,width:128,height:96,origin:'photo-file'}};
    await writeAll([value]);
   },{A,photo,sourceSHA256});
   const before=await page.evaluate(STORE=>JSON.parse(localStorage.getItem(STORE)),STORE);
   assert.equal(before.epoch,'stable-signed-session-'+width);
   // Hold a second live Auth refresh, then another same-origin tab rotates
   // the *same owner and epoch* while the first response is still pending.
   mode='hold';
   const pending=page.evaluate(async()=>{
    try{await window.closetAuth.getAccessToken({force:true});return 'accepted';}
    catch(e){return 'rejected:'+e.message;}
   });
   for(let n=0;n<100&&!heldRoute;n++)await new Promise(r=>setTimeout(r,20));
   assert.ok(heldRoute,'old live refresh must be held at synthetic HTTP');
   const secondTab=await context.newPage();
   // Only the first tab is the live-auth subject. A second same-origin tab
   // mutates localStorage without accidentally starting a second refresh that
   // could consume the deliberately held first-tab route.
   await secondTab.route('**/auth.js*',route=>route.fulfill({
    contentType:'text/javascript',
    body:'window.closetAuth={user:null,ready:new Promise(()=>{})};'
   }));
   await secondTab.goto(origin+'/',{waitUntil:'domcontentloaded'});
   const newer=await secondTab.evaluate(({STORE})=>{
    const v=JSON.parse(localStorage.getItem(STORE));
    v.refresh_token='refresh-newer-tab';v.access_token='access-newer-tab';
    const next=JSON.stringify(v);localStorage.setItem(STORE,next);return next;
   },{STORE});
   await page.waitForFunction(()=>document.getElementById('appShell').hidden&&window.closetAuth.user===null,{timeout:15000});
   await release({status:200,contentType:'application/json',body:JSON.stringify(signed(A,'obsolete-response'))});
   const stale=await pending;
   assert.match(stale,/rejected:/);
   const state=await page.evaluate(STORE=>({
    credential:localStorage.getItem(STORE),
    user:window.closetAuth.user?.id??null,
    locked:document.getElementById('appShell').hidden
   }),STORE);
   assert.equal(state.credential,newer);assert.equal(state.user,null);assert.equal(state.locked,true);
   await secondTab.close();
   // Reopen with the newly stored synthetic credential. The original JPEG
   // must survive, and only successful verified refresh may unlock the closet.
   mode='newer-login';
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(owner=>window.closetAuth.user?.id===owner,A,{timeout:15000});
   await page.evaluate(()=>closetReady);
   const item=await page.evaluate(()=>{
    const x=items.find(x=>x.id==='sha-backed-owned-original');
    return x?{ownerId:x.ownerId,sourceSHA256:x.sourceSHA256,originalSHA:x.originalPhoto?.sha256,image:x.originalPhoto?.image}:null;
   });
   assert.deepEqual(item,{ownerId:A,sourceSHA256,originalSHA:sourceSHA256,image:photo});
   // Invalid refresh token must revoke private UI and cached credential,
   // whereas a transient network error must not falsely revoke it.
   mode='server-down';
   const snapshot=await page.evaluate(STORE=>localStorage.getItem(STORE),STORE);
   const temporary=await page.evaluate(async()=>{
    try{await window.closetAuth.getAccessToken({force:true});return 'accepted';}
    catch(e){return 'rejected:'+e.message;}
   });
   assert.match(temporary,/rejected:/);
   assert.equal(await page.evaluate(STORE=>localStorage.getItem(STORE),STORE),snapshot);
   assert.equal(await page.evaluate(()=>window.closetAuth.user?.id),A);
   mode='invalid';
   const invalid=await page.evaluate(async()=>{
    try{await window.closetAuth.getAccessToken({force:true});return 'accepted';}
    catch(e){return 'rejected:'+e.message;}
   });
   assert.match(invalid,/rejected:/);
   const revoked=await page.evaluate(STORE=>({
    credential:localStorage.getItem(STORE),user:window.closetAuth.user?.id??null,
    locked:document.getElementById('appShell').hidden
   }),STORE);
   assert.equal(revoked.credential,null);assert.equal(revoked.user,null);assert.equal(revoked.locked,true);
   assert.equal(offHost.filter(x=>x.method!=='GET').length,0,'no hosted cloud writes');
   assert.ok(!offHost.some(x=>x.url.includes('/auth/v1/')),'all auth requests must stay locally intercepted');
   const shot=await page.screenshot({path:resolve(out,engine+'-'+width+'-revoked.png')});
   assert.equal((await sharp(shot).metadata()).width,width);
   cases.push({engine,width,nativeIndexedDB:true,
    sameEpochCrossTabCredentialCAS:true,staleResponseRejected:true,
    latestCredentialsPreserved:true,originalJPEGSHA256:sourceSHA256,
    verifiedFreshLogin:true,temporaryNetworkDoesNotRevoke:true,
    invalidTokenRevokes:true,syntheticAuth:true,hostedSupabase:false,
    screenshotSha256:createHash('sha256').update(shot).digest('hex')});
  }finally{await context.close();await browser.close();}
 }
 assert.equal(cases.length,6);assert.deepEqual(errors,[]);
 const receipt=JSON.stringify({milestone:'mission3-live-session-refresh-cas',cases,errors,physicalPhones:false,hostedSupabase:false},null,2)+'\n';
 await writeFile(resolve(out,'results.json'),receipt);
 await writeFile(resolve(out,'sha256.txt'),createHash('sha256').update(receipt).digest('hex')+'  results.json\n');
 console.log('PASS: six real Chromium/WebKit 320/390/430 same-epoch token rotation, native private JPEG, invalid refresh and transient offline cases');
}finally{server.close();}
