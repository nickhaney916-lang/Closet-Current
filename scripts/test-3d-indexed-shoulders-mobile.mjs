/** Synthetic-only exact render equivalence, lifecycle allocation and mobile viewport QA. */
import {chromium,webkit} from 'playwright';import {createServer} from 'node:http';import fs from 'node:fs';import {resolve,extname} from 'node:path';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
const root=resolve('dist'),out='artifacts/3d-indexed-shoulders',base='07fa4a8a5a61589c68d60a7f6b80fb560b4e229f';fs.mkdirSync(out,{recursive:true});
const previous={
 '/__base/renderer.mjs':execFileSync('git',['show',base+':public/humanoid-3d-photo-renderer.mjs'],{encoding:'utf8'}).replace("'./humanoid-3d-photo-geometry.mjs'","'/__base/geometry.mjs'").replace("'./humanoid-3d-photo-session.mjs'","'/humanoid-3d-photo-session.mjs'"),
 '/__base/geometry.mjs':execFileSync('git',['show',base+':public/humanoid-3d-photo-geometry.mjs'],{encoding:'utf8'}).replace("'./humanoid-3d-body-geometry.mjs'","'/humanoid-3d-body-geometry.mjs'")
};
const server=createServer((req,res)=>{try{const p=new URL(req.url,'http://localhost').pathname;if(previous[p]){res.setHeader('Content-Type','text/javascript');return res.end(previous[p]);}const file=resolve(root,'.'+p);if(!file.startsWith(root+'/'))throw Error('path');res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css'})[extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,report=[];
try{for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader']}: {})});
 try{for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'}),external=[],errors=[];
  await context.route('**/*',r=>{if(r.request().url().startsWith(origin+'/')||/^(blob:|data:)/.test(r.request().url()))return r.continue();external.push(r.request().url());return r.abort();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/humanoid-3d-photo-demo.html');await page.evaluate(()=>__photoLab.ready);
  const available=await page.evaluate(()=>__photoLab.after.supported);assert.equal(available,true,engine.name()+' WebGL required for equivalence benchmark');
  await page.evaluate(async()=>{
   const {createPhotoHumanoid3D}=await import('/humanoid-3d-photo-renderer.mjs');const old=await import('/__base/renderer.mjs');
   const make=(factory,options)=>{
    const canvas=document.createElement('canvas'),source=document.getElementById('after');canvas.style.cssText=`width:${source.clientWidth}px;height:${source.clientHeight}px;position:fixed;left:-10000px;top:0`;document.body.append(canvas);
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,preserveDrawingBuffer:true}),buffers=new Set(),textures=new Set();
    for(const [create,del,set] of [['createBuffer','deleteBuffer',buffers],['createTexture','deleteTexture',textures]]){const a=gl[create].bind(gl),b=gl[del].bind(gl);gl[create]=()=>{const x=a();if(x)set.add(x);return x;};gl[del]=x=>{set.delete(x);return b(x);};}
    const renderer=factory(canvas,options);return {canvas,gl,renderer,buffers,textures};
   };
   const indexed=make(createPhotoHumanoid3D,{indexed:true}),reference=make(createPhotoHumanoid3D,{indexed:false}),prior=make(old.createPhotoHumanoid3D);
   window.__meshQA={indexed,reference,prior,read:o=>{o.renderer.render();const v=new Uint8Array(o.canvas.width*o.canvas.height*4);o.gl.readPixels(0,0,o.canvas.width,o.canvas.height,o.gl.RGBA,o.gl.UNSIGNED_BYTE,v);return v;}};
  });
  const scenarios=[];
  for(const name of ['long','short','skirt','jacket','layers','dress']){
   await page.evaluate(n=>__photoLab.show(n),name);
   const result=await page.evaluate(async name=>{
    const q=__meshQA;for(const o of [q.indexed,q.reference,q.prior])o.renderer.setFrame(__photoLab.token);
    let comparedBytes=0;for(const angle of [0,Math.PI/3,Math.PI/2,Math.PI,Math.PI*1.5,Math.PI*2]){
     for(const o of [q.indexed,q.reference])o.renderer.rotate(angle-o.renderer.getState().yaw);
     const a=q.read(q.indexed),b=q.read(q.reference);if(a.length!==b.length||a.some((x,i)=>x!==b[i]))throw Error('Indexed pixels differ: '+name+' angle '+angle);comparedBytes+=a.length;
    }
    const a=q.indexed.renderer.getState(),b=q.reference.renderer.getState();if(a.bufferBytes>=b.bufferBytes*.5)throw Error('Mesh buffer savings below 50%');
    if(q.indexed.gl.getError()!==q.indexed.gl.NO_ERROR||q.reference.gl.getError()!==q.reference.gl.NO_ERROR)throw Error('WebGL error');
    const samples={};for(const [key,o] of [['indexed',q.indexed],['unindexed',q.reference]]){const ts=[];for(let i=0;i<30;i++)await new Promise(r=>requestAnimationFrame(()=>{const t=performance.now();o.renderer.rotate(Math.PI/15);o.gl.finish();ts.push(performance.now()-t);r();}));ts.sort((a,b)=>a-b);samples[key]={p50Ms:ts[15],p95Ms:ts[28]};}
    for(const o of [q.indexed,q.reference,q.prior])o.renderer.rotate(-o.renderer.getState().yaw);
    return {name,indexed:a,unindexed:b,comparedBytes,samples};
   },name);scenarios.push(result);
   if(width===390&&['long','jacket','layers'].includes(name)){
    // Capture the actual prior #246 geometry and improved geometry at identical size/yaw.
    await page.evaluate(()=>{for(const [id,o] of [['prior',__meshQA.prior],['improved',__meshQA.indexed]]){o.canvas.id=id;o.canvas.style.left='-10000px';}});
    await page.evaluate(()=>__meshQA.prior.canvas.style.left='0px');
    await page.locator('#prior').screenshot({path:out+'/'+engine.name()+'-'+name+'-before.png'});await page.evaluate(()=>{__meshQA.prior.canvas.style.left='-10000px';__meshQA.indexed.canvas.style.left='0px';});
    await page.locator('#improved').screenshot({path:out+'/'+engine.name()+'-'+name+'-after.png'});
    await page.evaluate(()=>{__meshQA.prior.canvas.style.left='-10000px';__meshQA.indexed.canvas.style.left='-10000px';});
   }
  }
  const lifecycle=await page.evaluate(()=>{
   __photoLab.revoke();const out={};for(const [key,o] of Object.entries(__meshQA)){if(!o.renderer)continue;const rendered=o.renderer.render();if(rendered||o.buffers.size||o.textures.size)throw Error('Revocation leaked GPU resources');o.renderer.dispose();out[key]={buffers:o.buffers.size,textures:o.textures.size,rendered};o.canvas.remove();}return out;
  });
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  report.push({engine:engine.name(),width,webgl:true,scenarios,lifecycle,pageErrors:0,externalRequests:0,physicalDevice:false,method:'Software/emulated WebGL draw + gl.finish; not physical-phone FPS or total process/GPU memory'});await context.close();
 }}finally{await browser.close();}
}fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log('INDEXED_SHOULDERS '+JSON.stringify(report));}finally{await new Promise(r=>server.close(r));}
