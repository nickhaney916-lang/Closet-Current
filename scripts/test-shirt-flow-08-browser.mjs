/** Original verified photographed 163-bone shirt, real sleeve pose response.
 * Actual browser WebGL 320/390/430 × female/male × five source arm poses,
 * source/rest exact reset, matched identical pose A/B with and without
 * independently pose-conditioned sleeve geometry on 390px.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),folder='benchmark/shirt-flow-08',captures=[],scenarios=[],ab=[],errors=[],outside=[],failedResponses=[],consoleErrors=[],requestFailures=[];
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(p)||
   p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))
   throw Error('Unapproved source path');
  const path=resolve(root,'.'+p);
  if(!path.startsWith(root+'/'))throw Error('Unapproved local source');
  const bytes=await readFile(path);
  const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.json':'application/json',
   '.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary'};
  res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Research fixture missing');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
function monitor(page){
 page.on('pageerror',e=>errors.push(String(e.message)));
 page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)failedResponses.push({status:r.status(),url:r.url()});});
 page.on('requestfailed',r=>requestFailures.push({url:r.url(),error:r.failure()?.errorText}));
 page.on('request',r=>{const u=r.url();if(!u.startsWith(host)&&!u.startsWith('data:')&&!u.startsWith('blob:'+host))outside.push(u);});
}
const baseParams='construction=after&sleeve44=after&caps45=after&contour46=after&volume47=after&collar48=after&rear53=after&round54=after&hang55=after&sweep=after&crisp58=after';
const state=p=>p.evaluate(()=>window.cc31Diagnostics());
async function openOriginal(page,kind,enabled=true,gravityRest=enabled){
 await page.goto(host+'/research/shirt-flow-08/index.html?'+baseParams+
  '&move56=after&shirtFlow=after&smoothFlow=after&fabricFlow=after&torsoFlow=after&timeFlow=after&lightFlow=after&foldFlow=after&settleFit=after&gravityRest='+(gravityRest?'after':'before')+'&hemFlow='+(enabled?'after':'before'),
  {waitUntil:'domcontentloaded'});
 try{await page.waitForFunction(()=>window.cc31Diagnostics?.()?.loaded===true,null,{timeout:45000});}
 catch(e){throw Error('Original source showroom not ready: '+JSON.stringify({
  status:await page.locator('#status').textContent().catch(()=>'?'),
  loaded:await page.evaluate(()=>window.cc31Diagnostics?.()?.loaded??null).catch(()=>null),
  errors:errors.slice(-5),outside:outside.slice(-5),
  failedResponses:failedResponses.slice(-15),consoleErrors:consoleErrors.slice(-10),requestFailures:requestFailures.slice(-8),
  html:await page.evaluate(()=>({ready:document.readyState,script:document.querySelector('script[type=module][src]')?.src,hasCanvas:!!document.querySelector('#avatar')}))}));}
 if(kind==='male'){
  await page.locator('#model').selectOption('male');
  await page.waitForFunction(()=>window.cc31Diagnostics?.()?.loaded&&window.cc31Diagnostics().kind==='male',null,{timeout:180000});
 }
 const pre=await state(page);assert.equal(pre.stats.bones,163);
 assert.equal(pre.outfit.mode,'pants');
 assert.equal(pre.outfit.shirt,null);
 await page.locator('#review').check();
 await page.locator('#full').click();
 try{await page.waitForFunction(()=>window.cc31Diagnostics?.()?.outfit?.mode==='shirt-pants',null,{timeout:30000});}
 catch(e){throw Error('Original photographed 3D torso fit failed before QA: '+JSON.stringify({
  status:await page.locator('#status').textContent().catch(()=>'?'),
  state:await page.evaluate(()=>window.cc31Diagnostics?.()?.outfit??null).catch(()=>null),
  errors:errors.slice(-10),consoleErrors:consoleErrors.slice(-10),failedResponses:failedResponses.slice(-10),outside:outside.slice(-5)
 }));}
 const outfit=await state(page);
 assert.equal(outfit.outfit.mode,'shirt-pants');
 assert.equal(outfit.outfit.shirt.skinBones,163);
 assert.match(outfit.outfit.shirt.sourceSHA256,/^[a-f0-9]{64}$/);
 assert.equal(outfit.outfit.pants.photoApplied,true);
 assert.equal(outfit.outfit.shirt.sourceMeasuredNaturalSleeveHang,true);
 assert.equal(Boolean(outfit.outfit.shirt.poseConditionedSleeveDrape),true);
 assert.equal(Boolean(outfit.outfit.shirt.gravitationalFabricResponse),true);
 assert.equal(Boolean(outfit.outfit.shirt.sourceTorsoDrape04),true);
 assert.equal(Boolean(outfit.outfit.shirt.temporalPhotoDrape05),true);
 assert.equal(Boolean(outfit.outfit.shirt.sourceClothLight06?.enabled),true);
 assert.equal(Boolean(outfit.outfit.shirt.sourceWeightedFolds07),true);
 assert.equal(Boolean(outfit.outfit.shirt.sourceHemSwing08),enabled);
 if(enabled){
  const folds=outfit.outfit.shirt.sourceWeightedFolds07;
  const hem=outfit.outfit.shirt.sourceHemSwing08;
  assert.equal(hem.realOriginalSourcePhotographedHemSwing,true);
  assert.equal(hem.originalSourcePhotoUVAndSkinPreserved,true);
  assert.equal(hem.actualAnatomicalBoneCount,163);
  assert.equal(hem.generatedNewTextures,0);
  assert.ok(hem.outerSilhouette>=24&&hem.hemVertices>=32);
  assert.ok(hem.maxMeters>=.014&&hem.maxMeters<=.03701);
  assert.equal(folds.realPhotographedSourceTriangleFolds,true);
  assert.equal(folds.originalSourcePanelUVAndSkinPreserved,true);
  assert.equal(folds.actualAnatomicalBoneCount,163);
  assert.equal(folds.generatedNewImagesOrTextures,0);
  assert.ok(folds.shiftedPhotographedVertices>=45);
  assert.ok(folds.foldMagnitudeMaxMeters>=.0035&&folds.foldMagnitudeMaxMeters<=.02051);
  const result=outfit.outfit.shirt.sourceClothLight06;
  assert.ok(result.materialCount>0);
  assert.equal(result.originalPhotoAndSkinUnmodified,true);
  assert.equal(result.newTexturesOrFabricPatterns,0);
  for(const m of result.provenance){
   assert.equal(m.originalShaderUnchanged,true);
   assert.equal(m.originalRGBAndColorUnchanged,true);
   assert.equal(m.originalMetalnessUnchanged,true);
   assert.equal(m.sourceProjectedPhotoSamplerRetained,true);
   assert.ok(m.reviewRoughness>=.78&&m.reviewRoughness<=.82);
   assert.ok(m.originalRoughness>m.reviewRoughness);
  }
 }
 return outfit;
}
async function snap(page,id,rig,width,pose,mode){
 await page.waitForFunction(()=>Number(document.querySelector('#avatar')?.dataset?.frames||0)>=1,
  null,{timeout:20000}).catch(()=>{});
 const canvas=page.locator('#avatar');
 const png=await canvas.screenshot();
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(await page.evaluate(()=>document.querySelector('#avatar').getContext('webgl2')!==null),true);
 assert.equal((await state(page)).stats.bones,163);
 const filename=id+'.png';await writeFile(folder+'/'+filename,png);
 captures.push({filename,rig,width,pose,mode,realWebGL:true});
 return sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});
}
function difference(a,b){
 assert.equal(a.info.width,b.info.width);assert.equal(a.info.height,b.info.height);
 let pixels=0;for(let i=0;i<a.data.length;i+=3)
  if(Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2])>24)pixels++;
 return pixels;
}
let browser;const settling=[],frozenFits=[],gravityComparisons=[];
try{
 await mkdir(folder,{recursive:true});
 await mkdir('benchmark/shirt-fit-09',{recursive:true});
 await mkdir('benchmark/shirt-fit-10',{recursive:true});
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 for(const width of [320,390,430])for(const rig of ['female','male']){
  const context=await browser.newContext({viewport:{width,height:932},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  const page=await context.newPage();monitor(page);
  const outfit=await openOriginal(page,rig,true);
  const sha=outfit.outfit.shirt.sourceSHA256;
  await page.locator('#side').click();
  const tag=width+'-'+rig;
  const source=await snap(page,tag+'-initial',rig,width,'source','actual');
  let previous=null,first=null,prior=null;
  for(let i=0;i<17;i++){
   const phase=i/16;
   const result=await page.evaluate(p=>window.ccShirtFlow08(p),phase);
   assert.equal(result.originalBodyBones,163);
   assert.equal(result.sampledPoseCount,17);
   assert.equal(result.gravityResponse.originalRGBUVAndSkinUnmodified,true);
   assert.equal(result.gravityResponse.gravityResponsive,true);
    assert.equal(result.sourceTorsoDrape04.originalSourcePhotoAndUVPreserved,true);
    assert.equal(result.sourceTorsoDrape04.originalSkinWeightsPreserved,true);
    assert.equal(result.sourceTorsoDrape04.realPoseResponse,true);
    assert.equal(result.temporalPhotoDrape05.photoAndSkinPreserved,true);
    assert.equal(result.temporalPhotoDrape05.releaseAuthorized,false);
    assert.equal(result.temporalPhotoDrape05.originalBoneCount===163||result.temporalPhotoDrape05.reset,true);
    if(i>0)assert.ok(result.temporalPhotoDrape05.shifted>=20,'Photographed real shirt must respond to momentum on moving phase '+rig+'/'+i);
    assert.ok(result.sourceTorsoDrape04.shiftedPhotographedVertices>=40);
    assert.ok(result.sourceTorsoDrape04.maxMeters>=.003&&result.sourceTorsoDrape04.maxMeters<=.02001);
    for(const side of ['L','R']){
     assert.ok(result.sourceTorsoDrape04.sides[side].yoke>=5);
     assert.ok(result.sourceTorsoDrape04.sides[side].chest>=8);
    }
   assert.ok(result.gravityResponse.changedVertices>=40);
   assert.ok(result.gravityResponse.maxMeters>.0015&&result.gravityResponse.maxMeters<=.0091);
   for(const side of ['L','R'])assert.ok(result.gravityResponse.sides[side].forearm>=8);
   assert.equal(result.photographicSourceSHA256,sha);
   assert.equal(result.trueSkinnedGarmentContactCount,0);
   assert.ok(result.maxFabricShiftMeters>.002&&result.maxFabricShiftMeters<=.01501);
   for(const side of ['L','R']){
    assert.ok(result.bothArmFabricSides[side].elbow>=8);
    assert.ok(result.bothArmFabricSides[side].forearm>=8);
   }
   const image=await snap(page,tag+'-phase-'+i,rig,width,result.pose,'actual');
   if(!first)first=image;
   if(previous){const pixels=difference(previous,image);
    assert.ok(pixels>=10,'Authentic shoulder/elbow must visibly change consecutive positions '+rig+'/'+phase+': '+pixels);
    prior=pixels;}
   previous=image;
  }
  const restored=await page.evaluate(()=>window.ccShirtFlow08(0));
  assert.equal(restored.pose,0);
  const reset=await snap(page,tag+'-restored',rig,width,'source','reset');
  const resetDiff=difference(first,reset);
  assert.equal(resetDiff,0,'Original source skin and sleeve pose must return with zero RGB drift');
  // Verify actual source reviewed portrait was untouched across poses.
  const after=await state(page);
  assert.equal(after.outfit.shirt.sourceSHA256,sha);
  assert.equal(after.outfit.shirt.poseTriangleContact.after.count,0);
  const beforePlay=await state(page);
  const play=await page.evaluate(()=>window.ccShirtFlowPlay02());
  assert.equal(play.sampledPoseCount,17);
  await page.waitForTimeout(1200);
  const playing=await state(page);
  assert.ok(Number.isFinite(playing.pose)&&playing.pose>=0&&playing.pose<=1,'Real anatomical phase must remain bounded');
  assert.ok(playing.poseChanges>beforePlay.poseChanges,'Real timed sampled arm pose movement required');
  assert.equal((await page.evaluate(()=>window.ccShirtFlowStop01())).stopped,true);
  await page.evaluate(()=>window.ccShirtFlow08(0));
  scenarios.push({width,rig,sourceSHA256:sha,poseCount:17,changedPixelsLastStep:prior,
   resetDifferentPixels:resetDiff,firstAndRestoredPixelIdentical:true,
   original163BoneAnatomicalRig:true,sourcePhotoPreserved:true,
   genuineSkinnedSleeveContactZero:true});
  if(width===390){
   const bctx=await browser.newContext({viewport:{width,height:932},deviceScaleFactor:1,hasTouch:true,isMobile:true});
   const baseline=await bctx.newPage();monitor(baseline);
   const b=await openOriginal(baseline,rig,false);
   assert.equal(b.outfit.shirt.sourceSHA256,sha);
   await baseline.locator('#side').click();
   for(const i of [1,2,3]){
    const stage=['source','blend-25','blend-50','blend-75','relaxed'][i];
    await baseline.evaluate(()=>window.ccShirtFlow07(0));
    await page.evaluate(()=>window.ccShirtFlow08(0));
    await baseline.evaluate(p=>window.ccShirtFlow07(p),i/4);
    const render=await snap(baseline,tag+'-before-pose-'+i,rig,width,stage,'baseline');
    await page.evaluate(p=>window.ccShirtFlow08(p),i/4);
    const revised=await snap(page,tag+'-after-pose-'+i,rig,width,stage,'after');
    const differencePixels=difference(render,revised);
    assert.ok(differencePixels>=260,'Original photographed loose shirt hem must visibly change actual same-pose 3D silhouette '+stage+' '+rig+': '+differencePixels);
    ab.push({rig,width,stage,sourceHemSilhouetteOnlyChangedPixels:differencePixels});
    const temporal=await page.evaluate(p=>window.ccShirtFlow08(p),i/4);
    assert.equal(temporal.temporalPhotoDrape05.poseDelta,0);
    assert.equal(temporal.trueSkinnedGarmentContactCount,0);
    const settled=await snap(page,tag+'-settle-pose-'+i,rig,width,stage,'settle');
    const changedDuringStillPose=difference(revised,settled);
    assert.ok(changedDuringStillPose>=2,'True photographed cloth must settle after skeleton stops, '+rig+'/'+stage+': '+changedDuringStillPose);
    settling.push({rig,width,stage,changedPixelsSameBonePose:changedDuringStillPose,temporal:temporal.temporalPhotoDrape05});
   }
   await bctx.close();
   await page.evaluate(()=>window.ccShirtFlow08(0));
  }
  // F09: the physics is an internal fit tool, NOT an animation for users.
  // Capture genuine photographed garment before and after fixed-step settling,
  // then prove identical same-pose render after another call and rotation.
  await page.evaluate(()=>window.ccShirtFlow08(0));
  await page.evaluate(()=>window.ccShirtFlow08(.5));
  await page.locator('#side').click();
  const beforeFreeze=await page.locator('#avatar').screenshot();
  const proof=await page.evaluate(()=>window.ccShirtFitFreeze09(.5));
  assert.equal(proof.frozenSourcePhotographed3DMesh,true);
  assert.equal(proof.bodyTriangleContactVerifiedEachStep,true);
  assert.equal(proof.sourcePhotoUVAndSkinPreserved,true);
  assert.equal(proof.sourceSHA256,sha);
  assert.equal(proof.actualSkinnedBodyContactCount,0);
  assert.ok(proof.steps>=5&&proof.steps<=96);
  assert.equal(proof.staticNonzeroClothEquilibrium,true);
  assert.equal(proof.sourceGravityRestFit10?.actualPhotographedSource3DEquilibrium,true);
  assert.equal(proof.sourceGravityRestFit10?.bodyCollisionVerifiedByCaller,true);
  assert.equal(proof.sourceGravityRestFit10?.originalPhotoAttributesUnchanged,true);
  assert.equal(proof.sourceGravityRestFit10?.originalPhotoPixelsUnchanged,true);
  assert.ok(proof.sourceGravityRestFit10?.worldEquilibriumMeters>.007);
  assert.ok(proof.sourceGravityRestFit10?.verticesMoved>=120);
  const fit=await page.locator('#avatar').screenshot();
  const metrics=(buf)=>sharp(buf).removeAlpha().raw().toBuffer({resolveWithObject:true});
  await page.evaluate(()=>window.ccShirtFlow08(.5));
  const same=await page.locator('#avatar').screenshot();
  const samePixels=difference(await metrics(fit),await metrics(same));
  assert.equal(samePixels,0,'Frozen original photo 3D pose must not move after repeated fit');
  await page.locator('#back').click();
  await page.locator('#side').click();
  const rotation=await page.locator('#avatar').screenshot();
  const rotatedPixels=difference(await metrics(fit),await metrics(rotation));
  assert.ok(rotatedPixels<=2,'Frozen garment must survive 360 view navigation without material drift: '+rotatedPixels);
  const saved=['before','frozen','same-pose','rotated-back'].map((phase,i)=>({
    path:'benchmark/shirt-fit-09/'+tag+'-'+phase+'.png',
    bytes:[beforeFreeze,fit,same,rotation][i]
  }));
  for(const entry of saved)await writeFile(entry.path,entry.bytes);
  if(width===390){
   // Isolate exactly the new physical *nonzero* resting shape at same rig,
   // original photo, pose, lighting and camera; F09 remains a verified control.
   const f09Context=await browser.newContext({viewport:{width,height:932},deviceScaleFactor:1,hasTouch:true,isMobile:true});
   const f09Page=await f09Context.newPage();monitor(f09Page);
   await openOriginal(f09Page,rig,true,false);
   await f09Page.locator('#side').click();
   const f09Proof=await f09Page.evaluate(()=>window.ccShirtFitFreeze09(.5));
   assert.equal(f09Proof.frozenSourcePhotographed3DMesh,true);
   assert.equal(f09Proof.staticNonzeroClothEquilibrium,undefined);
   assert.equal(f09Proof.sourceSHA256,sha);
   const f09Image=await f09Page.locator('#avatar').screenshot();
   const changedFromF09=difference(await metrics(f09Image),await metrics(fit));
   assert.ok(changedFromF09>=10,'Nonzero resting gravity geometry must visibly alter SAME original photographed fitted shirt '+rig+': '+changedFromF09);
   for(const [name,img] of [['control-f09',f09Image],['gravity-f10',fit]])
    await writeFile('benchmark/shirt-fit-10/'+tag+'-'+name+'.png',img);
   gravityComparisons.push({width,rig,sourceSHA256:sha,actualChangedPixels:changedFromF09,
    originalSourcePreserved:true,zeroBodyContact:true,physicalPhoneVerified:false,releaseAuthorized:false});
   await f09Context.close();
  }
  frozenFits.push({width,rig,pose:.5,sourceSHA256:sha,steps:proof.steps,
   samePoseChangedPixels:samePixels,rotationReturnChangedPixels:rotatedPixels,
   actualBodyTriangleContacts:proof.actualSkinnedBodyContactCount,
   originalPhotoAndSkinPreserved:proof.sourcePhotoUVAndSkinPreserved,
   physicalPhoneVerified:false,releaseAuthorized:false});
  await page.locator('#neutral').click();
  assert.equal((await state(page)).outfit.shirt,null);
  assert.equal(await page.evaluate(()=>{try{window.ccShirtFlow08(.5);return false;}catch{return true;}}),true);
  await context.close();
 }
 assert.equal(gravityComparisons.length,2);
 await writeFile('benchmark/shirt-fit-10/results.json',JSON.stringify({
  matchedActualSourceF09vsF10:gravityComparisons,
  realWebGLComparisonImages:4,nonzeroPhysicalRestFit:true,
  fullClothPhysicsCertified:false,realPhysicalPhoneApproved:false,
  humanVisualAccepted:false,releaseAuthorized:false
 },null,2));
 await writeFile('benchmark/shirt-fit-09/results.json',JSON.stringify({
  scenarios:frozenFits,realWebGLFrames:frozenFits.length*4,widths:[320,390,430],
  rigs:['female','male'],sourcePhotoAndRigPreserved:true,
  staticAfterFitting:true,fullClothPhysicsCertified:false,
  physicalPhoneVerified:false,visualPhotorealismApproved:false,releaseAuthorized:false
 },null,2));
 assert.equal(frozenFits.length,6);
 assert.equal(scenarios.length,6);
 assert.equal(ab.length,6);
 assert.equal(captures.length,132);
 assert.equal(settling.length,6);
 assert.deepEqual(errors,[]);
 assert.deepEqual(outside,[]);
 const results={screenshots:captures.length,actualGenuineWebGLPhotographedShirtFrames:132,
   sourceTrueTemporalSettlingFrames:6,sameBonePoseClothStillSettles:settling,
  gravityResponsivePhotographedSleeveGeometry:true,
   sourceTrueShoulderTorsoPhotoGeometry:true,realPhotographedTemporalDrape:true,
   realPhotographedPhysicalSurfaceLightResponse:true,originalSourceTextureBytesUnmodified:true,
   realAnatomicalPhotoClothFoldGeometry:true,sourceOriginalPhotoPanelAndSkinUnchanged:true,
   realSourcePhotographedHemSwingGeometry:true,
  rigKinds:['female','male'],widths:[320,390,430],
  trueSourceReviewedAndHashBound:true,sourceOriginalPhotosUntouched:true,
  sameBonePoseRealHemMotionOnlyAB:ab,scenarios,captures,
  realArmPoseCountPerFigure:17,realFullBodySkinned:true,
  exactSourcePoseResetCount:6,zeroPhotoSourceOutboundNetwork:true,
  noArbitraryPrivatePhotoUsed:true,entireArmPhysicsCertified:false,
  continuousCollisionBetweenKeyframesCertified:false,
  actualPhysicalPhoneTested:false,visualPhotorealismApproved:false,
  familyAlpha:'HOLD',releaseAuthorized:false,productionChanged:false};
 await writeFile(folder+'/results.json',JSON.stringify(results,null,2));
 console.log('SHIRT_FLOW_08',JSON.stringify({screenshots:captures.length,
  rigs:6,matchedSourceFabricComparisons:ab.length,
  minRealSourceHemOnlyPixels:Math.min(...ab.map(x=>x.sourceHemSilhouetteOnlyChangedPixels)),
  exactResets:6,hold:true}));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
