/**
 * M1538/HOLD. Offline admission for a SANITIZED operator-authorized
 * original WebKit ONNX native fault witness. NO ptrace, browser launch,
 * native attach, network requests, debugger rights, or binary patch.
 *
 * Untrusted JSON can nominate only an independently verifiable CANDIDATE.
 * This never independently proves a genuine native trap, C++ line or fix.
 */
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export const pins=Object.freeze({
  wasmSha256:'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39',
  wasmBytes:21596019,
  modelSha256:'02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3',
  modelBytes:15199746,
  workerGitBlob:'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
  glueSha256:'08fb86ec433c78bfb032c5d84a68b8e8e5a8d81268fa39e24314179a5767a5b9',
  originalRedRun:44640727828,
  originalRedJob:135971719127,
  originalFunction:4846,
  staticFunctionStart:7022489,
  staticFunctionEndExclusive:7165245
});
const SHA=/^[a-f0-9]{40}$/, HASH=/^[a-f0-9]{64}$/;
const safeInt=n=>Number.isSafeInteger(n)&&n>=0;
const bad=[]; // no retained data; function uses its own blockers
const result=(blockers,candidate,location)=>({
  schema:'M1538_OPERATOR_NATIVE_FAULT_ADMISSION_V1',
  status:candidate?'CANDIDATE_REQUIRES_INDEPENDENT_NATIVE_VERIFICATION':'BLOCKED',
  blockers:[...new Set(blockers)],
  candidate,
  locationKind:location?.kind??null,
  wasmFileOffsetCandidate:location?.wasmOffset??null,
  nativeElfFileOffsetCandidate:location?.elfOffset??null,
  actualNativeTrapIndependentlyVerified:false,
  originalCxxStatement:null,
  originalRootCauseProven:false,
  causalFixProven:false,
  releaseAllowed:false,
  familyAlpha:'HOLD'
});
const allowedKinds=new Set(['wasm-bytecode-offset','native-elf-pc']);
const sensitiveKeys=new Set([
  'rawWorkerId','rawImage','photo','photoBytes','modelWeights','modelPayload',
  'cookie','token','password','authHeader','heapDump','stackMemory','privatePath'
]);
/**
 * Admission requires matching run/job/source/process birth identity and the
 * original model + WASM byte hashes, not just a repeating WPE Worker ID hash.
 * A native machine PC is NEVER a WASM file offset.
 */
export function assessNativeFaultReceipt(input) {
  const b=[];
  if(!input||typeof input!=='object'||Array.isArray(input))
    return result(['RECEIPT_ABSENT'],false);
  const {job,worker,native}=input;
  if(!job||!worker||!native||typeof job!=='object'||
     typeof worker!=='object'||typeof native!=='object')
    return result(['RECEIPT_SEGMENTS_MISSING'],false);
  for(const obj of [job,worker,native,input])
    if(Object.keys(obj).some(key=>sensitiveKeys.has(key)))b.push('UNSAFE_RAW_OR_PRIVATE_FIELD');
  if(!safeInt(job.runId)||job.runId===0||!safeInt(job.jobId)||job.jobId===0||
     job.runAttempt!==1||!SHA.test(job.headSha||'')||
     job.engine!=='webkit'||job.browserVersion!=='26.0'||
     job.playwrightVersion!=='1.56.1'||job.firstAttempt!==true)
    b.push('FIRST_ATTEMPT_PINNED_SOURCE_NOT_PROVEN');
  if(job.runId===pins.originalRedRun||job.jobId===pins.originalRedJob)
    b.push('HISTORIC_RED_CANNOT_GAIN_RETROACTIVE_NATIVE_PC');
  if(!HASH.test(job.workerIdDigest||'')||!safeInt(job.rendererPid)||job.rendererPid===0||
     !safeInt(job.rendererStartTicks)||job.rendererStartTicks===0||
     !safeInt(job.browserPid)||job.browserPid===0||
     !safeInt(job.browserStartTicks)||job.browserStartTicks===0||
     job.rendererPid===job.browserPid||!safeInt(job.workerCreatedMs))
    b.push('RUN_JOB_RENDERER_PROCESS_IDENTITY_MISSING');
  if(worker.runId!==job.runId||worker.jobId!==job.jobId||
     worker.headSha!==job.headSha||
     worker.workerIdDigest!==job.workerIdDigest||
     worker.rendererPid!==job.rendererPid||
     worker.rendererStartTicks!==job.rendererStartTicks||
     worker.browserPid!==job.browserPid||
     worker.browserStartTicks!==job.browserStartTicks)
    b.push('WORKER_AND_BROWSER_PROCESS_IDENTITY_DIFFER');
  if(worker.sourceGitBlob!==pins.workerGitBlob||
     worker.inspectorFrontendCount!==1||
     worker.originalP94===false||worker.originalP94!==true||
     !safeInt(worker.workerCreatedMs)||
     worker.workerCreatedMs!==job.workerCreatedMs)
    b.push('ORIGINAL_WORKER_SOURCE_OR_LIFECYCLE_UNPROVEN');
  if(native.runId!==job.runId||native.jobId!==job.jobId||
     native.headSha!==job.headSha||
     native.workerIdDigest!==job.workerIdDigest||
     native.rendererPid!==job.rendererPid||
     native.rendererStartTicks!==job.rendererStartTicks||
     native.browserPid!==job.browserPid||
     native.browserStartTicks!==job.browserStartTicks)
    b.push('FAULT_AND_RUN_PROCESS_IDENTITY_DIFFER');
  if(native.operatorAuthorized!==true||
     native.captureMethod!=='operator-authorized-engine-native-fault'||
     native.origin!=='original-ort-create-session'||native.nativeExceptionClass!=='wasm-bounds'||
     native.syntheticOnly!==false||native.originalModel===false||
     native.actualOrtCreateSessionThrown!==true||native.functionIndex!==pins.originalFunction)
    b.push('ORIGINAL_NATIVE_WASM_BOUNDS_FAULT_NOT_PROVEN');
  if(native.jsepWasmSha256!==pins.wasmSha256||
     native.jsepWasmBytes!==pins.wasmBytes||
     native.generatedGlueSha256!==pins.glueSha256||
     native.modelOnnxSha256!==pins.modelSha256||
     native.modelByteLength!==pins.modelBytes)
    b.push('ORIGINAL_MODEL_AND_RUNTIME_BYTES_UNATTESTED');
  if(!safeInt(native.modelPointer)||native.modelPointer===0||
     !safeInt(native.entryMemoryBytes)||
     native.modelPointer+pins.modelBytes>native.entryMemoryBytes||
     native.entryMemoryBytes>4294967296)
    b.push('ORIGINAL_MODEL_ENTRY_POINTER_OUTSIDE_LIVE_MEMORY');
  if(!safeInt(native.faultMonotonicMs)||
     native.faultMonotonicMs<=worker.workerCreatedMs||
     !safeInt(native.workerErrorObservedMs)||
     native.workerErrorObservedMs<native.faultMonotonicMs)
    b.push('FAULT_WORKER_EVENT_ORDER_UNPROVEN');
  if(native.sourceCxxStatement!=null||native.causalFixProven===true||
     native.releaseAllowed===true||native.jsInspectorLinePromotedToNativePc===true)
    b.push('UNVERIFIED_SOURCE_OR_REPAIR_PROMOTED');
  if(!allowedKinds.has(native.trapKind))b.push('NATIVE_LOCATION_KIND_UNSUPPORTED');
  let loc=null;
  if(native.trapKind==='wasm-bytecode-offset'){
    if(!safeInt(native.wasmFileOffset)||
       native.wasmFileOffset<pins.staticFunctionStart||
       native.wasmFileOffset>=pins.staticFunctionEndExclusive||
       native.nativePc!=null)
      b.push('ORIGINAL_F4846_OFFSET_NOT_AUTHENTICATED');
    else loc={kind:'wasm-bytecode-offset',wasmOffset:native.wasmFileOffset};
  }else if(native.trapKind==='native-elf-pc'){
    const elf=native.elfMapping;
    if(!elf||typeof elf!=='object'||!HASH.test(elf.sha256||'')||
       !/^[a-f0-9]{8,128}$/.test(elf.buildId||'')||
       !safeInt(elf.start)||elf.start===0||
       !safeInt(elf.endExclusive)||elf.endExclusive<=elf.start||
       !safeInt(elf.fileOffset)||!safeInt(elf.fileBytes)||
       !safeInt(native.nativePc)||
       native.nativePc<elf.start||native.nativePc>=elf.endExclusive||
       elf.fileOffset+(native.nativePc-elf.start)>=elf.fileBytes||
       native.wasmFileOffset!=null)
      b.push('VERIFIED_ELF_MAPPING_LOAD_BIAS_ABSENT_OR_INVALID');
    else loc={kind:'native-elf-pc',elfOffset:elf.fileOffset+(native.nativePc-elf.start)};
  }
  if(b.length)return result(b,false);
  return result(['INDEPENDENT_RUN_LOG_PROCESS_BINARY_AND_OPERATOR_ATTESTATION_REQUIRED',
    'CXX_SOURCE_MAP_NOT_IN_RECEIPT'],true,loc);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    if(process.argv.length!==3)throw Error('single sanitized JSON path required');
    const raw=readFileSync(process.argv[2]);
    if(raw.byteLength>65536)throw Error('oversized untrusted receipt');
    const verdict=assessNativeFaultReceipt(JSON.parse(raw.toString('utf8')));
    console.log('M1538_NATIVE_OPERATOR_RECEIPT_SANITIZED '+JSON.stringify(verdict));
    if(!verdict.candidate)process.exitCode=1;
  }catch(e){console.log('M1538_NATIVE_OPERATOR_RECEIPT_SANITIZED '+
    JSON.stringify(result(['INVALID_RECEIPT_JSON_OR_FILE'],false)));process.exitCode=1;}
}