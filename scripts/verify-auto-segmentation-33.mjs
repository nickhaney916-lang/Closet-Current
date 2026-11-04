/**
 * AUTO-33 genuine source-locked SegFormer + original-pixel contrast comparison.
 * Not a fresh independent human-labeled cohort. The same actual pinned model
 * processes the same three previously analyzed original JPEGs. We test whether
 * a conservative class-agnostic foreground detector supplies additional
 * review rectangles; it cannot repair semantic classes or claim instances.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
import {isPinnedModelAsset,routePinnedModelAsset}
 from '../research/real-mask-evidence-31/model-assets.mjs';
import {scorePhoto,summarizePhotos}
 from '../research/multi-review-triage-28/frozen-scorer-16.mjs';
import {proposeUnclassifiedContrast33,scoreReviewLocalization33}
 from '../research/auto-segmentation-accuracy-33/contrast-rescue-33.mjs';

const SHA=b=>createHash('sha256').update(b).digest('hex');
const root=resolve('.'),out=resolve('benchmark/auto-segmentation-accuracy-33');
await mkdir(out,{recursive:true});
const sources=JSON.parse(await readFile('research/multi-review-triage-28/frozen-photo-annotations-16.json','utf8'));
const ids=['commons-0021','two-shirts','flatlay-outfit'];
const photoRows=ids.map(id=>{
 const row=sources.find(x=>x.id===id);
 assert.ok(row,'unrecognized licensed source '+id);return row;
});
assert.equal(new Set(photoRows.map(x=>x.sha256)).size,ids.length);
assert.ok(photoRows.every(x=>x.attribution?.source&&x.attribution?.license));
const originalBuffers=new Map();
async function fetchSource(row){
 let failure='';
 for(let attempt=0;attempt<5;attempt++){
  if(attempt)await delay(1700*(attempt+1));
  try{
   const res=await fetch(row.source,{
    headers:{'User-Agent':'ClosetCurrentResearch33/1.0'},
    signal:AbortSignal.timeout(90000)
   });
   if(!res.ok){failure='HTTP '+res.status;await res.body?.cancel();continue}
   const bytes=Buffer.from(await res.arrayBuffer());
   const image=await sharp(bytes,{failOn:'truncated'}).metadata();
   assert.equal(bytes.length,row.bytes,'source original JPEG size changed');
   assert.equal(SHA(bytes),row.sha256,'source original JPEG SHA changed');
   assert.equal(image.format,'jpeg');assert.equal(image.width,row.width);assert.equal(image.height,row.height);
   return bytes;
  }catch(e){failure=e.message;}
 }
 throw Error(row.id+' original unavailable or changed: '+failure);
}
for(const row of photoRows){
 originalBuffers.set(row.id,await fetchSource(row));
 console.log('Verified unchanged licensed original',row.id,row.sha256.slice(0,12),
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
 for(const [engine,launcher] of Object.entries({chromium,webkit})){
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
    const inferenceStarted=Date.now();
    const started=await page.evaluate(async ({row,imageData,engine})=>{
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
     return {resized:inference!==imageData};
    },{row,imageData,engine});
    await page.waitForFunction(()=>window.__realMask31.done,null,{timeout:395000});
    const state=await page.evaluate(()=>window.__realMask31);
    if(state.error||!state.report)throw Error('Actual SegFormer inference failed for '+engine+'/'+row.id+': '+state.error);
    const data=state.report;
    const elapsedMs=Date.now()-inferenceStarted;
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
    // Independent contrast is calculated from the exact verified original,
    // not reconstructed SegFormer masks or synthetic bounding boxes.
    const {data:pixels,info:pixelInfo}=await sharp(jpeg).resize({
      width:512,height:512,fit:'inside',withoutEnlargement:true
    }).raw().toBuffer({resolveWithObject:true});
    const rescue=proposeUnclassifiedContrast33({
      photo:{data:new Uint8Array(pixels),width:pixelInfo.width,
       height:pixelInfo.height,channels:pixelInfo.channels},
      sourceProof:{sourceHashVerified:true,sourceSHA256:row.sha256,
       originalPhoto:{sha256:row.sha256}},
      existing:data.after
    });
    const baselineLoc=scoreReviewLocalization33(row.regions,
      data.after.map(g=>({box:g.crop})));
    const candidateLoc=scoreReviewLocalization33(row.regions,
      [...data.after.map(g=>({box:g.crop})),...rescue.proposals]);
    assert.equal(candidateLoc.expectedCount,baselineLoc.expectedCount);
    assert.equal(candidateLoc.semanticCategoryAccuracy,null);
    // Wrong skirt/dress labels cannot get class credit from unclassified boxes.
    assert.deepEqual(scorePhoto(row.regions,{status:'completed',proposals:post}),after);
    // Yellow review rectangles are distinct from real SegFormer pixel overlay.
    await page.evaluate(({proposals})=>{
      const host=document.getElementById('after');
      for(const stale of document.querySelectorAll('.contrast-33-legend'))stale.remove();
      host.parentElement.querySelector('h2').textContent='SegFormer + unclassified source contrast (review only)';
      for(const proposal of proposals){
        const div=document.createElement('div'),b=proposal.box;
        div.className='box contrast-33-review-only';
        Object.assign(div.style,{left:(100*b.x)+'%',top:(100*b.y)+'%',
          width:(100*b.width)+'%',height:(100*b.height)+'%',
          border:'3px dashed #f5bb23',pointerEvents:'none'});
        div.dataset.unclassified='true';host.append(div);
      }
      const legend=document.createElement('p');legend.className='contrast-33-legend';
      legend.textContent='Yellow dashed = unclassified original-pixel contrast rectangles requiring explicit human review; not model classes, not verified instances.';
      document.getElementById('after-summary').after(legend);
    },{proposals:rescue.proposals});
    assert.equal(await page.evaluate(()=>document.querySelectorAll('.contrast-33-legend').length),1,'a single source contrast legend required');
    const item={id:row.id,originalSHA256:row.sha256,sourceLicense:row.attribution.license,
      sourceOriginalDimensions:[row.width,row.height],originalBytes:row.bytes,resized:started.resized,
      modelInputDecode:engine==='webkit'?'page-canvas-decoded-analysis-JPEG-RGBA':'worker-RawImage-JPEG',
      analysisResolution:data.analysisResolution,actualPixelMapDimensions:data.modelMask,
      actualModelLabelMaskSHA256:data.sourceMapLabelsSHA256,
      perClassPixelMembershipUnchanged:true,memberCount:data.familyConservation,
      before:{...before,groups:data.before},after:{...after,groups:data.after},
      baselineLocalization:baselineLoc,candidateLocalization:candidateLoc,
      contrast:{eligible:rescue.eligible,reason:rescue.reason,
        additionalReviewRegions:rescue.proposals.length,
        allUnclassified:rescue.proposals.every(x=>x.semanticClass===null&&
         x.confirmed===false&&x.automaticSaveAllowed===false),
        boxes:rescue.proposals.map(x=>x.box)},
      actualInferenceElapsedMs:elapsedMs,hostNodeRSSBytes:process.memoryUsage().rss,
      realPinnedONNXInference:true,noGarmentAutoSaved:true,independentHumanPixelMasks:false};
    entries.push(item);
    const widths=row.id==='commons-0021'?[320,390,430]:[390];
    for(const width of widths){
     await page.setViewportSize({width,height:900});
     const filename=engine+'-'+row.id+'-'+width+'.png';
     const png=await page.screenshot({path:out+'/'+filename,fullPage:true});
     const metadata=await sharp(png).metadata();
     assert.equal(metadata.format,'png');assert.equal(metadata.width,width);
     assert.ok(png.length>11000&&metadata.height>=650);
     screenshots.push({sourceId:row.id,engine,width,filename,sha256:SHA(png),
      sourceSHA256:row.sha256,actualModelMaskSHA256:data.sourceMapLabelsSHA256,
      realModelExecuted:true});
    }
    await page.setViewportSize({width:390,height:880});
    console.log('AUTO-33',engine,row.id,'genuine ONNX + source contrast',
     'before',before.matches.length+'/'+before.expectedCount,
     'after',after.matches.length+'/'+after.expectedCount,
     'unclassified',rescue.proposals.length,
     'localized',baselineLoc.correctlyLocalized+'->'+candidateLoc.correctlyLocalized,
     'sourcePixelsUnchanged=true');
   }
  }finally{await context.close();await browser.close();}
  assert.deepEqual(runtimeErrors,[],'browser JS errors in '+engine);
  reports[engine]={realModelRuns:entries.length,sourceRows:entries,
   before:summarizePhotos(entries.map(x=>x.before)),
   after:summarizePhotos(entries.map(x=>x.after)),
   baselineLocalizationMatched:entries.reduce((s,x)=>s+x.baselineLocalization.correctlyLocalized,0),
   candidateLocalizationMatched:entries.reduce((s,x)=>s+x.candidateLocalization.correctlyLocalized,0),
   unclassifiedAdditionalProposals:entries.reduce((s,x)=>s+x.contrast.additionalReviewRegions,0),
   screenshots,errors:runtimeErrors};
 }
 assert.deepEqual(externalWrites,[]);assert.deepEqual(networkFailures,[]);
 assert.equal(reports.chromium.realModelRuns,3);
 assert.equal(reports.webkit.realModelRuns,3);
 const allRows=Object.values(reports).flatMap(x=>x.sourceRows);
 const maskEvidence={priority:'AUTO-SEGMENTATION-ACCURACY-33',
  baselinePR:589,previousHead:'79e957719bd90f7f1cd1ae71ec4bde5ff14ae93c',
  pinnedModel:'Xenova/segformer_b0_clothes@a2489ea8e7ec1ee912190546bad31a4906ccca76',
  originalPhotoCount:3,genuineModelExecutions:6,
  scope:'Three previously seen single-reviewer annotated licensed original JPEGs, not new independent unseen holdout',
  originalSourceSHA256Verified:true,rawModelLabelPixelsUsed:true,
  sameModelOutputUsedForBeforeAndAfter:true,
  contrastSource:'actual decoded SHA-locked original JPEG pixels, class agnostic',
  automaticSemanticImprovementClaimed:false,
  untouchedNewPhotoCohort:false,independentSecondReviewer:false,
  pairedCandidateModelClassScoreUnchanged:true,
  pixelMembershipExactlyPreservedByGrouping:true,
  sourceTruePixelMaskIoUAgainstIndependentHumanTruth:false,
  independentBlindAnnotators:0,sourcePhotosChanged:false,
  realPhotoModelAccuracyCertified:false,allSuggestionsRequireReview:true,
  unauthorizedRequests:networkFailures,externalWrites,
  familyAlpha:'HOLD',merged:false,deployed:false,
  engines:reports};
 await writeFile(out+'/report.json',JSON.stringify(maskEvidence,null,2)+'\n');
 console.log('AUTO-33 REAL SOURCE-VERIFIED MODEL AND ORIGINAL CONTRAST COMPLETED '+JSON.stringify({
  realModelRuns:6,originals:3,
  chromium:{before:reports.chromium.before.truePositives,
   after:reports.chromium.after.truePositives},
  webkit:{before:reports.webkit.before.truePositives,
   after:reports.webkit.after.truePositives},
  allClassMaskPixelsConserved:true,screenCaptures:10,
  originalContrastOnly:true,scientificVerdict:'NEEDS REWORK',
  newUnseenAccuracy:false,FamilyAlpha:'HOLD'}));
}finally{await new Promise(done=>server.close(done));}
