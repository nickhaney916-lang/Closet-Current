// Real-photograph comparison gate. Differences alone are not accuracy.
// Only independent two-reviewer annotations, anchored to locked source hashes,
// permit numerical precision, recall and IoU. No automatic deployment.
import {scoreApprovedPredictionAtReferenceResolution} from './garment-mask-metrics.mjs';
import {compareCutoutMasks} from './object-cutout-mask.mjs';

const ROUND=x=>Number(x.toFixed(5));
const tol=.002,requiredMeanGain=.01,requiredSingleGain=.01;
export function assessApprovedCutoutComparison(manifest,baselines,candidates,annotations=new Map()){
 if(manifest?.schemaVersion!==1||!Array.isArray(manifest.cases)||manifest.cases.length<6||
    !(baselines instanceof Map)||!(candidates instanceof Map)||!(annotations instanceof Map))
  throw Error('Expected six locked photo cases and prediction maps');
 const seen=new Set(),rows=[],pending=[];
 for(const entry of manifest.cases){
  if(!/^commons-[0-9]{4}$/.test(entry.id)||seen.has(entry.id)||
     entry.image!==entry.id+'.jpg'||!/^[0-9a-f]{64}$/.test(entry.sourceSha256))
   throw Error('Invalid or repeated source identity');
  seen.add(entry.id);
  const base=baselines.get(entry.id),candidate=candidates.get(entry.id);
  if(!base||!candidate||base.image!==entry.image||candidate.image!==entry.image||
     base.sourceSha256!==entry.sourceSha256||candidate.sourceSha256!==entry.sourceSha256)
   throw Error('Missing or unrelated model prediction: '+entry.id);
  const diff=compareCutoutMasks(base,candidate);
  if(entry.reviewStatus!=='approved'||!entry.referenceMask){
   // Unapproved annotation files NEVER supply performance numbers.
   if(entry.referenceMask||entry.reviewStatus==='approved')
    throw Error('Incomplete reference approval: '+entry.id);
   pending.push(entry.id);
   rows.push({id:entry.id,status:'awaiting-independent-reference',
    differences:{...diff},accuracy:null,verifiedImprovement:false});
   continue;
  }
  const annotation=annotations.get(entry.id);
  if(!annotation)throw Error('Approved reference file missing: '+entry.id);
  const prior=scoreApprovedPredictionAtReferenceResolution(annotation,entry,base);
  const next=scoreApprovedPredictionAtReferenceResolution(annotation,entry,candidate);
  const rec=next.garmentRecall-prior.garmentRecall;
  const prec=(next.garmentPrecision??0)-(prior.garmentPrecision??0);
  const iou=next.intersectionOverUnion-prior.intersectionOverUnion;
  const nonRegression=rec>=-tol&&prec>=-tol&&iou>=-tol &&
    next.garmentPrecision!==null;
  rows.push({id:entry.id,status:'independently-scored',
   differences:{...diff},verifiedImprovement:nonRegression&&iou>=requiredSingleGain,
   nonRegression,accuracy:{
    original:{precision:prior.garmentPrecision,recall:prior.garmentRecall,
     intersectionOverUnion:prior.intersectionOverUnion,
     missedFabricPixels:prior.falseNegative,backgroundPixels:prior.falsePositive},
    candidate:{precision:next.garmentPrecision,recall:next.garmentRecall,
     intersectionOverUnion:next.intersectionOverUnion,
     missedFabricPixels:next.falseNegative,backgroundPixels:next.falsePositive},
    change:{precision:ROUND(prec),recall:ROUND(rec),intersectionOverUnion:ROUND(iou),
     missedFabricPixels:next.falseNegative-prior.falseNegative,
     backgroundPixels:next.falsePositive-prior.falsePositive}
   }});
 }
 if(baselines.size!==seen.size||candidates.size!==seen.size||annotations.size>seen.size)
  throw Error('Unexpected candidate or baseline photograph set');
 const scored=rows.filter(x=>x.status==='independently-scored'),
  complete=pending.length===0&&scored.length===manifest.cases.length;
 const averages=complete?{
  originalIoU:ROUND(scored.reduce((n,x)=>n+x.accuracy.original.intersectionOverUnion,0)/scored.length),
  candidateIoU:ROUND(scored.reduce((n,x)=>n+x.accuracy.candidate.intersectionOverUnion,0)/scored.length),
  improvement:ROUND(scored.reduce((n,x)=>n+x.accuracy.change.intersectionOverUnion,0)/scored.length)
 }:null;
 const gatePassed=complete&&scored.every(x=>x.nonRegression)&&
   scored.some(x=>x.verifiedImprovement)&&averages.improvement>=requiredMeanGain;
 return {status:!complete?'awaiting-independent-references':
   gatePassed?'candidate-eligible-for-manual-review':'candidate-rejected-by-evidence',
  candidateQualityGatePassed:gatePassed,approvedCases:scored.length,
  pendingCases:pending,meanIoU:averages,photos:rows,
  requirements:{maxPerPhotoMetricRegression:tol,minAverageIoUGain:requiredMeanGain,
   minOnePhotoIoUGain:requiredSingleGain,requireEveryPhotoApproved:true},
  noCustomerModelChange:true,productionAuthorized:false,
  accuracyMeasured:complete,manualRolloutRequired:true};
}
