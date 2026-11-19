/**
 * M278: typed native OrtCreateSession error/heap witness on frozen #1490 trace.
 * Only disposable test glue is instrumented; original app Worker, model,
 * WASM bytes and positive owner/backup assertions stay unchanged.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {instrument as originalInstrument,deriveNativeTrace} from './original-ort-native-trace.mjs';
export const parent='d3fabd1e5a576271190781830f9e2f1819ef1be0';
export const branch='refs/heads/research/main1054-m278-native-session-memory-class-HOLD';
export const added=[
 '.github/workflows/main1054-m278-native-session-memory-no-deploy.yml',
 'research/main1054/m278-native-session-memory-class.mjs',
 'tests/main1054-m278-native-session-memory-class.test.mjs'
];
export const pins={
 'research/main1054/original-ort-native-trace.mjs':'08c9ea893ee12606073fc7c1d07dee37344d538c',
 'research/main1054/m269-webkit-graph-optimization-runtime-ab.mjs':'20e903003c733d7d5620cc08790f87f25f1e1ff9',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41'
};
const ensure=(b,s)=>{if(!b)throw Error('M278 fail-closed: '+s);};
export function sourceGate(git,e){
 ensure(e?.name==='push'&&e.ref===branch,'bad event/branch');
 ensure(e.attempt==='1','rerun not accepted');
 ensure(/^[0-9a-f]{40}$/.test(e.sha||''),'invalid source SHA');
 const head=git('rev-parse','HEAD');
 ensure(head===e.sha,'source checkout mismatch');
 ensure(git('merge-base','--is-ancestor',parent,head)==='','source ancestry rejected');
 ensure(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,head)===
  added.map(p=>'A\0'+p+'\0').join(''),'unexpected changed original source');
 for(const p of added)ensure(git('ls-tree',head,'--',p).startsWith('100644 blob '),'unsafe new path mode');
 for(const [p,sha] of Object.entries(pins))
  ensure(git('rev-parse',head+':'+p)===sha,'original Worker/trace source changed '+p);
 return {source:'PASS',nativeCodeModified:false,originalPositiveAssertions:'UNCHANGED',
  permanentWebKitFix:'UNPROVEN',familyAlpha:'HOLD'};
}
export function classifyNativeError(error){
 const s=String(error?.message||'').slice(0,1000).toLowerCase();
 if(/memory access out of bounds|out of bounds memory|memory access/.test(s))return 'wasm-bounds';
 if(/out of memory|failed to allocate|allocation failed|cannot enlarge memory/.test(s))return 'oom-or-alloc';
 if(/unreachable|abort|assertion failed/.test(s))return 'abort';
 if(error instanceof WebAssembly.RuntimeError)return 'wasm-runtime-other';
 if(error instanceof TypeError)return 'js-type';
 return 'other';
}
export function pages(bytes){
 return bytes===null?null:
  Number.isInteger(bytes)&&bytes>=0&&bytes<=4_294_967_296&&bytes%65536===0?
  bytes/65536:null;
}
function replaceOnce(s,needle,replacement){
 const i=s.indexOf(needle);
 ensure(i>=0&&s.indexOf(needle,i+needle.length)<0,'ambiguous source anchor');
 return s.slice(0,i)+replacement+s.slice(i+needle.length);
}
export function instrument(name,bytes,endpoint){
 let source=originalInstrument(name,bytes,endpoint);
 if(name!=='ort-wasm-simd-threaded.jsep.mjs')return source;
 const helpers=[
  'let __ccNativeMemory=null,__ccNativeGrowCount=0;',
  'const __ccNativeOriginalGrow=WebAssembly.Memory.prototype.grow;',
  'WebAssembly.Memory.prototype.grow=function(delta){',
  ' __ccNativeMemory=this;__ccNativeGrowCount++;',
  ' return Reflect.apply(__ccNativeOriginalGrow,this,[delta]);',
  '};',
  'const __ccClassify='+classifyNativeError.toString()+';',
  'function __ccPages(module){',
  ' try{',
  '  const buffer=__ccNativeMemory?.buffer||module?.HEAPU8?.buffer||module?.HEAP8?.buffer||null;',
  '  const n=buffer?.byteLength;',
  '  return Number.isInteger(n)&&n>=0&&n<=4294967296&&n%65536===0?n/65536:null;',
  ' }catch{return null;}',
  '}'
 ].join('\n');
 source=replaceOnce(source,'let __ccNativeSeq=0;',helpers+'\nlet __ccNativeSeq=0;');
 source=replaceOnce(source,'function __ccNativeWrap(native,operation,kind){',
  'function __ccNativeWrap(native,operation,kind,module){');
 source=replaceOnce(source,"  emit('enter',null);\n  try{",
  "  const before=operation==='OrtCreateSession'?__ccPages(module):null;\n"+
  "  const growsBefore=__ccNativeGrowCount;\n"+
  "  emit('enter',null);\n  try{");
 source=replaceOnce(source,'   return result;\n  }catch(error){',
  "   if(operation==='OrtCreateSession')console.info('M278_NATIVE_SESSION_MEMORY '+JSON.stringify({"+
  "beforePages:before,afterPages:__ccPages(module),visibleGrows:__ccNativeGrowCount-growsBefore}));\n"+
  '   return result;\n  }catch(error){');
 source=replaceOnce(source,"   emit('throw',frames);",
  "   if(operation==='OrtCreateSession')console.info('M278_NATIVE_SESSION_THROW '+JSON.stringify({"+
  "kind:__ccClassify(error),wasmRuntime:error instanceof WebAssembly.RuntimeError,"+
  "beforePages:before,afterPages:__ccPages(module),visibleGrows:__ccNativeGrowCount-growsBefore,"+
  "wasmFrames:frames.length}));\n   emit('throw',frames);");
 source=replaceOnce(source,'=__ccNativeWrap(K.Ma,"OrtCreateSession","handle"))',
  '=__ccNativeWrap(K.Ma,"OrtCreateSession","handle",K))');
 return source;
}
export function deriveM278(originalRunner,originalWorker){
 let s=deriveNativeTrace(originalRunner,originalWorker,'baseline',import.meta.url);
 s=replaceOnce(s,' const page=await context.newPage();',
  " const page=await context.newPage();\n"+
  " context.on('console',message=>{\n"+
  "  const line=message.text();\n"+
  "  if((line.startsWith('M278_NATIVE_SESSION_THROW ')||line.startsWith('M278_NATIVE_SESSION_MEMORY '))&&"+
  "line.length<700)console.log(line);\n"+
  " });");
 return s;
}
export function classifyRun(log,exit,{engine,width,ordinal}){
 ensure(['webkit','chromium'].includes(engine)&&[320,390,430].includes(width)&&
  Number.isInteger(ordinal)&&ordinal>=1&&ordinal<=16,'invalid browser identity');
 ensure(typeof log==='string'&&log.length>0&&log.length<3000000,'invalid bounded native log');
 const lines=log.split(/\r?\n/);
 const trace=lines.filter(x=>x.startsWith('CC_NATIVE_ORT_TRACE ')).map(x=>JSON.parse(x.slice(20)));
 const get=(prefix)=>lines.filter(x=>x.startsWith(prefix+' ')).map(x=>JSON.parse(x.slice(prefix.length+1)));
 const throws=get('M278_NATIVE_SESSION_THROW');
 const successes=get('M278_NATIVE_SESSION_MEMORY');
 ensure(throws.length<=1&&successes.length<=1&&!(throws.length&&successes.length),
  'duplicated or contradictory native session result');
 const v=throws[0]||successes[0]||null;
 if(v){
  ensure((v.beforePages===null||pages(v.beforePages*65536)===v.beforePages)&&
   (v.afterPages===null||pages(v.afterPages*65536)===v.afterPages)&&
   Number.isInteger(v.visibleGrows)&&v.visibleGrows>=0&&v.visibleGrows<=20000,'invalid scalar WASM memory');
 }
 if(throws.length)ensure(
  ['wasm-bounds','oom-or-alloc','abort','wasm-runtime-other','js-type','other'].includes(v.kind)&&
  typeof v.wasmRuntime==='boolean'&&Number.isInteger(v.wasmFrames)&&v.wasmFrames>=0&&v.wasmFrames<=12,
  'invalid exception classification');
 const inferredFromTrace=trace.some(t=>t?.operation==='OrtCreateSession'&&t.phase==='throw');
 const passed=exit===0&&lines.some(x=>x.startsWith('P91_FULL_JOURNEY_PASS '))&&
  trace.some(t=>t?.operation==='OrtRun'&&t.phase==='return'&&t.value===0);
 ensure(!(passed&&inferredFromTrace),'original failed operation cannot be a PASS');
 return {engine,width,ordinal,exitCode:exit,originalModelPositive:passed,
  originalJourneyRed:exit!==0,nativeSessionThrew:inferredFromTrace,
  nativeExceptionType:throws.length?v.kind:null,wasmRuntime:throws.length?v.wasmRuntime:null,
  wasmFrames:throws.length?v.wasmFrames:null,
  heapPagesBefore:v?.beforePages??null,heapPagesAfter:v?.afterPages??null,
  visibleGrowCalls:v?.visibleGrows??null,
  memoryAttributionProven:false,permanentFixProven:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],{encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  if(process.argv[2]==='prepare'){
   writeFileSync('scripts/.cc-m278-native-typed-trace.mjs',deriveM278(
    readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8'),
    readFileSync('public/outfit-worker-p94.mjs','utf8')),{flag:'wx'});
   console.log('M278_ORIGINAL_NATIVE_TYPED_PROBE_READY');
  }else if(process.argv[2]==='receipt'){
   const r=classifyRun(readFileSync(process.argv[3],'utf8'),Number(process.argv[4]),{
    engine:process.env.M58_ENGINE,width:Number(process.env.P94_WIDTH),
    ordinal:Number(process.env.M278_ORDINAL)});
   console.log('M278_TYPED_ORIGINAL_NATIVE_RECEIPT '+JSON.stringify(r));
  }else throw Error('expected prepare/receipt');
 }catch(e){console.error('M278_FAIL_CLOSED',String(e.message||e).slice(0,160));process.exitCode=1;}
}
