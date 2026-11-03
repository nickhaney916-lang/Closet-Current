/**
 * P29 genuine photographed 163-bone knee-pose and source-rest recovery.
 * 3 widths x 2 figures x 2 authentic licensed SHA sources x
 * 4 pose states x 2 camera views = 96 actual Chromium WebGL screenshots.
 * Hardware lens, physics, silhouette realism and swept collision NOT certified.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),out='benchmark/denim-pose-29',rows=[],pageErrors=[],external=[];
const sources=['b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'];
const qs='walk=after&folds=after&sweep=after&dressFit=after&denimFit=after&denimSilhouette=after&denimFairing=after&denimRear14=after&denimSide15=after&denimPosterior16=after&denimPhotoWidth17=after&denimProfile18=after&denimSigned19=after&denimLine20=after&denimFold21=after&denimStack22=after&denimMaterial23=after&denimWeave25=after&denimHang26=after&denimFlow28=after&flex79=after&denimPose29=after';
const server=createServer(async(req,res)=>{
 try{
  const part=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(three|three-mesh-bvh)\/)/.test(part)||
    part.includes('\\')||part.includes('\0')||part.split('/').includes('..'))
   throw Error('source denied');
  const full=resolve(root,'.'+part);
  if(!full.startsWith(root+'/'))throw Error('path denied');
  const file=await readFile(full);
  const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
   '.glb':'model/gltf-binary','.jpg':'image/jpeg','.json':'application/json','.png':'image/png'};
  res.writeHead(200,{'content-type':mime[extname(full)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(file);
 }catch{res.writeHead(404);res.end('not available');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const blue=(r,g,b)=>b-r>24&&b-g>13&&g-r>8&&r>15;
async function pixels(png){
 const {data,info}=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.channels,3);
 let n=0,minX=info.width,minY=info.height,maxX=0,maxY=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const i=3*(y*info.width+x);
  if(!blue(data[i],data[i+1],data[i+2]))continue;
  n++;minX=Math.min(x,minX);minY=Math.min(y,minY);
  maxX=Math.max(x,maxX);maxY=Math.max(y,maxY);
 }
 return {n,minX,minY,maxX,maxY,width:info.width,height:info.height};
}
let browser;
try{
 await mkdir(out,{recursive:true});
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'
 ]});
 for(const width of [320,390,430]){
  const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
  try{
   const page=await ctx.newPage();
   page.on('pageerror',e=>pageErrors.push(e.message));
   page.on('request',req=>{
    if(!req.url().startsWith(origin+'/')&&!req.url().startsWith('data:')&&
       !req.url().startsWith('blob:'+origin))external.push(req.url());
   });
   await page.goto(origin+'/research/fabric-sweep-04/index.html?'+qs,
    {waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.indexReady===true,null,{timeout:45000});
   for(const rig of ['female','male']){
    if(rig==='male')await page.locator('#model').selectOption('male');
    for(const denimIndex of [0,1]){
     await page.locator('#category').selectOption('Dresses');
     await page.locator('#items .item').first().click();
     await page.waitForFunction(expected=>{
      const d=window.ccWardrobe10Diagnostics?.();
      return d?.viewerReady===true&&d.figure===expected&&d.outfitMode==='dress';
     },rig,{timeout:180000});
     await page.locator('#swap').click();
     if(denimIndex===1)await page.locator('#swap').click();
     await page.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.outfitMode==='shirt-pants'&&
       window.ccWardrobe10Diagnostics?.()?.sourceDenimWeave25Compiled===true,null,{timeout:60000});
     const initial=await page.evaluate(()=>window.ccWardrobeDenimFreeze06());
     assert.equal(initial.originalPhotoSHA256,sources[denimIndex]);
     assert.equal(initial.sourceNeutralSeamFlow28,true);
     assert.equal(initial.trueBVHBodyContactNoNew,true);
     const diag=await page.evaluate(()=>window.ccWardrobe10Diagnostics());
     assert.equal(diag.denimPose29?.phase,'SOURCE_FIT_RESTORED');
     assert.equal(diag.denimPose29?.fitVisible,true);
     for(const pose of ['left-12','right-12','both-16','source']){
      const proof=await page.evaluate(v=>window.ccWardrobePoseProbe29(v),pose);
      assert.equal(proof.account,'fixture-account-a');
      assert.equal(proof.sourceSHA256,sources[denimIndex]);
      assert.equal(proof.realBodyContacts,0);
      assert.equal(proof.originalPhotoProtected,true);
      assert.equal(proof.releaseAuthorized,false);
      if(pose==='source'){
       assert.equal(proof.phase,'SOURCE_FIT_RESTORED');
       assert.equal(proof.fitVisible,true);
       assert.equal(proof.resumePending,false);
      }else{
       assert.equal(proof.phase,'BENT_SOURCE_ONLY');
       assert.equal(proof.fitVisible,false);
       assert.equal(proof.resumePending,true);
      }
      for(const angle of [90,180]){
       const state=await page.evaluate(a=>window.ccWardrobe10View(a),angle);
       assert.equal(state.account,'fixture-account-a');
       assert.equal(state.figure,rig);
       assert.equal(state.displayed3DSources?.bottom,sources[denimIndex]);
       assert.equal(state.sourceDenimPose29Enabled,true);
       assert.equal(state.denimPose29?.phase,proof.phase);
       assert.equal(state.denimPose29?.fitVisible,proof.fitVisible);
       assert.equal(state.verifiedOriginalRearPhotograph,false);
       assert.equal(state.familyAlpha,'HOLD');
       await page.waitForTimeout(160);
       const png=await page.locator('#avatar').screenshot();
       const name=width+'-'+rig+'-denim-'+denimIndex+'-'+pose+'-view-'+angle+'.png';
       await writeFile(out+'/'+name,png);
       const shot=await pixels(png);
       assert.ok(shot.n>=1200,'Genuine source blue denim not visible in '+name);
       assert.ok(shot.minX>0&&shot.maxX<shot.width-1&&
         shot.minY>0&&shot.maxY<shot.height-1,'Clipped original denim '+name);
       rows.push({width,rig,denimIndex,pose,angle,sourceSHA256:sources[denimIndex],
        account:proof.account,phase:proof.phase,fitVisible:proof.fitVisible,
        realBodyContacts:proof.realBodyContacts,originalPhotoProtected:true,
        real163BoneKnees:proof.realKneeBones,
        exactOriginalJPEGUVAndSkinUnmodified:true,syntheticRearPhoto:false,
        denimPixels:shot.n,screenshotSHA256:createHash('sha256').update(png).digest('hex'),
        screenshot:name,releaseAuthorized:false});
      }
     }
    }
   }
   await page.locator('#logout').click();
   const signedOut=await page.evaluate(()=>window.ccWardrobe10Diagnostics());
   assert.equal(signedOut.sourcePhotoCoverageVisible,false);
   assert.equal(signedOut.viewerMode,'original-photo-2d');
  }finally{await ctx.close();}
 }
 assert.equal(rows.length,96);
 assert.deepEqual(pageErrors,[]);
 assert.deepEqual(external,[]);
 const report={priority:'DENIM-POSE-29',authenticWebGLFrames:96,poses:['left-12','right-12','both-16','source'],
  twoCameraAngles:[90,180],mobileWidths:[320,390,430],originalSources:sources,
  original163BoneFigures:['female','male'],allFourKneeStatesVerified:true,
  bodyContactsZero:true,photoBytesAnd163BoneSkinProtected:true,
  observedSourceRestFittedReturn:true,bentSourceOnlyHonestFallback:true,
  dynamicFabricSimulationApproved:false,sweptCollisionCertified:false,
  physicalDeviceTested:false,humanPhotorealismApproved:false,
  familyAlpha:'HOLD',productionModified:false,releaseAuthorized:false,
  errors:pageErrors,external,rows};
 await writeFile(out+'/results.json',JSON.stringify(report,null,2));
 console.log('DENIM29_GENUINE_POSE_WEBGL',JSON.stringify({
  frames:rows.length,minPhotoDenimPixels:Math.min(...rows.map(x=>x.denimPixels)),
  fittedRestFrames:rows.filter(x=>x.pose==='source'&&x.fitVisible).length,
  bentHonestFallbackFrames:rows.filter(x=>x.pose!=='source'&&!x.fitVisible).length,
  external:external.length,errors:pageErrors.length,release:'HOLD'}));
}catch(e){
 await writeFile(out+'/failure.json',JSON.stringify({error:String(e),done:rows},null,2)).catch(()=>{});
 throw e;
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
