/**
 * M281: check the pinned Playwright WebKit 1.56.1 native trap-PC observation
 * capability without modifying the original ONNX model/WASM/application.
 * THIS IS ONLY AN ENGINE DIAGNOSTIC USING A TINY SYNTHETIC WASM TRAP.
 * It cannot establish that the original WebKit M279 failure was corrected.
 */
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';

export const parent='8ba2039f5ef45f07f6f248912c4f703c997f5beb';
export const branch='refs/heads/research/main1054-m281-webkit-trap-pc-capability-HOLD';
export const added=[
 '.github/workflows/main1054-m281-webkit-original-trap-pc-capability-no-deploy.yml',
 'research/main1054/m281-webkit-trap-pc-capability.mjs',
 'tests/main1054-m281-webkit-trap-pc-capability.test.mjs'
];
export const pins={
 'research/main1054/m280-original-jsep-function-map.mjs':'c52b967bc80ce8ba4c2c69bc2ea09c70e50bb332',
 'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/original-ort-native-trace.mjs':'08c9ea893ee12606073fc7c1d07dee37344d538c',
 'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41'
};
const must=(ok,msg)=>{if(!ok)throw Error('M281 fail-closed: '+msg);};
export function sourceGate(git,e){
 must(e?.name==='push'&&e.ref===branch&&e.attempt==='1','wrong event/ref/attempt');
 must(/^[0-9a-f]{40}$/.test(e.sha||'')&&git('rev-parse','HEAD')===e.sha,'source HEAD mismatch');
 must(git('merge-base','--is-ancestor',parent,e.sha)==='','wrong immutable M280 parent');
 must(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,e.sha)===
  added.map(p=>'A\0'+p+'\0').join(''),'unexpected original modification');
 for(const p of added)must(git('ls-tree',e.sha,'--',p).startsWith('100644 blob '),'nonregular file');
 for(const [p,h] of Object.entries(pins)){
  must(git('rev-parse',e.sha+':'+p)===h,'protected original blob changed '+p);
 }
 return {source:'PASS',originalModelAndJsepUnchanged:true,
  originalM279RedPreserved:true,authenticOriginalTrapInstructionOffset:null,
  originalWebKitFixProven:false,familyAlpha:'HOLD'};
}
export const syntheticWasmBytes=Object.freeze([
 0,97,115,109,1,0,0,0,
 1,5,1,0x60,0,1,0x7f, // one () -> i32 signature
 3,2,1,0,             // one defined function
 5,3,1,0,1,           // one-page memory
 7,7,1,3,0x72,0x75,0x6e,0,0, // export "run"
 10,9,1,7,0,0x41,0x7f,0x28,2,0,0x0b
]);
export function parseFrame(stack){
 if(typeof stack!=='string'||stack.length>8000)
  return {functionIndex:null,rawInstructionOffset:null};
 const m=/wasm-function\[(\d{1,7})\](?::0x([0-9a-f]{1,8}))?/i.exec(stack);
 return {functionIndex:m?Number(m[1]):null,
  rawInstructionOffset:m?.[2]?Number.parseInt(m[2],16):null};
}
export function classifyProbe(log){
 must(typeof log==='string'&&log.length>0&&log.length<2000000,'empty/unbounded engine diagnostic');
 const marker='M281_SYNTHETIC_WEBKIT_TRAP ';
 const receipts=log.split(/\r?\n/).filter(s=>s.includes(marker)).map(s=>{
  const k=s.indexOf(marker);
  return JSON.parse(s.slice(k+marker.length));
 });
 must(receipts.length===1,'missing/duplicated synthetic capability probe');
 const x=receipts[0];
 must(x.syntheticOnly===true&&x.browser==='webkit'&&x.moduleBytes===44&&
  x.exceptionName==='RuntimeError'&&x.exceptionIsMemoryAccess===true&&
  x.functionIndex===0&&
  (x.rawInstructionOffset===null||Number.isInteger(x.rawInstructionOffset)&&
   x.rawInstructionOffset>=0&&x.rawInstructionOffset<1000000)&&
  typeof x.browserVersion==='string'&&x.browserVersion.length<120,
  'synthetic control spoofed/failed');
 const mentions=(token)=>new RegExp('(?:\\b|JSC_)'+token+'\\s*(?:=|:)', 'i').test(log);
 const details={
  schema:'M281_ENGINE_CAPABILITY_V1',
  sourceFamily:'PLAYWRIGHT_1_56_1_PINNED',
  syntheticOnly:true,originalModelWasExecuted:false,
  syntheticWebKitMemoryBoundsTrapObserved:true,
  syntheticExceptionFunctionIndex:x.functionIndex,
  syntheticInstructionOffset:x.rawInstructionOffset,
  webKitReportsSyntheticOffset:x.rawInstructionOffset!==null,
  runtimeReportsWasmDebuggerOption:mentions('enableWasmDebugger'),
  runtimeReportsWasmTraceOption:mentions('traceWasmIPIntExecution'),
  runtimeReportsWasmDisassemblyOption:mentions('dumpWasmDisassembly'),
  browserVersion:x.browserVersion,
  originalM279WebKitNativeFunctionIndex:4846,
  originalM279WebKitInstructionOffset:null,
  originalJsepFunctionNameKnown:false,
  originalNativeFaultingAddressKnown:false,
  nativeOriginalRepairProven:false,
  familyAlpha:'HOLD'
 };
 must(details.originalM279WebKitInstructionOffset===null,'forged original instruction offset');
 return details;
}
async function probe(){
 const {webkit}=await import('playwright');
 const browser=await webkit.launch({
  headless:true,
  env:{...process.env,JSC_dumpOptions:'2'}
 });
 try{
  const page=await browser.newPage();
  const trace=await page.evaluate(async raw=>{
   const bytes=new Uint8Array(raw);
   const wasm=await WebAssembly.instantiate(bytes);
   try{
    wasm.instance.exports.run();
    return {exceptionName:null,exceptionIsMemoryAccess:false,stack:'',thrown:false};
   }catch(e){
    return {exceptionName:e?.name??null,
     exceptionIsMemoryAccess:e instanceof WebAssembly.RuntimeError&&
       /out of bounds|memory access/i.test(String(e?.message??'')),
     stack:String(e?.stack??'').slice(0,7999),thrown:true};
   }
  },syntheticWasmBytes);
  const frame=parseFrame(trace.stack);
  console.log('M281_SYNTHETIC_WEBKIT_TRAP '+JSON.stringify({
   browser:'webkit',browserVersion:browser.version(),syntheticOnly:true,
   moduleBytes:syntheticWasmBytes.length,exceptionName:trace.exceptionName,
   exceptionIsMemoryAccess:trace.exceptionIsMemoryAccess,
   ...frame
  }));
 }finally{await browser.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],
  {encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  if(process.argv[2]==='probe'){await probe();}
  else if(process.argv[2]==='receipt'){
   const r=classifyProbe(readFileSync(process.argv[3],'utf8'));
   console.log('M281_PINNED_WEBKIT_ENGINE_CAPABILITY '+JSON.stringify(r));
  }else throw Error('expected probe or receipt');
 }catch(e){
  console.error('M281_CAPABILITY_BLOCKED '+String(e?.message??e).slice(0,160));
  process.exitCode=1;
 }
}
