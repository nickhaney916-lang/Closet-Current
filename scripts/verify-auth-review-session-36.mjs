/**
 * AUTH-REVIEW-SESSION-36: two fixture-auth browser owners, actual research
 * native multi-photo review, original JPEG WebCrypto, real private IndexedDB,
 * cross-tab logout, and correct owner re-entry.
 *
 * HTTP Auth is simulated by a clearly identified route fixture. Separate
 * signed-local.mjs runs two *real* disposable Supabase password sessions.
 * These are not falsely combined into a claim of signed browser-to-cloud E2E.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';

const root=resolve('.'),out=resolve('benchmark/auth-review-session-36/browser');
await mkdir(out,{recursive:true});
const digest=buffer=>createHash('sha256').update(buffer).digest('hex');
const photo={};
for(const [owner,color,background] of [['a','#bf3030','#e5e0dd'],['b','#3565b0','#d9e0e8']]){
 const svg=Buffer.from('<svg width="710" height="530" xmlns="http://www.w3.org/2000/svg"><rect width="710" height="530" fill="'+background+'"/><path d="M170 80 L245 34 L410 34 L480 80 L520 180 L458 208 L428 147 L430 465 L220 465 L220 145 L185 208 L120 177Z" fill="'+color+'"/></svg>');
 const bytes=await sharp(svg).jpeg({quality:89}).toBuffer();
 photo[owner]={bytes,data:'data:image/jpeg;base64,'+bytes.toString('base64'),sha:digest(bytes)};
}
const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.bin':'application/octet-stream','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(req.method!=='GET'||!/^\/(public|research)\//.test(path)||path.includes('..')||path.includes('\\'))throw Error('Blocked');
  const target=resolve(root,'.'+path);
  if(!target.startsWith(root+'/'))throw Error('Not in repo');
  // Unmanaged local fixture: only the optional managed trend endpoint returns 204.
  if(path==='/public/maintenance/trends')return res.writeHead(204,{'cache-control':'no-store'}).end();
  const bytes=await readFile(target); // Never commit success headers before the read succeeds.
  res.writeHead(200,{'content-type':types[extname(target)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{if(!res.headersSent)res.writeHead(404).end();else res.destroy();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const auth='https://hlkgymugtfbirlpunsra.supabase.co',failures=[],unauthorized=[],cases=[];
const url=origin+'/public/index.html?multi24=research&captureProof01=after&index04=after&nativeIndex07=research&nativeLossless04=research&index02=after';
const hashEvidence=async(page,engine,width,stage)=>{
 const buf=await page.screenshot({animations:'disabled',fullPage:true});
 const file=engine+'-'+width+'-'+stage+'.png';
 await writeFile(out+'/'+file,buf);
 const meta=await sharp(buf).metadata(),stats=await sharp(buf).stats();
 assert.equal(meta.format,'png');assert.equal(meta.width,width);
 assert.ok(meta.height>=560&&buf.length>7000);
 assert.ok(stats.channels.some(c=>c.stdev>6),'Screenshot cannot be blank');
 return {file,sha256:digest(buf),width,height:meta.height,bytes:buf.length};
};
async function fixtureAuth(route,confirmedGate){
 const req=route.request(),address=new URL(req.url());
 if(address.pathname==='/auth/v1/logout'){
  const isB=req.headers().authorization==='Bearer fixture-access-owner-b';
   if(!isB)await confirmedGate;else await new Promise(resolve=>setTimeout(resolve,650));
  return route.fulfill(isB?{status:503,json:{message:'fixture unavailable'}}:{status:204});
 }
 if(address.pathname==='/auth/v1/token'){
  const data=req.postDataJSON(),type=address.searchParams.get('grant_type');
  const match=type==='password'?/^owner-([ab])@example\.test$/.exec(data?.email||''):
   /^fixture-refresh-owner-([ab])$/.exec(data?.refresh_token||'');
  if(!match)return route.fulfill({status:401,json:{message:'invalid fixture credential'}});
  const owner='owner-'+match[1];
  return route.fulfill({status:200,json:{user:{id:owner,email:owner+'@example.test'},
   access_token:'fixture-access-'+owner,refresh_token:'fixture-refresh-'+owner,expires_in:3600}});
 }
 return route.abort();
}
async function login(page,owner){
 await page.locator('#authEmail').fill('owner-'+owner+'@example.test');
 await page.locator('#authPassword').fill('fixture-only');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(u=>window.closetAuth?.user?.id==='owner-'+u&&
  db?.name==='closet-current-user-owner-'+u&&typeof window.closetAuth.assertCurrent==='function',owner,{timeout:25000});
 await page.waitForFunction(()=>window.multi24Research?.active===true,null,{timeout:30000});
}
async function source(page,owner){
 await page.evaluate(()=>switchView('scan'));
 await page.locator('#captureOutfit').click();
 await page.locator('#outfitUpload').setInputFiles({name:'synthetic-'+owner+'.jpg',mimeType:'image/jpeg',buffer:photo[owner].bytes});
 await page.waitForFunction(sha=>window.multi24Research?.debug().sourceSHA256===sha,photo[owner].sha,{timeout:30000});
}
async function readRows(page){
 return page.evaluate(()=>new Promise((resolve,reject)=>{
  if(!db)return resolve([]);
  const request=db.transaction('items').objectStore('items').getAll();
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 }));
}
async function confirmedHumanSave(page,owner){
 await source(page,owner);
 // The real model is network blocked on purpose. Manually review the original
 // photo with the actual crop editor rather than claiming recognition.
 const add=page.getByRole('button',{name:'Add missed piece'});
 await add.click();
 const card=page.locator('#multi24Research article.multi24-card').first();
 await card.getByRole('button',{name:'Adjust crop/mask'}).click();
 const modal=page.locator('dialog.photo-crop-editor');
 await modal.waitFor({state:'visible'});
 await modal.getByRole('button',{name:'Save crop'}).click();
 await modal.waitFor({state:'hidden'});
 const reviewed=page.locator('#multi24Research article.multi24-card').first();
 await reviewed.getByLabel('Main category').selectOption('Tops');
 await reviewed.getByLabel('Specific type').selectOption('T-shirt');
 await reviewed.getByLabel('Color (confirm visually)').fill(owner==='a'?'Red':'Blue');
 await reviewed.getByLabel('I confirm this visible garment, category and color').check();
 await page.getByRole('button',{name:'Save confirmed pieces together'}).click();
 await page.waitForFunction(()=>document.getElementById('multi24Status')?.textContent.includes('1 separately confirmed garment saved together'),null,{timeout:35000});
 const rows=await readRows(page);
 assert.equal(rows.length,1);
 assert.equal(rows[0].ownerId,'owner-'+owner);
 assert.equal(rows[0].sourceSHA256,photo[owner].sha);
 assert.equal(rows[0].originalPhoto.sha256,photo[owner].sha);
 assert.equal(rows[0].originalPhoto.image,photo[owner].data);
 assert.equal(rows[0].category,'Tops');
 assert.equal(rows[0].itemType,'T-shirt');
 assert.equal(rows[0].color,owner==='a'?'Red':'Blue');
 assert.equal(rows[0].extractionReview,'human-confirmed');
 assert.equal(rows[0].threeDReady,false);
 return rows;
}
try{
 // Exercise the previously crashing missing-file path before any browser case.
 assert.equal((await fetch(origin+'/public/__auth36_nonexistent_fixture__')).status,404);
 assert.equal((await fetch(origin+'/public/maintenance/trends')).status,204);
 assert.equal((await fetch(origin+'/public/maintenance/trends',{method:'POST'})).status,404);
 assert.equal((await fetch(origin+'/not-allowed')).status,404);
 assert.equal((await fetch(origin+'/public/index.html')).status,200);
 for(const [engine,launcher] of Object.entries({chromium,webkit})){
  const browser=await launcher.launch();
  try{
   for(const width of [320,390,430]){
    const ctx=await browser.newContext({viewport:{width,height:940},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    let releaseConfirmed;
     const confirmedGate=new Promise(resolve=>{releaseConfirmed=resolve;});
     await ctx.route('**/*',route=>{
     const req=route.request(),url=req.url();
     if(url===origin+'/public/cloud-backup.js')return route.fulfill({status:200,contentType:'text/javascript',body:'window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};'});
     if(url.startsWith(origin+'/')||url.startsWith('blob:'+origin)||url.startsWith('data:'))return route.continue();
     if(url.startsWith(auth+'/auth/v1/'))return fixtureAuth(route,confirmedGate);
     if(req.method()!=='GET')unauthorized.push({engine,width,method:req.method()});
     return route.abort();
    });
    const page=await ctx.newPage();
     // This fixture intentionally returns the same nonrotating token for both
     // tabs. Pin wall-clock Date only (not timers) so recomputing expires_at
     // cannot accidentally publish a different lease during fixture refresh.
     // Real rotating-token behavior remains covered by the separate auth lanes.
     await page.clock.setFixedTime(new Date());
    page.on('pageerror',e=>failures.push({engine,width,error:e.message.slice(0,160)}));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await login(page,'a');
    const savedA=await confirmedHumanSave(page,'a');
    const screenshots=[await hashEvidence(page,engine,width,'01-a-saved')];

    // Same-origin second tab has a REAL owner A session and IndexedDB, but the
    // HTTP auth transport itself is a *fixture*, not signed Supabase.
    const stale=await ctx.newPage();
    stale.on('pageerror',e=>failures.push({engine,width,error:e.message.slice(0,160)}));
    await stale.goto(url,{waitUntil:'domcontentloaded'});
    await stale.waitForFunction(()=>window.closetAuth?.user?.id==='owner-a'&&
      db?.name==='closet-current-user-owner-a'&&window.multi24Research?.active===true,null,{timeout:30000});
    await source(stale,'b'); // a different unconfirmed photo in A's stale tab
    assert.equal((await readRows(stale)).length,1);
     await page.bringToFront();
     for(const [role,tab] of [['initiator',page],['peer',stale]]){
      const live=await tab.evaluate(()=>({owner:window.closetAuth?.user?.id,dbOwner:db?.name,visible:!document.getElementById('appShell').hidden,hasLease:!!localStorage.getItem('closet-current-auth-v1')}));
      assert.deepEqual(live,{owner:'owner-a',dbOwner:'closet-current-user-owner-a',visible:true,hasLease:true},role+' must be live before testing logout');
     }

    // Hold A's reply until both tabs are verified locked; preserve the first assertion error.
    const confirmedLogout=Promise.all([
     page.waitForResponse(r=>r.url()===auth+'/auth/v1/logout'&&r.request().method()==='POST'&&r.status()===204,{timeout:45000}),
     page.waitForEvent('framenavigated',{predicate:f=>f===page.mainFrame(),timeout:45000})
    ]);
     confirmedLogout.catch(()=>{});
     try{
    const initiatorLock=await page.evaluate(()=>{
      document.getElementById('logout').click();
      return {userCleared:window.closetAuth?.user===null,dbAbsent:db===null,appHidden:document.getElementById('appShell').hidden,leaseCleared:localStorage.getItem('closet-current-auth-v1')===null};
     });
     assert.deepEqual(initiatorLock,{userCleared:true,dbAbsent:true,appHidden:true,leaseCleared:true},'Initiating tab must lock synchronously, before server reply');
    await stale.waitForFunction(()=>window.closetAuth?.user===null&&db===null&&
      document.getElementById('appShell').hidden&&
      document.getElementById('multi24Grid')?.querySelectorAll('article').length===0,null,{timeout:2500,polling:50});
    const locked=await stale.evaluate(()=>({
     user:window.closetAuth.user,appHidden:document.getElementById('appShell').hidden,
     sourceCleared:document.querySelector('#multi24Research .multi24-source')?.getAttribute('src')===null,
     dbAbsent:db===null
    }));
    assert.deepEqual(locked,{user:null,appHidden:true,sourceCleared:true,dbAbsent:true});
    screenshots.push(await hashEvidence(stale,engine,width,'02-a-session-locked'));
     }catch(error){console.error('AUTH36 pre-response lock failure',engine,width,error,'sanitized page errors',failures);throw error;}
     finally{releaseConfirmed();}
    await confirmedLogout;
    await page.waitForFunction(()=>window.closetAuth?.user===null&&document.getElementById('authStatus')?.textContent.trim(),null,{timeout:15000});
    await page.locator('#authSubmit').waitFor({state:'visible',timeout:15000});
    assert.doesNotMatch(await page.locator('#authStatus').textContent(),/Server sign-out could not be confirmed/);
    await login(page,'b');
    assert.deepEqual(await readRows(page),[],'Owner B cannot see A wardrobe through app');
    const savedB=await confirmedHumanSave(page,'b');
    assert.notEqual(savedA[0].sourceSHA256,savedB[0].sourceSHA256);
    screenshots.push(await hashEvidence(page,engine,width,'03-b-saved'));
    const unconfirmedLogout=Promise.all([
     page.waitForResponse(r=>r.url()===auth+'/auth/v1/logout'&&r.request().method()==='POST'&&r.status()===503,{timeout:15000}),
     page.waitForEvent('framenavigated',{predicate:f=>f===page.mainFrame(),timeout:15000})
    ]);
     unconfirmedLogout.catch(()=>{});
    await page.evaluate(()=>document.getElementById('logout').click());
    await unconfirmedLogout;
    await page.locator('#authSubmit').waitFor({state:'visible',timeout:15000});
    await page.waitForFunction(()=>document.getElementById('authStatus').textContent.includes('Server sign-out could not be confirmed'),null,{timeout:15000});
    assert.equal(await page.evaluate(()=>localStorage.getItem('closet-current-auth-v1')),null);
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('closet-current-logout-unconfirmed-v1')),null);
    await login(page,'a');
    const restoredA=await readRows(page);
    assert.equal(restoredA.length,1);
    assert.equal(restoredA[0].sourceSHA256,photo.a.sha);
    assert.equal(restoredA[0].ownerId,'owner-a');
    assert.ok(!restoredA.some(x=>x.ownerId==='owner-b'||x.sourceSHA256===photo.b.sha));
    screenshots.push(await hashEvidence(page,engine,width,'04-a-reopened'));
    cases.push({engine,width,sourceA:photo.a.sha,sourceB:photo.b.sha,
      savedA:1,savedB:1,ownerBCannotAccessA:true,staleTabLocked:true,
      originalBytesVerified:true,humanConfirmed:true,previousAccountReopens:true,
      confirmedLogout204:true,unconfirmedLogout503Notice:true,
      realNativeIndexedDB:true,authTransport:'synthetic HTTP fixture, NOT signed browser',
      screenshots});
    await ctx.close();
   }
  }finally{await browser.close();}
 }
 assert.equal(cases.length,6);
 assert.deepEqual(failures,[],'browser page errors');
 assert.deepEqual(unauthorized,[],'unapproved external photo uploads');
 const report={priority:'AUTH-REVIEW-SESSION-36',engines:['chromium','webkit'],widths:[320,390,430],
  browserCases:6,confirmedLogout204Cases:6,unconfirmedLogout503NoticeCases:6,realNativeIndexedDB:true,photoSource:'locally generated synthetic JPEG',
  realOriginalWebCrypto:true,realSignedBrowserToCloud:false,
  authTransport:'fixture',segFormerActuallyRun:false,productionTouched:false,FamilyAlpha:'HOLD',
  unexpectedUploads:unauthorized,pageErrors:failures,cases};
 await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');
 console.log('AUTH36 native camera-to-two-private-closets: 6 Chromium/WebKit cases / 24 screenshots; signed browser-to-cloud UNVERIFIED; Family Alpha HOLD');
}finally{await new Promise(done=>server.close(done));}
