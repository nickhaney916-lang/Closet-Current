/**
 * Browser rehearsal of SYNTHETIC demo only; never connects to Supabase,
 * accesses wardrobe customers, launches paid inference, or deploys.
 */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const root=resolve('public');
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const path=resolve(root,'.'+decodeURIComponent(pathname));
  if(!path.startsWith(root+sep))throw Error('No traversal');
  const bytes=await readFile(path);
  res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream',
   'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src data:; connect-src 'none'; frame-ancestors 'none'",
   'Cache-Control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('missing');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port+'/humanoid-3d-saved-demo.html';
const output=[];
try{
 for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(name==='Chromium'?{args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader']}:{})});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const errors=[],external=[];
    await context.route('**/*',route=>{
     if(!route.request().url().startsWith('http://127.0.0.1:')){
      external.push(route.request().url());return route.abort('blockedbyclient');
     }
     return route.continue();
    });
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base);
    await page.locator('#lookSelect option').first().waitFor({state:'attached'});
    assert.equal(await page.locator('#lookSelect option').count(),3);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    const first=await page.evaluate(()=>({
     supported:__humanoidLab.renderer.supported,
     options:__humanoidLab.recommendations.length,
     original:__humanoidLab.wardrobe[0].originalPhoto.image,
     displayed:document.querySelector('#references img')?.src,
     geometry:__humanoidLab.renderer.getState().drawn
    }));
    assert.equal(first.displayed,first.original);
    if(first.supported){
     assert.ok(first.geometry.includes('head')&&first.geometry.includes('torso'));
     const initial=await page.evaluate(()=>__humanoidLab.renderer.angle());
     await page.locator('#turnRight').tap();
     const turned=await page.evaluate(()=>__humanoidLab.renderer.angle());
     assert.notEqual(turned,initial);
     await page.locator('#front').tap();
     assert.ok(Math.abs(await page.evaluate(()=>__humanoidLab.renderer.angle()))<.001);
     await page.locator('#angle').fill('180');
     assert.ok(Math.abs((await page.evaluate(()=>__humanoidLab.renderer.angle()))-Math.PI)<.01);
    }else assert.equal(await page.locator('#fallback').isVisible(),true);
    await page.locator('#styleNew').tap();
    const pin=await page.evaluate(()=>({pinned:__humanoidLab.pinned,looks:__humanoidLab.recommendations.map(x=>x.slots.top)}));
    assert.equal(pin.looks.length,3);assert.ok(pin.looks.every(x=>x===pin.pinned));
    await page.locator('#swapSlot').selectOption('shoes');
    await page.locator('#swapItem').selectOption('synthetic-wardrobe-a-boots');
    await page.locator('#swap').tap();
    assert.equal(await page.evaluate(()=>__humanoidLab.current.slots.shoes),'synthetic-wardrobe-a-boots');
    await page.locator('#pinSlot').selectOption('top');
    await page.locator('#pin').tap();
    await page.locator('#save').tap();
    await page.reload();
    await page.locator('#restore').tap();
    assert.equal(await page.evaluate(()=>__humanoidLab.current.slots.top),'synthetic-wardrobe-a-new-top');
    const snapshot=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('closet-humanoid-synthetic-snapshot-synthetic-wardrobe-a')));
    assert.ok(!JSON.stringify(snapshot).includes('data:image'));
    await page.locator('#switchAccount').tap();
    assert.equal(await page.evaluate(()=>__humanoidLab.accountId),'synthetic-wardrobe-b');
    await page.locator('#restore').tap();
    assert.match(await page.locator('#status').textContent(),/No saved synthetic outfit/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    output.push({engine:name,width,syntheticOnly:true,outfits:3,sourcePixelsUnchanged:true,
     ownedPinSwapSaveRestore:true,crossAccountRestoreDenied:true,
     pageErrors:0,externalRequests:0,webgl:first.supported,physicalPhoneTested:false,fitVerified:false});
    await context.close();
   }
  }finally{await browser.close();}
 }
 console.log('HUMANOID_3D_OFFLINE_BROWSER '+JSON.stringify(output));
}finally{await new Promise(done=>server.close(done));}
