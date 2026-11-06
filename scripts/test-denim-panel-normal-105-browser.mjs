/**
 * PHOTO105 actual original-photo 163-bone male+female skinned jeans: compare
 * contact-safe PHOTO104 pose fold BEFORE and source-neutral PHOTO105 sewn
 * triangle normal smoothing AFTER in real Chromium WebGL, not fake frames.
 * No private wardrobe, original source JPEG writes, cloud, mobile hardware,
 * reverse photograph, human realism scoring or physical cloth simulator.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import sharp from 'sharp';

const root=resolve('.'),dir='benchmark/three-d-105';
const original={
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
};
const realShirt='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const hash=b=>createHash('sha256').update(b).digest('hex');
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(path)||
   path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('unauthorized original research source');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/'))throw Error('path escape');
  const bytes=await readFile(file);
  const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html',
   '.glb':'model/gltf-binary','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
const deltaPixels=async(a,b)=>{
 const [x,y]=await Promise.all([
  sharp(a).ensureAlpha().raw().toBuffer(),
  sharp(b).ensureAlpha().raw().toBuffer()
 ]);
 assert.equal(x.length,y.length);
 let changed=0;
 for(let i=0;i<x.length;i+=4)
  if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>20)
   changed++;
 return changed;
};
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
let browser;
const receipts=[],scenarios=[],browserErrors=[],externalRequests=[],crashes=[];
const screenshot=async(page,label,context)=>{
 const png=await page.locator('#avatar').screenshot({animations:'disabled'});
 const meta=await sharp(png).metadata();
 assert.ok(meta.width>=200&&meta.height>=300&&png.length>3000);
 const file=label+'.png';
 await writeFile(dir+'/'+file,png);
 receipts.push({file,sha256:hash(png),width:meta.width,height:meta.height,...context});
 return png;
};
const setView=async(page,angle)=>{
 const result=await page.evaluate(a=>window.cc69SetView(a),angle);
 assert.ok(Math.abs(result.camera-angle)<.02);
 await page.waitForTimeout(90);
};
async function compare(page,{figure,denim,degrees,viewportWidth}){
 const old=await page.evaluate(deg=>{
  const result=window.cc104KneeStep(deg,0);
  return {jeans:result.pants,model:window.cc69Diagnostics()};
 },degrees);
 assert.equal(old.model.rig.bones,163);
 assert.equal(old.jeans.sourceSHA256,original[denim]);
 assert.equal(old.jeans.poseResponsiveDenim104,true);
 assert.equal(old.jeans.originalDenimFrontSourceAndSkinProtected104,true);
 assert.equal(old.jeans.real163BoneSampledKnee103.leftDegrees,degrees);
 const beforeImages={};
 for(const view of [0,90,180]){
  await setView(page,view);
  beforeImages[view]=await screenshot(page,
   [figure,denim,'knee-'+degrees,'viewport-'+viewportWidth,'before','view-'+view].join('-'),
   {figure,denim,degrees,viewportWidth,view,kind:'before',
    sourceSHA256:original[denim]});
 }
 const after=await page.evaluate(deg=>{
  const result=window.cc105KneeStep(deg,0);
  return {jeans:result.pants,model:window.cc69Diagnostics()};
 },degrees);
 const x=after.jeans;
 assert.equal(after.model.rig.bones,163);
 assert.equal(after.model.actual3DGarment.originalPhotoSHA256s.bottom,original[denim]);
 assert.equal(after.model.actual3DGarment.originalPhotoSHA256s.top,realShirt);
 assert.equal(x.originalPhotographedDenimNormalContinuity105,true);
 assert.equal(x.originalDenimFrontSourceAndSkinProtected104,true);
 assert.equal(x.originalPhotoUVRestFrontSkinPositionsBytePreserved77,true);
 assert.equal(x.originalSourcePhotoUVRestSkinAndFrontNormalsUnchanged105,true);
 assert.equal(x.originalJPEGAndPhotographedFrontLightingPreserved105,true);
 assert.equal(x.sourcePhotographedRearProvided105,false);
 assert.equal(x.sourceSHA256,original[denim]);
 assert.equal(x.poseResponsiveDenim104,true);
 if(degrees===0){
  assert.equal(x.rearSourceNeutralNormalsAdjusted105,0);
  assert.equal(x.rearSourceNeutralSeamGroupsSmoothed105,0);
  assert.equal(x.originalStraightKneeShadingUnchanged105,true);
 }else{
  assert.ok(x.rearSourceNeutralNormalsAdjusted105>=8);
  assert.ok(x.rearSourceNeutralSeamGroupsSmoothed105>=3);
  assert.equal(x.originalStraightKneeShadingUnchanged105,false);
  assert.ok(x.sourceKneeNormalProfileGroups105>=3);
 }
 assert.ok(x.rearSourceNeutralNormalVarianceBefore105>=0);
 assert.ok(x.rearSourceNeutralNormalVarianceAfter105<=
  x.rearSourceNeutralNormalVarianceBefore105+.00005);
 assert.ok(x.protectedOriginalFrontNormalVertices105>=70);
 assert.equal(x.physicalClothSimulation105,false);
 assert.equal(x.independentHumanVisualRealismAcceptance105,false);
 assert.equal(x.physicalMobilePhonesVerified105,false);
 assert.equal(x.releaseAuthorized,false);
 assert.equal(x.familyAlpha,'HOLD');
 assert.equal(x.actualSkinnedDenimBodyCrossingSegments77,
  old.jeans.actualSkinnedDenimBodyCrossingSegments77);
 const diff={},imgs={};
 for(const view of [0,90,180]){
  await setView(page,view);
  imgs[view]=await screenshot(page,
   [figure,denim,'knee-'+degrees,'viewport-'+viewportWidth,'after','view-'+view].join('-'),
   {figure,denim,degrees,viewportWidth,view,kind:'after',
    sourceSHA256:original[denim]});
  diff[view]=await deltaPixels(beforeImages[view],imgs[view]);
 }
 // Actual render must change on neutral rear; no fabricated rear "photo".
 if(degrees===0){
  assert.equal(diff[0],0);
  assert.equal(diff[90],0);
  assert.equal(diff[180],0);
 }else{
  assert.ok(diff[90]>0||diff[180]>0,
   'True source-denim bent knee must visibly change neutral-rear shading '+JSON.stringify({
    figure,denim,degrees,viewportWidth,diff,
    groups:x.rearSourceNeutralSeamGroupsSmoothed105
   }));
 }
 return {figure,denim,degrees,viewportWidth,originalSourceSHA256:original[denim],
  pixelChangesByView:diff,
  sourceNeutralRearNormalsAdjusted:x.rearSourceNeutralNormalsAdjusted105,
  independentlyWeldedRearGroups:x.rearSourceNeutralSeamGroupsSmoothed105,
  normalVarianceBefore:x.rearSourceNeutralNormalVarianceBefore105,
  normalVarianceAfter:x.rearSourceNeutralNormalVarianceAfter105,
  originalFrontNormalsProtected:x.protectedOriginalFrontNormalVertices105,
  sampledBodyCrossingsBefore:old.jeans.actualSkinnedDenimBodyCrossingSegments77,
  sampledBodyCrossingsAfter:x.actualSkinnedDenimBodyCrossingSegments77,
  originalSourcePhotoAndUVPreserved:true,clothPhysicsCertified:false,
  independentHumanRealismCertified:false};
}
try{
 await mkdir(dir,{recursive:true});
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--enable-webgl'
 ]});
 for(const figure of ['female','male']){
  const context=await browser.newContext({viewport:{width:390,height:900},
   deviceScaleFactor:1,hasTouch:true,isMobile:true,serviceWorkers:'block'});
  const page=await context.newPage();
  page.on('pageerror',e=>browserErrors.push({figure,message:String(e.message)}));
  page.on('crash',()=>crashes.push(figure));
  page.on('request',r=>{
   if(!r.url().startsWith(host)&&!r.url().startsWith('blob:'+host)&&
    !r.url().startsWith('data:'))
    externalRequests.push({figure,scheme:new URL(r.url()).protocol});
  });
  await page.goto(host+
   '/research/three-d-69/index.html?denimDrape73=after&calf74=after&folds75=after&continuity76=after&contact77=on&knee78=on&knee103=on&knee104=on&knee105=on');
  await page.waitForFunction(()=>window.cc69Diagnostics?.()?.rig?.bones===163&&
   window.cc69Diagnostics().loaded===true,null,{timeout:180000});
  if(figure==='male'){
   await page.locator('#model').selectOption('male');
   await page.waitForFunction(()=>window.cc69Diagnostics?.()?.figure==='male'&&
    window.cc69Diagnostics().loaded===true,null,{timeout:180000});
  }
  await page.locator('#review').check();
  await page.locator('#wear').click();
  await page.waitForFunction(()=>window.cc69Diagnostics?.()?.actual3DGarment?.realPhotoApplied===true,
   null,{timeout:180000});
  for(const denim of ['public','second']){
   if(denim==='second'){
    await page.locator('#swap').click();
    await page.waitForFunction(()=>window.cc69Diagnostics?.()?.currentSelection==='second',
     null,{timeout:120000});
   }
   for(const degrees of [0,16])
    scenarios.push(await compare(page,{figure,denim,degrees,viewportWidth:390}));
   // Representative real original-source 320 and 430 mobile views, in
   // addition to complete 390 px male/female × both jeans benchmark.
   if(figure==='female'&&denim==='public')
    for(const viewportWidth of [320,430]){
     await page.setViewportSize({width:viewportWidth,height:900});
     scenarios.push(await compare(page,{figure,denim,degrees:16,viewportWidth}));
    }
  }
  await context.close();
 }
 assert.deepEqual(browserErrors,[]);
 assert.deepEqual(externalRequests,[]);
 assert.deepEqual(crashes,[]);
 assert.equal(scenarios.length,10);
 assert.equal(receipts.length,60);
 const report={
  priority:'PHOTO-DENIM-PANEL-NORMAL-CONTINUITY-105',
  genuineSourceOriginalJeans3D:true,realSourceSkinnedRigBones:163,
  distinctOriginalLicensedDenimSources:2,originalPhotographedShirtPreserved:true,
  trueMaleFemaleOriginalAnatomicalModels:true,
  actualChromiumViewports:[320,390,430],cameraViews:[0,90,180],
  trueOriginalPhotoGenuineWebGLScreenshots:60,realPoseDegrees:[0,16],
  independentlySkinnedNeutralRearSeamNormalSmoothing:true,
  originalPhotographFrontNormalsUVSkinUntouched:true,
  sameAngleBeforeAfterSourceAndContactConfirmed:true,
  originalPhotographicReverseProvided:false,
  naturalContinuousClothPhysicsCertified:false,
  independentlyHumanRatedPhotorealism:false,
  AndroidIphonePhysicalHardwareTested:false,
  customerPhotoTo3DFittingAccepted:false,
  liveSignedCloudPrivacyRLSVerified:false,
  releaseAuthorized:false,familyAlpha:'HOLD',
  scenarios,screenshots:receipts,
  browserErrors,externalRequests,crashes
 };
 await writeFile(dir+'/acceptance.json',JSON.stringify(report,null,2)+'\n');
 console.log('PHOTO105_ORIGINAL_DENIM_SEAM_NORMAL_TRUE_WEBGL',JSON.stringify({
  scenarios:scenarios.length,screenshots:receipts.length,viewports:[320,390,430],
  163:163,
  normalVariance:scenarios.map(s=>({figure:s.figure,denim:s.denim,
   knee:s.degrees,viewport:s.viewportWidth,
   normalBefore:s.normalVarianceBefore,
   normalAfter:s.normalVarianceAfter,
   rearPixelChanges:s.pixelChangesByView[180],
   sourceBodyContacts:s.sampledBodyCrossingsAfter
  })),
  originalPhotoSourceImmutable:true,releaseAuthorized:false,familyAlpha:'HOLD'
 }));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
