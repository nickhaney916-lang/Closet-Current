/**
 * M265: original pinned JSEP WASM HTTP integrity, separate from model ONNX.
 * A canonical WASM body + one 404/500 must NEVER be network "OBSERVED".
 * Browser-response hashes are not native compiled or allocator attestation.
 * ONLY disposable, original-P94-derived research browser code is changed.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {deriveM264,assessM264,verifyM264} from './m264-model-http-redirect-truth.mjs';
import {bindM260OriginalAttempt} from './m260-bind-original-network-evidence.mjs';
const runner='scripts/test-parallel94-native-p88-browser.mjs';
const disposable='scripts/.m265-original-jsep-http-study.mjs';
const runnerSHA='4803707515debafdc8041069c6081bd20530e455c03c0842d1a0bc30161ed2f5';
export const JSEP_SHA='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
export const JSEP_BYTES=21596019;
const redirects=new Set([301,302,303,307,308]);
function once(source,anchor,replace){
 if(source.indexOf(anchor)<0||source.indexOf(anchor)!==source.lastIndexOf(anchor))
  throw Error('Original browser source anchor absent or ambiguous');
 return source.replace(anchor,replace);
}
export function deriveM265(original,{http404=false}={}){
 if(typeof original!=='string'||
   createHash('sha256').update(original).digest('hex')!==runnerSHA)
  throw Error('Original P94 runner drift; JSEP HTTP investigation denied');
 let s=deriveM264(original);
 if(!http404)return s;
 s=once(s,'const m259Rows=[],m259Pending=[];',
   'const m259Rows=[],m259Pending=[];\nlet m265JsepIntercepts=0;');
 const route=[
  ' // M265: research-only native original JSEP GET 404. Worker/model untouched.',
  ' await context.route(/ort-wasm-simd-threaded[.]jsep[.]wasm(?:[?].*)?$/i,route=>{',
  "  if(route.request().method()!=='GET')return route.abort();",
  '  m265JsepIntercepts++;',
  "  return route.fulfill({status:404,contentType:'text/plain',body:'M265_JSEP_HTTP404_RESEARCH_ONLY'});",
  ' });'
 ].join('\n');
 s=once(s," stage='sign-in';",route+"\n stage='sign-in';");
 const mark=" console.log('M265_ORIGINAL_JSEP_HTTP404_FAULT',JSON.stringify({schema:'M265_JSEP_HTTP404_V1',engine,width,intercepted:m265JsepIntercepts,originalRunnerUnmodified:true,originalWorkerUnmodified:true,releaseAuthorized:false,familyAlpha:'HOLD'}));\n";
 s=once(s," console.log('M259_CONTEXT_NETWORK_WITNESS'",
  mark+" console.log('M259_CONTEXT_NETWORK_WITNESS'");
 return s;
}
function parseRow(log,label){
 if(typeof log!=='string'||log.length>8*1024*1024)throw TypeError('Untrusted bounded browser log');
 const matches=log.split(/\r?\n/).filter(x=>x.startsWith(label+' '));
 if(matches.length!==1)throw Error('Missing/duplicate '+label+' original receipt');
 try{return JSON.parse(matches[0].slice(label.length+1));}
 catch{throw Error('Malformed '+label+' original receipt');}
}
export function assessM265(log,identity){
 const native=bindM260OriginalAttempt(log,identity);
 const data=parseRow(log,'M259_CONTEXT_NETWORK_WITNESS');
 if(data?.schema!=='M259_CONTEXT_NETWORK_V1'||data.engine!==identity.engine||
    data.width!==identity.width||data.familyAlpha!=='HOLD'||
    data.sourceEvidenceGate!=='BLOCKED'||
    data.loadedModelAttested!==false||data.compiledWasmAttested!==false||
    data.sameNativeProcessProven!==false||!Array.isArray(data.rows)||
    data.rows.length>32)
  throw Error('Untrusted original JSEP network receipt');
 const jseps=data.rows.filter(r=>r?.kind==='jsep-wasm');
 if(!jseps.length)throw Error('Original JSEP network not observed');
 let canonical=0,unknown=0,redirectCount=0,httpErrors=0,badBytes=0;
 for(const r of jseps){
  if(r.status==='body-observed'){
   if(r.sha256===JSEP_SHA&&r.size===JSEP_BYTES)canonical++;
   else badBytes++;
  }else if(r.status==='body-unavailable'){
   if('sha256' in r||'size' in r||'httpStatus' in r)
    throw Error('Forged unreadable original JSEP response');
   unknown++;
  }else if(r.status==='non-200'){
   if(!Number.isInteger(r.httpStatus)||r.httpStatus<100||r.httpStatus>599||
     typeof r.hasLocation!=='boolean')
    throw Error('Missing original JSEP HTTP response status');
   if(redirects.has(r.httpStatus)&&r.hasLocation)redirectCount++;
   else httpErrors++;
  }else if(r.status==='invalid-wasm-magic'){
   badBytes++;
  }else throw Error('Untrusted JSEP response status');
 }
 const jsepGate=badBytes||httpErrors?'FAIL':
  canonical&&!unknown&&!redirectCount?'OBSERVED':'PARTIAL';
 const modelRows=data.rows.filter(x=>x?.kind==='model-onnx');
 // An early JSEP load failure can occur before any model response. Do not
 // require a fabricated model receipt for a genuine failing native Worker.
 const prior=modelRows.length?assessM264(log,identity):null;
 const modelGate=prior?.originalModelNetworkGate||'NOT_OBSERVED';
 const fatal=native.originalJourneyGate==='FAIL'||jsepGate==='FAIL'||modelGate==='FAIL';
 return {
  schema:'MAIN1054_M265_ORIGINAL_JSEP_HTTP_V1',
  checkout:identity.checkout,engine:identity.engine,width:identity.width,
  runId:String(identity.runId),runAttempt:identity.runAttempt,
  originalJourneyGate:native.originalJourneyGate,
  originalModelNetworkGate:modelGate,
  originalJsepNetworkGate:jsepGate,
  canonicalJsepResponses:canonical,unreadableJsepResponses:unknown,
  jsepRedirectResponses:redirectCount,jsepHardHttpErrors:httpErrors,
  jsepMismatchedResponses:badBytes,jsepResponseCount:jseps.length,
  nativeCompiledJsepSHA256:null,nativeLoadedOnnxSHA256:null,
  nativeJsepProcessIdentityVerified:false,
  sourceEvidenceGate:fatal?'FAIL':'BLOCKED',
  naturalIntermittentWebKitFaultRepaired:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
export function verifyM265(log,identity,{http404=false}={}){
 if(identity.runAttempt!==1)throw Error('Only first original-browser attempt is admissible');
 const result=assessM265(log,identity);
 if(!http404){
  // Inherit M264 exact source, model, JSEP network, owner, privacy and backup
  // positive checks; NEVER downgrade actual original errors to a green retry.
  verifyM264(log,identity);
  if(result.originalJourneyGate!=='PASS'||result.sourceEvidenceGate!=='BLOCKED'||
     result.originalJsepNetworkGate==='FAIL')
   throw Error('Original JSEP HTTP success unverified');
  // Browser Chromium can withhold response bytes: PARTIAL, never fabricated.
  if(identity.engine==='webkit'&&result.canonicalJsepResponses<1)
   throw Error('WebKit original JSEP canonical body absent');
 }else{
  const fault=parseRow(log,'M265_ORIGINAL_JSEP_HTTP404_FAULT');
  if(fault?.schema!=='M265_JSEP_HTTP404_V1'||fault.engine!==identity.engine||
    fault.width!==identity.width||!Number.isInteger(fault.intercepted)||
    fault.intercepted<1||fault.intercepted>8||
    fault.originalRunnerUnmodified!==true||fault.originalWorkerUnmodified!==true||
    fault.releaseAuthorized!==false||fault.familyAlpha!=='HOLD')
   throw Error('Original JSEP HTTP-404 interception absent/forged');
  const network=parseRow(log,'M259_CONTEXT_NETWORK_WITNESS');
  const jseps=network.rows.filter(r=>r?.kind==='jsep-wasm');
  if(jseps.length!==fault.intercepted||
    jseps.some(r=>r.status!=='non-200'||r.httpStatus!==404||r.hasLocation!==false)||
    result.originalJourneyGate!=='FAIL'||result.originalJsepNetworkGate!=='FAIL'||
    result.jsepHardHttpErrors!==fault.intercepted||
    result.sourceEvidenceGate!=='FAIL'||identity.exitCode===0)
   throw Error('Original JSEP 404 did not produce verified real Worker RED');
  const lines=log.split(/\r?\n/);
  if(!lines.some(x=>x.startsWith('M58_REAL_P88_WORKER_FAIL ')))
   throw Error('Original model Worker failure marker missing');
  for(const label of [
   'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS ',
   'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY ',
   'P91_FULL_JOURNEY_PASS '
  ])if(lines.some(x=>x.startsWith(label)))
    throw Error('Original JSEP HTTP-404 cannot lead to private owner success');
 }
 return {...result,intentionallyFailedOriginalJsep404:http404};
}
function pinnedJpegSha(){
 const bytes=readFileSync('benchmark/fixtures/commons-0003.jpg');
 const sha=createHash('sha256').update(bytes).digest('hex');
 const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
  .find(x=>x.id==='commons-0003');
 if(!locked?.verified||locked.sha256!==sha)
  throw Error('Original public JPEG SHA mismatch');
 return sha;
}
function main(){
 const action=process.argv[2],http404=process.env.M265_CASE==='jsep-404';
 if(action==='prepare'){
  writeFileSync(disposable,deriveM265(readFileSync(runner,'utf8'),{http404}));
  console.log('M265_DISPOSABLE_SOURCE_READY',JSON.stringify({
   originalRunnerSHA256:runnerSHA,http404,originalUnmodified:true,familyAlpha:'HOLD'
  }));
 }else if(action==='verify'){
  const identity={
   checkout:process.env.EXPECTED_HEAD,engine:process.env.M58_ENGINE,
   width:Number(process.env.P94_WIDTH),runId:process.env.GITHUB_RUN_ID,
   job:process.env.GITHUB_JOB,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT),
   exitCode:Number(process.env.MODEL_EXIT),lockedJpegSha:pinnedJpegSha()
  };
  console.log('M265_ORIGINAL_JSEP_HTTP_RESULT',JSON.stringify(verifyM265(
   readFileSync(process.argv[3],'utf8'),identity,{http404}
  )));
 }else throw Error('Expected prepare/verify command');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{main()}catch(e){
  console.error('M265 BLOCKED: '+String(e.message).slice(0,140));process.exitCode=1;
 }
}
