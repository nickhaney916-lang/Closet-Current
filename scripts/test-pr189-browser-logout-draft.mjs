// Real Chromium/WebKit browser checks of the exact PR189 app with synthetic
// unpublished staging output. No hosted Auth, customer photos, or paid API calls.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname,resolve,sep} from 'node:path';
import {chromium,webkit} from 'playwright';

const root=resolve('staging-dist');
const proof=JSON.parse(await readFile(root+'/staging-preflight.json','utf8'));
assert.equal(proof.backendProjectRef,'abcdefghijklmnopqrst','Must use invented Supabase fixture');
assert.equal(proof.productionReleaseApproved,false);
assert.equal(proof.paidAIHardBlocked,true);
const backend='https://'+proof.backendProjectRef+'.supabase.co';
const ids={a:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',b:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'};
const files={
 '.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml',
 '.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg',
 '.bin':'application/octet-stream','.webmanifest':'application/manifest+json'
};
const server=createServer(async(req,res)=>{
 try {
  if(req.method!=='GET'){res.writeHead(405);return res.end();}
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!path.startsWith(root+sep)){res.writeHead(403);return res.end();}
  const bytes=await readFile(path);
  res.writeHead(200,{'Content-Type':files[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(bytes);
 }catch {res.writeHead(404);res.end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const results=[];
try {
 for(const [engineName,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]) {
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox']}: {})});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const outside=[],calls=[],pageErrors=[],dialogs=[];
  try {
   await context.route('**/*',route=>{
    const url=route.request().url();
    if(new URL(url).origin===origin)return route.continue();
    if(!url.startsWith(backend+'/')){outside.push(url);return route.abort('blockedbyclient');}
    const parsed=new URL(url),body=route.request().postDataJSON?.()||{};
    const identity=(body?.email||'').startsWith('b-')?'b':'a';
    calls.push({path:parsed.pathname,method:route.request().method()});
    let result={};
    if(parsed.pathname==='/auth/v1/token')
     result={access_token:'synthetic-'+identity+'-access',refresh_token:'synthetic-'+identity+'-refresh',
      expires_in:3600,user:{id:ids[identity],email:identity+'-test@example.invalid'}};
    else if(parsed.pathname==='/auth/v1/user')
     result={id:ids[route.request().headers().authorization?.includes('b-access')?'b':'a']};
    else if(parsed.pathname==='/rest/v1/closet_backups')result=[];
    else if(parsed.pathname==='/rest/v1/rpc/save_closet_backup')result=1;
    else if(parsed.pathname==='/auth/v1/logout')result={};
    else {outside.push('unexpected-mocked-path:'+parsed.pathname);return route.abort('blockedbyclient');}
    return route.fulfill({status:200,contentType:'application/json',
     headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'},body:JSON.stringify(result)});
   });
   const page=await context.newPage();page.setDefaultTimeout(25000);
   page.on('pageerror',e=>pageErrors.push(e.message));
   page.on('dialog',async dialog=>{dialogs.push(dialog.message());await dialog.dismiss();});
   await page.goto(origin,{waitUntil:'load'});
   const login=async(name)=>{
    await page.waitForFunction(()=>window.closetAuth&&document.getElementById('authSubmit')?.disabled===false);
    await page.locator('#authEmail').fill(name+'-test@example.invalid');
    await page.locator('#authPassword').fill('synthetic-password-only');
    await page.locator('#authSubmit').click();
    await page.waitForFunction(id=>window.closetAuth?.user?.id===id,ids[name]);
    await page.evaluate(()=>closetReady);
    await page.waitForFunction(()=>db&&db.name==='closet-current-user-'+window.closetAuth.user.id);
   };
   const clickLogout=async()=>{
    await page.locator('.account-menu > summary').click();
    await page.locator('#logout').click();
   };
   await login('a');
   const seeded=await page.evaluate(async()=>{
    const canvas=document.createElement('canvas');canvas.width=12;canvas.height=12;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#234e9d';ctx.fillRect(0,0,12,12);
    const original=canvas.toDataURL('image/jpeg',.95);
    batch=[{id:'only-a-unfinished-photo',name:'Synthetic test garment',category:'Tops',
      itemType:'T-shirt',color:'Blue',image:original,localAnalyzed:true,userAdjusted:true}];
    const persisted=await persistDraft();
    return {persisted,id:batch[0].id,db:db.name};
   });
   assert.equal(seeded.persisted,true);
   assert.equal(seeded.db,'closet-current-user-'+ids.a);

   // Busy camera or model must block signout without removing the owner.
   await page.evaluate(()=>{busy=true;});
   await clickLogout();
   assert.equal(await page.evaluate(()=>window.closetAuth.user.id),ids.a);
   assert.match(await page.locator('#message').innerText(),/Finish or stop photo capture/);
   await page.evaluate(()=>{busy=false;});

   // Device-storage failure must keep original photo in memory with Retry.
   await page.evaluate(()=>{window.__originalPersistDraft=persistDraft;persistDraft=async()=>false;});
   await clickLogout();
   assert.equal(await page.evaluate(()=>window.closetAuth.user.id),ids.a);
   assert.equal(await page.evaluate(()=>batch.length),1);
   assert.match(await page.locator('#message').innerText(),/Unable to save unfinished photos/);
   await page.evaluate(()=>{persistDraft=window.__originalPersistDraft;});

   // Valid deliberate signout must persist the draft, not cause browser warning,
   // clear session and reload the entire old in-memory wardrobe.
   await page.evaluate(()=>{window.__oldDocumentMarker='owner-A-resident';});
   await clickLogout();
   await page.waitForFunction(()=>window.closetAuth?.user===null&&document.getElementById('authGate').hidden===false&&typeof window.__oldDocumentMarker==='undefined');
   assert.deepEqual(dialogs,[],'Deliberate signout unexpectedly triggered unsaved-changes dialog');
   assert.equal(await page.evaluate(()=>localStorage.getItem('closet-current-auth-v1')),null);

   // A separate user on the very same device must not read A's stored draft.
   await login('b');
   assert.deepEqual(await page.evaluate(()=>({photos:batch.length,garments:items.length,database:db.name})),
    {photos:0,garments:0,database:'closet-current-user-'+ids.b});
   await clickLogout();
   await page.waitForFunction(()=>window.closetAuth?.user===null&&document.getElementById('authGate').hidden===false);

   // Original owner returns to the exact persisted (unfinished) photo.
   await login('a');
   assert.equal(await page.evaluate(()=>batch.length),1);
   const restored=await page.evaluate(()=>({id:batch[0].id,image:batch[0].image,db:db.name}));
   assert.equal(restored.id,seeded.id);
   assert.match(restored.image,/^data:image\/jpeg;base64,/);
   assert.equal(restored.db,'closet-current-user-'+ids.a);
   assert.deepEqual(dialogs,[],'Unexpected browser unsaved changes warning');
   assert.deepEqual(outside,[],'Live/unsupported network request attempted');
   assert.deepEqual(pageErrors,[],'Application threw in browser');
   results.push({engine:engineName,syntheticOnly:true,
    blockedBusyLogout:true,blockedFailedDraftSave:true,
    deliberateLogoutNoBrowserPrompt:true,clearedOldBrowserDocument:true,
    accountBIsolated:true,accountADraftRecovered:true,
    outsideRequests:outside.length,pageErrors:pageErrors.length,
    hostedAuthTested:false,realDeviceValidated:false,productionReleaseApproved:false});
  }finally{await context.close();await browser.close();}
 }
 console.log('PR189_BROWSER_LOGOUT_DRAFT_ISOLATION '+JSON.stringify(results));
}finally{await new Promise(resolve=>server.close(resolve));}
