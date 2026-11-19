import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateCloseout } from '../research/parallel105/closeout.mjs';
import { evaluateM256 } from '../research/main1054/m256-negative-attempt-quarantine.mjs';

const candidate = 'a'.repeat(40);
const donor = 'b'.repeat(40);
const source = { jpeg: '1'.repeat(64), model: '2'.repeat(64), jsep: '3'.repeat(64) };
const matrix = () => ['chromium', 'webkit'].flatMap(engine =>
  [320, 390, 430].map(width => ({
    checkout: candidate, engine, width, process: engine + '-' + width,
    attempt: 1, profile: 'original-owner-journey', status: 'PASS',
    observed: { ...source, process: engine + '-' + width },
  })));
const ledger = browsers => ({ candidate, source, browsers });
const evalM256 = browsers => evaluateM256(ledger(browsers));

test('complete original six-cell candidate identity still passes only this receipt gate', () => {
  const r = evalM256(matrix());
  assert.equal(r.browserGate, 'PASS');
  assert.equal(r.candidateRedCount, 0);
  assert.equal(r.unattributedRedCount, 0);
});

test('TRUE baseline defect witness: original #105 passes a candidate red with mislabelled profile', () => {
  const bad = { ...matrix()[0], profile: 'uncategorized-browser-failure', status: 'FAIL', observed: null };
  const old = evaluateCloseout(ledger([...matrix(), bad]));
  assert.equal(old.browserGate, 'PASS');
  assert.equal(old.failures.length, 1);
  const fixed = evalM256([...matrix(), bad]);
  assert.equal(fixed.browserGate, 'FAIL');
  assert.equal(fixed.candidateRedCount, 1);
});

test('candidate RED missing profile cannot be hidden by passing sibling receipt', () => {
  const bad = { ...matrix()[4], profile: undefined, status: 'FAIL', observed: null };
  assert.equal(evalM256([...matrix(), bad]).browserGate, 'FAIL');
});

test('candidate WebKit TIMEOUT after WASM is a real RED even if original validator misses it', () => {
  const bad = { ...matrix()[4], profile: 'model-initialization', status: 'TIMEOUT', observed: null };
  assert.equal(evaluateCloseout(ledger([...matrix(), bad])).browserGate, 'PASS');
  const r = evalM256([...matrix(), bad]);
  assert.equal(r.browserGate, 'FAIL');
  assert.equal(r.candidateRedCount, 1);
  assert.equal(r.recordedReds, 0);
});

test('candidate CRASH/ERROR/HANG/NONZERO/ABORTED are never promoted', () => {
  for (const status of ['CRASH', 'ERROR', 'HANG', 'NONZERO', 'ABORTED']) {
    const bad = { ...matrix()[3], profile: 'other', status };
    assert.equal(evalM256([...matrix(), bad]).browserGate, 'FAIL', status);
  }
});

test('candidate unknown terminal is BLOCKED, not silently promoted', () => {
  const unknown = { ...matrix()[3], profile: 'other', status: 'UNKNOWN' };
  const r = evalM256([...matrix(), unknown]);
  assert.equal(r.browserGate, 'BLOCKED');
  assert.equal(r.uncertainCandidateCount, 1);
});

test('candidate retry under another profile cannot rescue or obscure first attempt', () => {
  const retry = { ...matrix()[3], profile: 'other', attempt: 2, process: 'new-process',
    observed: { ...source, process: 'new-process' } };
  assert.equal(evalM256([...matrix(), retry]).browserGate, 'BLOCKED');
});

test('unattributed original browser-cell failure is BLOCKED pending checkout identity', () => {
  const bad = { engine: 'webkit', width: 320, status: 'FAIL', attempt: 1 };
  const r = evalM256([...matrix(), bad]);
  assert.equal(r.browserGate, 'BLOCKED');
  assert.equal(r.unattributedRedCount, 1);
});

test('donor RED is retained in counts but cannot condemn independently attested candidate', () => {
  const donorFail = { ...matrix()[3], checkout: donor, status: 'FAIL', profile: 'original-owner-journey' };
  const r = evalM256([...matrix(), donorFail]);
  assert.equal(r.browserGate, 'PASS');
  assert.equal(r.recordedReds, 1);
  assert.equal(r.candidateRedCount, 0);
});

test('a candidate source hash mismatch still blocks even without failure records', () => {
  const rows = matrix();
  rows[0].observed.jpeg = 'f'.repeat(64);
  assert.equal(evalM256(rows).browserGate, 'BLOCKED');
});

test('genuine original candidate FAIL takes precedence over missing source hash (FAIL over BLOCKED)', () => {
  const rows = matrix();
  rows[1].observed.model = 'f'.repeat(64);
  const bad = { ...matrix()[3], profile: 'other', status: 'FAIL' };
  assert.equal(evalM256([...rows, bad]).browserGate, 'FAIL');
});

test('invalid ledgers reject rather than passing', () => {
  assert.throws(() => evaluateM256({ candidate, source, browsers: null }), TypeError);
  assert.throws(() => evaluateM256({ candidate: 'bad', source, browsers: matrix() }), TypeError);
});

test('summary contains only bounded status/reasons/counts, never raw source receipts', () => {
  const r = evalM256([...matrix(), { ...matrix()[3], status: 'FAIL', note: 'DO_NOT_EXPOSE' }]);
  assert.equal(JSON.stringify(r).includes('DO_NOT_EXPOSE'), false);
  assert.equal(Object.hasOwn(r, 'failures'), false);
});
