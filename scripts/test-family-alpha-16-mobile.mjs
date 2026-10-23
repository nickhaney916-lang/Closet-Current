import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('.'),results=[];
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/'){
   res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
   res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;padding:10px;font:16px system-ui}#avatar{width:100%;max-width:360px;margin:auto}</style></head><body><h1>Synthetic garment source audit</h1><div id="avatar"></div></body></html>');return;
  }
  if(!(pathname.startsWith('/public/family-alpha-2d-')||
   pathname.startsWith('/research/family-alpha-16/')||
   pathname.startsWith('/reference-pr257/research/family-alpha-13/'))||
   !pathname.endsWith('.mjs'))throw Error('Denied');
  const filename=resolve(root,'.'+pathname);if(!filename.startsWith(root+sep))throw Error('Traversal');
  const content=await readFile(filename);
  res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});res.end(content);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
try{
 for(const [engine,driver] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await driver.launch({headless:true,...(engine==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:840},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page=await context.newPage(),errors=[],external=[];
    page.on('pageerror',e=>errors.push(e.message));
    await context.route('**/*',route=>{
     if(!route.request().url().startsWith(origin+'/')){external.push(route.request().url());return route.abort();}
     return route.continue();
    });
    await page.goto(origin+'/');
    const result=await page.evaluate(async()=>{
     const {syntheticScene}=await import('/research/family-alpha-16/synthetic-scenes.mjs');
     const {auditMask,fingerprintSavedCrop}=await import('/research/family-alpha-16/source-mask-audit.mjs');
     const {prepareSyntheticGarmentOriginal}=await import('/reference-pr257/research/family-alpha-13/garment-photo-preparation.mjs');
     const {fingerprintAlphaRetainedOriginal,identityForSavedGarment}=await import('/public/family-alpha-2d-saved-board.mjs');
     const {renderPhotoLayers}=await import('/public/family-alpha-2d-photo-renderer.mjs');
     const owner='a1111111-1111-4111-8111-111111111111',other='b2222222-2222-4222-8222-222222222222';
     const kinds=[['short-sleeve','top'],['jeans','bottom'],['dress','dress'],['sneakers','shoes']];
     const images={},selections=[],cases=[];let checked=0;
     const getScope=()=>({ownerId:owner,epoch:1});
     const decodeJpeg=async original=>{
      const image=new Image();image.src=original;await image.decode();
      const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;
      const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
      return {width:c.width,height:c.height,data:ctx.getImageData(0,0,c.width,c.height).data};
     };
     for(let i=0;i<kinds.length;i++){
      const [kind,slot]=kinds[i],scene=syntheticScene(kind);
      const canvas=document.createElement('canvas');canvas.width=scene.frame.width;canvas.height=scene.frame.height;
      const ctx=canvas.getContext('2d');
      ctx.putImageData(new ImageData(scene.frame.data,scene.frame.width,scene.frame.height),0,0);
      const original=canvas.toDataURL('image/jpeg',.98),decoded=await decodeJpeg(original);
      if(decoded.width!==canvas.width||decoded.height!==canvas.height)throw Error('Decoded original dimensions incorrect');
      const item={id:'synthetic-'+kind,category:scene.category,image:original,originalPhoto:{image:original},outfitSourceId:'synthetic-group-1'};
      const originalSha=await fingerprintAlphaRetainedOriginal(original);
      const cropSha=await fingerprintSavedCrop(item);
      const raw=prepareSyntheticGarmentOriginal(decoded,{category:scene.category,
       sourceIdentity:identityForSavedGarment(item),sourceVersion:originalSha});
      if(raw.status!=='prepared')throw Error('Unexpected real JPEG segmentation review '+kind+': '+raw.reason);
      const prepared={...raw,itemId:item.id,ownerId:owner,originalSha,cropSha};
      const check=()=>auditMask({item,prepared,ownerId:owner,getScope,getItem:()=>item,decodeOriginal:decodeJpeg,groundTruth:scene.truth});
      const audit=await check();
      if(audit.status!=='pass')throw Error('Original JPEG pixel or mask failed '+kind+': '+audit.reason+' '+JSON.stringify(audit.metrics));
      if(audit.metrics.sourceMismatchPixels!==0||audit.metrics.rgbRMSE!==0||audit.metrics.maskIoU<.98)throw Error('JPEG source pixel mismatch '+kind);
      const out=document.createElement('canvas');out.width=raw.width;out.height=raw.height;
      out.getContext('2d').putImageData(new ImageData(raw.rgba,raw.width,raw.height),0,0);
      const overlay=new Image();overlay.src=out.toDataURL('image/png');await overlay.decode();
      const proof=document.createElement('canvas');proof.width=raw.width;proof.height=raw.height;
      const proofCtx=proof.getContext('2d');proofCtx.drawImage(overlay,0,0);
      if(proofCtx.getImageData(0,0,1,1).data[3]!==0)throw Error('PNG transparent corner absent');
      if(raw.rgba.some((x,j)=>j%4===3&&x===0)===false)throw Error('No transparent garment background');
      images[item.id]=overlay;selections.push({slot,itemId:item.id,sourceIdentity:identityForSavedGarment(item),sourceVersion:originalSha});
      let changed={...item,image:canvas.toDataURL('image/jpeg',.55)};
      const stale=await auditMask({item:changed,prepared,ownerId:owner,getScope,getItem:()=>changed,decodeOriginal:decodeJpeg,groundTruth:scene.truth});
      if(stale.status!=='reject')throw Error('Changed crop did not invalidate PNG '+kind);
      const wrongOwner=await auditMask({item,prepared:{...prepared,ownerId:other},ownerId:owner,getScope,getItem:()=>item,decodeOriginal:decodeJpeg,groundTruth:scene.truth});
      if(wrongOwner.status!=='reject')throw Error('Foreign source accepted '+kind);
      cases.push({kind,slot,sourceExactRGBRate:audit.metrics.exactSourceRGBRate,
       maskIoU:audit.metrics.maskIoU,foregroundRecall:audit.metrics.foregroundRecall,
       backgroundLeakPixels:audit.metrics.backgroundLeakPixels,rgbRMSE:audit.metrics.rgbRMSE});
      checked+=7;
     }
     // Dress conflicts with a top and pants. Show three compatible sources.
     const stage=document.querySelector('#avatar');
     const layers=selections.filter(x=>x.slot!=='dress');
     if(renderPhotoLayers(stage,layers,images)!==3)throw Error('Three photo layers not shown');
     const nodes=[...stage.querySelectorAll('img')];
     if(nodes.map(x=>x.dataset.slot).join(',')!=='shoes,bottom,top')throw Error('Incorrect layer stack');
     const slots={top:'top',bottom:'bottom',shoes:'shoes'};
     for(const node of nodes){
      const ref=layers.find(x=>x.slot===node.dataset.slot);
      const original=images[ref.itemId],rect=node.getBoundingClientRect();
      if(node.src!==original.src||Math.abs(rect.width/rect.height-original.naturalWidth/original.naturalHeight)>.009)
       throw Error('Patterned transparent garment aspect or source URL changed');
      if(getComputedStyle(node).objectFit!=='contain')throw Error('Contain geometry not enabled');
      checked+=2;
     }
     const dress=selections.filter(x=>['dress','shoes'].includes(x.slot));
     if(renderPhotoLayers(stage,dress,images)!==2)throw Error('Dress + shoes missing');
     checked+=2;
     if(document.documentElement.scrollWidth>innerWidth+1)throw Error('Horizontal overflow');checked++;
     return {cases,checks:checked,realJpegDecoding:true,realTransparentPng:true,sourceBound:true};
    });
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    results.push({engine,width,...result,errors:errors.length,external:external.length});
    await context.close();
   }
  }finally{await browser.close();}
 }
 await mkdir('benchmark/family-alpha-16',{recursive:true});
 await writeFile('benchmark/family-alpha-16/browser-matrix.json',JSON.stringify({results},null,2));
 console.log('Family Alpha 16 real JPEG->PNG source audit: '+results.length+'/6 viewports passed; '+results.reduce((n,x)=>n+x.checks,0)+' assertions; zero external/browser errors');
}finally{server.close()}
