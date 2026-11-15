/**
 * MAIN1054 M47 genuine original P93 vs M45 source color-only vs M45 front V-neck visibility in detached
 * P92 native WebGL dress on genuine licensed P541 163-bone male/female rigs.
 *
 * This test temporarily fulfills Work47 manifest and CUTOUT PNG over LOCAL
 * HTTP only. SHA checks against actual original bytes continue to run inside
 * existing ORIGINAL Three.js source renderer. No consumer/public/, donor
 * original source, private wardrobe, owners, Supabase or hosted runtime edit.
 *
 * One screenshot proves no human source fidelity, no back-photo observation,
 * no physical phone, no continuous collision/strain or 3D approval. The
 * original actual source photo 2D remains the only consumer fallback.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {
 M46_SOURCE,verifyRealPhotoMaskRenderPair46,
 makeResearchOnlyRendererMaskManifest46
} from '../research/main1054-3d46/original-source-p93-m45-render-lease.mjs';
import {
 M47,createResearchVNeckFrontAlphaVisibility47,judgeResearchVNeckVisibility47
} from '../research/main1054-3d47/fragment-visibility-trial.mjs';

const browserName=process.env.M47_ENGINE||'chromium';
assert.ok(['chromium','webkit'].includes(browserName),'actual native research browser required');
const work=resolve('.'),p92=resolve('.m46-p92'),donor=resolve('.native05-donor-541');
assert.notEqual(work,p92);assert.notEqual(work,donor);assert.notEqual(p92,donor);
const sha=b=>createHash('sha256').update(b).digest('hex');
const originalSource=await readFile(join(donor,'benchmark/work47/assets/commons-0053.jpg'));
const originalMask=await readFile(join(donor,'benchmark/work47/assets/commons-0053.png'));
const directory='benchmark/main45-licensed-vneck-photo-candidate';
const p93=await readFile(join(directory,'P93-alpha-only-proposal-NOT-APPROVED.png'));
const m45=await readFile(join(directory,'M45-vneck-local-tone-proposal-UNAPPROVED.png'));
const manifestOriginalBytes=await readFile(join(donor,'benchmark/work47/manifest.json'));
const manifest=JSON.parse(manifestOriginalBytes.toString('utf8'));
const actualReceipt=JSON.parse(await readFile(join(directory,
 'actual-source-candidate-metrics-NOT-APPROVED.json'),'utf8'));
assert.equal(sha(originalSource),M46_SOURCE.originalJpegSHA256);
assert.equal(sha(originalMask),M46_SOURCE.work47PNG_SHA256);
assert.equal(sha(p93),M46_SOURCE.p93PNG_SHA256);
assert.equal(sha(m45),actualReceipt.separateUnapprovedCandidatePNG_SHA256);
const parts=await Promise.all([originalSource,originalMask,p93,m45].map((bytes,i)=>
 sharp(bytes)[i===0?'rotate':'ensureAlpha']().ensureAlpha().raw().toBuffer({resolveWithObject:true})));
for(const {info} of parts)
 assert.deepEqual([info.width,info.height,info.channels],[1920,2880,4]);
const maskProof=verifyRealPhotoMaskRenderPair46({
 originalJpegSHA256:sha(originalSource),
 work47PngSHA256:sha(originalMask),
 p93PngSHA256:sha(p93),
 m45PngSHA256:sha(m45),
 sourceRGBA:parts[0].data,originalWork47RGBA:parts[1].data,
 p93RGBA:parts[2].data,m45RGBA:parts[3].data,
 width:1920,height:2880,sourceMeasure:actualReceipt
});
assert.equal(maskProof.additionalM45AlphaRemoved,4890);
assert.equal(maskProof.releaseAuthorized,false);
const variants={
 P93:{png:p93,digest:sha(p93)},
 M45:{png:m45,digest:sha(m45)},
 M45_HOLE:{png:m45,digest:sha(m45)}
};
const memoryManifest={
 P93:makeResearchOnlyRendererMaskManifest46(manifest,{
  pngSHA256:variants.P93.digest,variant:'P93',sourcePair:maskProof}),
 M45:makeResearchOnlyRendererMaskManifest46(manifest,{
  pngSHA256:variants.M45.digest,variant:'M45',sourcePair:maskProof}),
 M45_HOLE:makeResearchOnlyRendererMaskManifest46(manifest,{
  pngSHA256:variants.M45_HOLE.digest,variant:'M45',sourcePair:maskProof})
};
assert.equal(sha(manifestOriginalBytes),sha(await readFile(join(donor,'benchmark/work47/manifest.json'))));
const originalDressJS=await readFile(join(donor,'research/three-d-14/dress-shell.mjs'),'utf8');
const gitBlobSHA1=createHash('sha1').update('blob '+Buffer.byteLength(originalDressJS)+'\0').update(originalDressJS).digest('hex');
assert.equal(gitBlobSHA1,M47.originalGitBlobSHA1,'actual P541 original 3D dress shader was modified by a donor; cannot trust research patch');
const visibilityPatch=createResearchVNeckFrontAlphaVisibility47({
 originalDressShaderJS:originalDressJS,originalGitBlobSHA1:gitBlobSHA1,
 variant:M47.materialMode,approvedForRelease:false
});
const donorReviewHtml=await readFile(join(p92,'research/mission2-p91/native-drape-review.html'),'utf8');
const htmlAnchor="const source=await loadLicensedCutout('commons-0053',{manifest,reviewConfirmed:true});";
assert.equal(donorReviewHtml.split(htmlAnchor).length,2,'unchanged true P92 research viewer source required');
const inspectedHtml=donorReviewHtml.replace(htmlAnchor,htmlAnchor+'\nwindow.__m47OriginalSourceCropRect=[...source.cropRect];');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.json':'application/json','.png':'image/png','.jpg':'image/jpeg',
 '.glb':'model/gltf-binary','.wasm':'application/wasm','.css':'text/css'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname.includes('..')||pathname.includes('\\')||pathname.includes('\0'))
   throw Error('unsafe source path');
  let root,filename;
  if(pathname.startsWith('/donor/')){
   root=donor;filename=pathname.slice('/donor/'.length);
  }else if(pathname.startsWith('/benchmark/')){
   root=donor;filename=pathname.slice(1);
  }else if(pathname.startsWith('/research/')){
   root=p92;filename=pathname.slice(1);
  }else if(pathname.startsWith('/node_modules/')){
   root=work;filename=pathname.slice(1);
  }else throw Error('private or non-original source disallowed');
  const file=resolve(root,filename);
  if(!file.startsWith(root+'/'))throw Error('escaped original research root');
  const data=pathname==='/research/mission2-p91/native-drape-review.html'?
   Buffer.from(inspectedHtml):await readFile(file);
  res.setHeader('content-type',mime[extname(file)]||'application/octet-stream');
  res.setHeader('cache-control','no-store');
  res.end(data);
 }catch{res.writeHead(404);res.end('missing original research asset');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const result={schema:'MAIN1054_M47_ORIGINAL_P93_M45_BLEND_VS_TRUE_FRAGMENT_ALPHA_HOLE_AB/v1',
 engine:browserName,originalLicensedSourceSHA256:M46_SOURCE.originalJpegSHA256,
 originalSourceRGBPreserved:true,
 originalP93PngSHA256:maskProof.untouchedP93PngSHA256,
 newUnapprovedM45PNG_SHA256:maskProof.separateUnapprovedM45PngSHA256,
 originalSourceP93AlphaChanged:12961,m45ExtraSourceAlphaTransparent:4890,
 originalWork47AndDonorManifestsUnchanged:true,
 figures:['female','male'],poses:['source','blend-50','relaxed'],
 views:['front','side'],variants:['P93','M45','M45_HOLE'],
 sourceCropRects:{},sourceShaderOriginalGitBlobSHA1:gitBlobSHA1,
 actualOriginalSourceShaderRemainsUnchangedOnDisk:true,
 alteredRendererModuleOnlyInM45HolePage:true,
 noActualClothGeometryCutOrNewSeam:true,
 actualResearchNativeWebGL2:false,
 exactAnatomical163Bones:false,realPhotographedMaskTextureCompared:false,
 photoUVGeometryCrossConditionIdentityNotYetProven:true,
 noIndependentHumanOriginalTextureAcceptance:true,
 originalPhoto2DFallbackRequired:true,physicalDevicesNotTested:true,
 continuousClothBodyOrSelfCollisionNotCertified:true,
 sourcePhotoRearUnobserved:true,
 scenes:[],comparisons:[],browserErrors:[],networkRequests:[],
 realOwnerSigned3DAdmitted:false,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'};
const root=join('benchmark/main47-original-vneck-alpha-visibility',browserName);
await mkdir(root,{recursive:true});
let browser;
try{
 browser=await ({chromium,webkit})[browserName].launch({
  headless:true,...(browserName==='chromium'?{args:[
   '--use-gl=angle','--use-angle=swiftshader',
   '--enable-unsafe-swiftshader','--enable-webgl']}: {})
 });
 for(const variant of ['P93','M45','M45_HOLE']){
  const context=await browser.newContext({
   viewport:{width:390,height:820},deviceScaleFactor:1,
   serviceWorkers:'block'
  });
  const page=await context.newPage();
  page.on('crash',()=>result.browserErrors.push('real-source browser crashed'));
  page.on('pageerror',e=>result.browserErrors.push(String(e.message).slice(0,400)));
  page.on('console',m=>{
   if(m.type()==='error'&&/WebGLProgram|shader error|ERROR: 0:/i.test(m.text()))
    result.browserErrors.push(m.text().slice(0,400));
  });
  const seen={manifest:0,cutout:0,ephemeralSourceShaderPatch:0};
  await page.route('**/*',route=>{
   const url=route.request().url();
   if(url===origin+'/benchmark/work47/manifest.json'){
    seen.manifest++;
    return route.fulfill({status:200,contentType:'application/json',
     body:JSON.stringify(memoryManifest[variant])});
   }
   if(url===origin+'/benchmark/work47/assets/commons-0053.png'){
    seen.cutout++;
    return route.fulfill({status:200,contentType:'image/png',
     body:variants[variant].png});
   }
   if(url.startsWith(origin+'/')||url.startsWith('data:')||url.startsWith('blob:'))
    return route.continue();
   result.networkRequests.push(url.slice(0,100));
   return route.abort();
  });
  // Two ephemeral read-only responses; actual donor HTML and dress shader remain byte-exact on disk.
  // The local HTTP server serves an in-memory read-only original source HTML
  // measurement rather than depending on browser interception ordering.
  if(variant==='M45_HOLE')await page.route('**/donor/research/three-d-14/dress-shell.mjs',route=>{
   seen.ephemeralSourceShaderPatch++;
   return route.fulfill({status:200,contentType:'text/javascript',body:visibilityPatch.patchedResearchModuleText});
  });
  const flags=['photoDress175','photoDressContact52','photoDressDistance53',
   'photoDressTopology54','photoDressEdges55','photoDressBoundaries56',
   'photoDressLandmarks57','photoDressContact58','photoDressBodyBands59',
   'photoDressTorsoTrial60','photoDressStrain61'];
  try{
   await page.goto(origin+'/research/mission2-p91/native-drape-review.html?'+
    flags.map(f=>f+'=research').join('&'),{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.review87?.ready||
    window.review87?.errors?.length,null,{timeout:120000});
   assert.deepEqual(await page.evaluate(()=>window.review87.errors),[],
    'REAL original-source 3D licensed mask setup failed');
   const crop=await page.evaluate(()=>window.__m47OriginalSourceCropRect);
   assert.ok(Array.isArray(crop)&&crop.length===4&&crop.every(Number.isFinite),
    'actual original source crop missing: '+JSON.stringify({variant,crop,reviewReady:true,manifestRequests:seen.manifest,cutoutRequests:seen.cutout}));
   result.sourceCropRects[variant]=crop;
   assert.ok(seen.manifest>=1&&seen.cutout>=1,
    'original source renderer did not actually fetch the transient source-bound mask');
   assert.equal(seen.ephemeralSourceShaderPatch,variant==='M45_HOLE'?1:0,
    'actual genuine shader was not patched exactly once in the M45_HOLE research page');
   const dir=join(root,variant);
   await mkdir(dir,{recursive:true});
   for(const figure of ['female','male']){
    if(figure==='male')await page.evaluate(()=>window.review87.load('male'));
    const state=await page.evaluate(()=>({
     poseSource:window.review87.receipt,
     model:window.review87.state,
     errors:window.review87.errors
    }));
    assert.deepEqual(state.errors,[]);
    assert.equal(state.poseSource.originalSHA256,M46_SOURCE.originalJpegSHA256);
    assert.equal(state.poseSource.actualSkinnedMeshClone,true);
    assert.equal(state.poseSource.liveSkeletonShared,true);
    assert.equal(state.model.stats.bones,163);
    assert.ok(state.poseSource.sourceGarmentParts>0);
    for(const pose of ['source','blend-50','relaxed']){
     const proof=await page.evaluate(s=>window.review87.setPose(s),pose);
     assert.equal(proof.actualSkinnedMeshClone,true);
     assert.equal(proof.liveSkeletonShared,true);
     assert.equal(proof.originalGeometryAndPhotoUVUntouched,true);
     assert.equal(proof.realSkinBoneCount,163);
     assert.equal(proof.releaseAuthorized,false);
     const contact=await page.evaluate(()=>window.review87.auditFit88());
     assert.equal(contact.schema,
      'M2-P88-original-photo-real-skinned-source-contact-sampled-v1');
     assert.equal(contact.genuineSource163BoneSkeleton,true);
     assert.equal(contact.sourcePhotoRestUVSkinAndGeometryUnchanged,true);
     assert.equal(contact.releaseAuthorized,false);
     const geometry={
      sourceGarmentParts:state.poseSource.sourceGarmentParts,
      fittedVertices:proof.fittedVertices,
      originalGeometryAndPhotoUVUntouched:proof.originalGeometryAndPhotoUVUntouched,
      actualBoneCount:proof.realSkinBoneCount,
      originalTextureSourceSHA256:proof.originalSHA256,
      sampleRealContactStatus:contact.status,
      sampledSourceTriangles:contact.originalSourceTriangles,
      actualAnatomicalBodyFaces:contact.actualAnatomicalBodyFaces,
      sampledCrossBodyStrictWitnesses:contact.sampledCandidateBodyStrictPairWitnesses,
      sampledSelfStrictWitnesses:contact.sampledCandidateSelfStrictPairWitnesses,
      ambiguousBodyNearUnresolved:contact.sampledCandidateBodyNearOrZeroUnresolved,
      ambiguousSelfNearUnresolved:contact.sampledCandidateSelfGeometricZeroOrOverlapUnresolved,
      genuineSourceContactNotContinuousClearance:true
     };
     for(const [view,angle] of [['front',0],['side',90]]){
      await page.evaluate(({angle})=>window.review87.show('candidate',angle),{angle});
      await page.evaluate(()=>new Promise(done=>
       requestAnimationFrame(()=>requestAnimationFrame(done))));
      const file=figure+'-'+pose+'-'+view+'.png';
      const bytes=await page.locator('canvas').screenshot({path:join(dir,file)});
      const meta=await sharp(bytes).metadata();
      assert.ok(meta.width>=300&&meta.height>=600);
      result.scenes.push({
       variant,figure,pose,view,file:variant+'/'+file,
       screenshotSHA256:sha(bytes),nativeBrowserScreenshot:true,
       viewportCSSWidth:390,viewportCSSHeight:820,
       pixelWidth:meta.width,pixelHeight:meta.height,...geometry,
       actualBoneCount:proof.realSkinBoneCount,
       originalGeometryAndPhotoUVUntouched:proof.originalGeometryAndPhotoUVUntouched,
       originalPhotographerSourceSHA256:proof.originalSHA256,
       anatomicalBodyFaces:contact.actualAnatomicalBodyFaces,
       sourceGarmentTriangles:contact.originalSourceTriangles,
       releaseAuthorized:false,photo2DFallbackRequired:true
      });
     }
    }
   }
   assert.ok(seen.cutout>=1,'renderer never consumed source PNG');
  }finally{
   await page.close();await context.close();
  }
 }
 assert.equal(result.scenes.length,36,
  '36 authentic original 163-bone source-mask/screenshots required per engine');
 const sourceAudit47=judgeResearchVNeckVisibility47({
  variants:result.variants,scenes:result.scenes,
  expectedComparisons:12,networkRequests:result.networkRequests,
  browserErrors:result.browserErrors,sourceCropRects:result.sourceCropRects,
  originalPhotoSourceSHA256:M46_SOURCE.originalJpegSHA256,
  sourceBoundDelta:maskProof,shaderPermission:false
 });
 assert.equal(sourceAudit47.actualSource3DScenes,36);
 result.sourceVisibilitySafety47=sourceAudit47;
 for(const figure of ['female','male'])for(const pose of ['source','blend-50','relaxed'])
  for(const view of ['front','side']){
   const key=figure+'-'+pose+'-'+view+'.png';
   const [a,b]=await Promise.all(['P93','M45'].map(v=>readFile(join(root,v,key))));
   const images=await Promise.all([a,b].map(x=>
    sharp(x).removeAlpha().raw().toBuffer()));
   assert.equal(images[0].length,images[1].length,
    'two actual native renderer scene sizes must match');
   let pixels=0;
   for(let i=0;i<images[0].length;i+=3)
    if(Math.abs(images[0][i]-images[1][i])>8||
     Math.abs(images[0][i+1]-images[1][i+1])>8||
     Math.abs(images[0][i+2]-images[1][i+2])>8)pixels++;
   result.comparisons.push({
    figure,pose,view,actualNativeWebGLRGBAChangedPixelCount:pixels,
    sourceP93PNG_SHA256:maskProof.untouchedP93PngSHA256,
    sourceM45PNG_SHA256:maskProof.separateUnapprovedM45PngSHA256,
    sourceMaskDiff4870Plus:false,
    actualPhotoFidelityCertified:false,collisionSafetyCertified:false
   });
  }
 const changesByCondition={};
 for(const a of ['P93','M45'])for(const b of ['M45','M45_HOLE']){
  if(a==='P93'&&b==='M45_HOLE')continue;
  const label=a+'__'+b;
  const metrics=[];
  for(const figure of ['female','male'])for(const pose of ['source','blend-50','relaxed'])
   for(const view of ['front','side']){
    const file=figure+'-'+pose+'-'+view+'.png';
    const [before,after]=await Promise.all([a,b].map(v=>readFile(join(root,v,file))));
    const [x,y]=await Promise.all([before,after].map(buffer=>
     sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true})));
    assert.equal(x.info.width,y.info.width);
    assert.equal(x.info.height,y.info.height);
    let count=0,inside=0,outside=0;
    let minX=x.info.width,minY=x.info.height,maxX=-1,maxY=-1;
    for(let row=0;row<x.info.height;row++)for(let col=0;col<x.info.width;col++){
     const i=(row*x.info.width+col)*x.info.channels;
     if([0,1,2].some(c=>Math.abs(x.data[i+c]-y.data[i+c])>8)){
      count++;minX=Math.min(minX,col);maxX=Math.max(maxX,col);
      minY=Math.min(minY,row);maxY=Math.max(maxY,row);
      if(col>=130&&col<=275&&row>=100&&row<=265)inside++;
      else outside++;
     }
    }
    if(outside)throw Error('M47 mask fragment effect unexpectedly outside observed screen neckline');
    metrics.push({
     figure,pose,view,sourceVariantA:a,sourceVariantB:b,
     changedRGBPixelsAbove8:count,sourceNecklineScreenRegionChanges:inside,
     changesOutsideObservedNecklineROI:outside,
     changeScreenBounds:count?[minX,minY,maxX-minX+1,maxY-minY+1]:null,
     originalJpegAndUVUnchanged:true,
     actualFragmentHoleIsNotPhysicalOpening:true,
     releaseAuthorized:false
    });
   }
  changesByCondition[label]=metrics;
 }
 const baseline=changesByCondition.P93__M45,hole=changesByCondition.M45__M45_HOLE;
 const totalChange=(rows)=>rows.reduce((n,r)=>n+r.changedRGBPixelsAbove8,0);
 result.comparisons=changesByCondition;
 result.baselineSourceAlphaBlendChangedPixels=totalChange(baseline);
 result.incrementalTrueFragmentAlphaHoleChangedPixels=totalChange(hole);
 result.actualViewsWithIncrementalShaderCutoutPixels=hole.filter(x=>x.changedRGBPixelsAbove8>0).length;
 const visible=result.actualViewsWithIncrementalShaderCutoutPixels;
 const geometryByKey=new Map();
 for(const scene of result.scenes){
  const k=scene.figure+'/'+scene.pose+'/'+scene.view;
  const ref=geometryByKey.get(k);
  const current={vertexCount:scene.fittedVertices,
   partCount:scene.sourceGarmentParts,
   bodyFaces:scene.actualAnatomicalBodyFaces,
   sourceTriangles:scene.sampledSourceTriangles,
   sampleCrossings:scene.sampledCrossBodyStrictWitnesses,
   sampledSelf:scene.sampledSelfStrictWitnesses};
  if(ref)assert.deepEqual(current,ref,
   'shader fragment experiment must not change anatomical or clothing geometry/contact');
  else geometryByKey.set(k,current);
 }
 assert.deepEqual(result.browserErrors,[]);
 assert.deepEqual(result.networkRequests,[]);
 assert.equal(sha(await readFile(join(donor,'research/three-d-14/dress-shell.mjs'))),
  sha(Buffer.from(originalDressJS)),
  'original licensed dress shader changed on disk');
 result.actualResearchNativeWebGL2=true;
 result.exactAnatomical163Bones=true;
 result.realPhotographedMaskTextureCompared=true;
 result.photoUVGeometryCrossConditionIdentityNotYetProven=false;
 result.originalPhotoUVProjectionCropIdentical=true;
 result.noPhysicalOriginalDressMeshHoleCreated=true;
 result.sourceAlphaOnlyVisibilityExperimentValid=true;
 result.sourceAlphaOnlyVisibilityChangeMeasured=visible>0;
 result.status=visible?
  'ACTUAL_PHOTO_VNECK_ALPHA_FRAGMENT_VISIBILITY_RENDERED_NOT_SEWN_CLOTH':
  'SOURCE_ALPHA_FRAGMENT_HOLE_DID_NOT_RENDER_VISIBLY_WITH_CURRENT_UV_NOT_APPROVED';
 await writeFile(join(root,'M47-real-source-P93-M45-alpha-visibility-3D-receipt.json'),
  JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log('MAIN47_REAL_163BONE_ORIGINAL_PHOTO_ALPHA_VISIBILITY_NOT_APPROVED',
  JSON.stringify({engine:browserName,screens:result.scenes.length,
   comparisons:baseline.length+hole.length,visible,
   baselinePixelChanges:result.baselineSourceAlphaBlendChangedPixels,
   holePixelChanges:result.incrementalTrueFragmentAlphaHoleChangedPixels,
   originalSourceVerified:true,actualRigBones:163,
   originalPhotoUVTopologyNotChangedByAlpha:true,
   contactNotContinuousCertified:true,realHumanApproved:false,
   consumer3D:false,familyAlpha:'HOLD'}));
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
