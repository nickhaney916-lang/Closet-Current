import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {resolve,extname,sep} from 'node:path';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';

const root=resolve('.'),donor=resolve('.native05-donor-541'),dir=resolve(process.env.ARTIFACT_DIR||'benchmark/cloud-to-native-3d-180');
const enable178=true;const enable180=true;
await mkdir(dir,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
// Verified P541 native 163-bone shirt source, not a generic projected cloth.
const original=readFileSync('benchmark/fixtures/commons-0003.jpg');
const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const originalSHA=sha(original),evidence=locked.find(x=>x.id==='commons-0003');
assert.ok(evidence?.verified&&evidence.sha256===originalSHA&&evidence.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'));
const md=await sharp(original).metadata();
const cutout=await sharp(original).extract({left:0,top:0,width:Math.floor(md.width*.55),height:Math.floor(md.height*.65)}).jpeg({quality:88}).toBuffer();
const cutoutSHA=sha(cutout);
assert.notEqual(originalSHA,cutoutSHA);
const uri=b=>'data:image/jpeg;base64,'+b.toString('base64');
const tokens=new Map(),docs=new Map(),objects=new Map();
const events={reads:0,writes:0,uploads:0,storageReads:0,foreignDenied:0,errors:[],screenshots:[],cases:[],external:[]};
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.glb':'model/gltf-binary','.bin':'application/octet-stream','.woff2':'font/woff2'};
function send(res,status,value,type='application/json'){
 res.writeHead(status,{'content-type':type,'cache-control':'no-store','x-content-type-options':'nosniff'});
 // API JSON objects require encoding. The real licensed Work47 manifest
 // is already a Buffer of original JSON bytes: do not corrupt it into
 // {"type":"Buffer","data":[...]} (which falsely rejects valid cutouts).
 res.end(type==='application/json'&&!Buffer.isBuffer(value)?
  JSON.stringify(value):value);
}
async function body(req){const chunks=[];let n=0;for await(const c of req){n+=c.length;if(n>20_000_000)throw Error('request too large');chunks.push(c);}return Buffer.concat(chunks);}
function owner(req){for(const [id,token] of tokens)if(req.headers.authorization==='Bearer '+token)return id;return null;}
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://127.0.0.1'),p=u.pathname;
  if(p.startsWith('/rest/v1/closet_backups')){
   const id=u.searchParams.get('owner_id')?.replace(/^eq\./,'');
   const who=owner(req);
   if(!who||who!==id){events.foreignDenied++;return send(res,403,{error:'owner denied'});}
   events.reads++;const row=docs.get(who);return send(res,200,row?[structuredClone(row)]:[]);
  }
  if(p==='/rest/v1/rpc/save_closet_backup'){
   const who=owner(req);if(!who){events.foreignDenied++;return send(res,403,{error:'owner denied'});}
   const data=JSON.parse((await body(req)).toString('utf8'));
   if(data?.p_document?.ownerId!==who)return send(res,403,{error:'owner'});
   const previous=docs.get(who),revision=previous?.revision||0;
   if(data.p_expected_revision!==revision)return send(res,200,null);
   docs.set(who,{owner_id:who,revision:revision+1,document:data.p_document});
   events.writes++;return send(res,200,revision+1);
  }
  if(p.startsWith('/storage/v1/object/closet-private/')){
   const who=owner(req),key=decodeURIComponent(p.slice('/storage/v1/object/closet-private/'.length));
   const match=/^([a-f0-9-]{36})\/([a-f0-9]{64})\.jpg$/.exec(key);
   if(!who||!match||match[1]!==who){events.foreignDenied++;return send(res,403,{error:'private storage'});}
   if(req.method==='POST'){
    if(objects.has(key))return send(res,409,{error:'already exists'});
    const bytes=await body(req);
    if(sha(bytes)!==match[2])return send(res,400,{error:'sha mismatch'});
    objects.set(key,bytes);events.uploads++;return send(res,200,{ok:true});
   }
   if(req.method==='GET'){
    events.storageReads++;const bytes=objects.get(key);
    return bytes?send(res,200,bytes,'image/jpeg'):send(res,404,{error:'not found'});
   }
   return send(res,405,{error:'method'});
  }
  if(req.method!=='GET'||p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))return send(res,404,'No','text/plain');
  if(p==='/favicon.ico')return send(res,204,'','text/plain');
  const isDonor=p.startsWith('/donor/')||p.startsWith('/benchmark/');
  const base=isDonor?donor:p.startsWith('/research/')||p.startsWith('/node_modules/')?root:resolve(root,'public');
  const name=p==='/'?'/index.html':p.startsWith('/donor/')?p.slice(6):p;
  const f=resolve(base,'.'+name);
  if(!f.startsWith(base+sep))return send(res,404,'No','text/plain');
  const bytes=await readFile(f);
  return send(res,200,bytes,types[extname(f)]||'application/octet-stream');
 }catch(e){events.errors.push(String(e));return send(res,404,{error:'local research fixture unavailable'});}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port,flag='?ownerReview145=research&ownerReview146=research&ownerCutout178=research&nativeLossless04=research&native3D05=research&cloud3D180=research';
// Independently require the immutable P541 licensed dress source manifest.
const donorManifest=JSON.parse(readFileSync(resolve(donor,'benchmark/work47/manifest.json'),'utf8'));
const sourceDress=donorManifest.rows.find(x=>x.id==='commons-0053');
const dressManifestAcceptable=!!(sourceDress?.hasCutout===true&&
 sourceDress?.ownerApproved===false&&sourceDress?.attribution?.license&&
 /^[a-f0-9]{64}$/.test(sourceDress.cutoutSHA256||''));
assert.ok(dressManifestAcceptable,'P180 immutable P541 original licensed cutout manifest incomplete');
console.log('P180_PINNED_DONOR_MANIFEST_SOURCE',JSON.stringify({
 dressPresent:!!sourceDress,hasCutout:sourceDress?.hasCutout,
 ownerApproved:sourceDress?.ownerApproved,
 originalSHA:sourceDress?.sourceSHA256,
 sourceCutoutSHA:sourceDress?.cutoutSHA256,safeOriginalSourceOnly:true
}));
const screenshot=async(page,engine,width,stage)=>{
 const name=engine+'-'+width+'-'+stage+'.png',bytes=await page.screenshot({animations:'disabled',fullPage:false});
 const md=await sharp(bytes).metadata();assert.equal(md.width,width);
 assert.ok(bytes.length>4000,'nonempty actual screenshot');
 await writeFile(resolve(dir,name),bytes);
 events.screenshots.push({engine,width,stage,name,sha256:sha(bytes)});
};
const readRecord=(page,store,id)=>page.evaluate(({store,id})=>new Promise((ok,bad)=>{
 const q=db.transaction(store,'readonly').objectStore(store).get(id);
 q.onsuccess=()=>ok(q.result);q.onerror=()=>bad(q.error);
}),{store,id});
async function updateColor(page,itemId,color){
 await page.evaluate(({itemId,color})=>new Promise((ok,bad)=>{
  const tx=db.transaction('items','readwrite'),s=tx.objectStore('items'),q=s.get(itemId);
  q.onsuccess=()=>{s.put({...q.result,color});};
  tx.oncomplete=ok;tx.onerror=()=>bad(tx.error);tx.onabort=()=>bad(tx.error);
 }),{itemId,color});
}
async function waitStatus(page,value){
 try{
  await page.waitForFunction(v=>document.getElementById('owner146Status')?.textContent.includes(v),value,{timeout:12000});
 }catch(e){
  const diagnostics=await page.evaluate(async()=>{
   let record=null;
   try{record=await new Promise((ok,bad)=>{
    const q=db.transaction('items','readonly').objectStore('items').get('p146-reviewed-shirt');
    q.onsuccess=()=>ok(q.result);q.onerror=()=>bad(q.error);
   });}catch{}
   return {status:document.getElementById('owner146Status')?.textContent,
    hasModal:!!document.querySelector('#ownerReview146Modal')?.open,
    accountMenuOpen:!!document.querySelector('header .account-menu')?.open,
    restoredColor:record?.color,
    bridge:window.ownerReviewedCloud146?.state?.()};
  });
  throw Error('P146 expected status '+value+'; observed '+JSON.stringify(diagnostics));
 }
}
async function openMenu(page){
 const menu=page.locator('header .account-menu');
 if(!await menu.evaluate(x=>x.open))await menu.locator('summary').click();
}
const item=(ownerId)=>({
 id:'p146-reviewed-shirt',ownerId,
 image:uri(original),originalPhoto:{image:uri(original),sha256:originalSHA},
 sourceSHA256:originalSHA,sourceHashVerified:true,sourcePhotoOriginal:true,
 humanReviewedSource:true,// An original with an independently reviewed segment is NOT a single
 // verified garment in the source photograph. P124/P126 require this false.
 singleGarmentVerified:false,
 outfitSourceId:'p146-licensed-photo',cutoutSHA256:cutoutSHA,
 segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,originalSHA256:originalSHA,
  cutoutSHA256:cutoutSHA,cutoutImage:uri(cutout)},
 category:'Tops',itemType:'T-shirt',color:'Green',colorSource:'user',
 ownerReviewed:true,userAdjusted:true,confirmedCategory:true,confirmedColor:true,
 reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',threeDReady:false
});
const results=[];
try{
 for(const [engine,driver] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await driver.launch({headless:true,...(engine==='chromium'?{args:[
    '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})});
  try{
   for(const width of [320,390,430]){
    const ownerId=randomUUID(),otherId=randomUUID();
    const token='p146-synthetic-local-only-'+ownerId;
    const otherToken='p146-synthetic-local-only-'+otherId;
    tokens.set(ownerId,token);tokens.set(otherId,otherToken);
    const context=await browser.newContext({viewport:{width,height:860},deviceScaleFactor:1,hasTouch:true,serviceWorkers:'block'});
    await context.route('**/*',route=>{
     const url=route.request().url();
     if(url.startsWith(origin+'/'))return route.continue();
     events.external.push({engine,width,urlHost:new URL(url).host,blocked:true});
     return route.abort();
    });
    const page=await context.newPage();
    const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
    const fakeAuth=`window.__fixture146={valid:true};localStorage.setItem('closet-current-auth-v1',
     JSON.stringify({access_token:'${token}',refresh_token:'p180-refresh-${ownerId}',
     expires_at:Math.floor(Date.now()/1000)+3600}));window.closetAuth={
     user:{id:'${ownerId}'},ready:Promise.resolve(),
     assertCurrent(){if(!window.__fixture146.valid)throw Error('owner changed');},
     async getAccessToken(){if(!window.__fixture146.valid)throw Error('owner changed');return '${token}';}
    };document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;`;
    await page.route('**/auth.js',route=>route.fulfill({contentType:'text/javascript',body:fakeAuth}));
    await page.goto(origin+'/'+flag,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.ownerReviewedCloud146?.state()?.mounted===true,null,{timeout:30000});
    assert.equal(await page.evaluate(()=>window.ownerReviewedCloud146.state().legacyPaused),true);
    assert.equal(await page.evaluate(()=>window.ownerReviewedCloud146.state().nativeOriginalAndCutout178),enable178);
    if(enable178){
     const activated=await page.evaluate(()=>window.ownerReviewedCloud146.state().nativeSourceTransport178);
     assert.equal(activated.actualNativeEngineGuard,true);
     assert.equal(activated.realSignedJwtVerified,false);
     assert.equal(activated.shippingReleaseAuthorized,false);
     assert.equal(activated.localVerified,0);
     assert.equal(activated.remoteVerified,0);
    }
    await page.evaluate(({item,ownerId})=>new Promise((ok,bad)=>{
      const tx=db.transaction(['items','state'],'readwrite');
      tx.objectStore('items').put(item);
      tx.objectStore('state').put({id:'outfit-board',current:{slots:{top:item.id}},
       saved:[{id:'p146-saved-look',outfit3dId:'p180-photo-shirt-3d',ownerId,slots:{top:item.id}}]});
      tx.oncomplete=ok;tx.onerror=()=>bad(tx.error);tx.onabort=()=>bad(tx.error);
    }),{item:item(ownerId),ownerId});
    // Actual native P550 controller reads its wardrobe snapshot at mount,
    // so reload the REAL app after the initial private wardrobe is saved.
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.ownerReviewedCloud146?.state()?.mounted&&
      window.nativeLossless04Bridge?.status()?.active&&window.native3D05Bridge&&
      window.cloudToNative3D180Bridge?.state()?.active,null,{timeout:30000});
    assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().savedCount),1);
    assert.equal(await page.evaluate(()=>window.ownerReviewedCloud146.state().nativeCloud3DRefresh180),true);
    await openMenu(page);
    const privateJPEGReadsBeforePreview=events.storageReads;
    await page.locator('#owner146Preview').click();
    await waitStatus(page,'Private count-only preview checked.');
    assert.match(await page.locator('#owner146Counts').innerText(),/Device: 1 clothes, 1 outfits. Cloud: 0 clothes, 0 outfits/);
    assert.equal(events.storageReads,privateJPEGReadsBeforePreview,'preview must not fetch original or cutout photos');
    await screenshot(page,engine,width,'01-native-count-preview');

    await page.locator('#owner146Backup').click();
    await waitStatus(page,'Reviewed cloud backup saved');
    assert.equal(docs.get(ownerId)?.revision,1);
    assert.equal(docs.get(ownerId).document.items.length,1);
    assert.equal(JSON.stringify(docs.get(ownerId).document).includes('data:image/jpeg'),false);
    assert.deepEqual([...objects.keys()].filter(k=>k.startsWith(ownerId+'/')).map(k=>k.split('/')[1]).sort(),[originalSHA+'.jpg',cutoutSHA+'.jpg'].sort());
    assert.equal(sha(objects.get(ownerId+'/'+originalSHA+'.jpg')),originalSHA);
    assert.equal(sha(objects.get(ownerId+'/'+cutoutSHA+'.jpg')),cutoutSHA);
    if(enable178){
     const state178=await page.evaluate(()=>window.ownerReviewedCloud146.state().nativeSourceTransport178);
     assert.equal(state178.localVerified,1);
     assert.equal(state178.remoteVerified,1);
     assert.equal(state178.actualNativeEngineGuard,true);
    }
    await screenshot(page,engine,width,'02-native-double-jpeg-backup');

    await updateColor(page,'p146-reviewed-shirt','Red');
    await page.locator('#owner146Restore').click();
    await page.locator('#ownerReview146Modal').waitFor({state:'visible',timeout:30000});
    assert.match(await page.locator('#owner146Warning').innerText(),/Local-only clothes/);
    const prompt=await page.locator('#ownerReview146Modal').innerText();
    for(const privateValue of ['p146-reviewed-shirt','p146-saved-look','Green','Red','closet-photo:','data:image/jpeg'])
     assert.equal(prompt.includes(privateValue),false,'no private garment data in native modal');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await screenshot(page,engine,width,'03-native-restore-consent');
    await page.locator('#owner146Cancel').click();
    await waitStatus(page,'Cancelled.');
    assert.equal((await readRecord(page,'items','p146-reviewed-shirt')).color,'Red');
    assert.equal((await readRecord(page,'state','outfit-board')).saved[0].id,'p146-saved-look');

    await page.locator('#owner146Restore').click();
    await page.locator('#ownerReview146Modal').waitFor({state:'visible',timeout:30000});
    await page.locator('#owner146Approve').click();
    await waitStatus(page,'Verified cloud wardrobe');
    const restored=await readRecord(page,'items','p146-reviewed-shirt');
    assert.equal(restored.color,'Green');
    assert.equal(restored.sourceSHA256,originalSHA);
    assert.equal(restored.cutoutSHA256,cutoutSHA);
    assert.equal((await readRecord(page,'state','outfit-board')).saved[0].id,'p146-saved-look');
    if(enable178){
     const guard=await page.evaluate(()=>window.ownerReviewedCloud146.state().nativeSourceTransport178);
     assert.equal(guard.localVerified,1);
     assert.equal(guard.remoteVerified,3,
      'P178 must attest private photo+cutout after backup and before BOTH restore attempts');
    }
    await screenshot(page,engine,width,'04-native-atomic-restored');
    const refreshed180=await page.evaluate(()=>window.cloudToNative3D180Bridge.state());
    assert.equal(refreshed180.nativeOwnerBoardReloaded,1);
    assert.equal(refreshed180.restores,1);
    assert.ok(refreshed180.originalJPEGsAttested>=1,
     'Actual restored source JPEG must be rehashed before native 3D opens');
    assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().savedCount),1);
    if(engine==='chromium'){
      const browserSource=await page.evaluate(async()=>{
       const response=await fetch('/benchmark/work47/manifest.json',{cache:'no-store'});
       if(!response.ok)return {status:response.status};
       const manifest=await response.json();
       const row=manifest?.rows?.find(x=>x.id==='commons-0053');
       return {status:response.status,hasCutout:row?.hasCutout,
        ownerApproved:row?.ownerApproved,sourceSHA:row?.sourceSHA256,
        cutoutSHA:row?.cutoutSHA256,license:!!row?.attribution?.license};
      });
      assert.equal(browserSource.status,200);
      assert.equal(browserSource.hasCutout,true,
       'P180 browser received wrong original photo donor manifest');
      assert.equal(browserSource.ownerApproved,false);
      assert.equal(browserSource.license,true);
      assert.equal(browserSource.cutoutSHA,sourceDress.cutoutSHA256,
       'P180 browser asset manifest differs from exact P541 donor');
      // An OPEN account menu covers the mobile builder touch target.
      // Close its actual <details> summary as a real user does BEFORE
      // selecting the recovered outfit and clicking 3D Preview.
      const menu=page.locator('header .account-menu');
      if(await menu.evaluate(x=>x.open))await menu.locator('summary').click();
      // Select the ACTUAL recovered owner-saved outfit, not donor-created
      // clothes. Real 163-bone source photo fitting and WebGL only.
      await page.evaluate(()=>switchView('builder'));
      await page.locator('#savedBoards button').first().click();
      await page.locator('#native3D05Preview').click();
      try{
       await page.waitForFunction(()=>window.native3D05Bridge?.state().modelReady&&
        window.native3D05Bridge.state().bones===163&&
        window.native3D05Bridge.state().meshCount>=1,null,{timeout:35000});
      }catch(error){
       const detail=await page.evaluate(()=>({
        nativeStatus:document.getElementById('native3D05Status')?.textContent,
        donorRendererStatus:document.getElementById('outfit3D01Status')?.textContent,
        donorFallbackNote:document.getElementById('outfit3D01Note')?.textContent,
        actualCanvasPresent:!!document.getElementById('outfit3D01Canvas'),
        donorImportMapPresent:!!document.querySelector('script[data-outfit3d-importmap]'),
        photoCardCount:document.querySelectorAll('#outfit3D01Photos img').length,
        outfitStatus:document.getElementById('boardSaveStatus')?.textContent,
        selected:window.nativeLossless04Bridge?.status()?.selected,
        boardActive:window.nativeLossless04Bridge?.status()?.active,
        viewer:window.native3D05Bridge?.state?.(),
        dialog:document.getElementById('outfit3D01Dialog')?.open,
        sources:(()=>{try{
         return window.nativeLossless04Bridge?.readOnlyGarmentSources91(['p146-reviewed-shirt']);
        }catch(e){return String(e.message)}})()
       }));
       await screenshot(page,engine,width,'05-3d-source-admission-diagnostic');
       throw Error('P180 genuine WebGL not ready; SOURCE-REDACTED diagnostics '+JSON.stringify(detail));
      }
      assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().opened),'p180-photo-shirt-3d');
      assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().viewerMode),'shirt');
      await page.locator('#outfit3D01Front').click();
      await screenshot(page,engine,width,'06-original-photo-163bone-front-after-cloud');
      await page.locator('#outfit3D01Side').click();
      await screenshot(page,engine,width,'07-original-photo-163bone-side-after-cloud');
      await page.locator('#outfit3D01Back').click();
      await screenshot(page,engine,width,'08-original-photo-163bone-rear-inferred');
      // A live 3D scene must block cloud restore BEFORE modal or IDB mutation.
      const writesBeforeBlocked=events.writes;
      // The native P541 viewer is correctly a modal; a human cannot
      // click the account menu through it. Simulate a malicious background
      // script invoking the EXISTING account Restore handler anyway. The
      // P180 owner/3D lease must reject it before consent or IDB write.
      await page.evaluate(()=>document.getElementById('owner146Restore').click());
      await waitStatus(page,'Operation stopped safely');
      assert.equal(await page.locator('#ownerReview146Modal').evaluate(x=>x.open),false);
      assert.equal(events.writes,writesBeforeBlocked);
      assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().modelReady),true);
      await screenshot(page,engine,width,'09-active-3d-cloud-replacement-refused');
      await page.evaluate(()=>window.native3D05Bridge.close());
      assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true);
    }
    await updateColor(page,'p146-reviewed-shirt','Blue');
    await openMenu(page);
    await page.locator('#owner146Backup').click();
    await page.locator('#ownerReview146Modal').waitFor({state:'visible',timeout:30000});
    docs.get(ownerId).revision++;
    const writesBefore=events.writes;
    await page.locator('#owner146Approve').click();
    await waitStatus(page,'cloud backup changed');
    assert.equal(events.writes,writesBefore,'stale confirmation must refuse commit');
    assert.equal((await readRecord(page,'items','p146-reviewed-shirt')).color,'Blue');
    await screenshot(page,engine,width,'05-native-remote-conflict');

    const denied=await context.request.get(origin+
      '/storage/v1/object/closet-private/'+ownerId+'/'+originalSHA+'.jpg',
      {headers:{Authorization:'Bearer '+otherToken,apikey:'p146-synthetic-local-only'}});
    assert.equal(denied.status(),403);

    if(width===320){
     await page.locator('#owner146Backup').click();
     await page.locator('#ownerReview146Modal').waitFor({state:'visible',timeout:30000});
     await page.evaluate(()=>{window.__fixture146.valid=false;window.dispatchEvent(new Event('closet:session-locked'));});
     assert.equal(await page.locator('#ownerReview146Modal').count(),0,'session logout revokes approval dialog');
     assert.equal(await page.locator('#ownerReview146Panel').count(),0);
    }
    assert.deepEqual(pageErrors,[],engine+' '+width+' page errors');
    const entry={engine,width,nativeAccountMenu:true,sourceSHA:originalSHA,cutoutSHA,
     createOnlyBackup:true,previewWithoutJPEGFetch:true,cancelPreservesLocal:true,
     actualAtomicRestore:true,remoteConflictRejected:true,syntheticOtherOwnerDenied:true,
     signedJWTVerified:false,physicalPhoneVerified:false,familyAlpha:'HOLD',
     p178NativeOriginalAndReviewedCutoutGuard:enable178,
     p178OwnerSHAAndAtomicCloudVerified:enable178};
    results.push(entry);await context.close();
   }
  }finally{await browser.close();}
 }
 assert.equal(results.length,6);
 // Non-loopback app asset/trend attempts are blocked by the router above.
 assert.ok(events.external.every(x=>x.blocked===true),'no external request may escape the browser test');
 assert.equal(events.errors.length,0,'research fake server errors');
 const out={priority:180,finalSource:'actual public/index.html with P146 native bridge',
  actualRestoredCloudOriginal163BoneWebGL:true,
  chromium3DWidths:[320,390,430],recoveredOriginalJPEG:'commons-0003',
  sourcePinnedDonorSHA:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
  p178NativeOriginalAndReviewedCutoutGuard:enable178,
  genuineOwnerOriginalJpegAndCutoutPrivateBacked:true,
  liveSignedJWTVerified:false,physicalPhoneVerified:false,syntheticLocalServerOnly:true,
  realCloudTouched:false,familyAlpha:'HOLD',cases:results,server:{
   reads:events.reads,writes:events.writes,uploads:events.uploads,storageReads:events.storageReads,
   foreignDenied:events.foreignDenied,blockedExternalAttempts:events.external.length,blockedExternalHosts:[...new Set(events.external.map(x=>x.urlHost))]},screenshots:events.screenshots};
 await writeFile(resolve(dir,'results.json'),JSON.stringify(out,null,2));
 console.log('P180_ACTUAL_ATOMIC_CLOUD_TO_NATIVE_PHOTO_163BONE_3D_BROWSER',JSON.stringify({passed:results.length,server:out.server,screenshots:events.screenshots.length,realHostedJWT:false,familyAlpha:'HOLD'}));
}finally{
 await new Promise(resolve=>server.close(resolve));
}
