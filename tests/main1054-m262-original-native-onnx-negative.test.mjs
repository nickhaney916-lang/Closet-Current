import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveM262,verifyM262Failure,badOnnxBody,badOnnxSHA}
 from '../research/main1054/m262-controlled-native-onnx-fault.mjs';

const id=(changes={})=>({
 checkout:'a'.repeat(40),engine:'webkit',width:390,runId:'44551443095',
 runAttempt:1,exitCode:1,job:'original-negative',
 lockedJpegSha:'b'.repeat(64),...changes
});
const fault=(changes={})=>'M262_CONTROLLED_ONNX_FAULT '+JSON.stringify({
 schema:'M262_CONTROLLED_ONNX_V1',engine:'webkit',width:390,
 interceptedModelRequests:1,faultType:'invalid-onnx-graph',
 originalP94SourceUnmodified:true,originalWorkerUnmodified:true,
 naturalWebKitAllocatorFailure:false,releaseAuthorized:false,
 familyAlpha:'HOLD',...changes
});
const model=(status='body-observed')=>({kind:'model-onnx',status,
 ...(status==='body-observed'?{
  sha256:badOnnxSHA,size:Buffer.byteLength(badOnnxBody)
 }:{})});
const witness=(rows=[model()],changes={})=>'M259_CONTEXT_NETWORK_WITNESS '+JSON.stringify({
 schema:'M259_CONTEXT_NETWORK_V1',engine:'webkit',width:390,rows,
 wasmNetworkMatch:false,modelNetworkObserved:rows.some(r=>r.kind==='model-onnx'&&r.status==='body-observed'),
 compiledWasmAttested:false,loadedModelAttested:false,sameNativeProcessProven:false,
 sourceEvidenceGate:'BLOCKED',familyAlpha:'HOLD',...changes
});
const red='M58_REAL_P88_WORKER_FAIL {"stage":"true-original-model-init","error":"invalid-model-fixture"}';
const log=(tail='',f={},rows=[model()],network={})=>
 [red,fault(f),witness(rows,network),tail].filter(Boolean).join('\n');
test('pinned unmodified original P94 generates only disposable model response override',()=>{
 const original=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
 const derived=deriveM262(original);
 assert.match(derived,/M262_CONTROLLED_ONNX_FAULT/);
 assert.match(derived,/M262_INVALID_ONNX_GRAPH_RESEARCH_ONLY/);
 assert.match(derived,/Xenova\/segformer_b0_clothes/);
 assert.match(derived,/M58_REAL_P88_WORKER_FAIL/);
 assert.match(derived,/ort-wasm-simd-threaded/);
 assert.doesNotMatch(original,/M262_CONTROLLED_ONNX_FAULT/);
});
test('source drift refuses generating browser with modified owner model runner',()=>{
 const original=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
 assert.throws(()=>deriveM262(original+'\n// unreviewed change'),/SHA drifted/);
});
test('valid synthetic-shaped induced model RED remains RED and HOLD',()=>{
 const result=verifyM262Failure(log(),1,id());
 assert.equal(result.interceptedOriginalModelRequests,1);
 assert.equal(result.invalidModelSHAObserved,1);
 assert.equal(result.originalJourneyGate,'FAIL');
 assert.equal(result.sourceEvidenceGate,'FAIL');
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.nativeRuntimeRepairProven,false);
});
test('original successful child exit cannot be promoted as model-corruption evidence',()=>{
 assert.throws(()=>verifyM262Failure(log(),0,id({exitCode:0})),/did not fail/);
});
test('failure marker absent or duplicate intervention evidence refuses admission',()=>{
 assert.throws(()=>verifyM262Failure(fault()+'\n'+witness(),1,id()),/did not fail/);
 assert.throws(()=>verifyM262Failure(log()+'\n'+fault(),1,id()),/duplicate/);
 assert.throws(()=>verifyM262Failure(log()+'\n'+witness(),1,id()),/duplicate/);
});
test('must actually intercept one or more original ONNX GETs',()=>{
 assert.throws(()=>verifyM262Failure(log('',{interceptedModelRequests:0}),1,id()),/interception/);
 assert.throws(()=>verifyM262Failure(log('',{interceptedModelRequests:9}),1,id()),/interception/);
});
test('two fulfilled original model requests must both be accounted for',()=>{
 const result=verifyM262Failure(log('',{interceptedModelRequests:2},[model(),model()]),1,id());
 assert.equal(result.interceptedOriginalModelRequests,2);
 assert.equal(result.invalidModelSHAObserved,2);
});
test('unreadable Chromium-like body is UNKNOWN, at least one SHA attested',()=>{
 const receipt=verifyM262Failure(
  log('',{interceptedModelRequests:2},[model(),model('body-unavailable')]),1,id());
 assert.equal(receipt.invalidModelSHAObserved,1);
 assert.equal(receipt.modelResponseBodyUnavailable,1);
 assert.throws(()=>verifyM262Failure(
  log('',{interceptedModelRequests:2},
   [model('body-unavailable'),model('body-unavailable')]),1,id()),/absent\/mismatched/);
});
test('wrong model hash, size, response type, or unmatched response is blocked',()=>{
 for(const changed of [
  {...model(),sha256:'f'.repeat(64)},
  {...model(),size:17},model('non-200'),
  {...model(),kind:'jsep-wasm'}
 ])assert.throws(()=>verifyM262Failure(log('',{},[changed]),1,id()),/absent\/mismatched/);
 assert.throws(()=>verifyM262Failure(
  log('',{},[model(),model()]),1,id()),/absent\/mismatched/);
});
test('different corrupted JSEP is outside the isolated ONNX test scope',()=>{
 assert.throws(()=>verifyM262Failure(log('',{},[
  model(),{kind:'jsep-wasm',status:'invalid-wasm-magic',sha256:'a'.repeat(64),size:45}
 ]),1,id()),/JSEP corruption/);
});
test('owner approval, private save, v4 restore and successful P91 are never compatible with negative model result',()=>{
 for(const marker of [
  'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS {}',
  'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY {}',
  'P91_FULL_JOURNEY_PASS {}'
 ])assert.throws(()=>verifyM262Failure(log(marker),1,id()),/Unexpected private/);
});
test('rejects browser, viewport, attempt, run identity, source and release forgeries',()=>{
 assert.throws(()=>verifyM262Failure(log(),1,id({engine:'chromium'})),/interception/);
 assert.throws(()=>verifyM262Failure(log(),1,id({width:430})),/interception/);
 assert.throws(()=>verifyM262Failure(log(),1,id({runAttempt:2})),/first-attempt/);
 assert.throws(()=>verifyM262Failure(log(),1,id({checkout:'bad'})),/first-attempt/);
 for(const changed of [
  {releaseAuthorized:true},{familyAlpha:'GO'},{naturalWebKitAllocatorFailure:true},
  {originalWorkerUnmodified:false},{originalP94SourceUnmodified:false},
  {faultType:'natural-webkit-failure'}
 ])assert.throws(()=>verifyM262Failure(log('',changed),1,id()),/interception/);
});
test('untrusted binary network receipt or forbidden native compile claims block negative inference',()=>{
 for(const changed of [
  {sameNativeProcessProven:true},{loadedModelAttested:true},
  {compiledWasmAttested:true},{sourceEvidenceGate:'PASS'}
 ])assert.throws(()=>verifyM262Failure(log('',{},[model()],changed),1,id()),/Untrusted/);
});
test('reject malformed and oversized transcript while sanitizing any private-looking extra text',()=>{
 assert.throws(()=>verifyM262Failure('X'.repeat(8*1024*1024+1),1,id()),/first-attempt/);
 assert.throws(()=>verifyM262Failure(red+'\nM262_CONTROLLED_ONNX_FAULT {BAD}',1,id()),/Malformed/);
 const receipt=verifyM262Failure(log('PRIVATE_TOKEN=SECRET'),1,id());
 assert.doesNotMatch(JSON.stringify(receipt),/SECRET/);
});
