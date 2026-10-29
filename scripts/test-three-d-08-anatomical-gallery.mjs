/** Browser smoke for the honest, local-only visual inspection gallery. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('.');
const srv=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1'),p=decodeURIComponent(url.pathname);
  if(!/^\/(?:research\/three-d-08-anatomical-qa\/|benchmark\/)/.test(p)||
   p.includes('\\')||p.includes('\0'))throw Error('Unsafe path');
  const filepath=resolve(root,'.'+p);
  if(!filepath.startsWith(root+'/'))throw Error('Escaped repository');
  const data=await readFile(filepath);
  res.writeHead(200,{'content-type':{
   '.html':'text/html','.json':'application/json',
   '.png':'image/png','.jpg':'image/jpeg'
  }[extname(filepath)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>srv.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+srv.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [320,390,430]){
  const ctx=await browser.newContext({viewport:{width,height:844},acceptDownloads:true});
  const page=await ctx.newPage(),errors=[],outside=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:'+origin)&&!r.url().startsWith('data:'))outside.push(r.url());});
  await page.goto(origin+'/research/three-d-08-anatomical-qa/gallery.html');
  const all=async()=>page.evaluate(async()=>{
   const images=[...document.images];
   await Promise.all(images.map(img=>img.decode().catch(()=>null)));
   return images.map(img=>({natural:img.naturalWidth,complete:img.complete,src:img.currentSrc}));
  });
  let state=await all();
  assert.equal(state.length,4);
  assert.ok(state.every(x=>x.complete&&x.natural>100),JSON.stringify(state));
  assert.equal(await page.locator('#before').getAttribute('src'),
   '../../benchmark/three-d-11/before-female-430-relaxed-front-HOLD.png');
  await page.locator('#model').selectOption('male');
  await page.locator('#width').selectOption('320');
  await page.locator('#pose').selectOption('source');
  await page.locator('#view').selectOption('threequarter');
  state=await all();assert.ok(state.every(x=>x.complete&&x.natural>100));
  assert.ok((await page.locator('#after').getAttribute('src')).includes(
   'after-male-320-source-threequarter-HOLD.png'));
  await page.locator('#grade-cuffs').selectOption('FAIL');
  await page.locator('#notes').fill('Visible thin inner cuff sliver and hand boundary at three-quarter view.');
  await page.locator('#notes').dispatchEvent('change');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
  assert.ok(download.suggestedFilename().endsWith('HOLD.json'));
  const json=JSON.parse(await readFile(await download.path(),'utf8'));
  assert.equal(json.status,'HOLD');assert.equal(json.ownerApproved,false);
  assert.equal(json.reviews['male/320/source/threequarter'].cuffs,'FAIL');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
  console.log('ANATOMICAL_GALLERY_PASS',JSON.stringify({width,male320ReviewExported:true,sourceImages:2,gpuFrames:2,release:'HOLD'}));
  await ctx.close();
 }
}finally{await browser?.close();srv.close();}
