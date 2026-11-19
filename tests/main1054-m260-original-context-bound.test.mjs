import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindM260OriginalAttempt} from '../research/main1054/m260-bind-original-network-evidence.mjs';
import {classifyM259} from '../research/main1054/m259-original-context-network.mjs';

const jpeg='1'.repeat(64);
const wasm='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const identity=(over={})=>({
 checkout:'a'.repeat(40),engine:'webkit',width:390,runId:'44512345678',
 job:'original-network',runAttempt:1,exitCode:0,lockedJpegSha:jpeg,...over
});
const stage=(tag,obj)=>tag+' '+JSON.stringify(obj);
function log({engine='webkit',broken={},extra='',network={}}={}){
 const rows=[
 stage('M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW',{
  engine,sourceSHA256:jpeg,realWorker:true,modelRequests:9,saved:0,hold:true,
  ...broken.model
 }),
 stage('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',{
  engine,modelExecuted:true,manualSyntheticOwnerConfirmed:true,
  ownerPrivateSaved:1,exactOriginalSHA256:jpeg,realNativeOutfit:true,
  savedOutfitOwnerAction:true,restoredSavedOutfitCount:1,
  actualV4BrowserDownload:true,tamperDenied:true,otherOwnerDenied:true,
  cancelledRestoreUnchanged:true,atomicRestore:true,threeDAuthorized:false,
  hostedRLS:false,familyAlpha:'HOLD',...broken.owner
 }),
 stage('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',{
  engine,realWorkerFirst:true,explicitOwnerASave:1,ownerBPrivateRows:0,
  ownerAOriginalNotVisibleToB:true,ownerAOutfitNotVisibleToB:true,
  localIndexedDBOnly:true,syntheticAuth:true,hostedRLS:false,
  releaseAllowed:false,familyAlpha:'HOLD',...broken.isolation
 }),
 stage('P91_FULL_JOURNEY_PASS',{
  engine,uninterruptedSourceExportRestore:true,writeRetries:0,
  ownerRecovery:true,originalPhotoByteTamperRefused:true,familyAlpha:'HOLD',
  releaseAuthorized:false,...broken.final
 }),
 stage('M259_CONTEXT_NETWORK_WITNESS',{
  schema:'M259_CONTEXT_NETWORK_V1',engine,width:390,
  rows:[
   {kind:'jsep-wasm',status:'body-observed',sha256:wasm,size:21596019},
   {kind:'model-onnx',status:'body-observed',sha256:'2'.repeat(64),size:15199746}
  ],
  wasmNetworkMatch:true,modelNetworkObserved:true,
  compiledWasmAttested:false,loadedModelAttested:false,
  sameNativeProcessProven:false,sourceEvidenceGate:'BLOCKED',familyAlpha:'HOLD',
  ...network
 })
 ];
 return rows.join('\n')+(extra?'\n'+extra:'');
}
test('original owner and genuine network body PASS still NEVER prove native runtime or release',()=>{
 const r=bindM260OriginalAttempt(log(),identity());
 assert.equal(r.originalJourneyGate,'PASS');
 assert.equal(r.networkObservationGate,'OBSERVED');
 assert.equal(r.sourceEvidenceGate,'BLOCKED');
 assert.equal(r.nativeCompiledJsepSHA256,null);
 assert.equal(r.nativeLoadedOnnxSHA256,null);
 assert.equal(r.nativeProcessIdentityVerified,false);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.familyAlpha,'HOLD');
});
test('M259 network-only classifier illustrates the existing unbound RED vulnerability',()=>{
 const bad=log({extra:'M58_REAL_P88_WORKER_FAIL {"stage":"native-session","error":"original allocator RED"}'});
 assert.equal(classifyM259(bad,'webkit',390).status,'OBSERVED_NETWORK_BODIES');
 const fixed=bindM260OriginalAttempt(bad,identity());
 assert.equal(fixed.originalJourneyGate,'FAIL');
 assert.equal(fixed.sourceEvidenceGate,'FAIL');
});
test('nonzero original browser exit is FAIL even with all successful markers',()=>{
 for(const code of [1,124,137]){
  const r=bindM260OriginalAttempt(log(),identity({exitCode:code}));
  assert.equal(r.originalJourneyGate,'FAIL');
  assert.equal(r.sourceEvidenceGate,'FAIL');
 }
});
test('an explicit native RED before otherwise green source/owner markers is never PASS',()=>{
 const r=bindM260OriginalAttempt('M58_REAL_P88_WORKER_FAIL {"stage":"model"}\n'+log(),identity());
 assert.equal(r.originalJourneyGate,'FAIL');
 assert.equal(r.sourceEvidenceGate,'FAIL');
});
test('missing owner B exclusion or forged original JPEG cannot promote',()=>{
 for(const testcase of [
  log({broken:{isolation:{ownerBPrivateRows:1}}}),
  log({broken:{model:{sourceSHA256:'f'.repeat(64)}}}),
  log({broken:{owner:{threeDAuthorized:true}}})
 ]){
  const r=bindM260OriginalAttempt(testcase,identity());
  assert.equal(r.originalJourneyGate,'BLOCKED');
  assert.equal(r.sourceEvidenceGate,'BLOCKED');
 }
});
test('M260 binds first attempt and rejects reattempt, wrong model owner and mismatched viewport',()=>{
 const retry=bindM260OriginalAttempt(log(),identity({runAttempt:2}));
 assert.equal(retry.originalJourneyGate,'BLOCKED');
 assert.ok(retry.reasons.includes('Not first attempt'));
 const foreign=bindM260OriginalAttempt(log(),identity({engine:'chromium'}));
 assert.equal(foreign.originalJourneyGate,'BLOCKED');
 const width=bindM260OriginalAttempt(log(),identity({width:430}));
 assert.equal(width.originalJourneyGate,'BLOCKED');
});
test('M259 missing/malformed network witness cannot inherit green original owner journey',()=>{
 const sample=log();
 for(const x of [
  sample.split('\n').slice(0,4).join('\n'),
  sample+'\n'+sample.split('\n').at(-1),
  sample.replace(/M259_CONTEXT_NETWORK_WITNESS .+$/, 'M259_CONTEXT_NETWORK_WITNESS {BAD')
 ]){
  const r=bindM260OriginalAttempt(x,identity());
  assert.equal(r.originalJourneyGate,'BLOCKED');
  assert.equal(r.networkObservationGate,'BLOCKED');
 }
});
test('real WebKit JSEP wrong hash is FAIL rather than unrelated PASS',()=>{
 const badRows=[
  {kind:'jsep-wasm',status:'body-observed',sha256:'f'.repeat(64),size:21596019},
  {kind:'model-onnx',status:'body-observed',sha256:'2'.repeat(64),size:15199746}
 ];
 const r=bindM260OriginalAttempt(log({network:{rows:badRows,wasmNetworkMatch:false}}),identity());
 assert.equal(r.originalJourneyGate,'FAIL');
 assert.equal(r.networkObservationGate,'FAIL');
 assert.equal(r.sourceEvidenceGate,'FAIL');
});
test('Chromium original model journey PASS with unreadable network bodies is PARTIAL, never fake-attested',()=>{
 const rows=[{kind:'jsep-wasm',status:'body-unavailable'},
             {kind:'model-onnx',status:'body-unavailable'}];
 const l=log({engine:'chromium',network:{rows,wasmNetworkMatch:false,modelNetworkObserved:false}});
 const r=bindM260OriginalAttempt(l,identity({engine:'chromium'}));
 assert.equal(r.originalJourneyGate,'PASS');
 assert.equal(r.networkObservationGate,'PARTIAL');
 assert.equal(r.nativeProcessIdentityVerified,false);
 assert.equal(r.sourceEvidenceGate,'BLOCKED');
});
test('untrusted raw stdout and private tokens never enter bounded result',()=>{
 const privateText='PASSWORD_SENSITIVE_MARKER';
 const r=bindM260OriginalAttempt(log({extra:privateText}),identity());
 assert.doesNotMatch(JSON.stringify(r),/PASSWORD_SENSITIVE_MARKER/);
});
test('rejects malformed checkouts and oversized transcripts',()=>{
 assert.throws(()=>bindM260OriginalAttempt(log(),identity({checkout:'bad'})));
 assert.throws(()=>bindM260OriginalAttempt('x'.repeat(8*1024*1024+1),identity()));
 assert.throws(()=>bindM260OriginalAttempt(log(),identity({runAttempt:0})));
});
