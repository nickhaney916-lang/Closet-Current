/**
 * BOARD-PRESERVE-01 — real PR547 public app+native cleanOutfitBoard,
 * exact read-only PR541 donor existing-IDB bridge.
 *
 * Chromium/WebKit × 320/390/430. Uses explicit synthetic account fixtures.
 * Demonstrates original wardrobe IDB remains untouched, that the native
 * cleaner genuinely loses dress/jacket/coats/deleted/3D IDs, and that our
 * read-only compatibility lens refuses an unapproved destructive conversion.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
const root=resolve('.'),donor=resolve('.board01-outfit-541'),dir='benchmark/board-preserve-01';
await mkdir(dir,{recursive:true});
const cases=[],screens=[],errors=[],external=[];
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml',
 '.jpg':'image/jpeg','.png':'image/png','.woff':'font/woff','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(?:public\/|research\/|donor\/|node_modules\/)/.test(url)||
   url.includes('\\')||url.includes('\0')||url.split('/').includes('..'))
   throw Error('path denied');
  const path=url.startsWith('/donor/')?
   resolve(donor,'.'+url.slice(6)):resolve(root,'.'+url);
  if(!path.startsWith(root+'/'))throw Error('not local');
  const bytes=await readFile(path);
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('research unavailable');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const host='http://127.0.0.1:'+server.address().port;
const authScript=owner=>`
window.__boardFixtureEpoch=3;
window.closetAuth={ready:Promise.resolve(),user:{id:${JSON.stringify(owner)}},
 getSessionGeneration:()=>window.__boardFixtureEpoch,
 getAccessToken:async()=>{throw Error('BOARD01 synthetic accounts: no real backend')}};
document.getElementById('authGate').hidden=true;
document.getElementById('appShell').hidden=false;
`;
const fakeCloud="window.closetCloud={start:async()=>{},beforeWrite:async()=>{},changed:()=>{},sync:async()=>{}};";
const fixture=owner=>({
 items:[
  {id:owner+'-dress',ownerId:owner,category:'Dresses',itemType:'Casual dress',name:'Test dress',color:'Black'},
  {id:owner+'-jacket',ownerId:owner,category:'Outerwear',itemType:'Jacket',name:'Test jacket',color:'Tan'},
  {id:owner+'-coat',ownerId:owner,category:'Outerwear',itemType:'Coat',name:'Test coat',color:'Navy'},
  {id:owner+'-top',ownerId:owner,category:'Tops',itemType:'T-shirt',name:'Test top',color:'Blue'},
  {id:owner+'-jeans',ownerId:owner,category:'Bottoms',itemType:'Jeans',name:'Test jeans',color:'Blue'},
  {id:owner+'-shoes',ownerId:owner,category:'Shoes',itemType:'Sneakers',name:'Test sneakers',color:'White'}
 ],
 state:{id:'outfit-board',
  current:{name:'Dress with genuine owner jacket',outfit3dId:'outfit3d-'+owner,
   slots:{top:owner+'-dress',layer2:owner+'-jacket',
    layer3:owner+'-coat',shoes:owner+'-shoes'},
   season:'Fall',audience:'Women',occasion:'Dinner',layerCount:3},
  saved:[{name:'Missing jeans must remain visible',
   outfit3dId:'outfit3d-missing-'+owner,
   slots:{top:owner+'-top',bottom:owner+'-deleted-jeans',shoes:owner+'-shoes'},
   season:'Fall',audience:'All'}]}
});
let browser;
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  browser=await type.launch({headless:true,args:engine==='chromium'?
   ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  for(const width of [320,390,430]){
   // Both different owner IDs are created inside SAME browser context so the
   // test cannot pass by falsely assuming separate-origin isolation.
   const context=await browser.newContext({viewport:{width,height:840},
    deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
   try{
    for(const suffix of ['A','B']){
     const owner='board-fixture-'+suffix,page=await context.newPage();
     page.on('pageerror',e=>errors.push(engine+'/'+width+'/'+suffix+':'+e.message));
     await page.route('**/*',route=>{
      const u=route.request().url(),path=new URL(u).pathname;
      if(path==='/public/auth.js')
       return route.fulfill({contentType:'text/javascript',body:authScript(owner)});
      if(path==='/public/cloud-backup.js')
       return route.fulfill({contentType:'text/javascript',body:fakeCloud});
      if(path==='/public/cloud-backup-bridge.js')
       return route.fulfill({contentType:'text/javascript',body:''});
      if(u.startsWith(host+'/')||u.startsWith('blob:'+host)||u.startsWith('data:'))
       return route.continue();
      external.push({engine,width,method:route.request().method(),url:u.split('?')[0]});
      return route.abort();
     });
     await page.goto(host+'/public/index.html?boardPreserve01=after',
      {waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>typeof db!=='undefined'&&
      db?.name==='closet-current-user-'+window.closetAuth.user.id&&
      typeof cleanOutfitBoard==='function',null,{timeout:45000});
     const seeded=await page.evaluate(async data=>{
      const owner=window.closetAuth.user.id;
      if(data.items.some(x=>x.ownerId!==owner))throw Error('wrong account fixture');
      await new Promise((resolve,reject)=>{
       const tx=db.transaction(['items','state'],'readwrite');
       for(const item of data.items)tx.objectStore('items').put(item);
       tx.objectStore('state').put(data.state);
       tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
      });
      return db.name;
     },fixture(owner));
     assert.equal(seeded,'closet-current-user-'+owner);
     const evidence=await page.evaluate(async owner=>{
      const donor=await import('/donor/research/outfit-3d-01/saved-outfit-idb.mjs');
      const mod=await import('/research/board-preserve-01/native-outfit-loss-audit.mjs');
      const lease={authenticated:true,ownerId:owner,generation:window.__boardFixtureEpoch};
      const source=donor.createExistingClosetOutfitIO(window.closetAuth);
      const state=await source.loadOutfitState(lease);
      const owned=await source.readSavedItems(lease);
      const original=JSON.stringify(state);
      const lens=mod.createBoardPreserveReview01({auth:window.closetAuth,
       readState:source.loadOutfitState,readItems:source.readSavedItems,
       nativeNormalize:(b,c)=>cleanOutfitBoard(b,c)});
      const report=await lens.refresh();
      let refused=false;try{lens.assertSafeToConvert();}catch{refused=true;}
      const after=await source.loadOutfitState(lease);
      const stillUnchanged=JSON.stringify(after)===original;
      const native=cleanOutfitBoard(state.current,owned);
      const missingNativeJacket=!native.slots.layer2&&!native.slots.layer3;
      const otherLease={authenticated:true,ownerId:owner==='board-fixture-A'?
       'board-fixture-B':'board-fixture-A',generation:window.__boardFixtureEpoch};
      let foreignDenied=false;
      try{await source.loadOutfitState(otherLease);}catch{foreignDenied=true;}
      // Native cleanup remains unchanged: the audit never monkey-patches it.
      lens.invalidate();
      return {sourceOwned:state.current.slots.top===owner+'-dress',
       donorOriginalPreserved:stillUnchanged,fixtureOwner:owner,
       nativeDropsJacketAndCoat:missingNativeJacket,
       nativePreservedPhotographIDs:!Object.hasOwn(native,'outfit3dId'),
       missingReferencePresent:state.saved[0].slots.bottom===owner+'-deleted-jeans',
       lossCount:report.issues.length,erasedDressLayers:report.erasedDressLayers,
       missingReferences:report.missingReferences,erased3DIDs:report.erased3DIDs,
       reportVerdict:report.verdict,refused,foreignDenied,
       writePermissionGranted:false,photosSentOffhost:false,
       realRLSVerified:false,productionChanged:false,familyAlpha:'HOLD'};
     },owner);
     assert.equal(evidence.sourceOwned,true);
     assert.equal(evidence.donorOriginalPreserved,true);
     assert.equal(evidence.nativeDropsJacketAndCoat,true);
     assert.equal(evidence.nativePreservedPhotographIDs,true);
     assert.equal(evidence.missingReferencePresent,true);
     assert.ok(evidence.erasedDressLayers>=2);
     assert.ok(evidence.erased3DIDs>=2);
     assert.ok(evidence.missingReferences>=1);
     assert.equal(evidence.reportVerdict,'REVIEW_DO_NOT_OVERWRITE');
     assert.equal(evidence.refused,true);
     assert.equal(evidence.foreignDenied,true);
     // Explicitly research-labeled evidence on the genuine native app page;
     // do not claim that this temporary text is a production UI feature.
     await page.evaluate(status=>{
      const n=document.createElement('section');n.id='board01Evidence';
      n.setAttribute('aria-label','RESEARCH ONLY: original saved outfit safety comparison');
      n.style.cssText='padding:16px;border:2px dashed #777;margin:16px;background:#fff';
      n.textContent='RESEARCH ONLY · '+status.fixtureOwner+
       ' · Native loses '+status.erasedDressLayers+
       ' dress outer references and '+status.erased3DIDs+
       ' durable 3D IDs. Original private board UNCHANGED. Unsafe save BLOCKED.';
      document.getElementById('appShell').prepend(n);
     },evidence);
     const name=engine+'-'+width+'-'+suffix+'-native-real-app-loss-proof.png';
     const bytes=await page.screenshot({fullPage:true});
     await writeFile(dir+'/'+name,bytes);
     screens.push({engine,width,owner,name,
      sha256:createHash('sha256').update(bytes).digest('hex')});
     cases.push({engine,width,owner,...evidence,photoIntegrity:true,
      nativeSourceFileUnmodified:true,realDonorExistingIDB:true,
      physicalPhoneTested:false,releaseAuthorized:false});
     await page.close();
    }
   }finally{await context.close();}
  }
  await browser.close();browser=null;
 }
 assert.equal(cases.length,12);
 assert.equal(screens.length,12);
 assert.deepEqual(errors,[]);
 assert.deepEqual(external.filter(x=>x.method!=='GET'),[]);
 const result={priority:'BOARD-PRESERVE-01',cases:cases.length,
  engines:['chromium','webkit'],widths:[320,390,430],
  nativeSourceCodeOriginal:true,originalDonorPR541IDBRead:true,
  independentOwnersInSameOrigin:true,destructiveLegacyConversionBlocked:true,
  originalStateAndOutfitReferencesPreserved:true,
  browserScreenshots:12,realSupabaseRLSVerified:false,
  physicalAndroidIphoneTested:false,productionModified:false,
  sourceOriginalPhotosRewritten:false,releaseAuthorized:false,
  familyAlpha:'HOLD',errors,external,cases,screens};
 await writeFile(dir+'/results.json',JSON.stringify(result,null,2));
 console.log('BOARD01_GENUINE_NATIVE_NORMALIZER_BROWSERS',JSON.stringify({
  cases:cases.length,screens:12,originalPreserved:true,
  unsafeNativeSaveBlocked:true,realSupabaseRLSVerified:false,release:'HOLD'}));
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
