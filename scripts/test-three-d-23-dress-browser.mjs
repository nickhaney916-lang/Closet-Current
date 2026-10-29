/** Exact-licensed dress on real anatomical CC0 body, physical neckline before/after.
 * New 3D-23 checks are isolated from Work64's shirt/collar mesh work.
 */
import assert from 'node:assert/strict';
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
async function reviewDress(page){
 await page.locator('#outfit').selectOption('dress');
 await page.locator('#reviewDialog').waitFor({state:'visible'});
 assert.equal(await page.locator('#review').isChecked(),false);
 assert.equal(await page.locator('#dress').isDisabled(),true);
 await page.locator('#review').check();
 // A synthetic click may never approve the garment preview.
 await page.evaluate(()=>document.getElementById('dress').click());
 assert.notEqual((await state(page)).outfit.mode,'dress');
 await page.locator('#dress').click();
 await page.waitForFunction(()=>work61Diagnostics().outfit.mode==='dress',
  null,{timeout:90000});
}
try{
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir('benchmark/three-d-23',{recursive:true});
 for(const width of [320,390,430])for(const model of ['female','male']){
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
   await page.goto(origin+'/research/three-d-15/index.html?dressNeckline='+version);
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
   assert.equal(s.outfit.dress.physicalFrontNeckline,version==='after'?true:undefined);
   assert.equal(s.outfit.dress.releaseAuthorized,false);
   assert.equal(s.outfit.dress.collisionValidated,false);
   if(version==='after'){
    assert.ok(s.outfit.dress.frontCenterNeckDrop>.015);
    assert.equal(s.outfit.dress.originalPhotoCoordinatesUnchanged,true);
    assert.equal(s.outfit.dress.skinWeightsUnchanged,true);
   }
   const shots={},hash=s.outfit.dress.sourceSHA256;
   for(const pose of ['source','relaxed']){
    await page.locator('#pose').selectOption(pose);
    for(const angle of ['front','threequarter','side','back']){
     await page.locator('#'+angle).click();
     await page.waitForTimeout(100);
     const png=await page.locator('#avatar').screenshot({
      path:'benchmark/three-d-23/'+[width,model,version,pose,angle].join('-')+'-HOLD.png'});
     shots[pose+'/'+angle]=png;
    }
   }
   const resources={geometries:s.geometries,textures:s.textures};
   await page.locator('#remove').click();
   const empty=await state(page);
   assert.equal(empty.outfit.garmentMeshes,0);
   assert.deepEqual(await page.evaluate(()=>[Object.keys(localStorage),Object.keys(sessionStorage)]),[[],[]]);
   assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
   assert.ok(await page.evaluate(w=>document.documentElement.scrollWidth<=w,width));
   variants.push({version,shots,hash,resources});
   await ctx.close();
  }
  assert.equal(variants[0].hash,variants[1].hash);
  assert.deepEqual(variants[0].resources,variants[1].resources);
  const changed={};
  for(const k of Object.keys(variants[0].shots)){
   const b=await sharp(variants[0].shots[k]).removeAlpha().raw().toBuffer({resolveWithObject:true});
   const a=await sharp(variants[1].shots[k]).removeAlpha().raw().toBuffer({resolveWithObject:true});
   assert.deepEqual(a.info,b.info);
   let diff=0;for(let i=0;i<b.data.length;i+=3)
    if(Math.max(...[0,1,2].map(j=>Math.abs(a.data[i+j]-b.data[i+j])))>7)diff++;
   changed[k]=diff;
   if(k.endsWith('/front'))assert.ok(diff>12,'Actual dress neckline must change rendered front pixels: '+k);
  }
  results.push({width,model,changedPixelCounts:changed,
   sourceSHA256:variants[1].hash,
   resourceCounts:variants[1].resources,physicalFrontNeckline:true,
   rearPhotoReconstructed:false,skinCollisionValidated:false,
   humanVisualApproval:false,nativePhone:false,externalRequests:0,release});
  console.log('THREE_D_23_PHYSICAL_DRESS_WEBGL_PASS',JSON.stringify(results.at(-1)));
 }
 await writeFile('benchmark/three-d-23/results.json',
  JSON.stringify({results,sourceOriginalRGBUnchanged:true,
   realVisualAcceptance:'HOLD',release},null,2));
}finally{await browser?.close();server.close();}
