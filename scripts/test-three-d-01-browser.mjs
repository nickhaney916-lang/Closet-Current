/** Actual offline Chromium WebGL2 smoke, no staging, customer photos or outgoing network. */
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(!/^\/(?:research\/|benchmark\/)/.test(path)||path.includes('\0'))throw Error('Not allowed');
  const file=resolve(root+'.'+decodeURIComponent(path));
  if(!file.startsWith(root+'/'))throw Error('Forbidden path');
  const content=await readFile(file);
  const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html',
    '.json':'application/json','.jpg':'image/jpeg','.png':'image/png'};
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(content);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:800}});
  const page=await context.newPage();
  const errors=[],foreign=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('request',request=>{if(!request.url().startsWith(origin))foreign.push(request.url().slice(0,100));});
  await page.goto(origin+'/research/three-d-01/index.html');
  await page.waitForFunction(()=>document.getElementById('status')?.textContent.includes('template rendered'),
   null,{timeout:30000});
  assert.deepEqual(errors,[]);
  assert.deepEqual(foreign,[]);
  assert.equal(await page.locator('#viewer').getAttribute('data-type'),'shirt');
  assert.equal(await page.locator('#viewer').getAttribute('data-front-projection'),'true');
  const initial=await page.locator('#viewer').evaluate(c=>c.toDataURL('image/png'));
  assert.ok(initial.length>3000,'Actual WebGL pixels must be rendered, not just DOM');
  await page.getByRole('button',{name:'Side',exact:true}).click();
  const side=await page.locator('#viewer').evaluate(c=>c.toDataURL('image/png'));
  assert.notEqual(side,initial,'Real 3D rotation should change output');
  await page.getByRole('button',{name:'Back',exact:true}).click();
  const back=await page.locator('#viewer').evaluate(c=>c.toDataURL('image/png'));
  assert.notEqual(back,side,'3D backside should differ from front/side');
  await page.getByRole('button',{name:'Front',exact:true}).click();
  const front=await page.locator('#viewer').evaluate(c=>c.toDataURL('image/png'));
  assert.equal(front,initial,'Same camera angle and source should deterministically redraw');
  const garment=page.locator('#kind');
  for(const kind of ['pants','dress','shirt']){
   await garment.selectOption(kind);
   await page.waitForFunction(v=>document.getElementById('viewer')?.dataset.type===v &&
    document.getElementById('status')?.textContent.startsWith('3D '+v+' template rendered'),kind);
   const id={pants:'commons-0021.jpg',dress:'commons-0049.jpg',shirt:'commons-0002.jpg'}[kind];
   assert.ok((await page.locator('#original').getAttribute('src'))?.endsWith('/'+id),'Original licensed source must stay visible');
   const png=await page.locator('#viewer').evaluate(c=>c.toDataURL());
   assert.notEqual(png,back,'Meshes actually re-render when garment type changes');
  }
  await page.locator('#figure').selectOption('youth');
  await page.waitForFunction(()=>document.getElementById('viewer')?.dataset.figure==='youth');
  const plain=page.locator('#projection');
  await plain.uncheck();
  await page.waitForFunction(()=>document.getElementById('viewer')?.dataset.frontProjection==='false');
  assert.ok((await page.locator('#status').textContent()).includes('Family Alpha HOLD'));
  await plain.check();
  await page.waitForFunction(()=>document.getElementById('viewer')?.dataset.frontProjection==='true');
  await mkdir('benchmark/three-d-01',{recursive:true});
  await page.screenshot({path:'benchmark/three-d-01/chromium-'+width+'-3d-prototype-HOLD.png',fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(foreign,[]);
  const stats=await page.locator('#viewer').evaluate(c=>({frames:Number(c.dataset.renderCount),
   meshCount:Number(c.dataset.meshCount),width:c.width,height:c.height}));
  assert.ok(stats.frames>=12&&stats.meshCount>=8&&stats.width>100&&stats.height>100);
  console.log('THREE_D_01_WEBGL_BROWSER',JSON.stringify({width,realWebGL:true,photoFront:true,
   trueRotation:true,threeGarments:true,youth:true,network:'LOCAL ONLY',
   release:'HOLD',frames:stats.frames,meshes:stats.meshCount}));
  await context.close();
 }
}finally{await browser?.close();server.close();}
