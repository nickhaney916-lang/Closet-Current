/**
 * M268: Independent original native P94 WebKit/Chromium first-attempt cohort
 * gated by TRUE redirect ancestry, current ONNX/JSEP 404/500 rejection, and
 * synthetic-owner private photo→2D/v4 journey. M267 verified redirect lineage
 * once; M266 had a native cohort but did not use M267's redirectedFrom roots.
 *
 * Original browser Worker, model, JPEG, browser runner never modified.
 * Browser-network lineage is NOT native-compiled/JSEP memory provenance.
 * NO cleanup of real RED, retry-to-green, hosted acceptance or release.
 */
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {extractM257Attempt} from './m257-real-runner-evidence.mjs';
import {assessM267} from './m267-original-network-redirect-chain.mjs';
import {EXPECTED_ONNX_SHA256} from './m262-original-onnx-byte-identity.mjs';
import {JSEP_SHA} from './m265-original-jsep-http-truth.mjs';

const fullSHA=/^[a-f0-9]{40}$/;
const digest=/^[a-f0-9]{64}$/;
const runId=/^[0-9]{3,30}$/;
const originalRunnerHash='4803707515debafdc8041069c6081bd20530e455c03c0842d1a0bc30161ed2f5';
const originalWorkerBlob='ab7d3837139c5b7d693383f9d6617e199ec8de4f';
function identityCheck(i){
 if(!i||!fullSHA.test(i.checkout||'')||
    !['webkit','chromium'].includes(i.engine)||![320,390,430].includes(i.width)||
    !runId.test(String(i.runId||''))||i.runAttempt!==1||
    !Number.isInteger(i.exitCode)||i.exitCode<0||i.exitCode>255||
    !digest.test(i.lockedJpegSha||'')||
    !/^[\w-]{1,100}$/.test(i.job||''))throw Error('Invalid exact first native process identity');
}
function redMarkerCount(log){
 return log.split(/\r?\n/).filter(x=>x.startsWith('M58_REAL_P88_WORKER_FAIL ')).length;
}
export function classifyM268(log,i,ordinal){
 if(typeof log!=='string'||log.length>8*1024*1024||
    !Number.isInteger(ordinal)||ordinal<1||ordinal>64)
  throw Error('Invalid bounded original browser transcript/ordinal');
 identityCheck(i);
 const original=extractM257Attempt(log,i);
 const redCount=redMarkerCount(log);
 let chain=null;
 try{chain=assessM267(log,i)}catch{}
 // A genuine natural Worker failure is FAIL regardless of whether its network
 // receipt was printed. Missing network data must never invent allocator cause.
 const terminalRed=i.exitCode!==0||redCount>0||original.journeyStatus==='FAIL';
 const badChain=chain?.redirectChainGate==='FAIL'||chain?.sourceEvidenceGate==='FAIL'||
  (chain?.originalModelHttpErrors??0)>0||(chain?.originalJsepHttpErrors??0)>0;
 const provenWebkit=i.engine==='webkit'&&chain?.redirectChainGate==='LINKED'&&
  chain.modelChains>=1&&chain.jsepChains>=1&&
  chain.originalModelCanonicalBodies>=1&&chain.originalJsepCanonicalBodies>=1&&
  chain.originalModelHttpErrors===0&&chain.originalJsepHttpErrors===0&&
  chain.sourceEvidenceGate==='BLOCKED';
 const partialChromium=i.engine==='chromium'&&chain?.redirectChainGate==='LINKED'&&
  chain.modelChains>=1&&chain.jsepChains>=1&&
  chain.originalModelHttpErrors===0&&chain.originalJsepHttpErrors===0&&
  chain.sourceEvidenceGate==='BLOCKED';
 const status=terminalRed||badChain?'FAIL':
  original.journeyStatus==='PASS'&&(provenWebkit||partialChromium)?'PASS':'BLOCKED';
 // Do not ascribe broad native model-session RED to WASM allocator solely
 // based on a generic P94 assertion; no native memory access has been read.
 return {
  schema:'MAIN1054_M268_FIRST_ATTEMPT_REDIRECT_LINKED_V1',
  checkout:i.checkout,runId:String(i.runId),runAttempt:i.runAttempt,
  engine:i.engine,width:i.width,ordinal,
  originalChildExitCode:i.exitCode,
  originalOwnerJourneyGate:original.journeyStatus,
  originalWorkerTerminalRedCount:Math.min(redCount,8),
  naturalOriginalWorkerRedCandidate:redCount>0&&i.exitCode!==0,
  originalNetworkChainGate:chain?.redirectChainGate??'BLOCKED',
  originalModelNetworkGate:chain?.originalModelNetworkGate??'BLOCKED',
  originalJsepNetworkGate:chain?.originalJsepNetworkGate??'BLOCKED',
  originalModelHttpErrors:chain?.originalModelHttpErrors??null,
  originalJsepHttpErrors:chain?.originalJsepHttpErrors??null,
  originalModelRedirectChains:chain?.modelRedirectChains??0,
  originalJsepRedirectChains:chain?.jsepRedirectChains??0,
  originalModelOrphanRedirectChains:chain?.orphanRedirectChains??null,
  originalNetworkDuplicateTerminals:chain?.multipleTerminals??null,
  originalModelCanonicalBodies:chain?.originalModelCanonicalBodies??0,
  originalJsepCanonicalBodies:chain?.originalJsepCanonicalBodies??0,
  originalOnnxNetworkSHA256:provenWebkit?EXPECTED_ONNX_SHA256:null,
  originalJsepNetworkSHA256:provenWebkit?JSEP_SHA:null,
  sameBrowserContextCanonicalRedirectChainsVerified:Boolean(provenWebkit),
  originalResult:status,
  sourceEvidenceGate:status==='FAIL'?'FAIL':'BLOCKED',
  nativeCompiledJsepSHA256:null,nativeLoadedOnnxSHA256:null,
  nativeAllocatorStateObserved:false,
  causalPermanentWebKitFixProven:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
export function summarizeM268(records,{checkout,runId:run,engine,width,count}){
 if(!fullSHA.test(checkout||'')||!runId.test(String(run||''))||
    !['webkit','chromium'].includes(engine)||![320,390,430].includes(width)||
    !Number.isInteger(count)||count<1||count>64||!Array.isArray(records))
  throw Error('Invalid original first-attempt cohort identifier');
 const seen=new Set();
 let pass=0,fail=0,blocked=0,naturalRed=0,verifiedChains=0,hardHttp=0;
 for(const r of records){
  if(r?.schema!=='MAIN1054_M268_FIRST_ATTEMPT_REDIRECT_LINKED_V1'||
    r.checkout!==checkout||r.runId!==String(run)||
    r.engine!==engine||r.width!==width||r.runAttempt!==1||
    !Number.isInteger(r.ordinal)||r.ordinal<1||r.ordinal>count||
    seen.has(r.ordinal)||r.familyAlpha!=='HOLD'||r.releaseAuthorized!==false||
    r.nativeCompiledJsepSHA256!==null||r.nativeLoadedOnnxSHA256!==null||
    r.causalPermanentWebKitFixProven!==false||
    !['PASS','FAIL','BLOCKED'].includes(r.originalResult)||
    (r.originalResult==='PASS'&&(
      r.originalChildExitCode!==0||r.originalOwnerJourneyGate!=='PASS'||
      r.originalWorkerTerminalRedCount!==0||
      r.originalNetworkChainGate!=='LINKED'||
      r.originalModelHttpErrors!==0||r.originalJsepHttpErrors!==0||
      r.sourceEvidenceGate!=='BLOCKED'||
      (engine==='webkit'&&(
        r.originalModelCanonicalBodies<1||r.originalJsepCanonicalBodies<1||
        r.originalOnnxNetworkSHA256!==EXPECTED_ONNX_SHA256||
        r.originalJsepNetworkSHA256!==JSEP_SHA||
        r.sameBrowserContextCanonicalRedirectChainsVerified!==true))))||
    (r.originalResult==='FAIL'&&r.sourceEvidenceGate!=='FAIL'))
    throw Error('Stale, duplicate or false original source/redirect cohort receipt');
  seen.add(r.ordinal);
  if(r.originalResult==='PASS')pass++;
  if(r.originalResult==='FAIL')fail++;
  if(r.originalResult==='BLOCKED')blocked++;
  if(r.naturalOriginalWorkerRedCandidate)naturalRed++;
  if(r.sameBrowserContextCanonicalRedirectChainsVerified)verifiedChains++;
  if((r.originalModelHttpErrors??0)>0||(r.originalJsepHttpErrors??0)>0)hardHttp++;
 }
 if(seen.size!==count)throw Error('Missing original precommitted fresh browser process');
 return {
  schema:'MAIN1054_M268_REDIRECT_LINKED_FRESH_COHORT_V1',
  checkout,runId:String(run),engine,width,expectedFreshProcesses:count,
  observedFreshProcesses:seen.size,
  originalPositiveJourneys:pass,originalFailedJourneys:fail,
  originalBlockedJourneys:blocked,naturalOriginalWorkerRedCandidates:naturalRed,
  originalFullyLinkedCanonicalNetworkPairs:verifiedChains,
  originalHardHTTPFailureAttempts:hardHttp,
  status:fail?'FAIL':blocked?'BLOCKED':'PASS',
  nativeAllocatorRootCauseVerified:false,permanentWebKitFixProven:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
function lockedJPEG(){
 const sha=createHash('sha256').update(readFileSync('benchmark/fixtures/commons-0003.jpg')).digest('hex');
 const original=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
  .find(row=>row.id==='commons-0003');
 if(original?.verified!==true||original.sha256!==sha)
  throw Error('Public source JPEG pin changed');
 return sha;
}
function envIdentity(exitCode){
 return {checkout:process.env.EXPECTED_HEAD,engine:process.env.M58_ENGINE,
  width:Number(process.env.P94_WIDTH),runId:process.env.GITHUB_RUN_ID,
  job:process.env.GITHUB_JOB,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT),
  exitCode,lockedJpegSha:lockedJPEG()};
}
function main(){
 const [action,input,output,code]=process.argv.slice(2);
 if(action==='pin'){
  const sha=createHash('sha256').update(readFileSync('scripts/test-parallel94-native-p88-browser.mjs')).digest('hex');
  if(sha!==originalRunnerHash)throw Error('Original P94 source runner drift');
  console.log('M268_ORIGINAL_RUNNER_PIN',JSON.stringify({
   originalRunnerSha:sha,expectedOriginalWorkerGitBlob:originalWorkerBlob,
   originalWorkerUnmodified:true,releaseAuthorized:false,familyAlpha:'HOLD'
  }));
 }else if(action==='verify'){
  const result=classifyM268(readFileSync(input,'utf8'),
   envIdentity(Number(code)),Number(process.env.M268_ORDINAL));
  writeFileSync(output,JSON.stringify(result,null,2));
  console.log('M268_ORIGINAL_FIRST_ATTEMPT_REDIRECT_CHAIN',JSON.stringify(result));
  // Continue the exact precommitted finite cohort even after native RED; the
  // aggregate exits red and NEVER drops or retries a failed process.
 }else if(action==='aggregate'){
  const files=readdirSync(input).filter(x=>/^receipt-[0-9]+[.]json$/.test(x));
  const rows=files.map(x=>JSON.parse(readFileSync(join(input,x),'utf8')));
  const result=summarizeM268(rows,{
   checkout:process.env.EXPECTED_HEAD,runId:process.env.GITHUB_RUN_ID,
   engine:process.env.M58_ENGINE,width:Number(process.env.P94_WIDTH),
   count:Number(process.env.M268_COUNT)
  });
  writeFileSync(output,JSON.stringify(result,null,2));
  console.log('M268_ORIGINAL_REDIRECT_LINKED_COHORT_SUMMARY',JSON.stringify(result));
  if(result.status!=='PASS')process.exitCode=1;
 }else throw Error('Expected pin, verify or aggregate');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{main()}catch(e){console.error('M268 BLOCKED: '+String(e.message).slice(0,145));process.exitCode=2;}
}
