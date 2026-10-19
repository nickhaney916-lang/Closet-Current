#!/usr/bin/env node
import fs from 'node:fs';
const [manifestPath,resultsPath]=process.argv.slice(2);
if(!manifestPath||!resultsPath){console.error('Usage: node scripts/evaluate-recognition-benchmark.mjs benchmark/manifest.json benchmark/results.json');process.exit(2);}
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8')),results=JSON.parse(fs.readFileSync(resultsPath,'utf8'));
if(!Array.isArray(manifest)||!Array.isArray(results))throw Error('Manifest and results must be arrays');
const byId=new Map();
for(const r of results){if(!r.id||byId.has(r.id))throw Error('Missing or duplicate result ID: '+r.id);byId.set(r.id,r);}
let single=0,categoryCorrect=0,typeCorrect=0,semanticTypeCorrect=0,abstained=0,outfits=0,expectedPieces=0,matchedPieces=0,unexpectedPieces=0;
// Distinguish safe abstention from an emitted but wrong category; don't inflate
// apparent accuracy by dividing only by the cases the model chose to answer.
// This audits a FIXED ground-truth manifest and never changes inference.
let predictedCategories=0,wrongCategories=0,correctAutoIndexed=0,incorrectAutoIndexed=0;
const abstainedPhotoIds=[],incorrectCategoryIds=[],incorrectAutoIndexedIds=[],recoveredPhotoIds=[];
const errors=[],reasonCounts={},perCategory={};let negatives=0,negativeRejected=0,autoIndexed=0,categoryReview=0;
for(const item of manifest){
 if(!item.id||!['single','outfit'].includes(item.mode))throw Error('Invalid manifest entry');
 const r=byId.get(item.id);if(!r){errors.push({id:item.id,reason:'missing_result'});continue;}
 if(item.mode==='single'&&item.expectedCategory==='Uncategorized'){
  negatives++;if(!r.error&&!r.strong&&!r.categoryConfirmed&&(!r.prediction?.category||r.prediction.category==='Uncategorized'))negativeRejected++;
  else errors.push({id:item.id,reason:r.error?'runtime_error':'negative_false_positive',actual:r.prediction?.category||null});
 }else if(item.mode==='single'){
  single++;if(r.strong)autoIndexed++;if(r.categoryConfirmed&&!r.strong)categoryReview++;const prediction=r.prediction||{};const reason=r.error?'runtime_error':r.reason|| (r.strong?'accepted':'unclassified_unspecified');reasonCounts[reason]=(reasonCounts[reason]||0)+1;const cat=perCategory[item.expectedCategory]||={total:0,categoryCorrect:0,typeCorrect:0,abstained:0};cat.total++;if(!prediction.category||prediction.category==='Uncategorized'){
   abstained++;cat.abstained++;abstainedPhotoIds.push(item.id);
  }else if(!r.error){
   predictedCategories++;
   if(prediction.category!==item.expectedCategory){wrongCategories++;incorrectCategoryIds.push(item.id);}
   else recoveredPhotoIds.push(item.id);
  }
  if(r.strong){
   if(!r.error&&prediction.category===item.expectedCategory)correctAutoIndexed++;
   else {incorrectAutoIndexed++;incorrectAutoIndexedIds.push(item.id);}
  }
  if(prediction.category===item.expectedCategory){categoryCorrect++;cat.categoryCorrect++;}else errors.push({id:item.id,reason:'category',expected:item.expectedCategory,actual:prediction.category||'none'});
  if(prediction.category===item.expectedCategory&&prediction.type===item.expectedType){typeCorrect++;cat.typeCorrect++;}
  const accepted=item.acceptedTypes||[item.expectedType];if(prediction.category===item.expectedCategory&&accepted.includes(prediction.type))semanticTypeCorrect++;
 }else{
  outfits++;const expected=item.expectedPieces||[],predicted=r.predictedPieces||[];expectedPieces+=expected.length;
  const used=new Set();
  for(const e of expected){const idx=predicted.findIndex((p,i)=>!used.has(i)&&p.category===e.category&&p.type===e.type);if(idx>=0){used.add(idx);matchedPieces++;}else errors.push({id:item.id,reason:'missing_outfit_piece',expected:e});}
  unexpectedPieces+=predicted.length-used.size;
 }
}
const percent=(n,d)=>d?+(100*n/d).toFixed(2):null;
console.log(JSON.stringify({manifestCount:manifest.length,resultsCount:results.length,missingResults:errors.filter(e=>e.reason==='missing_result').length,single:{evaluated:single,autoIndexedCount:autoIndexed,categoryReviewCount:categoryReview,categoryAccuracyPercent:percent(categoryCorrect,single),
  // categoryAccuracyPercent uses ALL clothing photos (abstentions included).
  // Precision measures correctness ONLY among category predictions. Both
  // must be reported when discussing increased garment-recognition coverage.
  categoryCoveragePercent:percent(predictedCategories,single),categoryPrecisionAmongPredictionsPercent:percent(predictedCategories-wrongCategories,predictedCategories),
  categoryPredictedCount:predictedCategories,wrongCategoryCount:wrongCategories,
  autoIndexedCorrectCategoryCount:correctAutoIndexed,autoIndexedWrongCategoryCount:incorrectAutoIndexed,
  abstainedCount:abstained,abstainedPhotoIds,incorrectCategoryIds,incorrectAutoIndexedIds,
  recognizedCategoryPhotoIds:recoveredPhotoIds,
  typeAccuracyPercent:percent(typeCorrect,single),acceptedTypeAccuracyPercent:percent(semanticTypeCorrect,single),abstentionPercent:percent(abstained,single)},negative:{evaluated:negatives,rejected:negativeRejected,falsePositives:errors.filter(x=>x.reason==='negative_false_positive').length},outfit:{evaluated:outfits,expectedPieces,matchedPieces,pieceRecallPercent:percent(matchedPieces,expectedPieces),unexpectedPieces},reasonCounts,perCategory,errors},null,2));
if(errors.some(e=>e.reason==='missing_result'))process.exitCode=1;
