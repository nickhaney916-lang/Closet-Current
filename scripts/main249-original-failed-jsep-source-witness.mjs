/**
 * M249 RESEARCH ONLY: tie original P94 JSEP failed model load to the SAME
 * native browser run's allowlisted public WASM response and a bounded
 * failure taxonomy. Original shipped Worker, model, JPEG and owner flow stay
 * unchanged. A RED is always RED, not a retry, fallback positive or cure.
 */
import assert from 'node:assert/strict';
export const ORIGINAL_JSEP_SHA249='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
export const ORIGINAL_JSEP_NAME249='ort-wasm-simd-threaded.jsep.wasm';
const names=['RuntimeError','Error','RangeError','TypeError','NetworkError','AbortError','CompileError','LinkError','other'];
const classes=['wasm_memory_access','memory_allocation','wasm_compile','wasm_link','session','network_abort','network','other'];
/** Add an observer ONLY after M247 already reconstructed its byte-pinned P94
 * real-original Worker. The caught error is rethrown unchanged. The message
 * is searched only inside the Worker, and its raw value never leaves it. */
export function addM249OriginalErrorWitness(worker){
 assert.ok(typeof worker==='string'&&worker.includes('m247Emit(requestId'));
 const anchor=" })().catch(error=>{m247Emit(requestId,'error');loader=null;throw error;});";
 assert.equal(worker.split(anchor).length,2,'Original model load catch is not unique');
 const classify=[
 '/* M249 PRIVATE-FREE test-only model-load exception taxonomy */',
 'function m249ClassifyOriginal(error){',
 " const n=typeof error?.name==='string'?error.name:'other';",
 " const name=['RuntimeError','Error','RangeError','TypeError','NetworkError','AbortError','CompileError','LinkError'].includes(n)?n:'other';",
 " const message=typeof error?.message==='string'?error.message.toLowerCase().slice(0,200):'';",
 " let category='other';",
 " if(/memory access out of bounds|out of bounds memory access|wasm memory access/.test(message))category='wasm_memory_access';",
 " else if(/out of memory|allocation failed|cannot allocate|memory limit/.test(message))category='memory_allocation';",
 " else if(/compile|compilation|unexpected section/.test(message))category='wasm_compile';",
 " else if(/linkerror|linking|imported function/.test(message))category='wasm_link';",
 " else if(/session|execution provider|ortcreatesession/.test(message))category='session';",
 " else if(name==='AbortError'||/abort|cancel/.test(message))category='network_abort';",
 " else if(name==='NetworkError'||/network|fetch|failed to load/.test(message))category='network';",
 " self.postMessage({type:'diagnostic',phase:'m249_model_failure',outcome:'error',errorName:name,category});",
 '}'
 ].join('\n');
 const derived=classify+'\n'+worker.replace(anchor,
 " })().catch(error=>{m249ClassifyOriginal(error);m247Emit(requestId,'error');loader=null;throw error;});");
 assert.ok(derived.includes("m249ClassifyOriginal(error);m247Emit(requestId,'error');loader=null;throw error"));
 assert.ok(derived.includes("device:'wasm',dtype:'fp32'"));
 return derived;
}
/** Only already-allowlisted public JS/WASM network receipts are admissible.
 * Capture is from SAME browser attempt. Missing/red/unreadable browser
 * response is UNKNOWN, never promoted from a sibling or independent GET.
 */
export function summarizeM249Failure({engine,control,assets,errors,heap}){
 assert.ok(['webkit','chromium'].includes(engine));
 assert.ok(['none','model_abort'].includes(control));
 assert.ok(Array.isArray(assets)&&Array.isArray(errors)&&Array.isArray(heap));
 const one=assets.filter(x=>x.kind==='onnx-wasm');
 const asset=one.length===1?one[0]:null;
 const direct=asset?.name===ORIGINAL_JSEP_NAME249&&asset.status===200&&
  asset.available===true&&asset.sha256===ORIGINAL_JSEP_SHA249&&asset.bytes===21596019;
 const actualPublicRuntimeIdentity=direct?'DIRECT_SAME_ATTEMPT_JSEP_SHA':
  asset&&asset.name!==ORIGINAL_JSEP_NAME249?'WRONG_OR_AMBIGUOUS_RUNTIME':
  'UNVERIFIED_SAME_ATTEMPT_BROWSER_BODY';
 const exactErrors=errors.filter(e=>e.phase==='m249_model_failure'&&e.outcome==='error');
 const explicit=exactErrors.length===1&&names.includes(exactErrors[0].errorName)&&
  classes.includes(exactErrors[0].category)?exactErrors[0]:null;
 const memory=heap.length===1&&heap[0].phase==='m247_jsep_memory'&&heap[0].outcome==='error'
  ?heap[0]:null;
 const bounded=x=>Number.isInteger(x)&&x>=0&&x<=100000?x:null;
 const pages=x=>Number.isInteger(x)&&x>=0&&x<=65536?x:null;
 return {
  schema:'M249_ORIGINAL_FAILED_JSEP_SAME_ATTEMPT/v1',
  engine,controlledPublicOnnxAbort:control==='model_abort',
  realOriginalP94ModelAttemptFailed:true,originalTestFailedNonzero:true,
  directOriginalJsepBrowserBodySHAProven:direct,
  actualPublicRuntimeIdentity,publicWasmResponseCount:one.length,
  publicWasmStatus:asset&&Number.isInteger(asset.status)?asset.status:null,
  modelExceptionName:explicit?.errorName??'UNKNOWN',
  modelExceptionCategory:explicit?.category??'UNKNOWN',
  exactOneObservedException:!!explicit,
  originalHeapTerminalSeen:!!memory,
  observedGrowCalls:bounded(memory?.growCalls),observedGrowErrors:bounded(memory?.growErrors),
  observedFirstPages:pages(memory?.firstPages),observedTerminalPages:pages(memory?.terminalPages),
  nativeCppAllocatorCauseProven:false,
  nativeMemoryAccessRootCauseProven:false,
  controlledAbortIsNaturalModelFailure:false,
  realRedToGreenFixProven:false,
  noAutomaticOwnerApproval:true,privatePhotoBytesLogged:false,
  releaseAuthorized:false,familyAlphaHold:true
 };
}
