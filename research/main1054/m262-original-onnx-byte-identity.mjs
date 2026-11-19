/**
 * M262: original ONNX model-byte identity, independent of model/JSEP success.
 * M259/M260 verified JSEP network bytes but counted ANY nonempty ONNX response
 * as "model observed". This never authorized release, but overstated the
 * original-model identity available to WebKit root-cause investigations.
 *
 * Research-only; immutable shipped Worker and original P94 browser runner.
 * Browser-context network hashes are NOT compiled/native model attestation.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {deriveM259} from './m259-original-context-network.mjs';
import {bindM260OriginalAttempt} from './m260-bind-original-network-evidence.mjs';

export const EXPECTED_ONNX_SHA256='02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3';
export const EXPECTED_ONNX_BYTES=15199746;
export const CORRUPT_ONNX_BYTES=Buffer.from('M262_INTENTIONALLY_INVALID_ONNX_WEIGHTS_NOT_THE_ORIGINAL_MODEL');
export const CORRUPT_ONNX_SHA256=createHash('sha256').update(CORRUPT_ONNX_BYTES).digest('hex');
const originalRunner='scripts/test-parallel94-native-p88-browser.mjs';
const runnerSha='4803707515debafdc8041069c6081bd20530e455c03c0842d1a0bc30161ed2f5';
const generated='scripts/.m262-original-onnx-network-study.mjs';

function replaceOnce(source,needle,replacement){
 if(source.indexOf(needle)<0||source.indexOf(needle)!==source.lastIndexOf(needle))
  throw Error('Pinned original P94-derived injection anchor absent/ambiguous');
 return source.replace(needle,replacement);
}

export function deriveM262(source,{corrupt=false}={}){
 if(typeof source!=='string'||createHash('sha256').update(source).digest('hex')!==runnerSha)
  throw Error('Original P94 source changed; refuse derived ONNX study');
 let result=deriveM259(source);
 if(!corrupt)return result;
 result=replaceOnce(result,'const m259Rows=[],m259Pending=[];',
  'const m259Rows=[],m259Pending=[];\nlet m262OnnxInterceptions=0;');
 const injection=[
  ' // M262: only ONNX model GET, after unchanged original browser egress guard.',
  ' await context.route(new RegExp("Xenova[/]segformer_b0_clothes[/].*[.]onnx(?:[?].*)?$","i"),route=>{',
  "  if(route.request().method()!=='GET') return route.abort();",
  '  m262OnnxInterceptions++;',
  "  return route.fulfill({status:200,contentType:'application/octet-stream',",
  "   body:Buffer.from('M262_INTENTIONALLY_INVALID_ONNX_WEIGHTS_NOT_THE_ORIGINAL_MODEL')});",
  ' });'
 ].join('\n');
 result=replaceOnce(result," stage='sign-in';",injection+"\n stage='sign-in';");
 result=replaceOnce(result," console.log('M259_CONTEXT_NETWORK_WITNESS'",
  " console.log('M262_ONNX_INJECTION_OBSERVED',JSON.stringify({schema:'M262_ONNX_NETWORK_FAULT_V1',engine,width,intercepted:m262OnnxInterceptions,originalRunnerUnmodified:true,releaseAuthorized:false,familyAlpha:'HOLD'}));\n console.log('M259_CONTEXT_NETWORK_WITNESS'");
 return result;
}
function markerRows(log,tag){
 const rows=log.split(/\r?\n/).filter(line=>line.startsWith(tag+' '));
 if(rows.length!==1)throw Error('Missing or duplicate bounded '+tag+' receipt');
 try{return JSON.parse(rows[0].slice(tag.length+1));}
 catch{throw Error('Invalid bounded structured '+tag+' receipt');}
}
export function assessM262(log,identity){
 if(typeof log!=='string'||log.length>8*1024*1024||
    !identity||!['chromium','webkit'].includes(identity.engine)||
    ![320,390,430].includes(identity.width))
  throw new TypeError('Untrusted original-browser model witness');
 const journey=bindM260OriginalAttempt(log,identity);
 const witness=markerRows(log,'M259_CONTEXT_NETWORK_WITNESS');
 if(witness?.schema!=='M259_CONTEXT_NETWORK_V1'||
    witness.engine!==identity.engine||witness.width!==identity.width||
    witness.familyAlpha!=='HOLD'||witness.sourceEvidenceGate!=='BLOCKED'||
    witness.compiledWasmAttested!==false||witness.loadedModelAttested!==false||
    witness.sameNativeProcessProven!==false||
    !Array.isArray(witness.rows)||witness.rows.length>32)
  throw Error('Model witness changed or incorrectly claims native identity');
 let good=0,unreadable=0,mismatch=0,redirectOrNon200=0;
 for(const row of witness.rows){
  if(row?.kind!=='model-onnx')continue;
  if(row.status==='body-observed'){
   if(!/^[a-f0-9]{64}$/.test(row.sha256||'')||
      !Number.isInteger(row.size)||row.size<=0)throw Error('Invalid ONNX byte witness');
   if(row.sha256===EXPECTED_ONNX_SHA256&&row.size===EXPECTED_ONNX_BYTES)good++;
   else mismatch++;
  }else if(row.status==='body-unavailable')unreadable++;
  else if(row.status==='non-200')redirectOrNon200++;
  else throw Error('Unknown model response status');
 }
 // Genuine observed wrong ONNX bytes are an explicit source FAIL even if the
 // unchanged M260 evidence reader otherwise recorded a healthy user journey.
 // A successful model body alongside a non-200 redirect/error or unreadable
 // response does not establish the identity of EVERY attempted model load.
 // Classify mixed observations PARTIAL; never promote them to OBSERVED.
 const modelIdentityGate=mismatch?'FAIL':good&&!unreadable&&!redirectOrNon200?'OBSERVED':'PARTIAL';
 const first=identity.runAttempt===1;
 const originalJourneyGate=mismatch?'FAIL':journey.originalJourneyGate;
 const sourceEvidenceGate=mismatch||journey.sourceEvidenceGate==='FAIL'?'FAIL':'BLOCKED';
 return {
  schema:'MAIN1054_M262_SOURCE_ONNX_BYTE_WITNESS_V1',
  checkout:identity.checkout,engine:identity.engine,width:identity.width,
  runId:String(identity.runId),runAttempt:identity.runAttempt,
  originalJourneyGate:first?originalJourneyGate:'BLOCKED',
  originalJsepNetworkGate:journey.networkObservationGate,
  originalModelNetworkGate:first?modelIdentityGate:'BLOCKED',
  originalModelBytesCorrectlyHashed:good,
  originalModelBytesUnreadable:unreadable,
  changedOrInvalidModelBodies:mismatch,
  redirectedOrNon200ModelResponses:redirectOrNon200,
  expectedModelSHA256:EXPECTED_ONNX_SHA256,
  expectedModelBytes:EXPECTED_ONNX_BYTES,
  originalOnnxNetworkObserved:good>0,
  nativeLoadedOnnxSHA256:null,
  nativeCompiledJsepSHA256:null,
  nativeModelProcessIdentityVerified:false,
  browserContextHashIsNotNativeAttestation:true,
  sourceEvidenceGate:first?sourceEvidenceGate:'BLOCKED',
  naturalIntermittentWebKitFaultRepaired:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
function expectedPhotoSha(){
 const bytes=readFileSync('benchmark/fixtures/commons-0003.jpg');
 const sha=createHash('sha256').update(bytes).digest('hex');
 const item=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
  .find(x=>x.id==='commons-0003');
 if(!item?.verified||item.sha256!==sha)throw Error('Pinned public original JPEG changed');
 return sha;
}
export function verifyM262(log,identity,{corrupt=false}={}){
 const result=assessM262(log,identity);
 if(identity.runAttempt!==1)throw Error('Non-first attempt is ineligible');
 if(!corrupt){
  // A real WebKit original ONNX GET may issue a 307 redirect followed by a
  // SHA-attested 200 model body. It is PARTIAL network evidence, not a failed
  // owner journey or an OBSERVED entire-response chain. Never invent a model
  // SHA for unreadable responses; WebKit must directly hash the canonical
  // final ONNX body and JSEP to accept a successful native owner journey.
  const webkitSourceBodyIndependentlySeen=
   result.originalModelBytesCorrectlyHashed>=1&&
   result.originalModelBytesUnreadable===0&&
   result.originalJsepNetworkGate==='OBSERVED';
  if(identity.exitCode!==0||result.originalJourneyGate!=='PASS'||
     result.sourceEvidenceGate!=='BLOCKED'||
     result.originalModelNetworkGate==='FAIL'||
     (identity.engine==='webkit'&&!webkitSourceBodyIndependentlySeen))
   throw Error('Original first-attempt model/network acceptance incomplete');
 }else{
  const mark=markerRows(log,'M262_ONNX_INJECTION_OBSERVED');
  if(mark?.schema!=='M262_ONNX_NETWORK_FAULT_V1'||
     mark.engine!==identity.engine||mark.width!==identity.width||
     !Number.isInteger(mark.intercepted)||mark.intercepted<1||mark.intercepted>8||
     mark.originalRunnerUnmodified!==true||
     mark.releaseAuthorized!==false||mark.familyAlpha!=='HOLD')
   throw Error('ONNX original-context injection absent or invalid');
  if(identity.exitCode===0||result.originalJourneyGate!=='FAIL'||
     result.originalModelNetworkGate!=='FAIL'||
     result.changedOrInvalidModelBodies<1||result.sourceEvidenceGate!=='FAIL')
   throw Error('Changed original ONNX network bytes did not preserve RED');
  const rows=markerRows(log,'M259_CONTEXT_NETWORK_WITNESS').rows;
  const models=rows.filter(r=>r.kind==='model-onnx');
  // Every actual controlled model GET must have a response row. Unknown body
  // bytes are disclosed, never guessed. A legitimate original model body or
  // extra model response cannot be laundered through one corrupted SHA.
  if(models.length!==mark.intercepted||
     models.some(r=>r.status==='body-observed'&&
      (r.sha256!==CORRUPT_ONNX_SHA256||r.size!==CORRUPT_ONNX_BYTES.length))||
     models.some(r=>!['body-observed','body-unavailable'].includes(r.status))||
     result.originalModelBytesCorrectlyHashed!==0)
   throw Error('Controlled ONNX interception/body-count/identity mismatch');
  if(!rows.some(r=>r.kind==='model-onnx'&&r.status==='body-observed'&&
    r.sha256===CORRUPT_ONNX_SHA256&&r.size===CORRUPT_ONNX_BYTES.length))
   throw Error('No SHA-attested genuinely changed ONNX response body');
  if(!log.split(/\r?\n/).some(s=>s.startsWith('M58_REAL_P88_WORKER_FAIL ')))
   throw Error('No actual original model failure marker');
  for(const label of ['P91_FULL_JOURNEY_PASS ','M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS ',
    'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY '])
   if(log.split(/\r?\n/).some(s=>s.startsWith(label)))
    throw Error('Unexpected post-corruption owner success');
 }
 return {...result,controlledCorruptOnnxResponse:corrupt};
}
function main(){
 const action=process.argv[2];
 if(action==='prepare'){
  const source=readFileSync(originalRunner,'utf8');
  const corrupt=process.env.M262_CASE==='invalid-onnx';
  writeFileSync(generated,deriveM262(source,{corrupt}));
  console.log('M262_PINNED_DISPOSABLE_RUNNER',JSON.stringify({corrupt,
    sourceSha256:runnerSha,originalProductUnmodified:true,familyAlpha:'HOLD'}));
 }else if(action==='verify'){
  const log=readFileSync(process.argv[3],'utf8');
  const identity={
   checkout:process.env.EXPECTED_HEAD,
   engine:process.env.M58_ENGINE,width:Number(process.env.P94_WIDTH),
   runId:process.env.GITHUB_RUN_ID,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT),
   job:process.env.GITHUB_JOB,exitCode:Number(process.env.MODEL_EXIT),
   lockedJpegSha:expectedPhotoSha()
  };
  const result=verifyM262(log,identity,{corrupt:process.env.M262_CASE==='invalid-onnx'});
  console.log('M262_ORIGINAL_ONNX_INTEGRITY_RESULT',JSON.stringify(result));
 }else throw Error('Expected prepare/verify');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{main()}catch(e){console.error('M262 BLOCKED: '+String(e.message).slice(0,140));process.exitCode=1;}
}
