import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ORIGINAL_RUN_857,OBSERVED_32_857} from '../research/mission1-real-worker-legacy-audit-857/observed-32-results.mjs';
import {checkRecognitionRegressions} from '../scripts/check-recognition-regressions.mjs';
import {triageLegacyRegression80} from '../scripts/p80-legacy-regression-triage.mjs';
import {evaluateMission1Evidence} from '../scripts/m1-release-evidence-851.mjs';
import {input80} from '../scripts/p80-synthetic-evaluation.mjs';
import {decide80,createReview80} from '../public/subtype-review-80.mjs';

const manifest=JSON.parse(await readFile('benchmark/manifest-reviewed-32.json','utf8'));
const baseline=JSON.parse(await readFile('benchmark/regression-reviewed-32.json','utf8'));
const boots=['commons-0088','commons-0089','commons-0092','commons-0093','commons-0094'];

test('P857 real 32-image public Actions result is source-identified, complete and not independent ground truth',()=>{
 assert.equal(ORIGINAL_RUN_857.runId,43372968710);
 assert.equal(ORIGINAL_RUN_857.artifactId,14013321896);
 assert.equal(ORIGINAL_RUN_857.originalHead,'12aba9b54d18b2da384781c005dfad13fd688410');
 assert.match(ORIGINAL_RUN_857.originalResultsJsonSha256,/^[a-f0-9]{64}$/);
 assert.match(ORIGINAL_RUN_857.originalArtifactZipSha256,/^[a-f0-9]{64}$/);
 assert.equal(ORIGINAL_RUN_857.humanGroundTruth,false);
 assert.equal(ORIGINAL_RUN_857.sealedBlind,false);
 assert.equal(ORIGINAL_RUN_857.independentAccuracy,null);
 assert.equal(OBSERVED_32_857.length,32);
 assert.equal(new Set(OBSERVED_32_857.map(x=>x.id)).size,32);
 assert.deepEqual(OBSERVED_32_857.map(x=>x.id).slice().sort(),manifest.map(x=>x.id).slice().sort());
});
test('P857 unchanged strict checker reproduces REAL observed ten regression failures across five boots',()=>{
 const report=checkRecognitionRegressions(manifest,OBSERVED_32_857,baseline);
 assert.equal(report.passed,false);
 assert.equal(report.photoCount,32);
 assert.equal(report.failures.length,10);
 assert.deepEqual(new Set(report.failures.map(x=>x.id)),new Set(boots));
 for(const id of boots){
  const r=OBSERVED_32_857.find(x=>x.id===id);
  assert.deepEqual(r.prediction,{category:'Shoes',type:'Unknown'});
  assert.equal(r.strong,false);
  assert.equal(r.categoryConfirmed,true);
  const reasons=report.failures.filter(x=>x.id===id).map(x=>x.reason).sort();
  assert.deepEqual(reasons,['automatic_indexing_regression','type_regression']);
 }
});
test('P857 separate legacy triage can EXPLAIN actual safe Unknowns but MUST preserve FAIL and HOLD',()=>{
 const triage=triageLegacyRegression80(manifest,OBSERVED_32_857,baseline);
 assert.equal(triage.legacyPassed,false);
 assert.equal(triage.legacyFailureCount,10);
 assert.equal(triage.ownerReviewAbstentionCases.length,5);
 assert.equal(triage.unresolvedFailures.length,0);
 assert.equal(triage.verdict,'LEGACY_REGRESSION_FAIL_REQUIRES_REVIEW');
 assert.equal(triage.permitsAutomaticIndexing,false);
 assert.equal(triage.releaseAuthorized,false);
 assert.equal(triage.familyAlphaHold,true);
 assert.equal(triage.independentSubtypeAccuracy,null);
 assert.equal(triage.optInSubtype80ModelAccuracy,null);
 const signed=evaluateMission1Evidence(null);
 assert.equal(signed.status,'BLOCKED');
 assert.equal(signed.shouldLiftFamilyAlphaHold,false);
});
test('P857 changing an observed Unknown to confidently wrong sneakers NEVER receives abstention explanation',()=>{
 const current=OBSERVED_32_857.map(x=>structuredClone(x));
 const wrong=current.find(x=>x.id==='commons-0088');
 wrong.prediction.type='Sneakers';wrong.strong=true;wrong.categoryConfirmed=false;
 const triage=triageLegacyRegression80(manifest,current,baseline);
 assert.equal(triage.legacyPassed,false);
 assert.ok(triage.unresolvedFailures.some(x=>x.id==='commons-0088'));
 assert.ok(triage.unresolvedFailures.some(x=>x.legacyReasons.includes('new_incorrect_automatic_type')));
 assert.equal(triage.releaseAuthorized,false);
});
test('P857 new real-worker immutable subtype decisions still never become independent labels or autosaves',async()=>{
 const candidate=decide80(input80('Shoes','Sneakers','Ankle boots'));
 assert.equal(candidate.status,'hypotheses');
 assert.equal(candidate.itemType,'Unknown');
 assert.equal(candidate.automaticallyCertified,false);
 assert.equal(candidate.requiresOwnerConfirmation,true);
 assert.throws(()=>createReview80({evidence:candidate.evidence,decision:{...candidate},live:async()=>candidate.evidence}),/UNISSUED/);
 assert.equal(evaluateMission1Evidence(null).shouldLiftFamilyAlphaHold,false);
});
