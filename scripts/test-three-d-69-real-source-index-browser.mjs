/** 3D69: real 390/320 Chromium source-photo garment pixels on real 163-bone
 * anatomical CC0 male/female, 360° orbit, genuine jeans swap through index.
 * Never substitute 2D screenshots or fabricated personal user photos.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),out='benchmark/three-d-69';
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(path)||
     path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('Only approved original locked research files');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/'))throw Error('No private file access');
  const bytes=await readFile(file);
  const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html',
   '.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary'};
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Blocked or missing source');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port,results=[];
async function changed(a,b){
 const aa=await sharp(a).ensureAlpha().raw().toBuffer(),bb=await sharp(b).ensureAlpha().raw().toBuffer();
 assert.equal(aa.length,bb.length);let n=0;
 for(let i=0;i<aa.length;i+=4)if(Math.abs(aa[i]-bb[i])+Math.abs(aa[i+1]-bb[i+1])+Math.abs(aa[i+2]-bb[i+2])>30)n++;
 return n;
}
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir(out,{recursive:true});
 for(const width of [320,390])for(const figure of ['female','male']){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  const page=await context.newPage(),fail=[],outside=[];
  page.on('pageerror',e=>fail.push(String(e.message)));
  page.on('request',req=>{
   if(!req.url().startsWith(origin)&&!req.url().startsWith('blob:'+origin)&&!req.url().startsWith('data:'))outside.push(req.url());
  });
  await page.goto(origin+'/research/three-d-69/index.html');
  await page.waitForFunction(()=>window.cc69Diagnostics?.()?.rig?.bones===163&&window.cc69Diagnostics?.()?.figure==='female',null,{timeout:180000});
  if(figure==='male'){
   await page.locator('#model').selectOption('male');
   await page.waitForFunction(()=>window.cc69Diagnostics?.()?.figure==='male',null,{timeout:120000});
  }
  await page.locator('#review').check();
  await page.locator('#wear').click();
  await page.waitForFunction(()=>window.cc69Diagnostics?.()?.actual3DGarment?.status==='actual-separate-skinned-garments-displayed',null,{timeout:180000});
  const get=()=>page.evaluate(()=>window.cc69Diagnostics());
  const state=await get();
  assert.equal(state.figure,figure);
  assert.equal(state.rig.bones,163);
  assert.equal(state.actual3DGarment.realPhotoApplied,true);
  assert.ok(state.actual3DGarment.real3DSkinnedGarmentMeshes>=2);
  assert.equal(state.actual3DGarment.releaseAuthorized,false);
  assert.equal(state.actual3DGarment.humanPhotorealismApproved,false);
  assert.equal(state.actual3DGarment.originalPhotoSHA256s.top,'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64');
  assert.equal(state.actual3DGarment.originalPhotoSHA256s.bottom,'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c');
  const frames={},summary={figure,width,originalJpegsPinned:true,garmentMeshes:state.actual3DGarment.real3DSkinnedGarmentMeshes,angles:[],denimBefore:state.actual3DGarment.originalPhotoSHA256s.bottom};
  for(const angle of [0,90,180,360]){
   const d=await page.evaluate(a=>window.cc69SetView(a),angle);
   assert.ok(Math.abs(d.camera-(angle===360?0:angle))<.01,'True skinned 3D figure orbit at '+angle);
   await page.waitForTimeout(130);
   const image=await page.locator('#avatar').screenshot();
   assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   frames[angle]=image;
   await writeFile(out+'/'+figure+'-'+width+'-public-denim-'+angle+'.png',image);
   summary.angles.push({requested:angle,realCamera:d.camera});
  }
  const rotated=await changed(frames[0],frames[90]),back=await changed(frames[0],frames[180]),close=await changed(frames[0],frames[360]);
  assert.ok(rotated>900&&back>900,'Actual photographed garment 3D silhouette must change on camera orbit');
  assert.ok(close<Math.max(350,frames[0].length*.02),'360° camera must return to original verified garment view');
  await page.locator('#swap').click();
  await page.waitForFunction(()=>window.cc69Diagnostics?.()?.currentSelection==='second',null,{timeout:180000});
  await page.evaluate(()=>window.cc69SetView(0));
  await page.waitForTimeout(140);
  const after=await get(),second=await page.locator('#avatar').screenshot();
  assert.equal(after.actual3DGarment.originalPhotoSHA256s.bottom,'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a');
  assert.equal(after.actual3DGarment.originalPhotoSHA256s.top,state.actual3DGarment.originalPhotoSHA256s.top);
  assert.deepEqual(after.actual3DGarment.selectedIds,['licensed-shirt','licensed-jeans-2']);
  const changedDenim=await changed(frames[0],second);
  assert.ok(changedDenim>250,'Real original source denim garment must change visually when swapping');
  await writeFile(out+'/'+figure+'-'+width+'-swapped-denim-front.png',second);
  summary.denimAfter=after.actual3DGarment.originalPhotoSHA256s.bottom;
  summary.originalPhotographedDenimSwapPixels=changedDenim;
  summary.rotated=rotated;summary.back=back;summary.return=close;
  results.push(summary);
  assert.deepEqual(fail,[],'Real source 3D browser errors: '+JSON.stringify(fail));
  assert.deepEqual(outside,[],'No personal original source should leave localhost');
  console.log('THREE_D69_REAL_INDEX_TO_SKINNED_PHOTO_SWAP',JSON.stringify(summary));
  await context.close();
 }
 await writeFile(out+'/browser-results.json',JSON.stringify({
  validLicensedOriginalPublicDemo:true,notActualPrivateCustomerIndex:true,
  originalPhotoSHA256Verified:true,trueThreeDimensionalSkinnedMeshes:true,
  bothAnatomicalFigures:true,real360CameraOrbit:true,
  denimSwappedOnOriginal3D:true,// exact before/after source SHA and visible mobile pixels verified per scenario
  originalPhotoBackSideVerified:false,personalPhotoTo3DReconstruction:false,
  humanPhotorealismApproved:false,physicalPhonesTested:false,
  familyAlpha:'HOLD',releaseAuthorized:false,results},null,2));
 assert.equal(results.length,4);
 console.log('THREE_D69_SOURCE_TRUE_MOBILE_3D_BROWSER_COMPLETE',results.length);
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
