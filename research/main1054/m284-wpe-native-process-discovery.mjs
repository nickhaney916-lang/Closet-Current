/**
 * M284 — original Playwright Linux headless WPE native renderer discovery.
 *
 * M282 assumed WebKitWebProcess (GTK), while Linux headless Playwright WebKit
 * typically spawns WPEWebProcess. This experiment tests the corrected lookup
 * against the EXACT pinned browser build; an idle debugger attach is not a
 * genuine WASM trap PC, and no real original-model execution is claimed.
 *
 * Never modify ptrace permissions, Linux sandbox, production code, model,
 * JSEP binary, source photos, real owner data, or native exception behavior.
 */
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,readdirSync,readlinkSync,mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {classifyAttach} from './m282-native-debugger-preflight.mjs';
import {syntheticWasmBytes,parseFrame} from './m281-webkit-trap-pc-capability.mjs';

export const parent='1d481ad2c880a7509bdc4b78b5db990ef82abdf4';
export const branch='refs/heads/research/main1054-m284-wpe-native-process-discovery-HOLD';
export const additions=[
 '.github/workflows/main1054-m284-wpe-native-process-no-deploy.yml',
 'research/main1054/m284-wpe-native-process-discovery.mjs',
 'tests/main1054-m284-wpe-native-process-discovery.test.mjs'
];
export const pinned=Object.freeze({
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m282-native-debugger-preflight.mjs':'cd91e67e7f595b2b264d93a0d80d8fa82bebc600',
 'research/main1054/m281-webkit-trap-pc-capability.mjs':'52412852f1c4f42a57826b1dcb18f1e793d92f19',
 'research/main1054/m280-original-jsep-function-map.mjs':'c52b967bc80ce8ba4c2c69bc2ea09c70e50bb332',
 'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11',
 'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41'
});
const requireTruth=(yes,why)=>{if(!yes)throw Error('M284 FAIL-CLOSED: '+why);};
export function sourceGate(git,e){
 requireTruth(e?.name==='push'&&e.ref===branch&&e.attempt==='1','unapproved branch/event or rerun');
 requireTruth(/^[a-f0-9]{40}$/.test(e.sha||'')&&git('rev-parse','HEAD')===e.sha,'wrong source HEAD');
 requireTruth(git('merge-base','--is-ancestor',parent,e.sha)==='','M282 source parent lost');
 requireTruth(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,e.sha)===
  additions.map(x=>'A\0'+x+'\0').join(''),'protected source edit or extra file');
 for(const p of additions)
  requireTruth(git('ls-tree',e.sha,'--',p).startsWith('100644 blob '),'unsafe experiment path');
 for(const [p,sha] of Object.entries(pinned))
  requireTruth(git('rev-parse',e.sha+':'+p)===sha,'original protected source drift '+p);
 return {source:'PASS',genuineHistoricalRedPreserved:true,originalWorkerUnchanged:true,
  nativeOriginalTrapOffsetKnown:false,causalFixProven:false,familyAlpha:'HOLD'};
}
export const originalRed=Object.freeze({
 originalRunId:44640727828,originalFailingJobId:135971719127,engine:'webkit',
 width:430,shard:2,ordinal:3,nativeErrorClass:'wasm-bounds',
 functionIndices:[4846,1384,11276,7427],originalTrapOffset:null
});
export const expectedWpePath='/ms-playwright/webkit-2215/minibrowser-wpe/bin/WPEWebProcess';
/** Process /proc/comm is 15-byte truncated. Do not match network or GPU processes. */
export function processKind(comm,exe){
 const name=String(comm||'').trim(),base=String(exe||'').split('/').at(-1);
 if(name==='WPEWebProcess'&&base==='WPEWebProcess')return 'WPE_WEB_CONTENT';
 if((name==='WebKitWebProces'||name==='WebKitWebProcess')&&
  base==='WebKitWebProcess')return 'GTK_WEB_CONTENT';
 return null;
}
export function classifyContentProcess(row,baseline){
 const kind=processKind(row?.comm,row?.exe);
 const fresh=Number.isSafeInteger(row?.pid)&&row.pid>1&&!baseline.has(row.pid);
 const exactWpe=kind==='WPE_WEB_CONTENT'&&row.exe===expectedWpePath;
 return {
  kind,present:kind!==null,fresh,
  pinnedWpe:exactWpe,
  eligible:exactWpe&&fresh
 };
}
function enumerateContent(){
 const out=[];
 for(const entry of readdirSync('/proc')){
  if(!/^\d+$/.test(entry))continue;
  const pid=Number(entry);
  try{
   const comm=readFileSync('/proc/'+entry+'/comm','utf8').trim();
   if(comm!=='WPEWebProcess'&&comm!=='WebKitWebProces'&&comm!=='WebKitWebProcess')continue;
   let exe=null;
   try{exe=readlinkSync('/proc/'+entry+'/exe');}catch{}
   out.push({pid,comm,exe});
  }catch{}
 }
 return out;
}
export function candidateDecision(rows,baseline){
 requireTruth(Array.isArray(rows)&&rows.length<=1000&&baseline instanceof Set,'unsafe process list');
 const info=rows.map(row=>classifyContentProcess(row,baseline));
 const eligible=rows.filter((row,i)=>info[i].eligible);
 const kinds={wpe:info.filter(x=>x.kind==='WPE_WEB_CONTENT').length,
  gtk:info.filter(x=>x.kind==='GTK_WEB_CONTENT').length,
  missingPinnedBinary:info.filter(x=>x.kind==='WPE_WEB_CONTENT'&&!x.pinnedWpe).length};
 const classification=eligible.length===1?'UNIQUE_PINNED_WPE_CONTENT':
  eligible.length>1?'AMBIGUOUS_PINNED_CONTENT':
  kinds.wpe>0?'WPE_PRESENT_BUT_UNATTESTED':'NO_WEBKIT_CONTENT_PROCESS';
 return {eligible,classification,kinds};
}
/**
 * A bounded, strictly scalar debugger transcript classification. This records
 * no PID, address, register value, process command line, stack or native bytes.
 * It distinguishes a debugger/ptrace denial hint from a process exit race;
 * neither outcome is the original WASM trap, nor a corrected ONNX model.
 */
export function classifyGdbTranscript(raw,status,signal){
 requireTruth(typeof raw==='string'&&raw.length<200000,'unbounded native debugger output');
 const text=raw.toLowerCase();
 return {
  exitStatus:Number.isInteger(status)&&status>=0&&status<=255?status:null,
  signalled:Boolean(signal),
  ptraceRestrictionMentioned:/ptrace_scope|ptrace.*(operation not permitted|permission denied)|operation not permitted|permission denied/.test(text),
  targetExitedMentioned:/no such process|process.*(exited|terminated|not found)|process .*does not exist/.test(text),
  targetAttachAttemptMentioned:/attaching to process|attach to process|attaching to pid|could not attach|cannot attach/.test(text),
  registerRipObserved:/^\s*rip\s+0x[0-9a-f]{4,16}\b/m.test(text),
  detachObserved:/detaching from program|\bdetached\b/.test(text),
  unresolvedNativePC:true
 };
}

export function adjudicate(receipt){
 requireTruth(receipt?.schema==='M284_PINNED_WEBKIT_WPE_RENDERER_NATIVE_DEBUG_V1','receipt missing');
 requireTruth(receipt.syntheticOnly===true&&receipt.originalModelExecuted===false,
  'synthetic trap mislabeled original');
 requireTruth(receipt.originalM279WebKitFunctionIndex===4846&&
  receipt.originalM279WasmTrapInstructionOffset===null&&
  receipt.originalWasmBinaryVerifiedInThisFailingProcess===false,
  'original historic RED falsely augmented');
 requireTruth(receipt.genuineOriginalWasmTrapPcCaptured===false&&
  receipt.nativeCausalFixProven===false&&receipt.releaseAllowed===false&&
  receipt.familyAlpha==='HOLD','native fix or release forged');
 requireTruth(receipt.pinnedBrowser==='playwright@1.56.1'&&
  ['NO_WEBKIT_CONTENT_PROCESS','WPE_PRESENT_BUT_UNATTESTED',
   'AMBIGUOUS_PINNED_CONTENT','UNIQUE_PINNED_WPE_CONTENT'].includes(receipt.discoveryClass),
  'untrusted process diagnosis');
 requireTruth(['NOT_ATTEMPTED','GDB_MISSING','IDLE_ATTACH_AVAILABLE',
  'PERMISSION_DENIED','DEBUGGER_OR_TARGET_UNAVAILABLE',
  'ATTACH_TIMED_OUT','ATTACH_UNVERIFIED'].includes(receipt.nativeAttachClass),
  'untrusted debugger result');
 if(receipt.discoveryClass!=='UNIQUE_PINNED_WPE_CONTENT')
  requireTruth(receipt.nativeAttachClass==='NOT_ATTEMPTED'||receipt.nativeAttachClass==='GDB_MISSING',
   'attached to unknown/unrelated content process');
 if(receipt.safeGdbEvidence!==null&&receipt.safeGdbEvidence!==undefined){
  const d=receipt.safeGdbEvidence;
  requireTruth(d&&typeof d==='object'&&!Array.isArray(d)&&
   Object.keys(d).sort().join(',')==='detachObserved,exitStatus,ptraceRestrictionMentioned,registerRipObserved,signalled,targetAttachAttemptMentioned,targetExitedMentioned,unresolvedNativePC'&&
   (d.exitStatus===null||Number.isInteger(d.exitStatus)&&d.exitStatus>=0&&d.exitStatus<=255)&&
   ['signalled','ptraceRestrictionMentioned','targetExitedMentioned',
    'targetAttachAttemptMentioned','registerRipObserved','detachObserved','unresolvedNativePC']
     .every(k=>typeof d[k]==='boolean')&&d.unresolvedNativePC===true,
    'unbounded or forged native debugger provenance');
 }
 requireTruth(receipt.syntheticWasmTrapObserved===true&&receipt.syntheticWasmFrameIndex===0,
  'missing native engine synthetic capability control');
 return receipt;
}
async function probe(){
 const before=new Set(enumerateContent().map(x=>x.pid));
 const {webkit}=await import('playwright');
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage();
  await page.goto('data:text/html,<html><body><main>m284-wpe-local-only</main></body></html>');
  const ready=await page.evaluate(()=>document.querySelector('main')?.textContent);
  requireTruth(ready==='m284-wpe-local-only','pinned real renderer not active');
  // Require the native renderer to exist before attachment, without scanning
  // other users' processes or preserving /proc command lines.
  let decision=candidateDecision(enumerateContent(),before);
  if(decision.classification==='NO_WEBKIT_CONTENT_PROCESS'){
   await new Promise(resolve=>setTimeout(resolve,350));
   decision=candidateDecision(enumerateContent(),before);
  }
  const gdb=spawnSync('gdb',['--version'],{encoding:'utf8',timeout:3500,maxBuffer:5000});
  let nativeAttachClass='NOT_ATTEMPTED',permissionDenied=false,attachmentPossible=false;
  let safeGdbEvidence=null;
  if(decision.classification==='UNIQUE_PINNED_WPE_CONTENT'&&gdb.status!==0)
   nativeAttachClass='GDB_MISSING';
  if(decision.classification==='UNIQUE_PINNED_WPE_CONTENT'&&gdb.status===0){
   const row=decision.eligible[0];
   // Revalidate the exact same executable/comm before any permitted attachment.
   let current=null;
   try{current={pid:row.pid,
    comm:readFileSync('/proc/'+row.pid+'/comm','utf8').trim(),
    exe:readlinkSync('/proc/'+row.pid+'/exe')};}catch{}
   if(current&&classifyContentProcess(current,before).eligible){
    const result=spawnSync('timeout',['-k','2s','12s','gdb','-nx','-q','--batch',
     '-p',String(row.pid),'-ex','info registers','-ex','detach'],
     {encoding:'utf8',timeout:16000,maxBuffer:180000});
    const d=classifyAttach(String(result.stdout||'')+'\n'+String(result.stderr||''),result.status,result.signal);
    nativeAttachClass=d.className;
    safeGdbEvidence=classifyGdbTranscript(String(result.stdout||'')+'\n'+String(result.stderr||''),result.status,result.signal);
    permissionDenied=d.permissionDenied;attachmentPossible=d.attachmentPossible;
   }else nativeAttachClass='DEBUGGER_OR_TARGET_UNAVAILABLE';
  }
  // This control is synthetic only, not the original SegFormer/JSEP run.
  const error=await page.evaluate(async bytes=>{
   const obj=await WebAssembly.instantiate(Uint8Array.from(bytes));
   try{obj.instance.exports.run();return {name:'none',message:'',stack:''};}
   catch(e){return {name:e.name,message:String(e.message||'').slice(0,150),
    stack:String(e.stack||'').slice(0,2800)};}
  },syntheticWasmBytes);
  const frame=parseFrame(error.stack);
  const receipt={
   schema:'M284_PINNED_WEBKIT_WPE_RENDERER_NATIVE_DEBUG_V1',
   pinnedBrowser:'playwright@1.56.1',browserVersion:browser.version(),
   processPort:'linux-headless-wpe',
   discoveredWpeContentCount:decision.kinds.wpe,
   discoveredGtkContentCount:decision.kinds.gtk,
   visibleWpeWithoutPinnedExecutable:decision.kinds.missingPinnedBinary,
   exactlyOneNewPinnedWpeRenderer:decision.eligible.length===1,
   discoveryClass:decision.classification,debuggerPresent:gdb.status===0,
   nativeAttachClass,attachmentPossible,permissionDenied,safeGdbEvidence,
   syntheticOnly:true,originalModelExecuted:false,
   syntheticWasmTrapObserved:error.name==='RuntimeError'&&
    /out of bounds|memory access/i.test(error.message),
   syntheticWasmFrameIndex:frame.functionIndex,
   syntheticInstructionOffset:frame.rawInstructionOffset,
   originalM279WebKitFunctionIndex:4846,originalM279WasmTrapInstructionOffset:null,
   originalWasmBinaryVerifiedInThisFailingProcess:false,
   originalM279GenuineRedPreserved:true,
   genuineOriginalWasmTrapPcCaptured:false,
   nativeCausalFixProven:false,releaseAllowed:false,familyAlpha:'HOLD'
  };
  adjudicate(receipt);
  return receipt;
 }finally{await browser.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],
  {encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  requireTruth(process.argv[2]==='probe','only native preflight supported');
  const receipt=await probe();
  mkdirSync('m284-sanitized',{recursive:true});
  writeFileSync('m284-sanitized/wpe-native-debugger.json',JSON.stringify(receipt,null,2)+'\n');
  console.log('M284_PINNED_WEBKIT_WPE_CONTENT_DISCOVERY '+JSON.stringify(receipt));
 }catch(error){
  console.error('M284_RESEARCH_BLOCKED '+String(error?.message||error).slice(0,220));
  process.exitCode=1;
 }
}
