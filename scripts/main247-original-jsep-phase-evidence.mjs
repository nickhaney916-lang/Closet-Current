/**
 * M247 original P94 JSEP Worker session-stage evidence gate. NO runtime change.
 * Only pinned public CDN runtime metadata + bounded original P101 diagnostics.
 * Failure classes are NOT proof of the original ORT C++ allocator root cause.
 */
import assert from 'node:assert/strict';
import {classifyPinnedPublicRuntime} from './main245-original-worker-cdn-wasm-identity.mjs';
export const ORIGINAL_JSEP_NAME='ort-wasm-simd-threaded.jsep.wasm';
export const ORIGINAL_JSEP_SHA='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
export const ORIGINAL_NON_JSEP_SHA='f061472c6e77d6d50d079aacdc0ff9b63fee287ddd2cbf46cf62438d3891de2b';
const cappedCount=n=>Number.isInteger(n)&&n>=0&&n<=1000?n:null;
const STAGE=new Set(['wasm_compile','wasm_compileStreaming','wasm_instantiate','wasm_instantiateStreaming','model_session_load','first_inference','processor_load','module_import']);
const OUTCOME=new Set(['start','ok','error']);
const NAME=new Set(['Error','TypeError','RangeError','RuntimeError','AbortError','NetworkError','CompileError','LinkError','AggregateError','other']);
const CODE=new Set(['memory_allocation','wasm_memory_access','wasm_compile','wasm_link','ort_session','cache_storage','network_stream','wasm_runtime','model_graph','resource','other']);
export function stageLedger(events){
 assert.ok(Array.isArray(events)&&events.length<=64,'Original bounded Worker stage list required');
 const safe=events.filter(x=>x&&x.type==='diagnostic'&&STAGE.has(x.phase)&&OUTCOME.has(x.outcome)).map(x=>({
  phase:x.phase,outcome:x.outcome,
  errorName:NAME.has(x.errorName)?x.errorName:null,
  messageCode:CODE.has(x.messageCode)?x.messageCode:null,
  elapsedMs:Number.isFinite(x.elapsedMs)&&x.elapsedMs>=0&&x.elapsedMs<=600000?Math.round(x.elapsedMs):null
 }));
 const pick=phase=>safe.filter(x=>x.phase===phase);
 const terminal=pick('model_session_load').at(-1);
 const nativeOK=safe.some(x=>['wasm_instantiate','wasm_instantiateStreaming'].includes(x.phase)&&x.outcome==='ok');
 const inferenceStarted=safe.some(x=>x.phase==='first_inference'&&x.outcome==='start');
 const observedFail=terminal?.outcome==='error';
 const fault=observedFail&&nativeOK&&!inferenceStarted&&
  terminal.errorName==='RuntimeError'&&terminal.messageCode==='wasm_memory_access';
 return {
  phases:safe,
  modelSessionTerminal:terminal?.outcome||'missing',
  nativeInstantiationSucceeded:nativeOK,
  firstInferenceStarted:inferenceStarted,
  genuineOriginalPostWasmSessionMemoryFaultWitness:fault,
  nativeAllocatorRootCauseProven:false,
  permanentRepairProven:false
 };
}
export function originalJsepReceipt({engine,width,network,events,originalWorkerSeen,originalModelAttempted,cards,intentionalNegative=false}){
 assert.ok(['webkit','chromium'].includes(engine),'Unsupported real browser engine');
 assert.ok([320,390,430].includes(width),'Unsupported viewport');
 assert.ok(Array.isArray(network)&&network.length<=20,'Public runtime receipt list missing/oversized');
 assert.equal(originalWorkerSeen,true,'Real installed original P94 Worker not seen');
 assert.equal(originalModelAttempted,true,'Real original fp32 model attempt not observed');
 assert.ok(Number.isInteger(cards)&&cards>=0&&cards<=12,'Original model proposal count invalid');
 const seen=new Set();
 for(const x of network){
  assert.ok(x&&classifyPinnedPublicRuntime('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/'+x.name)?.kind===x.kind,
   'Unpinned runtime asset in original worker receipt');
  assert.ok(!seen.has(x.name),'Duplicate ambiguous original runtime asset');
  seen.add(x.name);
  assert.ok(Number.isInteger(x.status)&&x.status>=0&&x.status<=599);
  if(x.bodyAvailable){
   assert.equal(x.status,200,'Unreadable/non-200 original asset misrepresented as hash');
   assert.match(x.sha256||'',/^[a-f0-9]{64}$/);
   assert.ok(Number.isInteger(x.bytes)&&x.bytes>0&&x.bytes<128*1024*1024);
  }else{
   assert.equal(x.sha256,null,'Non-readable browser asset cannot claim a SHA');
   assert.equal(x.bytes,null,'Non-readable browser asset cannot claim bytes');
  }
 }
 const runtime=network.filter(x=>x.kind==='onnx-wasm');
 assert.ok(runtime.length<=1,'Original P94 runtime WASM ambiguous');
 const one=runtime[0]||null;
 const originalJsepHttp200=one?.name===ORIGINAL_JSEP_NAME&&one?.status===200;
 const originalJsepBrowserShaVerified=originalJsepHttp200&&one.bodyAvailable&&one.sha256===ORIGINAL_JSEP_SHA;
 if(one?.bodyAvailable){
  assert.equal(one.name,ORIGINAL_JSEP_NAME,'Original runtime unexpectedly non-JSEP');
  assert.equal(one.sha256,ORIGINAL_JSEP_SHA,'Original P94 JSEP binary bytes drifted');
  assert.equal(one.bytes,21596019,'Original P94 JSEP WASM length changed');
 }
 const stages=stageLedger(events);
 if(!intentionalNegative&&cards>0){
  assert.equal(originalJsepHttp200,true,'Genuine original positive absent JSEP WASM HTTP200');
  assert.equal(stages.modelSessionTerminal,'ok','Original model-positive no native session success');
 }
 if(intentionalNegative)assert.equal(cards,0,'Intentional model failure cannot be promoted to real positive');
 return {
  schema:'M247_REAL_P94_JSEP_SESSION_PHASE/v1',engine,width,
  originalWorkerSeen:true,originalModelAttempted:true,originalModelCards:cards,
  originalJsepWasmHttp200:originalJsepHttp200,
  originalJsepWasmResponseBodySHA256Verified:!!originalJsepBrowserShaVerified,
  originalJsepActualBrowserBodyReadable:one?.bodyAvailable===true,
  originalJsepBinaryName:one?.name||null,
  originalJsepDirectBrowserBinarySHA256:one?.bodyAvailable?one.sha256:null,
  originalJsepCompareToNonJsep:false,
  ...stages,
  intentionalModelNetworkFailure:intentionalNegative,
  originalPositiveJourneyStillRequired:!intentionalNegative,
  originalSourceOwnerBackupAcceptanceNotInThisReceipt:true,
  releaseAuthorized:false,familyAlphaHold:true
 };
}
