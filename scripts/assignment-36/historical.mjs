import {execFileSync,spawnSync} from 'node:child_process';
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
 ['test-restore-atomic-01-browser.mjs'],
 ['audit-restore-atomic-01.mjs'],
 ['@restore-atomic-01-no-deploy.yml']
];
const native = ['native-3d-05','native-consumer-board-04','native-restore-3d-06',
 'native-index-live-07','native-photo-readiness-08','native-mobile-09','user-photo-3d-01',
 'style-owned-live-03','native-correction-10','native-style-correction-11']
 .flatMap(name => {
  const scripts = [['test-'+name+'-browser.mjs'], ['audit-'+name+'.mjs']];
  if (name !== 'native-3d-05' && name !== 'user-photo-3d-01')
   scripts.push(['@'+name+'-no-deploy.yml']);
  return scripts;
 });

const groups = {capture, index, review, auth:signedOut, backup, native,
 interrupt:[['assignment-31/browser.mjs']],
 model:[['test-multi-garment-capture-01-browser.mjs', {RECOGNITION42:'1'}],
  ['@model-review-safe-integration-45-no-deploy.yml']]};
const [group] = process.argv.slice(2);
if (!Object.hasOwn(groups, group)) throw Error('Choose one historical runtime group: '+Object.keys(groups).join(', '));
if (group === 'native') {
 const donor = '.native05-donor-541';
 const sha = execFileSync('git',['-C',donor,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 if (sha !== 'df6885d6011cb33fb22dceb81a08f35a0ac4dd61')
  throw Error('The original native 3D donor is not the verified exact commit');
 readFileSync(donor+'/benchmark/work47/manifest.json');
}
const results = [];
for (const [script, env] of groups[group]) {
 console.log('Running historical runtime:',script);
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
