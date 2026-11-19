import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {classifyPinnedPublicRuntime,digestPublicRuntimeResponse,attestP94LoadedRuntime,
 independentlyFetchPinnedWasm} from '../scripts/main245-original-worker-cdn-wasm-identity.mjs';

const root='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/';
const js=()=>digestPublicRuntimeResponse(classifyPinnedPublicRuntime(root+'transformers.min.js'),200,Buffer.from('js'));
const wasmAsset=()=>classifyPinnedPublicRuntime(root+'ort-wasm-simd-threaded.jsep.wasm');
const bytes=()=>Buffer.alloc(120000,7);
const wasm=()=>digestPublicRuntimeResponse(wasmAsset(),200,bytes());
const independent=()=>({name:wasmAsset().name,sha256:wasm().sha256,bytes:120000,
 source:'independent-public-CDN-GET',browserResponseBytes:false});

test('M245 only handles version-pinned original public JS / WASM without private query paths',()=>{
 assert.deepEqual(classifyPinnedPublicRuntime(root+'transformers.min.js'),
  {kind:'transformers-entry',name:'transformers.min.js'});
 assert.deepEqual(wasmAsset(),{kind:'onnx-wasm',name:'ort-wasm-simd-threaded.jsep.wasm'});
 for(const untrusted of [root+'image.jpg',root+'model.onnx',root+'ort-wasm.wasm?token=secret',
 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.2/dist/ort-wasm.wasm',
 'https://huggingface.co/Xenova/segformer_b0_clothes/resolve/main/onnx/model.onnx',
 'https://example.com/auth/v1/token',root+'../cloud-backup.js']){
  assert.equal(classifyPinnedPublicRuntime(untrusted),null);
 }
});
test('M245 public response summary stores only bounded binary SHA/count, never body or URL',()=>{
 const original=Buffer.from('safe synthetic publicly available binary');
 const item=digestPublicRuntimeResponse(wasmAsset(),200,original);
 assert.equal(item.sha256.length,64);
 assert.equal(item.bytes,40);
 assert.deepEqual(Object.keys(item).sort(),['available','bytes','kind','name','sha256','status']);
 assert.equal(JSON.stringify(item).includes(original.toString()),false);
});
test('M245 direct original WASM bytes + independently fetched public path permit exact comparison',()=>{
 const actual=wasm(),ind=independent();
 const v=attestP94LoadedRuntime([js(),actual],[{name:'local.wasm',sha256:actual.sha256,bytes:actual.bytes}],[ind]);
 assert.equal(v.originalWasmHTTP200Count,1);
 assert.equal(v.originalWasmBrowserBodySHA256Count,1);
 assert.equal(v.actualOriginalWasmResponseBytesVerified,true);
 assert.equal(v.browserAndLocalWasmExactParityProven,true);
 assert.equal(v.originalCAllocatorStateObserved,false);
 assert.equal(v.originalWebkitRepairProven,false);
});
test('M245 unreadable original 200 cannot be promoted to direct browser-byte identity',()=>{
 const unreadable=digestPublicRuntimeResponse(wasmAsset(),200,null);
 const v=attestP94LoadedRuntime([js(),unreadable],[],[independent()]);
 assert.equal(v.originalWasmHTTP200Count,1);
 assert.equal(v.originalWasmBrowserBodySHA256Count,0);
 assert.equal(v.actualOriginalWasmResponseBytesVerified,false);
 assert.equal(v.independentPublicPinnedWasmBodySHA256Count,1);
 assert.equal(v.browserAndLocalWasmExactParityProven,false);
 assert.equal(v.independentPublicWasm[0].source,'independent-public-CDN-GET');
});
test('M245 missing, redirected, duplicate, mismatched or forged WASM cannot pass',()=>{
 const bad=digestPublicRuntimeResponse(wasmAsset(),302,null);
 assert.throws(()=>attestP94LoadedRuntime([js()],[],[]),/WASM HTTP200 response was not observed/);
 assert.throws(()=>attestP94LoadedRuntime([js(),bad],[],[]),/WASM HTTP200 response was not observed/);
 assert.throws(()=>attestP94LoadedRuntime([js(),wasm(),wasm()],[],[independent()]),/repeated\/ambiguous/);
 assert.throws(()=>attestP94LoadedRuntime([wasm()],[],[independent()]),/Exactly one original Transformers/);
 assert.throws(()=>attestP94LoadedRuntime([js(),wasm()],[],[]),/one independently SHA-attested/);
 assert.throws(()=>attestP94LoadedRuntime([js(),wasm()],[],[{...independent(),sha256:'b'.repeat(64)}]),
  /differs from independent/);
});
test('M245 independent public CDN retrieval is source and maximum size bounded',async()=>{
 const seen=[];
 const asset=wasmAsset(), raw=bytes();
 const fetcher=async(u,options)=>{
  seen.push({u,hasAbortSignal:!!options.signal});
  return {url:u,status:200,headers:new Map([['content-length',String(raw.length)]]),
   arrayBuffer:async()=>raw};
 };
 const result=await independentlyFetchPinnedWasm(asset.name,fetcher);
 assert.equal(result.sha256,wasm().sha256);
 assert.equal(result.browserResponseBytes,false);
 assert.equal(seen.length,1);
 assert.equal(seen[0].u,root+asset.name);
 await assert.rejects(()=>independentlyFetchPinnedWasm('model.onnx',fetcher),/Only immutable original public/);
});
test('M245 original model, private 2D/v4 and genuine RED remain protected',async()=>{
 const browser=await readFile('scripts/test-main245-real-p94-runtime-identity-browser.mjs','utf8');
 const probe=await readFile('scripts/main245-original-worker-cdn-wasm-identity.mjs','utf8');
 assert.ok(browser.includes('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY'));
 assert.ok(browser.includes('state.cards>0&&state.cards<=12'));
 assert.ok(browser.includes('M245_ORIGINAL_FAILURE_ASSET_BOUNDARY'));
 assert.ok(browser.includes('assert.equal(run.status,0'));
 assert.ok(probe.includes("u.hostname!=='cdn.jsdelivr.net'"));
 assert.ok(probe.includes('browserResponseBytes:false'));
 assert.ok(probe.includes('actualOriginalWasmResponseBytesVerified:observedWasm.every'));
 for(const secret of ['ownerToken','Supabase.from','sourceJPEGBytes','modelWeights','response.text()']){
  assert.equal(probe.includes(secret),false,secret);
 }
});
