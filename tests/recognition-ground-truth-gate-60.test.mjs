import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 auditRecognitionEvidence60,resolveIndependentTruth60,wilsonInterval60,
 CATEGORIES60
} from '../research/recognition-ground-truth-gate-60/ground-truth-gate.mjs';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const actualSets={
 development:read('benchmark/manifest-reviewed-32.json'),
 validation:read('benchmark/manifest-fresh-11.json'),
 'locked-evaluation':read('benchmark/manifest-holdout-16.json')
};
const actualSources=read('benchmark/locked-photo-sources.json');
const actual=()=>auditRecognitionEvidence60({sets:actualSets,sourceRows:actualSources});
test('RECOG60 actual source photo manifest has 59 unique SHA locked 32/11/16',()=>{
 const r=actual();
 assert.equal(r.counts.sourceRows,59);
 assert.equal(r.counts.uniqueSHA256,59);
 assert.deepEqual([r.counts.development,r.counts.validation,r.counts.lockedEvaluation],[32,11,16]);
 assert.equal(r.counts.lockedGarments,13);
 assert.equal(r.counts.lockedNegatives,3);
 assert.deepEqual(Object.values(r.perClassLockedProvisional),[3,3,2,2,3]);
 assert.deepEqual(r.counts.outOfScopeHistoricalLabels,
  [{id:'validation-0008',split:'validation',category:'Accessories',itemType:'Scarf'}],
  'Preserve real accessory source even though current saved-closet taxonomy has no Accessories class');
});
test('RECOG60 all current provisional visual-review flags are insufficient for independent certification',()=>{
 const r=actual();
 assert.equal(r.scientificVerdict,'NEEDS_REWORK');
 assert.equal(r.counts.independentlyAdjudicated,0);
 assert.equal(r.counts.lockedIndependentlyAdjudicated,0);
 assert.equal(r.counts.preliminaryHistoricalColorLabels,0);
 assert.equal(r.measuredIndependentMetrics,null);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.pendingHumanReviews.length,59);
 assert.ok(r.failures.includes('unsupported-historical-taxonomy-needs-independent-scope-review'));
 assert.ok(r.failures.includes('independent-human-ground-truth-or-primary-color-missing'));
 assert.ok(r.failures.includes('no-complete-per-photo-pinned-model-results'));
});
test('RECOG60 Wilson intervals expose why 9/13 and 4/13 are small sample estimates',()=>{
 const category=wilsonInterval60(9,13),type=wilsonInterval60(4,13);
 assert.ok(category.estimate>.69&&category.estimate<.70&&category.lower<.5);
 assert.ok(type.estimate>.30&&type.estimate<.31&&type.upper>.5);
 assert.deepEqual(wilsonInterval60(0,0),{estimate:null,lower:null,upper:null});
 assert.throws(()=>wilsonInterval60(14,13),/invalid/);
});
function fixture(){
 const sets={development:[],validation:[],'locked-evaluation':[]};
 const sources=[],reviewers={},predictions=[];
 const categories=[...CATEGORIES60],types=['T-shirt','Jeans','Casual dress','Jacket','Sneakers'];
 for(let i=0;i<100;i++){
  const id='synthetic-'+String(i).padStart(3,'0'),sha256=i.toString(16).padStart(64,'0');
  const split=i<40?'development':i<60?'validation':'locked-evaluation',negative=i>=90;
  const ci=(i>=60?i-60:i)%5,category=negative?'Uncategorized':categories[ci],itemType=negative?'Unknown':types[ci];
  const row={id,image:id+'.jpg',expectedCategory:category,expectedType:itemType,verified:true};
  sets[split].push(row);
  sources.push({id,image:row.image,sha256,verified:true,attribution:{source:'https://example.invalid/'+id,license:'synthetic test fixture only'}});
  const label={category,itemType,primaryColor:negative?null:'Blue',secondaryColor:null};
  const vote=reviewerId=>({...label,sourceSHA256:sha256,reviewerId,independent:true,method:'direct-human-visual-review',reviewedAt:'2026-11-05T12:00:00Z'});
  reviewers[id]={sourceSHA256:sha256,independentReviews:[vote('human-AA'),vote('human-BB')]};
  if(split==='locked-evaluation')predictions.push({id,sourceSHA256:sha256,split,category,itemType,primaryColor:label.primaryColor,accepted:!negative});
 }
 return {sets,sourceRows:sources,adjudications:reviewers,predictions};
}
test('RECOG60 synthetic positive test can only PASS with 100 unique labeled photos and complete locked predictions',()=>{
 const r=auditRecognitionEvidence60(fixture());
 assert.equal(r.scientificVerdict,'PASS');
 assert.equal(r.releaseAuthorized,false,'Even scientific PASS never authorizes release');
 assert.equal(r.counts.independentlyAdjudicated,100);
 assert.equal(r.counts.lockedGarments,30);
 assert.equal(r.counts.lockedNegatives,10);
 assert.equal(r.measuredIndependentMetrics.measuredIndependentGarments,30);
 assert.equal(r.measuredIndependentMetrics.primaryColor.estimate,1);
});
test('RECOG60 duplicated source bytes across splits fails closed',()=>{
 const f=fixture();f.sourceRows[1].sha256=f.sourceRows[0].sha256;
 assert.throws(()=>auditRecognitionEvidence60(f),/duplicate photograph/i);
});
test('RECOG60 source manifest missing legal provenance fails closed',()=>{
 const f=fixture();delete f.sourceRows[3].attribution.license;
 assert.throws(()=>auditRecognitionEvidence60(f),/provenance/);
});
test('RECOG60 two reviewer entries with same reviewer id are NOT independent',()=>{
 const f=fixture(),id=f.sets['locked-evaluation'][0].id;
 f.adjudications[id].independentReviews[1].reviewerId='human-AA';
 const r=auditRecognitionEvidence60(f);
 assert.equal(r.scientificVerdict,'NEEDS_REWORK');
 assert.equal(r.counts.independentlyAdjudicated,99);
 assert.equal(r.pendingHumanReviews.find(x=>x.id===id)?.reason,'distinct-human-reviewers-required');
});
test('RECOG60 independently signed but incompatible color labels need separate third human adjudication',()=>{
 const f=fixture(),row=f.sets['locked-evaluation'][0],claim=f.adjudications[row.id];
 claim.independentReviews[1].primaryColor='Green';
 assert.equal(resolveIndependentTruth60({id:row.id,sha256:claim.sourceSHA256,expectedCategory:row.expectedCategory},claim).reason,
  'independent-third-human-adjudication-required');
 claim.adjudication={...claim.independentReviews[0],reviewerId:'human-CC',primaryColor:'Blue'};
 const result=auditRecognitionEvidence60(f);
 assert.equal(result.scientificVerdict,'PASS');
 assert.equal(result.counts.independentlyAdjudicated,100);
 assert.equal(resolveIndependentTruth60({id:row.id,sha256:claim.sourceSHA256,expectedCategory:row.expectedCategory},claim).method,'third-human-adjudicated');
});
test('RECOG60 model predictions cannot borrow another image SHA or another split identity',()=>{
 const f=fixture(),p=f.predictions[0];
 p.sourceSHA256='f'.repeat(64);
 assert.throws(()=>auditRecognitionEvidence60(f),/prediction source SHA mismatch/);
 p.sourceSHA256=f.sourceRows[60].sha256;p.split='development';
 assert.throws(()=>auditRecognitionEvidence60(f),/prediction leaked/);
});
test('RECOG60 missing just one locked prediction cannot report scientific PASS',()=>{
 const f=fixture();f.predictions.pop();
 const r=auditRecognitionEvidence60(f);
 assert.equal(r.scientificVerdict,'NEEDS_REWORK');
 assert.ok(r.failures.includes('incomplete-locked-predictions'));
 assert.equal(r.measuredIndependentMetrics.missingLockedPredictionIds.length,1);
});
test('RECOG60 95% clothing category alone cannot conceal unsafe subtype/color and poor rejected controls',()=>{
 const f=fixture();
 f.predictions[0].itemType='Sneakers';f.predictions[0].primaryColor='Red';
 f.predictions.at(-1).category='Shoes';
 const r=auditRecognitionEvidence60(f);
 assert.equal(r.scientificVerdict,'NEEDS_REWORK');
 assert.ok(r.failures.some(s=>s.includes('nonGarmentRejection')));
});
test('RECOG60 a reviewer fake high-confidence model score with missing true color cannot supply scientific ground truth',()=>{
 const f=fixture(),row=f.sets['locked-evaluation'][0];
 f.adjudications[row.id].independentReviews.forEach(r=>{r.primaryColor=null;r.modelConfidence=1;});
 const o=auditRecognitionEvidence60(f);
 assert.equal(o.scientificVerdict,'NEEDS_REWORK');
 assert.ok(o.pendingHumanReviews.some(x=>x.id===row.id&&x.reason==='invalid-category-subtype-or-color-label'));
});
test('RECOG60 no invented color default or physical-device acceptance in research-only audit',()=>{
 const code=readFileSync('scripts/audit-recognition-ground-truth-60.mjs','utf8');
 assert.match(code,/HISTORICAL_PROVISIONAL_EVIDENCE_NOT_REMEASURED/);
 assert.match(code,/reviewer-.*-UNSIGNED-template/);
 assert.match(code,/actualPhotoSHAVerified/);
 assert.match(code,/scientificVerdict/);
 assert.doesNotMatch(code,/setInterval\(/);
});
