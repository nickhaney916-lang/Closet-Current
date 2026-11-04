/** NATIVE-3D-05 genuine original native Outfit Builder → pinned unchanged
 * PR541 anatomical 163-bone WebGL, source-true photographed original JPEG,
 * outfit owner / source SHA / dress jacket coat photo-fallback, no writes.
 * The Supabase auth *HTTP responses* are synthetic. Real RLS NOT verified.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),donor=resolve('.native05-donor-541'),dir='benchmark/native-mobile-09';
await mkdir(dir,{recursive:true});
const digest=b=>createHash('sha256').update(b).digest('hex');
const locks=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const ids=['commons-0053','commons-0064','commons-0067','commons-0080','commons-0003','commons-0002'];
const photos={};
for(const id of ids){
 const locked=locks.find(x=>x.id===id),bytes=await readFile('benchmark/fixtures/'+id+'.jpg');
 assert.ok(locked?.verified&&locked.sha256===digest(bytes)&&
  locked.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'));
 photos[id]={image:'data:image/jpeg;base64,'+bytes.toString('base64'),sha256:locked.sha256};
}
const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.json':'application/json','.css':'text/css','.glb':'model/gltf-binary',
 '.jpg':'image/jpeg','.png':'image/png','.bin':'application/octet-stream',
 '.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path.includes('\\')||path.includes('\0')||path.split('/').includes('..')||
    !/^\/(public\/|research\/|donor\/|benchmark\/|node_modules\/)/.test(path))
   throw Error('Unsafe test path');
  const fromDonor=path.startsWith('/donor/')||path.startsWith('/benchmark/');
  const base=fromDonor?donor:root;
  const sub=path.startsWith('/donor/')?path.slice(6):path;
  const target=resolve(base,'.'+sub);
  if(!target.startsWith(base+'/'))throw Error('Outside research');
  const bytes=await readFile(target);
  res.writeHead(200,{'content-type':types[extname(target)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const authOrigin='https://hlkgymugtfbirlpunsra.supabase.co';
let browser=null;
const external=[],errors=[],cases=[],screens=[],navigations=[],crashes=[];
let tokenCount=0;
const cloudStub="window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};";
function fixture(owner){
 const item=(label,cat,subtype,pic)=>({
  id:owner+'-'+label,ownerId:owner,name:'Saved '+label,
  category:cat,itemType:subtype,color:'Black',colorSource:'user',
  userAdjusted:true,requiresOwnershipConfirmation:false,
  possibleDuplicate:false,sourceSHA256:photos[pic].sha256,
  sourceHashVerified:true,singleGarmentVerified:true,
  originalPhoto:{image:photos[pic].image,sha256:photos[pic].sha256},
  image:photos[pic].image,seasons:[],notes:'',brand:'',size:'',material:'',occasion:''
 });
 return {
  items:[
   item('dress','Dresses','Casual dress','commons-0053'),
   item('jacket','Outerwear','Jacket','commons-0064'),
   item('coat','Outerwear','Coat','commons-0067'),
   item('shoes','Shoes','Sneakers','commons-0080'),
   item('shirt','Tops','T-shirt','commons-0003')],
  state:{id:'outfit-board',current:{name:'Existing current',slots:{},future:{preserve:true}},
   saved:[
    {id:owner+'-dress-saved',outfit3dId:owner+'-verified-dress-3D',
     ownerId:owner,name:'Source-true dress and coat',
     layerCount:3,slots:{top:owner+'-dress',layer2:owner+'-jacket',
      layer3:owner+'-coat',shoes:owner+'-shoes'},
     extraOriginalMetadata:{keep:true},futureSourceKeys:{ver:1}},
    {id:owner+'-missing-saved',outfit3dId:owner+'-missing-3D',
     ownerId:owner,name:'Missing lower garment',
     slots:{top:owner+'-shirt',bottom:owner+'-lost-denim',shoes:owner+'-shoes'},
     futureSourceKeys:{ver:2}}],
   futureBoardVersion:'never-drop'}
 };
}
const readItems=page=>page.evaluate(()=>new Promise((resolve,reject)=>{
 const r=db.transaction('items','readonly').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
}));
const readBoard=page=>page.evaluate(()=>new Promise((resolve,reject)=>{
 const r=db.transaction('state','readonly').objectStore('state').get('outfit-board');
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
}));
async function login(page,id){
 await page.locator('#authEmail').fill(id+'@example.test');
 await page.locator('#authPassword').fill('research-fixture-only');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(owner=>window.closetAuth?.user?.id===owner&&
   document.getElementById('appShell')?.hidden===false, id,{timeout:30000});
 await page.waitForFunction(owner=>db?.name==='closet-current-user-'+owner,id);
}
async function seed(page,owner){
 await page.evaluate(data=>new Promise((resolve,reject)=>{
  const tx=db.transaction(['state','items'],'readwrite');
  for(const item of data.items)tx.objectStore('items').put(item);
  tx.objectStore('state').put(data.state);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 }),fixture(owner));
}
async function take(page,width,stage){
 const png=await page.screenshot({fullPage:false,animations:'disabled'});
 const meta=await sharp(png).metadata(),stat=await sharp(png).stats();
 assert.equal(meta.width,width);assert.ok(meta.height>=880&&png.length>4500);
 assert.ok(stat.channels.some(x=>x.stdev>7),'Actual mobile canvas/image blank');
 const name='chromium-'+width+'-'+stage+'.png';
 await writeFile(dir+'/'+name,png);
 screens.push({name,width,stage,sha256:digest(png)});
}
function authHttp(route){
 const req=route.request(),u=new URL(req.url());
 if(u.pathname==='/auth/v1/logout')return route.fulfill({status:204,body:''});
 if(u.pathname==='/auth/v1/token'){
  const d=JSON.parse(req.postData()||'{}'),grant=u.searchParams.get('grant_type');
  let owner;
  if(grant==='password'&&/^native05-[AB]@example\.test$/.test(d.email||'')){
   owner=d.email.split('@')[0];
  }else if(grant==='refresh_token'&&/^refresh-native05-[AB]$/.test(d.refresh_token||'')){
   owner=d.refresh_token.slice(8);
  }else return route.fulfill({status:401,contentType:'application/json',
    body:JSON.stringify({error_code:'invalid_credentials',msg:'No approved fixture'})});
  const data={user:{id:owner,email:owner+'@example.test'},
   access_token:'research-native05-token-'+owner+'-'+(++tokenCount),
   refresh_token:'refresh-'+owner,expires_in:3600};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 }
 external.push({kind:'unrecognized-auth',method:req.method()});return route.abort();
}
try{
 for(const width of [320,390,430]){
  // A fresh Chromium/GPU process per real WebGL width avoids stale prior
  // 163-bone canvas contexts, renderer memory and stale browser navigation.
  browser=await chromium.launch({headless:true,args:[
   '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const ctx=await browser.newContext({viewport:{width,height:920},deviceScaleFactor:1,
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await ctx.route('**/*',route=>{
   const u=route.request().url(),path=new URL(u).pathname;
   if(path==='/public/cloud-backup.js')return route.fulfill({
     contentType:'text/javascript',body:cloudStub});
   if(u.startsWith(origin+'/')||u.startsWith('data:')||u.startsWith('blob:'+origin))
    return route.continue();
   if(u.startsWith(authOrigin+'/auth/v1/'))return authHttp(route);
   external.push({kind:'unexpected-external',method:route.request().method(),
    host:new URL(u).hostname});
   return route.abort();
  });
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push({width,message:e.message}));
  page.on('framenavigated',f=>{if(f===page.mainFrame())
   navigations.push({width,path:new URL(f.url()).pathname,query:new URL(f.url()).search});});
  page.on('crash',()=>crashes.push({width,kind:'renderer-crash'}));
  await page.goto(origin+'/public/index.html?nativeLossless04=research&native3D05=research&restoreAtomic01=research&nativeIndex07=research&index02=after&captureProof01=after&index04=after&sourceReadiness08=research&nativeMobile09=research',
    {waitUntil:'domcontentloaded'});
  await login(page,'native05-A');
  await seed(page,'native05-A');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.nativeLossless04Bridge?.status()?.active&&
   window.restoreAtomic01Bridge?.status()?.active&&
   window.closetIndex02?.state()?.ready===true&&!!window.native3D05Bridge&&
   !!window.nativePhotoReadiness08Bridge&&
    window.nativeMobile09Bridge?.state()?.active===true,{timeout:30000});
  await page.evaluate(()=>switchView('builder'));
  await page.waitForFunction(()=>document.getElementById('builder')?.hidden===false);
  assert.equal(await page.locator('#native3D05Preview').isVisible(),true);
  // Explicitly verify the actual phone layout, not simply successful CSS
  // parsing or an image with offscreen controls hidden by overflow:hidden.
  const touch=await page.evaluate(()=>{
   const byId=id=>document.getElementById(id);
   const bounds=e=>{const r=e.getBoundingClientRect();return {
    x:r.left,right:r.right,width:r.width,height:r.height,top:r.top,bottom:r.bottom}};
   const buttons=[...byId('nativeLossless04Controls').querySelectorAll('button')];
   const sample=[...buttons,byId('native3D05Preview'),byId('nativeReadiness08Check')];
   const rects=sample.map(bounds);
   return {active:window.nativeMobile09Bridge.state().active,
    display:getComputedStyle(byId('nativeLossless04Controls')).display,
    columns:getComputedStyle(byId('nativeLossless04Controls')).gridTemplateColumns.trim().split(/\s+/).length,
    rects,savedOutfitControls:buttons.length,
    bodyScrollWidth:document.documentElement.scrollWidth,viewport:innerWidth};
  });
  assert.equal(touch.active,true);
  assert.equal(touch.display,'grid');
  assert.equal(touch.columns,2);
  assert.equal(touch.savedOutfitControls,3);
  assert.ok(touch.rects.every(r=>r.height>=48&&r.x>=-1&&r.right<=width+1),
   'Every actual save/cancel/delete/viewer/readiness touch target must fit the phone');
  assert.ok(touch.bodyScrollWidth<=width+1,'No horizontal page overflow at 320/390/430');
  assert.equal(touch.viewport,width);
  const ownerOriginal=await readBoard(page),itemOriginal=await readItems(page);
  const backup=await page.evaluate(async()=>(
   await window.restoreAtomic01Bridge.exportJSON()).data);
  assert.equal(backup.version,4);
  assert.equal(backup.ownerId,'native05-A');
  assert.deepEqual(backup.state['outfit-board'],ownerOriginal);
  assert.deepEqual(backup.items,itemOriginal);
  // Original source SHA corruption must reject BEFORE mutating any wardrobe.
  const tampered=structuredClone(backup);
  tampered.items[0].originalPhoto.sha256='0'.repeat(64);
  await assert.rejects(page.evaluate(doc=>
   window.restoreAtomic01Bridge.importBackup(doc,{confirm:()=>true}),tampered),
   /RESTORE01/);
  assert.deepEqual(await readBoard(page),ownerOriginal);
  assert.deepEqual(await readItems(page),itemOriginal);
  // Actual IDB clothing + saved outfit loss, followed by owner-approved
  // atomic v4 restore. This is not a synthetic restore decision object.
  await page.evaluate(()=>new Promise((resolve,reject)=>{
   const tx=db.transaction(['items','state'],'readwrite');
   tx.objectStore('items').delete('native05-A-coat');
   const store=tx.objectStore('state'),req=store.get('outfit-board');
   req.onsuccess=()=>store.put({...req.result,saved:[]});
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  }));
  assert.equal((await readItems(page)).length,itemOriginal.length-1);
  assert.equal((await readBoard(page)).saved.length,0);
  const restored=await page.evaluate(doc=>
   window.restoreAtomic01Bridge.importBackup(doc,{confirm:()=>true}),backup);
  assert.equal(restored.cancelled,undefined);
  assert.deepEqual(await readBoard(page),ownerOriginal,
   'Atomic recovery must preserve original saved 3D ID, layers, and missing IDs');
  assert.deepEqual(await readItems(page),itemOriginal,
   'Every original SHA-pinned JPEG must return unchanged');
  assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge?.status()?.active),true);
  assert.equal(await page.evaluate(()=>window.restoreAtomic01Bridge?.status()?.active),true);
  // Saved outfit is opened AND edited BEFORE adding a new garment. The
  // original BOARD04 controller cached only five garments when it mounted.
  // Before INDEX07, the sixth item could not be placed without page reload.
  await page.locator('#savedBoards button').nth(1).click();
  await page.evaluate(()=>window.nativeLossless04Bridge.setField('name',
    'Draft kept while photo is saved'));
  assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().dirty),true);
  const jpeg=await readFile('benchmark/fixtures/commons-0002.jpg');
  await page.locator('#clothingPhotos').setInputFiles({
   name:'licensed-original-red-tshirt.jpg',mimeType:'image/jpeg',buffer:jpeg
  });
  await page.waitForFunction(expected=>batch.some(x=>
   x.sourceSHA256===expected&&x.originalPhoto?.sha256===expected),
   photos['commons-0002'].sha256,{timeout:30000});
  const newId=await page.evaluate(expected=>batch.find(x=>
   x.sourceSHA256===expected)?.id,photos['commons-0002'].sha256);
  assert.ok(newId&&typeof newId==='string');
  await page.locator('#reviewGrid button').filter({hasText:'Adjust'}).first().click();
  const editor=page.locator('dialog.photo-adjust');
  await editor.locator('input[aria-label="Item name"]').fill('Original red T-shirt');
  await editor.locator('select[aria-label="Main category"]').selectOption('Tops');
  await editor.locator('select[aria-label="Item type"]').selectOption('T-shirt');
  await editor.locator('input[aria-label="Color"]').fill('Red');
  await editor.locator('button.primary').filter({hasText:'Save changes'}).click();
  await page.waitForFunction(id=>items.some(x=>x.id===id)&&
   !batch.some(x=>x.id===id)&&
   window.closetIndex02?.state().total===6,newId,{timeout:30000});
  const newStored=(await readItems(page)).find(x=>x.id===newId);
  assert.ok(newStored&&newStored.ownerId==='native05-A');
  assert.equal(newStored.category,'Tops');
  assert.equal(newStored.itemType,'T-shirt');
  assert.equal(newStored.color,'Red');
  assert.equal(newStored.sourceSHA256,photos['commons-0002'].sha256);
  assert.equal(newStored.originalPhoto?.sha256,photos['commons-0002'].sha256);
  assert.equal(newStored.originalPhoto?.image,photos['commons-0002'].image,
   'Actual imported original JPEG bytes must be immutable');
  assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().dirty),true,
   'Saving a new garment must NOT silently discard an unsaved outfit draft');
  assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.view().name),
   'Draft kept while photo is saved');
  await page.evaluate(()=>switchView('closet'));
  await page.locator('#index02Category').selectOption('Tops');
  await page.locator('#index02Color').selectOption('Red');
  await page.waitForFunction(()=>window.closetIndex02?.state().matched===1);
  assert.equal(await page.locator('#closetGrid article.card').count(),1);
  assert.match(await page.locator('#closetGrid').innerText(),/Original red T-shirt/);
  await take(page,width,'02-private-indexed-new-photo');
  await page.locator('#index02Clear').click();
  await page.evaluate(()=>switchView('builder'));
  // This exact ID came from a genuine browser photo import+human correction,
  // not test-only direct IDB seeding. The existing controller must accept it
  // without a full page reload, while preserving the still-unsaved draft.
  await page.evaluate(id=>window.nativeLossless04Bridge.setSlot('top',id),newId);
  assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().dirty),true);
  const saved=await page.evaluate(()=>window.nativeLossless04Bridge.persist({asNew:false}));
  assert.equal(saved.saved,true);
  const revisedBoard=await readBoard(page);
  assert.deepEqual(revisedBoard.saved[0],ownerOriginal.saved[0],
   'Adding photographed clothing must not normalize another saved outfit');
  assert.equal(revisedBoard.saved[1].slots.top,newId);
  assert.equal(revisedBoard.saved[1].name,'Draft kept while photo is saved');
  assert.equal(revisedBoard.saved[1].slots.bottom,'native05-A-lost-denim');
  const revisedBackup=await page.evaluate(async()=>(
   await window.restoreAtomic01Bridge.exportJSON()).data);
  assert.equal(revisedBackup.items.length,6);
  assert.equal(revisedBackup.state['outfit-board'].saved[1].slots.top,newId);
  // Recover the just-captured source on the very same browser IndexedDB,
  // proving the index and safe Outfit Builder can reacquire the item.
  await page.evaluate(id=>new Promise((resolve,reject)=>{
   const tx=db.transaction('items','readwrite');
   tx.objectStore('items').delete(id);
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  }),newId);
  await page.evaluate(document=>window.restoreAtomic01Bridge.importBackup(
   document,{confirm:()=>true}),revisedBackup);
  const expectedBoard=await readBoard(page);
  assert.deepEqual(expectedBoard,revisedBoard);
  assert.equal((await readItems(page)).find(x=>x.id===newId).sourceSHA256,
   photos['commons-0002'].sha256);
  await page.waitForFunction(()=>window.closetIndex02?.state()?.total===6,null,{timeout:30000});
  await page.evaluate(()=>switchView('builder'));
  await take(page,width,'01-original-native-builder');
  await take(page,width,'09-A-comfortable-actual-save-controls');
  // A clicked original saved outfit rather than donor-created selection.
  await page.locator('#savedBoards button').first().click();
  assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().selected),0);
  // Source-honest owner read: known authentic source dress still NEEDS human
  // independent garment fitting review, not universal 3D admission. Jacket,
  // coat and shoes can show verified original JPEGs but are photo-only.
  assert.equal(await page.locator('#nativeReadiness08Check').isVisible(),true);
  await page.locator('#nativeReadiness08Check').click();
  await page.waitForFunction(()=>window.nativePhotoReadiness08Bridge?.state()?.count===4,
   null,{timeout:30000});
  const admittedA=await page.evaluate(()=>window.nativePhotoReadiness08Bridge.state());
  assert.equal(admittedA.ready,0);
  assert.equal(admittedA.review,1);assert.equal(admittedA.photoOnly,3);
  assert.equal(admittedA.missing,0);
  assert.equal(await page.locator('#nativeReadiness08Results img').count(),4);
  assert.deepEqual(await readBoard(page),expectedBoard);
  const originalAttested=await readItems(page);
  assert.equal(originalAttested.length,6);
  await take(page,width,'07-A-verified-source-readiness');
  // Real end-user button click: do NOT hold one long-running Playwright
  // page.evaluate() open promise while WebGL imports/contexts are created.
  // Native PR541 itself drives its browser test by DOM click + state wait.
  await page.locator('#native3D05Preview').click();
  await page.waitForFunction(()=>window.native3D05Bridge?.state().modelReady&&
   window.native3D05Bridge.state().viewerMode==='dress'&&
   window.native3D05Bridge.state().bones===163,null,{timeout:150000});
  assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().opened),
   'native05-A-verified-dress-3D');
  const state=await page.evaluate(()=>window.native3D05Bridge.state());
  // Real WebGL dialog: ensure all 4 turntable controls, Close button and
  // canvas remain reachable at real CSS pixel scale, not tiny decorative UI.
  const viewerTouch=await page.evaluate(()=>{
   const dialog=document.getElementById('outfit3D01Dialog');
   const root=dialog.getBoundingClientRect();
   const buttons=['Front','Side','Back','Rotate'].map(x=>
    document.getElementById('outfit3D01'+x));
   const rects=buttons.map(el=>{
    const r=el.getBoundingClientRect();return {left:r.left,right:r.right,
     width:r.width,height:r.height,fontSize:parseFloat(getComputedStyle(el).fontSize)};
   });
   const close=document.getElementById('outfit3D01Close').getBoundingClientRect();
   const canvas=document.getElementById('outfit3D01Canvas').getBoundingClientRect();
   return {open:dialog.open,dialogLeft:root.left,dialogRight:root.right,
    headerSticky:getComputedStyle(dialog.querySelector('.cc3d-header')).position,
    rects,closeHeight:close.height,closeRight:close.right,
    canvasHeight:canvas.height,canvasWidth:canvas.width,
    viewport:window.innerWidth,navPresent:!!document.querySelector('.main-nav')};
  });
  assert.equal(viewerTouch.open,true);
  assert.equal(viewerTouch.viewport,width);
  assert.equal(viewerTouch.headerSticky,'sticky');
  assert.ok(viewerTouch.dialogLeft>=-1&&viewerTouch.dialogRight<=width+1);
  assert.ok(viewerTouch.rects.every(r=>r.height>=48&&r.fontSize>=13&&
   r.left>=-1&&r.right<=width+1),'3D camera angles must remain 48px touch targets');
  assert.ok(viewerTouch.closeHeight>=48&&viewerTouch.closeRight<=width+1);
  assert.ok(viewerTouch.canvasHeight>=220&&viewerTouch.canvasWidth>200,
   'Anatomical canvas must remain visible, not compressed by mobile controls');
  await take(page,width,'10-3d-touch-safe-controls');
  assert.equal(state.meshCount>=1,true);
  assert.ok(state.fallbackCount>=3,'Jacket coat shoes must remain photo-only');
  assert.equal(await page.locator('#outfit3D01Photos img').count(),4);
  assert.equal(await page.locator('#outfit3D01Save').isDisabled(),true);
  assert.equal(await page.locator('#outfit3D01Delete').isDisabled(),true);
  assert.equal(await page.locator('#outfit3D01Slot-layer2').isDisabled(),true);
  // An open 163-bone scene references the old record and must not silently
  // persist through an atomic wardrobe replacement or cloud replacement.
  const activePreviewBoard=await readBoard(page);
  await assert.rejects(page.evaluate(doc=>
   window.restoreAtomic01Bridge.importBackup(doc,{confirm:()=>true}),revisedBackup),
   /close the active 3D preview/);
  assert.deepEqual(await readBoard(page),activePreviewBoard);
  const plan=await page.evaluate(()=>window.native3D05Bridge.state());
  assert.equal(plan.productionEnabled,false);
  assert.deepEqual(await readBoard(page),expectedBoard,'3D scene may not rewrite outfit or JPEG IDs');
  await page.locator('#outfit3D01Front').click();
  await take(page,width,'03-genuine-163-bone-front-dress');
  await page.locator('#outfit3D01Side').click();
  await take(page,width,'04-genuine-163-bone-side-dress');
  await page.locator('#outfit3D01Back').click();
  await take(page,width,'05-genuine-163-bone-rear-neutral');
  // Explicit scene close must NOT invalidate still-signed-in consumer editor.
  await page.evaluate(()=>window.native3D05Bridge.close());
  assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true);
  assert.deepEqual(await readBoard(page),expectedBoard);
  // Unsaved edit must fail closed, rather than replacing source with a fake mesh.
  await page.locator('#boardSlots .board-slot-shoes').click();
  await page.locator('#boardPickerItems button').filter({hasText:'shoes'}).first().click().catch(()=>{});
  await page.evaluate(()=>window.nativeLossless04Bridge.setField('name','unsaved 3D prohibited'));
  await assert.rejects(page.evaluate(()=>window.native3D05Bridge.open()),
    /Save or cancel unsaved outfit/);
  assert.deepEqual(await readBoard(page),expectedBoard);
  await page.evaluate(()=>window.nativeLossless04Bridge.cancel());
  await page.locator('details.account-menu > summary').click();
  await page.locator('#logout').click();
  await page.waitForFunction(()=>window.closetAuth?.user===null&&
   document.getElementById('authGate')?.hidden===false);
  assert.equal(await page.locator('#outfit3D01Photos img').count(),0);
  assert.equal(await page.evaluate(()=>!window.native3D05Bridge||!window.native3D05Bridge.state().active),true,
   'Native logout may destroy the whole research bridge or leave it revoked');
  assert.equal(await page.evaluate(()=>!window.nativeMobile09Bridge||
   !window.nativeMobile09Bridge.state().active),true,
   'Research-only comfort panel must revoke styles on account logout');
  assert.equal(await page.evaluate(()=>!window.nativePhotoReadiness08Bridge||
   !window.nativePhotoReadiness08Bridge.state().active),true,
   'Native logout must revoke OR destroy all private source-readiness state');
  assert.equal(await page.locator('#nativeReadiness08Results img').count(),0,
   'Account A originals must disappear on logout');
  // Session B cannot inherit A preview, owner IDs, or original photo URLs.
  await login(page,'native05-B');
  await seed(page,'native05-B');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.nativeLossless04Bridge?.status()?.active&&
   !!window.native3D05Bridge,{timeout:30000});
  await page.evaluate(()=>switchView('builder'));
  const bStored=await readBoard(page),bItems=await readItems(page);
  await assert.rejects(page.evaluate(doc=>
   window.restoreAtomic01Bridge.importBackup(doc,{confirm:()=>true}),backup),
   /RESTORE01/);
  assert.deepEqual(await readBoard(page),bStored,
   'Owner B cannot restore owner A outfits');
  assert.deepEqual(await readItems(page),bItems,
   'Owner B clothes cannot be replaced with owner A photos');
  assert.equal(bStored.saved[0].outfit3dId,'native05-B-verified-dress-3D');
  assert.equal(await page.locator('#savedBoards').textContent().then(t=>t.includes('native05-A')),false);
  await page.locator('#savedBoards button').nth(1).click();
  assert.equal(await page.locator('#boardSlots .board-slot-bottom').textContent().then(
   t=>t.includes('Missing saved clothing')),true);
  await page.locator('#nativeReadiness08Check').click();
  await page.waitForFunction(()=>window.nativePhotoReadiness08Bridge?.state()?.count===3,
   null,{timeout:30000});
  const admittedB=await page.evaluate(()=>window.nativePhotoReadiness08Bridge.state());
  assert.equal(admittedB.ready,0);assert.equal(admittedB.review,1);
  assert.equal(admittedB.photoOnly,1);assert.equal(admittedB.missing,1);
  assert.equal(await page.locator('#nativeReadiness08Results img').count(),2);
  assert.deepEqual(await readBoard(page),bStored);
  await take(page,width,'08-B-private-missing-source-readiness');
  await take(page,width,'06-B-private-missing-source-fallback');
  assert.deepEqual(await readBoard(page),bStored);
  cases.push({width,realNativeBuilder:true,exactSourceDonorPR541:true,
   authenticPhotoSourcedDress3D:true,bones:163,renderedGenuineMeshes:state.meshCount,
   nonVettedCoatJacketShoesPhotoFallback:true,readOnlyDonorActions:true,
   noOutfitMutation:true,unsavedEditsBlocked:true,
   sessionLogoutClears3D:true,consumerStillActiveAfterViewerClose:true,
   separateAccountBPrivate:true,missingIDsRetained:true,
   atomicLosslessV4RestoredBefore3D:true,exactRestoredOriginalPhotos:true,
   realOriginalJPEGImportedManuallyCorrectedAndIndexed:true,
   previouslyStaleNewGarmentSavedToUnsavedOutfitWithoutReload:true,
   savedOriginalPhotoIncludedInV4Restore:true,
   ownerOriginalSourceReadinessShownBeforeWebGL:true,
   unsupportedShoesOuterwearRemainPhotoOnly:true,
   sourceReadinessBlockedOnLogoutAndForeignOwner:true,
   missingOriginalIDRetainedWithoutFabrication:true,
   nativeMobileTouchTargetsAtLeast48px:true,
   actual3DCameraAngleTargetsAtLeast48px:true,
   originalPhoneViewportNoHorizontalOverflow:true,
   safeAreaHeaderSticky:true,
   noPrivateUIStyleAfterLogout:true,
   activeAnatomical3DRestoreBlocked:true,ownerACrossOwnerBRestoreBlocked:true,
   physicalPhoneApproved:false,liveSignedRLS:false,releaseAuthorized:false,
   familyAlpha:'HOLD'});
  await page.close();await ctx.close();
  await browser.close();browser=null;
 }
 assert.equal(crashes.length,0,'No real WebGL viewport may crash');
 assert.equal(cases.length,3);assert.equal(screens.length,30);
 assert.deepEqual(errors,[]);
 assert.deepEqual(external.filter(x=>x.method!=='GET'),[]);
 for(const entry of screens)assert.equal(digest(await readFile(dir+'/'+entry.name)),entry.sha256);
 const result={priority:'NATIVE-MOBILE-COMFORT-09',cases:3,screenshots:30,
  browser:'chromium',widths:[320,390,430],
  originalNativeAuthHTTPOnlyMocked:true,realWebGL:true,
  pinnedDonorSourceSHA:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
  realSignedRLS:false,originalUserSavedStateUnmodified:true,
  actual3DWithHonestUnsupportedPhotoFallback:true,
  restoredBeforeSourceTrue3D:true,closedActive3DTransactionGate:true,
  physicalPhone:'NOT TESTED',familyAlpha:'HOLD',releaseAuthorized:false,
  evidence:cases,screens,errors,external,
  navigations,crashes,isolatedChromiumProcessPerWidth:true};
 await writeFile(dir+'/results.json',JSON.stringify(result,null,2));
 console.log('NATIVE_MOBILE_COMFORT_09_BROWSER_VERIFIED',JSON.stringify({cases:3,
   real163BoneWebGL:true,realMobileScreenshots:30,familyAlpha:'HOLD'}));
}catch(error){
 await writeFile(dir+'/ERROR.json',JSON.stringify({
  message:String(error?.stack||error),cases:cases.length,
  screens:screens.length,errors,external,navigations,crashes},null,2));throw error;
}finally{
 await browser?.close();await new Promise(done=>server.close(done));
}
