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
// Shadow decision only: require both independent detailed image views to agree
// on the exact outerwear subtype, each with substantial top-vs-runner-up separation.
// Never feed this decision back into the worker or user's wardrobe.
const outerwearTypes=new Set(['Jacket','Coat','Blazer','Raincoat','Cardigan','Vest']);
for(const entry of report){
 const w=entry.alternativeWholeType,c=entry.alternativeCenterType;
 const candidate=!!w&&!!c&&w.category==='Outerwear'&&c.category==='Outerwear'&&w.type===c.type&&outerwearTypes.has(w.type)&&w.score>=.55&&c.score>=.55;
 entry.shadowDetailedCandidate=candidate?{category:'Outerwear',type:w.type,minimumViewScore:Math.min(w.score,c.score)}:null;
 entry.shadowMatchesExpected=entry.shadowDetailedCandidate?entry.expectedCategory==='Outerwear'&&entry.expectedType===entry.shadowDetailedCandidate.type:null;
}
// Evaluate rule candidates only on unresolved garments, including non-outerwear
// controls. A rule is a proposed decision, never an actual recognition result.
const rules=[
 {name:'matching-detailed-views-030',minimum:.30,requireBroad:false},
 {name:'matching-detailed-views-040',minimum:.40,requireBroad:false},
 {name:'matching-detailed-views-050',minimum:.50,requireBroad:false},
 {name:'matching-detailed-views-055',minimum:.55,requireBroad:false},
 {name:'matching-detailed-views-040-broad-support',minimum:.40,requireBroad:true}
];
const candidates=[];
for(const item of manifest){
 const result=results.get(item.id);
 if(!result||result.error||result.strong||result.categoryConfirmed)continue;
 const s=result.diagnostics?.shadowPreprocessing||{};
 const whole=top(s.originalWholeTypes),center=top(s.originalCenterTypes);
 const broad=[top(s.originalWholeCategory),top(s.originalCenterCategory)];
 candidates.push({item,whole,center,broad});
}
const ruleComparisons=rules.map(rule=>{
 const predictions=candidates.filter(x=>x.whole?.category==='Outerwear'&&x.center?.category==='Outerwear'&&
  x.whole.type===x.center.type&&outerwearTypes.has(x.whole.type)&&
  x.whole.score>=rule.minimum&&x.center.score>=rule.minimum&&
  (!rule.requireBroad||x.broad.some(b=>b?.category==='Outerwear'&&b.score>=.5)))
 .map(x=>({id:x.item.id,type:x.whole.type,expectedCategory:x.item.expectedCategory,expectedType:x.item.expectedType,
  categoryCorrect:x.item.expectedCategory==='Outerwear',subtypeCorrect:x.item.expectedCategory==='Outerwear'&&x.item.expectedType===x.whole.type}));
 return {name:rule.name,minimumViewScore:rule.minimum,requireBroadSupport:rule.requireBroad,
  candidateCount:predictions.length,correctCategory:predictions.filter(x=>x.categoryCorrect).length,
  incorrectCategory:predictions.filter(x=>!x.categoryCorrect).length,
  correctSubtype:predictions.filter(x=>x.subtypeCorrect).length,
  incorrectSubtype:predictions.filter(x=>!x.subtypeCorrect).length,predictions};
});
const output={sampleSize:manifest.length,outerwearDisagreements:report.length,contradictoryPrimary:report.filter(x=>x.primaryContradictsAlternatives).length,shadowCandidateCount:report.filter(x=>x.shadowDetailedCandidate).length,shadowCorrectCount:report.filter(x=>x.shadowMatchesExpected===true).length,shadowIncorrectCount:report.filter(x=>x.shadowMatchesExpected===false).length,ruleComparisons,items:report};
writeFileSync(outputFile,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({outerwearDisagreements:output.outerwearDisagreements,contradictoryPrimary:output.contradictoryPrimary}));
