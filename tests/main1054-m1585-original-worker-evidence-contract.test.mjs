import test from 'node:test';
import assert from 'node:assert/strict';
import {assessOriginalWorkerBridge as check,validWorkerEventSequence,expectedWorkerEvents,originalPins}
  from '../research/main1054/m1585-original-worker-evidence-contract.mjs';

const sha='a'.repeat(40),digest='b'.repeat(64);
const job={runId:123456,jobId:987654,headSha:sha,workerIdDigest:digest,firstAttempt:true,engine:'webkit'};
const trial={
 schema:'M287_ORIGINAL_NATIVE_SAME_PROCESS_RED_WITNESS_V1',
 engine:'webkit',width:430,firstAttempt:true,
 verdict:'GENUINE_ORIGINAL_NATIVE_WASM_BOUNDS_RED',
 genuineOriginalOrtCreateSessionBoundsRed:true,
 sameFailingProcessOriginalJsepSHA256Attested:true,sameProcessJsepShaVerified:true,
 validNativeModelPointerReceipt:true,originalModelByteLength:15199746,
 exactOriginalWasmInstructionOffset:null,sourceLevelCxxStatement:null,
 actualCausalFixDemonstrated:false,originalRuntimeOrModelChanged:false,
 releaseAllowed:false,familyAlpha:'HOLD'
};
const events=expectedWorkerEvents.map((type,i)=>({type,seq:i+1,monotonicMs:i*10,workerIdDigest:digest}));
const inspector={
 syntheticOnly:false,originalModelExecuted:true,workerSourceIsOriginalP94:true,
 engine:'webkit',browserVersion:'26.0',playwrightVersion:'1.56.1',
 inspectorFrontendCount:1,originalJsepSha256:originalPins.jsepSha256,
 originalModelByteLength:originalPins.modelByteLength,originalModelSha256:'c'.repeat(64),
 originalOrtCreateSessionError:'wasm-bounds',workerPauseReason:'exception',
 workerResumeAcknowledged:true,workerRuntimeErrorCaught:true,
 nativeTrapPc:null,wasmFileOffset:null,sourceCxxStatement:null,
 workerIdDigest:digest,events
};
const candidate=()=>check({trial,inspector,trialJob:job,inspectorJob:job});
test('canonical original pins and historic RED remain immutable informational inputs',()=>{
 assert.equal(originalPins.jsepSha256,'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39');
 assert.equal(originalPins.modelByteLength,15199746);
 assert.equal(originalPins.historicalRedRun,44640727828);
});
test('empty evidence stays BLOCKED, never repaired or original RED',()=>{
 const r=check();assert.equal(r.status,'BLOCKED');
 assert.equal(r.originalModelRedObserved,false);assert.equal(r.causalFixProven,false);
 assert.equal(r.releaseAllowed,false);assert.equal(r.familyAlpha,'HOLD');
 assert.equal(r.originalModelNativeTrapPc,null);
});
test('contract-shaped fixture is only a verification candidate, NOT evidence',()=>{
 const r=candidate();assert.equal(r.status,'CANDIDATE_REQUIRES_INDEPENDENT_CI_VERIFICATION');
 assert.equal(r.correlatedCandidate,true);assert.equal(r.originalModelRedObserved,false);
 assert.equal(r.originalModelEvidenceIndependentlyVerified,false);
 assert.equal(r.originalModelExecutedByThisTool,false);
 assert.equal(r.originalModelWasmFileOffset,null);
 assert.deepEqual(r.blockers,['INDEPENDENT_SOURCE_AND_JOB_LOG_VERIFICATION_REQUIRED']);
});
test('existing synthetic WebKit Inspector success NEVER establishes original-model RED',()=>{
 const r=check({trial,inspector:{...inspector,syntheticOnly:true,originalModelExecuted:false,workerSourceIsOriginalP94:false},trialJob:job,inspectorJob:job});
 assert.equal(r.status,'BLOCKED');assert.ok(r.blockers.includes('INSPECTOR_NOT_ORIGINAL_P94_MODEL'));
 assert.equal(r.originalModelRedObserved,false);
});
test('healthy original M287 cohorts cannot become fault receipts',()=>{
 const r=check({trial:{...trial,verdict:'ORIGINAL_MODEL_POSITIVE',genuineOriginalOrtCreateSessionBoundsRed:false},inspector,trialJob:job,inspectorJob:job});
 assert.equal(r.status,'BLOCKED');assert.ok(r.blockers.includes('ORIGINAL_NATIVE_RED_NOT_OBSERVED'));
});
test('different workflow run, job, commit, or Worker ID cannot be correlated',()=>{
 for (const changed of [{runId:321},{jobId:876},{headSha:'d'.repeat(40)},{workerIdDigest:'e'.repeat(64)}]) {
  const r=check({trial,inspector,trialJob:job,inspectorJob:{...job,...changed}});
  assert.equal(r.status,'BLOCKED');assert.ok(r.blockers.includes('EXACT_SAME_JOB_WORKER_AND_SOURCE_NOT_PROVEN'));
 }
});
test('Worker events must be actual nested Inspector lifecycle in strict order',()=>{
 assert.equal(validWorkerEventSequence(events,digest),true);
 for(const altered of [
  events.slice(1),
  events.map((e,i)=>i===4?{...e,type:'Target.targetCreated'}:e),
  events.map((e,i)=>i===7?{...e,seq:3}:e),
  events.map((e,i)=>i===7?{...e,workerIdDigest:'f'.repeat(64)}:e),
  events.map((e,i)=>i===7?{...e,monotonicMs:1}:e)
 ])assert.equal(validWorkerEventSequence(altered,digest),false);
});
test('JS Inspector source locations cannot be promoted into native PC, WASM offset, or C++ source',()=>{
 for(const change of [{nativeTrapPc:44},{wasmFileOffset:7022489},{sourceCxxStatement:'unsafe.cc:12'}]){
  const r=check({trial,inspector:{...inspector,...change},trialJob:job,inspectorJob:job});
  assert.equal(r.status,'BLOCKED');assert.ok(r.blockers.includes('UNVERIFIED_NATIVE_LOCATION_PROMOTED'));
 }
});
test('wrong JSEP hash, wrong original model bytes, second frontend, unknown Worker do not pass',()=>{
 for(const change of [{originalJsepSha256:'0'.repeat(64)},{originalModelByteLength:48},{inspectorFrontendCount:2},{workerIdDigest:'z'.repeat(64)}]){
  const r=check({trial,inspector:{...inspector,...change},trialJob:job,inspectorJob:job});
  assert.equal(r.status,'BLOCKED');
 }
});
test('bad original trial source or claimed repair rejects without unsafe inference',()=>{
 const r=check({trial:{...trial,actualCausalFixDemonstrated:true},inspector,trialJob:job,inspectorJob:job});
 assert.equal(r.status,'BLOCKED');assert.ok(r.blockers.includes('M287_TRIAL_INVALID'));
 assert.equal(r.releaseAllowed,false);
});
