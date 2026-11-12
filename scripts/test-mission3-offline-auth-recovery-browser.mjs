// Mission 3: real Chromium/WebKit Auth startup, transient offline refresh,
// owner-private original-photo IndexedDB persistence and secure reconnect.
// Supabase responses are synthetic local route fixtures; NO hosted requests.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const root=resolve('public'),out=resolve(process.argv[2]||'benchmark/mission3-offline-auth-recovery-browser');
await mkdir(out,{recursive:true});
const photoBytes=await sharp({create:{width:80,height:64,channels:3,
 background:{r:85,g:130,b:201}}}).jpeg({quality:91}).toBuffer();
const photo='data:image/jpeg;base64,'+photoBytes.toString('base64'),
 sha=createHash('sha256').update(photoBytes).digest('hex');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json',
 '.svg':'image/svg+xml','.css':'text/css'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const full=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!full.startsWith(root+'/')||path.includes('\\'))throw Error('Invalid local path');
  const body=await readFile(full);
  res.writeHead(200,{'content-type':types[extname(full)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port,STORE='closet-current-auth-v1';
const cases=[],errors=[];
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const owner='a'+width+'0000-0000-4000-8000-000000000000',
    credential={epoch:'synthetic-owner-session-'+width,
     access_token:'synthetic-old-access',refresh_token:'synthetic-old-refresh',expires_at:9999999999},
    originalSession=JSON.stringify(credential);
   const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
    hasTouch:true,serviceWorkers:'block'});
   const external=[],requests=[];
   let authMode='offline';
   try{
    await context.route('**/cloud-backup.js*',route=>route.fulfill({
     contentType:'text/javascript',body:
      "window.closetCloud={start:async()=>({paused:true}),beforeWrite:async()=>{},changed:()=>{}};"
    }));
    await context.route('**/*',route=>{
     const url=new URL(route.request().url());
     if(['blob:','data:'].includes(url.protocol)||url.hostname==='127.0.0.1')return route.fallback();
     external.push({method:route.request().method(),path:url.pathname});
     return route.abort();
    });
    await context.route('https://hlkgymugtfbirlpunsra.supabase.co/auth/v1/**',route=>{
     requests.push({mode:authMode,path:new URL(route.request().url()).pathname});
     if(authMode==='offline')return route.abort('internetdisconnected');
     if(authMode==='badtoken')return route.fulfill({status:401,
      contentType:'application/json',
      body:JSON.stringify({error_code:'invalid_grant',message:'Synthetic invalid token'})});
     return route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({user:{id:owner,email:'synthetic@invalid.local'},
       access_token:'verified-synthetic',refresh_token:'rotated-synthetic',expires_in:3600})});
    });
    await context.addInitScript(()=>{
     class LocalReviewWorker{
      constructor(){this.onmessage=null;this.terminated=false;}
      postMessage(m){setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{
       id:m.id,type:m.type==='load'?'ready':'result',strong:false,choices:[],details:{}
      }});},0);}
      terminate(){this.terminated=true;}
     }
     Object.defineProperty(window,'Worker',{value:LocalReviewWorker,configurable:true});
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push({engine,width,error:String(e)}));
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    // Direct native IndexedDB seed uses a synthetic owner and original JPEG.
    // No auth bypass: the private app shell is never opened until the signed
    // mocked refresh actually verifies the account on subsequent page load.
    await page.evaluate(async({owner,photo,sha,STORE,originalSession})=>{
     const base=await new Promise((resolve,reject)=>{
      const req=indexedDB.open('closet-current-user-'+owner,2);
      req.onupgradeneeded=()=>{
       if(!req.result.objectStoreNames.contains('items'))
        req.result.createObjectStore('items',{keyPath:'id'});
       if(!req.result.objectStoreNames.contains('state'))
        req.result.createObjectStore('state',{keyPath:'id'});
      };
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
     });
     const item={id:'synthetic-original-owner-item',name:'Original clothing evidence',
      category:'Tops',itemType:'T-shirt',color:'Blue',ownerId:owner,image:photo,
      sourceSHA256:sha,sourceHashVerified:true,
      originalPhoto:{image:photo,sha256:sha,width:80,height:64,origin:'photo-file'}};
     await new Promise((resolve,reject)=>{
      const tx=base.transaction(['items','state'],'readwrite');
      tx.objectStore('items').put(item);
      tx.objectStore('state').put({id:'draft',batch:[{...item,id:'synthetic-unsaved-owner-draft'}]});
      tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
     });
     base.close();
     localStorage.setItem(STORE,originalSession);
    },{owner,photo,sha,STORE,originalSession});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#authStatus')?.textContent.includes('Cannot verify'),
     null,{timeout:15000});
    const offline=await page.evaluate(({STORE})=>({
     credential:localStorage.getItem(STORE),
     gateVisible:!document.getElementById('authGate').hidden,
     shellHidden:document.getElementById('appShell').hidden,
     user:window.closetAuth.user?.id||null,
     status:document.getElementById('authStatus').textContent
    }),{STORE});
    assert.equal(offline.credential,originalSession);
    assert.equal(offline.gateVisible,true);assert.equal(offline.shellHidden,true);assert.equal(offline.user,null);
    authMode='online';
    await page.evaluate(()=>window.dispatchEvent(new Event('online')));
    await page.waitForFunction(owner=>
     window.closetAuth.user?.id===owner&&!document.getElementById('appShell').hidden,
     owner,{timeout:15000});
    await page.evaluate(()=>closetReady);
    const restored=await page.evaluate(({STORE})=>({
     user:window.closetAuth.user.id,
     pieces:items.map(x=>({id:x.id,ownerId:x.ownerId,sha:x.sourceSHA256,
      originalHash:x.originalPhoto?.sha256,photo:x.originalPhoto?.image})),
     drafts:batch.map(x=>({id:x.id,ownerId:x.ownerId,sha:x.sourceSHA256})),
     session:localStorage.getItem(STORE)
    }),{STORE});
    assert.equal(restored.user,owner);
    assert.equal(restored.pieces.length,1);
    assert.equal(restored.pieces[0].sha,sha);
    assert.equal(restored.pieces[0].originalHash,sha);
    assert.equal(restored.pieces[0].photo,photo);
    assert.ok(restored.drafts.some(x=>x.id==='synthetic-unsaved-owner-draft'&&x.ownerId===owner));
    assert.equal(JSON.parse(restored.session).refresh_token,'rotated-synthetic');
    // A changed/removed snapshot must disable automatic restore after an
    // offline page load, even if another tab signs out before reconnect.
    authMode='offline';
    await page.evaluate(({STORE,originalSession})=>localStorage.setItem(STORE,originalSession),
     {STORE,originalSession});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#authStatus')?.textContent.includes('Cannot verify'),
     null,{timeout:15000});
    const stayed=await page.evaluate(async({STORE})=>{
     localStorage.removeItem(STORE);
     window.__reloadSentinel='still-the-locked-document';
     window.dispatchEvent(new Event('online'));
     await new Promise(resolve=>setTimeout(resolve,100));
     return {unlocked:!document.getElementById('appShell').hidden,
      user:window.closetAuth.user?.id||null,
      remaining:localStorage.getItem(STORE),sentinel:window.__reloadSentinel};
    },{STORE});
    assert.equal(stayed.unlocked,false);assert.equal(stayed.user,null);
    assert.equal(stayed.remaining,null);
    assert.equal(stayed.sentinel,'still-the-locked-document');
    // A genuine 401 still clears the local credential rather than endlessly
    // retrying an explicitly rejected refresh.
    authMode='badtoken';
    await page.evaluate(({STORE,originalSession})=>localStorage.setItem(STORE,originalSession),
     {STORE,originalSession});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#authStatus')?.textContent.includes('session has expired'),
     null,{timeout:15000});
    const rejected=await page.evaluate(STORE=>({
     credential:localStorage.getItem(STORE),
     user:window.closetAuth.user?.id||null,
     gate:!document.getElementById('authGate').hidden,
     shell:document.getElementById('appShell').hidden
    }),STORE);
    assert.equal(rejected.credential,null);
    assert.equal(rejected.user,null);assert.equal(rejected.gate,true);assert.equal(rejected.shell,true);
    assert.equal(external.filter(x=>x.method!=='GET').length,0,'No hosted writes');
    assert.equal(external.filter(x=>x.path.includes('/auth/v1/')).length,0,'Auth traffic must be intercepted locally');
    const image=await page.screenshot({path:resolve(out,engine+'-'+width+'-auth-offline.png')});
    assert.equal((await sharp(image).metadata()).width,width);
    cases.push({engine,width,sessionPreservedWhileOffline:true,privateWardrobeRemainsLocked:true,
     verifiedReconnectRestoresPhotoAndDraft:true,noCrossTabCredentialResurrection:true,
     invalidRefreshTokenRemoved:true,owner,originalJPEG_SHA256:sha,
     syntheticAuthOnly:true,nativeIndexedDB:true,realPhone:false,hostedSupabase:false,
     screenshotSHA256:createHash('sha256').update(image).digest('hex'),
     localMockedRefreshRequests:requests.length});
   }finally{await context.close();await browser.close();}
  }
 }
 assert.equal(cases.length,6);assert.deepEqual(errors,[]);
 const receipt=JSON.stringify({milestone:'mission3-offline-auth-session-recovery',
  cases,errors,limitations:{physicalAndroid:false,physicalIPhone:false,hostedSupabase:false}},null,2)+'\n';
 await writeFile(resolve(out,'results.json'),receipt);
 await writeFile(resolve(out,'sha256.txt'),createHash('sha256').update(receipt).digest('hex')+'  results.json\n');
 console.log('PASS: six Chromium/WebKit 320/390/430 real native owner-photo offline-auth refresh, reconnect and 401 revocation cases');
}finally{server.close();}
