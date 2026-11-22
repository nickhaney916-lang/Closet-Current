/**
 * M1585 research-only handoff between M287 original-model session receipts
 * and M1541 single-frontend Worker Inspector events.
 *
 * This is an offline compatibility validator, NOT an original-model capture,
 * native instruction decoder, or original repair. Inputs are untrusted until
 * their GitHub Actions job logs and exact source SHA have been independently
 * checked. No raw worker IDs, model bytes, private images, or secrets are kept.
 */
import { adjudicate as adjudicateM287, fixed as original } from './m287-original-webkit-failing-process-witness.mjs';

const SHA = /^[a-f0-9]{40}$/;
const HASH = /^[a-f0-9]{64}$/;
const EVENTS = [
  'Worker.workerCreated',
  'Worker.Debugger.enable',
  'Worker.Runtime.enable',
  'Worker.Debugger.setPauseOnExceptions',
  'Worker.Debugger.setBreakpointsActive',
  'Worker.initialized',
  'Worker.Debugger.paused',
  'Worker.Debugger.resumed',
  'Worker.workerTerminated'
];

const closed = (blockers) => ({
  schema: 'M1585_ORIGINAL_WORKER_EVIDENCE_BRIDGE_V1',
  status: 'BLOCKED',
  blockers: [...new Set(blockers)],
  correlatedCandidate: false,
  originalModelRedObserved: false,
  originalModelEvidenceIndependentlyVerified: false,
  originalModelExecutedByThisTool: false,
  originalModelNativeTrapPc: null,
  originalModelWasmFileOffset: null,
  originalCxxStatement: null,
  causalFixProven: false,
  releaseAllowed: false,
  familyAlpha: 'HOLD'
});

/**
 * Evaluate already produced, sanitized evidence. A syntactically compatible
 * candidate still requires an independent verified GitHub CI log inspection;
 * the data in a JSON object cannot authenticate itself.
 */
export function assessOriginalWorkerBridge({trial, inspector, trialJob, inspectorJob} = {}) {
  const missing=[];
  if (!trial || typeof trial !== 'object') missing.push('M287_TRIAL_ABSENT');
  else {
    try { adjudicateM287(trial); }
    catch { missing.push('M287_TRIAL_INVALID'); }
    if (trial.firstAttempt !== true) missing.push('ORIGINAL_FIRST_ATTEMPT_NOT_PROVEN');
    if (trial.genuineOriginalOrtCreateSessionBoundsRed !== true ||
        trial.verdict !== 'GENUINE_ORIGINAL_NATIVE_WASM_BOUNDS_RED')
      missing.push('ORIGINAL_NATIVE_RED_NOT_OBSERVED');
    if (trial.sameFailingProcessOriginalJsepSHA256Attested !== true ||
        trial.sameProcessJsepShaVerified !== true)
      missing.push('SAME_FAILING_PROCESS_JSEP_UNATTESTED');
    if (trial.validNativeModelPointerReceipt !== true ||
        trial.originalModelByteLength !== original.originalModelBytes)
      missing.push('ORIGINAL_MODEL_COPY_UNATTESTED');
  }
  if (!inspector || typeof inspector !== 'object') missing.push('ORIGINAL_WORKER_INSPECTOR_ABSENT');
  else {
    if (inspector.syntheticOnly === true || inspector.originalModelExecuted !== true ||
        inspector.workerSourceIsOriginalP94 !== true)
      missing.push('INSPECTOR_NOT_ORIGINAL_P94_MODEL');
    if (inspector.engine !== 'webkit' ||
        inspector.browserVersion !== '26.0' ||
        inspector.playwrightVersion !== '1.56.1' ||
        inspector.inspectorFrontendCount !== 1)
      missing.push('INSPECTOR_ENGINE_OR_FRONTEND_UNPROVEN');
    if (inspector.originalJsepSha256 !== original.originalJsepSha256 ||
        inspector.originalModelByteLength !== original.originalModelBytes ||
        inspector.originalModelSha256 !== originalPins.modelOnnxSha256)
      missing.push('EXACT_ORIGINAL_JSEP_MODEL_RECEIPT_MISSING');
    if (inspector.originalOrtCreateSessionError !== 'wasm-bounds' ||
        inspector.workerPauseReason !== 'exception' ||
        inspector.workerResumeAcknowledged !== true ||
        inspector.workerRuntimeErrorCaught !== true)
      missing.push('ORIGINAL_WORKER_EXCEPTION_NOT_CORRELATED');
    if (!validWorkerEventSequence(inspector.events, inspector.workerIdDigest))
      missing.push('WORKER_EVENT_SEQUENCE_INVALID');
    // Protocol locations are JS-only; any purported native/bytecode address
    // in this research bridge is an unproven promotion and must be rejected.
    if (inspector.nativeTrapPc != null || inspector.wasmFileOffset != null ||
        inspector.sourceCxxStatement != null)
      missing.push('UNVERIFIED_NATIVE_LOCATION_PROMOTED');
  }
  if (!validJob(trialJob) || !validJob(inspectorJob) ||
      trialJob.runId !== inspectorJob.runId ||
      trialJob.jobId !== inspectorJob.jobId ||
      trialJob.headSha !== inspectorJob.headSha ||
      trialJob.workerIdDigest !== inspectorJob.workerIdDigest ||
      inspector?.workerIdDigest !== inspectorJob.workerIdDigest)
    missing.push('EXACT_SAME_JOB_WORKER_AND_SOURCE_NOT_PROVEN');
  if (missing.length) return closed(missing);
  // Even complete matching metadata cannot authenticate a GitHub run,
  // the original model's file digest, or a native PC without independent
  // verification of authoritative logs and binary bytes.
  return {
    ...closed([]),
    status: 'CANDIDATE_REQUIRES_INDEPENDENT_CI_VERIFICATION',
    correlatedCandidate: true,
    blockers: ['INDEPENDENT_SOURCE_AND_JOB_LOG_VERIFICATION_REQUIRED']
  };
}

function validJob(j) {
  return j && Number.isSafeInteger(j.runId) && j.runId > 0 &&
    Number.isSafeInteger(j.jobId) && j.jobId > 0 &&
    SHA.test(j.headSha || '') && HASH.test(j.workerIdDigest || '') &&
    j.firstAttempt === true && j.engine === 'webkit';
}

export function validWorkerEventSequence(events, digest) {
  if (!HASH.test(digest || '') || !Array.isArray(events) ||
      events.length !== EVENTS.length) return false;
  for (let i=0;i<EVENTS.length;i++) {
    const e=events[i];
    if (!e || e.type !== EVENTS[i] || e.workerIdDigest !== digest ||
        !Number.isSafeInteger(e.seq) || e.seq < 0 ||
        (i && e.seq <= events[i-1].seq) ||
        !Number.isSafeInteger(e.monotonicMs) || e.monotonicMs < 0 ||
        (i && e.monotonicMs < events[i-1].monotonicMs)) return false;
  }
  return true;
}

export const expectedWorkerEvents = Object.freeze([...EVENTS]);
export const originalPins = Object.freeze({
  jsepSha256: original.originalJsepSha256,
  modelByteLength: original.originalModelBytes,
  modelOnnxSha256: '02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3',
  historicalRedRun: original.originalHistoricalFailRun,
  historicalRedJob: original.originalHistoricalFailJob
});


/**
 * Read-only comparison of independently inspected GitHub WebKit receipts.
 * Classifies healthy Worker controls ONLY, never native RED or causal repair.
 * A no-JS-proxy original Worker has NO independently verified in-process
 * model/JSEP digest; original source pins do not substitute for that evidence.
 */
export function classifyOriginalWorkerProfile(receipt) {
  const base={
    schema:'M1585_WORKER_PROFILE_CONTROL_V1',status:'BLOCKED',
    originalNativeRedAttributed:false,nativeTrapPc:null,wasmFileOffset:null,
    causalFixProven:false,releaseAllowed:false,familyAlpha:'HOLD'
  };
  if (!receipt||!['instrumented','no-js-proxy'].includes(receipt.workerProfile))
    return {...base,reason:'PROFILE_MISSING_OR_INVALID'};
  if (receipt.engine!=='webkit' || receipt.originalFirstAttempt!==true ||
      receipt.workerSourceIsOriginalP94!==true ||
      receipt.inspectorFrontendCount!==1 ||
      receipt.originalWorkerCreated!==true || receipt.workerInitialized!==true ||
      receipt.publicJpegSubmitted!==true)
    return {...base,reason:'SOURCE_OR_FIRST_ATTEMPT_UNVERIFIED'};
  if (receipt.nativeTrapPc!=null || receipt.wasmFileOffset!=null ||
      receipt.originalModelRedObserved!==false ||
      receipt.causalFixProven!==false || receipt.releaseAllowed!==false ||
      receipt.familyAlpha!=='HOLD')
    return {...base,reason:'UNSUPPORTED_NATIVE_CLAIM'};
  if (receipt.workerTerminal==='error')
    return {...base,status:'ERROR_UNATTRIBUTED',
      reason:'GENERIC_WORKER_ERROR_NOT_PROOF_OF_ORIGINAL_NATIVE_TRAP'};
  if (receipt.workerTerminal!=='done')
    return {...base,reason:'NO_TERMINAL_WORKER_RECEIPT'};
  if (receipt.workerProfile==='no-js-proxy') {
    if (receipt.instrumentedWorkerForAttribution!==false ||
        receipt.workerAttestationProbeArmed!==false ||
        receipt.originalModelWeightsShaVerified!==false ||
        receipt.sameProcessOriginalJsepShaVerified!==false ||
        receipt.originalModelExecutedAndVerified!==false)
      return {...base,reason:'NO_PROXY_FALSE_MODEL_ATTESTATION'};
    return {...base,status:'HEALTHY_NO_JS_PROXY_UNATTESTED',
      reason:'INPROCESS_SHA_NOT_OBSERVED_WITHOUT_JS_PROXIES'};
  }
  if (receipt.instrumentedWorkerForAttribution!==true ||
      receipt.workerAttestationProbeArmed!==true ||
      receipt.originalModelWeightsShaVerified!==true ||
      receipt.sameProcessOriginalJsepShaVerified!==true ||
      receipt.originalModelExecutedAndVerified!==true ||
      receipt.sameWorkerJsepInstantiatedSha256!==originalPins.jsepSha256 ||
      receipt.sameWorkerModelCopySha256!==originalPins.modelOnnxSha256)
    return {...base,reason:'INSTRUMENTED_SAME_WORKER_SHA_UNVERIFIED'};
  return {...base,status:'HEALTHY_INSTRUMENTED_PROVENANCE_ATTESTED',
    reason:'CONTROL_ONLY_RESEARCH_PROXIES_CAN_PERTURB_TIMING'};
}

/**
 * Sanitized pinned-WebKit Worker Inspector exception candidate classifier.
 * WebKit source: InspectorDebuggerAgent::buildExceptionPauseReason wraps the
 * actual caught/thrown value as a Runtime.RemoteObject and transports it in
 * Debugger.paused.params.data. Only strict primitive flags leave this function.
 * An Inspector JS thrown object is NOT a native machine PC, WASM file offset,
 * OrtCreateSession call-site attribution, or causal fix.
 */
export function classifyPinnedWorkerExceptionPause(message) {
  const empty={
    schema:'M1585_WEBKIT_WORKER_THROWN_OBJECT_CLASS_V1',
    state:'UNVERIFIED',observedWebAssemblyRuntimeError:false,
    wasmBoundsMessageObserved:false,
    originalOrtCreateSessionAttribution:false,originalNativeRedObserved:false,
    nativeTrapPc:null,wasmFileOffset:null,sourceCxxStatement:null,
    causalFixProven:false,releaseAllowed:false,familyAlpha:'HOLD'
  };
  if (!message || message.method!=='Debugger.paused' ||
      message.params?.reason!=='exception') return {...empty,state:'NOT_AN_EXCEPTION_PAUSE'};
  const d=message.params.data;
  if (!d || typeof d!=='object' || Array.isArray(d) ||
      d.type!=='object'||d.subtype!=='error')
    return {...empty,state:'THROWN_OBJECT_NOT_IDENTIFIED'};
  if (typeof d.className!=='string'||d.className.length>60 ||
      typeof d.description!=='string'||d.description.length>4096)
    return {...empty,state:'ERROR_CLASS_OR_DESCRIPTION_UNAVAILABLE'};
  const runtime=d.className==='RuntimeError'||
    d.className==='WebAssembly.RuntimeError';
  const bounds=runtime && /(?:memory access out of bounds|out of bounds memory access|out-of-bounds memory access)/i
    .test(d.description);
  // Do NOT return original description / stack / object ID / thrown name.
  return {...empty,state:bounds?'WASM_BOUNDS_MESSAGE_UNATTRIBUTED':
    runtime?'WASM_RUNTIME_ERROR_OTHER_UNATTRIBUTED':'OTHER_ERROR_UNATTRIBUTED',
    observedWebAssemblyRuntimeError:runtime,wasmBoundsMessageObserved:bounds};
}
