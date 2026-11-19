import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 parseOriginalEvidence,classifyOriginalFailure,verifyPositiveOriginalFirstAttempt,
 ORIGINAL_JSEP_SHA,M247_EXACT_BROWSER_GIT_BLOB
} from '../scripts/main248-original-jsep-first-red-ledger.mjs';

const memory=()=>({phase:'m247_jsep_memory',outcome:'ready',hookInstalled:true,
 growCalls:5,growErrors:0,targetCount:1,validTargets:1,
 firstPages:256,terminalPages:767});
const model=(engine='webkit')=>({
 schema:'M247_TRUE_ORIGINAL_P94_JSEP_SESSION_HEAP/v1',engine,
 originalModelSessionReady:true,actualOriginalP94SegFormerModel:true,
 originalJsepWasmSha256:ORIGINAL_JSEP_SHA,
 originalJsepWasmName:'ort-wasm-simd-threaded.jsep.wasm',
 originalPhotoReviewCardCount:2,realRedToGreenFixProven:false,familyAlphaHold:true,
 actualOriginalBrowserJsepBodyHash:engine==='webkit'
});
const owner=(engine='webkit')=>({engine,realWorkerFirst:true,ownerAOriginalNotVisibleToB:true,
 ownerAOutfitNotVisibleToB:true,ownerBPrivateRows:0,explicitOwnerASave:1,
 familyAlpha:'HOLD',releaseAllowed:false});
const valid=(engine='webkit')=>[
 'M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT '+JSON.stringify(memory()),
 'M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY '+JSON.stringify(model(engine)),
 'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY '+JSON.stringify(owner(engine))
].join('\n')+'\n';

test('M248 authentic first model+private owner receipts accepted only when complete',()=>{
 for(const engine of ['webkit','chromium']){
  const attempt=engine==='webkit'?'w01':'c01';
  const proof=verifyPositiveOriginalFirstAttempt(parseOriginalEvidence(valid(engine)),0,engine,attempt);
  assert.equal(proof.originalSourceOwnerPrivate2DV4Passed,true);
  assert.equal(proof.actualOriginalModelSessionPassed,true);
  assert.equal(proof.actualFirstPages,256);
  assert.equal(proof.actualTerminalPages,767);
  assert.equal(proof.actualMemoryGrowCalls,5);
  assert.equal(proof.permanentWebkitFixProven,false);
  assert.equal(proof.familyAlphaHold,true);
 }
});
test('M248 never treats failed original first attempt as positive, or retries',async()=>{
 const evidence=parseOriginalEvidence(valid());
 assert.throws(()=>verifyPositiveOriginalFirstAttempt(evidence,1,'webkit','w01'),/Genuine first original-JSEP attempt nonzero/);
 assert.throws(()=>verifyPositiveOriginalFirstAttempt(evidence,null,'webkit','w01'),/Genuine first original-JSEP attempt nonzero/);
 const source=await readFile('scripts/test-main248-original-jsep-first-attempt-browser.mjs','utf8');
 assert.ok(source.includes('no retry')||source.includes('noRetry:true'));
 assert.ok(source.includes('throw new Error'));
 assert.equal(source.includes('for(let attempt='),false);
 assert.equal(source.includes('retry:'),false);
});
test('M248 reject duplicate or missing original Worker/model/owner receipt despite exit 0',()=>{
 const base=valid();
 assert.throws(()=>verifyPositiveOriginalFirstAttempt(parseOriginalEvidence(base+base),0,'webkit','w01'),/missing or duplicated/);
 const missing=base.split('\n').filter(x=>!x.startsWith('M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT ')).join('\n');
 assert.throws(()=>verifyPositiveOriginalFirstAttempt(parseOriginalEvidence(missing),0,'webkit','w01'),/missing or duplicated/);
});
test('M248 model failure and memory faults remain categorized, never converted to native success',()=>{
 const lines=[
 'M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT '+JSON.stringify({...memory(),outcome:'error'}),
 'M58_REAL_P88_WORKER_FAIL '+JSON.stringify({stage:'original-model',error:'RuntimeError: memory access out of bounds'})
 ].join('\n');
 const e=parseOriginalEvidence(lines);
 const failure=classifyOriginalFailure(e,1,'webkit','w02');
 assert.equal(failure.actualFirstAttemptFailed,true);
 assert.equal(failure.modelLoadFailureEvent,true);
 assert.equal(failure.failureCategory,'possible-original-wasm-memory-access');
 assert.equal(failure.noRetry,true);
 assert.equal(failure.releaseAuthorized,false);
 assert.throws(()=>verifyPositiveOriginalFirstAttempt(e,1,'webkit','w02'));
});
test('M248 telemetry-only failure cannot be called native memory fault',()=>{
 const a=parseOriginalEvidence('M58_REAL_P88_WORKER_FAIL '+JSON.stringify({error:'AssertionError: Missing/ambiguous original Worker model terminal'})+'\n');
 const result=classifyOriginalFailure(a,1,'webkit','w07');
 assert.equal(result.failureCategory,'research-acceptance-or-telemetry-error');
 assert.equal(result.originalNativeMemoryRedProven,false);
 assert.equal(result.actualFirstAttemptFailed,true);
});
test('M248 protects exact original JSEP SHA and original owner privacy against fake pass',()=>{
 const e=parseOriginalEvidence(valid());
 const badJsep=valid().replace(ORIGINAL_JSEP_SHA,'f'.repeat(64));
 assert.throws(()=>verifyPositiveOriginalFirstAttempt(parseOriginalEvidence(badJsep),0,'webkit','w01'));
 const noPrivacy=valid().replace('"ownerBPrivateRows":0','"ownerBPrivateRows":2');
 assert.throws(()=>verifyPositiveOriginalFirstAttempt(parseOriginalEvidence(noPrivacy),0,'webkit','w01'));
 const noModel=valid().replace('"originalModelSessionReady":true','"originalModelSessionReady":false');
 assert.throws(()=>verifyPositiveOriginalFirstAttempt(parseOriginalEvidence(noModel),0,'webkit','w01'));
 assert.ok(M247_EXACT_BROWSER_GIT_BLOB.length===40);
});
test('M248 retains original WebKit body provenance vs separately fetched Chromium bytes',()=>{
 const bad=valid('webkit').replace('"actualOriginalBrowserJsepBodyHash":true','"actualOriginalBrowserJsepBodyHash":false');
 assert.throws(()=>verifyPositiveOriginalFirstAttempt(parseOriginalEvidence(bad),0,'webkit','w03'));
 const chrome=verifyPositiveOriginalFirstAttempt(parseOriginalEvidence(valid('chromium')),0,'chromium','c02');
 assert.equal(chrome.realOriginalWebkitBodyHash,false);
 assert.equal(chrome.originalNativeMemoryRedObserved,false);
});
test('M248 strict parser does not accept arbitrary log text as original receipt',()=>{
 const text='NOTE M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY {"originalModelSessionReady":true}\n';
 assert.equal(parseOriginalEvidence(text).model.count,0);
 const bad='M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY {"not":"json"';
 const p=parseOriginalEvidence(bad);
 assert.equal(p.model.count,1);
 assert.equal(p.model.validCount,0);
 assert.throws(()=>verifyPositiveOriginalFirstAttempt(p,0,'webkit','w01'));
});
