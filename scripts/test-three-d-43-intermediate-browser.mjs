/** Real original-source Chromium WebGL 25/50/75% arm-pose photographic outfit.
 * No synthetic source, no user photos, no external browser/network requests.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import sharp from 'sharp';
import {chromium} from 'playwright';
const cwd=resolve('.'),dir='benchmark/three-d-43',record=[];
const server=createServer(async(req,res)=>{
 try{
  const uri=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(uri)||
    uri.includes('\\')||uri.includes('\0'))throw Error('blocked');
  const filename=resolve(cwd,'.'+uri);
  if(!filename.startsWith(cwd+'/'))throw Error('outside root');
  const bytes=await readFile(filename),mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.json':'application/json',
    '.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg'};
  res.writeHead(200,{'content-type':mime[extname(filename)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Unavailable');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
async function changed(a,b){
 const x=await sharp(a).raw().toBuffer(),y=await sharp(b).raw().toBuffer();
 assert.equal(x.length,y.length);let n=0;
 for(let i=0;i<x.length;i+=4)if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>27)n++;
 return n;
}
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir(dir,{recursive:true});
 for(const source of ['31','37'])for(const width of [320,390,430])for(const kind of ['female','male']){
  const context=await browser.newContext({viewport:{width,height:932},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  const page=await context.newPage(),errors=[],outside=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  page.on('request',req=>{const u=req.url();if(!u.startsWith(origin)&&!u.startsWith('blob:'+origin)&&!u.startsWith('data:'))outside.push(u);});
  await page.goto(origin+'/research/three-d-'+source+'/index.html?pantsDrape=after&seatFairing=after&envelope=after&loft=after&crotchPanel=after&waistFit=after&waistContact=after&hanging=after&clothFall=after&construction=after&sweep=after');
  await page.waitForFunction(()=>window.cc31Diagnostics?.()?.loaded===true,null,{timeout:180000});
  if(kind==='male'){
   await page.locator('#model').selectOption('male');
   await page.waitForFunction(()=>window.cc31Diagnostics?.()?.kind==='male'&&window.cc31Diagnostics().loaded,{timeout:180000});
  }
  const stats=()=>page.evaluate(()=>window.cc31Diagnostics());
  assert.equal((await stats()).stats.bones,163);
  assert.equal((await stats()).outfit.pants.photoApplied,false);
  await page.locator('#review').check();
  await page.evaluate(()=>document.querySelector('#full').click());
  assert.equal((await stats()).outfit.mode,'pants','Synthetic review bypass is forbidden');
  await page.locator('#full').click();
  let state=await stats();
  assert.equal(state.outfit.mode,'shirt-pants');
  assert.equal(state.outfit.pants.sourceSHA256,(source==='37'?'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a':'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c'));
  assert.equal(state.outfit.shirt.poseTriangleContact.after.count,0);
  const front=[];
  for(const pose of ['blend-25','blend-50','blend-75']){
   state=await page.evaluate(p=>window.cc43SetPose(p),pose);
   assert.equal(state.pose,pose);
   assert.equal(state.outfit.pose,pose);
   assert.equal(state.outfit.shirt.poseTriangleContact.pose,pose);
   assert.equal(state.outfit.shirt.poseTriangleContact.after.count,0);
   assert.equal(state.outfit.shirt.poseTriangleContact.fullCollisionValidated,false);
   for(const angle of ['front','side','back']){
    await page.locator('#'+angle).click();await page.waitForTimeout(120);
    const png=await page.locator('#avatar').screenshot({path:dir+'/'+source+'-'+width+'-'+kind+'-'+pose+'-'+angle+'.png'});
    if(angle==='front')front.push(png);
   }
   record.push({source,width,kind,pose,bodyRigBones:state.stats.bones,
    materialPhotoSHA:state.outfit.pants.sourceSHA256,
    localCorrection:state.outfit.shirt.poseTriangleContact.maximumWorldCorrection,
    sourcePhotoUnchanged:true,sourceAndClothSweptContinuouslyCertified:false});
  }
  assert.ok(await changed(front[0],front[2])>20,'Real original anatomical arm intermediate movement must be visible in WebGL');
  await page.evaluate(p=>window.cc43SetPose(p),'source');
  await page.evaluate(p=>window.cc43SetPose(p),'blend-50');
  assert.equal((await stats()).outfit.shirt.poseTriangleContact.after.count,0,'Repeated mid-pose correction must be cached and clear');
  await page.locator('#neutral').click();
  const neutral=await stats();
  assert.equal(neutral.outfit.pants.photoApplied,false);
  assert.equal(neutral.outfit.shirt,null);
  assert.deepEqual(errors,[],'No browser exceptions');
  assert.deepEqual(outside,[],'Original licensed photographs must not leave localhost');
  await context.close();
 }
 await writeFile(dir+'/browser-results.json',JSON.stringify({
  scenario:'Actual original male/female anatomy and original licensed photographed shirt+2 jeans at quarter-step arm interpolation',
  sources:['https://commons.wikimedia.org/wiki/File:Jeans.jpg','https://commons.wikimedia.org/wiki/File:Denimjeans2.JPG'],
  widths:[320,390,430],poses:['blend-25','blend-50','blend-75'],cameraAngles:['front','side','back'],
  records:record,realWebGL:true,sourcePhotoBytesUnchanged:true,verifiedSampledPoseOnly:true,
  sweptMotionCertification:false,visualOwnerApproval:false,releaseAuthorized:false},null,2));
 console.log('THREE_D43_REAL_FRACTIONAL_POSE_ORIGINAL_PHOTO_WEBGL',JSON.stringify({frames:record.length*3,records:record.length,releaseAuthorized:false}));
}finally{await browser?.close();server.close();}
