/**
 * M289 — evaluate documented WPE remote inspector on the unchanged pinned
 * WebKit 26.0 engine as a NON-PTRACE alternative to GDB's denied attachment.
 * All traffic binds only 127.0.0.1 within a disposable CI browser container.
 * THIS IS SYNTHETIC CAPABILITY ONLY unless a genuine failing original model
 * and exact SAME process + opcode witness are separately proven. No security
 * permissions/ptrace/sysctls, deployed routes, original model or owner data.
 */
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {binary as syntheticOriginal,knownProbeLoadFileOffset,parseWasmFrames}
 from './m281-webkit-offset-capability.mjs';

export const parent='7043a298912a865246a8b43a12f6d31a8161738c';
export const branch='refs/heads/research/main1054-m289-authorized-wpe-inspector-trap-pc-HOLD';
export const paths=[
 '.github/workflows/main1054-m289-webkit-inspector-no-deploy.yml',
 'research/main1054/m289-authorized-wpe-inspector-wasm-offset.mjs',
 'tests/main1054-m289-authorized-wpe-inspector-wasm-offset.test.mjs'
];
export const pins={
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m287-original-webkit-failing-process-witness.mjs':'4439bb9d27220fe0a37402e81899d2bf5bcc5346',
 'research/main1054/m285-original-heap-view-witness.mjs':'46127fd4e1cf23426473235e0b6b929ce3d5832f',
 'research/main1054/m281-webkit-offset-capability.mjs':'be652d12ab80038a9ec43e2f1f2719803999d948'
};
const need=(yes,msg)=>{if(!yes)throw Error('M289 FAIL-CLOSED: '+msg);};
export const pinnedEnvironment=Object.freeze({
 browser:'playwright@1.56.1',nativeWebkit:'26.0',
 inspectorEnvName:'WEBKIT_INSPECTOR_HTTP_SERVER',
 inspectorLoopback:'127.0.0.1:17651',
 syntheticWasmbinaryBytes:48,syntheticKnownLoadFileOffset:knownProbeLoadFileOffset
});
export function sourceGate(git,e){
 need(e?.name==='push'&&e.ref===branch&&e.attempt==='1','unexpected branch, event, or rerun');
 need(/^[0-9a-f]{40}$/.test(e.sha||'')&&git('rev-parse','HEAD')===e.sha,'wrong source HEAD');
 need(git('merge-base','--is-ancestor',parent,e.sha)==='','verified M287 parent missing');
 need(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,e.sha)===
  paths.map(p=>'A\0'+p+'\0').join(''),'original runtime/source changed or additional path');
 for(const p of paths)
  need(git('ls-tree',e.sha,'--',p).startsWith('100644 blob '),'unsafe source file');
 for(const [p,sha] of Object.entries(pins))
  need(git('rev-parse',e.sha+':'+p)===sha,'original native source drift '+p);
 return {originalWebkitAndModelUnmodified:true,originalM279RedPreserved:true,
  noSandboxOrPtraceOverride:true,familyAlpha:'HOLD'};
}
export function parseLocalInspectorPaths(markup){
 need(typeof markup==='string'&&markup.length<=65536,'oversized or invalid inspector listing');
 const matches=[...markup.matchAll(/href=["'](\/socket\/[a-zA-Z0-9_./-]+)["']/g)];
 const unique=[...new Set(matches.map(m=>m[1]))];
 return unique.filter(s=>!s.includes('..')&&s.length<=256).slice(0,10);
}
export function classifyInspectorPause(event){
 if(!event||event.method!=='Debugger.paused')return null;
 const p=event.params||{},frames=Array.isArray(p.callFrames)?p.callFrames:[];
 const top=frames[0]||{},loc=top.location||{};
 // Only an actual TOP native WASM frame can attribute its position to the
 // trapping instruction. A lower wasm frame beneath JS line 44 is not proof.
 const wasmScript=/wasm/i.test(String(top?.url||top?.functionName||''));
 const line=Number.isSafeInteger(loc.lineNumber)&&loc.lineNumber>=0?loc.lineNumber:null;
 const column=Number.isSafeInteger(loc.columnNumber)&&loc.columnNumber>=0?loc.columnNumber:null;
 const candidateFileOffset=wasmScript&&
  (line===knownProbeLoadFileOffset||column===knownProbeLoadFileOffset)?
   knownProbeLoadFileOffset:null;
 return {reason:typeof p.reason==='string'?p.reason.slice(0,36):null,
  frameCount:frames.length<=50?frames.length:null,wasmFramePresented:wasmScript,
  locationLine:line,locationColumn:column,
  actualSyntheticOpcodeOffsetVerified:candidateFileOffset,
  nativeMachinePcCaptured:false,originalOrtCreateSessionTrapPc:null};
}
export function adjudicate(receipt){
 need(receipt?.schema==='M289_PINNED_WEBKIT_READONLY_INSPECTOR_CAPABILITY_V1',
  'missing genuine engine capability schema');
 need(receipt.browser===pinnedEnvironment.browser&&
  receipt.nativeWebkit===pinnedEnvironment.nativeWebkit,'pinned browser version mismatch');
 need(receipt.inspectorBoundToLoopback===true&&
  receipt.syntheticOnly===true&&receipt.originalModelExecuted===false,
  'nonloopback inspector or synthetic mislabeled original');
 need(receipt.syntheticTrapObserved===true&&
  receipt.syntheticNativeFunctionIndex===0&&
  receipt.knownOriginalTinyLoadFileOffset===44,'synthetic WebKit trap missing');
 for(const v of ['inspectorHttpReachable','inspectorWebSocketConnected',
  'inspectorDebuggerEnabled','inspectorExceptionPauseObserved',
  'sameProcessOriginalJsepAttested','realOriginalOrtCreateSessionWasmRedObserved',
  'nativeMachinePcCaptured','nativeCausalFixProven','releaseAllowed'])
  need(typeof receipt[v]==='boolean','invalid capability flag: '+v);
 need(receipt.sameProcessOriginalJsepAttested===false&&
  receipt.realOriginalOrtCreateSessionWasmRedObserved===false&&
  receipt.nativeMachinePcCaptured===false&&receipt.nativeCausalFixProven===false&&
  receipt.releaseAllowed===false&&receipt.originalOrtTrapByteOffset===null&&
  receipt.originalCxxSourceStatement===null&&receipt.familyAlpha==='HOLD',
  'fabricated real native PC / fix / release');
 need(receipt.syntheticInspectorFileOffset===null||
  receipt.syntheticInspectorFileOffset===knownProbeLoadFileOffset,
  'arbitrary inspector script location advertised as WASM opcode');
 if(receipt.syntheticInspectorFileOffset!==null)
  need(receipt.inspectorExceptionPauseObserved&&receipt.inspectorDebuggerEnabled,
  'offset claimed without real debugger event');
 return receipt;
}
async function httpProbe(){
 try{
  const response=await fetch('http://'+pinnedEnvironment.inspectorLoopback+'/',{
   signal:AbortSignal.timeout(2700),redirect:'error'});
  if(!response.ok)return {reachable:false,paths:[]};
  const body=await response.text();
  return {reachable:true,paths:parseLocalInspectorPaths(body.slice(0,65536))};
 }catch{return {reachable:false,paths:[]};}
}
async function openLocalInspector(path,observations){
 need(/^\/socket\/[a-zA-Z0-9_./-]+$/.test(path)&&!path.includes('..'),
  'inspector websocket path not locally sourced');
 const socket=new WebSocket('ws://'+pinnedEnvironment.inspectorLoopback+path);
 const callbacks=new Map();let id=0,closed=false;
 const send=(method,params={})=>{
  if(socket.readyState!==WebSocket.OPEN)return false;
  socket.send(JSON.stringify({id:++id,method,params}));
  callbacks.set(id,method);
  return true;
 };
 const initialized=new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('inspector local-only WS handshake timed out')),4500);
  socket.addEventListener('open',()=>{clearTimeout(timeout);resolve();},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(timeout);reject(Error('local WS refused'));},{once:true});
 });
 socket.addEventListener('message',e=>{
  try{
   const data=JSON.parse(String(e.data||'').slice(0,16384));
   if(data.id&&callbacks.has(data.id)){
    const method=callbacks.get(data.id);callbacks.delete(data.id);
    if(method==='Debugger.enable'&&!data.error)observations.debuggerEnabled=true;
    if(method==='Debugger.setPauseOnExceptions'&&!data.error)
     observations.pauseOnExceptionEnabled=true;
   }
   const p=classifyInspectorPause(data);
   if(p){
    observations.pauses++;
    observations.lastPause=p;
    // Resuming a local synthetic test is not patching original JSEP/ONNX;
    // never read scopes, stack content, private photos or registers.
    send('Debugger.resume');
   }
  }catch{}
 });
 await initialized;
 observations.websocketConnected=true;
 send('Debugger.enable');
 await new Promise(resolve=>setTimeout(resolve,350));
 send('Debugger.setPauseOnExceptions',{state:'all'});
 await new Promise(resolve=>setTimeout(resolve,350));
 return ()=>{if(!closed){closed=true;socket.close();}};
}
export async function probeSyntheticInspector(){
 const pw=await import('playwright');
 const inspectorPort=pinnedEnvironment.inspectorLoopback;
 const browser=await pw.webkit.launch({headless:true,env:{
  ...process.env,WEBKIT_INSPECTOR_HTTP_SERVER:inspectorPort}});
 try{
  need(browser.version()===pinnedEnvironment.nativeWebkit,'pinned WebKit engine drift');
  const context=await browser.newContext({serviceWorkers:'block'});
  const page=await context.newPage();
  await page.goto('data:text/html,<html><head><title>m289-local-synthetic</title></head><body>safe synthetic WASM</body></html>');
  need(await page.title()==='m289-local-synthetic','local synthetic WebKit page absent');
  const observed={websocketConnected:false,debuggerEnabled:false,
   pauseOnExceptionEnabled:false,pauses:0,lastPause:null};
  const http=await httpProbe();
  let disconnect=()=>{};
  for(const path of http.paths){
   try{disconnect=await openLocalInspector(path,observed);break;}catch{}
  }
  const result=await page.evaluate(async raw=>{
   const compiled=await WebAssembly.instantiate(Uint8Array.from(raw));
   try{compiled.instance.exports.probe();return {name:'missing',message:'',stack:''};}
   catch(e){return {name:e.name,message:String(e.message||'').slice(0,160),
    stack:String(e.stack||'').slice(0,1000)};}
  },Array.from(syntheticOriginal));
  await new Promise(resolve=>setTimeout(resolve,200));
  disconnect();
  const frame=parseWasmFrames(result.stack).find(f=>f.functionIndex===0);
  const syntheticTrap=result.name==='RuntimeError'&&
   /out of bounds|memory access/i.test(result.message);
  const location=observed.lastPause?.actualSyntheticOpcodeOffsetVerified??null;
  const receipt={
   schema:'M289_PINNED_WEBKIT_READONLY_INSPECTOR_CAPABILITY_V1',
   browser:pinnedEnvironment.browser,nativeWebkit:browser.version(),
   inspectorBoundToLoopback:true,syntheticOnly:true,originalModelExecuted:false,
   syntheticTrapObserved:syntheticTrap,syntheticNativeFunctionIndex:frame?.functionIndex??null,
   knownOriginalTinyLoadFileOffset:knownProbeLoadFileOffset,
   syntheticJsStackFileOffset:frame?.absoluteModuleOffset??null,
   inspectorHttpReachable:http.reachable,inspectorSocketCount:http.paths.length,
   inspectorWebSocketConnected:observed.websocketConnected,
   inspectorDebuggerEnabled:observed.debuggerEnabled,
   inspectorPauseOnExceptionsEnabled:observed.pauseOnExceptionEnabled,
   inspectorExceptionPauseObserved:observed.pauses>0,
   inspectorPauseReason:observed.lastPause?.reason??null,
   inspectorPauseWasmFrame:observed.lastPause?.wasmFramePresented??false,
   syntheticInspectorFileOffset:location,
   nativeMachinePcCaptured:false,sameProcessOriginalJsepAttested:false,
   realOriginalOrtCreateSessionWasmRedObserved:false,
   originalOrtTrapByteOffset:null,originalCxxSourceStatement:null,
   nativeCausalFixProven:false,releaseAllowed:false,familyAlpha:'HOLD'
  };
  return adjudicate(receipt);
 }finally{await browser.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],
  {encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  need(process.argv[2]==='probe','only local synthetic capability experiment authorized');
  const receipt=await probeSyntheticInspector();
  mkdirSync('m289-sanitized',{recursive:true});
  writeFileSync('m289-sanitized/inspector-capability.json',
   JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log('M289_REAL_PINNED_WEBKIT_INSPECTOR_CAPABILITY '+JSON.stringify(receipt));
 }catch(e){console.error('M289_AUTHORIZED_INSPECTOR_BLOCKED '+
  String(e?.message||e).slice(0,240));process.exitCode=1;}
}
