import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { evaluateCloseout } from '../parallel105/closeout.mjs';

// This is an additional release-evidence gate, not a replacement for the
// historical #105 donor and not a model/browser instrumentation mechanism.
const terminalReds = new Set(['FAIL', 'ERROR', 'TIMEOUT', 'CRASH', 'HANG', 'NONZERO', 'ABORTED']);
const expectedCells = new Set(['chromium', 'webkit'].flatMap(engine =>
  [320, 390, 430].map(width => engine + '/' + width)));

export function evaluateM256(ledger) {
  // Inherit exact six-cell candidate checkout, first-attempt and same-process
  // JPEG/model/JSEP digest requirements from the unmodified #105 validator.
  const base = evaluateCloseout(ledger);
  const { candidate, browsers } = ledger;

  // A genuine same-candidate RED must not disappear because its profile
  // differs or is absent. Never rewrite FAIL/timeout into a PASS on retry.
  const candidateReds = browsers.filter(row =>
    row.checkout === candidate && terminalReds.has(row.status));

  // A RED from an expected browser matrix cell without a checkout cannot be
  // attributed safely to a donor or the candidate; block promotion.
  const unattributedReds = browsers.filter(row =>
    (row.checkout === undefined || row.checkout === null || row.checkout === '') &&
    terminalReds.has(row.status) &&
    expectedCells.has(row.engine + '/' + row.width));

  // Candidate rows with an unknown/non-PASS terminal or re-attempt under a
  // different profile are not allowed to launder a first-attempt source PASS.
  const uncertainCandidateRows = browsers.filter(row =>
    row.checkout === candidate &&
    !terminalReds.has(row.status) &&
    (row.status !== 'PASS' || row.attempt !== 1));

  let browserGate = base.browserGate;
  const reasons = [...base.reasons];
  if (candidateReds.length) {
    browserGate = 'FAIL';
    reasons.push('A candidate-checkout browser terminal RED exists outside or inside the normal profile');
  }
  if (unattributedReds.length) {
    if (browserGate !== 'FAIL') browserGate = 'BLOCKED';
    reasons.push('A browser terminal RED lacks a trustworthy checkout and cannot be assigned to a donor');
  }
  if (uncertainCandidateRows.length) {
    if (browserGate === 'PASS') browserGate = 'BLOCKED';
    reasons.push('Candidate receipts include a nonstandard terminal or retry outside the original profile');
  }

  // Counts only; do not serialize browser receipts, source pixels, raw errors
  // or account/session data into this gate's reports.
  return {
    candidate, browserGate, reasons,
    recordedReds: base.failures.length,
    candidateRedCount: candidateReds.length,
    unattributedRedCount: unattributedReds.length,
    uncertainCandidateCount: uncertainCandidateRows.length,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = evaluateM256(JSON.parse(readFileSync(process.argv[2], 'utf8')));
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = { PASS: 0, FAIL: 1, BLOCKED: 2 }[result.browserGate];
  } catch {
    console.error('BLOCKED: invalid or unreadable candidate receipt ledger');
    process.exitCode = 2;
  }
}
