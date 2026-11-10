/** Actual integrated SegFormer worker vs externally supplied human polygons.
 * This is exploratory semantic mask/category evidence, not owner review,
 * exact subtype/color truth, instance identity, model licensing or 3D proof.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {routePinnedModelAsset,isPinnedModelAsset} from '../research/real-mask-evidence-31/model-assets.mjs';
import {measureRegisteredBoundaries66} from '../research/real-garment-acceptance-66/boundary-evidence.mjs';
import {scoreInstances} from '../research/mission1-external-human-evidence/instance-metrics.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const additionalP792=process.env.MISSION1_NEW_PUBLISHER_COHORT_792==='research';
const manifest=JSON.parse(await readFile(additionalP792?
 'benchmark/mission1-additional-publisher-originals-792/manifest.json':
 'research/real-garment-acceptance-66/fashionpedia-sample.json','utf8'));
const engine=process.env.MISSION1_ENGINE||'chromium',
 out=(additionalP792?'benchmark/mission1-additional-publisher-originals-792/':
 'benchmark/mission1-seeded-boundary-recovery/')+engine;
if(additionalP792&&(
 manifest.schema!=='m1-p792-additional-publisher-originals-research-not-holdout/v1'||
 manifest.rows?.length!==10||
 manifest.releaseAuthorized!==false||
 manifest.trainingCorpusOverlapIndependentlyExcluded!==false||
 manifest.publisherAnnotatedImageRightsIndependentlyCleared!==false))
 throw Error('P792 must use all 10 strictly research-only genuine newly development-exposed source images');
const workerSource=await readFile('research/real-mask-evidence-31/worker.mjs','utf8');
const anchor='selectedMaskSHA256:await sha(g.selected),';
assert.equal(workerSource.split(anchor).length,2);
let instrumentedWorker=workerSource.replace(anchor,anchor+"selectedMaskBase64:btoa(Array.from(g.selected,x=>String.fromCharCode(x)).join('')),");
await mkdir(out,{recursive:true});
assert.equal(workerSource.split('const results={sourceId:req.sourceId,').length,2);
assert.equal(workerSource.split('after:await Promise.all(after.map(describe)),').length,2);
instrumentedWorker=instrumentedWorker.replace('const results={sourceId:req.sourceId,',"const {seededBoundaryReview}=await import('../mission1-seeded-boundary-recovery/review-growth.mjs');const grown=seededBoundaryReview({data:logits.logits.data,dims:logits.logits.dims,map,groups:after});const allClass=seededBoundaryReview({data:logits.logits.data,dims:logits.logits.dims,map,groups:after,recoverFootwear:true});const results={sourceId:req.sourceId,");
instrumentedWorker=instrumentedWorker.replace('after:await Promise.all(after.map(describe)),',"after:await Promise.all(after.map(describe)),allClassGrowth:await Promise.all(allClass.map(describe)),reviewGrowth:await Promise.all(grown.map(async g=>({...await describe(g),seedPixelCount:g.seedPixelCount,addedPixelCount:g.addedPixelCount,maximumAddedPixels:g.maximumAddedPixels,boundaryReviewConfidence:g.boundaryReviewConfidence,accepted:g.accepted,needsReview:g.needsReview}))),");
const source=[];
for(const row of manifest.rows){
 const bytes=await readFile((additionalP792?
 'benchmark/mission1-additional-publisher-originals-792/originals/':
 'benchmark/real-garment-acceptance-66/fashionpedia/')+row.file_name);
 assert.equal(hash(bytes),row.sha256);source.push({row,data:'data:image/jpeg;base64,'+bytes.toString('base64')});
}
const server=createServer(async(req,res)=>{
 try{
  const p=new URL(req.url,'http://localhost').pathname;
  if(req.method!=='GET'||p.includes('..')||p.includes('\\'))throw Error('bad research route');
  if(p==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font:14px sans-serif;margin:10px"><h2>Public photograph · model / human mask</h2><p id="status"></p><canvas id="photo"></canvas><p>Fashionpedia human polygons · Pexels photos. Research only. No owner approval or 3D reconstruction.</p></body></html>');return;}
  if(!/^\/(research|public)\/[\w/.-]+\.mjs$/.test(p))throw Error('bad file');
  res.writeHead(200,{'content-type':'text/javascript'}).end(p==='/research/real-mask-evidence-31/worker.mjs'?instrumentedWorker:await readFile(resolve('.'+p)));
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser;const rows=[],screens=[];
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width:390,height:880},isMobile:true,hasTouch:true,serviceWorkers:'block'}),cache=new Map();
 await context.route('**/*',async route=>{
  if(!['GET','HEAD'].includes(route.request().method()))return route.abort();
  const url=route.request().url();if(url.startsWith(origin+'/'))return route.continue();
  if(isPinnedModelAsset(url))return routePinnedModelAsset(route,cache);
  return route.abort();
 });
 const page=await context.newPage();await page.goto(origin+'/');
 for(const {row,data} of source){
  const result=await page.evaluate(async({row,data})=>{
   const image=new Image();image.src=data;await image.decode();
   if(image.naturalWidth!==row.width||image.naturalHeight!==row.height)throw Error('original dimensions mismatch');
   const decoded=document.createElement('canvas');decoded.width=row.width;decoded.height=row.height;
   decoded.getContext('2d').drawImage(image,0,0);const rgba=decoded.getContext('2d').getImageData(0,0,row.width,row.height).data;
   window.worker66??=new Worker('/research/real-mask-evidence-31/worker.mjs',{type:'module'});
   const id=row.id,worker=window.worker66;
   const r=await new Promise((done,reject)=>{
    const timeout=setTimeout(()=>reject(Error('actual model timeout')),390000);
    worker.onmessage=e=>{if(e.data.id!==id)return;if(e.data.type==='done'){clearTimeout(timeout);done(e.data.result);}if(e.data.type==='error'){clearTimeout(timeout);reject(Error(JSON.stringify(e.data)));}};
    worker.postMessage({id,sourceId:'fashionpedia-'+id,analysisImage:data,originalWidth:row.width,originalHeight:row.height,analysisRGBA:rgba,analysisWidth:row.width,analysisHeight:row.height},[rgba.buffer]);
   });
   const [w,h]=r.modelMask;if(w>192||h>192)throw Error('unexpected model raster dimensions');
   const predicted=Uint8Array.from(atob(r.labelMapBase64),x=>x.charCodeAt(0));
   const categoryMap={0:4,1:4,2:4,3:4,4:4,5:4,6:6,7:6,8:5,9:4,10:7,23:9};
   const masks=[],truthInstances=[];
   const allRegions=new Set([...row.annotations.map(a=>categoryMap[a.category_id]),...Array.from(predicted).filter(x=>[4,5,6,7,9].includes(x))]);
   if(allRegions.has(undefined))throw Error('unmapped external ontology');
   for(const region of allRegions){
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.fillStyle='white';
    for(const a of row.annotations.filter(a=>categoryMap[a.category_id]===region)){
     if(!Array.isArray(a.segmentation))throw Error('unsupported RLE truth');
     for(const polygon of a.segmentation){ctx.beginPath();for(let i=0;i<polygon.length;i+=2){const x=polygon[i]/row.width*w,y=polygon[i+1]/row.height*h;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();}
    }
    const truth=Uint8Array.from(ctx.getImageData(0,0,w,h).data.filter((_,i)=>i%4===3),a=>a>=128?1:0);
    const prediction=Uint8Array.from(predicted,x=>x===region?1:0);
    let intersection=0,union=0,gt=0,pr=0;
    for(let i=0;i<truth.length;i++){gt+=truth[i];pr+=prediction[i];intersection+=truth[i]&prediction[i];union+=truth[i]|prediction[i];}
    masks.push({region,truth:Array.from(truth),prediction:Array.from(prediction),intersection,union,truthPixels:gt,predictedPixels:pr});
   }
   for(const a of row.annotations){
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;const cx=cv.getContext('2d');cx.fillStyle='white';
    for(const poly of a.segmentation){cx.beginPath();for(let i=0;i<poly.length;i+=2){const x=poly[i]/row.width*w,y=poly[i+1]/row.height*h;i?cx.lineTo(x,y):cx.moveTo(x,y);}cx.closePath();cx.fill();}
    const pixels=cx.getImageData(0,0,w,h).data;
    truthInstances.push({id:'annotation-'+a.id,region:categoryMap[a.category_id],mask:Array.from({length:w*h},(_,i)=>pixels[i*4+3]>=128?1:0)});
   }
   const allClassInstances=r.allClassGrowth.map(g=>({id:g.instanceKey,region:g.regionId,mask:Array.from(atob(g.selectedMaskBase64),x=>x.charCodeAt(0)),maskSHA256:g.selectedMaskSHA256}));
   const growthInstances=r.reviewGrowth.map(g=>({id:g.instanceKey,region:g.regionId,mask:Array.from(atob(g.selectedMaskBase64),x=>x.charCodeAt(0)),maskSHA256:g.selectedMaskSHA256,seedPixelCount:g.seedPixelCount,addedPixelCount:g.addedPixelCount,maximumAddedPixels:g.maximumAddedPixels,boundaryReviewConfidence:g.boundaryReviewConfidence,accepted:g.accepted,needsReview:g.needsReview}));
   const predictionInstances=r.after.map(g=>({id:g.instanceKey,region:g.regionId,mask:Array.from(atob(g.selectedMaskBase64),x=>x.charCodeAt(0)),maskSHA256:g.selectedMaskSHA256}));
   const c=document.querySelector('#photo');c.width=350;c.height=Math.round(350*row.height/row.width);const ctx=c.getContext('2d');ctx.drawImage(image,0,0,c.width,c.height);
   const layer=document.createElement('canvas');layer.width=w;layer.height=h;const lc=layer.getContext('2d'),px=lc.createImageData(w,h);
   for(let i=0;i<predicted.length;i++)if(predictionInstances.some(g=>g.mask[i]))px.data.set([230,60,40,100],i*4);lc.putImageData(px,0,0);ctx.drawImage(layer,0,0,c.width,c.height);
   ctx.strokeStyle='#00ff30';ctx.lineWidth=1.5;
   for(const a of row.annotations)for(const polygon of a.segmentation){ctx.beginPath();for(let i=0;i<polygon.length;i+=2){const x=polygon[i]/row.width*c.width,y=polygon[i+1]/row.height*c.height;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();}
   ctx.strokeStyle='#00b7ff';ctx.lineWidth=1;ctx.setLineDash([3,2]);
   for(const group of predictionInstances){let left=w,top=h,right=0,bottom=0;for(let i=0;i<group.mask.length;i++)if(group.mask[i]){const x=i%w,y=Math.floor(i/w);left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}ctx.strokeRect(left/w*c.width,top/h*c.height,(right-left)/w*c.width,(bottom-top)/h*c.height);}
   document.querySelector('#status').textContent='Image '+row.id+' · red baseline proposal pixels; green human contours; blue proposal boxes';
   let grownCanvas=document.querySelector('#grown');if(!grownCanvas){const caption=document.createElement('p');caption.textContent='Garment-only boundary candidate · footwear preserved · owner review REQUIRED · source unchanged';document.body.appendChild(caption);grownCanvas=document.createElement('canvas');grownCanvas.id='grown';document.body.appendChild(grownCanvas);}
   grownCanvas.width=c.width;grownCanvas.height=c.height;const gc=grownCanvas.getContext('2d');gc.drawImage(image,0,0,c.width,c.height);
   const overlay=document.createElement('canvas');overlay.width=w;overlay.height=h;const oc=overlay.getContext('2d'),op=oc.createImageData(w,h);
   for(const g of growthInstances)for(let i=0;i<g.mask.length;i++)if(g.mask[i])op.data.set([230,60,40,100],i*4);oc.putImageData(op,0,0);gc.drawImage(overlay,0,0,c.width,c.height);
   gc.strokeStyle='#00ff30';gc.lineWidth=1.5;for(const a of row.annotations)for(const poly of a.segmentation){gc.beginPath();for(let i=0;i<poly.length;i+=2){const x=poly[i]/row.width*c.width,y=poly[i+1]/row.height*c.height;i?gc.lineTo(x,y):gc.moveTo(x,y);}gc.closePath();gc.stroke();}
   return {width:w,height:h,masks,truthInstances,predictionInstances,growthInstances,allClassInstances,modelMaskSHA256:r.sourceMapLabelsSHA256,model:r.model,revision:r.modelRevision};
  },{row,data});
  const measured=result.masks.map(m=>{
   let boundary=null;if(m.truthPixels&&m.predictedPixels)boundary=measureRegisteredBoundaries66({sourcePixels:Uint8Array.from(m.truth),ownerPixels:Uint8Array.from(m.prediction),width:result.width,height:result.height});
   return {semanticRegion:m.region,intersection:m.intersection,union:m.union,truthPixels:m.truthPixels,predictedPixels:m.predictedPixels,iou:m.union?m.intersection/m.union:null,boundary,missed:m.predictedPixels===0};
  });
  for(const p of [...result.predictionInstances,...result.growthInstances,...result.allClassInstances])assert.equal(hash(Uint8Array.from(p.mask)),p.maskSHA256);
  const allClassInstances=scoreInstances({truth:result.truthInstances,predictions:result.allClassInstances,width:result.width,height:result.height});
  const candidateInstances=scoreInstances({truth:result.truthInstances,predictions:result.growthInstances,width:result.width,height:result.height});
  const candidateNonFootwear=scoreInstances({truth:result.truthInstances.filter(x=>x.region!==9),predictions:result.growthInstances.filter(x=>x.region!==9),width:result.width,height:result.height});
  const groupedIoU=predictions=>{const regions=new Set([...result.truthInstances.map(x=>x.region),...predictions.map(x=>x.region)]);const scores=[];for(const region of regions){let intersection=0,union=0;const t=result.truthInstances.filter(x=>x.region===region),p=predictions.filter(x=>x.region===region);for(let i=0;i<result.width*result.height;i++){const a=t.some(x=>x.mask[i]),b=p.some(x=>x.mask[i]);intersection+=Number(a&&b);union+=Number(a||b);}scores.push({region,intersection,union,iou:union?intersection/union:null});}return scores;};
  const beforeGroupedIoU=groupedIoU(result.predictionInstances),candidateGroupedIoU=groupedIoU(result.growthInstances);
  for(let g=0;g<result.growthInstances.length;g++){const grown=result.growthInstances[g],seed=result.predictionInstances[g];assert.equal(grown.id,seed.id);assert.equal(grown.region,seed.region);assert.equal(grown.accepted,false);assert.equal(grown.needsReview,true);assert.ok(grown.addedPixelCount<=grown.maximumAddedPixels);for(let i=0;i<seed.mask.length;i++)if(seed.mask[i])assert.equal(grown.mask[i],1);}
  const instances=scoreInstances({truth:result.truthInstances,predictions:result.predictionInstances,width:result.width,height:result.height});
  const nonFootwear=scoreInstances({truth:result.truthInstances.filter(x=>x.region!==9),predictions:result.predictionInstances.filter(x=>x.region!==9),width:result.width,height:result.height});
  const lostBaselineMatchIds=instances.matches.filter(m=>!candidateInstances.matches.some(a=>a.truthId===m.truthId)).map(m=>m.truthId);
  const gainedMatchIds=candidateInstances.matches.filter(m=>!instances.matches.some(a=>a.truthId===m.truthId)).map(m=>m.truthId);
  rows.push({lostBaselineMatchIds,gainedMatchIds,instances,nonFootwear,candidateInstances,candidateNonFootwear,allClassInstances,beforeGroupedIoU,candidateGroupedIoU,candidateReceipts:result.growthInstances.map(({id,maskSHA256,seedPixelCount,addedPixelCount,maximumAddedPixels,boundaryReviewConfidence,accepted,needsReview})=>({id,maskSHA256,seedPixelCount,addedPixelCount,maximumAddedPixels,boundaryReviewConfidence,accepted,needsReview})),predictionMaskReceipts:result.predictionInstances.map(({id,region,maskSHA256})=>({id,region,maskSHA256})),id:row.id,sourceSHA256:row.sha256,modelMaskSHA256:result.modelMaskSHA256,model:result.model,revision:result.revision,publisherHumanInstances:row.annotations.length,measured});
  const name='fashionpedia-'+row.id+'.png';await page.screenshot({path:out+'/'+name,fullPage:true});screens.push({name,sha256:hash(await readFile(out+'/'+name))});
  console.log('P66 actual model/human mask',engine,row.id,measured.map(m=>({class:m.semanticRegion,iou:m.iou})));
 }
 for(const frame of screens)assert.equal(hash(await readFile(out+'/'+frame.name)),frame.sha256);
 const allRegions=rows.flatMap(r=>r.measured),regions=allRegions.filter(m=>m.truthPixels>0);
 const aggregate=key=>{const values=rows.map(r=>r[key]);const tp=values.reduce((n,r)=>n+r.truePositives,0),fp=values.reduce((n,r)=>n+r.falsePositives,0),fn=values.reduce((n,r)=>n+r.falseNegatives,0);return {truePositives:tp,falsePositives:fp,falseNegatives:fn,precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null,f1:2*tp+fp+fn?2*tp/(2*tp+fp+fn):null};};
 const summary={allClassExploratoryArm:aggregate('allClassInstances'),candidateInstanceDiagnostic:aggregate('candidateInstances'),candidateNonFootwearDiagnostic:aggregate('candidateNonFootwear'),baselineGroupedSemanticIoU:rows.flatMap(r=>r.beforeGroupedIoU).reduce((n,m)=>n+m.iou,0)/rows.flatMap(r=>r.beforeGroupedIoU).length,candidateGroupedSemanticIoU:rows.flatMap(r=>r.candidateGroupedIoU).reduce((n,m)=>n+m.iou,0)/rows.flatMap(r=>r.candidateGroupedIoU).length,totalCandidateAddedPixels:rows.flatMap(r=>r.candidateReceipts).reduce((n,r)=>n+r.addedPixelCount,0),publishedInstanceDiagnostic:aggregate('instances'),nonFootwearDiagnostic:aggregate('nonFootwear'),predictedOnlySemanticRegions:allRegions.filter(m=>!m.truthPixels&&m.predictedPixels).length,meanActiveSemanticIoU:allRegions.reduce((n,m)=>n+m.iou,0)/allRegions.length,semanticRegions:regions.length,meanSemanticIoU:regions.reduce((n,m)=>n+m.iou,0)/regions.length,
  regionsAtIoU50:regions.filter(m=>m.iou>=.5).length,missedSemanticRegions:regions.filter(m=>m.missed).length,
  meanExteriorBoundaryF1IncludingMisses:regions.reduce((n,m)=>n+(m.boundary?.boundaryF1||0),0)/regions.length,
  noBaselineInstanceLoss:rows.every(r=>r.lostBaselineMatchIds.length===0),noNewInstanceFalsePositives:rows.every(r=>r.candidateInstances.falsePositives<=r.instances.falsePositives),humanTruthSource:'publisher-provided Fashionpedia polygons; not agent annotations or owner review',
  officialFashionpediaAP:false,renderingFailures:0,
  additionalPublisherSourcesNotIndependentlyHumanBlinded:additionalP792,
  modelTrainingOverlapNotExcluded:additionalP792};
 summary.developmentVerdict=summary.noBaselineInstanceLoss&&summary.noNewInstanceFalsePositives&&summary.candidateInstanceDiagnostic.truePositives>summary.publishedInstanceDiagnostic.truePositives&&summary.candidateGroupedSemanticIoU>=summary.baselineGroupedSemanticIoU?'OBSERVED_GAIN_ON_EXPOSED_DEVELOPMENT_COHORT_ONLY':'MIXED_OR_NO_GAIN_RESEARCH_ONLY';
 await writeFile(out+'/results.json',JSON.stringify({engine,summary,photos:rows.length,publisherHumanInstances:rows.reduce((n,r)=>n+r.publisherHumanInstances,0),
  additionalPublisherSourceCohortP792:additionalP792,
  rawPublisherRightsMetadataNotVerifiedForCommerce:additionalP792,
  newlyEnrolledBlindedHumanHoldout:false,
  rows,screens,exactAppSubtypeAccuracy:null,primaryColorAccuracy:null,officialInstanceAP:null,instanceMetricDefinition:'Maximum-cardinality one-to-one same semantic family raster-mask matching at IoU >=0.5; actual app grouping masks. Publisher annotates individual shoes; app can pair shoes, so non-footwear diagnostic is reported separately without dropping shoes from all-instance totals.',workerSourceSHA256:hash(workerSource),instrumentedWorkerSHA256:hash(instrumentedWorker),instrumentation:'Baseline model and grouping unchanged; original logits also produce capped seeded boundary review candidates; no shipping app changes',newGarment3DAccepted:0,ownerReviews:0,exploratoryNotGuaranteedTrainingUnseen:true,photoRights:'Dataset-reported Pexels license; per-photo original source page not supplied by publisher',familyAlpha:'HOLD',releaseAuthorized:false},null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
