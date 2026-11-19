/**
 * M279: preserve the exact original model->OrtCreateSession 3-argument ABI and
 * measure real pointer/length vs Emscripten heap/live WASM memory on original
 * WebKit. Native implementation, exported call args, fp32 model and owner flow
 * remain byte-identical. This captures a boundary; does NOT prove C++ cause.
 */
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {instrument as m278Instrument,deriveM278,classifyRun} from './m278-native-session-memory-class.mjs';

export const parent='98256ab6da8e9b01253c62d785f81cc9307cb05c';
export const ref='refs/heads/research/main1054-m279-native-model-pointer-bounds-HOLD';
export const newPaths=[
 '.github/workflows/main1054-m279-original-pointer-bounds-no-deploy.yml',
 'research/main1054/m279-original-model-pointer-bounds.mjs',
 'tests/main1054-m279-original-model-pointer-bounds.test.mjs'
];
export const pinned=Object.freeze({
 '.github/workflows/main1054-m278-native-session-memory-no-deploy.yml':'a8668c9d5a93970996e39e721c74660f451855e6',
 'research/main1054/m278-native-session-memory-class.mjs':'8c8ac5a2eae233778a805063eba57dce22e1c386',
 'tests/main1054-m278-native-session-memory-class.test.mjs':'d4deec02e0c25eeb9eb6e7eb5ef7fc14f638160f',
 'research/main1054/original-ort-native-trace.mjs':'08c9ea893ee12606073fc7c1d07dee37344d538c',
 'research/main1054/m269-webkit-graph-optimization-runtime-ab.mjs':'20e903003c733d7d5620cc08790f87f25f1e1ff9',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41'
});
export const expectedOriginalModelLength=15199746;
const demand=(value,reason)=>{if(!value)throw Error('M279 BLOCKED: '+reason);};
export function sourceGate(git,event){
 demand(event?.name==='push'&&event.ref===ref,'unexpected event/ref');
 demand(event.attempt==='1','rerun is not first attempt');
 demand(/^[0-9a-f]{40}$/.test(event.sha||''),'invalid exact SHA');
 const head=git('rev-parse','HEAD');
 demand(head===event.sha,'checkout not exact source');
 demand(git('merge-base','--is-ancestor',parent,head)==='','lost M278 authentic source ancestry');
 demand(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,head)===
  newPaths.map(p=>'A\0'+p+'\0').join(''),'modified protected source or missing research gate');
 for(const p of newPaths)
  demand(git('ls-tree',head,'--',p).startsWith('100644 blob '),'nonregular research path');
 for(const [p,blob] of Object.entries(pinned))
  demand(git('rev-parse',head+':'+p)===blob,'immutable model/worker/trace source drift: '+p);
 return {source:'PASS',originalWorkerPreserved:true,originalNativeArgsUnchanged:true,
  permanentNativeWebKitRepair:'UNPROVEN',familyAlpha:'HOLD'};
}
/** Numeric range math is intentionally observation-only; no WASM contents. */
export function assessPointerRange(pointer,length,liveBytes,heapViewBytes,optionsPointer){
 const num=v=>Number.isSafeInteger(v)&&v>=0&&v<=4_294_967_296?v:null;
 const start=num(pointer),bytes=num(length),live=num(liveBytes),view=num(heapViewBytes);
 const options=num(optionsPointer);
 const end=start!==null&&bytes!==null&&Number.isSafeInteger(start+bytes)&&start+bytes<=4_294_967_296?
  start+bytes:null;
 const within=(capacity)=>capacity===null||end===null||bytes===0||start===0?null:end<=capacity;
 return {
  modelPointer:start,modelLength:bytes,modelEnd:end,
  originalFP32ModelLengthMatches:bytes===null?null:bytes===expectedOriginalModelLength,
  liveLinearMemoryBytes:live,heapViewBytes:view,
  modelRangeWithinLiveMemory:within(live),
  modelRangeWithinHeapView:within(view),
  heapViewLagDetected:live===null||view===null?null:live!==view,
  sessionOptionsPointer:options,
  optionsPointerWithinLiveMemory:options===null||live===null||options===0?null:options<live
 };
}
function substituteOnce(source,needle,replacement){
 const pos=source.indexOf(needle);
 demand(pos>=0&&source.indexOf(needle,pos+needle.length)===-1,
  'ambiguous exact original instrumentation anchor');
 return source.slice(0,pos)+replacement+source.slice(pos+needle.length);
}
const extraGlue=[
 'function __ccM279Snapshot(K,args){',
 ' const mem=__ccNativeMemory?.buffer?.byteLength;',
 ' const heap=K?.HEAPU8?.buffer?.byteLength;',
 ' const number=x=>Number.isSafeInteger(x)&&x>=0&&x<=4294967296?x:null;',
 ' const p=number(args[0]),l=number(args[1]),o=number(args[2]);',
 ' const live=number(mem),view=number(heap),end=p===null||l===null?null:number(p+l);',
 ' const within=c=>c===null||end===null||p===0||l===0?null:end<=c;',
 ' return {argc:args.length,modelPointer:p,modelLength:l,modelEnd:end,',
 '  originalFP32ModelLengthMatches:l===null?null:l===15199746,',
 '  liveLinearMemoryBytes:live,heapViewBytes:view,',
 '  modelRangeWithinLiveMemory:within(live),modelRangeWithinHeapView:within(view),',
 '  heapViewLagDetected:live===null||view===null?null:live!==view,',
 '  sessionOptionsPointer:o,optionsPointerWithinLiveMemory:o===null||live===null||o===0?null:o<live};',
 '}',
 'function __ccM279WasmFrames(err){',
 ' try{',
 "  const text=typeof err?.stack==='string'?err.stack.slice(0,4000):'';",
 "  const all=[...text.matchAll(/wasm-function\\[(\\d{1,7})\\](?::(0x[0-9a-f]{1,10}))?/gi)];",
 '  return all.slice(0,6).map(m=>({functionIndex:Number(m[1]),offset:m[2]?parseInt(m[2],16):null}));',
 ' }catch{return [];}', 
 '}',
 'function __ccM279BoundWrap(native,K){',
 ' return function(...args){',
 '  const emit=(phase,snapshot,err)=>{',
 '   try{',
 '    const r={phase,...snapshot,...(err?{',
 '     exceptionClass:__ccClassify(err),wasmFunctionOffsets:__ccM279WasmFrames(err)',
 '    }: {})};',
 "    console.info('M279_NATIVE_MODEL_BOUNDS '+JSON.stringify(r));",
 '   }catch{}',
 '  };',
 '  emit("enter",__ccM279Snapshot(K,args),null);',
 '  try{',
 '   const original=Reflect.apply(native,this,args);',
 '   emit("return",__ccM279Snapshot(K,args),null);',
 '   return original;',
 '  }catch(err){',
 '   emit("throw",__ccM279Snapshot(K,args),err);',
 '   throw err;',
 '  }',
 ' };',
 '}'
].join('\n');

export function attachPointerObservation(originalM278Glue){
 let s=substituteOnce(originalM278Glue,'let __ccNativeMemory=null,',
  extraGlue+'\nlet __ccNativeMemory=null,');
 s=substituteOnce(s,'=__ccNativeWrap(K.Ma,"OrtCreateSession","handle",K))',
  '=__ccM279BoundWrap(__ccNativeWrap(K.Ma,"OrtCreateSession","handle",K),K))');
 return s;
}
export function instrument(name,bytes,endpoint){
 const source=m278Instrument(name,bytes,endpoint);
 return name==='ort-wasm-simd-threaded.jsep.mjs'?attachPointerObservation(source):source;
}
export function deriveM279(originalRunner,originalWorker){
 let s=deriveM278(originalRunner,originalWorker);
 const oldUrl=new URL('./m278-native-session-memory-class.mjs',import.meta.url).href;
 s=substituteOnce(s,'import { instrument } from '+JSON.stringify(oldUrl)+';',
  'import { instrument } from '+JSON.stringify(import.meta.url)+';');
 const check="line.startsWith('M278_NATIVE_SESSION_MEMORY '))&&line.length<700";
 s=substituteOnce(s,check,
  "line.startsWith('M278_NATIVE_SESSION_MEMORY ')||line.startsWith('M279_NATIVE_MODEL_BOUNDS '))&&line.length<1100");
 return s;
}
const parseReceipt=(line)=>{
 try{return JSON.parse(line.slice('M279_NATIVE_MODEL_BOUNDS '.length));}
 catch{throw Error('M279 invalid native pointer receipt JSON');}
};
export function adjudicateProcess(log,exit,metadata){
 const original=classifyRun(log,exit,metadata);
 demand(typeof log==='string'&&log.length>0&&log.length<3_000_000,'unbounded browser output');
 const rows=log.split(/\r?\n/).filter(l=>l.startsWith('M279_NATIVE_MODEL_BOUNDS ')).map(parseReceipt);
 const first=rows.filter(r=>r.phase==='enter'),results=rows.filter(r=>r.phase==='return'||r.phase==='throw');
 demand(first.length<=1&&results.length<=1&&rows.length<=2,'duplicate or forged native ABI events');
 const entry=first[0]||null,exitRow=results[0]||null;
 if(entry){
  demand(entry.argc===3,'unexpected native ABI argument count');
  for(const name of ['modelPointer','modelLength','modelEnd','liveLinearMemoryBytes','heapViewBytes','sessionOptionsPointer'])
   demand(entry[name]===null||Number.isSafeInteger(entry[name])&&entry[name]>=0,'invalid scalar '+name);
  // On a TRUE RED preserve unexpected pointer/length/bounds numerically.
  // Only a positive model/owner result is eligible for an in-bounds assertion.
  demand(entry.modelEnd===null||entry.modelPointer===null||entry.modelLength===null||
   entry.modelEnd===entry.modelPointer+entry.modelLength,'inconsistent native pointer arithmetic');
 }
 if(exitRow){
  demand(entry!==null,'missing native entry witness');
  demand(exitRow.argc===3&&exitRow.modelPointer===entry.modelPointer&&
   exitRow.modelLength===entry.modelLength&&exitRow.modelEnd===entry.modelEnd,
   'original native input mutated during session');
  // A genuine OOB native failure MUST remain readable as evidence, not
  // silently lost behind an over-strict positive-path receipt validator.
  demand(exitRow.phase==='throw'||exitRow.phase==='return','invalid native outcome');
  if(exitRow.phase==='throw'){
   demand(Array.isArray(exitRow.wasmFunctionOffsets)&&exitRow.wasmFunctionOffsets.length<=6&&
    exitRow.wasmFunctionOffsets.every(p=>Number.isInteger(p.functionIndex)&&p.functionIndex>=0&&
     (p.offset===null||Number.isInteger(p.offset)&&p.offset>=0)),'unsafe native stack offset');
  }
 }
 if(original.originalModelPositive){
  demand(entry&&exitRow?.phase==='return'&&entry.modelPointer>0&&
   entry.modelEnd===entry.modelPointer+entry.modelLength&&
   entry.originalFP32ModelLengthMatches===true&&
   entry.modelLength===expectedOriginalModelLength&&
   entry.modelRangeWithinLiveMemory===true&&
   entry.modelRangeWithinHeapView!==false&&
   exitRow.modelRangeWithinLiveMemory===true,'invented real original native model positive');
 }
 if(original.nativeSessionThrew)
  demand(exitRow===null||exitRow.phase==='throw','original native throw relabeled successful');
 const thrown=exitRow?.phase==='throw';
 demand(!(original.originalModelPositive&&thrown),'native original failure promoted green');
 return {
  schema:'MAIN1054_M279_ORIGINAL_NATIVE_POINTER_BOUNDS_V1',
  ...metadata,
  originalExit:exit,originalJourneyPositive:original.originalModelPositive,
  originalRealRed:exit!==0,originalOrtCreateSessionThrew:original.nativeSessionThrew,
  modelPointer:entry?.modelPointer??null,
  modelLength:entry?.modelLength??null,modelEnd:entry?.modelEnd??null,
  originalFP32LengthVerified:entry?.originalFP32ModelLengthMatches??false,
  heapBytesAtEntry:entry?.liveLinearMemoryBytes??null,
  heapBytesAtTerminal:exitRow?.liveLinearMemoryBytes??null,
  heapViewBytesAtEntry:entry?.heapViewBytes??null,
  heapViewBytesAtTerminal:exitRow?.heapViewBytes??null,
  entryRangeWithinHeap:entry?.modelRangeWithinLiveMemory??null,
  exitRangeWithinHeap:exitRow?.modelRangeWithinLiveMemory??null,
  heapViewLagAtEntry:entry?.heapViewLagDetected??null,
  heapViewLagAtTerminal:exitRow?.heapViewLagDetected??null,
  sessionOptionsPointer:entry?.sessionOptionsPointer??null,
  optionsPointerWithinHeap:entry?.optionsPointerWithinLiveMemory??null,
  nativeErrorClass:thrown?exitRow.exceptionClass:null,
  nativeFunctionOffsets:thrown?exitRow.wasmFunctionOffsets:[],
  nativeErrorPointerRootCauseProven:false,
  nativeCausalFixProven:false,
  originalModelWeightShaDirectlyVerified:false,
  releaseAllowed:false,familyAlpha:'HOLD'
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],{encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
    sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  if(process.argv[2]==='prepare'){
   writeFileSync('scripts/.cc-m279-original-pointer-abi.mjs',deriveM279(
    readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8'),
    readFileSync('public/outfit-worker-p94.mjs','utf8')),{flag:'wx'});
   console.log('M279_EXACT_ORIGINAL_ONNX_NATIVE_POINTER_PROBE_READY');
  }else if(process.argv[2]==='receipt'){
   const output=adjudicateProcess(readFileSync(process.argv[3],'utf8'),Number(process.argv[4]),{
    engine:process.env.M58_ENGINE,width:Number(process.env.P94_WIDTH),
    shard:Number(process.env.M279_SHARD),ordinal:Number(process.env.M279_ORDINAL)
   });
   console.log('M279_NATIVE_MODEL_POINTER_BOUND_RECEIPT '+JSON.stringify(output));
  }else throw Error('expected prepare or receipt');
 }catch(error){
  console.error('M279_FAIL_CLOSED',String(error.message||error).slice(0,180));
  process.exitCode=1;
 }
}
