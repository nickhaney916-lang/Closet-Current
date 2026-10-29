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
let browser;const results=[];
const row=JSON.parse(await readFile('benchmark/work47/manifest.json')).rows.find(x=>x.id==='commons-0003');
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});await mkdir('benchmark/three-d-11',{recursive:true});
 for(const version of ['before','after'])for(const {width,height,dpr} of [{width:320,height:568,dpr:2},{width:390,height:844,dpr:3},{width:430,height:932,dpr:3}]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:dpr}),page=await context.newPage(),errors=[],outside=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push({url:r.url(),reason:r.failure()?.errorText}));page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:'+origin)&&!r.url().startsWith('data:'))outside.push(r.url());});
  await page.goto(origin+'/research/three-d-11/index.html?version='+version);await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true',null,{timeout:30000});
  const canvas=page.locator('#avatar');assert.equal(await canvas.getAttribute('data-shirt'),'none');
  assert.ok(await canvas.evaluate(c=>!!c.getContext('webgl2')));assert.ok(await canvas.evaluate(c=>{const b=c.getBoundingClientRect();return Math.abs(c.width/c.height-b.width/b.height)<.01;}));
  assert.ok(await page.evaluate(()=>['model','pose','garment','front','side','back','reset','zoomIn','zoomOut'].every(id=>{const b=document.getElementById(id).getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight;})),'Primary controls fit viewport');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  async function dress(){
   await page.locator('#garment').click();assert.equal(await page.locator('#review').isChecked(),false);assert.ok(await page.locator('#dress').isDisabled());await page.locator('#review').check();
   await page.evaluate(()=>document.getElementById('dress').click());assert.equal(await canvas.getAttribute('data-shirt'),'none','Scripted click cannot authorize photo');
   await page.locator('#dress').click();await page.waitForFunction(()=>document.querySelector('#avatar').dataset.shirt==='source-reviewed');
  }
  for(const model of ['female','male']){
   if(model==='male'){await page.locator('#model').selectOption(model);await page.waitForFunction(()=>document.querySelector('#avatar').dataset.model==='male'&&document.querySelector('#avatar').dataset.ready==='true');assert.equal(await canvas.getAttribute('data-shirt'),'none');}
   await page.locator('#pose').selectOption('relaxed');await dress();
   const attached=await page.evaluate(()=>work59Diagnostics());assert.equal(attached.shirt.sharedSkeleton,true);assert.equal(attached.shirt.fitPose,'source');assert.equal(attached.shirt.sourceSHA256,row.sourceSHA256);assert.equal(attached.stats.bones,163);assert.ok(attached.shirt.triangles>19000);assert.equal(attached.geometries,version==='after'?12:11);assert.equal(attached.textures,3);
   const posePixels=[];
   for(const pose of ['source','relaxed']){
    await page.locator('#pose').selectOption(pose);const views=[];
    for(const view of ['front','side','back','threequarter']){await page.locator('#'+view).click();views.push(await canvas.evaluate(c=>c.toDataURL()));await canvas.screenshot({path:`benchmark/three-d-11/${version}-${model}-${width}-${pose}-${view}-HOLD.png`});}
    assert.notEqual(views[0],views[1]);assert.notEqual(views[0],views[2]);posePixels.push(views[0]);
   }
   assert.notEqual(posePixels[0],posePixels[1],'Body and garment should visibly lower arms');
   for(let i=0;i<6;i++){await page.locator('#pose').selectOption('source');await page.locator('#pose').selectOption('relaxed');}
   const posed=await page.evaluate(()=>work59Diagnostics());assert.equal(posed.attachments,attached.attachments,'Posing never rebuilds shirt');assert.equal(posed.shirt.sourceSHA256,attached.shirt.sourceSHA256);assert.equal(posed.geometries,attached.geometries);assert.equal(posed.textures,attached.textures);
  }
  await page.locator('#front').click();const session=await context.newCDPSession(page),box=await canvas.boundingBox(),x=box.x+box.width*.5,y=box.y+box.height*.5;
  const touch=(type,pts)=>session.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([x,y],id)=>({x,y,id}))});
  const image=await canvas.evaluate(c=>c.toDataURL());await touch('touchStart',[[x,y]]);for(let i=1;i<=5;i++)await touch('touchMove',[[x+8*i,y]]);await touch('touchEnd',[]);await page.waitForTimeout(150);assert.notEqual(await canvas.evaluate(c=>c.toDataURL()),image);assert.ok((await page.evaluate(()=>work59Diagnostics())).shirt);
  const before=await page.evaluate(()=>work59Diagnostics().cameraDistance);await touch('touchStart',[[x-25,y],[x+25,y]]);for(let i=1;i<=5;i++)await touch('touchMove',[[x-25-5*i,y],[x+25+5*i,y]]);await touch('touchEnd',[]);await page.waitForTimeout(150);assert.ok((await page.evaluate(()=>work59Diagnostics().cameraDistance))<before);
  await page.locator('#reset').click();await page.waitForFunction(()=>{const frame=work59Diagnostics().frames,now=performance.now(),previous=window.__work59Idle;if(!previous||previous.frame!==frame){window.__work59Idle={frame,since:now};return false;}return now-previous.since>350;},null,{timeout:8000});const idle=await page.evaluate(()=>work59Diagnostics().frames);
  await page.waitForTimeout(700);
  const idleEnd=await page.evaluate(()=>work59Diagnostics().frames);
  // One trailing damping/resize draw can complete after 350ms of apparent
  // stillness in software WebGL; sustained idle redraws remain a regression.
  assert.ok(idleEnd-idle<=1,
   'Unexpected continuous idle WebGL renders: '+(idleEnd-idle)+' over 700ms');
  for(let i=0;i<3;i++){await page.locator('#garment').click();const cleared=await page.evaluate(()=>work59Diagnostics());assert.equal(cleared.shirt,null);assert.equal(cleared.geometries,9);assert.equal(cleared.textures,2);await dress();}
  const measured=await page.evaluate(()=>{const samples=[];for(let i=0;i<6;i++){const t=performance.now();document.getElementById(i%2?'front':'threequarter').click();document.querySelector('#avatar').toDataURL();samples.push(performance.now()-t);}return samples;});
  await page.locator('#front').click();await page.screenshot({path:`benchmark/three-d-11/${version}-mobile-${width}-HOLD.png`,fullPage:true});
  const state=await page.evaluate(()=>work59Diagnostics());assert.ok(state.drawPixels<1200000);assert.ok(state.pixelRatio<=1.5);assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);assert.deepEqual(failed.filter(r=>!(r.url.startsWith(origin+'/research/three-d-06/models/')&&r.reason==='net::ERR_ABORTED')),[]);
  const record={width,height,dpr,version,models:2,poses:2,views:4,touchRotation:true,pinch:true,sourceIntegrity:true,sameSkeleton:true,noRebuildOnPose:true,clearResources:{geometries:9,textures:2},dressedResources:{geometries:state.geometries,textures:state.textures},idleGPURedraws:idleEnd-idle,externalRequests:0,drawPixels:state.drawPixels,readbackAndEncodeMs:measured,engine:'Chromium WebGL2 / SwiftShader',nativePhone:false,Safari:false,release:'HOLD'};results.push(record);console.log('THREE_D_11_PASS',JSON.stringify(record));await context.close();
 }
 // A corrupted stock PNG response is synthetic test data, never a file edit.
 const context=await browser.newContext(),page=await context.newPage();await page.route('**/benchmark/work47/assets/commons-0003.png',r=>r.fulfill({status:200,contentType:'image/png',body:Buffer.alloc(400)}));await page.goto(origin+'/research/three-d-11/index.html');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('hash mismatch'));assert.ok(await page.locator('#garment').isDisabled());assert.equal(await page.evaluate(()=>work59Diagnostics().shirt),null);await context.close();
 await (await import('node:fs/promises')).writeFile('benchmark/three-d-11/results.json',JSON.stringify({profiles:results,corruptedCutoutBlocked:true},null,2));
}finally{await browser?.close();srv.close();}
