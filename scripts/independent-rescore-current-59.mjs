// Independently re-score immutable PR #213 model-output JSON, no image/model/runtime reads.
// The replay is NOT a fresh neural inference and manifest labels are NOT independent human masks.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
export const COHORTS=['reviewed-32','holdout-16','fresh-11'];
export function rescore(source,manifests,lockedSources){
 if(!source?.provenance?.sourceCommit||!Array.isArray(source.rows))throw Error('Missing frozen provenance or rows');
 const sourceMap=new Map(lockedSources.map(x=>[x.id,x]));
 const expected=new Map();
 for(const cohort of COHORTS){
  const manifest=manifests[cohort];
  if(!Array.isArray(manifest)||manifest.length!==Number(cohort.split('-')[1]))throw Error('Missing immutable '+cohort);
  for(const row of manifest){
   if(expected.has(row.id))throw Error('Duplicate manifest source '+row.id);
   expected.set(row.id,{...row,cohort});
  }
 }
 const seen=new Set(),byCohort={},byCategory={},unsafeSubtypeIds=[],wrongCategoryIds=[],abstentionIds=[],changedHistoricalIds=[];
 let correct=0,garments=0,negativeControls=0,rejectedControls=0,automatic=0,wrongAutomatic=0,errors=0;
 for(const r of source.rows){
  if(!r?.id||seen.has(r.id))throw Error('Duplicate or blank candidate source');
  seen.add(r.id);
  const m=expected.get(r.id),s=sourceMap.get(r.id);
  if(!m||m.cohort!==r.cohort)throw Error('Missing or reassigned immutable source '+r.id);
  if(!s||s.sha256!==r.originalSHA256)throw Error('Original source hash mismatch '+r.id);
  const types=m.acceptedTypes||[m.expectedType];
  if(r.expectedCategory!==m.expectedCategory||JSON.stringify(r.acceptedTypes)!==JSON.stringify(types))
   throw Error('Changed manifest truth '+r.id);
  const p=r.current?.prediction;
  if(!p||typeof r.current.strong!=='boolean'||typeof r.current.categoryConfirmed!=='boolean')throw Error('Malformed model output '+r.id);
  if(r.current.error)errors++;
  const c=byCohort[r.cohort]??={photos:0,garments:0,categoryCorrect:0,categoryAbstentions:0,automatic:0,wrongAutomatic:0,controls:0,rejectedControls:0};
  c.photos++;
  const historical=r.historical;
  if(!historical?.prediction||typeof historical.strong!=='boolean')throw Error('Missing historical observation '+r.id);
  if(JSON.stringify(historical.prediction)!==JSON.stringify(p)||historical.strong!==r.current.strong)changedHistoricalIds.push(r.id);
  if(m.expectedCategory==='Uncategorized'){
   negativeControls++;c.controls++;
   if(!p.category||p.category==='Uncategorized'){rejectedControls++;c.rejectedControls++;}
   else wrongCategoryIds.push(r.id);
   if(r.current.strong){wrongAutomatic++;c.wrongAutomatic++;}
   continue;
  }
  garments++;c.garments++;
  const category=byCategory[m.expectedCategory]??={total:0,correct:0,abstained:0,unsafeAuto:0};
  category.total++;
  const isCorrect=p.category===m.expectedCategory;
  if(isCorrect){correct++;c.categoryCorrect++;category.correct++;}
  else if(!p.category||p.category==='Uncategorized'){c.categoryAbstentions++;category.abstained++;abstentionIds.push(r.id);}
  else wrongCategoryIds.push(r.id);
  if(r.current.strong){
   automatic++;c.automatic++;
   if(!isCorrect||!types.includes(p.type)){
    wrongAutomatic++;c.wrongAutomatic++;category.unsafeAuto++;unsafeSubtypeIds.push(r.id);
   }
  }
 }
 if(seen.size!==expected.size||expected.size!==59)throw Error('Missing/extra original sources');
 const promotionBlocked=wrongAutomatic>0||wrongCategoryIds.length>0||abstentionIds.length>0||errors>0;
 return {evidence:'OFFLINE_RESCORE_OF_WORK_COMMITTED_MODEL_OUTPUTS_NOT_NEW_INFERENCE',
  provenance:source.provenance,totals:{photos:seen.size,garments,correctBroadCategories:correct,
  broadAccuracyPercent:Number((100*correct/garments).toFixed(2)),categoryAbstentions:abstentionIds.length,
  automaticDecisions:automatic,wrongAutomatic,unsafeAutoPercent:Number((100*wrongAutomatic/automatic).toFixed(2)),
  negativeControls,rejectedControls,errors},byCohort,byCategory,unsafeSubtypeIds:unsafeSubtypeIds.sort(),
  wrongCategoryIds:wrongCategoryIds.sort(),abstentionIds:abstentionIds.sort(),
  changedHistoricalIds:changedHistoricalIds.sort(),
  modelPromotionBlocked:promotionBlocked,independentPhysicalMasks:false,
  originalBytesIndependentlyRead:false,realPhoneVerified:false,
  releaseApproved:false};
}
export function fromRepository(fixturePath='benchmark/ISSUE-211-FROZEN-CURRENT-59.json'){
 return rescore(read(fixturePath),
  Object.fromEntries(COHORTS.map(c=>[c,read('benchmark/manifest-'+c+'.json')])),
  read('benchmark/locked-photo-sources.json'));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const report=fromRepository(process.argv[2]);
 const out=process.argv[3]||'artifacts/recognition-guard/independent-current-rescore.json';
 mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log('INDEPENDENT_SOURCE_LOCKED_REPLAY '+JSON.stringify(report.totals));
 console.log('PROMOTION_BLOCKED '+report.modelPromotionBlocked+'; source photos and model NOT rerun');
 if(!report.modelPromotionBlocked)throw Error('Unexpected acceptance: candidate must still be independently approved');
}
