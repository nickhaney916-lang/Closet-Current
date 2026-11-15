/** P89 genuine locked public shirt + jeans source 163-bone actual WebGL.
 * Headless Chromium/WebKit, P541 + P84 immutable disposable donor ONLY.
 * Unsigned 3D closest-source-surfaces for original mesh poses, NOT fit approval.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {compareOriginalSourceShoulderGapAB89} from '../research/parallel89/source-gap-contrast89.mjs';
import {compareOriginalSourceQuarterStepAB89} from '../research/parallel89/source-quarter-compare89.mjs';
const donor=resolve(process.argv[2]||'.');
const engine=process.env.P89_BROWSER||'chromium';
assert.ok(process.argv[2]&&donor!==resolve('.')&&
 ['chromium','webkit'].includes(engine),'genuine detached original donor browser engine required');
const SHA={
 shirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
 denim:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c'
};
const hash=x=>createHash('sha256').update(x).digest('hex');
for(const [p,expected] of [
 ['benchmark/work47/assets/commons-0003.jpg',SHA.shirt],
 ['benchmark/three-d-31/original-jeans.jpg',SHA.denim]
])assert.equal(hash(await readFile(join(donor,p))),expected,'immutable legal original JPEG source failed');
const out='benchmark/parallel89-source-static-gap/'+engine;
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript',
 '.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg',
 '.wasm':'application/wasm','.json':'application/json','.css':'text/css'};
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(three|three-mesh-bvh)\/)/.test(p)||
   p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))
   throw Error('invalid-original-public-research-path');
  const file=resolve(donor,'.'+p);
  if(!file.startsWith(donor+'/'))throw Error('outside-original-source');
  const bytes=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('unavailable');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
const receipts=[],shoulderContrasts=[],quarterContrasts=[],researchSelections=[],errors=[],offsite=[];
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true,...(
  engine==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader',
   '--enable-unsafe-swiftshader','--enable-webgl']}: {})});
 const ctx=await browser.newContext({viewport:{width:390,height:900},deviceScaleFactor:1,
  hasTouch:true,isMobile:true,serviceWorkers:'block'});
 for(const avatar of ['female','male']){
  const byVariant={};
  for(const variant of ['baseline','trial','low-drop','low-drop-outward']){
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(String(e.message).slice(0,180)));
  page.on('crash',()=>errors.push('original-webgl-browser-crashed'));
  await page.route('**/*',route=>{
   const u=route.request().url();
   if(u.startsWith(origin)||u.startsWith('data:')||u.startsWith('blob:'+origin))
    return route.continue();
   offsite.push('unauthorized-network-request');return route.abort();
  });
  await page.goto(origin+'/research/dress-mobile-01/index.html?parallel84Poses=audit&parallel84Denim=gated&parallel89Gap=audit&parallel84Shape='+(variant==='baseline'?'baseline':'trial')+'&parallel89ShapeVariant='+variant,
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.ccDress12Diagnostics?.()?.phase==='ready',
   null,{timeout:180000});
  if(avatar==='male'){
   await page.locator('#model').selectOption('male');
   await page.waitForFunction(()=>window.ccDress12Diagnostics?.()?.phase==='ready',
    null,{timeout:180000});
  }
  await page.locator('#review').check();
  // P89 runs the actual five-pose 163-bone BVH contact veto synchronously
  // inside the existing research button's click handler. In native WebKit
  // Playwright's locator.click() can hang waiting for that long handler,
  // producing a false test timeout while the original source rig is busy.
  // Schedule the actual original DOM button activation as a macrotask,
  // then explicitly wait for the FULL source-outfit + safety-gate receipt.
  // No fake shortcut, bypassed validation or simulated completed outfit.
  await page.evaluate(()=>{
   const button=document.querySelector('#two');
   if(!button||button.disabled)throw Error('real-original-shirt-jeans-action-unavailable');
   setTimeout(()=>button.click(),0);
   return true;
  });
  await page.waitForFunction(()=>{
   const diag=window.ccDress12Diagnostics?.();
   return diag?.outfitMode==='shirt-pants'&&diag?.bones===163&&
    window.__parallel84ShapeResult?.schema==='parallel84-source-bone-shoulder-yoke/v1'&&
    typeof window.__parallel89GapAudit==='function'&&
    typeof window.__parallel89QuarterGapAudit==='function'&&
    typeof window.__parallel89RealShirtGeometryDigest==='function';
  },null,{timeout:240000,polling:250});
  const sources=await page.evaluate(()=>window.ccDress12Diagnostics());
  assert.equal(sources.figure,avatar);
  assert.equal(sources.bones,163);
  assert.equal(sources.outfitMode,'shirt-pants');
  assert.equal(sources.shirt.sourceSHA256,SHA.shirt);
  assert.equal(sources.pants.sourceSHA256,SHA.denim);
  assert.equal(sources.releaseAuthorized,false);
  const report=await page.evaluate(()=>{
   if(typeof window.__parallel89GapAudit!=='function')throw Error('disposable P89 original-source distance hook missing');
   return window.__parallel89GapAudit();
  });
  assert.equal(report.status,'THREE_ACTUAL_SOURCE_POSE_UNSIGNED_GAPS_MEASURED_NOT_CLEARANCE',
   'source/mesh gap failed: '+report.reason);
  assert.equal(report.avatar,avatar);
  assert.equal(report.actualAnatomical163Bones,true);
  assert.equal(report.originalShirtSHA256,SHA.shirt);
  assert.equal(report.originalDenimSHA256,SHA.denim);
  assert.equal(report.originalSourcePoses,3);
  assert.equal(report.sourcePoseMeasurements.length,3);
  assert.equal(report.sourcePhoto2DFallbackRequired,true);
  assert.equal(report.independentSignedDistanceOrBodyContainmentVerified,false);
  assert.equal(report.dynamicSweptClothContactVerified,false);
  assert.equal(report.consumer3DAuthorized,false);
  assert.equal(report.releaseAuthorized,false);
  assert.equal(report.familyAlpha,'HOLD');
  for(const [i,row] of report.sourcePoseMeasurements.entries()){
   assert.equal(row.pose,['source','blend-50','relaxed'][i]);
   assert.equal(row.absenceOfTriangleCrossingsCannotCertifyPhysicalSeparation,true);
   assert.equal(row.nearSurfaceThresholdMeters,.002);
   const distances=row.distances;
   assert.deepEqual(Object.keys(distances),['shirtBody','denimBody','shirtDenim']);
   for(const val of Object.values(distances)){
    assert.ok(val.unsignedMinimumSurfaceDistanceMeters>=0&&
     val.unsignedMinimumSurfaceDistanceMeters<2);
    assert.equal(val.distanceMeasuredOnAllSourceTriangles,true);
    assert.equal(val.signedExteriorClearanceMeasured,false);
    assert.equal(val.bodyContainmentMeasured,false);
    assert.equal(val.continuousMovementMeasured,false);
   }
   assert.equal(row.someSourceSurfacesWithin2mm,Object.values(distances).some(x=>
    x.unsignedMinimumSurfaceDistanceMeters<=.002));
  }
  const quarterProof=await page.evaluate(()=>{
   if(typeof window.__parallel89QuarterGapAudit!=='function')
    throw Error('actual original-source quarter arm pose audit missing');
   return window.__parallel89QuarterGapAudit();
  });
  assert.equal(quarterProof.status,
   'ACTUAL_PUBLIC_SOURCE_STATIC_QUARTERSTEP_MEASURED_NOT_SWEPT',
   '25/75-percent real garment contact audit failed: '+quarterProof.reason);
  assert.equal(quarterProof.avatar,avatar);
  assert.equal(quarterProof.originalShirtSHA256,SHA.shirt);
  assert.equal(quarterProof.originalDenimSHA256,SHA.denim);
  assert.equal(quarterProof.authenticQuarterPoseCount,2);
  assert.equal(quarterProof.poseWitnesses.length,2);
  assert.equal(quarterProof.originalBonesRestored,true);
  assert.equal(quarterProof.sweptContinuousCollisionCertified,false);
  assert.equal(quarterProof.bodyContainmentCertified,false);
  assert.equal(quarterProof.originalPhoto2DFallbackRequired,true);
  assert.equal(quarterProof.consumer3DAuthorized,false);
  for(const [i,row] of quarterProof.poseWitnesses.entries()){
   assert.equal(row.pose,['blend-25','blend-75'][i]);
   assert.deepEqual(Object.keys(row.sourcePairs),
    ['shirtBody','denimBody','shirtDenim']);
   for(const witness of Object.values(row.sourcePairs)){
    assert.ok(witness.unsignedMinimumSurfaceDistanceMeters>=0&&
     witness.unsignedMinimumSurfaceDistanceMeters<2);
    assert.ok(Number.isSafeInteger(witness.originalTriangleCrossingPairs));
    assert.equal(witness.dynamicSweptClothNotMeasured,true);
   }
  }
  const shapeProof=await page.evaluate(()=>window.__parallel84ShapeResult??null);
  assert.equal(shapeProof?.schema,'parallel84-source-bone-shoulder-yoke/v1');
  assert.equal(shapeProof.releaseAuthorized,false);
  if(variant==='baseline'){
   assert.equal(shapeProof.status,'BASELINE_UNMODIFIED');
   assert.equal(shapeProof.trialApplied,false);
  }else{
   assert.equal(shapeProof.p89ResearchOnly,true);
   assert.equal(shapeProof.p89MeasuredGapCandidateNeverAuthorized,true);
   assert.equal(shapeProof.p89OriginalPhoto2DFallbackRequired,true);
   assert.equal(shapeProof.p89Consumer3DAuthorized,false);
   if(shapeProof.p89SourceGapGate!=='ORIGINAL_P84_TRIAL_REFUSED'){
    assert.equal(shapeProof.p89FiveStaticPoseGuardCompleted,true,
     'genuine original 25/75-percent poses were not measured');
    assert.equal(shapeProof.p89QuarterStepPoseAuditCompleted,true);
    assert.equal(typeof shapeProof.p89QuarterPoseStrictCrossingWorsened,'boolean');
    assert.equal(typeof shapeProof.p89QuarterPoseSurfaceGapWorsened,'boolean');
   }
   assert.ok(['REFUSED_AND_ORIGINAL_GEOMETRY_RESTORED',
    'ORIGINAL_P84_TRIAL_REFUSED','ACTUAL_SOURCE_POSE_GAPS_NONWORSENING_RESEARCH_ONLY']
    .includes(shapeProof.p89SourceGapGate),
    'P89 original-source rollback guard was bypassed');
   if(!shapeProof.trialApplied)
    assert.ok(['REFUSED_AND_ORIGINAL_GEOMETRY_RESTORED',
     'ORIGINAL_P84_TRIAL_REFUSED'].includes(shapeProof.p89SourceGapGate),
     'refused yoke must not persist as a garment research candidate');
   if(avatar==='female'){
    assert.equal(shapeProof.trialApplied,false,
     'original female source yoke gap must not be worsened by a preview');
    assert.ok(shapeProof.sourceGeometryRestored===true,
     'female original photographed geometry must be restored');
   }
  }
  // Independent digest, generated from the actual rendered source mesh position,
  // normal, index bytes. Never trust the rollback gate's own boolean alone.
  const sourceDigest=await page.evaluate(()=>{
   if(typeof window.__parallel89RealShirtGeometryDigest!=='function')
    throw Error('independent real photo source mesh buffer digest hook missing');
   return window.__parallel89RealShirtGeometryDigest();
  });
  assert.equal(sourceDigest.schema,
   'P89-actual-public-original-shirt-position-normal-index-sha256/v1');
  assert.equal(sourceDigest.originalShirtSHA256,SHA.shirt);
  assert.ok(sourceDigest.meshCount>=1&&sourceDigest.meshCount<=12);
  assert.ok(sourceDigest.combinedBufferBytes>100);
  assert.match(sourceDigest.originalRenderedSourceBufferSHA256,/^[0-9a-f]{64}$/);
  assert.equal(sourceDigest.originalPhotoOwnerReleaseAuthorized,false);
  assert.equal(sourceDigest.originalSource2DFallbackRequired,true);
  // Original public-source geometry, real native WebGL rendering. PNG hashes
  // are evidence snapshots for independent human review, never fake approval.
  // Original source P84 native renderer requires an actual next-frame draw
  // after read-only pose-gap scanning restores the authentic skeleton.
  await page.evaluate(()=>window.ccDress12SetView(0));
  await page.waitForTimeout(100);
  const png=await page.locator('#avatar').screenshot({animations:'disabled'});
  assert.ok(png.length>1500&&png.length<10_000_000&&
   png.subarray(0,8).toString('hex')==='89504e470d0a1a0a',
   'genuine source native avatar screenshot missing');
  const pngName=['P89','public','source-gap',engine,avatar,variant,'0'].join('-')+'.png';
  await writeFile(join(out,pngName),png);
  byVariant[variant]={gap:report,quarter:quarterProof,shoulder:shapeProof,sourceDigest,
   screenshotSHA256:hash(png),screenshotName:pngName};
  receipts.push({...report,researchShoulderMode:variant,
   researchShoulderApplied:shapeProof.trialApplied,
   researchShoulderStatus:shapeProof.status,
   authenticQuarterPoseWitnesses:quarterProof,
   originalRenderedShirtSourceBufferSHA256:sourceDigest.originalRenderedSourceBufferSHA256,
   actualPublicSourceNativeWebGLScreenshotPNG:byVariant[variant].screenshotName,
   actualPublicSourceNativeWebGLScreenshotSHA256:byVariant[variant].screenshotSHA256,
   humanAppearanceAcceptanceWasNotPerformed:true});
  await page.close();
  }
  const baselineDigest=byVariant.baseline.sourceDigest;
  for(const variant of ['trial','low-drop','low-drop-outward']){
   const item=byVariant[variant],digest=item.sourceDigest;
   assert.equal(digest.meshCount,baselineDigest.meshCount,
    'original photographed shirt parts inventory changed');
   assert.equal(digest.combinedBufferBytes,baselineDigest.combinedBufferBytes,
    'original skinned shirt triangle inventory changed');
   if(!item.shoulder.trialApplied)
    assert.equal(digest.originalRenderedSourceBufferSHA256,
     baselineDigest.originalRenderedSourceBufferSHA256,
     'refused yoke must restore EXACT independent shirt positions normals and indices');
   else
    assert.notEqual(digest.originalRenderedSourceBufferSHA256,
     baselineDigest.originalRenderedSourceBufferSHA256,
     'claimed applied original source yoke must actually move genuine garment vertices');
  }
  const candidates=['trial','low-drop','low-drop-outward'];
  for(const variant of candidates){
   const quarterContrast=compareOriginalSourceQuarterStepAB89({
    avatar,baseline:byVariant.baseline.quarter,trial:byVariant[variant].quarter});
   assert.ok(['QUARTER_STATIC_POSES_NO_NEW_WORSENING_NOT_SWEPT',
    'QUARTER_STATIC_POSE_SOURCE_WORSENING_WITNESSED'].includes(quarterContrast.status),
    'original quarter-pose A/B must be measured, not assumed');
   assert.equal(quarterContrast.authenticOriginalSourceQuarterPoseCount,2);
   assert.equal(quarterContrast.continuousSweptMotionCertified,false);
   assert.equal(quarterContrast.consumer3DAuthorized,false);
   if(byVariant[variant].shoulder.trialApplied)
    assert.equal(quarterContrast.trialRetainedForResearchOnly,true,
     'actual original-source active five-pose gate incorrectly retained worsening quarter poses');
   quarterContrasts.push({...quarterContrast,researchShapeVariant:variant});

   const contrast=compareOriginalSourceShoulderGapAB89({avatar,
    baseline:byVariant.baseline.gap,trial:byVariant[variant].gap,
    baselineShoulder:byVariant.baseline.shoulder,
    trialShoulder:byVariant[variant].shoulder});
   assert.equal(contrast.status,'ACTUAL_ORIGINAL_PHOTO_SHOULDER_AB_MEASURED_NOT_CLEARED',
    'genuine original source shoulder contrast rejected: '+variant+':'+contrast.reason);
   assert.equal(contrast.consumer3DAuthorized,false);
   assert.equal(contrast.sourcePhoto2DFallbackRequired,true);
   assert.ok(['baseline','trial'].includes(contrast.researchOnlyPreferredVariant));
   if(variant==='trial'){
    // Pin the genuine-source current failure/improvement rather than letting
    // a passing no-crossings CI silently endorse the female yoke regression.
    assert.equal(contrast.researchOnlyPreferredVariant,
     avatar==='female'?'baseline':'trial',
     'known original licensed shoulder source gap veto changed');
   }
   shoulderContrasts.push({...contrast,researchShapeVariant:variant});
  }
  const passing=shoulderContrasts.filter(x=>x.avatar===avatar&&
    x.researchCandidateRetainedForStudy===true);
  // Diagnostic ordering by BEST WORST-POSE shirt/body unsigned gap only.
  // Never deploy/approve the candidate. Baseline remains the 2D fallback.
  const ranked=passing.map(row=>({
   variant:row.researchShapeVariant,
   closestShirtBodyMeters:Math.min(...byVariant[row.researchShapeVariant].gap
    .sourcePoseMeasurements.map(p=>p.distances.shirtBody.unsignedMinimumSurfaceDistanceMeters))
  })).sort((a,b)=>b.closestShirtBodyMeters-a.closestShirtBodyMeters);
  const baselineClosest=Math.min(...byVariant.baseline.gap.sourcePoseMeasurements
   .map(p=>p.distances.shirtBody.unsignedMinimumSurfaceDistanceMeters));
  const selected=ranked.find(x=>x.closestShirtBodyMeters>baselineClosest+.00005);
  researchSelections.push({
   avatar,
   originalBaselineClosestShirtBodyMeters:baselineClosest,
   referenceResearchOnlyVariant:selected?.variant??'baseline',
   referenceResearchOnlyClosestShirtBodyMeters:selected?.closestShirtBodyMeters??baselineClosest,
   referenceResearchOnlyNativeWebGLScreenshotName:byVariant[selected?.variant??'baseline'].screenshotName,
   referenceResearchOnlyNativeWebGLScreenshotSHA256:byVariant[selected?.variant??'baseline'].screenshotSHA256,
   signedExteriorClearanceCertified:false,
   continuousClothCertified:false,
   humanOriginalPhotoRealismApproved:false,
   sourcePhoto2DFallbackRequired:true,
   consumer3DAuthorized:false,releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }
 assert.deepEqual(errors,[]);
 assert.deepEqual(offsite,[]);
 await writeFile(join(out,'receipt.json'),JSON.stringify({schema:'P89-authentic-licensed-shirt-denim-actual-163bone-static-unsigned-gap-browser/v3',
  engine,sourcePhotoOriginalVerified:true,
  sourceSHA256:SHA,scenes:receipts,shoulderContrasts,quarterContrasts,researchSelections,
  comparativeOriginalSourceShoulderFitIsResearchOnly:true,
  actualNativeOriginalPublicSourcePNGVisualComparisonsArchived:true,
  humanReviewerApprovalReceived:false,
  originalPhoto2DFallbackRequired:true,
  signedClearanceCertified:false,realWorldGarmentFitApproved:false,
  humanRealismReviewed:false,physicalPhoneAccepted:false,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 },null,2)+'\n');
 console.log('P89_REAL_ORIGINAL_SOURCE_STATIC_UNSIGNED_GAPS_NOT_CLEARANCE',
  JSON.stringify({engine,scenes:receipts.map(x=>({avatar:x.avatar,
   shoulderVariant:x.researchShoulderMode,
   shoulderTrialApplied:x.researchShoulderApplied,
   poses:x.sourcePoseMeasurements.map(y=>({pose:y.pose,
    surfaceMeters:Object.fromEntries(Object.entries(y.distances).map(([k,v])=>
     [k,v.unsignedMinimumSurfaceDistanceMeters]))}))})),
   contrasts:shoulderContrasts.map(x=>({avatar:x.avatar,
    shoulderTrialApplied:x.existingP84ResearchYokeTrialApplied,
    improvedAtLeastHalfMm:x.changedGapImprovedAtLeastHalfMmCount,
    worsenedAtLeastQuarterMm:x.changedGapWorsenedAtLeastQuarterMmCount,
    stillNear2mm:x.candidateStillNear2mmPairPoseCount,
    newCrossings:x.someStaticCrossingCountWorsened,
    researchVariant:x.researchShapeVariant,
    researchOnlyPreferredVariant:x.researchOnlyPreferredVariant,
    gapWorseningVeto:x.researchSourceGapVetoReason})),
   researchSelections,
   quarterPoseVetoes:quarterContrasts.filter(x=>!x.trialRetainedForResearchOnly).map(x=>({avatar:x.avatar,variant:x.researchShapeVariant})),
   consumer3DAuthorized:false,releaseAuthorized:false,familyAlpha:'HOLD'}));
}finally{
 await browser?.close();
 await new Promise(ok=>server.close(ok));
}
