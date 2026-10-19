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
      let outsideBandChanges=0,highRgbChanged=0;
      for(let i=0;i<refined.alpha.length;i++){
       if(!refined.uncertainty[i]&&refined.alpha[i]!==refined.projectedAlpha[i])outsideBandChanges++;
       for(let c=0;c<3;c++)if(highOutput[i*4+c]!==highSource[i*4+c])highRgbChanged++;
      }
      const refinedPatches=[];
      for(const patch of witnesses.witnesses){
       const [l,t,r,b]=patch.box;let total=0,correct=0;
       for(let y=Math.ceil(t*high.height);y<Math.floor(b*high.height);y++)
        for(let x=Math.ceil(l*high.width);x<Math.floor(r*high.width);x++){
         total++;if(highOutput[(y*high.width+x)*4+3]===(patch.role==='garment'?255:0))correct++;
        }
       refinedPatches.push({name:patch.name,role:patch.role,total,correct:patch.role==='boundary-ambiguous'?null:correct});
      }
      result.refinement={proposalAvailable:refined.proposalAvailable,displayEligible:refined.displayEligible,
       width:high.width,height:high.height,uncertainBoundaryPixels:refined.uncertainBoundaryPixels,
       clearedBoundaryPixels:refined.clearedBoundaryPixels,restoredBoundaryPixels:refined.restoredBoundaryPixels,
       outsideBandChanges,highRgbChanged,patches:refinedPatches};
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
     assert.equal(measured.refinement.outsideBandChanges,0);assert.equal(measured.refinement.highRgbChanged,0);
     assert.ok(measured.refinement.width*measured.refinement.height<=600000);
     assert.ok(measured.refinement.uncertainBoundaryPixels>0);
     for(const patch of measured.refinement.patches)if(patch.role!=='boundary-ambiguous')assert.equal(patch.correct,patch.total,patch.name);
     for(const patch of measured.patches)if(patch.role!=='boundary-ambiguous')assert.equal(patch.correct,patch.total,patch.name);
    }
    extractionProbes.push(measured);
   }
   await writeFile('artifacts/local-fitting/'+(browserEngine===chromium?'android':'iphone')+'-extraction-probes.json',JSON.stringify(extractionProbes,null,2));
   assert.deepEqual(remoteWrites,[]);
   assert.deepEqual(errors,[]);
   results.push({engine:title,ownedLayers:2,reusedFigures:2,optionalSelfieLocalOnly:true,
    remotePostCount:remoteWrites.length,licensedPhotoChecks:photoResults,extractionProposals:extractionProbes.filter(x=>x.proposalAvailable).length,realPhoneHardwareTested:false});
   await ctx.close();
  }finally{await browser.close();}
 }
 await writeFile('artifacts/local-fitting/results.json',JSON.stringify(results,null,2));
 console.log('REUSABLE_FIGURE_PHONE_EMULATION '+JSON.stringify(results));
}finally{await new Promise(done=>server.close(done));}
