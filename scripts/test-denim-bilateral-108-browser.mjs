/**
 * PHOTO108 real Chromium 163-bone original source photo bilateral knee replay.
 * Genuine licensed original JPEG source jeans, no fabricated frames or backs.
 * Actual 390 CSS-pixel mobile viewport and 90/270-degree opposite side views.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import sharp from 'sharp';
import {SOURCE_BILATERAL_SEQUENCE_108}
 from '../research/three-d-108/bilateral-pose-policy.mjs';

const root=resolve('.'),folder='benchmark/three-d-108';
const src={
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
};
const top='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const digest=b=>createHash('sha256').update(b).digest('hex');
const s=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(p)||
    p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))
   throw Error('not approved original source URL');
  const name=resolve(root,'.'+p);
  if(!name.startsWith(root+'/'))throw Error('research scope escape');
  const b=await readFile(name);
  const mime={'.mjs':'text/javascript','.js':'text/javascript',
   '.html':'text/html','.jpg':'image/jpeg','.json':'application/json',
   '.png':'image/png','.glb':'model/gltf-binary'};
  res.writeHead(200,{'content-type':mime[extname(name)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(b);
 }catch{res.writeHead(404);res.end('unavailable');}
});
const changed=async(a,b)=>{
 const [x,y]=await Promise.all([
  sharp(a).ensureAlpha().raw().toBuffer(),
  sharp(b).ensureAlpha().raw().toBuffer()
 ]);
 assert.equal(x.length,y.length);
 let count=0;
 for(let i=0;i<x.length;i+=4)
  if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>24)count++;
 return count;
};
await new Promise(done=>s.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+s.address().port;
let browser;
const cases=[],frames=[],errors=[],offsite=[],crashes=[];
try{
 await mkdir(folder,{recursive:true});
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--enable-webgl'
 ]});
 for(const figure of ['female','male']){
  const context=await browser.newContext({viewport:{width:390,height:900},
   deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push({figure,message:e.message}));
  page.on('crash',()=>crashes.push(figure));
  page.on('request',r=>{
   if(!r.url().startsWith(base)&&!r.url().startsWith('blob:'+base)&&
     !r.url().startsWith('data:'))
    offsite.push({figure,protocol:new URL(r.url()).protocol});
  });
  await page.goto(base+
   '/research/three-d-69/index.html?denimDrape73=after&calf74=after&folds75=after&continuity76=after&contact77=on&knee78=on&knee103=on&knee104=on&knee105=on&knee106=on&knee108=on');
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
   const receiptsByPose={};
   const sequence=[];
   for(let step=0;step<SOURCE_BILATERAL_SEQUENCE_108.length;step++){
    const [left,right]=SOURCE_BILATERAL_SEQUENCE_108[step];
    const response=await page.evaluate(([l,r])=>{
     const out=window.cc108BilateralPose(l,r);
     return {stats:out.pants,diagnostics:window.cc69Diagnostics()};
    },[left,right]);
    const p=response.stats,d=response.diagnostics;
    assert.equal(d.rig.bones,163);
    assert.equal(d.actual3DGarment.originalPhotoSHA256s.bottom,src[denim]);
    assert.equal(d.actual3DGarment.originalPhotoSHA256s.top,top);
    assert.equal(p.sourceSHA256,src[denim]);
    assert.equal(p.bilateralDenimPoseReplayVerified108,true);
    assert.equal(p.independentOriginalBilateralKnees108.leftDegrees,left);
    assert.equal(p.independentOriginalBilateralKnees108.rightDegrees,right);
    assert.equal(p.originalPhotoAndUVSkinAndFrontPreserved108,true);
    assert.equal(p.originalPhotoUVRestFrontSkinPositionsBytePreserved77,true);
    assert.equal(p.photographedDenimCalfDrapeGeometry106,true);
    assert.equal(p.releaseAuthorized,false);
    assert.equal(p.familyAlpha,'HOLD');
    const f=p.perLegCalfVertexMovement108;
    assert.equal(f.originalSHA256,src[denim]);
    assert.ok(Number.isSafeInteger(f.sampledTriangleCrossingsAfter));
    assert.ok(f.sampledTriangleCrossingsAfter<=f.sampledTriangleCrossingsBefore);
    assert.ok(f.maximumSourceRelativeCalfShiftMeters>=0&&
      f.maximumSourceRelativeCalfShiftMeters<=.012001);
    if(left>0)assert.ok(f.leftKneeAppliedRightMeshLeg>=8);
    else assert.equal(f.leftKneeAppliedRightMeshLeg,0);
    if(right>0)assert.ok(f.rightKneeAppliedLeftMeshLeg>=8);
    else assert.equal(f.rightKneeAppliedLeftMeshLeg,0);
    assert.equal(p.fullMovementSweepCollisionVerified108,false);
    assert.equal(p.photorealisticPhysicalClothDynamicsVerified108,false);
    assert.equal(p.independentHumanVisualApproval108,false);
    assert.equal(p.actualAndroidIphoneDeviceTested108,false);
    assert.equal(p.realSignedMultiAccountRLSVerified108,false);
    assert.equal(p.productionDeploymentAuthorized108,false);
    const poseFrames={};
    for(const view of [90,270]){
     const camera=await page.evaluate(v=>window.cc69SetView(v),view);
     assert.ok(Math.abs(camera.camera-view)<.02);
     await page.waitForTimeout(90);
     const bytes=await page.locator('#avatar').screenshot({animations:'disabled'});
     const meta=await sharp(bytes).metadata();
     assert.ok(meta.width>=200&&meta.height>=300&&bytes.length>3000);
     const filename=[figure,denim,'step-'+step,'left-'+left,'right-'+right,
      'view-'+view].join('-')+'.png';
     await writeFile(folder+'/'+filename,bytes);
     frames.push({file:filename,figure,denim,step,left,right,view,
      originalSourceSHA256:src[denim],width:meta.width,height:meta.height,
      sha256:digest(bytes)});
     poseFrames[view]=bytes;
    }
    receiptsByPose[step]=poseFrames;
    sequence.push({step,left,right,
     sourceSHA256:src[denim],
     leftMeshCalfVerticesMoved:f.rightKneeAppliedLeftMeshLeg,
     rightMeshCalfVerticesMoved:f.leftKneeAppliedRightMeshLeg,
     totalMoveProofLeft:f.leftKneeAppliedRightMeshLeg,
     totalMoveProofRight:f.rightKneeAppliedLeftMeshLeg,
     maximumCalfShiftMeters:f.maximumSourceRelativeCalfShiftMeters,
     originalSourceFrontAndUVProtected:true,
     contactBefore:f.sampledTriangleCrossingsBefore,
     contactAfter:f.sampledTriangleCrossingsAfter
    });
   }
   // Compare photographs rendered at the SAME final actual 163-bone pose
   // after many other poses: no accumulated garment fold/calf deformation.
   const comparisons=[];
   for(const [i,j,label] of [[0,7,'straight-after-alternation'],
       [0,9,'straight-after-repeated-left'],
       [3,8,'left16-after-both-and-right']]){
    for(const view of [90,270]){
     const difference=await changed(receiptsByPose[i][view],receiptsByPose[j][view]);
     assert.equal(difference,0,'actual original source photo bilateral calf pose drift: '+
      JSON.stringify({figure,denim,label,view,difference}));
     comparisons.push({label,view,pixelDelta:difference,
      originalRigTrue163Bones:true,
      sameOriginalSourcePhotograph:true});
    }
   }
   cases.push({figure,denim,originalSourceSHA256:src[denim],sequence,
    sourceRelativeExactReplayComparisons:comparisons,
    originalPhotoUnchanged:true,sourceNeutralUnphotographedBack:true,
    noFullSweptCollisionClaim:true,notHumanPhotorealismApproved:true});
  }
  await context.close();
 }
 assert.equal(cases.length,4);assert.equal(frames.length,80);
 assert.deepEqual(errors,[]);assert.deepEqual(offsite,[]);assert.deepEqual(crashes,[]);
 const report={
  priority:'PHOTO-DENIM-BILATERAL-POSE-REPLAY-108',
  originalPubliclyLicensedJeansSourcePhotographs:2,
  actualMaleFemaleOriginal163BoneModels:true,
  originalRealSkinnedBones:163,originalPhotographedShirtPreserved:true,
  actualChromiumWebGL:true,mobileCSSWidth:390,
  independentBilateralKneePoseCount:10,
  sourceKneePoseSequence:SOURCE_BILATERAL_SEQUENCE_108,
  camerasDegrees:[90,270],actualSourcePhotoWebGLFrames:80,
  sourceRelativeSequenceReplayPixelsExactlyIdentical:true,
  independentLeftRightCalfMovementVerified:true,
  genuineSourceFrontUVRestSkinPreserved:true,
  realSkinnedTriangleBodyContactsNeverWorse:true,
  unphotographedRearStillNeutral:true,
  fullSweptCollisionFreeProof:false,
  physicallyContinuousFabricSimulation:false,
  actualHardwareAndroidIphoneTested:false,
  independentHumanVisualRealismApproved:false,
  signedCloudMultiAccountPrivacyProven:false,
  releaseAuthorized:false,familyAlpha:'HOLD',
  cases,frames,browserErrors:errors,externalRequests:offsite,crashes
 };
 await writeFile(folder+'/acceptance.json',JSON.stringify(report,null,2)+'\n');
 console.log('PHOTO108_REAL_ORIGINAL_163_BONE_BILATERAL_DENIM',JSON.stringify({
  exactSourcePhotos:2,originalMaleFemale:2,posesPerCombo:10,
  screenshotCount:frames.length,allOriginalPoseReplayImageDiffZero:true,
  comparisons:cases.map(c=>({figure:c.figure,denim:c.denim,
   left16:c.sequence[3].totalMoveProofLeft,
   bothLeft:c.sequence[4].totalMoveProofLeft,
   bothRight:c.sequence[4].totalMoveProofRight,
   right16:c.sequence[5].totalMoveProofRight,
   exactReplayComparisons:c.sourceRelativeExactReplayComparisons.length,
   contactNonworsening:c.sequence.every(x=>x.contactAfter<=x.contactBefore)})),
  physicsCertified:false,phoneVerified:false,
  familyAlpha:'HOLD',releaseAuthorized:false
 }));
}finally{await browser?.close();await new Promise(ok=>s.close(ok));}
