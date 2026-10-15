#!/usr/bin/env node
// Offline evaluation only. This script never alters live recognition output.
import {readFileSync,writeFileSync} from 'node:fs';
const [manifestPath,resultsPath,reportPath]=process.argv.slice(2);
if(!manifestPath||!resultsPath||!reportPath)throw Error('Usage: node scripts/report-independent-subtypes.mjs MANIFEST RESULTS REPORT');
const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
const results=JSON.parse(readFileSync(resultsPath,'utf8'));
if(!Array.isArray(manifest)||!Array.isArray(results))throw Error('Expected manifest/results arrays');
const byId=new Map();
for(const row of results){if(byId.has(row.id))throw Error('Duplicate result ID: '+row.id);byId.set(row.id,row);}
const compatibleSpecifics=new Map([
 ['Shirt',new Set(['Button-down shirt','Oxford shirt','Dress shirt'])]
]);
const items=manifest.map(row=>{
 const result=byId.get(row.id);
 const prediction=result?.prediction||{};
 const categoryCorrect=!!result&&!result.error&&prediction.category===row.expectedCategory;
 const exactSubtype=categoryCorrect&&prediction.type===row.expectedType;
 const acceptableSpecific=categoryCorrect&&!exactSubtype&&!!compatibleSpecifics.get(row.expectedType)?.has(prediction.type);
 // Broader generic types, notably Coat for Raincoat, are NOT counted as subtype-correct.
 const evidence=result?.diagnostics?.acceptedEvidence||{};
 const alternative=result?.diagnostics?.shadowPreprocessing||{};
 const topType=rows=>Array.isArray(rows)?rows[0]?.type||null:null;
 const views=[evidence.branch,evidence.confirmation,alternative.originalWholeTypes,alternative.originalCenterTypes];
 const subtypeConsensusMismatch=categoryCorrect&&!exactSubtype&&!acceptableSpecific&&!!prediction.type&&
  views.every(rows=>Array.isArray(rows)&&rows.length>0&&topType(rows)===prediction.type);
 const viewMargins=views.map(rows=>{
  if(!Array.isArray(rows)||!rows.length)return null;
  const [first,second]=rows;
  return {topType:first.type||null,topScore:Number.isFinite(first.score)?first.score:null,
   runnerUpType:second?.type||null,runnerUpScore:Number.isFinite(second?.score)?second.score:null,
   margin:Number.isFinite(first.score)&&Number.isFinite(second?.score)?first.score-second.score:null};
 });
 const outcome=!result?'missing-result':result.error?'inference-error':!categoryCorrect?'wrong-category':exactSubtype?'exact-subtype':acceptableSpecific?'compatible-specific-subtype':'subtype-mismatch';
 return {id:row.id,expectedCategory:row.expectedCategory,expectedType:row.expectedType,predictedCategory:prediction.category||null,predictedType:prediction.type||null,categoryCorrect,exactSubtype,acceptableSpecific,subtypeConsensusMismatch,modelViews:{branch:viewMargins[0],confirmation:viewMargins[1],originalWhole:viewMargins[2],originalCenter:viewMargins[3]},outcome};
});
const count=key=>items.filter(x=>x[key]).length;
const outerwearTypes=['Raincoat','Coat','Jacket','Blazer'];
const outerwearConfusion=Object.fromEntries(outerwearTypes.map(expectedType=>{
 const subset=items.filter(x=>x.expectedCategory==='Outerwear'&&x.expectedType===expectedType);
 const predicted=Object.fromEntries([...new Set(subset.map(x=>x.predictedType||'Unclassified'))].sort().map(type=>[type,subset.filter(x=>(x.predictedType||'Unclassified')===type).length]));
 return [expectedType,{count:subset.length,exactCorrect:subset.filter(x=>x.exactSubtype).length,predicted}];
}));
const raincoatVsCoat=items.filter(x=>x.expectedCategory==='Outerwear'&&x.expectedType==='Raincoat').map(x=>({
 id:x.id,expectedType:x.expectedType,predictedType:x.predictedType,consensusWrongSubtype:x.subtypeConsensusMismatch,
 originalWhole:x.modelViews.originalWhole,originalCenter:x.modelViews.originalCenter
}));
const report={sampleSize:manifest.length,categoryCorrect:count('categoryCorrect'),exactSubtypeCorrect:count('exactSubtype'),compatibleSpecificCount:count('acceptableSpecific'),consensusSubtypeMismatchCount:count('subtypeConsensusMismatch'),acceptableSubtypeCount:items.filter(x=>x.exactSubtype||x.acceptableSpecific).length,outerwearConfusion,raincoatVsCoat,items};
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sampleSize:report.sampleSize,categoryCorrect:report.categoryCorrect,exactSubtypeCorrect:report.exactSubtypeCorrect,compatibleSpecificCount:report.compatibleSpecificCount,acceptableSubtypeCount:report.acceptableSubtypeCount}));
if(items.some(x=>x.outcome==='missing-result'||x.outcome==='inference-error'))process.exitCode=1;
