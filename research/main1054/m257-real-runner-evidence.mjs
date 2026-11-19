import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const fullHead = /^[a-f0-9]{40}$/;
const digest = /^[a-f0-9]{64}$/;
const engines = new Set(['webkit', 'chromium']);
const widths = new Set([320, 390, 430]);
const stages = [
  'M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW',
  'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',
  'P91_FULL_JOURNEY_PASS',
];
const cells = ['chromium', 'webkit'].flatMap(engine =>
  [320, 390, 430].map(width => engine + '/' + width));
const evidenceMissing = 'Original browser process model and JSEP WASM SHA-256 not observed';

function isValidIdentity(x) {
  return x && fullHead.test(x.checkout) && engines.has(x.engine) &&
    widths.has(x.width) && /^[0-9]{3,30}$/.test(String(x.runId)) &&
    /^[a-zA-Z0-9_-]{1,100}$/.test(String(x.job)) &&
    Number.isInteger(x.runAttempt) && x.runAttempt >= 1 &&
    Number.isInteger(x.exitCode) && x.exitCode >= 0 && x.exitCode <= 255 &&
    digest.test(x.lockedJpegSha);
}

// Parse only three known native P94 source/owner stage tags. Never echo the
// original raw Worker/browser log, stack, account, URL, or model fetches.
function stageValues(log, name) {
  const rows = [];
  for (const line of log.split(/\r?\n/)) {
    if (!line.startsWith(name + ' ')) continue;
    const json = line.slice(name.length + 1);
    if (json.length > 10000) { rows.push(null); continue; }
    try {
      const parsed = JSON.parse(json);
      rows.push(parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed : null);
    } catch { rows.push(null); }
  }
  return rows;
}

export function extractM257Attempt(log, identity) {
  if (typeof log !== 'string' || !isValidIdentity(identity))
    throw new TypeError('Invalid original-run log or exact CI identity');
  const { checkout, engine, width, runId, job, runAttempt, exitCode, lockedJpegSha } = identity;
  const reasons = [];
  const data = stages.map(name => stageValues(log, name));
  if (data.some(rows => rows.length !== 1 || rows[0] === null))
    reasons.push('Missing, duplicate, or malformed original browser stage signal');

  const [model, owner, final] = data.map(rows => rows.length === 1 ? rows[0] : null);
  if (model?.engine !== engine || model?.realWorker !== true ||
      model?.sourceSHA256 !== lockedJpegSha || model?.saved !== 0 ||
      model?.hold !== true || !(Number.isInteger(model?.modelRequests) && model.modelRequests > 0))
    reasons.push('No verified original Worker/model proposal and zero-auto-save source signal');

  if (owner?.engine !== engine || owner?.modelExecuted !== true ||
      owner?.manualSyntheticOwnerConfirmed !== true || owner?.ownerPrivateSaved !== 1 ||
      owner?.exactOriginalSHA256 !== lockedJpegSha || owner?.realNativeOutfit !== true ||
      owner?.savedOutfitOwnerAction !== true || owner?.restoredSavedOutfitCount !== 1 ||
      owner?.actualV4BrowserDownload !== true || owner?.tamperDenied !== true ||
      owner?.otherOwnerDenied !== true || owner?.cancelledRestoreUnchanged !== true ||
      owner?.atomicRestore !== true || owner?.threeDAuthorized !== false ||
      owner?.hostedRLS !== false || owner?.familyAlpha !== 'HOLD')
    reasons.push('No verified synthetic-owner private outfit, original v4 restore, 2D-only and owner-exclusion signal');

  if (final?.engine !== engine || final?.uninterruptedSourceExportRestore !== true ||
      final?.writeRetries !== 0 || final?.ownerRecovery !== true ||
      final?.originalPhotoByteTamperRefused !== true ||
      final?.familyAlpha !== 'HOLD' || final?.releaseAuthorized !== false)
    reasons.push('Original final uninterrupted browser stage absent or invalid');

  const journeyStatus = exitCode !== 0 ? 'FAIL' : reasons.length ? 'BLOCKED' : 'PASS';
  if (exitCode !== 0) reasons.unshift('Original P94 browser child process exited nonzero');

  // The frozen P94 runner observes a genuine JPEG SHA but NOT model/JSEP
  // response SHA digests attached to the actual browser process. A CI job ID,
  // passed HTTP request, package pin, model revision or donor cannot substitute.
  return {
    schema: 'MAIN1054_M257_REAL_RUNNER_EVIDENCE_V1',
    checkout, engine, width, runId: String(runId), job, runAttempt, exitCode,
    journeyStatus,
    sourceEvidenceGate: journeyStatus === 'FAIL' ? 'FAIL' : 'BLOCKED',
    jpegSHA256: model?.sourceSHA256 === lockedJpegSha &&
      owner?.exactOriginalSHA256 === lockedJpegSha ? lockedJpegSha : null,
    modelSHA256: null, jsepSHA256: null,
    sameBrowserProcessObserved: false,
    actualBrowserProcessId: null,
    sourceVerifiedInOriginalProcess: false,
    recordedSignals: Object.fromEntries(stages.map((name, i) => [name, data[i].length])),
    reasons: [...reasons, evidenceMissing],
    syntheticAuthOnly: true, privateCloudRlsTested: false,
    fittedPhoto3DAuthorized: false, familyAlpha: 'HOLD',
  };
}

export function aggregateM257(receipts, { checkout, runId }) {
  if (!fullHead.test(checkout) || !/^[0-9]{3,30}$/.test(String(runId)) ||
      !Array.isArray(receipts)) throw new TypeError('Invalid immutable run identity');
  const reasons = [], seen = new Set();
  let passedJourneys = 0, failedJourneys = 0;
  for (const row of receipts) {
    if (!row || row.schema !== 'MAIN1054_M257_REAL_RUNNER_EVIDENCE_V1' ||
        row.checkout !== checkout || row.runId !== String(runId) ||
        !engines.has(row.engine) || !widths.has(row.width) ||
        row.runAttempt !== 1 ||
        row.modelSHA256 !== null || row.jsepSHA256 !== null ||
        row.actualBrowserProcessId !== null || row.sameBrowserProcessObserved !== false ||
        row.sourceEvidenceGate === 'PASS') {
      reasons.push('Invalid, cross-run, retry, or falsely attested browser receipt');
      continue;
    }
    const cell = row.engine + '/' + row.width;
    if (seen.has(cell)) reasons.push('Duplicate browser matrix cell');
    seen.add(cell);
    if (row.journeyStatus === 'PASS' && row.exitCode === 0 &&
        digest.test(row.jpegSHA256) && row.sourceEvidenceGate === 'BLOCKED')
      passedJourneys++;
    else if (row.journeyStatus === 'FAIL' || row.exitCode !== 0)
      failedJourneys++;
    else reasons.push('Browser cell lacks complete verified original owner journey');
  }
  if (seen.size !== cells.length || cells.some(c => !seen.has(c)))
    reasons.push('Incomplete six-cell native browser matrix');
  const journeyGate = failedJourneys ? 'FAIL' :
    reasons.length ? 'BLOCKED' : 'PASS';
  return {
    schema: 'MAIN1054_M257_SIX_CELL_INGESTION_V1',
    checkout, runId: String(runId), seenCells: seen.size, passedJourneys,
    failedJourneys, journeyGate,
    // Never say source receipt PASS merely because authentic browser
    // journeys pass; original native JSEP/ONNX hashes remain unattested.
    sourceEvidenceGate: failedJourneys ? 'FAIL' : 'BLOCKED',
    reasons: [...reasons, evidenceMissing],
    releaseAuthorized: false, familyAlpha: 'HOLD',
  };
}

function pinnedJpegSha() {
  const source = JSON.parse(readFileSync('benchmark/locked-photo-sources.json', 'utf8'))
    .find(row => row.id === 'commons-0003');
  const actual = createHash('sha256')
    .update(readFileSync('benchmark/fixtures/commons-0003.jpg')).digest('hex');
  if (!source?.verified || source.sha256 !== actual)
    throw new Error('Original public source JPEG pin mismatch');
  return actual;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const mode = process.argv[2];
    if (mode === 'attempt') {
      const [logfile, output] = process.argv.slice(3);
      if (!logfile || !output) throw new Error('Missing local CI paths');
      const receipt = extractM257Attempt(readFileSync(logfile, 'utf8'), {
        checkout: process.env.EXPECTED_HEAD,
        engine: process.env.M58_ENGINE,
        width: Number(process.env.P94_WIDTH),
        runId: process.env.GITHUB_RUN_ID, job: process.env.GITHUB_JOB,
        runAttempt: Number(process.env.GITHUB_RUN_ATTEMPT),
        exitCode: Number(process.env.MODEL_EXIT), lockedJpegSha: pinnedJpegSha(),
      });
      writeFileSync(output, JSON.stringify(receipt, null, 2));
      console.log('M257_NATIVE_JOURNEY', receipt.journeyStatus,
        'SOURCE_ATTESTATION', receipt.sourceEvidenceGate, receipt.engine, receipt.width);
      if (receipt.journeyStatus !== 'PASS') process.exitCode = 1;
    } else if (mode === 'aggregate') {
      const dir = process.argv[3];
      if (!dir) throw new Error('Missing local receipt directory');
      const files = readdirSync(dir).filter(n => /^receipt-(chromium|webkit)-(320|390|430)\.json$/.test(n));
      const receipts = files.map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')));
      const result = aggregateM257(receipts, {
        checkout: process.env.EXPECTED_HEAD, runId: process.env.GITHUB_RUN_ID,
      });
      console.log(JSON.stringify(result, null, 2));
      if (result.journeyGate !== 'PASS' || result.passedJourneys !== 6 ||
          result.sourceEvidenceGate !== 'BLOCKED') process.exitCode = 1;
    } else throw new Error('Unknown mode');
  } catch {
    console.error('M257 BLOCKED: missing or invalid native evidence; no promotion');
    process.exitCode = 2;
  }
}
