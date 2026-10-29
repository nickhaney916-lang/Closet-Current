/**
 * Measured baseline Work58 vs exact same studio with SHA-verified source cache.
 * Never substitutes synthetic body/garment; always uses actual pinned CC0 GLBs.
 * Android and iPhone dimensions are software browsers, NOT physical phones.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';

const root=resolve('.'),output='benchmark/three-d-mobile-08',records=[];
await mkdir(output,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/three\/)/.test(p)||
     p.includes('\\')||p.includes('\0'))throw Error('Forbidden path');
  const file=resolve(root,'.'+p);
  if(!file.startsWith(root+'/'))throw Error('Outside research root');
  const bytes=await readFile(file),type={
   '.mjs':'text/javascript','.js':'text/javascript','.html':'text/html',
   '.json':'application/json','.glb':'model/gltf-binary',
   '.jpg':'image/jpeg','.png':'image/png'
  }[extname(file)]||'application/octet-stream';
  res.writeHead(200,{'content-type':type,'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Missing research asset');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const profiles=[{name:'android-compact',width:320,height:568,dpr:2},
 {name:'iphone-simulated',width:390,height:844,dpr:3},
 {name:'android-large',width:430,height:932,dpr:3}];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
let chrome,webkitBrowser;
try{
 chrome=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'
 ]});
 async function journey(browser,profile,optimized){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},
   deviceScaleFactor:profile.dpr,hasTouch:true,isMobile:true,serviceWorkers:'block'});
  const page=await context.newPage(),requests=[],outside=[],errors=[],timings=[],gpu=[];
  page.on('request',r=>{
   if(r.url().includes('/research/three-d-06/models/')&&r.url().endsWith('.glb'))requests.push(r.url());
   if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:'+origin)&&!r.url().startsWith('data:'))outside.push(r.url());
  });
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(origin+(optimized?'/research/three-d-mobile-08/index.html':
    '/research/three-d-09/index.html'));
   await page.waitForFunction(()=>document.getElementById('avatar')?.dataset.ready==='true',null,{timeout:45000});
   const first=await page.evaluate(()=>work58Diagnostics());
   assert.equal(first.stats.bones,163);assert.ok(first.stats.triangles>=109064);
   const kinds=['male','female','male','female','male','female'];
   for(const kind of kinds){
    const start=Date.now();
    await page.locator('#model').selectOption(kind);
    await page.waitForFunction(kind=>{
     const c=document.querySelector('#avatar');
     return c?.dataset.ready==='true'&&c.dataset.model===kind;
    },kind,{timeout:45000});
    const state=await page.evaluate(()=>work58Diagnostics());
    timings.push({kind,wallMs:Date.now()-start,modelLoadMs:state.loadMs});
    gpu.push({geometry:state.geometries,texture:state.textures,bones:state.stats.bones,
      triangles:state.stats.triangles});
    assert.equal(state.geometries,9,'No accumulating GPU geometry across switches');
    assert.equal(state.textures,2,'No accumulating GPU texture across switches');
    assert.equal(state.stats.bones,163);
    assert.equal(state.shirt,null);
   }
   // Actual front/side/back WebGL pixels, no synthetic screenshots.
   const angles=[];
   for(const view of ['front','side','back']){
    await page.locator('#'+view).click();
    const bytes=await page.locator('#avatar').screenshot({path:output+'/'+profile.name+'-'+(optimized?'cache':'baseline')+'-'+view+'-HOLD.png'});
    angles.push(sha(bytes));
   }
   assert.equal(new Set(angles).size,3,'3D camera view must change actual framebuffer');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const before=await page.evaluate(()=>work58Diagnostics().frames);
   // Simulate ordinary tab background/return without losing the active mannequin.
   const extra=await context.newPage();await extra.goto('about:blank');await extra.bringToFront();
   await page.bringToFront();await extra.close();
   assert.equal((await page.evaluate(()=>work58Diagnostics())).loaded,true);
   await page.locator('#front').click();
   assert.ok((await page.evaluate(()=>work58Diagnostics().frames))>=before);
   if(optimized){
    // Test the unchanged Work58 REAL licensed source-review + garment path
    // with the cache installed; no synthesized clothing or automatic approval.
    const manifest=JSON.parse(await readFile('benchmark/work47/manifest.json','utf8'));
    const shirtRow=manifest.rows.find(r=>r.id==='commons-0003');
    await page.locator('#garment').click();
    assert.equal(await page.locator('#review').isChecked(),false);
    await page.locator('#review').check();
    await page.locator('#dress').click();
    await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.shirt==='source-reviewed',null,{timeout:45000});
    const dressed=await page.evaluate(()=>work58Diagnostics());
    assert.equal(dressed.shirt.sourceSHA256,shirtRow.sourceSHA256);
    assert.equal(dressed.shirt.sharedSkeleton,true);
    assert.equal(dressed.geometries,11);
    assert.equal(dressed.textures,3);
    await page.locator('#garment').click();
    const removed=await page.evaluate(()=>work58Diagnostics());
    assert.equal(removed.shirt,null);
    assert.equal(removed.geometries,9);
    assert.equal(removed.textures,2);
   }
   const metrics=optimized?await page.evaluate(()=>mobile3dMetrics()):null;
   assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
   assert.equal(requests.length,optimized?2:7,'Only verified cached GLB bytes avoid repeated requests');
   if(optimized){
    assert.equal(metrics.cacheEntries,2);assert.equal(metrics.fetches,2);
    assert.equal(metrics.parses,7);assert.equal(metrics.gpuScenesCached,0);
    assert.equal(metrics.verified,2);assert.equal(metrics.refusals,0);
    assert.ok(metrics.cacheBytes>8e6&&metrics.cacheBytes<1e7);
    await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
    const released=await page.evaluate(()=>mobile3dMetrics());
    assert.equal(released.cacheBytes,0);assert.equal(released.installed,false);
   }
   const result={profile:profile.name,width:profile.width,height:profile.height,
    dpr:profile.dpr,mode:optimized?'verified-GLB-buffer-cache':'untouched-Work58-baseline',
    actualGLBRequests:requests.length,firstLoadMs:first.loadMs,switches:timings,
    geometricResources:gpu,anglesDifferent:true,backgroundReturn:true,
    cache:metrics,nativeDevice:false,engine:'Chromium WebGL2 SwiftShader',
    privacy:'offline licensed research only',release:'HOLD'};
   console.log('MOBILE08_BENCH',JSON.stringify(result));return result;
  }finally{await context.close();}
 }
 for(const p of profiles){
  const baseline=await journey(chrome,p,false);
  const improved=await journey(chrome,p,true);
  records.push({profile:p,baseline,optimized:improved,
   requestsAvoided:baseline.actualGLBRequests-improved.actualGLBRequests,
   reductionPercent:100*(baseline.actualGLBRequests-improved.actualGLBRequests)/
    baseline.actualGLBRequests,
   loadTimeNote:'Software renderer model parsing and CPU timing vary. This test proves request count, not FPS speedup.'});
 }
 // Verify mobile touch drag and pinch on the cache build with genuine CDP touch input.
 const ctx=await chrome.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
 const page=await ctx.newPage();
 await page.goto(origin+'/research/three-d-mobile-08/index.html');
 await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true');
 const client=await ctx.newCDPSession(page),rect=await page.locator('#avatar').boundingBox();
 const x=rect.x+rect.width*.5,y=rect.y+rect.height*.5;
 const touch=(type,points)=>client.send('Input.dispatchTouchEvent',{
  type,touchPoints:points.map(([px,py],id)=>({x:px,y:py,id}))});
 const old=await page.locator('#avatar').evaluate(c=>c.toDataURL());
 await touch('touchStart',[[x,y]]);
 for(let i=1;i<=7;i++)await touch('touchMove',[[x+i*9,y]]);
 await touch('touchEnd',[]);
 await page.waitForTimeout(180);
 assert.notEqual(await page.locator('#avatar').evaluate(c=>c.toDataURL()),old);
 const distance=await page.evaluate(()=>work58Diagnostics().cameraDistance);
 await touch('touchStart',[[x-22,y],[x+22,y]]);
 for(let i=1;i<=6;i++)await touch('touchMove',[[x-22-i*7,y],[x+22+i*7,y]]);
 await touch('touchEnd',[]);await page.waitForTimeout(180);
 assert.ok((await page.evaluate(()=>work58Diagnostics().cameraDistance))<distance);
 records.push({touchVerification:'real simulated Chrome two-touch rotation/pinch PASS',
  nativeDevice:false});
 await ctx.close();
 // A single failed model download is retryable, never inserted in verified cache.
 const bad=await chrome.newContext({viewport:{width:390,height:844},
  isMobile:true,hasTouch:true,deviceScaleFactor:3});
 const bp=await bad.newPage();let failOnce=0;
 await bp.route('**/male-cc0-rigged.glb',route=>{
  if(failOnce++===0)return route.abort('failed');
  return route.continue();
 });
 await bp.goto(origin+'/research/three-d-mobile-08/index.html');
 await bp.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true');
 await bp.locator('#model').selectOption('male');
 await bp.waitForFunction(()=>document.querySelector('#status')?.textContent.startsWith('Local preview unavailable:'),null,{timeout:30000});
 assert.equal(await bp.locator('#avatar').getAttribute('data-ready'),'false');
 assert.equal(await bp.evaluate(()=>work58Diagnostics().shirt),null);
 const cacheAfterFailure=await bp.evaluate(()=>mobile3dMetrics());
 assert.ok(!cacheAfterFailure.modelNames.includes('male-cc0-rigged.glb'));
 await bp.locator('#model').evaluate(el=>el.dispatchEvent(new Event('change',{bubbles:true})));
 await bp.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true'&&
  document.querySelector('#avatar')?.dataset.model==='male',null,{timeout:45000});
 assert.equal((await bp.evaluate(()=>mobile3dMetrics())).cacheEntries,2);
 records.push({faultInjection:'first male GLB request deliberately aborted, same model retry succeeded',
  failedLoadCached:false,wardrobeAccountDataTouched:false,
  reviewButtonMayEnableDuringError:true,
  note:'Existing Work58 error-state UI limitation is independently handled in PR409, not changed here'});
 await bad.close();
 // Attempt actual Playwright WebKit (engine-specific, not Safari on physical iPhone).
 const safari={engine:'Playwright WebKit',width:390,height:844,dpr:3,
  launched:false,webgl2:false,modelsLoaded:0,physicalSafari:false,
  release:'HOLD',reason:null};
 try{
  webkitBrowser=await webkit.launch({headless:true});
  safari.launched=true;
  const ctx=await webkitBrowser.newContext({viewport:{width:390,height:844},
   deviceScaleFactor:3,hasTouch:true,isMobile:true});
  const page=await ctx.newPage(),outside=[];
  page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:'+origin)&&!r.url().startsWith('data:'))outside.push(r.url());});
  await page.goto(origin+'/research/three-d-mobile-08/index.html');
  try{
   await page.waitForFunction(()=>['true'].includes(document.querySelector('#avatar')?.dataset.ready)||
    /Preview blocked|preview unavailable|Local preview unavailable/i.test(document.querySelector('#status')?.textContent||''),null,{timeout:40000});
   safari.webgl2=await page.locator('#avatar').evaluate(c=>!!c.getContext('webgl2'));
   if((await page.locator('#avatar').getAttribute('data-ready'))==='true'){
    safari.modelsLoaded++;
    await page.locator('#model').selectOption('male');
    await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.model==='male'&&document.querySelector('#avatar')?.dataset.ready==='true',null,{timeout:40000});
    safari.modelsLoaded++;
    for(const view of ['front','side','back'])await page.locator('#'+view).click();
    safari.outcome='WebKit WebGL model/rotation PASS in Linux emulation';
   }else safari.outcome='WebKit refused WebGL: 3D preview unavailable, no physical Safari claim';
  }catch(e){safari.outcome='WebKit did not finish 3D initialization';safari.reason=String(e.message).slice(0,180);}
  assert.deepEqual(outside,[]);
  await ctx.close();
 }catch(e){safari.reason='WebKit launch unavailable in runner: '+String(e.message).slice(0,230);}
 records.push({webkit:safari});
 await writeFile(output+'/results-HOLD.json',JSON.stringify({researchOnly:true,
  baseline:'exact Work58 7d05929a1a06d80d04a4ea000c419d30761c3c8c',
  verdict:'HOLD',records},null,2)+'\n');
}finally{await webkitBrowser?.close();await chrome?.close();server.close();}
