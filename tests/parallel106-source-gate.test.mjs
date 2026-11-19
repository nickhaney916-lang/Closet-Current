import assert from 'node:assert/strict';
import test from 'node:test';
import { branch, candidate, verifySourceGate, workflow } from '../scripts/parallel106-source-gate.mjs';

const firstMigration = '256f75d8cd7b7e0edc846addc593e54964d88759';
const head = '1'.repeat(40);
const event = { name: 'push', ref: branch, head, attempt: '1' };
const followUpFiles = [
  'research/parallel106/README.md',
  'scripts/parallel106-source-gate.mjs',
  'tests/parallel106-source-gate.test.mjs',
];
const additions = [workflow, ...followUpFiles];
const workflowBlob = '4f2db5c8750088cb041a49d899d4a4a8c4ab48c5';

function fixture(command, ...args) {
  const last = args.at(-1);
  switch (command) {
    case 'rev-parse':
      if (last === 'HEAD') return head;
      return last === `${head}:${workflow}` ? workflowBlob : '2'.repeat(40);
    case 'rev-list':
      return last === head ? `${head} ${firstMigration}` : `${firstMigration} ${candidate}`;
    case 'merge-base':
      return '';
    case 'diff-tree':
      return args.at(-2) === firstMigration
        ? followUpFiles.map(path => `M\0${path}\0`).join('')
        : additions.map(path => `A\0${path}\0`).join('');
    case 'ls-tree':
      return '100644 blob ';
    default:
      throw new Error(`Unexpected fixture Git command: ${command}`);
  }
}

test('verifier accepts the exact reviewed tree fixture', () => verifySourceGate(fixture, event));

for (const [label, changes, expected] of [
  ['wrong branch', { ref: 'refs/heads/main' }, /branch/],
  ['wrong event', { name: 'pull_request_target' }, /event/],
  ['stale event head', { head: '0'.repeat(40) }, /event head/],
  ['re-run', { attempt: '2' }, /first attempts/],
]) {
  test(label, () => assert.throws(() => verifySourceGate(fixture, { ...event, ...changes }), expected));
}

for (const [label, match, replace, expected] of [
  ['wrong parent or merge', ([command]) => command === 'rev-list', value => value + ' unexpected', /single reviewed follow-up/],
  ['unexpected application source', ([command, ...args]) => command === 'diff-tree' && args.at(-2) === candidate,
    value => value + 'M\0public/app.js\0', /approved migration additions/],
  ['one-bit owner assertion drift', ([command, ...args]) => command === 'diff-tree' && args.at(-2) === candidate,
    value => value + 'M\0public/native-outfit-source-plan-p99.mjs\0', /approved migration additions/],
  ['unauthorized workflow permissions', ([command, ref]) => command === 'rev-parse' && ref === `${head}:${workflow}`,
    () => '0'.repeat(40), /workflow blob or permissions/],
  ['wrong copied donor blob', ([command, ref]) => command === 'rev-parse' && ref?.startsWith('5061d'),
    () => '0'.repeat(40), /copied donor blob/],
]) {
  test(label, () => assert.throws(() => verifySourceGate((...args) => {
    const actual = fixture(...args);
    return match(args) ? replace(actual) : actual;
  }, event), expected));
}
