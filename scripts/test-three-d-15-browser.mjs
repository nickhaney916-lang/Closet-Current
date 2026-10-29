/** Real 3D-15 Chromium integration: Work59 shirt, Work60 pants and 3D14 dress. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/three\/)/.test(p)||
   p.includes('\\')||p.includes('\0'))throw Error('Untrusted asset path');
  const path=resolve(root,'.'+p);
  if(!path.startsWith(root+'/'))throw Error('Source root escape');
  const ext=extname(path);
  const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html',
   '.json':'application/json','.glb':'model/gltf-binary','.jpg':'image/jpeg','.png':'image/png'};
  const bytes=await readFile(path);
  res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch(e){if(!res.headersSent){res.writeHead(404);res.end('No such local research asset');}else res.destroy(e);}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const localRequest=url=>url.startsWith(origin)||url.startsWith('blob:'+origin+'/')||url.startsWith('data:');
let browser;
try{
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 for(const width of [320,390,430]){
  const ctx=await browser.newContext({viewport:{width,height:850},deviceScaleFactor:1.5,hasTouch:true});
  const page=await ctx.newPage(),errors=[],outside=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!localRequest(r.url()))outside.push(r.url().slice(0,130));});
  page.on('requestfailed',r=>failed.push({url:r.url(),reason:r.failure()?.errorText}));
  await page.goto(origin+'/research/three-d-15/index.html');
  try{
   await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true',
    null,{timeout:65000});
  }catch(e){
   const d=await page.evaluate(()=>({
    status:document.querySelector('#status')?.textContent,
    dressStatus:document.querySelector('#dressStatus')?.textContent,
    body:document.body.innerText.slice(0,600)
   }));
   await mkdir('benchmark/three-d-15',{recursive:true});
   await page.screenshot({path:'benchmark/three-d-15/failed-start-'+width+'-HOLD.png',fullPage:true});
   console.error('THREE_D_15_STARTUP_DIAGNOSTIC',JSON.stringify({width,diagnostics:d,errors,failed,outside}));
   throw e;
  }
  const state=()=>page.evaluate(()=>window.unified3DDiagnostics());
  const c=page.locator('#avatar');
  let s=await state();
  assert.equal(s.kind,'female');assert.equal(s.dress,null);
  assert.equal(s.shirt,null);assert.ok(s.pants?.triangles>1000);
  assert.equal(await page.locator('#dressMode').isEnabled(),true);
  // Source JPEG and cutout must be visually compared before any original dress.
  await page.locator('#dressMode').click();
  assert.equal(await page.locator('#dressApply').isDisabled(),true);
  await page.evaluate(()=>document.getElementById('dressApply').click());
  assert.equal((await state()).dress,null,'Synthetic click cannot bypass review');
  await page.locator('#dressReview').check();
  await page.locator('#dressApply').click();
  await page.waitForFunction(()=>window.unified3DDiagnostics()?.dress?.sourceId==='commons-0053',
   null,{timeout:60000});
  s=await state();
  assert.equal(s.shirt,null,'Dress must remove the separate shirt');
  assert.equal(s.pants,null,'Dress must hide/remove the neutral research pants');
  assert.equal(s.dress.sharedSkeleton,true,'Dress must remain bound to identical anatomical skeleton');
  assert.ok(s.dress.triangles>=900);
  assert.equal(s.dress.frontOriginalPixels,true);
  assert.equal(s.dress.releaseAuthorized,false);
  const photographed=await c.evaluate(c=>c.toDataURL('image/png'));
  await mkdir('benchmark/three-d-15',{recursive:true});
  await page.screenshot({path:'benchmark/three-d-15/female-'+width+'-real-dress-HOLD.png',fullPage:true});
  await page.locator('#side').click();
  assert.notEqual(await c.evaluate(c=>c.toDataURL()),photographed,'Actual dress must rotate with real figure');
  await page.locator('#back').click();
  await page.locator('#pose').selectOption('source');
  assert.equal((await state()).dress.sourceId,'commons-0053');
  await page.locator('#pose').selectOption('relaxed');
  assert.equal((await state()).dress.sourceId,'commons-0053');
  await page.locator('#front').click();
  // Exactly one outfit branch may exist: selecting pants removes dress, shirt remains absent.
  await page.locator('#pants').click();
  s=await state();
  assert.equal(s.dress,null);assert.ok(s.pants?.triangles>1000);assert.equal(s.shirt,null);
  // Existing Work59 original photographed shirt remains a distinct source.
  await page.locator('#garment').click();
  assert.equal(await page.locator('#dress').isDisabled(),true);
  await page.locator('#review').check();
  await page.locator('#dress').click();
  await page.waitForFunction(()=>window.unified3DDiagnostics()?.shirt?.id==='commons-0003',
   null,{timeout:60000});
  s=await state();
  assert.ok(s.shirt?.triangles>1000&&s.pants?.triangles>1000);
  assert.equal(s.dress,null);
  assert.equal(s.shirt.sharedSkeleton,true);
  await page.locator('#front').click();
  await page.screenshot({path:'benchmark/three-d-15/female-'+width+'-shirt-and-neutral-pants-HOLD.png',fullPage:true});
  // Applying a dress to a populated outfit clears both predecessor garments.
  await page.locator('#dressMode').click();
  await page.locator('#dressReview').check();await page.locator('#dressApply').click();
  await page.waitForFunction(()=>window.unified3DDiagnostics()?.dress?.sourceId==='commons-0053',
   null,{timeout:60000});
  s=await state();assert.equal(s.shirt,null);assert.equal(s.pants,null);
  await page.locator('#model').selectOption('male');
  await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true'&&
   document.querySelector('#model')?.value==='male',null,{timeout:65000});
  s=await state();assert.equal(s.kind,'male');
  assert.equal(s.dress,null);assert.equal(s.shirt,null);
  assert.ok(s.pants?.triangles>1000,'Changing model restores only original neutral pants preset');
  // Real adult male anatomy supports the same verified separate dress.
  await page.locator('#dressMode').click();
  await page.locator('#dressReview').check();
  await page.locator('#dressApply').click();
  await page.waitForFunction(()=>window.unified3DDiagnostics()?.dress?.sourceId==='commons-0053',
   null,{timeout:60000});
  s=await state();assert.equal(s.dress.sharedSkeleton,true);assert.equal(s.pants,null);
  await page.locator('#front').click();
  await page.screenshot({path:'benchmark/three-d-15/male-'+width+'-real-dress-HOLD.png',fullPage:true});
  await page.locator('#dressMode').click();
  s=await state();assert.equal(s.dress,null);
  assert.equal(await page.locator('#dressApply').isDisabled(),true);
  // Preserve zero-outside-request policy and avoid invisible overflow of controls.
  const geometry=await page.evaluate(()=>({
   scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,
   applyVisible:!!document.querySelector('#dressMode')?.getBoundingClientRect().width
  }));
  assert.ok(geometry.scrollWidth<=geometry.viewport+1,JSON.stringify(geometry));
  assert.equal(geometry.applyVisible,true);
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
  assert.deepEqual(failed.filter(x=>!(x.url.startsWith(origin+'/research/three-d-06/models/')&&
   x.reason==='net::ERR_ABORTED')) ,[]);
  console.log('THREE_D_15_UNIFIED_OUTFIT_REAL_WEBGL',JSON.stringify({
   width,maleAndFemale:true,originalDress:'commons-0053',originalShirt:'commons-0003',
   pants:'neutral-no-photo',independentSameSkeleton:true,sourceAndRelaxedPoses:true,
   originalPhotoApproved:false,frontBackRotation:true,
   reversibleOutfitSwitch:true,noOverlappingDressAndPants:true,
   externalRequests:outside.length,release:'HOLD'}));
  await ctx.close();
 }
}finally{await browser?.close();server.close();}
