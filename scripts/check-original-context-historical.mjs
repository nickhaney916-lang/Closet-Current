/**
 * Re-evaluate ONLY committed historical labels and recognition predictions,
 * never read/download/decode the licensed real-photo JPGs.
 *
 * This is a regression metadata integrity check, not new inference/accuracy.
 */
import fs from 'node:fs';
import {checkRecognitionRegressions} from './check-recognition-regressions.mjs';
const files=[['reviewed-32',32],['holdout-16',16],['fresh-11',11]],cohorts=[];
for(const [name,count]of files){
 const manifest=JSON.parse(fs.readFileSync('benchmark/manifest-'+name+'.json','utf8'));
 const previous=JSON.parse(fs.readFileSync('benchmark/regression-'+name+'.json','utf8'));
 if(manifest.length!==count||previous.results.length!==count)throw Error('Historical result count drift: '+name);
 const unchanged=checkRecognitionRegressions(manifest,previous.results,previous);
 if(!unchanged.passed)throw Error('Historical benchmark regression metadata failed: '+name);
 let garment=0,categoryCorrect=0,exactSubtype=0,acceptedSubtype=0,negative=0,negativeRejected=0,autoIndexed=0;
 const byId=new Map(previous.results.map(v=>[v.id,v]));
 for(const item of manifest){
  const prediction=byId.get(item.id);
  if(item.expectedCategory==='Uncategorized'){negative++;
   if(!prediction.strong&&!prediction.categoryConfirmed&&!prediction.prediction?.category)negativeRejected++;
   continue;
  }
  garment++;
  const category=prediction.prediction?.category===item.expectedCategory;
  categoryCorrect+=Number(category);
  exactSubtype+=Number(category&&prediction.prediction.type===item.expectedType);
  acceptedSubtype+=Number(category&&(item.acceptedTypes||[item.expectedType]).includes(prediction.prediction.type));
  autoIndexed+=Number(prediction.strong);
 }
 cohorts.push({name,items:count,garment,categoryCorrect,exactSubtype,acceptedSubtype,negative,negativeRejected,autoIndexed,
  sourceCommit:previous.sourceCommit,unchangedComparator:true});
}
const total=Object.fromEntries(['items','garment','categoryCorrect','exactSubtype','acceptedSubtype','negative','negativeRejected','autoIndexed'].map(k=>[k,cohorts.reduce((n,x)=>n+x[k],0)]));
const percent=(n,d)=>d?+(100*n/d).toFixed(2):null;
const summary={
 comparison:'historical committed results, unchanged by this research-only branch',
 cohorts,total,
 categoryAccuracyPercent:percent(total.categoryCorrect,total.garment),
 exactSubtypeAccuracyPercent:percent(total.exactSubtype,total.garment),
 acceptedSubtypeAccuracyPercent:percent(total.acceptedSubtype,total.garment),
 newInferenceRuns:0,realPhotosOpened:0,
 interpretation:'No new photo inference or new accuracy; output rechecks previously committed prediction metadata only.'
};
fs.mkdirSync('artifacts/original-context',{recursive:true});
fs.writeFileSync('artifacts/original-context/historical-metadata-only.json',JSON.stringify(summary,null,2)+'\n');
console.log('ORIGINAL_CONTEXT_HISTORICAL_UNCHANGED '+JSON.stringify({total,categoryAccuracyPercent:summary.categoryAccuracyPercent,exactSubtypeAccuracyPercent:summary.exactSubtypeAccuracyPercent,acceptedSubtypeAccuracyPercent:summary.acceptedSubtypeAccuracyPercent}));
