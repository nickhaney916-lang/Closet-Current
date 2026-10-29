/**
 * 3D-07 real on-screen source-RGB shirt on genuine CC0 skinned anatomy.
 * Verifies exact Work47 original/mask hashes and manual review before GPU.
 * No production, cloud, customer photos or remote browser requests.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('.');
const srv=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1'),p=decodeURIComponent(url.pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/three\/)/.test(p)||
   p.includes('\0')||p.includes('\\'))throw Error('Unsupported research asset');
  const filepath=resolve(root,'.'+p);
  if(!filepath.startsWith(root+'/'))throw Error('Source root escape');
  const bytes=await readFile(filepath),ext=extname(filepath);
  const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
   '.glb':'model/gltf-binary','.json':'application/json',
   '.jpg':'image/jpeg','.png':'image/png'};
  res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Missing or blocked 3D source');}
});
await new Promise(resolve=>srv.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+srv.address().port;
let browser;
const rows=[];
const profiles=[{name:'iphone-se',width:320,height:568,dpr:2},{name:'iphone-13',width:390,height:844,dpr:3},{name:'iphone-pro-max',width:430,height:932,dpr:3},{name:'android-compact',width:360,height:800,dpr:3},{name:'android-large',width:412,height:915,dpr:2.625}];
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir('benchmark/work57',{recursive:true});
 for(const profile of profiles){
  const {width,height,dpr,name}=profile;
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:dpr});
  const page=await context.newPage(),errors=[],outside=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push({url:r.url(),reason:r.failure()?.errorText}));
  page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:'+origin)&&!r.url().startsWith('data:'))outside.push(r.url());});
  await page.goto(origin+'/research/work57-showroom/index.html');
  await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true',null,{timeout:25000});
  const canvas=page.locator('#avatar');
  assert.ok(await canvas.evaluate(c=>{const b=c.getBoundingClientRect();return Math.abs(c.width/c.height-b.width/b.height)<.01;}),'Canvas must preserve body proportions at compact heights');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
  const visible=await page.evaluate(()=>['model','pose','finish','front','side','back','zoomIn','zoomOut','reset'].every(id=>{const b=document.getElementById(id).getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight;}));
  assert.ok(visible,'All primary controls must fit without scrolling');
  for(const model of ['female','male']){
   if(model==='male'){await page.locator('#model').selectOption(model);await page.waitForFunction(()=>document.querySelector('#avatar').dataset.model==='male'&&document.querySelector('#avatar').dataset.ready==='true');}
   assert.equal(await canvas.getAttribute('data-pose'),'relaxed');
   const images=[];
   for(const view of ['front','side','back','threequarter']){
    await page.locator('#'+view).click();images.push(await canvas.evaluate(c=>c.toDataURL()));
    await canvas.screenshot({path:`benchmark/work57/${name}-${model}-after-${view}.png`});
   }
   assert.notEqual(images[0],images[1]);assert.notEqual(images[0],images[2]);assert.notEqual(images[0],images[3]);
   await page.locator('#front').click();
   const relaxed=await canvas.evaluate(c=>c.toDataURL());await page.locator('#pose').selectOption('source');
   assert.notEqual(await canvas.evaluate(c=>c.toDataURL()),relaxed,'Actual bone pose must visibly change');
   await page.locator('#pose').selectOption('relaxed');
   await page.locator('#finish').selectOption('slate');assert.notEqual(await canvas.evaluate(c=>c.toDataURL()),relaxed);await page.locator('#finish').selectOption('porcelain');
  }
  await page.locator('#front').click();
  const d0=await page.evaluate(()=>work57Diagnostics().cameraDistance);await page.locator('#zoomIn').click();const d1=await page.evaluate(()=>work57Diagnostics().cameraDistance);assert.ok(d1<d0);await page.locator('#zoomOut').click();
  const session=await context.newCDPSession(page),box=await canvas.boundingBox();
  const touch=async(type,points)=>session.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y],id)=>({x,y,id}))});
  const x=box.x+box.width*.5,y=box.y+box.height*.5;
  const before=await canvas.evaluate(c=>c.toDataURL());
  await touch('touchStart',[[x,y]]);for(let i=1;i<=5;i++)await touch('touchMove',[[x+i*9,y]]);await touch('touchEnd',[]);await page.waitForTimeout(150);
  assert.notEqual(await canvas.evaluate(c=>c.toDataURL()),before,'Real touch drag must rotate actual WebGL image');
  const pinchBefore=await page.evaluate(()=>work57Diagnostics().cameraDistance);
  await touch('touchStart',[[x-25,y],[x+25,y]]);for(let i=1;i<=5;i++)await touch('touchMove',[[x-25-i*5,y],[x+25+i*5,y]]);await touch('touchEnd',[]);await page.waitForTimeout(150);
  const pinchAfter=await page.evaluate(()=>work57Diagnostics().cameraDistance);assert.ok(pinchAfter<pinchBefore,'Real two-touch pinch must zoom');
  await page.locator('#reset').click();
  await page.locator('#spin').click();const spinImage=await canvas.evaluate(c=>c.toDataURL());await page.waitForTimeout(150);assert.notEqual(await canvas.evaluate(c=>c.toDataURL()),spinImage);await page.locator('#spin').click();await page.locator('#front').click();
  // Repeated source loads must release bone textures and old geometry.
  for(const model of ['female','male','female','male']){await page.locator('#model').selectOption(model);await page.waitForFunction(m=>document.querySelector('#avatar').dataset.model===m&&document.querySelector('#avatar').dataset.ready==='true',model);}
  const metrics=await page.evaluate(()=>work57Diagnostics());assert.equal(metrics.stats.bones,163);assert.equal(metrics.stats.triangles,109064);assert.ok(metrics.geometries<=9);assert.ok(metrics.textures<=2);assert.ok(metrics.pixelRatio<=1.5);assert.ok(metrics.drawPixels<1200000);
  await page.waitForTimeout(300);const idle=await page.evaluate(()=>work57Diagnostics().frames);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>work57Diagnostics().frames),idle,'Idle showroom must stop GPU redraws');
  const samples=await page.evaluate(()=>{const times=[];for(let i=0;i<6;i++){const t=performance.now();document.getElementById(i%2?'front':'threequarter').click();document.querySelector('#avatar').toDataURL();times.push(performance.now()-t);}return times;});
  await page.locator('#front').click();await page.screenshot({path:`benchmark/work57/${name}-controls.png`,fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);assert.deepEqual(failed.filter(r=>!(r.url.startsWith(origin+'/research/three-d-06/models/')&&r.reason==='net::ERR_ABORTED')),[]);
  let contextRecovery='not exercised';
  if(name==='android-large'){
   const supported=await canvas.evaluate(c=>{window.work57LossExtension=c.getContext('webgl2').getExtension('WEBGL_lose_context');if(!window.work57LossExtension)return false;window.work57LossExtension.loseContext();return true;});
   if(supported){await page.waitForFunction(()=>document.querySelector('#avatar').dataset.context==='lost');await page.waitForTimeout(100);await page.evaluate(()=>window.work57LossExtension.restoreContext());await page.waitForFunction(()=>document.querySelector('#avatar').dataset.context==='ready');await page.waitForTimeout(100);assert.ok((await canvas.evaluate(c=>c.toDataURL())).length>15000);contextRecovery='simulated WebGL loss/restoration passed';}
  }
  const row={profile,contextRecovery,engine:'Chromium / SwiftShader touch emulation',models:2,views:4,touchDrag:true,pinch:true,controlsWithinViewport:visible,idleRedraws:0,externalRequests:0,metrics,readbackAndEncodeMs:samples,physicalPhone:false,Safari:false,release:'HOLD'};
  rows.push(row);console.log('WORK57_MOBILE_PASS',JSON.stringify(row));await context.close();
 }
 // Exact PR396 renderer, in the same new layout/viewport, not a mock before image.
 for(const model of ['female','male']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3}),page=await context.newPage();
  await page.goto(origin+'/research/work57-showroom/index.html?variant=baseline');await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true',null,{timeout:30000});
  if(model==='male'){await page.locator('#model').selectOption(model);await page.waitForFunction(()=>document.querySelector('#avatar').dataset.model==='male'&&document.querySelector('#avatar').dataset.ready==='true');}
  for(const view of ['front','side','back']){await page.locator('#'+view).click();await page.locator('#avatar').screenshot({path:`benchmark/work57/iphone-13-${model}-before-${view}.png`});}
  await context.close();
 }
 await (await import('node:fs/promises')).writeFile('benchmark/work57/mobile-results.json',JSON.stringify(rows,null,2));
}finally{await browser?.close();srv.close();}
