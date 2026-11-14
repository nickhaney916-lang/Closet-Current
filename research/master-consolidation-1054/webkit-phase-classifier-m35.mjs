/**
 * M35: fixed-enumeration research-only failure phase classification.
 * Never publishes raw exception messages, URLs, photo contents, account info,
 * model embeddings or stack traces. A class is a diagnostic SIGNAL, not a cause.
 */
const stages=new Set([
 'REQUEST_VALIDATE','SOURCE_LOCK','RUNTIME_ASSETS','RUNTIME_IMPORT',
 'IMAGE_PREPROCESS','VECTOR_ASSETS','CLIP_MODEL_BYTES','CLIP_SESSION',
 'CLIP_PREPROCESSOR','CLIP_INFERENCE','CLIP_RELEASE',
 'SIGLIP_MODEL_BYTES','SIGLIP_SESSION','SIGLIP_PREPROCESSOR',
 'SIGLIP_INFERENCE','SIGLIP_RELEASE','OUTPUT_VALIDATE'
]);
export const failurePhases35=Object.freeze([...stages]);
export const failureClasses35=Object.freeze([
 'P82_GUARD','MEMORY_SIGNAL','WASM_SIGNAL','FETCH_SIGNAL','TIMEOUT_SIGNAL',
 'TENSOR_SIGNAL','JS_RUNTIME_SIGNAL','OTHER_SIGNAL'
]);
export function safeFailureMark35(phase,error){
 const p=stages.has(phase)?phase:'REQUEST_VALIDATE';
 const name=typeof error?.name==='string'?error.name.slice(0,50):'';
 const raw=typeof error?.message==='string'?error.message.slice(0,400):'';
 const text=name+' '+raw;
 let kind='OTHER_SIGNAL';
 if(/^P82_[A-Z_]{3,45}$/.test(raw))kind='P82_GUARD';
 else if(/memory|allocat|out.of.memory|heap|oom|wasm memory/i.test(text))
  kind='MEMORY_SIGNAL';
 else if(/WebAssembly|instantiate|compile|wasm|runtime.?init/i.test(text))
  kind='WASM_SIGNAL';
 else if(/fetch|network|http|resource|load.failed|connection|response/i.test(text))
  kind='FETCH_SIGNAL';
 else if(/timeout|timed.out|abort|deadline/i.test(text))
  kind='TIMEOUT_SIGNAL';
 else if(/tensor|dimension|shape|operator|OrtValue|session.run/i.test(text))
  kind='TENSOR_SIGNAL';
 else if(/TypeError|RangeError|SyntaxError|ReferenceError|DOMException/i.test(name))
  kind='JS_RUNTIME_SIGNAL';
 return Object.freeze({phase:p,signal:kind,
  mark:'M35_FAILURE_'+p+'_'+kind,
  causalDiagnosis:false,rawExceptionExposed:false});
}
