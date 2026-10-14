import fs from 'node:fs';
import {pathToFileURL} from 'node:url';

// Protect individual successes, rather than letting gains on easy photos hide
// regressions on dresses, shoes, or previously rejected nonclothing images.
export function checkRecognitionRegressions(manifest, results, baseline) {
 const failures=[],knownTypeMismatches=[];
 const index=(rows,name)=>{
  if(!Array.isArray(rows)||!rows.length)throw Error(name+' must be a nonempty array');
  const map=new Map();
  for(const row of rows){
   if(!row||typeof row.id!=='string'||!row.id||map.has(row.id))throw Error(name+' has a missing or duplicate ID');
   map.set(row.id,row);
  }
  return map;
 };
 const expected=index(manifest,'Manifest'),current=index(results,'Results'),previous=index(baseline.results,'Baseline');
 for(const id of previous.keys())if(!expected.has(id))throw Error('Baseline photo absent from manifest: '+id);
 for(const id of expected.keys())if(!previous.has(id))throw Error('Manifest photo absent from baseline: '+id);
 for(const id of current.keys())if(!expected.has(id))failures.push({id,reason:'unexpected_result'});
 const hasCategory=r=>typeof r.prediction?.category==='string'&&r.prediction.category!=='Uncategorized'&&r.prediction.category!=='';
 for(const [id,item] of expected){
  if(item.mode!=='single'||typeof item.expectedCategory!=='string')throw Error('Only annotated single photos are supported: '+id);
  const before=previous.get(id),after=current.get(id),fail=reason=>failures.push({id,reason});
  if(!after){fail('missing_result');continue;}
  if(after.error){fail('runtime_error');continue;}
  if(typeof after.strong!=='boolean'||typeof after.categoryConfirmed!=='boolean'||!after.prediction||typeof after.prediction!=='object'){
   fail('invalid_result');continue;
  }
  const correct=r=>hasCategory(r)&&r.prediction.category===item.expectedCategory;
  if(item.expectedCategory==='Uncategorized'){
   if(after.strong||after.categoryConfirmed||hasCategory(after))fail('negative_false_positive');
   continue;
  }
  if(hasCategory(after)&&!correct(after))fail('incorrect_category');
  if(correct(before)&&!correct(after))fail('category_regression');
  const accepted=item.acceptedTypes||[item.expectedType];
  if(!Array.isArray(accepted)||!accepted.length||accepted.some(x=>typeof x!=='string'||!x||x==='Unknown'))throw Error('Missing accepted types: '+id);
  const correctType=r=>correct(r)&&accepted.includes(r.prediction.type);
  if(correctType(before)&&!correctType(after))fail('type_regression');
  if(before.strong&&correctType(before)&&!after.strong)fail('automatic_indexing_regression');
  if(after.strong&&!correctType(after)){
   // Existing annotated mismatches remain visible; only that same prediction
   // is tolerated. A different wrong subtype must never inherit the exception.
   if(before.strong&&correct(before)&&!correctType(before)&&correct(after)&&before.prediction.type===after.prediction.type)
    knownTypeMismatches.push({id,type:after.prediction.type});
   else fail('new_incorrect_automatic_type');
  }
  if(after.categoryConfirmed&&!after.strong&&after.prediction.type!=='Unknown')fail('review_guesses_type');
 }
 return {passed:failures.length===0,photoCount:expected.size,failures,knownTypeMismatches};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [manifestPath,resultsPath,baselinePath]=process.argv.slice(2);
 if(!baselinePath){console.error('Usage: node scripts/check-recognition-regressions.mjs MANIFEST RESULTS BASELINE');process.exit(2);}
 const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
 const report=checkRecognitionRegressions(read(manifestPath),read(resultsPath),read(baselinePath));
 console.log(JSON.stringify(report,null,2));
 if(!report.passed)process.exitCode=1;
}
