import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {input80} from '../scripts/p80-synthetic-evaluation.mjs';
import {decide80,VERSION} from '../public/subtype-review-80.mjs';
import {evaluateMission1Evidence} from '../scripts/m1-release-evidence-851.mjs';
import {fixture} from '../scripts/p79-synthetic-fixtures.mjs';
import {independentAgreement} from '../scripts/p75-dataset-core.mjs';

// P856 runs ONLY synthetic photos/model scores and temporary cryptographic test
// keys. No approved independent rater, true photograph label or real model
// recognition accuracy is claimed.
const confusionCases=[
 ['Bottoms','Shorts','Skirt'],['Dresses','Shirt dress','Casual dress'],
 ['Outerwear','Jacket','Coat'],['Shoes','Sneakers','Ankle boots']
];
test('P856 opt-in competing garment hypotheses never override the current owner-reviewed Unknown type',()=>{
 for(const [category,a,b] of confusionCases){
  const output=decide80(input80(category,a,b));
  assert.equal(output.status,'hypotheses',category);
  assert.equal(output.itemType,'Unknown',category);
  assert.equal(output.automaticallyCertified,false,category);
  assert.ok(output.alternatives.every(v=>v.category===category),category);
  assert.ok(output.alternatives.length>0&&output.alternatives.length<=3,category);
  assert.equal(evaluateMission1Evidence(null).shouldLiftFamilyAlphaHold,false);
 }
});
test('P856 old owner, original photo, crop, mask or model score binding revokes hypotheses before saved item',()=>{
 const patches=[
  x=>{x.current.ownerId='other';},
  x=>{x.current.sourceSha256='0'.repeat(64);},
  x=>{x.current.inputSha256='0'.repeat(64);},
  x=>{x.current.maskDescriptorSha256='0'.repeat(64);},
  x=>{x.current.revisionSha256='0'.repeat(64);},
  x=>{x.model.vectorsSha256='0'.repeat(64);},
  x=>{x.views.confirmation[0].score=NaN;},
  x=>{x.consent=false;}
 ];
 for(const mutate of patches){
  const x=input80();mutate(x);
  const decision=decide80(x);
  assert.equal(decision.status,'abstain');
  assert.equal(decision.automaticallyCertified,false);
  assert.equal(decision.itemType,'Unknown');
 }
});
test('P856 signed synthetic P75 human evidence disputes cannot be promoted by good-looking P80 model scores',async()=>{
 const f=await fixture();
 try{
  const row=f.bundle.sources[0].source,one=f.receipt(0),
   two=f.receipt(1,{...f.label,quality:{...f.label.quality,background:'busy'}});
  const consensus=independentAgreement(row,[one,two],f.bundle.registry,f.bundle.approvedFingerprint);
  assert.equal(consensus.eligible,false);
  assert.match(consensus.issues.join(' '),/full-label disagreement/);
  assert.equal(decide80(input80()).status,'hypotheses');
  const report=evaluateMission1Evidence(null);
  assert.equal(report.status,'BLOCKED');
  assert.equal(report.countOfIndependentHumanBlindSources,0);
  assert.equal(report.shouldLiftFamilyAlphaHold,false);
 }finally{await f.cleanup();}
});
test('P856 source scanner lease and subtype owner-review hooks coexist; default flag remains off',async()=>{
 const app=await readFile('public/app.js','utf8');
 const worker=await readFile('public/local-worker.mjs','utf8');
 const adjustment=app.slice(app.indexOf('function adjustPhoto(item){'),app.indexOf('function renderRecognitionNotice(){'));
 const scanner=app.slice(app.indexOf('async function recognizeItem(item){'),app.indexOf('async function recognizeBatch(){'));
 assert.equal(VERSION,'subtype80-v1');
 assert.match(adjustment,/subtype80Enabled=Boolean\(pendingDraft&&new URLSearchParams\(location.search\)\.get\('subtype80'\)==='1'&&subtype80Owner\?\.id\)/);
 assert.match(adjustment,/subtype80Panel&&!\s*subtype80Panel\.valid\(\)/);
 assert.match(adjustment,/import\('\.\/subtype-panel-80\.mjs'\)/);
 assert.match(adjustment,/P80_STALE_SAVE_SCOPE/);
 assert.match(scanner,/const live854=\(\)=>sameOwner854\(\)/);
 assert.match(scanner,/result=await localRequest\('classify',source73,item\.id,item\.segmentHint\)/);
 assert.match(scanner,/if\(!live854\(\)\)return false/);
 assert.match(worker,/request\.type==='subtype-candidates80'/);
 assert.match(worker,/request\.subtype80\?\.consent!==true/);
 assert.match(app,/^const reviewFirst836=true;$/m);
});
