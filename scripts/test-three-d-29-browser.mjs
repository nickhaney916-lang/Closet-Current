/** Exact-licensed dress on real anatomical CC0 body, physical neckline before/after.
 * New 3D-23 checks are isolated from Work64's shirt/collar mesh work.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/three\/)/.test(path)||
   path.includes('\0')||path.includes('\\'))throw Error('Deny asset');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/'))throw Error('Deny outside root');
  const bytes=await readFile(file);
  const types={'.mjs':'text/javascript','.js':'text/javascript',
   '.html':'text/html','.json':'application/json','.glb':'model/gltf-binary',
   '.png':'image/png','.jpg':'image/jpeg'};
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Blocked');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const release='HOLD',results=[];let browser;
const state=p=>p.evaluate(()=>work61Diagnostics());
async function reviewDress(page,mode='dress'){
 await page.locator('#outfit').selectOption(mode);
 await page.locator('#reviewDialog').waitFor({state:'visible'});
 assert.equal(await page.locator('#review').isChecked(),false);
 assert.equal(await page.locator('#dress').isDisabled(),true);
 await page.locator('#review').check();
 // A synthetic click may never approve the garment preview.
 const prior=(await state(page)).outfit.mode;await page.evaluate(()=>document.getElementById('dress').click());
 assert.equal((await state(page)).outfit.mode,prior);
 await page.locator('#dress').click();
 await page.waitForFunction(mode=>work61Diagnostics().outfit.mode===mode,mode,{timeout:90000});
 assert.ok(await page.locator('#original').evaluate(i=>i.complete&&i.naturalWidth>100),'Original-photo review remains available');
}
try{
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir('benchmark/three-d-29',{recursive:true});
 for(const width of (process.env.QUICK?[430]:[320,390,430]))for(const model of (process.env.MODEL?[process.env.MODEL]:['female','male'])){
  const variants=[];
  for(const version of ['before','after']){
   const ctx=await browser.newContext({viewport:{width,height:932},
    deviceScaleFactor:2,hasTouch:true,isMobile:true});
   const page=await ctx.newPage(),errors=[],outside=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{
    const u=r.url();
    if(!u.startsWith(origin)&&!u.startsWith('blob:'+origin)&&!u.startsWith('data:'))
     outside.push(u);
   });
   await page.goto(origin+'/research/three-d-15/index.html?registeredNeckline='+version);
   await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true',
    null,{timeout:90000});
   if(model==='male'){
    await page.locator('#model').selectOption('male');
    await page.waitForFunction(()=>
     document.querySelector('#avatar')?.dataset.model==='male'&&
     document.querySelector('#avatar')?.dataset.ready==='true',
     null,{timeout:90000});
   }
   assert.ok(await page.locator('#avatar').evaluate(c=>!!c.getContext('webgl2')));
   await reviewDress(page);
   const s=await state(page);
   assert.equal(s.stats.bones,163);
   assert.equal(s.outfit.mode,'dress');
   assert.equal(s.outfit.shirt,null);
   assert.equal(s.outfit.pants,null);
   assert.equal(s.outfit.dress.sourceId,'commons-0053');
   assert.equal(s.outfit.dress.physicalFrontNeckline,true);
   assert.equal(s.outfit.dress.anatomicalDress,true);assert.equal(s.outfit.dress.bodyTriangleAttachment,true);assert.equal(s.outfit.dress.sourceRegisteredNeckline,version==='after'?true:undefined);assert.equal(s.dressPresentation,1);assert.equal(s.outfit.dress.releaseAuthorized,false);
   assert.equal(s.outfit.dress.collisionValidated,false);
   if(version==='after'){
    assert.ok(s.outfit.dress.frontCenterNeckDrop>.015);
    assert.equal(s.outfit.dress.originalPhotoMappingPreserved,true);
    assert.equal(s.outfit.dress.skinWeightsInterpolated,true);
   }
   const shots={},hash=s.outfit.dress.sourceSHA256;
   for(const pose of ['source','relaxed']){
    await page.locator('#pose').selectOption(pose);
    for(const angle of ['front','threequarter','side','back']){
     await page.locator('#'+angle).click();
     await page.waitForTimeout(100);
     const png=await page.locator('#avatar').screenshot({
      path:'benchmark/three-d-29/'+[width,model,version,pose,angle].join('-')+'-HOLD.png'});
     shots[pose+'/'+angle]=png;
    }
   }
   const resources={geometries:s.geometries,textures:s.textures};
   for(let cycle=0;cycle<2;cycle++){
    await page.locator('#remove').click();await reviewDress(page);const again=await state(page);assert.deepEqual({geometries:again.geometries,textures:again.textures},resources,'Dress replacements must not leak GPU resources');
   }
   await reviewDress(page,'shirt-pants');const shirt=await state(page);assert.equal(shirt.outfit.dress,null);assert.ok(shirt.outfit.shirt);assert.equal(shirt.outfit.pants.photoApplied,false);
   for(const pose of ['source','relaxed']){await page.locator('#pose').selectOption(pose);await page.locator('#front').click();await page.waitForTimeout(100);shots['shirt-control/'+pose+'/front']=await page.locator('#avatar').screenshot({path:'benchmark/three-d-29/'+[width,model,version,pose,'shirt-control'].join('-')+'-HOLD.png'});}
   await page.locator('#remove').click();assert.equal((await state(page)).dressPresentation,0);
   await page.locator('#pose').selectOption('source');for(const view of ['front','back']){await page.locator('#'+view).click();await page.waitForTimeout(100);shots['basewear-control/'+view]=await page.locator('#avatar').screenshot({path:'benchmark/three-d-29/'+[width,model,version,'source','basewear-'+view].join('-')+'-HOLD.png'});}
   await page.locator('#front').click();const rotation=await page.locator('#avatar').getAttribute('data-rotation'),bounds=await page.locator('#avatar').boundingBox();await page.mouse.move(bounds.x+bounds.width*.5,bounds.y+bounds.height*.4);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.72,bounds.y+bounds.height*.4,{steps:12});await page.mouse.up();await page.waitForTimeout(200);assert.notEqual(await page.locator('#avatar').getAttribute('data-rotation'),rotation);
   await reviewDress(page);const other=model==='female'?'male':'female';await page.locator('#model').selectOption(other);assert.equal((await state(page)).dressPresentation,0,'Model reload must restore full basewear immediately');await page.waitForFunction(k=>document.querySelector('#avatar').dataset.model===k&&document.querySelector('#avatar').dataset.ready==='true',other,{timeout:90000});assert.equal((await state(page)).outfit.mode,'pants');
   await page.locator('#model').selectOption(model);await page.waitForFunction(k=>document.querySelector('#avatar').dataset.model===k&&document.querySelector('#avatar').dataset.ready==='true',model,{timeout:90000});
   await page.locator('#remove').click();
   const empty=await state(page);assert.equal(empty.dressPresentation,0,'Removal must restore full modesty presentation');

   assert.equal(empty.outfit.garmentMeshes,0);assert.equal(empty.geometries,9);assert.equal(empty.textures,2);assert.deepEqual(await page.evaluate(async()=>await indexedDB.databases()),[]);
   assert.deepEqual(await page.evaluate(()=>[Object.keys(localStorage),Object.keys(sessionStorage)]),[[],[]]);
   assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
   assert.ok(await page.evaluate(w=>document.documentElement.scrollWidth<=w,width));
   variants.push({version,shots,hash,resources});
   await ctx.close();
  }
  assert.equal(variants[0].hash,variants[1].hash);
  assert.deepEqual(variants[0].resources,variants[1].resources);
  const changed={},basewearPixels={before:{},after:{}};
  for(const v of variants)for(const [name,bytes]of Object.entries(v.shots)){if(name.includes('control/'))continue;const {data,info}=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true});let green=0;for(let i=0;i<data.length;i+=3){const y=Math.floor(i/3/info.width);if(y<info.height*.20||y>info.height*.78)continue;const [r,g,b]=[data[i],data[i+1],data[i+2]];if(r>20&&r<140&&g-r>7&&g-b>5)green++;}basewearPixels[v.version][name]=green;}
  for(const k of Object.keys(variants[0].shots)){
   const b=await sharp(variants[0].shots[k]).removeAlpha().raw().toBuffer({resolveWithObject:true});
   const a=await sharp(variants[1].shots[k]).removeAlpha().raw().toBuffer({resolveWithObject:true});
   assert.deepEqual(a.info,b.info);
   let diff=0;for(let i=0;i<b.data.length;i+=3)
    if(Math.max(...[0,1,2].map(j=>Math.abs(a.data[i+j]-b.data[i+j])))>7)diff++;
   changed[k]=diff;
   if(k.includes('control/')){assert.equal(createHash('sha256').update(a.data).digest('hex'),createHash('sha256').update(b.data).digest('hex'),'Shirt/pants and removed basewear must be byte-identical: '+k);}else if(!k.endsWith('/back')) assert.ok(diff>12,'Actual dress mesh must change GPU pixels: '+k);
  }
  
  results.push({width,model,changedPixelCounts:changed,basewearPixels,basewearROI:"20%-78% image height; excludes caption/zoom controls",
   sourceSHA256:variants[1].hash,
   resourceCounts:variants[1].resources,physicalFrontNeckline:true,
   rearPhotoReconstructed:false,skinCollisionValidated:false,
   humanVisualApproval:false,nativePhone:false,externalRequests:0,release});
  console.log('THREE_D_29_REGISTERED_NECKLINE_WEBGL_PASS',JSON.stringify(results.at(-1)));
 }
 await writeFile('benchmark/three-d-29/results.json',
  JSON.stringify({results,sourceOriginalRGBUnchanged:true,
   realVisualAcceptance:'HOLD',release},null,2));
}finally{await browser?.close();server.close();}
