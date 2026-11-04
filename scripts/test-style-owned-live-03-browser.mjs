/** STYLE-OWNED-LIVE-03 — actual native app, real original JPEG input, real
 * account-specific IndexedDB, genuine first-party Style tab/UI, native CAS,
 * v4 atomic backup/restore, Chromium+WebKit 320/390/430, no cloud writes.
 * Auth HTTP alone is synthetic; never claim signed JWT/RLS or phone hardware.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),donor=resolve('.native05-donor-541'),
 dir='benchmark/style-owned-live-03';await mkdir(dir,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const locks=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const fixtureIds=['commons-0053','commons-0064','commons-0067','commons-0080',
 'commons-0081','commons-0003','commons-0002','commons-0021','commons-0023'];
const photos={};
for(const id of fixtureIds){
 const locked=locks.find(x=>x.id===id);
 const b=readFileSync('benchmark/fixtures/'+id+'.jpg');
 assert.ok(locked?.verified&&locked.sha256===sha(b)&&
  locked.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'),
 'independently licensed original fixture '+id);
 photos[id]={image:'data:image/jpeg;base64,'+b.toString('base64'),
  sha256:locked.sha256,bytes:b.length};
}
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.css':'text/css','.json':'application/json','.jpg':'image/jpeg',
 '.png':'image/png','.glb':'model/gltf-binary','.svg':'image/svg+xml',
 '.woff2':'font/woff2','.bin':'application/octet-stream'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path.includes('\\')||path.includes('\0')||path.split('/').includes('..')||
   !/^\/(public\/|research\/|donor\/|benchmark\/|node_modules\/)/.test(path))
   throw Error('unapproved research path');
  const fromDonor=path.startsWith('/donor/')||path.startsWith('/benchmark/');
  const base=fromDonor?donor:root,sub=path.startsWith('/donor/')?path.slice(6):path;
  const target=resolve(base,'.'+sub);
  if(!target.startsWith(base+'/'))throw Error('outside repository');
  const data=await readFile(target);
  res.writeHead(200,{'content-type':mime[extname(target)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const authOrigin='https://hlkgymugtfbirlpunsra.supabase.co';
const flags='nativeLossless04=research&native3D05=research&restoreAtomic01=research&nativeIndex07=research&index02=after&captureProof01=after&index04=after&sourceReadiness08=research&nativeMobile09=research&styleOwned03=research';
const ownerA='native05-A',ownerB='native05-B';
const results={priority:'STYLE-OWNED-LIVE-03',
 base:'d913e4f0b65c6b92cfbd1de4083e84692740707e',
 existingGeneratorAdaptedFromPR547:true,existingNativeBoard04Writer:true,
 existingOriginalPhotoIndex07:true,existingV4AtomicRestore:true,
 ownerPrivateIndexedDB:true,originalJPEGReencoded:false,
 realSignedServerRLS:false,realPhysicalAndroidOrIphone:false,
 arbitraryFitted3D:false,familyAlpha:'HOLD',releaseAuthorized:false,
 cases:[],screenshots:[],errors:[],crashes:[],external:[],consoleErrors:[]};
let browser=null,tokens=0;
const cloudStub="window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};";
function fixture(owner){
 const item=(id,cat,type,pic,color)=>({
  id:owner+'-'+id,ownerId:owner,name:'Owned '+id,
  category:cat,itemType:type,color,colorSource:'user',
  userAdjusted:true,requiresOwnershipConfirmation:false,
  possibleDuplicate:false,sourceSHA256:photos[pic].sha256,
  sourceHashVerified:true,singleGarmentVerified:true,
  originalPhoto:{image:photos[pic].image,sha256:photos[pic].sha256},
  image:photos[pic].image,seasons:[],notes:'',brand:'',size:'',material:'',occasion:'Casual'
 });
 return {
  items:[
   item('donor-shirt','Tops','T-shirt','commons-0003','Black'),
   item('dress','Dresses','Casual dress','commons-0053','Black'),
   item('pants-blue','Bottoms','Jeans','commons-0021','Blue'),
   item('pants-dark','Bottoms','Jeans','commons-0023','Blue'),
   item('sneakers-white','Shoes','Sneakers','commons-0080','White'),
   item('sneakers-black','Shoes','Sneakers','commons-0081','Black'),
   item('jacket','Outerwear','Jacket','commons-0064','Gray'),
   item('coat','Outerwear','Coat','commons-0067','Brown')
  ],
  state:{id:'outfit-board',
   current:{name:'Original current outfit',slots:{},future:{neverDiscard:'current'}},
   saved:[
    {id:owner+'-dress-saved',outfit3dId:owner+'-original-3d-identity',
     ownerId:owner,name:'Preserved dress and outerwear',
     layerCount:3,slots:{top:owner+'-dress',shoes:owner+'-sneakers-white',
      layer2:owner+'-jacket',layer3:owner+'-coat'},
     extraMetadata:{keep:'original'},future:{newProperty:'keep'}},
    {id:owner+'-missing-saved',outfit3dId:owner+'-missing-3d-identity',
     ownerId:owner,name:'Existing missing original jeans',
     slots:{top:owner+'-donor-shirt',bottom:owner+'-missing-jeans',
      shoes:owner+'-sneakers-black'},future:{retainMissing:true}}
   ],
   futureState:{retainAllExistingOutfits:true}}
 };
}
const readItems=p=>p.evaluate(()=>new Promise((ok,bad)=>{
 const q=db.transaction('items','readonly').objectStore('items').getAll();
 q.onsuccess=()=>ok(q.result);q.onerror=()=>bad(q.error);
}));
const readBoard=p=>p.evaluate(()=>new Promise((ok,bad)=>{
 const q=db.transaction('state','readonly').objectStore('state').get('outfit-board');
 q.onsuccess=()=>ok(q.result);q.onerror=()=>bad(q.error);
}));
async function login(page,owner){
 await page.locator('#authEmail').fill(owner+'@example.test');
 await page.locator('#authPassword').fill('research-fixture-only');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(id=>window.closetAuth?.user?.id===id&&
  document.getElementById('appShell')?.hidden===false,owner,{timeout:30000});
 await page.waitForFunction(id=>db?.name==='closet-current-user-'+id,owner);
}
async function seed(page,owner){
 await page.evaluate(data=>new Promise((ok,bad)=>{
  const tx=db.transaction(['state','items'],'readwrite');
  for(const i of data.items)tx.objectStore('items').put(i);
  tx.objectStore('state').put(data.state);
  tx.oncomplete=ok;tx.onerror=()=>bad(tx.error);tx.onabort=()=>bad(tx.error);
 }),fixture(owner));
}
function authResponse(route){
 const request=route.request(),u=new URL(request.url());
 if(u.pathname==='/auth/v1/logout')return route.fulfill({status:204,body:''});
 if(u.pathname==='/auth/v1/token'){
  const d=JSON.parse(request.postData()||'{}'),grant=u.searchParams.get('grant_type');
  let owner;
  if(grant==='password'&&/^native05-[AB]@example\.test$/.test(d.email||''))owner=d.email.split('@')[0];
  else if(grant==='refresh_token'&&/^refresh-native05-[AB]$/.test(d.refresh_token||''))
   owner=d.refresh_token.slice(8);
  else return route.fulfill({status:401,contentType:'application/json',
   body:JSON.stringify({error_code:'invalid_credentials',msg:'Research owners only'})});
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   user:{id:owner,email:owner+'@example.test'},
   access_token:'style03-research-'+owner+'-'+(++tokens),
   refresh_token:'refresh-'+owner,expires_in:3600
  })});
 }
 results.external.push({type:'unexpected-auth',method:request.method()});
 return route.abort();
}
async function capture(page,width,engine,stage){
 await page.locator('#styleOwned03').scrollIntoViewIfNeeded();
 const bytes=await page.screenshot({animations:'disabled',fullPage:false});
 const info=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
 assert.equal(info.width,width);assert.equal(info.height,900);
 assert.ok(bytes.length>6000&&stats.channels.some(c=>c.stdev>8),
  'real mobile screenshot cannot be blank');
 const name=engine+'-'+width+'-'+stage+'.png';
 await writeFile(dir+'/'+name,bytes);
 results.screenshots.push({engine,width,stage,name,sha256:sha(bytes),bytes:bytes.length});
}
async function prepare(page,owner){
 await login(page,owner);await seed(page,owner);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.nativeLossless04Bridge?.status()?.active&&
  window.styleOwnedLive03Bridge?.status()?.active&&
  window.restoreAtomic01Bridge?.status()?.active&&
  window.closetIndex02?.state()?.ready===true,
  null,{timeout:40000});
}
async function importAndConfirmNewRed(page,owner){
 const b=readFileSync('benchmark/fixtures/commons-0002.jpg');
 await page.locator('#clothingPhotos').setInputFiles({
  name:'owned-original-red-tshirt.jpg',mimeType:'image/jpeg',buffer:b});
 await page.waitForFunction(expected=>batch.some(row=>
  row.originalPhoto?.sha256===expected),photos['commons-0002'].sha256,{timeout:30000});
 const id=await page.evaluate(expected=>batch.find(row=>
  row.originalPhoto?.sha256===expected)?.id,photos['commons-0002'].sha256);
 assert.ok(id);
 await page.locator('#reviewGrid button').filter({hasText:'Adjust'}).first().click();
 const editor=page.locator('dialog.photo-adjust');
 await editor.locator('input[aria-label="Item name"]').fill('My new photographed red shirt');
 await editor.locator('select[aria-label="Main category"]').selectOption('Tops');
 await editor.locator('select[aria-label="Item type"]').selectOption('T-shirt');
 await editor.locator('input[aria-label="Color"]').fill('Red');
 await editor.locator('button.primary').filter({hasText:'Save changes'}).click();
 await page.waitForFunction(id=>items.some(row=>row.id===id)&&
  !batch.some(row=>row.id===id),id,{timeout:30000});
 const ownerStored=(await readItems(page)).find(x=>x.id===id);
 assert.equal(ownerStored.ownerId,owner);
 assert.equal(ownerStored.originalPhoto.image,photos['commons-0002'].image);
 assert.equal(ownerStored.originalPhoto.sha256,photos['commons-0002'].sha256);
 assert.equal(ownerStored.sourceSHA256,photos['commons-0002'].sha256);
 assert.equal(ownerStored.category,'Tops');
 assert.equal(ownerStored.itemType,'T-shirt');
 assert.equal(ownerStored.color,'Red');
 const diagnostics=await page.evaluate(async(id)=>{
   const board=window.nativeLossless04Bridge,style=window.styleOwnedLive03Bridge;
   let result=null;
   try{const m=await import('/research/style-owned-live-03/native-style-panel.mjs');
    const test=await m.verifiedPrivateStyleRoster03(board);
    result={verified:test.items.map(x=>x.id),rejected:test.rejected,
     ownerId:test.ownerId,generation:test.generation};}
   catch(error){result={error:String(error?.message||error)};}
   const saved=items.find(x=>x.id===id);
   return {requestedId:id,style:style?.status(),board:board?.status(),
    options:[...document.querySelectorAll('#styleOwned03Item option')].map(x=>x.value),
    panelStatus:document.getElementById('styleOwned03Status')?.textContent,
    boardSaveStatus:document.getElementById('boardSaveStatus')?.textContent,
    saved:{ownerId:saved?.ownerId,id:saved?.id,sha:saved?.sourceSHA256,
      originalSHA:saved?.originalPhoto?.sha256,sourceHash:saved?.sourceHash,
      userAdjusted:saved?.userAdjusted,category:saved?.category,itemType:saved?.itemType},
    directProof:result};
  },id);
  console.log('STYLE03_AFTER_SAVE_DIAGNOSTIC '+JSON.stringify(diagnostics).slice(0,5000));
 await page.waitForFunction(id=>[...document.querySelectorAll('#styleOwned03Item option')]
  .some(x=>x.value===id),id,{timeout:10000});
 return id;
}
async function createAndVerifyLooks(page,id,owner,width,engine,rich){
 await page.evaluate(()=>switchView('stylist'));
 await page.locator('#styleOwned03Item').selectOption(id);
 const pinned=page.locator('#styleOwned03Pinned img');
 await pinned.evaluate(image=>image.decode());
 assert.equal(await pinned.getAttribute('src'),photos['commons-0002'].image);
 await capture(page,width,engine,'01-original-pinned');
 await page.locator('#styleOwned03Generate').click();
 await page.waitForFunction(()=>window.styleOwnedLive03Bridge?.status()?.lookCount===3,
  null,{timeout:25000});
 assert.equal(await page.locator('#styleOwned03Suggestions .look').count(),3);
 const combos=await page.evaluate(async()=>{
  const m=await import('/research/style-owned-live-03/three-owned-looks-native.mjs');
  const ctrl=window.styleOwnedLive03Bridge;
  return {state:ctrl.status(),results:m.suggestThreeNativeOwned03(
    (await import('/research/style-owned-live-03/native-style-panel.mjs')).verifiedPrivateStyleRoster03?
    // Access only the authenticated existing controller's private saved items.
    (await (await import('/research/style-owned-live-03/native-style-panel.mjs'))
     .verifiedPrivateStyleRoster03(window.nativeLossless04Bridge)).items:[],
    {ownerId:window.closetAuth.user.id,pinnedId:ctrl.status().pinnedId})};
 });
 assert.equal(combos.state.pinnedId,id);
 assert.equal(combos.results.combinations.length,3);
 assert.equal(new Set(combos.results.combinations.map(c=>c.signature)).size,3);
 const ownedIds=new Set((await readItems(page)).map(x=>x.id));
 assert.ok(combos.results.combinations.every(c=>c.slots.top===id&&
  c.slots.bottom&&c.slots.shoes&&Object.values(c.slots).every(x=>ownedIds.has(x))));
 await capture(page,width,engine,'02-three-real-suggestions');
 await page.locator('#styleOwned03Choose1').click();
 const first=await page.evaluate(()=>window.nativeLossless04Bridge.view());
 assert.equal(first.slots.top,id);
 assert.equal((await page.evaluate(()=>window.styleOwnedLive03Bridge.status())).dirty,true);
 assert.equal(await page.locator('#styleOwned03Workspace .piece img').count(),
  Object.keys(first.slots).length);
 await capture(page,width,engine,'03-preview-original-owned');
 const lower=page.locator('#styleOwned03Swap-bottom');
 const alternatives=await lower.locator('option').evaluateAll(opts=>opts.map(x=>x.value));
 const replace=alternatives.find(x=>x!==first.slots.bottom);
 assert.ok(replace,'two genuine owned bottoms should allow swapping');
 await lower.selectOption(replace);
 await page.locator('#styleOwned03SwapButton-bottom').click();
 const swapped=await page.evaluate(()=>window.nativeLossless04Bridge.view());
 assert.equal(swapped.slots.top,id);
 assert.equal(swapped.slots.bottom,replace);
 assert.equal(swapped.slots.shoes,first.slots.shoes);
 // A forbidden pin replacement must fail before any native draft mutation.
 await assert.rejects(page.evaluate(()=>window.styleOwnedLive03Bridge.swap('top',
  'native05-A-donor-shirt')),/pinned|incompatible/);
 assert.deepEqual(await page.evaluate(()=>window.nativeLossless04Bridge.view()),swapped);
 await capture(page,width,engine,'04-swapped-owned-bottom');
 await page.locator('#styleOwned03Undo').click();
 const undone=await page.evaluate(()=>window.nativeLossless04Bridge.view());
 assert.deepEqual(undone.slots,first.slots);
 await page.locator('#styleOwned03Swap-bottom').selectOption(replace);
 await page.locator('#styleOwned03SwapButton-bottom').click();
 const beforeSave=await readBoard(page);
 await page.locator('#styleOwned03Save').click();
 await page.waitForFunction(()=>window.styleOwnedLive03Bridge?.status()?.savedId,
  null,{timeout:30000});
 const afterSave=await readBoard(page),newSaved=afterSave.saved.at(-1);
 assert.equal(afterSave.saved.length,beforeSave.saved.length+1);
 assert.deepEqual(afterSave.saved.slice(0,-1),beforeSave.saved,
  'Every prior saved outfit including missing IDs/extra metadata must survive');
 assert.equal(newSaved.slots.top,id);
 assert.equal(newSaved.slots.bottom,replace);
 assert.equal(newSaved.slots.shoes,first.slots.shoes);
 assert.equal(newSaved.slotSources.top.sha256,photos['commons-0002'].sha256);
 assert.equal(newSaved.slotSources.top.ownerId,owner);
 assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().dirty),false);
 assert.match(await page.locator('#styleOwned03Status').innerText(),/Saved!/);
 await capture(page,width,engine,'05-real-native-CAS-saved');
 await page.locator('#styleOwned03Reopen').click();
 assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.view().slots.top),id);
 await capture(page,width,engine,'06-reopened-source-IDs');
 const evidence={newId:id,ownedReferences:Object.values(newSaved.slots),
  sourceSha:photos['commons-0002'].sha256,distinctSignatures:combos.results.combinations.map(x=>x.signature),
  pinnedNeverChanged:true,undoRestored:true,swapCommitted:true,
  saved:newSaved.id,previousRecordsExact:true,nativeCAS:true,
  nativeOutfitReopen:true,allPhotosFromExactOriginals:true};
 if(rich){
  const v4=await page.evaluate(async()=>(
   await window.restoreAtomic01Bridge.exportJSON()).data);
  assert.equal(v4.version,4);
  assert.equal(v4.ownerId,owner);
  assert.equal(v4.state['outfit-board'].saved.at(-1).id,newSaved.id);
  const sameItem=v4.items.find(x=>x.id===id);
  assert.equal(sameItem.originalPhoto.image,photos['commons-0002'].image);
  // V4 restore: simulated physical loss, then current original native importer.
  await page.evaluate(({id,savedId})=>new Promise((resolve,reject)=>{
   const tx=db.transaction(['items','state'],'readwrite');
   tx.objectStore('items').delete(id);
   const store=tx.objectStore('state'),q=store.get('outfit-board');
   q.onsuccess=()=>store.put({...q.result,saved:q.result.saved.filter(x=>x.id!==savedId)});
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  }),{id,savedId:newSaved.id});
  assert.equal((await readItems(page)).some(x=>x.id===id),false);
  const returned=await page.evaluate(payload=>window.restoreAtomic01Bridge.importBackup(
   payload,{confirm:()=>true}),v4);
  assert.notEqual(returned.cancelled,true);
  assert.deepEqual(await readBoard(page),afterSave);
  assert.equal((await readItems(page)).find(x=>x.id===id).originalPhoto.image,
   photos['commons-0002'].image);
  evidence.v4LossRestored=true;
  await capture(page,width,engine,'07-v4-atomic-restored');
 }else{
  evidence.v4Exported=false;
 }
 return evidence;
}
try{
 for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   browser=await browserType.launch({headless:true,...engine==='chromium'?{
    args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{}});
   const context=await browser.newContext({viewport:{width,height:900},
    deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await context.route('**/*',route=>{
    const url=route.request().url(),path=new URL(url).pathname;
    if(path==='/public/cloud-backup.js')
     return route.fulfill({contentType:'text/javascript',body:cloudStub});
    if(url.startsWith(origin+'/')||url.startsWith('blob:'+origin)||
       url.startsWith('data:'))return route.continue();
    if(url.startsWith(authOrigin+'/auth/v1/'))return authResponse(route);
    results.external.push({engine,width,method:route.request().method(),
     host:new URL(url).hostname});return route.abort();
   });
   const page=await context.newPage();
   page.on('pageerror',e=>results.errors.push({engine,width,message:String(e)}));
   page.on('crash',()=>results.crashes.push({engine,width}));
   page.on('console',message=>{if(message.type()==='error')results.consoleErrors.push({
    engine,width,text:message.text().slice(0,350)})});
   await page.goto(origin+'/public/index.html?'+flags,{waitUntil:'domcontentloaded'});
   await prepare(page,ownerA);
   const preserved=await readBoard(page),preExisting=structuredClone(preserved.saved);
   const red=await importAndConfirmNewRed(page,ownerA);
   const scenario=await createAndVerifyLooks(page,red,ownerA,width,engine,
    engine==='chromium');
   const saved=await readBoard(page);
   assert.deepEqual(saved.saved.slice(0,2),preExisting);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),
    true,'no horizontal scroll');
   // Owner account revocation clears all source images from the original Style
   // panel, not just a test-only controller: A's saved IDs must never leak B.
   await page.locator('details.account-menu > summary').click();
   await page.locator('#logout').click();
   await page.waitForFunction(()=>document.getElementById('authGate')?.hidden===false);
   assert.equal(await page.locator('#styleOwned03Pinned img').count(),0);
   assert.equal(await page.locator('#styleOwned03Suggestions img').count(),0);
   await login(page,ownerB);
   await seed(page,ownerB);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.styleOwnedLive03Bridge?.status()?.active&&
    window.styleOwnedLive03Bridge.status().ownerId==='native05-B',
    null,{timeout:40000});
   const b=await readBoard(page);
   assert.equal(b.saved.length,2);
   assert.equal(b.saved.some(x=>x.id===scenario.saved),false);
   assert.equal(await page.locator('#styleOwned03Item option[value="'+red+'"]').count(),0);
   assert.ok((await page.locator('#styleOwned03Item option').count())>0);
   await page.evaluate(()=>switchView('stylist'));
   await capture(page,width,engine,'08-owner-B-isolated');
   results.cases.push({engine,width,ownerA:scenario,
    nativeAppReal:true,actualInputAndHumanCorrection:true,
    threeRealOriginalOwnedLooks:true,undoPinCAS:true,
    ownerBPrivate:true,logoutCleared:true,actual2DOriginalImages:true,
    noFabricated3D:true,photosUnchanged:true,overflow:false});
   await context.close();await browser.close();browser=null;
  }
 }
 assert.equal(results.cases.length,6);
 assert.deepEqual(results.errors,[]);
 assert.deepEqual(results.crashes,[]);
 assert.deepEqual(results.external,[]);
 assert.deepEqual(results.consoleErrors,[]);
 assert.equal(results.cases.every(x=>x.threeRealOriginalOwnedLooks&&
  x.actualInputAndHumanCorrection&&x.ownerBPrivate&&x.photosUnchanged),true);
 assert.equal(results.screenshots.length,45); // 8 stages per Chromium, 7 per WebKit at each of three widths
 await writeFile(dir+'/results.json',JSON.stringify(results,null,2));
 console.log('STYLE03_NATIVE '+JSON.stringify({
  genuineBrowserCases:6,chromiumWidths:[320,390,430],
  webkitWidths:[320,390,430],actualScreenshots:results.screenshots.length,
  sourceVerified:photos['commons-0002'].sha256,
  realSignedRLS:false,productionDeployed:false,familyAlpha:'HOLD'}));
}finally{await browser?.close();await new Promise(done=>server.close(done));}
