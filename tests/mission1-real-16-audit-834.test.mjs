import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {aggregateReal16Audit834} from '../scripts/aggregate-m1-real-16-834.mjs';
import {photoTypes} from '../public/phone-photo-benchmark.mjs';

const truth=JSON.parse(await readFile('benchmark/manifest-holdout-16.json','utf8'));
const fields=['garments','negatives','categoryMatches','automaticCorrectCategory',
 'automaticWrongCategory','automaticWrongSubtype','knownTypeCount',
 'exactTypeMatches','broadTypeCount','acceptedTypeMatches',
 'negativeRejected','errors'];
const cohort='existing-publisher-labeled-development-exposed-holdout16';
const model='UNCHANGED-existing-closet-current-FashionCLIP-worker';
function partition(browser,half,overrides={}){
 const rows=truth.filter((_,i)=>i%2===(half==='a'?0:1)).map(row=>{
  const known=photoTypes(row.expectedCategory).includes(row.expectedType);
  const negative=row.expectedCategory==='Uncategorized';
  const label=row.id==='commons-0003'&&browser==='chromium';
  return {id:row.id,expectedCategory:row.expectedCategory,expectedType:row.expectedType,
   acceptedTypes:row.acceptedTypes||[row.expectedType],
   expectedTypeLabelSupported:known,
   predictedCategory:label?'Tops':null,predictedType:label?'T-shirt':null,
   strong:label,categoryConfirmed:false,categoryMatch:negative||label,
   exactTypeMatch:known?label:null,
   acceptedTypeMatch:known||row.acceptedTypes?label:null,
   negativeRejected:negative?true:null,reason:null,error:null,elapsedMs:9};
 });
 const summary={
  browser,partition:half,sourceCohort:cohort,model,count:8,
  garments:rows.filter(x=>x.expectedCategory!=='Uncategorized').length,
  negatives:rows.filter(x=>x.expectedCategory==='Uncategorized').length,
  categoryMatches:rows.filter(x=>x.expectedCategory!=='Uncategorized'&&x.categoryMatch).length,
  automaticCorrectCategory:rows.filter(x=>x.expectedCategory!=='Uncategorized'&&x.strong&&x.categoryMatch).length,
  automaticWrongCategory:0,
  automaticWrongSubtype:0,
  knownTypeCount:rows.filter(x=>x.expectedCategory!=='Uncategorized'&&x.expectedTypeLabelSupported).length,
  exactTypeMatches:rows.filter(x=>x.exactTypeMatch===true).length,
  broadTypeCount:rows.filter(x=>x.acceptedTypeMatch!==null).length,
  acceptedTypeMatches:rows.filter(x=>x.acceptedTypeMatch===true).length,
  negativeRejected:rows.filter(x=>x.negativeRejected===true).length,
  errors:0,unverifiedColors:8,noPhotoNetworkUploads:true,noPageExceptions:true};
 return {...overrides,summary,rows};
}
const parts=()=>Object.fromEntries(['chromium','webkit'].flatMap(engine=>
 ['a','b'].map(half=>[engine+'-'+half,partition(engine,half)])));
test('P834 deterministic all-original comparison merges interleaved 16 sources without dropped errors',()=>{
 const result=aggregateReal16Audit834(truth,parts());
 assert.equal(result.sourceCount,16);
 assert.equal(result.browsers.chromium.garments,13);
 assert.equal(result.browsers.chromium.negatives,3);
 assert.equal(result.browsers.chromium.categoryMatches,1);
 assert.equal(result.browsers.webkit.categoryMatches,0);
 assert.deepEqual(result.sourceIds,truth.map(x=>x.id));
 assert.equal(result.crossBrowser.samePredictionCategoryIncludingAbstentions,15);
 assert.equal(result.crossBrowser.samePredictionSubtypeIncludingAbstentions,15);
 assert.equal(result.crossBrowser.failedRuntimeEither.length,0);
 assert.equal(result.noHumanBlindAccuracyClaim,true);
});
test('P834 fail closed on missing, duplicated or reordered original, including negative-only positions',()=>{
 for(const mutation of [
  x=>{x['chromium-a'].rows[0].id='commons-9999';},
  x=>{x['chromium-a'].rows[0].id=x['chromium-a'].rows[1].id;},
  x=>{x['webkit-b'].rows.reverse();},
  x=>{x['webkit-a'].rows.pop();},
  x=>{delete x['chromium-a'];},
 ]){
  const x=parts();mutation(x);
  assert.throws(()=>aggregateReal16Audit834(truth,x),/AUDIT_FAIL_CLOSED/);
 }
});
test('P834 reject invented positive/negative, accepted subtype and overcounted photos',()=>{
 for(const mutation of [
  x=>{x['chromium-b'].summary.categoryMatches=100;},
  x=>{x['chromium-a'].rows[0].acceptedTypes=['PRIVATE_PERSON','T-shirt'];},
  x=>{x['chromium-a'].rows[0].categoryMatch=true;x['chromium-a'].rows[0].acceptedTypeMatch=true;x['chromium-a'].rows[0].strong=false;},
  x=>{x['webkit-a'].rows[0].strong=true;x['webkit-a'].rows[0].predictedCategory=null;},
  x=>{x['webkit-a'].summary.noPhotoNetworkUploads=false;},
  x=>{x['webkit-a'].summary.model='PRIVATE_FAKE_MODEL';},
  x=>{x['chromium-a'].rows[0].expectedCategory='Dresses';},
  x=>{x['chromium-a'].summary.colorsChecked=1;x['chromium-a'].summary.unverifiedColors=7;},
 ]){
  const x=parts();mutation(x);
  assert.throws(()=>aggregateReal16Audit834(truth,x),/AUDIT_FAIL_CLOSED/);
 }
});
