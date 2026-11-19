import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const candidate = 'a16f55d2230afab907957ddffa8c5af968b39f20';
export const branch = 'refs/heads/research/parallel106-m4-gate-migration-HOLD';
export const workflow = '.github/workflows/parallel106-m183-no-deploy.yml';
const workflowBlob = '4f2db5c8750088cb041a49d899d4a4a8c4ab48c5';
const additions = [
  workflow,
  'research/parallel106/README.md',
  'scripts/parallel106-source-gate.mjs',
  'tests/parallel106-source-gate.test.mjs',
].sort();
const lineage = [
  'f2befed4c776786dc11843b98fafec72f2d9c202',
  'ebb8f7f333864ee6072a620e8b93bca76ebed9ae',
  'b50122f86997b3111afbbb00886f303fee0a27d6',
  candidate,
];
const copiedDonor = '5061d8087badc300dabed2ff246b2d0461ff0cac';
const donorFiles = [
  '.github/workflows/parallel105-closeout-no-deploy.yml',
  'research/parallel105/README.md',
  'research/parallel105/closeout.mjs',
  'tests/parallel105-closeout.test.mjs',
];

function requireMatch(condition, message) {
  if (!condition) throw new Error(message);
}

export function verifySourceGate(git, event) {
  requireMatch(event.name === 'push' && event.ref === branch, 'Unexpected event or branch');
  requireMatch(event.attempt === '1', 'Only first attempts qualify');
  const head = git('rev-parse', 'HEAD');
  requireMatch(event.head === head, 'Checkout does not match event head');
  requireMatch(git('rev-list', '--parents', '-n', '1', head) === `${head} ${candidate}`,
    'Expected exactly one additive commit on the frozen M256 head');

  for (let index = 1; index < lineage.length; index++) {
    git('merge-base', '--is-ancestor', lineage[index - 1], lineage[index]);
  }

  const changes = git('diff-tree', '--no-commit-id', '-r', '--no-renames',
    '--name-status', '-z', candidate, head);
  requireMatch(changes === additions.map(path => `A\0${path}\0`).join(''),
    'Expected only the four approved migration additions');
  for (const path of additions) {
    requireMatch(git('ls-tree', head, '--', path).startsWith('100644 blob '),
      `Expected a regular migration file: ${path}`);
  }
  requireMatch(git('rev-parse', `${head}:${workflow}`) === workflowBlob,
    'Unexpected workflow blob or permissions');
  for (const path of donorFiles) {
    requireMatch(git('rev-parse', `${copiedDonor}:${path}`) === git('rev-parse', `${head}:${path}`),
      `Unverified copied donor blob: ${path}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const git = (...args) => execFileSync('git', ['-c', 'safe.directory=' + process.cwd(), ...args],
    { encoding: 'utf8' }).replace(/\n$/, '');
  git('diff', '--quiet', 'HEAD', '--');
  verifySourceGate(git, {
    name: process.env.GITHUB_EVENT_NAME,
    ref: process.env.GITHUB_REF,
    head: process.env.GITHUB_SHA,
    attempt: process.env.GITHUB_RUN_ATTEMPT,
  });
  console.log('PASS: M183 successor source gate. Browser and receipt verdicts are separate.');
}
