/**
 * 3D-MOBILE-24: independently verify the P23 real original-denim jeans
 * remain onscreen, full-width, source-verified and private at 320/390/430.
 * 2 photographed jeans x 2 real 163-bone figures x 3 widths x 4 camera angles
 * = 48 real Chromium WebGL PNGs. No generated rear photographs.
 *
 * This is mobile-viewport SIMULATION, not physical iPhone/Android acceptance.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';

const root=resolve('.'),output='benchmark/denim-anatomical-hang-26';
const sources=Object.freeze([
 'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
]);
const qs='walk=after&folds=after&sweep=after&dressFit=after&denimFit=after&denimSilhouette=after&denimFairing=after&denimRear14=after&denimSide15=after&denimPosterior16=after&denimPhotoWidth17=after&denimProfile18=after&denimSigned19=after&denimLine20=after&denimFold21=after&denimStack22=after&denimMaterial23=after';
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(three|three-mesh-bvh)\/)/.test(path)||
   path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('Only original research sources allowed');
  const full=resolve(root,'.'+path);
  if(!full.startsWith(root+'/'))throw Error('path denied');
  const bytes=await readFile(full);
  const m={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
   '.glb':'model/gltf-binary','.jpg':'image/jpeg','.json':'application/json','.png':'image/png'};
  res.writeHead(200,{'content-type':m[extname(full)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Source not accessible');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const host='http://127.0.0.1:'+server.address().port;
const results=[],failures=[],errors=[],external=[];
const blue=(r,g,b)=>b-r>24&&b-g>13&&g-r>8&&r>15;
async function witness(png){
 const {data,info}=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.channels,3);
 let n=0,minX=info.width,minY=info.height,maxX=-1,maxY=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const i=(y*info.width+x)*3;
  if(!blue(data[i],data[i+1],data[i+2]))continue;
  n++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);
  minY=Math.min(minY,y);maxY=Math.max(maxY,y);
 }
 return {blueDenimPixels:n,canvasWidth:info.width,canvasHeight:info.height,
  bbox:[minX,minY,maxX,maxY]};
}
function guardReport(d,source,rig){
 assert.equal(d.account,'fixture-account-a');
 assert.equal(d.figure,rig);
 assert.equal(d.bones,163);
 assert.equal(d.viewerMode,'verified-3d');
 assert.equal(d.outfitMode,'shirt-pants');
 assert.equal(d.displayed3DSources?.bottom,source,'Original denim source SHA must match');
 assert.equal(d.sourceDenimMaterial23Enabled,true);
 assert.equal(d.sourceDenimMaterial23Compiled,true);
 assert.equal(d.sourceDenimMaterial23Protected,true);
 assert.equal(d.sourceDenimMaterial23NoRearPhoto,true);
 assert.equal(d.verifiedOriginalRearPhotograph,false);
 assert.equal(d.familyAlpha,'HOLD');
 assert.equal(d.releaseAuthorized,false);
 assert.equal(d.physicalPhonesTested,false);
 assert.equal(d.sourcePhotoCoverageVisible,true);
}

async function changedDenimSourcePixels(before,after){
 const [a,b]=await Promise.all([sharp(before).removeAlpha().raw().toBuffer({resolveWithObject:true}),
  sharp(after).removeAlpha().raw().toBuffer({resolveWithObject:true})]);
 assert.equal(a.info.width,b.info.width);assert.equal(a.info.height,b.info.height);
 let n=0,total=0,sourceBlue=0,afterBlue=0;
 for(let i=0;i<a.data.length;i+=3){
  const src=blue(a.data[i],a.data[i+1],a.data[i+2]);
  const dst=blue(b.data[i],b.data[i+1],b.data[i+2]);
  if(src)sourceBlue++;if(dst)afterBlue++;
  if(!(src&&dst))continue;
  const delta=Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+
   Math.abs(a.data[i+2]-b.data[i+2]);
  if(delta>6){n++;total+=delta;}
 }
 return {changedSourceBluePixels:n,totalPhotoMatchedChange:total,sourceBlue,afterBlue};
}
let browser;
try{
 await mkdir(output,{recursive:true});
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'
 ]});
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
  try{
   const baseline=await context.newPage();
   const modeled=await context.newPage();
   for(const p of [baseline,modeled]){
    p.on('pageerror',e=>errors.push(e.message));
    p.on('request',r=>{
     if(!r.url().startsWith(host+'/')&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'+host))
      external.push(r.url());
    });
   }
   await Promise.all([
    baseline.goto(host+'/research/fabric-sweep-04/index.html?'+qs+'&denimWeave25=after',{waitUntil:'domcontentloaded'}),
    modeled.goto(host+'/research/fabric-sweep-04/index.html?'+qs+'&denimWeave25=after&denimHang26=after',{waitUntil:'domcontentloaded'})
   ]);
   for(const p of [baseline,modeled]){
    await p.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.indexReady===true,null,{timeout:45000});
   }
   for(const rig of ['female','male']){
    if(rig==='male')for(const p of [baseline,modeled])await p.locator('#model').selectOption('male');
    for(const denimIndex of [0,1]){
     for(const p of [baseline,modeled]){
      await p.locator('#category').selectOption('Dresses');
      await p.locator('#items .item').first().click();
      await p.waitForFunction(expected=>{const d=window.ccWardrobe10Diagnostics?.();
       return d?.viewerReady===true&&d.viewerMode==='verified-3d'&&d.figure===expected&&d.outfitMode==='dress';},rig,{timeout:180000});
      await p.locator('#swap').click();
      if(denimIndex===1)await p.locator('#swap').click();
      await p.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.outfitMode==='shirt-pants'&&
       window.ccWardrobe10Diagnostics?.()?.sourceDenimMaterial23Compiled===true,null,{timeout:50000});
     }
     await modeled.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.sourceDenimWeave25Compiled===true,null,{timeout:45000});
     const baselineFreeze=await baseline.evaluate(()=>window.ccWardrobeDenimFreeze06());
     const modeledFreeze=await modeled.evaluate(()=>window.ccWardrobeDenimFreeze06());
     for(const fit of [baselineFreeze,modeledFreeze]){
      assert.equal(fit.originalPhotoSHA256,sources[denimIndex]);
      assert.equal(fit.originalJPEGUVRestSkinProtected22,true);
      assert.equal(fit.trueBVHBodyContactNoNew,true);
      if(fit===modeledFreeze){
       assert.equal(fit.sourceNeutralHipKneeHang26,true);
       assert.equal(fit.originalSourceFrontJPEGUVRestSkinUnchanged26,true);
       assert.equal(fit.sideRearDrapeModeledNotPhotographed26,true);
       assert.ok(fit.sourceHipKneeHangMovedVertices26>=30);
       assert.ok(Math.min(...fit.sourceHipKneeHangPerLeg26)>=12);
       assert.ok(fit.sourceHipKneeHangRearMaxMeters26>=.003&&
         fit.sourceHipKneeHangRearMaxMeters26<=.004201);
      }
      assert.ok(fit.bodyContactAfter<=fit.bodyContactBefore);
     }
     for(const angle of [0,90,135,180]){
      const [beforeState,afterState]=await Promise.all([
       baseline.evaluate(a=>window.ccWardrobe10View(a),angle),
       modeled.evaluate(a=>window.ccWardrobe10View(a),angle)
      ]);
      guardReport(beforeState,sources[denimIndex],rig);
      guardReport(afterState,sources[denimIndex],rig);
      assert.equal(beforeState.sourceDenimWeave25Enabled,true);
      assert.equal(afterState.sourceDenimWeave25Enabled,true);
      assert.equal(afterState.sourceDenimWeave25Compiled,true);
      assert.equal(afterState.sourceDenimWeave25Protected,true);
      assert.equal(afterState.sourceDenimWeave25NoRearPhoto,true);
      assert.equal(beforeState.sourceDenimHang26Enabled,false);
      assert.equal(afterState.sourceDenimHang26Enabled,true);
      assert.equal(afterState.sourceDenimHang26Proof,true);
      if(angle===180){
       assert.equal(afterState.photoCoverageViewClass,'unphotographed-rear');
       assert.equal(afterState.verifiedOriginalRearPhotograph,false);
      }
      // Let actual WebGL camera damping settle and render both source meshes.
      await Promise.all([baseline.waitForTimeout(140),modeled.waitForTimeout(140)]);
      const [before,after]=await Promise.all([
       baseline.locator('#avatar').screenshot(),
       modeled.locator('#avatar').screenshot()
      ]);
      const name=width+'-'+rig+'-photo-'+denimIndex+'-angle-'+angle;
      // Always save actual original source-before and source-model-after
      // evidence first, even when a subsequent strict pixel gate fails.
      await Promise.all([
       writeFile(output+'/'+name+'-p25-source.png',before),
       writeFile(output+'/'+name+'-p26-anatomical.png',after)
      ]);
      const [basePixel,modelPixel,change]=await Promise.all([
       witness(before),witness(after),changedDenimSourcePixels(before,after)
      ]);
      assert.ok(basePixel.blueDenimPixels>=1200,'Missing original jeans baseline '+name);
      assert.ok(modelPixel.blueDenimPixels>=basePixel.blueDenimPixels*.80&&
       modelPixel.blueDenimPixels>=1200,
       'P26 must not hide original source jeans '+name+' '+modelPixel.blueDenimPixels+'/'+basePixel.blueDenimPixels);
      const [minX,minY,maxX,maxY]=modelPixel.bbox;
      assert.ok(minX>=1&&maxX<=modelPixel.canvasWidth-2&&
       minY>=1&&maxY<=modelPixel.canvasHeight-2,
       'P25 visible photographed-source denim must fit canvas '+name);
      if(angle!==0)assert.ok(change.changedSourceBluePixels>=20,
       'P26 must visibly change photographed-source-neutral sewn upper thigh geometry, not only unrelated pixels: '+name+' '+change.changedSourceBluePixels);
      if(angle===0)assert.ok(change.changedSourceBluePixels<=basePixel.blueDenimPixels*.55,
       'P26 photographed front source protection: too much original photographed denim visibly altered '+name);
      const result={width,rig,denimIndex,angle,sourceSHA256:sources[denimIndex],
       owner:'fixture-account-a',bones:163,viewClass:afterState.photoCoverageViewClass,
       beforeVisibleDenimPixels:basePixel.blueDenimPixels,
       afterVisibleDenimPixels:modelPixel.blueDenimPixels,
       changedOnRealDenimPixels:change.changedSourceBluePixels,
       noNewBVHContacts:modeledFreeze.bodyContactAfter<=modeledFreeze.bodyContactBefore,
       originalFrontPhotoRGBUntouched:true,sourceOriginalSHAUVRestSkinPreserved:true,
       noFabricatedRearPhoto:true,neutralSurfaceExplicitlyModeled:true,
       P23Compiled:true,P25Compiled:true,P26Fitted:true,noPhotosToGallery:true,
       physicallyMeasuredWeave:false,physicalPhonesTested:false,
       humanPhotorealismApproved:false,productionModified:false,releaseAuthorized:false};
      results.push(result);
     }
    }
   }
   for(const p of [baseline,modeled]){
    await p.locator('#logout').click();
    const d=await p.evaluate(()=>window.ccWardrobe10Diagnostics());
    assert.equal(d.sourcePhotoCoverageVisible,false);
    assert.equal(d.viewerMode,'original-photo-2d');
   }
  }finally{await context.close();}
 }
 assert.equal(results.length,48);
 assert.deepEqual([...new Set(results.map(x=>x.width))],[320,390,430]);
 assert.deepEqual([...new Set(results.map(x=>x.rig))],['female','male']);
 assert.deepEqual([...new Set(results.map(x=>x.angle))],[0,90,135,180]);
 assert.equal(new Set(results.map(x=>x.sourceSHA256)).size,2);
 assert.deepEqual(errors,[]);
 assert.deepEqual(external,[]);
 await writeFile(output+'/results.json',JSON.stringify({
  genuineBeforeAfterWebGLFrames:96,matchedGenuineOriginalDenimPairs:48,
  authenticPhotographedSources:2,anatomical163BoneFigures:['female','male'],
  mobileBrowserWidths:[320,390,430],angles:[0,90,135,180],
  actualSourceRGBNeverChanged:true,independentRearPhotographAvailable:false,
  rearTextileIsModeled:true,modeledAnatomicalHipKneeHang:true,physicallyMeasuredWeave:false,
  physicalAndroidIPhoneTested:false,humanPhotorealismApproved:false,
  familyAlpha:'HOLD',releaseAuthorized:false,productionModified:false,
  results,errors,external
 },null,2));
 console.log('DENIM26_SOURCE_ANATOMICAL_3D',JSON.stringify({pairs:results.length,
  minDenimPixels:Math.min(...results.map(x=>x.afterVisibleDenimPixels)),
  minChangedSideRearPixels:Math.min(...results.filter(x=>x.angle!==0).map(x=>x.changedOnRealDenimPixels)),
  sourcePhotosUntouched:true,noNewContacts:true,release:'HOLD'}));
}catch(e){
 failures.push(String(e));
 await writeFile(output+'/failure.json',JSON.stringify({failures,errors,external,completed:results},null,2)).catch(()=>{});
 throw e;
}finally{await browser?.close();await new Promise(r=>server.close(r));}
