/** PHOTO-FIT-3D-02: genuine Chromium WebGL + 24 mobile angles.
 * This is NEVER a substitute for separate human visual-fit acceptance.
 * No production/staging API, login secrets, real customers or cloud mutation.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),donor=resolve('.photo22-donor-541');
const out='benchmark/photo-fit-3d-02';await mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const expected='fef606d6ed7354a2238f1bcc2584942747ca6fa4a2b16b2e9eec21f639d10667';
const jpeg=readFileSync('benchmark/fixtures/commons-0002.jpg');
const before=hash(jpeg);assert.equal(before,expected);
const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8')).find(x=>x.id==='commons-0002');
assert.equal(locked.sha256,expected);assert.equal(locked.verified,true);
assert.equal(locked.attribution.license,'CC BY-SA 3.0');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.json':'application/json','.glb':'model/gltf-binary','.jpg':'image/jpeg',
 '.png':'image/png','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path.includes('\\')||path.includes('\0')||path.split('/').includes('..')||
   !/^\/(?:research\/photo-fit-3d-02\/|benchmark\/fixtures\/|donor\/research\/|node_modules\/)/.test(path))
   throw Error('unapproved research path');
  const isDonor=path.startsWith('/donor/');
  const location=resolve(isDonor?donor:root,'.'+(isDonor?path.slice(6):path));
  if(!location.startsWith((isDonor?donor:root)+'/'))throw Error('outside checkout');
  const bytes=await readFile(location);
  res.writeHead(200,{'content-type':mime[extname(location)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const evidence={priority:'PHOTO-FIT-3D-02',source:'commons-0002',sourceSHA256:expected,
 donor:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
 fixtureAccountOnly:true,realSignedAccountsVerified:false,
 realPhysicalPhonesVerified:false,frontPhotoOnly:true,neutralRear:true,
 humanVisualApproval:false,realArbitraryUserPhotoSupport:false,
 sourceUnmodified:true,familyAlpha:'HOLD',releaseAuthorized:false,
 screenshots:[],cases:[],pageErrors:[],consoleErrors:[],externalNetwork:[],crashes:[]};
let browser;
async function proveLocalOwnerStorage(page){
 return page.evaluate(async(expected)=>{
  const original=await fetch('/benchmark/fixtures/commons-0002.jpg');
  const arr=new Uint8Array(await original.arrayBuffer());
  let b64='';for(let i=0;i<arr.length;i+=8000)
   b64+=String.fromCharCode(...arr.subarray(i,i+8000));
  const owner='photo22-synthetic-A',ownerB='photo22-synthetic-B';
  const data='data:image/jpeg;base64,'+btoa(b64);
  const item={id:owner+'-new-red-shirt',ownerId:owner,category:'Tops',
   itemType:'T-shirt',userAdjusted:true,color:'Red',sourceSHA256:expected,
   originalPhoto:{image:data,sha256:expected},futureNested:{keep:'exact'}};
  const saved={id:owner+'-outfit',ownerId:owner,outfit3dId:'existing-3d-identity',
   slots:{top:item.id,layer2:'missing-owned-coat'},
   futureSavedMetadata:{keep:'forever'}};
  const {verifySavedRedShirt,verifyRedSourceBytes}=await import(
   '/research/photo-fit-3d-02/source-shirt.mjs');
  const verified=await verifyRedSourceBytes(arr);
  if(verified.sha256!==expected)throw Error('source bytes not original');
  const db=await new Promise((resolve,reject)=>{
   const q=indexedDB.open('closet-current-user-'+owner,2);
   q.onupgradeneeded=()=>{q.result.createObjectStore('items',{keyPath:'id'});
    q.result.createObjectStore('state',{keyPath:'id'});};
   q.onerror=()=>reject(q.error);q.onsuccess=()=>resolve(q.result);
  });
  const board={id:'outfit-board',saved:[saved],otherMetadata:{keep:true}};
  await new Promise((resolve,reject)=>{
   const tx=db.transaction(['items','state'],'readwrite');
   tx.objectStore('items').put(item);tx.objectStore('state').put(board);
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });
  const snapshot=await new Promise((resolve,reject)=>{
   const tx=db.transaction(['items','state'],'readonly'),
    ir=tx.objectStore('items').get(item.id),br=tx.objectStore('state').get('outfit-board');
   tx.oncomplete=()=>resolve({item:ir.result,board:br.result});
   tx.onerror=()=>reject(tx.error);
  });
  const prior=JSON.stringify(snapshot);
  const receipt=verifySavedRedShirt({item:snapshot.item,
   saved:snapshot.board.saved[0],ownerId:owner,generation:7});
  if(receipt.outfit3dId!=='existing-3d-identity'||
     receipt.itemId!==item.id||receipt.readOnly!==true||
     JSON.stringify(snapshot)!==prior)
   throw Error('Source access mutated saved outfit');
  let denied=false;
  try{verifySavedRedShirt({item:snapshot.item,
   saved:snapshot.board.saved[0],ownerId:ownerB,generation:7});}
  catch{denied=true;}
  if(!denied)throw Error('Cross account source admission was accepted');
  if(snapshot.board.saved[0].slots.layer2!=='missing-owned-coat'||
   snapshot.board.saved[0].futureSavedMetadata.keep!=='forever')
   throw Error('Saved original metadata and missing garment were dropped');
  const status=await import('/research/photo-fit-3d-02/source-shirt.mjs');
  if(status.RED_SHIRT.sha256!==expected)throw Error('Pinned source identity lost');
  db.close();
  return {sourceHashExact:true,ownerIDsUnchanged:true,privateOwnerIsolationSynthetic:true,
   originalPhotoBytesUnchanged:true,outfit3dIdUnchanged:true,missingCoatIDUnchanged:true,
   unknownMetadataUnchanged:true,signedRLS:false};
 },expected);
}
async function screenshot(page,width,model,view){
 const png=await page.screenshot({animations:'disabled'});
 const stats=await sharp(png).stats(),meta=await sharp(png).metadata();
 assert.equal(meta.width,width);
 assert.equal(meta.height,900);
 assert.ok(png.length>7000);
 assert.ok(stats.channels.some(c=>c.stdev>10),'Blank rendered image');
 const name='chromium-'+width+'-'+model+'-'+String(view).padStart(3,'0')+'.png';
 await writeFile(out+'/'+name,png);
 evidence.screenshots.push({name,width,model,view,sha256:hash(png),bytes:png.length});
 return png;
}
try{
 for(const width of [320,390,430]){
  browser=await chromium.launch({headless:true,args:['--use-gl=angle',
   '--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width,height:900},
   deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const url=route.request().url();
   if(url.startsWith(origin+'/')||url.startsWith('blob:'+origin)||
      url.startsWith('data:'))return route.continue();
   evidence.externalNetwork.push({width,url,method:route.request().method()});
   return route.abort();
  });
  const page=await context.newPage();
  page.on('pageerror',error=>evidence.pageErrors.push({width,error:String(error)}));
  page.on('crash',()=>evidence.crashes.push({width}));
  page.on('console',msg=>{if(msg.type()==='error')
   evidence.consoleErrors.push({width,message:msg.text().slice(0,350)});});
  await page.goto(origin+'/research/photo-fit-3d-02/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__photoFit22Ready===true,null,{timeout:45000});
  const privateStorage=await proveLocalOwnerStorage(page);
  const shots=[];
  for(const model of ['female','male']){
   if(model==='male'){
    await page.locator('#figure').selectOption('male');
    await page.waitForFunction(()=>window.__photoFit22?.getState()?.kind==='male',
      null,{timeout:45000});
   }
   for(const view of [0,90,180,270]){
    await page.locator('button[data-angle="'+view+'"]').click();
    await page.waitForFunction(v=>window.__photoFit22?.getState()?.angle===v,
      view,{timeout:15000});
    const state=await page.evaluate(()=>window.__photoFit22.getState());
    assert.equal(state.bones,163,'must load genuine 163-bone humanoid');
    assert.equal(state.webgl2,true,'must render actual WebGL2');
    assert.ok(state.skinnedGarmentMeshes>=1,'independent skinned shirt required');
    assert.ok(state.triangles>1000);
    assert.equal(state.sourceSpecificGeometry,true);
    assert.equal(state.sourceSHA256,expected);
    assert.equal(state.sourceId,'commons-0002');
    assert.equal(state.originalUnchanged,true);
    assert.equal(state.neutralRear,true);
    assert.equal(state.humanVisualApproval,false);
    assert.equal(state.releaseAuthorized,false);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,
      'Mobile viewport must have no horizontal overflow');
    shots.push(await screenshot(page,width,model,view));
   }
  }
  const sourceJpeg=await sharp(jpeg).resize(200,420,{fit:'contain',
   background:'#f8f8f5'}).png().toBuffer();
  const composites=[{input:sourceJpeg,left:0,top:15}];
  for(let i=0;i<shots.length;i++){
   const image=await sharp(shots[i]).resize(228,420,{fit:'contain'}).png().toBuffer();
   composites.push({input:image,left:205+(i%4)*228,top:(i<4?0:435)});
  }
  const contact=await sharp({create:{width:1120,height:890,channels:4,
   background:'#f8f8f5'}}).composite(composites).png().toBuffer();
  const gallery='gallery-'+width+'-source-plus-female-male-8-views.png';
  await writeFile(out+'/'+gallery,contact);
  evidence.cases.push({width,realMaleFemaleWebGL:true,originalSourceSHA256:expected,
   screenshotViews:8,sourceAndRenderGallery:gallery,contactSHA256:hash(contact),
   privateStorage,sourceOriginalBytesNotModified:true,unverifiedRearNeutral:true,
   screenshotReview:'pending-independent-human-visual-acceptance'});
  await context.close();await browser.close();browser=null;
 }
 assert.equal(hash(readFileSync('benchmark/fixtures/commons-0002.jpg')),before,
  'Never rewrite, crop or replace licensed original source JPEG');
 assert.equal(evidence.screenshots.length,24);
 assert.equal(evidence.cases.length,3);
 assert.deepEqual(evidence.pageErrors,[]);
 assert.deepEqual(evidence.externalNetwork,[]);
 assert.deepEqual(evidence.crashes,[]);
 // Browser errors include failed WebGL shader compilation; these block acceptance.
 assert.deepEqual(evidence.consoleErrors,[]);
 await writeFile(out+'/results.json',JSON.stringify(evidence,null,2));
 console.log('PHOTO22_WEBGL '+JSON.stringify({frames:24,widths:3,realBones:163,
  newSource:expected,ownerStorage:'synthetic A/B',
  humanVisualAcceptance:'PENDING',release:'HOLD'}));
}finally{await browser?.close();await new Promise(done=>server.close(done));}
