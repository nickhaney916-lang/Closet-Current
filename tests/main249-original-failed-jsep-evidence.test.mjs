import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {addM249OriginalErrorWitness,summarizeM249Failure,ORIGINAL_JSEP_SHA249,ORIGINAL_JSEP_NAME249}
 from '../scripts/main249-original-failed-jsep-source-witness.mjs';
const publicWasm=()=>({kind:'onnx-wasm',name:ORIGINAL_JSEP_NAME249,status:200,available:true,
 sha256:ORIGINAL_JSEP_SHA249,bytes:21596019});
const args=()=>({engine:'webkit',control:'none',assets:[publicWasm()],
 errors:[{phase:'m249_model_failure',outcome:'error',errorName:'RuntimeError',category:'wasm_memory_access'}],
 heap:[{phase:'m247_jsep_memory',outcome:'error',growCalls:5,growErrors:0,firstPages:256,terminalPages:767}]});
test('M249 SAME failed original-browser response only: direct JSEP sha not sibling fingerprint',()=>{
 const r=summarizeM249Failure(args());
 assert.equal(r.directOriginalJsepBrowserBodySHAProven,true);
 assert.equal(r.actualPublicRuntimeIdentity,'DIRECT_SAME_ATTEMPT_JSEP_SHA');
 assert.equal(r.originalHeapTerminalSeen,true);
 assert.equal(r.observedGrowCalls,5);
 assert.equal(r.modelExceptionCategory,'wasm_memory_access');
 assert.equal(r.nativeCppAllocatorCauseProven,false);
 assert.equal(r.realRedToGreenFixProven,false);
 assert.equal(r.originalTestFailedNonzero,true);
 assert.equal(r.familyAlphaHold,true);
});
test('M249 unreadable/missing/duplicate/mismatched or non-JSEP SAME red browser refuses native identity',()=>{
 for(const modify of [
  x=>{x.assets=[];},
  x=>{x.assets.push(publicWasm());},
  x=>{x.assets[0].available=false;x.assets[0].sha256=null;},
  x=>{x.assets[0].sha256='0'.repeat(64);},
  x=>{x.assets[0].name='ort-wasm-simd-threaded.wasm';},
  x=>{x.assets[0].status=404;},
  x=>{x.assets[0].bytes=120000;}
 ]){
  const x=args();modify(x);const r=summarizeM249Failure(x);
  assert.equal(r.directOriginalJsepBrowserBodySHAProven,false);
  assert.notEqual(r.actualPublicRuntimeIdentity,'DIRECT_SAME_ATTEMPT_JSEP_SHA');
  assert.equal(r.realRedToGreenFixProven,false);
 }
});
test('M249 unknown model exception is not invented as memory access or allocator root cause',()=>{
 for(const modify of [
  x=>{x.errors=[];},x=>{x.errors.push(x.errors[0]);},
  x=>{x.errors[0].errorName='PrivateUserName';},
  x=>{x.errors[0].category='memory_access_secret';}
 ]){
  const x=args();modify(x);const r=summarizeM249Failure(x);
  assert.equal(r.modelExceptionCategory,'UNKNOWN');
  assert.equal(r.exactOneObservedException,false);
  assert.equal(r.nativeMemoryAccessRootCauseProven,false);
 }
});
test('M249 controlled original ONNX abort never becomes a naturally observed memory error',()=>{
 const x=args();x.control='model_abort';x.errors=[];
 const r=summarizeM249Failure(x);
 assert.equal(r.controlledPublicOnnxAbort,true);
 assert.equal(r.controlledAbortIsNaturalModelFailure,false);
 assert.equal(r.modelExceptionCategory,'UNKNOWN');
 assert.equal(r.releaseAuthorized,false);
});
test('M249 original-worker error observer keeps throw and model/native source unchanged',async()=>{
 const worker=await readFile('public/outfit-worker-p94.mjs','utf8');
 const {deriveOriginalP94JsepObserver}=await import('../scripts/main247-original-worker-jsep-heap-observer.mjs');
 const original=deriveOriginalP94JsepObserver(worker);
 const output=addM249OriginalErrorWitness(original);
 assert.ok(output.includes("m249ClassifyOriginal(error);m247Emit(requestId,'error');loader=null;throw error"));
 assert.ok(output.includes("device:'wasm',dtype:'fp32'"));
 assert.ok(output.includes("phase:'m249_model_failure'"));
 assert.ok(!output.includes("self.postMessage({type:'diagnostic',phase:'m249_model_failure',message"));
 assert.equal(original.includes('m249ClassifyOriginal'),false);
 assert.ok(output.includes("self.postMessage({type:'piece'"));
});
test('M249 original browser source-locked negative and model-positive assertions survive disposable construction',()=>{
 const run=spawnSync(process.execPath,['scripts/test-main249-original-failed-jsep-browser.mjs'],{
  env:{...process.env,M249_SOURCE_ONLY:'1',M249_ENGINE:'webkit',M249_WIDTH:'390',M249_CONTROL:'none'},
  encoding:'utf8',timeout:30000});
 assert.equal(run.status,0,'M249 source derivation invalid: '+String(run.stderr||'').slice(0,650));
 assert.ok(run.stdout.includes('M249_ORIGINAL_SOURCE_LOCKED'));
 assert.ok(!run.stdout.includes('M249_GENUINE_SOURCE_OWNER_PASS'));
 assert.ok(!run.stdout.includes('M249_ORIGINAL_FAILED_ATTEMPT_JSEP_EVIDENCE'));
});
test('M249 source audit refuses mock engines, unpinned sizes and unsanctioned fault injection',()=>{
 for(const extra of [
  {M249_ENGINE:'mockwebkit'},{M249_WIDTH:'768'},{M249_CONTROL:'memory_success_fake'}
 ]){
  const run=spawnSync(process.execPath,['scripts/test-main249-original-failed-jsep-browser.mjs'],{
   env:{...process.env,M249_SOURCE_ONLY:'1',M249_ENGINE:'webkit',M249_WIDTH:'390',M249_CONTROL:'none',...extra},
   encoding:'utf8',timeout:30000});
  assert.notEqual(run.status,0);
  assert.ok(!run.stdout.includes('M249_GENUINE_SOURCE_OWNER_PASS'));
 }
});
