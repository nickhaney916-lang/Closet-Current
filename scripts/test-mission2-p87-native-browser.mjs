/**
 * P87 genuine photographed Commons-0053, actual 163-bone male/female posed
 * SKINNED source clone, original/candidate/restored Chromium + WebKit A/B.
 * Everything is read-only, synthetic owner, localhost, never deployment.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';

const hostRoot=resolve('.'),donor=resolve('.native05-donor-541');
const engine=process.env.P87_ENGINE||'chromium';
assert.ok(['chromium','webkit'].includes(engine));
const out='benchmark/mission2-p87/native-'+engine;
await mkdir(out,{recursive:true});
const types={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(p.includes('..'))throw Error('outside');
  const fromDonor=p.startsWith('/donor/')||p.startsWith('/benchmark/');
  const base=fromDonor?donor:hostRoot;
  const file=resolve(base,'.'+(p.startsWith('/donor/')?p.slice(6):p));
  if(!file.startsWith(base+'/'))throw Error('outside');
  const data=await readFile(file);
  res.setHeader('content-type',types[extname(file)]||'application/octet-stream');
  res.end(data);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const sha=b=>createHash('sha256').update(b).digest('hex');
const results={schema:'p87-genuine-source-skinned-pose-original-candidate-restored-v1',
 engine,sourceId:'commons-0053',realAvatar163Bones:true,
 figures:[],sourcePoseReceipts:[],screens:[],differences:[],errors:[],external:[],
 researchOnly:true,physicalPhone:false,continuousClothSafetyCertified:false,
 photoProjectionIndependentlyApproved:false,releaseAuthorized:false,familyAlpha:'HOLD'};
let browser,page;
try{
 browser=await ({chromium,webkit})[engine].launch({
  headless:true,...(engine==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})
 });
 page=await browser.newPage({viewport:{width:390,height:820},deviceScaleFactor:1});
 page.on('pageerror',e=>results.errors.push(String(e.message).slice(0,500)));
 page.on('console',m=>{
  if(m.type()==='error'&&/WebGLProgram|VALIDATE_STATUS|shader error|ERROR: 0:/i.test(m.text()))
   results.errors.push(m.text().slice(0,500));
 });
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='127.0.0.1'||['data:','blob:'].includes(url.protocol))return route.continue();
  results.external.push(url.hostname);return route.abort();
 });
 const flags=['photoDress175','photoDressContact52','photoDressDistance53','photoDressTopology54','photoDressEdges55','photoDressBoundaries56','photoDressLandmarks57','photoDressContact58','photoDressBodyBands59','photoDressTorsoTrial60','photoDressStrain61'];
 await page.goto('http://127.0.0.1:'+server.address().port+'/research/mission2-p87/native-pose-review.html?'+flags.map(f=>f+'=research').join('&'));
 await page.waitForFunction(()=>window.review87?.ready||window.review87?.errors?.length,null,{timeout:120000});
 const poses=['source','blend-50','relaxed'];
 for(const figure of ['female','male']){
  if(figure==='male')await page.evaluate(()=>window.review87.load('male'));
  let start=await page.evaluate(()=>({r:window.review87.receipt,s:window.review87.state,errors:window.review87.errors}));
  assert.deepEqual(start.errors,[],'genuine source setup failed');
  assert.equal(start.s.stats.bones,163,'actual anatomical 163-bone avatar missing');
  assert.equal(start.r.actualSkinnedMeshClone,true);
  assert.equal(start.r.liveSkeletonShared,true);
  assert.equal(start.r.originalSHA256,'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019');
  assert.equal(start.r.sourceGarmentParts>0,true);
  results.figures.push({figure,bones:start.s.stats.bones,parts:start.r.sourceGarmentParts});
  let previous=start.r.poseUpdates;
  for(const pose of poses){
   const receipt=await page.evaluate(mode=>window.review87.setPose(mode),pose);
   assert.equal(receipt.actualSkinnedMeshClone,true);
   assert.equal(receipt.liveSkeletonShared,true);
   assert.equal(receipt.originalGeometryAndPhotoUVUntouched,true);
   assert.equal(receipt.staticOriginalP86SourceGatePassed,true);
   assert.equal(receipt.releaseAuthorized,false);
   assert.equal(receipt.fittedVertices>0,true);
   assert.ok(receipt.poseUpdates>previous,'real skinned fitting must actually update at each pose');
   assert.ok(receipt.maximumCPUWorldSkinInverseResidualMeters<=.00005);
   previous=receipt.poseUpdates;
   results.sourcePoseReceipts.push({figure,pose,poseUpdates:receipt.poseUpdates,
    fittedVertices:receipt.fittedVertices,maxInverseResidualMeters:receipt.maximumCPUWorldSkinInverseResidualMeters,
    rigBones:receipt.realSkinBoneCount,sourcePhotoOriginalUnchanged:receipt.originalGeometryAndPhotoUVUntouched,
    noRelease:!receipt.releaseAuthorized});
   for(const [view,angle] of [['front',0],['side',90],['rear',180]]){
    const images=[];
    for(const mode of ['original','candidate','original']){
     await page.evaluate(({mode,angle})=>window.review87.show(mode,angle),{mode,angle});
     await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
     const name=figure+'-'+pose+'-'+view+'-'+(images.length===2?'restored-original':mode)+'.png';
     const b=await page.locator('canvas').screenshot({path:out+'/'+name});
     results.screens.push({figure,pose,view,mode:images.length===2?'restored-original':mode,
      file:name,sha256:sha(b)});
     images.push(b);
    }
    const raw=await Promise.all(images.map(b=>sharp(b).ensureAlpha().raw().toBuffer()));
    assert.equal(raw[0].length,raw[1].length);
    let changed=0,restored=0;
    for(let i=0;i<raw[0].length;i+=4){
     if([0,1,2].some(c=>Math.abs(raw[0][i+c]-raw[1][i+c])>8))changed++;
     if([0,1,2].some(c=>Math.abs(raw[0][i+c]-raw[2][i+c])>8))restored++;
    }
    assert.ok(changed>0,'genuine photographed garment candidate must visibly change '+figure+'/'+pose+'/'+view);
    assert.equal(restored,0,'original source RGB must restore '+figure+'/'+pose+'/'+view);
    results.differences.push({figure,pose,view,changedRGBPixelsAbove8:changed,
     restoredOriginalRGBPixelsAbove8:restored});
   }
  }
 }
 assert.deepEqual(results.errors,[],'shader or script errors not allowed');
 assert.deepEqual(results.external,[],'network egress forbidden');
 assert.equal(results.sourcePoseReceipts.length,6);
 assert.equal(results.differences.length,18);
 assert.equal(results.screens.length,54);
 await page.evaluate(()=>window.review87.dispose());
 results.status='PASS_AUTHENTIC_SKINNED_SOURCE_SAMPLED_POSES_NOT_RELEASE';
}catch(e){
 results.status='BLOCKED';
 results.failure=String(e?.message||e).slice(0,2500);
 process.exitCode=1;
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
 await writeFile(out+'/results.json',JSON.stringify(results,null,2)+'\n');
 console.log('M2_P87_REAL_SOURCE',JSON.stringify({status:results.status,figures:results.figures.length,
  realSourcePoseReceipts:results.sourcePoseReceipts.length,screens:results.screens.length,
  differences:results.differences.length,errors:results.errors.length,networkBlocked:results.external.length,
  failure:results.failure||null,releaseAuthorized:false,familyAlpha:'HOLD'}));
}
