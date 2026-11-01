/** 3D67 genuine WebGL 163-bone original CC0 male/female full 360 mobile.
 * No synthetic image substitute, no personal closet photos.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),dir='benchmark/three-d-67',results=[];
const server=createServer(async(req,res)=>{
 try{
  const url=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(url)||
      url.includes('\\')||url.includes('\0')||url.split('/').includes('..'))throw Error('Original source path blocked');
  const path=resolve(root,'.'+url);if(!path.startsWith(root+'/'))throw Error('Research source path blocked');
  const buffer=await readFile(path);
  const types={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html',
    '.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg'};
  res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(buffer);
 }catch{res.writeHead(404);res.end('Blocked original source');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
async function pixelChange(a,b){
 const x=await sharp(a).ensureAlpha().raw().toBuffer(),y=await sharp(b).ensureAlpha().raw().toBuffer();
 assert.equal(x.length,y.length);let n=0;
 for(let k=0;k<x.length;k+=4){
  if(Math.abs(x[k]-y[k])+Math.abs(x[k+1]-y[k+1])+Math.abs(x[k+2]-y[k+2])>32)n++;
 }
 return {changed:n,total:x.length/4};
}
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir(dir,{recursive:true});
 for(const width of [320,390,430])for(const kind of ['female','male']){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  const page=await context.newPage(),outside=[],errors=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  page.on('request',r=>{const u=r.url();if(!u.startsWith(origin)&&!u.startsWith('blob:'+origin)&&!u.startsWith('data:'))outside.push(u);});
  await page.goto(origin+'/research/three-d-67/index.html');
  await page.waitForFunction(()=>window.cc67Diagnostics?.()?.loaded===true,null,{timeout:120000});
  if(kind==='male'){
   await page.locator('#model').selectOption('male');
   await page.waitForFunction(()=>window.cc67Diagnostics?.()?.loaded&&window.cc67Diagnostics().kind==='male',null,{timeout:120000});
  }
  const state=()=>page.evaluate(()=>window.cc67Diagnostics());
  const initial=await state();
  assert.equal(initial.stats.bones,163,'Must render source-locked genuine skinned human, not a 2D image');
  assert.ok(initial.stats.triangles>=10000&&initial.stats.skinned>=1);
  assert.equal(initial.premium360Enabled,true);
  assert.equal(initial.mannequinBodyYaw,0,'Never rotate body mesh to simulate camera orbit');
  assert.equal(initial.releaseAuthorized,false);
  const scenario={width,kind,bones:initial.stats.bones,triangles:initial.stats.triangles,angles:[],pixelDiffs:{}};
  const frame={};
  for(const angle of [0,45,90,135,180,225,270,315,360]){
   const state=await page.evaluate(a=>window.cc67View(a),angle);
   assert.equal(state.kind,kind);
   assert.equal(state.mannequinBodyYaw,0);
   assert.ok(Math.abs(state.viewAngle-(angle===360?0:angle))<.01,
    'True camera orbit angle mismatch '+angle+': '+state.viewAngle);
   assert.equal(state.premium360Enabled,true);
   assert.ok(state.cameraDistance>=2.4&&state.cameraDistance<=6);
   await page.waitForTimeout(95);
   const screenshot=await page.locator('#avatar').screenshot();
   assert.equal(screenshot.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   frame[angle]=screenshot;
   await writeFile(dir+'/'+kind+'-'+width+'-'+String(angle).padStart(3,'0')+'-original-cc0.png',screenshot);
   scenario.angles.push({angle,actual:state.viewAngle,bodyYaw:state.mannequinBodyYaw});
  }
  const full=await pixelChange(frame[0],frame[360]);
  assert.ok(full.changed<=Math.max(350,full.total*.025),'360° does not return to original 3D view '+JSON.stringify(full));
  for(const angle of [45,90,135,180,225,270,315]){
   const diff=await pixelChange(frame[0],frame[angle]);
   assert.ok(diff.changed>800,'Rotated view must be visually distinct true skinned 3D: '+angle+' '+JSON.stringify(diff));
   scenario.pixelDiffs[angle]=diff.changed;
  }
  const closet=await page.evaluate(()=>window.cc67IndexFixture());
  assert.equal(closet.categoryVerified,true);
  assert.equal(closet.threeDReady,false);
  assert.equal(closet.fallback,'original-camera-photo-or-2d');
  assert.deepEqual(closet.items.map(i=>i.category),['Tops','Bottoms']);
  const css=await page.locator('#avatar').evaluate(el=>getComputedStyle(el).touchAction);
  assert.equal(css,'none');
  await page.locator('#spin').click();
  await page.waitForTimeout(130);
  const spinning=await state();assert.equal(spinning.spinEnabled,true);
  // Clicking the spin control scrolls the mobile document. A raw coordinate
  // tap can hit outside the canvas after that scroll. Use an element-targeted
  // REAL touchscreen gesture and require a trusted pointerdown on the canvas.
  await page.locator('#avatar').evaluate(el=>{
   window.cc67TouchEvidence={pointerdowns:0,targets:[],trusted:[]};
   el.addEventListener('pointerdown',e=>{
    window.cc67TouchEvidence.pointerdowns++;
    window.cc67TouchEvidence.targets.push(e.target===el);
    window.cc67TouchEvidence.trusted.push(e.isTrusted);
   },{passive:true});
  });
  await page.locator('#avatar').tap();
  await page.waitForTimeout(60);
  const touchEvidence=await page.evaluate(()=>window.cc67TouchEvidence);
  assert.ok(touchEvidence.pointerdowns>=1&&touchEvidence.targets.every(Boolean)&&touchEvidence.trusted.every(Boolean),
   'Actual mobile pointerdown must reach the WebGL canvas: '+JSON.stringify(touchEvidence));
  assert.equal((await state()).spinEnabled,false,'Direct touch must cancel automated rotation');
  await page.locator('#reset').click();
  assert.ok(Math.abs((await state()).viewAngle)<.01);
  assert.deepEqual(outside,[],'No original camera source should leave local origin');
  assert.deepEqual(errors,[],'No WebGL/script errors on genuine CC0 3D humanoid');
  console.log('THREE_D67_REAL_360_SOURCE_CC0',JSON.stringify({width,kind,returnChangedPixels:full.changed,viewChanges:scenario.pixelDiffs,bones:initial.stats.bones,triangles:initial.stats.triangles,categoryReady:closet.categoryVerified,photo3DApproved:false,phoneTested:false}));
  results.push(scenario);
  await context.close();
 }
 await writeFile(dir+'/browser-results.json',JSON.stringify({researchOnly:true,originalCC0HumanRigs:true,actualThreeDimensionalCameraOrbit:true,
  figures:['female','male'],widths:[320,390,430],views:[0,45,90,135,180,225,270,315,360],
  scenarios:results,originalSourcePhotosUnmodified:true,indexedClothingProductionIntegrated:false,
  humanRealismScore:null,physicalAndroidIphoneTested:false,familyAlpha:'HOLD',releaseAuthorized:false},null,2));
 assert.equal(results.length,6);
 console.log('THREE_D67_REAL_3D_360_BROWSER_COMPLETE',JSON.stringify({scenarios:6,images:54,original163JointRigs:true,humanScore:null,production:false}));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
