/**
 * PHOTO103 real Chromium source-photographed jeans 163-bone sampled flex.
 * Actual original licensed JPEGs and original body mesh, NOT fake cloth
 * simulation, not a physical phone, not a model from a private wardrobe.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),dir='benchmark/three-d-103';
const hash=b=>createHash('sha256').update(b).digest('hex');
const sources={
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
};
const sourceShirt='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(path)||
   path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('Non-original research URL');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/'))throw Error('Escape research');
  const data=await readFile(file);
  const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html',
   '.glb':'model/gltf-binary','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
const countChanged=async(a,b)=>{
 const [x,y]=await Promise.all([
  sharp(a).ensureAlpha().raw().toBuffer(),sharp(b).ensureAlpha().raw().toBuffer()
 ]);
 assert.equal(x.length,y.length);
 let n=0;
 for(let i=0;i<x.length;i+=4)
  if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>24)n++;
 return n;
};
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port;
let browser;
const rows=[],photos=[],comparisons=[],errors=[],requests=[],crashes=[];
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
  page.on('pageerror',error=>errors.push({figure,message:String(error.message)}));
  page.on('crash',()=>crashes.push(figure));
  page.on('request',r=>{
   if(!r.url().startsWith(host)&&!r.url().startsWith('blob:'+host)&&
      !r.url().startsWith('data:'))
    requests.push({figure,urlKind:new URL(r.url()).protocol});
  });
  await page.goto(host+
   '/research/three-d-69/index.html?denimDrape73=after&calf74=after&folds75=after&continuity76=after&contact77=on&knee78=on&knee103=on');
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
   const frames={},samples=[];
   for(const angle of [0,4,8,12,16]){
    const row=await page.evaluate(a=>{
     const state=window.cc103KneeStep(a,0);
     const diag=window.cc69Diagnostics(),d=window.cc73State();
     return {state:state.pants,actual:diag.actual3DGarment,
      denim:d.denim,sourceRig:diag.rig};
    },angle);
    const p=row.denim,step=p.real163BoneSampledKnee103;
    assert.equal(row.sourceRig.bones,163);
    assert.equal(row.actual.originalPhotoSHA256s.bottom,sources[denim]);
    assert.equal(row.actual.originalPhotoSHA256s.top,sourceShirt);
    assert.equal(p.sourceSHA256,sources[denim]);
    assert.equal(p.sampledPhotoDenimKnee103,true);
    assert.equal(p.originalJPEGAndSourceMappedFabricPreserved103,true);
    assert.equal(p.originalPhotoUVRestFrontSkinPositionsBytePreserved77,true);
    assert.equal(p.actualSkinnedDenimBodyCrossingCategories77.reviewedSegments,
     p.actualSkinnedDenimBodyCrossingSegments77);
    assert.equal(p.sampleOnlyNoContinuousPhysics103,true);
    assert.equal(p.intermediateKneeCrossings103,
     p.actualSkinnedDenimBodyCrossingSegments77);
    assert.equal(step.leftDegrees,angle);
    assert.equal(step.rightDegrees,0);
    assert.equal(step.actualAnatomicalLowerLegBones.length,2);
    assert.equal(step.genuineOriginal163BoneRig,true);
    assert.equal(step.originalSourceSHA256,sources[denim]);
    assert.equal(step.originalPhotoUVRestAndSkinPreserved,true);
    assert.equal(step.realDynamicClothPhysics,false);
    assert.equal(step.fullSweptCollisionCertified,false);
    assert.equal(step.humanVisualRealismApproved,false);
    assert.equal(p.releaseAuthorized,false);
    samples.push({left:angle,right:0,intersections:p.intermediateKneeCrossings103,
     sourceSHA256:p.sourceSHA256,originalUVUnchanged:true});
    for(const view of [45,90]){
     const angled=await page.evaluate(a=>window.cc69SetView(a),view);
     assert.ok(Math.abs(angled.camera-view)<.02);
     await page.waitForTimeout(90);
     const png=await page.locator('#avatar').screenshot({animations:'disabled'});
     const meta=await sharp(png).metadata();
     assert.ok(meta.width>=200&&meta.height>=300&&png.length>3000);
     const filename=[figure,denim,'knee-'+angle,'view-'+view].join('-')+'.png';
     await writeFile(dir+'/'+filename,png);
     frames[[angle,view].join('-')]=png;
     photos.push({file:filename,figure,denim,leftDegrees:angle,
      view,width:meta.width,height:meta.height,sha256:hash(png),
      sourceSHA256:p.sourceSHA256});
    }
   }
   // Explicit both-knee sample beyond the one-leg stroke. It is a real
   // sampled posed skinned contact audit, NOT an untested animation interval.
   const both=await page.evaluate(()=>window.cc103KneeStep(16,16));
   assert.equal(both.pants.real163BoneSampledKnee103.leftDegrees,16);
   assert.equal(both.pants.real163BoneSampledKnee103.rightDegrees,16);
   assert.ok(Number.isSafeInteger(both.pants.intermediateKneeCrossings103));
   const lastView=await page.evaluate(()=>window.cc69SetView(90));
   assert.ok(Math.abs(lastView.camera-90)<.02);
   const bothPng=await page.locator('#avatar').screenshot({animations:'disabled'});
   const bm=await sharp(bothPng).metadata();
   const bothName=[figure,denim,'both-16','view-90'].join('-')+'.png';
   await writeFile(dir+'/'+bothName,bothPng);
   photos.push({file:bothName,figure,denim,leftDegrees:16,rightDegrees:16,
    view:90,width:bm.width,height:bm.height,sha256:hash(bothPng),
    sourceSHA256:sources[denim]});
   // Return to true source after 5+1 actual alternating anatomical poses,
   // proving source-relative placement does not accumulate hidden deform.
   const reset=await page.evaluate(()=>window.cc103KneeStep(0,0));
   assert.equal(reset.pants.real163BoneSampledKnee103.leftDegrees,0);
   const rangle=await page.evaluate(()=>window.cc69SetView(90));
   assert.ok(Math.abs(rangle.camera-90)<.02);
   await page.waitForTimeout(90);
   const resetPng=await page.locator('#avatar').screenshot({animations:'disabled'});
   const resetChanged=await countChanged(frames['0-90'],resetPng);
   const change04=await countChanged(frames['0-90'],frames['4-90']);
   const change816=await countChanged(frames['8-90'],frames['16-90']);
   const change016=await countChanged(frames['0-90'],frames['16-90']);
   // >0 observed source-skinned visual motion required, without claiming
   // smooth time interpolation or full collision freedom.
   assert.ok(change016>30,'Actual posed original photo-denim must visibly bend: '+JSON.stringify({figure,denim,change04,change816,change016}));
   assert.ok(resetChanged<1000,'Absolute source pose restoration must avoid cumulative deformation: '+JSON.stringify({figure,denim,resetChanged}));
   rows.push({figure,denim,samples,sourceSHA256:sources[denim],
    maxContactCount:Math.max(...samples.map(s=>s.intersections)),
    minContactCount:Math.min(...samples.map(s=>s.intersections)),
    bothKneesIntersectingSegments:both.pants.intermediateKneeCrossings103,
    fullSweptContactCertified:false,originalSourceUnchanged:true});
   comparisons.push({figure,denim,
    genuine163BoneSourceSkinnedMotion:true,
    photographedSourceOriginalSHA256:sources[denim],
    sourceRelativeResetChangedPixels:resetChanged,
    fourDegreeChangedPixels:change04,
    eightToSixteenChangedPixels:change816,
    sourceToSixteenChangedPixels:change016,
    humanRealismApproval:'PENDING',physicalPhoneTested:false,
    originalPhotoMappingBytePreserved:true});
  }
  await context.close();
 }
 assert.equal(rows.length,4);
 assert.equal(comparisons.length,4);
 assert.equal(photos.length,44);
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);assert.deepEqual(crashes,[]);
 const report={
  priority:'PHOTO-DENIM-INTERMEDIATE-KNEE-103',
  genuineCC0Original3D:true,actualAnatomicalBones:163,
  originalDenimAndShirtSourcePhotosVerified:true,
  originalPhotoBytesPreserved:true,originalPhotoUVAndSkinPreserved:true,
  realAnatomicalSkinnedPhotoDenimIntermediateMotion:true,
  distinctOriginalDenimSources:2,maleAndFemaleVerified:true,
  viewportCSSWidth:390,sourcePosesDegrees:[0,4,8,12,16],
  cameraAngles:[45,90],realBrowser:'Chromium',screenshotCount:photos.length,
  independentPhotoSources:sourceShirt?3:0,
  realSkinnedBodyGarmentTriangleContactsMeasured:true,
  contactsAcrossEntireSweptIntervalCertified:false,
  physicallySimulatedGravityCloth:false,
  humanPhotorealismApproved:false,physicalAndroidIphoneTested:false,
  realCustomerPhotosFitted:false,realSignedCloudRLSVerified:false,
  productionDeployed:false,releaseAuthorized:false,familyAlpha:'HOLD',
  rows,comparisons,screenshots:photos,
  browserErrors:errors,externalRequests:requests,rendererCrashes:crashes
 };
 await writeFile(dir+'/acceptance.json',JSON.stringify(report,null,2)+'\n');
 console.log('PHOTO103_GENUINE_163_BONE_SOURCE_DENIM_KNEE_INTERMEDIATE',JSON.stringify({
  photoSources:2,figureTypes:2,intermediatePoseSamples:24,
  screenshots:photos.length,
  comparisons:comparisons.map(x=>({figure:x.figure,denim:x.denim,
   pixelsChanged0to16:x.sourceToSixteenChangedPixels,resetDelta:x.sourceRelativeResetChangedPixels})),
  releaseAuthorized:false,familyAlpha:'HOLD'
 }));
}finally{await browser?.close();await new Promise(done=>server.close(done));}
