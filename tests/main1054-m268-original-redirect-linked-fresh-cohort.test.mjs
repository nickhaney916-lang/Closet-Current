import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assessM265} from '../research/main1054/m265-original-jsep-http-truth.mjs';
import {classifyM268,summarizeM268} from '../research/main1054/m268-redirect-linked-original-fresh-cohort.mjs';

const jpeg='1'.repeat(64);
const jsep='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const onnx='02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3';
const mark=(tag,v)=>tag+' '+JSON.stringify(v);
const ident=(change={})=>({
 checkout:'a'.repeat(40),engine:'webkit',width:390,runId:'44601046110',
 job:'m268-first',runAttempt:1,exitCode:0,lockedJpegSha:jpeg,...change
});
function log({
 engine='webkit',orphan=false,redirect=true,unreadable=false,
 badJsep=false,badOnnx=false,hardModel=false,hardJsep=false,
 workerRed=false,owner=false,duplicate=false,missingNetwork=false,
 wrongChainId=false
}={}){
 const lines=[];
 if(!owner)lines.push(
 mark('M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW',{
  engine,sourceSHA256:jpeg,realWorker:true,modelRequests:9,saved:0,hold:true}),
 mark('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',{
  engine,modelExecuted:true,manualSyntheticOwnerConfirmed:true,
  ownerPrivateSaved:1,exactOriginalSHA256:jpeg,realNativeOutfit:true,
  savedOutfitOwnerAction:true,restoredSavedOutfitCount:1,
  actualV4BrowserDownload:true,tamperDenied:true,otherOwnerDenied:true,
  cancelledRestoreUnchanged:true,atomicRestore:true,threeDAuthorized:false,
  hostedRLS:false,familyAlpha:'HOLD'}),
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
 if(workerRed)lines.push(mark('M58_REAL_P88_WORKER_FAIL',{stage:'model_session_load'}));
 if(!missingNetwork){
  const rows=[];
  rows.push(unreadable?
   {kind:'jsep-wasm',status:'body-unavailable',chainId:1}:
   {kind:'jsep-wasm',status:'body-observed',
    sha256:badJsep?'e'.repeat(64):jsep,size:21596019,chainId:1});
  if(hardJsep)rows.push({kind:'jsep-wasm',status:'non-200',
    httpStatus:404,hasLocation:false,chainId:3});
  if(redirect)rows.push({kind:'model-onnx',status:'non-200',
   httpStatus:307,hasLocation:true,chainId:2});
  rows.push(unreadable?
   {kind:'model-onnx',status:'body-unavailable',
    chainId:wrongChainId?0:(orphan?4:2)}:
   {kind:'model-onnx',status:'body-observed',
    sha256:badOnnx?'f'.repeat(64):onnx,size:15199746,
    chainId:wrongChainId?0:(orphan?4:2)});
  if(hardModel)rows.push({kind:'model-onnx',status:'non-200',
   httpStatus:500,hasLocation:false,chainId:5});
  if(duplicate)rows.push({...rows.at(-1)});
  lines.push(mark('M259_CONTEXT_NETWORK_WITNESS',{
   schema:'M259_CONTEXT_NETWORK_V1',engine,width:390,rows,
   wasmNetworkMatch:!unreadable,modelNetworkObserved:!unreadable,
   compiledWasmAttested:false,loadedModelAttested:false,
   sameNativeProcessProven:false,sourceEvidenceGate:'BLOCKED',familyAlpha:'HOLD'
  }));
 }
 return lines.join('\n');
}
test('WebKit original redirect->canonical body on SAME root is LINKED PASS without allocator proof',()=>{
 const r=classifyM268(log(),ident(),1);
 assert.equal(r.originalResult,'PASS');
 assert.equal(r.originalNetworkChainGate,'LINKED');
 assert.equal(r.originalModelRedirectChains,1);
 assert.equal(r.originalModelCanonicalBodies,1);
 assert.equal(r.originalJsepCanonicalBodies,1);
 assert.equal(r.sameBrowserContextCanonicalRedirectChainsVerified,true);
 assert.equal(r.originalOnnxNetworkSHA256,onnx);
 assert.equal(r.originalJsepNetworkSHA256,jsep);
 assert.equal(r.nativeCompiledJsepSHA256,null);
 assert.equal(r.causalPermanentWebKitFixProven,false);
 assert.equal(r.sourceEvidenceGate,'BLOCKED');
 assert.equal(r.releaseAuthorized,false);
});
test('old M265 accepted orphaned 307 plus unrelated canonical model, new M267-linked cohort FAILS',()=>{
 const text=log({orphan:true});
 const prior=assessM265(text,ident());
 assert.equal(prior.originalJourneyGate,'PASS');
 assert.equal(prior.sourceEvidenceGate,'BLOCKED');
 const current=classifyM268(text,ident(),1);
 assert.equal(current.originalNetworkChainGate,'FAIL');
 assert.equal(current.originalModelOrphanRedirectChains,1);
 assert.equal(current.originalResult,'FAIL');
 assert.equal(current.sourceEvidenceGate,'FAIL');
});
test('hard 404 JSEP and hard 500 ONNX never launder with good original SHA',()=>{
 const j=classifyM268(log({hardJsep:true}),ident(),1);
 const m=classifyM268(log({hardModel:true}),ident(),1);
 for(const v of [j,m]){
  assert.equal(v.originalResult,'FAIL');
  assert.equal(v.sourceEvidenceGate,'FAIL');
  assert.equal(v.sameBrowserContextCanonicalRedirectChainsVerified,false);
 }
 assert.equal(j.originalJsepHttpErrors,1);
 assert.equal(m.originalModelHttpErrors,1);
});
test('canonical bytes with incorrectly mismatched original ONNX or JSEP fail closed',()=>{
 for(const settings of [{badJsep:true},{badOnnx:true}]){
  const r=classifyM268(log(settings),ident(),1);
  assert.equal(r.originalResult,'FAIL');
  assert.equal(r.sourceEvidenceGate,'FAIL');
 }
});
test('Chromium true owner journey with unreadable JSEP/ONNX network stays partial, never forged hash',()=>{
 const r=classifyM268(log({engine:'chromium',unreadable:true}),
  ident({engine:'chromium'}),1);
 assert.equal(r.originalOwnerJourneyGate,'PASS');
 assert.equal(r.originalNetworkChainGate,'LINKED');
 assert.equal(r.originalResult,'PASS');
 assert.equal(r.originalOnnxNetworkSHA256,null);
 assert.equal(r.originalJsepNetworkSHA256,null);
 assert.equal(r.sameBrowserContextCanonicalRedirectChainsVerified,false);
});
test('duplicate final response or invalid root ID must not promote model acceptance',()=>{
 const d=classifyM268(log({duplicate:true}),ident(),1);
 assert.equal(d.originalResult,'FAIL');
 assert.ok(d.originalNetworkDuplicateTerminals!==0||d.originalModelHttpErrors>0);
 const wrong=classifyM268(log({wrongChainId:true}),ident(),1);
 assert.equal(wrong.originalResult,'BLOCKED');
});
test('natural original P94 Worker RED is FAIL even with correct original resource links',()=>{
 const r=classifyM268(log({workerRed:true}),ident({exitCode:1}),1);
 assert.equal(r.originalResult,'FAIL');
 assert.equal(r.naturalOriginalWorkerRedCandidate,true);
 assert.equal(r.originalWorkerTerminalRedCount,1);
 assert.equal(r.originalNetworkChainGate,'LINKED');
 assert.equal(r.originalModelCanonicalBodies,1);
 assert.equal(r.originalJsepCanonicalBodies,1);
 // The HTTP response chain is observed, but a failed original Worker must
 // NOT be promoted into a source-attested original model success.
 assert.equal(r.sameBrowserContextCanonicalRedirectChainsVerified,false);
 assert.equal(r.originalOnnxNetworkSHA256,null);
 assert.equal(r.originalJsepNetworkSHA256,null);
 assert.equal(r.sourceEvidenceGate,'FAIL');
 assert.equal(r.causalPermanentWebKitFixProven,false);
});
test('child exit failure without Worker marker stays FAIL but not misidentified native memory error',()=>{
 const r=classifyM268(log(),ident({exitCode:124}),2);
 assert.equal(r.originalResult,'FAIL');
 assert.equal(r.naturalOriginalWorkerRedCandidate,false);
 assert.equal(r.nativeAllocatorStateObserved,false);
});
test('missing network record, incomplete owner journey and unsupported engine must fail closed',()=>{
 assert.equal(classifyM268(log({missingNetwork:true}),ident(),1).originalResult,'BLOCKED');
 assert.equal(classifyM268(log({owner:true}),ident(),1).originalResult,'BLOCKED');
 assert.throws(()=>classifyM268(log(),ident({engine:'safari'}),1));
});
test('stale retry, malformed HEAD and oversized logs rejected before classification',()=>{
 assert.throws(()=>classifyM268(log(),ident({runAttempt:2}),1));
 assert.throws(()=>classifyM268(log(),ident({checkout:'0'}),1));
 assert.throws(()=>classifyM268(log(),ident(),0));
 assert.throws(()=>classifyM268('x'.repeat(8*1024*1024+1),ident(),1));
});
const args={checkout:'a'.repeat(40),runId:'44601046110',engine:'webkit',width:390,count:2};
test('two original fresh-browser positives pass scoped cohort but permanent native fix remains unproven',()=>{
 const a=classifyM268(log(),ident(),1);
 const b=classifyM268(log(),ident(),2);
 const r=summarizeM268([a,b],args);
 assert.equal(r.status,'PASS');
 assert.equal(r.observedFreshProcesses,2);
 assert.equal(r.originalFullyLinkedCanonicalNetworkPairs,2);
 assert.equal(r.nativeAllocatorRootCauseVerified,false);
 assert.equal(r.permanentWebKitFixProven,false);
 assert.equal(r.familyAlpha,'HOLD');
});
test('cohort preserves any actual naturally RED original browser process in final result',()=>{
 const a=classifyM268(log(),ident(),1);
 const b=classifyM268(log({workerRed:true}),ident({exitCode:1}),2);
 const r=summarizeM268([a,b],args);
 assert.equal(r.status,'FAIL');
 assert.equal(r.originalFailedJourneys,1);
 assert.equal(r.naturalOriginalWorkerRedCandidates,1);
 assert.equal(r.releaseAuthorized,false);
});
test('missing, duplicate, retry, cross-head and fabricated source PASS quarantined',()=>{
 const a=classifyM268(log(),ident(),1);
 const b=classifyM268(log(),ident(),2);
 assert.throws(()=>summarizeM268([a],args));
 assert.throws(()=>summarizeM268([a,a],args));
 assert.throws(()=>summarizeM268([a,{...b,checkout:'b'.repeat(40)}],args));
 assert.throws(()=>summarizeM268([a,{...b,runAttempt:2}],args));
 assert.throws(()=>summarizeM268([a,{...b,originalOnnxNetworkSHA256:'0'.repeat(64)}],args));
 assert.throws(()=>summarizeM268([a,{...b,releaseAuthorized:true}],args));
});
