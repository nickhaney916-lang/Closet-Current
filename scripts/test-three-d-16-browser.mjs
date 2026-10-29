/** 3D-16: actual before/after real WebGL2 cuff frames, source verified unchanged. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/three\/)/.test(path)||
   path.includes('\0')||path.includes('\\'))throw Error('Denied');
  const f=resolve(root,'.'+path);if(!f.startsWith(root+'/'))throw Error('Denied');
  const bytes=await readFile(f),types={'.mjs':'text/javascript','.js':'text/javascript',
   '.html':'text/html','.json':'application/json','.glb':'model/gltf-binary',
   '.png':'image/png','.jpg':'image/jpeg'};
  res.writeHead(200,{'content-type':types[extname(f)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Blocked');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
const records=[];
try{
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'
 ]});
 await mkdir('benchmark/three-d-16',{recursive:true});
 for(const width of [320,390,430])for(const model of ['female','male']){
  const profiles=[];
  for(const version of ['before','after']){
   const context=await browser.newContext({viewport:{width,height:844},
    deviceScaleFactor:2,hasTouch:true,isMobile:true});
   const page=await context.newPage(),errors=[],outside=[];
   page.on('pageerror',err=>errors.push(err.message));
   page.on('request',r=>{
    const url=r.url();if(url.startsWith(origin)||url.startsWith('blob:'+origin+'/')||
     url.startsWith('data:'))return;outside.push(url.slice(0,140));
   });
   await page.goto(origin+'/research/three-d-15/index.html?cuff='+version);
   await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true',null,{timeout:80000});
   if(model==='male'){
    await page.locator('#model').selectOption('male');
    await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true'&&
     document.querySelector('#avatar')?.dataset.model==='male',null,{timeout:80000});
   }
   assert.equal(await page.locator('#outfit').inputValue(),'pants');
   await page.locator('#outfit').selectOption('shirt-pants');
   await page.locator('#reviewDialog').waitFor({state:'visible'});
   assert.equal(await page.locator('#review').isChecked(),false);
   assert.equal(await page.locator('#dress').isDisabled(),true);
   await page.locator('#review').check();
   await page.evaluate(()=>document.getElementById('dress').click());
   assert.equal(await page.evaluate(()=>work61Diagnostics().outfit.mode),'pants',
    'Untrusted scripted click never enables original RGB cutout');
   await page.locator('#dress').click();
   await page.waitForFunction(()=>work61Diagnostics().outfit.mode==='shirt-pants',null,{timeout:45000});
   await page.locator('#pose').selectOption('source');
   await page.locator('#front').click();
   const state=await page.evaluate(()=>work61Diagnostics());
   assert.equal(state.outfit.shirt.sourceSHA256.length,64);
   assert.equal(state.outfit.pants.photoApplied,false);
   assert.equal(state.outfit.shirt.cuffFit,version==='after'?'near-wrist-radial-ease':undefined);
   if(version==='after'){
    assert.ok(state.outfit.shirt.cuffMovedVertices>0);
    assert.ok(state.outfit.shirt.cuffCorrectionByArm.L>0&&
      state.outfit.shirt.cuffCorrectionByArm.R>0);
    assert.ok(state.outfit.shirt.cuffMaxCorrection<=.01281);
    assert.equal(state.outfit.shirt.cuffAxialExtension,.010);
    assert.equal(state.outfit.shirt.collisionValidated,false);
   }
   const rect=await page.locator('#avatar').boundingBox();
   assert.ok(rect.width>200&&rect.height>200);
   const png=await page.locator('#avatar').screenshot({path:
    'benchmark/three-d-16/'+model+'-'+width+'-'+version+'-source-shirt-cuffs-HOLD.png'});
   // Confirm same shared-skeleton pose/camera/category, not a different scene.
   assert.equal(state.stats.bones,163);
   assert.equal(state.outfit.garmentMeshes,4);
   await page.locator('#side').click();
   const side=await page.locator('#avatar').evaluate(c=>c.toDataURL());
   await page.locator('#front').click();
   assert.notEqual(side,await page.locator('#avatar').evaluate(c=>c.toDataURL()));
   assert.deepEqual(errors,[]);
   assert.deepEqual(outside,[]);
   assert.ok(await page.evaluate(w=>document.documentElement.scrollWidth<=w,width));
   profiles.push({version,png,state,rect});
   await context.close();
  }
  const [before,after]=profiles;
  assert.deepEqual({width:before.rect.width,height:before.rect.height},{
   width:after.rect.width,height:after.rect.height});
  const [a,info]=await Promise.all([
   sharp(before.png).removeAlpha().raw().toBuffer({resolveWithObject:true}),
   sharp(after.png).removeAlpha().raw().toBuffer({resolveWithObject:true})
  ]);
  assert.equal(a.info.width,info.info.width);
  assert.equal(a.info.height,info.info.height);
  let changed=0;
  for(let i=0;i<a.data.length;i+=3)
   if(Math.max(...[0,1,2].map(j=>Math.abs(a.data[i+j]-info.data[i+j])))>7)changed++;
  assert.ok(changed>=5,'Real cuff correction must change visible GPU pixels, not just JS stats: '+changed);
  const row={model,width,changedPixels:changed,
   sourceSHA256:after.state.outfit.shirt.sourceSHA256,
   cuffMovedVertices:after.state.outfit.shirt.cuffMovedVertices,
   cuffByArm:after.state.outfit.shirt.cuffCorrectionByArm,
   maxCorrection:after.state.outfit.shirt.cuffMaxCorrection,
   axialExtension:after.state.outfit.shirt.cuffAxialExtension,
   clothPhotoUnchanged:true,release:'HOLD'};
  records.push(row);
  console.log('THREE_D_16_ACTUAL_WEBGL_CUFF',JSON.stringify(row));
 }
 await writeFile('benchmark/three-d-16/verification-HOLD.json',JSON.stringify({
  stage:'3D-16',humanVisualApproval:false,collisionValidated:false,
  originalPhotosChanged:false,records},null,2));
}finally{await browser?.close();server.close();}
