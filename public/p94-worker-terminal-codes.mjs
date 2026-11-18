/**
 * M226: privacy-safe P94 worker terminal classification.
 * Diagnostics intentionally contain no exception message, source image, URL,
 * model output, owner ID, token, file name, mask or private JPEG data.
 * Codes classify a FAILURE SHAPE, never a causal WebKit root fix.
 */
const STAGES=new Set([
 'validate','model_load','source_decode','model_inference',
 'mask_module_load','mask_postprocess','piece_encoding'
]);
function errorText(error){
 let name='',message='';
 try{name=typeof error?.name==='string'?error.name:'';}catch{}
 try{message=typeof error?.message==='string'?error.message:'';}catch{}
 // Do not emit these strings. Only inspect bounded local prefixes.
 return (name+' '+message.slice(0,1024)).toLowerCase();
}
export function classifyP94Failure(stage,error){
 const safeStage=STAGES.has(stage)?stage:'unknown';
 const raw=errorText(error);
 let category='other';
 if(safeStage==='validate')category='invalid_input';
 else if(/out.?of.?memory|memory allocation|cannot allocate|allocation failed|memory access out of bounds|out of bounds memory/.test(raw))
  category='memory';
 else if(/failed to fetch|networkerror|network error|network request|download failed|http status|load failed|fetch failed/.test(raw))
  category='network';
 else if(/aborterror|operation was aborted|operation aborted/.test(raw))
  category='aborted';
 else if(/webassembly|wasm|onnxruntime|inference session|tensor|backend|execution provider/.test(raw))
  category='wasm_runtime';
 else if(/typeerror|rangeerror|referenceerror|syntaxerror/.test(raw))
  category='runtime';
 return Object.freeze({
  reason:'P94_'+safeStage,
  diagnosticCode:'P94_'+safeStage+'_'+category,
  errorCategory:category
 });
}
export function classifyP94Done(personDetected,groups,count){
 if(typeof personDetected!=='boolean'||
    !Number.isSafeInteger(groups)||!Number.isSafeInteger(count)||
    groups<0||count<0||count>groups)
  return 'P94_INCONSISTENT_TERMINAL';
 if(!personDetected)return groups||count?'P94_INCONSISTENT_TERMINAL':'P94_NO_PERSON_LABEL';
 if(groups===0)return 'P94_NO_CLOTHING_GROUPS';
 return count===0?'P94_NO_ENCODED_PIECES':'P94_PIECES_READY';
}
