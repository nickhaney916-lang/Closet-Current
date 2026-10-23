import test from 'node:test';
import assert from 'node:assert/strict';
import {fromRepository,rescore,COHORTS} from '../scripts/independent-rescore-current-59.mjs';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const raw=read('benchmark/ISSUE-211-FROZEN-CURRENT-59.json');
const manifests=Object.fromEntries(COHORTS.map(c=>[c,read('benchmark/manifest-'+c+'.json')]));
const sources=read('benchmark/locked-photo-sources.json');
const run=edit=>{const copy=structuredClone(raw);edit?.(copy);return rescore(copy,manifests,sources);};
test('independent replay: 59 IDs and 56 garment labels, five abstentions, four unsafe auto subtypes',()=>{
 const r=fromRepository();
 assert.deepEqual(r.totals,{photos:59,garments:56,correctBroadCategories:51,
  broadAccuracyPercent:91.07,categoryAbstentions:5,automaticDecisions:47,
  wrongAutomatic:4,unsafeAutoPercent:8.51,negativeControls:3,rejectedControls:3,errors:0});
 assert.deepEqual(r.unsafeSubtypeIds,['commons-0003','commons-0014','commons-0064','commons-0078']);
 assert.equal(r.modelPromotionBlocked,true);
 assert.equal(r.independentPhysicalMasks,false);
 assert.equal(r.releaseApproved,false);
});
test('per-cohort and per-garment accuracy re-scored, not copied from admission report',()=>{
 const r=run();
 assert.deepEqual(COHORTS.map(c=>[r.byCohort[c].photos,r.byCohort[c].categoryCorrect,r.byCohort[c].wrongAutomatic]),
  [[32,32,1],[16,8,3],[11,11,0]]);
 assert.deepEqual(['Shoes','Dresses','Bottoms','Outerwear','Tops','Accessories'].map(c=>[r.byCategory[c].total,r.byCategory[c].correct]),
  [[20,19],[9,8],[13,12],[8,7],[5,4],[1,1]]);
 assert.equal(r.changedHistoricalIds.length,8);
});
test('tampered original source SHA or manifest category is rejected',()=>{
 assert.throws(()=>run(c=>{c.rows[0].originalSHA256='0'.repeat(64)}),/source hash mismatch/);
 assert.throws(()=>run(c=>{c.rows[0].expectedCategory='Shoes'}),/manifest truth/);
});
test('missing, duplicate or cohort-swapped sources fail closed',()=>{
 assert.throws(()=>run(c=>{c.rows.pop()}),/Missing\/extra/);
 assert.throws(()=>run(c=>{c.rows[1].id=c.rows[0].id}),/Duplicate/);
 assert.throws(()=>run(c=>{c.rows[0].cohort='fresh-11'}),/reassigned/);
});
test('fabricated strong subtype or category is counted as unsafe, never silently accepted',()=>{
 const x=run(c=>{const r=c.rows.find(r=>r.id==='commons-0035');r.current.strong=true;r.current.prediction={category:'Shoes',type:'Sneakers'};});
 assert.equal(x.modelPromotionBlocked,true);
 assert.ok(x.totals.wrongAutomatic>4);
 assert.ok(x.wrongCategoryIds.includes('commons-0035'));
});
test('nonclothing control false positive cannot pass as successful category coverage',()=>{
 const x=run(c=>{const r=c.rows.find(r=>r.expectedCategory==='Uncategorized');r.current.prediction={category:'Tops',type:'T-shirt'};r.current.strong=true;});
 assert.equal(x.totals.rejectedControls,2);
 assert.ok(x.wrongCategoryIds.length>0);
 assert.equal(x.modelPromotionBlocked,true);
});
test('no copied fixture or synthetic oracle grants real original bytes or human mask truth',()=>{
 const r=run();
 assert.equal(r.originalBytesIndependentlyRead,false);
 assert.equal(r.independentPhysicalMasks,false);
 assert.equal(r.realPhoneVerified,false);
 assert.equal(r.releaseApproved,false);
 assert.match(r.evidence,/NOT_NEW_INFERENCE/);
});
