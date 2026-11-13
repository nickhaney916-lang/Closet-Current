/** P861 cross-stream integration checks. SYNTHETIC/NO HUMAN OR ACCURACY EVIDENCE. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluatePrivateBlind80, verifyScorerSeal80, validCandidatePrediction80 } from "../scripts/p80-private-blind-evaluator.mjs";
import { verifyOperatorCategoryLock80, blindTemporalOrder80 } from "../scripts/p80-operator-category-lock.mjs";
import { deriveConditionalCandidates80, validateFullScoreProofs80 } from "../scripts/p80-full-score-transcript.mjs";
import { evaluateMission1Evidence } from "../scripts/m1-release-evidence-851.mjs";

test("P861 integration requires complete scores AND category/operator/scorer evidence, not a signed prediction list",async()=>{
  const result=await evaluatePrivateBlind80();
  assert.equal(result.status,"BLOCKED");
  assert.equal(result.scoredSources,0);
  assert.equal(result.conditionalCandidateCoverage,null);
  assert.equal(result.independentlyVerifiedSubtypeAccuracy,null);
  assert.equal(result.releaseAuthorized,false);
  assert.equal(result.shouldLiftFamilyAlphaHold,false);
  const sha="a".repeat(64), model="b".repeat(64);
  const prediction={sourceSha256:sha,modelSha256:model,operatorCategory:"Bottoms",operatorCategoryProvenance:"blind-operator-before-truth-reveal",status:"hypotheses",itemType:"Unknown",requiresOwnerConfirmation:true,automaticallyCertified:false,alternatives:[{category:"Bottoms",itemType:"Shorts",rank:1,relativeScore:.7}]};
  assert.equal(validCandidatePrediction80(prediction),true);
  assert.equal(verifyScorerSeal80([prediction],{},sha,Date.now()),false,"missing full proofs cannot verify");
  assert.equal(verifyOperatorCategoryLock80({},[prediction],{},new Date().toISOString()),false);
  assert.equal(validateFullScoreProofs80([],[],{}, {},{}),false);
  assert.equal(deriveConditionalCandidates80({}, "Bottoms",{},new Date().toISOString(),new Date().toISOString()),null);
});
test("P861 human truth must be recorded AFTER model scoring, not before",()=>{
  const now=Date.now(), ts=(dt)=>new Date(now+dt).toISOString();
  assert.equal(blindTemporalOrder80(ts(-40000),ts(-30000),ts(-20000),[ts(-10000),ts(-5000)],now),true);
  assert.equal(blindTemporalOrder80(ts(-40000),ts(-30000),ts(-20000),[ts(-25000),ts(-5000)],now),false);
  assert.equal(blindTemporalOrder80(ts(-40000),ts(-30000),ts(-20000),[ts(10000),ts(-5000)],now),false);
  assert.equal(blindTemporalOrder80(ts(-40000),ts(-30000),ts(-20000),[ts(-10000)],now),false);
});
test("P861 inherited source/owner reviewer fence and independent Family Alpha release HOLD remain unchanged",async()=>{
 const [app,model,report]=await Promise.all([
  readFile("public/app.js","utf8"),readFile("public/local-worker.mjs","utf8"),
  readFile("research/mission1-full-score-evidence-861/REPORT.md","utf8")
 ]);
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(app,/const pendingScanLease859=new Map\(\)/);
 assert.match(report,/Family Alpha HOLD #255 OPEN/);
 assert.ok(model.includes("fashion-clip"));
 const gate=evaluateMission1Evidence(null);
 assert.equal(gate.status,"BLOCKED");
 assert.equal(gate.shouldLiftFamilyAlphaHold,false);
});
