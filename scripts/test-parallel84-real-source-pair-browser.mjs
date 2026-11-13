/**
 * Parallel #84 — REAL licensed source photographed shirt + denim 163-bone
 * screenshots and read-only inter-garment contact diagnostic in a detached
 * P541 donor. Browser emulation is NOT physical mobile, human acceptance,
 * original user-photo reconstruction or release approval. No external upload.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const root=resolve(process.argv[2]||'.');
const engine=process.env.P84_BROWSER||'chromium';
if(!['chromium','webkit'].includes(engine)||!process.argv[2]||
 root===resolve('.')||root==='/')throw Error('P84 independent disposable donor and browser required');
const dir='benchmark/parallel84-source-pair/'+engine;
await mkdir(dir,{recursive:true});
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript',
 '.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg',
 '.json':'application/json','.css':'text/css','.bin':'application/octet-stream'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(path)||
    path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('licensed-source-only-url');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/'))throw Error('source-only-file');
  const bytes=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Not available');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
const hash=x=>createHash('sha256').update(x).digest('hex');
const SOURCE=Object.freeze({
 shirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
});
const sizes=[320,390,430],avatars=['female','male'],denims=['public','second'],
 angles=[0,45,90,180];
const captures=[],samples=[],fallbacks=[],failures=[],errors=[],offsite=[];
let browser;
async function state(page){return page.evaluate(()=>({
 source:window.ccDress12Diagnostics?.(),
 layer:window.__parallel84LayerEvidence??null
}));}
async function waitReady(page){
 await page.waitForFunction(()=>window.ccDress12Diagnostics?.()?.phase==='ready',null,{timeout:180000});
}
function requireRealPair(a,b,figure,denim){
 assert.equal(a.phase,'ready');
 assert.equal(a.figure,figure);assert.equal(a.bones,163);
 assert.equal(a.outfitMode,'shirt-pants');
 assert.deepEqual(a.outfitSlots,['shirt','pants']);
 assert.equal(a.shirt?.sourceSHA256,SOURCE.shirt);
 assert.equal(a.pants?.sourceSHA256,SOURCE[denim]);
 assert.equal(a.pants?.photoApplied,true);
 assert.equal(a.visibleFallback,false);
 assert.equal(a.releaseAuthorized,false);
 assert.equal(a.realLicensedPhotosOnly,true);
 assert.equal(a.noOriginalPhotoModified,true);
 assert.equal(a.humanVisualApproved,false);
 assert.equal(b?.schema,'parallel84-distinct-source-layer-contact/v1');
 assert.equal(b?.actualSkinnedPoseSampled,true,
  'P84 must inspect actual source-photo attached skinned 163-bone garments; no fake mesh acceptance: '+JSON.stringify(b));
 assert.equal(b.sourceBuffersPreserved,true);
 assert.ok(b.originalSourceFaceCount>=1000,
  'Original real-photo posed face count unavailable, sanitized diagnostic='+JSON.stringify(b));
 assert.equal(b.distinctSourcePhotoMeshClaims,2);
 assert.equal(b.avatar,figure);
 assert.equal(b.pose,'relaxed');
 assert.equal(b.sourcePair,'top-bottom');
 assert.ok(['INCOMPLETE_BUDGET','STRICT_CROSSING_VETO','UNCERTAIN_NOT_CLEARANCE'].includes(b.status));
 assert.equal(b.safe3D,false);assert.equal(b.contactClearanceProved,false);
 assert.equal(b.releaseAuthorized,false);assert.equal(b.humanRealismApproved,false);
 assert.equal(b.originalGarmentGeometryEdited,false);
 assert.equal(b.unobservedBacks,2);
 const serialized=JSON.stringify(b);
 for(const token of ['cb909d7ad','b316902ad','aa7f2880','ownerId','originalPhotoBytes','sourceSHA256','triangles','vertices','textureRGB'])
  assert.equal(serialized.includes(token),false,'P84 must not export private/3D raw source fields');
}
try{
 const launcher=engine==='webkit'?webkit:chromium;
 browser=await launcher.launch({headless:true,...(engine==='chromium'?{
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']
 }: {})});
 for(const width of sizes){
  const context=await browser.newContext({viewport:{width,height:900},
   isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push({engine,width,type:'page-error',message:String(e.message).slice(0,160)}));
  page.on('crash',()=>errors.push({engine,width,type:'crash'}));
  page.on('request',req=>{
   const u=req.url();
   if(!u.startsWith(host)&&!u.startsWith('blob:'+host)&&!u.startsWith('data:'))
    offsite.push({width,kind:'blocked-external'});
  });
  await page.route('**/*',route=>{
   const u=route.request().url();
   if(u.startsWith(host)||u.startsWith('blob:'+host)||u.startsWith('data:'))
    return route.continue();
   return route.abort();
  });
  await page.goto(host+'/research/dress-mobile-01/index.html?parallel84Layers=research',
   {waitUntil:'domcontentloaded'});
  await waitReady(page);
  const original=await page.locator('#fallback').screenshot();
  const name='original-2d-'+width+'.png';
  await writeFile(join(dir,name),original);
  fallbacks.push({name,width,sha256:hash(original),actualLicensedOriginalPhoto2D:true});
  for(const figure of avatars){
   if(figure==='male'){await page.locator('#model').selectOption('male');await waitReady(page);}
   await page.locator('#review').check();
   for(const denim of denims){
    const prev=await state(page);
    if(prev.source.denim!==denim)await page.locator('#swap').click();
    const start=Date.now();
    await page.locator('#two').click();
    const loadMs=Date.now()-start;
    const {source,layer}=await state(page);
    requireRealPair(source,layer,figure,denim);
    const intervals=await page.evaluate(async()=>new Promise(resolve=>{
     const out=[];let prev=null;
     const step=n=>{
      if(prev!==null)out.push(n-prev);prev=n;
      if(out.length===24)return resolve(out);
      requestAnimationFrame(step);
     };
     requestAnimationFrame(step);
    }));
    assert.ok(intervals.length===24&&intervals.every(t=>t>0&&Number.isFinite(t)));
    const ordered=intervals.slice().sort((a,b)=>a-b);
    samples.push({width,figure,denim,loadMs,
     medianRafIntervalMs:ordered[11],p95RafIntervalMs:ordered[22],
     sampledJsHeapBytes:await page.evaluate(()=>performance.memory?.usedJSHeapSize??null),
     geometries:source.memory?.geometries??null,textures:source.memory?.textures??null,
     layer:layer,
     measurement:'software-browser requestAnimationFrame schedule; NOT physical FPS, GPU frame time or peak memory'});
    for(const angle of angles){
     await page.evaluate(n=>window.ccDress12SetView(n),angle);
     await page.waitForTimeout(90);
     const stateNow=await state(page);
     requireRealPair(stateNow.source,stateNow.layer,figure,denim);
     const rect=await page.evaluate(()=>({
      scroll:document.documentElement.scrollWidth,width:window.innerWidth}));
     assert.ok(rect.scroll<=rect.width+1,'Mobile viewport may not scroll horizontally');
     const pixels=await page.evaluate(()=>{
      const canvas=document.getElementById('avatar');
      return {frames:Number(canvas.dataset.frames||0),
       w:canvas.width,h:canvas.height,
       webgl2:!!canvas.getContext('webgl2')};
     });
     assert.ok(pixels.webgl2&&pixels.frames>1&&pixels.w*pixels.h>45000);
     const png=await page.locator('#avatar').screenshot({animations:'disabled'});
     const meta=await sharp(png).metadata();
     assert.ok(meta.width>100&&meta.height>100);
     const st=await sharp(png).resize(48,48).removeAlpha().raw().toBuffer();
     assert.ok(Math.max(...st)-Math.min(...st)>16,
      'Original source image must be visible on genuine WebGL not blank canvas');
     const filename=['source-pair',engine,width,figure,denim,angle].join('-')+'.png';
     await writeFile(join(dir,filename),png);
     captures.push({name:filename,width,figure,denim,angle,
      sha256:hash(png),imageWidth:meta.width,imageHeight:meta.height,
      actualLicensedPhotoMeshPair:true,real163BoneWebGL:true,
      photoRearUnobserved:true,changedGeometryByP84:false,sourceLayerProof:layer.status});
    }
   }
  }
  assert.deepEqual(errors,[]);
  assert.deepEqual(offsite,[]);
  await context.close();
 }
 assert.equal(captures.length,48);
 assert.equal(samples.length,12);
 assert.equal(fallbacks.length,3);
 const result={
  schema:'parallel84-actual-licensed-photo-two-piece-browser/v1',
  engine, widths:sizes,figures:avatars,
  denimSources:denims,angles,
  screenshotCount:captures.length,sourcePairPoseSamples:samples.length,
  originalPhoto2DFallbackImages:fallbacks.length,
  captures,samples,fallbacks,
  originalLicensedPhotoSHAAndCutoutValidatedByP69:true,
  threeDContactClearanceCertified:false,
  photographedRearObserved:false,
  independentHumanPhotorealismCertified:false,
  imagesAreNewPhysicalAppearanceImprovement:false,
  privateAccountDataAccessed:false,
  realAndroidIphoneTested:false,
  browserEngineReal:engine,
  productionModified:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
 await writeFile(join(dir,'results.json'),JSON.stringify(result,null,2)+'\n');
 console.log('P84_ACTUAL_LICENSED_TWO_GARMENT_163_BONE_SOURCE_BROWSER',JSON.stringify({
  engine,screenshots:captures.length,sourcePairPoseSamples:samples.length,
  originalPhotoFallbacks:fallbacks.length,firstSourcePairs:samples.map(x=>x.layer.sourcePair),
  statusCounts:Object.fromEntries([...new Set(samples.map(x=>x.layer.status))]
   .map(x=>[x,samples.filter(q=>q.layer.status===x).length])),
  photoOriginalAndRigVerified:true,photoRealismApproved:false,releaseAuthorized:false
 }));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
