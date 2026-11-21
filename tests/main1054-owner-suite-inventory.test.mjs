import assert from 'node:assert/strict';
import test from 'node:test';
import { candidateSha, parseTap, suites, verifySuiteEvidence } from '../research/main1054/owner-suite-inventory.mjs';

function receipt() {
  return {
    sourceSha: candidateSha,
    blobs: Object.fromEntries(suites.map(s => [s.file, s.blob])),
    runs: suites.map(s => ({
      file: s.file, exitCode: 0, signal: null, error: null,
      tap: { tests: 2, pass: 2, fail: 0, skipped: 0, cancelled: 0, todo: 0,
        names: [s.requiredCase, 'another independently reported test'] },
    })),
  };
}
test('limited suite verification succeeds only with all named pinned controls', () => {
  const result = verifySuiteEvidence(receipt());
  assert.equal(result.status, 'PASS');
  assert.equal(result.familyAlpha, 'HOLD');
  assert.equal(result.originalOwnerFlow, false);
  assert.equal(result.realAccountIsolation, false);
  assert.equal(result.nativeRepair, false);
  assert.equal(result.webkit, false);
});
const violations = [
  ['wrong source commit', r => { r.sourceSha = '0'.repeat(40); }],
  ['missing source commit', r => { delete r.sourceSha; }],
  ['tampered account test file', r => { r.blobs[suites[0].file] = '0'.repeat(40); }],
  ['no source identities', r => { delete r.blobs; }],
  ['missing privacy/account case', r => { r.runs[0].tap.names = ['another test']; }],
  ['missing owner-photo case', r => { r.runs[1].tap.names = ['another test']; }],
  ['missing backup case', r => { r.runs[2].tap.names = []; }],
  ['missing outfit case', r => { r.runs[3].tap.names = []; }],
  ['suite omitted', r => { r.runs.pop(); }],
  ['duplicate suite hides an omission', r => { r.runs[3].file = r.runs[0].file; }],
  ['runner failed', r => { r.runs[0].exitCode = 1; }],
  ['runner could not spawn', r => { r.runs[0].error = 'ENOENT'; }],
  ['runner timed out', r => { r.runs[0].signal = 'SIGTERM'; }],
  ['zero tests executed', r => { r.runs[0].tap.tests = 0; r.runs[0].tap.pass = 0; }],
  ['failed hidden test', r => { r.runs[0].tap.fail = 1; }],
  ['one skipped test', r => { r.runs[0].tap.skipped = 1; }],
  ['one cancelled test', r => { r.runs[0].tap.cancelled = 1; }],
  ['one todo test', r => { r.runs[0].tap.todo = 1; }],
  ['malformed TAP totals', r => { r.runs[0].tap.tests = null; }],
  ['reported passes differ from registered tests', r => { r.runs[0].tap.pass = 1; }],
];
for (const [label, modify] of violations) {
  test('fail-closed on ' + label, () => {
    const r = receipt();
    modify(r);
    assert.equal(verifySuiteEvidence(r).status, 'BLOCKED');
  });
}
test('actual Node TAP must provide exactly one terminal summary per count', () => {
  const good = '# Subtest: account guard\nok 1 - account guard\n1..1\n# tests 1\n# pass 1\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n';
  assert.deepEqual(parseTap(good), {
    tests: 1, pass: 1, fail: 0, cancelled: 0, skipped: 0, todo: 0,
    names: ['account guard'],
  });
  assert.equal(parseTap(good + '# pass 1\n').pass, null);
  assert.equal(parseTap('test output without Node TAP summary').tests, null);
});
