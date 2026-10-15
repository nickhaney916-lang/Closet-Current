#!/usr/bin/env node
// Evaluate a reviewed >=100-image result set and fail on missing results, wrong automatic labels,
// duplicates, or unsupported automatic saves. Recognition inference is performed separately.
import fs from 'node:fs';
const [manifestPath,resultsPath,outputPath,minimumArg]=process.argv.slice(2);
const minimum=minimumArg===undefined?100:Number(minimumArg);
if(!Number.isInteger(minimum)||minimum<1)throw Error('Minimum must be a positive integer');
if(!manifestPath||!resultsPath)throw Error('Usage: node scripts/audit-100-photo-results.mjs MANIFEST RESULTS [OUTPUT]');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const results=JSON.parse(fs.readFileSync(resultsPath,'utf8'));
if(!Array.isArray(manifest)||!Array.isArray(results))throw Error('Expected two JSON arrays');
const issues=[],byId=new Map(),grouped={};
const negatives={total:0,correctlyRejected:0,falsePositives:0,runtimeErrors:0};
for(const r of results){if(!r?.id||byId.has(r.id))issues.push({id:r?.id||null,kind:'duplicate_or_missing_result_id'});else byId.set(r.id,r);}
for(const m of manifest){
 if(!m?.id||m.verified!==true||m.mode!=='single')issues.push({id:m?.id||null,kind:'unverified_or_invalid_manifest_entry'});
 const r=byId.get(m.id);
 if(m.expectedCategory==='Uncategorized'){
  negatives.total++;
  if(!r){issues.push({id:m.id,kind:'missing_result'});continue;}
  if(r.error){negatives.runtimeErrors++;issues.push({id:m.id,kind:'inference_error',detail:String(r.error)});continue;}
  const predicted=r.prediction?.category||null;
  if(!r.strong&&!r.categoryConfirmed&&(!predicted||predicted==='Uncategorized'))negatives.correctlyRejected++;
  else {negatives.falsePositives++;issues.push({id:m.id,kind:'negative_false_positive',actual:predicted,strong:!!r.strong,categoryConfirmed:!!r.categoryConfirmed});}
  continue;
 }
 const group=grouped[m.expectedType]??={total:0,categoryCorrect:0,typeCorrect:0,automaticWrong:0,abstentions:0};
 group.total++;
 if(!r){issues.push({id:m.id,kind:'missing_result'});continue;}
 if(r.error){issues.push({id:m.id,kind:'inference_error',detail:String(r.error)});continue;}
 const category=r.prediction?.category||null,type=r.prediction?.type||null;
 if(category===m.expectedCategory)group.categoryCorrect++;
 if(category===m.expectedCategory&&(m.acceptedTypes||[m.expectedType]).includes(type))group.typeCorrect++;
 if(!category||category==='Uncategorized')group.abstentions++;
 if(r.strong&&category!==m.expectedCategory){
  group.automaticWrong++;
  issues.push({id:m.id,kind:'wrong_automatic_category',expected:m.expectedCategory,actual:category});
 }else if(category!==m.expectedCategory)issues.push({id:m.id,kind:'category_mismatch',expected:m.expectedCategory,actual:category});
 else if(!(m.acceptedTypes||[m.expectedType]).includes(type))issues.push({id:m.id,kind:'type_mismatch',expected:m.expectedType,actual:type});
}
for(const id of byId.keys())if(!manifest.some(m=>m.id===id))issues.push({id,kind:'unexpected_result'});
const pct=(num,den)=>den?+(100*num/den).toFixed(2):null;
const totals=Object.values(grouped).reduce((a,b)=>({total:a.total+b.total,categoryCorrect:a.categoryCorrect+b.categoryCorrect,typeCorrect:a.typeCorrect+b.typeCorrect,automaticWrong:a.automaticWrong+b.automaticWrong,abstentions:a.abstentions+b.abstentions}),{total:0,categoryCorrect:0,typeCorrect:0,automaticWrong:0,abstentions:0});
const report={requiredMinimum:minimum,sampleSize:manifest.length,resultCount:results.length,categoryAccuracyPercent:pct(totals.categoryCorrect,totals.total),acceptedTypeAccuracyPercent:pct(totals.typeCorrect,totals.total),automaticWrongCount:totals.automaticWrong,abstentionCount:totals.abstentions,negativeControls:negatives,byType:grouped,issues,passing:manifest.length>=minimum&&totals.automaticWrong===0&&negatives.falsePositives===0&&issues.length===0};
const data=JSON.stringify(report,null,2)+'\n';
if(outputPath)fs.writeFileSync(outputPath,data);
process.stdout.write(data);
if(!report.passing)process.exitCode=1;
