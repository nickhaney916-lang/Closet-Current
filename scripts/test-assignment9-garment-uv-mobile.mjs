/** Synthetic-only front-detail coverage comparison against exact PR248 geometry. */
import {chromium,webkit} from 'playwright';import {createServer} from 'node:http';import {execFileSync} from 'node:child_process';import fs from 'node:fs';import {resolve,extname} from 'node:path';import assert from 'node:assert/strict';
const root=resolve('dist'),out='artifacts/assignment9-uv',base='e5a6d7b02097555af6fc06d5d2efe87e672db2b9';fs.mkdirSync(out,{recursive:true});
const old=path=>execFileSync('git',['-c','safe.directory='+process.cwd(),'show',base+':public/'+path],{encoding:'utf8'});
const previous={'/__base/renderer.mjs':old('humanoid-3d-photo-renderer.mjs').replace("'./humanoid-3d-photo-geometry.mjs'","'/__base/geometry.mjs'").replace("'./humanoid-3d-photo-session.mjs'","'/humanoid-3d-photo-session.mjs'").replace("'./humanoid-3d-indexed-mesh.mjs'","'/humanoid-3d-indexed-mesh.mjs'"),'/__base/geometry.mjs':old('humanoid-3d-photo-geometry.mjs').replace("'./humanoid-3d-body-geometry.mjs'","'/humanoid-3d-body-geometry.mjs'")};
const server=createServer((req,res)=>{try{const p=new URL(req.url,'http://localhost').pathname;if(previous[p]){res.setHeader('Content-Type','text/javascript');return res.end(previous[p]);}const f=resolve(root,'.'+p);if(!f.startsWith(root+'/'))throw Error('path');res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css'})[extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,report=[];
try{for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader']}: {})});
 try{for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'}),errors=[],external=[];
  await context.route('**/*',r=>{if(r.request().url().startsWith(origin+'/')||/^(blob:|data:)/.test(r.request().url()))return r.continue();external.push(r.request().url());return r.abort();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/humanoid-3d-photo-demo.html');await page.evaluate(()=>__photoLab.ready);
  await page.evaluate(async()=>{
   const {createPhotoHumanoid3D}=await import('/humanoid-3d-photo-renderer.mjs'),old=await import('/__base/renderer.mjs'),{createPhotoTextureSession}=await import('/humanoid-3d-photo-session.mjs');
   const records={},sources={},originals={},sha=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('');
   for(const name of ['shoes','shorts']){
    const c=document.createElement('canvas');c.width=400;c.height=256;const x=c.getContext('2d');x.fillStyle='#264c84';x.fillRect(0,0,400,256);
    x.fillStyle='#b9ab97';for(let i=0;i<400;i+=32)x.fillRect(i,0,8,256);
    if(name==='shoes'){x.fillStyle='rgb(235,31,131)';x.fillRect(25,86,75,86);x.fillStyle='rgb(13,191,219)';x.fillRect(300,86,75,86);}else{x.fillStyle='rgb(41,217,93)';x.fillRect(0,200,400,40);}
    const bytes=new Uint8Array(await(await new Promise(r=>c.toBlob(r,'image/png'))).arrayBuffer());sources[name]=bytes;originals[name]=await sha(bytes);
    records[name]={slot:name==='shoes'?'shoes':'bottom',itemId:name,category:name==='shoes'?'Shoes':'Bottoms',itemType:name==='shoes'?'Sneakers':'Shorts',sourceIdentity:'synthetic-original:'+name,sourceVersion:originals[name]};
   }
   let scope=true,current='shoes';const session=createPhotoTextureSession({verifySelection:async()=>({placeholderOnly:true,hasDress:false,selected:[records[current]],colors:{[records[current].slot]:[.15,.3,.52,1]}}),readOriginal:r=>sources[r.itemId],isCurrent:()=>scope});
   const renderers=[];for(const [id,factory] of [['prior',old.createPhotoHumanoid3D],['current',createPhotoHumanoid3D]]){const c=document.createElement('canvas'),ref=document.getElementById('after');c.id='uv-'+id;c.style.cssText=`width:${ref.clientWidth}px;height:${ref.clientHeight}px;position:fixed;left:-10000px;top:0`;document.body.append(c);const renderer=factory(c);if(!renderer.supported)throw Error('WebGL required');renderers.push({id,canvas:c,renderer});}
   const read=o=>{o.renderer.render();const gl=o.canvas.getContext('webgl'),p=new Uint8Array(o.canvas.width*o.canvas.height*4);gl.readPixels(0,0,o.canvas.width,o.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,p);if(gl.getError()!==gl.NO_ERROR)throw Error('WebGL error');return p;};
   const count=(o,color)=>{const p=read(o),w=o.canvas.width;let left=0,right=0;for(let i=0;i<p.length;i+=4)if(color.every((v,k)=>p[i+k]===v)&&p[i+3]===255){if(i/4%w<w/2)left++;else right++;}return {left,right,total:left+right};};
   window.__uvQA={renderers,read,count,sources,originals,sha,session,async prepare(name){current=name;const t=await session.prepare({});for(const o of renderers)o.renderer.setFrame(t);},revoke(){scope=false;},restoreScope(){scope=true;}};
  });
  const scenarios=[];
  for(const name of ['shoes','shorts']){
   const result=await page.evaluate(async name=>{
    const q=__uvQA,t=performance.now();await q.prepare(name);const prepareWallMs=performance.now()-t,colors=name==='shoes'?[[235,31,131],[13,191,219]]:[[41,217,93]],prior=q.renderers[0],current=q.renderers[1];
    const before=colors.map(c=>q.count(prior,c)),after=colors.map(c=>q.count(current,c));
    for(let i=0;i<colors.length;i++){if(before[i].total!==0||after[i].total<10)throw Error('Expected missing baseline marker / visible corrected marker '+name);}
    if(name==='shoes'&&(after[0].right||after[1].left))throw Error('Left/right photo detail crossed or repeated');
    const front=q.read(current);for(const o of q.renderers)o.renderer.rotate(Math.PI);
    const back=colors.map(c=>q.count(current,c));if(back.some(x=>x.total))throw Error('Front detail stamped onto estimated back');
    for(const o of q.renderers)o.renderer.rotate(Math.PI);const returned=q.read(current);if(returned.some((v,i)=>v!==front[i]))throw Error('360-degree return changed front pixels');
    const samples=[];for(let i=0;i<30;i++)await new Promise(r=>requestAnimationFrame(()=>{const t=performance.now();current.renderer.rotate(Math.PI/15);current.canvas.getContext('webgl').finish();samples.push(performance.now()-t);r();}));samples.sort((a,b)=>a-b);current.renderer.rotate(-current.renderer.getState().yaw);
    return {name,before,after,back,prepareWallMs,p50Ms:samples[15],p95Ms:samples[28],state:current.renderer.getState()};
   },name);scenarios.push(result);
   if(width===390)for(const id of ['prior','current']){await page.evaluate(id=>{for(const o of __uvQA.renderers)o.canvas.style.left=o.id===id?'0px':'-10000px';},id);await page.locator('#uv-'+id).screenshot({path:out+'/'+engine.name()+'-'+name+'-'+id+'.png'});await page.evaluate(()=>{for(const o of __uvQA.renderers)o.canvas.style.left='-10000px';});}
  }
  const integrity=await page.evaluate(async()=>{
   const q=__uvQA;for(const name of Object.keys(q.sources))if(await q.sha(q.sources[name])!==q.originals[name])throw Error('Original bytes changed');
   q.revoke();for(const o of q.renderers)if(o.renderer.render()||o.renderer.getState().textureCount)throw Error('Account revocation left texture');
   let rejected=false;q.restoreScope();q.sources.shorts[20]^=1;try{await q.prepare('shorts');}catch(error){rejected=/source version changed/.test(error.message);}if(!rejected)throw Error('Replaced source accepted');
   for(const o of q.renderers){o.renderer.dispose();o.canvas.remove();}return {originalsUnchanged:true,scopeRevoked:true,replacementRejected:true};
  });assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  report.push({engine:engine.name(),width,webgl:true,scenarios,integrity,pageErrors:0,externalRequests:0,physicalDevice:false,fitVerified:false,method:'Software/emulated draw + gl.finish; not phone FPS or total memory'});await context.close();
 }}finally{await browser.close();}
}fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log('ASSIGNMENT9_UV '+JSON.stringify(report));}finally{await new Promise(r=>server.close(r));}
