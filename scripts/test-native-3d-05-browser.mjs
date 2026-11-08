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
import {inspectSavedShirtDenim176} from '../research/native-owner-saved-shirt-denim-176/admission.mjs';
const root=resolve('.'),donor=resolve('.native05-donor-541'),dir='benchmark/native-3d-05';
await mkdir(dir,{recursive:true});
const digest=b=>createHash('sha256').update(b).digest('hex');
const locks=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const ids=['commons-0053','commons-0064','commons-0067','commons-0080','commons-0003'];
const photoDenim176=process.env.PHOTO_DENIM176==='1';
const photos={};
for(const id of ids){
 const locked=locks.find(x=>x.id===id),bytes=await readFile('benchmark/fixtures/'+id+'.jpg');
 assert.ok(locked?.verified&&locked.sha256===digest(bytes)&&
  locked.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'));
 photos[id]={image:'data:image/jpeg;base64,'+bytes.toString('base64'),sha256:locked.sha256};
}
if(photoDenim176){
 const bytes=await readFile(donor+'/benchmark/three-d-31/original-jeans.jpg');
 const sha=digest(bytes);
 assert.equal(sha,'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c');
 assert.equal(bytes.subarray(0,2).toString('hex'),'ffd8');
 photos.denim={image:'data:image/jpeg;base64,'+bytes.toString('base64'),sha256:sha};
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
const native88=process.env.NATIVE88==='1';
const native89=process.env.NATIVE89==='1';
const native91=process.env.NATIVE91==='1';
const native92=process.env.NATIVE92==='1';
const native93=process.env.NATIVE93==='1';
const native102=process.env.NATIVE102==='1';
const photoFit171=process.env.PHOTO_FIT171==='1';
const photoTorso173=process.env.PHOTO_TORSO173==='1';
const photoSleeve174=process.env.PHOTO_SLEEVE174==='1';
const photoDress175=process.env.PHOTO_DRESS175==='1';
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
   item('shirt','Tops','T-shirt','commons-0003'),...(photoDenim176?[item('jeans','Bottoms','Jeans','denim')]:[])],
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
     futureSourceKeys:{ver:2}},
    {id:owner+'-shirt-saved',outfit3dId:owner+'-verified-shirt-3D',
     ownerId:owner,name:'Source-true original photographed shirt',
     slots:{top:owner+'-shirt'},futureSourceKeys:{ver:3}},...(photoDenim176?[{id:owner+'-shirt-jeans-saved',outfit3dId:owner+'-source-shirt-jeans-3D',ownerId:owner,name:'Source-true photographed shirt and jeans',slots:{top:owner+'-shirt',bottom:owner+'-jeans'},futureSourceKeys:{ver:4}}]:[])],
   futureBoardVersion:'never-drop'}
 };
}
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
  await page.goto(origin+'/public/index.html?nativeLossless04=research&native3D05=research'+(photoFit171?'&photoFit171=research':'')+(photoTorso173?'&photoTorso173=research':'')+(photoSleeve174?'&photoSleeve174=research':'')+(photoDress175?'&photoDress175=research':'')+(photoDenim176?'&photoDenim176=research':''),
    {waitUntil:'domcontentloaded'});
  await login(page,'native05-A');
  await seed(page,'native05-A');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.nativeLossless04Bridge?.status()?.active&&
   !!window.native3D05Bridge,{timeout:30000});
  await page.evaluate(()=>switchView('builder'));
  await page.waitForFunction(()=>document.getElementById('builder')?.hidden===false);
  assert.equal(await page.locator('#native3D05Preview').isVisible(),true);
  const ownerOriginal=await readBoard(page);
  await take(page,width,'01-original-native-builder');
  // A clicked original saved outfit rather than donor-created selection.
  await page.locator('#savedBoards button').first().click();
  assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().selected),0);
  let tamperedOriginalBlocked92=false;
  if(native92&&width===390){
   // A genuine but WRONG licensed JPEG replaces the stored bytes under the
   // SAME item ID; sourceSHA256 and originalPhoto.sha256 are deliberately
   // unchanged. Metadata-only NATIVE91 correctly cannot see this failure;
   // only genuine WebCrypto over the bytes can protect the 3D renderer.
   const putPhoto=async image=>{
    await page.evaluate(({image})=>new Promise((resolve,reject)=>{
     const tx=db.transaction('items','readwrite'),store=tx.objectStore('items');
     const get=store.get('native05-A-dress');
     get.onsuccess=()=>{
      const row=get.result;
      if(row?.ownerId!=='native05-A')return reject(Error('Wrong test account'));
      row.originalPhoto.image=image;row.image=image;
      // Deliberately retain BOTH original SHA metadata fields.
      store.put(row);
     };
     tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
     tx.onabort=()=>reject(tx.error);
    }),{image});
    await page.evaluate(()=>window.nativeLossless04Bridge.refreshWardrobe());
   };
   await putPhoto(photos['commons-0003'].image);
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.readOnlyGarmentSources91(
    ['native05-A-dress']).sources[0].sha256),photos['commons-0053'].sha256);
   await assert.rejects(page.evaluate(()=>window.native3D05Bridge.open()),
    /NATIVE92 ORIGINAL JPEG BYTES DO NOT MATCH SOURCE SHA/);
   assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().active),false);
   assert.equal(await page.locator('#outfit3D01Photos img').count(),0);
   assert.deepEqual(await readBoard(page),ownerOriginal);
   const png=await page.screenshot({fullPage:false,animations:'disabled'});
   const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
   assert.equal(meta.width,390);
   assert.ok(png.length>4500&&stats.channels.some(x=>x.stdev>7));
   await mkdir('benchmark/native-3d-92',{recursive:true});
   const filename='forged-unchanged-SHA-blocked-before-WebGL-390.png';
   await writeFile('benchmark/native-3d-92/'+filename,png);
   await writeFile('benchmark/native-3d-92/acceptance.json',
    JSON.stringify({priority:'NATIVE-3D-ORIGINAL-JPEG-BYTES-92',
     file:filename,width:390,height:meta.height,sha256:digest(png),
     originalSHA:photos['commons-0053'].sha256,
     replacementBytesSHA:photos['commons-0003'].sha256,
     licensedOriginalJPEGs:true,shaMetadataIntentionallyUnchanged:true,
     genuineBrowserWebCryptoRejectsBytes:true,donorNotOpenedForMismatchedBytes:true,
     savedBoardUnchanged:true,ownerSessionPreserved:true,
     physicalPhoneVerified:false,realSignedCloudVerified:false,
     modelAccuracyMeasured:false,productionDeployed:false,familyAlpha:'HOLD'
    },null,2)+'\n');
   await putPhoto(photos['commons-0053'].image);
   assert.deepEqual(await readBoard(page),ownerOriginal);
   tamperedOriginalBlocked92=true;
  }
  let staleSelectionBlocked88=false;
  if(native88&&width===390){
   // NATIVE88 genuine browser race: pause pinned WebGL donor's lazy import
   // while a signed-in owner switches between existing saved outfits.
   const path='**/donor/research/outfit-3d-01/research-panel.mjs*';
   let releaseDonor,notifyDonor;
   const pause=new Promise(resolve=>{releaseDonor=resolve;});
   const requested=new Promise(resolve=>{notifyDonor=resolve;});
   await page.route(path,async route=>{
    notifyDonor();
    await pause;
    await route.continue();
   });
   const pending=page.evaluate(async()=>{
    try{await window.native3D05Bridge.open();return {ok:true};}
    catch(e){return {ok:false,reason:String(e?.message||e)};}
   });
   await Promise.race([requested,new Promise((_,reject)=>setTimeout(
    ()=>reject(Error('NATIVE88 did not intercept actual pinned donor import')),45000))]);
   await page.locator('#savedBoards button').nth(1).click();
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().selected),1);
   releaseDonor();
   const returned=await Promise.race([pending,new Promise((_,reject)=>setTimeout(
    ()=>reject(Error('NATIVE88 stale donor request did not settle')),90000))]);
   await page.unroute(path);
   assert.equal(returned.ok,false,'Changed saved outfit must block stale source-bound 3D');
   assert.match(returned.reason,/NATIVE88 saved outfit changed/);
   assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().active),false);
   assert.deepEqual(await readBoard(page),ownerOriginal);
   await page.locator('#savedBoards button').first().click();
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().selected),0);
   staleSelectionBlocked88=true;
  }
  // Real end-user button click: do NOT hold one long-running Playwright
  // page.evaluate() open promise while WebGL imports/contexts are created.
  // Native PR541 itself drives its browser test by DOM click + state wait.
  await page.locator('#native3D05Preview').click();
  await page.waitForFunction(()=>window.native3D05Bridge?.state().modelReady&&
   window.native3D05Bridge.state().viewerMode==='dress'&&
   window.native3D05Bridge.state().bones===163,null,{timeout:150000});
  assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().opened),
   'native05-A-verified-dress-3D');
  if(photoFit171){
   await page.waitForFunction(()=>
    window.native3D05Bridge?.state().photoSourceFit171===true ||
    document.getElementById('native3D05Status')?.textContent.includes('P171 source-bound'),
    null,{timeout:30000});
  }
  if(photoDress175){
   // Actual signed owner board opens the already saved original dress,
   // never constructs a generic fake owner photo garment.
   await page.waitForFunction(()=>
    window.native3D05Bridge?.state().photoSourceDress175===true||
    document.getElementById('native3D05Status')?.textContent.includes(
     'P175 original photographed dress bodice/skirt 3D unavailable'),
    null,{timeout:30000});
  }
  const state=await page.evaluate(()=>window.native3D05Bridge.state());
  if(photoDress175){
   const originalDressStatus=await page.evaluate(()=>
    document.getElementById('native3D05Status')?.textContent||'no status');
   assert.equal(state.photoSourceDress175,true,
    'P175 genuine original physical dress was not fitted in native saved 3D: '+originalDressStatus);
   assert.equal(state.photoSourceFit171,true);
   assert.equal(state.viewerMode,'dress');
   assert.equal(state.bones,163);
   assert.ok(state.physicalDressBodiceVertices175>=100);
   assert.ok(state.physicalDressSkirtVertices175>=100);
   assert.ok(state.physicalDressMaxBodiceMeters175>=.001&&
    state.physicalDressMaxBodiceMeters175<=.0129001);
   assert.ok(state.physicalDressMaxSkirtMeters175>=.001&&
    state.physicalDressMaxSkirtMeters175<=.01905);
   assert.equal(state.photorealismApproved,false);
   assert.equal(state.ownerPhoto3DArbitraryFittingApproved,false);
  }
  if(photoFit171){
   const reason171=await page.evaluate(()=>document.getElementById('native3D05Status')?.textContent||'no status');
   assert.equal(state.photoSourceFit171,true,
    'P171 exact saved original SHA must be attached to a photographed P60 source-skinned 163-bone garment: '+reason171+'; active='+state.active+'; viewerMode='+state.viewerMode+'; bones='+state.bones);
   assert.equal(state.ownerPhoto3DArbitraryFittingApproved,false);
   assert.equal(state.photorealismApproved,false);
   assert.equal(state.bones,163);
  }
  assert.equal(state.meshCount>=1,true);
  assert.ok(state.fallbackCount>=3,'Jacket coat shoes must remain photo-only');
  assert.equal(await page.locator('#outfit3D01Photos img').count(),4);
  assert.equal(await page.locator('#outfit3D01Save').isDisabled(),true);
  assert.equal(await page.locator('#outfit3D01Delete').isDisabled(),true);
  assert.equal(await page.locator('#outfit3D01Slot-layer2').isDisabled(),true);
  const plan=await page.evaluate(()=>window.native3D05Bridge.state());
  assert.equal(plan.productionEnabled,false);
  assert.deepEqual(await readBoard(page),ownerOriginal,'3D scene may not rewrite outfit or JPEG IDs');
  await page.locator('#outfit3D01Front').click();
  await take(page,width,'02-genuine-163-bone-front-dress');
  await page.locator('#outfit3D01Side').click();
  await take(page,width,'03-genuine-163-bone-side-dress');
  await page.locator('#outfit3D01Back').click();
  await take(page,width,'04-genuine-163-bone-rear-neutral');
  if(native89&&width===390){
   // NATIVE89: actual source/owner viewer is already WebGL READY. A native
   // saved outfit selection change must revoke its previously visible
   // original photographs and mesh; it is not enough to reject a future open.
   await page.evaluate(()=>window.nativeLossless04Bridge.selectSaved(1));
   await page.waitForFunction(()=>
     window.native3D05Bridge?.state().active===false&&
     document.getElementById('native3D05Status')?.textContent.includes('stale source-photo 3D preview closed'),
     null,{timeout:20000});
   assert.equal(await page.locator('#outfit3D01Photos img').count(),0,
     'Stale source private photographs must be removed on live selection change');
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true,
     'Revoking stale WebGL must not revoke the valid native account/editor');
   assert.deepEqual(await readBoard(page),ownerOriginal,
     'Preview revocation must never overwrite owner private wardrobe');
   const img=await page.screenshot({fullPage:false,animations:'disabled'});
   const measure=await sharp(img).metadata(),stats=await sharp(img).stats();
   assert.equal(measure.width,390);
   assert.ok(img.length>4500&&stats.channels.some(c=>c.stdev>7));
   await mkdir('benchmark/native-3d-89',{recursive:true});
   const name='stale-photo-preview-cleared-390.png';
   await writeFile('benchmark/native-3d-89/'+name,img);
   await writeFile('benchmark/native-3d-89/acceptance.json',
     JSON.stringify({priority:'NATIVE-3D-LIVE-SOURCE-89',
      file:name,sha256:digest(img),width:390,height:measure.height,
      originalOutfitPrivate:true,oldSource3DRemoved:true,
      originalBoardUnmodified:true,nativeSessionActive:true,
      actualModelAlreadyRendered:true,physicalPhoneVerified:false,
      realSignedCloudVerified:false,productionDeployed:false,
      familyAlpha:'HOLD'},null,2)+'\n');
   await page.evaluate(()=>window.nativeLossless04Bridge.selectSaved(0));
   await page.locator('#native3D05Preview').click();
   await page.waitForFunction(()=>window.native3D05Bridge?.state().modelReady&&
     window.native3D05Bridge.state().viewerMode==='dress'&&
     window.native3D05Bridge.state().bones===163,null,{timeout:150000});
   assert.deepEqual(await readBoard(page),ownerOriginal);
  }
  if(native91&&width===390){
   // NATIVE91: original 163-bone source-photographed dress is already visible.
   // Update ONLY the underlying garment's genuine original JPEG + verified
   // source SHA in the owner-private items store, keeping its ID and the
   // *saved outfit slots* byte-for-byte identical. This is a deliberate
   // same-ID source revision, not an AI-recognition accuracy test.
   const original=photos['commons-0053'],replacement=photos['commons-0003'];
   const itemId='native05-A-dress';
   async function changeSource(photo){
    await page.evaluate(({itemId,photo})=>new Promise((resolve,reject)=>{
     const tx=db.transaction('items','readwrite');
     const object=tx.objectStore('items'),req=object.get(itemId);
     req.onsuccess=()=>{
      const row=req.result;
      if(!row||row.ownerId!=='native05-A')return reject(Error('Wrong source owner'));
      row.originalPhoto={image:photo.image,sha256:photo.sha256};
      row.sourceSHA256=photo.sha256;row.image=photo.image;
      object.put(row);
     };
     tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
     tx.onabort=()=>reject(tx.error);
    }),{itemId,photo});
    await page.evaluate(()=>window.nativeLossless04Bridge.refreshWardrobe());
   }
   await changeSource(replacement);
   await page.waitForFunction(()=>
    window.native3D05Bridge?.state().active===false&&
    document.getElementById('native3D05Status')?.textContent.includes('stale source-photo 3D preview closed'),
    null,{timeout:30000});
   assert.equal(await page.locator('#outfit3D01Photos img').count(),0,
    'Owner changed JPEG under SAME item ID; old photo must be removed');
   assert.deepEqual(await readBoard(page),ownerOriginal,
    'Photo revision may not rewrite saved board or garment IDs');
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true,
    '3D revocation may not sign user out or lose editable wardrobe');
   const revoked=await page.screenshot({fullPage:false,animations:'disabled'});
   const meta=await sharp(revoked).metadata(),stats=await sharp(revoked).stats();
   assert.equal(meta.width,390);
   assert.ok(revoked.length>4500&&stats.channels.some(c=>c.stdev>7));
   await mkdir('benchmark/native-3d-91',{recursive:true});
   const filename='same-id-source-photo-replaced-and-private-preview-cleared-390.png';
   await writeFile('benchmark/native-3d-91/'+filename,revoked);
   await writeFile('benchmark/native-3d-91/acceptance.json',
    JSON.stringify({priority:'NATIVE-3D-SOURCE-REVISION-91',
     file:filename,width:390,height:meta.height,sha256:digest(revoked),
     originalPhotoSHA:original.sha256,replacementPhotoSHA:replacement.sha256,
     realLicensedSourceJPEGs:true,sameGarmentId:true,savedOutfitIDsUnchanged:true,
     stalePhotoAndWebGLRevoked:true,ownerSessionStillValid:true,
     rendererWas163BoneAndSourceVerified:true,
     modelRecognitionAccuracyMeasured:false,physicalPhonesVerified:false,
     realSignedRLSVerified:false,productionDeployed:false,familyAlpha:'HOLD'},null,2)+'\n');
   await changeSource(original);
   // Source restore allows the same explicit source-verified garment to reopen.
   await page.locator('#native3D05Preview').click();
   await page.waitForFunction(()=>window.native3D05Bridge?.state().modelReady&&
    window.native3D05Bridge.state().viewerMode==='dress'&&
    window.native3D05Bridge.state().bones===163,null,{timeout:150000});
   assert.deepEqual(await readBoard(page),ownerOriginal);
  }
  if(native93&&width===390){
   // NATIVE93: corrupt live source BYTES only AFTER original 163-bone model
   // and permitted original photo have already been rendered. Retain the
   // saved garment ID and BOTH recorded SHA fields. The native viewer must
   // revoke on a real owner wardrobe refresh even though #91 metadata and
   // the saved outfit have not changed. There is no polling or fake model.
   const putPhoto93=async image=>{
    await page.evaluate(({image})=>new Promise((resolve,reject)=>{
     const tx=db.transaction('items','readwrite'),store=tx.objectStore('items');
     const req=store.get('native05-A-dress');
     req.onsuccess=()=>{
      const row=req.result;
      if(row?.ownerId!=='native05-A')return reject(Error('Wrong wardrobe owner'));
      row.originalPhoto.image=image;
      row.image=image;
      // Keep sourceSHA256 and originalPhoto.sha256 UNCHANGED deliberately.
      store.put(row);
     };
     tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
     tx.onabort=()=>reject(tx.error);
    }),{image});
    await page.evaluate(()=>window.nativeLossless04Bridge.refreshWardrobe());
   };
   assert.equal(await page.locator('#outfit3D01Photos img').count(),4);
   assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().bones),163);
   const beforeRevision=await page.evaluate(()=>
    window.nativeLossless04Bridge.readOnlyWardrobeRevision93());
   await putPhoto93(photos['commons-0003'].image);
   const afterRevision=await page.evaluate(()=>
    window.nativeLossless04Bridge.readOnlyWardrobeRevision93());
   assert.equal(afterRevision.ownerId,beforeRevision.ownerId);
   assert.equal(afterRevision.revision,beforeRevision.revision+1);
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.readOnlyGarmentSources91(
    ['native05-A-dress']).sources[0].sha256),photos['commons-0053'].sha256);
   // Wait for automatic native DOM mutation revocation. Do NOT call the
   // bridge state getter until after the old private photo is already gone.
   await page.waitForFunction(()=>document.getElementById('native3D05Status')
    ?.textContent.includes('stale source-photo 3D preview closed')&&
    document.querySelectorAll('#outfit3D01Photos img').length===0,
    null,{timeout:30000});
   assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().active),false);
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true);
   assert.deepEqual(await readBoard(page),ownerOriginal);
   await assert.rejects(page.evaluate(()=>window.native3D05Bridge.open()),
    /NATIVE92 ORIGINAL JPEG BYTES DO NOT MATCH SOURCE SHA/);
   assert.deepEqual(await readBoard(page),ownerOriginal);
   const png=await page.screenshot({fullPage:false,animations:'disabled'});
   const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
   assert.equal(meta.width,390);
   assert.ok(png.length>4500&&stats.channels.some(ch=>ch.stdev>7));
   await mkdir('benchmark/native-3d-93',{recursive:true});
   const filename='post-open-unchanged-SHA-photo-bytes-revoked-390.png';
   await writeFile('benchmark/native-3d-93/'+filename,png);
   await writeFile('benchmark/native-3d-93/acceptance.json',
    JSON.stringify({priority:'NATIVE-3D-WARDROBE-REFRESH-93',
     file:filename,width:390,height:meta.height,sha256:digest(png),
     originalSHA:photos['commons-0053'].sha256,
     unapprovedBytesSHA:photos['commons-0003'].sha256,
     sourcePhotoPreviouslyRendered:true,realOriginalWebGLBones:163,
     savedGarmentIdUnchanged:true,shaMetadataIntentionallyUnchanged:true,
     ownerWardrobeRevisionIncremented:true,automaticVisible3DRevocation:true,
     privatePhotoRemovedBeforeStateRead:true,
     reOpenCorruptSourceBlockedByWebCrypto:true,privateSavedBoardUnchanged:true,
     validNativeOwnerSessionPreserved:true,physicalPhoneVerified:false,
     realSignedCloudVerified:false,modelAccuracyMeasured:false,
     productionDeployed:false,familyAlpha:'HOLD'
    },null,2)+'\n');
   await putPhoto93(photos['commons-0053'].image);
   await page.locator('#native3D05Preview').click();
   await page.waitForFunction(()=>window.native3D05Bridge?.state().modelReady&&
    window.native3D05Bridge.state().viewerMode==='dress'&&
    window.native3D05Bridge.state().bones===163,null,{timeout:150000});
   assert.deepEqual(await readBoard(page),ownerOriginal);
  }
  if(native102&&width===390){
   // Genuine photo-backed original 163-bone donor MUST be visible before the
   // simulated mobile tab-hidden lifecycle event. Browser API lifecycle is
   // emulated through real Chromium DOM events; NOT a physical phone test.
   const before102=await page.evaluate(()=>window.native3D05Bridge.state());
   assert.equal(before102.modelReady,true);
   assert.equal(before102.bones,163);
   const hidden=await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});
    document.dispatchEvent(new Event('visibilitychange'));
    return {
     status:document.getElementById('native3D05Status')?.textContent,
     photos:document.querySelectorAll('#outfit3D01Photos img').length,
     signedIn:window.nativeLossless04Bridge.status().active
    };
   });
   assert.match(hidden.status,/Browser backgrounded.*preview closed/);
   assert.equal(hidden.photos,0,'Hidden tab must synchronously dispose original private 3D photo');
   assert.equal(hidden.signedIn,true,'Normal tab background must not log out owner');
   assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().active),false);
   await assert.rejects(page.evaluate(()=>window.native3D05Bridge.open()),
    /NATIVE102 hidden browser must close photographed 3D/);
   assert.deepEqual(await readBoard(page),ownerOriginal);
   const background=await page.screenshot({fullPage:false,animations:'disabled'});
   const bgMeta=await sharp(background).metadata();
   assert.equal(bgMeta.width,390);
   await mkdir('benchmark/native-3d-102',{recursive:true});
   await writeFile('benchmark/native-3d-102/background-source-revoked-390.png',background);
   await page.evaluate(()=>{
    delete document.hidden;delete document.visibilityState;
   });
   // Use the same actual browser touch button as the known-good #93
   // reopen sequence. A raw page.evaluate() promise can be invalidated by
   // donor-managed document navigation during 3D reattachment.
   await page.locator('#native3D05Preview').click();
   await page.waitForFunction(()=>window.native3D05Bridge?.state().modelReady&&
    window.native3D05Bridge.state().bones===163,null,{timeout:150000});
   assert.deepEqual(await readBoard(page),ownerOriginal);
   // A different mobile lifecycle freeze can also occur without pagehide.
   const frozen=await page.evaluate(()=>{
    document.dispatchEvent(new Event('freeze'));
    return {
     status:document.getElementById('native3D05Status')?.textContent,
     photos:document.querySelectorAll('#outfit3D01Photos img').length,
     signedIn:window.nativeLossless04Bridge.status().active
    };
   });
   assert.match(frozen.status,/Browser frozen.*preview closed/);
   assert.equal(frozen.photos,0);
   assert.equal(frozen.signedIn,true);
   assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().active),false);
   assert.deepEqual(await readBoard(page),ownerOriginal);
   const freezePng=await page.screenshot({fullPage:false,animations:'disabled'});
   const freezeMeta=await sharp(freezePng).metadata();
   assert.equal(freezeMeta.width,390);
   await writeFile('benchmark/native-3d-102/freeze-source-revoked-390.png',freezePng);
   await writeFile('benchmark/native-3d-102/acceptance.json',
    JSON.stringify({
     priority:'NATIVE-MOBILE-VISIBILITY-SOURCE-REVOKE-102',
     browser:'Chromium',simulatedBrowserVisibility:true,
     actualPhysicalAndroidIPhone:false,viewportCSSWidth:390,
     authenticSourceJPEG:true,realOriginalWebGLBones:163,
     hiddenEventClosedSourceBeforeStateRead:true,
     hiddenOpenBlocked:true,sourceReopenPassedActualNATIVE92OriginalBytes:true,
     freezeEventClosedSourceBeforeStateRead:true,
     originalOwnerSavedOutfitUnchanged:true,signedOwnerStillActive:true,
     originalPhotographsInArtifacts:false,
     screenshots:[
      {file:'background-source-revoked-390.png',sha256:digest(background),
       width:bgMeta.width,height:bgMeta.height},
      {file:'freeze-source-revoked-390.png',sha256:digest(freezePng),
       width:freezeMeta.width,height:freezeMeta.height}
     ],
     realSignedCloudRLS:false,releaseAuthorized:false,familyAlpha:'HOLD'
    },null,2)+'\n');
  }
  const denimEvidence176=[];
  if(photoTorso173){
   // THE ACTUAL saved owner shirt from the consumer board, not a donor-created
   // fake selection. P171 and P173 must be present on the loaded P541 model.
   await page.evaluate(()=>window.native3D05Bridge.close());
   assert.deepEqual(await readBoard(page),ownerOriginal);
   await page.locator('#savedBoards button').nth(2).click();
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().selected),2);
   await page.locator('#native3D05Preview').click();
   await page.waitForFunction(()=>
    window.native3D05Bridge?.state().photoSourceTorso173===true ||
    document.getElementById('native3D05Status')?.textContent.includes('P173 original photographed shirt geometry unavailable'),
    null,{timeout:150000});
   if(photoSleeve174){
    const diagnostic=await page.evaluate(()=>({
     source:window.native3D05Bridge?.state(),
     message:document.getElementById('native3D05Status')?.textContent||'',
     donor:document.getElementById('outfit3D01Status')?.textContent||''
    }));
    console.log('P174_NATIVE_SOURCE_BOOT_DIAGNOSTIC',JSON.stringify(diagnostic));
    assert.equal(diagnostic.source?.photoSourceTorso173,true,
     'P174 upstream physical 163-bone source or panel failed before sleeve evidence: '+JSON.stringify(diagnostic));
    // P174 must be admitted by the ACTUAL saved owner source original
    // skinned P172+P173, NEVER a toy detached generic glTF garment.
    await page.waitForFunction(()=>
     window.native3D05Bridge?.state().photoSourceShoulder174===true||
     document.getElementById('native3D05Status')?.textContent.includes('P174 exact original photographed shoulder seam fit unavailable'),
     null,{timeout:30000});
   }
   const shirtState=await page.evaluate(()=>window.native3D05Bridge.state());
   if(photoSleeve174){
    const status174=await page.evaluate(()=>
     document.getElementById('native3D05Status')?.textContent||'no P174 source');
    assert.equal(shirtState.photoSourceShoulder174,true,
     'P174 requires real bilateral source shoulder/cap mesh deformation: '+status174);
    assert.equal(shirtState.photoSourceTorso173,true);
    assert.ok(shirtState.shoulderMovedVertices174>=40);
    assert.ok(shirtState.shoulderMaxMeters174>=.0025&&
     shirtState.shoulderMaxMeters174<=.00961);
    assert.equal(shirtState.bones,163);
   }
   const fitStatus=await page.evaluate(()=>
    document.getElementById('native3D05Status')?.textContent||'no source-fit status');
   assert.equal(shirtState.photoSourceTorso173,true,
    'P173 actual native owner shirt source geometry missing: '+fitStatus);
   assert.equal(shirtState.photoSourceFit171,true);
   assert.equal(shirtState.viewerMode,'shirt');
   assert.equal(shirtState.bones,163);
   assert.ok(shirtState.physicalShirtVertices173>30,
    'Must physically reshape original skinned mesh, not a shader or screenshot');
   assert.ok(shirtState.physicalShirtMaxMoveMeters173>=.006&&
    shirtState.physicalShirtMaxMoveMeters173<=.0201);
   assert.equal(shirtState.ownerPhoto3DArbitraryFittingApproved,false);
   assert.equal(shirtState.photorealismApproved,false);
   assert.equal(await page.locator('#outfit3D01Photos img').count(),1,
    'Actual signed owner photographed shirt must remain visible');
   assert.equal(await page.locator('#outfit3D01Save').isDisabled(),true);
   await page.locator('#outfit3D01Front').click();
   await take(page,width,'06-owner-physical-shirt-front');
   await page.locator('#outfit3D01Side').click();
   await take(page,width,'07-owner-physical-shirt-side');
   await page.locator('#outfit3D01Back').click();
   await take(page,width,'08-owner-shirt-neutral-inferred-rear');
   assert.deepEqual(await readBoard(page),ownerOriginal);
   await page.evaluate(()=>window.native3D05Bridge.close());
   assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().photoSourceTorso173),false);
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true);
   await page.locator('#savedBoards button').first().click();
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().selected),0);
  }
  if(photoDenim176){
   await page.evaluate(()=>window.native3D05Bridge.close());
   assert.deepEqual(await readBoard(page),ownerOriginal);
   await page.locator('#savedBoards button').nth(3).click();
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().selected),3);
   const pairSources=await page.evaluate(()=>window.nativeLossless04Bridge.readOnlyGarmentSources91(
    ['native05-A-shirt','native05-A-jeans']));
   assert.equal(pairSources.ownerId,'native05-A');
   assert.deepEqual(pairSources.sources.map(x=>x.sha256),[
    'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
    'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c']);
   await page.locator('#native3D05Preview').click();
   await page.waitForFunction(()=>window.native3D05Bridge?.state().modelReady||
    document.getElementById('native3D05Status')?.textContent.includes('3D not available'),
    null,{timeout:60000});
   const pairState=await page.evaluate(()=>window.native3D05Bridge.state());
   const pairDiagnostic=await page.evaluate(()=>({outer:document.getElementById('native3D05Status')?.textContent||'',
    inner:document.getElementById('outfit3D01Status')?.textContent||'',
    state:window.native3D05Bridge.state(),skinAudit:window.__P176SkinAudits176||null,board:window.nativeLossless04Bridge.status()}));
   console.log('P176_SAVED_DENIM_PAIR_DIAGNOSTIC',JSON.stringify(pairDiagnostic));
   assert.equal(pairState.modelReady,true,'P176 donor viewer did not become ready: '+JSON.stringify(pairDiagnostic));
   const pairAdmission=inspectSavedShirtDenim176({selection:{ownerId:'native05-A',slots:{top:'native05-A-shirt',bottom:'native05-A-jeans'}},sources:pairSources,proofs:{p171:pairState.photoSourceFit171,p173:pairState.photoSourceTorso173,p174:pairState.photoSourceShoulder174},render:{privateVisible:pairState.active,viewerReady:pairState.modelReady,bones:pairState.bones,viewerMode:pairState.viewerMode,meshCount:pairState.meshCount,fallbackCount:pairState.fallbackCount,productionDeployed:false,releaseAuthorized:false}});
   assert.equal(pairAdmission.admitted,true,pairAdmission.reason);
   assert.equal(pairState.photoSourceFit171,true);assert.equal(pairState.photoSourceTorso173,true);
   assert.equal(pairState.photoSourceShoulder174,true);assert.equal(pairState.viewerMode,'shirt-pants');
   assert.equal(pairState.bones,163);assert.ok(pairState.meshCount>=2);assert.equal(pairState.fallbackCount,0);
   assert.equal(await page.locator('#outfit3D01Photos img').count(),2);
   assert.equal(await page.locator('#outfit3D01Save').isDisabled(),true);
   assert.equal(await page.locator('#outfit3D01Delete').isDisabled(),true);
   const pairBefore=await readBoard(page),shots=[];
   for(const [stage,button] of [['front','Front'],['side','Side'],['rear','Back']]){
    await page.locator('#outfit3D01'+button).click();
    await take(page,width,'owner-shirt-denim-'+stage);shots.push(screens.at(-1));
   }
   assert.deepEqual(await readBoard(page),pairBefore,'Read-only source 3D preserves saved IDs and JPEGs');
   assert.deepEqual(pairBefore,ownerOriginal,'Opening two-piece WebGL may not write private board');
   denimEvidence176.push({width,ownerSavedPair:true,viewerMode:pairState.viewerMode,bones:pairState.bones,
    meshCount:pairState.meshCount,fallbackCount:pairState.fallbackCount,
    sourceSHA256:pairSources.sources.map(x=>x.sha256),screens:shots,
    originalPhotoIds:['commons-0003','commons-public-domain-jeans-2005'],
    physicsSimulation:false,bodyIntersectionAudit:false,physicalPhoneVerified:false});
   await page.evaluate(()=>window.native3D05Bridge.close());
   await page.locator('#savedBoards button').first().click();
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().selected),0);
   assert.deepEqual(await readBoard(page),ownerOriginal);
  }
  // Explicit scene close must NOT invalidate still-signed-in consumer editor.
  await page.evaluate(()=>window.native3D05Bridge.close());
  assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true);
  assert.deepEqual(await readBoard(page),ownerOriginal);
  // Unsaved edit must fail closed, rather than replacing source with a fake mesh.
  await page.locator('#boardSlots .board-slot-shoes').click();
  await page.locator('#boardPickerItems button').filter({hasText:'shoes'}).first().click().catch(()=>{});
  await page.evaluate(()=>window.nativeLossless04Bridge.setField('name','unsaved 3D prohibited'));
  await assert.rejects(page.evaluate(()=>window.native3D05Bridge.open()),
    /Save or cancel unsaved outfit/);
  assert.deepEqual(await readBoard(page),ownerOriginal);
  await page.evaluate(()=>window.nativeLossless04Bridge.cancel());
  await page.locator('details.account-menu > summary').click();
  await page.locator('#logout').click();
  await page.waitForFunction(()=>window.closetAuth?.user===null&&
   document.getElementById('authGate')?.hidden===false);
  assert.equal(await page.locator('#outfit3D01Photos img').count(),0);
  assert.equal(await page.evaluate(()=>!window.native3D05Bridge||!window.native3D05Bridge.state().active),true,
   'Native logout may destroy the whole research bridge or leave it revoked');
  // Session B cannot inherit A preview, owner IDs, or original photo URLs.
  await login(page,'native05-B');
  await seed(page,'native05-B');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.nativeLossless04Bridge?.status()?.active&&
   !!window.native3D05Bridge,{timeout:30000});
  await page.evaluate(()=>switchView('builder'));
  const bStored=await readBoard(page);
  assert.equal(bStored.saved[0].outfit3dId,'native05-B-verified-dress-3D');
  assert.equal(await page.locator('#savedBoards').textContent().then(t=>t.includes('native05-A')),false);
  await page.locator('#savedBoards button').nth(1).click();
  assert.equal(await page.locator('#boardSlots .board-slot-bottom').textContent().then(
   t=>t.includes('Missing saved clothing')),true);
  await take(page,width,'05-B-private-missing-source-fallback');
  assert.deepEqual(await readBoard(page),bStored);
  cases.push({width,realNativeBuilder:true,exactSourceDonorPR541:true,
   ...(native88?{staleSelectionBlocked88:width===390?staleSelectionBlocked88:'not-tested-in-this-viewport'}:{}),
   authenticPhotoSourcedDress3D:true,
   ...(photoTorso173?{actualSignedOwnerSourceShirtPhysicallyContoured173:true}:{}),
   ...(photoSleeve174?{actualSignedOwnerBilateralShoulderSeamPhysicallyEased174:true}:{}),
   ...(photoDress175?{actualSignedOwnerPhotographedDressPhysicallyReshaped175:true}:{}),...(photoDenim176?{actualNativeOwnerSavedPhotoShirtAndDenimPair176:true}:{}),
   bones:163,renderedGenuineMeshes:state.meshCount,
   nonVettedCoatJacketShoesPhotoFallback:true,readOnlyDonorActions:true,
   noOutfitMutation:true,unsavedEditsBlocked:true,
   sessionLogoutClears3D:true,consumerStillActiveAfterViewerClose:true,
   ...(native89?{liveSourceRevocation89:width===390?'verified':'not-tested-in-this-viewport'}:{}),
   ...(native91?{sameGarmentIdPhotoSourceRevision91:width===390?'verified':'not-tested-in-this-viewport'}:{}),
   ...(native92?{tamperedOriginalJPEGBlocked92:width===390?tamperedOriginalBlocked92:'not-tested-in-this-viewport'}:{}),
   ...(native93?{postOpenUnchangedSHASourceRevoked93:width===390?'verified':'not-tested-in-this-viewport'}:{}),
   ...(native102?{mobileVisibilitySourceRevoked102:width===390?'verified-in-Chromium-lifecycle-simulation':'not-tested-in-this-viewport'}:{}),
   separateAccountBPrivate:true,missingIDsRetained:true,
   physicalPhoneApproved:false,liveSignedRLS:false,releaseAuthorized:false,
   familyAlpha:'HOLD'});
  await page.close();await ctx.close();
  await browser.close();browser=null;
 }
 assert.equal(crashes.length,0,'No real WebGL viewport may crash');
 assert.equal(cases.length,3);assert.equal(screens.length,(photoTorso173?24:15)+(photoDenim176?9:0));if(photoDenim176)assert.equal(denimEvidence176.length,3);
 assert.deepEqual(errors,[]);
 assert.deepEqual(external.filter(x=>x.method!=='GET'),[]);
 for(const entry of screens)assert.equal(digest(await readFile(dir+'/'+entry.name)),entry.sha256);
 const result={priority:'NATIVE-3D-05',cases:3,screenshots:(photoTorso173?24:15)+(photoDenim176?9:0),denim176:photoDenim176?denimEvidence176:[],
  browser:'chromium',widths:[320,390,430],
  originalNativeAuthHTTPOnlyMocked:true,realWebGL:true,
  pinnedDonorSourceSHA:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
  realSignedRLS:false,originalUserSavedStateUnmodified:true,
  actual3DWithHonestUnsupportedPhotoFallback:true,
  physicalPhone:'NOT TESTED',familyAlpha:'HOLD',releaseAuthorized:false,
  evidence:cases,screens,errors,external,
  navigations,crashes,isolatedChromiumProcessPerWidth:true};
 await writeFile(dir+'/results.json',JSON.stringify(result,null,2));
 console.log('NATIVE05_BROWSER_3D_VERIFIED',JSON.stringify({cases:3,
   real163BoneWebGL:true,realMobileScreenshots:screens.length,familyAlpha:'HOLD'}));
}catch(error){
 await writeFile(dir+'/ERROR.json',JSON.stringify({
  message:String(error?.stack||error),cases:cases.length,
  screens:screens.length,errors,external,navigations,crashes},null,2));throw error;
}finally{
 await browser?.close();await new Promise(done=>server.close(done));
}
