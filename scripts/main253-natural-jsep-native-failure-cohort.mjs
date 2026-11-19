/**
 * M253: genuine ORIGINAL P94 JSEP/WebKit natural-failure preservation.
 * Only a DISPOSABLE ORIGINAL M251 research browser runner is adjusted:
 * - a selected native mobile viewport (no model/runtime adjustment)
 * - immediate allowlisted original-browser JSEP RESPONSE digest receipt
 * - immediate numerical original native ABI argument receipt
 * Original product Worker, JSEP binary, model/graph, owner flow and test
 * assertions are unchanged. This is observational, NOT a fix.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const PARENT_RUNNER_BLOB253='887e1e8fa6cc24919450f53612dc6b35b3a1aefe';
export const ORIGINAL_JSEP_SHA253='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
export const ORIGINAL_JSEP_BYTES253=21596019;
export const PARENT_COMMIT253='2ee136d3ee78f5a57554a022efb8ce943b8edf5c';
const JSEP_NAME='ort-wasm-simd-threaded.jsep.wasm';
const safeHas=(obj,k)=>obj&&Object.prototype.hasOwnProperty.call(obj,k);
export function blob253(bytes) {
  const b=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes,'utf8');
  return createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
}
export function m253Config(engine,width,count) {
  assert.ok(['webkit','chromium'].includes(engine),'Only genuine browsers');
  assert.ok([320,390,430].includes(width),'Only real mobile widths');
  assert.equal(count,engine==='webkit'?8:2,'Fixed precommitted fresh processes required');
  return Object.freeze({engine,width,count});
}
function replaceUnique(src,oldValue,newValue,label) {
  assert.equal(src.split(oldValue).length,2,'Pinned research source anchor missing or duplicate: '+label);
  return src.replace(oldValue,newValue);
}
export function deriveM253ObservableRunner(original) {
  assert.equal(blob253(original),PARENT_RUNNER_BLOB253,'Verified original M251 research harness blob changed');
  let s=original;
  s=replaceUnique(s,"P94_WIDTH:'390'","P94_WIDTH:String(process.env.M253_WIDTH||'390')",'original width');
  // This emitted browser-source statement is after genuine Worker network fetch.
  // A missing body stays unavailable; NEVER take hashes from a sibling or an
  // independently fetched CDN artifact.
  const before='"   m247PublicAssets.push(digestPublicRuntimeResponse(asset,status,data));",';
  const after='"   const receipt253=digestPublicRuntimeResponse(asset,status,data);",\n'+
    '"   m247PublicAssets.push(receipt253);",\n'+
    '"   if(receipt253.kind===\'onnx-wasm\')console.log(\'M253_THIS_ATTEMPT_ORIGINAL_BROWSER_JSEP \'+JSON.stringify(receipt253));",';
  s=replaceUnique(s,before,after,'same failing browser response');
  const beforeNative='"   if(parsed?.phase===\'m251_native_option\'&&m251NativeEvents.length<5)m251NativeEvents.push(parsed);",';
  const afterNative='"   if(parsed?.phase===\'m251_native_option\'&&m251NativeEvents.length<5){m251NativeEvents.push(parsed);console.log(\'M253_THIS_ATTEMPT_NATIVE_OPTION \'+JSON.stringify(parsed));}",';
  s=replaceUnique(s,beforeNative,afterNative,'same failing native ABI call');
  assert.ok(s.includes('M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY'));
  assert.ok(s.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS'));
  assert.ok(s.includes('M58_REAL_P88_WORKER_FAIL'));
  assert.ok(s.includes('M251_REAL_ORIGINAL_JSEP_NATIVE_ABI'));
  assert.ok(!s.includes('session_options:{enableMemPattern:true}'),'No unsupported runtime setting');
  return s;
}
export function receipt253(stdout,marker){
  assert.equal(typeof stdout,'string');
  assert.ok(stdout.length<=24*1024*1024,'Unbounded model process output');
  assert.match(marker,/^M(?:247|251|253|58|61)_[A-Z0-9_]{6,85}$/);
  const rows=stdout.split(/\r?\n/).filter(x=>x.startsWith(marker+' '));
  assert.ok(rows.length<=1,'Duplicate same-attempt receipt '+marker);
  if(!rows.length)return null;
  const text=rows[0].slice(marker.length+1);
  assert.ok(text.length<=3800,'Oversized source receipt');
  const o=JSON.parse(text);
  assert.ok(o&&typeof o==='object'&&!Array.isArray(o),'Untrusted evidence structure');
  return o;
}
const isActualBrowserJsep=r=>
  r?.kind==='onnx-wasm'&&r?.name===JSEP_NAME&&r?.status===200&&
  r?.available===true&&r?.sha256===ORIGINAL_JSEP_SHA253&&r?.bytes===ORIGINAL_JSEP_BYTES253;
const isNativeBaseline=r=>
  r?.phase==='m251_native_option'&&r?.actualExportCalled===true&&
  r?.argCount===10&&r?.handleReturned===true&&
  r?.memPattern===false&&r?.cpuArena===false;
export function m253Classify({engine,width,attempt,exitCode,signal,stdout='',stderr=''}) {
  m253Config(engine,width,engine==='webkit'?8:2);
  assert.ok(Number.isInteger(attempt)&&attempt>=1&&attempt<=(engine==='webkit'?8:2));
  assert.ok(exitCode===null||Number.isInteger(exitCode));
  assert.ok(typeof stderr==='string'&&stderr.length<=24*1024*1024);
  // These are same-OS-process *original* browser-side receipts. Do NOT
  // synthesize or borrow from another run, browser, or independent GET.
  const jsep=receipt253(stdout,'M253_THIS_ATTEMPT_ORIGINAL_BROWSER_JSEP');
  const native=receipt253(stdout,'M253_THIS_ATTEMPT_NATIVE_OPTION');
  const heap=receipt253(stdout,'M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT');
  const proof=receipt253(stdout,'M251_REAL_ORIGINAL_JSEP_NATIVE_ABI');
  const boundary=receipt253(stdout,'M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY');
  const owner=receipt253(stdout,'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS');
  const privateOwner=receipt253(stdout,'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY');
  const nativeValid=isNativeBaseline(native);
  const direct=isActualBrowserJsep(jsep);
  const ready=heap?.outcome==='ready'&&heap?.growErrors===0&&heap?.growCalls>0;
  const model=boundary?.originalModelSessionReady===true &&
    boundary?.originalJsepWasmSha256===ORIGINAL_JSEP_SHA253;
  const ownerSafe=owner?.engine===engine&&owner?.modelExecuted===true&&
    owner?.manualSyntheticOwnerConfirmed===true&&owner?.ownerPrivateSaved===1&&
    owner?.otherOwnerDenied===true&&owner?.tamperDenied===true&&owner?.atomicRestore===true;
  const privateSafe=privateOwner?.engine===engine&&privateOwner?.ownerBPrivateRows===0&&
    privateOwner?.ownerAOriginalNotVisibleToB===true&&
    privateOwner?.ownerAOutfitNotVisibleToB===true;
  const nativeProof=proof?.engine===engine&&proof?.arm==='baseline'&&proof?.realWasmExportInvoked===true;
  const positive=exitCode===0&&!signal&&nativeValid&&ready&&model&&nativeProof&&ownerSafe&&privateSafe&&
    (engine==='webkit'?direct:true);
  // Extremely conservative: original browser failing *after* real JSEP and
  // original compiled native export is natural model failure CANDIDATE.
  // It is not sufficient evidence to classify C++ allocator root cause.
  const naturalCandidate=exitCode!==0&&exitCode!==null&&!signal&&direct&&nativeValid&&
    heap?.outcome==='error';
  const errorClass=exitCode===0?'none':
    /WebAssembly\.RuntimeError|RuntimeError|memory access/i.test(stderr)?'RUNTIME_ERROR_CANDIDATE':
    /timeout|timed out/i.test(stderr)?'TIMEOUT_CANDIDATE':
    'UNCLASSIFIED_OR_OTHER';
  return Object.freeze({
    schema:'M253_ORIGINAL_JSEP_NATIVE_FRESH_ATTEMPT/v1',engine,width,attempt,
    separateOriginalOsProcess:true,arm:'original_default',originalRuntimeAltered:false,
    originalWorkerAltered:false,originalJsepWasmAltered:false,
    actualSameFailedBrowserResponseHashVerified:direct,
    actualOriginalWasmResponseBodyNotAvailable:!jsep?.available,
    actualOriginalJsepNameObserved:jsep?.name===JSEP_NAME,
    originalJsepDigestMatches:direct,
    actualOriginalNativeAbiObserved:nativeValid,
    nativeDefaultMemPatternFlag: nativeValid?false:null,
    originalModelReady:!!ready,originalBoundaryReady:!!model,
    originalPrivateOwnerAndSourceV4:!!ownerSafe,originalSeparateOwnerIsolation:!!privateSafe,
    modelNativeMemoryGrowCalls:Number.isInteger(heap?.growCalls)?heap.growCalls:null,
    modelMemoryTerminalPages:Number.isInteger(heap?.terminalPages)?heap.terminalPages:null,
    modelMemoryOutcome:['ready','error'].includes(heap?.outcome)?heap.outcome:'UNVERIFIED',
    positive,originalNonzeroExit:exitCode!==0||!!signal,
    naturalPostNativeModelFailureCandidate:naturalCandidate,
    errorClass:positive?'none':errorClass,
    errorSpecificNativeCppRootCauseVerified:false,
    originalProductNaturalRedToGreenFixProven:false,releaseAuthorized:false,familyAlphaHold:true
  });
}
export function m253Summary(arr,{engine,width,count}){
  m253Config(engine,width,count);
  assert.equal(arr.length,count,'Missing precommitted original browser processes');
  for(let i=0;i<count;i++){
    const v=arr[i];
    assert.ok(v?.schema==='M253_ORIGINAL_JSEP_NATIVE_FRESH_ATTEMPT/v1'&&
      v.engine===engine&&v.width===width&&v.attempt===i+1&&v.arm==='original_default'&&
      v.separateOriginalOsProcess===true&&v.releaseAuthorized===false,
      'Wrong/forged/duplicated original browser attempt');
  }
  return Object.freeze({
    schema:'M253_FIXED_REAL_ORIGINAL_JSEP_NATIVE_COHORT/v1',
    engine,width,originalIndependentProcesses:count,
    genuineCompleteOriginalOwnerPositives:arr.filter(x=>x.positive===true).length,
    authenticOriginalNonzeroOrIncomplete:arr.filter(x=>x.positive!==true).length,
    naturalPostNativeModelFailureCandidates:arr.filter(x=>x.naturalPostNativeModelFailureCandidate===true).length,
    originalEveryAttemptAccountedFor:true,
    wholeCohortPass:arr.every(x=>x.positive===true),
    historicalIntermittentNativeWebkitFailureUnfixed:true,
    sameFailedBrowserBinaryMayRemainUnverified:true,
    zeroRetriedOrSubstitutedModelFailures:true,
    familyAlphaHold:true,releaseAuthorized:false
  });
}
