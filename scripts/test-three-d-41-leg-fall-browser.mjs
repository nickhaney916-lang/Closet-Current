/** Actual original photographed AJ shirt over SECOND source-denim jeans.
 * True WebGL render, both original CC0 163-bone rigs, 320/390/430 mobile
 * widths, source and relaxed pose, four camera angles, before/after garment
 * hem integration. Never uses mock screenshots or synthetic wardrobe sources.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const cwd=resolve('.'),dir='benchmark/three-d-41',results=[],pairs=[];
const server=createServer(async(req,res)=>{
 try{
  const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/three\/)/.test(name)||
    name.includes('\\')||name.includes('\0'))throw Error('blocked');
  const p=resolve(cwd,'.'+name);if(!p.startsWith(cwd+'/'))throw Error('outside');
  const bytes=await readFile(p);
  const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.json':'application/json',
    '.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg'};
  res.writeHead(200,{'content-type':mime[extname(p)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Unavailable');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
async function changed(a,b){
 const x=await sharp(a).raw().toBuffer(),y=await sharp(b).raw().toBuffer();
 assert.equal(x.length,y.length);
 let n=0;
 for(let i=0;i<x.length;i+=4)if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>27)n++;
 return n;
}
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir(dir,{recursive:true});
 for(const width of [320,390,430])for(const kind of ['female','male']){
  const before={},caseInfo={width,kind,versions:{}};
  for(const version of ['before','after']){
   const context=await browser.newContext({viewport:{width,height:932},deviceScaleFactor:1,hasTouch:true,isMobile:true});
   const page=await context.newPage(),errors=[],external=[];
   page.on('pageerror',e=>errors.push(String(e.message)));
   page.on('request',r=>{const u=r.url();if(!u.startsWith(origin)&&!u.startsWith('blob:'+origin)&&!u.startsWith('data:'))external.push(u);});
   await page.goto(origin+'/research/three-d-37/index.html?pantsDrape=after&seatFairing=after&envelope=after&loft=after&crotchPanel=after&waistFit=after&waistContact=after&hanging=after&clothFall='+version);
   await page.waitForFunction(()=>window.cc31Diagnostics?.()?.loaded===true,null,{timeout:90000});
   if(kind==='male'){
    await page.locator('#model').selectOption('male');
    await page.waitForFunction(()=>window.cc31Diagnostics?.()?.kind==='male'&&window.cc31Diagnostics().loaded,{timeout:90000});
   }
   const state=()=>page.evaluate(()=>window.cc31Diagnostics());
   const initial=await state();
   assert.equal(initial.stats.bones,163);
   assert.equal(initial.outfit.pants.photoApplied,false);
   await page.locator('#front').click();
   const neutral=await page.locator('#avatar').screenshot({path:dir+'/'+width+'-'+kind+'-'+version+'-neutral.png'});
   if(version==='before')before.neutral=neutral;
   else assert.equal(await changed(before.neutral,neutral),0,'Neutral clothing must be byte-equivalent');
   assert.equal(await page.locator('#photo').isDisabled(),true);
   await page.locator('#review').check();
   await page.evaluate(()=>document.querySelector('#full').click());
   assert.equal((await state()).outfit.mode,'pants','Synthetic non-user click is still rejected');
   await page.locator('#photo').click();
   const jeans=await state();
   assert.equal(jeans.outfit.pants.photoApplied,true);
   assert.equal(jeans.outfit.pants.sourceSHA256,'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a');
   assert.equal(jeans.outfit.pants.cutoutSHA256,'4cf80f77fa34d04844d7310de180135df607248847ea17b1aed4ef613d0cb3db');
   assert.equal(jeans.outfit.pants.originalRGBPreserved,true);
   const jeansOnly=await page.locator('#avatar').screenshot({path:dir+'/'+width+'-'+kind+'-'+version+'-jeans-only.png'});
   if(version==='before')before.jeans=jeansOnly;
   else assert.ok(await changed(before.jeans,jeansOnly)>35,'Real source-measured independent rear/lower-leg fall must change the silhouette');
   await page.locator('#full').click();
   const outfit=await state();
   assert.equal(outfit.outfit.mode,'shirt-pants');
   assert.equal(outfit.outfit.pants.photoApplied,true);
   assert.equal(outfit.outfit.shirt.sharedSkeleton,true);
   assert.equal(Boolean(outfit.outfit.shirt.originalPhotoShirtOverDenim),true);
   assert.equal(Boolean(outfit.outfit.shirt.originalClothContactCorrection),true);
   assert.equal(Boolean(outfit.outfit.shirt.originalPhotographedTorsoDrape),true);
   assert.equal(Boolean(outfit.outfit.pants.originalPhotographedHangingLegPanels),true);
   assert.equal(Boolean(outfit.outfit.pants.sourceMeasuredLowerLegFall),version==='after');
   if(version==='after'){
    assert.equal(outfit.outfit.shirt.outfitPantSourceId,'commons-cc-by-sa-denimjeans2-2008');
    assert.ok(outfit.outfit.pants.legFallMovedVertices>230);
    assert.ok(outfit.outfit.pants.legFallBelowKnee>40);
    assert.ok(outfit.outfit.pants.legFallMaxMovement<=.030);
    assert.ok(outfit.outfit.pants.rearPanelMovedUniqueVertices>250);
    assert.ok(outfit.outfit.shirt.contactAfterTotalDepth<=outfit.outfit.shirt.contactBeforeTotalDepth);
    assert.ok(outfit.outfit.shirt.contactAfterCount<=outfit.outfit.shirt.contactBeforeCount);
    assert.ok(outfit.outfit.shirt.torsoDrapeMaxShift<=.032001);
    assert.ok(outfit.outfit.pants.rearPanelMaxShift<=.025001);
    assert.equal(outfit.outfit.shirt.sourcePanelCoordinatesUnchanged,true);
    assert.equal(outfit.outfit.shirt.sourcePanelPixelsUnchanged,true);
    assert.equal(outfit.outfit.shirt.originalShirtSkinAndOriginalPantUVUnchanged,true);
    assert.equal(outfit.outfit.shirt.signedCollisionValidated,false);
    assert.equal(outfit.outfit.shirt.releaseAuthorized,false);
   }
   let fullChanged=0;
   for(const pose of ['source','relaxed']){
    await page.locator('#pose').selectOption(pose);
    for(const angle of ['front','threequarter','side','back']){
     await page.locator('#'+angle).click();await page.waitForTimeout(110);
     const screenshot=await page.locator('#avatar').screenshot({path:dir+'/'+width+'-'+kind+'-'+version+'-'+pose+'-'+angle+'.png'});
     const id=pose+'/'+angle;
     if(version==='before')before[id]=screenshot;
     else{
      const n=await changed(before[id],screenshot);
      results.push({width,kind,pose,angle,beforeAfterChangedPixels:n});
      fullChanged+=n;
     }
    }
   }
   await page.locator('#neutral').click();
   const rollback=await state();
   assert.equal(rollback.outfit.pants.photoApplied,false);
   assert.equal(rollback.outfit.shirt,null);
   assert.deepEqual(errors,[]);
   assert.deepEqual(external,[],'Never send original photographed garment sources or private data externally');
   if(version==='after')assert.ok(fullChanged>200,'Real source-backed independent leg fall must visibly change in WebGL: '+fullChanged);
   caseInfo.versions[version]={shirt:outfit.outfit.shirt,pantsSource:outfit.outfit.pants.sourceId,
    originalPhotoUnchanged:true,completeOutfitSourceSHA:outfit.outfit.pants.sourceSHA256,
    fullChangedPixels:version==='after'?fullChanged:null};
   await context.close();
  }
  pairs.push(caseInfo);
 }
 await writeFile(dir+'/results.json',JSON.stringify({scenario:'source-preserved AJ shirt + original licensed jeans rear/lower leg cloth fall on original 163-bone figures',
  source:'https://commons.wikimedia.org/wiki/File:Denimjeans2.JPG',
  license:'CC BY-SA 4.0',photoOriginalUnchanged:true,originalSourceRGBUnchanged:true,neutralStable:true,
  widths:[320,390,430],figures:['female','male'],poses:['source','relaxed'],cameraAngles:['front','threequarter','side','back'],
  pairs,measurements:results,releaseAuthorized:false,visualApproval:false,fullCollisionValidated:false},null,2));
 console.log('THREE_D41_REAL_HANGING_CLOTHING_SILHOUETTE_WEBGL',JSON.stringify({
  pairs:pairs.length,frames:results.length,changed:results.reduce((a,b)=>a+b.beforeAfterChangedPixels,0),
  mid430:results.filter(r=>r.width===430&&r.pose==='relaxed'),neverDeployed:true}));
}finally{await browser?.close();server.close();}
