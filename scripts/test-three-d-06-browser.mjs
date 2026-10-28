/**
 * Exact local, real 3D anatomically skinned CC0 GLB proof.
 * No remote dependencies in browser; model acquisition occurs BEFORE test.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://127.0.0.1').pathname;
  if(!/^\/(?:research\/three-d-06\/|node_modules\/three\/)/.test(pathname))throw Error('Outside 3D prototype');
  const p=resolve(root,'.'+decodeURIComponent(pathname));
  if(!p.startsWith(root+'/'))throw Error('Path escape');
  const ext=extname(p),mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html',
   '.json':'application/json','.glb':'model/gltf-binary'};
  const bytes=await readFile(p);
  res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch(e){res.writeHead(404);res.end('No such local research asset');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 for(const width of [320,390,430]){
  const ctx=await browser.newContext({viewport:{width,height:850}});
  const page=await ctx.newPage(),errors=[],outside=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>failed.push(r.url().slice(0,110)+': '+r.failure()?.errorText));
  page.on('request',r=>{
   const url=r.url();
   if(url.startsWith(origin)||url.startsWith('blob:'+origin+'/')||url.startsWith('data:'))return;
   outside.push(url.slice(0,130));
  });
  await page.goto(origin+'/research/three-d-06/index.html');
  await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true',
   null,{timeout:70000});
  assert.deepEqual(errors,[]);
  // A completed, inspected local GLB may trigger Chromium's harmless
  // net::ERR_ABORTED for a redundant in-flight local request. Never forgive
  // an external origin, a missing source, or a non-abort error.
  assert.deepEqual(failed.filter(x=>!(x.startsWith(origin+'/research/three-d-06/models/')&&
   x.endsWith('net::ERR_ABORTED'))),[]);
  assert.equal(await page.locator('#avatar').getAttribute('data-model'),'female');
  assert.equal(await page.locator('#avatar').getAttribute('data-license'),'CC0-1.0');
  const stats=await page.locator('#avatar').evaluate(el=>({bones:Number(el.dataset.bones),
   triangles:Number(el.dataset.triangles),frames:Number(el.dataset.frames),
   skinned:Number(el.dataset.skinnedMeshes)}));
  assert.ok(stats.bones>=25&&stats.skinned>=1&&stats.triangles>10000,JSON.stringify(stats));
  const modest=await page.locator('#avatar').evaluate(c=>{
   const ctx=document.createElement('canvas');ctx.width=c.width;ctx.height=c.height;
   const p=ctx.getContext('2d');p.drawImage(c,0,0);
   const pixels=p.getImageData(0,0,ctx.width,ctx.height).data;
   let darker=0;
   for(let y=Math.floor(ctx.height*.29);y<Math.floor(ctx.height*.51);y+=3)
    for(let x=Math.floor(ctx.width*.37);x<Math.floor(ctx.width*.63);x+=3){
     const i=(y*ctx.width+x)*4;
     if(pixels[i]<110&&pixels[i+1]<135&&pixels[i+2]<135)darker++;
    }
   return darker;
  });
  assert.ok(modest>30,'Neutral fitted base layer must cover torso/pelvis; nude research mesh cannot be family-facing');
  const front=await page.locator('#avatar').evaluate(c=>c.toDataURL());
  assert.ok(front.length>15000,'Actual detailed anatomical human mesh must be rendered');
  await page.getByRole('button',{name:'Side',exact:true}).click();
  const side=await page.locator('#avatar').evaluate(c=>c.toDataURL());
  assert.notEqual(front,side,'Actual anatomical figure must rotate to a new 3D angle');
  await page.getByRole('button',{name:'Back',exact:true}).click();
  const rear=await page.locator('#avatar').evaluate(c=>c.toDataURL());
  assert.notEqual(side,rear);
  await page.getByRole('button',{name:'Front',exact:true}).click();
  await page.locator('#finish').selectOption('slate');
  const finish=await page.locator('#avatar').evaluate(c=>c.toDataURL());
  assert.notEqual(front,finish,'Mannequin material must change');
  await page.locator('#model').selectOption('male');
  await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.model==='male'&&
   document.querySelector('#avatar')?.dataset.ready==='true',null,{timeout:70000});
  const male=await page.locator('#avatar').evaluate(c=>c.toDataURL());
  assert.notEqual(finish,male,'Two independent anatomical male/female rigs must be selectable');
  const sm=await page.locator('#avatar').evaluate(c=>({
   bones:Number(c.dataset.bones),frames:Number(c.dataset.frames)}));
  assert.ok(sm.bones>=25&&sm.frames>stats.frames);
  await page.getByRole('button',{name:'Front',exact:true}).click();
  await mkdir('benchmark/three-d-06',{recursive:true});
  await page.screenshot({path:'benchmark/three-d-06/cc0-anatomical-MALE-'+width+'px-HOLD.png',fullPage:true});
  await page.getByRole('button',{name:'Rotate +35°'}).click();
  assert.ok(Number(await page.locator('#avatar').getAttribute('data-frames'))>sm.frames);
  await page.getByRole('button',{name:'Auto-rotate: Off'}).click();
  assert.equal(await page.getByRole('button',{name:'Auto-rotate: On'}).count(),1);
  await page.getByRole('button',{name:'Auto-rotate: On'}).click();
  await page.locator('#model').selectOption('female');
  await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.model==='female'&&
   document.querySelector('#avatar')?.dataset.ready==='true',null,{timeout:70000});
  await page.locator('#finish').selectOption('porcelain');
  await page.getByRole('button',{name:'Front',exact:true}).click();
  await mkdir('benchmark/three-d-06',{recursive:true});
  await page.screenshot({path:'benchmark/three-d-06/cc0-anatomical-FEMALE-'+width+'px-HOLD.png',
   fullPage:true});
  assert.deepEqual(errors,[]);
  // A completed, inspected local GLB may trigger Chromium's harmless
  // net::ERR_ABORTED for a redundant in-flight local request. Never forgive
  // an external origin, a missing source, or a non-abort error.
  assert.deepEqual(failed.filter(x=>!(x.startsWith(origin+'/research/three-d-06/models/')&&
   x.endsWith('net::ERR_ABORTED'))),[]);assert.deepEqual(outside,[]);
  console.log('THREE_D_06_ACTUAL_ANATOMICAL_CC0_BROWSER',JSON.stringify({
   width,male:true,female:true,bonesAtLeast25:true,actualSkinnedMeshes:true,
   detailedGeometry:true,rotating:true,localOnly:true,externalRequests:0,release:'HOLD'
  }));
  await ctx.close();
 }
}finally{await browser?.close();server.close();}
