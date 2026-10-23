import test from 'node:test';
import assert from 'node:assert/strict';
import {compareRecognitionCandidate,loadLockedSets} from '../scripts/compare-recognition-candidate-59.mjs';
import {REQUIRED_SETS} from '../scripts/audit-recognition-admission.mjs';
const locked=loadLockedSets();
const base=()=>Object.fromEntries(REQUIRED_SETS.map(k=>[k,structuredClone(locked[k].historical)]));
const find=(c,k,id)=>c[k].find(x=>x.id===id);
test('historical 59 includes known subtype issues and MUST remain release blocked',()=>{
 const report=compareRecognitionCandidate(locked,base());
 assert.equal(report.totals.manifestPhotos,59);
 assert.equal(report.totals.candidateUnsafeSubtypeTotal,4);
 assert.equal(report.eligibleForIndependentReview,false);
 assert.equal(report.recognitionPromotionAuthorized,false);
 assert.equal(report.genuineHumanPhysicalGarmentMasksApproved,false);
});
test('correcting historical subtype errors by safe review does not magically prove new real inference',()=>{
 const c=base();
 for(const k of REQUIRED_SETS){
  const manifest=new Map(locked[k].manifest.map(x=>[x.id,x]));
  for(const row of c[k]){
   const gt=manifest.get(row.id);
   if(gt.expectedCategory==='Uncategorized')continue;
   if(row.strong&&row.prediction.category===gt.expectedCategory&&
    !(gt.acceptedTypes||[gt.expectedType]).includes(row.prediction.type)){
    row.strong=false;row.categoryConfirmed=true;row.prediction.type='Unknown';
   }
  }
 }
 const report=compareRecognitionCandidate(locked,c,{syntheticCounterfactual:true});
 assert.equal(report.totals.candidateUnsafeSubtypeTotal,0);
 assert.equal(report.eligibleForIndependentReview,true);
 assert.equal(report.deploymentAuthorized,false);
 assert.equal(report.originalSourceImageHashesValidatedHere,false);
 assert.match(report.evidenceType,/SYNTHETIC_COUNTERFACTUAL/);
});
test('one newly incorrect strong shoe subtype stops candidate regardless of gains elsewhere',()=>{
 const c=base();
 // First replace known mistakes to make the remaining unsafe state visible.
 for(const k of REQUIRED_SETS){
  const truth=new Map(locked[k].manifest.map(x=>[x.id,x]));
  for(const r of c[k]){
   const gt=truth.get(r.id);
   if(r.strong&&gt.expectedCategory!=='Uncategorized'&&r.prediction.category===gt.expectedCategory&&
     !(gt.acceptedTypes||[gt.expectedType]).includes(r.prediction.type)){
    r.strong=false;r.categoryConfirmed=true;r.prediction.type='Unknown';
   }
  }
 }
 const pair=locked['reviewed-32'].manifest.find(x=>x.expectedCategory==='Shoes'&&
  (x.acceptedTypes||[x.expectedType]).length);
 assert.ok(pair);
 const entry=find(c,'reviewed-32',pair.id);
 entry.prediction={category:'Shoes',type:'Fabricated shoe subtype'};
 entry.strong=true;entry.categoryConfirmed=false;
 const rep=compareRecognitionCandidate(locked,c,{syntheticCounterfactual:true});
 assert.equal(rep.eligibleForIndependentReview,false);
 assert.ok(rep.totals.candidateUnsafeSubtypeTotal>0);
});
test('strictly reject removed or fabricated photo IDs in any 59-image cohort',()=>{
 for(const variant of ['missing','duplicate','new']){
  const c=base();
  if(variant==='missing')c['fresh-11'].pop();
  if(variant==='duplicate')c['fresh-11'].push(c['fresh-11'][0]);
  if(variant==='new')c['fresh-11'].push({...c['fresh-11'][0],id:'nonexistent'});
  assert.throws(()=>compareRecognitionCandidate(locked,c),/source|duplicate|population|observations/);
 }
});
test('no partial cohort can substitute a 16-image holdout with only easy garments',()=>{
 const c=base();delete c['holdout-16'];
 assert.throws(()=>compareRecognitionCandidate(locked,c),/all three/);
});
test('wrong garment category is not compensated by more abstention-free predictions',()=>{
 const c=base();
 const hit=find(c,'fresh-11','validation-0002');
 assert.ok(hit);hit.prediction.category='Shoes';
 const r=compareRecognitionCandidate(locked,c,{syntheticCounterfactual:true});
 assert.equal(r.eligibleForIndependentReview,false);
 assert.ok(r.totals.sourceRegressions>0);
 assert.ok(r.cohorts.some(x=>x.categoryOrTypeRegressions.some(y=>y.id==='validation-0002')));
});
test('unknown fresh model evidence never claims verified per-pixel masks or physical phone accuracy',()=>{
 const r=compareRecognitionCandidate(locked,base());
 assert.equal(r.genuineHumanPhysicalGarmentMasksApproved,false);
 assert.equal(r.physicalCameraColorOrRuntimeMeasured,false);
 assert.equal(r.avatarGarmentFidelityMeasured,false);
 assert.equal(r.mustVerifyModelInferenceAndHeldOutSourceBeforeAnyPromotion,true);
});
