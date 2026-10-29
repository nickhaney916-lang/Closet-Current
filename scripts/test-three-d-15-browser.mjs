/**
 * Work61: unified atomic real-garment outfit browser regression.
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
let browser,activePage;const profiles=[],states=[],viewBounds=new Map();
const stock=JSON.parse(await readFile('benchmark/work47/manifest.json')).rows;
async function state(page){return page.evaluate(()=>work61Diagnostics());}
async function review(page,mode){
 await page.locator('#outfit').selectOption(mode);await page.locator('#reviewDialog').waitFor({state:'visible'});assert.equal(await page.locator('#review').isChecked(),false);assert.ok(await page.locator('#dress').isDisabled());await page.locator('#review').check();const old=(await state(page)).outfit.mode;await page.evaluate(()=>document.getElementById('dress').click());assert.equal((await state(page)).outfit.mode,old,'Scripted click cannot authorize photographed fabric');await page.locator('#dress').click();await page.waitForFunction(mode=>work61Diagnostics().outfit.mode===mode,mode);
}
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});await mkdir('benchmark/three-d-15',{recursive:true});
 for(const version of ['before','after'])for(const {width,height,dpr} of [{width:320,height:568,dpr:2},{width:390,height:844,dpr:3},{width:430,height:932,dpr:3}]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:dpr}),page=await context.newPage(),errors=[],outside=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{const u=r.url();if(u.startsWith('blob:'+origin)||u.startsWith('data:'))return;if(!u.startsWith(origin)||!/^\/(research\/|benchmark\/|node_modules\/three\/)/.test(new URL(u).pathname))outside.push(u);});
  activePage=page;await page.goto(origin+'/research/three-d-15/index.html?version='+version);await page.waitForFunction(()=>document.querySelector('#avatar').dataset.ready==='true',null,{timeout:40000});const canvas=page.locator('#avatar');assert.ok(await canvas.evaluate(c=>!!c.getContext('webgl2')));
  assert.ok(await page.evaluate(()=>['model','pose','outfit','remove','front','side','back','zoomIn','zoomOut'].every(id=>{const b=document.getElementById(id).getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight&&b.left>=0&&b.right<=visualViewport.width+.1;})),'Primary controls fit mobile');assert.ok(await page.evaluate(expected=>document.documentElement.scrollWidth<=expected,width),'No overflow beyond the requested physical CSS viewport');
  for(const model of ['female','male']){
   if(model==='male'){await page.locator('#model').selectOption(model);await page.waitForFunction(()=>document.querySelector('#avatar').dataset.model==='male'&&document.querySelector('#avatar').dataset.ready==='true');}assert.equal((await state(page)).outfit.mode,'pants');
   for(const mode of ['shirt-pants','dress']){
    await review(page,mode);const attached=await state(page),source=mode==='dress'?'commons-0053':'commons-0003';assert.equal(attached.stats.bones,163);assert.equal(attached.outfit[mode==='dress'?'dress':'shirt'].sourceSHA256,stock.find(r=>r.id===source).sourceSHA256);
    const expected=mode==='shirt-pants'?13:version==='after'?11:10;assert.equal(attached.geometries,expected);assert.equal(attached.textures,3);assert.equal(attached.outfit.garmentMeshes,mode==='shirt-pants'?4:version==='after'?2:1);
    if(mode==='dress'){assert.equal(attached.outfit.shirt,null);assert.equal(attached.outfit.pants,null);assert.ok(attached.outfit.dress.sharedSkeleton);}else{assert.equal(attached.outfit.dress,null);assert.equal(attached.outfit.pants.photoApplied,false);assert.equal(attached.outfit.shirt.triangles,model==='male'?19960:19815);}
    const poseImages=[];
    for(const pose of ['source','relaxed']){
     await page.locator('#pose').selectOption(pose);const images=[];
     for(const view of ['front','threequarter','side','back']){
      await page.locator('#'+view).click();const box=await canvas.boundingBox(),key=[model,width,mode,pose,view].join('/');if(version==='before')viewBounds.set(key,{width:box.width,height:box.height});else assert.deepEqual({width:box.width,height:box.height},viewBounds.get(key),'Identical camera canvas dimensions');
      images.push(await canvas.evaluate(c=>c.toDataURL()));await canvas.screenshot({path:`benchmark/three-d-15/${version}-${model}-${width}-${mode}-${pose}-${view}-HOLD.png`});
     }
     assert.equal(new Set(images).size,4,'Four genuine viewing angles');poseImages.push(images[0]);
    }
    if(mode==='shirt-pants')assert.notEqual(...poseImages,'Real sleeves lower with pose');
    for(let i=0;i<3;i++){await page.locator('#pose').selectOption('source');await page.locator('#pose').selectOption('relaxed');}const posed=await state(page);assert.equal(posed.outfit.changes,attached.outfit.changes,'Posing never rebuilds outfit');assert.equal(posed.geometries,expected);assert.equal(posed.textures,3);
    if(model==='male'){await page.locator('#front').click();await page.screenshot({path:`benchmark/three-d-15/${version}-mobile-${width}-${mode}-HOLD.png`,fullPage:true});}
   }
   // Cancel/uncheck retain the current dress; no partial incompatible layers.
   await page.locator('#outfit').selectOption('shirt-pants');await page.locator('#reviewDialog').waitFor({state:'visible'});await page.locator('#review').check();await page.locator('#review').uncheck();assert.ok(await page.locator('#dress').isDisabled());await page.locator('#closeReview').click();assert.equal((await state(page)).outfit.mode,'dress');assert.equal(await page.locator('#outfit').inputValue(),'dress');
   await page.locator('#remove').click();const clear=await state(page);assert.equal(clear.outfit.mode,'none');assert.equal(clear.outfit.garmentMeshes,0);assert.equal(clear.geometries,9);assert.equal(clear.textures,2);
   // Repeated mixed-source changes must not accumulate textures or skeletons.
   for(let i=0;i<2;i++){await review(page,'shirt');assert.equal((await state(page)).geometries,12);await review(page,'dress');assert.equal((await state(page)).geometries,version==='after'?11:10);await page.locator('#outfit').selectOption('pants');const p=await state(page);assert.equal(p.geometries,10);assert.equal(p.textures,2);assert.equal(p.outfit.shirt,null);assert.equal(p.outfit.dress,null);}
   states.push({version,width,model,bodyBones:163,outfitGeometry:13,dressGeometry:version==='after'?11:10,removedGeometry:9,textures:3,release:'HOLD'});
  }
  await review(page,'shirt-pants');await page.locator('#front').click();const session=await context.newCDPSession(page),box=await canvas.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2,touch=(type,pts)=>session.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([x,y],id)=>({x,y,id}))});
  const pixels=await canvas.evaluate(c=>c.toDataURL());await touch('touchStart',[[x,y]]);for(let i=1;i<=5;i++)await touch('touchMove',[[x+8*i,y]]);await touch('touchEnd',[]);await page.waitForTimeout(150);assert.notEqual(await canvas.evaluate(c=>c.toDataURL()),pixels);const dist=(await state(page)).cameraDistance;await touch('touchStart',[[x-25,y],[x+25,y]]);for(let i=1;i<=5;i++)await touch('touchMove',[[x-25-5*i,y],[x+25+5*i,y]]);await touch('touchEnd',[]);await page.waitForTimeout(150);assert.ok((await state(page)).cameraDistance<dist);
  await page.locator('#reset').click();const idle=await page.evaluate(()=>new Promise((resolve,reject)=>{let frame=work61Diagnostics().frames,quiet=0;const began=performance.now(),tick=()=>{const next=work61Diagnostics().frames;if(next===frame)quiet++;else{frame=next;quiet=0;}if(performance.now()-began>20000)return reject(Error('Never idle'));if(quiet===120)return resolve(frame);requestAnimationFrame(tick);};requestAnimationFrame(tick);}));await page.evaluate(expected=>new Promise((resolve,reject)=>{let n=0;const tick=()=>{if(work61Diagnostics().frames!==expected)return reject(Error('Idle redraw'));if(++n===60)return resolve();requestAnimationFrame(tick);};requestAnimationFrame(tick);}),idle);
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);assert.deepEqual(await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)})),{local:[],session:[]});const s=await state(page);assert.ok(s.drawPixels<1200000&&s.pixelRatio<=1.5);profiles.push({version,width,height,dpr,engine:'Chromium WebGL2 / SwiftShader',models:2,outfits:2,poses:2,views:4,sourceHashes:true,atomicDressExclusivity:true,cancelRollback:true,stableResources:true,touch:true,pinch:true,idleRedraws:0,externalRequests:0,nativePhone:false,release:'HOLD'});console.log('WORK61_BROWSER_PASS',JSON.stringify(profiles.at(-1)));await context.close();
 }
 // Verify failed new dress source preserves an already valid shirt+neutral pants.
 const context=await browser.newContext(),page=await context.newPage();await page.goto(origin+'/research/three-d-15/index.html');await page.waitForFunction(()=>document.querySelector('#avatar').dataset.ready==='true');await review(page,'shirt-pants');await page.route('**/benchmark/work47/assets/commons-0053.png',r=>r.fulfill({status:200,contentType:'image/png',body:Buffer.alloc(400)}));await page.locator('#outfit').selectOption('dress');await page.locator('#reviewDialog').waitFor({state:'visible'});await page.locator('#review').check();await page.locator('#dress').click();await page.waitForFunction(()=>document.querySelector('#photoStatus').textContent.includes('hash mismatch'));assert.equal((await state(page)).outfit.mode,'shirt-pants');assert.equal((await state(page)).geometries,13);await page.locator('#closeReview').click();await context.close();
 await (await import('node:fs/promises')).writeFile('benchmark/three-d-15/results.json',JSON.stringify({profiles,states,corruptedNewSourceRetainsPrevious:true,release:'HOLD'},null,2));
}catch(e){if(activePage&&!activePage.isClosed()){console.error('WORK61_STARTUP_DIAGNOSTIC',await activePage.evaluate(()=>({status:document.querySelector('#status')?.textContent,photo:document.querySelector('#photoStatus')?.textContent,canvas:document.querySelector('#avatar')?.dataset,diagnostics:window.work61Diagnostics?.()})));}throw e;}finally{await browser?.close();srv.close();}
