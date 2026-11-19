/**
 * M266: integrate the independently verified M263 fresh-process original-P94
 * cohort with current M264 model HTTP and M265 JSEP HTTP truth.
 *
 * Before: M263 on M262 can report a PASS/OBSERVED original context when a
 * valid ONNX/JSEP response appears alongside an independent HTTP 404/500.
 * This module explicitly quarantines that case and retains natural Worker RED.
 * No synthetic model, no altered original browser runner or product Worker.
 * Browser-response SHA is not native compiled/JSEP allocator process proof.
 */
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {extractM257Attempt} from './m257-real-runner-evidence.mjs';
import {assessM264} from './m264-model-http-redirect-truth.mjs';
import {assessM265,JSEP_SHA,JSEP_BYTES} from './m265-original-jsep-http-truth.mjs';
import {EXPECTED_ONNX_SHA256,EXPECTED_ONNX_BYTES} from './m262-original-onnx-byte-identity.mjs';

const checkoutPattern=/^[a-f0-9]{40}$/;
const digestPattern=/^[a-f0-9]{64}$/;
const runPattern=/^[0-9]{3,30}$/;
const runnerSHA='4803707515debafdc8041069c6081bd20530e455c03c0842d1a0bc30161ed2f5';
const validModelHttp=new Set(['NO_REDIRECT','REDIRECT_PLUS_BODY','PARTIAL']);
const validJsepNetwork=new Set(['OBSERVED','PARTIAL']);

function validateIdentity(id){
 if(!id||!checkoutPattern.test(id.checkout||'')||
  !['chromium','webkit'].includes(id.engine)||![320,390,430].includes(id.width)||
  !runPattern.test(String(id.runId||''))||id.runAttempt!==1||
  !Number.isInteger(id.exitCode)||id.exitCode<0||id.exitCode>255||
  !digestPattern.test(id.lockedJpegSha||'')||
  !/^[\w-]{1,100}$/.test(id.job||''))
  throw Error('Original first-attempt identity invalid');
}
const failTag='M58_REAL_P88_WORKER_FAIL ';
export function classifyM266Attempt(log,id,ordinal){
 if(typeof log!=='string'||log.length>8*1024*1024||
  !Number.isInteger(ordinal)||ordinal<1||ordinal>64)
  throw Error('Unbounded original log or invalid process ordinal');
 validateIdentity(id);
 const original=extractM257Attempt(log,id);
 const terminalReds=log.split(/\r?\n/).filter(x=>x.startsWith(failTag));
 let model=null,jsep=null;
 try{model=assessM264(log,id)}catch{}
 try{jsep=assessM265(log,id)}catch{}
 const modelHardErrors=model?.originalModelHttpErrors??null;
 const jsepHardErrors=jsep?.jsepHardHttpErrors??null;
 const badNetwork=model?.originalModelNetworkGate==='FAIL'||
  jsep?.originalModelNetworkGate==='FAIL'||
  model?.sourceEvidenceGate==='FAIL'||
  jsep?.originalJsepNetworkGate==='FAIL'||
  jsep?.sourceEvidenceGate==='FAIL'||
  (modelHardErrors??0)>0||(jsepHardErrors??0)>0;
 const trueWebKitNetwork=id.engine==='webkit'&&
  model?.originalModelBytesCorrectlyHashed>=1&&
  model?.originalModelBytesUnreadable===0&&
  validModelHttp.has(model?.originalModelHttpGate)&&
  jsep?.canonicalJsepResponses>=1&&
  jsep?.unreadableJsepResponses===0&&
  validJsepNetwork.has(jsep?.originalJsepNetworkGate)&&
  (modelHardErrors??0)===0&&(jsepHardErrors??0)===0;
 const trueChromiumNetwork=id.engine==='chromium'&&
  model!=null&&jsep!=null&&
  validModelHttp.has(model.originalModelHttpGate)&&
  validJsepNetwork.has(jsep.originalJsepNetworkGate)&&
  (modelHardErrors??0)===0&&(jsepHardErrors??0)===0&&
  model.originalModelNetworkGate!=='FAIL'&&
  jsep.originalModelNetworkGate!=='FAIL';
 const nativeRed=original.journeyStatus==='FAIL'||terminalReds.length>0;
 const status=nativeRed||badNetwork?'FAIL':
  original.journeyStatus==='PASS'&&(trueWebKitNetwork||trueChromiumNetwork)?'PASS':'BLOCKED';
 // This SHA is OBSERVED only from actual same-context browser response body,
 // never the model that the native C++ runtime compiled or used.
 const originalPair=Boolean(trueWebKitNetwork);
 return {
  schema:'MAIN1054_M266_HTTP_TRUE_ORIGINAL_COHORT_V1',
  checkout:id.checkout,runId:String(id.runId),runAttempt:id.runAttempt,
  engine:id.engine,width:id.width,ordinal,childExitCode:id.exitCode,
  originalJourneyStatus:original.journeyStatus,
  originalWorkerTerminalRedCount:Math.min(terminalReds.length,8),
  naturalOriginalWorkerRedCandidate:terminalReds.length>0&&id.exitCode!==0,
  originalModelNetworkGate:model?.originalModelNetworkGate??'BLOCKED',
  originalModelHttpGate:model?.originalModelHttpGate??'BLOCKED',
  originalModelHardHttpErrors:modelHardErrors,
  originalJsepNetworkGate:jsep?.originalJsepNetworkGate??'BLOCKED',
  originalJsepHardHttpErrors:jsepHardErrors,
  originalModelCanonicalNetworkBodies:model?.originalModelBytesCorrectlyHashed??0,
  originalJsepCanonicalNetworkBodies:jsep?.canonicalJsepResponses??0,
  originalModelOnnxNetworkSHA256:originalPair?EXPECTED_ONNX_SHA256:null,
  originalJsepWasmNetworkSHA256:originalPair?JSEP_SHA:null,
  sameBrowserContextCanonicalPairObserved:originalPair,
  sourceEvidenceGate:status==='FAIL'?'FAIL':'BLOCKED',result:status,
  nativeLoadedOnnxSHA256:null,nativeCompiledJsepSHA256:null,
  nativeAllocatorStateObserved:false,nativeProcessIdentityVerified:false,
  naturalIntermittentWebKitFaultRepaired:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
export function summarizeM266(receipts,{checkout,runId,engine,width,count}){
 if(!checkoutPattern.test(checkout||'')||!runPattern.test(String(runId||''))||
  !['webkit','chromium'].includes(engine)||![320,390,430].includes(width)||
  !Number.isInteger(count)||count<1||count>64||!Array.isArray(receipts))
  throw Error('Invalid exact-source cohort identity');
 const seen=new Set();
 let passed=0,failed=0,blocked=0,realWorkerReds=0,pairs=0,hardHttp=0;
 for(const row of receipts){
  if(row?.schema!=='MAIN1054_M266_HTTP_TRUE_ORIGINAL_COHORT_V1'||
   row.checkout!==checkout||row.runId!==String(runId)||
   row.engine!==engine||row.width!==width||row.runAttempt!==1||
   !Number.isInteger(row.ordinal)||row.ordinal<1||row.ordinal>count||
   seen.has(row.ordinal)||row.familyAlpha!=='HOLD'||row.releaseAuthorized!==false||
   row.nativeLoadedOnnxSHA256!==null||row.nativeCompiledJsepSHA256!==null||
   row.nativeProcessIdentityVerified!==false||
   row.naturalIntermittentWebKitFaultRepaired!==false||
   !['PASS','FAIL','BLOCKED'].includes(row.result)||
   (row.result==='PASS'&&(row.childExitCode!==0||
    row.originalJourneyStatus!=='PASS'||row.sourceEvidenceGate!=='BLOCKED'||
    row.originalWorkerTerminalRedCount>0||
    row.originalModelHardHttpErrors!==0||row.originalJsepHardHttpErrors!==0||
    (engine==='webkit'&&(
     !row.sameBrowserContextCanonicalPairObserved||
     row.originalModelCanonicalNetworkBodies<1||
     row.originalJsepCanonicalNetworkBodies<1||
     row.originalModelOnnxNetworkSHA256!==EXPECTED_ONNX_SHA256||
     row.originalJsepWasmNetworkSHA256!==JSEP_SHA))))||
   (row.result==='FAIL'&&row.sourceEvidenceGate!=='FAIL'))
    throw Error('Missing, stale, duplicate, or forged original source process receipt');
  seen.add(row.ordinal);
  if(row.result==='PASS')passed++;
  if(row.result==='FAIL')failed++;
  if(row.result==='BLOCKED')blocked++;
  if(row.naturalOriginalWorkerRedCandidate)realWorkerReds++;
  if(row.sameBrowserContextCanonicalPairObserved)pairs++;
  if((row.originalModelHardHttpErrors??0)>0||(row.originalJsepHardHttpErrors??0)>0)hardHttp++;
 }
 if(seen.size!==count)throw Error('Missing precommitted original browser process');
 return {
  schema:'MAIN1054_M266_HTTP_TRUE_FULL_ORIGINAL_COHORT_V1',
  checkout,runId:String(runId),engine,width,expectedFreshProcesses:count,
  observedFreshProcesses:seen.size,originalPositiveJourneys:passed,
  originalFailedJourneys:failed,unverifiedOrBlockedJourneys:blocked,
  naturalOriginalWorkerRedCandidates:realWorkerReds,
  originalOnnxJsepSameContextPairWitnesses:pairs,
  observedOriginalNetworkHardErrorAttempts:hardHttp,
  status:failed?'FAIL':blocked?'BLOCKED':'PASS',
  originalNaturalWebKitFailureCausallyRepaired:false,
  nativeProcessIdentityVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
function lockedJPEG(){
 const bytes=readFileSync('benchmark/fixtures/commons-0003.jpg');
 const sha=createHash('sha256').update(bytes).digest('hex');
 const original=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
  .find(x=>x.id==='commons-0003');
 if(!original?.verified||original.sha256!==sha)
  throw Error('Original public JPEG source mismatch');
 return sha;
}
function envIdentity(exitCode){
 return {checkout:process.env.EXPECTED_HEAD,
  engine:process.env.M58_ENGINE,width:Number(process.env.P94_WIDTH),
  runId:process.env.GITHUB_RUN_ID,job:process.env.GITHUB_JOB,
  runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT),
  exitCode,lockedJpegSha:lockedJPEG()};
}
function main(){
 const [op,input,output,exitCode]=process.argv.slice(2);
 if(op==='verify'){
  const r=classifyM266Attempt(readFileSync(input,'utf8'),
    envIdentity(Number(exitCode)),Number(process.env.M266_ORDINAL));
  writeFileSync(output,JSON.stringify(r,null,2));
  console.log('M266_ORIGINAL_HTTP_TRUE_FIRST_ATTEMPT',JSON.stringify(r));
  // Do not exit early: every predeclared attempt must complete and remain
  // counted by the final aggregate even when the original Worker is RED.
 }else if(op==='aggregate'){
  const files=readdirSync(input).filter(name=>/^receipt-[0-9]+[.]json$/.test(name));
  const rows=files.map(name=>JSON.parse(readFileSync(join(input,name),'utf8')));
  const r=summarizeM266(rows,{
   checkout:process.env.EXPECTED_HEAD,runId:process.env.GITHUB_RUN_ID,
   engine:process.env.M58_ENGINE,width:Number(process.env.P94_WIDTH),
   count:Number(process.env.M266_COUNT)});
  writeFileSync(output,JSON.stringify(r,null,2));
  console.log('M266_HTTP_TRUE_ORIGINAL_COHORT_SUMMARY',JSON.stringify(r));
  if(r.status!=='PASS')process.exitCode=1;
 }else if(op==='pin'){
  const original=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
  if(createHash('sha256').update(original).digest('hex')!==runnerSHA)
   throw Error('Original browser runner source drift');
  console.log('M266_PINNED_ORIGINAL_RUNNER',JSON.stringify({
   sourceSHA256:runnerSHA,productWorkerUnmodified:true,
   noInjectedModelOrWasm:true,sourceEvidenceGate:'BLOCKED',
   releaseAuthorized:false,familyAlpha:'HOLD'}));
 }else throw Error('Expected verify, aggregate, or pin');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{main()}catch(e){
  console.error('M266 COHORT EVIDENCE BLOCKED: '+String(e.message).slice(0,120));
  process.exitCode=2;
 }
}
