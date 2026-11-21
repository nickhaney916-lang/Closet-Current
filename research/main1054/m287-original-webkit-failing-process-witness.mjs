/**
 * M287: FIRST ATTEMPT 72 authentic original fp32 SegFormer/JSEP WebKit 430
 * sessions; correlate a genuinely natural RED with M279 model-pointer scalar
 * ABI, M283 in-process JSEP SHA, M285 actual copied heap view. DO NOT FIX.
 * Real source private owner/auth/backup app unchanged; only disposable runner.
 * Do not relabel a harness failure or successful session as original native RED.
 */
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {deriveM285,assessProcess as assessM285}
 from './m285-original-heap-view-witness.mjs';

export const parent='841e5378bd8bed84a5c14c15fada200a5ee6859c';
export const branch='refs/heads/research/main1054-m287-authentic-webkit-red-same-process-HOLD';
export const added=[
 '.github/workflows/main1054-m287-genuine-original-red-cohort-no-deploy.yml',
 'research/main1054/m287-original-webkit-failing-process-witness.mjs',
 'tests/main1054-m287-original-webkit-failing-process-witness.test.mjs'
];
const pins={
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m285-original-heap-view-witness.mjs':'46127fd4e1cf23426473235e0b6b929ce3d5832f',
 'research/main1054/m283-real-jsep-instantiation.mjs':'6c4ad406643871851c9c21e6b324d67ef9d992a9',
 'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11',
 'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41'
};
const fail=(ok,msg)=>{if(!ok)throw Error('M287 BLOCKED: '+msg);};
export const fixed={
 engine:'webkit',width:430,shards:12,perShard:6,attempts:72,
 originalHistoricalFailRun:44640727828,originalHistoricalFailJob:135971719127,
 originalHistoricalNativeFrames:[4846,1384,11276,7427],
 originalHistoricalTrapOffset:null,
 originalJsepSha256:'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39',
 originalModelBytes:15199746
};
export function sourceGate(git,event){
 fail(event?.name==='push'&&event.ref===branch&&event.attempt==='1',
  'wrong branch, event, or rerun');
 fail(/^[a-f0-9]{40}$/.test(event.sha||'')&&git('rev-parse','HEAD')===event.sha,
  'nonexact checked-out SHA');
 fail(git('merge-base','--is-ancestor',parent,event.sha)==='','M285 exact parent lost');
 fail(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,event.sha)===
  added.map(p=>'A\0'+p+'\0').join(''),'original app/worker/model modified or missing files');
 for(const p of added)
  fail(git('ls-tree',event.sha,'--',p).startsWith('100644 blob '),'unsafe new path');
 for(const [p,sha] of Object.entries(pins))
  fail(git('rev-parse',event.sha+':'+p)===sha,'original source drift '+p);
 return {source:'PASS',originalNativeWasmUnchanged:true,
  historicalNativeRedPreserved:true,nativePatchProven:false,familyAlpha:'HOLD'};
}
export function assessTrial(log,exit,metadata){
 fail(typeof log==='string'&&log.length<3000000,'unbounded original browser log');
 fail(Number.isInteger(exit)&&exit>=0&&exit<=255,'invalid process exit');
 fail(metadata?.engine===fixed.engine&&metadata.width===fixed.width&&
  Number.isInteger(metadata.shard)&&metadata.shard>=1&&metadata.shard<=fixed.shards&&
  Number.isInteger(metadata.ordinal)&&metadata.ordinal>=1&&metadata.ordinal<=fixed.perShard,
  'unverified original WebKit cohort');
 let original=null,blockReason=null;
 try{original=assessM285(log,exit,metadata);}
 catch(e){blockReason='NATIVE_SOURCE_RECEIPT_INVALID';}
 const positive=Boolean(original?.originalJourneyPositive&&
  original?.diagnosticVerdict==='ORIGINAL_MODEL_COPY_AND_BINARY_ATTESTED'&&
  original.sameWorkerOriginalJsepSHAProven&&exit===0);
 const actualBounds=Boolean(original?.actualNativeSessionThrown&&
  original.nativeErrorClass==='wasm-bounds'&&exit!==0);
 const nativeOtherRed=Boolean(original?.actualNativeSessionThrown&&
  !actualBounds&&exit!==0);
 const verdict=positive?'ORIGINAL_MODEL_POSITIVE':
  actualBounds?'GENUINE_ORIGINAL_NATIVE_WASM_BOUNDS_RED':
  nativeOtherRed?'GENUINE_ORIGINAL_NATIVE_OTHER_RED':'ORIGINAL_UNATTRIBUTED_RED_OR_BLOCKED';
 // SOURCE: these are authentic first-attempt original process logs ONLY. A
 // forged marker alone without original native classifier is never credited.
 const pointer=log.split(/\r?\n/)
  .filter(s=>s.startsWith('M279_NATIVE_MODEL_BOUNDS '))
  .map(s=>{try{return JSON.parse(s.slice('M279_NATIVE_MODEL_BOUNDS '.length));}
   catch{return null;}});
 const atEntry=pointer.find(p=>p?.phase==='enter')||null;
 const atTerminal=pointer.find(p=>p?.phase==='throw'||p?.phase==='return')||null;
 const validatedPointer=atEntry&&atTerminal&&pointer.length===2&&
  atEntry.modelLength===fixed.originalModelBytes&&
  atEntry.modelPointer===atTerminal.modelPointer&&
  atEntry.modelLength===atTerminal.modelLength&&
  atEntry.modelEnd===atTerminal.modelEnd&&
  atEntry.modelRangeWithinLiveMemory===true&&
  atTerminal.modelRangeWithinLiveMemory===true;
 const frames=(atTerminal?.wasmFunctionOffsets||[]);
 const validFrames=Array.isArray(frames)&&frames.length<=6&&
  frames.every(f=>Number.isSafeInteger(f.functionIndex)&&f.functionIndex>=0&&
   (f.offset===null||Number.isSafeInteger(f.offset)&&f.offset>=0));
 const safeframes=validFrames?frames.map(f=>({functionIndex:f.functionIndex,
  originalJsVisibleOffset:f.offset??null})):[];
 const record={
  schema:'M287_ORIGINAL_NATIVE_SAME_PROCESS_RED_WITNESS_V1',
  engine:fixed.engine,width:fixed.width,shard:metadata.shard,ordinal:metadata.ordinal,
  firstAttempt:true,originalExit:exit,verdict,
  originalModelJourneyPositive:positive,
  genuineOriginalOrtCreateSessionBoundsRed:actualBounds,
  originalNativeErrorClass:original?.nativeErrorClass??null,
  validNativeModelPointerReceipt:Boolean(validatedPointer),
  originalModelPointer:validatedPointer?atEntry.modelPointer:null,
  originalModelByteLength:validatedPointer?atEntry.modelLength:null,
  originalModelExclusiveEnd:validatedPointer?atEntry.modelEnd:null,
  nativeEntryMemoryBytes:validatedPointer?atEntry.liveLinearMemoryBytes:null,
  nativeTerminalMemoryBytes:validatedPointer?atTerminal.liveLinearMemoryBytes:null,
  originalNativeFrames:actualBounds?safeframes:[],
  sameFailingProcessOriginalJsepSHA256Attested:actualBounds&&
   original?.sameWorkerOriginalJsepSHAProven===true,
  sameProcessJsepShaVerified:original?.sameWorkerOriginalJsepSHAProven===true,
  originalModelCopyProven:original?.originalModelCopyProven===true,
  copyViewCurrentAtEntry:original?.copiedHeapViewCurrentAtNativeEntry??null,
  copyViewCurrentAtTerminal:original?.copiedHeapViewCurrentAtNativeTerminal??null,
  nativeTerminalPhase:original?.nativeTerminalPhase??null,
  diagnosticBlocker:blockReason,
  exactOriginalWasmInstructionOffset:null,
  sourceLevelCxxStatement:null,actualCausalFixDemonstrated:false,
  originalRuntimeOrModelChanged:false,releaseAllowed:false,familyAlpha:'HOLD'
 };
 return adjudicate(record);
}
export function adjudicate(r){
 fail(r?.schema==='M287_ORIGINAL_NATIVE_SAME_PROCESS_RED_WITNESS_V1'&&
  r.engine===fixed.engine&&r.width===fixed.width&&r.firstAttempt===true,
  'non-original WebKit attestation');
 fail(['ORIGINAL_MODEL_POSITIVE','GENUINE_ORIGINAL_NATIVE_WASM_BOUNDS_RED',
  'GENUINE_ORIGINAL_NATIVE_OTHER_RED','ORIGINAL_UNATTRIBUTED_RED_OR_BLOCKED']
  .includes(r.verdict),'fake native verdict');
 fail(r.genuineOriginalOrtCreateSessionBoundsRed===
  (r.verdict==='GENUINE_ORIGINAL_NATIVE_WASM_BOUNDS_RED'),
  'forged original native red');
 fail(r.sameFailingProcessOriginalJsepSHA256Attested===false||
  r.genuineOriginalOrtCreateSessionBoundsRed&&r.sameProcessJsepShaVerified===true,
  'unattributed failing native binary');
 fail(r.exactOriginalWasmInstructionOffset===null&&
  r.sourceLevelCxxStatement===null&&r.actualCausalFixDemonstrated===false&&
  r.originalRuntimeOrModelChanged===false&&r.releaseAllowed===false&&
  r.familyAlpha==='HOLD','fabricated native PC/fix/release');
 return r;
}
function originGit(...args){
 return execFileSync('git',['-c','safe.directory='+process.cwd(),...args],
  {encoding:'utf8'}).replace(/\n$/,'');
}
function gate(){
 return sourceGate(originGit,{name:process.env.GITHUB_EVENT_NAME,
  ref:process.env.GITHUB_REF,sha:process.env.GITHUB_SHA,
  attempt:process.env.GITHUB_RUN_ATTEMPT});
}
function prepare(){
 writeFileSync('scripts/.cc-m287-original-webkit-witness.mjs',deriveM285(
  readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8'),
  readFileSync('public/outfit-worker-p94.mjs','utf8')),{flag:'wx'});
 console.log('M287_EXACT_SOURCE_ORIGINAL_MODEL_OBSERVER_READY '+JSON.stringify(fixed));
}
function cohort(shard){
 fail(Number.isInteger(shard)&&shard>=1&&shard<=fixed.shards,'invalid shard');
 mkdirSync('m287-sanitized',{recursive:true});
 const rows=[];
 for(let ordinal=1;ordinal<=fixed.perShard;ordinal++){
  // One fresh real browser for each ordinal, never retry any ordinal.
  const child=spawnSync(process.execPath,['scripts/.cc-m287-original-webkit-witness.mjs'],
   {encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024,
    env:{...process.env,M58_ENGINE:'webkit',P94_WIDTH:'430'}});
  const exit=child.status??(child.signal?124:125);
  const log=String(child.stdout||'')+'\n'+String(child.stderr||'');
  let receipt;
  try{receipt=assessTrial(log,exit,{engine:'webkit',width:430,shard,ordinal});}
  catch{receipt=adjudicate({
   schema:'M287_ORIGINAL_NATIVE_SAME_PROCESS_RED_WITNESS_V1',
   engine:'webkit',width:430,shard,ordinal,firstAttempt:true,originalExit:exit,
   verdict:'ORIGINAL_UNATTRIBUTED_RED_OR_BLOCKED',
   originalModelJourneyPositive:false,genuineOriginalOrtCreateSessionBoundsRed:false,
   sameFailingProcessOriginalJsepSHA256Attested:false,sameProcessJsepShaVerified:false,
   diagnosticBlocker:'NATIVE_RECEIPT_REJECTED',
   exactOriginalWasmInstructionOffset:null,sourceLevelCxxStatement:null,
   actualCausalFixDemonstrated:false,originalRuntimeOrModelChanged:false,
   releaseAllowed:false,familyAlpha:'HOLD'
  });}
  rows.push(receipt);
  console.log('M287_FIRST_ATTEMPT_ORIGINAL_WEBKIT_PROCESS '+JSON.stringify(receipt));
 }
 const byVerdict={};
 for(const r of rows)byVerdict[r.verdict]=(byVerdict[r.verdict]||0)+1;
 const report={schema:'M287_FIRST_ATTEMPT_ORIGINAL_WEBKIT_COHORT_V1',
  shard,originalFirstAttemptCount:rows.length,byVerdict,records:rows,
  negativeFailuresPreserved:true,observedGenuineOriginalBoundsRed:
   rows.some(r=>r.genuineOriginalOrtCreateSessionBoundsRed),
  originalTrapPcKnown:false,causalFixProven:false,familyAlpha:'HOLD'};
 writeFileSync('m287-sanitized/shard-'+shard+'.json',
  JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log('M287_SHARD_REPORT '+JSON.stringify({shard,attempts:rows.length,byVerdict,
  originalTrapPcKnown:false,causalFixProven:false}));
 if(rows.some(r=>r.verdict!=='ORIGINAL_MODEL_POSITIVE'))process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  gate();
  if(process.argv[2]==='prepare')prepare();
  else if(process.argv[2]==='cohort')cohort(Number(process.argv[3]));
  else throw Error('M287 wrong CLI mode');
 }catch(e){console.error('M287_FAIL_CLOSED '+String(e?.message||e).slice(0,260));
  process.exitCode=1;}
}
