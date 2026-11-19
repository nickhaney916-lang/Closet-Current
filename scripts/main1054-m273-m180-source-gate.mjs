import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const parentM272='6eea610666a2d145037db54cc1e82bb106129735';
export const parentM271='03361ef1c3fd5489dfd74c0a29deb9716b2da96d';
export const parentM183='da9b8c81d8d7368f882489b439431e1d4a6871b4';
export const parentM256='a16f55d2230afab907957ddffa8c5af968b39f20';
export const heldConsumer='f2befed4c776786dc11843b98fafec72f2d9c202';
export const ref='refs/heads/research/main1054-m273-m180-firstload-HOLD';
export const onlyAdditions=[
 '.github/workflows/main1054-m273-m180-firstload-no-deploy.yml',
 'scripts/main1054-m273-m180-source-gate.mjs',
 'tests/main1054-m273-m180-source-gate.test.mjs',
];
// Byte-for-byte immutable parent gate/worker/browser contracts, not source
// shortcuts. Historic M180 is intentionally kept strictly fail-closed.
export const pinned=Object.freeze({
 '.github/workflows/main180-unmodified-webkit-firstload-no-deploy.yml':'1dc421e71cb726b5884da4df39950b9e0c234cf4',
 '.github/workflows/main1054-m272-m173-unflagged-24mp-no-deploy.yml':'79e81aa69bf303070b355dcc92b0d893716e3dfc',
 'scripts/main1054-m272-m173-source-gate.mjs':'0c3fa7e42d3dd03e9a51c5708e575a782818fc14',
 'tests/main1054-m272-m173-source-gate.test.mjs':'d2a940c953d41f396a88f3e612cc7c8797ba0082',
 '.github/workflows/main1054-m271-m58-successor-no-deploy.yml':'1633a2aca790d27355edbbcc7793f8f0861f0d07',
 'scripts/main1054-m271-m58-gate.mjs':'f99298e9a7616c04e3d5353df71ac44eed708830',
 '.github/workflows/main1054-m58-real-p88-worker-no-deploy.yml':'9cda77f35a8cfbede447e43d3824afa315e8c606',
 '.github/workflows/main173-unflagged-owner-24mp-no-deploy.yml':'10cb88c8915521edf2cb847d716709304182a8a4',
 '.github/workflows/main181-zero-proposal-native-no-deploy.yml':'3cd39fb4fa69b859f182f746fa2993f8f09317ee',
 '.github/workflows/main183-outfit-session-epoch-no-deploy.yml':'3db5de8d585ae1d805882ba9038f1d66d8fc8bc9',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'public/outfit-instance-review-840.mjs':'6324d8eda33024f166311f424392ed83363e4942',
 'public/outfit-capture.js':'8d55715ef09e34086d3c401ec38340bfc25f5fe8',
 'public/native-reviewed-private-save-167.mjs':'8a4c5f1ba513792c8cacbf898d9263ce76a78963',
 'public/native-outfit-source-plan-p99.mjs':'62ebfaad2fb14a965cd7ef386c383e849f511463',
 'public/native-2d-preview-p99.mjs':'52d2b6d8834f27d9114e022fe8574947eda85206',
 'public/native-photo-3d-veto-p99.mjs':'82b93d12d2fbcba146a190f5dce87a6ac5fc44af',
 'scripts/test-main58-actual-p88-wasm-browser.mjs':'96ba2f5ee2420de52f45911881fdcc139455c353',
 'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41',
 'research/master-consolidation-1054/M180-WEBKIT-FIRSTLOAD-RELIABILITY-HOLD.md':'080c07dcb3e091d9f2a7e219b5750bf068c83252',
 'research/master-consolidation-1054/M181-ZERO-PROPOSAL-NATIVE-FAILCLOSED-HOLD.md':'b408db8aeb16750b87a18f940d40d7bf4d05497b',
 'public/app.js':'835b4ad1f4a4a7f520aad5afd225134e5ea56e2d',
});
export const donorP88='cc4554ef0104506a72bf0a28423fee52b6e4fff2';
export const donorAssets=Object.freeze({
 'public/outfit-worker.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'public/outfit-segmentation.mjs':'d357955dd8fdab7c0cb727ea597c270edd9309ac'
});
const needs=(yes,why)=>{if(!yes)throw Error('M273 fail-closed source: '+why);};
export function verifyM273(git,event){
 needs(event?.name==='push' && event.ref===ref,'unknown event/branch');
 needs(event.attempt==='1','a retry is not first-attempt proof');
 needs(typeof event.sha==='string' && /^[a-f0-9]{40}$/.test(event.sha),'missing exact source SHA');
 const head=git('rev-parse','HEAD');
 needs(head===event.sha,'event SHA mismatch');
 for(const [base,child] of [
  [heldConsumer,parentM256],
  [parentM256,parentM183],
  [parentM183,parentM271],
  [parentM271,parentM272],
  [parentM272,head]
 ]){
  needs(git('merge-base','--is-ancestor',base,child)==='','unverified integration ancestry');
 }
 const diff=git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parentM272,head);
 needs(diff===onlyAdditions.map(path=>'A\0'+path+'\0').join(''),'unexpected modified/deleted/unreviewed paths');
 for(const path of onlyAdditions)needs(git('ls-tree',head,'--',path).startsWith('100644 blob '),'unexpected file type '+path);
 for(const [path,sha] of Object.entries(pinned)){
  needs(git('rev-parse',head+':'+path)===sha,'immutable inherited source changed: '+path);
 }
 for(const [path,sha] of Object.entries(donorAssets)){
  needs(git('rev-parse',donorP88+':'+path)===sha,'untrusted original P88 donor: '+path);
 }
 return {source:'PASS',firstLoad:'UNTESTED_BY_GATE',webKitNativeRootCause:'UNRESOLVED',familyAlpha:'HOLD'};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],{encoding:'utf8'}).replace(/\n$/,'');
 git('diff','--quiet','HEAD','--');
 console.log('M273 immutable source',JSON.stringify(verifyM273(git,{
  name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT
 })));
}
