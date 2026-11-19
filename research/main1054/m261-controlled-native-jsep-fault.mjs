/**
 * M261 original JSEP WASM controlled corrupt-response negative test.
 * This is a deliberate network fault, NOT the historical spontaneous WebKit
 * allocator failure, nor a repair. Source runner and public Worker remain
 * immutable. The corruption exists only in a disposable derived test copy.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {deriveM259} from './m259-original-context-network.mjs';
import {bindM260OriginalAttempt} from './m260-bind-original-network-evidence.mjs';

const nativeRunner='scripts/test-parallel94-native-p88-browser.mjs';
const derived='scripts/.m261-controlled-invalid-jsep-original.mjs';
const originalJsepSHA='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const sourceSha='4803707515debafdc8041069c6081bd20530e455c03c0842d1a0bc30161ed2f5';
const inject=[
" // M261: AFTER the unchanged original egress allowlist registration, override",
" // only the pinned JSEP WASM GET with an uncompileable disposable response.",
" // The rest of original Worker/model/photo/owner browser code remains intact.",
" await context.route(/ort-wasm-simd-threaded[.]jsep[.]wasm(?:[?].*)?$/i,route=>{",
"  if(route.request().method()!=='GET') return route.abort();",
"  m261Interceptions++;",
"  return route.fulfill({status:200,contentType:'application/wasm',",
"   body:Buffer.from('M261_INVALID_JSEP_WASM_NEGATIVE_RESEARCH_ONLY')});",
" });"
].join('\n');
const mark=[
" console.log('M261_CONTROLLED_JSEP_FAULT',JSON.stringify({schema:'M261_CONTROLLED_WASM_V1',engine,width,",
"  interceptedJsepRequests:m261Interceptions,faultType:'invalid-wasm-magic',",
"  originalP94SourceUnmodified:true,originalWorkerUnmodified:true,",
"  naturalWebKitAllocatorFailure:false,releaseAuthorized:false,familyAlpha:'HOLD'}));"
].join('\n');
function replaceOnce(src,needle,replacement){
 if(src.indexOf(needle)<0||src.indexOf(needle)!==src.lastIndexOf(needle))
  throw new Error('Original derived P94 anchor unavailable or ambiguous');
 return src.replace(needle,replacement);
}
export function deriveM261(original) {
 if(typeof original!=='string'||
  createHash('sha256').update(original).digest('hex')!==sourceSha)
  throw new Error('Original P94 source changed: no negative research run allowed');
 let s=deriveM259(original);
 s=replaceOnce(s,'const m259Rows=[],m259Pending=[];',
  'const m259Rows=[],m259Pending=[];\nlet m261Interceptions=0;');
 s=replaceOnce(s," stage='sign-in';",inject+"\n stage='sign-in';");
 s=replaceOnce(s," console.log('M259_CONTEXT_NETWORK_WITNESS'",
  mark+"\n console.log('M259_CONTEXT_NETWORK_WITNESS'");
 if(!s.includes('M261_CONTROLLED_JSEP_FAULT'))
  throw new Error('No negative response injection');
 return s;
}
export function verifyM261Failure(log,exitCode,identity){
 if(typeof log!=='string'||log.length>8*1024*1024||
   !identity||identity.runAttempt!==1||
   !Number.isInteger(exitCode)||exitCode<0||exitCode>255)
  throw new TypeError('Invalid first-attempt bounded genuine negative-run transcript');
 const tag='M261_CONTROLLED_JSEP_FAULT ';
 const rows=log.split(/\r?\n/).filter(line=>line.startsWith(tag));
 if(rows.length!==1)throw new Error('Missing/duplicate original-context interception marker');
 let fault;
 try{fault=JSON.parse(rows[0].slice(tag.length));}
 catch{throw new Error('Malformed negative-request interception marker');}
 if(fault?.schema!=='M261_CONTROLLED_WASM_V1'||
    fault.engine!==identity.engine||fault.width!==identity.width||
    (!Number.isInteger(fault.interceptedJsepRequests)||
     fault.interceptedJsepRequests<1||fault.interceptedJsepRequests>8)||
    fault.faultType!=='invalid-wasm-magic'||
    fault.originalP94SourceUnmodified!==true||
    fault.originalWorkerUnmodified!==true||
    fault.naturalWebKitAllocatorFailure!==false||
    fault.releaseAuthorized!==false||fault.familyAlpha!=='HOLD')
  throw new Error('Controlled JSEP response not independently observed');
 // This MUST be a real original-run nonzero result, not a synthetic test RED.
 const networkTag='M259_CONTEXT_NETWORK_WITNESS ';
 const netLines=log.split(/\r?\n/).filter(line=>line.startsWith(networkTag));
 let network;
 if(netLines.length!==1)throw new Error('Missing/duplicate actual invalid-JSEP response witness');
 try{network=JSON.parse(netLines[0].slice(networkTag.length));}
 catch{throw new Error('Malformed invalid-JSEP network response witness');}
 const originalJsepRows=Array.isArray(network?.rows)?
   network.rows.filter(r=>r?.kind==='jsep-wasm'):[];
 const invalid=originalJsepRows.filter(r=>r.status==='invalid-wasm-magic'&&
   r.sha256==='4a333b50e854cbe7946e70d8a1d715a4c86f5fee16a3c2f4d6bf2e8ee46ebe01'&&
   r.size===45).length;
 const unreadable=originalJsepRows.filter(r=>r.status==='body-unavailable').length;
 // The actual Chromium protocol sometimes withholds a fulfilled response body;
 // do not invent a SHA. At least one response MUST be directly hash-verified.
 // Every intercepted request must be independently accounted for as either
 // invalid bytes observed or explicitly unavailable in the original context.
 if(network?.engine!==identity.engine||network.width!==identity.width||
   invalid<1||invalid+unreadable!==fault.interceptedJsepRequests||
   originalJsepRows.length!==fault.interceptedJsepRequests)
   throw new Error('Original invalid WASM responses do not match actual interceptions');
 if(exitCode===0||!log.split(/\r?\n/).some(line=>line.startsWith('M58_REAL_P88_WORKER_FAIL ')))
  throw new Error('Original P94 did not fail naturally from actual corrupt network bytes');
 // No post-model owner save/restore can be treated as successful in this negative case.
 for(const label of ['M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS ',
   'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY ',
   'P91_FULL_JOURNEY_PASS ']){
  if(log.split(/\r?\n/).some(line=>line.startsWith(label)))
   throw new Error('Unexpected owner/save/restore or P91 success after broken JSEP');
 }
 const result=bindM260OriginalAttempt(log,{...identity,exitCode});
 if(result.originalJourneyGate!=='FAIL'||
    result.sourceEvidenceGate!=='FAIL'||
    result.releaseAuthorized!==false||
    result.familyAlpha!=='HOLD')
  throw new Error('M260 failed to preserve original browser RED');
 return {
  schema:'MAIN1054_M261_ACTUAL_BROWSER_INDUCED_JSEP_RED_V1',
  checkout:identity.checkout,engine:identity.engine,width:identity.width,
  runId:String(identity.runId),runAttempt:identity.runAttempt,
  injectionInterceptCount:fault.interceptedJsepRequests,
  invalidJsepResponseSHAObserved:invalid,unreadableJsepResponseBodies:unreadable,
  originalRunnerExitNonzero:true,
  originalFailureMarkerObserved:true,
  ownerSaveOrRestoreSuccessObserved:false,
  originalJourneyGate:'FAIL',sourceEvidenceGate:'FAIL',
  responseBecameNativeCausalRepair:false,
  actualIntermittentWebKitFaultReproduced:false,
  privacyExposureObserved:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
function jpeg(){
 const actual=createHash('sha256')
 .update(readFileSync('benchmark/fixtures/commons-0003.jpg')).digest('hex');
 const source=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
  .find(x=>x.id==='commons-0003');
 if(!source?.verified||source.sha256!==actual)
  throw new Error('Original public JPEG source changed');
 return actual;
}
function run(){
 if(process.argv[2]==='prepare'){
  const original=readFileSync(nativeRunner,'utf8');
  writeFileSync(derived,deriveM261(original));
  console.log('M261_DISPOSABLE_SOURCE_READY',JSON.stringify({
   originalSHA256:sourceSha,sourceUnchanged:true,originalWorkerUnchanged:true,
   intentionalJsepNetworkCorruption:true,familyAlpha:'HOLD'}));
 }else if(process.argv[2]==='verify'){
  const originalLog=readFileSync(process.argv[3],'utf8');
  const result=verifyM261Failure(originalLog,Number(process.env.MODEL_EXIT),{
   checkout:process.env.EXPECTED_HEAD,
   engine:process.env.M58_ENGINE,
   width:Number(process.env.P94_WIDTH),
   runId:process.env.GITHUB_RUN_ID,job:process.env.GITHUB_JOB,
   runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT),
   lockedJpegSha:jpeg()
  });
  console.log('M261_FAIL_CLOSED_ORIGINAL_JSEP_NEGATIVE_PASS',JSON.stringify(result));
 }else throw new Error('Expected prepare or verify');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{run();}catch(e){console.error('M261 NEGATIVE EVIDENCE BLOCKED: '+String(e.message).slice(0,130));process.exitCode=1;}
}
