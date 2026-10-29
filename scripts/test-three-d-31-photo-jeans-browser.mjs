/** Genuine 3D31 offline WebGL: original public-domain jeans pixels on
 * actual 163-bone CC0 skinned pants. Never a release approval. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const cwd=resolve('.'),results=[],errors=[];
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1'),name=decodeURIComponent(url.pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/three\/)/.test(name)||name.includes('\\')||name.includes('\0'))throw Error('Denied');
  const p=resolve(cwd,'.'+name);if(!p.startsWith(cwd+'/'))throw Error('Denied');
  const data=await readFile(p),types={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.html':'text/html','.glb':'model/gltf-binary'};
  res.writeHead(200,{'content-type':types[extname(p)]||'application/octet-stream','cache-control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('Denied');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
let browser;
const diff=async(a,b)=>{const x=await sharp(a).raw().toBuffer(),y=await sharp(b).raw().toBuffer();assert.equal(x.length,y.length);let count=0;for(let i=0;i<x.length;i+=4)if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>24)count++;return count;};
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir('benchmark/three-d-31/browser',{recursive:true});
 for(const width of (process.env.QUICK?[430]:[320,390,430]))for(const model of ['female','male']){
  const context=await browser.newContext({viewport:{width,height:932},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  const page=await context.newPage(),outside=[],pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('blob:'+base)&&!r.url().startsWith('data:'))outside.push(r.url());});
  await page.goto(base+'/research/three-d-31/index.html');
  await page.waitForFunction(()=>window.cc31Diagnostics?.()?.loaded===true,null,{timeout:90000});
  if(model==='male'){await page.locator('#model').selectOption('male');await page.waitForFunction(()=>window.cc31Diagnostics?.()?.kind==='male'&&window.cc31Diagnostics().loaded,null,{timeout:90000});}
  const diag=()=>page.evaluate(()=>window.cc31Diagnostics());
  const start=await diag();assert.equal(start.stats.bones,163);assert.equal(start.outfit.mode,'pants');assert.equal(start.outfit.pants.photoApplied,false);
  assert.equal(await page.locator('#photo').isDisabled(),true);assert.match(await page.locator('#status').textContent(),/RGB verified|requires fresh review/);
  const pose='relaxed';
  await page.locator('#front').click();await page.waitForTimeout(100);
  const neutral=await page.locator('#avatar').screenshot({path:'benchmark/three-d-31/browser/'+width+'-'+model+'-neutral-'+pose+'-front-HOLD.png'});
  await page.locator('#review').check();
  await page.evaluate(()=>document.getElementById('photo').click());
  assert.equal((await diag()).outfit.pants.photoApplied,false,'Synthetic click must not approve photographed pants');
  await page.locator('#photo').click();const s=await diag();
  assert.equal(s.outfit.pants.photoApplied,true);assert.equal(s.outfit.pants.sourceId,'commons-public-domain-jeans-2005');
  assert.equal(s.outfit.pants.originalRGBPreserved,true);assert.equal(s.outfit.pants.photoFrontOnly,true);
  assert.equal(s.outfit.pants.humanVisualApproval,false);assert.equal(s.outfit.pants.releaseAuthorized,false);
  assert.equal(s.outfit.pants.backMaterial,'unphotographed-neutral');
  await page.waitForTimeout(125);
  const front=await page.locator('#avatar').screenshot({path:'benchmark/three-d-31/browser/'+width+'-'+model+'-photo-'+pose+'-front-HOLD.png'});
  const changed=await diff(neutral,front);
  assert.ok(changed>250,'Genuine projected photo changes rendered original pants front: '+changed);
  for(const angle of ['side','back','threequarter']){
   await page.locator('#'+angle).click();await page.waitForTimeout(100);
   await page.locator('#avatar').screenshot({path:'benchmark/three-d-31/browser/'+width+'-'+model+'-photo-'+pose+'-'+angle+'-HOLD.png'});
  }
  await page.locator('#front').click();await page.locator('#full').click();const full=await diag();
  assert.equal(full.outfit.mode,'shirt-pants');assert.equal(full.outfit.pants.photoApplied,true);assert.ok(full.outfit.shirt?.sharedSkeleton);
  await page.waitForTimeout(100);await page.locator('#avatar').screenshot({path:'benchmark/three-d-31/browser/'+width+'-'+model+'-original-shirt-photo-jeans-'+pose+'-front-HOLD.png'});
  await page.locator('#pose').selectOption('source');await page.waitForTimeout(100);await page.locator('#avatar').screenshot({path:'benchmark/three-d-31/browser/'+width+'-'+model+'-original-shirt-photo-jeans-source-front-HOLD.png'});
  await page.locator('#neutral').click();assert.equal((await diag()).outfit.pants.photoApplied,false);
  assert.equal((await diag()).outfit.mode,'pants');
  assert.equal(outside.length,0,'No outside requests or user accounts');
  assert.deepEqual(pageErrors,[]);
  results.push({width,model,sourceSHA256:s.outfit.pants.sourceSHA256,cutoutSHA256:s.outfit.pants.cutoutSHA256,frontChangedPixels:changed,originalModelBones:s.stats.bones,sourceRGBPreserved:true,neutralFallback:true,humanVisualApproval:false,releaseAuthorized:false});
  await context.close();
 }
 await writeFile('benchmark/three-d-31/browser-results.json',JSON.stringify({release:'HOLD',type:'original actual public-domain photo front on original CC0 pants mesh',results},null,2));
 console.log('ACTUAL_PD_JEANS_3D_BROWSER_QA',JSON.stringify(results));
}catch(e){errors.push(e.stack||String(e));console.error(e);process.exitCode=1;}finally{await browser?.close();await new Promise(done=>server.close(done));}
