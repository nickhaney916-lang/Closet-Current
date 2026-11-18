import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {judgeWebkitCandidate236 as judge} from '../scripts/lib/main236-webkit-reliability-admission.mjs';
const all=JSON.parse(await readFile('research/main236-webkit-runtime-reliability-evidence.json','utf8'));
const copy=x=>structuredClone(x);
test('M236 original JSEP true 60/64 WebKit memory/hang RED cannot be erased by green shards',()=>{
 const x=judge(all.originalJsep);
 assert.equal(x.status,'REJECTED_GENUINE_NATIVE_RED');
 assert.equal(x.evidence.nativeWebkitAttempts,64);
 assert.equal(x.evidence.nativeWebkitPassed,60);
 assert.equal(x.evidence.nativeWebkitFailed,4);
 assert.equal(x.evidence.nativeChromiumPassed,16);
 assert.deepEqual(x.evidence.failureClasses,{'runtime-memory':3,'session-hang':1});
 assert.equal(x.permanentWebKitRepairProven,false);
 assert.equal(x.familyAlphaAuthorized,false);
});
test('M236 same-head CPU-only 24/24 green still rejected after independent 22/24 red',()=>{
 const x=judge(all.matchedCpuOnly);
 assert.equal(x.status,'REJECTED_GENUINE_NATIVE_RED');
 assert.equal(x.evidence.nativeWebkitAttempts,48);
 assert.equal(x.evidence.nativeWebkitPassed,46);
 assert.equal(x.evidence.nativeWebkitFailed,2);
 assert.equal(x.evidence.nativeChromiumPassed,24);
 assert.deepEqual(x.evidence.failureClasses,{'runtime-other':1,'runtime-memory':1});
 assert.equal(x.eligibleForRuntimeChange,false);
});
test('M236 excluding failed run is refused rather than retrospectively green',()=>{
 const a=copy(all.matchedCpuOnly);a.runs.pop();
 assert.equal(judge(a).status,'BLOCKED_UNVERIFIED');
});
test('M236 inventing a green result while keeping classified red refuses mismatch',()=>{
 const a=copy(all.matchedCpuOnly);
 const r=a.runs[1];r.webkit.passed=24;r.webkit.failed=0;r.genuineWebkitFailures=[];
 assert.equal(judge(a).status,'BLOCKED_UNVERIFIED');
});
test('M236 green Run 2 must not be mistaken for a different head',()=>{
 const a=copy(all.originalJsep);a.runs[1].headSha='1'.repeat(40);
 assert.equal(judge(a).status,'BLOCKED_UNVERIFIED');
});
test('M236 two independent runs mandatory, not the same re-read',()=>{
 const a=copy(all.originalJsep);a.runs[1].runId=a.runs[0].runId;
 assert.equal(judge(a).reason,'invalid-or-repeated-github-run-id');
});
test('M236 fail closed when real memory exception categorization deleted',()=>{
 const a=copy(all.originalJsep);a.runs[1].genuineWebkitFailures=[];
 assert.equal(judge(a).reason,'missing-natural-webkit-failure-evidence');
});
test('M236 fail closed if original model positive assertion weakened',()=>{
 const a=copy(all.originalJsep);a.runs[0].originalCardPositiveAssertion=false;
 assert.equal(judge(a).reason,'not-original-source-and-owner-acceptance');
});
test('M236 fail closed if original source, privacy or v4 acceptance not asserted',()=>{
 for(const property of ['originalSourceLocked','nativeBrowser','ownerExplicitApproval','privateOriginalBackupV4','noAutoSaveOnError']){
  const a=copy(all.originalJsep);a.runs[1][property]=false;
  assert.equal(judge(a).status,'BLOCKED_UNVERIFIED',property);
 }
});
test('M236 fail closed on attempts count mutation, no skipped original reds',()=>{
 const a=copy(all.originalJsep);a.runs[0].webkit.attempts=31;
 assert.equal(judge(a).reason,'inconsistent-browser-counters');
});
test('M236 no false pass from tiny 2-run green browser sample',()=>{
 const a=copy(all.matchedCpuOnly);
 for(const r of a.runs){r.webkit={attempts:1,passed:1,failed:0};r.genuineWebkitFailures=[];r.runConclusion='success';}
 assert.equal(judge(a).reason,'insufficient-fresh-browser-replication');
});
test('M236 even invented two 100% green original-process runs require CAUSAL review',()=>{
 const a=copy(all.matchedCpuOnly);
 for(const r of a.runs){r.webkit={attempts:24,passed:24,failed:0};r.genuineWebkitFailures=[];r.runConclusion='success';}
 const x=judge(a);
 assert.equal(x.status,'REVIEW_ONLY_CAUSAL_PROOF_REQUIRED');
 assert.equal(x.permanentWebKitRepairProven,false);
 assert.equal(x.eligibleForRuntimeChange,false);
 assert.equal(x.familyAlphaAuthorized,false);
});
test('M236 absent original-photo provenance is a BLOCKED admission',()=>{
 const a=copy(all.originalJsep);delete a.runs[0].publicLicensedPhoto;
 assert.equal(judge(a).reason,'not-original-source-and-owner-acceptance');
});
test('M236 no allowed mode can output an alpha go decision',()=>{
 for(const candidate of [all.originalJsep,all.matchedCpuOnly]){
  const x=judge(candidate);assert.equal(x.familyAlphaAuthorized,false);
  assert.equal(x.permanentWebKitRepairProven,false);
 }
});
