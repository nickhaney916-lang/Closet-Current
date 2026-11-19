import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const frozenM271='03361ef1c3fd5489dfd74c0a29deb9716b2da96d';
export const frozenM183='da9b8c81d8d7368f882489b439431e1d4a6871b4';
export const frozenM256='a16f55d2230afab907957ddffa8c5af968b39f20';
export const originalConsumer='f2befed4c776786dc11843b98fafec72f2d9c202';
export const acceptedRef='refs/heads/research/main1054-m272-m173-unflagged-24mp-HOLD';
export const addedPaths=[
 '.github/workflows/main1054-m272-m173-unflagged-24mp-no-deploy.yml',
 'scripts/main1054-m272-m173-source-gate.mjs',
 'tests/main1054-m272-m173-source-gate.test.mjs',
];
// Immutable original M173 workflow is retained, not modified or made less strict.
// M254 is the ONE reviewed owner-session source change in the frozen lineage.
// The M271 M58 donor gate/Worker/fixture repair must remain exactly unchanged.
export const sourcePins=Object.freeze({
 '.github/workflows/main173-unflagged-owner-24mp-no-deploy.yml':'10cb88c8915521edf2cb847d716709304182a8a4',
 '.github/workflows/main1054-m58-real-p88-worker-no-deploy.yml':'9cda77f35a8cfbede447e43d3824afa315e8c606',
 '.github/workflows/main180-unmodified-webkit-firstload-no-deploy.yml':'1dc421e71cb726b5884da4df39950b9e0c234cf4',
 '.github/workflows/main181-zero-proposal-native-no-deploy.yml':'3cd39fb4fa69b859f182f746fa2993f8f09317ee',
 '.github/workflows/main183-outfit-session-epoch-no-deploy.yml':'3db5de8d585ae1d805882ba9038f1d66d8fc8bc9',
 '.github/workflows/parallel106-m183-no-deploy.yml':'4f2db5c8750088cb041a49d899d4a4a8c4ab48c5',
 '.github/workflows/main1054-m271-m58-successor-no-deploy.yml':'1633a2aca790d27355edbbcc7793f8f0861f0d07',
 'scripts/main1054-m271-m58-gate.mjs':'f99298e9a7616c04e3d5353df71ac44eed708830',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'public/outfit-board.js':'b8ed5ebe18e81ec3f8f5659257289b8217a6877b',
 'public/outfit-capture.js':'8d55715ef09e34086d3c401ec38340bfc25f5fe8',
 'public/app.js':'835b4ad1f4a4a7f520aad5afd225134e5ea56e2d',
 'public/capture-navigation.js':'31223cd114984a72edf1cb0771122f320dc80ef9',
 'public/index.html':'abd56ec794b44a447c9aac88129d6f6516180bd0',
 'public/native-2d-preview-p99.mjs':'52d2b6d8834f27d9114e022fe8574947eda85206',
 'public/native-photo-3d-veto-p99.mjs':'82b93d12d2fbcba146a190f5dce87a6ac5fc44af',
 'public/native-outfit-source-plan-p99.mjs':'62ebfaad2fb14a965cd7ef386c383e849f511463',
 'scripts/test-parallel99-normal-app-browser.mjs':'9b8c3b37d1d8116e4bf9bc6dbf7ea82e2752433d',
 'scripts/test-parallel96-native-highres-browser.mjs':'58194c1bbcfca7b46f1c71b1ee0cc00c3dbc88c7',
 'scripts/test-main172-24mp-private-state-invariance.mjs':'ad4cb6bfee719b6083b9abc6d11ade2551e77c58',
 'scripts/test-main51-real-app-owner-original-2d.mjs':'63cc9da00eaecbeb2576482dcae1528b44ea8189',
 'scripts/test-main157-same-photo-native-outfit-browser.mjs':'c65c47091156c8996a1f463bff80b1c690b9fd90',
 'scripts/test-main1054-m106-preview-terminal-browser.mjs':'016a266af467fea93a61315ad7738a2caec2da7d',
 'tests/capture-navigation.test.cjs':'5e7b16c7b44cf6c258e79fcb1a92f0b7c2dea129',
 'research/parallel96-highres/source-derivative-intake96.mjs':'1840c4496aefc28941f4c3de24a29bac1cb5e792',
 'research/parallel99-normal-journey-HOLD/NORMAL-MODE-CONTRACT.md':'56e96d56adf063754112534cc6d6817ceb054f1c',
 'benchmark/fixtures/commons-artist-cowrie-original-4000x6000-cc-by-sa-4.0.jpg':'27864552c036f9bf089be147531c4da8ccdcb7d7',
});
const check=(b,m)=>{if(!b)throw Error('M272 M173 source refusal: '+m);};
export function verifyM272(git,event){
 check(event?.name==='push'&&event.ref===acceptedRef,'unapproved event or branch');
 check(event.attempt==='1','rerun must not substitute for first-attempt evidence');
 check(typeof event.sha==='string'&&/^[0-9a-f]{40}$/.test(event.sha),'missing exact event head');
 const head=git('rev-parse','HEAD');
 check(head===event.sha,'event head is not the checked-out source');
 for(const [base,child] of [[originalConsumer,frozenM256],[frozenM256,frozenM183],[frozenM183,frozenM271],[frozenM271,head]]){
  check(git('merge-base','--is-ancestor',base,child)==='','unexpected protected ancestry');
 }
 const names=git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',frozenM271,head);
 check(names===addedPaths.map(path=>'A\0'+path+'\0').join(''),'unreviewed modified, deleted, renamed or missing source');
 for(const path of addedPaths)check(git('ls-tree',head,'--',path).startsWith('100644 blob '),'non-regular new file: '+path);
 for(const [path,sha] of Object.entries(sourcePins)){
  check(git('rev-parse',head+':'+path)===sha,'original M173/owner/Worker/EXIF pin drift: '+path);
 }
 // Prevent silently restoring the older, weaker owner lease.
 check(git('rev-parse',head+':public/native-outfit-source-plan-p99.mjs')!=='58a2a1a81ad19e2341cebcdee83005296cd1d3a8','stale session-owner source');
 return {candidateSource:'PASS',legacyM173:'UNCHANGED',browserResult:'NOT_VERIFIED_BY_SOURCE_GATE',release:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],{encoding:'utf8'}).replace(/\n$/,'');
 git('diff','--quiet','HEAD','--');
 console.log('M272 source:',JSON.stringify(verifyM272(git,{
  name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT
 })));
}
