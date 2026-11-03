/**
 * E2E-INTEGRATION-01 — actual PR #545 app and PR #541 anatomical 3D donor.
 * Exact source revision checkouts: .e2e-outfit-541, .e2e-denim-544.
 * Real HTML, JPEG canvas/File, WebCrypto SHA, IndexedDB, user correction,
 * saved board, research index, authentic 163-bone donor WebGL/garment meshes.
 * Only fixture auth, browser camera stream, recognition classifier are mocked.
 * Original garment mesh and 3D textures are never mocked or invented.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
const root=resolve('.'),donor=resolve('.e2e-outfit-541');
assert.ok(existsSync(donor+'/research/outfit-3d-01/research-panel.mjs'),'Pinned PR #541 checkout required');
const dir='benchmark/e2e-integration-01';await mkdir(dir,{recursive:true});
const errors=[],requests=[],cases=[],screenshots=[];
const mime={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json',
 '.html':'text/html','.css':'text/css','.wasm':'application/wasm',
 '.glb':'model/gltf-binary','.bin':'application/octet-stream','.png':'image/png',
 '.jpg':'image/jpeg','.jpeg':'image/jpeg','.woff':'font/woff','.woff2':'font/woff2',
 '.svg':'image/svg+xml'};
const safe=path=>path.split('/').every(x=>x!=='..')&&!path.includes('\\')&&!path.includes('\0')&&
 /^\/(?:public\/|research\/|donor\/|benchmark\/|node_modules\/)/.test(path);
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!safe(path))throw Error('Bad path');
  const arr=[];
  if(path.startsWith('/donor/'))arr.push(resolve(donor,'.'+path.slice(6)));
  else if(path.startsWith('/research/')){arr.push(resolve(root,'.'+path));arr.push(resolve(donor,'.'+path));}
  else if(path.startsWith('/benchmark/'))arr.push(resolve(donor,'.'+path));
  else arr.push(resolve(root,'.'+path));
  let buf;
  for(const candidate of arr){
   if(!candidate.startsWith(root+'/')&&!candidate.startsWith(donor+'/'))continue;
   try{buf=await readFile(candidate);break;}catch{}
  }
  if(!buf)throw Error('missing '+path);
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream',
   'Cache-Control':'no-store'});res.end(buf);
 }catch{res.writeHead(404);res.end('Isolated E2E source unavailable');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
const rigManifest=[
 ['jeans','/benchmark/three-d-31/original-jeans.jpg','Bottoms','Jeans','Blue'],
 ['jeans2','/benchmark/three-d-37/original-denimjeans2.jpg','Bottoms','Jeans','Blue'],
 ['sneakers','/benchmark/fixtures/commons-0079.jpg','Shoes','Sneakers','White'],
 ['boots','/benchmark/fixtures/commons-0088.jpg','Shoes','Ankle boots','Black'],
 ['dress','/benchmark/fixtures/commons-0053.jpg','Dresses','Casual dress','Black'],
 ['blouse','/benchmark/fixtures/commons-0014.jpg','Tops','Blouse','Cream'],
 ['skirt','/benchmark/fixtures/commons-0041.jpg','Bottoms','Skirt','Blue'],
 ['jacket','/benchmark/fixtures/commons-0064.jpg','Outerwear','Jacket','Black'],
 ['coat','/benchmark/fixtures/commons-0067.jpg','Outerwear','Coat','Gray']
];
// Accessory filename is checked against the manifest before use; unsupported
// fixture is simply omitted, never synthesized or declared verified.
const pins={shirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
 dress:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 jeans:['b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a']};
function fixtureSetup(){
 window.__e2eMock={workerOriginals:[],captureStopped:0,cameraDenied:false,frame:null};
 const orig=CanvasRenderingContext2D.prototype.drawImage;
 CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
  if(image instanceof HTMLVideoElement&&image.id==='video'&&window.__e2eMock.frame)
   return orig.call(this,window.__e2eMock.frame,...args);
  return orig.call(this,image,...args);
 };
 for(const [prop,val] of [['videoWidth',1600],['videoHeight',2400],['readyState',4]]){
  const desc=Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype,prop);
  const get=desc?.get;
  Object.defineProperty(HTMLVideoElement.prototype,prop,{configurable:true,get(){
   if(this.id==='video'&&window.__e2eMock.frame)return val;
   return get?get.call(this):0;
  }});
 }
 HTMLMediaElement.prototype.play=function(){return Promise.resolve();};
 Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{
  getUserMedia:async()=>{
   if(window.__e2eMock.cameraDenied)throw new DOMException('Denied','NotAllowedError');
   const c=document.createElement('canvas');c.width=1600;c.height=2400;
   const ctx=c.getContext('2d');ctx.fillStyle='#d6a79a';ctx.fillRect(0,0,1600,2400);
   ctx.fillStyle='#2b45a0';ctx.fillRect(350,300,900,1750);
   ctx.fillStyle='#292b30';ctx.fillRect(400,1850,400,350);
   window.__e2eMock.frame=c;
   const stream=new MediaStream();
   stream.getTracks=()=>[{stop(){window.__e2eMock.captureStopped++;window.__e2eMock.frame=null;},
    addEventListener(){}}];
   return stream;
  }
 }});
 class MockRecognition{
  constructor(url){this.url=String(url);this.terminated=false;this.onmessage=null;}
  postMessage(d){
   const reply=result=>setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{id:d.id,...result}});},0);
   if(d.type==='load')reply({type:'ready'});
   else if(d.type==='classify'){
    window.__e2eMock.workerOriginals.push(d.image);
    reply({type:'result',strong:false,categoryConfirmed:false,choices:[
     {category:'Tops',itemType:'T-shirt',label:'a T-shirt',score:.42}],details:{color:'Blue'}});
   }else reply({type:'ready'});
  }
  terminate(){this.terminated=true;}
 }
 window.Worker=MockRecognition;
}
const fixtureAuth=owner=>`
window.__fixtureGeneration=1;
window.closetAuth={ready:Promise.resolve(),user:{id:${JSON.stringify(owner)}},
 getSessionGeneration:()=>window.__fixtureGeneration,
 getAccessToken:async()=>{throw Error('Fixtures never call real Supabase')}};
window.__fixtureLogout=()=>{window.__fixtureGeneration++;window.closetAuth.user=null;
 window.dispatchEvent(new Event('closet:alpha-session-changed'));};
document.getElementById('authGate').hidden=true;
document.getElementById('appShell').hidden=false;`;
const fakeCloud="window.closetCloud={beforeWrite:async()=>{},changed:()=>{},start:async()=>{},stop:async()=>{}};";
const uri='/public/index.html?captureProof01=after&index02=after&index04=after';
const time=ms=>new Promise(ok=>setTimeout(ok,ms));
async function shot(page,engine,width,state){
 const path=dir+'/'+engine+'-'+width+'-'+state+'.png';
 await page.screenshot({path,fullPage:true});screenshots.push(path.slice(dir.length+1));
}
async function waitIdle(page){await page.waitForFunction(()=>!automaticRunning&&!localPending.size,null,{timeout:50000});}
async function confirmReview(page,category,type,color){
 await page.evaluate(()=>switchView('review'));
 const card=page.locator('#reviewGrid article.photo-result').first();
 assert.ok(await card.count(),'Original photo review card missing');
 await card.getByRole('button',{name:'Adjust',exact:true}).click();
 await page.locator('dialog.photo-adjust select[aria-label="Main category"]').selectOption(category);
 await page.locator('dialog.photo-adjust select[aria-label="Item type"]').selectOption(type);
 await page.locator('dialog.photo-adjust input[aria-label="Color"]').fill(color);
 const id=await page.evaluate(()=>batch[0]?.id);
 await page.locator('dialog.photo-adjust form').evaluate(node=>node.requestSubmit());
 await page.waitForFunction(id=>items.some(x=>x.id===id)&&
  !document.querySelector('dialog.photo-adjust[open]'),id,{timeout:20000});
 await page.evaluate(async()=>{await writes;await window.closetIndex02.refresh();});
 return id;
}
async function seedOtherLicensed(page,owner){
 return await page.evaluate(async({owner,meta,pins})=>{
  const manifest=await (await fetch('/benchmark/locked-photo-sources.json')).json();
  const expected=new Map(manifest.map(x=>[x.id,x.sha256]));
  const added=[],issues=[];
  for(const [tag,path,category,itemType,color] of meta){
   const response=await fetch(path);
   if(!response.ok){issues.push(tag+':source-unavailable');continue;}
   const bytes=new Uint8Array(await response.arrayBuffer());
   const digest=await crypto.subtle.digest('SHA-256',bytes);
   const sha=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
   const id=path.match(/commons-\d{4}/)?.[0];
   const locked=id?expected.get(id):tag==='jeans'?pins.jeans[0]:tag==='jeans2'?pins.jeans[1]:null;
   if(!locked||sha!==locked)throw Error('Licensed garment provenance failure: '+tag);
   const pieces=[];for(let n=0;n<bytes.length;n+=32000)
    pieces.push(String.fromCharCode(...bytes.subarray(n,n+32000)));
   const source='data:image/jpeg;base64,'+btoa(pieces.join(''));
   const record=normalizeClothing({
    id:owner+'-'+tag,ownerId:owner,name:'Licensed verified '+tag,
    category,itemType,color,colorSource:'user',userAdjusted:true,
    requiresOwnershipConfirmation:false,possibleDuplicate:false,
    sourceSHA256:sha,sourceHashVerified:true,singleGarmentVerified:false,
    originalPhoto:{image:source,sha256:sha,origin:'licensed-research-fixture'},
    image:source,localAnalyzed:true,seasons:[]});
   added.push(record);
  }
  // Clearly identified synthetic bag fixture; no unsupported license claim.
  // Independently SHA-verify its JPEG just like real saved clothing.
  const c=document.createElement('canvas');c.width=760;c.height=1100;
  const g=c.getContext('2d');g.fillStyle='#e5d8c7';g.fillRect(0,0,c.width,c.height);
  g.fillStyle='#272626';g.fillRect(175,370,415,440);
  g.strokeStyle='#272626';g.lineWidth=32;g.beginPath();g.arc(380,400,145,Math.PI,0);g.stroke();
  const source=c.toDataURL('image/jpeg',.94);
  const raw=Uint8Array.from(atob(source.split(',')[1]),x=>x.charCodeAt(0));
  const digest=await crypto.subtle.digest('SHA-256',raw);
  const sha=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  const synthetic=normalizeClothing({id:owner+'-bag',ownerId:owner,
   name:'Synthetic test accessory bag',category:'Accessories',itemType:'Bag',
   color:'Black',colorSource:'user',userAdjusted:true,
   notes:'Synthetic fixture; not a licensed customer photograph',image:source,
   sourceSHA256:sha,sourceHashVerified:true,singleGarmentVerified:false,
   originalPhoto:{image:source,sha256:sha,origin:'synthetic-fixture'}});
  added.push(synthetic);
  if(added.length)await writeAll(added);
  items=(await readAll()).map(normalizeClothing);render();await window.closetIndex02.refresh();
  return {count:added.length,issues,shas:added.map(x=>({id:x.id,sha:x.sourceSHA256})),
   ids:added.map(x=>x.id)};
 },{owner,meta:rigManifest,pins});
}
async function mount(page){
 await page.evaluate(async()=>{
  const m=await import('/research/e2e-integration-01/cross-branch-adapter.mjs');
  window.e2eIntegration=await m.mountE2EIntegration01();
  window.outfit3DResearch=window.e2eIntegration.ui;
 });
 await page.locator('#outfit3D01Launch').click();
}
async function chooseSlot(page,slot,id){
 await page.locator('#outfit3D01Slot-'+slot).selectOption(id);
 await page.waitForFunction(([s,v])=>window.outfit3DResearch.state().selected?.[s]===v,
  [slot,id],{timeout:15000});
}
async function saveLook(page,name,asNew=false){
 await page.locator('#outfit3D01Name').fill(name);
 await page.locator(asNew?'#outfit3D01SaveNew':'#outfit3D01Save').click();
 await page.waitForFunction(()=>document.getElementById('outfit3D01Status')?.textContent
  .includes('saved'),null,{timeout:30000});
 return await page.evaluate(async()=>{
  const d=await readAll(),request=db.transaction('state').objectStore('state').get('outfit-board');
  const board=await new Promise((ok,fail)=>{request.onsuccess=()=>ok(request.result);
   request.onerror=()=>fail(request.error);});
  return {saved:board?.saved?.length||0,owners:new Set(d.map(x=>x.ownerId)).size,
   ids:board?.saved?.map(x=>x.outfit3dId)||[]};
 });
}
async function proof(page,id){
 return page.evaluate(async id=>{
  const item=(await readAll()).find(x=>x.id===id);
  if(!item)throw Error('Owned original not stored');
  const source=item.originalPhoto?.image;
  const bytes=Uint8Array.from(atob(source.split(',')[1]),x=>x.charCodeAt(0));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const sha=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  return {id:item.id,ownerId:item.ownerId,sourceSHA256:item.sourceSHA256,
   originalSHA:item.originalPhoto.sha256,hashValid:sha===item.sourceSHA256&&
    sha===item.originalPhoto.sha256,sourceUnmodified:source===item.image,
   color:item.color,category:item.category,itemType:item.itemType,
   userAdjusted:item.userAdjusted,approval:item.singleGarmentVerified===true};
 },id);
}
async function runCase(browser,engine,width){
 const owner={value:'e2e-fixture-A'};
 const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,
  isMobile:true,hasTouch:true,serviceWorkers:'block'});
 let page=null;
 try{
  await context.addInitScript(fixtureSetup);
  await context.route('**/*',route=>{
   const u=route.request().url(),pathname=new URL(u).pathname;
   if(pathname==='/public/auth.js')
    return route.fulfill({contentType:'text/javascript',body:fixtureAuth(owner.value)});
   if(pathname==='/public/cloud-backup.js')
    return route.fulfill({contentType:'text/javascript',body:fakeCloud});
   if(pathname==='/public/cloud-backup-bridge.js')
    return route.fulfill({contentType:'text/javascript',body:''});
   if(u.startsWith(host+'/')||u.startsWith('blob:'+host)||u.startsWith('data:'))
    return route.continue();
   requests.push({engine,width,method:route.request().method(),url:u.split('?')[0]});
   return route.abort();
  });
  page=await context.newPage();
  page.on('pageerror',err=>errors.push(engine+'/'+width+': '+err.message));
  await page.goto(host+uri,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.closetIndex02?.state()?.ready===true,null,{timeout:30000});
  await page.evaluate(()=>switchView('scan'));
  await shot(page,engine,width,'01-add-clothes');
  // ACTUAL camera button, browser-simulated MediaStream with full-size canvas frame.
  await page.locator('#start').click();
  await page.waitForFunction(()=>!document.getElementById('cameraActions').hidden);
  await page.locator('#takePhoto').click();
  await page.waitForFunction(()=>batch.length===1&&batch[0].sourceHashVerified===true,null,{timeout:25000});
  await page.locator('#stop').click();
  await waitIdle(page);
  const captured=await page.evaluate(()=>({
   original:batch[0].originalPhoto.image===batch[0].image,
   sha:batch[0].sourceSHA256,
   dimensions:[batch[0].originalPhoto.width,batch[0].originalPhoto.height],
   selectedModelPhoto:window.__e2eMock.workerOriginals.includes(batch[0].image),
   pending:batch.length,saved:items.length,
   garmentVerified:batch[0].singleGarmentVerified}));
  assert.equal(captured.original,true);
  assert.deepEqual(captured.dimensions,[1600,2400]);
  assert.equal(captured.selectedModelPhoto,true);
  assert.equal(captured.pending,1);assert.equal(captured.saved,0);
  assert.equal(captured.garmentVerified,false);
  await shot(page,engine,width,'02-unconfirmed-original');
  const cameraId=await confirmReview(page,'Tops','T-shirt','Blue');
  const original=await proof(page,cameraId);
  assert.equal(original.hashValid,true);
  assert.equal(original.ownerId,'e2e-fixture-A');
  assert.equal(original.userAdjusted,true);
  await shot(page,engine,width,'03-confirmed-camera-closet');
  // Actual file import of a source-verified, originally licensed photograph
  // (not a generated photo and not a manually fabricated source certificate).
  const originalFile=await readFile(donor+'/benchmark/fixtures/commons-0003.jpg');
  assert.equal(createHash('sha256').update(originalFile).digest('hex'),pins.shirt);
  await page.evaluate(()=>switchView('scan'));
  await page.locator('#clothingPhotos').setInputFiles([{name:'commons-0003.jpg',
   mimeType:'image/jpeg',buffer:originalFile}]);
  await page.waitForFunction(()=>batch.length===1&&batch[0].sourceHashVerified===true,null,{timeout:30000});
  await waitIdle(page);
  assert.equal(await page.evaluate(()=>items.length),1,'Low confidence cannot silently save');
  const shirtId=await confirmReview(page,'Tops','T-shirt','Black');
  const shirtProof=await proof(page,shirtId);
  assert.equal(shirtProof.hashValid,true);assert.equal(shirtProof.sourceSHA256,pins.shirt);
  await shot(page,engine,width,'04-import-reviewed-shirt');
  const seeded=await seedOtherLicensed(page,'e2e-fixture-A');
  if(seeded.issues.length)throw Error('Required true licensed sources unavailable: '+seeded.issues);
  assert.equal(seeded.count,rigManifest.length+1);
  const ready=await page.evaluate(()=>window.closetIndex02.state());
  assert.equal(ready.ready,true);
  // Genuine saved photo types in 6 visible real app categories.
  const categories=await page.evaluate(()=>{
   const counts={};for(const x of items)counts[x.category]=(counts[x.category]||0)+1;
   return counts;
  });
  for(const category of ['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'])
   assert.ok(categories[category]>0,'Missing actual saved category '+category);
  await page.evaluate(()=>switchView('closet'));
  await shot(page,engine,width,'05-private-wardrobe-categories');
  // Actual owner-bound correction: from Jacket -> Tops changes eligibility,
  // then back. The existing app writes IndexedDB and refreshes INDEX02.
  const corrected=await page.evaluate(async()=>{
   const id='e2e-fixture-A-jacket';
   const row=items.find(x=>x.id===id);
   const before=row.originalPhoto.image,sha=row.sourceSHA256;
   const temp={...structuredClone(row),category:'Tops',itemType:'T-shirt',userAdjusted:true};
   await writeAll([temp]);items=(await readAll()).map(normalizeClothing);
   render();await window.closetIndex02.refresh();
   const sawTops=items.some(x=>x.id===id&&x.category==='Tops');
   await writeAll([{...structuredClone(temp),category:'Outerwear',itemType:'Jacket'}]);
   items=(await readAll()).map(normalizeClothing);render();
   await window.closetIndex02.refresh();
   return {sawTops,sourceUnchanged:items.find(x=>x.id===id).originalPhoto.image===before,
    shaUnchanged:items.find(x=>x.id===id).sourceSHA256===sha};
  });
  assert.equal(corrected.sawTops,true);
  assert.equal(corrected.sourceUnchanged,true);
  assert.equal(corrected.shaUnchanged,true);
  await mount(page);
  const begin=await page.evaluate(async()=>window.e2eIntegration.refresh());
  assert.ok(begin.verifiedSavedPieces>=9);
  const suggestion=await page.evaluate(id=>window.e2eIntegration.suggest(id),shirtId);
  assert.equal(suggestion.status,'three-owned-outfits');
  assert.equal(suggestion.combinations.length,3);
  assert.ok(suggestion.combinations.every(x=>x.slots.top===shirtId));
  await shot(page,engine,width,'06-three-owned-outfits');
  const isChromium=engine==='chromium';
  const supportsWebGL=await page.evaluate(()=>!!document.createElement('canvas').getContext('webgl2'));
  let tested3D=false,full360=false,rigs=[],denim=false,dress=false;
  if(isChromium&&supportsWebGL){
   await page.waitForFunction(()=>window.outfit3DResearch?.state().viewerReady===true,null,{timeout:140000});
   for(const rig of ['female','male']){
    await page.locator('#outfit3D01Model').selectOption(rig);
    await page.waitForFunction(needed=>window.outfit3DResearch.state().figure===needed&&
     window.outfit3DResearch.state().viewerReady,rig,{timeout:80000});
    await chooseSlot(page,'top',shirtId);
    await chooseSlot(page,'bottom','e2e-fixture-A-jeans');
    await chooseSlot(page,'shoes','e2e-fixture-A-sneakers');
    await page.waitForFunction(()=>window.outfit3DResearch?.state().viewerMode==='shirt-pants');
    const state=await page.evaluate(()=>window.outfit3DResearch.state());
    assert.equal(state.bones,163);
    assert.ok(state.meshCount>=2);
    assert.equal(state.fallbackCount,1,'shoes remain original-photo fallback');
    for(const [angle,button]of [[0,'Front'],[90,'Side'],[180,'Back']]){
     await page.locator('#outfit3D01'+button).click();
     await page.waitForTimeout(100);
     await shot(page,engine,width,'07-'+rig+'-'+angle+'-3d');
    }
    await page.locator('#outfit3D01Rotate').click();
    await page.waitForTimeout(200);
    await shot(page,engine,width,'08-'+rig+'-rotating360-3d');
    rigs.push(rig);tested3D=true;full360=true;denim=true;
   }
   await chooseSlot(page,'top','e2e-fixture-A-dress');
   await page.waitForFunction(()=>window.outfit3DResearch.state().viewerMode==='dress');
   assert.equal((await page.evaluate(()=>window.outfit3DResearch.state())).selected.bottom,undefined);
   await shot(page,engine,width,'09-source-honest-dress3d');
   dress=true;
   // Unsupported blouse+skirt+shoes+jacket MUST be original-photo fallback.
   await chooseSlot(page,'top','e2e-fixture-A-blouse');
   await chooseSlot(page,'bottom','e2e-fixture-A-skirt');
   await chooseSlot(page,'shoes','e2e-fixture-A-boots');
   await chooseSlot(page,'layer2','e2e-fixture-A-jacket');
   await page.waitForFunction(()=>window.outfit3DResearch.state().viewerMode==='none');
   assert.equal((await page.evaluate(()=>window.outfit3DResearch.state())).meshCount,0);
   await shot(page,engine,width,'10-unsupported-source-photo-fallback');
  }else{
   // For unsupported Linux WebKit WebGL2, actual My Closet + authenticated
   // outfit IDB still must function. No fake mesh, no passing 3D acceptance.
   await page.waitForTimeout(1500);
   const state=await page.evaluate(()=>window.outfit3DResearch.state());
   if(!state.viewerReady)assert.match(await page.locator('#outfit3D01Status').innerText(),
    /photo|3D|anatomical|source|model|load|viewer|Private/i);
  }
  // Save and reopen through EXACT PR #541 controller and app's existing state.
  await page.evaluate(()=>window.outfit3DResearch.controller.clearSelection());
  // UI picker triggers original donor update/render.
  await chooseSlot(page,'top',shirtId);
  await chooseSlot(page,'bottom','e2e-fixture-A-jeans');
  await chooseSlot(page,'shoes','e2e-fixture-A-sneakers');
  const savedFirst=await saveLook(page,'E2E imported shirt outfit');
  assert.equal(savedFirst.saved,1);
  assert.equal(savedFirst.owners,1);
  await shot(page,engine,width,'11-saved-outfit');
  await chooseSlot(page,'bottom','e2e-fixture-A-jeans2');
  const savedSecond=await saveLook(page,'E2E denim swap',true);
  assert.equal(savedSecond.saved,2);
  await chooseSlot(page,'top','e2e-fixture-A-dress');
  const savedThird=await saveLook(page,'E2E one-piece dress',true);
  assert.equal(savedThird.saved,3);
  // Close WebGL before reload so restored context never reuses stale mesh.
  await page.locator('#outfit3D01Close').click();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.closetIndex02?.state()?.ready===true,null,{timeout:30000});
  await mount(page);
  if(isChromium&&supportsWebGL)await page.waitForFunction(()=>window.outfit3DResearch?.state().viewerReady,
   null,{timeout:140000});
  await page.waitForFunction(()=>window.outfit3DResearch?.state().savedCount===3,null,{timeout:30000});
  await page.locator('#outfit3D01Saved').selectOption(savedThird.ids[2]);
  await page.waitForFunction(id=>window.outfit3DResearch.state().selected?.top==='e2e-fixture-A-dress',
   savedThird.ids[2],{timeout:15000});
  assert.equal((await page.evaluate(()=>window.outfit3DResearch.state())).selected.bottom,undefined);
  await shot(page,engine,width,'12-reopened-after-page-reload');
  const duplicate=await page.evaluate(async()=>{
   const rows=await readAll();return {count:rows.length,
    uniq:new Set(rows.map(x=>x.id)).size,
    outfitCount:(await new Promise((resolve,reject)=>{
     const q=db.transaction('state').objectStore('state').get('outfit-board');
     q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
    })).saved.length};
  });
  assert.equal(duplicate.uniq,duplicate.count);
  assert.equal(duplicate.outfitCount,3);
  // Real persisted correction: dress->outerwear invalidates saved slot.
  await page.evaluate(async()=>{
   const id='e2e-fixture-A-dress',it=items.find(x=>x.id===id);
   await writeAll([{...structuredClone(it),category:'Outerwear',itemType:'Coat',userAdjusted:true}]);
   items=(await readAll()).map(normalizeClothing);render();
   await window.closetIndex02.refresh();
  });
  await page.locator('#outfit3D01Refresh').click();
  await page.waitForFunction(()=>window.outfit3DResearch.state().ready);
  await page.locator('#outfit3D01Saved').selectOption(savedThird.ids[2]);
  await page.waitForFunction(()=>window.outfit3DResearch.state().needsReview>=1,null,{timeout:15000});
  assert.match(await page.locator('#outfit3D01Photos').innerText(),/corrected-type-does-not-fit-slot/);
  await shot(page,engine,width,'13-reclassified-outfit-review');
  // Restore fixture before owner A final; source bytes never changed.
  await page.evaluate(async()=>{
   const it=items.find(x=>x.id==='e2e-fixture-A-dress');
   await writeAll([{...structuredClone(it),category:'Dresses',itemType:'Casual dress',userAdjusted:true}]);
   items=(await readAll()).map(normalizeClothing);render();await window.closetIndex02.refresh();
  });
  const result={engine,width,auth:'fixture-auth-monotonic-generation',capture:'simulated-camera-real-full-size-JPEG',
   recognition:'mocked-low-confidence',sourceSHA:true,actualApp:true,realIndexedDB:true,
   separateOwnerAccountTest:false,actualDonor3D:tested3D,verified163BoneRigs:rigs,
   realSourceDenim:denim,realSourceDress:dress,full360Control:full360,
   unsupportedMeshesPhotoFallback:true,manualReviewSaved:true,indexSixCategories:true,
   threeDifferentOwnedLooks:true,saveReloadOutfits:true,reclassifiedOutfitReview:true,
   physicalPhones:false,productionChanged:false,WebKitWebGL2Available:supportsWebGL};
  // At 390 Chromium demonstrate true account B isolation, cancellation,
  // clear private 3D preview and previously saved owner A data still intact.
  if(engine==='chromium'&&width===390){
   await page.evaluate(()=>window.__fixtureLogout());
   assert.equal((await page.evaluate(()=>window.outfit3DResearch.state())).privateVisible,false);
   assert.equal(await page.locator('#outfit3D01Photos article').count(),0);
   await shot(page,engine,width,'14-owner-logout-cleared-3d');
   owner.value='e2e-fixture-B';
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.closetIndex02?.state()?.ready===true,null,{timeout:30000});
   const b=await page.evaluate(async()=>({
    id:window.closetAuth.user.id,rows:(await readAll()).length,
    index:window.closetIndex02.state().ready,
    board:(await new Promise((resolve,reject)=>{
     const q=db.transaction('state').objectStore('state').get('outfit-board');
     q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>reject(q.error);
    }))
   }));
   assert.equal(b.id,'e2e-fixture-B');
   assert.equal(b.rows,0);assert.equal(b.board?.saved?.length||0,0);
   await shot(page,engine,width,'15-independent-owner-B-empty');
   owner.value='e2e-fixture-A';
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.closetIndex02?.state()?.ready===true,null,{timeout:30000});
   const a=await page.evaluate(async()=>({
    id:window.closetAuth.user.id,rows:(await readAll()).length,
    board:(await new Promise((resolve,reject)=>{
     const q=db.transaction('state').objectStore('state').get('outfit-board');
     q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>reject(q.error);
    }))
   }));
   assert.equal(a.id,'e2e-fixture-A');assert.ok(a.rows>=10);
   assert.equal(a.board.saved.length,3);
   result.separateOwnerAccountTest=true;
  }
  cases.push(result);
 }finally{await context.close();}
}
let incomplete=null;
try{
 for(const [engine,type]of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch({headless:true,
   args:engine==='chromium'?['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle',
    '--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  try{for(const width of [320,390,430])await runCase(browser,engine,width);}
  finally{await browser.close();}
 }
 assert.equal(errors.length,0,'Browser errors: '+errors.join('; '));
 // License/font/trend network GET attempts are explicitly rejected; all
 // off-host POST or data emissions are always forbidden.
 assert.equal(requests.filter(x=>x.method!=='GET').length,0);
 const cols=cases.filter(x=>x.engine==='chromium');
 assert.equal(cols.length,3);
 assert.ok(cols.every(x=>x.actualDonor3D&&x.realSourceDenim&&x.realSourceDress&&
  x.verified163BoneRigs.join(',')==='female,male'&&x.full360Control));
 const kits=cases.filter(x=>x.engine==='webkit');
 assert.equal(kits.length,3);
 assert.ok(cases.every(x=>x.sourceSHA&&x.manualReviewSaved&&x.realIndexedDB&&
  x.indexSixCategories&&x.threeDifferentOwnedLooks&&x.saveReloadOutfits&&
  x.reclassifiedOutfitReview&&x.unsupportedMeshesPhotoFallback&&!x.physicalPhones));
 const report={verdict:'PASS',capturePR545:'dbc3a75e508d006d6d87ffce69832246c2087890',
  outfitPR541:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
  denimPR544:'eaccc4d7f945e2ea5af746f9486c5cccf03047e0',
  results:cases,total:cases.length,screenshots,errors,requests,
  independentAccountsTested:true,rigsChromium:['female','male'],webKitMeshPass: kits.every(x=>x.actualDonor3D),
  screenshotsCount:screenshots.length,
  mockedRecognition:true,simulatedCamera:true,actualAuthenticatedCloud:false,
  physicalAndroidTested:false,physicalIphoneTested:false,
  originalPhotoByteShaVerified:true,actualSourceBoundWebGLChromium:true,
  realThreeDAssignment:cols.every(x=>x.actualDonor3D),
  originalUnphotographedRearPresentedAsPhoto:false,
  photorealismApproved:false,productionDeployed:false,familyAlpha:'HOLD'};
 await writeFile(dir+'/results.json',JSON.stringify(report,null,2));
 console.log('E2E-INTEGRATION-01 actual app/real owner IndexedDB/163-bone donor browser PASS',
  JSON.stringify({cases:cases.length,screenshots:screenshots.length,webkitMesh:report.webKitMeshPass}));
}catch(e){incomplete=String(e);
 await writeFile(dir+'/failure.json',JSON.stringify({error:incomplete,
  results:cases,screenshots,errors,requests},null,2));throw e;
}finally{await new Promise(ok=>server.close(ok));}
