import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {bindM260OriginalAttempt} from '../research/main1054/m260-bind-original-network-evidence.mjs';
import {
 assessM262,verifyM262,deriveM262,EXPECTED_ONNX_SHA256,
 EXPECTED_ONNX_BYTES,CORRUPT_ONNX_SHA256,CORRUPT_ONNX_BYTES
} from '../research/main1054/m262-original-onnx-byte-identity.mjs';

const sha='1'.repeat(64),originalJsep='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const receipt=(name,data)=>name+' '+JSON.stringify(data);
const identity=(x={})=>({
 checkout:'a'.repeat(40),engine:'webkit',width:390,runId:'44551443095',
 job:'m262-browser',runAttempt:1,exitCode:0,lockedJpegSha:sha,...x
});
function rawLog({engine='webkit',modelSha=EXPECTED_ONNX_SHA256,modelBytes=EXPECTED_ONNX_BYTES,
    unreadable=false,non200=false,includeSuccess=true,fail=false,inject=false,extra=''}={}){
 const rows=[
  {kind:'jsep-wasm',status:'body-observed',sha256:originalJsep,size:21596019},
  ...(non200?[{kind:'model-onnx',status:'non-200'}]:[]),
  unreadable?{kind:'model-onnx',status:'body-unavailable'}:
   {kind:'model-onnx',status:'body-observed',sha256:modelSha,size:modelBytes}
 ];
 const lines=[];
 if(includeSuccess)lines.push(
  receipt('M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW',{engine,sourceSHA256:sha,realWorker:true,modelRequests:9,saved:0,hold:true}),
  receipt('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',{
   engine,modelExecuted:true,manualSyntheticOwnerConfirmed:true,ownerPrivateSaved:1,
   exactOriginalSHA256:sha,realNativeOutfit:true,savedOutfitOwnerAction:true,
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
 if(fail)lines.push('M58_REAL_P88_WORKER_FAIL {"stage":"original-onnx-model-load"}');
 if(inject)lines.push(receipt('M262_ONNX_INJECTION_OBSERVED',{
  schema:'M262_ONNX_NETWORK_FAULT_V1',engine,width:390,intercepted:1,
  originalRunnerUnmodified:true,releaseAuthorized:false,familyAlpha:'HOLD'
 }));
 lines.push(receipt('M259_CONTEXT_NETWORK_WITNESS',{
  schema:'M259_CONTEXT_NETWORK_V1',engine,width:390,rows,
  wasmNetworkMatch:true,modelNetworkObserved:!unreadable,
  compiledWasmAttested:false,loadedModelAttested:false,
  sameNativeProcessProven:false,sourceEvidenceGate:'BLOCKED',familyAlpha:'HOLD'
 }));
 if(extra)lines.push(extra);
 return lines.join('\n');
}

test('the unchanged original P94 source produces a derived positive/negative runner only',()=>{
 const original=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
 const good=deriveM262(original);
 const negative=deriveM262(original,{corrupt:true});
 assert.match(good,/M259_CONTEXT_NETWORK_WITNESS/);
 assert.doesNotMatch(good,/M262_ONNX_INJECTION_OBSERVED/);
 assert.match(negative,/M262_ONNX_INJECTION_OBSERVED/);
 assert.match(negative,/segformer_b0_clothes/);
 assert.match(negative,/M262_INTENTIONALLY_INVALID_ONNX_WEIGHTS/);
 const temp=mkdtempSync(join(tmpdir(),'m262-derived-check-'));
 try{
  const path=join(temp,'original-derived.mjs');
  writeFileSync(path,negative);
  const result=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
  assert.equal(result.status,0,'Derived real browser script must compile: '+result.stderr);
 }finally{rmSync(temp,{recursive:true,force:true});}
 assert.doesNotMatch(original,/M262_ONNX_INJECTION_OBSERVED/);
 assert.throws(()=>deriveM262(original+'//changed'),/Original P94 source changed/);
});

test('genuine original expected model digest is OBSERVED, but NEVER native or release attested',()=>{
 const r=assessM262(rawLog(),identity());
 assert.equal(r.originalJourneyGate,'PASS');
 assert.equal(r.originalModelNetworkGate,'OBSERVED');
 assert.equal(r.originalModelBytesCorrectlyHashed,1);
 assert.equal(r.nativeLoadedOnnxSHA256,null);
 assert.equal(r.nativeModelProcessIdentityVerified,false);
 assert.equal(r.sourceEvidenceGate,'BLOCKED');
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.familyAlpha,'HOLD');
});

test('reproduce pre-M262 missing original ONNX byte check; wrong SHA gets FAIL with M262',()=>{
 const malformed=rawLog({modelSha:'e'.repeat(64)});
 const old=bindM260OriginalAttempt(malformed,identity());
 assert.equal(old.networkObservationGate,'OBSERVED');
 assert.equal(old.originalJourneyGate,'PASS');
 assert.equal(old.onnxNetworkObserved,true);
 const now=assessM262(malformed,identity());
 assert.equal(now.originalModelNetworkGate,'FAIL');
 assert.equal(now.originalJourneyGate,'FAIL');
 assert.equal(now.sourceEvidenceGate,'FAIL');
 assert.equal(now.changedOrInvalidModelBodies,1);
 assert.equal(now.releaseAuthorized,false);
});

test('expected SHA with incorrect model byte count is a source failure',()=>{
 const r=assessM262(rawLog({modelBytes:EXPECTED_ONNX_BYTES-1}),identity());
 assert.equal(r.originalModelNetworkGate,'FAIL');
 assert.equal(r.sourceEvidenceGate,'FAIL');
});

test('unreadable Chromium browser body is PARTIAL, not fabricated model SHA',()=>{
 const r=assessM262(rawLog({engine:'chromium',unreadable:true}),
  identity({engine:'chromium'}));
 assert.equal(r.originalJourneyGate,'PASS');
 assert.equal(r.originalModelNetworkGate,'PARTIAL');
 assert.equal(r.originalOnnxNetworkObserved,false);
 assert.equal(r.originalModelBytesUnreadable,1);
 assert.equal(r.sourceEvidenceGate,'BLOCKED');
 assert.equal(r.nativeLoadedOnnxSHA256,null);
});

test('model redirect metadata does not replace the independently decoded original model',()=>{
 const r=assessM262(rawLog({non200:true}),identity());
 assert.equal(r.originalModelNetworkGate,'OBSERVED');
 assert.equal(r.redirectedOrNon200ModelResponses,1);
});

test('positive genuine WebKit acceptance requires original full ONNX SHA, unlike partial Chromium',()=>{
 assert.equal(verifyM262(rawLog(),identity()).originalModelNetworkGate,'OBSERVED');
 assert.throws(()=>verifyM262(rawLog({unreadable:true}),identity()),/acceptance incomplete/);
 assert.equal(verifyM262(rawLog({engine:'chromium',unreadable:true}),
  identity({engine:'chromium'})).originalModelNetworkGate,'PARTIAL');
 assert.throws(()=>verifyM262(rawLog({modelSha:'0'.repeat(64)}),identity()),/acceptance incomplete/);
});

test('a model-byte mismatch cannot be laundered by positive owner-private completion',()=>{
 const caseLog=rawLog({modelSha:CORRUPT_ONNX_SHA256,modelBytes:CORRUPT_ONNX_BYTES.length});
 const r=assessM262(caseLog,identity());
 assert.equal(r.originalJourneyGate,'FAIL');
 assert.equal(r.originalModelNetworkGate,'FAIL');
 assert.equal(r.sourceEvidenceGate,'FAIL');
});

test('controlled original browser ONNX failure accepts only first-attempt actual RED with hashed corrupt bytes',()=>{
 const red=rawLog({modelSha:CORRUPT_ONNX_SHA256,
  modelBytes:CORRUPT_ONNX_BYTES.length,includeSuccess:false,fail:true,inject:true});
 const r=verifyM262(red,identity({exitCode:1}),{corrupt:true});
 assert.equal(r.originalModelNetworkGate,'FAIL');
 assert.equal(r.originalJourneyGate,'FAIL');
 assert.equal(r.controlledCorruptOnnxResponse,true);
 assert.equal(r.releaseAuthorized,false);
 assert.throws(()=>verifyM262(red,identity({exitCode:0}),{corrupt:true}),/did not preserve RED/);
 assert.throws(()=>verifyM262(red.replace('M58_REAL_P88_WORKER_FAIL','NOT_A_WORKER_FAIL'),
  identity({exitCode:1}),{corrupt:true}),/original model failure/);
 assert.throws(()=>verifyM262(red,identity({runAttempt:2,exitCode:1}),{corrupt:true}),/Non-first attempt/);
});

test('a controlled failure never excuses private owner-save success or missing original ONNX observation',()=>{
 const opts={modelSha:CORRUPT_ONNX_SHA256,
  modelBytes:CORRUPT_ONNX_BYTES.length,fail:true,inject:true};
 assert.throws(()=>verifyM262(rawLog(opts),identity({exitCode:1}),{corrupt:true}),
  /Unexpected post-corruption owner success/);
 assert.throws(()=>verifyM262(rawLog({...opts,includeSuccess:false,modelSha:'f'.repeat(64)}),
  identity({exitCode:1}),{corrupt:true}),/No SHA-attested/);
 assert.throws(()=>verifyM262(rawLog({...opts,includeSuccess:false}).replace('M262_ONNX_INJECTION_OBSERVED','M262_NOT_INJECTED'),
  identity({exitCode:1}),{corrupt:true}),/Missing or duplicate/);
});

test('duplicates, forged native certainty, wrong engine and malformed log are rejected',()=>{
 const real=rawLog();
 assert.throws(()=>assessM262(real+'\n'+real.split('\n').at(-1),identity()),/duplicate/);
 assert.throws(()=>assessM262(real.replace('"loadedModelAttested":false','"loadedModelAttested":true'),identity()),/native identity/);
 assert.throws(()=>assessM262(real,identity({engine:'chromium'})),/source|original|witness|changed/i);
 assert.throws(()=>assessM262('x'.repeat(8*1024*1024+1),identity()));
});

test('no raw secrets or model bytes can leak into the bounded receipt',()=>{
 const r=assessM262(rawLog({extra:'PASSWORD_PRIVATE_ACCOUNT_PAYLOAD'}),identity());
 assert.doesNotMatch(JSON.stringify(r),/PASSWORD_PRIVATE_ACCOUNT_PAYLOAD/);
 assert.equal(r.familyAlpha,'HOLD');
});
