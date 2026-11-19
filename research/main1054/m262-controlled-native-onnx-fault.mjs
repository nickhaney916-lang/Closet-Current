/**
 * M262: original P94 native-browser deliberately invalid ONNX response.
 * Research-only complementary negative to M261 JSEP test; not natural WebKit
 * failure, runtime repair, native compiled-byte attestation or release approval.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {deriveM259} from './m259-original-context-network.mjs';
import {bindM260OriginalAttempt} from './m260-bind-original-network-evidence.mjs';

const originalPath='scripts/test-parallel94-native-p88-browser.mjs';
const derivedPath='scripts/.m262-controlled-invalid-onnx-original.mjs';
const originalSHA='4803707515debafdc8041069c6081bd20530e455c03c0842d1a0bc30161ed2f5';
export const badOnnxBody='M262_INVALID_ONNX_GRAPH_RESEARCH_ONLY';
export const badOnnxSHA=createHash('sha256').update(badOnnxBody).digest('hex');
const injection=[
 " // M262: shadow only original pinned model hub ONNX GET, not JSEP or auth.",
 " await context.route(url=>{try{const p=new URL(url).pathname;",
 "  return p.startsWith('/Xenova/segformer_b0_clothes/')&&/[.]onnx$/i.test(p);",
 " }catch{return false;}},route=>{",
 "  if(route.request().method()!=='GET')return route.abort();",
 "  m262Interceptions++;",
 "  return route.fulfill({status:200,contentType:'application/octet-stream',",
 "   body:Buffer.from('M262_INVALID_ONNX_GRAPH_RESEARCH_ONLY')});",
 " });"
].join('\n');
const marker=[
 " console.log('M262_CONTROLLED_ONNX_FAULT',JSON.stringify({",
 "  schema:'M262_CONTROLLED_ONNX_V1',engine,width,",
 "  interceptedModelRequests:m262Interceptions,faultType:'invalid-onnx-graph',",
 "  originalP94SourceUnmodified:true,originalWorkerUnmodified:true,",
 "  naturalWebKitAllocatorFailure:false,releaseAuthorized:false,familyAlpha:'HOLD'}));"
].join('\n');
function once(text,needle,replacement){
 if(text.indexOf(needle)<0||text.indexOf(needle)!==text.lastIndexOf(needle))
  throw new Error('Frozen original source anchor absent or ambiguous');
 return text.replace(needle,replacement);
}
export function deriveM262(original){
 if(typeof original!=='string'||
  createHash('sha256').update(original).digest('hex')!==originalSHA)
  throw new Error('Original P94 runner SHA drifted: controlled negative prohibited');
 let code=deriveM259(original);
 code=once(code,'const m259Rows=[],m259Pending=[];',
   'const m259Rows=[],m259Pending=[];\nlet m262Interceptions=0;');
 code=once(code," stage='sign-in';",injection+"\n stage='sign-in';");
 code=once(code," console.log('M259_CONTEXT_NETWORK_WITNESS'",
   marker+"\n console.log('M259_CONTEXT_NETWORK_WITNESS'");
 if(!code.includes('M262_CONTROLLED_ONNX_FAULT')||
    !code.includes('M262_INVALID_ONNX_GRAPH_RESEARCH_ONLY'))
  throw new Error('Controlled invalid ONNX route missing');
 return code;
}
function oneRow(log,label,description){
 const lines=log.split(/\r?\n/).filter(s=>s.startsWith(label));
 if(lines.length!==1)throw new Error('Missing or duplicate '+description);
 try{return JSON.parse(lines[0].slice(label.length));}
 catch{throw new Error('Malformed '+description);}
}
export function verifyM262Failure(log,exitCode,id){
 if(typeof log!=='string'||log.length>8*1024*1024||
  !id||!['webkit','chromium'].includes(id.engine)||
  ![320,390,430].includes(id.width)||id.runAttempt!==1||
  !/^[a-f0-9]{40}$/.test(id.checkout||'')||
  !/^[0-9]{3,30}$/.test(String(id.runId||''))||
  !Number.isInteger(exitCode)||exitCode<0||exitCode>255)
  throw new TypeError('Invalid original first-attempt negative browser identity');
 const fault=oneRow(log,'M262_CONTROLLED_ONNX_FAULT ','model request interception');
 if(fault?.schema!=='M262_CONTROLLED_ONNX_V1'||
  fault.engine!==id.engine||fault.width!==id.width||
  !Number.isInteger(fault.interceptedModelRequests)||
  fault.interceptedModelRequests<1||fault.interceptedModelRequests>8||
  fault.faultType!=='invalid-onnx-graph'||
  fault.originalP94SourceUnmodified!==true||
  fault.originalWorkerUnmodified!==true||
  fault.naturalWebKitAllocatorFailure!==false||
  fault.releaseAuthorized!==false||fault.familyAlpha!=='HOLD')
  throw new Error('Invalid actual controlled ONNX interception receipt');
 const network=oneRow(log,'M259_CONTEXT_NETWORK_WITNESS ','same-context binary response witness');
 if(network?.schema!=='M259_CONTEXT_NETWORK_V1'||
  network.engine!==id.engine||network.width!==id.width||
  network.familyAlpha!=='HOLD'||network.sourceEvidenceGate!=='BLOCKED'||
  network.compiledWasmAttested!==false||
  network.loadedModelAttested!==false||
  network.sameNativeProcessProven!==false||
  !Array.isArray(network.rows)||network.rows.length>32)
  throw new Error('Untrusted original same-context model response evidence');
 const models=network.rows.filter(r=>r?.kind==='model-onnx');
 const hashObserved=models.filter(r=>r.status==='body-observed'&&
  r.sha256===badOnnxSHA&&r.size===Buffer.byteLength(badOnnxBody)).length;
 const unreadable=models.filter(r=>r.status==='body-unavailable').length;
 // Response body may be unreadable in Chromium. Count it as UNKNOWN, never
 // fabricate bytes, and require at least one actual invalid model SHA receipt.
 if(hashObserved<1||models.length!==fault.interceptedModelRequests||
  hashObserved+unreadable!==fault.interceptedModelRequests)
  throw new Error('Actual intercepted ONNX model byte witness absent/mismatched');
 if(network.rows.some(r=>r?.kind==='jsep-wasm'&&
  (r.status==='invalid-wasm-magic'||
   r.status==='body-observed'&&
   r.sha256!=='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39')))
  throw new Error('JSEP corruption outside M262 model-only scope');
 const rows=log.split(/\r?\n/);
 if(exitCode===0||!rows.some(r=>r.startsWith('M58_REAL_P88_WORKER_FAIL ')))
  throw new Error('Actual original P94 model initialization did not fail');
 for(const label of [
  'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS ',
  'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY ',
  'P91_FULL_JOURNEY_PASS '
 ])if(rows.some(r=>r.startsWith(label)))
  throw new Error('Unexpected private owner/restore success from bad ONNX');
 const verdict=bindM260OriginalAttempt(log,{...id,exitCode});
 if(verdict.originalJourneyGate!=='FAIL'||
  verdict.sourceEvidenceGate!=='FAIL'||
  verdict.releaseAuthorized!==false||
  verdict.familyAlpha!=='HOLD')
  throw new Error('M260 allowed corrupted model receipt to promote acceptance');
 return {
  schema:'MAIN1054_M262_ACTUAL_BROWSER_CONTROLLED_ONNX_RED_V1',
  checkout:id.checkout,engine:id.engine,width:id.width,
  runId:String(id.runId),runAttempt:id.runAttempt,
  interceptedOriginalModelRequests:fault.interceptedModelRequests,
  invalidModelSHAObserved:hashObserved,
  modelResponseBodyUnavailable:unreadable,
  originalRunnerExitNonzero:true,originalFailureMarkerObserved:true,
  ownerSaveOrRestoreSuccessObserved:false,
  originalJourneyGate:'FAIL',sourceEvidenceGate:'FAIL',
  actualIntermittentWebKitFaultReproduced:false,
  nativeRuntimeRepairProven:false,releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
function jpeg(){
 const sha=createHash('sha256')
  .update(readFileSync('benchmark/fixtures/commons-0003.jpg')).digest('hex');
 const item=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
  .find(x=>x.id==='commons-0003');
 if(!item?.verified||item.sha256!==sha)
  throw new Error('Pinned public test JPEG source drift');
 return sha;
}
function main(){
 if(process.argv[2]==='prepare'){
  writeFileSync(derivedPath,deriveM262(readFileSync(originalPath,'utf8')));
  console.log('M262_DISPOSABLE_SOURCE_READY',JSON.stringify({
   originalSHA256:originalSHA,onlyOriginalONNXIntercepted:true,familyAlpha:'HOLD'
  }));
 }else if(process.argv[2]==='verify'){
  const result=verifyM262Failure(readFileSync(process.argv[3],'utf8'),
   Number(process.env.MODEL_EXIT),{
    checkout:process.env.EXPECTED_HEAD,
    engine:process.env.M58_ENGINE,width:Number(process.env.P94_WIDTH),
    runId:process.env.GITHUB_RUN_ID,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT),
    job:process.env.GITHUB_JOB,lockedJpegSha:jpeg()
   });
  console.log('M262_FAIL_CLOSED_ORIGINAL_ONNX_NEGATIVE_PASS',JSON.stringify(result));
 }else throw new Error('Expected prepare or verify');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{main();}catch(e){
  console.error('M262 NEGATIVE EVIDENCE BLOCKED: '+String(e.message).slice(0,130));
  process.exitCode=1;
 }
}
