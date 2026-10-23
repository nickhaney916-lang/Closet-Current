import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditRecognitionAdmission} from '../scripts/audit-recognition-admission.mjs';

const read=p=>JSON.parse(readFileSync(p,'utf8'));
const evidence=read('benchmark/SOURCE-LOCKED-RESULTS-20261023.json');
const cohorts=['reviewed-32','holdout-16','fresh-11'];
const expected={
 'commons-0064':{category:'Outerwear',type:'Jacket',wrong:'Blazer'},
 'commons-0014':{category:'Tops',type:'Blouse',wrong:'Tunic'},
 'commons-0078':{category:'Shoes',type:'Sneakers',wrong:'Ankle boots'}
};
function report(engine){
 const sets=Object.fromEntries(cohorts.map(k=>[k,{
  manifest:read('benchmark/manifest-'+k+'.json'),results:evidence[engine][k]
 }]));
 return auditRecognitionAdmission(sets,{historical:true});
}
test('source-locked baseline and candidate cannot falsely promote unsafe automatic subtypes',()=>{
 for(const engine of ['baseline','candidate']){
  const r=report(engine);
  assert.equal(r.recognitionPromotionDecision,'BLOCKED');
  assert.equal(r.productionReleaseApproved,false);
  assert.equal(r.independentPhysicalGarmentLabelsVerified,false);
  assert.equal(r.wrongAutoSubtypesTotal,3);
  assert.deepEqual(r.sets.flatMap(s=>s.unsafeAutomaticSubtypeIds).sort(),Object.keys(expected).sort());
 }
});
test('all three known errors persist in both engines with correct broad category',()=>{
 for(const [id,want] of Object.entries(expected)){
  const cohort=cohorts.find(k=>read('benchmark/manifest-'+k+'.json').some(x=>x.id===id));
  const manifest=read('benchmark/manifest-'+cohort+'.json').find(x=>x.id===id);
  assert.equal(manifest.expectedCategory,want.category);
  assert.equal(manifest.expectedType,want.type);
  for(const engine of ['baseline','candidate']){
   const observed=evidence[engine][cohort].find(x=>x.id===id);
   assert.equal(observed.prediction.category,want.category);
   assert.equal(observed.prediction.type,want.wrong);
   assert.equal(observed.strong,true);
  }
 }
});
test('existing evidence records immutable source coverage, not new physical validation',()=>{
 assert.equal(evidence.sourceIntegrity.sourceCount,59);
 assert.equal(evidence.sourceIntegrity.originalHashMatches,59);
 assert.equal(evidence.admission.independentPhysicalGarmentLabelsVerified,false);
 assert.equal(evidence.admission.productionReleaseApproved,false);
});
