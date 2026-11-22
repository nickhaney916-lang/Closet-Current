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
        !HASH.test(inspector.originalModelSha256 || ''))
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
