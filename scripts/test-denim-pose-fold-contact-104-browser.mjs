/**
 * PHOTO104 — real Chromium original licensed photograph / 163-bone WebGL
 * posterior fold BEFORE/AFTER on actual skinned male/female jeans, 390px.
 * No user photos, fake render, generated garment/back, physical phone,
 * full physics or invented source. Browser tests are not human visual votes.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import sharp from 'sharp';
const base=resolve('.'),dir='benchmark/three-d-104';
const sources={
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
};
const shirt='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const sha=b=>createHash('sha256').update(b).digest('hex');
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(p)||
    p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))
    throw Error('unapproved 3D original source URL');
  const file=resolve(base,'.'+p);
  if(!file.startsWith(base+'/'))throw Error('out of scope');
  const bytes=await readFile(file);
  const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html',
    '.glb':'model/gltf-binary','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('not available');}
});
async function countChanged(a,b){
 const [x,y]=await Promise.all([
  sharp(a).ensureAlpha().raw().toBuffer(),sharp(b).ensureAlpha().raw().toBuffer()
 ]);
 assert.equal(x.length,y.length);
 let changed=0;
 for(let i=0;i<x.length;i+=4)
  if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>20)changed++;
 return changed;
}
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port;
let browser;
const screenshots=[],scenarios=[],failures=[],offsite=[],crashes=[];
try{
 await mkdir(dir,{recursive:true});
 browser=await chromium.launch({headless:true,args:[
   '--use-gl=angle','--use-angle=swiftshader',
   '--enable-unsafe-swiftshader','--enable-webgl'
 ]});
 for(const figure of ['female','male']){
  const context=await browser.newContext({viewport:{width:390,height:900},
   deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  page.on('pageerror',e=>failures.push({figure,message:String(e.message)}));
  page.on('crash',()=>crashes.push(figure));
  page.on('request',r=>{
   if(!r.url().startsWith(host)&&!r.url().startsWith('blob:'+host)&&
     !r.url().startsWith('data:'))
    offsite.push({figure,protocol:new URL(r.url()).protocol});
  });
  await page.goto(host+
   '/research/three-d-69/index.html?denimDrape73=after&calf74=after&folds75=after&continuity76=after&contact77=on&knee78=on&knee103=on&knee104=on');
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
   const result={figure,denim,sourceSHA256:sources[denim],
    cases:[],originalPhotographicFrontUntouched:true,
    noUnsupportedRearImage:true,independentVisualAssessment:'PENDING'};
   let source0Image;
   for(const degrees of [0,8,16]){
    // First reset any previous P104 fold by calling P104 true SOURCE,
    // then baseline P103 on that same exact anatomical knee angle.
    await page.evaluate(()=>window.cc104KneeStep(0,0));
    const before=await page.evaluate(deg=>{
     const state=window.cc103KneeStep(deg,0);
     return {stats:state.pants,rig:window.cc69Diagnostics().rig};
    },degrees);
    assert.equal(before.rig.bones,163);
    assert.equal(before.stats.sourceSHA256,sources[denim]);
    assert.equal(before.stats.real163BoneSampledKnee103.leftDegrees,degrees);
    assert.equal(before.stats.originalPhotoUVRestFrontSkinPositionsBytePreserved77,true);
    assert.ok(Number.isSafeInteger(before.stats.actualSkinnedDenimBodyCrossingSegments77));
    const beforePixels={};
    for(const view of [45,90]){
     const state=await page.evaluate(angle=>window.cc69SetView(angle),view);
     assert.ok(Math.abs(state.camera-view)<.02);
     await page.waitForTimeout(90);
     const bytes=await page.locator('#avatar').screenshot({animations:'disabled'});
     const name=[figure,denim,'knee-'+degrees,'source',view].join('-')+'.png';
     await writeFile(dir+'/'+name,bytes);
     const meta=await sharp(bytes).metadata();
     assert.ok(meta.width>=200&&meta.height>=300&&bytes.length>3000);
     screenshots.push({file:name,figure,denim,kind:'source',degrees,view,
      sourceSHA256:sources[denim],sha256:sha(bytes),width:meta.width,height:meta.height});
     beforePixels[view]=bytes;
    }
    if(degrees===0)source0Image=beforePixels[90];
    const after=await page.evaluate(deg=>{
     const out=window.cc104KneeStep(deg,0);
     const d=window.cc69Diagnostics();
     return {stats:out.pants,rig:d.rig,photo:d.actual3DGarment};
    },degrees);
    const p=after.stats,fold=p.sourceKneeFold104;
    assert.equal(after.rig.bones,163);
    assert.equal(after.photo.originalPhotoSHA256s.bottom,sources[denim]);
    assert.equal(after.photo.originalPhotoSHA256s.top,shirt);
    assert.equal(p.poseResponsiveDenim104,true);
    assert.equal(p.originalDenimFrontSourceAndSkinProtected104,true);
    assert.equal(p.originalPhotoUVRestFrontSkinPositionsBytePreserved77,true);
    assert.equal(p.neutralRearOnlyFold104,true);
    assert.equal(p.sourceSHA256,sources[denim]);
    assert.equal(p.originalSourceJPEGAndRGBNotModified104===true||degrees===0,true);
    assert.equal(p.realClothPhysicsSimulated104,false);
    assert.equal(p.continuousSweptCollisionCertified104,false);
    assert.equal(p.independentHumanPhotorealismApproved104,false);
    assert.equal(p.releaseAuthorized,false);
    assert.equal(p.familyAlpha,'HOLD');
    assert.equal(fold.contactAfter<=fold.contactBefore,true);
    assert.equal(fold.contactAfter,p.actualSkinnedDenimBodyCrossingSegments77);
    assert.equal(p.actualSkinnedDenimBodyCrossingCategories77.reviewedSegments,
     p.actualSkinnedDenimBodyCrossingSegments77);
    if(degrees===0)assert.equal(fold.moved,0);
    else{
     assert.ok(fold.moved>=8,JSON.stringify({figure,denim,degrees,fold}));
     assert.ok(fold.maxShift>.0002&&fold.maxShift<=.011001);
     assert.ok(fold.protectedFront>=70);
     assert.ok(fold.positiveLeg>=8&&fold.negativeLeg===0);
     assert.ok([1,.5,.25].includes(fold.multiplier));
    }
    const pixelDelta={};
    for(const view of [45,90]){
     const state=await page.evaluate(angle=>window.cc69SetView(angle),view);
     assert.ok(Math.abs(state.camera-view)<.02);
     await page.waitForTimeout(90);
     const bytes=await page.locator('#avatar').screenshot({animations:'disabled'});
     const name=[figure,denim,'knee-'+degrees,'fold',view].join('-')+'.png';
     await writeFile(dir+'/'+name,bytes);
     const meta=await sharp(bytes).metadata();
     screenshots.push({file:name,figure,denim,kind:'fold',degrees,view,
      sourceSHA256:sources[denim],sha256:sha(bytes),width:meta.width,height:meta.height});
     pixelDelta[view]=await countChanged(beforePixels[view],bytes);
    }
    if(degrees===0){
     assert.equal(pixelDelta[90],0,'No knee movement must not invent clothing fold');
     assert.equal(pixelDelta[45],0);
    }else{
     assert.ok(pixelDelta[90]>15||pixelDelta[45]>15,
      'Actual posed source-neutral 3D jeans must show an additional fold beyond rigid source-pose bone skinning: '+
      JSON.stringify({figure,denim,degrees,pixelDelta,fold}));
    }
    result.cases.push({degrees,foldMovedVertices:fold.moved,
     foldMaxWorldShift:fold.maxShift,
     foldAmplitudeMultiplier:fold.multiplier,
     originalPhotoFrontVerticesGuarded:fold.protectedFront,
     sourceNeutralRearVerticesAffected:fold.sourceRearOnly||0,
     actualBodyCrossingsBefore:fold.contactBefore,
     actualBodyCrossingsAfter:fold.contactAfter,
     originalPhotoAndSkinUnchanged:true,pixelDelta,
     sourcePhotoSHA256:sources[denim]});
   }
   await page.evaluate(()=>window.cc104KneeStep(0,0));
   await page.evaluate(()=>window.cc69SetView(90));
   await page.waitForTimeout(90);
   const restoreImage=await page.locator('#avatar').screenshot({animations:'disabled'});
   const resetPixels=await countChanged(source0Image,restoreImage);
   assert.equal(resetPixels,0,
    'Re-applying source zero must restore original photographed 3D pixels exactly, without pose folds accumulating');
   result.originalSourceRestorationChangedPixels=resetPixels;
   scenarios.push(result);
  }
  await context.close();
 }
 assert.deepEqual(failures,[]);assert.deepEqual(offsite,[]);assert.deepEqual(crashes,[]);
 assert.equal(scenarios.length,4);
 assert.equal(screenshots.length,48);
 const report={
  priority:'PHOTO-DENIM-POSE-FOLD-CONTACT-104',realWebGL:true,originalRigBones:163,
  originalPublicLicensedDenimPhotos:2,sourcePhotographedShirtPreserved:true,
  maleFemaleOriginalAnatomicalModels:true,viewportCSSWidth:390,
  angles:[0,8,16],views:[45,90],screenshotsCount:48,
  actualVertexDeformationOnSourceNeutralRear:true,
  sourceJPEGAndVisiblePhotoFrontUnchanged:true,
  trueSkinnedBodyTriangleContactsSampled:true,
  poseRestorationExactPixels:true,
  realTimeMassSpringClothSimulated:false,
  continuousSweptCollisionVerified:false,
  customerOwnedGarmentFitVerified:false,
  independentHumanVisualPhotorealismApproved:false,
  physicalPhonesVerified:false,
  realSignedSupabaseCloudVerified:false,
  releaseAuthorized:false,familyAlpha:'HOLD',
  scenarios,screenshots,browserErrors:failures,externalRequests:offsite,crashes
 };
 await writeFile(dir+'/acceptance.json',JSON.stringify(report,null,2)+'\n');
 console.log('PHOTO104_TRUE_SOURCE_DENIM_POSE_FOLD',JSON.stringify({
  cases:scenarios.length,screenshots:screenshots.length,
  comparisons:scenarios.map(x=>({figure:x.figure,denim:x.denim,
   folds:x.cases.map(y=>({knee:y.degrees,extraPixels:y.pixelDelta[90],
    moved:y.foldMovedVertices,maxShift:y.foldMaxWorldShift,
    bodyContactsBefore:y.actualBodyCrossingsBefore,
    bodyContactsAfter:y.actualBodyCrossingsAfter})),
   originalSourceResetPixels:x.originalSourceRestorationChangedPixels})),
  originalPhotoUnchanged:true,releaseAuthorized:false,familyAlpha:'HOLD'
 }));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
