// Mission 3 source auth.js: real Chromium/WebKit multi-tab refresh-token CAS.
// Native owner-private IndexedDB, synthetic JPEG, simulated Supabase Auth
// requests routed locally, no hosted network and no physical phone.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const root=resolve('public'),out=resolve(process.argv[2]||'benchmark/mission3-live-refresh-cas-browser');
await mkdir(out,{recursive:true});
const jpegBytes=await sharp({create:{width:84,height:68,channels:3,
 background:{r:62,g:127,b:176}}}).jpeg({quality:90}).toBuffer();
const jpeg='data:image/jpeg;base64,'+jpegBytes.toString('base64'),
 sha=createHash('sha256').update(jpegBytes).digest('hex');
const localTrendData=await readFile(resolve(root,'trend-data.json'),'utf8');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname),
   file=resolve(root,'.'+(p==='/'?'/index.html':p));
  if(!file.startsWith(root+'/')||p.includes('\\'))throw Error('Unsafe path');
  const bytes=await readFile(file);
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port,STORE='closet-current-auth-v1';
const cases=[],errors=[];
const response=(owner,suffix)=>({user:{id:owner,email:'synthetic@invalid.local'},
 access_token:'verified-access-'+suffix,refresh_token:'verified-refresh-'+suffix,
 expires_in:3600});
const pause=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]])
 for(const width of [320,390,430]){
  const owner='a'+width+'0000-0000-4000-8000-000000000000';
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
   hasTouch:true,serviceWorkers:'block'});
  let mode='ok',held=null,entered=null,authRequests=0;
  const external=[],pageErrors=[];
  try{
   await context.route('**/cloud-backup.js*',route=>route.fulfill({
    contentType:'text/javascript',body:
     "window.closetCloud={start:async()=>({ok:true}),beforeWrite:async()=>{},changed:()=>{}};"
   }));
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(['blob:','data:'].includes(url.protocol)||url.hostname==='127.0.0.1')
     return route.fallback();
    external.push({method:route.request().method(),host:url.hostname});
    return route.abort();
   });
   // The production PWA also checks a public trend feed. Serve the exact
   // checked-in JSON locally so blocked external reads cannot become an
   // intermittent pageerror during otherwise synthetic auth validation.
   await context.route(
     url=>{try{const u=new URL(url);return u.hostname==='raw.githubusercontent.com'&&u.pathname.endsWith('/public/trend-data.json');}catch{return false;}},
    route=>route.fulfill({status:200,contentType:'application/json',body:localTrendData})
   );
   await context.route('https://hlkgymugtfbirlpunsra.supabase.co/auth/v1/**',async route=>{
    authRequests++;
    if(mode==='held'){entered?.resolve();await held.promise;}
    if(mode==='unauthorized')return route.fulfill({status:401,contentType:'application/json',
     body:JSON.stringify({error_code:'invalid_grant',message:'Synthetic refresh revoked'})});
    if(mode==='offline')return route.abort('internetdisconnected');
    return route.fulfill({status:200,contentType:'application/json',
     body:JSON.stringify(response(owner,'updated-'+authRequests))});
   });
   await context.addInitScript(()=>{
    class ReviewWorker{
     constructor(){this.onmessage=null;this.terminated=false;}
     postMessage(m){setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{
      id:m.id,type:m.type==='load'?'ready':'result',strong:false,choices:[],details:{}
     }});},0);}
     terminate(){this.terminated=true;}
    }
    Object.defineProperty(window,'Worker',{value:ReviewWorker,configurable:true});
   });
   const page=await context.newPage();
   page.on('pageerror',e=>{
    const msg=String(e);
    // Only the intentionally blocked public fashion-trend feed may fail
    // independently of Auth/owner-private operations. All other errors fail.
    if(/Fetch API cannot load/.test(msg)&&/trend-data\.json/.test(msg))return;
    pageErrors.push(msg);
   });
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   const seed=JSON.stringify({epoch:'initial-owner-epoch',
    access_token:'initial-expired-access',
    refresh_token:'initial-rotatable-refresh',expires_at:9999999999});
   await page.evaluate(({STORE,seed})=>localStorage.setItem(STORE,seed),{STORE,seed});
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(owner=>window.closetAuth?.user?.id===owner,owner);
   await page.waitForFunction(()=>typeof closetReady!=='undefined',null,{timeout:15000});
   await page.evaluate(()=>closetReady);
   await page.evaluate(async({owner,jpeg,sha})=>{
    const row={id:'M3-CAS-native-original',ownerId:owner,image:jpeg,category:'Tops',
     itemType:'T-shirt',name:'Verified synthetic cotton top',sourceSHA256:sha,
     sourceHashVerified:true,originalPhoto:{image:jpeg,sha256:sha,origin:'photo-file'}};
    await new Promise((resolve,reject)=>{
     const tx=db.transaction('items','readwrite');
     tx.objectStore('items').put(row);
     tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });
   },{owner,jpeg,sha});
   // Start A's actual token refresh, but deliberately hold the response.
   mode='held';held=pause();entered=pause();
   const old=page.evaluate(async()=>window.closetAuth.getAccessToken({force:true})
    .then(v=>({status:'success',value:v}),e=>({status:'rejected',message:String(e.message)})));
   await entered.promise;
   // Another real tab on the same origin rotates a token within the SAME
   // epoch while the first request is still pending.
   const other=await context.newPage();
   await other.goto(base+'/no-auth-helper-file.html');
   const newer=await other.evaluate(STORE=>{
    const s=JSON.parse(localStorage.getItem(STORE));
    s.access_token='newer-other-tab-access';s.refresh_token='newer-other-tab-refresh';
    const updated=JSON.stringify(s);localStorage.setItem(STORE,updated);return updated;
   },STORE);
   await page.waitForFunction(()=>document.getElementById('appShell').hidden);
   held.resolve();
   const stale=await old;
   assert.equal(stale.status,'rejected');
   assert.match(stale.message,/Account session ended|Session replaced/);
   const afterOld=await page.evaluate(STORE=>({
    session:localStorage.getItem(STORE),
    locked:document.getElementById('appShell').hidden,
    user:window.closetAuth.user?.id||null
   }),STORE);
   assert.equal(afterOld.session,newer);
   assert.equal(afterOld.locked,true);assert.equal(afterOld.user,null);
   // The former owner's source JPEG and SHA must still exist on-device.
   const retained=await other.evaluate(async({owner})=>{
    const db=await new Promise((resolve,reject)=>{
     const r=indexedDB.open('closet-current-user-'+owner,2);
     r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });
    const item=await new Promise((resolve,reject)=>{
     const q=db.transaction('items').objectStore('items').get('M3-CAS-native-original');
     q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
    });db.close();return item;
   },{owner});
   assert.equal(retained.ownerId,owner);
   assert.equal(retained.originalPhoto.sha256,sha);
   assert.equal(retained.originalPhoto.image,jpeg);
   // Reauthenticate the original owner by verified real startup refresh,
   // then exercise a rejected *live* rotation (401/invalid_grant).
   mode='ok';await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(owner=>window.closetAuth?.user?.id===owner,owner);
   mode='unauthorized';
   const invalid=await page.evaluate(async()=>window.closetAuth.getAccessToken({force:true})
    .then(()=>({status:'success'}),e=>({status:'rejected',message:String(e.message)})));
   assert.equal(invalid.status,'rejected');
   const revoked=await page.evaluate(STORE=>({
    value:localStorage.getItem(STORE),user:window.closetAuth.user?.id||null,
    hidden:document.getElementById('appShell').hidden
   }),STORE);
   assert.equal(revoked.value,null);assert.equal(revoked.user,null);
   assert.equal(revoked.hidden,true);
   // Reauthorize again. A temporary network outage while a signed session
   // is active must NOT discard verified local state or its session token.
   mode='ok';
   await other.evaluate(STORE=>localStorage.setItem(STORE,JSON.stringify({
    epoch:'fresh-login-epoch',refresh_token:'synthetic-fresh-refresh',
    access_token:'synthetic-old-access',expires_at:9999999999})),STORE);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(owner=>window.closetAuth?.user?.id===owner,owner);
   const beforeOffline=await page.evaluate(STORE=>localStorage.getItem(STORE),STORE);
   mode='offline';
   const temporary=await page.evaluate(async()=>window.closetAuth.getAccessToken({force:true})
    .then(()=>({status:'success'}),e=>({status:'rejected',message:String(e.message)})));
   const afterTemporary=await page.evaluate(STORE=>({
    session:localStorage.getItem(STORE),
    user:window.closetAuth.user?.id||null,
    hidden:document.getElementById('appShell').hidden
   }),STORE);
   assert.equal(temporary.status,'rejected');
   assert.equal(afterTemporary.session,beforeOffline);
   assert.equal(afterTemporary.user,owner);
   assert.equal(afterTemporary.hidden,false);
   mode='ok';
   const next=await page.evaluate(()=>window.closetAuth.getAccessToken({force:true}));
   assert.match(next,/verified-access-updated/);
   const afterNext=await page.evaluate(STORE=>JSON.parse(localStorage.getItem(STORE)),STORE);
   assert.match(afterNext.refresh_token,/verified-refresh-updated/);
   assert.equal(external.filter(x=>x.method!=='GET').length,0);
   assert.equal(external.filter(x=>x.host==='hlkgymugtfbirlpunsra.supabase.co').length,0);
   assert.deepEqual(pageErrors,[]);
   const shot=await page.screenshot({path:resolve(out,engine+'-'+width+'-live-refresh.png')});
   assert.equal((await sharp(shot).metadata()).width,width);
   cases.push({engine,width,sameEpochTokenCAS:true,crossTabStorageLock:true,
    nativeOriginalSHAIntact:true,revokedRefreshLocked:true,
    transientRefreshRetainsVerifiedSession:true,validRotationAfterRecovery:true,
    mockedAuthOnly:true,physicalDevice:false,hostedSupabase:false,
    screenshotSHA256:createHash('sha256').update(shot).digest('hex')});
   await other.close();
  }finally{await context.close();await browser.close();}
 }
 assert.equal(cases.length,6);
 assert.deepEqual(errors,[]);
 const data=JSON.stringify({kind:'mission3-live-session-refresh-cas',
  familyAlphaHold:true,noDeploy:true,cases,errors},null,2)+'\n';
 await writeFile(resolve(out,'results.json'),data);
 await writeFile(resolve(out,'sha256.txt'),
  createHash('sha256').update(data).digest('hex')+'  results.json\n');
 console.log('PASS: six Chromium/WebKit native two-tab live refresh CAS, 401 lock, transient outage original-JPEG cases');
}finally{server.close();}
