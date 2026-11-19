import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {deriveM264,assessM264,verifyM264} from '../research/main1054/m264-model-http-redirect-truth.mjs';
import {EXPECTED_ONNX_SHA256,EXPECTED_ONNX_BYTES} from '../research/main1054/m262-original-onnx-byte-identity.mjs';

const source='b'.repeat(64);
const jsep='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const validModel={kind:'model-onnx',status:'body-observed',sha256:EXPECTED_ONNX_SHA256,size:EXPECTED_ONNX_BYTES};
const redirect=(httpStatus=307,hasLocation=true)=>({kind:'model-onnx',status:'non-200',httpStatus,hasLocation});
const bad=(httpStatus=404,hasLocation=false)=>redirect(httpStatus,hasLocation);
const receipt=(label,data)=>label+' '+JSON.stringify(data);
const identity=(x={})=>({
 checkout:'a'.repeat(40),engine:'webkit',width:390,runId:'44569367836',runAttempt:1,
 exitCode:0,job:'research-positive',lockedJpegSha:source,...x
});
function output({engine='webkit',modelRows=[redirect(),validModel],success=true,fail=false,
 inject=false,extra='',changeWitness={}}={}){
 const rows=[
  {kind:'jsep-wasm',status:'body-observed',sha256:jsep,size:21596019},
  ...modelRows
 ];
 const lines=[];
 if(success)lines.push(
  receipt('M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW',{
   engine,sourceSHA256:source,realWorker:true,modelRequests:8,saved:0,hold:true
  }),
  receipt('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',{
   engine,modelExecuted:true,manualSyntheticOwnerConfirmed:true,ownerPrivateSaved:1,
   exactOriginalSHA256:source,realNativeOutfit:true,savedOutfitOwnerAction:true,
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
 if(fail)lines.push('M58_REAL_P88_WORKER_FAIL {"stage":"model-session","reason":"P94_model_load"}');
 if(inject)lines.push(receipt('M264_CONTROLLED_MODEL_HTTP_404',{
  schema:'M264_CONTROLLED_HTTP_V1',engine,width:390,intercepted:1,
  originalRunnerUnmodified:true,releaseAuthorized:false,familyAlpha:'HOLD'
 }));
 lines.push(receipt('M259_CONTEXT_NETWORK_WITNESS',{
  schema:'M259_CONTEXT_NETWORK_V1',engine,width:390,rows,
  wasmNetworkMatch:true,
  modelNetworkObserved:modelRows.some(r=>r.status==='body-observed'),
  compiledWasmAttested:false,loadedModelAttested:false,sameNativeProcessProven:false,
  sourceEvidenceGate:'BLOCKED',familyAlpha:'HOLD',...changeWitness
 }));
 if(extra)lines.push(extra);
 return lines.join('\n');
}
test('frozen original browser derives only source-guarded disposable HTTP instrument',()=>{
 const sourceText=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
 const yes=deriveM264(sourceText);
 const no=deriveM264(sourceText,{fault404:true});
 assert.match(yes,/httpStatus=res.status\(\)/);
 assert.match(yes,/res.headers\(\)\['location'\]/);
 assert.doesNotMatch(yes,/M264_CONTROLLED_MODEL_HTTP_404/);
 assert.match(no,/M264_CONTROLLED_MODEL_HTTP_404/);
 assert.match(no,/M264_MODEL_HTTP_404_TEST_ONLY/);
 assert.doesNotMatch(sourceText,/M264_CONTROLLED_MODEL_HTTP_404/);
 assert.throws(()=>deriveM264(sourceText+'//drift'),/source SHA mismatch/);
 const temp=mkdtempSync(join(tmpdir(),'m264-syntax-'));
 try{
  for(const [name,content] of [['healthy',yes],['invalid',no]]){
   const path=join(temp,name+'.mjs');writeFileSync(path,content);
   const result=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
   assert.equal(result.status,0,name+': '+result.stderr);
  }
 }finally{rmSync(temp,{recursive:true,force:true});}
});
test('realistic 307 then correct canonical 200 is source PARTIAL not an HTTP error',()=>{
 const log=output();
 const receipt=verifyM264(log,identity());
 assert.equal(receipt.originalJourneyGate,'PASS');
 assert.equal(receipt.originalModelNetworkGate,'PARTIAL');
 assert.equal(receipt.originalModelRedirects,1);
 assert.equal(receipt.originalModelHttpErrors,0);
 assert.equal(receipt.originalModelHttpGate,'REDIRECT_PLUS_BODY');
 assert.equal(receipt.originalModelBytesCorrectlyHashed,1);
 assert.equal(receipt.sourceEvidenceGate,'BLOCKED');
 assert.equal(receipt.nativeLoadedOnnxSHA256,null);
 assert.equal(receipt.releaseAuthorized,false);
});
test('normal direct model 200 is accepted without inventing native identity',()=>{
 const receipt=verifyM264(output({modelRows:[validModel]}),identity());
 assert.equal(receipt.originalModelHttpGate,'NO_REDIRECT');
 assert.equal(receipt.originalModelNetworkGate,'OBSERVED');
 assert.equal(receipt.nativeModelProcessIdentityVerified,false);
});
test('good SHA plus hard HTTP 404/403/500 never launders a model error into acceptance',()=>{
 for(const status of [403,404,429,500,503]){
  const l=output({modelRows:[bad(status),validModel]});
  const r=assessM264(l,identity());
  assert.equal(r.originalModelHttpGate,'FAIL');
  assert.equal(r.sourceEvidenceGate,'FAIL');
  assert.equal(r.originalModelNetworkGate,'FAIL');
  assert.throws(()=>verifyM264(l,identity()),/model HTTP failure/i);
 }
});
test('redirect requires explicit 3xx status and location presence; success path refuses unknown',()=>{
 for(const err of [redirect(307,false),redirect(302,false),redirect(404,true)]){
  const l=output({modelRows:[err,validModel]});
  assert.equal(assessM264(l,identity()).originalModelHttpGate,'FAIL');
  assert.throws(()=>verifyM264(l,identity()));
 }
 for(const err of [{kind:'model-onnx',status:'non-200'},
   {kind:'model-onnx',status:'non-200',httpStatus:999,hasLocation:true},
   {kind:'model-onnx',status:'non-200',httpStatus:'307',hasLocation:true}]){
  assert.throws(()=>assessM264(output({modelRows:[err,validModel]}),identity()),
   /Unattested original model non-200 status/);
 }
});
test('unreadable Chromium model is PARTIAL, preserving source-not-native uncertainty',()=>{
 const l=output({engine:'chromium',modelRows:[
  redirect(),{kind:'model-onnx',status:'body-unavailable'}]});
 const r=verifyM264(l,identity({engine:'chromium'}));
 assert.equal(r.originalJourneyGate,'PASS');
 assert.equal(r.originalModelNetworkGate,'PARTIAL');
 assert.equal(r.originalModelHttpGate,'PARTIAL');
 assert.equal(r.originalModelBytesUnreadable,1);
 assert.equal(r.sourceEvidenceGate,'BLOCKED');
});
test('unreadable WebKit body cannot replace canonical ONNX digest',()=>{
 const l=output({modelRows:[redirect(),{kind:'model-onnx',status:'body-unavailable'}]});
 assert.throws(()=>verifyM264(l,identity()),/acceptance incomplete/);
});
test('model hash mismatch is hard FAIL even after a benign redirect',()=>{
 const l=output({modelRows:[redirect(),{...validModel,sha256:'f'.repeat(64)}]});
 const r=assessM264(l,identity());
 assert.equal(r.originalModelNetworkGate,'FAIL');
 assert.equal(r.sourceEvidenceGate,'FAIL');
 assert.throws(()=>verifyM264(l,identity()),/acceptance incomplete/);
});
test('controlled original 404 must be a genuine failed original model Worker attempt',()=>{
 const l=output({modelRows:[bad()],success:false,fail:true,inject:true});
 const r=verifyM264(l,identity({exitCode:1}),{fault404:true});
 assert.equal(r.originalJourneyGate,'FAIL');
 assert.equal(r.originalModelHttpGate,'FAIL');
 assert.equal(r.sourceEvidenceGate,'FAIL');
 assert.equal(r.controlledModelHttp404,true);
 assert.equal(r.releaseAuthorized,false);
 assert.throws(()=>verifyM264(l,identity({exitCode:0}),{fault404:true}),/Worker RED/);
 assert.throws(()=>verifyM264(l,identity({runAttempt:2,exitCode:1}),{fault404:true}),/First-attempt/);
});
test('404 control disallows fake private success, source marker, and forged 3xx',()=>{
 const l=output({modelRows:[bad()],success:false,fail:true,inject:true});
 assert.throws(()=>verifyM264(l.replace('M58_REAL_P88_WORKER_FAIL','M58_WRONG_FAILURE'),
  identity({exitCode:1}),{fault404:true}),/Worker RED|failure terminal/);
 assert.throws(()=>verifyM264(l+'\nP91_FULL_JOURNEY_PASS {}',
  identity({exitCode:1}),{fault404:true}),/Private owner success/);
 assert.throws(()=>verifyM264(l.replace('"httpStatus":404','"httpStatus":307'),
  identity({exitCode:1}),{fault404:true}),/HTTP 404 did not preserve/);
 assert.throws(()=>verifyM264(l.replace('"intercepted":1','"intercepted":2'),
  identity({exitCode:1}),{fault404:true}),/interception unverified/);
});
test('bounded witness resists duplicate rows, forged native proof and secret leakage',()=>{
 const l=output({extra:'PRIVATE_PASSWORD_DO_NOT_REPORT'});
 assert.equal(JSON.stringify(assessM264(l,identity())).includes('PRIVATE_PASSWORD'),false);
 assert.throws(()=>assessM264(l+'\n'+l.split('\n').at(-2),identity()),/duplicate/);
 assert.throws(()=>assessM264(output({changeWitness:{loadedModelAttested:true}}),identity()),
  /native identity/);
});
