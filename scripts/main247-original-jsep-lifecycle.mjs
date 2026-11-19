/**
 * M247: strict, privacy-free evidence ledger for the ACTUAL original P94
 * Transformers.js/JSEP Worker. No C++ allocator access, retries or fixes.
 * This cannot promote a green session into a permanent WebKit repair.
 */
import assert from 'node:assert/strict';
export const JSEP_NAME='ort-wasm-simd-threaded.jsep.wasm';
export const JSEP_SHA='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
export const JSEP_BYTES=21596019;
const types=new Set(['progress','piece','done','error']);
export function sanitizeWorkerLifecycle(value){
 assert.ok(value&&typeof value==='object'&&types.has(value.type),'Unexpected/forged Worker message type');
 const phase=typeof value.phase==='string'&&/^(loading|separating)$/.test(value.phase)?value.phase:null;
 const reason=typeof value.reason==='string'&&/^P94_(?:validate|model_load|source_decode|model_inference|mask_module_load|mask_postprocess|piece_encoding)$/.test(value.reason)?value.reason:null;
 return {type:value.type,phase,reason};
}
export function classifyOriginalJsepTimeline(runtime,events,{outcome,ownerGuardPassed=false}={}){
 assert.ok(runtime&&runtime.schema==='M245_ORIGINAL_WORKER_CDN_RUNTIME_IDENTITY/v2','Must use real M245 original browser runtime receipts');
 assert.ok(['success','failure'].includes(outcome),'Unknown real browser outcome');
 assert.ok(Array.isArray(events)&&events.length<10000,'Invalid/bounded event timeline');
 const actual=(runtime.observedPublicResources||[]).filter(x=>x.kind==='onnx-wasm'&&x.name===JSEP_NAME&&x.status===200);
 const independent=(runtime.independentPublicWasm||[]).filter(x=>x.name===JSEP_NAME);
 assert.equal(actual.length,1,'One real original JSEP Worker WASM HTTP200 receipt required');
 assert.equal(independent.length,1,'One separate pinned public JSEP SHA attestation required');
 assert.equal(independent[0].sha256,JSEP_SHA,'Independent pinned JSEP hash drift');
 assert.equal(independent[0].bytes,JSEP_BYTES,'Independent pinned JSEP byte count drift');
 assert.equal(independent[0].matchesInstalledLocalWasm,true,'Original JSEP not in pinned installed ONNX package');
 assert.ok(!actual[0].available||(actual[0].sha256===JSEP_SHA&&actual[0].bytes===JSEP_BYTES),'Actually received browser JSEP bytes differed');
 assert.equal(runtime.originalP94Worker,true);
 assert.equal(runtime.originalTransformersVersion,'3.8.1');
 const safe=events.map(sanitizeWorkerLifecycle);
 const loading=safe.some(x=>x.type==='progress'&&x.phase==='loading');
 const separating=safe.some(x=>x.type==='progress'&&x.phase==='separating');
 const done=safe.some(x=>x.type==='done');
 const error=safe.findLast(x=>x.type==='error')||null;
 const phases=safe.filter(x=>x.type==='progress').map(x=>x.phase).filter(Boolean);
 if(outcome==='success'){
  assert.equal(ownerGuardPassed,true,'Original private owner/2D/v4 acceptance missing');
  assert.ok(loading&&separating&&done&&!error,'Cannot count incomplete original real model as success');
 }else{
  assert.ok(!done||error,'Do not relabel original failed browser as success');
 }
 return {
  schema:'M247_ORIGINAL_JSEP_LIFECYCLE/v1',
  outcome,actualOriginalJsepHTTP200:true,
  actualBrowserJsepBytesSHA256Verified:actual[0].available,
  separatelyDownloadedJsepMatchesInstalled:true,
  realWorkerMessageCount:safe.length,phases,
  observedModelLoadStart:loading,observedModelLoadTerminal:separating||!!error,
  observedSuccessfulNativeModelLoad:separating,
  workerErrorReason:error?.reason||null,
  originalPrivateOwnerJourneyAccepted:outcome==='success'&&ownerGuardPassed,
  wasmMemoryPagesObserved:false,nativeSessionOptionsObserved:false,
  nativeCppAllocatorObserved:false,originalRedToGreenRepairProven:false,
  releaseAuthorized:false,familyAlphaHold:true
 };
}
