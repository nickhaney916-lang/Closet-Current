import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classifyM263Attempt,summarizeM263} from
 '../research/main1054/m263-fresh-original-webkit-network-cohort.mjs';

const jpeg='1'.repeat(64);
const wasm='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const onnx='02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3';
const identity=(extra={})=>({
 checkout:'a'.repeat(40),engine:'webkit',width:390,runId:'44558985581',
 job:'original-shard',runAttempt:1,exitCode:0,lockedJpegSha:jpeg,...extra
});
const mark=(tag,data)=>tag+' '+JSON.stringify(data);
function sample({
 engine='webkit',goodNetwork=true,unreadable=false,
 modelSha=onnx,includeStages=true,failMarker=false,extra=''
}={}){
 const lines=[];
 if(includeStages)lines.push(
  mark('M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW',{
   engine,sourceSHA256:jpeg,realWorker:true,modelRequests:9,saved:0,hold:true
  }),
  mark('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',{
   engine,modelExecuted:true,manualSyntheticOwnerConfirmed:true,ownerPrivateSaved:1,
   exactOriginalSHA256:jpeg,realNativeOutfit:true,savedOutfitOwnerAction:true,
   restoredSavedOutfitCount:1,actualV4BrowserDownload:true,tamperDenied:true,
   otherOwnerDenied:true,cancelledRestoreUnchanged:true,atomicRestore:true,
   threeDAuthorized:false,hostedRLS:false,familyAlpha:'HOLD'
  }),
  mark('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',{
   engine,realWorkerFirst:true,explicitOwnerASave:1,ownerBPrivateRows:0,
   ownerAOriginalNotVisibleToB:true,ownerAOutfitNotVisibleToB:true,
   localIndexedDBOnly:true,syntheticAuth:true,hostedRLS:false,
   releaseAllowed:false,familyAlpha:'HOLD'
  }),
  mark('P91_FULL_JOURNEY_PASS',{
   engine,uninterruptedSourceExportRestore:true,writeRetries:0,ownerRecovery:true,
   originalPhotoByteTamperRefused:true,familyAlpha:'HOLD',releaseAuthorized:false
  })
 );
 if(failMarker)lines.push('M58_REAL_P88_WORKER_FAIL {"stage":"genuine worker original JPEG and live SegFormer"}');
 if(goodNetwork)lines.push(mark('M259_CONTEXT_NETWORK_WITNESS',{
  schema:'M259_CONTEXT_NETWORK_V1',engine,width:390,
  rows:unreadable?[
   {kind:'jsep-wasm',status:'body-unavailable'},
   {kind:'model-onnx',status:'body-unavailable'}
  ]:[
   {kind:'jsep-wasm',status:'body-observed',sha256:wasm,size:21596019},
   {kind:'model-onnx',status:'non-200'},
   {kind:'model-onnx',status:'body-observed',sha256:modelSha,size:15199746}
  ],
  wasmNetworkMatch:!unreadable,modelNetworkObserved:!unreadable,
  compiledWasmAttested:false,loadedModelAttested:false,
  sameNativeProcessProven:false,sourceEvidenceGate:'BLOCKED',familyAlpha:'HOLD'
 }));
 if(extra)lines.push(extra);
 return lines.join('\n');
}

test('original healthy WebKit evidence carries both genuine network SHA while NEVER native attesting',()=>{
 const r=classifyM263Attempt(sample(),identity(),1);
 assert.equal(r.result,'PASS');
 assert.equal(r.originalJourneyStatus,'PASS');
 assert.equal(r.originalNetworkModelStatus,'OBSERVED');
 assert.equal(r.originalNetworkJsepStatus,'OBSERVED');
 assert.equal(r.originalOnnxNetworkSHAObserved,onnx);
 assert.equal(r.originalJsepNetworkSHAObserved,wasm);
 assert.equal(r.nativeAllocatorStateObserved,false);
 assert.equal(r.nativeCompiledJsepSHA256,null);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.familyAlpha,'HOLD');
});
test('genuine successful Chromium with inaccessible bytes remains transparent PARTIAL',()=>{
 const r=classifyM263Attempt(sample({engine:'chromium',unreadable:true}),
  identity({engine:'chromium'}),2);
 assert.equal(r.result,'PASS');
 assert.equal(r.originalNetworkModelStatus,'PARTIAL');
 assert.equal(r.originalOnnxNetworkSHAObserved,null);
 assert.equal(r.sameBrowserContextNetworkPairObserved,false);
 assert.equal(r.sourceEvidenceGate,'BLOCKED');
});
test('first-attempt original WebKit P94 terminal RED never becomes green with correct HTTP bytes',()=>{
 const x=classifyM263Attempt(sample({failMarker:true}),
   identity({exitCode:1}),3);
 assert.equal(x.result,'FAIL');
 assert.equal(x.originalModelWorkerRedObserved,true);
 assert.equal(x.naturalOriginalWorkerRedCandidate,true);
 assert.equal(x.originalNetworkModelStatus,'OBSERVED');
 assert.equal(x.originalNetworkJsepStatus,'OBSERVED');
 assert.equal(x.sameBrowserContextNetworkPairObserved,true);
 assert.equal(x.naturalWebKitAllocatorFailureCausallyAttributed,false);
 assert.equal(x.sourceEvidenceGate,'FAIL');
});
test('model/jsep network SHA does not turn absent original owner completion into PASS',()=>{
 const x=classifyM263Attempt(sample({includeStages:false,failMarker:true}),
  identity({exitCode:1}),1);
 assert.equal(x.result,'FAIL');
 assert.equal(x.originalJourneyStatus,'FAIL');
 assert.equal(x.originalModelWorkerRedObserved,true);
 assert.equal(x.sourceEvidenceGate,'FAIL');
});
test('nonzero child exit with no true Worker RED is FAIL but not claimed allocator failure',()=>{
 const x=classifyM263Attempt(sample(),identity({exitCode:1}),4);
 assert.equal(x.result,'FAIL');
 assert.equal(x.naturalOriginalWorkerRedCandidate,false);
 assert.equal(x.naturalWebKitAllocatorFailureCausallyAttributed,false);
});
test('missing network response record is BLOCKED, not invented WebKit model/JSEP SHA',()=>{
 const x=classifyM263Attempt(sample({goodNetwork:false}),identity(),1);
 assert.equal(x.originalJourneyStatus,'PASS');
 assert.equal(x.result,'BLOCKED');
 assert.equal(x.originalOnnxNetworkSHAObserved,null);
});
test('wrong original model response SHA is FAIL even when original journey succeeded',()=>{
 const x=classifyM263Attempt(sample({modelSha:'f'.repeat(64)}),identity(),1);
 assert.equal(x.result,'FAIL');
 assert.equal(x.originalNetworkModelStatus,'FAIL');
 assert.equal(x.sourceEvidenceGate,'FAIL');
});
test('any reattempt, bad source, or malformed original record is refused',()=>{
 assert.throws(()=>classifyM263Attempt(sample(),identity({runAttempt:2}),1),/Invalid/);
 assert.throws(()=>classifyM263Attempt(sample(),identity({checkout:'bad'}),1),/Invalid/);
 assert.throws(()=>classifyM263Attempt('x'.repeat(8*1024*1024+1),identity(),1));
 assert.throws(()=>classifyM263Attempt(sample(),identity(),0));
});
const params={checkout:'a'.repeat(40),runId:'44558985581',engine:'webkit',width:390,count:2};
test('aggregate preserves any first-attempt WebKit RED as terminal FAIL, not retry-to-green',()=>{
 const good=classifyM263Attempt(sample(),identity(),1);
 const bad=classifyM263Attempt(sample({failMarker:true}),identity({exitCode:1}),2);
 const result=summarizeM263([good,bad],params);
 assert.equal(result.status,'FAIL');
 assert.equal(result.genuineFailedOriginalAttempts,1);
 assert.equal(result.originalWorkerRedCandidates,1);
 assert.equal(result.originalJsepAndOnnxNetworkPairWitnesses,2);
 assert.equal(result.releaseAuthorized,false);
});
test('cohort aggregation rejects missing, duplicate, rerun and cross-run receipts',()=>{
 const good=classifyM263Attempt(sample(),identity(),1);
 assert.throws(()=>summarizeM263([good],params),/Missing original/);
 assert.throws(()=>summarizeM263([good,good],params),/Duplicate/);
 assert.throws(()=>summarizeM263([good,{...good,ordinal:2,runAttempt:2}],params),/Duplicate|stale/);
 assert.throws(()=>summarizeM263([good,{...good,ordinal:2,runId:'1'}],params),/stale/);
 assert.throws(()=>summarizeM263([good,{...good,ordinal:2,releaseAuthorized:true}],params),/falsely/);
});
test('all healthy original WebKit processes may PASS cohort but never establish permanent reliability',()=>{
 const one=classifyM263Attempt(sample(),identity(),1);
 const two=classifyM263Attempt(sample(),identity(),2);
 const result=summarizeM263([one,two],params);
 assert.equal(result.status,'PASS');
 assert.equal(result.completedProcessReceipts,2);
 assert.equal(result.naturalWebKitAllocatorRepairProven,false);
 assert.equal(result.nativeRuntimeIdentityVerified,false);
 assert.equal(result.familyAlpha,'HOLD');
});
test('an unrecognized browser process with no owner/network markers does not become a natural model-cause proof',()=>{
 const x=classifyM263Attempt('Unhandled CLI failure',identity({exitCode:1}),1);
 assert.equal(x.result,'FAIL');
 assert.equal(x.naturalOriginalWorkerRedCandidate,false);
 assert.equal(x.sameBrowserContextNetworkPairObserved,false);
 assert.equal(x.originalNetworkModelStatus,'BLOCKED');
 assert.equal(x.naturalWebKitAllocatorFailureCausallyAttributed,false);
});
