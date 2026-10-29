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
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir('benchmark/three-d-08',{recursive:true});
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:850}}),page=await context.newPage(),errors=[],outside=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:'+origin)&&!r.url().startsWith('data:'))outside.push(r.url());});
  console.log('GO',width);await page.goto(origin+'/research/three-d-08/index.html',{waitUntil:'domcontentloaded'});console.log('DOM');
  page.on('console',m=>console.log('BROWSER',m.text().slice(0,300)));
  try{await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true',null,{timeout:30000});}catch(e){console.log(await page.locator('#status').innerText(),errors);throw e;}console.log('READY');
  const canvas=page.locator('#avatar');
  for(const model of ['female','male']){
   if(model==='male'){await page.locator('#model').selectOption(model);await page.waitForFunction(()=>document.querySelector('#avatar').dataset.model==='male'&&document.querySelector('#avatar').dataset.ready==='true');}
   for(const mode of ['projection','shell']){
    await page.locator('#mode').selectOption(mode);
    await page.locator('#review').check();await page.locator('#dress').click();
    try{await page.waitForFunction(()=>document.querySelector('#avatar').dataset.shirt==='source-reviewed',null,{timeout:30000});}catch(e){console.error(await page.locator('#photoStatus').innerText(),errors);throw e;}
    assert.equal(await canvas.getAttribute('data-mode'),mode);
    if(mode==='shell'){assert.ok(Number(await canvas.getAttribute('data-garment-triangles'))>1000);assert.equal(await canvas.getAttribute('data-garment-bones'),'163');}
    const pixels=[];
    for(const view of ['front','side','back']){
     await page.locator('#'+view).click();await page.waitForTimeout(100);
     pixels.push(await canvas.evaluate(c=>c.toDataURL()));
     await canvas.screenshot({path:`benchmark/three-d-08/${model}-${width}-${mode}-${view}-HOLD.png`});
    }
    assert.notEqual(pixels[0],pixels[1]);assert.notEqual(pixels[0],pixels[2]);
    await page.locator('#clear').click();assert.equal(await canvas.getAttribute('data-shirt'),'none');assert.equal(await canvas.getAttribute('data-garment-triangles'),null);
    const cleared=await page.evaluate(()=>work56Diagnostics());assert.equal(cleared.garment,null);assert.ok(cleared.resources.textures<=2,'Clear must release photographic GPU textures');
   }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
  await page.screenshot({path:`benchmark/three-d-08/page-${width}-HOLD.png`,fullPage:true});
  console.log('WORK56_RENDER_PASS',JSON.stringify({width,models:2,modes:2,views:3,externalRequests:outside.length,release:'HOLD'}));
  await context.close();
 }
}finally{await browser?.close();srv.close();}
