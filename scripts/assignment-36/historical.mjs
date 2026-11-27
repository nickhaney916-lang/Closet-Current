import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

// Preserve the original runtime entry points. Their historical workflow
// preflights continue to apply exclusively to their original branches.
const capture = [
 ['test-native-canonical-original-167-browser.mjs', {ASSIGNMENT_29:'1'}],
 ['test-capture-proof-01-browser.mjs'],
 ['@capture-proof-01-no-deploy.yml'],
 ['test-camera-to-closet-79-browser.mjs']
];
const index = [
 ['test-wardrobe-index-02-browser.mjs'],
 ['@wardrobe-index-02-no-deploy.yml'],
 ['test-index-04-browser.mjs'],
 ['@index-04-no-deploy.yml']
];
const review = [
 ['verify-review-source-epoch-34.mjs'],
 ['verify-review-save-finality-34.mjs'],
 ['verify-review-worker-finality-38.mjs'],
 ['verify-color-provenance-integration-41.mjs'],
 ['@color-provenance-integration-41-no-deploy.yml'],
 ['verify-category-subtype-commit-43.mjs'],
 ['verify-confirmed-edit-memory-44.mjs'],
 ['@confirmed-edit-memory-44-no-deploy.yml'],
 ['test-multi-garment-capture-01-browser.mjs'],
 ['test-multi-garment-capture-01-browser.mjs', {NAME66:'1'}],
 ['audit-corrected-name-index-66-browser.mjs']
];
const signedOut = [
 ['verify-auth-review-session-36.mjs'],
 ['assignment-36/audit-auth36.mjs']
];
const backup = [
 ['repro-restore-atomic-01-baseline.mjs'],
 ['test-restore-atomic-01-browser.mjs'],
 ['audit-restore-atomic-01.mjs']
];
const native = [
 ['build-three-d-31-jeans-proposal.mjs'],
 ['build-three-d-37-second-jeans.mjs'],
 ['build-work47-benchmark.mjs'],
 ...['native-3d-05','native-consumer-board-04','native-restore-3d-06',
  'native-index-live-07','native-photo-readiness-08','native-mobile-09','user-photo-3d-01',
  'style-owned-live-03','native-correction-10','native-style-correction-11']
  .flatMap(name => [['test-'+name+'-browser.mjs'], ['audit-'+name+'.mjs']])
];

const groups = {capture, index, review, auth:signedOut, backup, native,
 interrupt:[['assignment-31/browser.mjs']],
 model:[['test-multi-garment-capture-01-browser.mjs', {RECOGNITION42:'1'}],
  ['@model-review-safe-integration-45-no-deploy.yml']]};
const [group] = process.argv.slice(2);
if (!Object.hasOwn(groups, group)) throw Error('Choose one historical runtime group: '+Object.keys(groups).join(', '));
const results = [];
for (const [script, env] of groups[group]) {
 let args = ['scripts/'+script];
 let input;
 if (script.startsWith('@')) {
  // Run the exact independent JavaScript audit from the pinned workflow.
  // Shell preflight and release constraints stay with that workflow.
  const workflow = readFileSync('.github/workflows/'+script.slice(1), 'utf8');
  const audits = [...workflow.matchAll(/^([ ]+)node --input-type=module <<'(NODE|EONODE)'\r?\n([\s\S]*?)^\1\2\r?$/gm)];
  if (audits.length !== 1) throw Error('Expected one original inline audit in '+script);
  input = audits[0][3];
  args = ['--input-type=module','-'];
 }
 const result = spawnSync(process.execPath, args, {
  input, stdio:[input === undefined ? 'inherit' : 'pipe','inherit','inherit'],
  env:{...process.env, ...env}, timeout:12*60*1000
 });
 results.push({script, env:env ?? {}, status:result.status, error:result.error?.code,
  signal:result.signal, result:result.status === 0 ? 'PASS' : 'FAIL'});
}
console.log(JSON.stringify({group, results}));
if (results.some(result => result.result !== 'PASS')) process.exitCode = 1;
