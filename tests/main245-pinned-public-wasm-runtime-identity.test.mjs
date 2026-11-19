import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {classifyPinnedPublicRuntime,digestPublicRuntimeResponse,attestP94LoadedRuntime}
 from '../scripts/main245-original-worker-cdn-wasm-identity.mjs';

const root='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/';
test('M245 allows only pinned original public Transformers entry and ORT WASM',()=>{
 assert.deepEqual(classifyPinnedPublicRuntime(root+'transformers.min.js'),
  {kind:'transformers-entry',name:'transformers.min.js'});
 assert.deepEqual(classifyPinnedPublicRuntime(root+'ort-wasm-simd-threaded.jsep.wasm'),
  {kind:'onnx-wasm',name:'ort-wasm-simd-threaded.jsep.wasm'});
 assert.equal(classifyPinnedPublicRuntime(root+'image.jpg'),null);
 assert.equal(classifyPinnedPublicRuntime(root+'model.onnx'),null);
 assert.equal(classifyPinnedPublicRuntime(root+'ort-wasm.wasm?token=secret'),null);
 assert.equal(classifyPinnedPublicRuntime('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.2/dist/ort-wasm.wasm'),null);
 assert.equal(classifyPinnedPublicRuntime('https://huggingface.co/Xenova/segformer_b0_clothes/resolve/main/onnx/model.onnx'),null);
 assert.equal(classifyPinnedPublicRuntime('https://example.com/auth/v1/token'),null);
 assert.equal(classifyPinnedPublicRuntime('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/../cloud-backup.js'),null);
});
test('M245 hashes only authorized public binary, never stores bytes or URL',()=>{
 const asset=classifyPinnedPublicRuntime(root+'ort-wasm-simd-threaded.jsep.wasm');
 const result=digestPublicRuntimeResponse(asset,200,Buffer.from('safe synthetic publicly available binary'));
 assert.equal(result.sha256.length,64);
 assert.equal(result.bytes,40);
 assert.equal(result.name,'ort-wasm-simd-threaded.jsep.wasm');
 assert.deepEqual(Object.keys(result).sort(),['available','bytes','kind','name','sha256','status']);
 assert.equal(JSON.stringify(result).includes('safe synthetic'),false);
});
test('M245 requires actual original model runtime entry and downloaded WASM body',()=>{
 const js=digestPublicRuntimeResponse(classifyPinnedPublicRuntime(root+'transformers.min.js'),200,Buffer.from('js'));
 const wasm=digestPublicRuntimeResponse(classifyPinnedPublicRuntime(root+'ort-wasm-simd-threaded.jsep.wasm'),200,Buffer.from('wasm'));
 const evidence=attestP94LoadedRuntime([js,wasm],[{name:'local.wasm',sha256:wasm.sha256,bytes:wasm.bytes}]);
 assert.equal(evidence.actualCDNWasmCount,1);
 assert.equal(evidence.localAndCDNWasmBinaryIdentical,true);
 assert.equal(evidence.originalNativeCAllocatorStateObserved,false);
 assert.equal(evidence.provenOriginalWebkitRepair,false);
 assert.equal(evidence.hold,true);
});
test('M245 original Worker runtime cannot be inferred from JS-only, redirect or unreadable WASM',()=>{
 const js=digestPublicRuntimeResponse(classifyPinnedPublicRuntime(root+'transformers.min.js'),200,Buffer.from('js'));
 const asset=classifyPinnedPublicRuntime(root+'ort-wasm-simd-threaded.jsep.wasm');
 const missing=digestPublicRuntimeResponse(asset,302,null);
 assert.throws(()=>attestP94LoadedRuntime([js],[]),/no independently SHA-attested/);
 assert.throws(()=>attestP94LoadedRuntime([js,missing],[]),/no independently SHA-attested/);
 const wasm=digestPublicRuntimeResponse(asset,200,Buffer.from('wasm'));
 assert.throws(()=>attestP94LoadedRuntime([js,wasm,wasm],[]),/repeated or ambiguous/);
 assert.throws(()=>attestP94LoadedRuntime([wasm],[]),/Exactly one real original Transformers/);
});
test('M245 no model weights/photo/owner/private network bytes and original acceptance retained',async()=>{
 const browser=await readFile('scripts/test-main245-real-p94-runtime-identity-browser.mjs','utf8');
 const probe=await readFile('scripts/main245-original-worker-cdn-wasm-identity.mjs','utf8');
 assert.ok(browser.includes('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY'));
 assert.ok(browser.includes('state.cards>0&&state.cards<=12'));
 assert.ok(browser.includes("response.body()"));
 assert.ok(browser.includes('M245_ORIGINAL_FAILURE_ASSET_BOUNDARY'));
 assert.ok(browser.includes('assert.equal(run.status,0'));
 assert.ok(probe.includes("u.hostname!=='cdn.jsdelivr.net'"));
 assert.ok(probe.includes("u.search||u.hash"));
 for(const needle of ['ownerToken','Supabase.from','sourceJPEGBytes','modelWeights','response.text()']){
  assert.equal(probe.includes(needle),false,needle);
 }
});
