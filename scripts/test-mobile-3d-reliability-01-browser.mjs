/** PAR-08 genuine licensed research Chromium WebGL mobile verification.
 * 72 real before/after source images: 2 rigs x 3 widths x 2 denims x 3 views x 2 viewers.
 * Never substitute mocked images, green checkmarks, simulated GLB, or private wardrobes.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import sharp from 'sharp';
import {chromium} from 'playwright';

const root=resolve('.'),output='benchmark/mobile-3d-reliability-01';
const pathOK=/^\/(?:research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/;
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!pathOK.test(path)||path.includes('\\')||path.includes('\0')||
     path.split('/').includes('..'))throw Error('Research-only local path required');
  const filename=resolve(root,'.'+path);
  if(!filename.startsWith(root+'/'))throw Error('Traversal blocked');
  const bytes=await readFile(filename);
  const type={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript',
   '.json':'application/json','.glb':'model/gltf-binary','.jpg':'image/jpeg','.png':'image/png'};
  res.writeHead(200,{'content-type':type[extname(filename)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Unavailable');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port;
const urls=Object.freeze({
 before:'/research/three-d-69/index.html',
 after:'/research/mobile-3d-reliability-01/index.html'});
const expected=Object.freeze({
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a',
 shirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64'});
const checks=[],negative=[],memory=[],images=[],errors=[];
let browser;
const diag=kind=>kind==='before'?'window.cc69Diagnostics()':'window.ccMobileDiagnostics()';
async function open(context,kind,figure){
 const page=await context.newPage();
 const pageErrors=[],offsite=[];
 page.on('pageerror',e=>pageErrors.push(String(e?.message||e)));
 page.on('request',r=>{const u=r.url();if(!u.startsWith(host)&&!u.startsWith('blob:'+host)&&!u.startsWith('data:'))offsite.push(u);});
 await page.goto(host+urls[kind],{waitUntil:'domcontentloaded'});
 await page.waitForFunction(kind==='before'?
  ()=>window.cc69Diagnostics?.()?.loaded===true&&window.cc69Diagnostics()?.rig?.bones===163:
  ()=>window.ccMobileDiagnostics?.()?.ready===true&&window.ccMobileDiagnostics()?.rig?.bones===163,
  null,{timeout:180000});
 if(figure==='male'){
  await page.locator('#model').selectOption('male');
  await page.waitForFunction(kind==='before'?
   ()=>window.cc69Diagnostics?.()?.figure==='male'&&window.cc69Diagnostics()?.loaded===true:
   ()=>window.ccMobileDiagnostics?.()?.figure==='male'&&window.ccMobileDiagnostics()?.ready===true,
   null,{timeout:180000});
 }
 await page.locator('#review').check();
 await page.locator('#wear').click();
 await page.waitForFunction(kind==='before'?
  ()=>window.cc69Diagnostics?.()?.actual3DGarment?.realPhotoApplied===true:
  ()=>window.ccMobileDiagnostics?.()?.actual3DGarment?.realPhotoApplied===true,
  null,{timeout:180000});
 return {page,pageErrors,offsite};
}
function assertSources(d,kind,figure,denim){
 const original=d.actual3DGarment;
 assert.equal(d.figure,figure);
 assert.equal(d.rig?.bones,163);
 assert.equal(original?.realPhotoApplied,true);
 assert.ok(original?.real3DSkinnedGarmentMeshes>=2);
 assert.equal(original.originalPhotoSHA256s.top,expected.shirt);
 assert.equal(original.originalPhotoSHA256s.bottom,expected[denim]);
 assert.equal(original.releaseAuthorized,false);
 if(kind==='after'){
  assert.equal(d.sourceOriginalVerified,true);
  assert.equal(d.originalDenimSHA256,expected[denim]);
  assert.equal(d.familyAlpha,'HOLD');
  assert.equal(d.humanPhotorealismApproved,false);
  assert.equal(d.physicalAndroidTested,false);
  assert.equal(d.physicalIphoneTested,false);
 }
}
async function capture(page,key){
 const evidence=await page.evaluate(()=>{
  const c=document.querySelector('#avatar'),gl=c.getContext('webgl2');
  return {genuineWebGL2:!!gl,drawFrames:Number(c.dataset.frames||0),
   cssWidth:c.getBoundingClientRect().width,canvasWidth:c.width,
   horizontalOverflow:document.documentElement.scrollWidth>window.innerWidth+1};
 });
 assert.equal(evidence.genuineWebGL2,true,'must be genuine WebGL2 render');
 assert.ok(evidence.drawFrames>1,'actual WebGL animation frame required');
 assert.equal(evidence.horizontalOverflow,false,'no horizontal overflow');
 const png=await page.locator('#avatar').screenshot();
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const pixel=await sharp(png).resize(64,64).removeAlpha().raw().toBuffer();
 let min=255,max=0,total=0;
 for(const v of pixel){if(v<min)min=v;if(v>max)max=v;total+=v;}
 assert.ok(max-min>23,'actual WebGL image may not be blank/flat');
 await writeFile(output+'/'+key+'.png',png);
 images.push({key,pngBytes:png.length,pixelRange:max-min,mean:total/pixel.length,...evidence});
}
async function auditBeforeAfter(){
 for(const width of [320,390,430]){
  for(const figure of ['female','male']){
   for(const kind of ['before','after']){
    const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,
     isMobile:true,hasTouch:true});
    const {page,pageErrors,offsite}=await open(ctx,kind,figure);
    for(const denim of ['public','second']){
     if(denim==='second'){
      await page.locator('#swap').click();
      await page.waitForFunction(kind==='before'?
       ()=>window.cc69Diagnostics?.()?.currentSelection==='second':
       ()=>window.ccMobileDiagnostics?.()?.selection==='second',null,{timeout:120000});
     }
     const d=await page.evaluate(kind==='before'?()=>window.cc69Diagnostics():()=>window.ccMobileDiagnostics());
     assertSources(d,kind,figure,denim);
     for(const angle of [0,90,180]){
      const state=await page.evaluate(({angle,kind})=>
       kind==='before'?window.cc69SetView(angle):window.ccMobileSetView(angle),{angle,kind});
      const actual=kind==='before'?state.camera:state.viewAngle;
      assert.ok(Math.abs(actual-angle)<.02,'real 3D camera orbit must agree with angle');
      await page.waitForTimeout(110);
      const key=[kind,figure,width,denim,angle].join('-');
      await capture(page,key);
     }
     checks.push({kind,figure,width,denim,originalDenimSHA256:expected[denim],
      sourceShirtSHA256:expected.shirt,real163BoneWebGL:true});
     if(kind==='after')memory.push(await page.evaluate(()=>window.ccMobileDiagnostics().memory));
    }
    assert.deepEqual(pageErrors,[],'no unhandled WebGL errors');
    assert.deepEqual(offsite,[],'no offsite photo/network traffic');
    await ctx.close();
   }
  }
 }
 assert.equal(images.length,72,'must produce 72 original WebGL before/after PNGs');
}
async function stress(){
 const ctx=await browser.newContext({viewport:{width:390,height:850},isMobile:true,hasTouch:true});
 const {page,pageErrors,offsite}=await open(ctx,'after','female');
 const samples=[];
 for(let i=0;i<10;i++){
  await page.locator('#swap').click();
  const d=await page.evaluate(()=>window.ccMobileDiagnostics());
  assertSources(d,'after','female',i%2===0?'second':'public');
  samples.push({operation:'swap',index:i+1,...d.memory});
 }
 for(let i=0;i<5;i++){
  const f=i%2===0?'male':'female';
  await page.locator('#model').selectOption(f);
  await page.waitForFunction(expected=>window.ccMobileDiagnostics?.()?.figure===expected&&
    window.ccMobileDiagnostics()?.ready===true,f,{timeout:180000});
  await page.locator('#review').check();await page.locator('#wear').click();
  const d=await page.evaluate(()=>window.ccMobileDiagnostics());
  assertSources(d,'after',f,'public');
  samples.push({operation:'figure-switch',index:i+1,...d.memory});
 }
 const end=await page.evaluate(()=>window.ccMobileDiagnostics());
 assert.ok(end.swaps>=10&&end.figureSwitches>=5);
 assert.ok(samples.every(s=>Number.isFinite(s.geometries)&&s.geometries<1200&&
   Number.isFinite(s.textures)&&s.textures<300&&Number.isFinite(s.renderMs)),
  'repeated swaps must keep measurable finite WebGL allocations');
 // Repeated same-shirt/denim selections must not show unbounded GPU geometry accumulation.
 const swapGeo=samples.filter(s=>s.operation==='swap').map(s=>s.geometries);
 assert.ok(Math.max(...swapGeo)-Math.min(...swapGeo)<120,'swaps leak too many WebGL geometries');
 const swapTex=samples.filter(s=>s.operation==='swap').map(s=>s.textures);
 assert.ok(Math.max(...swapTex)-Math.min(...swapTex)<32,'swaps leak too many textures');
 const view0=await page.evaluate(()=>window.ccMobileSetView(0));
 const canvas=page.locator('#avatar'),bounds=await canvas.boundingBox();
 assert.ok(bounds);
 await page.mouse.move(bounds.x+bounds.width*.5,bounds.y+bounds.height*.5);
 await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.81,bounds.y+bounds.height*.48,{steps:12});
 await page.mouse.up();
 await page.waitForTimeout(130);
 const moved=await page.evaluate(()=>window.ccMobileDiagnostics());
 assert.ok(Math.abs(moved.viewAngle-view0.viewAngle)>1,'real camera pointer-drag should rotate 3D view');
 await page.locator('#zin').click();
 const afterZoom=await page.evaluate(()=>window.ccMobileDiagnostics());
 assert.ok(afterZoom.memory?.drawPixels>0);
 assert.deepEqual(pageErrors,[]);assert.deepEqual(offsite,[]);
 memory.push(...samples);
 await writeFile(output+'/stress.json',JSON.stringify({swaps:10,figureSwitches:5,
  pointerRotateDegrees:moved.viewAngle-view0.viewAngle,samples},null,2));
 await ctx.close();
}
async function fault(label,setup){
 const ctx=await browser.newContext({viewport:{width:320,height:800},isMobile:true,hasTouch:true});
 await setup(ctx);
 const page=await ctx.newPage();
 await page.goto(host+urls.after,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.ccMobileDiagnostics?.()?.phase==='error',
  null,{timeout:180000});
 let d=await page.evaluate(()=>window.ccMobileDiagnostics());
 assert.equal(d.originalFallbackVisible,true);
 assert.equal(d.actual3DGarment,null);
 assert.equal(await page.locator('#wear').isDisabled(),true);
 negative.push({label,phase:d.phase,original2DFallback:true,releaseAuthorized:false});
 await ctx.unrouteAll({behavior:'wait'});
 if(label==='no-webgl'){
  // Isolated browser init-script stays active on this context; recovery requires a fresh GPU-enabled context.
  await ctx.close();return;
 }
 await page.locator('#retry').click();
 await page.waitForFunction(()=>window.ccMobileDiagnostics?.()?.ready===true,
  null,{timeout:180000});
 d=await page.evaluate(()=>window.ccMobileDiagnostics());
 assert.equal(d.originalFallbackVisible,false);
 assert.equal(d.rig?.bones,163);
 negative.at(-1).recovery='PASS';
 await ctx.close();
}
async function faults(){
 await fault('no-webgl',async ctx=>ctx.addInitScript(()=>{
  const old=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
   if(type==='webgl2')return null;
   return old.call(this,type,...args);
  };
 }));
 await fault('missing-model',async ctx=>
  ctx.route('**/three-d-06/models/*.glb',route=>route.abort('failed')));
 await fault('missing-original-denim',async ctx=>
  ctx.route('**/benchmark/three-d-37/original-denimjeans2.jpg',route=>route.abort('failed')));
 const ctx=await browser.newContext({viewport:{width:390,height:850},isMobile:true,hasTouch:true});
 const {page}=await open(ctx,'after','female');
 await page.evaluate(()=>{
  const canvas=document.querySelector('#avatar'),gl=canvas.getContext('webgl2');
  const extension=gl?.getExtension('WEBGL_lose_context');
  if(!extension)throw Error('Real WebGL context loss extension unavailable');
  extension.loseContext();
 });
 await page.waitForFunction(()=>window.ccMobileDiagnostics?.()?.phase==='error',null,{timeout:30000});
 assert.equal((await page.evaluate(()=>window.ccMobileDiagnostics())).originalFallbackVisible,true);
 negative.push({label:'webgl-context-lost',phase:'error',original2DFallback:true,releaseAuthorized:false});
 await page.locator('#retry').click();
 await page.waitForFunction(()=>window.ccMobileDiagnostics?.()?.ready===true,null,{timeout:180000});
 negative.at(-1).recovery='PASS';
 await ctx.close();
}
try{
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir(output,{recursive:true});
 await auditBeforeAfter();await stress();await faults();
 const report={evidenceType:'real-browser-webgl-screenshot-PNG',startViewer:'3D69 verified',
  afterViewer:'PAR08 reliability',sourceOnly:true,rigBones:163,
  widths:[320,390,430],figures:['female','male'],denims:['public','second'],
  angles:[0,90,180],screenShotsBefore:36,screenShotsAfter:36,realWebGLScreenshots:images.length,
  checkedGarments:checks.length,swapsAtLeast:10,figureSwitchesAtLeast:5,
  sourceSHAs:expected,offsiteRequests:0,originalPhotoAnd2DFallbackUnchanged:true,
  negativeCases:negative,webGLMemoryMeasurements:memory.length,
  memory:memory,images,errors,
  physicalAndroidTested:false,physicalIphoneTested:false,humanGarmentPhotorealism:'REVIEW',
  familyAlpha:'HOLD',productionModified:false,releaseAuthorized:false};
 assert.equal(report.realWebGLScreenshots,72);
 assert.equal(report.negativeCases.length,4);
 assert.ok(report.negativeCases.slice(1).every(n=>n.recovery==='PASS'));
 await writeFile(output+'/browser-results.json',JSON.stringify(report,null,2));
 console.log('PAR08_MOBILE_WEBGL_ACCEPTANCE',JSON.stringify({
  frames:images.length,figures:2,widths:3,originalDenimSources:2,angles:3,
  negative:negative.length,swaps:10,figureSwitches:5,memSamples:memory.length,
  humanRealism:'REVIEW',physicalPhones:'NOT TESTED',familyAlpha:'HOLD'}));
}finally{
 await browser?.close();await new Promise(resolve=>server.close(resolve));
}