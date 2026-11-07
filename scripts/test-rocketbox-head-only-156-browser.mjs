/**
 * P156: 48 actual isolated licensed-face GLB WebGL mobile screenshot proof.
 * Source body/jacket/pants geometry is NOT present in this re-packed GLB.
 * Only tests research male/female source heads, not owner wardrobe fitting.
 */
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {CANDIDATES155} from '../research/dual-human-foundation-candidate-155/foundation-manifest.mjs';
const folder='benchmark/rocketbox-wardrobe-separation-156';
const platform=process.env.P156_ENGINE||'chromium';
const provider=platform==='webkit'?webkit:platform==='chromium'?chromium:null;
if(!provider)throw Error('P156 only actual Chromium or WebKit accepted');
const shots=['front','side','back','face'],widths=[320,390,430];
const hash=b=>createHash('sha256').update(b).digest('hex');
const files=new Map([
 ['/lab','research/rocketbox-wardrobe-separation-156/head-only-source-lab.html'],
 ['/heads/female-licensed-face-hair-only.glb',folder+'/heads/female-licensed-face-hair-only.glb'],
 ['/heads/male-licensed-face-hair-only.glb',folder+'/heads/male-licensed-face-hair-only.glb']
]);
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  let file=files.get(path);
  if(!file&&path.startsWith('/vendor/three/')){
   const x=path.slice('/vendor/three/'.length);
   if(!/^(build\/three\.(?:module|core)\.js|examples\/jsm\/[a-zA-Z0-9_./-]+\.js)$/.test(x)||
    x.includes('..'))throw Error('P156 forbidden vendor path');
   file='node_modules/three/'+x;
  }
  if(!file)throw Error('P156 nonapproved request');
  const b=await readFile(resolve(file)),typ=extname(file)==='.html'?'text/html; charset=utf-8':
   extname(file)==='.js'?'text/javascript; charset=utf-8':
   extname(file)==='.glb'?'model/gltf-binary':'application/octet-stream';
  res.writeHead(200,{'Content-Type':typ,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(b);
 }catch(e){res.writeHead(404);res.end('P156 nonapproved local source');}
});
const anatomy=JSON.parse(await readFile(folder+'/audit/real-source-anatomy.json'));
const extraction=JSON.parse(await readFile(folder+'/audit/safe-head-extraction.json'));
assert.equal(anatomy.originalPinnedMITAssetsExamined,2);
assert.equal(extraction.extractedMaleAndFemaleHeadOnlyGLBs,2);
for(const x of extraction.records){
 const b=await readFile(folder+'/heads/'+x.figure+'-licensed-face-hair-only.glb');
 assert.equal(hash(b),x.sha256,'P156 original head-only source SHA changed');
 assert.ok(b.length<x.originalBytes);
}
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
let browser=null;const evidence=[],issues=[];
try{
 browser=await provider.launch({headless:true,
  args:platform==='chromium'?['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']:[]});
 for(const width of widths){
  const context=await browser.newContext({
   viewport:{width,height:790},deviceScaleFactor:1,locale:'en-US',
   colorScheme:'light',reducedMotion:'reduce',serviceWorkers:'block'});
  for(const c of CANDIDATES155)for(const view of shots){
   const page=await context.newPage(),errors=[],offsite=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
   page.on('request',req=>{
    const u=req.url();
    if(!u.startsWith(base)&&!u.startsWith('blob:'+base)&&!u.startsWith('data:'))
     offsite.push(u);
   });
   try{
    await page.goto(base+'/lab?figure='+c.key+'&view='+view,
     {waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForFunction(()=>{
     const s=window.__cc156Status?.();
     return Boolean(s?.loaded&&s?.frames>8&&s?.drawCalls>0)||Boolean(s?.error);
    },null,{timeout:55000});
    await page.waitForTimeout(200);
    const st=await page.evaluate(()=>window.__cc156Status());
    if(st.error)throw Error(st.error);
    assert.equal(st.figure,c.key);
    assert.equal(st.genuineSkinnedSourceHead,true);
    assert.equal(st.sourceBodyMaterialPresent,false);
    assert.equal(st.originalVendorGarmentStillVisible,false);
    assert.equal(st.originalUserGarmentApplied,false);
    assert.equal(st.original163BoneWardrobeUnmodified,true);
    assert.equal(st.maxBoneCount,80);
    assert.ok(st.skinnedMeshes>=1&&st.drawCalls>=1&&st.triangles>=100);
    assert.equal(st.actualWebGL,true);
    assert.ok(st.headWidth<.65&&st.headHeight<.75&&st.headHeight>.14);
    const prefix=c.key==='female'?'f007_':'m006_';
    assert.deepEqual([...st.sourceMaterialNames].sort(),[prefix+'head',prefix+'opacity'].sort());
    assert.equal(st.releaseAuthorized,false);
    assert.equal(st.familyAlpha,'HOLD');
    assert.equal(offsite.length,0);
    assert.equal(errors.length,0,errors.join(' | '));
    const png=await page.screenshot({fullPage:true,animations:'disabled'});
    const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
    assert.equal(meta.width,width);
    assert.ok(png.length>9000);
    assert.ok(stats.channels.some(x=>x.stdev>9));
    await mkdir(folder+'/screens/'+platform,{recursive:true});
    const file=c.key+'-'+view+'-'+width+'.png';
    await writeFile(folder+'/screens/'+platform+'/'+file,png);
    evidence.push({platform,width,figure:c.key,view,file,
     sha256:hash(png),pngBytes:png.length,
     renderGeometryTriangles:st.triangles,
     originalSourceRigBones:st.maxBoneCount,
     originalBakedGarmentGeometryPresent:false,
     separatedHeadAndHairOriginalTextures:true,
     original163BonePhotographedOutfitUnmodified:true,
     noOffsiteNetworkRequests:true,
     screenshotHeight:meta.height,realWebGL:true,
     humanPhotorealismIndependentlyApproved:false,
     releaseAuthorized:false,familyAlpha:'HOLD'});
   }catch(e){
    issues.push({platform,width,figure:c.key,view,reason:String(e),
     errors,offsite});
    throw e;
   }finally{await page.close();}
  }
  await context.close();
 }
 assert.equal(evidence.length,24);
 for(const width of widths)for(const c of CANDIDATES155){
  const a=evidence.find(x=>x.width===width&&x.figure===c.key&&x.view==='front');
  const b=evidence.find(x=>x.width===width&&x.figure===c.key&&x.view==='back');
  if(!a||!b||a.sha256===b.sha256)throw Error('P156 real source head 3D must rotate');
 }
 await mkdir(folder+'/audit',{recursive:true});
 await writeFile(folder+'/audit/'+platform+'-face-only.json',JSON.stringify({
  priority:156,platform,actualRealSkinnedHeadScreenshots:evidence.length,
  sourceOnlyMaleFemale:2,garmentMaterialsAndClothingGeometryRemoved:true,
  originalOwnerPhotoOutfitFallbackRequired:true,
  actualPhotoGarmentRetargetingVerified:false,
  familyAlpha:'HOLD',releaseAuthorized:false,evidence
 },null,2)+'\n');
 console.log('P156_PHYSICALLY_SEPARATED_HEAD_REAL_WEBGL '+JSON.stringify({
  platform,headOnly3DScreenshots:evidence.length,
  both80BoneMaleFemaleRealGLB:true,
  sourceJacketAndPantsGeometryPresent:false,
  savedWardrobeOutfitOn163BoneOriginal:true,
  fullPhotoGarmentRetarget:false,
  familyAlpha:'HOLD'
 }));
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
 if(issues.length){
  await mkdir(folder+'/audit',{recursive:true});
  await writeFile(folder+'/audit/'+platform+'-failure.json',JSON.stringify(issues,null,2)+'\n');
 }
}
