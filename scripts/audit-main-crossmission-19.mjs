#!/usr/bin/env node
// Read-only exact-commit ancestry and overlapping-path audit. No merges or network.
import { execFileSync } from 'node:child_process';

const shaPattern = /^[0-9a-f]{40}$/i;
const git = (...args) => execFileSync('git', args, {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 20 * 1024 * 1024,
}).trim();

function usage() {
  throw new Error('Usage: node scripts/audit-main-crossmission-19.mjs --controller <40-hex-sha> --donor <name>=<40-hex-sha> [--donor <name>=<sha> ...]');
}
function argsFromCli(argv) {
  let controller = null;
  const donors = new Map();
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    const value = argv[++i];
    if (!value) usage();
    if (key === '--controller') {
      if (controller || !shaPattern.test(value)) usage();
      controller = value.toLowerCase();
    } else if (key === '--donor') {
      const match = /^([a-z][a-z0-9-]{0,39})=([0-9a-f]{40})$/i.exec(value);
      if (!match || donors.has(match[1])) usage();
      donors.set(match[1], match[2].toLowerCase());
    } else usage();
  }
  if (!controller || donors.size === 0) usage();
  return { controller, donors };
}
function changedPaths(base, ref) {
  const output = git('diff', '--name-only', '--diff-filter=ACDMRT', '-z', base, ref);
  return new Set(output.split('\0').filter(Boolean));
}
function sourcePath(path) {
  return /^(public\/|supabase\/|src\/|package\.json$|package-lock\.json$)/.test(path);
}
function analyze(controller, name, sha) {
  git('rev-parse', '--verify', sha + '^{commit}');
  const mergeBase = git('merge-base', controller, sha);
  const counts = git('rev-list', '--left-right', '--count', controller + '...' + sha).split(/\s+/).map(Number);
  const [controllerOnly, donorOnly] = counts;
  if (counts.length !== 2 || !counts.every(Number.isSafeInteger)) throw new Error('Missing ancestry counts');
  const controllerPaths = changedPaths(mergeBase, controller);
  const donorPaths = changedPaths(mergeBase, sha);
  const overlappingPaths = [...controllerPaths].filter(path => donorPaths.has(path)).sort();
  const overlappingConsumerPaths = overlappingPaths.filter(sourcePath);
  return {
    name, sha, mergeBase, controllerOnlyCommits: controllerOnly,
    donorOnlyCommits: donorOnly, controllerChangedPaths: controllerPaths.size,
    donorChangedPaths: donorPaths.size, overlappingPaths,
    overlappingConsumerPaths,
    integrationReviewRequired: overlappingConsumerPaths.length > 0,
  };
}
try {
  const { controller, donors } = argsFromCli(process.argv.slice(2));
  git('rev-parse', '--verify', controller + '^{commit}');
  const results = [...donors].map(([name, sha]) => analyze(controller, name, sha));
  process.stdout.write(JSON.stringify({
    schema: 'closet-crossmission-ancestry-19-v1', controller,
    warning: 'Path overlap indicates review risk, not a proven textual or semantic merge conflict. No tests or integration have been run.',
    results,
  }, null, 2) + '\n');
} catch (error) {
  process.stderr.write('AUDIT BLOCKED: ' + error.message + '\n');
  process.exitCode = 2;
}
