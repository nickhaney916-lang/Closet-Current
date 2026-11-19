/**
 * MAIN1054 M260: Bind the original same-run P94 native owner journey receipt
 * to M259's context-network binary observation, fail-closed.
 *
 * This is research-only: immutable original Worker/runner; no native/JSEP
 * compiled identity, no hosted accounts, no release authorization.
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {extractM257Attempt} from './m257-real-runner-evidence.mjs';
import {classifyM259} from './m259-original-context-network.mjs';

const checkoutPattern=/^[a-f0-9]{40}$/;
const runPattern=/^[0-9]{3,30}$/;
const digestPattern=/^[a-f0-9]{64}$/;
const networkStatus=['OBSERVED_NETWORK_BODIES','PARTIAL_OR_UNAVAILABLE'];

export function bindM260OriginalAttempt(log,identity){
 if(typeof log!=='string'||log.length>8*1024*1024||
   !identity||!checkoutPattern.test(identity.checkout||'')||
   !runPattern.test(String(identity.runId||''))||
   !Number.isInteger(identity.runAttempt)||
   !Number.isInteger(identity.exitCode)||
   !digestPattern.test(identity.lockedJpegSha||''))
   throw new TypeError('Invalid same-checkout original-run input');

 // The M258-corrected M257 reader already validates the FOUR original native
 // Worker/source/owner-B/P91 records and preserves a terminal P94 failure
 // marker even if previously printed positive rows and child exit=0.
 const journey=extractM257Attempt(log,identity);
 let network=null,networkError=null;
 try{
   network=classifyM259(log,identity.engine,identity.width);
 }catch(e){
   // Never echo untrusted raw log, URL, account name or exception.
   networkError=String(e?.message||'');
 }
 const observed=network?.status==='OBSERVED_NETWORK_BODIES';
 const partial=network?.status==='PARTIAL_OR_UNAVAILABLE';
 const invalidJsep=networkError?.includes('Actual JSEP response mismatch');
 const identityMatches=journey.checkout===identity.checkout&&
   journey.runId===String(identity.runId)&&
   journey.engine===identity.engine&&journey.width===identity.width&&
   journey.runAttempt===identity.runAttempt&&journey.exitCode===identity.exitCode;
 const fatal=journey.journeyStatus==='FAIL'||invalidJsep;
 const retry=identity.runAttempt!==1;
 const journeyGate=fatal?'FAIL':
   retry||!identityMatches||journey.journeyStatus!=='PASS'||!network?'BLOCKED':'PASS';
 const networkGate=invalidJsep?'FAIL':
   !network?'BLOCKED':observed?'OBSERVED':partial?'PARTIAL':'BLOCKED';
 const reasons=[];
 if(journey.journeyStatus==='FAIL') reasons.push('Original browser failed');
 if(invalidJsep) reasons.push('Original JSEP response hash mismatch');
 if(retry) reasons.push('Not first attempt');
 if(!identityMatches) reasons.push('Exact-checkout identity mismatch');
 if(journey.journeyStatus==='BLOCKED') reasons.push('Original owner/source journey not verified');
 if(!network&&!invalidJsep) reasons.push('Network observation absent or invalid');
 if(partial) reasons.push('Original network body visibility incomplete');
 // A successful *network* body hash never establishes the WASM that actually
 // reached/was compiled by the native runtime or the C++ allocator state.
 return {
   schema:'MAIN1054_M260_BOUND_NETWORK_AND_ORIGINAL_JOURNEY_V1',
   checkout:identity.checkout,runId:String(identity.runId),
   runAttempt:identity.runAttempt,engine:identity.engine,width:identity.width,
   originalJpegSHA256:journey.jpegSHA256,
   originalJourneyGate:journeyGate,
   networkObservationGate:networkGate,
   jsepNetworkMatch:network?.wasm===true,
   onnxNetworkObserved:network?.model===true,
   nativeCompiledJsepSHA256:null,nativeLoadedOnnxSHA256:null,
   nativeProcessIdentityVerified:false,
   browserContextNetworkIsNotNativeCompilation:true,
   // A native FAIL can never be laundered through otherwise positive network bytes.
   sourceEvidenceGate:fatal?'FAIL':'BLOCKED',
   releaseAuthorized:false,familyAlpha:'HOLD',
   reasons
 };
}

function pinnedJpegSha(){
 const actual=createHash('sha256')
  .update(readFileSync('benchmark/fixtures/commons-0003.jpg')).digest('hex');
 const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
  .find(item=>item.id==='commons-0003');
 if(!locked?.verified||locked.sha256!==actual)
  throw new Error('Immutable original JPEG source mismatch');
 return actual;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  if(process.argv[2]!=='verify'||!process.argv[3])
   throw new Error('Expected verify plus local first-attempt P94 stdout path');
  const receipt=bindM260OriginalAttempt(readFileSync(process.argv[3],'utf8'),{
   checkout:process.env.EXPECTED_HEAD,
   engine:process.env.M58_ENGINE,width:Number(process.env.P94_WIDTH),
   runId:process.env.GITHUB_RUN_ID,job:process.env.GITHUB_JOB,
   runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT),
   exitCode:Number(process.env.MODEL_EXIT),lockedJpegSha:pinnedJpegSha()
  });
  // Constrained structured details only; never emit raw stdout or secrets.
  console.log('M260_BOUND_NATIVE_NETWORK_EVIDENCE',JSON.stringify(receipt));
  // Genuine original owner journey required; partial Chromium response body
  // is an honest network limitation, not a fake WebKit/Chromium failure.
  if(receipt.originalJourneyGate!=='PASS'||
     receipt.sourceEvidenceGate!=='BLOCKED'||
     !['OBSERVED','PARTIAL'].includes(receipt.networkObservationGate))
    process.exitCode=1;
 }catch(e){
  console.error('M260 BLOCKED: missing or malformed original browser evidence');
  process.exitCode=2;
 }
}
