/**
 * M285 original model-copy Uint8Array view and native WASM heap attribution.
 * Test-only, single disposable original Worker. NEVER changes model bytes,
 * original native arguments, returned statuses, owner/session protection, or
 * native error handling. A stale view after memory grows is NOT root cause proof.
 */
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {instrument as m283Instrument,deriveM283,assessProcess as m283Assess}
 from './m283-real-jsep-instantiation.mjs';

export const parent='5290fa4778bb4d80a85455b6066643cf8f49d33d';
export const branch='refs/heads/research/main1054-m285-original-heap-view-witness-HOLD';
export const added=[
 '.github/workflows/main1054-m285-original-heap-view-no-deploy.yml',
 'research/main1054/m285-original-heap-view-witness.mjs',
 'tests/main1054-m285-original-heap-view-witness.test.mjs'
];
const protectedPins={
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11',
 'research/main1054/m283-real-jsep-instantiation.mjs':'6c4ad406643871851c9c21e6b324d67ef9d992a9',
 'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41'
};
const insist=(ok,msg)=>{if(!ok)throw Error('M285 BLOCKED: '+msg);};
export function sourceGate(git,e){
 insist(e?.name==='push'&&e.ref===branch&&e.attempt==='1','unexpected branch/event/rerun');
 insist(/^[0-9a-f]{40}$/.test(e.sha||'')&&git('rev-parse','HEAD')===e.sha,'wrong source head');
 insist(git('merge-base','--is-ancestor',parent,e.sha)==='','unverified native parent');
 insist(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,e.sha)===
  added.map(p=>'A\0'+p+'\0').join(''),'unexpected original/source changes');
 for(const p of added)
  insist(git('ls-tree',e.sha,'--',p).startsWith('100644 blob '),'unsafe additional path');
 for(const [p,sha] of Object.entries(protectedPins))
  insist(git('rev-parse',e.sha+':'+p)===sha,'protected original source drift: '+p);
 return {source:'PASS',originalRuntimeModified:false,
  originalOwnerControlsModified:false,nativeCausalFixProven:false,familyAlpha:'HOLD'};
}
function replaceExactlyOnce(s,needle,next){
 const p=s.indexOf(needle);
 insist(p>=0&&s.indexOf(needle,p+needle.length)===-1,'ambiguous native-only source anchor');
 return s.slice(0,p)+next+s.slice(p+needle.length);
}
// Capture only original model-copy target BUFFER REFERENCE, never source/model
// bytes. Original typed-array set executes with precisely its own receiver/args.
export const originalModelCopyObserver=`
const __ccM285Copy=(function(){
 const oldSet=Uint8Array.prototype.set;
 const state={count:0,buffer:null,offset:null,targetBytesAtCopy:null};
 Uint8Array.prototype.set=function(...args){
  const source=args[0],offset=args[1]===undefined?0:args[1];
  let interested=false;
  try{interested=source?.byteLength===15199746 &&
    Number.isSafeInteger(offset)&&offset>=0&&
    this instanceof Uint8Array;}catch{}
  const original=Reflect.apply(oldSet,this,args);
  if(interested){
   try{
    state.count++;
    if(state.count<=3){
     state.buffer=this.buffer;state.offset=offset;
     state.targetBytesAtCopy=this.buffer?.byteLength??null;
    }
   }catch{}
  }
  return original;
 };
 return state;
})();
function __ccM285Snapshot(phase,args){
 const copy=__ccM285Copy;
 const live=typeof __ccNativeMemory!=='undefined'?__ccNativeMemory:null;
 const capacity=live?.buffer?.byteLength??null;
 const atCopy=copy.buffer?.byteLength??null;
 const start=args?.[0];
 const copyOffsetMatchesPointer=copy.count===0||!Number.isSafeInteger(start)?
  null:copy.offset===start;
 return {phase,
  copyCount:copy.count,
  expectedOriginalModelByteLength:15199746,
  capturedOffset:copy.offset,
  originalModelPointer:Number.isSafeInteger(start)?start:null,
  copyOffsetMatchesPointer,
  targetBytesAtCopy:copy.targetBytesAtCopy,
  targetBytesAtNativePhase:copy.count?atCopy:null,
  liveWasmBytes:capacity,
  targetIsLiveWasmBuffer:copy.count&&live?
    copy.buffer===live.buffer:null,
  originalWasmTrapInstructionOffset:null,
  causalFixProven:false};
}
function __ccM285Emit(phase,args){
 try{console.info('M285_ORIGINAL_MODEL_COPY_VIEW '+
  JSON.stringify(__ccM285Snapshot(phase,args)));}catch{}
}
`;
export function instrument(name,bytes,endpoint){
 let text=m283Instrument(name,bytes,endpoint);
 if(name!=='ort-wasm-simd-threaded.jsep.mjs')return text;
 text=originalModelCopyObserver+'\n'+text;
 text=replaceExactlyOnce(text,'  emit("enter",__ccM279Snapshot(K,args),null);',
  '  emit("enter",__ccM279Snapshot(K,args),null);\n  __ccM285Emit("enter",args);');
 text=replaceExactlyOnce(text,'   emit("return",__ccM279Snapshot(K,args),null);',
  '   emit("return",__ccM279Snapshot(K,args),null);\n   __ccM285Emit("return",args);');
 text=replaceExactlyOnce(text,'   emit("throw",__ccM279Snapshot(K,args),err);',
  '   emit("throw",__ccM279Snapshot(K,args),err);\n   __ccM285Emit("throw",args);');
 return text;
}
export function deriveM285(browser,worker){
 let s=deriveM283(browser,worker);
 const oldUrl=new URL('./m283-real-jsep-instantiation.mjs',import.meta.url).href;
 s=replaceExactlyOnce(s,'import { instrument } from '+JSON.stringify(oldUrl)+';',
  'import { instrument } from '+JSON.stringify(import.meta.url)+';');
 const old="line.startsWith('M283_NATIVE_WASM_SHA '))&&line.length<1100";
 const next="line.startsWith('M283_NATIVE_WASM_SHA ')||line.startsWith('M285_ORIGINAL_MODEL_COPY_VIEW '))&&line.length<1400";
 return replaceExactlyOnce(s,old,next);
}
export function classifyCopyViews(rows){
 insist(Array.isArray(rows)&&rows.length<=2,'unbounded view receipts');
 const phases=rows.map(r=>r?.phase);
 insist(rows.length===0||rows.length===2&&phases[0]==='enter'&&
  ['return','throw'].includes(phases[1]),'missing or inconsistent native start/end');
 for(const r of rows){
  insist(Number.isSafeInteger(r.copyCount)&&r.copyCount>=0&&r.copyCount<=3,'invalid copy count');
  insist(r.expectedOriginalModelByteLength===15199746,'original fp32 source size drift');
  for(const p of ['capturedOffset','originalModelPointer','targetBytesAtCopy',
   'targetBytesAtNativePhase','liveWasmBytes'])
   insist(r[p]===null||Number.isSafeInteger(r[p])&&r[p]>=0&&r[p]<=4294967296,
    'invalid scalar '+p);
  for(const p of ['copyOffsetMatchesPointer','targetIsLiveWasmBuffer'])
   insist(r[p]===null||typeof r[p]==='boolean','invalid tri-state '+p);
  insist(r.originalWasmTrapInstructionOffset===null&&r.causalFixProven===false,
   'fabricated native fault or patch proof');
  if(r.copyCount===0)
   insist(r.capturedOffset===null&&r.copyOffsetMatchesPointer===null&&
    r.targetIsLiveWasmBuffer===null,'fabricated missing model copy');
  if(r.copyCount>0)
   insist(r.capturedOffset!==null&&r.targetBytesAtCopy!==null,
    'missing captured actual model copy');
 }
 const entry=rows[0]||null,terminal=rows[1]||null;
 if(entry&&terminal){
  insist(entry.copyCount===terminal.copyCount&&
   entry.capturedOffset===terminal.capturedOffset&&
   entry.originalModelPointer===terminal.originalModelPointer,
   'original model copy changed across native invocation');
 }
 const copyAtOriginalPointer=entry?.copyCount===1&&
  entry.copyOffsetMatchesPointer===true&&
  entry.capturedOffset===entry.originalModelPointer;
 const entryLive=entry?.targetIsLiveWasmBuffer===true&&
  Number.isInteger(entry.liveWasmBytes)&&entry.liveWasmBytes>0;
 const terminalDetached=terminal?.targetBytesAtNativePhase===0;
 return {observedTwoPhases:rows.length===2,
  originalModelCopyProven:copyAtOriginalPointer&&entryLive,
  copiedHeapViewCurrentAtNativeEntry:entry?.targetIsLiveWasmBuffer??null,
  copiedHeapViewCurrentAtNativeTerminal:terminal?.targetIsLiveWasmBuffer??null,
  copyBufferDetachedAtNativeTerminal:terminal?terminalDetached:null,
  modelCopyCount:entry?.copyCount??0,
  nativeTerminalPhase:terminal?.phase??null,
  nativeTrapOffset:null,causalFixProven:false};
}
export function assessProcess(log,exit,metadata){
 const original=m283Assess(log,exit,metadata);
 insist(typeof log==='string'&&log.length>0&&log.length<3000000,'unbounded original logs');
 const prefix='M285_ORIGINAL_MODEL_COPY_VIEW ';
 const rows=log.split(/\r?\n/).filter(s=>s.startsWith(prefix)).map(s=>{
  try{return JSON.parse(s.slice(prefix.length));}catch{
   throw Error('M285 BLOCKED: malformed view receipt');
  }
 });
 const check=classifyCopyViews(rows);
 // Native original REDs never become success due to missing diagnostic fields.
 const originalRed=exit!==0||original.originalOrtCreateSessionThrew;
 const diagnosticVerdict=originalRed?'GENUINE_ORIGINAL_RED_PRESERVED':
  original.originalPositive&&original.exactSourceBinaryInstantiatedSameWorker&&
  check.originalModelCopyProven&&check.nativeTerminalPhase==='return'?
   'ORIGINAL_MODEL_COPY_AND_BINARY_ATTESTED':'ORIGINAL_DIAGNOSTIC_BLOCKED';
 return {schema:'M285_ORIGINAL_NATIVE_MODEL_COPY_VIEW_V1',
  ...metadata,originalExit:exit,originalJourneyPositive:original.originalPositive,
  actualNativeSessionThrown:original.originalOrtCreateSessionThrew,
  nativeErrorClass:original.originalErrorClass,
  sameWorkerOriginalJsepSHAProven:original.exactSourceBinaryInstantiatedSameWorker,
  expectedCanonicalJsepSHA:original.sourcePinnedRuntimeSHA256,
  ...check,diagnosticVerdict,
  nativeRootCauseProven:false,originalTrapInstructionOffset:null,
  originalCxxFaultLine:null,nativeCausalFixProven:false,releaseAllowed:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...a)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...a],
   {encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  if(process.argv[2]==='prepare'){
   writeFileSync('scripts/.cc-m285-original-copy-view.mjs',deriveM285(
    readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8'),
    readFileSync('public/outfit-worker-p94.mjs','utf8')),{flag:'wx'});
   console.log('M285_EXACT_ORIGINAL_VIEW_OBSERVER_READY');
  }else if(process.argv[2]==='receipt'){
   const receipt=assessProcess(readFileSync(process.argv[3],'utf8'),Number(process.argv[4]),{
    engine:process.env.M58_ENGINE,width:Number(process.env.P94_WIDTH),
    ordinal:Number(process.env.M285_ORDINAL)});
   console.log('M285_ORIGINAL_COPY_VIEW_RECEIPT '+JSON.stringify(receipt));
   if(receipt.diagnosticVerdict!=='ORIGINAL_MODEL_COPY_AND_BINARY_ATTESTED')
    process.exitCode=1;
  }else throw Error('only prepare/receipt commands supported');
 }catch(e){console.error('M285_EVIDENCE_BLOCKED '+String(e.message||e).slice(0,240));process.exitCode=1;}
}
