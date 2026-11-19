/**
 * M274: candidate-scoped successor to original M181 zero-proposal recovery gate.
 * No auth, saved items, original photo, model or app source may be changed.
 * Source success is never browser acceptance or a native WebKit repair.
 */
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const parentM273='408859405223bff95265aa1d053ae11a04a3653f';
export const parentM272='6eea610666a2d145037db54cc1e82bb106129735';
export const parentM271='03361ef1c3fd5489dfd74c0a29deb9716b2da96d';
export const parentM183='da9b8c81d8d7368f882489b439431e1d4a6871b4';
export const parentM256='a16f55d2230afab907957ddffa8c5af968b39f20';
export const held='f2befed4c776786dc11843b98fafec72f2d9c202';
export const target='refs/heads/research/main1054-m274-m181-zero-proposal-HOLD';
export const added=[
 '.github/workflows/main1054-m274-m181-zero-proposal-no-deploy.yml',
 'scripts/main1054-m274-m181-source-gate.mjs',
 'tests/main1054-m274-m181-source-gate.test.mjs',
];
export const pinned=Object.freeze({
 // Previous exact-head accepted successor workflows, original frozen M181,
 // and the model, owner, original-photo, review and explicit-denial paths.
 '.github/workflows/main1054-m273-m180-firstload-no-deploy.yml':'53dfb2a6ca0d94f76f0cbdae2b3bed85768002f9',
 'scripts/main1054-m273-m180-source-gate.mjs':'d62d59e5ad1c4eff6e2af017c39833d1968d75f3',
 'tests/main1054-m273-m180-source-gate.test.mjs':'9432ef0436252b22b9e9a35c27a3423204fa01ca',
 '.github/workflows/main1054-m272-m173-unflagged-24mp-no-deploy.yml':'79e81aa69bf303070b355dcc92b0d893716e3dfc',
 '.github/workflows/main1054-m271-m58-successor-no-deploy.yml':'1633a2aca790d27355edbbcc7793f8f0861f0d07',
 '.github/workflows/main181-zero-proposal-native-no-deploy.yml':'3cd39fb4fa69b859f182f746fa2993f8f09317ee',
 '.github/workflows/main180-unmodified-webkit-firstload-no-deploy.yml':'1dc421e71cb726b5884da4df39950b9e0c234cf4',
 '.github/workflows/main173-unflagged-owner-24mp-no-deploy.yml':'10cb88c8915521edf2cb847d716709304182a8a4',
 '.github/workflows/main1054-m58-real-p88-worker-no-deploy.yml':'9cda77f35a8cfbede447e43d3824afa315e8c606',
 '.github/workflows/main183-outfit-session-epoch-no-deploy.yml':'3db5de8d585ae1d805882ba9038f1d66d8fc8bc9',
 'public/outfit-capture.js':'8d55715ef09e34086d3c401ec38340bfc25f5fe8',
 'tests/outfit-capture.test.cjs':'b254c78302136761e1edf336056f8b949832c0ec',
 'scripts/test-main181-zero-proposal-native-browser.mjs':'ea1a5bdb7f0617c71695f9b0382afd6ff7d5f089',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'public/outfit-board.js':'b8ed5ebe18e81ec3f8f5659257289b8217a6877b',
 'public/auth.js':'3b9a9d6d7f39b489015cfd9160afe14b6d6f8df0',
 'public/native-outfit-source-plan-p99.mjs':'62ebfaad2fb14a965cd7ef386c383e849f511463',
 'public/native-2d-preview-p99.mjs':'52d2b6d8834f27d9114e022fe8574947eda85206',
 'public/native-photo-3d-veto-p99.mjs':'82b93d12d2fbcba146a190f5dce87a6ac5fc44af',
});
const ensure=(value,why)=>{if(!value)throw new Error('M274 fail-closed '+why);};
export function verifyM274(git,event){
 ensure(event?.name==='push'&&event?.ref===target,'untrusted event or ref');
 ensure(event?.attempt==='1','not a first-attempt run');
 ensure(typeof event.sha==='string'&&/^[0-9a-f]{40}$/.test(event.sha),'invalid event SHA');
 const head=git('rev-parse','HEAD');
 ensure(head===event.sha,'checked-out HEAD mismatch');
 for(const [base,desc] of [[held,parentM256],[parentM256,parentM183],
 [parentM183,parentM271],[parentM271,parentM272],[parentM272,parentM273],[parentM273,head]]){
  ensure(git('merge-base','--is-ancestor',base,desc)==='','unapproved parent ancestry');
 }
 const diff=git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parentM273,head);
 ensure(diff===added.map(path=>'A\0'+path+'\0').join(''),'unexpected source scope or missing file');
 for(const path of added){
  ensure(git('ls-tree',head,'--',path).startsWith('100644 blob '),'invalid new source file mode');
 }
 for(const [path,hash] of Object.entries(pinned)){
  ensure(git('rev-parse',head+':'+path)===hash,'protected source drift: '+path);
 }
 return {source:'PASS',zeroProposalBrowser:'NOT_EVALUATED_BY_SOURCE_GATE',originalWorkerPreserved:true,permanentWebKitJsepFix:'NOT_PROVEN',familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],{encoding:'utf8'}).replace(/\n$/,'');
 console.log('M274',JSON.stringify(verifyM274(git,{
  name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
  sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT
 })));
}
