#!/usr/bin/env node
import fs from 'node:fs';
const [manifestPath,baselinePath,candidatePath]=process.argv.slice(2);
if(!manifestPath||!baselinePath||!candidatePath)throw Error('Usage: node scripts/evaluate-classification-accuracy-48.mjs MANIFEST BASELINE_RESULTS CANDIDATE_RESULTS');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const readResults=p=>new Map(JSON.parse(fs.readFileSync(p,'utf8')).map(x=>[x.id,x]));
const baseline=readResults(baselinePath),candidate=readResults(candidatePath);
const pct=(a,b)=>b?+(100*a/b).toFixed(2):null;
function evaluate(results){
 const garments=manifest.filter(x=>x.expectedCategory&&x.expectedCategory!=='Uncategorized');
 const negatives=manifest.filter(x=>x.expectedCategory==='Uncategorized');
 const categoryMatrix={},subtypeMatrix={},perCategory={};let catCorrect=0,typeCorrect=0,semanticTypeCorrect=0,catCoverage=0,subtypeCoverage=0,autoCorrect=0,autoCount=0,unsafe=[];
 const reasons={},latencies=[];
 const cell=(m,a,b)=>{(m[a]??={})[b]=(m[a]?.[b]||0)+1;};
 for(const item of manifest){const r=results.get(item.id);if(!r)throw Error('Missing result '+item.id);if(r.error)throw Error('Inference error '+item.id+': '+r.error);if(Number.isFinite(r.elapsedMs))latencies.push(r.elapsedMs);}
 for(const item of garments){
  const r=results.get(item.id),p=r.prediction||{},category=p.category||'ABSTAIN',type=p.type||'ABSTAIN';
  if(category!=='ABSTAIN')catCoverage++;
  cell(categoryMatrix,item.expectedCategory,category);
  if(category===item.expectedCategory){catCorrect++;const row=perCategory[item.expectedCategory]??={n:0,categoryCorrect:0,subtypeExactCorrect:0,subtypeCoverage:0};row.subtypeExactCorrect+=type===item.expectedType?1:0;}
  const row=perCategory[item.expectedCategory]??={n:0,categoryCorrect:0,subtypeExactCorrect:0,subtypeCoverage:0};row.n++;if(category===item.expectedCategory)row.categoryCorrect++;
  if(type!=='ABSTAIN'&&r.strong)subtypeCoverage++;
  cell(subtypeMatrix,item.expectedType,type);
  if(category===item.expectedCategory&&type===item.expectedType)typeCorrect++;
  const accepted=item.acceptedTypes||[item.expectedType];const correct=category===item.expectedCategory&&accepted.includes(type);
  if(correct)semanticTypeCorrect++;
  if(r.strong&&type!=='ABSTAIN'){row.subtypeCoverage++;if(correct)autoCorrect++;autoCount++;if(!correct)unsafe.push({id:item.id,expectedCategory:item.expectedCategory,expectedType:item.expectedType,predictedCategory:category,predictedType:type,scoreEvidence:r.diagnostics||null});}
  if(category===item.expectedCategory&&type===item.expectedType)row.subtypeExactCorrect++;
  const reason=r.reason|| (r.strong?'accepted':'abstained');reasons[reason]=(reasons[reason]||0)+1;
 }
 let rejected=0,falsePositives=0;
 for(const item of negatives){const r=results.get(item.id),p=r.prediction||{},isRejected=!r.strong&&!r.categoryConfirmed&&(!p.category||p.category==='Uncategorized');if(isRejected)rejected++;else falsePositives++;cell(categoryMatrix,'Uncategorized',isRejected?'Uncategorized':p.category||'UNSAFE_POSITIVE');}
 latencies.sort((a,b)=>a-b);const quantile=q=>latencies.length?latencies[Math.min(latencies.length-1,Math.ceil(q*latencies.length)-1)]:null;
 return {nGarments:garments.length,nNonGarment:negatives.length,category:{correct:catCorrect,accuracyPct:pct(catCorrect,garments.length),coverage:catCoverage,coveragePct:pct(catCoverage,garments.length),confusion:categoryMatrix},subtype:{exactCorrect:typeCorrect,accuracyPct:pct(typeCorrect,garments.length),automaticCorrect:autoCorrect,automaticAccepted:autoCount,automaticPrecisionPct:pct(autoCorrect,autoCount),automaticCoverage:subtypeCoverage,automaticCoveragePct:pct(subtypeCoverage,garments.length),semanticCorrect:semanticTypeCorrect,semanticAccuracyPct:pct(semanticTypeCorrect,garments.length),confusion:subtypeMatrix,unsafeHighConfidenceCount:unsafe.length,unsafeHighConfidenceExamples:unsafe},nonGarment:{rejected,total:negatives.length,falsePositives,rejectionPct:pct(rejected,negatives.length)},perCategory,reasons,latencyMs:{n:latencies.length,median:quantile(.5),p95:quantile(.95)}};
}
const out={schema:'classification-accuracy-48/v1',manifest:manifestPath,partition:manifest.every(x=>x.conditions?.includes('independent-garment-holdout'))?'locked-evaluation':manifest.some(x=>x.conditions?.includes('fresh-independent-validation'))?'validation':'development',baseline:evaluate(baseline),candidate:evaluate(candidate)};
console.log(JSON.stringify(out,null,2));
