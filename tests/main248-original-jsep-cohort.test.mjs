import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyOriginalProcess,summarizeFreshAttempts,JSEP_SHA} from '../scripts/main248-original-jsep-trial-ledger.mjs';
const m={phase:'m247_jsep_memory',outcome:'ready',hookInstalled:true,growCalls:5,
 growErrors:0,targetCount:1,validTargets:1,firstPages:256,terminalPages:767};
const j={schema:'M247_TRUE_ORIGINAL_P94_JSEP_SESSION_HEAP/v1',engine:'webkit',
 originalModelSessionReady:true,actualOriginalP94SegFormerModel:true,
 originalJsepWasmName:'ort-wasm-simd-threaded.jsep.wasm',
 originalJsepWasmSha256:JSEP_SHA,jsMemoryGrowCalls:5,
 firstObservedPages:256,terminalPages:767,
 actualOriginalBrowserJsepBodyHash:true,
 realRedToGreenFixProven:false,releaseAuthorized:false,
 originalPhotoReviewCardCount:2};
const owner={engine:'webkit',ownerBPrivateRows:0,
 ownerAOriginalNotVisibleToB:true,ownerAOutfitNotVisibleToB:true,explicitOwnerASave:1};
const restore={engine:'webkit',manualSyntheticOwnerConfirmed:true,
 ownerPrivateSaved:1,restoredSavedOutfitCount:1,atomicRestore:true,tamperDenied:true};
const log=()=>[
 'M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT '+JSON.stringify(m),
 'M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY '+JSON.stringify(j),
 'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS '+JSON.stringify(restore),
 'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY '+JSON.stringify(owner)
].join('\n')+'\n';
const sample=(x={})=>({engine:'webkit',width:320,slot:1,exitCode:0,stdout:log(),...x});
test('admit only source/provenance and same-process full original owner/restore PASS',()=>{
 const v=classifyOriginalProcess(sample());
 assert.equal(v.status,'PASS');assert.equal(v.originalJsepSha256,JSEP_SHA);
 assert.equal(v.originalOwnerAndRestoreAccepted,true);
 assert.equal(v.causalRepairProven,false);
 assert.equal(v.originalCppAllocatorObserved,false);
 assert.equal(v.releaseAuthorized,false);
});
test('natural original failure remains RED even when model terminal is unclassified',()=>{
 const v=classifyOriginalProcess(sample({exitCode:1,stdout:'M58_REAL_P88_WORKER_FAIL {"stage":"genuine worker original JPEG and live SegFormer"}\n'}));
 assert.equal(v.status,'RED');assert.equal(v.workerModelTerminal,'unobserved');
 assert.equal(v.genuineWebkitMemoryAccessRedProven,false);
});
test('observed original native memory error is NOT automatically claimed as C++ root cause',()=>{
 const s='M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT '+JSON.stringify({...m,outcome:'error',terminalPages:350})+'\n';
 const v=classifyOriginalProcess(sample({exitCode:1,stdout:s}));
 assert.equal(v.status,'RED');assert.equal(v.workerModelTerminal,'error');
 assert.equal(v.nativeGrowCalls,5);assert.equal(v.terminalPages,350);
 assert.equal(v.genuineWebkitMemoryAccessRedProven,false);
});
test('stalled original browser is RED not secretly retried',()=>{
 const v=classifyOriginalProcess(sample({exitCode:null,timedOut:true,signal:'SIGTERM',stdout:''}));
 assert.equal(v.status,'RED');assert.equal(v.timeout,true);
});
test('missing, duplicate or counterfeit successful original evidence cannot pass',()=>{
 for(const change of [
  x=>x.stdout=x.stdout.replace(/M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY .*\n/,''),
  x=>x.stdout=x.stdout.replace(JSEP_SHA,'0'.repeat(64)),
  x=>x.stdout=x.stdout+x.stdout,
  x=>x.stdout=x.stdout.replace('"ownerBPrivateRows":0','"ownerBPrivateRows":1'),
  x=>x.stdout=x.stdout.replace('"actualOriginalBrowserJsepBodyHash":true','"actualOriginalBrowserJsepBodyHash":false'),
  x=>x.stdout=x.stdout.replace('"atomicRestore":true','"atomicRestore":false'),
  x=>x.stdout=x.stdout.replace('"releaseAuthorized":false','"releaseAuthorized":true'),
  x=>x.stdout=x.stdout.replace('"originalPhotoReviewCardCount":2','"originalPhotoReviewCardCount":0')
 ]){
  const x=sample();change(x);assert.throws(()=>classifyOriginalProcess(x));
 }
});
test('reject raw escaped oversized logs, invalid viewport, replayed process and unknown status',()=>{
 assert.throws(()=>classifyOriginalProcess(sample({width:555})));
 assert.throws(()=>classifyOriginalProcess(sample({stdout:'X'.repeat(8*1024*1024+1)})));
 const pass=classifyOriginalProcess(sample());
 assert.throws(()=>summarizeFreshAttempts([pass,pass],{engine:'webkit',width:320,batch:'a',requested:2}));
 assert.throws(()=>summarizeFreshAttempts([{...pass,status:'fake'}],{engine:'webkit',width:320,batch:'a',requested:1}));
});
test('batches preserve each fresh original result separately, zero false repair claims',()=>{
 const pass=classifyOriginalProcess(sample());
 const red=classifyOriginalProcess(sample({slot:2,exitCode:1,stdout:''}));
 const x=summarizeFreshAttempts([pass,red],{engine:'webkit',width:320,batch:'b',requested:2});
 assert.equal(x.originalModelPasses,1);assert.equal(x.originalModelReds,1);
 assert.equal(x.permanentRepairProven,false);
 assert.equal(x.realNativeRedObserved,true);
 assert.equal(x.fullOriginalPrivacyPasses,1);
});
