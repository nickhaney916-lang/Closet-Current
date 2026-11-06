/**
 * Priority 107 source-bound visual acceptance for genuine original jeans on
 * the pinned 163-bone anatomical donor. This tests browser-emulated mobile
 * viewports, not physical phones, and does not assign a human realism score.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';

const root=resolve('.'),dir='benchmark/three-d-107';
const source={public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'};
const views=[0,45,90,135,180,225,270,315], widths=[320,390,430], knees=[0,16];
const hash=b=>createHash('sha256').update(b).digest('hex');
const blindSeed=randomBytes(32);
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(path)||
   path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))throw Error('blocked');
  const file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw Error('escape');
  let bytes=await readFile(file);
  // Expose the existing renderer distance metric to this acceptance harness
  // only; never change or commit the donor or application sources.
  if(path==='/research/three-d-69/index-to-real-garment-demo.mjs'){
   const js=bytes.toString('utf8'),anchor='camera:app.getState().viewAngle,actual3DGarment:lastResult,';
   if(js.split(anchor).length!==2)throw Error('P107 expected one donor camera diagnostic anchor');
   bytes=Buffer.from(js.replace(anchor,'camera:app.getState().viewAngle,cameraDistance:app.getState().cameraDistance,actual3DGarment:lastResult,'));
  }
  const mime={'.mjs':'text/javascript','.js':'text/javascript',
   '.html':'text/html','.glb':'model/gltf-binary','.jpg':'image/jpeg','.png':'image/png',
   '.json':'application/json'};
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await mkdir(dir,{recursive:true});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
const errors=[],external=[],crashes=[],scenarios=[],receipts=[],browserResults=[],reviewPairs=[],reviewKey=[];
const contextOptions={viewport:{width:390,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'};
async function pixelStats(png){return sharp(png).stats();}
async function capture(page,label,meta){
 const png=await page.locator('#avatar').screenshot({animations:'disabled'});
 const image=await sharp(png).metadata(),stats=await pixelStats(png);
 assert.equal(image.format,'png');assert.ok(image.width>=180&&image.height>=280);
 assert.ok(stats.channels.some(x=>x.stdev>7),'blank/unrendered 3D screenshot '+label);
 const file=label+'.png';await writeFile(dir+'/'+file,png);
 receipts.push({file,sha256:hash(png),width:image.width,height:image.height,...meta});return png;
}
const q='?denimDrape73=after&calf74=after&folds75=after&continuity76=after&contact77=on&knee78=on&knee103=on&knee104=on&knee105=on&knee106=on';
const setView=async(page,degrees)=>{
 await page.waitForTimeout(120);
 const x=await page.evaluate(a=>window.cc69SetView(a),degrees);
 await page.waitForTimeout(120);
 const delta=Math.abs(((Number(x.camera)-degrees+540)%360)-180);
 assert.ok(Number.isFinite(Number(x.camera))&&delta<.02,
  `camera angle did not settle to ${degrees} degrees (reported ${x.camera}, delta ${delta})`);
};
async function testDirectMobileControls(page){
 await setView(page,0);
 const box=await page.locator('#avatar').boundingBox();assert.ok(box&&box.width>80&&box.height>100);
 const start=(await page.evaluate(()=>window.cc69Diagnostics())).camera;
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);
 await page.mouse.down();await page.mouse.move(box.x+box.width*.72,box.y+box.height*.53,{steps:8});await page.mouse.up();
 await page.waitForTimeout(80);
 const turned=(await page.evaluate(()=>window.cc69Diagnostics())).camera;
 const rotationDelta=Math.abs(((turned-start+540)%360)-180);
 assert.ok(rotationDelta>1,'direct mobile-viewer drag did not rotate the camera');
 await setView(page,0);
 const before=(await page.evaluate(()=>window.cc69Diagnostics())).cameraDistance;
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);
 await page.mouse.wheel(0,-180);await page.waitForTimeout(100);
 const after=(await page.evaluate(()=>window.cc69Diagnostics())).cameraDistance;
 assert.ok(Number.isFinite(before)&&Number.isFinite(after)&&Math.abs(after-before)>.02,
  'direct mobile-viewer wheel input did not change camera distance');
 await setView(page,0);
 return {rotationResponded:true,rotationDeltaDegrees:+rotationDelta.toFixed(2),
  zoomResponded:true,cameraDistanceBefore:+before.toFixed(4),cameraDistanceAfter:+after.toFixed(4)};
}
const frameTiming=page=>page.evaluate(()=>new Promise(resolve=>{
 const a=performance.now();let n=0;const tick=()=>{if(++n>=61)resolve({rafFrameCount:n,elapsedMs:+(performance.now()-a).toFixed(2),meanMs:+((performance.now()-a)/n).toFixed(3)});else requestAnimationFrame(tick)};requestAnimationFrame(tick);
}));
async function runBrowser(engine,name){
 let browser;
 try{
  const opts={headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']};
  if(name==='chromium'&&process.env.P107_CHROMIUM_EXECUTABLE)opts.executablePath=process.env.P107_CHROMIUM_EXECUTABLE;
  browser=await engine.launch(opts);
 }catch(error){
  if(name==='chromium')throw error;
  browserResults.push({browser:name,supported:false,reason:String(error.message).slice(0,240)});return;
 }
 const captureCount=receipts.length;
 try{
  for(const figure of ['female','male']){
   // Four independent reopen/close cycles exercise source disposal and reload.
   for(let cycle=0;cycle<2;cycle++){
    const context=await browser.newContext(contextOptions),page=await context.newPage();
    page.on('pageerror',e=>errors.push({browser:name,figure,message:String(e.message)}));
    page.on('crash',()=>crashes.push({browser:name,figure}));
    page.on('request',r=>{if(!r.url().startsWith(host)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'+host))external.push({browser:name,urlScheme:new URL(r.url()).protocol});});
    await page.goto(host+'/research/three-d-69/index.html'+q);
    await page.waitForFunction(()=>window.cc69Diagnostics?.()?.rig?.bones===163&&window.cc69Diagnostics().loaded===true,null,{timeout:180000});
    if(figure==='male'){
     await page.locator('#model').selectOption('male');
     await page.waitForFunction(()=>window.cc69Diagnostics?.()?.figure==='male'&&window.cc69Diagnostics().loaded===true,null,{timeout:120000});
    }
    await page.locator('#review').check();await page.locator('#wear').click();
    await page.waitForFunction(()=>window.cc69Diagnostics?.()?.actual3DGarment?.realPhotoApplied===true,null,{timeout:120000});
    const inputAcceptance=await testDirectMobileControls(page);
    const memStart=await page.evaluate(()=>({usedJSHeapSize:performance.memory?.usedJSHeapSize??null,totalJSHeapSize:performance.memory?.totalJSHeapSize??null}));
    for(const denim of ['public','second']){
     if(denim==='second'){
      await page.locator('#swap').click();
      await page.waitForFunction(()=>window.cc69Diagnostics?.()?.currentSelection==='second',null,{timeout:120000});
     }
     for(const width of widths){
      await page.setViewportSize({width,height:900});
      const box=await page.locator('#avatar').boundingBox();
      assert.ok(box&&box.width<=width&&box.x>=0,'viewer overflows mobile CSS viewport '+JSON.stringify({width,box}));
      for(const knee of knees){
       const baseline=await page.evaluate(d=>window.cc105KneeStep(d,0).pants,knee);
       const proof=await page.evaluate(d=>window.cc106CalfDrape(d,0).pants,knee);
       const diag=await page.evaluate(()=>window.cc69Diagnostics());
       assert.equal(diag.rig.bones,163);assert.equal(proof.sourceSHA256,source[denim]);
       assert.equal(proof.photographedDenimCalfDrapeGeometry106,true);
       assert.equal(proof.originalSourcePhotographAndUVRestSkinProtected106,true);
       assert.equal(proof.noInventedReversePhotograph106,true);
       assert.equal(proof.physicallySimulatedCloth106,false);
       const calf=proof.sourceNeutralRearCalfDrape106;
       assert.ok(calf.contactAfter<=calf.contactBefore);
       assert.equal(calf.contactBefore,baseline.actualSkinnedDenimBodyCrossingSegments77);
       assert.equal(calf.contactAfter,proof.actualSkinnedDenimBodyCrossingSegments77);
       if(knee===0){assert.equal(calf.moved,0);assert.equal(calf.maxShift,0);}
       else {assert.ok(calf.moved>=8);assert.ok(calf.maxShift<=.012001);}
       assert.equal(proof.releaseAuthorized,false);assert.equal(proof.familyAlpha,'HOLD');
       assert.equal(proof.photoFrontPositionsAndNormalsUnmodified106===true||knee===0,true);
       for(const view of views){
        await setView(page,view);
        // Side-by-side PHOTO105/PHOTO106 pair at the same source, figure,
        // pose and view. Image filenames carry anonymous A/B labels; the
        // version key is emitted as a separate unblinding artifact.
        if(name==='chromium'&&cycle===0&&width===390&&knee===16){
         await page.evaluate(d=>window.cc105KneeStep(d,0),knee);await setView(page,view);
         const prior=await page.locator('#avatar').screenshot({animations:'disabled'});
         await page.evaluate(d=>window.cc106CalfDrape(d,0),knee);await setView(page,view);
         const candidate=await page.locator('#avatar').screenshot({animations:'disabled'});
         const id='case-'+String(reviewPairs.length+1).padStart(3,'0');
         const flip=createHash('sha256').update(Buffer.concat([blindSeed,Buffer.from(id)])).digest()[0]&1;
         const a=flip?candidate:prior,b=flip?prior:candidate;
         const fileA='review-blinded/'+id+'-A.png',fileB='review-blinded/'+id+'-B.png';
         await mkdir(dir+'/review-blinded',{recursive:true});
         await writeFile(dir+'/'+fileA,a);await writeFile(dir+'/'+fileB,b);
         const [metaA,metaB]=await Promise.all([sharp(a).metadata(),sharp(b).metadata()]);
         reviewPairs.push({id,fileA,fileB,figure,denim,kneeDegrees:knee,viewportCSSWidth:width,
          cameraDegrees:view,sourceSHA256:source[denim],sha256A:hash(a),sha256B:hash(b),
          widthA:metaA.width,heightA:metaA.height,widthB:metaB.width,heightB:metaB.height});
         reviewKey.push({id,versionA:flip?'PHOTO106':'PHOTO105',versionB:flip?'PHOTO105':'PHOTO106'});
        }
        const timing=await frameTiming(page);
        const info=await page.evaluate(()=>{
         const root=document.querySelector('#avatar');
         const c=root&&(root.matches('canvas')?root:root.querySelector('canvas'));
         const g=c&&(c.getContext('webgl2')||c.getContext('webgl'));
         const d=window.cc69Diagnostics();return {canvas:!!c,webgl:!!g,
          renderer:g?g.getParameter(g.RENDERER):null,viewport:{width:innerWidth,height:innerHeight},
          garment:d.actual3DGarment,usedJSHeapSize:performance.memory?.usedJSHeapSize??null};
        });
        assert.equal(info.canvas,true);assert.equal(info.webgl,true);
        assert.equal(info.garment.originalPhotoSHA256s.bottom,source[denim]);
        const label=[name,figure,denim,'knee-'+knee,'w-'+width,'angle-'+view,'cycle-'+cycle].join('-');
        await capture(page,label,{browser:name,figure,denim,kneeDegrees:knee,viewportCSSWidth:width,cameraDegrees:view,
         cycle,sourceSHA256:source[denim],renderer:info.renderer,webgl:true,
         bodyCrossingSegments:proof.actualSkinnedDenimBodyCrossingSegments77,
         p105BaselineBodyCrossingSegments:baseline.actualSkinnedDenimBodyCrossingSegments77,
         rearCalfVerticesMoved:calf.moved,maxCalfDisplacementMeters:calf.maxShift,
         frameTimingMeanMs:timing.meanMs,heapUsedBytes:info.usedJSHeapSize});
        scenarios.push({browser:name,figure,denim,kneeDegrees:knee,viewportCSSWidth:width,cameraDegrees:view,cycle,
         sourceSHA256:source[denim],rigBones:diag.rig.bones,bodyCrossingSegments:proof.actualSkinnedDenimBodyCrossingSegments77,
         p105BaselineBodyCrossingSegments:baseline.actualSkinnedDenimBodyCrossingSegments77,
         rearCalfVerticesMoved:calf.moved,maxCalfDisplacementMeters:calf.maxShift,
         neutralReversePhotograph:false,frameTiming:timing,renderer:info.renderer,heapUsedBytes:info.usedJSHeapSize});
       }
      }
     }
    }
    // Original straight pose must be explicitly restorable after flex and swaps.
    const restored=await page.evaluate(()=>window.cc106CalfDrape(0,0).pants);
    assert.equal(restored.sourceNeutralRearCalfDrape106.moved,0);
    const memEnd=await page.evaluate(()=>({usedJSHeapSize:performance.memory?.usedJSHeapSize??null,totalJSHeapSize:performance.memory?.totalJSHeapSize??null}));
    browserResults.push({browser:name,figure,cycle,sceneClosed:true,memStart,memEnd,
     heapDeltaBytes:memStart.usedJSHeapSize!==null&&memEnd.usedJSHeapSize!==null?memEnd.usedJSHeapSize-memStart.usedJSHeapSize:null,
     garmentSwaps:1,viewportResizes:3,poseRestore:true,inputAcceptance});
    await context.close();
   }
  }
 }finally{await browser.close();}
 if(name==='chromium')assert.equal(receipts.length-captureCount,384);
}

try{
 await runBrowser(chromium,'chromium');
 await runBrowser(webkit,'webkit');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(crashes,[]);
 const supported=new Set(browserResults.filter(x=>x.supported!==false).map(x=>x.browser));
 const perBrowser=[...supported].map(browser=>({browser,shots:receipts.filter(x=>x.browser===browser).length}));
 const current=receipts.filter(x=>x.browser==='chromium');
 assert.equal(current.length,384);
 assert.equal(new Set(current.map(x=>[x.figure,x.denim,x.kneeDegrees,x.viewportCSSWidth,x.cameraDegrees,x.cycle].join(':'))).size,384);
 const report={priority:'INDEPENDENT-MOBILE-3D-VISUAL-ACCEPTANCE-107',baseline:'9d7782e358edb20672685fe97af255aca8d0d8b1',
  sourceCohort:[{key:'public',sha256:source.public,license:'public domain',orientation:'laid-flat front only'},
   {key:'second',sha256:source.second,license:'CC BY-SA 4.0',orientation:'laid-flat front only'}],
  anatomicalFigures:['female','male'],rigBones:163,cameraAnglesDegrees:views,kneeAnglesDegrees:knees,
  viewportWidthsCSS:widths,chromiumGenuineWebGLScreenshots:current.length,
  webkitStatus:browserResults.find(x=>x.browser==='webkit'&&x.supported===false)||{supported:true,shots:receipts.filter(x=>x.browser==='webkit').length},
  originalPhotosPreserved:true,neutralRearIsUnphotographed:true,allScenarios:scenarios.length,
  scenarios,screenshotReceipts:receipts,browserCycles:browserResults,
  photo106CalfGeometryExercised:true,
  blindedHumanReviewPackage:{comparison:'PHOTO105 versus PHOTO106 research render; anonymous image labels',
   pairedCases:reviewPairs.length,images:reviewPairs.length*2,versionMappingInReviewManifest:false},
  measuredHumanPhotorealismScore:null,humanVisualAcceptance:'NOT YET VERIFIED',
  physicalAndroidAndIphone:'NOT VERIFIED',liveSignedCloudRLS:'NOT VERIFIED',generalizedUserPhotoFitting:'NOT VERIFIED',
  continuousFabricPhysics:'NOT VERIFIED',releaseAuthorized:false,familyAlpha:'HOLD'};
 await writeFile(dir+'/acceptance.json',JSON.stringify(report,null,2)+'\n');
 await mkdir(dir+'/review-blinded',{recursive:true});
 await writeFile(dir+'/review-manifest.json',JSON.stringify({schema:'closet-current-blinded-3d-review/v1',
  disclosure:'Version labels are withheld from this package. A reviewer should not inspect the development repository or unblinding artifact before submitting ratings.',
  scale:'1-10 per research scorecard; record defects and lock scores before unblinding.',cases:reviewPairs},null,2)+'\n');
 await writeFile('benchmark/three-d-107-controller-key.json',JSON.stringify({
  access:'SEPARATE UNBLINDING ARTIFACT — do not share with reviewers before score lock',cases:reviewKey},null,2)+'\n');
 assert.equal(reviewPairs.length,64,'blinded same-view P105/P106 review pairs required');
 console.log('P107_MOBILE_WEBGL_ACCEPTANCE',JSON.stringify({shots:receipts.length,perBrowser,scenarios:scenarios.length,
  angles:views,knees,viewports:widths,errors:errors.length,external:external.length,crashes:crashes.length,
  humanVisualAcceptance:report.humanVisualAcceptance,familyAlpha:'HOLD'}));
}finally{await new Promise(ok=>server.close(ok));}
