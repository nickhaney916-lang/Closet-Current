/**
 * Parallel #84 real photographed two-piece exact-163-bone source/blend/relaxed
 * static arm pose contact witness. NO owner photo and NO live app changes.
 * Signed watertight clearance, swept motion, full cloth refitting, human
 * realism and physical-phone approval remain UNVERIFIED.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const root=resolve(process.argv[2]||'.'),engine=process.env.P84_BROWSER||'chromium';
if(!process.argv[2]||root===resolve('.')||root==='/'||
 !['chromium','webkit'].includes(engine))throw Error('P84 detached immutable donor required');
const dest='benchmark/parallel84-source-pose-sweep/'+engine;
await mkdir(dest,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(p)||
   p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))
   throw Error('untrusted-photo-url');
  const target=resolve(root,'.'+p);
  if(!target.startsWith(root+'/'))throw Error('outside-disposable-donor');
  const data=await readFile(target);
  const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript',
   '.glb':'model/gltf-binary','.jpg':'image/jpeg','.png':'image/png','.json':'application/json',
   '.css':'text/css'};
  res.writeHead(200,{'content-type':types[extname(target)]||'application/octet-stream','cache-control':'no-store'});
  res.end(data);
 }catch{res.writeHead(404);res.end('Not available');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const sha=x=>createHash('sha256').update(x).digest('hex');
const SOURCE=Object.freeze({
 shirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
});
const figures=['female','male'],denims=['public','second'],
 poses=['source','blend-50','relaxed'],angles=[0,90],width=390;
let browser;
const captures=[],samples=[],errors=[],offsite=[];
async function visit(ctx,figure,denim,variant){
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push({type:'page-error',message:String(e.message).slice(0,180)}));
 page.on('crash',()=>errors.push({type:'page-crash'}));
 page.on('request',request=>{
  const u=request.url();
  if(!u.startsWith(origin)&&!u.startsWith('blob:'+origin)&&!u.startsWith('data:'))
   offsite.push({source:'blocked',figure,denim});
 });
 await page.route('**/*',route=>{
  const u=route.request().url();
  if(u.startsWith(origin)||u.startsWith('blob:'+origin)||u.startsWith('data:'))
   return route.continue();
  return route.abort();
 });
 await page.goto(origin+'/research/dress-mobile-01/index.html?parallel84Poses=audit&parallel84Denim='+variant,
  {waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.ccDress12Diagnostics?.()?.phase==='ready',
  null,{timeout:180000});
 if(figure==='male'){
  await page.locator('#model').selectOption('male');
  await page.waitForFunction(()=>window.ccDress12Diagnostics?.()?.phase==='ready',
   null,{timeout:180000});
 }
 await page.locator('#review').check();
 if(denim==='second')await page.locator('#swap').click();
 const start=Date.now();
 await page.locator('#two').click();
 const elapsed=Date.now()-start;
 const state=await page.evaluate(()=>({
  garment:window.ccDress12Diagnostics(),
  pose:window.__parallel84PoseResult??null,
  shape:window.__parallel84PoseGateResult??window.__parallel84DenimResult??null,
  staticPoseControls:typeof window.__parallel84SetStaticPose==='function',
  frames:Number(document.getElementById('avatar').dataset.frames||0),
  webgl2:!!document.getElementById('avatar').getContext('webgl2')
 }));
 assert.equal(state.garment.phase,'ready');
 assert.equal(state.garment.figure,figure);
 assert.equal(state.garment.bones,163);
 assert.equal(state.garment.outfitMode,'shirt-pants');
 assert.deepEqual(state.garment.outfitSlots,['shirt','pants']);
 assert.equal(state.garment.shirt.sourceSHA256,SOURCE.shirt);
 assert.equal(state.garment.pants.sourceSHA256,SOURCE[denim]);
 assert.equal(state.garment.noOriginalPhotoModified,true);
 assert.equal(state.garment.releaseAuthorized,false);
 assert.equal(state.webgl2,true);
 assert.ok(state.frames>1);
 assert.equal(state.staticPoseControls,true);
 assert.equal(state.pose?.schema,'P84-authentic-163-bone-multiple-static-poses/v1');
 assert.equal(state.pose?.actualPoseAuditCompleted,true,'real pose evidence required: '+JSON.stringify(state.pose));
 assert.equal(state.pose?.staticPoseCount,3);
 assert.equal(state.pose?.poseResults.length,3);
 assert.deepEqual(state.pose.poseResults.map(x=>x.pose),poses);
 assert.equal(state.pose?.originalPoseRestored,true);
 assert.equal(state.pose?.distinctJointRotationVerified,true);
 assert.ok(state.pose?.actualShoulderPoseEndToEndRadians>.04);
 assert.equal(state.pose?.safe3DClearanceProven,false);
 assert.equal(state.pose?.continuousOrSweptCollisionCertified,false);
 assert.equal(state.pose?.releaseAuthorized,false);
 assert.equal(state.pose?.avatar,figure);
 assert.equal(state.shape?.schema,variant==='baseline'?
  'P84-original-denim-source-neutral-side-AB/v1':
  'P84-original-denim-three-static-pose-acceptance-gate/v1');
 if(variant==='baseline'){
  assert.equal(state.shape.status,'BASELINE_UNMODIFIED');
  assert.equal(state.shape.trialApplied,false);
 }else{
  assert.ok(['THREE_STATIC_POSES_NO_NEW_SOURCE_CROSSINGS_NOT_MOTION_CERTIFIED',
   'REFUSED_ORIGINAL_GEOMETRY_RESTORED'].includes(state.shape.status),
   'No unsafe source pose fitting acceptance: '+JSON.stringify(state.shape));
  assert.equal(state.shape.releaseAuthorized,false);
  if(state.shape.trialApplied){
   assert.equal(state.shape.allSourceFacesAudited,true);
   assert.equal(state.shape.exactPairIdentityComparison,true);
   assert.equal(state.shape.fullOriginalFaceSampledPoses,3);
   assert.equal(state.shape.actualFullContactPoseComparisons.length,3);
   assert.ok(state.shape.actualFullContactPoseComparisons.every(p=>
    p.newBodyShirtTrianglePairs===0&&
    p.newBodyDenimTrianglePairs===0&&
    p.newShirtDenimTrianglePairs===0&&!p.maximumOrientedPlaneDepthWorsened));
   assert.equal(state.shape.sourcePoseOriginalProtected,true);
  }else{
   assert.equal(state.shape.originalGeometryRestored,true);
  }
 }
 // These visual frames are actual source/half-arm/relaxed 163-bone skinning
 // WITHOUT new pose-dependent physical cloth refitting. Not motion video.
 const shots=[];
 for(const pose of poses){
  await page.evaluate(poseName=>window.__parallel84SetStaticPose(poseName),pose);
  for(const angle of angles){
   await page.evaluate(a=>window.ccDress12SetView(a),angle);
   await page.waitForTimeout(80);
   const png=await page.locator('#avatar').screenshot({animations:'disabled'});
   const m=await sharp(png).metadata();
   assert.ok(m.width>100&&m.height>100);
   const name=['P84',engine,figure,denim,variant,pose,angle].join('-')+'.png';
   await writeFile(join(dest,name),png);
   const shot={name,pose,angle,figure,denim,variant,sha256:sha(png),
    realOriginalLicensedPhotographed163BoneSkinnedWebGL:true,
    realPhone:false,dynamicClothRefit:false,ownerPhoto:false,realismApproved:false};
   shots.push({png,shot});captures.push(shot);
  }
 }
 // Prove the THREE original 163-bone source joints visibly changed pose.
 // A name-only pose or unrendered joint change must fail; CI screenshot
 // differences are actual WebGL rendered RGB channels, not claimed physics.
 const posePixels=[];
 for(let i=1;i<poses.length;i++){
  const a=await sharp(shots[(i-1)*angles.length].png).removeAlpha().raw().toBuffer();
  const b=await sharp(shots[i*angles.length].png).removeAlpha().raw().toBuffer();
  const n=rgbDiff(a,b);
  assert.ok(n>5000,'A real named arm pose must change source WebGL pixels: '+figure+' '+poses[i]);
  posePixels.push({from:poses[i-1],to:poses[i],channelsChangedAbove12:n});
 }
 await page.evaluate(()=>window.__parallel84SetStaticPose('relaxed'));
 await page.close();
 return {figure,denim,variant,pose:state.pose,shape:state.shape,elapsed,shots,posePixels};
}
function rgbDiff(a,b){
 assert.equal(a.length,b.length);let count=0;
 for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>12)count++;
 return count;
}
try{
 browser=await (engine==='chromium'?chromium:webkit).launch({
  headless:true,...(engine==='chromium'?{args:['--use-gl=angle',
   '--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']}: {})
 });
 const context=await browser.newContext({
  viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,
  hasTouch:true,serviceWorkers:'block'
 });
 for(const figure of figures)for(const denim of denims){
  const before=await visit(context,figure,denim,'baseline');
  const changed=await visit(context,figure,denim,'gated');
  const witnesses=poses.map((name,i)=>{
   const a=before.pose.poseResults[i],b=changed.pose.poseResults[i];
   const delta={
    shirtBody:b.shirtBodyCrossingTrianglePairs-a.shirtBodyCrossingTrianglePairs,
    denimBody:b.denimBodyCrossingTrianglePairs-a.denimBodyCrossingTrianglePairs,
    shirtDenim:b.shirtDenimCrossingTrianglePairs-a.shirtDenimCrossingTrianglePairs
   };
   return {pose:name,baseline:{shirtBody:a.shirtBodyCrossingTrianglePairs,
    denimBody:a.denimBodyCrossingTrianglePairs,
    shirtDenim:a.shirtDenimCrossingTrianglePairs},
    refined:{shirtBody:b.shirtBodyCrossingTrianglePairs,
     denimBody:b.denimBodyCrossingTrianglePairs,
     shirtDenim:b.shirtDenimCrossingTrianglePairs},
    contactPairCountDeltas:delta,
    anyIncreaseOverBaseline:Object.values(delta).some(x=>x>0),
    safeMotionNotProven:true};
  });
  const pixelDiffs=[];
  for(let i=0;i<before.shots.length;i++){
   const p=await sharp(before.shots[i].png).removeAlpha().raw().toBuffer();
   const q=await sharp(changed.shots[i].png).removeAlpha().raw().toBuffer();
   pixelDiffs.push({pose:before.shots[i].shot.pose,
    angle:before.shots[i].shot.angle,
    changedRGBChannelsAbove12:rgbDiff(p,q)});
  }
  assert.equal(witnesses.length,3);
  assert.equal(pixelDiffs.length,6);
  // Unsafe poses are EVIDENCE and should not be hidden by a passing CI.
  // This is a diagnostic, not an automatically approved 3D release.
  samples.push({figure,denim,baselineMs:before.elapsed,refinedMs:changed.elapsed,
   originalPhotoUnchanged:true,originalSkinned163BoneCloth:true,
   shapeTrialApplied:changed.shape.trialApplied,
   visibleDistinctOriginalJointPoses:changed.posePixels,
   rigidPoseIsNotFabricDynamicMotion:true,
   sourcePoseNewContactPairs:changed.shape.actualFullContactPoseComparisons?.reduce(
    (n,p)=>n+p.newBodyShirtTrianglePairs+
     p.newBodyDenimTrianglePairs+p.newShirtDenimTrianglePairs,0)??0,
   poseWitnesses:witnesses,pixelDiffs,
   additionalStaticPoseContactReleaseBlock:witnesses.some(x=>x.anyIncreaseOverBaseline),
   continuousPoseSafetyCertified:false,independentRealismApproved:false});
 }
 assert.equal(captures.length,48);
 assert.equal(samples.length,4);
 assert.deepEqual(errors,[]);
 assert.deepEqual(offsite,[]);
 const output={schema:'P84-real-original-photo-163-bone-static-arm-pose-A-B/v1',
  engine,width,sourceSHA256:SOURCE,actualLicensedPhotographedSamples:true,
  sourceDetachedImmutableDonor:true,actualPoseLabels:poses,
  poseComparisons:3,sourceOutfits:4,totalScreenshotCount:captures.length,
  originalSourcePhotoBytesUnmodified:true,sourceAlphaAndUVUnmodified:true,
  browserEmulationNotPhysicalDevice:true,sourceNeutralRearOnly:true,
  skinnedBoneRotationNotTrueFabricDrape:true,
  safeMotionCertified:false,humanRealismApproved:false,
  productionChanged:false,familyAlpha:'HOLD',releaseAuthorized:false,samples,captures};
 await writeFile(join(dest,'results.json'),JSON.stringify(output,null,2)+'\n');
 console.log('P84_ACTUAL_SOURCE_STATIC_POSE_'+engine.toUpperCase(),JSON.stringify({
  totalScreenshotCount:captures.length,figures:2,denimSources:2,poseSamples:3,
  newlyWorsenedStaticPoseOutfits:samples.filter(x=>x.additionalStaticPoseContactReleaseBlock).length,
  actualPoseAudits:samples.length*2,
  originalPhotoUnmodified:true,continuousClothDynamicsNotProven:true,
  releaseAuthorized:false
 }));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
