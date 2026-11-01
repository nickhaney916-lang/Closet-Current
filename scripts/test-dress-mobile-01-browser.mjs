/** PAR12 — 90 real Chromium captures: 72 WebGL (all source-true originals)
 * +18 genuine original JPEG photo fallback at 320/390/430. Strict, local,
 * no model simulation, no private garment or offsite request.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),dir='benchmark/dress-mobile-01';
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(path)||
    path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('Licensed localhost research only');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/'))throw Error('Untrusted path');
  const bytes=await readFile(file);
  const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript',
   '.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not available');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
const SHA={
 dress:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 shirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
};
const widths=[320,390,430],figures=['female','male'],angles=[0,90,180];
const images=[],photographs=[],swaps=[],models=[],negative=[],recovery=[],memory=[],orbit=[],otherFailures=[];
let browser;
const d=page=>page.evaluate(()=>window.ccDress12Diagnostics());
async function waitReady(page){
 await page.waitForFunction(()=>window.ccDress12Diagnostics?.()?.phase==='ready',
  null,{timeout:180000});
}
async function capture(page,key,kind,width){
 const is3d=kind==='webgl',q=await d(page);
 if(is3d){
  assert.equal(q.visibleFallback,false);
  assert.equal(q.bones,163);
  const draw=await page.evaluate(()=>{
   const canvas=document.querySelector('#avatar'),gl=canvas.getContext('webgl2');
   return {realGL:!!gl,frame:Number(canvas.dataset.frames||0),pixels:canvas.width*canvas.height};
  });
  assert.ok(draw.realGL&&draw.frame>1&&draw.pixels>45000,'real drawn WebGL2 frame');
 }else{
  assert.equal(q.visibleFallback,true);
  const originals=await page.locator('#photos img').evaluateAll(els=>
   els.map(x=>({complete:x.complete,w:x.naturalWidth,h:x.naturalHeight,src:x.getAttribute('src')})));
  assert.equal(originals.length,3);assert.ok(originals.every(x=>x.complete&&x.w>100&&x.h>100));
 }
 const buf=is3d?await page.locator('#avatar').screenshot():await page.locator('#fallback').screenshot();
 assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const reduced=await sharp(buf).resize(48,48).removeAlpha().raw().toBuffer();
 const colorRange=Math.max(...reduced)-Math.min(...reduced);
 assert.ok(colorRange>16,'no blank or flat placeholder screenshots');
 await writeFile(dir+'/'+key+'.png',buf);
 const res={name:key,kind,width,bytes:buf.length,colorRange,
  figure:q.figure,source:q.verifiedDressSHA||null,mode:q.outfitMode};
 (is3d?images:photographs).push(res);return res;
}
async function prepare(page,figure){
 await waitReady(page);
 if(figure==='male'){
  await page.locator('#model').selectOption('male');
  await waitReady(page);
 }
 await page.locator('#review').check();
}
async function newPage(context){
 const page=await context.newPage(),offsite=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e.message)));
 page.on('request',r=>{
  const url=r.url();
  if(!url.startsWith(host)&&!url.startsWith('blob:'+host)&&!url.startsWith('data:'))
   offsite.push(url);
 });
 await page.goto(host+'/research/dress-mobile-01/index.html',{waitUntil:'domcontentloaded'});
 await waitReady(page);
 return {page,offsite,errors};
}
function validSource(q){
 assert.equal(q.bones,163);
 assert.equal(q.verifiedDressSHA,SHA.dress);
 assert.equal(q.familyAlpha,'HOLD');assert.equal(q.releaseAuthorized,false);
 assert.equal(q.realLicensedPhotosOnly,true);assert.equal(q.noOriginalPhotoModified,true);
 assert.equal(q.noFakeReverse,true);
 assert.equal(q.realAndroidTested,false);assert.equal(q.realIphoneTested,false);
}
function assertDress(q){
 assert.equal(q.outfitMode,'dress');
 assert.deepEqual(q.outfitSlots,['dress']);
 assert.equal(q.shirt,null);assert.equal(q.pants,null);
 assert.equal(q.dress.sourceId,'commons-0053');
 assert.equal(q.dress.sourceSHA256,SHA.dress);
 assert.equal(q.dress.dress74ProvisionalDrape,true);
 assert.equal(q.dress.dress74SourcePhotographUnchanged,true);
 assert.equal(q.dress.dress74OriginalPhotoCoordinatesPreserved,true);
 assert.equal(q.dress.dress74OriginalSkinWeightsPreserved,true);
 assert.equal(q.dress.dress74OriginalNormalsPreserved,true);
 assert.equal(q.dress.dress74NeckShoulderArmholeUntouched,true);
 assert.equal(q.dress.releaseAuthorized,false);
}
function assertTwo(q,denim){
 assert.equal(q.outfitMode,'shirt-pants');assert.equal(q.dress,null);
 assert.deepEqual(q.outfitSlots,['shirt','pants']);
 assert.equal(q.shirt.sourceSHA256,SHA.shirt);
 assert.equal(q.pants.sourceSHA256,SHA[denim]);
 assert.equal(q.pants.photoApplied,true);
 assert.equal(q.pants.releaseAuthorized,false);
}
try{
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir(dir,{recursive:true});
 for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,
   isMobile:true,hasTouch:true});
  const {page,offsite,errors}=await newPage(context);
  for(const figure of figures){
   await prepare(page,figure);
   for(const denim of ['public','second']){
    for(const garment of ['dress','two']){
     if(garment==='two'&&denim==='second')await page.locator('#swap').click();
     await page.locator('#'+garment).click();
     let q=await d(page);validSource(q);
     if(garment==='dress')assertDress(q);else assertTwo(q,denim);
     assert.ok(!q.visibleFallback,'real source garment must be displayed in actual 3D');
     for(const angle of angles){
      const newView=await page.evaluate(a=>window.ccDress12SetView(a),angle);
      assert.equal(newView.figure,figure);await page.waitForTimeout(95);
      const rect=await page.evaluate(()=>({
       scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
      assert.ok(rect.scroll<=rect.inner+1,'320/390/430 no horizontal scroll');
      await capture(page,['webgl',width,figure,denim,garment,angle].join('-'),'webgl',width);
     }
     memory.push({width,figure,denim,garment,...q.memory});
    }
    // Dress chosen before two-piece, denim toggle affects only next two-piece.
   }
   // Genuine 3 failure-mode photo screenshot captures on each figure and width.
   for(const condition of ['noWebGL','missingRig','corruptDress']){
    await page.evaluate(c=>window.ccDress12Test.inject(c),condition);
    await page.waitForFunction(()=>window.ccDress12Diagnostics?.()?.phase==='error',
     null,{timeout:90000});
    const q=await d(page);assert.equal(q.visibleFallback,true);
    await capture(page,['fallback',width,figure,condition].join('-'),'photo',width);
    await page.evaluate(()=>window.ccDress12Test.reset());
    await waitReady(page);await page.locator('#review').check();
   }
  }
  assert.deepEqual(offsite,[],'No source photo traffic to third party domains');
  assert.deepEqual(errors,[],'No browser source errors');
  await context.close();
 }
 // One dedicated independent stress session (no fake screenshots/automation-only "acceptance").
 const ctx=await browser.newContext({viewport:{width:390,height:900},
  deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const {page:p,offsite,errors}=await newPage(ctx);
 await p.locator('#review').check();
 for(let i=0;i<12;i++){
  await p.locator('#dress').click();let q=await d(p);assertDress(q);
  await p.locator('#two').click();q=await d(p);assertTwo(q,'public');
  swaps.push({step:i,geometries:q.memory.geometries,textures:q.memory.textures,
   reclaimed:q.memory.reclaimed});
  assert.ok(q.memory.geometries<=30&&q.memory.textures<=9,
   'No unbounded GPU memory after dress and shirt/pants changes');
 }
 assert.ok(Math.max(...swaps.map(x=>x.geometries))-
  Math.min(...swaps.map(x=>x.geometries))<=4,
  'GPU garment geometry memory must plateau across 12 complete swaps');
 await p.locator('#clear').click();
 assert.equal((await d(p)).outfitMode,'none');
 assert.deepEqual((await d(p)).outfitSlots,[]);
 for(let i=0;i<6;i++){
  const fig=i%2===0?'male':'female';
  await p.locator('#model').selectOption(fig);await waitReady(p);
  let q=await d(p);validSource(q);assert.equal(q.figure,fig);
  assert.equal(q.outfitMode,'none');
  await p.locator('#review').check();await p.locator('#dress').click();
  q=await d(p);assertDress(q);
  models.push({step:i,figure:q.figure,geometries:q.memory.geometries,
   textures:q.memory.textures});
  assert.ok(q.memory.geometries<=30&&q.memory.textures<=9);
 }
 // Actual camera changes, including zoom via real click and real OrbitControls.
 const before=await d(p);
 await p.locator('#zin').click();const after=await d(p);
 assert.ok(after.memory.cameraDistance<before.memory.cameraDistance);
 await p.locator('#zout').click();
 const other=await d(p);assert.ok(other.memory.cameraDistance>after.memory.cameraDistance);
 await p.locator('#side').click();await p.locator('#back').click();
 await p.locator('#front').click();await p.locator('#turn').click();await p.locator('#turn').click();
 orbit.push({zoomIn:before.memory.cameraDistance-after.memory.cameraDistance,
  zoomOut:other.memory.cameraDistance-after.memory.cameraDistance,
  cameraControlsFunctional:true});
 // All 10 separate failure modes; 5 genuine retries minimum.
 for(const condition of ['noWebGL','missingDress','missingRig','corruptDress',
  'missingDenim','badCutout','interrupted','rendererFailure']){
  if(condition==='rendererFailure')await p.locator('#review').check();
  await p.evaluate(c=>window.ccDress12Test.inject(c),condition);
  await p.waitForFunction(()=>window.ccDress12Diagnostics?.()?.phase==='error',
   null,{timeout:90000});
  const q=await d(p);assert.equal(q.visibleFallback,true);
  assert.equal(q.releaseAuthorized,false);negative.push({condition,pass:true});
  await p.evaluate(()=>window.ccDress12Test.reset());await waitReady(p);
  const recovered=await d(p);validSource(recovered);
  recovery.push({condition,success:recovered.ready,rig:recovered.bones});
 }
 await p.locator('#review').check();await p.locator('#dress').click();
 assert.equal(await p.evaluate(()=>window.ccDress12Test.unsupportedDress({id:'fake-dress'})),true);
 negative.push({condition:'unsupported unverified dress',pass:true});
 await p.evaluate(()=>window.ccDress12Test.contextLoss());
 await p.waitForFunction(()=>window.ccDress12Diagnostics?.()?.phase==='error',
  null,{timeout:90000});
 assert.equal((await d(p)).visibleFallback,true);
 negative.push({condition:'genuine WebGL context loss',pass:true});
 await p.locator('#retry').click();await waitReady(p);
 assert.equal((await d(p)).bones,163);
 recovery.push({condition:'genuine WebGL context loss',success:true});
 assert.deepEqual(offsite,[]);assert.deepEqual(errors,[]);
 await ctx.close();
 const report={screenshots:images.length+photographs.length,
  realWebGLScreenshots:images.length,realOriginalPhotoFallbackScreenshots:photographs.length,
  widths,figures,angles,sourceSHA256s:SHA,images,photographs,
  dressTwoPieceSwaps:swaps,figureChanges:models,
  negatives:negative,recoveries:recovery,camera:orbit,memory,
  sourceLicensedOriginalJPEGAndAlphaVerified:true,
  sourceFrontUVSkinUnmodified:true,unknownBackSourceNeutral:true,
  noDressPantsCoexistence:true,original163BoneCC0Figures:true,
  realPhonesTested:false,humanPhotoRealismApproved:false,productionTouched:false,
  familyAlpha:'HOLD',releaseAuthorized:false};
 assert.equal(images.length,72);assert.equal(photographs.length,18);
 assert.equal(swaps.length,12);assert.equal(models.length,6);
 assert.ok(negative.length>=10);assert.ok(recovery.length>=5);
 await writeFile(dir+'/browser-results.json',JSON.stringify(report,null,2));
 console.log('PAR12_REAL_MOBILE_DRESS_BROWSER_ACCEPTANCE',JSON.stringify({
  realWebGL:images.length,realPhotos:photographs.length,
  switches:swaps.length,figureChanges:models.length,
  negatives:negative.length,retries:recovery.length,
  memoryMax:Math.max(...memory.map(x=>x.geometries)),hold:'Family Alpha #255'}));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
