/**
 * Synthetic real-JPEG -> uncompressed transparent garment -> PNG -> current
 * PR256 research renderer. NO app Auth/production/data and no external fetch.
 * Chromium + WebKit at 320, 390, 430 CSS px. Read-only PR256 source pin.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('.'),mime={'.mjs':'text/javascript','.html':'text/html'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/alpha13'){
   res.writeHead(200,{'Content-Type':'text/html','Content-Security-Policy':"default-src 'none';script-src 'self';connect-src 'self';img-src data:;style-src 'unsafe-inline'",'Cache-Control':'no-store'});
   res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Family Alpha 2D synthetic garment QA</title><style>*{box-sizing:border-box}body{margin:0;font:15px sans-serif}main{max-width:100%;padding:12px;overflow:hidden}#stage{width:100%;max-width:360px;margin:auto}img{image-rendering:auto}</style><main><h1>Synthetic photographed garments</h1><div id="stage"></div><p id="status" role="status"></p></main></html>');
   return;
  }
  if(!path.startsWith('/research/family-alpha-13/'))throw Error('Forbidden path');
  const file=resolve(root,'.'+decodeURIComponent(path));
  if(!file.startsWith(root+sep))throw Error('Path traversal');
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'text/plain','Cache-Control':'no-store'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port,report=[];
try{
 for(const [name,driver] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await driver.launch({headless:true,...(name==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const ctx=await browser.newContext({viewport:{width,height:840},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'});
    const page=await ctx.newPage(),errors=[],external=[];
    page.on('pageerror',e=>errors.push(e.message));
    await ctx.route('**/*',route=>{
     if(!route.request().url().startsWith(host)){external.push(route.request().url());return route.abort('blockedbyclient');}
     return route.continue();
    });
    await page.goto(host+'/alpha13');
    const data=await page.evaluate(async()=>{
     const {prepareVerifiedOriginalDerivative,hashRetainedOriginalJPEG,containGarmentInSlot}=await import('/research/family-alpha-13/garment-photo-preparation.mjs');
     const {syntheticGarment}=await import('/research/family-alpha-13/synthetic-garments.mjs');
     const {planPhotoLayers}=await import('/research/family-alpha-13/reference/family-alpha-2d-layer-plan.mjs');
     const {renderPhotoLayers}=await import('/research/family-alpha-13/reference/family-alpha-2d-photo-renderer.mjs');
     const garments=[
      ['shirt','top','Tops'],['pants','bottom','Bottoms'],['shoes','shoes','Shoes'],['jacket','layer2','Outerwear'],
      ['dress','dress','Dresses'],['skirt','bottom','Skirt'],['shorts','bottom','Shorts']
     ];
     const photos={},prepared={},images={},pixelsChecked={};
     const start=performance.now();
     for(const [id,slot,kind]of garments){
      const fixture=syntheticGarment(kind,{width:256,height:320,pattern:true});
      const rawCanvas=document.createElement('canvas');rawCanvas.width=fixture.frame.width;rawCanvas.height=fixture.frame.height;
      rawCanvas.getContext('2d').putImageData(new ImageData(fixture.frame.data,rawCanvas.width,rawCanvas.height),0,0);
      const retainedJPEG=rawCanvas.toDataURL('image/jpeg',.96);
      const img=new Image();img.src=retainedJPEG;await img.decode();
      const decoded=document.createElement('canvas');decoded.width=img.naturalWidth;decoded.height=img.naturalHeight;
      const g=decoded.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0);
      const photo={width:decoded.width,height:decoded.height,data:g.getImageData(0,0,decoded.width,decoded.height).data};
      const originalBytes=photo.data.slice();
      const version=await hashRetainedOriginalJPEG(retainedJPEG);
      const item=await prepareVerifiedOriginalDerivative(photo,{originalJPEG:retainedJPEG,
       category:fixture.category,sourceIdentity:'synthetic-capture-'+id,sourceVersion:version});
      if(item.status==='prepared'&&(!item.verifiedOriginalBytes||item.sourceSHA!==version))throw Error('Missing retained-original SHA proof');
      if(item.status!=='prepared')throw Error(id+' synthetic photo isolation failed: '+item.reason);
      if(item.width<=24||item.height<=24||item.rgba.length!==item.width*item.height*4)throw Error('Bad prepared pixel dimensions');
      if(!photo.data.every((n,i)=>n===originalBytes[i]))throw Error('Original retained photo mutated');
      let checked=0,pattern=false,transparent=false;
      for(let y=0;y<item.height;y++)for(let x=0;x<item.width;x++){
       const pos=4*(y*item.width+x),source=4*((item.bounds.top+y)*photo.width+(item.bounds.left+x));
       if(item.rgba[pos+3]===0){transparent=true;continue;}
       for(let k=0;k<3;k++)if(item.rgba[pos+k]!==originalBytes[source+k])throw Error('Pattern/source RGB fidelity violation');
       const r=item.rgba[pos],green=item.rgba[pos+1];
       if(green>r*1.3&&green>115)pattern=true;
       checked++;
      }
      if(checked<1500||!transparent||!pattern)throw Error('Synthetic fabric or transparency lost');
      const png=document.createElement('canvas');png.width=item.width;png.height=item.height;
      png.getContext('2d').putImageData(new ImageData(item.rgba,item.width,item.height),0,0);
      const transparentPNG=png.toDataURL('image/png'); // lossless derivative, original JPEG untouched
      if(!transparentPNG.startsWith('data:image/png;base64,'))throw Error('Not a lossless PNG');
      const alphaPhoto=new Image();alphaPhoto.src=transparentPNG;await alphaPhoto.decode();
      if(alphaPhoto.naturalWidth!==item.width||alphaPhoto.naturalHeight!==item.height)throw Error('PNG resolution changed');
      images[id]=alphaPhoto;prepared[id]=item;photos[id]=retainedJPEG;
      pixelsChecked[id]=checked;
     }
     const originalsBefore=Object.entries(photos).map(([id,src])=>[id,src.length]);
     const mismatch=await prepareVerifiedOriginalDerivative({width:256,height:320,data:new Uint8ClampedArray(256*320*4)},
       {originalJPEG:photos.shirt,sourceIdentity:'synthetic-capture-shirt',sourceVersion:prepared.pants.sourceVersion,category:'Tops'});
     if(mismatch.status!=='review'||mismatch.reason!=='retained-original-version-mismatch')throw Error('Changed source digest was not rejected');
     const selection=(slot,id)=>({slot,itemId:id,sourceIdentity:prepared[id].sourceIdentity,sourceVersion:prepared[id].sourceVersion});
     const current=[selection('layer2','jacket'),selection('bottom','pants'),selection('top','shirt'),selection('shoes','shoes')];
     const stage=document.getElementById('stage');
     const layers=planPhotoLayers(current);
     const contained=Object.fromEntries(layers.map(layer=>[layer.slot,containGarmentInSlot(prepared[layer.itemId],layer)]));
     for(const slot of layers){
      const fit=contained[slot.slot],p=prepared[slot.itemId];
      if(Math.abs(fit.displayedAspectRatio-p.width/p.height)>1e-8)throw Error('Contain helper distorted '+slot.slot);
     }
     if(renderPhotoLayers(stage,current,images)!==4)throw Error('Pinned current renderer failed layered outfit');
     const ordered=[...stage.querySelectorAll('img')].map(x=>x.dataset.slot);
     if(ordered.join(',')!=='shoes,bottom,top,layer2')throw Error('Wrong layer stacking '+ordered);
     // Existing PR256 renderer currently uses object-fit:fill. This is a
     // documented integration limitation, NOT silently claimed as resolved.
     const currentStretch=[...stage.querySelectorAll('img')].filter(x=>{
      const box=x.getBoundingClientRect();
      return Math.abs(box.width/box.height-x.naturalWidth/x.naturalHeight)>.05;
     }).length;
     let conflictsBlocked=false;
     try{planPhotoLayers([selection('dress','dress'),selection('bottom','pants')]);}catch{conflictsBlocked=true;}
     if(!conflictsBlocked)throw Error('Dress/bottom incompatibility not enforced');
     if(renderPhotoLayers(stage,[selection('dress','dress'),selection('shoes','shoes')],images)!==2)throw Error('Dress 2D renderer failed');
     if([...stage.querySelectorAll('img')].map(x=>x.dataset.slot).join(',')!=='shoes,dress')throw Error('Dress visual stacking');
     // Current renderer rejects blank/missing decode without compromising the
     // previous drawn layers (it builds a detached frame before replacing).
     let invalidBlocked=false;
     const previous=stage.firstElementChild;
     try{renderPhotoLayers(stage,[selection('top','shirt'),selection('bottom','pants')],{shirt:images.shirt});}
     catch{invalidBlocked=true;}
     if(!invalidBlocked||stage.firstElementChild!==previous)throw Error('Missing PNG did not fail safe');
     if(Object.entries(photos).some(([id,v])=>v.length!==originalsBefore.find(x=>x[0]===id)?.[1]))throw Error('Original source replaced');
     const performanceMs=performance.now()-start;
     document.getElementById('status').textContent='Synthetic JPEG to PNG: 7 prepared garment forms';
     return {garmentsPrepared:garments.length,nativeJPEGSize:{width:256,height:320},pngHasTransparency:true,
      patternPixelsVerified:Object.keys(pixelsChecked).length,originalsUnmodified:true,originalJPEGSourceSHAValidated:true,
      layersVerified:4,dressLayersVerified:2,missingImageRefused:true,
      currentRendererStretchCount:currentStretch,containFitPreservesAspect:true,
      processingMs:+performanceMs.toFixed(1)};
    });
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    assert.equal(data.garmentsPrepared,7);assert.ok(data.currentRendererStretchCount>0,'Current PR256 stretching blocker disappeared; review contract');
    report.push({browser:name,width,...data,pageErrors:0,externalRequests:0,layoutOverflow:false});
    await ctx.close();
   }
  }finally{await browser.close();}
 }
 assert.equal(report.length,6);
 console.log('FAMILY_ALPHA_13_MOBILE_BROWSER_PASS '+JSON.stringify(report));
}finally{await new Promise(ok=>server.close(ok));}
