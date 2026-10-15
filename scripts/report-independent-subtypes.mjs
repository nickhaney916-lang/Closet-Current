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
 const subtypeConsensusMismatch=categoryCorrect&&!exactSubtype&&!acceptableSpecific&&!!prediction.type&&
  [topType(evidence.branch),topType(evidence.confirmation),topType(alternative.originalWholeTypes),topType(alternative.originalCenterTypes)].every(type=>type===prediction.type);
 const outcome=!result?'missing-result':result.error?'inference-error':!categoryCorrect?'wrong-category':exactSubtype?'exact-subtype':acceptableSpecific?'compatible-specific-subtype':'subtype-mismatch';
 return {id:row.id,expectedCategory:row.expectedCategory,expectedType:row.expectedType,predictedCategory:prediction.category||null,predictedType:prediction.type||null,categoryCorrect,exactSubtype,acceptableSpecific,subtypeConsensusMismatch,modelViews:{branch:topType(evidence.branch),confirmation:topType(evidence.confirmation),originalWhole:topType(alternative.originalWholeTypes),originalCenter:topType(alternative.originalCenterTypes)},outcome};
});
const count=key=>items.filter(x=>x[key]).length;
const report={sampleSize:manifest.length,categoryCorrect:count('categoryCorrect'),exactSubtypeCorrect:count('exactSubtype'),compatibleSpecificCount:count('acceptableSpecific'),consensusSubtypeMismatchCount:count('subtypeConsensusMismatch'),acceptableSubtypeCount:items.filter(x=>x.exactSubtype||x.acceptableSpecific).length,items};
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sampleSize:report.sampleSize,categoryCorrect:report.categoryCorrect,exactSubtypeCorrect:report.exactSubtypeCorrect,compatibleSpecificCount:report.compatibleSpecificCount,acceptableSubtypeCount:report.acceptableSubtypeCount}));
if(items.some(x=>x.outcome==='missing-result'||x.outcome==='inference-error'))process.exitCode=1;
