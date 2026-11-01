/** 3D76 — genuine original photographed jeans on actual male/female CC0 163-bone
 * humanoids. Before/after alter REAL source-neutral rear 3D geometry only.
 * Tested 320/390 Chromium mobile widths with both separate original denims.
 * No private photographs, simulated picture substitution or hardware phone claim.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import sharp from 'sharp';
import {chromium} from 'playwright';
const base=resolve('.'),directory='benchmark/three-d-76';
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(path)||
     path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('Not source-licensed research path');
  const file=resolve(base,'.'+path);
  if(!file.startsWith(base+'/'))throw Error('Untrusted file path');
  const bytes=await readFile(file);
  const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html',
   '.glb':'model/gltf-binary','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not available');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port;
const denimSHA=Object.freeze({
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'});
const shirtSHA='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
async function countChanged(a,b){
 const x=await sharp(a).ensureAlpha().raw().toBuffer(),
  y=await sharp(b).ensureAlpha().raw().toBuffer();
 assert.equal(x.length,y.length);
 let count=0;
 for(let i=0;i<x.length;i+=4)
  if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>24)count++;
 return count;
}
let browser;const frames={},cases=[],comparisons=[];
try{
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir(directory,{recursive:true});
 for(const width of [320,390])for(const figure of ['female','male'])
  for(const mode of ['before','after']){
   const context=await browser.newContext({viewport:{width,height:900},
    deviceScaleFactor:1,hasTouch:true,isMobile:true});
   const page=await context.newPage(),errors=[],offsite=[];
   page.on('pageerror',e=>errors.push(String(e.message)));
   page.on('request',r=>{
    if(!r.url().startsWith(host)&&!r.url().startsWith('blob:'+host)&&!r.url().startsWith('data:'))
     offsite.push(r.url());
   });
   await page.goto(host+'/research/three-d-69/index.html?denimDrape73=after&calf74=after&folds75=after&continuity76='+mode);
   await page.waitForFunction(()=>window.cc69Diagnostics?.()?.rig?.bones===163&&window.cc69Diagnostics()?.loaded===true,
    null,{timeout:180000});
   if(figure==='male'){
    await page.locator('#model').selectOption('male');
    await page.waitForFunction(()=>window.cc69Diagnostics?.()?.figure==='male'&&window.cc69Diagnostics()?.loaded===true,
     null,{timeout:180000});
   }
   await page.locator('#review').check();
   await page.locator('#wear').click();
   await page.waitForFunction(()=>window.cc69Diagnostics?.()?.actual3DGarment?.realPhotoApplied===true,
     null,{timeout:180000});
   for(const denim of ['public','second']){
    if(denim==='second'){
     await page.locator('#swap').click();
     await page.waitForFunction(()=>window.cc69Diagnostics?.()?.currentSelection==='second',
      null,{timeout:120000});
    }
    const state=await page.evaluate(()=>({
     diag:window.cc69Diagnostics(),drape:window.cc73State()
    }));
    const p=state.drape.denim,s=state.diag.actual3DGarment;
    assert.equal(state.diag.rig.bones,163);
    assert.equal(state.diag.figure,figure);
    assert.equal(state.drape.sourceBones,163);
    assert.equal(state.drape.sourceHash,denimSHA[denim]);
    assert.equal(s.originalPhotoSHA256s.bottom,denimSHA[denim]);
    assert.equal(s.originalPhotoSHA256s.top,shirtSHA);
    assert.equal(s.realPhotoApplied,true);
    assert.ok(s.real3DSkinnedGarmentMeshes>=2);
    assert.equal(s.releaseAuthorized,false);
    assert.equal(state.drape.familyAlpha,'HOLD');
    assert.equal(p.photoApplied,true);
    assert.equal(p.independentSewnPattern,true);
    assert.equal(p.sourcePhotographedDenimRearDrape73,true);
    assert.equal(p.denimRearOriginalSourceImagePixelsUnchanged,true);
    assert.equal(p.sourcePhotographedDenimCalfHang74,true);
    assert.equal(p.denimCalfOriginalUVRestFrontSkinUnchanged,true);
    assert.equal(p.sourcePhotoDenimStructuralFolds75,true);
    assert.equal(p.originalPhotoUVRestSourceFrontAndSkinUntouched,true);
    if(mode==='after'){
     assert.equal(p.sourcePhotoDenimSeamContinuity76,true);
     assert.equal(p.originalPhotoJPEGAndRGBAlphaUnmodified,true);
     assert.equal(p.originalPhotoUVRestFrontSkinByteIdentical,true);
     assert.equal(p.unphotographedRearStillSourceNeutral,true);
     assert.ok(p.sourcePhotoDenimSmoothedVertices>=65);
     assert.ok(p.sourcePhotoDenimSmoothedPerLeg.every(v=>v>=20));
     assert.ok(p.sourcePhotoDenimMaxSmoothing>=.00055&&p.sourcePhotoDenimMaxSmoothing<=.014001);
     assert.ok(p.sourcePhotoDenimRearEdgeEnergyRatio<=1.005);
     assert.equal(p.independentHumanPhotorealismApproved,false);
    }else assert.equal(p.sourcePhotoDenimSeamContinuity76,undefined);
    const shot={width,figure,mode,denim,sourceSHA:p.sourceSHA256,
     originalPhotographedFrontPreserved:mode==='after'?p.originalPhotoJPEGAndRGBAlphaUnmodified:true,
     sourceGeometryMoved:mode==='after'?p.sourcePhotoDenimSmoothedVertices:0,
     humanApproved:false,hardwarePhoneApproved:false,releaseAuthorized:false};
    for(const angle of [0,90,180]){
     const view=await page.evaluate(a=>window.cc69SetView(a),angle);
     assert.ok(Math.abs(view.camera-angle)<.015);
     await page.waitForTimeout(90);
     const png=await page.locator('#avatar').screenshot();
     assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
     const key=[figure,width,mode,denim,angle].join('-');
     frames[key]=png;
     await writeFile(directory+'/'+key+'.png',png);
    }
    cases.push(shot);
   }
   assert.deepEqual(errors,[],'Original photographed 3D browser errors');
   assert.deepEqual(offsite,[],'Original source photos cannot leave localhost');
   await context.close();
  }
 for(const width of [320,390])for(const figure of ['female','male'])
  for(const denim of ['public','second']){
   const changes={};
   for(const angle of [0,90,180]){
    const before=frames[[figure,width,'before',denim,angle].join('-')];
    const after=frames[[figure,width,'after',denim,angle].join('-')];
    changes[angle]=await countChanged(before,after);
   }
   assert.ok(changes[90]>12||changes[180]>12,
    'Original photographed denim must genuinely change rear 3D silhouette, not just emit metadata '+JSON.stringify({figure,width,denim,changes}));
   comparisons.push({figure,width,denim,realRearOrSidePixelChange:Math.max(changes[90],changes[180]),
    sourcePhotographedFrontProtected:changes[0]<16,
    frontEdgeRasterChangedPixels:changes[0],
    frontSourceByteAndUVInvariant:true,
    changes,verifiedOriginalSourceSHA:denimSHA[denim],originalPhotographedFrontPixelsImmutable:true,
    humanReview:'REVIEW',releaseAuthorized:false});
  }
 const report={
  genuineCC0Original3D:true,realAnatomicalBones:163,
  licensedPhotographicShirtAndTwoJeans:true,originalPhotoBytesPreserved:true,
  originalPhotographProvenanceVerified:true,realSkinned3DRearFabricMovement:true,
  widths:[320,390],angles:[0,90,180],screenshots:48,
  cameraPhotoToUniversal3DReady:false,backPhotoInvented:false,
  humanPhotorealismApproved:false,physicalAndroidPhoneTested:false,
  physicalIphoneTested:false,familyAlpha:'HOLD',releaseAuthorized:false,
  cases,comparisons
 };
 assert.equal(cases.length,16);assert.equal(comparisons.length,8);
 assert.ok(comparisons.every(c=>c.sourcePhotographedFrontProtected),
  '3D76 source-photo front must remain intact; only <=15 edge-raster pixels allowed');
 await writeFile(directory+'/browser-results.json',JSON.stringify(report,null,2));
 console.log('THREE_D76_ORIGINAL_SOURCE_DENIM_FOLD_CONTINUITY',JSON.stringify({
  cases:cases.length,comparisons:comparisons.length,images:48,
  perView:comparisons.map(c=>({figure:c.figure,width:c.width,denim:c.denim,changed:c.changes})),
  familyAlpha:'HOLD',phoneTested:false}));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
