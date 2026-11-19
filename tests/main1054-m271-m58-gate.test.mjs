import test from 'node:test';
import assert from 'node:assert/strict';
import {addedPaths,expectedBranch,frozenParent,protectedConsumer,verifiedCandidate,verifyM271} from '../scripts/main1054-m271-m58-gate.mjs';

const head='1'.repeat(40);
const event={name:'push',ref:expectedBranch,attempt:'1',sha:head};
const sources=Object.freeze({
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
function fixture(command,...args){
 if(command==='rev-parse')return args[0]==='HEAD'?head:(sources[args[0]?.slice(head.length+1)]||'0'.repeat(40));
 if(command==='merge-base'){
  assert.equal(args[0],'--is-ancestor');
  assert.ok([frozenParent,verifiedCandidate,protectedConsumer].includes(args[1]));
  return '';
 }
 if(command==='diff-tree')return addedPaths.map(path=>'A\0'+path+'\0').join('');
 if(command==='ls-tree')return '100644 blob deadbeef';
 throw Error('Unexpected fixture Git command: '+command);
}
const run=(git=fixture,ev=event)=>verifyM271(git,ev);
test('exact frozen candidate PASS means source-only; browser remains NOT_RUN',()=>assert.deepEqual(run(),{
 scope:'PASS',realBrowsers:'NOT_RUN',nativeWebKitRepair:'UNRESOLVED',release:'HOLD'
}));
for(const [name,change,error] of [
 ['wrong branch',{ref:'refs/heads/main'},/event or branch/],
 ['wrong event',{name:'pull_request_target'},/event or branch/],
 ['re-run',{attempt:'2'},/rerun/],
 ['missing SHA',{sha:null},/exact event SHA/],
 ['foreign HEAD',{sha:'f'.repeat(40)},/event head/],
])test(name,()=>assert.throws(()=>run(fixture,{...event,...change}),error));
for(const [name,match,edit,error] of [
 ['unreviewed application edit',(a)=>a[0]==='diff-tree',v=>v+'M\0public/app.js\0',/unreviewed/],
 ['altered owner-lease guard',(a)=>a[0]==='diff-tree',v=>v+'M\0public/native-outfit-source-plan-p99.mjs\0',/unreviewed/],
 ['changed protected M58 workflow',(a)=>a[0]==='rev-parse'&&a[1]===head+':.github/workflows/main1054-m58-real-p88-worker-no-deploy.yml',()=> 'f'.repeat(40),/blob mismatch/],
 ['changed M183 successor workflow',(a)=>a[0]==='rev-parse'&&a[1]===head+':.github/workflows/parallel106-m183-no-deploy.yml',()=> 'f'.repeat(40),/blob mismatch/],
 ['modified actual model Worker',(a)=>a[0]==='rev-parse'&&a[1]===head+':public/outfit-worker-p94.mjs',()=> 'f'.repeat(40),/blob mismatch/],
 ['modified original native runner',(a)=>a[0]==='rev-parse'&&a[1]===head+':scripts/test-parallel94-native-p88-browser.mjs',()=> 'f'.repeat(40),/blob mismatch/],
 ['modified source-owner app',(a)=>a[0]==='rev-parse'&&a[1]===head+':public/app.js',()=> 'f'.repeat(40),/blob mismatch/],
 ['stale owner source restored',(a)=>a[0]==='rev-parse'&&a[1]===head+':public/native-outfit-source-plan-p99.mjs',()=> '58a2a1a81ad19e2341cebcdee83005296cd1d3a8',/blob mismatch/],
 ['broken ancestry',(a)=>a[0]==='merge-base',()=>{throw Error('not ancestor');},/not ancestor/],
 ['symlinked verifier',(a)=>a[0]==='ls-tree',()=> '120000 blob',/non-regular/],
 ['missing workflow',(a)=>a[0]==='diff-tree',()=>'',/unreviewed/],
])test(name,()=>assert.throws(()=>run((...args)=>{
 const actual=fixture(...args);
 return match(args)?edit(actual):actual;
}),error));
