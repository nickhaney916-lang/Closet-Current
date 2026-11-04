/**
 * MASK-31 genuine source-locked real SegFormer inference in Chromium and WebKit.
 * Not a fresh independent human-labeled cohort. The same actual pinned model
 * processes three original JPEGs; we compare old/new component masks from the
 * identical model logits, not a bounding-box union proxy.
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

const SHA=b=>createHash('sha256').update(b).digest('hex');
const root=resolve('.'),out=resolve('benchmark/real-mask-evidence-31');
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
    headers:{'User-Agent':'ClosetCurrentSourceLockedMaskResearch31/1.0'},
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
    const started=await page.evaluate(async ({row,imageData})=>{
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
     await window.runRealMask31({sourceId:row.id,sourceData:imageData,analysisData:inference,
      originalWidth:row.width,originalHeight:row.height,
      annotation:row.regions,
      credit:row.attribution.title+' · '+row.attribution.author+' · '+row.attribution.license+
       ' · '+row.attribution.source,
      expectedSHA:row.sha256});
     return {resized:inference!==imageData};
    },{row,imageData});
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
    const item={id:row.id,originalSHA256:row.sha256,sourceLicense:row.attribution.license,
      sourceOriginalDimensions:[row.width,row.height],originalBytes:row.bytes,resized:started.resized,
      analysisResolution:data.analysisResolution,actualPixelMapDimensions:data.modelMask,
      actualModelLabelMaskSHA256:data.sourceMapLabelsSHA256,
      perClassPixelMembershipUnchanged:true,memberCount:data.familyConservation,
      before:{...before,groups:data.before},after:{...after,groups:data.after},
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
    console.log('MASK-31',engine,row.id,'genuine model masks',
     'before',before.matches.length+'/'+before.expectedCount,
     'after',after.matches.length+'/'+after.expectedCount,
     'sourcePixelsUnchanged=true');
   }
  }finally{await context.close();await browser.close();}
  assert.deepEqual(runtimeErrors,[],'browser JS errors in '+engine);
  reports[engine]={realModelRuns:entries.length,sourceRows:entries,
   before:summarizePhotos(entries.map(x=>x.before)),
   after:summarizePhotos(entries.map(x=>x.after)),
   screenshots,errors:runtimeErrors};
 }
 assert.deepEqual(externalWrites,[]);assert.deepEqual(networkFailures,[]);
 assert.equal(reports.chromium.realModelRuns,3);
 assert.equal(reports.webkit.realModelRuns,3);
 const allRows=Object.values(reports).flatMap(x=>x.sourceRows);
 const maskEvidence={priority:'REAL-SEGFORMER-PIXEL-MASK-31',
  baselinePR:587,previousHead:'7cd43be5e2cdb7be7473ab029a595d6b81e725ee',
  pinnedModel:'Xenova/segformer_b0_clothes@a2489ea8e7ec1ee912190546bad31a4906ccca76',
  originalPhotoCount:3,genuineModelExecutions:6,
  scope:'Three previously seen single-reviewer annotated licensed original JPEGs, not new independent unseen holdout',
  originalSourceSHA256Verified:true,rawModelLabelPixelsUsed:true,
  sameModelOutputUsedForBeforeAndAfter:true,
  pixelMembershipExactlyPreservedByGrouping:true,
  sourceTruePixelMaskIoUAgainstIndependentHumanTruth:false,
  independentBlindAnnotators:0,sourcePhotosChanged:false,
  realPhotoModelAccuracyCertified:false,allSuggestionsRequireReview:true,
  unauthorizedRequests:networkFailures,externalWrites,
  familyAlpha:'HOLD',merged:false,deployed:false,
  engines:reports};
 await writeFile(out+'/report.json',JSON.stringify(maskEvidence,null,2)+'\n');
 console.log('MASK-31 REAL SOURCE-VERIFIED MODEL COMPLETED '+JSON.stringify({
  realModelRuns:6,originals:3,
  chromium:{before:reports.chromium.before.truePositives,
   after:reports.chromium.after.truePositives},
  webkit:{before:reports.webkit.before.truePositives,
   after:reports.webkit.after.truePositives},
  allClassMaskPixelsConserved:true,screenCaptures:10,
  newUnseenAccuracy:false,FamilyAlpha:'HOLD'}));
}finally{await new Promise(done=>server.close(done));}
