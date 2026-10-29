/** 3D-22: exact PR423 vs neckline/seam pass with real source-verified Chromium captures. */
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
let browser;const records=[];
const state=p=>p.evaluate(()=>work61Diagnostics());
async function review(p,mode){
 await p.locator('#outfit').selectOption(mode);await p.locator('#reviewDialog').waitFor({state:'visible'});
 assert.equal(await p.locator('#review').isChecked(),false);assert.equal(await p.locator('#dress').isDisabled(),true);
 await p.locator('#review').check();const prior=(await state(p)).outfit.mode;
 await p.evaluate(()=>document.getElementById('dress').click());assert.equal((await state(p)).outfit.mode,prior);
 await p.locator('#dress').click();await p.waitForFunction(m=>work61Diagnostics().outfit.mode===m,mode,{timeout:120000});
}
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir('benchmark/three-d-22',{recursive:true});
 for(const width of (process.env.QUICK?[430]:[320,390,430]))for(const model of ['female','male']){
  const profiles=[];
  for(const version of ['before','after']){
   const context=await browser.newContext({viewport:{width,height:932},deviceScaleFactor:2,hasTouch:true,isMobile:true});
   const page=await context.newPage(),errors=[],outside=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{const u=r.url();if(!u.startsWith(origin)&&!u.startsWith('blob:'+origin)&&!u.startsWith('data:'))outside.push(u);});
   await page.goto(origin+'/research/three-d-15/index.html?necklineSeams='+version);
   await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true',null,{timeout:90000});
   if(model==='male'){await page.locator('#model').selectOption('male');await page.waitForFunction(()=>document.querySelector('#avatar').dataset.model==='male'&&document.querySelector('#avatar').dataset.ready==='true',null,{timeout:90000});}
   assert.ok(await page.locator('#avatar').evaluate(c=>!!c.getContext('webgl2')));
   const images={},sizes={},sources={};
   for(const mode of ['shirt-pants','dress']){
    console.log('CAPTURE',width,model,version,mode);await review(page,mode);const s=await state(page),slot=mode==='dress'?'dress':'shirt';
    sources[mode]=s.outfit[slot].sourceSHA256;
    assert.equal(s.stats.bones,163);assert.equal(s.outfit[slot].collisionValidated,false);
    if(mode==='shirt-pants'){
     assert.equal(s.outfit.shirt.continuousSurfaceFit,true);assert.equal(s.outfit.shirt.necklineSeams,version==='after'?true:undefined);
     assert.equal(s.outfit.pants.photoApplied,false);assert.equal(s.outfit.dress,null);
     if(version==='after')assert.ok(s.outfit.shirt.fitMovedVertices>1000);
    }else{assert.equal(s.outfit.shirt,null);assert.equal(s.outfit.pants,null);}
    sizes[mode]={geometries:s.geometries,textures:s.textures};
    for(const pose of ['source','relaxed']){
     await page.locator('#pose').selectOption(pose);
     for(const view of ['front','threequarter','side','back']){
      await page.locator('#'+view).click();await page.waitForTimeout(100);
      const name=[version,model,width,mode,pose,view].join('-');
      const png=await page.locator('#avatar').screenshot({path:'benchmark/three-d-22/'+name+'-HOLD.png'});
      if(pose==='source')images[mode+'/'+view]=png;
     }
    }
   }
   for(let i=0;i<2;i++)for(const mode of ['shirt-pants','dress']){
    await review(page,mode);const s=await state(page);assert.deepEqual({geometries:s.geometries,textures:s.textures},sizes[mode],'Replacement must not accumulate GPU resources');
   }
   await page.locator('#remove').click();const empty=await state(page);
   assert.equal(empty.outfit.garmentMeshes,0);assert.equal(empty.geometries,9);assert.equal(empty.textures,2);
   // Exercise mobile pointer rotation and switching on the same live renderer.
   await page.locator('#front').click();const rotationBefore=await page.locator('#avatar').getAttribute('data-rotation');
   const canvas=page.locator('#avatar'),bounds=await canvas.boundingBox();
   await page.mouse.move(bounds.x+bounds.width*.5,bounds.y+bounds.height*.4);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.72,bounds.y+bounds.height*.4,{steps:12});await page.mouse.up();await page.waitForTimeout(200);assert.notEqual(await canvas.getAttribute('data-rotation'),rotationBefore,'Pointer rotation must change rendered camera');
   const alternate=model==='female'?'male':'female';await page.locator('#model').selectOption(alternate);await page.waitForFunction(k=>document.querySelector('#avatar').dataset.model===k&&document.querySelector('#avatar').dataset.ready==='true',alternate,{timeout:90000});
   assert.equal((await state(page)).kind,alternate);assert.equal((await state(page)).outfit.mode,'pants');
   await page.locator('#model').selectOption(model);await page.waitForFunction(k=>document.querySelector('#avatar').dataset.model===k&&document.querySelector('#avatar').dataset.ready==='true',model,{timeout:90000});
   assert.equal((await state(page)).kind,model);
   assert.deepEqual(await page.evaluate(async()=>await indexedDB.databases()),[]);
   assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
   assert.ok(await page.evaluate(w=>document.documentElement.scrollWidth<=w,width));
   assert.deepEqual(await page.evaluate(()=>[Object.keys(localStorage),Object.keys(sessionStorage)]),[[],[]]);
   profiles.push({version,images,sizes,sources});await context.close();
  }
  assert.deepEqual(profiles[0].sources,profiles[1].sources);assert.deepEqual(profiles[0].sizes,profiles[1].sizes);
  const changed={};
  for(const key of Object.keys(profiles[0].images)){
   const a=await sharp(profiles[0].images[key]).removeAlpha().raw().toBuffer({resolveWithObject:true});
   const b=await sharp(profiles[1].images[key]).removeAlpha().raw().toBuffer({resolveWithObject:true});assert.deepEqual(a.info,b.info);
   let n=0;for(let i=0;i<a.data.length;i+=3)if(Math.max(...[0,1,2].map(k=>Math.abs(a.data[i+k]-b.data[i+k])))>7)n++;
   changed[key]=n;if(key.startsWith('shirt'))assert.ok(n>100,'Visible fit must change GPU pixels');else assert.equal(n,0,'Dress control must remain pixel identical');
  }
  records.push({width,model,changedPixels:changed,sources:profiles[1].sources,resourceCounts:profiles[1].sizes,webgl2:true,externalRequests:0,release:'HOLD'});
  console.log('THREE_D_22_WEBGL_PASS',JSON.stringify(records.at(-1)));
 }
 await writeFile('benchmark/three-d-22/results.json',JSON.stringify({records,nativePhone:false,humanVisualApproval:false,release:'HOLD'},null,2));
}finally{await browser?.close();server.close();}
