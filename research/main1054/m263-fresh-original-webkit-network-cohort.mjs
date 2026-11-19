/**
 * M263: First-attempt ORIGINAL WebKit/Chromium P94 model stability cohort.
 * New evidence question: on a natural original-model failure, did the SAME
 * browser CONTEXT observe original ONNX and JSEP network response SHA bytes?
 *
 * Not native compiled/runtime/allocator identity; NEVER a permanent repair.
 * No model/Worker/product modifications or injected network faults.
 * The historical original P94 positive assertion stays unchanged.
 */
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {extractM257Attempt} from './m257-real-runner-evidence.mjs';
import {assessM262,EXPECTED_ONNX_SHA256} from './m262-original-onnx-byte-identity.mjs';

const head=/^[a-f0-9]{40}$/;
const digest=/^[a-f0-9]{64}$/;
const run=/^[0-9]{3,30}$/;
const origJsep='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const originalSourceSHA='4803707515debafdc8041069c6081bd20530e455c03c0842d1a0bc30161ed2f5';
function validateIdentity(x){
 if(!x||!head.test(x.checkout||'')||
    !['webkit','chromium'].includes(x.engine)||![320,390,430].includes(x.width)||
    !run.test(String(x.runId||''))||x.runAttempt!==1||
    !Number.isInteger(x.exitCode)||x.exitCode<0||x.exitCode>255||
    !digest.test(x.lockedJpegSha||'')||
    !/^[\w-]{1,100}$/.test(x.job||''))
  throw Error('Invalid original first-attempt browser identity');
}
function workerFailRows(log){
 return log.split(/\r?\n/).filter(line=>line.startsWith('M58_REAL_P88_WORKER_FAIL '));
}
export function classifyM263Attempt(log,identity,ordinal){
 if(typeof log!=='string'||log.length>8*1024*1024||
    !Number.isInteger(ordinal)||ordinal<1||ordinal>64)
  throw Error('Unbounded original browser transcript or ordinal');
 validateIdentity(identity);
 const native=extractM257Attempt(log,identity);
 const errors=workerFailRows(log);
 let m262=null;
 try{m262=assessM262(log,identity)}catch{}
 // A zero exit alongside a terminal worker failure is still a genuine FAIL.
 const nativeRed=native.journeyStatus==='FAIL'||errors.length>0;
 const wrongModel=m262?.originalModelNetworkGate==='FAIL';
 const wrongJsep=m262?.originalJsepNetworkGate==='FAIL';
 const correctNetworkPair=m262?.originalModelNetworkGate==='OBSERVED'&&
   m262?.originalJsepNetworkGate==='OBSERVED';
 const chromiumNetworkPartial=identity.engine==='chromium'&&
   m262?.originalModelNetworkGate==='PARTIAL'&&
   m262?.originalJsepNetworkGate==='PARTIAL';
 // Do not claim natural allocator failure merely because a process exits or
 // because a generic Worker marker is present. No internal C++ error observed.
 const originalModelWorkerRed=errors.length>0&&identity.exitCode!==0;
 const outcome=nativeRed||wrongModel||wrongJsep?'FAIL':
   native.journeyStatus==='PASS'&&(correctNetworkPair||chromiumNetworkPartial)
    ?'PASS':'BLOCKED';
 return {
  schema:'MAIN1054_M263_ORIGINAL_FIRST_ATTEMPT_COHORT_V1',
  checkout:identity.checkout,runId:String(identity.runId),
  runAttempt:identity.runAttempt,engine:identity.engine,width:identity.width,
  ordinal,childExitCode:identity.exitCode,
  originalJourneyStatus:native.journeyStatus,
  terminalOriginalWorkerRedCount:Math.min(errors.length,8),
  originalModelWorkerRedObserved:originalModelWorkerRed,
  originalNetworkModelStatus:m262?.originalModelNetworkGate||'BLOCKED',
  originalNetworkJsepStatus:m262?.originalJsepNetworkGate||'BLOCKED',
  originalOnnxNetworkSHAObserved:correctNetworkPair?EXPECTED_ONNX_SHA256:null,
  originalJsepNetworkSHAObserved:correctNetworkPair?origJsep:null,
  sameBrowserContextNetworkPairObserved:correctNetworkPair,
  nativeLoadedOnnxSHA256:null,nativeCompiledJsepSHA256:null,
  nativeAllocatorStateObserved:false,actualCausalWebKitFixProven:false,
  sourceEvidenceGate:outcome==='FAIL'?'FAIL':'BLOCKED',
  result:outcome,
  // Only the original Worker marker, not the generic Node process exit,
  // is grounds to call this a native browser/Worker failed original attempt.
  naturalOriginalWorkerRedCandidate:originalModelWorkerRed,
  // Even original correct network bytes CANNOT identify native compiler state.
  naturalWebKitAllocatorFailureCausallyAttributed:false,
  physicalPhoneTested:false,hostedFourAccountRLSTested:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
export function summarizeM263(receipts,{checkout,runId,engine,width,count}){
 if(!head.test(checkout||'')||!run.test(String(runId||''))||
   !['chromium','webkit'].includes(engine)||![320,390,430].includes(width)||
   !Number.isInteger(count)||count<1||count>64||!Array.isArray(receipts))
  throw Error('Malformed original cohort summary request');
 const seen=new Set();
 let passed=0,failed=0,blocked=0,workerReds=0,pairWitnessed=0,partial=0;
 for(const row of receipts){
  if(row?.schema!=='MAIN1054_M263_ORIGINAL_FIRST_ATTEMPT_COHORT_V1'||
     row.checkout!==checkout||row.runId!==String(runId)||
     row.runAttempt!==1||row.engine!==engine||row.width!==width||
     !Number.isInteger(row.ordinal)||row.ordinal<1||row.ordinal>count||
     seen.has(row.ordinal)||row.releaseAuthorized!==false||
     row.familyAlpha!=='HOLD'||row.nativeLoadedOnnxSHA256!==null||
     row.nativeCompiledJsepSHA256!==null||
     row.naturalWebKitAllocatorFailureCausallyAttributed!==false||
     !['PASS','FAIL','BLOCKED'].includes(row.result)||
     (row.result==='PASS'&&(row.originalJourneyStatus!=='PASS'||row.childExitCode!==0))||
     (row.result==='FAIL'&&row.sourceEvidenceGate!=='FAIL'))
   throw Error('Duplicate, missing, stale, or falsely successful native cohort receipt');
  seen.add(row.ordinal);
  if(row.result==='PASS')passed++;
  if(row.result==='FAIL')failed++;
  if(row.result==='BLOCKED')blocked++;
  if(row.naturalOriginalWorkerRedCandidate)workerReds++;
  if(row.sameBrowserContextNetworkPairObserved)pairWitnessed++;
  if(row.originalNetworkModelStatus==='PARTIAL')partial++;
 }
 if(seen.size!==count)throw Error('Missing original fresh browser process receipt');
 return {
  schema:'MAIN1054_M263_FULL_FIRST_ATTEMPT_COHORT_V1',
  checkout,runId:String(runId),engine,width,expectedFreshProcesses:count,
  completedProcessReceipts:seen.size,originalPositiveJourneys:passed,
  genuineFailedOriginalAttempts:failed,unverifiedOrBlockedAttempts:blocked,
  originalWorkerRedCandidates:workerReds,
  originalJsepAndOnnxNetworkPairWitnesses:pairWitnessed,
  incompleteModelResponseBodyWitnesses:partial,
  status:failed?'FAIL':blocked?'BLOCKED':'PASS',
  naturalWebKitAllocatorRepairProven:false,
  nativeRuntimeIdentityVerified:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
function lockedJPEG(){
 const sha=createHash('sha256').update(readFileSync('benchmark/fixtures/commons-0003.jpg')).digest('hex');
 const original=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
  .find(row=>row.id==='commons-0003');
 if(!original?.verified||original.sha256!==sha)throw Error('Original public JPEG SHA pin changed');
 return sha;
}
function identity(exitCode){
 return {
  checkout:process.env.EXPECTED_HEAD,
  engine:process.env.M58_ENGINE,width:Number(process.env.P94_WIDTH),
  runId:process.env.GITHUB_RUN_ID,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT),
  job:process.env.GITHUB_JOB,exitCode,lockedJpegSha:lockedJPEG()
 };
}
function main(){
 const [action,input,output,arg]=process.argv.slice(2);
 if(action==='verify'){
  const result=classifyM263Attempt(readFileSync(input,'utf8'),identity(Number(arg)),Number(process.env.M263_ORDINAL));
  writeFileSync(output,JSON.stringify(result,null,2));
  console.log('M263_FIRST_ATTEMPT_SOURCE_SAFE_RECEIPT',JSON.stringify(result));
  // Never hide a genuine native RED by passing through to next cohort cell.
  // This command succeeds to let caller run all precommitted attempts. The
  // final cohort aggregate exits nonzero on any FAIL/BLOCKED.
 }else if(action==='aggregate'){
  const filenames=readdirSync(input).filter(n=>/^receipt-[0-9]+[.]json$/.test(n));
  const rows=filenames.map(n=>JSON.parse(readFileSync(join(input,n),'utf8')));
  const result=summarizeM263(rows,{
   checkout:process.env.EXPECTED_HEAD,runId:process.env.GITHUB_RUN_ID,
   engine:process.env.M58_ENGINE,width:Number(process.env.P94_WIDTH),
   count:Number(process.env.M263_COUNT)
  });
  writeFileSync(output,JSON.stringify(result,null,2));
  console.log('M263_FRESH_PROCESS_COHORT_SUMMARY',JSON.stringify(result));
  if(result.status!=='PASS')process.exitCode=1;
 }else if(action==='verify-original-runner'){
  const original=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
  const sha=createHash('sha256').update(original).digest('hex');
  if(sha!==originalSourceSHA)throw Error('Original runner source not pinned');
  console.log('M263_ORIGINAL_SOURCE_UNCHANGED',JSON.stringify({
   originalP94SHA256:sha,networkObserverOnly:true,
   productWorkerModified:false,noNetworkCorruption:true,
   releaseAuthorized:false,familyAlpha:'HOLD'
  }));
 }else throw Error('Expected verify, aggregate, or verify-original-runner');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{main()}catch(e){
  console.error('M263 BLOCKED: '+String(e.message).slice(0,130));
  process.exitCode=2;
 }
}
