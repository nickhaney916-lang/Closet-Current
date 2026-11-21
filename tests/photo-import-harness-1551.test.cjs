'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

const cwd = resolve(__dirname, '..');
const target = 'tests/photo-import.test.cjs';
const expected = [
  'separate imported photos get independent review records',
  'partial import failures preserve prior review records and show file limits',
];

function run(args = []) {
  // Node's parent test runner sets NODE_TEST_CONTEXT=child-v8; inheriting it
  // makes the nested runner emit no standalone TAP even on a green exit.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const proc = spawnSync(process.execPath, [
    '--test', '--test-reporter=tap', ...args, target,
  ], { cwd, env, encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024 });
  assert.equal(proc.error, undefined, String(proc.error));
  assert.equal(proc.status, 0,
    'genuine photo-import assertions must complete successfully:\n' +
    proc.stdout + '\n' + proc.stderr);
  assert.equal(proc.signal, null);
  return proc.stdout;
}

test('photo import registers independently named asynchronous Node test cases', () => {
  const result = run();
  for (const name of expected)
    assert.ok(result.includes('# Subtest: ' + name),
      'expected named Node assertion group missing: ' + name + '\n' + result);
  assert.match(result, /# tests 2(?:\r?\n|$)/);
  assert.match(result, /# pass 2(?:\r?\n|$)/);
  assert.match(result, /# fail 0(?:\r?\n|$)/);
  assert.match(result, /# skipped 0(?:\r?\n|$)/);
});

test('photo import test cases can run independently by name without prior fixture state', () => {
  for (const name of expected) {
    const result = run(['--test-name-pattern=' + name]);
    // Node 22 filters out nonmatching test definitions before TAP counting.
    // Exactly one named test should be discovered and executed from a fresh VM.
    assert.ok(result.includes('# Subtest: ' + name));
    assert.match(result, /# tests 1(?:\r?\n|$)/);
    assert.match(result, /# pass 1(?:\r?\n|$)/);
    assert.match(result, /# skipped 0(?:\r?\n|$)/);
    assert.match(result, /# fail 0(?:\r?\n|$)/);
  }
});
