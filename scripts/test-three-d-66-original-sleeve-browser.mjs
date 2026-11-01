/** 3D58 source-photo higher clarity no-source-change Chromium A/B: unchanged licensed original photo, independently
 * fitted anatomical male/female rigs, both licensed original denim sources.
 * Uses actual user-trusted click gate, no fabricated previews or network.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import sharp from 'sharp';
import {chromium} from 'playwright';
const cwd=resolve('.'),dir='benchmark/three-d-66',results=[];
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(pathname)||pathname.includes('\\')||pathname.includes('\0'))throw Error('Blocked source');
  const p=resolve(cwd,'.'+pathname);
  if(!p.startsWith(cwd+'/'))throw Error('Outside research root');
  const bytes=await readFile(p);
  const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.json':'application/json',
   '.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg'};
  res.writeHead(200,{'content-type':mime[extname(p)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
async function changed(a,b){
 const x=await sharp(a).ensureAlpha().raw().toBuffer(),y=await sharp(b).ensureAlpha().raw().toBuffer();
 assert.equal(x.length,y.length);
 let n=0;
 for(let i=0;i<x.length;i+=4)if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>27)n++;
 return n;
}
// The original body mannequin top yoke appears in genuine 390px Chromium
// avatar frames within screen y=100..175 (not forearms at 175..250).
// Require genuine color-changing pixels inside the UPPER SLEEVE region.
async function changedUpperSleeve(a,b){
 const x=await sharp(a).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const y=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.deepEqual(x.info,y.info);
 const w=x.info.width,h=x.info.height,c=x.info.channels;
 let changed=0;
 for(let row=Math.min(155,h);row<Math.min(310,h);row++)
  for(let col=Math.min(50,w);col<Math.min(w-50,320);col++){
   const i=(row*w+col)*c;
   if(Math.abs(x.data[i]-y.data[i])+Math.abs(x.data[i+1]-y.data[i+1])+Math.abs(x.data[i+2]-y.data[i+2])>27)changed++;
  }
 return changed;
}
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir(dir,{recursive:true});
 for(const source of ['31','37'])for(const width of [390])for(const figure of ['female','male']){
  const snapshots=new Map(),scenario={source,width,figure,changedPixels:0,upperSleevePixels:0,poses:[]};
  for(const version of ['before','after']){
   const context=await browser.newContext({viewport:{width,height:932},deviceScaleFactor:1,hasTouch:true,isMobile:true});
   const page=await context.newPage(),errors=[],outside=[];
   page.on('pageerror',e=>errors.push(String(e.message)));
   page.on('request',r=>{const u=r.url();if(!u.startsWith(origin)&&!u.startsWith('blob:'+origin)&&!u.startsWith('data:'))outside.push(u);});
   await page.goto(origin+'/research/three-d-'+source+'/index.html?pantsDrape=after&seatFairing=after&envelope=after&loft=after&crotchPanel=after&waistFit=after&waistContact=after&hanging=after&clothFall=after&construction=after&sweep=after&sleeve44=after&caps45=after&contour46=after&volume47=after&collar48=after&rear53=after&round54=after&hang55=after&move56=after&fit59=after&crisp58=after&slope61=after&crest64=after&drape66='+version);
   await page.waitForFunction(()=>window.cc31Diagnostics?.()?.loaded===true,null,{timeout:180000});
   if(figure==='male'){
    await page.locator('#model').selectOption('male');
    await page.waitForFunction(()=>window.cc31Diagnostics?.()?.loaded&&window.cc31Diagnostics().kind==='male',{timeout:180000});
   }
   const state=()=>page.evaluate(()=>window.cc31Diagnostics());
   assert.equal((await state()).stats.bones,163);
   assert.equal((await state()).outfit.pants.photoApplied,false);
   await page.locator('#review').check();
   await page.evaluate(()=>document.querySelector('#full').click());
   assert.equal((await state()).outfit.mode,'pants','Synthetic approval cannot bypass real source review');
   await page.locator('#full').click();
   const outfit=await state();
   assert.equal(outfit.outfit.mode,'shirt-pants');
   assert.equal(outfit.outfit.pants.photoApplied,true);
   assert.equal(outfit.outfit.pants.sourceSHA256,(source==='37'?'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a':'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c'));
   assert.equal(outfit.outfit.shirt.sourceVerifiedUpperSleeveTailoring,true);
   assert.equal(outfit.outfit.shirt.measuredNaturalShirtSideFlow,true,'Source measured torso fit remains active in both shoulder comparisons');
   assert.equal(outfit.outfit.shirt.sourceRigNaturalShoulderFall,true);
   assert.equal(outfit.outfit.shirt.trueSourceShoulderTopSlope,true);
   assert.equal(Boolean(outfit.outfit.shirt.sourceArticulatedUpperSleeveDrape),version==='after');
   if(version==='after'){
    assert.ok(outfit.outfit.shirt.upperSleeveDrapeMovedOriginalVertices>=60);
    assert.ok(outfit.outfit.shirt.upperSleeveDrapeMaxMove>=.002&&outfit.outfit.shirt.upperSleeveDrapeMaxMove<=.01001);
    assert.ok(outfit.outfit.shirt.upperSleeveDrapeSeamGap<=5e-5);
    assert.equal(outfit.outfit.shirt.originalPhotoUVSkinAndColorUnmodified,true);
    assert.equal(outfit.outfit.shirt.humanPhotorealismApproved,false);
   }
   if(version==='after'){
    assert.ok(outfit.outfit.shirt.shoulderFallRealVertices>=20);
    assert.ok(outfit.outfit.shirt.shoulderFallMaximumWorldMove>.002&&outfit.outfit.shirt.shoulderFallMaximumWorldMove<=.01601);
    assert.ok(outfit.outfit.shirt.shoulderFallSeamGap<=5e-5);
    assert.equal(outfit.outfit.shirt.shoulderFallOriginalPhotoUVSkinUnchanged,true);
    assert.equal(outfit.outfit.shirt.shoulderFallHumanVisualApproved,false);
   }
   assert.ok(outfit.outfit.shirt.posteriorSilhouetteMovedRealVertices>=20);
   assert.equal(outfit.outfit.shirt.independentArmholeCapPanels,true);
   assert.equal(outfit.outfit.shirt.independentShoulderClothContour,true);
   assert.equal(outfit.outfit.shirt.upperArmFabricVolumeTailored,true);
   assert.equal(outfit.outfit.shirt.sourceNeutralCollarRoll,true);
   assert.equal(outfit.outfit.shirt.sourceNeutralRearFabricRelief,true);
   assert.equal(outfit.outfit.shirt.naturalSourceShoulderSleeveTransition,true);
   assert.equal(outfit.outfit.shirt.sourceMeasuredNaturalSleeveHang,true);
   assert.equal(typeof outfit.outfit.shirt.poseConditionedSleeveDrape,'object','Real original source pose-conditioned garment stats must be present, never replaced with a fake boolean');
   assert.ok(outfit.outfit.shirt.poseConditionedSleeveDrape.maximum>.002&&outfit.outfit.shirt.poseConditionedSleeveDrape.maximum<=.01501);
   assert.equal(outfit.outfit.shirt.poseConditionedSleeveDrape.pose,'relaxed');
   assert.equal(outfit.sourceDetailRendering.enabled,true);
   assert.equal(outfit.sourceDetailRendering.renderPixelRatio,2);
   if(true){
    assert.ok(outfit.sourceDetailRendering.materialCount>=2,'Original licensed shirt/jeans both use photo materials');
    assert.equal(outfit.sourceDetailRendering.configuredSamplers,2,'Original source shirt and denim both compiled with higher detail sampling');
    assert.equal(outfit.sourceDetailRendering.originalPhotosAndColorsUnchanged,true);
    assert.ok(outfit.sourceDetailRendering.sourceImages.every(x=>x.anisotropy>=1&&x.anisotropy<=8));
   }
   assert.equal(outfit.outfit.shirt.sourceSHA256,'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64');
   if(version==='after'){
    assert.ok(outfit.outfit.shirt.sleeveHangChangedRenderedVertices>=50);
    assert.ok(outfit.outfit.shirt.sleeveHangMaximumMove>=.001&&outfit.outfit.shirt.sleeveHangMaximumMove<=.01201);
    assert.ok(outfit.outfit.shirt.sleeveHangBySide.L.foldA>=8&&outfit.outfit.shirt.sleeveHangBySide.R.foldA>=8);
    assert.ok(outfit.outfit.shirt.sleeveHangBySide.L.foldB>=8&&outfit.outfit.shirt.sleeveHangBySide.R.foldB>=8);
    assert.equal(outfit.outfit.shirt.originalPhotographedSleeveUVAndSkinPreserved,true);
    assert.ok(outfit.outfit.shirt.shoulderRoundMovedRenderedVertices>=30);
    assert.ok(outfit.outfit.shirt.shoulderRoundMaximumMove>=.003&&outfit.outfit.shirt.shoulderRoundMaximumMove<=.014);
    assert.ok(outfit.outfit.shirt.shoulderRoundSharedCapTorsoSeamWitnesses.L>=3);
    assert.ok(outfit.outfit.shirt.shoulderRoundSharedCapTorsoSeamWitnesses.R>=3);
    assert.ok(outfit.outfit.shirt.shoulderRoundRealSeamGap<=5e-5);
    assert.equal(outfit.outfit.shirt.originalPhotoUVAndSourceSkinWeightsUnchanged,true);
    assert.ok(outfit.outfit.shirt.rearReliefMovedRenderedVertices>=24);
    assert.ok(outfit.outfit.shirt.rearReliefMaximumMove>=.004&&outfit.outfit.shirt.rearReliefMaximumMove<=.01801);
    assert.ok(outfit.outfit.shirt.rearHemDrapeMovedVertices>=8);
    assert.ok(outfit.outfit.shirt.rearHemDrapeMaximumDrop>=.004&&outfit.outfit.shirt.rearHemDrapeMaximumDrop<=.01201);
    assert.equal(outfit.outfit.shirt.originalPhotographedFrontAndUVUnchanged,true);
    assert.equal(outfit.outfit.shirt.sourceNeutralRearPhotoNotInvented,true);
    assert.ok(outfit.outfit.shirt.realSeparateSkinnedCapMeshes>=2);
    assert.ok(outfit.outfit.shirt.collarRollChangedVertices>=25);
    assert.ok(outfit.outfit.shirt.collarRollMaximumMove>=.004&&outfit.outfit.shirt.collarRollMaximumMove<=.011);
    assert.ok(outfit.outfit.shirt.collarRollSharedInnerSeamGap<=1e-5);
    assert.equal(outfit.outfit.shirt.collarRollOuterPhotoSeamUnchanged,true);
    assert.equal(outfit.outfit.shirt.collarRollSourceUVAndWeightsUnchanged,true);
    assert.ok(outfit.outfit.shirt.upperArmFabricEditedVertices>50);
    assert.ok(outfit.outfit.shirt.upperArmFabricDepthMoves>15);
    assert.ok(outfit.outfit.shirt.upperArmFabricSeamGap<=5e-5);
    assert.equal(outfit.outfit.shirt.originalPhotographicSourceAndPanelCoordinatesUnchanged,true);
    assert.ok(outfit.outfit.shirt.shoulderContourEditedVertices>80);
    assert.ok(outfit.outfit.shirt.shoulderContourMaximumSeamGap<=5e-5);
    assert.ok(outfit.outfit.shirt.armholePanelRetessellatedFaces>outfit.outfit.shirt.armholePanelOriginalSourceFaces);
    assert.ok(outfit.outfit.shirt.upperSleeveMaximumModelSpaceMove<=.02201);
    assert.equal(outfit.outfit.shirt.originalShirtPixelsUnchanged,true);
    assert.equal(outfit.outfit.shirt.originalFrontGarmentPhotoAndUVUnchanged,true);
   }
   for(const pose of ['blend-50','relaxed']){
    const st=await page.evaluate(p=>window.cc43SetPose(p),pose);
    assert.equal(st.pose,pose);
    if(true){assert.equal(st.outfit.shirt.poseConditionedSleeveDrape.pose,pose);assert.ok(st.outfit.shirt.poseConditionedSleeveDrape.maximum>.002&&st.outfit.shirt.poseConditionedSleeveDrape.maximum<=.01501);}
    assert.equal(st.outfit.shirt.poseTriangleContact.after.count,0);
    assert.equal(st.outfit.shirt.sourceRigNaturalShoulderFall,true);
    assert.equal(st.outfit.shirt.trueSourceShoulderTopSlope,true);
    assert.equal(Boolean(st.outfit.shirt.sourceArticulatedUpperSleeveDrape),version==='after');
    assert.equal(st.outfit.shirt.measuredNaturalShirtSideFlow,true);
    for(const angle of ['front','side','back']){
     await page.locator('#'+angle).click();await page.waitForTimeout(100);
     const png=await page.locator('#avatar').screenshot({path:dir+'/'+source+'-'+width+'-'+figure+'-'+version+'-'+pose+'-'+angle+'.png'});
     const id=pose+'/'+angle;
     if(version==='before')snapshots.set(id,png);
     else{
      const n=await changed(snapshots.get(id),png);
      scenario.changedPixels+=n;
      const sleevePixels=await changedUpperSleeve(snapshots.get(id),png);
      scenario.upperSleevePixels=(scenario.upperSleevePixels||0)+sleevePixels;
      scenario.poses.push({pose,angle,pixelDifference:n,upperSleevePixels:sleevePixels});
     }
    }
   }
   for(const angle of ['left-arm','right-arm']){
    await page.evaluate(a=>window.cc56InspectSleeves(a),angle);await page.waitForTimeout(100);
    await page.locator('#avatar').screenshot({path:dir+'/'+source+'-'+width+'-'+figure+'-'+version+'-relaxed-'+angle+'-sleeve-closeup.png'});
   }
   await page.locator('#neutral').click();
   const rollback=await state();assert.equal(rollback.outfit.pants.photoApplied,false);
   assert.equal(rollback.outfit.shirt,null);
   assert.deepEqual(errors,[]);assert.deepEqual(outside,[],'Local original source photos cannot be transmitted externally');
   await context.close();
  }
  for(const angle of ['front','back'])assert.ok(
   scenario.poses.filter(p=>p.angle===angle).some(p=>p.pixelDifference>10),
   'Original source upper sleeve cloth must change on genuine skinned material in '+angle+
   ' mobile screenshot pixels without weakening human acceptance: '+JSON.stringify(scenario));
  for(const angle of ['front','back'])assert.ok(
    scenario.poses.filter(p=>p.angle===angle).some(p=>p.upperSleevePixels>10),
    'Genuine 3D66 real photographed upper-arm cloth must visibly change at screen y 155..310; not a fabricated screenshot: '+JSON.stringify(scenario));
  assert.ok(scenario.upperSleevePixels>30,'3D66 actual upper sleeve image pixel difference is absent');
  assert.ok(scenario.changedPixels>45,'No measurable original photo source cloth changed in Chromium');
  results.push(scenario);
 }
 await writeFile(dir+'/browser-results.json',JSON.stringify({scenario:'Genuine original-photo male/female figures and two licensed denims with 3D64 anatomical fit and 3D60 source sampling unchanged; A/B only true skinned upper-arm bone-guided 3D66 cloth drape.',
  widths:[390],figures:['female','male'],sources:['Jeans.jpg','Denimjeans2.JPG'],
  poses:['blend-50','relaxed'],views:['front','side','back','left-arm','right-arm'],
  measurements:results,originalPhotographicSourcesUntouched:true,sourceApprovalGatePassed:true,
  fullSignedCollisionValidated:false,continuousSweepValidated:false,
  actualMobileDeviceTested:false,humanVisualApproval:false,releaseAuthorized:false},null,2));
 console.log('THREE_D66_ACTUAL_UPPER_SLEEVE_GRAVITY_WEBGL',JSON.stringify({scenarios:results.length,frames:results.length*16,actualUpperSleevePixels:results.reduce((s,r)=>s+r.upperSleevePixels,0),
  changedPixels:results.reduce((s,r)=>s+r.changedPixels,0),approval:false}));
}finally{await browser?.close();server.close();}
