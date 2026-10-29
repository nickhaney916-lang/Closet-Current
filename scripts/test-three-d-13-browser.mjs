/**
 * Work60: before/after separate neutral pants with unchanged verified AJ shirt.
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
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});await mkdir('benchmark/three-d-13',{recursive:true});
 for(const version of ['before','after'])for(const {width,height,dpr} of [{width:320,height:568,dpr:2},{width:390,height:844,dpr:3},{width:430,height:932,dpr:3}]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:dpr}),page=await context.newPage(),errors=[],outside=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push({url:r.url(),reason:r.failure()?.errorText}));page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:'+origin)&&!r.url().startsWith('data:'))outside.push(r.url());});
  await page.goto(origin+'/research/three-d-13/index.html?version='+version);await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true',null,{timeout:30000});
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
   const attached=await page.evaluate(()=>work60Diagnostics());assert.equal(attached.shirt.sharedSkeleton,true);assert.equal(attached.shirt.fitPose,'source');assert.equal(attached.shirt.sourceSHA256,row.sourceSHA256);assert.equal(attached.stats.bones,163);assert.equal(attached.shirt.triangles,model==='male'?19960:19815,'Unchanged Work59 shirt topology');assert.equal(attached.geometries,version==='after'?13:12);assert.equal(!!attached.pants,version==='after');if(attached.pants){assert.equal(attached.pants.photoApplied,false);assert.equal(attached.pants.sharedSkeleton,true);assert.equal(attached.pants.triangles,model==='male'?11959:11831);assert.equal(attached.pants.unsealedEdges,0)};assert.equal(attached.textures,3);
   const posePixels=[];
   for(const pose of ['source','relaxed']){
    await page.locator('#pose').selectOption(pose);const views=[];
    for(const view of ['front','side','back','threequarter']){await page.locator('#'+view).click();views.push(await canvas.evaluate(c=>c.toDataURL()));await canvas.screenshot({path:`benchmark/three-d-13/${version}-${model}-${width}-${pose}-${view}-HOLD.png`});}
    assert.notEqual(views[0],views[1]);assert.notEqual(views[0],views[2]);posePixels.push(views[0]);
   }
   assert.notEqual(posePixels[0],posePixels[1],'Body and garment should visibly lower arms');
   for(let i=0;i<6;i++){await page.locator('#pose').selectOption('source');await page.locator('#pose').selectOption('relaxed');}
   const posed=await page.evaluate(()=>work60Diagnostics());assert.equal(posed.attachments,attached.attachments,'Posing never rebuilds shirt');assert.equal(posed.shirt.sourceSHA256,attached.shirt.sourceSHA256);assert.equal(posed.geometries,attached.geometries);assert.equal(posed.textures,attached.textures);
  }
  await page.locator('#front').click();const session=await context.newCDPSession(page),box=await canvas.boundingBox(),x=box.x+box.width*.5,y=box.y+box.height*.5;
  const touch=(type,pts)=>session.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([x,y],id)=>({x,y,id}))});
  const image=await canvas.evaluate(c=>c.toDataURL());await touch('touchStart',[[x,y]]);for(let i=1;i<=5;i++)await touch('touchMove',[[x+8*i,y]]);await touch('touchEnd',[]);await page.waitForTimeout(150);assert.notEqual(await canvas.evaluate(c=>c.toDataURL()),image);assert.ok((await page.evaluate(()=>work60Diagnostics())).shirt);
  const before=await page.evaluate(()=>work60Diagnostics().cameraDistance);await touch('touchStart',[[x-25,y],[x+25,y]]);for(let i=1;i<=5;i++)await touch('touchMove',[[x-25-5*i,y],[x+25+5*i,y]]);await touch('touchEnd',[]);await page.waitForTimeout(150);assert.ok((await page.evaluate(()=>work60Diagnostics().cameraDistance))<before);
  await page.locator('#reset').click();
  // Quiet wall time can conceal a stalled software GPU and a late damping
  // frame. Require 120 actual animation cycles without redraw, bounded at20s;
  // continuous rendering fails. Then independently monitor another60 cycles.
  const idle=await page.evaluate(()=>new Promise((resolve,reject)=>{let frame=work60Diagnostics().frames,quiet=0;const began=performance.now();const tick=()=>{const next=work60Diagnostics().frames;if(next===frame)quiet++;else{frame=next;quiet=0;}if(performance.now()-began>20000)return reject(Error('Camera never became idle'));if(quiet>=120)return resolve(frame);requestAnimationFrame(tick);};requestAnimationFrame(tick);}));
  await page.evaluate(expected=>new Promise((resolve,reject)=>{let cycles=0;const tick=()=>{if(work60Diagnostics().frames!==expected)return reject(Error('Unexpected idle GPU redraw'));if(++cycles===60)return resolve();requestAnimationFrame(tick);};requestAnimationFrame(tick);}),idle);
  for(let i=0;i<3;i++){await page.locator('#garment').click();const cleared=await page.evaluate(()=>work60Diagnostics());assert.equal(cleared.shirt,null);assert.equal(cleared.geometries,version==='after'?10:9);assert.equal(cleared.textures,2);await dress();}
  if(version==='after'){for(let i=0;i<3;i++){await page.locator('#pants').click();let s=await page.evaluate(()=>work60Diagnostics());assert.equal(s.pants,null);assert.equal(s.geometries,12);assert.equal(s.textures,3);await page.locator('#pants').click();s=await page.evaluate(()=>work60Diagnostics());assert.ok(s.pants);assert.equal(s.geometries,13);assert.equal(s.textures,3);}}
  const measured=await page.evaluate(()=>{const samples=[];for(let i=0;i<6;i++){const t=performance.now();document.getElementById(i%2?'front':'threequarter').click();document.querySelector('#avatar').toDataURL();samples.push(performance.now()-t);}return samples;});
  await page.locator('#front').click();await page.screenshot({path:`benchmark/three-d-13/${version}-mobile-${width}-HOLD.png`,fullPage:true});
  const state=await page.evaluate(()=>work60Diagnostics());assert.deepEqual(await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)})),{local:[],session:[]});assert.ok(state.drawPixels<1200000);assert.ok(state.pixelRatio<=1.5);assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);assert.deepEqual(failed.filter(r=>!(r.url.startsWith(origin+'/research/three-d-06/models/')&&r.reason==='net::ERR_ABORTED')),[]);
  const canvasCss=await canvas.boundingBox();if(version==='after'){const base=results.find(r=>r.version==='before'&&r.width===width);assert.equal(canvasCss.width,base.canvasCss.width);assert.equal(canvasCss.height,base.canvasCss.height,'Pants toggle must not resize the comparison canvas');}
  const record={canvasCss:{width:canvasCss.width,height:canvasCss.height},width,height,dpr,version,models:2,poses:2,views:4,touchRotation:true,pinch:true,sourceIntegrity:true,sameSkeleton:true,noRebuildOnPose:true,clearResources:{geometries:version==='after'?10:9,textures:2},dressedResources:{geometries:state.geometries,textures:state.textures},idleGPURedraws:0,externalRequests:0,drawPixels:state.drawPixels,readbackAndEncodeMs:measured,engine:'Chromium WebGL2 / SwiftShader',nativePhone:false,Safari:false,release:'HOLD'};results.push(record);console.log('THREE_D_13_PASS',JSON.stringify(record));await context.close();
 }
 // A corrupted stock PNG response is synthetic test data, never a file edit.
 const context=await browser.newContext(),page=await context.newPage();await page.route('**/benchmark/work47/assets/commons-0003.png',r=>r.fulfill({status:200,contentType:'image/png',body:Buffer.alloc(400)}));await page.goto(origin+'/research/three-d-13/index.html');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('hash mismatch'));assert.ok(await page.locator('#garment').isDisabled());assert.equal(await page.evaluate(()=>work60Diagnostics().shirt),null);await context.close();
 const pc=await browser.newContext(),pp=await pc.newPage();await pp.route('**/benchmark/work47/assets/commons-0021.jpg',r=>r.fulfill({status:200,contentType:'image/jpeg',body:Buffer.alloc(400)}));await pp.goto(origin+'/research/three-d-13/index.html');await pp.waitForFunction(()=>document.querySelector('#status').textContent.includes('hash mismatch'));assert.ok(await pp.locator('#pants').isDisabled());assert.equal(await pp.evaluate(()=>work60Diagnostics().pants),null);await pc.close();
 await (await import('node:fs/promises')).writeFile('benchmark/three-d-13/results.json',JSON.stringify({profiles:results,corruptedCutoutBlocked:true,corruptedPantsReferenceBlocked:true},null,2));
}finally{await browser?.close();srv.close();}
