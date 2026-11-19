import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveM261,verifyM261Failure} from
 '../research/main1054/m261-controlled-native-jsep-fault.mjs';

const checkout='a'.repeat(40),jpeg='1'.repeat(64);
const id=(extra={})=>({
 checkout,engine:'webkit',width:390,runId:'44546633399',
 runAttempt:1,exitCode:1,job:'negative-real-browser',
 lockedJpegSha:jpeg,...extra
});
const marker=(extra={})=>'M261_CONTROLLED_JSEP_FAULT '+JSON.stringify({
 schema:'M261_CONTROLLED_WASM_V1',engine:'webkit',width:390,
 interceptedJsepRequests:1,faultType:'invalid-wasm-magic',
 originalP94SourceUnmodified:true,originalWorkerUnmodified:true,
 naturalWebKitAllocatorFailure:false,releaseAuthorized:false,
 familyAlpha:'HOLD',...extra
});
const badBrowser=(extra={})=>'M58_REAL_P88_WORKER_FAIL '+JSON.stringify({
 stage:'true-original-model-init',error:'controlled-research-fault',...extra
});
const log=(over='',m={})=>badBrowser()+'\n'+marker(m)+'\n'+over;
test('disposable original P94 derivation injects only one targeted JSEP response',()=>{
 const original=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
 const derived=deriveM261(original);
 assert.ok(derived.length>original.length);
 assert.match(derived,/M261_CONTROLLED_JSEP_FAULT/);
 assert.match(derived,/INVALID_JSEP_WASM_NEGATIVE_RESEARCH_ONLY/);
 assert.match(derived,/M58_REAL_P88_WORKER_FAIL/);
 assert.match(derived,/\/ort-wasm-simd-threaded/);
 assert.match(original,/P91_FULL_JOURNEY_PASS/);
 assert.doesNotMatch(original,/M261_CONTROLLED_JSEP_FAULT/);
});
test('source pin blocks modified original browser script before any negative test',()=>{
 const original=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
 assert.throws(()=>deriveM261(original+'\n//untrusted app change'),/source changed/);
});
test('synthetic-shape original browser RED plus exactly one controlled interception is admitted as negative evidence only',()=>{
 const receipt=verifyM261Failure(log(),1,id());
 assert.equal(receipt.originalJourneyGate,'FAIL');
 assert.equal(receipt.sourceEvidenceGate,'FAIL');
 assert.equal(receipt.injectionInterceptCount,1);
 assert.equal(receipt.actualIntermittentWebKitFaultReproduced,false);
 assert.equal(receipt.releaseAuthorized,false);
 assert.equal(receipt.familyAlpha,'HOLD');
});
test('successful original child exit cannot be called a controlled RED',()=>{
 assert.throws(()=>verifyM261Failure(log(),0,id({exitCode:0})),/did not fail/);
});
test('no actual original M58 terminal failure marker refuses synthetic fail claims',()=>{
 assert.throws(()=>verifyM261Failure(marker(),1,id()),/did not fail/);
});
test('no actual intercepted original WASM response refuses fabricated failure',()=>{
 assert.throws(()=>verifyM261Failure(log('',{interceptedJsepRequests:0}),1,id()),/not independently observed/);
});
test('duplicated corrupt responses and repeated marker are rejected',()=>{
 assert.throws(()=>verifyM261Failure(log('',{interceptedJsepRequests:2}),1,id()));
 assert.throws(()=>verifyM261Failure(log()+'\n'+marker(),1,id()),/Missing\/duplicate/);
});
test('a positive P91 or owner A save marker after negative JSEP must be rejected',()=>{
 for(const success of [
  'P91_FULL_JOURNEY_PASS {}',
  'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS {}',
  'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY {}'
 ])assert.throws(()=>verifyM261Failure(log(success),1,id()),/Unexpected owner\/save/);
});
test('rejects wrong browser and viewport evidence',()=>{
 assert.throws(()=>verifyM261Failure(log(),1,id({engine:'chromium'})),/not independently observed/);
 assert.throws(()=>verifyM261Failure(log(),1,id({width:430})),/not independently observed/);
});
test('rejects assertions claiming a natural original WebKit bug rather than deliberate test fault',()=>{
 for(const altered of [
  {naturalWebKitAllocatorFailure:true},{originalP94SourceUnmodified:false},
  {originalWorkerUnmodified:false},{familyAlpha:'GO'},{releaseAuthorized:true},
  {faultType:'something-else'}
 ])assert.throws(()=>verifyM261Failure(log('',altered),1,id()));
});
test('first-attempt evidence must reject repeated run even when negative browser markers are present',()=>{
 assert.throws(()=>verifyM261Failure(log(),1,id({runAttempt:2})),/first-attempt/i);
});
test('malformed/oversized stdout and raw private text never leak through a negative receipt',()=>{
 assert.throws(()=>verifyM261Failure('X'.repeat(8*1024*1024+1),1,id()));
 const r=verifyM261Failure(log('AUTH_USER_SECRET=PRIVATE'),1,id());
 assert.doesNotMatch(JSON.stringify(r),/AUTH_USER_SECRET/);
});
