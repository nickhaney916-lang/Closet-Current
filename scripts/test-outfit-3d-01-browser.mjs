/**
 * OUTFIT-3D-01: actual EXISTING signed-in app HTML + account-scoped IndexedDB;
 * original licensed JPEG records; existing authentic 163-bone male/female GLB
 * and genuine original-source dress/denim/shirt independent skinned mesh viewer.
 *
 * 320/390/430 actual Chromium WebGL, not Android/iPhone physical acceptance.
 * Source-only research: zero real user auth credentials, production changes or
 * uploads. Fixtures represent two test owners, NOT anyone's real wardrobe.
 */
import {chromium} from 'playwright';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('.'),folder='benchmark/outfit-3d-01',errors=[],offHost=[],leakedExternalPosts=[],cases=[],reports=[];
await mkdir(folder,{recursive:true});
const contentTypes={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.css':'text/css','.json':'application/json','.bin':'application/octet-stream',
 '.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),path=decodeURIComponent(url.pathname);
  if(path.split('/').includes('..')||path.includes('\\')||path.includes('\0')||
   !/^\/(public\/|research\/|benchmark\/|node_modules\/)/.test(path))throw Error('Unsafe test path');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/'))throw Error('Unsafe directory');
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':contentTypes[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Test source unavailable');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const host='http://127.0.0.1:'+server.address().port;
const M=[
 ['t','/benchmark/fixtures/commons-0003.jpg','Tops','T-shirt','Black'],
 ['jeans','/benchmark/three-d-31/original-jeans.jpg','Bottoms','Jeans','Blue'],
 ['jeans2','/benchmark/three-d-37/original-denimjeans2.jpg','Bottoms','Jeans','Blue'],
 ['shorts','/benchmark/fixtures/commons-0033.jpg','Bottoms','Shorts','Brown'],
 ['sneaker','/benchmark/fixtures/commons-0079.jpg','Shoes','Sneakers','White'],
 ['boot','/benchmark/fixtures/commons-0088.jpg','Shoes','Ankle boots','Black'],
 ['blouse','/benchmark/fixtures/commons-0014.jpg','Tops','Blouse','Cream'],
 ['skirt','/benchmark/fixtures/commons-0041.jpg','Bottoms','Skirt','Blue'],
 ['dress','/benchmark/fixtures/commons-0053.jpg','Dresses','Casual dress','Black'],
 ['jacket','/benchmark/fixtures/commons-0064.jpg','Outerwear','Jacket','Black'],
 ['coat','/benchmark/fixtures/commons-0067.jpg','Outerwear','Coat','Gray']
];
const PINS={
 dress:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 shirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
 denim:['b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a']
};
const allSources={};
let browser;
async function jpegPixelProof(buffer,{denim=false,expectMode='none'}={}){
 const {data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});
 let nonNeutral=0,denimBlue=0,anatomicalSilhouette=0,darkOriginalDressPixels=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const i=(y*info.width+x)*3,[r,g,b]=[data[i],data[i+1],data[i+2]];
  const contrast=Math.max(r,g,b)-Math.min(r,g,b);
  if(contrast>24)nonNeutral++;
  if(b-r>24&&b-g>13&&g-r>8&&r>15)denimBlue++;
  // Licensed Commons 0053 dress is genuinely BLACK with WHITE trim; requiring
  // chromatic pixels would reject real, correctly displayed original fabric.
  if(expectMode==='dress'&&x>info.width*.22&&x<info.width*.78&&
    y>info.height*.2&&y<info.height*.8&&(r+g+b)/3<112)darkOriginalDressPixels++;
  // On intentionally unsupported all-photo outfits, no garment-color
  // mesh exists. Still require a visible neutral anatomical human, not a
  // blank background or a fake colored clothing mesh.
  if(x>info.width*.18&&x<info.width*.82&&
    y>info.height*.1&&y<info.height*.72&&
    (r+g+b)/3<220&&contrast<28)anatomicalSilhouette++;
 }
 if(expectMode==='none')
  assert.ok(anatomicalSilhouette>=300,
   'Real neutral 163-bone humanoid silhouette required with photo-only outfit');
 else if(expectMode==='dress')
  assert.ok(darkOriginalDressPixels>=1200,
   'Real source-verified BLACK photographed dress fabric required, not an empty mannequin');
 else assert.ok(nonNeutral>=300,
   'Photographed colored skinned garment must visibly retain source pixels');
 if(denim)assert.ok(denimBlue>=500,'Source photographed denim should be visibly blue');
 return {nonNeutral,denimBlue,anatomicalSilhouette,darkOriginalDressPixels,width:info.width,height:info.height};
}
async function capture(page,{width,rig,label,angle=0,expectMode='none',denim=false}){
 const box=page.locator('#outfit3D01Canvas'),rect=await box.boundingBox();
 assert.ok(rect&&rect.width>=205&&rect.x>=-1&&rect.x+rect.width<=width+1,'Actual WebGL canvas clipped horizontally');
 await page.evaluate(a=>{
  const ui=window.outfit3DResearch;const state=ui?.state();
  if(!state?.viewerReady)throw Error('Anatomical renderer not ready to rotate');
  const button=a===0?'Front':a===90?'Side':a===180?'Back':null;
  if(button)document.getElementById('outfit3D01'+button).click();
 },angle);
 await page.waitForTimeout(90);
 const d=await page.evaluate(()=>window.outfit3DResearch.state());
 assert.equal(d.bones,163);
 assert.equal(d.viewerReady,true);
 assert.equal(d.figure,rig);
 assert.equal(d.viewerMode,expectMode,'Outfit renderer must not invent unsupported mesh');
 assert.ok(d.frames>=4,'Actual WebGL2 frame rendering required');
 const dimensions=await page.evaluate(()=>({
  width:innerWidth,scroll:document.documentElement.scrollWidth,
  gl:document.querySelector('#outfit3D01Canvas').getContext('webgl2')!==null,
  status:document.querySelector('#outfit3D01Status')?.textContent
 }));
 assert.equal(dimensions.gl,true);
 assert.ok(dimensions.scroll<=width+2,'App horizontal overflow');
 const img=await box.screenshot();
 const file=width+'-'+rig+'-'+label+'-angle-'+angle+'.png';
 await writeFile(folder+'/'+file,img); // Preserve genuine failure frame before pixel gates.
 const pixel=await jpegPixelProof(img,{denim,expectMode});
 cases.push({width,rig,label,angle,screenshot:file,bones:d.bones,
  mode:d.viewerMode,meshes:d.meshCount,geometries:d.geometries,textures:d.textures,
  realWebGL:true,mobileWidthFits:true,sourceHonest:true,verifiedPhotoSHA:true,
  accountPrivate:true,physicalPhoneApproval:false,pixel});
 return d;
}
function assertPrivatelyRendered(page){
 return page.evaluate(()=>{
  const photos=[...document.querySelectorAll('#outfit3D01Photos img')];
  return {count:photos.length,allOriginal:photos.every(img=>img.src.startsWith('data:image/jpeg;base64,')),
   labels:[...document.querySelectorAll('#outfit3D01Photos .cc3d-photo')].map(x=>x.textContent)};
 });
}
async function fill(page,slot,value){
 await page.locator('#outfit3D01Slot-'+slot).selectOption(value);
 await page.waitForFunction(([slot,id])=>window.outfit3DResearch?.state().selected?.[slot]===id,
  [slot,value],{timeout:40000});
}
async function waitMode(page,mode){
 try{
  await page.waitForFunction(expected=>{
   const state=window.outfit3DResearch?.state();
   return state?.viewerReady===true&&state.viewerMode===expected;
  },mode,{timeout:70000});
 }catch(error){
  const diagnostics=await page.evaluate(()=>({
   status:document.getElementById('outfit3D01Status')?.textContent,
   state:window.outfit3DResearch?.state(),
   note:document.getElementById('outfit3D01Note')?.textContent
  }));
  throw Error('Authentic 3D mode '+mode+' failed: '+JSON.stringify(diagnostics)+'; '+error.message);
 }
}
async function seed(page,owner,meta){
 const output=await page.evaluate(async({owner,meta,pins})=>{
  const assets=await (await fetch('/benchmark/locked-photo-sources.json')).json();
  const locked=new Map(assets.map(x=>[x.id,x.sha256]));
  const decoded=[];
  for(const [id,photoPath,category,itemType,color]of meta){
   const response=await fetch(photoPath,{cache:'no-store'});
   if(!response.ok)throw Error('Genuine source not available: '+photoPath);
   const buffer=await response.arrayBuffer(),bytes=new Uint8Array(buffer);
   const digest=await crypto.subtle.digest('SHA-256',buffer);
   const sha=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
   let expected;
   if(photoPath.includes('commons-'))expected=locked.get(photoPath.match(/commons-\d{4}/)[0]);
   else if(photoPath.includes('three-d-31'))expected=pins.denim[0];
   else if(photoPath.includes('three-d-37'))expected=pins.denim[1];
   if(!expected||sha!==expected)throw Error('Original JPEG SHA mismatch: '+id);
   if(id==='t'&&sha!==pins.shirt||id==='dress'&&sha!==pins.dress)throw Error('Pinned garment SHA drift');
   const pieces=[];for(let i=0;i<bytes.length;i+=32768)pieces.push(String.fromCharCode(...bytes.subarray(i,i+32768)));
   const url='data:image/jpeg;base64,'+btoa(pieces.join(''));
   decoded.push({id:owner+'-'+id,ownerId:owner,name:'Saved '+id,category,itemType,color,
    colorSource:'user',userAdjusted:true,requiresOwnershipConfirmation:false,
    possibleDuplicate:false,sourceSHA256:sha,sourceHashVerified:true,singleGarmentVerified:true,
    originalPhoto:{image:url,sha256:sha},image:url,seasons:[],notes:'',
    brand:'',size:'',material:'',occasion:''});
  }
  const dbName='closet-current-user-'+owner;
  let db=await new Promise((resolve,reject)=>{
   const q=indexedDB.open(dbName,2);
   q.onupgradeneeded=()=>{for(const store of ['items','state'])if(!q.result.objectStoreNames.contains(store))
    q.result.createObjectStore(store,{keyPath:'id'});};
   q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
  });
  await new Promise((resolve,reject)=>{
   const tx=db.transaction('items','readwrite'),table=tx.objectStore('items');
   for(const record of decoded)table.put(record);
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });db.close();
  if(window.closetAuth?.user?.id===owner&&typeof window.render==='function'){
   // The live app still has its own in-memory snapshot: its existing logic
   // recognizes the same actual saved IndexedDB entries after refresh.
   items=decoded.map(normalizeClothing);render();
  }
  return {count:decoded.length,sources:decoded.map(x=>({id:x.id,sha:x.sourceSHA256})),
   originalsUnchanged:decoded.every(x=>x.image===x.originalPhoto.image)};
 },{owner,meta,pins:PINS});
 assert.equal(output.count,meta.length);assert.equal(output.originalsUnchanged,true);
 return output;
}
async function runWidth(width){
 let testOwner='qa-outfit-A';
 const context=await browser.newContext({viewport:{width,height:920},deviceScaleFactor:1,
  isMobile:true,hasTouch:true,serviceWorkers:'block'});
 try{
  const auth=()=>{const owner=testOwner;
   return "let generation=1;window.closetAuth={ready:Promise.resolve(),user:{id:'"+
    owner+"'},getSessionGeneration:()=>generation,getAccessToken:async()=>{throw Error('Test auth no network');}};"+
    "document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"+
    "window.__testLogout=()=>{generation++;window.closetAuth.user=null;window.dispatchEvent(new Event('closet:alpha-session-changed'));};";
  };
  await context.route('**/*',route=>{
   const u=route.request().url();
   if(u.startsWith(host+'/')||u.startsWith('blob:'+host)||u.startsWith('data:'))return route.continue();
   const x={url:u.split('?')[0],method:route.request().method(),
    bodyBytes:route.request().postData()?.length||0};
   offHost.push(x);
   if(x.method!=='GET'||x.bodyBytes>0)leakedExternalPosts.push(x);
   return route.abort();
  });
  await context.route('**/public/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:auth()}));
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push('width '+width+': '+e.message));
  await page.goto(host+'/public/index.html',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{await closetReady;await outfitBoardReady;});
  const a=await seed(page,'qa-outfit-A',M);
  allSources['A'+width]=a.sources;
  await page.locator('.tab[data-view="closet"]').click();
  await page.evaluate(async()=>{
   const mod=await import('/research/outfit-3d-01/research-panel.mjs');
   window.outfit3DResearch=await mod.mountOutfit3D01Research();
  });
  await page.locator('#outfit3D01Launch').click();
  try{await page.waitForFunction(()=>window.outfit3DResearch?.state().viewerReady===true,null,{timeout:140000});}
  catch(e){
   const diag=await page.evaluate(()=>({status:document.getElementById('outfit3D01Status')?.textContent,
    state:window.outfit3DResearch?.state()}));throw Error('Owner A 3D boot failed '+JSON.stringify(diag));
  }
  assert.equal((await page.evaluate(()=>window.outfit3DResearch.state())).bones,163);
  for(const rig of ['female','male']){
   if(rig==='male'){
    await page.locator('#outfit3D01Model').selectOption('male');
    await page.waitForFunction(()=>window.outfit3DResearch?.state().figure==='male'&&
     window.outfit3DResearch?.state().viewerReady,null,{timeout:70000});
   }
   await page.locator('#outfit3D01Clear').click();
   await page.waitForFunction(()=>Object.keys(window.outfit3DResearch.state().selected||{}).length===0);
   // A: genuinely saved original T-shirt + source-true photographed denim,
   // private original sneakers; shoes are never misrepresented as a 3D mesh.
   await fill(page,'top','qa-outfit-A-t');
   await fill(page,'bottom','qa-outfit-A-jeans');
   await fill(page,'shoes','qa-outfit-A-sneaker');
   await waitMode(page,'shirt-pants');
   let state=await page.evaluate(()=>window.outfit3DResearch.state());
   assert.ok(state.meshCount>=2);
   assert.equal(state.fallbackCount,1);
   const originalA=await assertPrivatelyRendered(page);
   assert.equal(originalA.count,3);assert.equal(originalA.allOriginal,true);
   for(const angle of [0,90,180])await capture(page,{width,rig,label:'A-shirt-jeans-sneakers',angle,expectMode:'shirt-pants',denim:true});
   if(rig==='female'){
    // No mannequin reloading for changes to shoes or same partial photo references.
    const loads=state.modelLoads,renderCalls=state.renderCalls;
    await fill(page,'shoes','qa-outfit-A-boot');await waitMode(page,'shirt-pants');
    state=await page.evaluate(()=>window.outfit3DResearch.state());
    assert.equal(state.modelLoads,loads);assert.equal(state.renderCalls,renderCalls);
    await fill(page,'shoes','qa-outfit-A-sneaker');
    const mem=[];
    for(let k=0;k<8;k++){
     await fill(page,'bottom',k%2?'qa-outfit-A-jeans':'qa-outfit-A-jeans2');
     await waitMode(page,'shirt-pants');
     mem.push(await page.evaluate(()=>window.outfit3DResearch.state()));
    }
    assert.ok(mem.every(x=>x.modelLoads===loads&&x.meshCount>=2));
    // Heap/mesh growth must stabilize rather than linearly accumulate.
    const warm=mem.slice(2);
    assert.ok(Math.max(...warm.map(x=>x.geometries))-Math.min(...warm.map(x=>x.geometries))<=25,
     'Repeated real source denim swaps must free old geometry');
    await fill(page,'bottom','qa-outfit-A-shorts');await waitMode(page,'shirt');
    const after=await page.evaluate(()=>window.outfit3DResearch.state());
    assert.ok(after.meshCount<mem.at(-1).meshCount,'No stale jeans mesh after shorts swap');
    await fill(page,'bottom','qa-outfit-A-jeans');await waitMode(page,'shirt-pants');
    await page.locator('#outfit3D01Name').fill('A - originals');
    await page.locator('#outfit3D01Save').click();
    await page.waitForFunction(()=>window.outfit3DResearch.state().savedCount>=1,null,{timeout:30000});
   }
   // B: saved blouse + skirt + shoes + jacket, no fabricated 3D skirt/jacket.
   await fill(page,'top','qa-outfit-A-blouse');
   await fill(page,'bottom','qa-outfit-A-skirt');
   await fill(page,'shoes','qa-outfit-A-boot');
   await fill(page,'layer2','qa-outfit-A-jacket');
   await waitMode(page,'none');
   const B=await page.evaluate(()=>window.outfit3DResearch.state());
   assert.equal(B.meshCount,0);assert.equal(B.fallbackCount,4);
   await capture(page,{width,rig,label:'B-photo-only-blouse-skirt-jacket',angle:0,expectMode:'none'});
   if(rig==='female'){
    await page.locator('#outfit3D01Name').fill('B - photo fallback');
    await page.locator('#outfit3D01SaveNew').click();
    await page.waitForFunction(()=>window.outfit3DResearch.state().savedCount>=2);
   }
   // C: exact original photographed dress on real independent humanoid surface,
   // shoes & optional outerwear stay intact as original-photo references.
   await fill(page,'top','qa-outfit-A-dress');
   await waitMode(page,'dress');
   const C=await page.evaluate(()=>window.outfit3DResearch.state());
   assert.equal(C.selected.bottom,undefined);
   assert.equal(C.selected.layer2,'qa-outfit-A-jacket');
   assert.equal(C.selected.shoes,'qa-outfit-A-boot');
   assert.equal(C.fallbackCount,2);assert.ok(C.meshCount>=1);
   for(const angle of [0,90,180])await capture(page,{width,rig,label:'C-dress-shoes-outer',angle,expectMode:'dress'});
   if(rig==='female'){
    await page.locator('#outfit3D01Name').fill('C - original dress');
    await page.locator('#outfit3D01SaveNew').click();
    await page.waitForFunction(()=>window.outfit3DResearch.state().savedCount>=3);
    // Close and reopen with the *actual durable owner IndexedDB outfit board*.
    await page.locator('#outfit3D01Close').click();
    assert.equal((await page.evaluate(()=>window.outfit3DResearch.state())).privateVisible,false);
    await page.locator('#outfit3D01Launch').click();
    await page.waitForFunction(()=>window.outfit3DResearch?.state().viewerReady===true,null,{timeout:140000});
    const choose=await page.locator('#outfit3D01Saved option').allTextContents();
    assert.equal(choose.filter(x=>x.includes('C - original dress')).length,1);
    const id=await page.locator('#outfit3D01Saved option').filter({hasText:'C - original dress'}).getAttribute('value');
    await page.locator('#outfit3D01Saved').selectOption(id);
    await page.waitForFunction(()=>window.outfit3DResearch?.state().viewerMode==='dress'&&
     window.outfit3DResearch?.state().selected?.top==='qa-outfit-A-dress');
    assert.equal((await page.evaluate(()=>window.outfit3DResearch.state())).selected.layer2,'qa-outfit-A-jacket');
    await capture(page,{width,rig,label:'C-reopened-saved-original-dress',angle:0,expectMode:'dress'});
    // Save a replacement shoe on the reopened dress without creating a fourth
    // outfit; re-read the actual owner IndexedDB record and confirm it persists.
    await fill(page,'shoes','qa-outfit-A-sneaker');
    await page.locator('#outfit3D01Save').click();
    await page.waitForFunction(()=>document.getElementById('outfit3D01Status')?.textContent.includes('Outfit saved'));
    assert.equal((await page.evaluate(()=>window.outfit3DResearch.state())).savedCount,3);
    await page.locator('#outfit3D01Refresh').click();
    await page.waitForFunction(()=>window.outfit3DResearch.state().ready);
    await page.locator('#outfit3D01Saved').selectOption(id);
    await page.waitForFunction(()=>window.outfit3DResearch.state().selected?.shoes==='qa-outfit-A-sneaker');
    assert.equal((await page.evaluate(()=>window.outfit3DResearch.state())).selected.top,'qa-outfit-A-dress');

   }
  }
  // After both figures are tested, remove one saved item and prove that
  // reopening the existing outfit reports its exact missing ID, never substitutes.
  const aid=await page.locator('#outfit3D01Saved option').filter({hasText:'A - originals'}).getAttribute('value');
  await page.evaluate(async()=>{
   const open=indexedDB.open('closet-current-user-qa-outfit-A');
   const db=await new Promise((resolve,reject)=>{open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);});
   await new Promise((resolve,reject)=>{
    const tx=db.transaction('items','readwrite');tx.objectStore('items').delete('qa-outfit-A-jeans');
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
   });db.close();
  });
  await page.locator('#outfit3D01Refresh').click();
  await page.waitForFunction(()=>window.outfit3DResearch.state().ready);
  await page.locator('#outfit3D01Saved').selectOption(aid);
  await page.waitForFunction(()=>window.outfit3DResearch.state().missing===1);
  assert.ok((await page.locator('#outfit3D01Photos').innerText()).includes('deleted-saved-garment'));
  await page.locator('#outfit3D01Save').click();
  await page.waitForFunction(()=>document.getElementById('outfit3D01Status').textContent.includes('not saved'));
  // Original source files and unrelated saved items are never replaced.
  // Explicit sign-out must clear current private garment thumbnails and meshes.
  await page.evaluate(()=>window.__testLogout());
  assert.equal((await page.evaluate(()=>window.outfit3DResearch.state())).privateVisible,false);
  assert.equal(await page.locator('#outfit3D01Photos img').count(),0);
  testOwner='qa-outfit-B';
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{await closetReady;await outfitBoardReady;});
  await seed(page,'qa-outfit-B',M.filter(([id])=>['dress','boot'].includes(id)));
  await page.locator('.tab[data-view="closet"]').click();
  await page.evaluate(async()=>{
   const mod=await import('/research/outfit-3d-01/research-panel.mjs');
   window.outfit3DResearch=await mod.mountOutfit3D01Research();
  });
  await page.locator('#outfit3D01Launch').click();
  await page.waitForFunction(()=>window.outfit3DResearch?.state().ready===true);
  let privateB=await page.evaluate(()=>window.outfit3DResearch.state());
  assert.equal(privateB.savedCount,0);
  assert.equal(await page.locator('#outfit3D01Slot-top option').filter({hasText:'Saved t'}).count(),0);
  assert.ok(await page.locator('#outfit3D01Slot-top option').filter({hasText:'Saved dress'}).count());
  const aPic=allSources['A'+width].find(x=>x.id==='qa-outfit-A-t');
  assert.equal((await page.locator('#outfit3D01Photos').innerText()).includes('qa-outfit-A-t'),false);
  assert.equal((await page.locator('#outfit3D01Photos').innerText()).includes(aPic.sha),false);
  const ownerBPhoto=await page.evaluate(()=>window.outfit3DResearch.controller.photoFor('qa-outfit-A-t'));
  assert.equal(ownerBPhoto,null);
  const accountBBoard=await page.evaluate(()=>window.outfit3DResearch.controller.listSaved());
  assert.equal(accountBBoard.length,0);
  reports.push({width,ownerAccountA:'qa-outfit-A',ownerAccountB:'qa-outfit-B',
   accountIsolation:true,ownedOriginals:a.count,sourceHashesLocallyChecked:a.sources.length,
   authenticatedRealIndexedDB:true,localOnlyBrowser:true,
   savedOutfitsReopened:true,missingItemExplicit:true,physicalPhone:false});
 }finally{await context.close();}
}
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--enable-webgl','--no-sandbox']});
 for(const width of [320,390,430])await runWidth(width);
 assert.deepEqual(reports.map(x=>x.width),[320,390,430]);
 assert.equal(cases.length,45,'3 widths x (female 8 + male 7) = 45 real visual screenshots');
 assert.equal(leakedExternalPosts.length,0,'Owner JPEGs must never leave isolated browser');
 assert.equal(errors.length,0,'Unhandled real app/WebGL JS exceptions are not accepted');
 const result={verdict:'PASS',widths:[320,390,430],figures:['female','male'],
  realBrowserWebGL:true,originalPhotosVerified:true,accountIsolation:true,
  savedOutfitsReopened:true,missingItemExplicit:true,sourceBoundDressAndDenim:true,
  screenshots:cases.length,productionModified:false,realPhysicalPhonesTested:false,
  familyAlpha:'HOLD',errors,leakedExternalPosts,blockedExternalGetCount:offHost.filter(x=>x.method==='GET').length,
  cases,reports};
 await writeFile(folder+'/results.json',JSON.stringify(result,null,2));
 console.log('OUTFIT3D01_GENUINE_WEBGL',JSON.stringify({screenshots:cases.length,
  widths:result.widths,figures:result.figures,ownedOriginalSHA:true,
  accountIsolation:true,realPhysicalPhonesTested:false,productionDeployed:false}));
}catch(e){
 errors.push(String(e.stack||e));
 await writeFile(folder+'/failure.json',JSON.stringify({errors,leakedExternalPosts,
  blockedExternalGetCount:offHost.length,cases,reports},null,2)).catch(()=>{});
 throw e;
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
