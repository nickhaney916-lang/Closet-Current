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
const extractionCases=JSON.parse(await readFile('benchmark/local-fitting-real-photo-manifest.json','utf8')).cases;
const extractionWitnesses=JSON.parse(await readFile('benchmark/dark-studio-source-witnesses.json','utf8'));
const extractionInputs=[];
for(const row of extractionCases){
 const bytes=await readFile('benchmark/fixtures/'+row.image);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sourceSha256);
 extractionInputs.push({...row,image:'data:image/jpeg;base64,'+bytes.toString('base64')});
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
   assert.equal(await page.locator('#reusableFigurePhotoHelp').isVisible(),false,
    'clean local cutouts should not show retake guidance');
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
   // Pure browser-side finishing probe on trusted synthetic transparent
   // clothing pixels. Verify subtle alpha antialias only, not fit realism.
   const finishedEdges=await page.evaluate(()=>{
    const w=100,h=150,src=new Uint8ClampedArray(w*h*4);
    for(let y=12;y<138;y++)for(let x=15;x<85;x++)
     src.set([40,70,160,255],(y*w+x)*4);
    for(let y=40;y<75;y++)for(let x=40;x<60;x++)
     src.set([225,170,25,255],(y*w+x)*4);
    const original=new Uint8ClampedArray(src);
    const quality=ClosetGarmentEdgeFinish.finish(src,w,h);
    let rgbDiff=0,removed=0,increased=0,sourceDiff=0,centerDiff=0;
    for(let i=0;i<src.length;i++){
     if(src[i]!==original[i])sourceDiff++;
     if(i%4===3){
      if(quality.pixels[i]<src[i])removed++;
      if(quality.pixels[i]>src[i])increased++;
     }else if(quality.pixels[i]!==src[i])rgbDiff++;
    }
    for(let y=40;y<75;y++)for(let x=40;x<60;x++){
     const k=(y*w+x)*4;
     for(let c=0;c<4;c++)if(quality.pixels[k+c]!==src[k+c])centerDiff++;
    }
    const preSoft=new Uint8ClampedArray(src);
    preSoft[(15*w+15)*4+3]=128;
    const existing=ClosetGarmentEdgeFinish.finish(preSoft,w,h);
    return {eligible:quality.eligible,softened:quality.softenedEdgePixels,
     rgbDiff,removed,increased,sourceDiff,centerDiff,loss:quality.alphaMassLossFraction,
     existingSoftPreserved:!existing.eligible&&existing.reason==='existing-soft-alpha-preserved'};
   });
   assert.equal(finishedEdges.eligible,true);
   assert.ok(finishedEdges.softened>=8&&finishedEdges.loss<=.01);
   assert.equal(finishedEdges.softened,finishedEdges.removed);
   assert.equal(finishedEdges.rgbDiff,0);assert.equal(finishedEdges.increased,0);
   assert.equal(finishedEdges.sourceDiff,0);assert.equal(finishedEdges.centerDiff,0);
   assert.equal(finishedEdges.existingSoftPreserved,true);

   const warpFidelity=await page.evaluate(()=>{
    const w=100,h=150,source=new Uint8ClampedArray(w*h*4);
    for(let y=12;y<138;y++)for(let x=12;x<88;x++)
     source.set([46,70,185,255],(y*w+x)*4);
    for(let y=45;y<75;y++)for(let x=42;x<58;x++)
     source.set([235,165,50,255],(y*w+x)*4);
    const original=new Uint8ClampedArray(source);
    const valid=ClosetGarmentWarp.rasterize(source,ClosetGarmentWarp.makeMesh(w,h,'Tops'));
    const good=ClosetGarmentWarp.validateWarp(source,valid,w,h);
    const damaged=new Uint8ClampedArray(valid);
    for(let y=45;y<75;y++)for(let x=42;x<58;x++)
     damaged.set([50,230,80,255],(y*w+x)*4);
    const bad=ClosetGarmentWarp.validateWarp(source,damaged,w,h);
    let unchanged=0;for(let i=0;i<source.length;i++)if(source[i]===original[i])unchanged++;
    return {good:good.accepted,bad:bad.accepted,reason:bad.reason,
     unchanged,bytes:source.length,realismVerified:good.fabricFitOrRealismVerified};
   });
   assert.equal(warpFidelity.good,true,'normal local mesh remains available');
   assert.equal(warpFidelity.bad,false,'damaged central prints must not pass for display');
   assert.equal(warpFidelity.reason,'central-texture-or-seam-corrupted');
   assert.equal(warpFidelity.unchanged,warpFidelity.bytes,'input pixels remain untouched');
   assert.equal(warpFidelity.realismVerified,false,'synthetic guard is not realism proof');

   assert.equal(warpedState.output.length,2);
   const proportions=await page.evaluate(async()=>{
    const images=[...document.querySelectorAll('#reusableFigureGarments img')];
    return Promise.all(images.map(async img=>{
     await img.decode();
     const bounds=document.getElementById('reusableFigureStage').getBoundingClientRect();
     return {naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,
      width:Number.parseFloat(img.style.width),height:Number.parseFloat(img.style.height),
      left:Number.parseFloat(img.style.left),top:Number.parseFloat(img.style.top),
      stageAspect:bounds.width/bounds.height};
    }));
   });
   assert.equal(proportions.length,2);
   for(const [i,p] of proportions.entries()){
    assert.ok(p.naturalWidth<100&&p.naturalHeight<150,
     'transparent white margins should be trimmed without source changes');
    assert.ok(Math.abs((p.width/p.height)*p.stageAspect-p.naturalWidth/p.naturalHeight)<.01,
     'owned garment '+i+' retains original cropped aspect ratio');
   }

   // The same 2 owned garments should recompose from bounded private memory
   // without repeating image reads/matting/mesh rasterization each time.
   const cached=await page.evaluate(()=>{
    const original=CanvasRenderingContext2D.prototype.getImageData;
    let calls=0;
    CanvasRenderingContext2D.prototype.getImageData=function(...args){
     calls++;return original.apply(this,args);
    };
    try{renderReusableFigurePreview();return calls;}
    finally{CanvasRenderingContext2D.prototype.getImageData=original;}
   });
   assert.equal(cached,0,'repeat outfit uses private cached display copies');
   const reused=await page.evaluate(async()=>{
    const target=document.getElementById('reusableFigureGarments');
    const before=[...target.children];let mutations=0;
    const watch=new MutationObserver(rows=>mutations+=rows.length);
    watch.observe(target,{childList:true});
    for(let i=0;i<8;i++)renderReusableFigurePreview();
    await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    watch.disconnect();
    return {mutations,same:before.every((n,i)=>target.children[i]===n),
     busy:document.getElementById('reusableFigureStage').getAttribute('aria-busy')};
   });
   assert.deepEqual(reused,{mutations:0,same:true,busy:'false'},
    'unchanged outfit keeps sharp decoded layers without blanking or rebuilding DOM');
   // Explicit stale async decoding race: a partially decoded old shirt must
   // never appear after the user has already selected a newer outfit.
   await page.evaluate(()=>{
    const canvas=document.createElement('canvas');
    canvas.width=100;canvas.height=150;
    const x=canvas.getContext('2d');
    x.fillStyle='#d62436';x.fillRect(18,13,65,125);
    const oldImage=canvas.toDataURL('image/png');
    items.push({id:'slow-stale-shirt',category:'Tops',itemType:'T-shirt',
     color:'Red',image:oldImage});
    const original=Image.prototype.decode;
    let release;
    const gate=new Promise(ok=>release=ok);
    window.__releaseStaleDecode=release;
    Image.prototype.decode=function(){
     if(this.src===oldImage)return gate.then(()=>original.call(this));
     return original.call(this);
    };
    window.__restoreDecode=()=>{Image.prototype.decode=original;};
    currentBoard.slots.top='slow-stale-shirt';
    renderOutfitBoard();
   });
   await page.waitForFunction(()=>document.querySelector('#reusableFigureStatus')
    .textContent.includes('Preparing local clothing preview'));
   assert.equal(await page.locator('#reusableFigureGarments img').count(),0,
    'old garment is cleared before processing an updated outfit');
   await page.evaluate(()=>{currentBoard.slots.top='test-shirt';renderOutfitBoard();});
   await page.waitForFunction(()=>document.querySelectorAll('#reusableFigureGarments img').length===2&&
    document.querySelector('#reusableFigureStatus').textContent.startsWith('2 owned clothing layers'));
   const settledNew=await page.locator('#reusableFigureGarments img').evaluateAll(nodes=>nodes.map(n=>n.src));
   await page.evaluate(()=>{window.__releaseStaleDecode();window.__restoreDecode();});
   await page.waitForTimeout(80);
   assert.deepEqual(await page.locator('#reusableFigureGarments img').evaluateAll(nodes=>nodes.map(n=>n.src)),
    settledNew,'late old decoded garment must not overwrite newer outfit');
   assert.equal(proportions[0].top,44,'female jeans align with waist anchor');
   assert.equal(proportions[1].top,19,'female shirt aligns with shoulder anchor');
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
   // Richer but deliberately SYNTHETIC composition evidence. Real-photo
   // fidelity is separately blocked by the licensed HOLD fixtures below.
   await page.evaluate(()=>{
    const garment=(draw)=>{
     const c=document.createElement('canvas');c.width=100;c.height=150;
     const g=c.getContext('2d');draw(g);
     return c.toDataURL('image/png');
    };
    items.push({id:'test-open-jacket',category:'Outerwear',itemType:'Jacket',color:'Green',
     image:garment(g=>{g.fillStyle='#205e39';g.fillRect(8,5,28,132);
      g.fillRect(64,5,28,132);}),name:'Synthetic open jacket'});
    items.push({id:'test-shoes',category:'Shoes',itemType:'Sneakers',color:'White',
     image:garment(g=>{g.fillStyle='#c0cad5';g.fillRect(12,102,32,28);
      g.fillRect(56,102,32,28);}),name:'Synthetic shoes'});
    items.push({id:'test-dress',category:'Dresses',itemType:'Dress',color:'Purple',
     image:garment(g=>{g.fillStyle='#77339b';g.fillRect(24,12,52,126);}),
     name:'Synthetic dress'});
   });
   const layeredResults=[];
   for(const figure of ['female','male']){
    await page.locator('#reusableFigureChoice').selectOption(figure);
    await page.evaluate(()=>{
     currentBoard.slots={bottom:'test-trousers',top:'test-shirt',
      layer2:'test-open-jacket',shoes:'test-shoes'};
     currentBoard.layerCount=2;renderOutfitBoard();
    });
    await page.waitForFunction(()=>document.querySelectorAll('#reusableFigureGarments img').length===4&&
     document.querySelector('#reusableFigureStatus').textContent.startsWith('4 owned clothing layers'));
    const layered=await page.evaluate(async()=>{
     const plan=ClosetReusableFigure.plan(currentBoard,items,
      document.getElementById('reusableFigureChoice').value);
     const images=[...document.querySelectorAll('#reusableFigureGarments img')];
     await Promise.all(images.map(i=>i.decode()));
     const coat=images[2];
     const c=document.createElement('canvas');c.width=coat.naturalWidth;c.height=coat.naturalHeight;
     const context=c.getContext('2d');context.drawImage(coat,0,0);
     const alpha=context.getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data[3];
     return {order:plan.placements.map(p=>p.slot),count:images.length,
      coatCenterAlpha:alpha,
      contourShadow:getComputedStyle(coat).filter,
      jacketOnly:coat.classList.contains('reusable-figure-layer--contact-depth'),
      shirtNotShadowed:!images[1].classList.contains('reusable-figure-layer--contact-depth'),
      shoesNotShadowed:!images[3].classList.contains('reusable-figure-layer--contact-depth'),
      brokenImages:images.filter(i=>!i.naturalWidth||!i.naturalHeight).length};
    });
    assert.deepEqual(layered.order,['bottom','top','layer2','shoes']);
    assert.equal(layered.count,4);
    assert.equal(layered.brokenImages,0);
    assert.equal(layered.coatCenterAlpha,0,
     'the open jacket must not hide the underlying shirt in the center');
    assert.equal(layered.jacketOnly,true,'only a successful outerwear layer receives depth');
    assert.equal(layered.shirtNotShadowed,true);
    assert.equal(layered.shoesNotShadowed,true);
    assert.match(layered.contourShadow,/drop-shadow\(/,'shadow must follow transparent jacket pixels');
    await page.locator('#reusableFigureStage').screenshot({path:'artifacts/local-fitting/'+
     (figure==='female'?'female':'male')+'-synthetic-four-layer.png'});
    await page.evaluate(()=>{
     currentBoard.slots={top:'test-dress',bottom:'test-trousers',
      layer2:'test-open-jacket',shoes:'test-shoes'};
     currentBoard.layerCount=2;renderOutfitBoard();
    });
    await page.waitForFunction(()=>document.querySelectorAll('#reusableFigureGarments img').length===2&&
     document.querySelector('#reusableFigureStatus').textContent.startsWith('2 owned clothing layers'));
    const dress=await page.evaluate(()=>({
     plan:ClosetReusableFigure.plan(currentBoard,items,
      document.getElementById('reusableFigureChoice').value).placements.map(p=>p.slot),
     slots:Object.keys(currentBoard.slots),count:document.querySelectorAll('#reusableFigureGarments img').length
    }));
    assert.deepEqual(dress.plan,['top','shoes']);
    assert.equal(dress.count,2);
    assert.ok(!dress.slots.includes('bottom')&&!dress.slots.includes('layer2'));
    assert.equal(await page.locator('#reusableFigureGarments img.reusable-figure-layer--contact-depth').count(),0,
     'a dress with shoes must not receive fake outerwear depth');
    await page.locator('#reusableFigureStage').screenshot({path:'artifacts/local-fitting/'+
     (figure==='female'?'female':'male')+'-synthetic-dress.png'});
    layeredResults.push({figure,layeredGarments:layered.count,dressGarments:dress.count,
     transparentOpenJacketCenter:true,actualRealPhotoFidelityMeasured:false});
   }
   // Local compositing diagnostic sees garment-on-garment overlap; no
   // anatomy guesses, paid inference, retained source edits or uploads.
   const visibilityProbe=await page.evaluate(()=>{
    const w=100,h=100,shirt=new Uint8ClampedArray(w*h),
     coat=new Uint8ClampedArray(w*h),open=new Uint8ClampedArray(w*h);
    for(let y=20;y<80;y++)for(let x=25;x<75;x++)shirt[y*w+x]=255;
    coat.fill(255);
    for(let y=0;y<85;y++)for(let x=0;x<20;x++)open[y*w+x]=255;
    for(let y=0;y<85;y++)for(let x=80;x<100;x++)open[y*w+x]=255;
    const before=new Uint8ClampedArray(shirt);
    const hidden=ClosetLayerVisibility.auditAlphaMasks([shirt,coat],w,h);
    const visible=ClosetLayerVisibility.auditAlphaMasks([shirt,open],w,h);
    return {hidden:hidden[0].mostlyConcealed,
     openVisible:visible[0].visibleFraction,
     unchanged:shirt.every((v,i)=>v===before[i]),
     noBodyGuess:hidden[0].bodyOcclusionMeasured===false};
   });
   assert.equal(visibilityProbe.hidden,true);
   assert.equal(visibilityProbe.openVisible,1);
   assert.equal(visibilityProbe.unchanged,true);
   assert.equal(visibilityProbe.noBodyGuess,true);

   // A solid synthetic coat is allowed to conceal a selected shirt, but
   // the UI must explain that visibly, not silently count it as shown.
   await page.evaluate(()=>{
    const canvas=document.createElement('canvas');
    canvas.width=100;canvas.height=150;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#344e53';ctx.fillRect(6,5,88,140);
    items.push({id:'test-solid-coat',category:'Outerwear',itemType:'Jacket',
     color:'Dark Green',image:canvas.toDataURL('image/png')});
    currentBoard.slots={top:'test-shirt',layer2:'test-solid-coat'};
    currentBoard.layerCount=2;renderOutfitBoard();
   });
   await page.waitForFunction(()=>document.querySelectorAll('#reusableFigureGarments img').length===2&&
    document.querySelector('#reusableFigureStatus').textContent.startsWith('2 owned clothing layers displayed'));
   const layersReport=await page.evaluate(()=>{
    const status=document.querySelector('#reusableFigureStatus').textContent;
    const imgs=[...document.querySelectorAll('#reusableFigureGarments img')];
    return {status,source:items.find(x=>x.id==='test-shirt').image,
     garments:imgs.map(i=>i.dataset.slot)};
   });
   assert.deepEqual(layersReport.garments,['top','layer2']);
   assert.match(layersReport.status,/mostly hidden behind other clothing/,
    'fully covered shirt remains in the closet but receives accurate visibility feedback');
   await page.evaluate(()=>{
    currentBoard.slots={top:'test-shirt'};currentBoard.layerCount=0;
    renderOutfitBoard();
   });
   await page.waitForFunction(()=>document.querySelector('#reusableFigureStatus')
    .textContent.startsWith('1 owned clothing layer displayed'));
   assert.doesNotMatch(await page.locator('#reusableFigureStatus').innerText(),/mostly hidden/,
    'single visible shirt should not retain previous warning');
   // New display-only silhouette centerline uses the approved transparent
   // pixels instead of stretching or hallucinating asymmetric sleeves.
   await page.evaluate(()=>{
    const c=document.createElement('canvas');c.width=100;c.height=150;
    const g=c.getContext('2d');g.fillStyle='#3174ac';
    g.fillRect(10,10,62,65);g.fillRect(8,75,84,63);
    items.push({id:'test-asymmetric-sleeves',category:'Tops',itemType:'T-shirt',
     color:'Blue',name:'Synthetic asymmetric silhouette',image:c.toDataURL('image/png')});
   });
   const silhouetteResults=[];
   for(const figure of ['female','male']){
    await page.locator('#reusableFigureChoice').selectOption(figure);
    await page.evaluate(()=>{
     currentBoard.slots={top:'test-asymmetric-sleeves'};currentBoard.layerCount=0;
     renderOutfitBoard();
    });
    await page.waitForFunction(()=>document.querySelector('#reusableFigureStatus')
     .textContent.startsWith('1 owned clothing layer displayed')&&
     document.querySelectorAll('#reusableFigureGarments img').length===1);
    const offset=await page.evaluate(()=>{
     const img=document.querySelector('#reusableFigureGarments img');
     const figure=document.getElementById('reusableFigureChoice').value;
     const calibrated=ClosetReusableFigure.placementRect('top',{category:'Tops'},figure);
     const old=ClosetGarmentFitGeometry.fitPlacement(calibrated,img.naturalWidth,img.naturalHeight,
      {slot:'top',category:'Tops'});
     return {offset:parseFloat(img.style.left)-old.left,
      top:parseFloat(img.style.top),expectedTop:calibrated.top,
      width:parseFloat(img.style.width),oldWidth:old.width};
    });
    assert.ok(offset.offset>0&&offset.offset<3.5,
     'approved upper silhouette is conservatively recentered for '+figure);
    assert.equal(offset.top,offset.expectedTop);
    assert.ok(Math.abs(offset.width-offset.oldWidth)<.005,
     'browser-rounded CSS percentages retain the same fitting scale');
    silhouetteResults.push({figure,correctionPercent:offset.offset,sourceUnchanged:true});
   }
   // A corrupted/display-uncodable transparent garment is held rather than
   // counting it as a complete outfit or displaying an image placeholder.
   await page.evaluate(()=>{
    const c=document.createElement('canvas');c.width=100;c.height=150;
    const g=c.getContext('2d');g.fillStyle='#b05811';g.fillRect(20,12,60,125);
    items.push({id:'test-broken-display',category:'Tops',itemType:'T-shirt',
      color:'Orange',name:'Synthetic decode failure',image:c.toDataURL('image/png')});
    const original=HTMLImageElement.prototype.decode;
    window.__restoreDisplayDecode=()=>{HTMLImageElement.prototype.decode=original;};
    window.__displayFailureCount=0;
    HTMLImageElement.prototype.decode=function(){
     if(this.classList.contains('reusable-figure-layer')&&window.__displayFailureCount===0){
      window.__displayFailureCount++;return Promise.reject(Error('Synthetic display decode refusal'));
     }
     return original.call(this);
    };
    currentBoard.slots={top:'test-broken-display'};currentBoard.layerCount=0;
    renderOutfitBoard();
   });
   await page.waitForFunction(()=>document.querySelector('#reusableFigureStatus').textContent
    .startsWith('0 owned clothing layers displayed; 1 held'));
   assert.equal(await page.locator('#reusableFigureGarments img').count(),0,
    'uncodable displayed layer must never be published');
   assert.equal(await page.locator('#reusableFigureRetry').isVisible(),true);
   await page.evaluate(()=>window.__restoreDisplayDecode());
   await page.locator('#reusableFigureRetry').click();
   await page.waitForFunction(()=>document.querySelector('#reusableFigureStatus').textContent
    .startsWith('1 owned clothing layer displayed'));
   assert.equal(await page.locator('#reusableFigureGarments img').count(),1,
    'the valid garment can recover after a transient display decode failure');
   assert.equal(await page.locator('#reusableFigureRetry').isVisible(),false);
   assert.equal(await page.locator('#reusableFigureStage').getAttribute('aria-busy'),'false');
   // A base-model load refusal must be visible and retryable, never an
   // old model wearing a newly selected outfit. Only synthetic decoder fault.
   await page.evaluate(()=>{
    const original=HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode=function(){
     if(this.id==='reusableFigureBase')return Promise.reject(Error('Synthetic base load failure'));
     return original.call(this);
    };
    window.__restoreBaseDecode=()=>HTMLImageElement.prototype.decode=original;
    const choice=document.getElementById('reusableFigureChoice');
    choice.value=choice.value==='male'?'female':'male';
    document.getElementById('reusableFigureChoice').dispatchEvent(new Event('change'));
   });
   await page.waitForFunction(()=>document.getElementById('reusableFigureStatus').textContent.startsWith('Preview unavailable.'));
   assert.equal(await page.locator('#reusableFigureGarments img').count(),0);
   assert.equal(await page.locator('#reusableFigureStage').getAttribute('aria-busy'),'false');
   await page.evaluate(()=>window.__restoreBaseDecode());
   await page.locator('#reusableFigureRetry').click();
   await page.waitForFunction(()=>document.getElementById('reusableFigureStatus').textContent.startsWith('1 owned clothing layer displayed'));
   assert.equal(await page.locator('#reusableFigureRetry').isVisible(),false);
   assert.deepEqual(remoteWrites,[]);
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

   // A real licensed photograph remains held, but the user can immediately
   // reach the existing single-photo capture without modifying the source.
   assert.equal(await page.locator('#reusableFigurePhotoHelp').isVisible(),true);
   assert.equal(await page.locator('#reusableFigureRetake').isVisible(),true);
   assert.match(await page.locator('#reusableFigurePhotoHelpText').innerText(),/still saved/);
   const heldItem=await page.evaluate(()=>items.find(x=>x.id==='commons-0003').image);
   await page.locator('#reusableFigureRetake').click();
   assert.equal(await page.locator('#scan').isVisible(),true);
   assert.equal(await page.locator('#captureSingle').getAttribute('aria-pressed'),'true');
   assert.equal(await page.evaluate(()=>items.find(x=>x.id==='commons-0003').image),heldItem);
   await page.evaluate(()=>{
    switchView('builder');
    currentBoard.slots={top:'test-shirt',bottom:'test-trousers'};
    renderOutfitBoard();
   });
   await page.waitForFunction(()=>document.querySelector('#reusableFigureStatus').textContent
    .startsWith('2 owned clothing layers displayed'));
   assert.equal(await page.locator('#reusableFigurePhotoHelp').isVisible(),false,
    'a valid outfit should not show misleading held-photo instructions');
   assert.equal(await page.locator('#reusableFigureRetake').isVisible(),false);

   const extractionProbes=[];
   for(const row of extractionInputs){
    const measured=await page.evaluate(async({row,witnesses})=>{
     const photo=new Image();photo.src=row.image;await photo.decode();
     const scale=Math.min(1,Math.sqrt(150000/(photo.naturalWidth*photo.naturalHeight)));
     const canvas=document.createElement('canvas');canvas.width=Math.floor(photo.naturalWidth*scale);canvas.height=Math.floor(photo.naturalHeight*scale);
     const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(photo,0,0,canvas.width,canvas.height);
     const source=ctx.getImageData(0,0,canvas.width,canvas.height).data;
     const proposal=ClosetDarkStudioMask.analyze(source,canvas.width,canvas.height,row);
     const result={id:row.id,proposalAvailable:proposal.proposalAvailable,displayEligible:proposal.displayEligible,reason:proposal.reason};
     if(proposal.proposalAvailable){
      const output=ClosetDarkStudioMask.applyAlpha(source,proposal.alpha);
      let rgbChanged=0;for(let i=0;i<source.length;i++)if(i%4!==3&&source[i]!==output[i])rgbChanged++;
      const patches=[];
      for(const patch of witnesses.witnesses){
       const [l,t,r,b]=patch.box;let total=0,correct=0;
       for(let y=Math.ceil(t*canvas.height);y<Math.floor(b*canvas.height);y++)
        for(let x=Math.ceil(l*canvas.width);x<Math.floor(r*canvas.width);x++){
         total++;if(output[(y*canvas.width+x)*4+3]===(patch.role==='garment'?255:0))correct++;
        }
       patches.push({name:patch.name,role:patch.role,total,correct:patch.role==='boundary-ambiguous'?null:correct});
      }
      const high=document.createElement('canvas');
      const highScale=Math.min(1,Math.sqrt(600000/(photo.naturalWidth*photo.naturalHeight)));
      high.width=Math.floor(photo.naturalWidth*highScale);high.height=Math.floor(photo.naturalHeight*highScale);
      const highContext=high.getContext('2d',{willReadFrequently:true});highContext.drawImage(photo,0,0,high.width,high.height);
      const highSource=highContext.getImageData(0,0,high.width,high.height).data;
      const refined=ClosetSourceGuidedMask.propose(highSource,high.width,high.height,row);
      const highOutput=ClosetDarkStudioMask.applyAlpha(highSource,refined.alpha);
      let outsideBandChanges=0,highRgbChanged=0,erasedProjectedForeground=0;
      for(let i=0;i<refined.alpha.length;i++){
       if(!refined.uncertainty[i]&&refined.alpha[i]!==refined.projectedAlpha[i])outsideBandChanges++;
       if(refined.alpha[i]<refined.projectedAlpha[i])erasedProjectedForeground++;
       for(let c=0;c<3;c++)if(highOutput[i*4+c]!==highSource[i*4+c])highRgbChanged++;
      }
      const refinedPatches=[];
      for(const patch of witnesses.witnesses){
       const [l,t,r,b]=patch.box;let total=0,correct=0;const mismatches=[];
       for(let y=Math.ceil(t*high.height);y<Math.floor(b*high.height);y++)
        for(let x=Math.ceil(l*high.width);x<Math.floor(r*high.width);x++){
         const at=(y*high.width+x)*4,i=y*high.width+x;
         total++;if(highOutput[at+3]===(patch.role==='garment'?255:0))correct++;
         else if(patch.role!=='boundary-ambiguous'&&mismatches.length<10)mismatches.push({x,y,rgb:[...highSource.slice(at,at+3)],alpha:refined.alpha[i],projectedAlpha:refined.projectedAlpha[i],uncertain:refined.uncertainty[i]});
        }
       refinedPatches.push({name:patch.name,role:patch.role,total,correct:patch.role==='boundary-ambiguous'?null:correct,mismatches});
      }
      result.refinement={proposalAvailable:refined.proposalAvailable,displayEligible:refined.displayEligible,
       width:high.width,height:high.height,uncertainBoundaryPixels:refined.uncertainBoundaryPixels,
       clearedBoundaryPixels:refined.clearedBoundaryPixels,restoredBoundaryPixels:refined.restoredBoundaryPixels,restoredDarkChromaPixels:refined.restoredDarkChromaPixels,
       outsideBandChanges,highRgbChanged,erasedProjectedForeground,patches:refinedPatches};
      const bounds=ClosetGarmentWarp.alphaBounds(output,canvas.width,canvas.height);
      const trimmed=new Uint8ClampedArray(bounds.width*bounds.height*4);
      for(let y=0;y<bounds.height;y++)trimmed.set(output.subarray(((bounds.top+y)*canvas.width+bounds.left)*4,
       ((bounds.top+y)*canvas.width+bounds.left+bounds.width)*4),y*bounds.width*4);
      const fitted=ClosetGarmentWarp.rasterize(trimmed,ClosetGarmentWarp.makeMesh(bounds.width,bounds.height,row.category));
      Object.assign(result,{rgbChanged,backgroundPixelsRemoved:proposal.backgroundPixels,patches,meshPixelBytes:fitted.length});
     }
     return result;
    },{row,witnesses:extractionWitnesses});
    assert.equal(measured.proposalAvailable,row.id==='commons-0002');
    assert.equal(measured.displayEligible,false,'unreviewed new candidates must not auto-display');
    if(measured.proposalAvailable){
     assert.equal(measured.rgbChanged,0);assert.ok(measured.meshPixelBytes>0);
     assert.equal(measured.refinement.proposalAvailable,true);assert.equal(measured.refinement.displayEligible,false);
     assert.equal(measured.refinement.erasedProjectedForeground,0);assert.equal(measured.refinement.clearedBoundaryPixels,0);
     assert.equal(measured.refinement.outsideBandChanges,0);assert.equal(measured.refinement.highRgbChanged,0);
     assert.ok(measured.refinement.width*measured.refinement.height<=600000);
     assert.ok(measured.refinement.uncertainBoundaryPixels>0);
     for(const patch of measured.refinement.patches)if(patch.role!=='boundary-ambiguous'){
      if(patch.correct!==patch.total)console.error('SOURCE_GUIDED_WITNESS_FAILURE '+JSON.stringify({engine:title,patch}));
      assert.equal(patch.correct,patch.total,patch.name);
     }
     for(const patch of measured.patches)if(patch.role!=='boundary-ambiguous')assert.equal(patch.correct,patch.total,patch.name);
    }
    extractionProbes.push(measured);
   }
   await writeFile('artifacts/local-fitting/'+(browserEngine===chromium?'android':'iphone')+'-extraction-probes.json',JSON.stringify(extractionProbes,null,2));
   assert.deepEqual(remoteWrites,[]);
   assert.deepEqual(errors,[]);
   results.push({engine:title,ownedLayers:2,reusedFigures:2,optionalSelfieLocalOnly:true,
    unchangedPreviewReused:true,transientDecodeRetry:true,baseModelRetry:true,remotePostCount:remoteWrites.length,layering:layeredResults,silhouetteChecks:silhouetteResults,licensedPhotoChecks:photoResults,extractionProposals:extractionProbes.filter(x=>x.proposalAvailable).length,realPhoneHardwareTested:false});
   await ctx.close();
  }finally{await browser.close();}
 }
 await writeFile('artifacts/local-fitting/results.json',JSON.stringify(results,null,2));
 console.log('REUSABLE_FIGURE_PHONE_EMULATION '+JSON.stringify(results));
}finally{await new Promise(done=>server.close(done));}
