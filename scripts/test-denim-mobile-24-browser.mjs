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

const root=resolve('.'),output='benchmark/denim-mobile-24';
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
let browser;
try{
 await mkdir(output,{recursive:true});
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'
 ]});
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:900},
   deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  try{
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{
    if(!r.url().startsWith(host+'/')&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'+host))
     external.push(r.url());
   });
   await page.goto(host+'/research/fabric-sweep-04/index.html?'+qs,{waitUntil:'domcontentloaded'});
   for(const rig of ['female','male']){
    if(rig==='male'){
     await page.locator('#model').selectOption('male');
     await page.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.figure==='male'&&window.ccWardrobe10Diagnostics?.()?.viewerReady===true,null,{timeout:180000});
    } else {
     await page.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady===true,null,{timeout:180000});
    }
    for(const denimIndex of [0,1]){
     await page.locator('#category').selectOption('Dresses');
     await page.locator('#items .item').first().click();
     await page.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerMode==='verified-3d'&&window.ccWardrobe10Diagnostics()?.outfitMode==='dress',null,{timeout:40000});
     await page.locator('#swap').click();
     if(denimIndex===1)await page.locator('#swap').click();
     await page.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.outfitMode==='shirt-pants'&&window.ccWardrobe10Diagnostics()?.sourceDenimMaterial23Compiled===true,null,{timeout:40000});
     const original=await page.evaluate(()=>window.ccWardrobeDenimFreeze06());
     assert.equal(original.originalPhotoSHA256,sources[denimIndex]);
     assert.equal(original.originalJPEGUVRestSkinProtected22,true);
     assert.equal(original.trueBVHBodyContactNoNew,true);
     assert.ok(original.bodyContactAfter<=original.bodyContactBefore);
     for(const angle of [0,90,135,180]){
      const state=await page.evaluate(a=>window.ccWardrobe10View(a),angle);
      guardReport(state,sources[denimIndex],rig);
      // Verify 3D source coverage does not pretend unknown rear is photographed.
      if(angle===180)assert.equal(state.photoCoverageViewClass,'unphotographed-rear');
      const canvas=page.locator('#avatar'),rect=await canvas.boundingBox();
      assert.ok(rect&&rect.width>=220&&rect.x>=-1&&rect.x+rect.width<=width+1,
       'Canvas must stay inside mobile viewport at '+width+'px');
      const dimensions=await page.evaluate(()=>({
       innerWidth:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,
       webgl2:document.querySelector('#avatar').getContext('webgl2')!==null,
       frames:Number(document.querySelector('#avatar').dataset.frames||0)
      }));
      assert.ok(dimensions.scrollWidth<=width+2,'No clipped horizontal scroll at '+width+'px');
      assert.ok(dimensions.webgl2&&dimensions.frames>3,'Actual original WebGL draw required');
      const screenshot=await canvas.screenshot();
      const file=width+'-'+rig+'-photo-'+denimIndex+'-angle-'+angle+'.png';
      await writeFile(output+'/'+file,screenshot); // Preserve failure evidence FIRST.
      const pixel=await witness(screenshot);
      assert.ok(pixel.blueDenimPixels>=1200,
       'Visible original-blue denim required: '+file+' '+pixel.blueDenimPixels);
      const [minX,minY,maxX,maxY]=pixel.bbox;
      assert.ok(minX>=1&&maxX<=pixel.canvasWidth-2&&minY>=1&&maxY<=pixel.canvasHeight-2,
       'Entire denim bounding silhouette must fit actual canvas, not be clipped: '+file+' '+pixel.bbox);
      const result={width,rig,denimIndex,angle,sourceSHA256:sources[denimIndex],
       sourceOwner:'fixture-account-a',boneCount:state.bones,
       blueDenimPixels:pixel.blueDenimPixels,pixelBounds:pixel.bbox,
       canvasWidth:pixel.canvasWidth,canvasHeight:pixel.canvasHeight,
       fragmentShaderCompiled:state.sourceDenimMaterial23Compiled,
       originalPhotographedFrontAndUVProtected:true,
       originalSourceGenuine:true,unphotographedRearStillNeutral:true,
       noNewBVHContacts:original.bodyContactAfter<=original.bodyContactBefore,
       renderFrames:dimensions.frames,
       noMobileOverflow:dimensions.scrollWidth<=width+2,
       actualChromeMobileWebGL:true,physicalPhoneApproved:false,
       humanPhotorealismApproved:false,productionModified:false,
       familyAlpha:'HOLD',releaseAuthorized:false};
      results.push(result);
     }
    }
   }
   await page.locator('#logout').click();
   const logout=await page.evaluate(()=>window.ccWardrobe10Diagnostics());
   assert.equal(logout.sourcePhotoCoverageVisible,false);
   assert.equal(logout.viewerMode,'original-photo-2d');
  }finally{await context.close();}
 }
 assert.equal(results.length,48);
 assert.deepEqual([...new Set(results.map(x=>x.width))],[320,390,430]);
 assert.deepEqual([...new Set(results.map(x=>x.rig))],['female','male']);
 assert.deepEqual([...new Set(results.map(x=>x.angle))],[0,90,135,180]);
 assert.equal(new Set(results.map(x=>x.sourceSHA256)).size,2);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await writeFile(output+'/results.json',JSON.stringify({genuineWebGLFrames:48,
  twoAuthenticOriginalDenims:true,mobileSimulatedWidths:[320,390,430],
  rigNames:['female','male'],angles:[0,90,135,180],
  sourceOwnerPrivate:true,realPhysicalPhoneTested:false,
  fullyPhotoRealRearCaptured:false,humanVisualApproved:false,
  releaseAuthorized:false,productionModified:false,familyAlpha:'HOLD',
  cases:results,errors,external},null,2));
 console.log('MOBILE24_GENUINE_SOURCE',JSON.stringify({
  cases:results.length,minBluePixels:Math.min(...results.map(x=>x.blueDenimPixels)),
  maxBluePixels:Math.max(...results.map(x=>x.blueDenimPixels)),
  zeroNewBodyContacts:true,allOriginalSourcesMatched:true,physicalPhoneTested:false}));
}catch(e){
 failures.push(String(e));
 await writeFile(output+'/failure.json',JSON.stringify({failures,errors,external,completed:results},null,2)).catch(()=>{});
 throw e;
}finally{await browser?.close();await new Promise(r=>server.close(r));}
