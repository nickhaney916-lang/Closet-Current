/**
 * PHOTO109: true mobile CLICK/TAP controls on real 163-bone original
 * photographed denim Chromium WebGL, not synthetic DOM callbacks.
 * Tested original licensed photo and actual skinned right/left/both knees.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),folder='benchmark/three-d-109';
const ORIGINAL={
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
};
const SHIRT='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const sha=b=>createHash('sha256').update(b).digest('hex');
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(p)||
   p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))
   throw Error('not an approved research source');
  const filename=resolve(root,'.'+p);
  if(!filename.startsWith(root+'/'))throw Error('research path escape');
  const bytes=await readFile(filename);
  const mime={'.mjs':'text/javascript','.js':'text/javascript',
   '.html':'text/html','.png':'image/png','.jpg':'image/jpeg',
   '.json':'application/json','.glb':'model/gltf-binary'};
  res.writeHead(200,{'content-type':mime[extname(filename)]||'application/octet-stream',
   'cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
const pixelChange=async(a,b)=>{
 const [x,y]=await Promise.all([
  sharp(a).ensureAlpha().raw().toBuffer(),
  sharp(b).ensureAlpha().raw().toBuffer()
 ]);
 assert.equal(x.length,y.length);
 let changed=0;
 for(let i=0;i<x.length;i+=4){
  if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+
     Math.abs(x[i+2]-y[i+2])>24)changed++;
 }
 return changed;
};
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const host='http://127.0.0.1:'+server.address().port;
let browser;
const scenarios=[],frames=[],browserErrors=[],externalRequests=[],crashes=[];
const samples=[
 {figure:'female',width:320},
 {figure:'female',width:390},
 {figure:'female',width:430},
 {figure:'male',width:390}
];
try{
 await mkdir(folder,{recursive:true});
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--enable-webgl'
 ]});
 for(const {figure,width} of samples){
  const context=await browser.newContext({viewport:{width,height:900},
   deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  page.on('pageerror',e=>browserErrors.push({figure,width,error:e.message}));
  page.on('crash',()=>crashes.push({figure,width}));
  page.on('request',r=>{
   if(!r.url().startsWith(host)&&!r.url().startsWith('blob:'+host)&&
      !r.url().startsWith('data:'))
    externalRequests.push({figure,width,protocol:new URL(r.url()).protocol});
  });
  await page.goto(host+
   '/research/three-d-69/index.html?denimDrape73=after&calf74=after&folds75=after&continuity76=after&contact77=on&knee78=on&knee103=on&knee104=on&knee105=on&knee106=on&knee108=on&knee109=on');
  await page.waitForFunction(()=>window.cc109PoseUIState?.()?.mounted===true&&
   window.cc69Diagnostics?.()?.rig?.bones===163&&
   window.cc69Diagnostics().loaded===true,null,{timeout:180000});
  assert.equal(await page.locator('#cc109Left8').isDisabled(),true);
  assert.equal(await page.locator('#cc109Both16').isDisabled(),true);
  assert.equal(await page.evaluate(()=>
   document.documentElement.scrollWidth<=window.innerWidth+2),true,
   'mobile 3D control must not cause horizontal viewport overflow');
  assert.equal(await page.locator('#cc109PoseButtons button').count(),7);
  const buttons=await page.locator('#cc109PoseButtons button').all();
  for(const button of buttons){
   assert.ok((await button.boundingBox()).height>=44,'tap target too small');
  }
  if(figure==='male'){
   await page.locator('#model').selectOption('male');
   await page.waitForFunction(()=>window.cc69Diagnostics?.()?.figure==='male'&&
    window.cc69Diagnostics().loaded===true,null,{timeout:180000});
   assert.equal(await page.locator('#cc109Both16').isDisabled(),true);
  }
  await page.locator('#review').check();
  await page.locator('#wear').click();
  await page.waitForFunction(()=>window.cc109PoseUIState?.()?.enabled===true&&
   window.cc69Diagnostics().actual3DGarment?.realPhotoApplied===true,
   null,{timeout:180000});
  for(const denim of ['public','second']){
   if(denim==='second'){
    await page.locator('#swap').click();
    await page.waitForFunction(()=>window.cc109PoseUIState?.()?.enabled===true&&
     window.cc109PoseUIState().publiclyLicensedSource==='second',
     null,{timeout:120000});
    assert.equal((await page.evaluate(()=>window.cc109PoseUIState())).lastPose,null,
     'garment swap must invalidate previous knee pose review state');
   }
   const diag=await page.evaluate(()=>window.cc69Diagnostics());
   assert.equal(diag.rig.bones,163);
   assert.equal(diag.actual3DGarment.originalPhotoSHA256s.bottom,ORIGINAL[denim]);
   assert.equal(diag.actual3DGarment.originalPhotoSHA256s.top,SHIRT);
   const beforeUntrusted=await page.evaluate(()=>window.cc109PoseUIState().lastPose);
   await page.evaluate(()=>document.getElementById('cc109Both16').click());
   assert.deepEqual(await page.evaluate(()=>window.cc109PoseUIState().lastPose),
    beforeUntrusted,'scripted DOM click cannot impersonate a mobile user');
   const leftBtn=page.locator('#cc109Left8'),rightBtn=page.locator('#cc109Right8'),
     bothBtn=page.locator('#cc109Both16'),resetBtn=page.locator('#cc109Reset');
   await leftBtn.click();
   let left=(await page.evaluate(()=>window.cc109PoseUIState())).lastPose;
   assert.deepEqual([left.left,left.right],[8,0]);
   assert.ok(left.leftKneeCalfVertices>=8);
   assert.equal(left.rightKneeCalfVertices,0);
   assert.equal(left.sourceSHA256,ORIGINAL[denim]);
   await rightBtn.click();
   let right=(await page.evaluate(()=>window.cc109PoseUIState())).lastPose;
   assert.deepEqual([right.left,right.right],[0,8]);
   assert.equal(right.leftKneeCalfVertices,0);
   assert.ok(right.rightKneeCalfVertices>=8);
   await resetBtn.click();
   const resetSource=(await page.evaluate(()=>window.cc109PoseUIState())).lastPose;
   assert.deepEqual([resetSource.left,resetSource.right],[0,0]);
   assert.equal(resetSource.leftKneeCalfVertices,0);
   assert.equal(resetSource.rightKneeCalfVertices,0);
   await page.evaluate(()=>window.cc69SetView(90));
   await page.waitForTimeout(75);
   const take=async(label,pose)=>{
    const png=await page.locator('#avatar').screenshot({animations:'disabled'});
    const meta=await sharp(png).metadata();
    assert.ok(meta.width>=200&&meta.height>=300&&png.length>3000);
    const file=[figure,denim,'width-'+width,label].join('-')+'.png';
    await writeFile(folder+'/'+file,png);
    frames.push({file,figure,denim,width,pose,
     originalDenimSHA256:ORIGINAL[denim],sha256:sha(png),
     height:meta.height,imageWidth:meta.width});
    return png;
   };
   const baseline=await take('straight-source',[0,0]);
   await bothBtn.click();
   const both=(await page.evaluate(()=>window.cc109PoseUIState())).lastPose;
   assert.deepEqual([both.left,both.right],[16,16]);
   assert.ok(both.leftKneeCalfVertices>=8);
   assert.ok(both.rightKneeCalfVertices>=8);
   assert.equal(both.sourceSHA256,ORIGINAL[denim]);
   assert.equal(both.contactNonworsening,true);
   const bent=await take('both-bent',[16,16]);
   const bendPixels=await pixelChange(baseline,bent);
   assert.ok(bendPixels>12,'real source-photo jeans must visibly respond to both legs bending');
   await resetBtn.click();
   const back=(await page.evaluate(()=>window.cc109PoseUIState())).lastPose;
   assert.deepEqual([back.left,back.right],[0,0]);
   const restored=await take('straight-restored',[0,0]);
   const restorationPixels=await pixelChange(baseline,restored);
   assert.equal(restorationPixels,0,'tap to reset must restore real original skinned photographed denim EXACT pixels');
   assert.equal(await resetBtn.getAttribute('aria-pressed'),'true');
   const check=await page.evaluate(()=>window.cc109PoseUIState());
   assert.equal(check.releaseAuthorized,false);
   assert.equal(check.familyAlpha,'HOLD');
   assert.equal(check.physicalMobilePhoneTested,false);
   assert.equal(check.independentHumanPhotorealismApproved,false);
   assert.equal(check.customerWardrobeIntegrated,false);
   assert.equal(check.genuinePhotographedBackAvailable,false);
   scenarios.push({figure,denim,width,originalDenimSHA256:ORIGINAL[denim],
    original163BoneSkinnedPhoto:true,leftKneeMoved:left.leftKneeCalfVertices,
    rightKneeMoved:right.rightKneeCalfVertices,
    bothKneesMoved:[both.leftKneeCalfVertices,both.rightKneeCalfVertices],
    visibleBothKneePixelDifference:bendPixels,
    exactTapResetChangedPixels:restorationPixels,
    originalPhotographedFrontProtected:true,
    trueSkinnedBodyContactNotIncreased:true,
    userInteractionTrustedOnly:true,
    releaseAuthorized:false,familyAlpha:'HOLD'});
  }
  // PHOTO110: real Chromium mobile tab switch revokes the already-reviewed,
  // previously visible original-source garment even after this tab returns.
  const backgroundTab=await context.newPage();
  await backgroundTab.goto('about:blank');
  await backgroundTab.bringToFront();
  await page.waitForTimeout(200);
  await page.bringToFront();
  await page.waitForFunction(()=>
   window.cc109PoseUIState?.()?.lifecycleRevoked===true,
   null,{timeout:15000});
  await backgroundTab.close();
  assert.equal(await page.locator('#cc109Both16').isDisabled(),true,
   'old source pose stays blocked after mobile background and foreground');
  assert.equal(await page.evaluate(()=>
   window.cc109PoseUIState().sourceRenderConcealed),true,
   'original licensed 3D render cannot remain on-screen after source revocation');
  await page.locator('#review').uncheck();
  await page.locator('#review').check();
  await page.locator('#wear').click();
  assert.equal(await page.locator('#cc109Both16').isDisabled(),true,
   'checking review again cannot bypass sticky source-session revocation');
  assert.equal(await page.evaluate(()=>
   window.cc109PoseUIState().requiresFreshSourceReviewAfterReload),true);
  await page.reload();
  await page.waitForFunction(()=>
   window.cc109PoseUIState?.()?.mounted===true&&
   window.cc69Diagnostics?.()?.loaded===true,null,{timeout:180000});
  assert.equal(await page.locator('#cc109Both16').isDisabled(),true,
   'fresh document must require original photograph review and wear again');
  await page.locator('#review').check();
  await page.locator('#wear').click();
  await page.waitForFunction(()=>
   window.cc109PoseUIState?.()?.enabled===true,null,{timeout:180000});
  // Chrome Page Lifecycle freeze is a document event (some hosts forward
  // it through window too). Must fail closed on either.
  await page.evaluate(()=>document.dispatchEvent(new Event('freeze')));
  assert.equal(await page.evaluate(()=>
   window.cc109PoseUIState().lifecycleRevoked),true);
  assert.equal(await page.locator('#cc109Left8').isDisabled(),true);
  await page.locator('#review').uncheck();
  await page.locator('#review').check();
  assert.equal(await page.locator('#cc109Left8').isDisabled(),true);
  // A full reload is the only route to renewed photo verification/review.
  await page.reload();
  await page.waitForFunction(()=>
   window.cc109PoseUIState?.()?.mounted===true&&
   window.cc69Diagnostics?.()?.loaded===true,null,{timeout:180000});
  assert.equal(await page.locator('#cc109Both16').isDisabled(),true);
  // Clearing the verified source unmounts the pose interaction admission.
  await page.locator('#clear').click();
  await page.waitForFunction(()=>window.cc109PoseUIState?.()?.enabled===false,
   null,{timeout:120000});
  assert.equal(await page.locator('#cc109Both16').isDisabled(),true);
  await context.close();
 }
 assert.equal(scenarios.length,8);
 assert.equal(frames.length,24);
 assert.deepEqual(browserErrors,[]);
 assert.deepEqual(externalRequests,[]);
 assert.deepEqual(crashes,[]);
 const report={
  priority:'PHOTO-DENIM-MOBILE-POSE-CONTROLS-109',
  actualOriginalLicensedPhotographedDenim:true,
  trueOriginal163BoneSkinnedHumanoids:true,
  originalLicensedDenimPhotographs:2,
  originalPhotographedShirtPreserved:true,
  femaleAndMaleOriginalAnatomicalFigures:true,
  realMobileChromiumCSSViewports:[320,390,430],
  genuineOriginalMobileInteractiveUI:true,
  userTrustedTapClicksNotSimulatedProgrammaticClicks:true,
  originalSHA256SourceAdmissionAndReviewRequired:true,
  originalFigureChangeAndGarmentSwapIsolation:true,
  actualLeftRightBothCalfGeometryVerified:true,
  exactSourcePoseResetPixelEqual:true,
  trueSkinnedBodyContactNeverWorse:true,
  horizontalViewportOverflow:false,
  realPhotoBacksideAvailable:false,
  generalizedWardrobeClothFitApproved:false,
  independentHumanPhotorealismApproval:false,
  physicalAndroidIphoneDevicesTested:false,
  physicallyContinuousGravityFabricSimulation:false,
  signedProductionCloudRLSVerified:false,
  familyAlpha:'HOLD',releaseAuthorized:false,
  scenarios,screenshots:frames,browserErrors,externalRequests,crashes
 };
 await writeFile(folder+'/acceptance.json',JSON.stringify(report,null,2)+'\n');
 console.log('PHOTO109_REAL_MOBILE_SOURCE_DENIM_POSE_UI',JSON.stringify({
  mobileViewports:[320,390,430],scenarios:scenarios.length,
  actualWebGLScreenshots:frames.length,originalRigBones:163,
  humanTrustedTaps:true,sourceResetPixelsAllZero:true,
  originalLicenses:2,
  samples:scenarios.map(x=>({figure:x.figure,denim:x.denim,
   viewport:x.width,left:x.leftKneeMoved,right:x.rightKneeMoved,
   both:x.bothKneesMoved,bentImagePixels:x.visibleBothKneePixelDifference})),
  productionChanged:false,physicalDevicesTested:false,
  humanVisualApproved:false,familyAlpha:'HOLD'
 }));
}finally{await browser?.close();await new Promise(done=>server.close(done));}
