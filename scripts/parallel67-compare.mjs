import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {localCandidates} from '../public/local-catalog.mjs';
const byLabel=new Map(localCandidates.map(x=>[x.label,x]));
const wilson=(n,d)=>{if(!d)return null;const z=1.96,p=n/d,a=1+z*z/d,b=(p+z*z/(2*d))/a,c=z*Math.sqrt(p*(1-p)/d+z*z/(4*d*d))/a;return {correct:n,total:d,percent:100*p,interval95:[100*(b-c),100*(b+c)]};};
const percentile=(values,p)=>values.toSorted((a,b)=>a-b)[Math.max(0,Math.ceil(values.length*p)-1)];
export function compare67(baseline,candidate,manifest){
 if(baseline.engine!==candidate.engine||baseline.model!=='baseline'||candidate.model!=='marqo'||baseline.cohort!=='new'||candidate.cohort!=='new'||baseline.manifestSha256!==candidate.manifestSha256||baseline.networkViolations?.length||candidate.networkViolations?.length||baseline.rows?.length!==manifest.rows.length||candidate.rows?.length!==manifest.rows.length)throw Error('Incomplete or incompatible real-source comparison');
 const expected=new Map(manifest.rows.map(x=>[x.id,x]));
 const normalize=data=>{
  const seen=new Set();return data.rows.map(row=>{
   const truth=expected.get(row.id);if(!truth||seen.has(row.id)||truth.sha256!==row.sha256||row.type!=='result'||!Number.isFinite(row.elapsedMs)||row.elapsedMs<0)throw Error('Missing, duplicate, altered or failed original');seen.add(row.id);
   if(row.expectedCategory!==truth.expectedCategory||row.expectedType!==truth.expectedType)throw Error('Frozen labels altered');
   const raw=byLabel.get(row.raw?.[0]?.label);if(!raw)throw Error('Missing actual raw candidate');
   const accepted=truth.acceptedTypes||[truth.expectedType],garment=truth.expectedCategory!=='Uncategorized',subtypeEligible=garment&&!truth.subtypeAmbiguous;
   const strong=row.proposal?.strong===true,choice=row.proposal?.choices?.[0];
   return {id:row.id,expectedCategory:truth.expectedCategory,expectedType:truth.expectedType,garment,subtypeEligible,
    rawCategory:raw.category,rawType:raw.itemType,rawCategoryCorrect:raw.category===truth.expectedCategory,
    rawSubtypeCorrect:subtypeEligible?accepted.includes(raw.itemType):null,
    strong,wrongStrongCategory:strong&&(!garment||choice?.category!==truth.expectedCategory),wrongStrongSubtype:subtypeEligible&&strong&&!accepted.includes(choice?.itemType),
    correctStrongSubtype:subtypeEligible&&strong&&accepted.includes(choice?.itemType),elapsedMs:row.elapsedMs};
  });
 };
 const b=normalize(baseline),c=normalize(candidate);
 for(const row of candidate.rows)if(row.result?.strong!==false||row.result?.requiresReview!==true||Object.keys(row.result?.details||{}).length)throw Error('Experimental prediction escaped review gate');
 const summarize=rows=>{
  const g=rows.filter(x=>x.garment),t=rows.filter(x=>x.subtypeEligible),n=rows.filter(x=>!x.garment);
  const perCategory={};for(const category of new Set(g.map(x=>x.expectedCategory))){const group=g.filter(x=>x.expectedCategory===category);perCategory[category]=wilson(group.filter(x=>x.rawCategoryCorrect).length,group.length);}
  const perSubtype={};for(const subtype of new Set(t.map(x=>x.expectedType))){const group=t.filter(x=>x.expectedType===subtype);perSubtype[subtype]=wilson(group.filter(x=>x.rawSubtypeCorrect).length,group.length);}
  return {rawCategory:wilson(g.filter(x=>x.rawCategoryCorrect).length,g.length),rawSubtype:wilson(t.filter(x=>x.rawSubtypeCorrect).length,t.length),rawNegativeRejection:wilson(n.filter(x=>x.rawCategoryCorrect).length,n.length),strongPredictions:g.filter(x=>x.strong).length,uncertainProposals:g.filter(x=>!x.strong).length,wrongStrongCategories:rows.filter(x=>x.wrongStrongCategory).length,wrongStrongSubtypes:t.filter(x=>x.wrongStrongSubtype).length,correctStrongSubtypes:t.filter(x=>x.correctStrongSubtype).length,ambiguousSubtypesExcluded:g.length-t.length,latencyMs:{median:percentile(rows.map(x=>x.elapsedMs),.5),p95:percentile(rows.map(x=>x.elapsedMs),.95)},perCategory,perSubtype};
 };
 const bm=new Map(b.map(x=>[x.id,x]));
 return {browser:baseline.engine,notHumanBlindAcceptance:true,baseline:summarize(b),candidate:summarize(c),loadMs:{baseline:baseline.loadMs,candidate:candidate.loadMs},candidateAllReview:true,
  perOriginal:c.map(after=>({before:bm.get(after.id),after})),color:{status:'unverified',independentHumanLabels:0,reliableMasks:0},segmentation:{status:'not_evaluated_no_instance_ground_truth'},physicalMobileAcceptance:false,
  decision:'NO PROMOTION. Exploratory model proposal comparison only; gain must be reproduced on sealed representative independent human labels.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const bytes=await readFile('research/parallel67/new-photos/reviewed-development.json'),manifest=JSON.parse(bytes),sha=createHash('sha256').update(bytes).digest('hex');
 const report={format:'closet-current-parallel67-actual-browser-comparison/v1',manifestSha256:sha,browsers:{}};
 for(const engine of ['chromium','webkit']){
  const baseline=JSON.parse(await readFile('research/parallel67/'+engine+'-baseline-new-browser.json')),candidate=JSON.parse(await readFile('research/parallel67/'+engine+'-marqo-new-browser.json'));
  if(baseline.manifestSha256!==sha)throw Error('Actual manifest SHA mismatch');report.browsers[engine]=compare67(baseline,candidate,manifest);
 }
 await writeFile('research/parallel67/browser-comparison.json',JSON.stringify(report,null,2)+'\n');
 for(const [engine,r]of Object.entries(report.browsers))console.log(engine,JSON.stringify({baseline:r.baseline,candidate:r.candidate}));
}
