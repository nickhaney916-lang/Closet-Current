import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 singleOriginalReceipt,classifyFreshOriginalAttempt,
 nearestRank,summarizeIndependentShard,ORIGINAL_FIXTURE_SHA
} from '../scripts/main248-fresh-original-jsep-evidence.mjs';
import {ORIGINAL_JSEP_NAME,ORIGINAL_JSEP_SHA} from '../scripts/main247-original-jsep-phase-evidence.mjs';
const trace=()=>({
 schema:'M247_REAL_P94_JSEP_SESSION_PHASE/v1',
 engine:'webkit',width:320,originalWorkerSeen:true,originalModelAttempted:true,
 originalModelCards:2,originalJsepWasmHttp200:true,
 originalJsepWasmResponseBodySHA256Verified:true,
 originalJsepDirectBrowserBinarySHA256:ORIGINAL_JSEP_SHA,
 originalJsepBinaryName:ORIGINAL_JSEP_NAME,
 intentionalModelNetworkFailure:false,
 firstInferenceStarted:true,nativeInstantiationSucceeded:true,
 genuineOriginalPostWasmSessionMemoryFaultWitness:false,
 phases:[
  {phase:'wasm_instantiateStreaming',outcome:'ok'},
  {phase:'model_session_load',outcome:'ok',elapsedMs:35000},
  {phase:'first_inference',outcome:'ok',elapsedMs:12000}
 ]
});
const owner=()=>({
 engine:'webkit',modelExecuted:true,manualSyntheticOwnerConfirmed:true,
 ownerPrivateSaved:1,exactOriginalSHA256:ORIGINAL_FIXTURE_SHA,
 tamperDenied:true,otherOwnerDenied:true,cancelledRestoreUnchanged:true,
 atomicRestore:true,actualV4BrowserDownload:true,hostedRLS:false,
 releaseAuthorized:false
});
const privacy=()=>({
 engine:'webkit',realWorkerFirst:true,explicitOwnerASave:1,
 ownerBPrivateRows:0,ownerAOriginalNotVisibleToB:true,
 ownerAOutfitNotVisibleToB:true,localIndexedDBOnly:true,
 hostedRLS:false,releaseAllowed:false
});
const marker=(m,v)=>m+' '+JSON.stringify(v);
const records=(t=trace(),o=owner(),p=privacy())=>[
 marker('M247_REAL_ORIGINAL_JSEP_PHASE',t),
 marker('M214_REAL_P94_WORKER_OUTCOME',{engine:t.engine,width:t.width}),
 ...(o?[marker('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',o)]:[]),
 ...(p?[marker('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',p)]:[])
].join('\n');
const sample=(input={})=>classifyFreshOriginalAttempt({
 engine:'webkit',width:320,shard:0,attempt:1,exitCode:0,
 signal:null,timedOut:false,stdout:records(),...input
});
test('M248 one exact original receipt only, fake duplicates and excessive JSON refuse evidence',()=>{
 const out=records();
 assert.equal(singleOriginalReceipt(out,'M247_REAL_ORIGINAL_JSEP_PHASE')?.originalModelCards,2);
 assert.equal(singleOriginalReceipt(out,'M248_NOT_PRESENT'),null);
 assert.throws(()=>singleOriginalReceipt(out+'\n'+marker('M247_REAL_ORIGINAL_JSEP_PHASE',trace()),
  'M247_REAL_ORIGINAL_JSEP_PHASE'),/Repeated/);
 assert.throws(()=>singleOriginalReceipt('M247_REAL_ORIGINAL_JSEP_PHASE '+('{'.repeat(4)),
  'M247_REAL_ORIGINAL_JSEP_PHASE'));
 assert.throws(()=>singleOriginalReceipt(out,'not-valid-marker'));
});
test('M248 source bound original JSEP WebKit owner plus v4 and privacy must all pass',()=>{
 const x=sample();
 assert.equal(x.passed,true);
 assert.equal(x.category,'genuine_original_positive');
 assert.equal(x.directOriginalWebkitJsepSha256Verified,true);
 assert.equal(x.ownerOriginalSourcePrivate2DV4Verified,true);
 assert.equal(x.independentSyntheticOwnerIsolationVerified,true);
 assert.equal(x.originalModelSessionElapsedMs,35000);
 assert.equal(x.firstInferenceElapsedMs,12000);
 assert.equal(x.originalMemoryRepairProven,false);
 assert.equal(x.familyAlphaHold,true);
});
test('M248 Chromium cannot claim direct browser SHA if Playwright body unreadable',()=>{
 const t={...trace(),engine:'chromium',width:390,
  originalJsepWasmResponseBodySHA256Verified:false,
  originalJsepDirectBrowserBinarySHA256:null};
 const o={...owner(),engine:'chromium'},p={...privacy(),engine:'chromium'};
 const x=sample({engine:'chromium',width:390,stdout:records(t,o,p)});
 assert.equal(x.passed,true);
 assert.equal(x.directOriginalWebkitJsepSha256Verified,false);
 assert.equal(x.chromiumActualWasmBytesNotClaimed,true);
});
test('M248 fake original WebKit binary, no original JSEP, no owner or cross-owner bypass never pass',()=>{
 const t=trace();
 for(const changes of [
  {...t,originalJsepWasmResponseBodySHA256Verified:false},
  {...t,originalJsepDirectBrowserBinarySHA256:'1'.repeat(64)},
  {...t,originalJsepBinaryName:'ort-wasm-simd-threaded.wasm'},
  {...t,originalJsepWasmHttp200:false},
  {...t,originalModelCards:0},
  {...t,intentionalModelNetworkFailure:true},
  {...t,firstInferenceStarted:false},
  {...t,phases:[{phase:'model_session_load',outcome:'ok'}]}
 ]){
  assert.equal(sample({stdout:records(changes)}).passed,false);
 }
 assert.equal(sample({stdout:records(t,{...owner(),ownerPrivateSaved:0},privacy())}).passed,false);
 assert.equal(sample({stdout:records(t,owner(),{...privacy(),ownerBPrivateRows:1})}).passed,false);
 assert.equal(sample({stdout:records(t,{...owner(),exactOriginalSHA256:'f'.repeat(64)},privacy())}).passed,false);
});
test('M248 genuine original after-WASM memory access is preserved as RED, not retry to green',()=>{
 const t={...trace(),originalModelCards:0,firstInferenceStarted:false,
  genuineOriginalPostWasmSessionMemoryFaultWitness:true,
  phases:[
   {phase:'wasm_instantiateStreaming',outcome:'ok'},
   {phase:'model_session_load',outcome:'error',errorName:'RuntimeError',messageCode:'wasm_memory_access',elapsedMs:14800}
  ]};
 const x=sample({stdout:records(t,null,null),exitCode:1});
 assert.equal(x.passed,false);
 assert.equal(x.category,'original_webkit_post_wasm_memory_access');
 assert.equal(x.genuineOriginalNativeMemoryFaultWitness,true);
 assert.equal(x.originalNativeSessionErrorName,'RuntimeError');
 assert.equal(x.originalNativeSessionErrorCode,'wasm_memory_access');
 assert.equal(x.originalMemoryRepairProven,false);
 const other=sample({stdout:records({...t,
  genuineOriginalPostWasmSessionMemoryFaultWitness:false},null,null),exitCode:1});
 assert.equal(other.genuineOriginalNativeMemoryFaultWitness,false);
});
test('M248 missing original receipts and hard timeout are RED and never synthetic success',()=>{
 assert.equal(sample({stdout:''}).passed,false);
 const timeout=sample({stdout:'',exitCode:null,timedOut:true,signal:'SIGTERM'});
 assert.equal(timeout.passed,false);
 assert.equal(timeout.category,'no_terminal_timeout');
 assert.equal(timeout.terminatedBySignal,true);
 assert.equal(timeout.originalMemoryRepairProven,false);
});
test('M248 genuine child exit RED remains RED even if original model owner receipts are green',()=>{
 const x=sample({exitCode:1});
 assert.equal(x.passed,false);
 assert.equal(x.category,'original_runtime_identity_or_subprocess_red');
});
test('M248 immutable exact fixed sample and correct nearest-rank p50/p95, REDs never excluded from count',()=>{
 assert.equal(nearestRank([60,10,50,20],0.5),20);
 assert.equal(nearestRank([60,10,50,20],0.95),60);
 assert.equal(nearestRank([],0.95),null);
 const good=[1,2,3,4].map(attempt=>({...sample(),attempt,
  originalModelSessionElapsedMs:attempt*1000,
  firstInferenceElapsedMs:attempt*2000}));
 const summary=summarizeIndependentShard(good,{engine:'webkit',width:320,shard:0,expected:4});
 assert.equal(summary.expectedFreshProcesses,4);
 assert.equal(summary.genuinePositiveJourneys,4);
 assert.equal(summary.modelSessionMsP50PassingOnly,2000);
 assert.equal(summary.modelSessionMsP95PassingOnly,4000);
 assert.equal(summary.firstInferenceMsP95PassingOnly,8000);
 assert.equal(summary.originalCausalRepairNotProven,true);
 const mixed=[...good];mixed[2]={...mixed[2],passed:false,
  category:'original_model_session_or_inference_red'};
 const withRed=summarizeIndependentShard(mixed,{engine:'webkit',width:320,shard:0,expected:4});
 assert.equal(withRed.genuineFailures,1);
 assert.equal(withRed.genuinePositiveJourneys,3);
 assert.equal(withRed.allPass,false);
 assert.throws(()=>summarizeIndependentShard(good.slice(1),
  {engine:'webkit',width:320,shard:0,expected:4}));
});
test('M248 original no-retry immutable source/owner journey and no raw child logs',async()=>{
 const driver=await readFile('scripts/test-main248-fresh-original-jsep-browser-batch.mjs','utf8');
 const worker=await readFile('public/outfit-worker-p94.mjs','utf8');
 assert.ok(driver.includes('f43fc837d485d82e058efc07180ecdd3bb21e313'));
 assert.ok(driver.includes('d66651b616de54c51eb7ef986324b30f1580888f'));
 assert.ok(driver.includes('M248_REAL_FRESH_ORIGINAL_JSEP_ATTEMPT'));
 assert.ok(driver.includes('M247_SOURCE_ONLY'));
 assert.ok(driver.includes("P101_TEST_FAULT:'none'"));
 assert.ok(driver.includes('M247_ENGINE:engine,M247_WIDTH:String(width)'));
 assert.ok(driver.includes('if(!summary.allPass)process.exitCode=1'));
 assert.ok(!driver.includes("stdio:'inherit'"));
 assert.ok(worker.includes("device:'wasm',dtype:'fp32'"));
});
