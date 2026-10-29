/** 3D33 real original public-domain photographed jeans posterior fairing, male/female, full 3D,
 * original UV/RGB and before/after source/relaxed pose comparisons. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const cwd=resolve('.'),dir='benchmark/three-d-33',results=[],pairs=[];
const server=createServer(async(req,res)=>{
 try{
  const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/three\/)/.test(name)||name.includes('\\')||name.includes('\0'))throw Error('Blocked');
  const p=resolve(cwd,'.'+name);if(!p.startsWith(cwd+'/'))throw Error('Outside');
  const b=await readFile(p),types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg'};
  res.writeHead(200,{'content-type':types[extname(p)]||'application/octet-stream','cache-control':'no-store'});res.end(b);
 }catch{res.writeHead(404);res.end('Denied');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const origin='http://127.0.0.1:'+server.address().port;
let browser;
async function differences(a,b){const x=await sharp(a).raw().toBuffer(),y=await sharp(b).raw().toBuffer();assert.equal(x.length,y.length);let n=0;for(let i=0;i<x.length;i+=4)if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>27)n++;return n;}
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir(dir,{recursive:true});
 for(const width of (process.env.QUICK?[430]:[320,390,430]))for(const model of ['female','male']){
  const comparison={width,model,versions:{}};const before={};
  for(const version of ['before','after']){
   const context=await browser.newContext({viewport:{width,height:932},deviceScaleFactor:1,hasTouch:true,isMobile:true});
   const page=await context.newPage(),errors=[],outside=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{const u=r.url();if(!u.startsWith(origin)&&!u.startsWith('blob:'+origin)&&!u.startsWith('data:'))outside.push(u);});
   await page.goto(origin+'/research/three-d-31/index.html?pantsDrape=after&seatFairing='+version);
   await page.waitForFunction(()=>window.cc31Diagnostics?.()?.loaded===true,null,{timeout:90000});
   if(model==='male'){
    await page.locator('#model').selectOption('male');
    await page.waitForFunction(()=>window.cc31Diagnostics?.()?.kind==='male'&&window.cc31Diagnostics().loaded,null,{timeout:90000});
   }
   const state=()=>page.evaluate(()=>window.cc31Diagnostics());
   const initial=await state();assert.equal(initial.stats.bones,163);assert.equal(initial.outfit.pants.photoApplied,false);
   await page.locator('#front').click();await page.waitForTimeout(90);
   const neutral=await page.locator('#avatar').screenshot({path:dir+'/'+width+'-'+model+'-'+version+'-neutral-front-HOLD.png'});
   if(version==='after')assert.equal(await differences(neutral,before.neutral),0,'Neutral reference must not change');
   else before.neutral=neutral;
   assert.equal(await page.locator('#photo').isDisabled(),true);
   await page.locator('#review').check();
   await page.evaluate(()=>document.querySelector('#photo').click());
   assert.equal((await state()).outfit.pants.photoApplied,false,'Synthetic click cannot select unreviewed photo');
   await page.locator('#photo').click();
   const s=await state();assert.equal(s.outfit.pants.photoApplied,true);
   assert.equal(Boolean(s.outfit.pants.naturalJeansDrape),true);
   assert.equal(Boolean(s.outfit.pants.posteriorFabricFairing),version==='after');
   assert.equal(s.outfit.pants.sourceSHA256,'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c');
   assert.equal(s.outfit.pants.cutoutSHA256,'e51ed275c6ff1c18d37dfbb821d8994576868f707c551da4fcccea1eaa4b9441');
   assert.equal(s.outfit.pants.originalRGBPreserved,true);assert.equal(s.outfit.pants.releaseAuthorized,false);
   if(version==='after'){
    assert.ok(s.outfit.pants.posteriorMaxMovement>=.001&&s.outfit.pants.posteriorMaxMovement<=.0120001);
    assert.ok(s.outfit.pants.posteriorMovedUniqueVertices>180);
    assert.ok(s.outfit.pants.posteriorProbeMinAfter>=s.outfit.pants.posteriorProbeMinBefore-.0005);
    assert.ok(s.outfit.pants.drapeMovedUniqueVertices>150);
    assert.equal(s.outfit.pants.posteriorSourceUVUnchanged,true);
    assert.equal(s.outfit.pants.posteriorOriginalRGBUnchanged,true);
    assert.equal(s.outfit.pants.originalSourceUVUnchanged,true);
    assert.equal(s.outfit.pants.fullCollisionValidated,false);
   }
   let posteriorChanged=0;
   for(const pose of ['source','relaxed']){
    await page.locator('#pose').selectOption(pose);
    for(const angle of ['front','threequarter','side','back']){
     await page.locator('#'+angle).click();await page.waitForTimeout(110);
     const png=await page.locator('#avatar').screenshot({path:dir+'/'+width+'-'+model+'-'+version+'-'+pose+'-'+angle+'-HOLD.png'});
     const id=pose+'/'+angle;
     if(version==='before')before[id]=png;
     else{
      const n=await differences(before[id],png);
      results.push({width,model,pose,angle,beforeAfterChangedPixels:n});
      if(angle==='back'||angle==='side')posteriorChanged+=n;
     }
    }
   }
   await page.locator('#front').click();await page.locator('#full').click();
   const outfit=await state();
   assert.equal(outfit.outfit.mode,'shirt-pants');assert.ok(outfit.outfit.shirt?.sharedSkeleton);
   assert.equal(Boolean(outfit.outfit.pants.posteriorFabricFairing),version==='after');
   await page.waitForTimeout(100);
   const full=await page.locator('#avatar').screenshot({path:dir+'/'+width+'-'+model+'-'+version+'-original-shirt-jeans-front-HOLD.png'});
   if(version==='before')before.full=full;
   else{
    const n=await differences(before.full,full);
    results.push({width,model,pose:'relaxed',angle:'original-shirt-jeans-front',beforeAfterChangedPixels:n});
   }
   await page.locator('#neutral').click();
   assert.equal((await state()).outfit.pants.photoApplied,false);
   assert.equal((await state()).outfit.mode,'pants');
   assert.equal(outside.length,0,'No outside data requests');assert.deepEqual(errors,[]);
   comparison.versions[version]={sourceSHA256:s.outfit.pants.sourceSHA256,originalImageUnchanged:true,originalRGBUnchanged:true,stats:s.outfit.pants};
   if(version==='after')assert.ok(posteriorChanged>=100,'Source-true seat fairing must cause genuine side/back WebGL change: '+posteriorChanged);
   await context.close();
  }
  pairs.push(comparison);
 }
 await writeFile(dir+'/results.json',JSON.stringify({release:'HOLD',humanVisualApproval:false,fullCollisionValidated:false,comparisons:pairs,pixelDiffs:results},null,2));
 console.log('THREE_D33_GENUINE_WEBGL_POSTERIOR_FAIRING',JSON.stringify(results));
}catch(e){console.error(e.stack||e);process.exitCode=1;}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
