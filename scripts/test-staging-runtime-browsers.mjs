// Generated staging bundle in real browser engines; all external requests intercepted.
// No database, SMTP, customer account, or inference provider is contacted.
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
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
  let record=null,offline=false,corrupt=false,dropSaveReply=false;
  const photos=new Map(),contexts=[context];
  try{
   const intercept=async route=>{
    const url=route.request().url();
    if(new URL(url).origin===origin)return route.continue();
    // Route interception runs before any external request leaves the browser.
    if(url.includes('hlkgymugtfbirlpunsra')||url.includes('qlwotqbqxpgkheitsboe')){live.push(url);return route.abort();}
    if(!url.startsWith(backend+'/')){blocked.push(new URL(url).origin);return route.abort();}
    const parsed=new URL(url);
    if(offline)return route.abort('failed');
    calls.push({path:parsed.pathname,search:parsed.search,method:route.request().method()});
    let body={};
    if(parsed.pathname==='/auth/v1/token')body={access_token:'synthetic-stage-access',refresh_token:'synthetic-stage-refresh',expires_in:3600,user:{id:owner,email:'synthetic@example.invalid'}};
    else if(parsed.pathname==='/auth/v1/user')body={id:owner,email:'synthetic@example.invalid'};
    else if(parsed.pathname==='/rest/v1/closet_backups'){
     assert.equal(parsed.searchParams.get('owner_id'),'eq.'+owner);
     body=record?[structuredClone(record)]:[];
    }else if(parsed.pathname==='/rest/v1/rpc/save_closet_backup'){
     const data=route.request().postDataJSON();
     assert.equal(route.request().method(),'POST');
     if(data.p_expected_revision!==(record?.revision||0))body=null;
     else{
      record={revision:(record?.revision||0)+1,document:structuredClone(data.p_document)};
      body=record.revision;
      if(dropSaveReply){dropSaveReply=false;return route.abort('failed');}
     }
    }else if(parsed.pathname.startsWith('/storage/v1/object/closet-private/')){
     const path=parsed.pathname.slice('/storage/v1/object/closet-private/'.length);
     assert.match(path,new RegExp('^'+owner+'/[a-f0-9]{64}\\.jpg$'));
     if(route.request().method()==='POST'){
      const bytes=route.request().postDataBuffer();
      assert.equal(createHash('sha256').update(bytes).digest('hex'),path.split('/')[1].slice(0,-4));
      if(photos.has(path))return route.fulfill({status:409,contentType:'application/json',body:'{}'});
      photos.set(path,bytes);
     }else{
      assert.equal(route.request().method(),'GET');assert.ok(photos.has(path));
      return route.fulfill({status:200,contentType:'image/jpeg',body:corrupt?Buffer.from('corrupt synthetic image'):photos.get(path),headers:{'Access-Control-Allow-Origin':'*'}});
     }
    }
    else if(parsed.pathname==='/auth/v1/recover')body={};
    else {blocked.push(parsed.pathname);return route.abort();}
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body),headers:{'Access-Control-Allow-Origin':'*'}});
   };
   await context.route('**/*',intercept);
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
   // Use a generated JPEG, not a customer/benchmark garment or model inference.
   const photo=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;const c=canvas.getContext('2d');c.fillStyle='#3678c0';c.fillRect(0,0,32,32);return canvas.toDataURL('image/jpeg',.95);});
   await page.evaluate(async image=>{
    await closetReady;
    const item={id:'synthetic-photo-item',name:'Synthetic blue shirt',category:'Tops',itemType:'T-shirt',color:'Blue',image,seasons:['Fall'],userAdjusted:true};
    await writeAll([item]);items=[item];await closetCloud.sync();
   },photo);
   await page.waitForFunction(()=>document.getElementById('cloudStatus').textContent==='Cloud backup up to date');
   assert.equal(record.document.items.length,1);assert.equal(photos.size,1);
   assert.ok(record.document.items[0].image.startsWith('closet-photo:'+owner+'/'));
   assert.ok(!JSON.stringify(record).includes('data:image'),'Cloud metadata contains inline photos');
   const freshDevice=async()=>{
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    contexts.push(ctx);await ctx.route('**/*',intercept);
    const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
    await p.goto(origin,{waitUntil:'load'});
    await p.locator('#authEmail').fill('synthetic@example.invalid');
    await p.locator('#authPassword').fill('synthetic-password-2026');await p.locator('#authSubmit').click();
    await p.evaluate(()=>closetReady);return p;
   };
   // An independent browser storage partition must reconstruct identical bytes.
   const restored=await freshDevice();
   await restored.waitForFunction(()=>items.length===1&&document.getElementById('cloudStatus').textContent==='Cloud backup up to date');
   assert.equal(await restored.evaluate(()=>items[0].image),photo);
   assert.equal(await restored.evaluate(()=>items[0].color),'Blue');
   // Offline edit survives reload, then retries against the same immutable photo.
   offline=true;
   await restored.evaluate(async()=>{const item={...items[0],name:'Offline synthetic edit'};await writeAll([item]);items=[item];await closetCloud.sync();});
   assert.match(await restored.locator('#cloudStatus').textContent(),/pending/);
   await restored.reload();await restored.evaluate(()=>closetReady);
   assert.equal(await restored.evaluate(()=>items[0].name),'Offline synthetic edit');
   offline=false;await restored.evaluate(()=>closetCloud.sync());
   await restored.waitForFunction(()=>document.getElementById('cloudStatus').textContent==='Cloud backup up to date');
   assert.equal(record.document.items[0].name,'Offline synthetic edit');assert.equal(photos.size,1);
   // Simulate a committed RPC whose reply is lost. Retry must not duplicate items.
   dropSaveReply=true;
   await restored.evaluate(async()=>{const item={...items[0],notes:'Lost reply retained'};await writeAll([item]);items=[item];await closetCloud.sync();});
   assert.match(await restored.locator('#cloudStatus').textContent(),/pending/);
   await restored.evaluate(()=>closetCloud.sync());
   await restored.waitForFunction(()=>document.getElementById('cloudStatus').textContent==='Cloud backup up to date');
   assert.equal(record.document.items.length,1);assert.equal(record.document.items[0].notes,'Lost reply retained');
   // Corrupted download must leave a clean device empty and recover after retry.
   corrupt=true;const damaged=await freshDevice();
   await damaged.waitForFunction(()=>document.getElementById('cloudStatus').textContent.includes('unavailable'));
   assert.equal(await damaged.evaluate(()=>items.length),0);
   assert.equal(await damaged.evaluate(()=>new Promise((resolve,reject)=>{const r=db.transaction('items').objectStore('items').getAll();r.onsuccess=()=>resolve(r.result.length);r.onerror=()=>reject(r.error);})),0);
   corrupt=false;await damaged.evaluate(()=>closetCloud.sync());
   await damaged.waitForFunction(()=>items.length===1&&document.getElementById('cloudStatus').textContent==='Cloud backup up to date');
   assert.equal(await damaged.evaluate(()=>items[0].image),photo);
   assert.deepEqual(live,[],'Attempted to access a live database');
   assert.deepEqual(errors,[],'Generated app threw browser exceptions');
   results.push({engine:name,login:true,stagingEmailCallback:true,stagingBackup:true,photoBytesRestored:true,offlineEditSurvivedReload:true,lostSaveReplyRecovered:true,corruptPhotoRejectedAndRecovered:true,paidTryOnBlocked:true,liveDatabaseRequests:0,externalRequestsIntercepted:true,otherExternalOriginsBlocked:[...new Set(blocked)],physicalPhoneValidated:false});
  }catch(error){console.error(JSON.stringify({engine:name,syntheticCalls:calls,liveRequestCount:live.length,blockedExternalOrigins:[...new Set(blocked)],pageErrors:errors}));throw error;}finally{for(const ctx of contexts)await ctx.close();await browser.close();}
 }
 console.log('STAGING_RUNTIME_BROWSER_QA '+JSON.stringify({results,realHostedIsolationVerified:false,productionPromotion:'BLOCKED'}));
}finally{await new Promise(resolve=>server.close(resolve));}
