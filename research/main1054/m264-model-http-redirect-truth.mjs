/**
 * M264 research-only original-browser HTTP response provenance.
 * Distinguishes ordinary 307->200 pinned ONNX redirects from 404/500 etc.
 * No original Worker/runner/ONNX/WASM production changes or native attestation.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {deriveM262,assessM262,verifyM262,EXPECTED_ONNX_SHA256,EXPECTED_ONNX_BYTES} from './m262-original-onnx-byte-identity.mjs';

const originalPath='scripts/test-parallel94-native-p88-browser.mjs';
const generatedPath='scripts/.m264-original-http-chain-study.mjs';
const ORIGINAL_SHA='4803707515debafdc8041069c6081bd20530e455c03c0842d1a0bc30161ed2f5';
const redirectCodes=new Set([301,302,303,307,308]);
function replaceOnce(src,anchor,patch){
 if(src.indexOf(anchor)<0||src.indexOf(anchor)!==src.lastIndexOf(anchor))
  throw Error('Pinned derived original P94 browser anchor missing or ambiguous');
 return src.replace(anchor,patch);
}
export function deriveM264(original,{fault404=false}={}){
 if(typeof original!=='string'||
    createHash('sha256').update(original).digest('hex')!==ORIGINAL_SHA)
  throw Error('Original P94 runner source SHA mismatch');
 let code=deriveM262(original);
 // Original M259 only recorded "non-200". Add status and redirect-location
 // existence, but NEVER log Location value, URL, tokens or private payloads.
 code=replaceOnce(code,
  "   if(res.status()<200||res.status()>=300){m259Rows.push({kind,status:'non-200'});return;}",
  "   if(res.status()<200||res.status()>=300){const httpStatus=res.status();\n"+
  "    const hasLocation=Boolean(res.headers()['location']);\n"+
  "    m259Rows.push({kind,status:'non-200',httpStatus,hasLocation});return;}");
 if(fault404){
  code=replaceOnce(code,'const m259Rows=[],m259Pending=[];',
   'const m259Rows=[],m259Pending=[];\nlet m264Intercepted=0;');
  const route=[
   ' // M264: deliberately refuse ONLY the original ONNX model GET.',
   ' await context.route(new RegExp("Xenova[/]segformer_b0_clothes[/].*[.]onnx(?:[?].*)?$","i"),route=>{',
   "  if(route.request().method()!=='GET')return route.abort();",
   '  m264Intercepted++;',
   "  return route.fulfill({status:404,contentType:'text/plain',body:'M264_MODEL_HTTP_404_TEST_ONLY'});",
   ' });'
  ].join('\n');
  code=replaceOnce(code," stage='sign-in';",route+"\n stage='sign-in';");
  const marker=" console.log('M264_CONTROLLED_MODEL_HTTP_404',JSON.stringify({schema:'M264_CONTROLLED_HTTP_V1',engine,width,intercepted:m264Intercepted,originalRunnerUnmodified:true,releaseAuthorized:false,familyAlpha:'HOLD'}));\n";
  code=replaceOnce(code," console.log('M259_CONTEXT_NETWORK_WITNESS'",
   marker+" console.log('M259_CONTEXT_NETWORK_WITNESS'");
 }
 return code;
}
function row(log,label){
 const hits=log.split(/\r?\n/).filter(line=>line.startsWith(label+' '));
 if(hits.length!==1)throw Error('Missing or duplicate bounded '+label);
 try{return JSON.parse(hits[0].slice(label.length+1));}
 catch{throw Error('Malformed bounded '+label);}
}
export function assessM264(log,identity){
 const prior=assessM262(log,identity);
 const receipt=row(log,'M259_CONTEXT_NETWORK_WITNESS');
 if(!Array.isArray(receipt.rows)||receipt.rows.length>32)
  throw Error('Untrusted model HTTP witness rows');
 const modelRows=receipt.rows.filter(x=>x?.kind==='model-onnx');
 if(!modelRows.length)throw Error('Original model HTTP response missing');
 let redirects=0,httpErrors=0,unknown=0;
 for(const x of modelRows){
  if(x.status==='non-200'){
   if(!Number.isInteger(x.httpStatus)||x.httpStatus<100||x.httpStatus>599||
      typeof x.hasLocation!=='boolean')
    throw Error('Unattested original model non-200 status');
   if(redirectCodes.has(x.httpStatus)&&x.hasLocation)redirects++;
   else httpErrors++;
  }else if(x.status==='body-observed'||x.status==='body-unavailable'){
   if('httpStatus' in x||'hasLocation' in x)
    throw Error('Unexpected model success with non-200 metadata');
   if(x.status==='body-unavailable')unknown++;
  }else throw Error('Unrecognized model HTTP response kind');
 }
 // Successful owner/model evidence + an HTTP 500/404 must never become a clean
 // model-network verdict merely because another ONNX body hashes correctly.
 const httpGate=httpErrors?'FAIL':unknown?'PARTIAL':redirects?'REDIRECT_PLUS_BODY':'NO_REDIRECT';
 const originalModelNetworkGate=httpErrors?'FAIL':prior.originalModelNetworkGate;
 return {
  schema:'MAIN1054_M264_MODEL_HTTP_REDIRECT_V1',
  checkout:identity.checkout,engine:identity.engine,width:identity.width,
  runId:String(identity.runId),runAttempt:identity.runAttempt,
  originalJourneyGate:prior.originalJourneyGate,
  originalModelNetworkGate,
  originalJsepNetworkGate:prior.originalJsepNetworkGate,
  originalModelBytesCorrectlyHashed:prior.originalModelBytesCorrectlyHashed,
  originalModelBytesUnreadable:prior.originalModelBytesUnreadable,
  originalModelRedirects:redirects,originalModelHttpErrors:httpErrors,
  originalModelHttpGate:httpGate,
  expectedModelSHA256:EXPECTED_ONNX_SHA256,expectedModelBytes:EXPECTED_ONNX_BYTES,
  nativeLoadedOnnxSHA256:null,nativeCompiledJsepSHA256:null,
  nativeModelProcessIdentityVerified:false,
  sourceEvidenceGate:httpErrors?'FAIL':prior.sourceEvidenceGate,
  naturalIntermittentWebKitFaultRepaired:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
export function verifyM264(log,identity,{fault404=false}={}){
 if(identity.runAttempt!==1)throw Error('First-attempt-only original browser evidence');
 const result=assessM264(log,identity);
 if(!fault404){
  // Reuse all existing original private owner+source+JSEP guards and never
  // repair a genuinely failed original Worker by choosing a later attempt.
  verifyM262(log,identity);
  if(!['NO_REDIRECT','REDIRECT_PLUS_BODY','PARTIAL'].includes(result.originalModelHttpGate)||
     result.originalModelHttpErrors!==0||result.originalJourneyGate!=='PASS'||
     result.sourceEvidenceGate!=='BLOCKED')
   throw Error('Original model HTTP failure during otherwise healthy journey');
  if(identity.engine==='webkit'&&
     (result.originalModelBytesCorrectlyHashed<1||
      result.originalModelBytesUnreadable!==0||
      result.originalJsepNetworkGate!=='OBSERVED'))
   throw Error('Original WebKit final ONNX/JSEP bytes not independently seen');
 }else{
  const mark=row(log,'M264_CONTROLLED_MODEL_HTTP_404');
  if(mark?.schema!=='M264_CONTROLLED_HTTP_V1'||mark.engine!==identity.engine||
    mark.width!==identity.width||mark.intercepted!==1||
    mark.originalRunnerUnmodified!==true||mark.releaseAuthorized!==false||
    mark.familyAlpha!=='HOLD')
   throw Error('Original model 404 interception unverified');
  const receipt=row(log,'M259_CONTEXT_NETWORK_WITNESS');
  const model=receipt.rows.filter(r=>r?.kind==='model-onnx');
  if(model.length!==1||model[0].status!=='non-200'||
    model[0].httpStatus!==404||model[0].hasLocation!==false||
    identity.exitCode===0||result.originalJourneyGate!=='FAIL'||
    result.originalModelHttpGate!=='FAIL'||result.sourceEvidenceGate!=='FAIL')
   throw Error('Real original model HTTP 404 did not preserve Worker RED');
  if(!log.split(/\r?\n/).some(x=>x.startsWith('M58_REAL_P88_WORKER_FAIL ')))
   throw Error('Original model failure terminal absent');
  for(const label of ['P91_FULL_JOURNEY_PASS ',
   'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS ',
   'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY '])
   if(log.split(/\r?\n/).some(x=>x.startsWith(label)))
    throw Error('Private owner success must not follow original HTTP 404');
 }
 return {...result,controlledModelHttp404:fault404};
}
function originalJpegSha(){
 const source=readFileSync('benchmark/fixtures/commons-0003.jpg');
 const sha=createHash('sha256').update(source).digest('hex');
 const record=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
  .find(x=>x.id==='commons-0003');
 if(!record?.verified||record.sha256!==sha)
  throw Error('Original public JPEG SHA changed');
 return sha;
}
function main(){
 const command=process.argv[2],fault404=process.env.M264_CASE==='http-404';
 if(command==='prepare'){
  writeFileSync(generatedPath,deriveM264(readFileSync(originalPath,'utf8'),{fault404}));
  console.log('M264_PINNED_DISPOSABLE_ORIGINAL',{originalSHA:ORIGINAL_SHA,fault404,familyAlpha:'HOLD'});
 }else if(command==='verify'){
  const identity={
   checkout:process.env.EXPECTED_HEAD,engine:process.env.M58_ENGINE,
   width:Number(process.env.P94_WIDTH),runId:process.env.GITHUB_RUN_ID,
   job:process.env.GITHUB_JOB,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT),
   exitCode:Number(process.env.MODEL_EXIT),lockedJpegSha:originalJpegSha()
  };
  const receipt=verifyM264(readFileSync(process.argv[3],'utf8'),identity,{fault404});
  console.log('M264_ORIGINAL_HTTP_CHAIN_RESULT',JSON.stringify(receipt));
 }else throw Error('Expected prepare or verify');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{main();}catch(e){console.error('M264 BLOCKED: '+String(e.message).slice(0,140));process.exitCode=1;}
}
