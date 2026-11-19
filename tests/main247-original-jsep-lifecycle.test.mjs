import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyOriginalJsepTimeline,sanitizeWorkerLifecycle,JSEP_NAME,JSEP_SHA,JSEP_BYTES} from '../scripts/main247-original-jsep-lifecycle.mjs';
const runtime=()=>({
 schema:'M245_ORIGINAL_WORKER_CDN_RUNTIME_IDENTITY/v2',
 originalP94Worker:true,originalTransformersVersion:'3.8.1',
 observedPublicResources:[{kind:'onnx-wasm',name:JSEP_NAME,status:200,available:true,sha256:JSEP_SHA,bytes:JSEP_BYTES}],
 independentPublicWasm:[{name:JSEP_NAME,sha256:JSEP_SHA,bytes:JSEP_BYTES,matchesInstalledLocalWasm:true}]
});
const events=()=>[{type:'progress',phase:'loading'}, {type:'progress',phase:'separating'}, {type:'piece'}, {type:'done'}];
test('strict private-free metadata removes arbitrary image/token/owner fields',()=>{
 assert.deepEqual(sanitizeWorkerLifecycle({type:'piece',image:'PRIVATE',owner:'PRIVATE',id:'PRIVATE'}),{type:'piece',phase:null,reason:null});
 assert.throws(()=>sanitizeWorkerLifecycle({type:'raw-private-photo'}));
});
test('a true pinned JSEP original Worker with explicit real owner gates can log completion but not repair',()=>{
 const x=classifyOriginalJsepTimeline(runtime(),events(),{outcome:'success',ownerGuardPassed:true});
 assert.equal(x.actualBrowserJsepBytesSHA256Verified,true);
 assert.equal(x.observedSuccessfulNativeModelLoad,true);
 assert.equal(x.originalRedToGreenRepairProven,false);
 assert.equal(x.nativeCppAllocatorObserved,false);
 assert.equal(x.releaseAuthorized,false);
});
test('a JSEP HTTP200 with UNREADABLE Chromium browser body stays explicitly unverified',()=>{
 const r=runtime(); r.observedPublicResources[0]={kind:'onnx-wasm',name:JSEP_NAME,status:200,available:false,sha256:null,bytes:null};
 const x=classifyOriginalJsepTimeline(r,events(),{outcome:'success',ownerGuardPassed:true});
 assert.equal(x.actualBrowserJsepBytesSHA256Verified,false);
 assert.equal(x.separatelyDownloadedJsepMatchesInstalled,true);
});
test('wrong JSEP variant, hash, count and local package match are rejected',()=>{
 for(const mutation of [
  r=>r.observedPublicResources[0].name='ort-wasm-simd-threaded.wasm',
  r=>r.observedPublicResources[0].sha256='f'.repeat(64),
  r=>r.independentPublicWasm[0].sha256='a'.repeat(64),
  r=>r.independentPublicWasm[0].bytes=7,
  r=>r.independentPublicWasm[0].matchesInstalledLocalWasm=false,
  r=>r.observedPublicResources.push({...r.observedPublicResources[0]})
 ]){const r=runtime();mutation(r);assert.throws(()=>classifyOriginalJsepTimeline(r,events(),{outcome:'success',ownerGuardPassed:true}));}
});
test('no silent original success without owner confirmation, model progress or done',()=>{
 assert.throws(()=>classifyOriginalJsepTimeline(runtime(),events(),{outcome:'success',ownerGuardPassed:false}));
 for(const list of [[{type:'progress',phase:'loading'},{type:'done'}],
 [{type:'progress',phase:'loading'},{type:'progress',phase:'separating'}],
 [{type:'progress',phase:'loading'},{type:'error',reason:'P94_model_load'},{type:'done'}]]){
  assert.throws(()=>classifyOriginalJsepTimeline(runtime(),list,{outcome:'success',ownerGuardPassed:true}));
 }
});
test('true model-loading error remains a RED with no claimed native allocator provenance',()=>{
 const x=classifyOriginalJsepTimeline(runtime(),[{type:'progress',phase:'loading'},{type:'error',reason:'P94_model_load'}],{outcome:'failure'});
 assert.equal(x.workerErrorReason,'P94_model_load');
 assert.equal(x.observedSuccessfulNativeModelLoad,false);
 assert.equal(x.originalRedToGreenRepairProven,false);
});
test('never accept incomplete evidence or forged release claims',()=>{
 assert.throws(()=>classifyOriginalJsepTimeline(null,[],{outcome:'success',ownerGuardPassed:true}));
 assert.throws(()=>classifyOriginalJsepTimeline(runtime(),[],{outcome:'success',ownerGuardPassed:true}));
 assert.throws(()=>classifyOriginalJsepTimeline(runtime(),[],{outcome:'unspecified'}));
});
