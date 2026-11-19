import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {deriveM265,assessM265,verifyM265,JSEP_SHA,JSEP_BYTES} from '../research/main1054/m265-original-jsep-http-truth.mjs';
import {verifyM264} from '../research/main1054/m264-model-http-redirect-truth.mjs';
import {EXPECTED_ONNX_SHA256,EXPECTED_ONNX_BYTES} from '../research/main1054/m262-original-onnx-byte-identity.mjs';
const photo='b'.repeat(64);
const jsep={kind:'jsep-wasm',status:'body-observed',sha256:JSEP_SHA,size:JSEP_BYTES};
const model={kind:'model-onnx',status:'body-observed',sha256:EXPECTED_ONNX_SHA256,size:EXPECTED_ONNX_BYTES};
const redirect=(kind='jsep-wasm',httpStatus=307,hasLocation=true)=>
 ({kind,status:'non-200',httpStatus,hasLocation});
const receipt=(label,data)=>label+' '+JSON.stringify(data);
const identity=(x={})=>({
 checkout:'a'.repeat(40),engine:'webkit',width:390,runId:'44577205364',
 runAttempt:1,exitCode:0,job:'m265-original',lockedJpegSha:photo,...x
});
function originalLog({engine='webkit',jseps=[jsep],models=[model],success=true,
 failure=false,injection=false,extra='',net={}}={}){
 const lines=[];
 if(success)lines.push(
  receipt('M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW',{
   engine,sourceSHA256:photo,realWorker:true,modelRequests:9,saved:0,hold:true
  }),
  receipt('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',{
   engine,modelExecuted:true,manualSyntheticOwnerConfirmed:true,ownerPrivateSaved:1,
   exactOriginalSHA256:photo,realNativeOutfit:true,savedOutfitOwnerAction:true,
   restoredSavedOutfitCount:1,actualV4BrowserDownload:true,tamperDenied:true,
   otherOwnerDenied:true,cancelledRestoreUnchanged:true,atomicRestore:true,
   threeDAuthorized:false,hostedRLS:false,familyAlpha:'HOLD'
  }),
  receipt('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',{
   engine,realWorkerFirst:true,explicitOwnerASave:1,ownerBPrivateRows:0,
   ownerAOriginalNotVisibleToB:true,ownerAOutfitNotVisibleToB:true,
   localIndexedDBOnly:true,syntheticAuth:true,hostedRLS:false,
   releaseAllowed:false,familyAlpha:'HOLD'
  }),
  receipt('P91_FULL_JOURNEY_PASS',{
   engine,uninterruptedSourceExportRestore:true,writeRetries:0,ownerRecovery:true,
   originalPhotoByteTamperRefused:true,familyAlpha:'HOLD',releaseAuthorized:false
  })
 );
 if(failure)lines.push('M58_REAL_P88_WORKER_FAIL {"stage":"genuine-worker-session","reason":"P94_model_load"}');
 if(injection)lines.push(receipt('M265_ORIGINAL_JSEP_HTTP404_FAULT',{
  schema:'M265_JSEP_HTTP404_V1',engine,width:390,intercepted:jseps.length,
  originalRunnerUnmodified:true,originalWorkerUnmodified:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 }));
 const rows=[...jseps,...models];
 lines.push(receipt('M259_CONTEXT_NETWORK_WITNESS',{
  schema:'M259_CONTEXT_NETWORK_V1',engine,width:390,rows,
  wasmNetworkMatch:jseps.some(x=>x.status==='body-observed'&&x.sha256===JSEP_SHA),
  modelNetworkObserved:models.some(x=>x.status==='body-observed'),
  compiledWasmAttested:false,loadedModelAttested:false,sameNativeProcessProven:false,
  sourceEvidenceGate:'BLOCKED',familyAlpha:'HOLD',...net
 }));
 if(extra)lines.push(extra);
 return lines.join('\n');
}
test('only frozen actual P94 original can derive both disposable JSEP variants',()=>{
 const original=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
 const good=deriveM265(original);
 const bad=deriveM265(original,{http404:true});
 assert.match(good,/httpStatus=res.status/);
 assert.doesNotMatch(good,/M265_ORIGINAL_JSEP_HTTP404_FAULT/);
 assert.match(bad,/M265_JSEP_HTTP404_RESEARCH_ONLY/);
 assert.match(bad,/ort-wasm-simd-threaded/);
 assert.doesNotMatch(original,/M265_ORIGINAL_JSEP_HTTP404_FAULT/);
 assert.throws(()=>deriveM265(original+'\n// changed'),/original P94 runner drift/i);
 const tmp=mkdtempSync(join(tmpdir(),'m265-original-'));
 try{
  for(const [name,code] of [['positive',good],['negative',bad]]){
   const file=join(tmp,name+'.mjs');writeFileSync(file,code);
   const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
   assert.equal(r.status,0,name+' derived browser must compile: '+r.stderr);
  }
 }finally{rmSync(tmp,{recursive:true,force:true});}
});
test('correct original JSEP and original ONNX with real owner journey is observed network, never native',()=>{
 const v=verifyM265(originalLog(),identity());
 assert.equal(v.originalJourneyGate,'PASS');
 assert.equal(v.originalJsepNetworkGate,'OBSERVED');
 assert.equal(v.canonicalJsepResponses,1);
 assert.equal(v.jsepHardHttpErrors,0);
 assert.equal(v.sourceEvidenceGate,'BLOCKED');
 assert.equal(v.nativeCompiledJsepSHA256,null);
 assert.equal(v.nativeJsepProcessIdentityVerified,false);
 assert.equal(v.releaseAuthorized,false);
});
test('WebKit JSEP 307 redirect + correct WASM body may succeed but remains PARTIAL',()=>{
 const v=verifyM265(originalLog({
  jseps:[redirect('jsep-wasm'),jsep],
  models:[redirect('model-onnx'),model]
 }),identity());
 assert.equal(v.originalJourneyGate,'PASS');
 assert.equal(v.originalJsepNetworkGate,'PARTIAL');
 assert.equal(v.canonicalJsepResponses,1);
 assert.equal(v.jsepRedirectResponses,1);
 assert.equal(v.jsepHardHttpErrors,0);
 assert.equal(v.sourceEvidenceGate,'BLOCKED');
});
test('reproduce prior acceptance defect: correct JSEP SHA + HTTP 404 was accepted by model-only M264',()=>{
 const l=originalLog({jseps:[jsep,redirect('jsep-wasm',404,false)]});
 assert.equal(verifyM264(l,identity()).originalJourneyGate,'PASS');
 const v=assessM265(l,identity());
 assert.equal(v.originalJsepNetworkGate,'FAIL');
 assert.equal(v.jsepHardHttpErrors,1);
 assert.equal(v.sourceEvidenceGate,'FAIL');
 assert.throws(()=>verifyM265(l,identity()),/JSEP HTTP success unverified/);
});
test('original JSEP hard HTTP 403 404 429 500 503 always FAIL even with a correct SHA',()=>{
 for(const status of [403,404,429,500,503]){
  const l=originalLog({jseps:[jsep,redirect('jsep-wasm',status,false)]});
  assert.equal(assessM265(l,identity()).originalJsepNetworkGate,'FAIL');
  assert.throws(()=>verifyM265(l,identity()),/JSEP HTTP success unverified/);
 }
});
test('wrong or forged JSEP HTTP status/redirect header cannot be treated as benign',()=>{
 for(const r of [
  redirect('jsep-wasm',307,false),
  redirect('jsep-wasm',404,true)
 ]){
  const v=assessM265(originalLog({jseps:[jsep,r]}),identity());
  assert.equal(v.originalJsepNetworkGate,'FAIL');
 }
 for(const r of [
  {kind:'jsep-wasm',status:'non-200'},
  {kind:'jsep-wasm',status:'non-200',httpStatus:'307',hasLocation:true},
  {kind:'jsep-wasm',status:'non-200',httpStatus:999,hasLocation:true}
 ])assert.throws(()=>assessM265(originalLog({jseps:[r]}),identity()),
  /Missing original JSEP HTTP response status/);
});
test('Chromium direct original JSEP unreadable remains PARTIAL, without invented native hash',()=>{
 const v=verifyM265(originalLog({engine:'chromium',
  jseps:[{kind:'jsep-wasm',status:'body-unavailable'}],
  models:[{kind:'model-onnx',status:'body-unavailable'}]
 }),identity({engine:'chromium'}));
 assert.equal(v.originalJourneyGate,'PASS');
 assert.equal(v.originalJsepNetworkGate,'PARTIAL');
 assert.equal(v.canonicalJsepResponses,0);
 assert.equal(v.unreadableJsepResponses,1);
 assert.equal(v.sourceEvidenceGate,'BLOCKED');
});
test('WebKit may not pretend an unreadable JSEP response has expected original digest',()=>{
 const l=originalLog({jseps:[{kind:'jsep-wasm',status:'body-unavailable'}]});
 assert.throws(()=>verifyM265(l,identity()),/final ONNX\/JSEP bytes|WebKit original JSEP|Original first-attempt model\/network acceptance incomplete/);
});
test('wrong original JSEP WASM SHA and valid original model can never be promoted',()=>{
 const l=originalLog({jseps:[{...jsep,sha256:'f'.repeat(64)}]});
 const v=assessM265(l,identity());
 assert.equal(v.originalJsepNetworkGate,'FAIL');
 assert.equal(v.sourceEvidenceGate,'FAIL');
 assert.throws(()=>verifyM265(l,identity()));
});
test('controlled original JSEP 404 preserves genuine original Worker failure with no model response',()=>{
 const l=originalLog({jseps:[redirect('jsep-wasm',404,false)],models:[],
  success:false,failure:true,injection:true});
 const v=verifyM265(l,identity({exitCode:1}),{http404:true});
 assert.equal(v.originalJsepNetworkGate,'FAIL');
 assert.equal(v.originalJourneyGate,'FAIL');
 assert.equal(v.originalModelNetworkGate,'NOT_OBSERVED');
 assert.equal(v.jsepHardHttpErrors,1);
 assert.equal(v.sourceEvidenceGate,'FAIL');
 assert.equal(v.intentionallyFailedOriginalJsep404,true);
 assert.throws(()=>verifyM265(l,identity({exitCode:0}),{http404:true}),/verified real Worker RED/);
 assert.throws(()=>verifyM265(l,identity({runAttempt:2,exitCode:1}),{http404:true}),/Only first/);
});
test('multiple actual JSEP 404s must match exactly recorded original interception count',()=>{
 const r=redirect('jsep-wasm',404,false);
 const l=originalLog({jseps:[r,r],models:[],success:false,failure:true,injection:true});
 const v=verifyM265(l,identity({exitCode:1}),{http404:true});
 assert.equal(v.jsepHardHttpErrors,2);
 const wrong=l.replace('"intercepted":2','"intercepted":1');
 assert.throws(()=>verifyM265(wrong,identity({exitCode:1}),{http404:true}),/verified real Worker RED/);
});
test('controlled 404 must not hide post-error owner save, missing failure, or synthetic injection',()=>{
 const opts={jseps:[redirect('jsep-wasm',404,false)],models:[],
  success:false,failure:true,injection:true};
 const l=originalLog(opts),id=identity({exitCode:1});
 for(const mark of [
  'P91_FULL_JOURNEY_PASS {}',
  'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS {}',
  'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY {}'
 ])assert.throws(()=>verifyM265(l+'\n'+mark,id,{http404:true}),/owner success/i);
 assert.throws(()=>verifyM265(l.replace('M58_REAL_P88_WORKER_FAIL','NOT_REAL_WORKER'),id,{http404:true}));
 assert.throws(()=>verifyM265(l.replace('M265_ORIGINAL_JSEP_HTTP404_FAULT','M265_FAKE'),id,{http404:true}),/Missing\/duplicate/);
});
test('rejects forged native attestation and does not leak private-looking raw log extras',()=>{
 const raw=originalLog({extra:'SECRET_ACCOUNT_TOKEN_SHOULD_NEVER_RETURN'});
 const v=assessM265(raw,identity());
 assert.doesNotMatch(JSON.stringify(v),/SECRET_ACCOUNT_TOKEN/);
 assert.equal(v.familyAlpha,'HOLD');
 assert.throws(()=>assessM265(originalLog({net:{loadedModelAttested:true}}),identity()),/Untrusted original JSEP/);
});
