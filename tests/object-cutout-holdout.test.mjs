import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOLDOUT_IDS,selectHoldoutPhotos,holdoutReport,promotionReadiness} from '../benchmark/object-cutout-holdout.mjs';
const row=id=>({id,image:id+'.jpg',verified:true,sha256:'a'.repeat(64),conditions:['fresh-independent-validation'],
  attribution:{license:'CC0',source:'https://commons.wikimedia.org/wiki/File:Example.jpg'},expectedCategory:'Shoes'});
test('independent verified photos are selected in stable order',()=>{
  const all=[...HOLDOUT_IDS].reverse().map(row);
  const chosen=selectHoldoutPhotos(all);
  assert.deepEqual(chosen.map(x=>x.id),[...HOLDOUT_IDS]);
  assert.equal(new Set(chosen.map(x=>x.id)).size,7);
});
test('fail closed for overlap with original comparison or duplicate selection',()=>{
  const rows=HOLDOUT_IDS.map(row);
  assert.throws(()=>selectHoldoutPhotos(rows,HOLDOUT_IDS,['validation-0017']),/overlapping/);
  assert.throws(()=>selectHoldoutPhotos(rows,['validation-0019','validation-0019']),/duplicate/);
  assert.throws(()=>selectHoldoutPhotos([...rows,rows[0]]),/duplicate/);
});
test('missing, changed or unreviewed source photos cannot be used',()=>{
  const rows=HOLDOUT_IDS.map(row);
  assert.throws(()=>selectHoldoutPhotos(rows,['validation-9999']),/Unverified/);
  for(const change of [
    {verified:false},{sha256:'0bad'},{image:'../../../bad.jpg'},
    {attribution:{license:'',source:''}},{conditions:[]}
  ]){
    const changed=rows.map(x=>x.id===HOLDOUT_IDS[0]?{...x,...change}:x);
    assert.throws(()=>selectHoldoutPhotos(changed),/Unverified/);
  }
});
test('holdout report never asserts measured mask accuracy or phone performance',()=>{
 const s=holdoutReport({cases:[{id:'validation-0019',inferenceMs:9000}],modelId:'pinned-model',revision:'sha',loadMs:5000,status:'complete'});
 assert.equal(s.maskGroundTruthAvailable,false);assert.equal(s.pixelAccuracyMeasured,false);
 assert.equal(s.phonePerformanceMeasured,false);assert.equal(s.noProductionChanges,true);
 assert.equal(s.sourceRgbPreserved,true);assert.equal(s.cases.length,1);
 assert.throws(()=>holdoutReport({cases:[],status:'claimed-accurate',modelId:'id',revision:'sha'}));
});

test('visual failures block production even when all seven inference runs succeeded',()=>{
 const r=JSON.parse(readFileSync('benchmark/object-cutout-holdout-review.json','utf8'));
 assert.equal(r.allCasesProcessed,true);
 const assessment=promotionReadiness(r);
 assert.equal(assessment.canPromote,false);
 assert.equal(assessment.productionChanged,false);
 assert.ok(assessment.reasons.includes('worn-garment-or-mannequin-not-isolated'));
 assert.ok(assessment.reasons.includes('independent-pixel-references-missing'));
 assert.ok(assessment.reasons.includes('real-phone-performance-unmeasured'));
 assert.equal(r.cases.filter(x=>x.personOrMannequinRetained).length,3);
 assert.equal(r.productionAuthorized,false);
});
test('review checklist refuses unsupported or partial automatic promotion',()=>{
 const all=HOLDOUT_IDS.map(id=>({id,personOrMannequinRetained:false,approvedGarmentOnly:true}));
 const ready={cases:all,allCasesProcessed:true,independentlyApprovedMasks:true,realPhonePerformanceMeasured:true};
 assert.equal(promotionReadiness(ready).canPromote,true);
 assert.equal(promotionReadiness({...ready,cases:all.slice(0,6)}).canPromote,false);
 assert.equal(promotionReadiness({...ready,cases:[{...all[0],personOrMannequinRetained:true},...all.slice(1)]}).canPromote,false);
 assert.throws(()=>promotionReadiness(null));
});
