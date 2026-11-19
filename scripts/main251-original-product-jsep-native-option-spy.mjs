/**
 * M251 research ONLY: instrument published original JSEP Emscripten JS glue
 * at its actual export to the original 21.6MB WASM binary, preserving the
 * native export call/arguments/return and never reading native memory or
 * model/owner data. This is test-only glue, NOT shipped product code.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const ORIGINAL_JSEP_GLUE_SHA='08fb86ec433c78bfb032c5d84a68b8e8e5a8d81268fa39e24314179a5767a5b9';
export const ORIGINAL_JSEP_WASM_SHA='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
export const JSEP_CDN_URL='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/ort-wasm-simd-threaded.jsep.mjs';
export const JSEP_WASM_URL='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/ort-wasm-simd-threaded.jsep.wasm';
export const JSEP_NATIVE_CALL='e._OrtCreateSessionOptions=(a,b,c,d,f,g,h,l,m,p)=>(e._OrtCreateSessionOptions=K.Ha)(a,b,c,d,f,g,h,l,m,p)';
export const sha256=buf=>createHash('sha256').update(buf).digest('hex');
const header=[
 '/* M251 disposable pinned PUBLIC JSEP glue, actual native ABI read-only observer. */',
 'function m251OriginalNativeOptions(receiver,nativeFn,args){',
 ' const arena=args[1],pattern=args[2];',
 ' const record={type:"diagnostic",phase:"m251_original_jsep_native_abi",',
 '  optionsArgumentCount:args.length,originalNativeExportCalled:true,',
 '  arenaFlag:(arena===1||arena===0||typeof arena==="boolean")?Number(arena):null,',
 '  patternFlag:(pattern===1||pattern===0||typeof pattern==="boolean")?Number(pattern):null,',
 '  nativeArgumentsZeroOneOnly:args.map(v=>(v===0||v===1||typeof v==="boolean")?Number(v):null),',
 '  returnedNativeHandle:false,threw:false,errorName:null};',
 ' try{',
 '  const result=Reflect.apply(nativeFn,receiver,args);',
 '  record.returnedNativeHandle=Number.isInteger(result)&&result!==0;',
 '  return result;',
 ' }catch(error){',
 '  record.threw=true;',
 '  record.errorName=["RuntimeError","TypeError","RangeError","Error","LinkError"].includes(error?.name)?error.name:"other";',
 '  throw error;',
 ' }finally{',
 '  try{self.postMessage(record);}catch{}',
 ' }',
 '}'
].join('\n')+'\n';
export function instrumentOriginalJsepNativeGlue(source){
 assert.equal(typeof source,'string');
 assert.equal(sha256(Buffer.from(source)),ORIGINAL_JSEP_GLUE_SHA,'Published original JSEP JS glue changed');
 assert.equal(source.split(JSEP_NATIVE_CALL).length,2,'Native JSEP export options thunk must be unique');
 const changed=source.replace(JSEP_NATIVE_CALL,
  'e._OrtCreateSessionOptions=(a,b,c,d,f,g,h,l,m,p)=>m251OriginalNativeOptions(e,(e._OrtCreateSessionOptions=K.Ha),[a,b,c,d,f,g,h,l,m,p])');
 assert.ok(changed.includes('e._OrtCreateSessionOptions=K.Ha'),'Original real native JSEP WASM export not forwarded');
 assert.equal(changed.includes(JSEP_NATIVE_CALL),false);
 return header+changed;
}
export async function auditPinnedOriginalJsepGlue(root=process.cwd()){
 const a=await readFile(root+'/node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.mjs');
 const b=await readFile(root+'/node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs');
 assert.equal(sha256(a),ORIGINAL_JSEP_GLUE_SHA);
 assert.equal(sha256(b),ORIGINAL_JSEP_GLUE_SHA);
 const wasm=await readFile(root+'/node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm');
 assert.equal(sha256(wasm),ORIGINAL_JSEP_WASM_SHA);
 assert.equal(wasm.length,21596019);
 return {derived:instrumentOriginalJsepNativeGlue(a.toString('utf8')),
  audit:{publishedOriginalGlueSha256:ORIGINAL_JSEP_GLUE_SHA,
   publishedUnmodifiedOriginalJsepWasmSha256:ORIGINAL_JSEP_WASM_SHA,
   wasmByteLength:wasm.length,modelOrPhotoBytesRead:false,
   originalNativeCallPending:true,originalWorkerUnchanged:true,
   fixedNativeAllocator:false,releaseAuthorized:false,hold:true}};
}
export function admitRealNativeSessionTransport({arm,engine,events,identity}){
 assert.ok(['baseline','pattern_off'].includes(arm));
 assert.ok(['webkit','chromium'].includes(engine));
 assert.ok(Array.isArray(events)&&events.length===1,
  'Actual JSEP native session-option ABI must be uniquely observed in SAME original Worker');
 const e=events[0];
 assert.equal(e.phase,'m251_original_jsep_native_abi');
 assert.equal(e.optionsArgumentCount,10);
 assert.equal(e.originalNativeExportCalled,true);
 assert.equal(e.returnedNativeHandle,true);
 assert.equal(e.threw,false);
 assert.ok(e.arenaFlag===0||e.arenaFlag===1,'Observed native arena ABI flag must be numeric 0/1');
 assert.ok(Array.isArray(e.nativeArgumentsZeroOneOnly)&&e.nativeArgumentsZeroOneOnly.length===10);
 assert.ok(e.nativeArgumentsZeroOneOnly.every(x=>x===0||x===1||x===null));
 assert.ok(e.patternFlag===0||e.patternFlag===1,'Native mempattern argument unavailable');
 assert.equal(identity.originalP94JsepRealWorker,true);
 assert.equal(identity.originalModelAndPrivate2DV4Passed,true);
 assert.equal(identity.actualOriginalJsepName,'ort-wasm-simd-threaded.jsep.wasm');
 assert.equal(identity.pinnedLocalJsepBinarySha,ORIGINAL_JSEP_WASM_SHA);
 if(engine==='webkit')assert.equal(identity.directBrowserJsepWasmBodyHash,true);
 return {schema:'M251_ORIGINAL_PRODUCT_JSEP_ACTUAL_NATIVE_OPTION_ABI/v1',
  engine,arm,actualOriginalP94WorkerSession:true,
  nativeJsepExportCalled:true,nativeSessionHandleReturned:true,
  actualNativeArenaFlag:e.arenaFlag,actualNativeMemoryPatternFlag:e.patternFlag,
  realNativeArgumentBitView:e.nativeArgumentsZeroOneOnly,
  abiArgumentSemanticMappingOnlyCandidate:true,
  expectedMemoryPatternFlag:arm==='pattern_off'?0:1,
  candidatePatternFlagMatchesRequest:e.patternFlag===(arm==='pattern_off'?0:1),
  nativePatternFlagMeaningSourceVerified:false,
  actualNativeOptionTransportVerified:false,
  actualOriginalProductOwnerPrivate2DV4Accepted:true,
  originalJsepWasmSamePinnedOriginal:true,
  actualOriginalBrowserWasmShaVerified:identity.directBrowserJsepWasmBodyHash===true,
  nativeCppAllocatorStateRead:false,webKitMemoryFaultRepaired:false,
  spontaneousWebKitRedBeforeGreenAfterProven:false,
  originalConsumerCodeChanged:false,releaseAuthorized:false,familyAlphaHold:true};
}
