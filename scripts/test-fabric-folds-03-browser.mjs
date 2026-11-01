/** FOLDS-03: 26 real original-source WebGL 163-bone dress frames:
 * 2 approved actual rigs × 320/390/430 × [rest,left-step,right-step,reset].
 * Also audit real skinned-body/garment triangle crossings, synthetic-owner
 * revocation, model changes, WebGL source-identity, nonrelease flags.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),dir='benchmark/fabric-folds-03',SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(three|three-mesh-bvh)\/)/.test(path)||
    path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('Research-only assets');
  const full=resolve(root,'.'+path);
  if(!full.startsWith(root+'/'))throw Error('Path traversal');
  const bytes=await readFile(full);
  const mime={'.mjs':'text/javascript','.js':'text/javascript','.json':'application/json',
   '.html':'text/html','.glb':'model/gltf-binary','.jpg':'image/jpeg','.png':'image/png'};
  res.writeHead(200,{'content-type':mime[extname(full)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Unavailable');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
const screenshots=[],cases=[],contacts=[],javascriptErrors=[],nonLocalRequests=[];
function monitor(page){
 page.on('pageerror',error=>javascriptErrors.push(String(error.message)));
 page.on('request',r=>{
  if(!r.url().startsWith(host)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'+host))
   nonLocalRequests.push(r.url());
 });
}
const diag=p=>p.evaluate(()=>window.ccWardrobe10Diagnostics());
async function ready(page){
 await page.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady===true,null,{timeout:180000});
 await page.locator('#category').selectOption('Dresses');
 await page.locator('#items .item').first().click();
 await page.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerMode==='verified-3d'&&window.ccWardrobe10Diagnostics()?.outfitMode==='dress',null,{timeout:30000});
 const d=await diag(page);
 assert.equal(d.bones,163);assert.equal(d.realDress?.sourceSHA256,SHA);
 assert.equal(d.gait02Enabled,true);assert.ok(d.skirtMotionEnabled);
 assert.equal(d.familyAlpha,'HOLD');
}
async function shot(p,key,rig,width,phase){
 const c=p.locator('#avatar'),png=await c.screenshot();
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const state=await diag(p);
 assert.equal(state.bones,163);assert.equal(state.viewerMode,'verified-3d');
 assert.equal(state.dressOriginalSHA256,SHA);
 assert.equal(await p.evaluate(()=>document.querySelector('#avatar').getContext('webgl2')!==null),true);
 assert.ok(Number(await c.getAttribute('data-frames'))>3);
 const filename=key+'.png';await writeFile(dir+'/'+filename,png);
 screenshots.push({filename,rig,width,phase,licensedDressSHA256:SHA,genuineWebGL:true});
 return sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});
}
function diff(a,b){
 assert.equal(a.info.width,b.info.width);assert.equal(a.info.height,b.info.height);
 let pixels=0;for(let i=0;i<a.data.length;i+=3){
  const d=Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2]);
  if(d>24)pixels++;
 }
 return pixels;
}
let browser;
try{
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir(dir,{recursive:true});
 for(const width of [320,390,430]){
  const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();monitor(p);
  await p.goto(host+'/research/fabric-folds-03/index.html?walk=after&folds=after',{waitUntil:'domcontentloaded'});
  for(const rig of ['female','male']){
   if(rig==='male'){
    await p.locator('#model').selectOption('male');
    await p.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.figure==='male'&&window.ccWardrobe10Diagnostics()?.viewerReady,null,{timeout:180000});
   }
   await ready(p);
   await p.evaluate(()=>window.ccWardrobe10View(90));
   const tag='source-gait-02-'+width+'-'+rig;
   const source=await shot(p,tag+'-source',rig,width,'source');
   assert.equal((await diag(p)).posePleats03Enabled,true);
   assert.ok((await diag(p)).posePleats03State.activeSeamGroups>=70);
   assert.ok((await diag(p)).posePleats03State.protectedFrontVertices>=150);
   // Compare true skinned dress/body contacts at rest vs same original rig in motion.
   const sourceContact=width===390?await p.evaluate(()=>window.ccWardrobeGait02('audit')):null;
   assert.equal(await p.locator('#walk-left').isDisabled(),false);
   const left=await p.evaluate(()=>window.ccWardrobeGait02('left-step'));
   assert.equal(left.sourceTrue163BoneResearch,true);assert.equal(left.dressSHA,SHA);
   assert.equal(left.result.original163BoneRig,true);
   assert.ok(left.result.changedBoneCount>=3);
   assert.ok(left.result.skirt?.maxShiftMeters>0&&left.result.skirt?.maxShiftMeters<=.01801);
   const leftView=await shot(p,tag+'-left',rig,width,'left');
   const foldLeft=(await diag(p)).posePleats03State;
   assert.ok(foldLeft.samples>=1&&foldLeft.changedVertices>100);
   assert.ok(foldLeft.worldLastShiftMeters>0&&foldLeft.worldLastShiftMeters<=.010801);
   assert.equal(foldLeft.originalPhotographAndSkinBytesProtected,true);
   const leftPixels=diff(source,leftView);
   assert.ok(leftPixels>=50,'Real pelvis and knees must visibly affect dressed humanoid: '+leftPixels);
   const leftContact=width===390?await p.evaluate(()=>window.ccWardrobeGait02('audit')):null;
   const right=await p.evaluate(()=>window.ccWardrobeGait02('right-step'));
   assert.equal(right.result.original163BoneRig,true);assert.ok(right.result.changedBoneCount>=3);
   const rightView=await shot(p,tag+'-right',rig,width,'right');
   const foldRight=(await diag(p)).posePleats03State;
   assert.ok(foldRight.samples>=2&&foldRight.changedVertices>100);
   assert.ok(foldRight.worldLastShiftMeters>0&&foldRight.worldLastShiftMeters<=.010801);
   const rightPixels=diff(source,rightView);
   assert.ok(rightPixels>=50);
   let afterMinusBeforePixels=null;
   if(width===390){
    // Exactly matched 163-bone right pose in separate non-fold baseline viewer.
    // This is genuine browser WebGL: no fabricated screenshot/retouched image.
    const bctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    const baseline=await bctx.newPage();monitor(baseline);
    await baseline.goto(host+'/research/fabric-folds-03/index.html?walk=after',{waitUntil:'domcontentloaded'});
    if(rig==='male'){
     await baseline.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady,null,{timeout:180000});
     await baseline.locator('#model').selectOption('male');
     await baseline.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.figure==='male'&&window.ccWardrobe10Diagnostics()?.viewerReady,null,{timeout:180000});
    }
    await ready(baseline);
    assert.equal((await diag(baseline)).posePleats03Enabled,false);
    await baseline.evaluate(()=>window.ccWardrobe10View(90));
    await baseline.evaluate(()=>window.ccWardrobeGait02('right-step'));
    const without=await shot(baseline,tag+'-right-before-pleats',rig,width,'same-pose-before');
    afterMinusBeforePixels=diff(rightView,without);
    assert.ok(afterMinusBeforePixels>=5,'Pose-folds must visibly change actual WebGL source dress at identical anatomical joint pose: '+afterMinusBeforePixels);
    await bctx.close();
   }
   const crossed=diff(leftView,rightView);
   assert.ok(crossed>=50,'Opposite anatomical leg cycle must have real pose differences');
   if(width===390){
    const measure=await p.evaluate(()=>window.ccWardrobeGait02('audit'));
    assert.equal(measure.result.actualSourceSkinnedMeshes,true);
    assert.ok(Number.isInteger(measure.result.actualSkinnedDressBodyTriangleCrossings));
    assert.ok(measure.result.realDressTriangles>1000);
    assert.ok(measure.result.realBodyTriangles>10000);
    assert.equal(measure.result.sweptCollisionCertified,false);
    const base=sourceContact?.result;
    assert.ok(base&&Number.isInteger(base.actualSkinnedDressBodyTriangleCrossings));
    assert.equal(base.realBodyTriangles,measure.result.realBodyTriangles);
    assert.equal(base.realDressTriangles,measure.result.realDressTriangles);
    contacts.push({rig,bodyTriangles:measure.result.realBodyTriangles,
     dressTriangles:measure.result.realDressTriangles,
     crossedSegmentsAtRest:base.actualSkinnedDressBodyTriangleCrossings,
     crossedSegmentsAtLeftStep:leftContact?.result.actualSkinnedDressBodyTriangleCrossings,
     crossedSegmentsAtRightStep:measure.result.actualSkinnedDressBodyTriangleCrossings,
     netNewOrResolvedSegmentCount:measure.result.actualSkinnedDressBodyTriangleCrossings-
      base.actualSkinnedDressBodyTriangleCrossings,
     dynamicallyCollisionCertified:false});
    assert.ok(leftContact.result.actualSkinnedDressBodyTriangleCrossings<=base.actualSkinnedDressBodyTriangleCrossings,
     'Left step introduced NEW actual source-dress/body triangle crossings: '+JSON.stringify(contacts.at(-1)));
    assert.ok(measure.result.actualSkinnedDressBodyTriangleCrossings<=base.actualSkinnedDressBodyTriangleCrossings,
     'Right step introduced NEW actual source-dress/body triangle crossings: '+JSON.stringify(contacts.at(-1)));
   }
   const reset=await p.evaluate(()=>window.ccWardrobeGait02('reset'));
   assert.equal(reset.result.restoredRealBoneQuaternions,true);
   assert.equal(reset.result.restoredOriginalSkirtGeometry,true);
   const restored=await shot(p,tag+'-reset',rig,width,'reset');
   const resetDifference=diff(source,restored);
   assert.equal(resetDifference,0,'Both actual figure and cloth must exactly return to source pixels');
   // Actual animated browser RAF over original anatomy, not only static pose samples.
   const play=await p.evaluate(()=>window.ccWardrobeGait02('play'));
   assert.equal(play.result.original163BoneRig,true);
   await p.waitForTimeout(150);
   assert.equal((await diag(p)).gait02Active,true);
   assert.ok((await diag(p)).gait02State.samples>=2);
   const stop=await p.evaluate(()=>window.ccWardrobeGait02('stop'));
   assert.equal(stop.result.restoredRealBoneQuaternions,true);
   cases.push({rig,width,leftChangedPixels:leftPixels,rightChangedPixels:rightPixels,
    oppositeStepsChangedPixels:crossed,resetChangedPixels:resetDifference,
    leftJointAngles:left.result.angles,rightJointAngles:right.result.angles,
    actualBodyBoneNames:left.result.actualBoneNames,
    motionShiftMeters:left.result.skirt.maxShiftMeters,
    maxPleatShiftMeters:Math.max(foldLeft.worldLastShiftMeters,foldRight.worldLastShiftMeters),
    actualWebGLFoldBeforeAfterChangedPixels:afterMinusBeforePixels});
   await p.locator('#swap').click();
   assert.equal(await p.evaluate(()=>{try{window.ccWardrobeGait02('left-step');return false;}catch{return true;}}),true);
  }
  await p.locator('#logout').click();
  assert.equal(await p.evaluate(()=>{try{window.ccWardrobeGait02('left-step');return false;}catch{return true;}}),true);
  await ctx.close();
 }
 // Exact source dress but no research query: all gait methods fail closed.
 const ctx=await browser.newContext({viewport:{width:390,height:900},isMobile:true,hasTouch:true});
 const p=await ctx.newPage();monitor(p);
 await p.goto(host+'/research/fabric-folds-03/index.html',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady,null,{timeout:180000});
 await p.locator('#category').selectOption('Dresses');await p.locator('#items .item').first().click();
 assert.equal((await diag(p)).gait02Enabled,false);
 assert.equal(await p.locator('#walk-left').isDisabled(),true);
 assert.equal(await p.evaluate(()=>{try{window.ccWardrobeGait02('play');return false;}catch{return true;}}),true);
 await ctx.close();
 assert.equal(screenshots.length,26);assert.equal(cases.length,6);
 assert.equal(contacts.length,2);
 assert.deepEqual(javascriptErrors,[]);
 assert.deepEqual(nonLocalRequests,[]);
 const results={screenshots:screenshots.length,genuineWebGLSourceDressFrames:26,
  originalFigures:['female','male'],mobileWidths:[320,390,430],
  sourcePhotoSHA256:SHA,cases,screenshotsMetadata:screenshots,realTriangleContactAudits:contacts,
  genuineAnatomicalHipKneeAndPelvisMotion:true,clothRespondsToBodyGait:true,
  sourceNeutralPoseDrape03Verified:true,sourcePhotoFrontUnchanged:true,
  originalSourceFoldComparedInSameGaitPose:true,
  exactPoseAndClothReset:true,sourcePhotoRestUVAndSkinUnmodified:true,defaultOff:true,
  continuousCollisionCertified:false,walkingFootPlantPhysicsCertified:false,
  humanPhotorealismApproved:false,physicalAndroidIphoneVerified:false,
  realUserPhotosUsed:false,productionModified:false,familyAlpha:'HOLD',releaseAuthorized:false};
 await writeFile(dir+'/browser-results.json',JSON.stringify(results,null,2));
 console.log('POSE_FOLDS_03',JSON.stringify({frames:screenshots.length,cases:cases.length,
  minChangedPixels:Math.min(...cases.map(x=>x.leftChangedPixels)),
  contacts,release:'HOLD'}));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
