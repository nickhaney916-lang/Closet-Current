import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assessM262,EXPECTED_ONNX_SHA256} from
 '../research/main1054/m262-original-onnx-byte-identity.mjs';
import {classifyM266Attempt,summarizeM266} from
 '../research/main1054/m266-original-http-true-fresh-cohort.mjs';

const jpeg='1'.repeat(64);
const jsep='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const id=(extra={})=>({
 checkout:'a'.repeat(40),engine:'webkit',width:390,runId:'44567974763',
 job:'original-model',runAttempt:1,exitCode:0,lockedJpegSha:jpeg,...extra
});
const mark=(tag,obj)=>tag+' '+JSON.stringify(obj);
function original({
 engine='webkit',model404=false,jsep404=false,model500=false,
 unreadable=false,wrongModel=false,nativeRed=false,omitNetwork=false,omitOwner=false,
 malformedNon200=false
}={}){
 const lines=[];
 if(!omitOwner)lines.push(
 mark('M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW',{
  engine,sourceSHA256:jpeg,realWorker:true,modelRequests:9,saved:0,hold:true}),
 mark('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',{
  engine,modelExecuted:true,manualSyntheticOwnerConfirmed:true,ownerPrivateSaved:1,
  exactOriginalSHA256:jpeg,realNativeOutfit:true,savedOutfitOwnerAction:true,
  restoredSavedOutfitCount:1,actualV4BrowserDownload:true,tamperDenied:true,
  otherOwnerDenied:true,cancelledRestoreUnchanged:true,atomicRestore:true,
  threeDAuthorized:false,hostedRLS:false,familyAlpha:'HOLD'}),
 mark('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',{
  engine,realWorkerFirst:true,explicitOwnerASave:1,ownerBPrivateRows:0,
  ownerAOriginalNotVisibleToB:true,ownerAOutfitNotVisibleToB:true,
  localIndexedDBOnly:true,syntheticAuth:true,hostedRLS:false,
  releaseAllowed:false,familyAlpha:'HOLD'}),
 mark('P91_FULL_JOURNEY_PASS',{
  engine,uninterruptedSourceExportRestore:true,writeRetries:0,
  ownerRecovery:true,originalPhotoByteTamperRefused:true,
  familyAlpha:'HOLD',releaseAuthorized:false})
 );
 if(nativeRed)lines.push('M58_REAL_P88_WORKER_FAIL {"stage":"model_session_load"}');
 if(!omitNetwork){
  const rows=unreadable?[
   {kind:'jsep-wasm',status:'body-unavailable'},
   {kind:'model-onnx',status:'non-200',httpStatus:307,hasLocation:true},
   {kind:'model-onnx',status:'body-unavailable'}
  ]:[
   {kind:'jsep-wasm',status:'body-observed',sha256:jsep,size:21596019},
   {kind:'model-onnx',status:'non-200',httpStatus:307,hasLocation:true},
   {kind:'model-onnx',status:'body-observed',
    sha256:wrongModel?'f'.repeat(64):EXPECTED_ONNX_SHA256,size:15199746}
  ];
  if(model404||model500)rows.push(malformedNon200?
   {kind:'model-onnx',status:'non-200'}:
   {kind:'model-onnx',status:'non-200',
     httpStatus:model404?404:500,hasLocation:false});
  if(jsep404)rows.push({kind:'jsep-wasm',status:'non-200',httpStatus:404,hasLocation:false});
  lines.push(mark('M259_CONTEXT_NETWORK_WITNESS',{
   schema:'M259_CONTEXT_NETWORK_V1',engine,width:390,rows,
   wasmNetworkMatch:!unreadable,modelNetworkObserved:!unreadable,
   compiledWasmAttested:false,loadedModelAttested:false,
   sameNativeProcessProven:false,sourceEvidenceGate:'BLOCKED',familyAlpha:'HOLD'
  }));
 }
 return lines.join('\n');
}
test('real-like WebKit canonical ONNX/JSEP plus normal 307 response is PASS without native attestation',()=>{
 const r=classifyM266Attempt(original(),id(),1);
 assert.equal(r.originalJourneyStatus,'PASS');
 assert.equal(r.originalModelHttpGate,'REDIRECT_PLUS_BODY');
 assert.equal(r.originalModelNetworkGate,'PARTIAL');
 assert.equal(r.originalJsepNetworkGate,'OBSERVED');
 assert.equal(r.sameBrowserContextCanonicalPairObserved,true);
 assert.equal(r.result,'PASS');
 assert.equal(r.sourceEvidenceGate,'BLOCKED');
 assert.equal(r.nativeCompiledJsepSHA256,null);
 assert.equal(r.nativeLoadedOnnxSHA256,null);
 assert.equal(r.releaseAuthorized,false);
});
test('historical M262 source-only ONNX verdict cannot explicitly classify a hard HTTP 404',()=>{
 const log=original({model404:true});
 const old=assessM262(log,id());
 assert.equal(old.sourceEvidenceGate,'BLOCKED');
 const upgraded=classifyM266Attempt(log,id(),1);
 assert.equal(upgraded.originalModelHttpGate,'FAIL');
 assert.equal(upgraded.originalModelHardHttpErrors,1);
 assert.equal(upgraded.result,'FAIL');
 assert.equal(upgraded.sourceEvidenceGate,'FAIL');
});
test('canonical JSEP body plus unrelated original JSEP 404 is FAIL rather than source observed',()=>{
 const r=classifyM266Attempt(original({jsep404:true}),id(),1);
 assert.equal(r.originalJsepNetworkGate,'FAIL');
 assert.equal(r.originalJsepHardHttpErrors,1);
 assert.equal(r.result,'FAIL');
 assert.equal(r.sourceEvidenceGate,'FAIL');
});
test('model HTTP 500 + canonical SHA must preserve FAIL',()=>{
 const r=classifyM266Attempt(original({model500:true}),id(),1);
 assert.equal(r.originalModelHardHttpErrors,1);
 assert.equal(r.result,'FAIL');
});
test('changed 15MiB ONNX digest cannot be masked by a good original JSEP digest',()=>{
 const r=classifyM266Attempt(original({wrongModel:true}),id(),1);
 assert.equal(r.originalModelNetworkGate,'FAIL');
 assert.equal(r.result,'FAIL');
});
test('Chromium original owner journey with actual unreadable model/JSEP bodies stays PARTIAL, not SHA-attested',()=>{
 const r=classifyM266Attempt(original({engine:'chromium',unreadable:true}),
  id({engine:'chromium'}),1);
 assert.equal(r.originalJourneyStatus,'PASS');
 assert.equal(r.originalModelHttpGate,'PARTIAL');
 assert.equal(r.originalJsepNetworkGate,'PARTIAL');
 assert.equal(r.result,'PASS');
 assert.equal(r.sameBrowserContextCanonicalPairObserved,false);
 assert.equal(r.originalModelOnnxNetworkSHA256,null);
 assert.equal(r.sourceEvidenceGate,'BLOCKED');
});
test('genuine original P94 terminal RED and nonzero exit stay FAIL even with correct original bytes',()=>{
 const r=classifyM266Attempt(original({nativeRed:true}),id({exitCode:1}),1);
 assert.equal(r.result,'FAIL');
 assert.equal(r.naturalOriginalWorkerRedCandidate,true);
 assert.equal(r.originalWorkerTerminalRedCount,1);
 assert.equal(r.sourceEvidenceGate,'FAIL');
 assert.equal(r.naturalIntermittentWebKitFaultRepaired,false);
});
test('untrusted or missing original network receipt can never become a passing owner journey',()=>{
 const missing=classifyM266Attempt(original({omitNetwork:true}),id(),1);
 assert.equal(missing.result,'BLOCKED');
 assert.equal(missing.sameBrowserContextCanonicalPairObserved,false);
 const malformed=classifyM266Attempt(original({model404:true,malformedNon200:true}),id(),1);
 assert.equal(malformed.result,'BLOCKED');
});
test('wrong native source account isolation signal is blocked independently of good model bytes',()=>{
 const r=classifyM266Attempt(original({omitOwner:true}),id(),1);
 assert.equal(r.result,'BLOCKED');
});
test('no synthetic WebKit PASS on a different engine, retry or malformed run identity',()=>{
 assert.throws(()=>classifyM266Attempt(original(),id({runAttempt:2}),1));
 assert.throws(()=>classifyM266Attempt(original(),id({checkout:'missing'}),1));
 assert.throws(()=>classifyM266Attempt(original(),id(),0));
 assert.throws(()=>classifyM266Attempt('x'.repeat(8*1024*1024+1),id(),1));
 const wrong=classifyM266Attempt(original(),id({engine:'chromium'}),1);
 assert.notEqual(wrong.result,'PASS');
});
const cfg={checkout:'a'.repeat(40),runId:'44567974763',engine:'webkit',width:390,count:2};
test('two healthy first original browser attempts PASS while keeping runtime reliability unproven',()=>{
 const one=classifyM266Attempt(original(),id(),1);
 const two=classifyM266Attempt(original(),id(),2);
 const r=summarizeM266([one,two],cfg);
 assert.equal(r.observedFreshProcesses,2);
 assert.equal(r.originalPositiveJourneys,2);
 assert.equal(r.originalOnnxJsepSameContextPairWitnesses,2);
 assert.equal(r.status,'PASS');
 assert.equal(r.originalNaturalWebKitFailureCausallyRepaired,false);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.familyAlpha,'HOLD');
});
test('any natural first attempt failure remains terminal FAIL in complete cohort',()=>{
 const one=classifyM266Attempt(original(),id(),1);
 const two=classifyM266Attempt(original({nativeRed:true}),id({exitCode:1}),2);
 const r=summarizeM266([one,two],cfg);
 assert.equal(r.originalFailedJourneys,1);
 assert.equal(r.naturalOriginalWorkerRedCandidates,1);
 assert.equal(r.status,'FAIL');
 assert.equal(r.releaseAuthorized,false);
});
test('cohort rejects missing/duplicate, stale other-head, same-cell retry and forged green HTTP fail receipts',()=>{
 const one=classifyM266Attempt(original(),id(),1);
 const two=classifyM266Attempt(original(),id(),2);
 assert.throws(()=>summarizeM266([one],cfg));
 assert.throws(()=>summarizeM266([one,one],cfg));
 assert.throws(()=>summarizeM266([one,{...two,runId:'987'}],cfg));
 assert.throws(()=>summarizeM266([one,{...two,runAttempt:2}],cfg));
 assert.throws(()=>summarizeM266([one,{...two,originalModelHardHttpErrors:1}],cfg));
 assert.throws(()=>summarizeM266([one,{...two,releaseAuthorized:true}],cfg));
 assert.throws(()=>summarizeM266([one,{...two,nativeCompiledJsepSHA256:jsep}],cfg));
});
