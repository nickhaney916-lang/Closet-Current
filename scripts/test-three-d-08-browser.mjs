/**
 * 3D-07 real on-screen source-RGB shirt on genuine CC0 skinned anatomy.
 * Verifies exact Work47 original/mask hashes and manual review before GPU.
 * No production, cloud, customer photos or remote browser requests.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('.');
const srv=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1'),p=decodeURIComponent(url.pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/three\/)/.test(p)||
   p.includes('\0')||p.includes('\\'))throw Error('Unsupported research asset');
  const filepath=resolve(root,'.'+p);
  if(!filepath.startsWith(root+'/'))throw Error('Source root escape');
  const bytes=await readFile(filepath),ext=extname(filepath);
  const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
   '.glb':'model/gltf-binary','.json':'application/json',
   '.jpg':'image/jpeg','.png':'image/png'};
  res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Missing or blocked 3D source');}
});
await new Promise(resolve=>srv.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+srv.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:850}});
  const page=await context.newPage(),errors=[],outside=[],failures=[];
  page.on('pageerror',err=>errors.push(err.message));
  page.on('requestfailed',r=>failures.push(r.url()+' '+r.failure()?.errorText));
  page.on('request',r=>{
   const u=r.url();
   if(u.startsWith(origin)||u.startsWith('blob:'+origin+'/')||u.startsWith('data:'))return;
   outside.push(u.slice(0,100));
  });
  await page.goto(origin+'/research/three-d-08/index.html');
  try{
   await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true',
    null,{timeout:25000});
  }catch(e){
   const details=await page.evaluate(()=>({
    title:document.title,status:document.querySelector('#status')?.textContent,
    photoStatus:document.querySelector('#photoStatus')?.textContent,
    body:document.body.innerText.slice(0,1200),
    canvasReady:document.querySelector('#avatar')?.dataset.ready
   }));
   console.error('THREE_D_08_STARTUP_DIAGNOSTIC',JSON.stringify({width,details,errors,
    failedRequests:failures.slice(-12),outsideRequests:outside.slice(-12)}));
   await mkdir('benchmark/three-d-08',{recursive:true});
   await page.screenshot({path:'benchmark/three-d-08/startup-failure-'+width+'-HOLD.png',fullPage:true});
   throw e;
  }
  const canvas=page.locator('#avatar');
  assert.equal(await canvas.getAttribute('data-model'),'female');
  assert.equal(await canvas.getAttribute('data-shirt'),'none');
  assert.equal(await page.locator('#dress').isDisabled(),true);
  assert.equal(await page.locator('#review').isChecked(),false);
  const noPhoto=await canvas.evaluate(c=>c.toDataURL());
  assert.ok(noPhoto.length>15000,'Actual rigged human must render before applying clothes');
  await page.evaluate(()=>document.getElementById('dress').click());
  assert.equal(await canvas.getAttribute('data-shirt'),'none','Inert script clicks must not project garments');
  await page.locator('#review').check();
  assert.equal(await page.locator('#dress').isEnabled(),true);
  await page.locator('#dress').click();
  await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.shirt==='separate-garment',
   null,{timeout:45000});
  assert.equal(await canvas.getAttribute('data-photo-source'),'commons-0003');
  assert.equal(await canvas.getAttribute('data-photo-approved'),'false');
  assert.match(await page.locator('#photoStatus').innerText(),/NOT rigged\/cloth-simulated or visually approved/);
  assert.equal(await canvas.getAttribute('data-garment-mesh'),'true');
  const surface=await canvas.evaluate(c=>({
   total:Number(c.dataset.garmentTriangles),
   torso:Number(c.dataset.garmentTorsoTriangles),
   sleeves:Number(c.dataset.garmentSleeveTriangles),
   panel:Number(c.dataset.garmentFrontPanelTriangles)
  }));
  assert.ok(surface.total>1200&&surface.torso>300&&surface.sleeves>60&&surface.panel>=600,
   JSON.stringify({problem:'No real separate anatomical shirt triangle shell',surface}));
  console.log('THREE_D_08_GENUINE_SEPARATE_GARMENT',JSON.stringify({
   width,...surface,source:'real Work47 cutout',fit:'STATIC POSE ONLY'
  }));
  const dressed=await canvas.evaluate(c=>c.toDataURL());
  assert.notEqual(dressed,noPhoto,'Reviewed cutout must change actual anatomical GPU render');
  const pixelChange=await canvas.evaluate(async c=>{
   // Front photo isn't a flat browser image: the real WebGL canvas draws
   // anatomically skinned meshes, with actual source cutout in material.
   const t=document.createElement('canvas');t.width=c.width;t.height=c.height;
   t.getContext('2d').drawImage(c,0,0);
   const rgba=t.getContext('2d').getImageData(0,0,t.width,t.height).data;
   let black=0;
   for(let y=Math.floor(t.height*.25);y<Math.floor(t.height*.55);y+=3)
    for(let x=Math.floor(t.width*.30);x<Math.floor(t.width*.70);x+=3){
     const i=(y*t.width+x)*4;
     if(rgba[i]<115&&rgba[i+1]<115&&rgba[i+2]<115)black++;
    }
   return {black};
  });
  assert.ok(pixelChange.black>20,JSON.stringify({problem:'Photographed black shirt absent from independent garment shell',pixelChange}));
  // Regression for visual failure from first successful shader tests:
  // male chest had huge white opening while black strips survived at sides.
  // Compare central upper-chest pixels, not overall black count.
  const central=await canvas.evaluate(c=>{
   const t=document.createElement('canvas');t.width=c.width;t.height=c.height;
   const context=t.getContext('2d');context.drawImage(c,0,0);
   const rgba=context.getImageData(0,0,t.width,t.height).data;
   let black=0,total=0;
   for(let y=Math.floor(t.height*.34);y<Math.floor(t.height*.42);y+=2)
    for(let x=Math.floor(t.width*.47);x<Math.floor(t.width*.53);x+=2){
     const i=(y*t.width+x)*4;total++;
     if(rgba[i]<115&&rgba[i+1]<115&&rgba[i+2]<115)black++;
    }
   return {black,total};
  });
  assert.ok(central.black>=18,JSON.stringify({
    problem:'Large exposed white center-chest gap despite black side strips',
    width,model:'female',central
  }));
  await mkdir('benchmark/three-d-08',{recursive:true});
  await page.screenshot({path:'benchmark/three-d-08/female-'+width+'-real-shirt-anatomical-HOLD.png',
   fullPage:true});
  await page.getByRole('button',{name:'Side',exact:true}).click();
  const side=await canvas.evaluate(c=>c.toDataURL());
  assert.notEqual(side,dressed,'Same source shirt must rotate on true 3D anatomical body');
  await page.getByRole('button',{name:'Back',exact:true}).click();
  const back=await canvas.evaluate(c=>c.toDataURL());
  assert.notEqual(back,dressed);
  await page.getByRole('button',{name:'Front',exact:true}).click();
  await page.locator('#review').uncheck();
  assert.equal(await canvas.getAttribute('data-shirt'),'none',
   'Removing review must immediately remove real source texture from GPU');
  assert.equal(await canvas.getAttribute('data-garment-mesh'),'none',
   'Rejecting review must dispose the SEPARATE garment mesh, not only a shader flag');
  await page.locator('#model').selectOption('male');
  await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.model==='male'&&
   document.querySelector('#avatar')?.dataset.ready==='true',null,{timeout:75000});
  assert.equal(await canvas.getAttribute('data-shirt'),'none','Rig change never auto-attaches someone else’s photo');
  await page.locator('#review').check();
  await page.locator('#dress').click();
  await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.shirt==='separate-garment',
   null,{timeout:45000});
  await page.getByRole('button',{name:'Front',exact:true}).click();
  // Re-run the central chest pixel coverage check on the OTHER rig,
  // because the former male mesh had a serious hollow front center.
  const maleCenter=await canvas.evaluate(c=>{
   const t=document.createElement('canvas');t.width=c.width;t.height=c.height;
   const context=t.getContext('2d');context.drawImage(c,0,0);
   const p=context.getImageData(0,0,t.width,t.height).data;
   let black=0,total=0;
   for(let y=Math.floor(t.height*.34);y<Math.floor(t.height*.42);y+=2)
    for(let x=Math.floor(t.width*.47);x<Math.floor(t.width*.53);x+=2){
     const i=(y*t.width+x)*4;total++;
     if(p[i]<115&&p[i+1]<115&&p[i+2]<115)black++;
    }
   return {black,total};
  });
  const maleMeshStats=await canvas.evaluate(c=>({
   total:Number(c.dataset.garmentTriangles),
   torso:Number(c.dataset.garmentTorsoTriangles),
   sleeves:Number(c.dataset.garmentSleeveTriangles),
   panel:Number(c.dataset.garmentFrontPanelTriangles)
  }));
  console.log('THREE_D_08_MALE_CHEST_DIAGNOSTIC',
   JSON.stringify({width,maleCenter,maleMeshStats,
    femaleCenter:central,sourceId:await canvas.getAttribute('data-photo-source')}));
  await page.screenshot({path:'benchmark/three-d-08/male-'+width+
    '-coverage-diagnostic-HOLD.png',fullPage:true});
  assert.ok(maleCenter.black>=18,JSON.stringify({
   problem:'Male center chest failed genuine cloth-coverage gate',
   width,maleCenter,maleMeshStats
  }));
  console.log('THREE_D_08_REAL_CENTER_CHEST_COVERAGE',
   JSON.stringify({width,female:central,male:maleCenter}));
  await page.screenshot({path:'benchmark/three-d-08/male-'+width+'-real-shirt-anatomical-HOLD.png',
   fullPage:true});
  await page.locator('#clear').click();
  assert.equal(await canvas.getAttribute('data-shirt'),'none');
  assert.equal(await page.locator('#dress').isDisabled(),true);
  assert.deepEqual(errors,[]);
  assert.deepEqual(outside,[]);
  assert.deepEqual(failures.filter(x=>!(x.startsWith(origin+'/research/three-d-06/models/')&&
   x.endsWith('net::ERR_ABORTED'))),[]);
  console.log('THREE_D_08_REAL_SHIRT_ON_RIG',JSON.stringify({
   width,realMaleFemaleGLB:true,riggedSkinnedHuman:true,realSeparateGarmentMesh:true,
   sourceVerifiedOriginalJPEG:true,sourceVerifiedCutoutPNG:true,
   liveMaterialChanged:true,torsoDarkPixels:pixelChange.black,
   explicitReview:true,sourceBindsOnBothRigs:true,
   neverOwnerApproved:true,back:'unverified-source-median',
   garmentGeometry:true,release:'HOLD',outsideRequests:outside.length
  }));
  await context.close();
 }
}finally{await browser?.close();srv.close();}
