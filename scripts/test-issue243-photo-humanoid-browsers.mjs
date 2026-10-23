import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';import fs from 'node:fs';import {resolve,extname} from 'node:path';import assert from 'node:assert/strict';
const root=resolve('dist'),out='artifacts/issue243',mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json'};fs.mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!path.startsWith(root+'/'))throw Error('path');res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(fs.readFileSync(path));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,report=[];
try{
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader']}: {})});
  try{for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1,serviceWorkers:'block'}),errors=[],external=[];
   await context.route('**/*',route=>{const u=route.request().url();if(u.startsWith(origin+'/')||u.startsWith('blob:')||u.startsWith('data:'))return route.continue();external.push(u);return route.abort();});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));const start=performance.now();
   await page.goto(origin+'/humanoid-3d-photo-demo.html');await page.evaluate(()=>__photoLab.ready);const loadMs=performance.now()-start;
   const initial=await page.evaluate(async()=>{
    const {getVerifiedPhotoFrame}=await import('/humanoid-3d-photo-session.mjs');const f=getVerifiedPhotoFrame(__photoLab.token);
    const digests=await Promise.all(__photoLab.sourceBytes.map(async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).join(',')));
    window.__originalDigests=digests;
    return {state:__photoLab.after.getState(),sourceCount:f.materials.length,textureBytes:f.materials.reduce((n,x)=>n+x.rgba.byteLength,0)};
   });
   if(engine===chromium)assert.equal(initial.state.supported,true,'Chromium software WebGL required for actual texture verification');
   const countRed=async id=>page.evaluate(id=>{const c=document.getElementById(id),gl=c.getContext('webgl');if(!gl)return null;const rgba=new Uint8Array(c.width*c.height*4);gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,rgba);let count=0;for(let i=0;i<rgba.length;i+=4)if(rgba[i]===177&&rgba[i+1]===40&&rgba[i+2]===57&&rgba[i+3]===255)count++;return count;},id);
   let sourceColorPixels=null,backSourcePixels=null;
   if(initial.state.supported){sourceColorPixels=await countRed('after');assert.ok(sourceColorPixels>20,'Actual source red logo pixels must appear on front mesh');assert.equal(initial.state.textureCount,3);}
   if(width===390){await page.locator('#before').screenshot({path:out+'/'+engine.name()+'-before-front.png'});await page.locator('#after').screenshot({path:out+'/'+engine.name()+'-after-front.png'});}
   await page.locator('#yaw').fill('180');await page.locator('#yaw').dispatchEvent('input');assert.match(await page.locator('#surface').textContent(),/ESTIMATED SIDE \/ BACK/);
   if(initial.state.supported){backSourcePixels=await countRed('after');assert.equal(backSourcePixels,0,'Do not stamp front logo onto estimated back');}
   if(width===390)await page.locator('#after').screenshot({path:out+'/'+engine.name()+'-after-back-estimated.png'});
   await page.locator('#yaw').fill('360');await page.locator('#yaw').dispatchEvent('input');
   if(initial.state.supported)assert.ok(Math.abs((await page.evaluate(()=>__photoLab.after.getState())).yaw)<1e-6);
   const scenarios=[];
   for(const name of ['short','skirt','jacket','layers','dress']){
    const t=performance.now();await page.evaluate(name=>__photoLab.show(name),name);const state=await page.evaluate(()=>__photoLab.after.getState());
    if(state.supported){assert.ok(state.textureCount>=2&&state.textureCount<=6);if(name==='dress'){assert.ok(state.drawn.includes('dress-skirt'));assert.ok(!state.drawn.includes('trouser-waist'));}if(name==='jacket')assert.ok(state.drawn.includes('layer2-contoured-shell'));if(name==='skirt')assert.ok(state.drawn.includes('separate-skirt'));}
    scenarios.push({name,prepareAndUploadWallMs:Math.round((performance.now()-t)*10)/10,drawn:state.drawn||[],textures:state.textureCount||0});
    if(width===390&&['jacket','layers','dress'].includes(name))await page.locator('#after').screenshot({path:out+'/'+engine.name()+'-'+name+'.png'});
   }
   const sourceUnchanged=await page.evaluate(async()=>{const now=await Promise.all(__photoLab.sourceBytes.map(async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).join(',')));return JSON.stringify(now)===JSON.stringify(__originalDigests);});assert.equal(sourceUnchanged,true);
   const performanceSamples=await page.evaluate(async()=>{
    if(!__photoLab.after.supported)return null;const gl=document.getElementById('after').getContext('webgl'),samples=[];
    for(let i=0;i<60;i++)await new Promise(ok=>requestAnimationFrame(()=>{const t=performance.now();__photoLab.after.rotate(Math.PI/30);gl.finish();samples.push(performance.now()-t);ok();}));samples.sort((a,b)=>a-b);return {samples:60,p50Ms:samples[30],p95Ms:samples[57],method:'software/emulated WebGL draw + gl.finish, not physical-phone FPS'};
   });
   await page.locator('#account').click();assert.equal(await page.locator('#references img').count(),0);if(initial.state.supported)assert.equal((await page.evaluate(()=>__photoLab.after.getState())).textureCount,0);
   await page.locator('#retry').click();await page.waitForFunction(()=>__photoLab.token!==null);
   await page.locator('#replace').click();await page.waitForFunction(()=>__photoLab.token===null);assert.equal(await page.locator('#references img').count(),0);assert.equal(await page.locator('#fallback').isVisible(),true);
   await page.locator('#retry').click();await page.waitForFunction(()=>__photoLab.token!==null);
   if(initial.state.supported){await page.evaluate(()=>{const gl=document.getElementById('after').getContext('webgl');gl.getExtension('WEBGL_lose_context').loseContext();});await page.waitForFunction(()=>__photoLab.after.getState().lost);assert.equal(await page.evaluate(()=>__photoLab.after.render()),false);assert.equal(await page.locator('#fallback').isVisible(),true);}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
   report.push({engine:engine.name(),width,webgl:initial.state.supported,loadWallMs:Math.round(loadMs),geometryVertices:initial.state.vertexCount||0,vertexBufferBytes:initial.state.bufferBytes||0,textureUploadBytes:initial.textureBytes,sourceColorPixels,backSourcePixels,scenarios,performanceSamples,sourceUnchanged,sourceReplacementHeld:true,accountSwitchCleared:true,contextLossHeld:initial.state.supported,externalRequests:0,pageErrors:0,physicalDevice:false,fabricFidelityScored:false,physicalFitVerified:false});
   await context.close();
  }}finally{await browser.close();}
 }
 fs.writeFileSync(out+'/browser-report.json',JSON.stringify(report,null,2)+'\n');console.log('ISSUE243_PHOTO_HUMANOID '+JSON.stringify(report));
}finally{await new Promise(r=>server.close(r));}
