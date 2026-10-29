/** Independent browser failure-path QA. Never touches 3D08/09 renderer code. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/three\/)/.test(p)||p.includes('\\')||p.includes('\0'))throw Error('Forbidden path');
  const file=resolve(root,'.'+p);
  if(!file.startsWith(root+'/'))throw Error('Outside checkout');
  const data=await readFile(file);
  const types={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html',
   '.json':'application/json','.glb':'model/gltf-binary','.jpg':'image/jpeg','.png':'image/png'};
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('QA57 blocked / missing source');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
let browser;const records=[];
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 for(const d of [{name:'android-small',width:320,height:568,dpr:2},{name:'iphone-sized',width:390,height:844,dpr:3}]){
  const ctx=await browser.newContext({viewport:{width:d.width,height:d.height},hasTouch:true,isMobile:true,deviceScaleFactor:d.dpr});
  const page=await ctx.newPage(),outside=[];
  page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:'+origin)&&!r.url().startsWith('data:'))outside.push(r.url());});
  await page.addInitScript(()=>{
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(kind,...opts){
    if(['webgl','webgl2','experimental-webgl'].includes(kind))return null;
    return original.call(this,kind,...opts);
   };
  });
  await page.goto(origin+'/research/three-d-09/index.html');
  await page.waitForFunction(()=>document.getElementById('status')?.textContent.startsWith('Preview blocked:'),null,{timeout:15000});
  const status=await page.locator('#status').innerText();
  assert.match(status,/WebGL|context|renderer/i);
  assert.equal(await page.locator('#garment').isDisabled(),true);
  assert.ok(await page.locator('body').innerText().then(s=>s.includes('HOLD')));
  assert.deepEqual(outside,[]);
  records.push({profile:d.name,webglUnavailable:true,blocked:true,wardrobePhotoUploaded:false,
   externalRequests:0,userFacingFallback:'error-status-only',neutral2DFallback:false,release:'HOLD'});
  await ctx.close();
 }
 // Missing local model should not show a sourced shirt or claim readiness.
 const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const page=await ctx.newPage();
 await page.route('**/research/three-d-06/models/female-cc0-rigged.glb',r=>r.abort());
 await page.goto(origin+'/research/three-d-09/index.html');
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent.startsWith('Local preview unavailable:'),null,{timeout:30000});
 assert.equal(await page.locator('#avatar').getAttribute('data-ready'),'false');
 assert.equal(await page.locator('#avatar').getAttribute('data-shirt'),'none');
 const failedModelReviewButtonEnabled=await page.locator('#garment').isEnabled();
 records.push({profile:'model-fetch-error',noGarmentApplied:true,ready:false,
  failedModelReviewButtonEnabled,neutral2DFallback:false,release:'HOLD'});
 await ctx.close();
 await mkdir('research/three-d-qa57/evidence',{recursive:true});
 await writeFile('research/three-d-qa57/evidence/fallback-results-HOLD.json',
  JSON.stringify({results:records,release:'HOLD',limitations:[
   'No actual physical Android or iPhone/Safari tested',
   'No usable 2D fashion fallback in isolated 3D09 research preview',
   ...(failedModelReviewButtonEnabled?['Review button can become enabled after model loading fails']:[])
  ]},null,2)+'\n');
 console.log('QA57_FAILURE_PATHS_VERIFIED',JSON.stringify(records));
}finally{await browser?.close();server.close();}
