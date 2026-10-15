#!/usr/bin/env node
// Offline evidence report only; never modifies predictions or acceptance gates.
import {readFileSync,writeFileSync} from 'node:fs';
const [manifestFile,resultsFile,outputFile]=process.argv.slice(2);
if(!manifestFile||!resultsFile||!outputFile)throw Error('Usage: node scripts/report-cross-category-evidence.mjs MANIFEST RESULTS OUTPUT');
const manifest=JSON.parse(readFileSync(manifestFile,'utf8'));
const results=new Map(JSON.parse(readFileSync(resultsFile,'utf8')).map(x=>[x.id,x]));
const top=a=>Array.isArray(a)&&a.length?a[0]:null;
const report=[];
for(const item of manifest){
 const result=results.get(item.id);
 if(!result||result.error||result.strong||result.categoryConfirmed)continue;
 const d=result.diagnostics||{},s=d.shadowPreprocessing||{};
 const primary=top(d.category),alternative=top(s.originalWholeCategory),center=top(s.originalCenterCategory);
 const wholeType=top(s.originalWholeTypes),centerType=top(s.originalCenterTypes);
 // Surface disagreements, including outerwear that a broad category gate rejects.
 if(![primary?.category,alternative?.category,center?.category,wholeType?.category,centerType?.category].includes('Outerwear'))continue;
 report.push({id:item.id,expectedCategory:item.expectedCategory,expectedType:item.expectedType,reason:result.reason||null,
  primaryCategory:primary||null,alternativeWholeCategory:alternative||null,alternativeCenterCategory:center||null,
  alternativeWholeType:wholeType||null,alternativeCenterType:centerType||null,
  agreesAcrossAlternatives:!!alternative&&!!center&&alternative.category===center.category,
  primaryContradictsAlternatives:!!primary&&!!alternative&&!!center&&alternative.category===center.category&&primary.category!==alternative.category});
}
const output={sampleSize:manifest.length,outerwearDisagreements:report.length,contradictoryPrimary:report.filter(x=>x.primaryContradictsAlternatives).length,items:report};
writeFileSync(outputFile,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({outerwearDisagreements:output.outerwearDisagreements,contradictoryPrimary:output.contradictoryPrimary}));
