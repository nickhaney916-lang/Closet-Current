/** Real source-bound Work47 PNG -> actual WebGL2 garment material. No staging, no network. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://127.0.0.1').pathname;
  if(!/^\/(?:research\/|benchmark\/)/.test(pathname)||pathname.includes('\0'))throw Error('Forbidden');
  const path=resolve(root,'.'+decodeURIComponent(pathname));
  if(!path.startsWith(root+'/'))throw Error('Escaped source root');
  const file=await readFile(path),ext=extname(path);
  const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html',
   '.json':'application/json','.jpg':'image/jpeg','.png':'image/png'};
  res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream','cache-control':'no-store'});
  res.end(file);
 }catch{res.writeHead(404);res.end('Missing research asset');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:850}});
  const page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{const url=r.url();if(url.startsWith(origin)||url.startsWith('blob:'+origin+'/'))return;external.push(url.slice(0,100));});
  await page.goto(origin+'/research/three-d-02/index.html');
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('template ready'),null,{timeout:30000});
  const viewer=page.locator('#viewer');
  assert.equal(await viewer.getAttribute('data-type'),'shirt');
  assert.equal(await viewer.getAttribute('data-photo-projection'),'false','Unreviewed cutout never auto projects');
  assert.equal(await page.locator('#apply').isDisabled(),true);
  const baseline=await viewer.evaluate(c=>c.toDataURL('image/png'));
  assert.ok(baseline.length>2500);
  // Forged scripted clicks are not allowed to approve a cutout.
  await page.evaluate(()=>document.getElementById('apply').click());
  assert.equal(await viewer.getAttribute('data-photo-projection'),'false');
  await page.locator('#review').check();
  await page.locator('#apply').click();
  await page.waitForFunction(()=>document.querySelector('#viewer')?.dataset.cutoutReady==='true',
   null,{timeout:30000});
  assert.equal(await viewer.getAttribute('data-photo-projection'),'true');
  assert.match(await page.locator('#status').innerText(),/NOT visually approved/);
  const shirt=await viewer.evaluate(c=>c.toDataURL());
  assert.notEqual(shirt,baseline,'Actual source-RGB alpha garment should change the rendered surface');
  const alphaInfo=await page.locator('#cutout').evaluate(img=>{
   const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
   const c=canvas.getContext('2d');c.drawImage(img,0,0);
   const p=c.getImageData(0,0,canvas.width,canvas.height).data;
   let clear=0,visible=0;
   for(let i=3;i<p.length;i+=4){if(p[i]===0)clear++;if(p[i]>=128)visible++;}
   return {clear,visible};
  });
  assert.ok(alphaInfo.clear>100&&alphaInfo.visible>100,'Real transparent garment material is required');
  await page.getByRole('button',{name:'Side',exact:true}).click();
  assert.notEqual(await viewer.evaluate(c=>c.toDataURL()),shirt,'Real mesh changes with angle');
  await page.getByRole('button',{name:'Back',exact:true}).click();
  const back=await viewer.evaluate(c=>c.toDataURL());
  assert.notEqual(back,shirt,'Inferred rear is not copy of source photo');
  await page.locator('#review').uncheck();
  await page.waitForFunction(()=>document.querySelector('#viewer')?.dataset.photoProjection==='false');
  assert.equal(await viewer.getAttribute('data-cutout-ready'),'false');
  await page.locator('#sample').selectOption('commons-0053');
  await page.waitForFunction(()=>document.querySelector('#viewer')?.dataset.type==='dress'&&
   document.querySelector('#status')?.textContent.includes('template ready'));
  assert.equal(await page.locator('#apply').isDisabled(),true);
  await page.locator('#review').check();
  await page.locator('#apply').click();
  await page.waitForFunction(()=>document.querySelector('#viewer')?.dataset.cutoutReady==='true',
   null,{timeout:30000});
  const dress=await viewer.evaluate(c=>c.toDataURL());
  assert.notEqual(dress,shirt,'Real dress uses its own cutout, not same shirt image');
  await page.getByRole('button',{name:'Front',exact:true}).click();
  await page.locator('#figure').selectOption('youth');
  assert.equal(await viewer.getAttribute('data-body'),'youth');
  await page.locator('#sample').selectOption('commons-0021');
  await page.waitForFunction(()=>document.querySelector('#viewer')?.dataset.type==='pants'&&
   document.querySelector('#status')?.textContent.includes('template ready'));
  assert.equal(await page.locator('#review').isDisabled(),true);
  assert.equal(await page.locator('#apply').isDisabled(),true);
  assert.equal(await viewer.getAttribute('data-photo-projection'),'false','No pants cutout -> neutral fallback');
  assert.match(await page.locator('#fallback').innerText(),/NO RELIABLE REVIEWED CUTOUT/);
  assert.equal(await page.locator('#cutout').isHidden(),true);
  assert.deepEqual(errors,[]);
  assert.deepEqual(external,[]);
  await mkdir('benchmark/three-d-02',{recursive:true});
  // Re-select shirt with cutout so screenshot is meaningful and labelled HOLD.
  await page.locator('#sample').selectOption('commons-0003');
  await page.waitForFunction(()=>document.querySelector('#viewer')?.dataset.type==='shirt'&&
   document.querySelector('#status')?.textContent.includes('template ready'));
  await page.locator('#review').check();await page.locator('#apply').click();
  await page.waitForFunction(()=>document.querySelector('#viewer')?.dataset.cutoutReady==='true',
   null,{timeout:30000});
  await page.screenshot({path:'benchmark/three-d-02/chromium-'+width+'-source-bound-cutout-HOLD.png',fullPage:true});
  console.log('THREE_D_02_REAL_CUTOUT_BROWSER',JSON.stringify({
   width,engine:'Chromium',shader:'real WebGL2',cutout:'actual pinned Work47 PNG',
   displayedLicensedSources:2,shirtProjected:true,dressProjected:true,
   pants:'FALLBACK',release:'HOLD',externalRequests:external.length
  }));
  await context.close();
 }
}finally{await browser?.close();server.close();}
