/**
 * M279: native ABI pointer/length and linear-memory bounds witness.
 * Additive disposable-JS observer. Never changes installed model, native WASM,
 * application Worker, original photo, owner consent, or an actual error.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {instrument as typedInstrument} from './m278-native-session-memory-class.mjs';
import {deriveNativeTrace} from './original-ort-native-trace.mjs';

export const parent='98256ab6da8e9b01253c62d785f81cc9307cb05c';
export const branch='refs/heads/research/main1054-m279-native-pointer-bounds-HOLD';
export const added=[
 '.github/workflows/main1054-m279-native-pointer-bounds-no-deploy.yml',
 'research/main1054/m279-native-pointer-bounds.mjs',
 'tests/main1054-m279-native-pointer-bounds.test.mjs'
];
export const originalPins={
 'research/main1054/original-ort-native-trace.mjs':'08c9ea893ee12606073fc7c1d07dee37344d538c',
 'research/main1054/m278-native-session-memory-class.mjs':'8c8ac5a2eae233778a805063eba57dce22e1c386',
 'research/main1054/m269-webkit-graph-optimization-runtime-ab.mjs':'20e903003c733d7d5620cc08790f87f25f1e1ff9',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41'
};
const requireTrue=(v,msg)=>{if(!v)throw Error('M279 fail-closed: '+msg);};
function replaceOnce(source,needle,replacement){
 const n=source.indexOf(needle);
 requireTrue(n>=0&&source.indexOf(needle,n+needle.length)<0,'missing/ambiguous source anchor');
 return source.slice(0,n)+replacement+source.slice(n+needle.length);
}
export function sourceGate(git,event){
 requireTrue(event?.name==='push'&&event.ref===branch,'wrong event/branch');
 requireTrue(event.attempt==='1','retry is not first-attempt evidence');
 requireTrue(/^[0-9a-f]{40}$/.test(event.sha||''),'invalid SHA');
 requireTrue(git('rev-parse','HEAD')===event.sha,'wrong checkout');
 requireTrue(git('merge-base','--is-ancestor',parent,event.sha)==='','wrong ancestry');
 requireTrue(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,event.sha)===
  added.map(x=>'A\0'+x+'\0').join(''),'original code changed or unexpected path');
 for(const path of added)requireTrue(git('ls-tree',event.sha,'--',path).startsWith('100644 blob '),'unsafe file mode');
 for(const [p,sha] of Object.entries(originalPins))
  requireTrue(git('rev-parse',event.sha+':'+p)===sha,'original protected blob changed '+p);
 return {originalWorker:'UNCHANGED',model:'ORIGINAL',wasm:'ORIGINAL',
  derivedObserverOnly:true,permanentRepair:'NOT_PROVEN',familyAlpha:'HOLD'};
}
export function abiSnapshot(rawArgs,memoryBytes,heapViewBytes=null){
 const args=Array.isArray(rawArgs)?rawArgs:[];
 const normalize=n=>Number.isInteger(n)&&n>=-2147483648&&n<=4294967295?n>>>0:null;
 const pointer=normalize(args[0]), length=normalize(args[1]);
 const optionHandle=normalize(args[2]);
 const memory=Number.isSafeInteger(memoryBytes)&&memoryBytes>=0&&memoryBytes<=4294967296?memoryBytes:null;
 const view=Number.isSafeInteger(heapViewBytes)&&heapViewBytes>=0&&heapViewBytes<=4294967296?heapViewBytes:null;
 const end=pointer!==null&&length!==null?pointer+length:null;
 const valid=memory===null||end===null?null:
  pointer>0&&length>0&&length<=memory&&pointer<=memory-length;
 return {nativeArgumentCount:args.length,modelPointer: pointer,modelLengthBytes:length,
  modelEndExclusive:end,sessionOptionsHandlePresent:optionHandle!==null&&optionHandle!==0,
  linearMemoryBytes:memory,heapViewBytes:view,modelRangeInLinearMemory:valid,
  heapViewStale:memory!==null&&view!==null?view<memory:null};
}
export function numericNativeFrame(stack){
 if(typeof stack!=='string')return {functionIndex:null,wasmOffset:null};
 const match=/wasm-function\[(\d{1,8})\](?::0x([0-9a-f]{1,12}))?/i.exec(stack);
 if(!match)return {functionIndex:null,wasmOffset:null};
 const fn=Number(match[1]), off=match[2]?parseInt(match[2],16):null;
 return {functionIndex:fn<=10000000?fn:null,
  wasmOffset:off!==null&&Number.isSafeInteger(off)&&off>=0&&off<4294967296?off:null};
}
export function instrument(name,bytes,endpoint){
 let source=typedInstrument(name,bytes,endpoint);
 if(name!=='ort-wasm-simd-threaded.jsep.mjs')return source;
 // The original source-verified #1490 wrapper exposes exact K.Ma. M278 supplied
 // the real read-only WebAssembly.Memory handle, never model buffer bytes.
 const helpers=[
  'const __ccM279Snap='+abiSnapshot.toString()+';',
  'const __ccM279Frame='+numericNativeFrame.toString()+';',
  'function __ccM279Read(args,module){',
  ' try{',
  '  const memory=__ccNativeMemory?.buffer||null;',
  '  const view=module?.HEAPU8?.buffer||module?.HEAP8?.buffer||null;',
  '  return __ccM279Snap(args,memory?.byteLength??view?.byteLength??null,view?.byteLength??null);',
  ' }catch{return __ccM279Snap(args,null,null);}',
  '}'
 ].join('\n');
 source=replaceOnce(source,'function __ccNativeWrap(native,operation,kind,module){',
  helpers+'\nfunction __ccNativeWrap(native,operation,kind,module){');
 source=replaceOnce(source,
  "  const before=operation==='OrtCreateSession'?__ccPages(module):null;",
  "  const __ccM279Entry=operation==='OrtCreateSession'?__ccM279Read(args,module):null;\n"+
  "  const before=operation==='OrtCreateSession'?__ccPages(module):null;");
 source=replaceOnce(source,
  "   if(operation==='OrtCreateSession')console.info('M278_NATIVE_SESSION_MEMORY '",
  "   if(operation==='OrtCreateSession')console.info('M279_NATIVE_ABI '+JSON.stringify({phase:'return',entry:__ccM279Entry,exit:__ccM279Read(args,module),frame:{functionIndex:null,wasmOffset:null}}));\n"+
  "   if(operation==='OrtCreateSession')console.info('M278_NATIVE_SESSION_MEMORY '");
 source=replaceOnce(source,
  "   if(operation==='OrtCreateSession')console.info('M278_NATIVE_SESSION_THROW '",
  "   if(operation==='OrtCreateSession')console.info('M279_NATIVE_ABI '+JSON.stringify({phase:'throw',entry:__ccM279Entry,exit:__ccM279Read(args,module),frame:__ccM279Frame(error?.stack)}));\n"+
  "   if(operation==='OrtCreateSession')console.info('M278_NATIVE_SESSION_THROW '");
 return source;
}
export function deriveM279(originalBrowser,originalWorker){
 let source=deriveNativeTrace(originalBrowser,originalWorker,'baseline',import.meta.url);
 source=replaceOnce(source,' const page=await context.newPage();',
  " const page=await context.newPage();\n"+
  " context.on('console',message=>{\n"+
  "  const line=message.text();\n"+
  "  if((line.startsWith('M279_NATIVE_ABI ')||line.startsWith('M278_NATIVE_SESSION_THROW ')||line.startsWith('M278_NATIVE_SESSION_MEMORY '))&&line.length<1200)console.log(line);\n"+
  " });");
 return source;
}
const mark='M279_NATIVE_ABI ';
const nativeMark='CC_NATIVE_ORT_TRACE ';
export function classifyRun(log,exit,{engine,width,ordinal}){
 requireTrue(['webkit','chromium'].includes(engine)&&[320,390,430].includes(width)&&
  Number.isInteger(ordinal)&&ordinal>=1&&ordinal<=32,'bad cohort identity');
 requireTrue(typeof log==='string'&&log.length>0&&log.length<3000000,'bad bounded log');
 const lines=log.split(/\r?\n/);
 const markers=lines.filter(s=>s.startsWith(mark));
 requireTrue(markers.length<=1,'duplicate ABI receipts');
 const trace=lines.filter(s=>s.startsWith(nativeMark)).map(s=>JSON.parse(s.slice(nativeMark.length)))
  .filter(s=>s.asset==='ort-wasm-simd-threaded.jsep.mjs'&&s.operation==='OrtCreateSession');
 const enters=trace.filter(s=>s.phase==='enter');
 const returns=trace.filter(s=>s.phase==='return');
 const throws=trace.filter(s=>s.phase==='throw');
 requireTrue(enters.length<=1&&returns.length+throws.length<=1,'multiple native sessions');
 const invoked=enters.length===1;
 const terminal=returns.length===1?'return':throws.length===1?'throw':null;
 requireTrue(!invoked||markers.length===1,'native ABI evidence missing');
 requireTrue(!markers.length||invoked&&terminal,'unattributed native ABI marker');
 const originalPass=exit===0&&lines.some(s=>s.startsWith('P91_FULL_JOURNEY_PASS '))&&
   lines.some(s=>s.startsWith(nativeMark)&&s.includes('"operation":"OrtRun"')&&s.includes('"phase":"return"')&&s.includes('"value":0'));
 requireTrue(!(originalPass&&throws.length),'native THROW cannot be reclassified PASS');
 let receipt=null;
 if(markers.length){
  receipt=JSON.parse(markers[0].slice(mark.length));
  requireTrue(receipt.phase===terminal&&['throw','return'].includes(receipt.phase),'ABI phase mismatch');
  for(const state of ['entry','exit']){
   const s=receipt[state];
   requireTrue(s&&s.nativeArgumentCount===3&&
    Number.isInteger(s.modelPointer)&&s.modelPointer>=0&&s.modelPointer<=4294967295&&
    Number.isInteger(s.modelLengthBytes)&&s.modelLengthBytes>0&&s.modelLengthBytes<=4294967295&&
    s.modelEndExclusive===s.modelPointer+s.modelLengthBytes&&
    typeof s.sessionOptionsHandlePresent==='boolean'&&
    (s.linearMemoryBytes===null||Number.isInteger(s.linearMemoryBytes)&&s.linearMemoryBytes>=0&&s.linearMemoryBytes<=4294967296)&&
    (s.heapViewBytes===null||Number.isInteger(s.heapViewBytes)&&s.heapViewBytes>=0&&s.heapViewBytes<=4294967296)&&
    (s.modelRangeInLinearMemory===null||typeof s.modelRangeInLinearMemory==='boolean')&&
    (s.heapViewStale===null||typeof s.heapViewStale==='boolean'),'invalid native ABI bounds');
   requireTrue(JSON.stringify(s)===JSON.stringify(abiSnapshot(
    [s.modelPointer,s.modelLengthBytes,s.sessionOptionsHandlePresent?1:0],
    s.linearMemoryBytes,s.heapViewBytes)),'forged/inconsistent native memory bounds');
  }
  requireTrue(receipt.entry.modelPointer===receipt.exit.modelPointer&&
   receipt.entry.modelLengthBytes===receipt.exit.modelLengthBytes,
   'model pointer/length changed while inside native');
  const f=receipt.frame;
  requireTrue(f&&
   (f.functionIndex===null||Number.isInteger(f.functionIndex)&&f.functionIndex>=0&&f.functionIndex<=10000000)&&
   (f.wasmOffset===null||Number.isInteger(f.wasmOffset)&&f.wasmOffset>=0&&f.wasmOffset<4294967296)&&
   (terminal==='throw'||f.functionIndex===null&&f.wasmOffset===null),'invalid WASM function frame');
 }
 return {schema:'M279_NATIVE_POINTER_BOUND_V1',engine,width,ordinal,exitCode:exit,
  originalPositive:originalPass,originalFailure:exit!==0,
  ortCreateSessionEntered:invoked,ortCreateSessionOutcome:terminal||'UNOBSERVED',
  pointer:receipt?.entry.modelPointer??null,length:receipt?.entry.modelLengthBytes??null,
  modelEndExclusive:receipt?.entry.modelEndExclusive??null,
  bytesAtEntry:receipt?.entry.linearMemoryBytes??null,
  bytesAtExit:receipt?.exit.linearMemoryBytes??null,
  inBoundsAtEntry:receipt?.entry.modelRangeInLinearMemory??null,
  inBoundsAtExit:receipt?.exit.modelRangeInLinearMemory??null,
  staleHeapViewAtExit:receipt?.exit.heapViewStale??null,
  nativeFunctionIndex:receipt?.frame.functionIndex??null,
  wasmInstructionOffset:receipt?.frame.wasmOffset??null,
  failingNativeInstructionProven:terminal==='throw'&&receipt?.frame.wasmOffset!==null,
  causalRepairProven:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],
  {encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  if(process.argv[2]==='prepare'){
   writeFileSync('scripts/.cc-m279-native-bounds.mjs',deriveM279(
    readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8'),
    readFileSync('public/outfit-worker-p94.mjs','utf8')),{flag:'wx'});
   console.log('M279_DISPOSABLE_NATIVE_POINTER_PROBE_PREPARED');
  }else if(process.argv[2]==='receipt'){
   const r=classifyRun(readFileSync(process.argv[3],'utf8'),Number(process.argv[4]),{
    engine:process.env.M58_ENGINE,width:Number(process.env.P94_WIDTH),
    ordinal:Number(process.env.M279_ORDINAL)});
   console.log('M279_ORIGINAL_NATIVE_BOUND_RECEIPT '+JSON.stringify(r));
  }else throw Error('expected prepare or receipt');
 }catch(e){
  console.error('M279_RESEARCH_BLOCKED',String(e.message||e).slice(0,175));
  process.exitCode=2;
 }
}