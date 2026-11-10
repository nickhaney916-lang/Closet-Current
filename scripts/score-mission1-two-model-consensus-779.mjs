/**
 * P779 post-inference only. All four real browser model runs must be
 * complete BEFORE model-independent approval decisions are attempted.
 * Never downloads, uploads, saves, or relabels original garment photographs.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {scoreTwoModelConsensus779} from '../research/mission1-two-model-consensus-779/mask-consensus.mjs';
import {P772_EXPOSED_DIGESTS_774} from '../research/mission1-exposure-774/pinned-exposed-source-history.mjs';
const sourceCohort=process.env.MISSION1_COMPARE_COHORT||'prior6';
assert.ok(['prior6','p772'].includes(sourceCohort),'only real already exposed publisher cohorts allowed');
const manifest=JSON.parse(await readFile('research/real-garment-acceptance-66/fashionpedia-sample.json','utf8'));
const expectedSources=sourceCohort==='prior6'?manifest.rows.map(x=>x.sha256):P772_EXPOSED_DIGESTS_774;
const expectedCount=sourceCohort==='prior6'?6:8;
const expectedAnnotations=sourceCohort==='prior6'?16:20;
assert.equal(expectedSources.length,expectedCount);
assert.equal(new Set(expectedSources).size,expectedCount);
if(sourceCohort==='prior6')assert.ok(manifest.rows.every(x=>x.archiveMember&&x.annotations?.length>0));
const results={schema:'closet-current-mission1-cross-model-779/v1',
 fixedThresholdBeforeEvaluation:.25,sourceExclusionCohort:sourceCohort,
 engines:{},modelPromoted:false,independentHoldout:false,
 independentTwoHumanTruth:false,physicallyVerifiedMobileOwnerFlow:false,
 missionOneCompleted:false,releaseAuthorized:false,familyAlpha:'HOLD'};
for(const engine of ['chromium','webkit']){
 const getDir=model=>sourceCohort==='prior6'?
  'benchmark/mission1-'+model+'-prior6-778/'+engine+'/results.json':
  'benchmark/'+(model==='b0'?'mission1-unseeded-region-773':'mission1-b2-777')+'/'+engine+'/results.json';
 const [b0,b2]=await Promise.all(['b0','b2'].map(async model=>JSON.parse(await readFile(getDir(model),'utf8'))));
 const outcome=scoreTwoModelConsensus779({b0,b2,expectedSources,engine,sourceCohort});
 assert.equal(outcome.photos,expectedCount);
 assert.equal(outcome.originalPublisherHumanInstances,expectedAnnotations);
 assert.equal(outcome.rawB0SeededReview.truePositives,b0.summary.candidateInstanceDiagnostic.truePositives);
 assert.equal(outcome.rawB2SeededReview.truePositives,b2.summary.candidateInstanceDiagnostic.truePositives);
 assert.equal(outcome.rawB0SeededReview.falsePositives,b0.summary.candidateInstanceDiagnostic.falsePositives);
 assert.equal(outcome.rawB2SeededReview.falsePositives,b2.summary.candidateInstanceDiagnostic.falsePositives);
 assert.equal(outcome.modelPromotionAuthorized,false);
 assert.equal(outcome.missionOneCompleted,false);
 results.engines[engine]=outcome;
 console.log(JSON.stringify({engine,rawB0:outcome.rawB0SeededReview,
  rawB2:outcome.rawB2SeededReview,
  fixedBlindConsensusReviewOnly:outcome.twoModelCorroboratedOnly,
  sourceOriginalCount:outcome.photos,sourceCohort,
  humanSourcePixelsFalsified:false,ownerReviewed:0,
  developmentCohortExposed:true,noRelease:true}));
}
await mkdir('benchmark/mission1-779',{recursive:true});
await writeFile('benchmark/mission1-779/'+sourceCohort+'-consensus.json',JSON.stringify(results,null,2)+'\n');
