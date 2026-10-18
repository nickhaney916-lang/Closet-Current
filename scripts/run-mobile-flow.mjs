import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),out=resolve(process.argv[2]||'benchmark/mobile-flow');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.bin':'application/octet-stream','.css':'text/css'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),photo=url.pathname.match(/^\/benchmark-photo\/(commons-\d+\.jpg)$/);const file=photo?resolve('benchmark/photos',photo[1]):resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!photo&&!file.startsWith(root+'/'))throw Error('Forbidden');const data=await readFile(file);res.writeHead(200,{'Content-Type':photo?'image/jpeg':types[extname(file)]||'application/octet-stream'});res.end(data);}catch{if(!res.headersSent){res.writeHead(404);res.end('Not found');}else res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const errors=[];
try{
 await mkdir(out,{recursive:true});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--use-file-for-fake-video-capture='+resolve('benchmark/mobile-camera.y4m') ]});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,permissions:['camera'],serviceWorkers:'block'});
 // Use a test identity only. No production login, credentials or auth messages.
 await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:"window.closetAuth={user:{id:'mobile-flow-test'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.evaluate(()=>closetReady);
 // Exercise the actual shared crop/mask dialog on a touch-size browser viewport.
 await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=240;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#dc1e1e';ctx.fillRect(0,0,240,240);
  window.maskInteractionSaved=null;window.maskInteractionAnalyzed=null;
  await window.openPhotoCrop({image:canvas.toDataURL('image/jpeg',.95)},{
   analyze:async(rawCrop)=>{window.maskInteractionAnalyzed=rawCrop;return null;},save:async(photo)=>{window.maskInteractionSaved=photo;}
  });
 });
 const maskDialog=page.locator('dialog.photo-crop-editor');
 await maskDialog.getByRole('button',{name:'Erase background'}).click();
 const frame=maskDialog.locator('.crop-frame'),rect=await frame.boundingBox();
 assert.ok(rect&&rect.width>0&&rect.height>0,'Mask editor must display a usable touch surface');
 await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
 await page.mouse.down();await page.mouse.move(rect.x+rect.width*.6,rect.y+rect.height/2,{steps:6});await page.mouse.up();
 await maskDialog.getByRole('button',{name:'Check recognition'}).click();
 await page.waitForFunction(()=>!!window.maskInteractionAnalyzed);
 await maskDialog.getByRole('button',{name:'Save crop'}).click();
 await maskDialog.waitFor({state:'detached'});
 const masked=await page.evaluate(async()=>{
  const saved=window.maskInteractionSaved;
  const getRGB=async(src)=>{
   const img=new Image();img.src=src;await img.decode();
   const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
   const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
   return {center:[...ctx.getImageData(120,120,1,1).data],
    corner:[...ctx.getImageData(5,5,1,1).data]};
  };
  const display=await getRGB(saved.image);
  const source=await getRGB(saved.recognitionPhoto?.image||'');
  const analyzed=await getRGB(window.maskInteractionAnalyzed);
  return {...display,source,analyzed,original:saved.originalPhoto?.image};
 });
 assert.ok(masked.center[0]>240&&masked.center[1]>230&&masked.center[2]>230,'Erase brush must remove red fabric from center');
 assert.ok(masked.corner[0]>150&&masked.corner[1]<90,'Unpainted pixels must remain red');
 assert.ok(masked.original?.startsWith('data:image/jpeg;base64,'),'Original photo must survive mask edits');
 assert.ok(masked.source.center[0]>150&&masked.source.center[1]<90,
  'Source for categorization retains original red behind erased display pixels');
 assert.ok(masked.analyzed.center[0]>150&&masked.analyzed.center[1]<90,
  'Check recognition must inspect original red, not white-masked display');
 await page.locator('.tab[data-view="scan"]').click();await page.locator('#start').click();
 await page.waitForFunction(()=>document.querySelector('#video').readyState>=2&&document.querySelector('#video').videoWidth>0);
 const camera=await page.locator('#video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight}));
 assert.deepEqual(camera,{width:1920,height:1080});
 await page.locator('#takePhoto').click();await page.locator('#scanResults .photo-result').waitFor();
 const image=await page.locator('#scanResults .photo-result img').evaluate(async img=>{await img.decode();return {width:img.naturalWidth,height:img.naturalHeight};});assert.deepEqual(image,camera);
 // Pixel-level camera benchmark: compare the exact capture JPEG to the
 // currently displayed fixture frame. The fixture is static, so comparisons
 // are reproducible. Scores are diagnostic, not clothing acceptance gates.
 const photoDetail=await page.evaluate(async()=>{
  const video=document.querySelector('#video');
  const saved=document.querySelector('#scanResults .photo-result img');
  await saved.decode();
  const size=256;
  function pixels(source){
   const c=document.createElement('canvas');c.width=size;c.height=size;
   const ctx=c.getContext('2d',{willReadFrequently:true});
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.drawImage(source,0,0,size,size);
   return ctx.getImageData(0,0,size,size).data;
  }
  const original=pixels(video),encoded=pixels(saved);
  let absoluteError=0,squaredError=0,edgeBefore=0,edgeAfter=0,edgeError=0;
  const gray=(buffer,x,y)=>{const p=(y*size+x)*4;return .2126*buffer[p]+.7152*buffer[p+1]+.0722*buffer[p+2];};
  for(let p=0;p<original.length;p+=4)for(let channel=0;channel<3;channel++){
   const difference=original[p+channel]-encoded[p+channel];
   absoluteError+=Math.abs(difference);squaredError+=difference*difference;
  }
  for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++){
   const lap=b=>4*gray(b,x,y)-gray(b,x-1,y)-gray(b,x+1,y)-gray(b,x,y-1)-gray(b,x,y+1);
   const before=lap(original),after=lap(encoded);
   edgeBefore+=Math.abs(before);edgeAfter+=Math.abs(after);edgeError+=Math.abs(before-after);
  }
  const count=size*size*3,mse=squaredError/count;
  return {method:'static-video-to-saved-jpeg-pixel-comparison',
   source:{width:video.videoWidth,height:video.videoHeight},
   saved:{width:saved.naturalWidth,height:saved.naturalHeight},
   sampleWidth:size,sampleHeight:size,
   meanAbsoluteChannelError:Number((absoluteError/count).toFixed(4)),
   psnrDb:mse===0?null:Number((10*Math.log10(255*255/mse)).toFixed(3)),
   edgeEnergyBefore:Number(edgeBefore.toFixed(2)),
   edgeEnergyAfter:Number(edgeAfter.toFixed(2)),
   edgeEnergyRetentionRatio:edgeBefore?Number((edgeAfter/edgeBefore).toFixed(4)):null,
   meanAbsoluteEdgeError:Number((edgeError/((size-2)*(size-2))).toFixed(4)),
   noTextureWarning:edgeBefore<100,
   note:'Reproducible simulated-camera JPEG fidelity, not physical-phone focus or optical sharpness'};
 });
 assert.ok(Number.isFinite(photoDetail.meanAbsoluteChannelError),'JPEG error metric must be finite');
 assert.ok(photoDetail.psnrDb===null||Number.isFinite(photoDetail.psnrDb),'PSNR must be valid');
 assert.ok(photoDetail.edgeEnergyRetentionRatio===null||Number.isFinite(photoDetail.edgeEnergyRetentionRatio),'Edge retention must be valid');
 // Controlled stress fixtures supplement the real camera capture comparison.
 // Synthetic patterns provide known ground truth without risking user photos.
 const detailStress=await page.evaluate(async()=>{
  const w=256,h=256;
  const source=document.createElement('canvas');source.width=w;source.height=h;
  const ctx=source.getContext('2d');
  ctx.fillStyle='#dddddd';ctx.fillRect(0,0,w,h);
  for(let y=0;y<128;y+=4){ctx.fillStyle=y%8===0?'#292929':'#eeeeee';ctx.fillRect(0,y,w,2);}
  for(let y=128;y<h;y+=8)for(let x=0;x<w;x+=8){ctx.fillStyle=((x+y)/8)%2===0?'#345b89':'#eedeb8';ctx.fillRect(x,y,8,8);}
  function pixels(c){return c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;}
  async function jpeg(quality){const img=new Image();img.src=source.toDataURL('image/jpeg',quality);await img.decode();const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0);return c;}
  function smooth(){const small=document.createElement('canvas');small.width=32;small.height=32;small.getContext('2d').drawImage(source,0,0,32,32);const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(small,0,0,w,h);return c;}
  function metrics(a,b){let error=0,edgeA=0,edgeB=0;const lum=(p,x,y)=>{const i=(y*w+x)*4;return .2126*p[i]+.7152*p[i+1]+.0722*p[i+2];};for(let i=0;i<a.length;i+=4)for(let k=0;k<3;k++)error+=Math.abs(a[i+k]-b[i+k]);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const lap=p=>4*lum(p,x,y)-lum(p,x-1,y)-lum(p,x+1,y)-lum(p,x,y-1)-lum(p,x,y+1);edgeA+=Math.abs(lap(a));edgeB+=Math.abs(lap(b));}return {meanAbsoluteError:Number((error/(w*h*3)).toFixed(3)),edgeRetention:Number((edgeB/edgeA).toFixed(4))};}
  const original=pixels(source),high=pixels(await jpeg(.94)),low=pixels(await jpeg(.2)),blur=pixels(smooth());
  return {fixture:'generated fabric lines and check pattern',highQualityJpeg:metrics(original,high),lowQualityJpeg:metrics(original,low),blurred:metrics(original,blur)};
 });
 assert.ok(detailStress.blurred.edgeRetention<detailStress.highQualityJpeg.edgeRetention,'Blurred garment must lose more edge detail than high-quality capture');
 assert.ok(detailStress.lowQualityJpeg.meanAbsoluteError>detailStress.highQualityJpeg.meanAbsoluteError,'Aggressive JPEG compression must increase pixel error');
 await writeFile(out+'/photo-detail-stress.json',JSON.stringify(detailStress,null,2));
 console.log('PHOTO_DETAIL_STRESS '+JSON.stringify(detailStress));
 await writeFile(out+'/photo-detail-retention.json',JSON.stringify(photoDetail,null,2));
 console.log('PHOTO_DETAIL_RETENTION '+JSON.stringify(photoDetail));
 await page.locator('#scanResults .photo-result button').filter({hasText:'Adjust'}).click();
 const dialog=page.locator('dialog.photo-adjust');await dialog.getByLabel('Item name',{exact:true}).fill('Phone test blue top');
 await dialog.locator('label').filter({hasText:/^Main category/}).locator('select').selectOption('Tops');await dialog.locator('label').filter({hasText:/^Item type/}).locator('select').selectOption('T-shirt');await dialog.getByLabel('Color',{exact:true}).fill('Blue');await dialog.getByLabel('Summer',{exact:true}).check();
 await dialog.getByRole('button',{name:'Save changes',exact:true}).click();await dialog.waitFor({state:'detached'});
 await page.waitForFunction(()=>localPending.size===0&&!automaticRunning,null,{timeout:300000});
 assert.equal(await page.evaluate(()=>localReady&&!recognitionUnavailable),true,'Actual recognition worker must finish successfully.');
 await page.locator('.tab[data-view="closet"]').click();await page.locator('#search').fill('Phone test');await page.locator('.closet-refine').evaluate(el=>el.open=true);await page.locator('#filter').selectOption('Tops');await page.locator('#seasonFilter').selectOption('Summer');assert.equal(await page.locator('#closetGrid article').count(),1);
 await page.reload();await page.evaluate(()=>closetReady);await page.locator('.tab[data-view="closet"]').click();await page.locator('#search').fill('Phone test');assert.equal(await page.locator('#closetGrid article').count(),1);
 const saved=await page.evaluate(()=>items.find(x=>x.name==='Phone test blue top'));assert.equal(saved.category,'Tops');assert.equal(saved.itemType,'T-shirt');assert.equal(saved.userAdjusted,true);assert.equal(saved.color,'Blue');assert.deepEqual(saved.seasons,['Summer']);
 // Exercise the production crop button and production save callback, not a test-only callback.
 await page.evaluate(async()=>{
  const item=items.find(x=>x.name==='Phone test blue top');
  const crop=document.createElement('canvas');crop.width=240;crop.height=240;
  const ctx=crop.getContext('2d');ctx.fillStyle='#e11e1e';ctx.fillRect(0,0,240,240);
  const value={...item,image:crop.toDataURL('image/jpeg',.95),originalPhoto:null,cropBounds:null,color:'',colorSource:'photo-estimate'};
  await writeAll([value]);Object.assign(item,value);render();
 });
 await page.locator('.tab[data-view="closet"]').click();
 await page.locator('#search').fill('Phone test');
 await page.locator('#closetGrid article button').filter({hasText:'Crop photo'}).click();
 const persistenceDialog=page.locator('dialog.photo-crop-editor');
 await persistenceDialog.getByRole('button',{name:'Erase background'}).click();
 const persistenceFrame=await persistenceDialog.locator('.crop-frame').boundingBox();
 await page.mouse.click(persistenceFrame.x+persistenceFrame.width/2,persistenceFrame.y+persistenceFrame.height/2);
 await persistenceDialog.getByRole('button',{name:'Save crop'}).click();
 await persistenceDialog.waitFor({state:'detached'});
 await page.reload();await page.evaluate(()=>closetReady);
 const persistedMask=await page.evaluate(()=>{
  const item=items.find(x=>x.name==='Phone test blue top');
  return {image:item.image,original:item.originalPhoto?.image,recognitionPhoto:item.recognitionPhoto?.image||null,color:item.color,method:item.colorMethod,category:item.category,type:item.itemType};
 });
 assert.ok(persistedMask.image?.startsWith('data:image/jpeg;base64,'),'Edited garment image must persist');
 assert.ok(persistedMask.original?.startsWith('data:image/jpeg;base64,'),'Original image must persist after reload');
 assert.ok(persistedMask.recognitionPhoto?.startsWith('data:image/jpeg;base64,'),'Original-pixel recognition crop survives storage and reload');
 assert.equal(persistedMask.category,'Tops');assert.equal(persistedMask.type,'T-shirt');
 assert.equal(persistedMask.color,'Red');assert.equal(persistedMask.method,'garment-mask');
 await page.locator('.tab[data-view="scan"]').click();await page.locator('summary').filter({hasText:'Add saved photos or a video'}).click();await page.locator('#clothingPhotos').setInputFiles(resolve('benchmark/photos/commons-0002.jpg'));
 await page.waitForFunction(()=>items.length===2&&localPending.size===0,null,{timeout:300000});
 const automatic=await page.evaluate(()=>items.find(x=>x.name!=='Phone test blue top'));assert.equal(automatic.category,'Tops');assert.equal(automatic.itemType,'T-shirt');assert.notEqual(automatic.userAdjusted,true);
 await page.locator('.tab[data-view="closet"]').click();await page.locator('#search').fill('');await page.locator('#closetAllPieces').click();assert.equal(await page.locator('#closetGrid article').count(),2);
 // Real-photo batch: import licensed, independently sourced garment photographs.
 const realCases=[
  ['commons-0003','Tops'],['commons-0021','Bottoms'],['commons-0024','Bottoms'],
  ['commons-0033','Bottoms'],['commons-0035','Bottoms'],['commons-0045','Bottoms'],
  ['commons-0049','Dresses'],['commons-0053','Dresses'],
  ['commons-0060','Outerwear'],['commons-0065','Outerwear'],['commons-0070','Outerwear'],
  ['commons-0079','Shoes'],['commons-0083','Shoes'],['commons-0094','Shoes']
 ];
 // Account for every submitted photograph even when quality checks skip an item.
 const initialIds=await page.evaluate(()=>items.map(x=>x.id));
 await page.locator('#clothingPhotos').setInputFiles(realCases.map(([id])=>resolve('benchmark/photos/'+id+'.jpg')));
 await page.waitForFunction(()=>!busy&&!!window.__lastPhotoImportResult,null,{timeout:90000});
 try{await page.waitForFunction(()=>!automaticRunning&&localPending.size===0,null,{timeout:90000});}catch(error){console.warn('Recognition did not settle:',error.message);}
 const observed=await page.evaluate(ids=>({
  imports:window.__lastPhotoImportResult,
  newItems:items.filter(x=>!ids.includes(x.id)).map(x=>({filename:x.importFilename||null,category:x.category,itemType:x.itemType,color:x.color||null,colorSource:x.colorSource||null,colorMethod:x.colorMethod||null,needsReview:!!x.needsReview,scanFailed:!!x.scanFailed})),
  pending:batch.map(x=>({filename:x.importFilename||null,category:x.category,itemType:x.itemType,color:x.color||null,colorSource:x.colorSource||null,colorMethod:x.colorMethod||null,needsReview:!!x.needsReview,scanFailed:!!x.scanFailed,localStatus:x.localStatus||null,possibleDuplicate:!!x.possibleDuplicate,segmentHint:x.segmentHint||null,recognitionDiagnostics:x.recognitionDiagnostics||null})),
  busy,localPending:localPending.size,automaticRunning,
  message:document.querySelector('#message')?.textContent||null
 }),initialIds);
 const realResults=realCases.map(([id,expected])=>{
  const filename=id+'.jpg',outcome=observed.imports.results.find(x=>x.name===filename);
  const item=[...observed.newItems,...observed.pending].find(x=>x.filename===filename);
  return {id,expected,importStatus:outcome?.status||'unaccounted',importReason:outcome?.reason||null,...(item||{}),correctCategory:!!item&&item.category===expected};
 });
 const evaluated=realResults.filter(x=>x.category&&!x.scanFailed);
 // Review-only suggestions are measured separately from saved categories:
 // they must never inflate the app's automatic recognition accuracy.
 const reviewSuggestions=realResults.filter(x=>x.recognitionDiagnostics?.outerwearRecovery?.outerwearReviewSuggested).map(x=>({
  id:x.id,expected:x.expected,suggestedCategory:'Outerwear',
  suggestedType:x.recognitionDiagnostics.outerwearRecovery.fullCatalogEvidence?.whole?.top?.[0]?.type||null,
  correct:x.expected==='Outerwear',savedCategory:x.category
 }));
 // Record non-destructive framing metrics for the ambiguous garments.
 // These measurements are diagnostic only and never change recognition pixels.
 const framing=await page.evaluate(async()=>{
  const {recognitionFramingDiagnostics}=await import('/recognition-photo.mjs');
  const output={};
  for(const id of ['commons-0045','commons-0070']){
   const response=await fetch('/benchmark-photo/'+id+'.jpg');
   if(!response.ok){output[id]={error:'benchmark_photo_not_served'};continue;}
   const blob=await response.blob(),bitmap=await createImageBitmap(blob);
   const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
   const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(bitmap,0,0);
   const pixels=context.getImageData(0,0,canvas.width,canvas.height);
   const raw={width:canvas.width,height:canvas.height,channels:4,data:pixels.data};
   const primary=recognitionFramingDiagnostics(raw);
   const confirmation=recognitionFramingDiagnostics(raw,{confirmation:true});
   const scales=[256,288,320,336,384,448].map(target=>{
    const factor=target/Math.max(canvas.width,canvas.height);
    const width=Math.max(1,Math.round(canvas.width*factor));
    const height=Math.max(1,Math.round(canvas.height*factor));
    return {target,longestSide:Math.max(width,height),shortestSide:Math.min(width,height),
     originalPixelsPerModelPixel:Math.max(canvas.width,canvas.height)/target,
     width,height};
   });
   output[id]={primary,confirmation,scaleCandidates:scales};
   bitmap.close();
  }
  return output;
 });
 await writeFile(out+'/recognition-framing.json',JSON.stringify(framing,null,2));
 console.log('REAL_PHOTO_FRAMING '+JSON.stringify(framing));
 const report={cases:realResults,submitted:realCases.length,imported:observed.imports.added,evaluated:evaluated.length,automaticallySavedCount:observed.newItems.length,reviewPendingCount:observed.pending.length,automaticSaveRate:observed.newItems.length/realCases.length,colorPopulatedCount:realResults.filter(x=>!!x.color&&x.color!=='Unknown').length,colorCoverage:realResults.filter(x=>!!x.color&&x.color!=='Unknown').length/realCases.length,categoryAccuracy:evaluated.length?evaluated.filter(x=>x.correctCategory).length/evaluated.length:null,allSubmittedAccuracy:realResults.filter(x=>x.correctCategory).length/realCases.length,uncategorizedCases:realResults.filter(x=>x.category==='Uncategorized').map(x=>({id:x.id,expected:x.expected,diagnostics:x.recognitionDiagnostics||null})),uncategorizedCount:realResults.filter(x=>x.category==='Uncategorized').length,reviewSuggestions,reviewSuggestionCount:reviewSuggestions.length,reviewSuggestionCorrect:reviewSuggestions.filter(x=>x.correct).length,reviewSuggestionIncorrect:reviewSuggestions.filter(x=>!x.correct).length,reviewSuggestionPrecision:reviewSuggestions.length?reviewSuggestions.filter(x=>x.correct).length/reviewSuggestions.length:null,importDiagnostics:observed,pageErrors:errors};

 // Read-only color evidence from verified, licensed real photographs. No model
 // tuning, generated ground truth, garment editing or customer image exposure.
 const colorEvidence=await page.evaluate(async()=>{
  const results={};
  for(const id of ['commons-0003','commons-0033','commons-0035','commons-0045','commons-0049','commons-0053','commons-0065','commons-0070','commons-0079','commons-0094']){
   const response=await fetch('/benchmark-photo/'+id+'.jpg');
   if(!response.ok){results[id]={error:'fixture-unavailable'};continue;}
   const blob=await response.blob(),bitmap=await createImageBitmap(blob);
   try{
    const observations=[];
    for(const size of [16,32,64]){
     const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});
     ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
     ctx.drawImage(bitmap,0,0,size,size);
     const rgba=ctx.getImageData(0,0,size,size).data;
     const colorCounts={},left=Math.floor(size*.2),right=Math.ceil(size*.8),top=Math.floor(size*.2),bottom=Math.ceil(size*.8);
     let total=0,rTotal=0,gTotal=0,bTotal=0;
     for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
      const k=(y*size+x)*4,family=window.PhotoColor.family(rgba[k],rgba[k+1],rgba[k+2]);
      colorCounts[family]=(colorCounts[family]||0)+1;total++;
      rTotal+=rgba[k];gTotal+=rgba[k+1];bTotal+=rgba[k+2];
     }
     observations.push({size,estimate:window.PhotoColor.estimate(rgba,size,size),foregroundPalette:size===64?window.PhotoColor.uniformLightBackgroundPalette(rgba,size,size):null,sampledCenterPixels:total,regionFamilyCounts:colorCounts,meanCenterRGB:[rTotal,gTotal,bTotal].map(v=>Math.round(v/total))});
    }
    results[id]={width:bitmap.width,height:bitmap.height,observations};
   }finally{bitmap.close();}
  }
  return {method:'same-source-canvas-center-color-resolution-comparison',cases:results,
   note:'Observed image pixel colors, not independently validated garment masks or fabric color ground truth'};
 });
 await writeFile(out+'/real-photo-color-evidence.json',JSON.stringify(colorEvidence,null,2));
 console.log('REAL_PHOTO_COLOR_EVIDENCE '+JSON.stringify(colorEvidence));
 // The independently titled orange-shorts fixture previously auto-saved as
 // Brown. A color confidence guard must preserve the item for review, not
 // recast the uncertainty as a different confident color.
 const orangeTitleCase=colorEvidence.cases['commons-0035']?.observations?.find(x=>x.size===16);
 const neutralBrownCase=colorEvidence.cases['commons-0070']?.observations?.find(x=>x.size===16);
 assert.equal(orangeTitleCase?.estimate?.needsConfirmation,true,
  'Rust-orange source photograph must not be confidently called brown');
 assert.equal(neutralBrownCase?.estimate?.color,'Brown',
  'Brown-coat control must remain classifiable as brown');
 assert.notEqual(neutralBrownCase?.estimate?.needsConfirmation,true,
  'Neutral brown control must not become uncertain from rust-orange protection');
 const orangeIndexed=realResults.find(x=>x.id==='commons-0035');
 assert.notEqual(orangeIndexed?.color,'Brown',
  'Orange shorts must not silently auto-save a conflicting brown photo label');

 await writeFile(out+'/real-photo-indexing.json',JSON.stringify(report,null,2));
 console.log('REAL_PHOTO_INDEXING '+JSON.stringify(report));
 console.log('REAL_PHOTO_REVIEW_SUGGESTIONS '+JSON.stringify({count:reviewSuggestions.length,correct:reviewSuggestions.filter(x=>x.correct).length,incorrect:reviewSuggestions.filter(x=>!x.correct)}));
 // A wrong review hint is actionable evidence, even though suggestions never
 // auto-save. Keep the benchmark passing while exposing every false hint.
 if(reviewSuggestions.some(x=>!x.correct))console.warn('REAL_PHOTO_FALSE_REVIEW_SUGGESTION '+JSON.stringify(reviewSuggestions.filter(x=>!x.correct)));
 if(realResults.some(x=>x.importStatus==='added'&&(!x.category||x.category==='Uncategorized')))console.warn('REAL_PHOTO_REVIEW_REQUIRED '+JSON.stringify(realResults.filter(x=>x.importStatus==='added'&&(!x.category||x.category==='Uncategorized'))));
 if(realResults.some(x=>x.importStatus==='unaccounted'))throw Error('Some submitted photos have no import outcome');
 // Guard the verified 14/14 baseline and prevent false automatic labels.
 // Uncategorized is a safe fallback, but a wrong saved category is not.
 const incorrectlyCategorized=realResults.filter(x=>x.category&&x.category!=='Uncategorized'&&x.category!==x.expected);
 assert.deepEqual(incorrectlyCategorized.map(x=>({id:x.id,expected:x.expected,actual:x.category})),[],
  'Recognition must not silently save a wrong category');
 assert.ok(realResults.filter(x=>x.correctCategory).length===14,
  'Real-photo category accuracy must preserve the verified 14/14 baseline');
 assert.equal(observed.imports.added,realCases.length,'Every real photo must import');
 // Preserve the known ambiguous skirt/coat outcomes until genuinely
 // independent recognition evidence resolves them. A dress or top must never
 // be silently substituted for the expected garment.
 for(const [id,expected] of [['commons-0045','Bottoms'],['commons-0070','Outerwear']]){
  const sample=realResults.find(x=>x.id===id);
  assert.ok(sample, 'Missing ambiguity regression fixture: '+id);
  assert.ok(sample.category===expected||sample.category==='Uncategorized',
   id+' must not receive a conflicting automatic category');
  if(sample.category===expected)assert.equal(sample.itemType,id==='commons-0045'?'Skirt':'Coat',
   id+' must not be automatically saved with an incorrect garment subtype');
 }
 const verifiedJacket=realResults.find(x=>x.id==='commons-0065');
 assert.equal(verifiedJacket?.category,'Outerwear','Previously recovered jacket must remain recognized');
 assert.equal(verifiedJacket?.itemType,'Jacket','Previously recovered jacket subtype must remain stable');
 // Regression: independent jacket evidence must offer a review-only category
 // action that updates the real editor fields, without saving automatically.
 const jacket=realResults.find(x=>x.id==='commons-0060');
 if(jacket?.recognitionDiagnostics?.outerwearRecovery?.outerwearReviewSuggested){
  const state=await page.evaluate(()=>{
   const item=batch.find(x=>x.importFilename==='commons-0060.jpg');
   assertItem: if(!item)break assertItem;
   adjustPhoto(item);
   return {found:!!item};
  });
  assert.equal(state.found,true,'Jacket should remain available for manual review');
  const dialog=page.locator('dialog.clothing-editor');
  const reviewText=await dialog.locator('.recognition-review-suggestion').innerText();
  assert.match(reviewText,/Two photo checks suggest Outerwear/);
  assert.match(reviewText,/Jacket/,'Both views should agree on the suggested garment type');
  await dialog.getByRole('button',{name:'Use Outerwear category'}).click();
  assert.equal(await dialog.locator('select[aria-label="Main category"]').inputValue(),'Outerwear');
  assert.equal(await dialog.locator('select[aria-label="Item type"]').inputValue(),'Unknown');
  await dialog.getByRole('button',{name:'Cancel'}).click();
  const after=await page.evaluate(()=>batch.find(x=>x.importFilename==='commons-0060.jpg')?.category);
  assert.equal(after,'Uncategorized','Cancel must not silently save the suggested category');
 }
 // Verify that every otherwise eligible color-only item exposes its
 // existing inline save control. No mock color prediction and no extra dialog.
 // This measures fewer required taps, NOT automatic inference accuracy.
 const inlineColorReview=await page.evaluate(()=>{
  const cards=[...document.querySelectorAll('#reviewGrid .photo-result')];
  return batch.filter(item=>item.importFilename&&item.category!=='Uncategorized'&&
   !item.color&&!item.possibleDuplicate&&!item.requiresOwnershipConfirmation&&
   !item.scanFailed&&!item.saveFailed&&!item.userAdjusted&&item.localAnalyzed&&
   !item.segmentHint).map(item=>{
    const index=batch.findIndex(x=>x.id===item.id),card=cards[index];
    return {id:item.importFilename.replace(/\.jpg$/,''),
     hasPicker:!!card?.querySelector('.quick-color-confirm select'),
     label:card?.querySelector('.photo-status')?.textContent||null,
     hasAdjust:!!card?.querySelector('button.secondary')};
   });
 });
 assert.ok(inlineColorReview.length>=5,'Expected at least five known-color-pending real photos');
 assert.ok(inlineColorReview.every(x=>x.hasPicker&&x.label==='Choose color to save'),
  'Confirmed garment with uncertain color must offer visible inline save');
 console.log('REAL_PHOTO_INLINE_COLOR_REVIEW '+JSON.stringify({
  eligible:inlineColorReview.length,available:inlineColorReview.filter(x=>x.hasPicker).length,
  cases:inlineColorReview.map(x=>x.id),requiredExtraScreen:false,
  automaticColorInferred:false
 }));
 // Exercise the real mobile review UI after measurements are recorded.
 // The explicit selection simulates the user, not another AI inference.
 const quickCardIndex=await page.evaluate(()=>{
  const i=batch.findIndex(x=>x.importFilename==='commons-0035.jpg');
  if(i>=0)switchView('review');
  return i;
 });
 assert.ok(quickCardIndex>=0,'Uncertain orange shorts must remain available to review');
 const quickPicker=page.locator('#reviewGrid .photo-result').nth(quickCardIndex).locator('.quick-color-confirm select');
 assert.equal(await quickPicker.count(),1,'One inline color choice must be visible for a reviewable piece');
 await quickPicker.selectOption('Orange');
 await page.waitForFunction(()=>items.some(x=>x.importFilename==='commons-0035.jpg'&&x.color==='Orange')&&!batch.some(x=>x.importFilename==='commons-0035.jpg'),null,{timeout:10000});
 const chosen=await page.evaluate(()=>{
  const piece=items.find(x=>x.importFilename==='commons-0035.jpg');
  return piece?{category:piece.category,itemType:piece.itemType,color:piece.color,colorSource:piece.colorSource}:null;
 });
 assert.deepEqual(chosen,{category:'Bottoms',itemType:'Shorts',color:'Orange',colorSource:'user'});
 console.log('QUICK_COLOR_USER_CONFIRMATION '+JSON.stringify({fixture:'commons-0035',...chosen,requiredExtraScreen:false,automaticInference:false}));

 // A licensed real-photo shorts image has just passed garment-category
 // recognition and explicit user color confirmation. Check the entire
 // saved-photo -> Style this handoff; no artificial classifier label or
 // additional retailer items are inserted.
 const realHandoff=await page.evaluate(()=>{
  const piece=items.find(x=>x.importFilename==='commons-0035.jpg');
  const currentPhotos=[...batch,...items.filter(x=>sessionCapturedIds.has(x.id))];
  return {id:piece?.id,photoResultIndex:currentPhotos.findIndex(x=>x.id===piece?.id),
   image:piece?.image||null,original:piece?.originalPhoto?.image||null,
   recognition:piece?.recognitionPhoto?.image||null};
 });
 assert.ok(realHandoff.id,'Confirmed orange shorts must be saved');
 assert.ok(realHandoff.photoResultIndex>=0,
  'After saving a real photo it must remain in the session Photo results');
 const realPhotoCard=page.locator('#reviewGrid .photo-result').nth(realHandoff.photoResultIndex);
 const styleButton=realPhotoCard.getByRole('button',{name:'Style this',exact:true});
 assert.equal(await styleButton.count(),1,'Saved clothing photo must have the one-tap Style this button');
 const tapBounds=await styleButton.boundingBox();
 assert.ok(tapBounds&&tapBounds.width>=44&&tapBounds.height>=44,
  'Style this requires a phone-friendly 44px touch target');
 await styleButton.tap();
 await page.locator('#stylistAnchor').waitFor({state:'visible'});
 await page.locator('#styledCollectionResults .styled-outfit').first().waitFor({timeout:15000});
 const styledReal=await page.evaluate(id=>{
  const selection=items.find(x=>x.id===id);
  return {anchor:stylistAnchorItemId,category:selection?.category,
   type:selection?.itemType,color:selection?.color,
   options:styledCollectionResults.map(r=>({
    hasAnchor:r.board.slots.bottom===id,
    allOwned:Object.values(r.board.slots).every(pieceId=>items.some(item=>item.id===pieceId)),
    gaps:r.missing
   }))};
 },realHandoff.id);
 assert.equal(styledReal.anchor,realHandoff.id);
 assert.equal(styledReal.category,'Bottoms');
 assert.equal(styledReal.type,'Shorts');
 assert.equal(styledReal.color,'Orange');
 assert.ok(styledReal.options.length>0,'Real saved shorts should yield at least a partial owned outfit');
 assert.ok(styledReal.options.every(x=>x.hasAnchor&&x.allOwned),
  'All options must pin the confirmed shorts and include only owned clothing');
 const sourceAfter=await page.evaluate(id=>{
  const p=items.find(x=>x.id===id);
  return {image:p.image,original:p.originalPhoto?.image||null,
   recognition:p.recognitionPhoto?.image||null};
 },realHandoff.id);
 assert.deepEqual(sourceAfter,{image:realHandoff.image,original:realHandoff.original,
  recognition:realHandoff.recognition},
  'Styling must preserve original garment and its recognition photo');
 console.log('REAL_PHOTO_STYLE_HANDOFF '+JSON.stringify({
  photo:'commons-0035',outfitOptions:styledReal.options.length,
  everyOptionPinned:true,allClothingOwned:true,
  categoryRecognized:'Bottoms',typeRecognized:'Shorts',
  orangeColorUserConfirmed:true,tapWidth:Math.round(tapBounds.width),
  tapHeight:Math.round(tapBounds.height),originalPreserved:true,
  physicalPhoneTested:false,automaticRecognitionAccuracyClaimed:false
 }));

 assert.deepEqual(errors,[]);await page.screenshot({path:out+'/closet.png',fullPage:true});
 const result={viewport:{width:390,height:844},camera,image,manualSave:true,searchAndFilters:true,reloadPersistence:true,automaticPhotoIndexing:true,realRecognitionWorker:true,auth:'test identity stub; production auth not tested',hardware:'Chromium fake camera; physical phone not tested',pageErrors:errors};await writeFile(out+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
