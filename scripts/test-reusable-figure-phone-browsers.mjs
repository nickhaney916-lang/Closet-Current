// Purely simulated Android Chromium / iPhone WebKit UI checks on the local app.
// Neither engine is physical hardware; no user identity or image leaves the host.
import {chromium,webkit,devices} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
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
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const licensed=[];
for(const [id,category,color,expectedLayers] of [
 ['commons-0053','Dresses','Black',0],['commons-0002','Tops','Red',0],['commons-0003','Tops','Black',0]
]){
 const source=sources.find(x=>x.id===id),bytes=await readFile('benchmark/fixtures/'+source.image);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);
 licensed.push({id,category,color,expectedLayers,image:'data:image/jpeg;base64,'+bytes.toString('base64'),
  attribution:source.attribution,sha256:source.sha256});
}
const results=[];
await mkdir('artifacts/local-fitting',{recursive:true});
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
   const warpedState=await page.evaluate(()=>({
    output:[...document.querySelectorAll('#reusableFigureGarments img')].map(x=>x.src),
    original:[items.find(x=>x.id==='test-trousers').image,
      items.find(x=>x.id==='test-shirt').image],
    geometry:ClosetGarmentWarp.makeMesh(100,150,'Tops')?.triangles.length
   }));
   assert.equal(warpedState.geometry,32);
   const alphaProbe=await page.evaluate(()=>{
    const data=new Uint8ClampedArray(80*100*4);
    for(let i=0;i<80*100;i++)data.set([190,50,20,128],i*4);
    const output=ClosetGarmentWarp.rasterize(data,ClosetGarmentWarp.makeMesh(80,100,'Tops'));
    let defects=0;
    for(let y=0;y<100;y++)for(let x=10;x<70;x++){
     const i=(y*80+x)*4;
     if(output[i]!==190||output[i+1]!==50||output[i+2]!==20||output[i+3]!==128)defects++;
    }
    return defects;
   });
   assert.equal(alphaProbe,0,'no triangle cracks, doubled alpha or dark interpolation halos');
   assert.equal(warpedState.output.length,2);
   for(let i=0;i<2;i++){
    assert.match(warpedState.output[i],/^data:image\/png;base64,/);
    assert.notEqual(warpedState.output[i],warpedState.original[i],
      'local fitting should create a display-only transformed copy');
   }
   await page.locator('#reusableFigureChoice').selectOption('male');
   assert.match(await page.locator('#reusableFigureBase').getAttribute('src'),/male-preview\.webp/);
   // Simulated optional local-only selfie: never persisted, never sent.
   const redPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jq0kAAAAASUVORK5CYII=','base64');
   await page.locator('#reusableSelfieUpload').setInputFiles({
    name:'local-selfie.png',mimeType:'image/png',buffer:redPng
   });
   await page.locator('#reusableFigureSelfie:not([hidden])').waitFor();
   assert.match(await page.locator('#reusableFigureSelfie').getAttribute('src'),/^blob:/);
   const before=await page.locator('#reusableFigureSelfie').getAttribute('style');
   for(const [id,value] of [['#reusableSelfieX','5'],['#reusableSelfieZoom','25']])
    await page.locator(id).evaluate((input,value)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));},value);
   assert.notEqual(await page.locator('#reusableFigureSelfie').getAttribute('style'),before);
   await page.locator('#reusableSelfieRemove').click();
   assert.equal(await page.locator('#reusableFigureSelfie').getAttribute('src'),null);
   assert.equal(await page.locator('#reusableFigureSelfie').isVisible(),false);
   assert.equal(await page.locator('#reusableSelfiePosition').isVisible(),false);
   const photoResults=[];
   for(const fixture of licensed){
    await page.evaluate(f=>{
     items.push({id:f.id,category:f.category,itemType:f.category==='Dresses'?'Dress':'T-shirt',
      color:f.color,image:f.image});
     currentBoard.slots={top:f.id};renderOutfitBoard();
    },fixture);
    await page.waitForFunction(expected=>{
     const status=document.querySelector('#reusableFigureStatus').textContent;
     return status.startsWith(expected+' owned clothing layer')&&
      document.querySelectorAll('#reusableFigureGarments img').length===expected;
    },fixture.expectedLayers);
    const state=await page.evaluate(async id=>{
     const layers=[...document.querySelectorAll('#reusableFigureGarments img')];
     await Promise.all(layers.map(x=>x.decode()));
     return {source:items.find(x=>x.id===id).image,layers:layers.length};
    },fixture.id);
    assert.equal(state.source,fixture.image,'saved original must remain byte-identical');
    photoResults.push({id:fixture.id,sha256:fixture.sha256,attribution:fixture.attribution,
     displayedLayers:state.layers,automaticCutoutAccepted:state.layers>0,
     fabricFidelityScored:false});
    await page.locator('#reusableFigureStage').screenshot({path:'artifacts/local-fitting/'+
     (browserEngine===chromium?'android':'iphone')+'-'+fixture.id+'.png'});
   }
   assert.deepEqual(remoteWrites,[]);
   assert.deepEqual(errors,[]);
   results.push({engine:title,ownedLayers:2,reusedFigures:2,optionalSelfieLocalOnly:true,
    remotePostCount:remoteWrites.length,licensedPhotoChecks:photoResults,realPhoneHardwareTested:false});
   await ctx.close();
  }finally{await browser.close();}
 }
 await writeFile('artifacts/local-fitting/results.json',JSON.stringify(results,null,2));
 console.log('REUSABLE_FIGURE_PHONE_EMULATION '+JSON.stringify(results));
}finally{await new Promise(done=>server.close(done));}
