import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditRecognitionAdmission,auditRecognitionSet} from '../scripts/audit-recognition-admission.mjs';
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const paths={
 'reviewed-32':['benchmark/manifest-reviewed-32.json','benchmark/regression-reviewed-32.json'],
 'holdout-16':['benchmark/manifest-holdout-16.json','benchmark/regression-holdout-16.json'],
 'fresh-11':['benchmark/manifest-fresh-11.json','benchmark/regression-fresh-11.json']
};
function fixtures(){
 return Object.fromEntries(Object.entries(paths).map(([name,[manifest,results]])=>[
  name,{manifest:load(manifest),results:load(results).results}
 ]));
}
test('actual 16-photo holdout reports incorrect auto subtypes and cannot pass recognition promotion',()=>{
 const r=auditRecognitionSet('holdout-16',...Object.values(fixtures()['holdout-16']),{historical:true});
 assert.equal(r.measuredPhotos,16);
 assert.equal(r.garmentPhotos,13);
 assert.equal(r.nonGarmentControls,3);
 assert.equal(r.automaticDecisions,6);
 assert.equal(r.incorrectAutomaticSubtypes,3);
 assert.equal(r.correctAutomaticSubtypes,3);
 assert.equal(r.incorrectAutomaticCategories,0);
 assert.equal(r.categoryCoveragePercent,53.85);
 assert.equal(r.categoryPrecisionAmongEmittedPercent,100);
 assert.equal(r.categoryAccuracyAllGarmentsPercent,53.85);
 assert.deepEqual(r.unsafeAutomaticSubtypeIds,['commons-0003','commons-0014','commons-0078']);
 assert.equal(r.rejectedNonGarment,3);
 assert.equal(r.safeToConsiderForRecognitionPromotion,false);
});
test('all three immutable historical observation sets are reported without implying inference reran',()=>{
 const result=auditRecognitionAdmission(fixtures(),{historical:true});
 assert.equal(result.sets.length,3);
 assert.deepEqual(result.sets.map(x=>x.measuredPhotos),[32,16,11]);
 assert.equal(result.evidenceType,'historical-inference-observations');
 assert.equal(result.recognitionPromotionDecision,'BLOCKED');
 assert.equal(result.independentPhysicalGarmentLabelsVerified,false);
 assert.equal(result.productionReleaseApproved,false);
 assert.ok(result.wrongAutoSubtypesTotal>=3);
});
test('wrong broad category and unsafe automatic shoe subtype each block admission',()=>{
 const b=fixtures()['holdout-16'];
 b.results.find(x=>x.id==='commons-0077').prediction.type='Ankle boots';
 b.results.find(x=>x.id==='commons-0036').prediction.category='Dresses';
 const r=auditRecognitionSet('holdout-16',b.manifest,b.results);
 assert.ok(r.unsafeAutomaticSubtypeIds.includes('commons-0077'));
 assert.ok(r.wrongCategoryIds.includes('commons-0036'));
 assert.equal(r.safeToConsiderForRecognitionPromotion,false);
});
test('safe abstentions are not incorrectly counted as category errors or successes',()=>{
 const b=fixtures()['holdout-16'];
 const r=auditRecognitionSet('holdout-16',b.manifest,b.results);
 assert.equal(r.categoryAbstentions,6);
 assert.equal(r.categoryAccuracyAllGarmentsPercent,53.85);
 assert.equal(r.categoryCoveragePercent,53.85);
 assert.equal(r.categoryPrecisionAmongEmittedPercent,100);
 assert.deepEqual(r.abstentionIds,['commons-0016','commons-0036','commons-0059','commons-0060','commons-0062','commons-0095']);
});
test('negative controls given any clothing prediction cannot be counted as rejected',()=>{
 const b=fixtures()['holdout-16'];
 const fake=b.results.find(x=>x.id==='commons-0090');
 fake.prediction.category='Shoes';fake.prediction.type='Sneakers';fake.strong=true;
 const r=auditRecognitionSet('holdout-16',b.manifest,b.results);
 assert.equal(r.rejectedNonGarment,2);
 assert.deepEqual(r.rejectedControlFailures,['commons-0090']);
 assert.equal(r.safeToConsiderForRecognitionPromotion,false);
});
test('missing, unexpected and duplicate results fail closed',()=>{
 for(const mode of ['drop','extra','duplicate']){
  const b=fixtures()['holdout-16'];
  if(mode==='drop')b.results.pop();
  if(mode==='extra')b.results.push({id:'commons-9000',strong:false,categoryConfirmed:false,prediction:{category:null,type:null}});
  if(mode==='duplicate')b.results.push({...b.results[0]});
  assert.throws(()=>auditRecognitionSet('holdout-16',b.manifest,b.results));
 }
});
test('unverified or altered ground-truth labels and malformed output cannot be promoted',()=>{
 for(const change of [
  b=>{b.manifest[0].verified=false;},
  b=>{b.manifest[0].conditions=[];},
  b=>{b.results[0].strong='yes';},
  b=>{b.results[0].prediction={category:'Shoes'};b.results[0].categoryConfirmed=true;},
  b=>{b.results[0].strong=true;b.results[0].categoryConfirmed=true;},
  b=>{b.results[0].prediction.type='Unknown';}
 ]){
  const b=fixtures()['holdout-16'];change(b);
  assert.throws(()=>auditRecognitionSet('holdout-16',b.manifest,b.results));
 }
});
test('corrected hypothetical holdout is still a REVIEW, never production approved',()=>{
 const all=fixtures(),b=all['holdout-16'];
 for(const id of ['commons-0003','commons-0014','commons-0078']){
  const row=b.results.find(x=>x.id===id),actual=b.manifest.find(x=>x.id===id);
  row.prediction.type=actual.expectedType;
 }
 // The other two sets retain historical errors, so full admission remains blocked.
 const one=auditRecognitionSet('holdout-16',b.manifest,b.results);
 assert.equal(one.incorrectAutomaticSubtypes,0);
 assert.equal(one.safeToConsiderForRecognitionPromotion,true);
 const total=auditRecognitionAdmission(all);
 assert.equal(total.productionReleaseApproved,false);
});
