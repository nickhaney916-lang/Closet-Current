import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyOneRealOriginalAttempt,aggregateRealOriginalAttempts,ORIGINAL_JSEP_SHA}
 from '../scripts/main249-original-jsep-natural-red-ledger.mjs';
const original=(e={})=>({engine:'webkit',width:320,attempt:1,exitCode:0,...e});
const success=()=>[
 'M249_GENUINE_SOURCE_OWNER_PASS '+JSON.stringify({
  engine:'webkit',trueNativeJsepWorker:true,originalModelAndOwner2DV4:true
 }),
 'M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY '+JSON.stringify({
  engine:'webkit',originalModelSessionReady:true,
  originalJsepWasmName:'ort-wasm-simd-threaded.jsep.wasm',
  originalJsepWasmSha256:ORIGINAL_JSEP_SHA,
  actualOriginalBrowserJsepBodyHash:true,realRedToGreenFixProven:false
 }),
 'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY '+JSON.stringify({
  engine:'webkit',ownerBPrivateRows:0,ownerAOriginalNotVisibleToB:true,
  ownerAOutfitNotVisibleToB:true
 }),
 'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS '+JSON.stringify({
  engine:'webkit',manualSyntheticOwnerConfirmed:true,ownerPrivateSaved:1,
  restoredSavedOutfitCount:1,atomicRestore:true,tamperDenied:true
 }),
 'M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT '+JSON.stringify({
  outcome:'ready',hookInstalled:true,growCalls:5,
  firstPages:256,terminalPages:767
 })
].join('\n')+'\n';
const failure=(extra={})=>
 'M249_ORIGINAL_FAILED_ATTEMPT_JSEP_EVIDENCE '+JSON.stringify({
  schema:'M249_ORIGINAL_FAILED_JSEP_SAME_ATTEMPT/v1',
  engine:'webkit',controlledPublicOnnxAbort:false,realOriginalP94ModelAttemptFailed:true,
  originalTestFailedNonzero:true,
  directOriginalJsepBrowserBodySHAProven:true,
  actualPublicRuntimeIdentity:'DIRECT_SAME_ATTEMPT_JSEP_SHA',
  modelExceptionName:'RuntimeError',
  modelExceptionCategory:'wasm_memory_access',
  nativeCppAllocatorCauseProven:false,realRedToGreenFixProven:false,
  originalHeapTerminalSeen:true,observedGrowCalls:5,
  observedFirstPages:256,observedTerminalPages:767,...extra
 })+'\n';
test('actual original WebKit source+private owner PASS is not a permanent WebKit repair',()=>{
 const x=classifyOneRealOriginalAttempt(original({stdout:success()}));
 assert.equal(x.outcome,'PASS');
 assert.equal(x.directOriginalWebkitJsepHash,true);
 assert.equal(x.originalPrivate2DV4Accepted,true);
 assert.equal(x.permanentFixProven,false);
 assert.equal(x.releaseAuthorized,false);
});
test('genuine failed original JSEP same-process SHA and error name is preserved, not promoted to fix',()=>{
 const x=classifyOneRealOriginalAttempt(original({exitCode:1,stdout:failure()}));
 assert.equal(x.outcome,'REAL_MODEL_LOAD_RED');
 assert.equal(x.reportedWorkerExceptionName,'RuntimeError');
 assert.equal(x.reportedWorkerExceptionCategory,'wasm_memory_access');
 assert.equal(x.sameAttemptHeapTerminalObserved,true);
 assert.equal(x.directOriginalWebkitJsepHash,true);
 assert.equal(x.realNativeAllocatorRootCauseProven,false);
 assert.equal(x.originalPrivate2DV4Accepted,false);
});
test('missing failure receipt is unclassified, never native memory-access evidence',()=>{
 const x=classifyOneRealOriginalAttempt(original({exitCode:1,stdout:''}));
 assert.equal(x.outcome,'UNCLASSIFIED_RED');
 assert.equal(x.reportedWorkerExceptionCategory,'UNKNOWN');
 assert.equal(x.naturalOriginalModelRedAttested,false);
});
test('controlled network abort cannot be represented as naturally failing original JSEP',()=>{
 const x=original({exitCode:1,stdout:failure({controlledPublicOnnxAbort:true})});
 assert.throws(()=>classifyOneRealOriginalAttempt(x));
});
test('wrong/guessed JSEP asset, fake C++ root cause, success alongside failure must reject',()=>{
 for(const changes of [
  {directOriginalJsepBrowserBodySHAProven:true,actualPublicRuntimeIdentity:'UNVERIFIED_SAME_ATTEMPT_BROWSER_BODY'},
  {nativeCppAllocatorCauseProven:true},
  {realRedToGreenFixProven:true},
  {modelExceptionName:'RAW_PRIVATE_OWNER_NAME'},
  {modelExceptionCategory:'raw_error_contents'},
  {realOriginalP94ModelAttemptFailed:false}
 ]){
  assert.throws(()=>classifyOneRealOriginalAttempt(original({
   exitCode:1,stdout:failure(changes)
  })));
 }
 assert.throws(()=>classifyOneRealOriginalAttempt(original({
  exitCode:1,stdout:success()+failure()
 })));
});
test('a natural failure with missing same-attempt hash stays unverified',()=>{
 const x=classifyOneRealOriginalAttempt(original({
  exitCode:1,stdout:failure({
   directOriginalJsepBrowserBodySHAProven:false,
   actualPublicRuntimeIdentity:'UNVERIFIED_SAME_ATTEMPT_BROWSER_BODY',
   modelExceptionName:'Error',modelExceptionCategory:'session'
  })
 }));
 assert.equal(x.directOriginalWebkitJsepHash,false);
 assert.equal(x.jsepIdentity,'UNVERIFIED_SAME_ATTEMPT_BROWSER_BODY');
 assert.equal(x.reportedWorkerExceptionCategory,'session');
});
test('missing private saved-original v4 evidence never counts as PASS',()=>{
 const lines=success().split('\n').filter(s=>!s.startsWith('M61_GENUINE_P88'));
 assert.throws(()=>classifyOneRealOriginalAttempt(original({stdout:lines.join('\n')})));
});
test('replayed process or missing process is rejected by the fixed cohort',()=>{
 const pass=classifyOneRealOriginalAttempt(original({stdout:success()}));
 const red=classifyOneRealOriginalAttempt(original({attempt:2,exitCode:1,stdout:failure()}));
 const summary=aggregateRealOriginalAttempts([pass,red],{
  engine:'webkit',width:320,batch:'A',expected:2
 });
 assert.equal(summary.passed,1);
 assert.equal(summary.originalModelLoadReds,1);
 assert.equal(summary.naturalModelMemoryAccessCategoryObserved,1);
 assert.equal(summary.causalPermanentRepairProven,false);
 assert.throws(()=>aggregateRealOriginalAttempts([pass,pass],{
  engine:'webkit',width:320,batch:'A',expected:2
 }));
 assert.throws(()=>aggregateRealOriginalAttempts([pass],{
  engine:'webkit',width:320,batch:'A',expected:2
 }));
});
