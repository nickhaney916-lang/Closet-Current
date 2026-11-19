import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const frozenParent = 'da9b8c81d8d7368f882489b439431e1d4a6871b4';
export const verifiedCandidate = 'a16f55d2230afab907957ddffa8c5af968b39f20';
export const protectedConsumer = 'f2befed4c776786dc11843b98fafec72f2d9c202';
export const expectedBranch = 'refs/heads/research/main1054-m271-m58-gate-successor-HOLD';
export const addedPaths = [
  '.github/workflows/main1054-m271-m58-successor-no-deploy.yml',
  'scripts/main1054-m271-m58-gate.mjs',
  'tests/main1054-m271-m58-gate.test.mjs',
];
const originalPins = Object.freeze({
  '.github/workflows/main1054-m58-real-p88-worker-no-deploy.yml':'9cda77f35a8cfbede447e43d3824afa315e8c606',
  '.github/workflows/main173-unflagged-owner-24mp-no-deploy.yml':'10cb88c8915521edf2cb847d716709304182a8a4',
  '.github/workflows/main180-unmodified-webkit-firstload-no-deploy.yml':'1dc421e71cb726b5884da4df39950b9e0c234cf4',
  '.github/workflows/main181-zero-proposal-native-no-deploy.yml':'3cd39fb4fa69b859f182f746fa2993f8f09317ee',
  '.github/workflows/main183-outfit-session-epoch-no-deploy.yml':'3db5de8d585ae1d805882ba9038f1d66d8fc8bc9',
  '.github/workflows/parallel106-m183-no-deploy.yml':'4f2db5c8750088cb041a49d899d4a4a8c4ab48c5',
  'public/native-outfit-source-plan-p99.mjs':'62ebfaad2fb14a965cd7ef386c383e849f511463',
  'public/app.js':'835b4ad1f4a4a7f520aad5afd225134e5ea56e2d',
  'public/outfit-board.js':'b8ed5ebe18e81ec3f8f5659257289b8217a6877b',
  'public/outfit-capture.js':'8d55715ef09e34086d3c401ec38340bfc25f5fe8',
  'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
  'scripts/test-main58-actual-p88-wasm-browser.mjs':'96ba2f5ee2420de52f45911881fdcc139455c353',
  'scripts/test-browser-owner-mutation91.mjs':'fc1dd3c7a01786157e7410ab661b1c938c9b52ed',
  'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41',
  'tests/outfit-capture.test.cjs':'b254c78302136761e1edf336056f8b949832c0ec',
  'research/main1054/m256-negative-attempt-quarantine.mjs':'1ba5db3af45a3fdb9cb665b823fa07f3dda45929',
  'research/parallel105/closeout.mjs':'ea8732b5e0cc32388c4c4a9b7e0f39a4395858e2',
  'scripts/parallel106-source-gate.mjs':'6d36431bb0c40e949b3a1c9e0e583227677ad6bc',
});
const fail = msg => {throw Error('M271 M58 source gate: '+msg);};
const check = (ok,msg) => {if(!ok)fail(msg);};
export function verifyM271(git,event) {
  check(event?.name==='push' && event.ref===expectedBranch,'wrong event or branch');
  check(event.attempt==='1','rerun is not independent first-attempt acceptance');
  check(typeof event.sha==='string' && /^[0-9a-f]{40}$/.test(event.sha),'missing exact event SHA');
  const head=git('rev-parse','HEAD');
  check(head===event.sha,'checkout does not match first-attempt event head');
  check(git('merge-base','--is-ancestor',frozenParent,head)==='','verified M183 handoff is not an ancestor');
  check(git('merge-base','--is-ancestor',verifiedCandidate,frozenParent)==='','M256 is not in M183 lineage');
  check(git('merge-base','--is-ancestor',protectedConsumer,verifiedCandidate)==='','protected consumer is not in M256 lineage');
  const changed=git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',frozenParent,head);
  check(changed===addedPaths.map(path=>'A\0'+path+'\0').join(''),'unreviewed change, rename, deletion, or missing additive file');
  for(const path of addedPaths) {
    check(git('ls-tree',head,'--',path).startsWith('100644 blob '),'non-regular migration file: '+path);
  }
  for(const [path,sha] of Object.entries(originalPins)) {
    check(git('rev-parse',head+':'+path)===sha,'reviewed original/source/workflow blob mismatch: '+path);
  }
  check(git('rev-parse',head+':public/native-outfit-source-plan-p99.mjs')!=='58a2a1a81ad19e2341cebcdee83005296cd1d3a8','old M58 owner pin cannot be silently restored');
  return {scope:'PASS',realBrowsers:'NOT_RUN',nativeWebKitRepair:'UNRESOLVED',release:'HOLD'};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],{encoding:'utf8'}).replace(/\n$/,'');
  git('diff','--quiet','HEAD','--');
  verifyM271(git,{
    name:process.env.GITHUB_EVENT_NAME,
    ref:process.env.GITHUB_REF,
    sha:process.env.GITHUB_SHA,
    attempt:process.env.GITHUB_RUN_ATTEMPT,
  });
  console.log('PASS: source-only M58 successor gate; browser/model/release verdicts are separate.');
}
