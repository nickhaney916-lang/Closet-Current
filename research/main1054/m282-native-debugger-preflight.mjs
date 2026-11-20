/**
 * M282 read-only native debugger capability preflight on the pinned WebKit
 * process. A debugger stop at idle is NOT an original WASM trap PC.
 * Synthetic WebAssembly exception is kept separate from genuine M279 RED.
 * No shipped Worker, ONNX weights, JSEP WASM, app or original photo is changed.
 */
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {syntheticWasmBytes,parseFrame} from './m281-webkit-trap-pc-capability.mjs';

export const parent='252dccb7dceff7254a0a3c339e580eb884d16280';
export const branch='refs/heads/research/main1054-m282-native-webkit-debugger-attach-HOLD';
export const additions=[
 '.github/workflows/main1054-m282-native-debugger-preflight-no-deploy.yml',
 'research/main1054/m282-native-debugger-preflight.mjs',
 'tests/main1054-m282-native-debugger-preflight.test.mjs'
];
export const pins={
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11',
 'research/main1054/m280-original-jsep-function-map.mjs':'c52b967bc80ce8ba4c2c69bc2ea09c70e50bb332',
 'research/main1054/m281-webkit-trap-pc-capability.mjs':'52412852f1c4f42a57826b1dcb18f1e793d92f19'
};
const assert=(condition,message)=>{if(!condition)throw Error('M282 BLOCKED: '+message);};
export function sourceGate(git,event){
 assert(event?.name==='push'&&event.ref===branch&&event.attempt==='1','wrong event, branch or rerun');
 assert(/^[a-f0-9]{40}$/.test(event.sha||'')&&git('rev-parse','HEAD')===event.sha,'HEAD mismatch');
 assert(git('merge-base','--is-ancestor',parent,event.sha)==='','M281 exact parent lost');
 assert(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,event.sha)===
  additions.map(p=>'A\0'+p+'\0').join(''),'unexpected protected file edit');
 for(const path of additions)assert(git('ls-tree',event.sha,'--',path).startsWith('100644 blob '),'unsafe research path');
 for(const [path,sha] of Object.entries(pins))assert(git('rev-parse',event.sha+':'+path)===sha,'source drift '+path);
 return {exactOriginalSourcePreserved:true,familyAlpha:'HOLD',permanentWebKitRepair:false};
}
export function classifyAttach(output,exit,signal){
 assert(typeof output==='string'&&output.length<200000,'unbounded debugger output');
 const text=output.toLowerCase();
 const permissionDenied=/ptrace: operation not permitted|ptrace: permission denied|operation not permitted|permission denied/.test(text);
 const missing=/no such file or directory|not found|cannot execute/.test(text);
 const attached=/\bdetaching from program\b|\bdetached\b/.test(text)&&
  /\b0x[0-9a-f]{6,16}\b/.test(text)&&exit===0&&!signal;
 const className=attached?'IDLE_ATTACH_AVAILABLE':permissionDenied?'PERMISSION_DENIED':
  missing?'DEBUGGER_OR_TARGET_UNAVAILABLE':signal?'ATTACH_TIMED_OUT':'ATTACH_UNVERIFIED';
 return {className,attachmentPossible:attached,permissionDenied,
  genuineWasmTrapSiteCaptured:false,originalFailureInstructionOffset:null,
  originalFaultingAddress:null};
}
export function adjudicate(x){
 assert(x?.schema==='M282_PINNED_WEBKIT_DEBUGGER_PREFLIGHT_V1','missing schema');
 assert(x?.originalModelExecuted===false&&x?.syntheticOnly===true,'real-original source falsely asserted');
 assert(['IDLE_ATTACH_AVAILABLE','PERMISSION_DENIED','DEBUGGER_OR_TARGET_UNAVAILABLE',
  'ATTACH_TIMED_OUT','ATTACH_UNVERIFIED','GDB_MISSING','WEBKIT_PROCESS_NOT_VISIBLE'].includes(x.nativeAttachClass),
  'invalid native probe status');
 assert(x.genuineWasmTrapSiteCaptured===false&&x.originalFailureInstructionOffset===null &&
  x.permanentRepairProven===false&&x.familyAlpha==='HOLD','false repair or instruction claim');
 assert(x.syntheticWasmTrapObserved===true&&x.syntheticWasmFrameIndex===0,'missing original engine capability control');
 return x;
}
function processPids(){
 const result=[];
 for(const dir of readdirSync('/proc')){
  if(!/^\d+$/.test(dir))continue;
  try{
   const cmdline=readFileSync('/proc/'+dir+'/cmdline').toString('utf8').replace(/\0/g,' ');
   if(/(?:^|\/)WebKitWebProcess(?:\s|$)/.test(cmdline))result.push(Number(dir));
  }catch{}
 }
 return result.sort((a,b)=>b-a);
}
async function probe(){
 const {webkit}=await import('playwright');
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage();
  await page.goto('about:blank');
  const webkitVersion=browser.version();
  const candidates=processPids();
  const gdbCheck=spawnSync('gdb',['--version'],{encoding:'utf8',timeout:3500});
  let nativeAttachClass='GDB_MISSING',attachmentPossible=false,permissionDenied=false;
  if(gdbCheck.status===0 && candidates.length){
   const r=spawnSync('timeout',['-k','2s','12s','gdb','-nx','-q','--batch',
    '-p',String(candidates[0]),'-ex','info registers','-ex','detach'],
    {encoding:'utf8',timeout:16000,maxBuffer:180000});
   const d=classifyAttach(String(r.stdout||'')+'\n'+String(r.stderr||''),r.status,r.signal);
   nativeAttachClass=d.className;attachmentPossible=d.attachmentPossible;
   permissionDenied=d.permissionDenied;
  }else if(gdbCheck.status===0)nativeAttachClass='WEBKIT_PROCESS_NOT_VISIBLE';
  // No debugger is connected during this separate tiny synthetic control.
  const exception=await page.evaluate(async raw=>{
   const w=await WebAssembly.instantiate(Uint8Array.from(raw));
   try{w.instance.exports.run();return {name:'none',message:'',stack:''};}
   catch(e){return {name:e.name,message:String(e.message||'').slice(0,150),
    stack:String(e.stack||'').slice(0,3000)};}
  },syntheticWasmBytes);
  const frame=parseFrame(exception.stack);
  const result={
   schema:'M282_PINNED_WEBKIT_DEBUGGER_PREFLIGHT_V1',
   browserVersion:webkitVersion,webdriver:'playwright@1.56.1',
   candidateContentProcesses:candidates.length,debuggerPresent:gdbCheck.status===0,
   nativeAttachClass,attachmentPossible,permissionDenied,
   syntheticOnly:true,originalModelExecuted:false,
   syntheticWasmTrapObserved:exception.name==='RuntimeError'&&
    /out of bounds|memory access/i.test(exception.message),
   syntheticWasmFrameIndex:frame.functionIndex,
   syntheticInstructionOffset:frame.rawInstructionOffset,
   originalM279WebKitFunctionIndex:4846,originalFailureInstructionOffset:null,
   originalFaultingAddress:null,genuineWasmTrapSiteCaptured:false,
   nativeAttachPcIsNotWasmTrapPc:true,
   permanentRepairProven:false,familyAlpha:'HOLD'
  };
  adjudicate(result);
  return result;
 }finally{await browser.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],
  {encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  assert(process.argv[2]==='probe','only probe mode accepted');
  const result=await probe();
  mkdirSync('m282-sanitized',{recursive:true});
  writeFileSync('m282-sanitized/debugger-attach.json',JSON.stringify(result,null,2)+'\n');
  console.log('M282_NATIVE_WEBKIT_DEBUGGER_PREFLIGHT '+JSON.stringify(result));
 }catch(e){
  console.error('M282_FAIL_CLOSED '+String(e?.message||e).slice(0,220));
  process.exitCode=1;
 }
}
