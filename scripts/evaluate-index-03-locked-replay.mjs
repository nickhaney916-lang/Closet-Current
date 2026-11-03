#!/usr/bin/env node
/**
 * Reproducible 59 licensed-photo REPLAY of previously recorded real FashionCLIP
 * predictions. Does NOT perform new image inference or pretend to benchmark
 * unverified original-phone photos, colors, masks, latency or physical devices.
 * Validates original fixture SHA-256 and uses exact human-reviewed labels.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {reviewRecognitionForIndex} from '../research/index-03/recognition-index-gate.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const source=read('benchmark/locked-photo-sources.json');
const historic=read('docs/recognition-learning-review-20261026.json');
const grouped=[
 ['reviewed32','benchmark/manifest-reviewed-32.json'],
 ['holdout16','benchmark/manifest-holdout-16.json'],
 ['fresh11','benchmark/manifest-fresh-11.json']
];
const bySource=new Map(source.map(x=>[x.id,x]));
const rows=[],seen=new Set(),perGroup={};
const counters=()=>({count:0,negative:0,automatic:0,review:0,
 correctAutomaticCategory:0,correctAutomaticType:0,
 unsafeConfidentCategory:0,unsafeConfidentType:0,
 categoryCorrectAmongAll:0,typeCorrectAmongAll:0});
const before=counters(),after=counters(),confusionBefore={},confusionAfter={};
const typeConfusionBefore={},typeConfusionAfter={};
const add=(summary,truth,pred,automatic,negative)=>{
 summary.count++;
 if(negative){summary.negative++;return;}
 if(automatic)summary.automatic++;else summary.review++;
 if(truth.category===pred.category)summary.categoryCorrectAmongAll++;
 if(truth.typeCorrect)summary.typeCorrectAmongAll++;
 if(automatic){
  if(truth.category===pred.category)summary.correctAutomaticCategory++;
  else summary.unsafeConfidentCategory++;
  if(truth.typeCorrect)summary.correctAutomaticType++;
  else summary.unsafeConfidentType++;
 }
};
const mark=(matrix,truth,pred)=>{matrix[truth]??={};matrix[truth][pred]=(matrix[truth][pred]||0)+1;};
for(const [name,path] of grouped){
 const manifest=read(path),outcomes=historic.photoEvaluations[name]?.outcomes;
 if(!Array.isArray(outcomes)||outcomes.length!==manifest.length)throw Error('Historical real-photo source absent: '+name);
 const current=new Map(outcomes.map(x=>[x.id,x]));
 const stateBefore=counters(),stateAfter=counters();
 for(const sample of manifest){
  if(seen.has(sample.id)||sample.verified!==true||sample.mode!=='single')
   throw Error('Missing independent verified truth: '+sample.id);
  seen.add(sample.id);
  const previous=current.get(sample.id),meta=bySource.get(sample.id);
  if(!previous||!meta?.verified||!meta.attribution?.license||!meta.sha256)
   throw Error('Missing genuine model output/license/SHA: '+sample.id);
  const bytes=readFileSync(join('benchmark/fixtures',sample.image));
  const actual=createHash('sha256').update(bytes).digest('hex');
  if(actual!==meta.sha256)throw Error('Original licensed JPEG SHA mismatch: '+sample.id);
  if(previous.error)throw Error('Recorded real recognition failure: '+sample.id);
  const negative=sample.expectedCategory==='Uncategorized';
  const pred=previous.prediction||{},accepted=sample.acceptedTypes||[sample.expectedType];
  const truth={category:sample.expectedCategory,typeCorrect:pred.category===sample.expectedCategory&&
   accepted.includes(pred.type)};
  const recognition={strong:previous.strong===true,categoryConfirmed:previous.categoryConfirmed,
   choices:pred.category?[{category:pred.category,itemType:pred.type}]:[],
   details:previous.details||{},reason:previous.reason,
   preprocessingRecovery:previous.preprocessingRecovery===true,diagnostics:previous.diagnostics};
  const gate=reviewRecognitionForIndex({
   ownerId:'locked-benchmark',recordOwnerId:'locked-benchmark',recognition,
   source:{sha256:meta.sha256,verified:true,recognitionFromOriginal:true},
   garmentCount:1
  });
  const autoBefore=previous.strong===true&&!negative,autoAfter=gate.autoIndex&&!negative;
  for(const x of [before,stateBefore])add(x,truth,pred,autoBefore,negative);
  for(const x of [after,stateAfter])add(x,truth,pred,autoAfter,negative);
  if(!negative){mark(confusionBefore,sample.expectedCategory,autoBefore?pred.category||'Unknown':'REVIEW');
   mark(confusionAfter,sample.expectedCategory,autoAfter?gate.category:'REVIEW');
   mark(typeConfusionBefore,sample.expectedType,autoBefore?pred.type||'Unknown':'REVIEW');
   mark(typeConfusionAfter,sample.expectedType,autoAfter?gate.itemType:'REVIEW');}
  rows.push({id:sample.id,cohort:name,expectedCategory:sample.expectedCategory,
   expectedType:sample.expectedType,predictedCategory:pred.category||null,
   predictedType:pred.type||null,beforeAuto:autoBefore,afterAuto:autoAfter,
   categoryCorrect:pred.category===sample.expectedCategory,
   acceptedTypeCorrect:truth.typeCorrect,
   outcome:negative?'NEGATIVE':autoAfter?'AUTO':'REVIEW',
   reviewReasons:gate.reviewReasons,
   sourceSHA256Verified:true,recordedElapsedMs:Number.isFinite(previous.elapsedMs)?previous.elapsedMs:null});
 }
 perGroup[name]={before:stateBefore,after:stateAfter};
}
const pct=(n,d)=>d?Number((100*n/d).toFixed(2)):null;
const view=x=>({...x,automaticTypePrecisionPercent:pct(x.correctAutomaticType,x.automatic),
 automaticCategoryPrecisionPercent:pct(x.correctAutomaticCategory,x.automatic),
 automaticCoveragePercent:pct(x.automatic,x.count-x.negative)});
const garmentRows=rows.filter(r=>r.expectedCategory!=='Uncategorized');
const breakdown=key=>Object.fromEntries([...new Set(garmentRows.map(r=>r[key]))].sort().map(name=>{
 const subset=garmentRows.filter(r=>r[key]===name);
 return [name,{count:subset.length,beforeAutomatic:subset.filter(r=>r.beforeAuto).length,
  afterAutomatic:subset.filter(r=>r.afterAuto).length,
  beforeCorrectTypeAutomatic:subset.filter(r=>r.beforeAuto&&r.acceptedTypeCorrect).length,
  afterCorrectTypeAutomatic:subset.filter(r=>r.afterAuto&&r.acceptedTypeCorrect).length,
  beforeUnsafeConfidentType:subset.filter(r=>r.beforeAuto&&!r.acceptedTypeCorrect).length,
  afterUnsafeConfidentType:subset.filter(r=>r.afterAuto&&!r.acceptedTypeCorrect).length,
  afterReview:subset.filter(r=>!r.afterAuto).length}];
}));
const report={
 mode:'verified-original-fixture / historical-real-inference replay, NOT new model inference',
 historicalRun:historic.validation.realPhotoRun,modelCommit:historic.validatedCandidate,
 expectedOriginals:59,sha256Verified:rows.length,allFromExistingPublicLicensedPhotos:true,
 count:rows.length,before:view(before),after:view(after),
 cohorts:Object.fromEntries(Object.entries(perGroup).map(([k,v])=>[k,{before:view(v.before),after:view(v.after)}])),
 confusionCategoryBefore:confusionBefore,confusionCategoryAfter:confusionAfter,
 confusionTypeBefore:typeConfusionBefore,confusionTypeAfter:typeConfusionAfter,
 byGarmentCategory:breakdown('expectedCategory'),byGarmentType:breakdown('expectedType'),
 perGarment:rows,
 colorAccuracy:null,colorGroundTruthAvailable:false,multigarmentSegmentationMeasured:false,
 processingTimeMs:null,processingTimeEvidenceAvailable:rows.every(x=>x.recordedElapsedMs!==null),
 physicalPhoneTested:false,productionDeployed:false,familyAlpha:'HOLD'
};
if(rows.length!==59||before.unsafeConfidentType<1||after.unsafeConfidentType>before.unsafeConfidentType)
 throw Error('INDEX-03 replay evidence missing or unsafe auto-type regression');
mkdirSync('benchmark/index-03',{recursive:true});
writeFileSync('benchmark/index-03/replay.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({before:report.before,after:report.after,
 cohorts:report.cohorts,sourceVerified:report.sha256Verified,
 colorTruth:report.colorGroundTruthAvailable,latencyMeasured:report.processingTimeEvidenceAvailable},null,2));
