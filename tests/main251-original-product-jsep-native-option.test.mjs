import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {instrumentOriginalJsepNativeGlue,admitRealNativeSessionTransport,
 ORIGINAL_JSEP_GLUE_SHA,ORIGINAL_JSEP_WASM_SHA,JSEP_CDN_URL,JSEP_WASM_URL,
 JSEP_NATIVE_CALL} from '../scripts/main251-original-product-jsep-native-option-spy.mjs';
const original=await readFile('public/outfit-worker-p94.mjs','utf8');
test('native JSEP public source lock never modifies actual consumer P94 Worker/model',()=>{
 assert.ok(original.includes("device:'wasm',dtype:'fp32'"));
 assert.ok(original.includes('Xenova/segformer_b0_clothes'));
 assert.ok(original.includes("revision='a2489ea8e7ec1ee912190546bad31a4906ccca76'"));
 assert.ok(!original.includes('m251OriginalNativeOptions'));
 assert.match(ORIGINAL_JSEP_GLUE_SHA,/^[a-f0-9]{64}$/);
 assert.match(ORIGINAL_JSEP_WASM_SHA,/^[a-f0-9]{64}$/);
 assert.ok(JSEP_CDN_URL.endsWith('ort-wasm-simd-threaded.jsep.mjs'));
 assert.ok(JSEP_WASM_URL.endsWith('ort-wasm-simd-threaded.jsep.wasm'));
});
test('no false native ABI source in wrong original glued WASM/bundle bytes',()=>{
 assert.throws(()=>instrumentOriginalJsepNativeGlue('fake'));
 assert.throws(()=>instrumentOriginalJsepNativeGlue(JSEP_NATIVE_CALL));
});
const identity={originalP94JsepRealWorker:true,
 originalModelAndPrivate2DV4Passed:true,
 actualOriginalJsepName:'ort-wasm-simd-threaded.jsep.wasm',
 pinnedLocalJsepBinarySha:ORIGINAL_JSEP_WASM_SHA,
 directBrowserJsepWasmBodyHash:true};
const e=flag=>({phase:'m251_original_jsep_native_abi',
 optionsArgumentCount:10,originalNativeExportCalled:true,
 arenaFlag:1,patternFlag:flag,returnedNativeHandle:true,threw:false});
test('real original P94 native ABI receipt admits default memory pattern only as witnessed',()=>{
 const r=admitRealNativeSessionTransport({engine:'webkit',arm:'baseline',events:[e(1)],identity});
 assert.equal(r.actualNativeMemoryPatternFlag,1);
 assert.equal(r.actualNativeOptionTransportMatchesRequest,true);
 assert.equal(r.spontaneousWebKitRedBeforeGreenAfterProven,false);
 assert.equal(r.nativeCppAllocatorStateRead,false);
 assert.equal(r.releaseAuthorized,false);
});
test('actual native ABI can disprove Transformers pattern-off request transport',()=>{
 const r=admitRealNativeSessionTransport({engine:'webkit',arm:'pattern_off',events:[e(1)],identity});
 assert.equal(r.actualNativeMemoryPatternFlag,1);
 assert.equal(r.expectedMemoryPatternFlag,0);
 assert.equal(r.actualNativeOptionTransportMatchesRequest,false);
 assert.equal(r.webKitMemoryFaultRepaired,false);
});
test('actual native ABI match for pattern-off is evidence, not a permanent repair',()=>{
 const r=admitRealNativeSessionTransport({engine:'webkit',arm:'pattern_off',events:[e(0)],identity});
 assert.equal(r.actualNativeMemoryPatternFlag,0);
 assert.equal(r.actualNativeOptionTransportMatchesRequest,true);
 assert.equal(r.spontaneousWebKitRedBeforeGreenAfterProven,false);
});
test('reject fake native handle, wrong WASM, ambiguous or missing worker pass-through',()=>{
 const variants=[
  {events:[]},
  {events:[e(0),e(0)]},
  {events:[{...e(0),returnedNativeHandle:false}]},
  {events:[{...e(0),originalNativeExportCalled:false}]},
  {events:[{...e(0),optionsArgumentCount:9}]},
  {events:[{...e(0),patternFlag:null}]},
  {events:[e(0)],identity:{...identity,pinnedLocalJsepBinarySha:'0'.repeat(64)}},
  {events:[e(0)],identity:{...identity,originalModelAndPrivate2DV4Passed:false}},
  {events:[e(0)],identity:{...identity,directBrowserJsepWasmBodyHash:false}}
 ];
 for(const v of variants){
  assert.throws(()=>admitRealNativeSessionTransport({
   engine:'webkit',arm:'pattern_off',events:[e(0)],identity,...v
  }));
 }
});
test('Chromium direct browser JSEP hash remains unverified rather than invented',()=>{
 const r=admitRealNativeSessionTransport({
  engine:'chromium',arm:'baseline',events:[e(1)],
  identity:{...identity,directBrowserJsepWasmBodyHash:false}
 });
 assert.equal(r.actualOriginalBrowserWasmShaVerified,false);
 assert.equal(r.originalJsepWasmSamePinnedOriginal,true);
 assert.equal(r.releaseAuthorized,false);
});
test('actual original pinned source-derived real browser compiles for both option arms',()=>{
 for(const arm of ['baseline','pattern_off']){
  const p=spawnSync(process.execPath,['scripts/test-main251-original-product-jsep-native-option-browser.mjs'],{
   env:{...process.env,M251_SOURCE_ONLY:'1',M251_ARM:arm,M251_ENGINE:'webkit',M251_WIDTH:'320'},
   encoding:'utf8',timeout:30000,maxBuffer:200000
  });
  // The installed npm package is required for source-only preflight too;
  // CI installs the exact original runtime before this unit suite runs.
  assert.equal(p.status,0,String(p.stderr||'').slice(0,900));
  assert.match(p.stdout,/M251_ACTUAL_SOURCE_LOCKED/);
 }
});
