import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { branch, verifySourceGate, workflow } from '../scripts/parallel106-source-gate.mjs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).replace(/\n$/, '');
const head = git('rev-parse', 'HEAD');
const event = { name: 'push', ref: branch, head, attempt: '1' };

test('actual migration commit preserves the frozen tree and copied donor', () => {
  verifySourceGate(git, event);
});

for (const [label, changes, expected] of [
  ['wrong branch', { ref: 'refs/heads/main' }, /branch/],
  ['wrong event', { name: 'pull_request_target' }, /event/],
  ['stale event head', { head: '0'.repeat(40) }, /event head/],
  ['re-run', { attempt: '2' }, /first attempts/],
]) {
  test(label, () => assert.throws(() => verifySourceGate(git, { ...event, ...changes }), expected));
}

for (const [label, match, replace, expected] of [
  ['wrong parent or merge', ([command]) => command === 'rev-list', value => value + ' unexpected', /one additive commit/],
  ['unexpected application source', ([command]) => command === 'diff-tree',
    value => value + 'M\0public/app.js\0', /approved migration additions/],
  ['one-bit owner assertion drift', ([command]) => command === 'diff-tree',
    value => value + 'M\0public/native-outfit-source-plan-p99.mjs\0', /approved migration additions/],
  ['unauthorized workflow permissions', ([command, ref]) => command === 'rev-parse' && ref === `${head}:${workflow}`,
    () => '0'.repeat(40), /workflow blob or permissions/],
  ['wrong copied donor blob', ([command, ref]) => command === 'rev-parse' && ref?.startsWith('5061d'),
    () => '0'.repeat(40), /copied donor blob/],
]) {
  test(label, () => assert.throws(() => verifySourceGate((...args) => {
    const actual = git(...args);
    return match(args) ? replace(actual) : actual;
  }, event), expected));
}
