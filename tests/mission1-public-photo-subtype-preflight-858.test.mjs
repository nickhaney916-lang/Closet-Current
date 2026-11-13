import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {input80} from '../scripts/p80-synthetic-evaluation.mjs';
import {
 validEvidence80, validateSubtypeRequest80, hash80,
 photoDetailIssue80, decide80, createReview80
} from '../public/subtype-review-80.mjs';
import {ORIGINAL_RUN_857,OBSERVED_32_857} from '../research/mission1-real-worker-legacy-audit-857/observed-32-results.mjs';
import {triageLegacyRegression80} from '../scripts/p80-legacy-regression-triage.mjs';
import {checkRecognitionRegressions} from '../scripts/check-recognition-regressions.mjs';
import {evaluateMission1Evidence} from '../scripts/m1-release-evidence-851.mjs';

const manifest=JSON.parse(await readFile('benchmark/manifest-reviewed-32.json','utf8'));
const baseline=JSON.parse(await readFile('benchmark/regression-reviewed-32.json','utf8'));
test('P858 source-verified public 32-photo real default-path failures remain strict FAIL, not masked by opt-in tests',()=>{
 const strict=checkRecognitionRegressions(manifest,OBSERVED_32_857,baseline);
 const triage=triageLegacyRegression80(manifest,OBSERVED_32_857,baseline);
 assert.equal(ORIGINAL_RUN_857.realModelDefaultPath,true);
 assert.equal(strict.passed,false);
 assert.equal(strict.photoCount,32);
 assert.equal(strict.failures.length,10);
 assert.equal(triage.legacyPassed,false);
 assert.equal(triage.legacyFailureCount,10);
 assert.equal(triage.ownerReviewAbstentionCases.length,5);
 assert.equal(triage.releaseAuthorized,false);
});
test('P858 poor detail rejects before comparing FashionCLIP, preserving Unknown',()=>{
 for(const quality of [
  null,{detailVisible:true,minimumSide:96},
  {detailVisible:true,minimumSide:384,lowLight:true},
  {detailVisible:true,minimumSide:384,clipped:true},
  {detailVisible:true,minimumSide:384,occluded:true},
  {detailVisible:true,minimumSide:384,overlapping:true}
 ]){
  assert.equal(photoDetailIssue80(quality),'insufficient-visible-photo-detail');
  const candidate=input80('Shoes','Sneakers','Ankle boots');
  candidate.quality=quality;
  const decision=decide80(candidate);
  assert.equal(decision.status,'abstain');
  assert.equal(decision.itemType,'Unknown');
  assert.equal(decision.automaticallyCertified,false);
 }
 assert.equal(photoDetailIssue80({detailVisible:true,minimumSide:320,lowLight:false,clipped:false,occluded:false,overlapping:false,soft:false}),null);
});
test('P858 complete 12-field evidence capsule binds real input JPEG digest; extra fields and stale input fail',async()=>{
 const bytes=await readFile('benchmark/fixtures/commons-0003.jpg');
 const image='data:image/jpeg;base64,'+bytes.toString('base64');
 const pristine=structuredClone(input80().evidence);
 pristine.inputSha256=await hash80(bytes);
 assert.equal(validEvidence80(pristine),true);
 const good=await validateSubtypeRequest80({image,subtype80:{
  schema:'subtype80-v1',enabled:true,consent:true,categoryOwnerReviewed:true,evidence:pristine
 }});
 assert.equal(good.inputSha256,pristine.inputSha256);
 assert.equal(Object.isFrozen(good),true);
 await assert.rejects(validateSubtypeRequest80({image,subtype80:{
  schema:'subtype80-v1',enabled:true,consent:true,categoryOwnerReviewed:true,
  evidence:{...pristine,inputSha256:'0'.repeat(64)}
 }}),/OPT_IN_SOURCE_REQUIRED/);
 const invalid=[
  {...pristine,unauthorizedOriginalImage:image},
  {...pristine,ownerId:' '},
  {...pristine,sourceSha256:'abc'},
  {...pristine,segmented:'false'},
  {...pristine,unitStatus:'paired_confirmed'}
 ];
 for(const bad of invalid) assert.equal(validEvidence80(bad),false);
 assert.equal(OBSERVED_32_857.length,32);
});
test('P858 P855 original-photo source lease and P80 pre-inference quality gate coexist in actual app modules',async()=>{
 const [app,panel,worker]=await Promise.all([
 readFile('public/app.js','utf8'),readFile('public/subtype-panel-80.mjs','utf8'),readFile('public/local-worker.mjs','utf8')]);
 assert.match(app,/const live854=\(\)=>sameOwner854\(\)/);
 assert.match(app,/P80_STALE_SAVE_SCOPE/);
 assert.match(app,/new URLSearchParams\(location.search\)\.get\('subtype80'\)==='1'/);
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(panel,/if \(photoDetailIssue80\(quality\)\)/);
 assert.ok(panel.indexOf('if (photoDetailIssue80(quality))')<panel.indexOf("await request("),'bad-quality guard must precede model request');
 assert.match(worker,/validateSubtypeRequest80/);
 assert.match(worker,/subtype-candidates80/);
 const x=input80(),decision=decide80(x);
 assert.equal(decision.automaticallyCertified,false);
 assert.throws(()=>createReview80({decision:{...decision},evidence:x.evidence,live:async()=>x.current}),/UNISSUED/);
 const gate=evaluateMission1Evidence(null);
 assert.equal(gate.status,'BLOCKED');
 assert.equal(gate.shouldLiftFamilyAlphaHold,false);
 assert.equal(gate.countOfIndependentHumanBlindSources,0);
 assert.equal(gate.countOfPhysicalDevicePlatforms,0);
});