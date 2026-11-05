/**
 * MASK-53 source-locked real SegFormer inference in Chromium and WebKit.
 * Not a fresh independent human-labeled cohort. The same actual pinned model
 * processes the SHA-locked public benchmark fixtures; we compare old/new masks from the
 * identical model logits, not a bounding-box union proxy.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
import {isPinnedModelAsset,routePinnedModelAsset}
 from '../research/real-mask-evidence-31/model-assets.mjs';
import {scorePhoto,summarizePhotos}
 from '../research/multi-review-triage-28/frozen-scorer-16.mjs';

const SHA=b=>createHash('sha256').update(b).digest('hex');
const root=resolve('.'),out=resolve('benchmark/real-mask-evidence-31');
await mkdir(out,{recursive:true});
const sources=JSON.parse(await readFile('research/multi-review-triage-28/frozen-photo-annotations-16.json','utf8'));
// Frozen annotation pool: development and held-out only. There is no
// independent second annotator or separate validation split.
const lockedSources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const photoRows=[];
for(const annotation of sources){
 const locked=lockedSources.find(x=>x.id===annotation.id),path='benchmark/fixtures/'+annotation.id+'.jpg';
 if(!locked||!locked.verified)continue;
 try{
  const bytes=await readFile(path),metadata=await sharp(bytes,{failOn:'truncated'}).metadata();
  if(SHA(bytes)!==locked.sha256||metadata.format!=='jpeg')continue;
  photoRows.push({...annotation,fixture:path,fixtureBytes:bytes.length,
   fixtureSHA256:locked.sha256,width:metadata.width,height:metadata.height,
   bytes:bytes.length,sha256:locked.sha256,attribution:locked.attribution,
   source:locked.downloadUrl,sourceOriginalSHA256:annotation.sha256});
 }catch{}
}
assert.ok(photoRows.length>0,'No verified source-locked benchmark fixtures overlap the annotation set');
const ids=photoRows.map(row=>row.id);
assert.equal(new Set(photoRows.map(x=>x.sha256)).size,ids.length);
assert.ok(photoRows.every(x=>x.attribution?.source&&x.attribution?.license));
const originalBuffers=new Map();
async function fetchSource(row){
 const bytes=await readFile(row.fixture);
 const metadata=await sharp(bytes,{failOn:'truncated'}).metadata();
 assert.equal(bytes.length,row.fixtureBytes,'source fixture size changed');
 assert.equal(SHA(bytes),row.fixtureSHA256,'source fixture SHA changed');
 assert.equal(metadata.format,'jpeg');assert.equal(metadata.width,row.width);assert.equal(metadata.height,row.height);
 return bytes;
}
for(const row of photoRows){
 originalBuffers.set(row.id,await fetchSource(row));
 console.log('Verified unchanged licensed fixture',row.id,row.sha256.slice(0,12),
  row.width+'x'+row.height);
}
const mimes={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html'};
const server=createServer(async(req,res)=>{
 try{
  if(req.method!=='GET')throw Error('No HTTP writes allowed');
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/'){res.writeHead(200,{'content-type':'text/html'}).end('Closet Current research mask runner');return;}
  if(!/^\/(public\/outfit-segmentation\.mjs|research\/(real-mask-evidence-31\/(runner\.html|worker\.mjs|legacy-visible-groups\.mjs)|multi-garment-capture-01\/(visible-groups|shoe-pair-geometry-30)\.mjs))$/.test(path))
   throw Error('Unexpected research file '+path);
  res.writeHead(200,{'content-type':mimes[extname(path)]||'application/octet-stream'});
  res.end(await readFile(resolve(root,'.'+path)));
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const families={4:'upper',5:'skirt',6:'bottom',7:'dress',9:'shoes'};
const externalWrites=[],networkFailures=[],reports={};
try{
 const availableEngines={chromium,webkit};
 const requestedEngines=(process.env.MASK31_ENGINES||'chromium,webkit').split(',').filter(Boolean);
 for(const engine of requestedEngines){
  const launcher=availableEngines[engine];assert.ok(launcher,'Unknown browser engine '+engine);
  const cache=new Map(),browser=await launcher.launch();
  const context=await browser.newContext({viewport:{width:390,height:880},
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',async route=>{
   const req=route.request(),url=req.url();
   if(req.method()!=='GET'&&req.method()!=='HEAD'){
    externalWrites.push({engine,method:req.method()});return route.abort();
   }
   if(url.startsWith(origin+'/'))return route.continue();
   if(isPinnedModelAsset(url)){
    try{return await routePinnedModelAsset(route,cache);}
    catch(e){networkFailures.push({engine,asset:'pinned',error:e.message.slice(0,180)});
     return route.abort();}
   }
   networkFailures.push({engine,asset:'unapproved',origin:new URL(url).origin});
   return route.abort();
  });
  const page=await context.newPage(),runtimeErrors=[];
  page.on('pageerror',e=>runtimeErrors.push(e.message.slice(0,200)));
  await page.goto(origin+'/research/real-mask-evidence-31/runner.html',{waitUntil:'load'});
  const entries=[],screenshots=[];
  try{
   for(const row of photoRows){
    const jpeg=originalBuffers.get(row.id);
    const imageData='data:image/jpeg;base64,'+jpeg.toString('base64');
    // Source JPEG SHA unchanged and isolated from resized in-memory model input.
    const started=await page.evaluate(async ({row,imageData,engine})=>{
     const memoryBefore=performance.memory?.usedJSHeapSize??null;
     const decoded=new Image();decoded.src=imageData;await decoded.decode();
     if(decoded.naturalWidth!==row.width||decoded.naturalHeight!==row.height)
      throw Error('Browser source image dimension mismatch');
     let inference=imageData;
     if(Math.max(row.width,row.height)>3072){
      const canvas=document.createElement('canvas');
      const ratio=3072/Math.max(row.width,row.height);
      canvas.width=Math.max(1,Math.round(row.width*ratio));
      canvas.height=Math.max(1,Math.round(row.height*ratio));
      canvas.getContext('2d').drawImage(decoded,0,0,canvas.width,canvas.height);
      inference=canvas.toDataURL('image/jpeg',.9);
     }
     // WebKit module-worker Blob createImageBitmap can reject a genuine JPEG.
     // Decode the SAME analysis JPEG using the real page canvas instead;
     // transfer its RGBA pixels to actual ONNX model inference in worker.
     let analysisRGBA=null,analysisWidth=null,analysisHeight=null;
     if(engine==='webkit'){
      const decodedAnalysis=new Image();decodedAnalysis.src=inference;
      await decodedAnalysis.decode();
      analysisWidth=decodedAnalysis.naturalWidth;
      analysisHeight=decodedAnalysis.naturalHeight;
      const canvas=document.createElement('canvas');
      canvas.width=analysisWidth;canvas.height=analysisHeight;
      const context=canvas.getContext('2d',{willReadFrequently:true});
      if(!context)throw Error('WebKit analysis image canvas unavailable');
      context.drawImage(decodedAnalysis,0,0,analysisWidth,analysisHeight);
      analysisRGBA=context.getImageData(0,0,analysisWidth,analysisHeight).data;
     }
     await window.runRealMask31({sourceId:row.id,sourceData:imageData,analysisData:inference,
      analysisRGBA,analysisWidth,analysisHeight,
      originalWidth:row.width,originalHeight:row.height,
      annotation:row.regions,
      credit:row.attribution.title+' · '+row.attribution.author+' · '+row.attribution.license+
       ' · '+row.attribution.source,
      expectedSHA:row.sha256});
     return {resized:inference!==imageData,memoryBefore};
    },{row,imageData,engine});
    await page.waitForFunction(()=>window.__realMask31.done,null,{timeout:395000});
    const state=await page.evaluate(()=>window.__realMask31);
    if(state.error||!state.report)throw Error('Actual SegFormer inference failed for '+engine+'/'+row.id+': '+state.error);
    const data=state.report;
    assert.equal(data.sourceId,row.id);assert.equal(data.sourceSHA256,row.sha256);
    assert.equal(data.model,'Xenova/segformer_b0_clothes');
    assert.equal(data.maskPixelMembershipConserved,true);
    assert.equal(data.sourcePixelsNeverReturned,true);
    assert.equal(data.familyConservation.length,5);
    assert.ok(data.familyConservation.every(x=>x.retainedWithoutChanges));
    assert.ok(data.before.every(x=>x.needsReview&&x.selectedMaskSHA256.length===64));
    assert.ok(data.after.every(x=>x.needsReview&&x.selectedMaskSHA256.length===64));
    const pre=data.before.map(x=>({box:x.crop,family:families[x.regionId]}));
    const post=data.after.map(x=>({box:x.crop,family:families[x.regionId]}));
    const before=scorePhoto(row.regions,{status:'completed',proposals:pre});
    const after=scorePhoto(row.regions,{status:'completed',proposals:post});
 const item={id:row.id,benchmarkFixtureSHA256:row.sha256,
      annotationOriginalSHA256:row.sourceOriginalSHA256,sourceLicense:row.attribution.license,
      benchmarkFixtureDimensions:[row.width,row.height],benchmarkFixtureBytes:row.bytes,
      resized:started.resized,
      modelInputDecode:engine==='webkit'?'page-canvas-decoded-analysis-JPEG-RGBA':'worker-RawImage-JPEG',
      analysisResolution:data.analysisResolution,actualPixelMapDimensions:data.modelMask,
      modelLoadMs:data.modelLoadMs,inferenceMs:data.inferenceMs,
      browserHeapBeforeBytes:started.memoryBefore,
      browserHeapAfterBytes:await page.evaluate(()=>performance.memory?.usedJSHeapSize??null),
      actualModelLabelMaskSHA256:data.sourceMapLabelsSHA256,
      perClassPixelMembershipUnchanged:true,memberCount:data.familyConservation,
      before:{...before,groups:data.before},after:{...after,groups:data.after},
      realPinnedONNXInference:true,noGarmentAutoSaved:true,independentHumanPixelMasks:false};
    entries.push(item);
    const widths=[320,390,430];
    for(const width of widths){
     await page.setViewportSize({width,height:900});
     const filename=engine+'-'+row.id+'-'+width+'.png';
     const png=await page.screenshot({path:out+'/'+filename,fullPage:true});
     const metadata=await sharp(png).metadata();
     assert.equal(metadata.format,'png');assert.equal(metadata.width,width);
     assert.ok(png.length>11000&&metadata.height>=650);
     screenshots.push({sourceId:row.id,engine,width,filename,sha256:SHA(png),
     fixtureSHA256:row.sha256,actualModelMaskSHA256:data.sourceMapLabelsSHA256,
      realModelExecuted:true});
    }
    await page.setViewportSize({width:390,height:880});
    console.log('AUTO-SEGMENTATION-53',engine,row.id,'source-locked fixture genuine model masks',
     'before',before.matches.length+'/'+before.expectedCount,
     'after',after.matches.length+'/'+after.expectedCount,
     'sourcePixelsUnchanged=true');
   }
  }finally{await context.close();await browser.close();}
  assert.deepEqual(runtimeErrors,[],'browser JS errors in '+engine);
  const cachedAssets=await Promise.all([...cache.values()]);
  reports[engine]={realModelRuns:entries.length,sourceRows:entries,
   modelAssetRequestCount:cache.size,
   modelAssetPaths:[...cache.keys()].map(value=>{const url=new URL(value);return url.origin+url.pathname}),
   modelAssetDownloadBytes:cachedAssets.reduce((sum,item)=>sum+item.body.length,0),
   coldModelLoadMs:entries[0]?.modelLoadMs??null,
   before:summarizePhotos(entries.map(x=>x.before)),
   after:summarizePhotos(entries.map(x=>x.after)),
   screenshots,errors:runtimeErrors};
 }
 assert.deepEqual(externalWrites,[]);assert.deepEqual(networkFailures,[]);
 const allRows=Object.values(reports).flatMap(x=>x.sourceRows);
 assert.ok(requestedEngines.every(engine=>reports[engine]?.realModelRuns===photoRows.length));
 const maskEvidence={priority:'AUTO-SEGMENTATION-REAL-MODEL-53',
  baselinePR:610,previousHead:'05107691cee5bbf7429b824aa0b1444fcb70ae5b',
  pinnedModel:'Xenova/segformer_b0_clothes@a2489ea8e7ec1ee912190546bad31a4906ccca76',
  sourcePhotoCount:photoRows.length,genuineModelExecutions:allRows.length,
  scope:'Frozen licensed single-reviewer annotation pool evaluated on SHA-locked downsampled fixture derivatives. Historical development and held-out tags are retained but are not newly blinded; some photos appeared in prior research. There is no separate validation split, blind second annotator, or independent pixel mask truth.',
  sourceLockedFixtureSHA256Verified:true,fullResolutionAnnotationSourceWasNotInferenceInput:true,rawModelLabelPixelsUsed:true,
  sameModelOutputUsedForBeforeAndAfter:true,
  pixelMembershipExactlyPreservedByGrouping:true,
  sourceTruePixelMaskIoUAgainstIndependentHumanTruth:false,
  independentBlindAnnotators:0,fixturePhotosChanged:false,
  realPhotoModelAccuracyCertified:false,allSuggestionsRequireReview:true,
  datasetSplits:Object.fromEntries(['development','held-out'].map(split=>[split,photoRows.filter(x=>x.split===split).map(x=>x.id)])),
  independentlyLockedEvaluationAvailable:false,
  excludedAnnotationIds:sources.filter(x=>!photoRows.some(y=>y.id===x.id)).map(x=>x.id),
  annotationLimitations:'One reviewer supplied coarse normalized category-family boxes. There are no per-pixel ground-truth masks, independently adjudicated labels, garment subtypes, colors, non-clothing negative controls, or confusion adjudication in this cohort.',
  detectionEvaluation:{method:'one-to-one category-family box matching at IoU >= 0.50 against frozen human boxes',
   result:'bounding-box detection proxy only; not pixel-mask IoU or instance accuracy',
   engines:Object.fromEntries(Object.entries(reports).map(([engine,r])=>[engine,r.after]))},
  classificationEvaluation:{broadCategoryAccuracy:null,subtypeAccuracy:null,colorAccuracy:null,
   reason:'SegFormer semantic-region labels are not independent category, subtype, or color ground truth; those outcomes were not independently tested in this benchmark.'},
  instanceSeparation:{method:'connected components of semantic classes with conservative same-family shoe grouping',
   learnedInstanceModelUsed:false,touchingSameClassGarmentsSeparatelyIdentifiable:false},
  memoryAvailability:{javascriptHeapMeasurements:'performance.memory.usedJSHeapSize when browser exposes it; this Chromium sandbox returned the same 10000000-byte value for every before/after sample, so it is not useful for model-memory attribution and is not a process or device-memory measure',
   physicalDeviceMemoryBytes:null,deviceMemoryApiAvailable:false},
  browserAppFlowAcceptance:{fullClosetAppFlowTested:false,reason:'This harness is a read-only research overlay; it does not save photos, classify with FashionCLIP, sign in, write a closet, back up, restore, or separate accounts.'},
  scientificVerdict:'NEEDS REWORK',
  nextWork:'Add a compatible instance-segmentation method and independently adjudicated category/subtype/color plus pixel-mask benchmark; then perform signed disposable-owner browser E2E and physical-device cold-load checks.',
  unauthorizedRequests:networkFailures,externalWrites,
  familyAlpha:'HOLD',merged:false,deployed:false,
  engines:reports};
 await writeFile(out+'/report.json',JSON.stringify(maskEvidence,null,2)+'\n');
 console.log('AUTO-SEGMENTATION-53 GENUINE MODEL BENCHMARK COMPLETED '+JSON.stringify({
  realModelRuns:allRows.length,sourceFixtures:photoRows.length,
  engines:Object.fromEntries(Object.entries(reports).map(([engine,data])=>[engine,
   {before:data.before.truePositives,after:data.after.truePositives}])),
  allClassMaskPixelsConserved:true,screenCaptures:Object.values(reports).reduce((n,r)=>n+r.screenshots.length,0),
  newUnseenAccuracy:false,FamilyAlpha:'HOLD'}));
}finally{await new Promise(done=>server.close(done));}
