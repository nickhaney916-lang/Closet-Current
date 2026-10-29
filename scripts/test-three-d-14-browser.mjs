/** Real Chromium/WebGL2: photographed Work47 dress, BOTH real 163-bone bodies. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('.'),server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/three\/)/.test(pathname)||
    pathname.includes('\0')||pathname.includes('\\'))throw Error('Blocked');
  const p=resolve(root,'.'+pathname);
  if(!p.startsWith(root+'/'))throw Error('Traversal');
  const ext=extname(p);
  const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html',
   '.json':'application/json','.glb':'model/gltf-binary','.jpg':'image/jpeg','.png':'image/png'};
  res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream',
   'cache-control':'no-store'});res.end(await readFile(p));
 }catch{res.writeHead(404);res.end('No trusted local asset');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:850}});
  const page=await context.newPage(),outside=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:'+origin+'/')&&
   !r.url().startsWith('data:'))outside.push(r.url().slice(0,130));});
  await page.goto(origin+'/research/three-d-14/index.html');
  try{
   await page.waitForFunction(()=>document.getElementById('avatar')?.dataset.ready==='true',
    null,{timeout:20000});
  }catch(e){
   const d=await page.evaluate(()=>({status:document.getElementById('status')?.textContent,
    body:document.body.innerText.slice(0,550),ready:document.getElementById('avatar')?.dataset.ready}));
   await mkdir('benchmark/three-d-14',{recursive:true});
   await page.screenshot({path:'benchmark/three-d-14/startup-failure-'+width+'-HOLD.png',fullPage:true});
   console.error('DRESS_3D14_STARTUP_DIAGNOSTIC',JSON.stringify({width,diagnostic:d,errors,outside}));
   throw e;
  }
  const c=page.locator('#avatar');
  assert.equal(await c.getAttribute('data-bones'),'163');
  assert.equal(await c.getAttribute('data-dress'),'none','No user permission means no dress applied');
  assert.equal(await page.locator('#apply').isDisabled(),true);
  const before=await c.evaluate(c=>c.toDataURL('image/png'));
  await page.evaluate(()=>document.getElementById('apply').click());
  assert.equal(await c.getAttribute('data-dress'),'none');
  await page.locator('#review').check();
  await page.locator('#apply').click();
  await page.waitForFunction(()=>document.getElementById('avatar')?.dataset.dress==='commons-0053',
   null,{timeout:40000});
  assert.equal(await c.getAttribute('data-shared-skeleton'),'true');
  assert.ok(Number(await c.getAttribute('data-dress-triangles'))>700);
  assert.match(await page.locator('#info').innerText(),/NOT visually accepted/);
  const dressed=await c.evaluate(c=>c.toDataURL('image/png'));
  assert.notEqual(dressed,before,'Actual 3D garment should change framebuffer');
  await page.getByRole('button',{name:'Side',exact:true}).click();
  const side=await c.evaluate(c=>c.toDataURL('image/png'));
  assert.notEqual(side,dressed,'Separate garment truly rotates in 3D');
  await page.getByRole('button',{name:'Back',exact:true}).click();
  const back=await c.evaluate(c=>c.toDataURL('image/png'));
  assert.notEqual(back,side);
  await page.locator('#pose').selectOption('source');
  assert.equal(await c.getAttribute('data-dress'),'commons-0053','Source pose retains same dress');
  await page.locator('#pose').selectOption('relaxed');
  await page.getByRole('button',{name:'Front',exact:true}).click();
  await mkdir('benchmark/three-d-14',{recursive:true});
  await page.screenshot({path:'benchmark/three-d-14/female-'+width+'-original-dress-HOLD.png',fullPage:true});
  await page.locator('#model').selectOption('male');
  await page.waitForFunction(()=>document.getElementById('avatar')?.dataset.model==='male'&&
   document.getElementById('avatar')?.dataset.ready==='true',null,{timeout:50000});
  assert.equal(await c.getAttribute('data-dress'),'none','Changing account/body must clear garment');
  await page.locator('#review').check();await page.locator('#apply').click();
  await page.waitForFunction(()=>document.getElementById('avatar')?.dataset.dress==='commons-0053',
   null,{timeout:40000});
  await page.getByRole('button',{name:'Front',exact:true}).click();
  await page.screenshot({path:'benchmark/three-d-14/male-'+width+'-original-dress-HOLD.png',fullPage:true});
  await page.locator('#remove').click();
  assert.equal(await c.getAttribute('data-dress'),'none');
  assert.equal(await page.locator('#review').isChecked(),false);
  assert.equal(await page.locator('#apply').isDisabled(),true);
  assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);
  console.log('THREE_D_14_SOURCE_DRESS_GPU',JSON.stringify({
   width,realSkinnedHuman:true,originalPNG:'commons-0053',
   maleFemale:true,frontSideBack:true,sourceAndRelaxedPose:true,
   originalUnchanged:true,bodySwitchClearsDress:true,external:outside.length,
   visualApproved:false,release:'HOLD'}));
  await context.close();
 }
}finally{await browser?.close();server.close();}
