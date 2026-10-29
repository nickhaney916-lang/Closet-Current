/** Real Chromium failure-recovery proof; exercises product UI on local licensed inputs. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/three\/)/.test(p)||
   p.includes('\\')||p.includes('\0'))throw Error('Blocked outside source');
  const filename=resolve(root,'.'+p);
  if(!filename.startsWith(root+'/'))throw Error('Traversal');
  const buf=await readFile(filename),ext=extname(filename);
  const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html',
   '.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg'};
  res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream','cache-control':'no-store'});
  res.end(buf);
 }catch{res.writeHead(404);res.end('Unavailable test asset');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir('benchmark/three-d-12',{recursive:true});
 for(const scenario of ['no-webgl','blocked-glb','tampered-original','context-loss']){
  const ctx=await browser.newContext({viewport:{width:390,height:850}});
  const page=await ctx.newPage(),external=[],events=[],requests=[];
  page.on('request',r=>{const url=r.url();requests.push(url);if(!url.startsWith(origin)&&
   !url.startsWith('blob:'+origin)&&!url.startsWith('data:'))external.push(url);});
  page.on('pageerror',e=>events.push(e.message));
  if(scenario==='no-webgl'){
   await page.addInitScript(()=>{
    const orig=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){
     if(['webgl','webgl2','experimental-webgl'].includes(type))return null;
     return orig.call(this,type,...args);
    };
   });
  }
  if(scenario==='blocked-glb'){
   await page.route('**/research/three-d-06/models/*.glb',route=>
    route.fulfill({status:404,contentType:'text/plain',body:'Blocked model in deliberate negative test'}));
  }
  if(scenario==='tampered-original'){
   await page.route('**/benchmark/work47/assets/commons-0003.jpg',route=>
    route.fulfill({status:200,contentType:'image/jpeg',body:'corrupted original JPEG bytes'}));
  }
  await page.goto(origin+'/research/three-d-11/index.html?version=after',{waitUntil:'domcontentloaded'});
  if(scenario==='context-loss'){
   await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true',
    null,{timeout:45000});
   await page.locator('#avatar').evaluate(c=>c.dispatchEvent(new Event('webglcontextlost',
    {bubbles:false,cancelable:true})));
  }
  await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.photoOnly==='true',
   null,{timeout:35000});
  const canvas=page.locator('#avatar'),photo=page.locator('#fallbackOriginal');
  assert.equal(await page.locator('#photoFallback').isVisible(),true,scenario);
  assert.equal(await canvas.isHidden(),true,scenario);
  assert.equal(await canvas.getAttribute('data-shirt'),'none');
  assert.equal(await canvas.getAttribute('data-photo-approved'),'false');
  assert.equal(await canvas.getAttribute('data-release-authorized'),'false');
  assert.match(await page.locator('#fallbackReason').innerText(),
   /No outfit was fitted, applied, saved, or approved/);
  for(const id of ['dress','review','pose','model','front','side','back','threequarter','reset','spin',
   'zoomIn','zoomOut','garment','closeReview'])
   assert.equal(await page.locator('#'+id).isDisabled(),true,scenario+' '+id);
  assert.equal(await page.locator('#avatar').getAttribute('data-photo-source'),'');
  if(scenario==='tampered-original'){
   assert.equal(await photo.isHidden(),true,'Corrupt JPEG must NEVER be visible');
   assert.match(await page.locator('#fallbackReason').innerText(),/could not be verified/);
  }else{
   assert.equal(await photo.isVisible(),true,'Valid original clothing must remain accessible');
   const info=await photo.evaluate(img=>({w:img.naturalWidth,h:img.naturalHeight,
    src:img.getAttribute('src')}));
   assert.ok(info.w>100&&info.h>100,JSON.stringify(info));
   assert.ok(info.src.startsWith('blob:'+origin+'/'),
    'Fallback must display in-memory verified original, not re-request source path');
   assert.equal(requests.filter(u=>u===origin+'/benchmark/work47/assets/commons-0003.jpg').length,1,
    'Never perform a second original JPEG request after SHA verification');
   assert.match(await page.locator('#photoStatus').innerText(),
    /Photo only. No 3D shirt, fit, saved outfit or approval/);
  }
  assert.deepEqual(external,[],'Never fetch an external fallback asset');
  await page.screenshot({path:'benchmark/three-d-11/'+scenario+'-390px-original-photo-HOLD.png',
   fullPage:true});
  console.log('THREE_D_12_WORK59_PHOTO_FALLBACK',JSON.stringify({
   scenario,width:390,originalVerified:scenario!=='tampered-original',
   exposedOriginal:scenario!=='tampered-original',
   appliedGarments:0,approved:false,liveOutsideRequests:external.length,
   sourceGLBChanged:false,release:'HOLD',browserErrors:events.length
  }));
  await ctx.close();
 }
}finally{await browser?.close();server.close();}
