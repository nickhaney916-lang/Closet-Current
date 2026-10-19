// Purely simulated Android Chromium / iPhone WebKit UI checks on the local app.
// Neither engine is physical hardware; no user identity or image leaves the host.
import {chromium,webkit,devices} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),mime={'.html':'text/html','.js':'text/javascript',
 '.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost');
  const path=resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));
  if(!path.startsWith(root+'/'))throw Error('Not under dist');
  const buf=await readFile(path);
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});res.end(buf);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port+'/';
const results=[];
try{
 for(const [title,browserEngine,contextOptions] of [
  ['Android Chromium emulation',chromium,{viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    userAgent:'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36'}],
  ['iPhone WebKit emulation',webkit,devices['iPhone 13']]
 ]){
  const browser=await browserEngine.launch({headless:true,...(browserEngine===chromium?{args:['--no-sandbox']}: {})});
  try{
   const ctx=await browser.newContext({...contextOptions,serviceWorkers:'block'});
   const remoteWrites=[],errors=[];
   await ctx.route('**/auth.js*',r=>r.fulfill({contentType:'text/javascript',
    body:"window.closetAuth={user:{id:'synthetic-local-figure'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
   await ctx.route('**/*',r=>{
    const req=r.request(),target=req.url();
    if(req.method()!=='GET'&&req.method()!=='HEAD'&&!target.startsWith('http://127.0.0.1:')){
     remoteWrites.push(req.method());return r.abort('blockedbyclient');
    }
    return r.fallback();
   });
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url);
   await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
   await page.evaluate(()=>switchView('builder'));
   assert.equal(await page.locator('#reusableFigureChoice option').count(),2);
   assert.equal(await page.locator('.ai-tryon-panel').isVisible(),false);
   assert.equal(await page.locator('#tryOnGenerate').isDisabled(),true);
   await page.evaluate(()=>{
    function fakeGarment(color){
     const c=document.createElement('canvas');c.width=100;c.height=150;
     const x=c.getContext('2d');x.clearRect(0,0,100,150);
     x.fillStyle=color;x.fillRect(20,15,60,118);
     return c.toDataURL('image/png');
    }
    items.push({id:'test-shirt',category:'Tops',itemType:'T-shirt',color:'Blue',
      image:fakeGarment('#214fc7'),name:'Test owned shirt'});
    items.push({id:'test-trousers',category:'Bottoms',itemType:'Jeans',color:'Black',
      image:fakeGarment('#182233'),name:'Test owned trousers'});
    currentBoard.slots.top='test-shirt';
    currentBoard.slots.bottom='test-trousers';
    renderOutfitBoard();
   });
   await page.waitForFunction(()=>document.querySelectorAll('#reusableFigureGarments img').length===2);
   assert.match(await page.locator('#reusableFigureStatus').innerText(),/2 owned clothing layers? displayed/);
   await page.locator('#reusableFigureChoice').selectOption('male');
   assert.match(await page.locator('#reusableFigureBase').getAttribute('src'),/male-preview\.webp/);
   // Simulated optional local-only selfie: never persisted, never sent.
   const redPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jq0kAAAAASUVORK5CYII=','base64');
   await page.locator('#reusableSelfieUpload').setInputFiles({
    name:'local-selfie.png',mimeType:'image/png',buffer:redPng
   });
   await page.locator('#reusableFigureSelfie:not([hidden])').waitFor();
   assert.match(await page.locator('#reusableFigureSelfie').getAttribute('src'),/^blob:/);
   await page.locator('#reusableSelfieRemove').click();
   assert.equal(await page.locator('#reusableFigureSelfie').getAttribute('src'),null);
   assert.equal(await page.locator('#reusableFigureSelfie').isVisible(),false);
   assert.deepEqual(remoteWrites,[]);
   assert.deepEqual(errors,[]);
   results.push({engine:title,ownedLayers:2,reusedFigures:2,optionalSelfieLocalOnly:true,
    remotePostCount:remoteWrites.length,realPhoneHardwareTested:false});
   await ctx.close();
  }finally{await browser.close();}
 }
 console.log('REUSABLE_FIGURE_PHONE_EMULATION '+JSON.stringify(results));
}finally{await new Promise(done=>server.close(done));}
