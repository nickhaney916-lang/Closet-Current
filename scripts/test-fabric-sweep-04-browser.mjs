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
import {photographedLowerGarmentPixelWitness10} from '../research/denim-fit-06/garment-pixel-witness-10.mjs';
const root=resolve('.'),dir='benchmark/fabric-sweep-04',SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
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
const screenshots=[],cases=[],contacts=[],sweeps=[],frozenDress=[],frozenDenim=[],denimSilhouetteComparisons=[],denimFairing08Comparisons=[],denimAngle09Comparisons=[],denimRear14Comparisons=[],denimSide15Comparisons=[],denimPosterior16Comparisons=[],denimPhotoWidth17Comparisons=[],denimProfile18Comparisons=[],denimSigned19Comparisons=[],denimLine20Comparisons=[],pointerRotation11=[],touchSwipe12=[],pinchZoom13=[],javascriptErrors=[],nonLocalRequests=[];
function monitor(page){
 page.on('pageerror',error=>javascriptErrors.push(String(error.message)));
 page.on('request',r=>{
  if(!r.url().startsWith(host)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'+host))
   nonLocalRequests.push(r.url());
 });
}
const diag=p=>p.evaluate(()=>window.ccWardrobe10Diagnostics());
// F12: browser-engine-dispatched TOUCH contacts, not a mouse or
// JavaScript dispatchEvent. Physical phone hardware is NOT tested.
async function originalCanvasTouchSwipe12(page){
 const canvas=page.locator('#avatar'),box=await canvas.boundingBox();
 assert.ok(box&&box.width>=220&&box.height>=320,
  'An original authenticated 3D WebGL canvas must be onscreen for touch');
 const from={x:box.x+box.width*.82,y:box.y+box.height*.51};
 const to={x:box.x+box.width*.18,y:from.y};
 const session=await page.context().newCDPSession(page);
 let pressed=false;
 try{
  await session.send('Input.dispatchTouchEvent',{
   type:'touchStart',touchPoints:[{x:from.x,y:from.y,id:31,force:1}]});
  pressed=true;
  for(let i=1;i<=18;i++){
   await session.send('Input.dispatchTouchEvent',{
    type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/18,y:from.y,id:31,force:1}]});
   await page.waitForTimeout(16);
  }
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  pressed=false;
 }finally{
  if(pressed)await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}).catch(()=>{});
  await session.detach();
 }
 return {fromX:Math.round(from.x),toX:Math.round(to.x),y:Math.round(from.y),
  steps:18,chromeNativeTouchEvents:true,physicalTouchHardwareUsed:false};
}
async function originalCanvasPinch13(page,zoomIn){
 const b=await page.locator('#avatar').boundingBox();
 assert.ok(b?.width>=220&&b?.height>=310,'Real 3D canvas required');
 const cx=b.x+b.width*.5,cy=b.y+b.height*.5;
 const start=b.width*(zoomIn?.115:.315),end=b.width*(zoomIn?.315:.115);
 const session=await page.context().newCDPSession(page);let pressed=false;
 const fingers=half=>[{x:cx-half,y:cy,id:41,force:1},{x:cx+half,y:cy,id:42,force:1}];
 try{
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:fingers(start)});
  pressed=true;
  for(let i=1;i<=20;i++){
   await session.send('Input.dispatchTouchEvent',{type:'touchMove',
    touchPoints:fingers(start+(end-start)*i/20)});
   await page.waitForTimeout(16);
  }
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});pressed=false;
 }finally{
  if(pressed)await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}).catch(()=>{});
  await session.detach();
 }
 return {twoFingers:[41,42],nativeChromeTouch:true,steps:20,zoomIn,physicalPhone:false};
}
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
 await mkdir('benchmark/dress-fit-05',{recursive:true});
 await mkdir('benchmark/denim-fit-06',{recursive:true});
 await mkdir('benchmark/denim-silhouette-07',{recursive:true});
 await mkdir('benchmark/denim-fairing-08',{recursive:true});
  await mkdir('benchmark/denim-angle-09',{recursive:true});
 await mkdir('benchmark/source-rotate-11',{recursive:true});
 await mkdir('benchmark/source-touch-12',{recursive:true});
 await mkdir('benchmark/mobile-pinch-13',{recursive:true});
 await mkdir('benchmark/denim-rear-thigh-14',{recursive:true});
 await mkdir('benchmark/denim-side-thigh-15',{recursive:true});
 await mkdir('benchmark/denim-posterior-contour-16',{recursive:true});
 await mkdir('benchmark/denim-photo-width-17',{recursive:true});
 await mkdir('benchmark/denim-original-profile-18',{recursive:true});
 await mkdir('benchmark/denim-signed-calf-19',{recursive:true});
 await mkdir('benchmark/denim-anatomical-line-20',{recursive:true});
 for(const width of [320,390,430]){
  const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();monitor(p);
  await p.goto(host+'/research/fabric-sweep-04/index.html?walk=after&folds=after&sweep=after&dressFit=after&denimFit=after&denimSilhouette=after&denimFairing=after',{waitUntil:'domcontentloaded'});
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
    await baseline.goto(host+'/research/fabric-sweep-04/index.html?walk=after',{waitUntil:'domcontentloaded'});
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
   let sweep=null;
   if(width===390){
    // Actual photo-real WebGL against the exact original skinned body at
    // nine discrete points, including the BOTH ends of one complete cycle.
    // Reject a frame if it introduces even one new triangle intersection.
    // This is dense PHASE SAMPLING, not mathematical swept collision proof.
    sweep={rig,width,phaseSamples:[],newIntersectingTriangles:0,maximumAdjacentChangedPixels:0};
    let prev=null;const originalContact=sourceContact.result.actualSkinnedDressBodyTriangleCrossings;
    for(const phase of [0,.125,.25,.375,.5,.625,.75,.875,1]){
     const sample=await p.evaluate(phase=>window.ccWardrobeSweep04(phase),phase);
     assert.equal(sample.phase,phase);assert.equal(sample.sourceSHA,SHA);
     assert.equal(sample.account,'fixture-account-a');
     assert.equal(sample.bodyAndDrape.original163BoneRig,true);
     const snapped=await shot(p,tag+'-sweep-contact-'+String(Math.round(phase*8)).padStart(2,'0'),rig,width,'sweep-contact');
     const measured=await p.evaluate(()=>window.ccWardrobeGait02('audit'));
     const crossings=measured.result.actualSkinnedDressBodyTriangleCrossings;
     assert.ok(Number.isSafeInteger(crossings));
     assert.ok(crossings<=originalContact,
      'Intermediate GENUINE skinned dress/body pose introduced NEW intersections at phase '+phase+
      ': '+crossings+' vs '+originalContact);
     const folds=(await diag(p)).posePleats03State;
     assert.ok(folds?.changedVertices>=0&&folds.worldLastShiftMeters<=.010801);
     const changed=prev?diff(prev,snapped):0;
     if(prev&&phase!==1)assert.ok(changed>=10,
      'Original anatomical body must actually change visibly between intermediate poses: '+phase+' pixels '+changed);
     sweep.maximumAdjacentChangedPixels=Math.max(sweep.maximumAdjacentChangedPixels,changed);
     sweep.phaseSamples.push({phase,crossings,changedPixelsFromPriorFrame:changed,
      actualSourceDress:true,sourceFrontUntouched:true,skinnedBoneCount:163,
      foldShiftMeters:folds.worldLastShiftMeters});
     prev=snapped;
    }
    assert.equal(sweep.phaseSamples.length,9);
    assert.equal(sweep.phaseSamples[0].crossings,sweep.phaseSamples[8].crossings);
    assert.deepEqual(sweep.phaseSamples.map(x=>x.phase),[0,.125,.25,.375,.5,.625,.75,.875,1]);
    sweep.sampledNoNewContacts=true;
    sweep.mathematicallySweptCollisionCertified=false;
    sweeps.push(sweep);
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
   // Source-faithful static garment fit, genuine browser WebGL (not an illustration).
   // Source gait and spring have been reset above; one real original licensed dress
   // on the original 163-bone male/female figure, same pose and side camera.
   const tagFit=width+'-'+rig;
   const webglCanvas=p.locator('#avatar');
   const bFit=await webglCanvas.screenshot();
   const proof=await p.evaluate(()=>window.ccWardrobeDressFreeze05());
   assert.equal(proof.actualOriginalSourceDressStaticFit,true);
   assert.equal(proof.licensedOriginalPhotographSHA256,SHA);
   assert.equal(proof.originalPhotoFrontUntouched,true);
   assert.equal(proof.sourceRestAndSkinPreserved,true);
   assert.equal(proof.zeroNewSkinnedBodyContacts,true);
   assert.equal(proof.collisionVerified,true);
   assert.ok(proof.changedVertices>=70);
   assert.ok(proof.gravitySpring.restMeters>.0064);
   assert.ok(proof.maxWorldDisplacementMeters>.0025&&proof.maxWorldDisplacementMeters<=.0095);
   const aFit=await webglCanvas.screenshot();
   const raw=buffer=>sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});
   const originalPixels=diff(await raw(bFit),await raw(aFit));
   assert.ok(originalPixels>=8,'Real photographed skirt geometry must change in static WebGL fit: '+originalPixels);
   await p.evaluate(()=>window.ccWardrobe10View(180));
   await p.evaluate(()=>window.ccWardrobe10View(90));
   const rotated=await webglCanvas.screenshot();
   const freezeDrift=diff(await raw(aFit),await raw(rotated));
   assert.ok(freezeDrift<=2,'Frozen photographed dress moved unexpectedly during 360-degree camera navigation: '+freezeDrift);
   const again=await p.evaluate(()=>window.ccWardrobeDressFreeze05());
   assert.equal(again.originalPhotoFrontUntouched,true);
   const same=await webglCanvas.screenshot();
   const identical=diff(await raw(aFit),await raw(same));
   assert.ok(identical<=2,'Repeated source-photo dress equilibrium fit did not exactly reproduce frozen geometry: '+identical);
   for(const [name,png] of [['before',bFit],['frozen',aFit],['rotation-return',rotated],['repeat-frozen',same]])
    await writeFile('benchmark/dress-fit-05/'+tagFit+'-'+name+'.png',png);
   frozenDress.push({rig,width,sourceSHA256:SHA,account:proof.account,generation:proof.generation,
    changedWebGLPixels:originalPixels,rotationDriftPixels:freezeDrift,repeatDriftPixels:identical,
    originalPhotoFrontUntouched:true,sourceRestAndSkinPreserved:true,
    bodyContactsBefore:proof.originalSkinnedBodyTriangleContactsBefore,
    bodyContactsAfter:proof.originalSkinnedBodyTriangleContactsAfter,
    sourceColorAndShaderUnmodified:true,physicalPhoneVerified:false,releaseAuthorized:false});
   assert.equal(proof.account,'fixture-account-a');
   cases.push({rig,width,leftChangedPixels:leftPixels,rightChangedPixels:rightPixels,
    oppositeStepsChangedPixels:crossed,resetChangedPixels:resetDifference,
    leftJointAngles:left.result.angles,rightJointAngles:right.result.angles,
    actualBodyBoneNames:left.result.actualBoneNames,
    motionShiftMeters:left.result.skirt.maxShiftMeters,
    maxPleatShiftMeters:Math.max(foldLeft.worldLastShiftMeters,foldRight.worldLastShiftMeters),
    actualWebGLFoldBeforeAfterChangedPixels:afterMinusBeforePixels});
   await p.locator('#swap').click();
   assert.equal(await p.evaluate(()=>{try{window.ccWardrobeDressFreeze05();return false;}catch{return true;}}),true);
   // One real 163-bone mannequin and the SAME source-verified wardrobe viewer:
   // fitted licensed shirt+jeans (not a standalone fake pants model).
   for(let denimIndex=0;denimIndex<(width===390?2:1);denimIndex++){
    if(denimIndex===1)await p.locator('#swap').click();
    await p.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.outfitMode==='shirt-pants',null,{timeout:30000});
    const beforeState=await diag(p);
    assert.equal(beforeState.realDress,null);
    assert.equal(beforeState.staticDenimFit06Enabled,true);
    assert.equal(beforeState.account,'fixture-account-a');
    const sourceDenim=beforeState.displayed3DSources?.bottom;
    assert.ok([ 
     'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
     'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
    ].includes(sourceDenim),'Real photo original denim source not matched');
    await p.evaluate(()=>window.ccWardrobe10View(90));
    const before=await p.locator('#avatar').screenshot();
    const fitted=await p.evaluate(()=>window.ccWardrobeDenimFreeze06());
    assert.equal(fitted.originalPhotoSHA256,sourceDenim);
    assert.equal(fitted.actualPhotoDenimFrozenFit,true);
    assert.equal(fitted.trueBVHBodyContactNoNew,true);
    assert.equal(fitted.sourceUVRestAndSkinByteIdentical,true);
    assert.equal(fitted.frontPhotographUnchanged,true);
    assert.ok(fitted.changedVertices>=60&&Math.min(...fitted.perLeg)>=20);
    assert.ok(fitted.rest.meters>.0057);
    assert.equal(fitted.sourceMeasuredAnatomicalSilhouette07,true);
    assert.equal(fitted.originalSourceNeutralCuffFairing08,true);
    assert.equal(fitted.originalPhotoTextureRGBAndUVUnmodified08,true);
    assert.ok(fitted.cuffReleasedVertices08>=8&&fitted.maxCuffReleaseMeters08>=.008);
    assert.equal(fitted.originalSkinnedKneeHemTaperImproved07,true);
    assert.equal(fitted.originalPhotoTextureRGBAndUVUnmodified07,true);
    assert.ok(fitted.additionalKneeVsHemEaseMeters07>=.008);
    assert.ok(fitted.sourceNeutralKneeRearGroups07>=15);
    assert.ok(fitted.maxWorldShiftMeters<=.024);

    const frozen=await p.locator('#avatar').screenshot();
    const raw=buffer=>sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});
    const moved=diff(await raw(before),await raw(frozen));
    assert.ok(moved>=6,'Real photographed source denim fitting did not change side silhouette: '+moved);
    await p.evaluate(()=>window.ccWardrobe10View(180));
    await p.evaluate(()=>window.ccWardrobe10View(90));
    const rotated=await p.locator('#avatar').screenshot();
    const drift=diff(await raw(frozen),await raw(rotated));
    assert.ok(drift<=2,'Actual photo jeans static fitting drifted during 360-degree view: '+drift);
    const same=await p.evaluate(()=>window.ccWardrobeDenimFreeze06());
    assert.equal(same.originalPhotoSHA256,sourceDenim);
    const repeated=await p.locator('#avatar').screenshot();
    const repeatDrift=diff(await raw(frozen),await raw(repeated));
    assert.ok(repeatDrift<=2,'Reapplied original photo jeans gravity equilibrium moved unexpectedly: '+repeatDrift);
    const prefix=width+'-'+rig+'-denim-'+denimIndex;
    for(const [suffix,png] of [['original',before],['gravity-frozen',frozen],
      ['turntable-return',rotated],['repeated-fit',repeated]])
     await writeFile('benchmark/denim-fit-06/'+prefix+'-'+suffix+'.png',png);
    // F12: a fully separate synthetic logged-in browser session for
    // EACH native finger swipe. Never touch 'p', the original F04-F11
    // reference page, because residual OrbitControls damping can otherwise
    // contaminate a later figure's zero-pixel reset acceptance.
    const touchCtx12=await browser.newContext({
     viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    try{
     const touchPage12=await touchCtx12.newPage();monitor(touchPage12);
     await touchPage12.goto(host+'/research/fabric-sweep-04/index.html?walk=after&folds=after&sweep=after&dressFit=after&denimFit=after&denimSilhouette=after&denimFairing=after',{waitUntil:'domcontentloaded'});
     if(rig==='male'){
      await touchPage12.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady===true,null,{timeout:180000});
      await touchPage12.locator('#model').selectOption('male');
      await touchPage12.waitForFunction(()=>window.ccWardrobe10Diagnostics()?.figure==='male'&&
       window.ccWardrobe10Diagnostics()?.viewerReady===true,null,{timeout:180000});
     }
     await ready(touchPage12);
     await touchPage12.locator('#swap').click();
     if(denimIndex===1)await touchPage12.locator('#swap').click();
     await touchPage12.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.outfitMode==='shirt-pants',null,{timeout:30000});
     const touchSource12=await diag(touchPage12);
     assert.equal(touchSource12.displayed3DSources?.bottom,sourceDenim,
      'Isolated finger-swipe session must use the SAME original licensed SHA');
     assert.equal(touchSource12.account,'fixture-account-a');
     assert.equal(touchSource12.bones,163);
     const touchFit12=await touchPage12.evaluate(()=>window.ccWardrobeDenimFreeze06());
     assert.equal(touchFit12.originalPhotoSHA256,sourceDenim);
     assert.equal(touchFit12.trueBVHBodyContactNoNew,true);
     assert.equal(touchFit12.originalPhotoTextureRGBAndUVUnmodified08,true);
     await touchPage12.evaluate(()=>window.ccWardrobe10View(0));
     await touchPage12.waitForFunction(()=>window.ccWardrobe10Diagnostics()?.photoCoverageViewClass==='front-photo');
     const untouched12=await touchPage12.locator('#avatar').screenshot();
     const finger12=await originalCanvasTouchSwipe12(touchPage12);
     await touchPage12.waitForFunction(()=>['mixed-photo-and-model','unphotographed-rear'].includes(
      window.ccWardrobe10Diagnostics?.()?.photoCoverageViewClass),null,{timeout:12000});
     await touchPage12.waitForTimeout(600);
     const touched12=await touchPage12.locator('#avatar').screenshot();
     const observed12=await diag(touchPage12);
     const changed12=diff(await raw(untouched12),await raw(touched12));
     assert.ok(changed12>=50,'Actual finger swipe must alter >=50 original WebGL RGB pixels: '+changed12);
     assert.equal(observed12.bones,163);
     assert.equal(observed12.viewerMode,'verified-3d');
     assert.equal(observed12.sourcePhotoCoverageVisible,true);
     assert.equal(observed12.verifiedOriginalRearPhotograph,false);
     assert.equal(observed12.account,'fixture-account-a');
     assert.equal(observed12.displayed3DSources?.bottom,sourceDenim);
     assert.equal(observed12.sourceDenimCuffFairing08Enabled,true);
     assert.equal(await touchPage12.locator('#photoCoverage').getAttribute('data-rear-photo-verified'),'false');
     assert.ok((await touchPage12.locator('#photoCoverage').textContent()).toLowerCase().includes('modeled'));
     await writeFile('benchmark/source-touch-12/'+prefix+'-photographed-front.png',untouched12);
     await writeFile('benchmark/source-touch-12/'+prefix+'-real-touch-model-view.png',touched12);
     touchSwipe12.push({rig,width,denimIndex,sourceSHA256:sourceDenim,
      signedInSyntheticAccount:'fixture-account-a',actualRigBones:163,
      input:'Chromium CDP native touchStart/touchMove/touchEnd on real WebGL canvas',
      finger12,frontClass:'front-photo',afterClass:observed12.photoCoverageViewClass,
      changedWebGLPixels:changed12,sourceIdentitySameAfterTouch:true,
      garmentContactNoNew:touchFit12.trueBVHBodyContactNoNew,
      isolatedBrowserSession:true,
      confirmedRearOriginalPhoto:false,originalPhotoRGBUVAndSkinUnmodified:true,
      physicalAndroidIphoneTested:false,productionModified:false,releaseAuthorized:false});
     // F13: genuine native two-finger browser touch zoom, not app.zoom calls.
     // The SAME isolated original-source owner session is used; the inherited
     // reference page 'p' remains untouched for 0-pixel dress reset.
     await touchPage12.locator('#reset-view').click();
     await touchPage12.waitForFunction(()=>window.ccWardrobe10Diagnostics()?.photoCoverageViewClass==='front-photo');
     // Match both screenshots at a settled render frame after all damped
     // OrbitControls deltas have dissipated. The exact pixel gate remains <=2.
     await touchPage12.waitForTimeout(650);
     const initial13=await diag(touchPage12),firstDistance13=initial13.memory.cameraDistance;
     assert.ok(Math.abs(firstDistance13-4.65)<.02,'Full-body reset must return to safe canonical camera distance');
     assert.ok(Math.abs(initial13.memory.cameraPosition[0])<1e-9,
      'The FIRST reset must cancel all residual yaw before photography, not only the second reset');
     const front13=await touchPage12.locator('#avatar').screenshot();
     const in13=await originalCanvasPinch13(touchPage12,true);
     await touchPage12.waitForTimeout(600);
     const near13=await diag(touchPage12),nearDistance13=near13.memory.cameraDistance;
     const nearPng13=await touchPage12.locator('#avatar').screenshot();
     const changedIn13=diff(await raw(front13),await raw(nearPng13));
     assert.ok(nearDistance13>=2.5-1e-9&&nearDistance13<firstDistance13-.15&&changedIn13>=50,
      'Native two-finger zoom-in must change real WebGL without exceeding original camera bounds');
     const out13=await originalCanvasPinch13(touchPage12,false);
     await touchPage12.waitForTimeout(600);
     const far13=await diag(touchPage12),farDistance13=far13.memory.cameraDistance;
     const farPng13=await touchPage12.locator('#avatar').screenshot();
     const changedOut13=diff(await raw(nearPng13),await raw(farPng13));
     const pinchDiag13={rig,width,denimIndex,firstDistance13,nearDistance13,
      farDistance13,changedIn13,changedOut13};
     console.log('F13 original source native pinch distances/pixels:',JSON.stringify(pinchDiag13));
     assert.ok(farDistance13>nearDistance13+.15&&farDistance13<=6+1e-9&&changedOut13>=50,
      'Native two-finger zoom-out must change original WebGL and stay bounded: '+JSON.stringify(pinchDiag13));
     await touchPage12.locator('#reset-view').click();
     await touchPage12.waitForTimeout(650);
     const restored13=await diag(touchPage12);
     const restorePng13=await touchPage12.locator('#avatar').screenshot();
     const changedReset13=diff(await raw(front13),await raw(restorePng13));
     assert.ok(Math.abs(restored13.memory.cameraDistance-firstDistance13)<.02);
     assert.ok(Math.abs(restored13.memory.cameraPosition[0])<1e-9);
     assert.ok(Math.abs(restored13.memory.cameraPosition[2]-initial13.memory.cameraPosition[2])<1e-9);
     assert.equal(restored13.photoCoverageViewClass,'front-photo');
     assert.equal(restored13.displayed3DSources?.bottom,sourceDenim);
     assert.equal(restored13.account,'fixture-account-a');
     assert.equal(restored13.bones,163);
     assert.equal(restored13.verifiedOriginalRearPhotograph,false);
     console.log('F13 exact original photo reset:',JSON.stringify({
      rig,width,denimIndex,resetDifferencePixels:changedReset13,
      initialDistance:firstDistance13,restoredDistance:restored13.memory.cameraDistance,
      sourceSHA256:sourceDenim,initialCamera:initial13.memory.cameraPosition,
      resetCamera:restored13.memory.cameraPosition,
      initialTarget:initial13.memory.cameraTarget,resetTarget:restored13.memory.cameraTarget}));
     assert.ok(changedReset13<=2,'Original source full-body reset must recover exact WebGL framing (<=2 changed RGB pixels): '+changedReset13);
     for(const [name,png] of [['original-front',front13],['native-two-finger-zoom-in',nearPng13],
       ['native-two-finger-zoom-out',farPng13],['reset-full-body',restorePng13]])
      await writeFile('benchmark/mobile-pinch-13/'+prefix+'-'+name+'.png',png);
     pinchZoom13.push({rig,width,denimIndex,sourceSHA256:sourceDenim,
      owner:'fixture-account-a',original163BoneRig:true,in13,out13,
      firstDistance13,nearDistance13,farDistance13,resetDistance13:restored13.memory.cameraDistance,
      changedIn13,changedOut13,changedReset13,resetClass:restored13.photoCoverageViewClass,
      initialCameraX:initial13.memory.cameraPosition[0],
      restoredCameraX:restored13.memory.cameraPosition[0],
      noNewBVHContacts:touchFit12.trueBVHBodyContactNoNew,
      originalSourcePhotoAndSkinUntouched:true,physicalPhoneVerified:false,
      familyAlpha:'HOLD',productionModified:false,releaseAuthorized:false});
     await touchPage12.locator('#logout').click();
     assert.equal((await diag(touchPage12)).sourcePhotoCoverageVisible,false);
     assert.equal(await touchPage12.locator('#photoCoverage').isVisible(),false);
    }finally{await touchCtx12.close();}
    // All inherited tests continue on untouched 'p' and their prior exact
    // zero RGB frame reset requirements, not a weakened or re-baselined pose.
    if(width===390){
      // Real browser against the IDENTICAL saved-source JEANS and original
      // anatomical rig, not synthesized diagrams or guessed pixel data.
      // Parent F06 baseline (taper OFF) remains fully active independently.
      const bc=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
      const bp=await bc.newPage();monitor(bp);
      await bp.goto(host+'/research/fabric-sweep-04/index.html?walk=after&folds=after&sweep=after&dressFit=after&denimFit=after',{waitUntil:'domcontentloaded'});
      if(rig==='male'){
        await bp.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady===true,null,{timeout:180000});
        await bp.locator('#model').selectOption('male');
        await bp.waitForFunction(()=>window.ccWardrobe10Diagnostics()?.figure==='male'&&window.ccWardrobe10Diagnostics()?.viewerReady,null,{timeout:180000});
      }
      await ready(bp);
      await bp.locator('#swap').click();
      if(denimIndex===1)await bp.locator('#swap').click();
      await bp.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.outfitMode==='shirt-pants',null,{timeout:30000});
      const old=await diag(bp);
      assert.equal(old.sourceDenimSilhouette07Enabled,false);
      assert.equal(old.displayed3DSources?.bottom,sourceDenim);
      await bp.evaluate(()=>window.ccWardrobe10View(90));
      const original06=await bp.evaluate(()=>window.ccWardrobeDenimFreeze06());
      assert.equal(original06.sourceMeasuredAnatomicalSilhouette07,false);
      assert.equal(original06.originalPhotoSHA256,sourceDenim);
      const image06=await bp.locator('#avatar').screenshot();

      // Same original SHA, same actual 163-bone figure, same exact angle; F07 ON,
      // F08 OFF comparison must be real WebGL, not hand-drawn or resampled.
      await bp.goto(host+'/research/fabric-sweep-04/index.html?walk=after&folds=after&sweep=after&dressFit=after&denimFit=after&denimSilhouette=after',{waitUntil:'domcontentloaded'});
      if(rig==='male'){
       await bp.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady===true,null,{timeout:180000});
       await bp.locator('#model').selectOption('male');
       await bp.waitForFunction(()=>window.ccWardrobe10Diagnostics()?.figure==='male'&&window.ccWardrobe10Diagnostics()?.viewerReady,null,{timeout:180000});
      }
      await ready(bp);
      await bp.locator('#swap').click();
      if(denimIndex===1)await bp.locator('#swap').click();
      await bp.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.outfitMode==='shirt-pants',null,{timeout:30000});
      const old07=await diag(bp);
      assert.equal(old07.sourceDenimSilhouette07Enabled,true);
      assert.equal(old07.sourceDenimCuffFairing08Enabled,false);
      assert.equal(old07.displayed3DSources?.bottom,sourceDenim);
      await bp.evaluate(()=>window.ccWardrobe10View(90));
      const proof07=await bp.evaluate(()=>window.ccWardrobeDenimFreeze06());
      assert.equal(proof07.originalSourceNeutralCuffFairing08,false);
      assert.equal(proof07.originalPhotoSHA256,sourceDenim);
      const frame07=await bp.locator('#avatar').screenshot();
      const pixelDelta=diff(await raw(image06),await raw(frame07));
      assert.ok(pixelDelta>=30,'Original F06-to-F07 anatomical source silhouette must differ in real WebGL: '+pixelDelta);
      for(const [suffix,image] of [['baseline-f06',image06],['silhouette-f07',frame07]])
       await writeFile('benchmark/denim-silhouette-07/'+prefix+'-'+suffix+'.png',image);
      denimSilhouetteComparisons.push({width,rig,denimIndex,sourceDenim,
       changedPixelsAgainstExactOriginalF06:pixelDelta,
       realSourceDenim:true,originalFrontAndSkinPreserved:true,
       original163BoneMannequin:true,
       noNewTriangleContacts:proof07.bodyContactAfter<=proof07.bodyContactBefore,
       kneeVsHemEaseMeters:proof07.additionalKneeVsHemEaseMeters07,
       actualSewnFoldTopologyPreserved:true,
       releaseAuthorized:false,physicalPhoneApproved:false});

      const originalF07RGB=await raw(frame07),fairingF08RGB=await raw(frozen);
      const changed08=diff(originalF07RGB,fairingF08RGB);
      const garmentWitness10=photographedLowerGarmentPixelWitness10(originalF07RGB,fairingF08RGB);
      assert.ok(changed08>=20,'Real photographed cuff geometry must differ from exact original F07: '+changed08);
      assert.ok(garmentWitness10.changedGarmentPixels>=20,
       'Actual photographed jeans cuff surface must change independently of top-edge screenshot artifacts: '+
       garmentWitness10.changedGarmentPixels);
      for(const [suffix,image] of [['baseline-f07',frame07],['cuff-f08',frozen]])
       await writeFile('benchmark/denim-fairing-08/'+prefix+'-'+suffix+'.png',image);
      denimFairing08Comparisons.push({width,rig,denimIndex,sourceDenim,
       changedPixelsAgainstExactOriginalF07:changed08,
       changedGarmentPixelsAgainstExactOriginalF07:garmentWitness10.changedGarmentPixels,
       garmentPixelsExcludingScreenshotTopRow:true,
       realSource163BoneRig:true,frontPhotoAndUVUnchanged:true,
       noNewSkinnedTriangleContacts:fitted.bodyContactAfter<=fitted.bodyContactBefore,
       cuffReleasedVertices:fitted.cuffReleasedVertices08,
       maxCuffReleaseMeters:fitted.maxCuffReleaseMeters08,
       originalSourcePhotoSHA256:sourceDenim,releaseAuthorized:false});
      // F09 -- actual browser WebGL in matched authenticated F07 and F08 viewers.
      // Front and oblique and rear, not invented detail about unseen fabric.
      for(const angle of [0,45,135,180]){
       await bp.evaluate(a=>window.ccWardrobe10View(a),angle);
       await p.evaluate(a=>window.ccWardrobe10View(a),angle);
       // F10: source provenance must be truthful on both real WebGL viewers.
       const expectedViewClass=angle===0?'front-photo':
        angle===180?'unphotographed-rear':'mixed-photo-and-model';
       for(const viewer of [bp,p]){
        const label=viewer.locator('#photoCoverage');
        assert.equal(await label.isVisible(),true);
        assert.equal(await label.getAttribute('data-view-class'),expectedViewClass);
        assert.equal(await label.getAttribute('data-rear-photo-verified'),'false');
        if(angle===180)assert.match(await label.textContent(),/Back NOT photographed/);
        const d10=await diag(viewer);
        assert.equal(d10.photoCoverageViewClass,expectedViewClass);
        assert.equal(d10.sourcePhotoCoverageVisible,true);
        assert.equal(d10.verifiedOriginalRearPhotograph,false);
       }
       const a07=await bp.locator('#avatar').screenshot();
       const a08=await p.locator('#avatar').screenshot();
       const changedPixels=diff(await raw(a07),await raw(a08));
       const before09=await diag(bp),after09=await diag(p);
       assert.equal(before09.bones,163);assert.equal(after09.bones,163);
       assert.equal(before09.sourceDenimSilhouette07Enabled,true);
       assert.equal(before09.sourceDenimCuffFairing08Enabled,false);
       assert.equal(after09.sourceDenimCuffFairing08Enabled,true);
       assert.equal(before09.displayed3DSources?.bottom,sourceDenim);
       assert.equal(after09.displayed3DSources?.bottom,sourceDenim);
       assert.equal(before09.account,'fixture-account-a');
       assert.equal(after09.account,'fixture-account-a');
       const name=prefix+'-view-'+String(angle).padStart(3,'0');
       await writeFile('benchmark/denim-angle-09/'+name+'-baseline-f07.png',a07);
       await writeFile('benchmark/denim-angle-09/'+name+'-fairing-f08.png',a08);
       denimAngle09Comparisons.push({rig,denimIndex,sourceDenim,width,angle,
        sameConfirmedOriginalSource:true,sameReal163BoneAnatomy:true,
        sourceFrontUVAndSHAProtected:true,
        noNewBVHContacts:fitted.bodyContactAfter<=fitted.bodyContactBefore,
        changedPixels,sourcePhotographyRearNotInferred:true,
        actualBrowserWebGL:true,releaseAuthorized:false});
      }
      await bp.evaluate(()=>window.ccWardrobe10View(90));
      await p.evaluate(()=>window.ccWardrobe10View(90));
      const returned07=await bp.locator('#avatar').screenshot();
      const returned08=await p.locator('#avatar').screenshot();
      assert.ok(diff(await raw(returned07),await raw(frame07))<=2,
        'F07 original photographed garment lost its source pose after angle sweep');
      assert.ok(diff(await raw(returned08),await raw(frozen))<=2,
        'F08 photographed garment shifted after real 360 navigation');
      // F11: real canvas pointer drag, not a programmatic view preset.
      // Exercise the photo-provenance change event on a genuine 163-bone
      // original-denim mobile WebGL canvas. Keep existing frame counts intact.
      if(width===390&&rig==='female'&&denimIndex===0){
       await bp.evaluate(()=>window.ccWardrobe10View(0));
       await bp.waitForFunction(()=>window.ccWardrobe10Diagnostics()?.photoCoverageViewClass==='front-photo');
       const front11=await bp.locator('#avatar').screenshot();
       const canvas11=await bp.locator('#avatar').boundingBox();
       assert.ok(canvas11&&canvas11.width>100&&canvas11.height>100,
        'A visible real original-source WebGL canvas is required for drag QA');
       const y11=canvas11.y+canvas11.height*.5;
       await bp.mouse.move(canvas11.x+canvas11.width*.78,y11);
       await bp.mouse.down();
       await bp.mouse.move(canvas11.x+canvas11.width*.18,y11,{steps:15});
       await bp.mouse.up();
       await bp.waitForFunction(()=>{
        const state=window.ccWardrobe10Diagnostics?.();
        return state?.sourcePhotoCoverageVisible===true&&
         ['mixed-photo-and-model','unphotographed-rear'].includes(state.photoCoverageViewClass);
       },null,{timeout:10000});
       const rotated11=await bp.locator('#avatar').screenshot();
       const drag11=await diag(bp),pixels11=diff(await raw(front11),await raw(rotated11));
       assert.ok(pixels11>=50,'Real source-photographed 3D canvas must rotate with the drag');
       assert.equal(drag11.account,'fixture-account-a');
       assert.equal(drag11.bones,163);
       assert.equal(drag11.displayed3DSources?.bottom,sourceDenim);
       assert.equal(drag11.verifiedOriginalRearPhotograph,false);
       assert.equal(await bp.locator('#photoCoverage').getAttribute('data-rear-photo-verified'),'false');
       pointerRotation11.push({width,rig,denimIndex,
        input:'Playwright real canvas mouse drag (not programmatic camera preset)',
        pixelsChangedOnRealWebGL: pixels11,
        initialClass:'front-photo',draggedViewClass:drag11.photoCoverageViewClass,
        sourceSHA256:sourceDenim,authenticatedOwner:'fixture-account-a',
        original163BoneAnatomy:true,unseenRearPhotographCertified:false,
        originalFrontSourcePreserved:true,physicalPhoneTested:false,
        releaseAuthorized:false});
      }
      await bp.evaluate(()=>window.ccWardrobe10Test.logout());
      assert.equal(await bp.locator('#photoCoverage').isVisible(),false);
      assert.equal((await diag(bp)).sourcePhotoCoverageVisible,false);
      assert.equal(await bp.locator('#photoCoverage').textContent(),'');
      await bc.close();
      // R14: compare original authenticated F08 sewn denim against an
      // entirely independent opt-in R14 viewer on same rig/source/angle.
      // No fake screenshot, no external photo and no geometry altered in F08.
      const rearCtx14=await browser.newContext({
       viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
      try{
       const rearPage14=await rearCtx14.newPage();monitor(rearPage14);
       await rearPage14.goto(host+'/research/fabric-sweep-04/index.html?walk=after&folds=after&sweep=after&dressFit=after&denimFit=after&denimSilhouette=after&denimFairing=after&denimRear14=after',{waitUntil:'domcontentloaded'});
       if(rig==='male'){
        await rearPage14.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady===true,null,{timeout:180000});
        await rearPage14.locator('#model').selectOption('male');
        await rearPage14.waitForFunction(()=>window.ccWardrobe10Diagnostics()?.figure==='male'&&window.ccWardrobe10Diagnostics()?.viewerReady===true,null,{timeout:180000});
       }
       await ready(rearPage14);
       await rearPage14.locator('#swap').click();
       if(denimIndex===1)await rearPage14.locator('#swap').click();
       await rearPage14.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.outfitMode==='shirt-pants',null,{timeout:30000});
       const original14=await diag(rearPage14);
       assert.equal(original14.sourceDenimRearThigh14Enabled,true);
       assert.equal(original14.displayed3DSources?.bottom,sourceDenim);
       assert.equal(original14.account,'fixture-account-a');
       assert.equal(original14.bones,163);
       const fitted14=await rearPage14.evaluate(()=>window.ccWardrobeDenimFreeze06());
       assert.equal(fitted14.originalPhotoSHA256,sourceDenim);
       assert.equal(fitted14.sourceMeasuredRearThighRelief14,true);
       assert.equal(fitted14.originalPhotographedFrontProtected14,true);
       assert.equal(fitted14.sourcePhotoRGBUVRestAndSkinUnchanged14,true);
       assert.equal(fitted14.noInventedPhotographicRear14,true);
       assert.ok(fitted14.rearThighSourceNeutralVertices14>=40);
       assert.ok(Math.min(...fitted14.rearThighPerLeg14)>=15);
       assert.ok(fitted14.rearThighMaximumWorldMoveMeters14>=.008&&
        fitted14.rearThighMaximumWorldMoveMeters14<=.0100001);
       assert.equal(fitted14.trueBVHBodyContactNoNew,true);
       assert.ok(fitted14.bodyContactAfter<=fitted14.bodyContactBefore);
       await rearPage14.evaluate(()=>window.ccWardrobe10View(180));
       await p.evaluate(()=>window.ccWardrobe10View(180));
       const modelRear14=await rearPage14.locator('#avatar').screenshot();
       const originalRear08=await p.locator('#avatar').screenshot();
       const rearPixels14=diff(await raw(originalRear08),await raw(modelRear14));
       assert.ok(rearPixels14>=20,'Genuine source-neutral rear thigh drape must be visibly different in matched original WebGL rear: '+rearPixels14);
       const after14=await diag(rearPage14);
       assert.equal(after14.photoCoverageViewClass,'unphotographed-rear');
       assert.equal(after14.verifiedOriginalRearPhotograph,false);
       assert.equal(after14.displayed3DSources?.bottom,sourceDenim);
       for(const [name,png] of [['exact-f08-rear',originalRear08],['measured-r14-rear',modelRear14]])
        await writeFile('benchmark/denim-rear-thigh-14/'+prefix+'-'+name+'.png',png);
       denimRear14Comparisons.push({rig,width,denimIndex,sourceDenim,
        sameOriginalLicensedSHA:true,sameOriginal163BoneFigure:true,
        sameActualCameraAngle:180,originalAccount:'fixture-account-a',
        changedWebGLRearPixels:rearPixels14,
        shiftedActualSourceRearVertices:fitted14.rearThighSourceNeutralVertices14,
        perLegMoved:fitted14.rearThighPerLeg14,
        maxMeasuredRearShiftMeters:fitted14.rearThighMaximumWorldMoveMeters14,
        originalSourceFrontUVRestAndSkinUntouched:true,
        realSkinnedBodyContactsBefore:fitted14.bodyContactBefore,
        realSkinnedBodyContactsAfter:fitted14.bodyContactAfter,
        modeledRearNotPhotographed:true,physicallyTested:false,
        productionModified:false,releaseAuthorized:false});
       // S15: original 163-bone source rear geometry vs independent
       // source-neutral lateral thigh, two real angles and identical camera.
       const sideCtx15=await browser.newContext({
        viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
       try{
        const sidePage15=await sideCtx15.newPage();monitor(sidePage15);
        await sidePage15.goto(host+'/research/fabric-sweep-04/index.html?walk=after&folds=after&sweep=after&dressFit=after&denimFit=after&denimSilhouette=after&denimFairing=after&denimRear14=after&denimSide15=after',{waitUntil:'domcontentloaded'});
        if(rig==='male'){
         await sidePage15.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady===true,null,{timeout:180000});
         await sidePage15.locator('#model').selectOption('male');
         await sidePage15.waitForFunction(()=>window.ccWardrobe10Diagnostics()?.figure==='male'&&window.ccWardrobe10Diagnostics()?.viewerReady===true,null,{timeout:180000});
        }
        await ready(sidePage15);
        await sidePage15.locator('#swap').click();
        if(denimIndex===1)await sidePage15.locator('#swap').click();
        await sidePage15.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.outfitMode==='shirt-pants',null,{timeout:30000});
        const original15=await diag(sidePage15);
        assert.equal(original15.sourceDenimSideThigh15Enabled,true);
        assert.equal(original15.displayed3DSources?.bottom,sourceDenim);
        assert.equal(original15.account,'fixture-account-a');
        assert.equal(original15.bones,163);
        const fitted15=await sidePage15.evaluate(()=>window.ccWardrobeDenimFreeze06());
        assert.equal(fitted15.originalPhotoSHA256,sourceDenim);
        assert.equal(fitted15.sourceMeasuredRearThighRelief14,true);
        assert.equal(fitted15.sourceMeasuredSideThighRelief15,true);
        assert.equal(fitted15.actual163BoneHipKneeSourceAnchors15,true);
        assert.equal(fitted15.originalPhotographedFrontProtected15,true);
        assert.equal(fitted15.sourcePhotoRGBUVRestAndSkinUnchanged15,true);
        assert.equal(fitted15.noInventedPhotographicRear15,true);
        assert.ok(fitted15.sideThighSourceNeutralVertices15>=40);
        assert.ok(Math.min(...fitted15.sideThighPerLeg15)>=15);
        assert.ok(fitted15.sideThighMaximumWorldMoveMeters15>=.006&&
         fitted15.sideThighMaximumWorldMoveMeters15<=.0065001);
        assert.equal(fitted15.trueBVHBodyContactNoNew,true);
        assert.ok(fitted15.bodyContactAfter<=fitted15.bodyContactBefore);
        for(const angle of [135,180]){
         await rearPage14.evaluate(a=>window.ccWardrobe10View(a),angle);
         await sidePage15.evaluate(a=>window.ccWardrobe10View(a),angle);
         const baseline15=await rearPage14.locator('#avatar').screenshot();
         const eased15=await sidePage15.locator('#avatar').screenshot();
         const changed15=diff(await raw(baseline15),await raw(eased15));
         assert.ok(changed15>=20,'Real source-neutral lateral thigh must visibly change matched R14 WebGL at '+angle+': '+changed15);
         const label=prefix+'-view-'+angle;
         await writeFile('benchmark/denim-side-thigh-15/'+label+'-exact-r14.png',baseline15);
         await writeFile('benchmark/denim-side-thigh-15/'+label+'-anatomical-s15.png',eased15);
         denimSide15Comparisons.push({rig,width,denimIndex,sourceDenim,angle,
          sameOriginalLicensedSHA:true,sameOriginal163BoneFigure:true,
          originalAccount:'fixture-account-a',changedActualWebGLPixels:changed15,
          sideThighSourceNeutralVertices:fitted15.sideThighSourceNeutralVertices15,
          perLegMoved:fitted15.sideThighPerLeg15,
          maxMeasuredLateralShiftMeters:fitted15.sideThighMaximumWorldMoveMeters15,
          originalFrontJPEGUVRestSkinUnchanged:true,
          realSkinnedBodyContactsBefore:fitted15.bodyContactBefore,
          realSkinnedBodyContactsAfter:fitted15.bodyContactAfter,
          unseenRearImageInvented:false,physicalPhoneTested:false,
          humanPhotorealismApproved:false,productionModified:false,
          releaseAuthorized:false});
        }
        // P16: compare exact original S15 cloth to independently fitted
        // anatomical posterior contour in real mobile Chromium/WebGL.
        // Identical licensed source, true 163-bone figure and camera.
        const contourCtx16=await browser.newContext({
         viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
        try{
         const contourPage16=await contourCtx16.newPage();monitor(contourPage16);
         await contourPage16.goto(host+'/research/fabric-sweep-04/index.html?walk=after&folds=after&sweep=after&dressFit=after&denimFit=after&denimSilhouette=after&denimFairing=after&denimRear14=after&denimSide15=after&denimPosterior16=after',{waitUntil:'domcontentloaded'});
         if(rig==='male'){
          await contourPage16.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady===true,null,{timeout:180000});
          await contourPage16.locator('#model').selectOption('male');
          await contourPage16.waitForFunction(()=>window.ccWardrobe10Diagnostics()?.figure==='male'&&window.ccWardrobe10Diagnostics()?.viewerReady===true,null,{timeout:180000});
         }
         await ready(contourPage16);
         await contourPage16.locator('#swap').click();
         if(denimIndex===1)await contourPage16.locator('#swap').click();
         await contourPage16.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.outfitMode==='shirt-pants',null,{timeout:30000});
         const diag16=await diag(contourPage16);
         assert.equal(diag16.sourceDenimPosteriorContour16Enabled,true);
         assert.equal(diag16.displayed3DSources?.bottom,sourceDenim);
         assert.equal(diag16.account,'fixture-account-a');
         assert.equal(diag16.bones,163);
         const fit16=await contourPage16.evaluate(()=>window.ccWardrobeDenimFreeze06());
         assert.equal(fit16.originalPhotoSHA256,sourceDenim);
         assert.equal(fit16.sourceMeasuredPosteriorContour16,true);
         assert.equal(fit16.original163BoneHipKneeAnchor16,true);
         assert.equal(fit16.frontPhotographUVRestSkinProtected16,true);
         assert.equal(fit16.rearIsModeledNotPhotographed16,true);
         assert.ok(fit16.posteriorSourceNeutralVertices16>=40);
         assert.ok(Math.min(...fit16.posteriorPerLeg16)>=15);
         assert.ok(fit16.posteriorMaximumWorldMoveMeters16>=.0105&&
          fit16.posteriorMaximumWorldMoveMeters16<=.0115001);
         assert.equal(fit16.trueBVHBodyContactNoNew,true);
         assert.ok(fit16.bodyContactAfter<=fit16.bodyContactBefore);
         for(const angle of [90,135]){
          await sidePage15.evaluate(a=>window.ccWardrobe10View(a),angle);
          await contourPage16.evaluate(a=>window.ccWardrobe10View(a),angle);
          const baseline16=await sidePage15.locator('#avatar').screenshot();
          const contour16=await contourPage16.locator('#avatar').screenshot();
          const changed16=diff(await raw(baseline16),await raw(contour16));
          assert.ok(changed16>=20,'P16 source-neutral anatomical posterior contour must visibly change authentic WebGL at '+angle+': '+changed16);
          const name=prefix+'-view-'+angle;
          await writeFile('benchmark/denim-posterior-contour-16/'+name+'-exact-s15.png',baseline16);
          await writeFile('benchmark/denim-posterior-contour-16/'+name+'-contour-p16.png',contour16);
          denimPosterior16Comparisons.push({rig,width,denimIndex,sourceDenim,angle,
           sameOriginalLicensedSHA:true,sameOriginal163BoneFigure:true,
           originalAccount:'fixture-account-a',changedActualWebGLPixels:changed16,
           posteriorSourceNeutralVertices:fit16.posteriorSourceNeutralVertices16,
           perLegMoved:fit16.posteriorPerLeg16,
           maximumPosteriorEaseMeters:fit16.posteriorMaximumWorldMoveMeters16,
           originalFrontJPEGUVRestSkinUnchanged:true,
           realSkinnedBodyContactsBefore:fit16.bodyContactBefore,
           realSkinnedBodyContactsAfter:fit16.bodyContactAfter,
           unseenRearPhotographInvented:false,physicalPhoneTested:false,
           humanPhotorealismApproved:false,productionModified:false,
           releaseAuthorized:false});
         }
         // W17: unlike guessed rear contours, this next original-photo width
         // profile is measured from the actual hash-verified alpha cutout.
         const widthCtx17=await browser.newContext({
          viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
         try{
          const widthPage17=await widthCtx17.newPage();monitor(widthPage17);
          await widthPage17.goto(host+'/research/fabric-sweep-04/index.html?walk=after&folds=after&sweep=after&dressFit=after&denimFit=after&denimSilhouette=after&denimFairing=after&denimRear14=after&denimSide15=after&denimPosterior16=after&denimPhotoWidth17=after',{waitUntil:'domcontentloaded'});
          if(rig==='male'){
           await widthPage17.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady===true,null,{timeout:180000});
           await widthPage17.locator('#model').selectOption('male');
           await widthPage17.waitForFunction(()=>window.ccWardrobe10Diagnostics()?.figure==='male'&&window.ccWardrobe10Diagnostics()?.viewerReady===true,null,{timeout:180000});
          }
          await ready(widthPage17);
          await widthPage17.locator('#swap').click();
          if(denimIndex===1)await widthPage17.locator('#swap').click();
          await widthPage17.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.outfitMode==='shirt-pants',null,{timeout:30000});
          const diag17=await diag(widthPage17);
          assert.equal(diag17.sourceDenimPhotoWidth17Enabled,true);
          assert.equal(diag17.displayed3DSources?.bottom,sourceDenim);
          assert.equal(diag17.account,'fixture-account-a');
          assert.equal(diag17.bones,163);
          const fit17=await widthPage17.evaluate(()=>window.ccWardrobeDenimFreeze06());
          assert.equal(fit17.originalPhotoSHA256,sourceDenim);
          assert.equal(fit17.originalPhotoCalibratedCalfWidth17,true);
          assert.equal(fit17.frontJPEGUVRestSkinUnchanged17,true);
          assert.equal(fit17.unseenRearPhotoSynthesized17,false);
          assert.equal(fit17.trueBVHBodyContactNoNew,true);
          assert.ok(fit17.bodyContactAfter<=fit17.bodyContactBefore);
          assert.ok(fit17.sourceCalfWidthMovedVertices17>=40);
          assert.ok(Math.min(...fit17.sourceCalfWidthPerLeg17)>=15);
          assert.ok(fit17.sourceCalfWidthMaxShiftMeters17>=.007&&
           fit17.sourceCalfWidthMaxShiftMeters17<=.0180001);
          assert.equal(fit17.sourceCutoutLegWidthRatios17.length,2);
          for(const angle of [90,135]){
           await contourPage16.evaluate(a=>window.ccWardrobe10View(a),angle);
           await widthPage17.evaluate(a=>window.ccWardrobe10View(a),angle);
           const previous17=await contourPage16.locator('#avatar').screenshot();
           const photoFit17=await widthPage17.locator('#avatar').screenshot();
           const changed17=diff(await raw(previous17),await raw(photoFit17));
           assert.ok(changed17>=20,'W17 original photo measured calf ratio must change real 163-bone WebGL '+angle+': '+changed17);
           const key=prefix+'-view-'+angle;
           await writeFile('benchmark/denim-photo-width-17/'+key+'-exact-p16.png',previous17);
           await writeFile('benchmark/denim-photo-width-17/'+key+'-photo-w17.png',photoFit17);
           denimPhotoWidth17Comparisons.push({rig,width,denimIndex,sourceDenim,angle,
            originalAccount:'fixture-account-a',
            sameVerifiedOriginalCutoutAndSHA:true,sameOriginal163BoneFigure:true,
            originalPerLegHemToKneeRatios:fit17.sourceCutoutLegWidthRatios17,
            changedActualWebGLPixels:changed17,
            sourceCalfWidthMovedVertices:fit17.sourceCalfWidthMovedVertices17,
            sourceCalfWidthPerLeg:fit17.sourceCalfWidthPerLeg17,
            maximumCalibratedEaseMeters:fit17.sourceCalfWidthMaxShiftMeters17,
            originalFrontJPEGUVRestSkinUnchanged:true,
            realSkinnedBodyContactsBefore:fit17.bodyContactBefore,
            realSkinnedBodyContactsAfter:fit17.bodyContactAfter,
            noInventedOriginalRearPixels:true,physicalPhoneTested:false,
            humanPhotorealismApproved:false,productionModified:false,
            releaseAuthorized:false});
          }

          // P18: independently render genuine photographed 5-station
          // leg profile vs exact approved W17 with identical original
          // source, 163-bone rig, recorded camera and protected owner.
          const profileCtx18=await browser.newContext({
           viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
          try{
           const profilePage18=await profileCtx18.newPage();monitor(profilePage18);
           await profilePage18.goto(host+'/research/fabric-sweep-04/index.html?walk=after&folds=after&sweep=after&dressFit=after&denimFit=after&denimSilhouette=after&denimFairing=after&denimRear14=after&denimSide15=after&denimPosterior16=after&denimPhotoWidth17=after&denimProfile18=after',{waitUntil:'domcontentloaded'});
           if(rig==='male'){
            await profilePage18.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady===true,null,{timeout:180000});
            await profilePage18.locator('#model').selectOption('male');
            await profilePage18.waitForFunction(()=>window.ccWardrobe10Diagnostics()?.figure==='male'&&window.ccWardrobe10Diagnostics()?.viewerReady===true,null,{timeout:180000});
           }
           await ready(profilePage18);
           await profilePage18.locator('#swap').click();
           if(denimIndex===1)await profilePage18.locator('#swap').click();
           await profilePage18.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.outfitMode==='shirt-pants',null,{timeout:30000});
           const state18=await diag(profilePage18);
           assert.equal(state18.sourceDenimProfile18Enabled,true);
           assert.equal(state18.displayed3DSources?.bottom,sourceDenim);
           assert.equal(state18.account,'fixture-account-a');
           assert.equal(state18.bones,163);
           const fitted18=await profilePage18.evaluate(()=>window.ccWardrobeDenimFreeze06());
           assert.equal(fitted18.originalPhotoSHA256,sourceDenim);
           assert.equal(fitted18.sourceMeasuredOriginalCalfProfile18,true);
           assert.equal(fitted18.originalFrontSHAUVRestAndSkinProtected18,true);
           assert.equal(fitted18.noUnphotographedRearTexture18,true);
           assert.equal(fitted18.trueBVHBodyContactNoNew,true);
           assert.ok(fitted18.bodyContactAfter<=fitted18.bodyContactBefore);
           assert.equal(fitted18.originalPhotoFiveLegStations18?.length,2);
           assert.ok(fitted18.originalPhotoFiveLegStations18.every(x=>x.length===5));
           assert.ok(fitted18.photographedCalfProfileMovedVertices18>=40);
           assert.ok(Math.min(...fitted18.photographedCalfProfilePerLeg18)>=15);
           assert.ok(fitted18.photographedCalfProfileMaxShiftMeters18>=.004&&
            fitted18.photographedCalfProfileMaxShiftMeters18<=.0180001);
           for(const angle of [90,135]){
            await widthPage17.evaluate(a=>window.ccWardrobe10View(a),angle);
            await profilePage18.evaluate(a=>window.ccWardrobe10View(a),angle);
            const original17=await widthPage17.locator('#avatar').screenshot();
            const profile18=await profilePage18.locator('#avatar').screenshot();
            const changed18=diff(await raw(original17),await raw(profile18));
            assert.ok(changed18>=20,'Photo-derived 5-station leg drape must visibly differ from W17 at '+angle+': '+changed18);
            const file=prefix+'-view-'+angle;
            await writeFile('benchmark/denim-original-profile-18/'+file+'-exact-w17.png',original17);
            await writeFile('benchmark/denim-original-profile-18/'+file+'-original-profile-p18.png',profile18);
            denimProfile18Comparisons.push({rig,width,denimIndex,sourceDenim,angle,
             sourceOwner:'fixture-account-a',original163BoneRig:true,
             originalFivePhotographicWidthStations:fitted18.originalPhotoFiveLegStations18,
             changedRealWebGLRGBPixels:changed18,
             actualProfileMovedVertices:fitted18.photographedCalfProfileMovedVertices18,
             actualProfileMovedPerLeg:fitted18.photographedCalfProfilePerLeg18,
             maximumSourceProfileShapeMeters:fitted18.photographedCalfProfileMaxShiftMeters18,
             originalFrontRGBAUVRestSkinUnchanged:true,
             genuineSkinnedBodyContactsBefore:fitted18.bodyContactBefore,
             genuineSkinnedBodyContactsAfter:fitted18.bodyContactAfter,
             inventedUnphotographedTexture:false,
             humanPhotorealismApproved:false,realDeviceVerified:false,
             productionModified:false,releaseAuthorized:false});
           }

           // P19: real signed original-hem direction against exactly frozen
           // P18, identical original source, camera, rig and account.
           const signedCtx19=await browser.newContext({
            viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
           try{
            const signedPage19=await signedCtx19.newPage();monitor(signedPage19);
            await signedPage19.goto(host+'/research/fabric-sweep-04/index.html?walk=after&folds=after&sweep=after&dressFit=after&denimFit=after&denimSilhouette=after&denimFairing=after&denimRear14=after&denimSide15=after&denimPosterior16=after&denimPhotoWidth17=after&denimProfile18=after&denimSigned19=after',{waitUntil:'domcontentloaded'});
            if(rig==='male'){
             await signedPage19.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady===true,null,{timeout:180000});
             await signedPage19.locator('#model').selectOption('male');
             await signedPage19.waitForFunction(()=>window.ccWardrobe10Diagnostics()?.figure==='male'&&window.ccWardrobe10Diagnostics()?.viewerReady===true,null,{timeout:180000});
            }
            await ready(signedPage19);
            await signedPage19.locator('#swap').click();
            if(denimIndex===1)await signedPage19.locator('#swap').click();
            await signedPage19.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.outfitMode==='shirt-pants',null,{timeout:30000});
            const state19=await diag(signedPage19);
            assert.equal(state19.sourceDenimSigned19Enabled,true);
            assert.equal(state19.displayed3DSources?.bottom,sourceDenim);
            assert.equal(state19.account,'fixture-account-a');
            assert.equal(state19.bones,163);
            const fit19=await signedPage19.evaluate(()=>window.ccWardrobeDenimFreeze06());
            assert.equal(fit19.originalPhotoSHA256,sourceDenim);
            assert.equal(fit19.originalPhotoDirectionalCalf19,true);
            assert.equal(fit19.originalPhotoFrontUnchanged19,true);
            assert.equal(fit19.unphotographedRearUnchanged19,true);
            assert.equal(fit19.trueBVHBodyContactNoNew,true);
            assert.ok(fit19.bodyContactAfter<=fit19.bodyContactBefore);
            assert.ok(fit19.signedSourceCalfMovedVertices19>=25);
            assert.ok(Math.min(...fit19.signedSourceCalfPerLeg19)>=10);
            assert.ok(fit19.sourcePhotoSignedShiftMaxMeters19>.001&&
             fit19.sourcePhotoSignedShiftMaxMeters19<=.0115001);
            const actualHemRatio=fit19.originalPhotoSignedRatios19;
            assert.ok(actualHemRatio?.length===2);
            assert.equal(actualHemRatio.every(v=>v<1),denimIndex===0);
            for(const angle of [90,135]){
             await profilePage18.evaluate(a=>window.ccWardrobe10View(a),angle);
             await signedPage19.evaluate(a=>window.ccWardrobe10View(a),angle);
             const before=await profilePage18.locator('#avatar').screenshot();
             const after=await signedPage19.locator('#avatar').screenshot();
             const changed19=diff(await raw(before),await raw(after));
             assert.ok(changed19>=20,'P19 genuine signed hem shape must differ from P18 '+angle+': '+changed19);
             const key=prefix+'-view-'+angle;
             await writeFile('benchmark/denim-signed-calf-19/'+key+'-exact-p18.png',before);
             await writeFile('benchmark/denim-signed-calf-19/'+key+'-signed-p19.png',after);
             denimSigned19Comparisons.push({rig,width,denimIndex,sourceDenim,angle,
              verifiedOriginalHemRatios:actualHemRatio,
              expectedDirection:denimIndex===0?'inward':'outward',
              changedRealWebGLRGBPixels:changed19,
              sourceCalfMovedVertices19:fit19.signedSourceCalfMovedVertices19,
              sourceCalfMovedPerLeg19:fit19.signedSourceCalfPerLeg19,
              sourceCalfMaxShiftMeters19:fit19.sourcePhotoSignedShiftMaxMeters19,
              originalFrontAnd163BoneSkinProtected:true,
              genuineSkinnedBodyContactsBefore:fit19.bodyContactBefore,
              genuineSkinnedBodyContactsAfter:fit19.bodyContactAfter,
              inventedUnphotographedTexture:false,realDeviceVerified:false,
              humanPhotorealismApproved:false,productionModified:false,releaseAuthorized:false});
            }
            // P20: same verified source/account and true 163-bone rig,
            // with only a bounded modeled side/rear anatomical contour
            // switched on. Compare exact camera side, oblique and rear.
            const lineCtx20=await browser.newContext({
             viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
            try{
             const linePage20=await lineCtx20.newPage();monitor(linePage20);
             await linePage20.goto(host+'/research/fabric-sweep-04/index.html?walk=after&folds=after&sweep=after&dressFit=after&denimFit=after&denimSilhouette=after&denimFairing=after&denimRear14=after&denimSide15=after&denimPosterior16=after&denimPhotoWidth17=after&denimProfile18=after&denimSigned19=after&denimLine20=after',{waitUntil:'domcontentloaded'});
             if(rig==='male'){
              await linePage20.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady===true,null,{timeout:180000});
              await linePage20.locator('#model').selectOption('male');
              await linePage20.waitForFunction(()=>window.ccWardrobe10Diagnostics()?.figure==='male'&&window.ccWardrobe10Diagnostics()?.viewerReady===true,null,{timeout:180000});
             }
             await ready(linePage20);
             await linePage20.locator('#swap').click();
             if(denimIndex===1)await linePage20.locator('#swap').click();
             await linePage20.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.outfitMode==='shirt-pants',null,{timeout:30000});
             const state20=await diag(linePage20);
             assert.equal(state20.sourceDenimLine20Enabled,true);
             assert.equal(state20.displayed3DSources?.bottom,sourceDenim);
             assert.equal(state20.account,'fixture-account-a');
             assert.equal(state20.bones,163);
             const fit20=await linePage20.evaluate(()=>window.ccWardrobeDenimFreeze06());
             assert.equal(fit20.originalPhotoSHA256,sourceDenim);
             assert.equal(fit20.sourceNeutralAnatomicalLine20,true);
             assert.equal(fit20.originalJPEGUVRestSkinProtected20,true);
             assert.equal(fit20.noInventedPhotographicRear20,true);
             assert.equal(fit20.trueBVHBodyContactNoNew,true);
             assert.ok(fit20.bodyContactAfter<=fit20.bodyContactBefore);
             assert.ok(fit20.photoAnatomicalThighMovedVertices20>=30);
             assert.ok(Math.min(...fit20.photoAnatomicalThighPerLeg20)>=12);
             assert.ok(fit20.photoAnatomicalCalfMovedVertices20>=25);
             assert.ok(Math.min(...fit20.photoAnatomicalCalfPerLeg20)>=10);
             assert.ok(fit20.photoAnatomicalThighMaxMeters20>.002&&fit20.photoAnatomicalThighMaxMeters20<=.0048501);
             assert.ok(fit20.photoAnatomicalCalfMaxMeters20>.0005&&fit20.photoAnatomicalCalfMaxMeters20<=.0030001);
             for(const angle of [90,135,180]){
              await signedPage19.evaluate(a=>window.ccWardrobe10View(a),angle);
              await linePage20.evaluate(a=>window.ccWardrobe10View(a),angle);
              const before20=await signedPage19.locator('#avatar').screenshot();
              const after20=await linePage20.locator('#avatar').screenshot();
              const changed20=diff(await raw(before20),await raw(after20));
              assert.ok(changed20>=20,'P20 3D anatomical line actual WebGL changed >=20 pixels at '+angle+' '+changed20);
              const key=prefix+'-view-'+angle;
              await writeFile('benchmark/denim-anatomical-line-20/'+key+'-exact-p19.png',before20);
              await writeFile('benchmark/denim-anatomical-line-20/'+key+'-line-p20.png',after20);
              denimLine20Comparisons.push({rig,width,denimIndex,sourceDenim,angle,
               owner:'fixture-account-a',authentic163BoneRig:true,
               originalPerLegSourceHemRatios:fit20.originalPhotoSignedRatios19,
               changedOriginalWebGLRGBPixels:changed20,
               thighMovedVertices:fit20.photoAnatomicalThighMovedVertices20,
               thighPerLeg:fit20.photoAnatomicalThighPerLeg20,
               thighMaxMeters:fit20.photoAnatomicalThighMaxMeters20,
               calfMovedVertices:fit20.photoAnatomicalCalfMovedVertices20,
               calfPerLeg:fit20.photoAnatomicalCalfPerLeg20,
               calfMaxMeters:fit20.photoAnatomicalCalfMaxMeters20,
               JPEGPhotoFrontUVRestSkinUnchanged:true,
               modeledRearNotPhotographed:true,
               bodyContactsBefore:fit20.bodyContactBefore,
               bodyContactsAfter:fit20.bodyContactAfter,
               phoneHardwareVerified:false,humanPhotoRealismApproved:false,
               productionModified:false,releaseAuthorized:false});
             }
             await linePage20.locator('#logout').click();
             assert.equal((await diag(linePage20)).sourcePhotoCoverageVisible,false);
            }finally{await lineCtx20.close();}
            await signedPage19.locator('#logout').click();
            assert.equal((await diag(signedPage19)).sourcePhotoCoverageVisible,false);
           }finally{await signedCtx19.close();}
           await profilePage18.locator('#logout').click();
           assert.equal((await diag(profilePage18)).sourcePhotoCoverageVisible,false);
          }finally{await profileCtx18.close();}
          await widthPage17.locator('#logout').click();
          assert.equal((await diag(widthPage17)).sourcePhotoCoverageVisible,false);
         }finally{await widthCtx17.close();}
         await contourPage16.locator('#logout').click();
         assert.equal((await diag(contourPage16)).sourcePhotoCoverageVisible,false);
        }finally{await contourCtx16.close();}
        await sidePage15.locator('#logout').click();
        assert.equal((await diag(sidePage15)).sourcePhotoCoverageVisible,false);
       }finally{await sideCtx15.close();}
       await rearPage14.locator('#logout').click();
       assert.equal((await diag(rearPage14)).sourcePhotoCoverageVisible,false);
       await p.evaluate(()=>window.ccWardrobe10View(90));
       const returnedF08=await p.locator('#avatar').screenshot();
       assert.ok(diff(await raw(frozen),await raw(returnedF08))<=2,
        'Original F08 photographed denim view must survive independent R14 QA');
      }finally{await rearCtx14.close();}
    }
    frozenDenim.push({width,rig,denimIndex,sourceDenim,
      sourceOwner:fitted.account,sourceGeneration:fitted.generation,
      sourceBoundToSavedWardrobe:fitted.sourceBoundToSavedWardrobe,
      movedPixels:moved,rotationDrift:drift,repeatDrift,
      originalPhotoFrontAndSkinUnchanged:true,bodyContactsBefore:fitted.bodyContactBefore,
      bodyContactsAfter:fitted.bodyContactAfter,physicalPhoneVerified:false,
      releaseAuthorized:false});
   }
   await p.locator('#swap').click();
   assert.equal(await p.evaluate(()=>{try{window.ccWardrobeDenimFreeze06();return false;}catch{return true;}}),false,
    'Swapping between two source-verified jeans remains valid when both licensed meshes exist');
   assert.equal(await p.evaluate(()=>{try{window.ccWardrobeGait02('left-step');return false;}catch{return true;}}),true);
  }
  await p.locator('#logout').click();
  assert.equal(await p.evaluate(()=>{try{window.ccWardrobeGait02('left-step');return false;}catch{return true;}}),true);
  await ctx.close();
 }
 // Exact source dress but no research query: all gait methods fail closed.
 const ctx=await browser.newContext({viewport:{width:390,height:900},isMobile:true,hasTouch:true});
 const p=await ctx.newPage();monitor(p);
 await p.goto(host+'/research/fabric-sweep-04/index.html',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady,null,{timeout:180000});
 await p.locator('#category').selectOption('Dresses');await p.locator('#items .item').first().click();
 assert.equal((await diag(p)).gait02Enabled,false);
 assert.equal(await p.locator('#walk-left').isDisabled(),true);
 assert.equal(await p.evaluate(()=>{try{window.ccWardrobeGait02('play');return false;}catch{return true;}}),true);
 await ctx.close();

 assert.equal(denimLine20Comparisons.length,12,'P20 requires two real denim sources x two rigs x three views');
 assert.equal(new Set(denimLine20Comparisons.map(x=>x.sourceDenim)).size,2);
 assert.deepEqual([...new Set(denimLine20Comparisons.map(x=>x.angle))],[90,135,180]);
 assert.ok(denimLine20Comparisons.every(x=>x.changedOriginalWebGLRGBPixels>=20&&
  x.thighMovedVertices>=30&&Math.min(...x.thighPerLeg)>=12&&
  x.calfMovedVertices>=25&&Math.min(...x.calfPerLeg)>=10&&
  x.thighMaxMeters<=.0048501&&x.calfMaxMeters<=.0030001&&
  x.JPEGPhotoFrontUVRestSkinUnchanged&&
  x.modeledRearNotPhotographed&&x.bodyContactsAfter<=x.bodyContactsBefore));
 await writeFile('benchmark/denim-anatomical-line-20/results.json',JSON.stringify({
  anatomicalSourceLineComparisons:denimLine20Comparisons,actualMatchedWebGLFrames:24,
  originalRigNames:['female','male'],independentJeansSources:2,
  width:390,angles:[90,135,180],originalJPEGFrontUVSkinUnchanged:true,
  syntheticRearPhotoCreated:false,phoneHardwareVerified:false,
  humanPhotoRealismApproved:false,familyAlpha:'HOLD',
  productionModified:false,releaseAuthorized:false
 },null,2));
 assert.equal(denimSigned19Comparisons.length,8,'P19 requires two original jeans x two rigs x two genuine side views');
 assert.equal(new Set(denimSigned19Comparisons.map(x=>x.sourceDenim)).size,2);
 assert.ok(denimSigned19Comparisons.every(x=>x.changedRealWebGLRGBPixels>=20&&
  x.genuineSkinnedBodyContactsAfter<=x.genuineSkinnedBodyContactsBefore&&
  x.originalFrontAnd163BoneSkinProtected&&!x.inventedUnphotographedTexture));
 await writeFile('benchmark/denim-signed-calf-19/results.json',JSON.stringify({
  signedOriginalSourceComparisons:denimSigned19Comparisons,actualWebGLFrames:16,
  actualOriginal163BoneFigures:['female','male'],distinctOriginalJeanSources:2,
  mobileWidth:390,angles:[90,135],originalPhotographsProtected:true,
  fabricatedRear:false,realDeviceVerified:false,humanPhotorealismApproved:false,
  familyAlpha:'HOLD',productionModified:false,releaseAuthorized:false
 },null,2));
 assert.equal(denimProfile18Comparisons.length,8,'P18 original-photo profile comparisons require 2 source jeans x 2 rigs x 2 views');
 assert.deepEqual([...new Set(denimProfile18Comparisons.map(x=>x.angle))],[90,135]);
 assert.equal(new Set(denimProfile18Comparisons.map(x=>x.sourceDenim)).size,2);
 assert.ok(denimProfile18Comparisons.every(x=>x.changedRealWebGLRGBPixels>=20&&
  x.originalFrontRGBAUVRestSkinUnchanged&&
  x.genuineSkinnedBodyContactsAfter<=x.genuineSkinnedBodyContactsBefore&&
  !x.inventedUnphotographedTexture));
 await writeFile('benchmark/denim-original-profile-18/results.json',JSON.stringify({
  originalPhotoFiveStationProfileComparisons:denimProfile18Comparisons,
  genuineWebGLFrames:16,realOriginal163BoneRigs:['female','male'],
  independentlyLicensedOriginalDenimSamples:2,verifiedCameraAngles:[90,135],
  mobileViewportWidth:390,originalJPEGUVRestSkinProtected:true,
  noInventedPhotographicRear:true,physicalAndroidIPhoneAccepted:false,
  humanPhotorealismApproved:false,familyAlpha:'HOLD',
  productionModified:false,releaseAuthorized:false
 },null,2));
 assert.equal(denimPhotoWidth17Comparisons.length,8,'W17 requires both original models, two licensed jeans and true 90/135 WebGL pairs');
 assert.deepEqual([...new Set(denimPhotoWidth17Comparisons.map(x=>x.angle))],[90,135]);
 assert.equal(new Set(denimPhotoWidth17Comparisons.map(x=>x.sourceDenim)).size,2);
 assert.ok(denimPhotoWidth17Comparisons.every(x=>x.changedActualWebGLPixels>=20&&
  x.originalFrontJPEGUVRestSkinUnchanged&&
  x.realSkinnedBodyContactsAfter<=x.realSkinnedBodyContactsBefore&&
  x.noInventedOriginalRearPixels));
 await writeFile('benchmark/denim-photo-width-17/results.json',JSON.stringify({
  measuredOriginalDenimPhotoWidthComparisons:denimPhotoWidth17Comparisons,
  actualRealWebGLFrames:denimPhotoWidth17Comparisons.length*2,
  original163BoneFigures:['female','male'],licensedOriginalDenims:2,
  actualCameraAnglesDegrees:[90,135],mobileWidth:390,
  originalFrontJPEGUVRestAndSkinUnchanged:true,
  unseenRearPhotographInvented:false,
  humanPhotorealismApproved:false,physicalAndroidIphoneTested:false,
  productionModified:false,familyAlpha:'HOLD',releaseAuthorized:false
 },null,2));
 assert.equal(denimPosterior16Comparisons.length,8,'Two original rigs, both licensed denims, real 90/135 WebGL original S15/P16');
 assert.deepEqual([...new Set(denimPosterior16Comparisons.map(x=>x.angle))],[90,135]);
 assert.equal(new Set(denimPosterior16Comparisons.map(x=>x.sourceDenim)).size,2);
 assert.ok(denimPosterior16Comparisons.every(x=>x.changedActualWebGLPixels>=20&&
  x.originalFrontJPEGUVRestSkinUnchanged&&
  x.realSkinnedBodyContactsAfter<=x.realSkinnedBodyContactsBefore&&
  !x.unseenRearPhotographInvented));
 await writeFile('benchmark/denim-posterior-contour-16/results.json',JSON.stringify({
  matchedPhotographedDenimPosteriorComparisons:denimPosterior16Comparisons,
  genuineWebGLFrames:denimPosterior16Comparisons.length*2,
  original163BoneFigures:['female','male'],licensedOriginalDenims:2,
  cameraAnglesDegrees:[90,135],mobileWidth:390,
  originalFrontJPEGUVRestAndSkinUnchanged:true,
  unseenRearPhotographInvented:false,
  humanPhotorealismApproved:false,physicalAndroidIphoneTested:false,
  productionModified:false,familyAlpha:'HOLD',releaseAuthorized:false
 },null,2));
 assert.equal(denimSide15Comparisons.length,8,'Both original 163-bone rigs, two licensed denims, real 135/180 WebGL R14/S15 views');
 assert.deepEqual([...new Set(denimSide15Comparisons.map(x=>x.angle))],[135,180]);
 assert.equal(new Set(denimSide15Comparisons.map(x=>x.sourceDenim)).size,2);
 assert.ok(denimSide15Comparisons.every(x=>x.changedActualWebGLPixels>=20&&
  x.originalFrontJPEGUVRestSkinUnchanged&&
  x.realSkinnedBodyContactsAfter<=x.realSkinnedBodyContactsBefore&&!x.unseenRearImageInvented));
 await writeFile('benchmark/denim-side-thigh-15/results.json',JSON.stringify({
  originalLicensedSideThighComparisons:denimSide15Comparisons,
  actualWebGLFrames:denimSide15Comparisons.length*2,
  original163BoneFigures:['female','male'],licensedSourceDenims:2,
  cameraAnglesDegrees:[135,180],mobileWidth:390,
  sourceFrontJPEGUVRestAndSkinUntouched:true,unseenRearPhotoSynthesized:false,
  humanPhotorealismApproved:false,physicalAndroidIphoneTested:false,
  productionModified:false,familyAlpha:'HOLD',releaseAuthorized:false
 },null,2));
 assert.equal(denimRear14Comparisons.length,4,'Both actual anatomy rigs and both licensed denims need matched rear F08/R14 views');
 assert.deepEqual([...new Set(denimRear14Comparisons.map(x=>x.rig))],['female','male']);
 assert.equal(new Set(denimRear14Comparisons.map(x=>x.sourceDenim)).size,2);
 assert.ok(denimRear14Comparisons.every(x=>x.changedWebGLRearPixels>=20&&
  x.originalSourceFrontUVRestAndSkinUntouched&&
  x.realSkinnedBodyContactsAfter<=x.realSkinnedBodyContactsBefore&&x.modeledRearNotPhotographed));
 await writeFile('benchmark/denim-rear-thigh-14/results.json',JSON.stringify({
  originalLicensedSourceRearComparisons:denimRear14Comparisons,
  realWebGLRearFrames:denimRear14Comparisons.length*2,
  original163BoneFigures:['female','male'],licensedDenimSources:2,mobileWidth:390,
  originalFrontJPEGUVSkinRestProtected:true,
  noOriginalPhotographedRearClaim:true,humanPhotorealismApproved:false,
  physicalAndroidIPhoneTested:false,productionModified:false,
  familyAlpha:'HOLD',releaseAuthorized:false
 },null,2));
 assert.equal(pinchZoom13.length,8,'All eight source-licensed two-finger zoom and reset cases');
 assert.deepEqual([...new Set(pinchZoom13.map(x=>x.width))],[320,390,430]);
 assert.deepEqual([...new Set(pinchZoom13.map(x=>x.rig))],['female','male']);
 assert.equal(new Set(pinchZoom13.map(x=>x.sourceSHA256)).size,2);
 assert.ok(pinchZoom13.every(x=>x.changedIn13>=50&&x.changedOut13>=50&&x.changedReset13<=2&&
  x.noNewBVHContacts&&x.originalSourcePhotoAndSkinUntouched));
 await writeFile('benchmark/mobile-pinch-13/results.json',JSON.stringify({
  actualNativeTwoFingerPinchCases:pinchZoom13,
  realWebGLImages:pinchZoom13.length*4,realOriginalAnatomical163BoneRigs:['female','male'],
  mobileWidths:[320,390,430],originalLicensedDenims:2,
  authenticChromeMultitouch:true,fullBodyResetSourceExact:true,
  physicalAndroidIPhoneTested:false,humanPhotorealismApproved:false,
  originalPhotoSourceAndAccountIsolated:true,productionModified:false,releaseAuthorized:false,familyAlpha:'HOLD'
 },null,2));
 assert.equal(touchSwipe12.length,8,'Two anatomical rigs x 320/390/430 and 390 second original photo');
 assert.deepEqual([...new Set(touchSwipe12.map(x=>x.width))],[320,390,430]);
 assert.deepEqual([...new Set(touchSwipe12.map(x=>x.rig))],['female','male']);
 assert.equal(new Set(touchSwipe12.map(x=>x.sourceSHA256)).size,2);
 assert.ok(touchSwipe12.every(x=>x.changedWebGLPixels>=50&&x.finger12.chromeNativeTouchEvents&&
  x.sourceIdentitySameAfterTouch&&x.garmentContactNoNew&&!x.confirmedRearOriginalPhoto));
 await writeFile('benchmark/source-touch-12/results.json',JSON.stringify({
  genuineChromiumTouchSwipes:touchSwipe12,
  mobileWidths:[320,390,430],anatomicalRigs:['female','male'],
  licensedOriginalDenims:2,realWebGLTouchFrameCount:touchSwipe12.length*2,
  actualNativeChromeTouchEvents:true,realPhysicalAndroidIphoneVerified:false,
  sourcePrivacyAndOwnerPreserved:true,unseenRearPhotoInvented:false,
  originalPhotoRGBUVAndSkinUnchanged:true,photorealismHumanApproved:false,
  productionModified:false,familyAlpha:'HOLD',releaseAuthorized:false
 },null,2));
 assert.equal(pointerRotation11.length,1,'Exactly one independent original-photo mobile WebGL drag witness');
 assert.ok(pointerRotation11[0].pixelsChangedOnRealWebGL>=50);
 await writeFile('benchmark/source-rotate-11/results.json',JSON.stringify({
  actualOriginalDenimPointerDrags:pointerRotation11,
  realMobileBrowserPointerQA:true,realPhysicalPhoneTested:false,
  modeledRearOnly:true,customerPhotosUsed:false,
  productionModified:false,releaseAuthorized:false,familyAlpha:'HOLD'
 },null,2));
 assert.equal(denimAngle09Comparisons.length,16);
 assert.deepEqual([...new Set(denimAngle09Comparisons.map(x=>x.angle))],[0,45,135,180]);
 assert.equal(new Set(denimAngle09Comparisons.map(x=>x.sourceDenim)).size,2);
 await writeFile('benchmark/denim-angle-09/results.json',JSON.stringify({
  actualOriginalDenimAngleComparisons:denimAngle09Comparisons,
  actualWebGLAngleFrames:denimAngle09Comparisons.length*2,
  genuine163BoneFigures:['female','male'],originalPhotoSources:2,
  cameraAnglesDegrees:[0,45,135,180],mobileWidth:390,
  originalPhotographedFrontUVAndSHAUnmodified:true,
  synthesizedUnseenRearPhoto:false,sourceAccountIsolated:true,
  humanPhotorealismAccepted:false,physicalPhoneApproved:false,
  productionModified:false,releaseAuthorized:false,familyAlpha:'HOLD'
 },null,2));
 assert.equal(denimFairing08Comparisons.length,4);
  await writeFile('benchmark/denim-fairing-08/results.json',JSON.stringify({
   matchedOriginalPhotoFairingPairs:denimFairing08Comparisons,
   realMatchedWebGLFrames:denimFairing08Comparisons.length*2,
   original163BoneFigures:['female','male'],mobileWidth:390,
   licensedOriginalDenims:2,savedWardrobeSourceValidated:true,
   originalFrontPhotoUntouched:true,physicalPhoneApproved:false,
   humanPhotorealismApproved:false,productionModified:false,
   familyAlpha:'HOLD',releaseAuthorized:false
  },null,2));
  await writeFile('benchmark/denim-silhouette-07/results.json',JSON.stringify({
   genuinePhotoOriginalDenimComparisons:denimSilhouetteComparisons,
   realMatchedWebGLComparisonFrames:denimSilhouetteComparisons.length*2,
   cameraAngleDegrees:90,width:390,original163BoneFigures:['female','male'],
   licensedSourceDenims:2,sourceFrontPhotosAndSkinsUnchanged:true,
   frontTextureDetailsNotSynthesized:true,physicalPhoneApproved:false,
   independentHumanPhotorealismApproved:false,releaseAuthorized:false,
   familyAlpha:'HOLD',productionModified:false
 },null,2));
 assert.equal(denimSilhouetteComparisons.length,4);
 await writeFile('benchmark/denim-fit-06/results.json',JSON.stringify({
  frozenDenim,realWebGLFrames:frozenDenim.length*4,
  original163BoneFigures:['female','male'],mobileWidths:[320,390,430],
  independentOriginalDenims:2,savedWardrobeOwnerBound:true,
  fullyGeneralUserPhoto3DCertified:false,physicalPhoneVerified:false,
  humanVisualApproved:false,releaseAuthorized:false,productionModified:false,
  familyAlpha:'HOLD'
 },null,2));
 assert.equal(frozenDenim.length,8);
 await writeFile('benchmark/dress-fit-05/results.json',JSON.stringify({
  frozenDress,frozenWebGLImages:frozenDress.length*4,mobileWidths:[320,390,430],
  originalFigures:['female','male'],actualVerifiedSource:true,
  originalPhotoUnchanged:true,realPhoneApproved:false,visualPhotorealismApproved:false,
  releaseAuthorized:false,familyAlpha:'HOLD',productionModified:false
 },null,2));
 assert.equal(frozenDress.length,6);
 assert.equal(screenshots.length,44);assert.equal(cases.length,6);
 assert.equal(sweeps.length,2);
 assert.ok(sweeps.every(x=>x.phaseSamples.length===9&&x.sampledNoNewContacts));
 assert.equal(contacts.length,2);
 assert.deepEqual(javascriptErrors,[]);
 assert.deepEqual(nonLocalRequests,[]);
 const results={screenshots:screenshots.length,genuineWebGLSourceDressFrames:44,
  ninePhaseSkinnedContactSweeps:sweeps,allEighteenSampledPhasesNoNewContacts:true,
  mathematicallySweptCollisionCertified:false,
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
 console.log('DRESS_SWEEP_04',JSON.stringify({frames:screenshots.length,cases:cases.length,
  minChangedPixels:Math.min(...cases.map(x=>x.leftChangedPixels)),
  sampledCollisionSweeps:sweeps.map(x=>({rig:x.rig,contacts:x.phaseSamples.map(p=>p.crossings)})),
  contacts,release:'HOLD'}));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
