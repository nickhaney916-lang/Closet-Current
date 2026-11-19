import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateCloseout } from '../research/parallel105/closeout.mjs';

const candidate = 'a'.repeat(40);
const donor = 'b'.repeat(40);
const source = Object.fromEntries(['jpeg', 'model', 'jsep'].map((key, index) =>
  [key, String(index + 1).repeat(64)]));
const matrix = () => ['chromium', 'webkit'].flatMap(engine =>
  [320, 390, 430].map(width => ({
    checkout: candidate, process: `${engine}-${width}`, engine, width, attempt: 1,
    profile: 'original-owner-journey', status: 'PASS',
    observed: { ...source, process: `${engine}-${width}` },
  })));
const evaluate = browsers => evaluateCloseout({ candidate, source, browsers });

test('complete first-attempt evidence clears only the browser receipt gate', () => {
  assert.equal(evaluate(matrix()).browserGate, 'PASS');
});

test('green donor evidence cannot clear the integrated candidate gate', () => {
  assert.equal(evaluate(matrix().map(row => ({ ...row, checkout: donor }))).browserGate, 'BLOCKED');
});

test('job metadata cannot substitute for the checkout or process-observed hashes', () => {
  const rows = matrix();
  rows[0].workflowHead = candidate;
  delete rows[0].checkout;
  assert.equal(evaluate(rows).browserGate, 'BLOCKED');
  rows[0].checkout = candidate;
  rows[0].observed.process = rows[1].process;
  assert.equal(evaluate(rows).browserGate, 'BLOCKED');
  rows[0].observed.process = rows[0].process;
  for (const key of Object.keys(source)) {
    rows[0].observed[key] = 'f'.repeat(64);
    assert.equal(evaluate(rows).browserGate, 'BLOCKED', key);
    rows[0].observed[key] = source[key];
  }
});

test('missing, duplicate, shared-process and research receipts block promotion', () => {
  const rows = matrix();
  assert.equal(evaluate(rows.slice(1)).browserGate, 'BLOCKED');
  assert.equal(evaluate([...rows, rows[0]]).browserGate, 'BLOCKED');
  rows[0].process = rows[1].process;
  rows[0].observed.process = rows[1].process;
  assert.equal(evaluate(rows).browserGate, 'BLOCKED');
  rows[0] = { ...matrix()[0], profile: 'native-option-research' };
  assert.equal(evaluate(rows).browserGate, 'BLOCKED');
});

test('a retry cannot rescue an original RED, even when its hash is unavailable', () => {
  const rows = matrix();
  const failure = { ...rows[0], status: 'FAIL', observed: null };
  const result = evaluate([failure, { ...rows[0], attempt: 2 }, ...rows.slice(1)]);
  assert.equal(result.browserGate, 'FAIL');
  assert.deepEqual(result.failures, [failure]);
  assert.equal(evaluate([{ ...failure, checkout: donor }, ...rows]).browserGate, 'PASS');
  assert.equal(evaluate([{ ...failure, checkout: donor }, ...rows]).failures.length, 1);
});
