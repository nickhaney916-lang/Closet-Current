import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {classifyLocalRuntimeResponse,summarizeLocalPublicWasm,attestM246NativeVariant,
 P94_JSEP,PINNED_LOCAL_NON_JSEP} from '../scripts/main246-local-ort-wasm-identity.mjs';
const origin='http://127.0.0.1:41414';
const file='ort-wasm-simd-threaded.wasm';
const bin=()=>Buffer.alloc(120000,42);
const sample=()=>summarizeLocalPublicWasm(file,bin());
const browser=(available=true)=>({name:file,status:200,bodyAvailable:available,
 sha256:available?sample().sha256:null,bytes:available?sample().bytes:null});
const input=()=>({server:[sample()],network:[browser()],
 installed:[sample()],engine:'webkit',arm:'baseline'});
test('M246 accepts only same-origin /ort/ public WASM without private or CDN URLs',()=>{
 assert.equal(classifyLocalRuntimeResponse(origin+'/ort/'+file,origin),file);
 for(const url of [origin+'/private/photo.jpg',origin+'/ort/'+file+'?token=123',
 'https://cdn.jsdelivr.net/npm/private/ort-wasm.wasm',
 'https://evil.example/ort/'+file,origin+'/ort/../auth/credential.wasm',
 origin+'/ort/model.onnx',origin+'/ort/ort-wasm.wasm#fragment']){
  assert.equal(classifyLocalRuntimeResponse(url,origin),null,url);
 }
});
test('M246 records public local binary only as digest, basename and byte count',()=>{
 const v=sample();
 assert.deepEqual(Object.keys(v).sort(),['bytes','name','sha256']);
 assert.match(v.sha256,/^[0-9a-f]{64}$/);
 assert.equal(v.bytes,120000);
 assert.equal(JSON.stringify(v).includes(bin().toString('hex').slice(0,200)),false);
 assert.throws(()=>summarizeLocalPublicWasm('private.jpg',bin()));
 assert.throws(()=>summarizeLocalPublicWasm(file,Buffer.alloc(5)));
});
test('M246 genuine real local-server and original-browser matching proof remains limited',()=>{
 const v=attestM246NativeVariant(input());
 assert.equal(v.actualLocalServerWasmDelivered,true);
 assert.equal(v.actualBrowserWasmHttp200,true);
 assert.equal(v.actualBrowserResponseBodyShaVerified,true);
 assert.equal(v.installedOriginalPinnedBinaryExactMatch,true);
 assert.equal(v.originalFailureCaptured,false);
 assert.equal(v.jsepAndNonJsepAllocatorParityProven,false);
 assert.equal(v.permanentWebkitFixProven,false);
 assert.equal(v.familyAlphaHold,true);
});
test('M246 unreadable browser response keeps original delivered SHA, not a fake browser SHA',()=>{
 const a=input();a.network=[browser(false)];
 const v=attestM246NativeVariant(a);
 assert.equal(v.actualLocalServerWasmDelivered,true);
 assert.equal(v.actualBrowserResponseBodyShaVerified,false);
 assert.equal(v.matchesP94OriginalWebkitJsepBinary,false);
});
test('M246 no missing, multiple, mismatched, HTTP RED or false verified bytes',()=>{
 const good=input();
 for(const bad of [
  {...good,server:[]},{...good,server:[sample(),sample()]},
  {...good,network:[]},{...good,network:[browser(),browser()]},
  {...good,network:[{...browser(),status:404}]},
  {...good,network:[{...browser(),name:'ort-wasm-simd-threaded.jsep.wasm'}]},
  {...good,network:[{...browser(),sha256:'0'.repeat(64)}]},
  {...good,installed:[]},{...good,installed:[{...sample(),sha256:'1'.repeat(64)}]},
  {...good,network:[{...browser(false),sha256:'2'.repeat(64)}]}
 ])assert.throws(()=>attestM246NativeVariant(bad),'Expected genuine source-identity false-proof refusal');
});
test('M246 distinguishes original P94 JSEP vs original standalone local non-JSEP without claiming parity',()=>{
 assert.notEqual(P94_JSEP,PINNED_LOCAL_NON_JSEP);
 assert.equal(P94_JSEP.length,64);
 assert.equal(PINNED_LOCAL_NON_JSEP.length,64);
});
test('M246 preserves exact original M243 genuine native source and fail-closed assertions',async()=>{
 const source=await readFile('scripts/test-main246-real-native-wasm-variant-browser.mjs','utf8');
 const model=await readFile('scripts/test-main243-original-segformer-native-session-browser.mjs','utf8');
 const worker=await readFile('public/outfit-worker-p94.mjs','utf8');
 assert.ok(source.includes('fdfb979ca3783cb362cb5eb909612902af0c3b70'));
 assert.ok(source.includes('assert.equal(run.status,0'));
 assert.ok(source.includes('M246_REAL_NATIVE_ORIGINAL_WASM_VARIANT'));
 assert.ok(source.includes('M243_REAL_ORIGINAL_SEGFORMER_NATIVE_SESSION'));
 assert.ok(model.includes("assert.equal(data.success,true,'Original pinned SegFormer WASM model session failed"));
 assert.ok(worker.length>200);
 assert.ok(!source.includes('sourceJPEGBytes')&&!source.includes('ownerToken'));
});
