/** Parallel #9 — real Chromium WebGL, source photographed skinned denim,
 * actual left/right/both knee bone poses and strict same-pose before/after.
 * 72 actual PNG = 2 figures x 3 widths x 2 original denims x
 * 3 camera angles x 2 real geometry modes. No invented image evidence.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import sharp from 'sharp';
import {chromium} from 'playwright';

const output='benchmark/denim-flex-3d-01',root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(path)||
   path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('Only local licensed research assets');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/'))throw Error('Path traversal');
  const data=await readFile(file);
  const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript',
   '.glb':'model/gltf-binary','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('Unavailable');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
const DENIM=Object.freeze({
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'});
const SHIRT='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const MODES=['before','after'],POSES=['source','left-12','right-12','both-16'],ANGLES=[0,90,180];
const frames=new Map(),cases=[],comparisons=[],allContacts=[],restorations=[],performance=[];
let browser;
async function diff(a,b){
 const x=await sharp(a).ensureAlpha().raw().toBuffer();
 const y=await sharp(b).ensureAlpha().raw().toBuffer();
 assert.equal(x.length,y.length);
 let count=0;
 for(let i=0;i<x.length;i+=4)
  if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>24)count++;
 return count;
}
function validateState(diag,denim,figure){
 assert.equal(diag.rig.bones,163);
 assert.equal(diag.figure,figure);
 assert.equal(diag.actual3DGarment.realPhotoApplied,true);
 assert.ok(diag.actual3DGarment.real3DSkinnedGarmentMeshes>=2);
 assert.equal(diag.actual3DGarment.originalPhotoSHA256s.top,SHIRT);
 assert.equal(diag.actual3DGarment.originalPhotoSHA256s.bottom,DENIM[denim]);
 assert.equal(diag.actual3DGarment.releaseAuthorized,false);
}
async function capture(page,which){
 const c=await page.evaluate(()=>{
  const canvas=document.querySelector('#avatar');
  return {webgl2:!!canvas.getContext('webgl2'),
   frames:Number(canvas.dataset.frames||0),
   horizontalOverflow:document.documentElement.scrollWidth>window.innerWidth+1};
 });
 assert.ok(c.webgl2&&c.frames>1,'real anatomical WebGL2 frame required');
 // Research 3D69 historical control layout may horizontally scroll at 320,
 // record but do not misrepresent that as the new feature's mobile layout.
 const png=await page.locator('#avatar').screenshot();
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const sample=await sharp(png).resize(60,60).removeAlpha().raw().toBuffer();
 assert.ok(Math.max(...sample)-Math.min(...sample)>18,'nonblank genuine rendered body/denim required');
 frames.set(which,png);await writeFile(output+'/'+which+'.png',png);
 return {webgl:true,bytes:png.length,pixelRange:Math.max(...sample)-Math.min(...sample),overflow:c.horizontalOverflow};
}
try{
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir(output,{recursive:true});
 for(const width of [320,390,430])for(const figure of ['female','male'])
  for(const mode of MODES){
   const context=await browser.newContext({viewport:{width,height:900},
    deviceScaleFactor:1,isMobile:true,hasTouch:true});
   const page=await context.newPage(),errors=[],offsite=[];
   page.on('pageerror',e=>errors.push(String(e.message)));
   page.on('request',q=>{
    const u=q.url();
    if(!u.startsWith(host)&&!u.startsWith('blob:'+host)&&!u.startsWith('data:'))
     offsite.push(u);
   });
   const url=host+'/research/denim-flex-3d-01/index.html?denimDrape73=after&calf74=after&folds75=after&continuity76=after&contact77=on&knee78=on&flex79='+mode;
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.cc69Diagnostics?.()?.loaded===true&&
    window.cc69Diagnostics()?.rig?.bones===163,null,{timeout:180000});
   if(figure==='male'){
    await page.locator('#model').selectOption('male');
    await page.waitForFunction(()=>window.cc69Diagnostics?.()?.loaded===true&&
     window.cc69Diagnostics()?.figure==='male',null,{timeout:180000});
   }
   await page.locator('#review').check();await page.locator('#wear').click();
   await page.waitForFunction(()=>window.cc69Diagnostics?.()?.actual3DGarment?.realPhotoApplied===true,
    null,{timeout:180000});
   for(const denim of ['public','second']){
    if(denim==='second'){
     await page.locator('#swap').click();
     await page.waitForFunction(()=>window.cc69Diagnostics?.()?.currentSelection==='second',
      null,{timeout:180000});
    }
    const current=await page.evaluate(()=>window.cc69Diagnostics());
    validateState(current,denim,figure);
    const poseResults={};
    for(const pose of POSES){
     const result=await page.evaluate(p=>window.cc79KneePose(p),pose);
     const p=result.denim;
     assert.equal(result.figure,figure);
     assert.equal(p.originalRigKneePose78.pose,pose);
     assert.equal(p.originalRigKneePose78.original163BoneRig,true);
     assert.equal(p.originalPhotoUVRestFrontSkinPositionsBytePreserved77,true);
     assert.equal(p.originalPhotoCoordinatesPreserved78,true);
     assert.equal(p.auditedTrueSkinnedBodyToSourcePhotoDenim77,true);
     assert.ok(p.actualSkinnedBodyTriangles77>=10000&&p.actualSkinnedGarmentTriangles77>=200);
     assert.ok(Number.isInteger(p.actualSkinnedDenimBodyCrossingSegments77));
     assert.equal(p.actualSkinnedDenimBodyCrossingCategories77.reviewedSegments,
      p.actualSkinnedDenimBodyCrossingSegments77);
     if(mode==='after'){
      assert.equal(p.originalPhotoSourcePreserved79,true);
      assert.equal(p.denimFlexPose79,pose);
      if(pose==='source'){
       assert.equal(p.denimFlexRestored79,true);
       assert.equal(p.denimFlexApplied79,false);
      }else{
       assert.equal(p.denimFlexApplied79,true);
       assert.equal(p.denimFlexNoNewTriangleCrossings79,true);
       assert.equal(p.denimFlexFrontSourceVerticesByteIdentical79,true);
       assert.equal(p.unphotographedReverseRemainsNeutral79,true);
       assert.ok(p.denimFlexChangedVertices79>=30);
       assert.ok(p.denimFlexActualBoundedShift79>=.001&&p.denimFlexActualBoundedShift79<=.022);
       assert.ok(p.denimFlexFinalCrossings79<=p.denimFlexOriginalCrossings79);
      }
     }else assert.notEqual(p.denimFlexApplied79,true);
     poseResults[pose]={crossings:p.actualSkinnedDenimBodyCrossingSegments77,
      displacement:p.denimFlexActualBoundedShift79||0,vertices:p.denimFlexChangedVertices79||0,
      original:p.denimFlexOriginalCrossings79??null,
      bones:p.originalRigKneePose78.actualKneeBones,angles:p.originalRigKneePose78.kneeJointDegrees};
     allContacts.push({width,figure,mode,denim,pose,...poseResults[pose]});
    }
    // Geometrically identical source position on every return after two bent poses.
    const backToSource=await page.evaluate(()=>window.cc79KneePose('source'));
    assert.equal(backToSource.denim.originalRigKneePose78.pose,'source');
    if(mode==='after')assert.equal(backToSource.denim.denimFlexRestored79,true);
    restorations.push({width,figure,mode,denim,sourceCrossings:backToSource.denim.actualSkinnedDenimBodyCrossingSegments77});
    // Final screenshot comparison uses the SAME both-16 anatomical pose.
    const proof=await page.evaluate(()=>window.cc79KneePose('both-16'));
    if(mode==='after')assert.equal(proof.denim.denimFlexApplied79,true);
    for(const angle of ANGLES){
     const state=await page.evaluate(x=>window.cc69SetView(x),angle);
     assert.ok(Math.abs(state.camera-angle)<.02);
     await page.waitForTimeout(100);
     const key=[mode,figure,width,denim,angle].join('-');
     const evidence=await capture(page,key);
     cases.push({key,figure,width,denim,angle,mode,sourceSHA:DENIM[denim],
      kneePose:'both-16',...evidence,releaseAuthorized:false});
    }
    performance.push({figure,width,denim,mode,
     loadMilliseconds:(await page.evaluate(()=>document.querySelector('#avatar').dataset.frames))});
   }
   assert.deepEqual(errors,[],'no genuine 3D browser errors');
   assert.deepEqual(offsite,[],'no original licensed clothing requests off localhost');
   await context.close();
  }
 for(const width of [320,390,430])for(const figure of ['female','male'])
  for(const denim of ['public','second']){
   const changes={};
   for(const angle of ANGLES){
    const key=[figure,width,denim,angle].join('-');
    changes[angle]=await diff(frames.get('before-'+key),frames.get('after-'+key));
   }
   // Pure geometry difference on exact same 163-bone pose, not bone motion.
   assert.ok(changes[90]>=6||changes[180]>=6,
    'DENIM-FLEX no real same-pose rear/side photographed denim shape movement: '+
    JSON.stringify({width,figure,denim,changes}));
   comparisons.push({figure,width,denim,changes,
    sameRealBothKnees16DegreePose:true,originalPhotoSourceProtected:true,
    rearOrSideChangedPixels:Math.max(changes[90],changes[180]),
    humanRealism:'REVIEW',releaseAuthorized:false});
  }
 const report={
  genuineWebGL:true,realAnatomicalBones:163,
  originalLicensedShirtAndTwoPhotographedDenims:true,
  originalPhotographSHA256s:{...DENIM,shirt:SHIRT},
  originalPhotoUVRestSkinPreserved:true,sourceFrontVerticesPreserved:true,
  widths:[320,390,430],figures:['female','male'],
  denims:['public','second'],angles:ANGLES,
  poses:POSES,screenshots:cases.length,
  comparisons,contactCases:allContacts,restorations,performance,cases,
  noNewSkinnedBodyTriangleCrossings:allContacts.filter(x=>x.mode==='after'&&x.pose!=='source')
   .every(x=>x.original===null||x.crossings<=x.original),
  measuredPoseResponsiveRearFabric:true,
  noInventedUnphotographedRear:true,
  realPhoneAndroidTested:false,realIPhoneTested:false,
  fullSweptCollisionCert:false,humanPhotorealismApproved:false,
  productionTouched:false,familyAlpha:'HOLD',releaseAuthorized:false
 };
 assert.equal(cases.length,72);assert.equal(comparisons.length,12);
 assert.equal(allContacts.length,96);
 assert.equal(restorations.length,24);
 assert.equal(report.noNewSkinnedBodyTriangleCrossings,true);
 await writeFile(output+'/browser-results.json',JSON.stringify(report,null,2));
 console.log('DENIM_FLEX_3D01_REAL_3D_WEBGL',JSON.stringify({screenshots:72,
  samePoseComparisons:comparisons,contactChecks:96,restorations:24,
  changedDenimShape:true,familyAlpha:'HOLD',hardwarePhones:false}));
}finally{
 await browser?.close();
 await new Promise(ok=>server.close(ok));
}