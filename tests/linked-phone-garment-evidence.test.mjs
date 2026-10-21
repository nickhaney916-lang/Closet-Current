import test from 'node:test';
import assert from 'node:assert/strict';
import {blankTrial,validateTrial,parseTrial,summarizeTrial,scenes,platforms,slots} from '../scripts/linked-phone-garment-evidence.mjs';
test('fixed balanced phone matrix is 24 original scenes and 30 labeled garments',()=>{
 assert.equal(scenes.length,12);assert.equal(platforms.length,2);assert.equal(slots.length,30);
 assert.equal(new Set(slots.map(s=>s.id)).size,30);
 assert.equal(slots.filter(s=>s.scene==='whole-outfit').length,8);
 const blank=blankTrial();assert.deepEqual(validateTrial(blank),blank);
 const summary=summarizeTrial(blank);
 assert.equal(summary.reviewedOriginalScenes,0);assert.equal(summary.requiredOriginalScenes,24);
 assert.equal(summary.modelExactPercentOfReviewed,null);
 assert.equal(summary.verifiedRecognitionAccuracy,null);
 assert.equal(summary.productionPromotion,'BLOCKED');
});
test('original first label is held separate from later suggestion and saved outcome',()=>{
 const report=blankTrial();const row=report.rows[0];
 row.phase='locked';row.truthCategory='sneakers';row.truthColor='black';
 assert.deepEqual(validateTrial(report),report);
 row.phase='recorded';row.modelCategory='boots';row.modelColor='black';
 row.savedCategory='sneakers';row.savedColor='black';row.savedPhoto='clear';
 const summary=summarizeTrial(report);
 assert.equal(summary.reviewedGarmentEntries,1);
 assert.equal(summary.modelCategoryCorrect,0);
 assert.equal(summary.modelColorCorrect,1);
 assert.equal(summary.modelCategoryColorExact,0);
 assert.equal(summary.savedCategoryColorExact,1);
 assert.equal(summary.modelExactPercentOfReviewed,0);
 assert.equal(summary.savedExactPercentOfReviewed,100);
 assert.equal(summary.reviewedOriginalScenes,1);
 assert.equal(summary.physicalAndroidVerified,false);
 assert.equal(summary.verifiedRecognitionAccuracy,null);
});
test('all matches on all rows remain self reported and never authorize release',()=>{
 const report=blankTrial();report.appRelease='abcdef123456';
 for(const row of report.rows){
  row.phase='recorded';row.truthCategory='top';row.truthColor='red';
  row.modelCategory='top';row.modelColor='red';
  row.savedCategory='top';row.savedColor='red';row.savedPhoto='clear';
 }
 const result=summarizeTrial(report);
 assert.equal(result.reviewedOriginalScenes,24);
 assert.equal(result.reviewedGarmentEntries,30);
 assert.equal(result.modelExactPercentOfReviewed,100);
 assert.equal(result.savedExactPercentOfReviewed,100);
 assert.equal(result.verifiedRecognitionAccuracy,null);
 assert.equal(result.authenticIndependentReviewerVerified,false);
 assert.equal(result.productionPromotion,'BLOCKED');
});
test('forged accounts, device flags, images, labels and unsupported private data rejected',()=>{
 const bad=[
  x=>x.email='contact@example.com',
  x=>x.photo='data:image/png;base64,PRIVATE',
  x=>x.claims.physicalHardwareVerified=true,
  x=>x.claims.independentOriginalReviewVerified=true,
  x=>x.appRelease='some secret token',
  x=>x.rows[0].name='private filename',
  x=>x.rows[0].id='../source.jpeg',
  x=>x.rows[0].phase='recorded',
  x=>x.rows[0].truthCategory='boots',
  x=>x.rows[0].phase='locked',
  x=>x.rows[0].truthCategory='shoe',
  x=>x.rows[0].savedPhoto='clear',
  x=>x.rows.pop()
 ];
 for(const edit of bad){
  const x=blankTrial();edit(x);assert.throws(()=>validateTrial(x));
 }
 for(const raw of ['{','null','[]','x'.repeat(131073)])assert.throws(()=>parseTrial(raw));
});
test('unrecognized model, not saved and pixelated saved outcomes count as failures',()=>{
 const r=blankTrial();
 const first=r.rows[0];Object.assign(first,{phase:'recorded',truthCategory:'boots',truthColor:'beige',
  modelCategory:'unrecognized',modelColor:'unrecognized',savedCategory:'not_saved',
  savedColor:'not_saved',savedPhoto:'not_saved'});
 const second=r.rows[1];Object.assign(second,{phase:'recorded',truthCategory:'boots',truthColor:'brown',
  modelCategory:'boots',modelColor:'brown',savedCategory:'boots',
  savedColor:'brown',savedPhoto:'pixelated'});
 const m=summarizeTrial(r);
 assert.equal(m.modelCategoryColorExact,1);
 assert.equal(m.savedCategoryColorExact,1);
 assert.equal(m.savedPhotoIssues,1);
 assert.equal(m.modelExactPercentOfReviewed,50);
});
test('inconsistent saved record cannot inflate success denominators',()=>{
 const r=blankTrial();Object.assign(r.rows[0],{phase:'recorded',truthCategory:'boots',
  truthColor:'brown',modelCategory:'boots',modelColor:'brown',
  savedCategory:'not_saved',savedColor:'brown',savedPhoto:'clear'});
 assert.throws(()=>validateTrial(r));
});
