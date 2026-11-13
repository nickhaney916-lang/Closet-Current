import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {validCandidatePrediction80,summarizeConditionalCandidates80,evaluatePrivateBlind80} from "../scripts/p80-private-blind-evaluator.mjs";
import {checkRecognitionRegressions} from "../scripts/check-recognition-regressions.mjs";
import {ORIGINAL_RUN_857,OBSERVED_32_857} from "../research/mission1-real-worker-legacy-audit-857/observed-32-results.mjs";
import {evaluateMission1Evidence} from "../scripts/m1-release-evidence-851.mjs";
const src="b".repeat(64),model="a".repeat(64);
const bottom=(patch={})=>({sourceSha256:src,modelSha256:model,
 operatorCategory:"Bottoms",operatorCategoryProvenance:"blind-operator-before-truth-reveal",
 status:"hypotheses",itemType:"Unknown",requiresOwnerConfirmation:true,
 automaticallyCertified:false,alternatives:[{category:"Bottoms",itemType:"Shorts",rank:1,relativeScore:0.6}],
 ...patch});
const truth=(patch={})=>({presence:"single-garment",instanceCount:1,
 wardrobeUnit:"single-unit",category:"Bottoms",subtype:"Shorts",
 quality:{lighting:"ok",focus:"ok",framing:"ok",background:"ok"},...patch});
test("P860 all abstentions must have ZERO candidates, or else their scores could inflate coverage",()=>{
 const empty=bottom({status:"abstain",alternatives:[]});
 const fake=bottom({status:"abstain",alternatives:[{category:"Bottoms",itemType:"Shorts",rank:1,relativeScore:0.9}]});
 assert.equal(validCandidatePrediction80(empty),true);
 assert.equal(validCandidatePrediction80(fake),false);
 assert.throws(()=>summarizeConditionalCandidates80([{labels:truth(),prediction:fake}]),/INELIGIBLE/);
 const metrics=summarizeConditionalCandidates80([{labels:truth(),prediction:empty}]);
 assert.equal(metrics.sources,1);
 assert.equal(metrics.candidateSetHits,0);
 assert.equal(metrics.abstentionStatuses,1);
 assert.equal(metrics.candidateSetCoverage,0);
 assert.equal(metrics.independentlyVerifiedSubtypeAccuracy,null);
 assert.equal(metrics.releaseAuthorized,false);
});
test("P860 synthetic category-conditioned candidate inclusion cannot be misreported as end-to-end clothing accuracy",()=>{
 const metrics=summarizeConditionalCandidates80([
  {labels:truth(),prediction:bottom()},
  {labels:truth({subtype:"Skirt"}),prediction:bottom()},
  {labels:truth(),prediction:bottom({status:"abstain",alternatives:[]})}
 ]);
 assert.equal(metrics.sources,3);
 assert.equal(metrics.candidateSetHits,1);
 assert.equal(metrics.candidateSetCoverage,1/3);
 assert.equal(metrics.abstentionStatuses,1);
 assert.equal(metrics.kind,"CONDITIONAL OWNER-CATEGORY SUBTYPE CANDIDATE COVERAGE ONLY");
 assert.equal(metrics.independentlyVerifiedSubtypeAccuracy,null);
 assert.equal(metrics.releaseAuthorized,false);
 assert.equal(metrics.shouldLiftFamilyAlphaHold,false);
});
test("P860 missing sealed human/source/photographic/operator approval stays hard BLOCKED without disclosure",async()=>{
 const cases=[
  undefined,
  {bundle:{synthetic:true,authorization:{access:"blind"},sources:[]},predictions:[],receipts:{}},
  {bundle:{synthetic:false,authorization:{access:"blind"},sources:[]},predictions:[bottom()],receipts:{}},
 ];
 for(const arg of cases){
  const result=await evaluatePrivateBlind80(arg);
  assert.equal(result.status,"BLOCKED");
  assert.equal(result.scoredSources,0);
  assert.equal(result.conditionalCandidateCoverage,null);
  assert.equal(result.independentlyVerifiedSubtypeAccuracy,null);
  assert.equal(result.shouldLiftFamilyAlphaHold,false);
  assert.equal(result.releaseAuthorized,false);
  assert.ok(!JSON.stringify(result).includes(src));
 }
});
test("P860 original 32-public-photo boot abstentions cannot be laundered through independent blind scorer",async()=>{
 assert.equal(ORIGINAL_RUN_857.humanGroundTruth,false);
 const manifest=JSON.parse(await readFile("benchmark/manifest-reviewed-32.json","utf8"));
 const baseline=JSON.parse(await readFile("benchmark/regression-reviewed-32.json","utf8"));
 const strict=checkRecognitionRegressions(manifest,OBSERVED_32_857,baseline);
 assert.equal(strict.passed,false);
 assert.equal(strict.failures.length,10);
 assert.deepEqual([...new Set(strict.failures.map(x=>x.id))].sort(),[
  "commons-0088","commons-0089","commons-0092","commons-0093","commons-0094"
 ]);
 const spoof=await evaluatePrivateBlind80({
  bundle:{authorization:{access:"blind"},synthetic:true,sources:manifest},
  receipts:{}, predictions:OBSERVED_32_857
 });
 assert.equal(spoof.status,"BLOCKED");
 assert.equal(spoof.scoredSources,0);
 assert.equal(spoof.independentlyVerifiedSubtypeAccuracy,null);
});
test("P860 verified P859 photo scanner and P75 signed custody remain unchanged; independent release gate is BLOCKED",async()=>{
 const [app,p79,p75,report]=await Promise.all([
  readFile("public/app.js","utf8"),
  readFile("scripts/p79-workstation-core.mjs","utf8"),
  readFile("scripts/p75-dataset-core.mjs","utf8"),
  readFile("research/parallel80-private-blind-evaluator/REPORT.md","utf8")
 ]);
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(app,/const live854=\(\)=>sameOwner854\(\)/);
 assert.match(app,/const pendingScanLease859=new Map\(\)/);
 assert.match(app,/P80_STALE_SAVE_SCOPE/);
 assert.match(p79,/export async function loadSession/);
 assert.match(p75,/completeSignedLabel/);
 assert.match(report,/HOLD #255 OPEN/);
 const release=evaluateMission1Evidence(null);
 assert.equal(release.status,"BLOCKED");
 assert.equal(release.shouldLiftFamilyAlphaHold,false);
 assert.equal(release.countOfIndependentHumanBlindSources,0);
 assert.equal(release.countOfPhysicalDevicePlatforms,0);
});
