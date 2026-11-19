import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {attestLocalWasmServed,acceptRealOriginalNativeGraphAsset,
 ORIGINAL_WORKER_JSEP,OTHER_PINNED_ORT,ORIGINAL_GRAPH_SHA,ORIGINAL_GRAPH_REVISION}
 from '../scripts/main246-original-graph-loaded-wasm-asset.mjs';

const session=()=>({
 engine:'webkit',arm:'baseline',modelRevision:ORIGINAL_GRAPH_REVISION,
 originalGraphSha256:ORIGINAL_GRAPH_SHA,originalPublicGraph:true,
 success:true,stage:'model_session_complete',originalOwnerPhotoJourneyNotRun:true,
 apiCalls:[{actualCall:true,memPatternFlag:true,handleReturned:true}],
 nativeCalls:[{actualNativeExportCalled:true,returnedHandle:true}],
 grownMemoryTargetCount:1,jsGrowCalls:5,finalHeapPages:756
});
const loaded=(which=OTHER_PINNED_ORT)=>({...which,realLocalHttpResponse:true});
const run=(assets=[loaded()],s=session(),engine='webkit',arm='baseline')=>
 acceptRealOriginalNativeGraphAsset({assets,session:s,engine,arm});

test('M246 strictly distinguishes original P94 JSEP vs separately native original graph binary',()=>{
 const result=run();
 assert.equal(result.sameAsOriginalWorkerJsepBinary,false);
 assert.equal(result.actualLoadedName,OTHER_PINNED_ORT.name);
 assert.equal(result.actualLoadedSha256,OTHER_PINNED_ORT.sha256);
 assert.equal(result.modelSessionNativeExportObserved,true);
 assert.equal(result.originalPhotoPrivateOwnerNotRead,true);
 assert.equal(result.realWebkitRedBeforeGreenAfter,false);
 assert.equal(result.releaseAuthorized,false);
});
test('M246 if actual graph used original JSEP, report it without false CPU-only assumption',()=>{
 const receipt=run([loaded(ORIGINAL_WORKER_JSEP)]);
 assert.equal(receipt.sameAsOriginalWorkerJsepBinary,true);
 assert.equal(receipt.distinctWasmMemoryAllocatorBehaviorNotProven,true);
 assert.equal(receipt.realCPlusPlusAllocatorStateObserved,false);
});
test('M246 refuses fake or duplicated WASM fetched names and hashes',()=>{
 assert.throws(()=>attestLocalWasmServed('random.bin',new Uint8Array(10)),/unexpected local WASM variant/);
 assert.throws(()=>attestLocalWasmServed(OTHER_PINNED_ORT.name,new Uint8Array(100)),/differs from exact pinned/);
 assert.throws(()=>run([]),/exactly one real WASM binary/);
 assert.throws(()=>run([loaded(),loaded()]),/exactly one real WASM binary/);
 assert.throws(()=>run([{...loaded(),sha256:'f'.repeat(64)}]),/does not match pinned/);
 assert.throws(()=>run([{...loaded(),realLocalHttpResponse:false}]),/false !== true/);
});
test('M246 fails genuine original model errors and missing native export even when HTTP WASM hash is valid',()=>{
 const bad=session();bad.success=false;
 assert.throws(()=>run([loaded()],bad),/Genuine original graph session RED/);
 const fake=session();fake.nativeCalls=[];
 assert.throws(()=>run([loaded()],fake),/0 !== 1/);
 const noNative=session();noNative.apiCalls[0].actualCall=false;
 assert.throws(()=>run([loaded()],noNative),/false !== true/);
 const switched=session();switched.apiCalls[0].memPatternFlag=false;
 assert.throws(()=>run([loaded()],switched),/false !== true/);
});
test('M246 does not fabricate arm or browser identity',()=>{
 const s=session();s.engine='chromium';
 assert.throws(()=>run([loaded()],s,'webkit'),/chromium.*webkit|Expected values/);
 assert.throws(()=>run([loaded()],session(),'webkit','pattern_off'),/baseline.*pattern_off|Expected values/);
 const off=session();off.arm='pattern_off';off.apiCalls[0].memPatternFlag=false;
 const result=run([loaded()],off,'webkit','pattern_off');
 assert.equal(result.arm,'pattern_off');
});
test('M246 source-only diagnostics neither alter worker nor leak original model/owner or WASM bytes',async()=>{
 const [driver,module]=await Promise.all([
  readFile('scripts/test-main246-original-native-model-wasm-identity-browser.mjs','utf8'),
  readFile('scripts/main246-original-graph-loaded-wasm-asset.mjs','utf8')]);
 assert.ok(driver.includes('assert.equal(result.status,0'));
 assert.ok(driver.includes('res.end(originalPublicWasmBytes)'));
 assert.ok(driver.includes('M243_REAL_ORIGINAL_SEGFORMER_NATIVE_SESSION'));
 assert.ok(driver.includes('M246_REAL_LOADED_WASM_VARIANT'));
 assert.ok(driver.includes('await downloadAttestedModel()'));
 assert.ok(module.includes('releaseAuthorized:false,familyAlphaHold:true'));
 assert.ok(module.includes('realCPlusPlusAllocatorStateObserved:false'));
 for(const unsafe of ['Buffer.from(memory.buffer)','console.log(bytes)','credentials','sourcePhotoData']){
  assert.equal(module.includes(unsafe),false,unsafe);
 }
});
