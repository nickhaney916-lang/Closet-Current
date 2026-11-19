import assert from 'node:assert/strict';
import test from 'node:test';
import {verifyM274,target,added,pinned,held,parentM256,parentM183,parentM271,parentM272,parentM273} from '../scripts/main1054-m274-m181-source-gate.mjs';
const head='1'.repeat(40);
const event={name:'push',ref:target,sha:head,attempt:'1'};
const expectedDiff=added.map(path=>'A\0'+path+'\0').join('');
const lineage=new Set([held,parentM256,parentM183,parentM271,parentM272,parentM273]);
function git(cmd,...args){
 if(cmd==='rev-parse'){
  const id=args[0];
  if(id==='HEAD')return head;
  if(id.startsWith(head+':'))return pinned[id.slice(head.length+1)]??'2'.repeat(40);
  throw Error('unexpected Git rev-parse: '+id);
 }
 if(cmd==='merge-base'){
  assert.equal(args[0],'--is-ancestor');assert.ok(lineage.has(args[1]));
  return '';
 }
 if(cmd==='diff-tree')return expectedDiff;
 if(cmd==='ls-tree')return '100644 blob '+ '2'.repeat(40);
 throw Error('unexpected git command '+cmd);
}
const run=(g=git,e=event)=>verifyM274(g,e);
test('valid source pins do not masquerade as browser or WebKit root-cause proof',()=>{
 assert.deepEqual(run(),{
  source:'PASS',zeroProposalBrowser:'NOT_EVALUATED_BY_SOURCE_GATE',
  originalWorkerPreserved:true,permanentWebKitJsepFix:'NOT_PROVEN',familyAlpha:'HOLD'
 });
});
for(const [name,m,regex] of [
 ['wrong ref',{ref:'refs/heads/main'},/untrusted event/],
 ['pull request event',{name:'pull_request'},/untrusted event/],
 ['privileged PR target event',{name:'pull_request_target'},/untrusted event/],
 ['rerun to green',{attempt:'2'},/first-attempt/],
 ['unknown attempt',{attempt:undefined},/first-attempt/],
 ['malformed SHA',{sha:'a'.repeat(39)},/invalid event SHA/],
 ['foreign checkout SHA',{sha:'f'.repeat(40)},/HEAD mismatch/]
])test(name,()=>assert.throws(()=>run(git,{...event,...m}),regex));
const override=(condition,make)=>(...args)=>condition(...args)?make(git(...args)):git(...args);
for(const [title,condition,make,regex] of [
 ['break approved lineage',(cmd)=>cmd==='merge-base',()=> 'bad',/ancestry/],
 ['reject unexpected modified production Worker',(cmd)=>cmd==='diff-tree',v=>v+'M\0public/outfit-worker-p94.mjs\0',/source scope/],
 ['reject modified owner auth',(cmd)=>cmd==='diff-tree',v=>v+'M\0public/auth.js\0',/source scope/],
 ['reject original test weakening',(cmd)=>cmd==='diff-tree',v=>v+'M\0scripts/test-main181-zero-proposal-native-browser.mjs\0',/source scope/],
 ['reject altered zero-proposal fallback',(cmd)=>cmd==='diff-tree',v=>v+'M\0public/outfit-capture.js\0',/source scope/],
 ['reject synthetic model success code',(cmd)=>cmd==='diff-tree',v=>v+'A\0public/model-mock.mjs\0',/source scope/],
 ['reject missing new CI gate',(cmd)=>cmd==='diff-tree',()=> '',/source scope/],
 ['reject symlinked CI verifier',(cmd)=>cmd==='ls-tree',()=> '120000 blob bad',/file mode/],
 ['reject original no-proposal gate changed',(cmd,id)=>cmd==='rev-parse'&&id===head+':.github/workflows/main181-zero-proposal-native-no-deploy.yml',()=> '0'.repeat(40),/protected source drift/],
 ['reject changed native no-proposal runner',(cmd,id)=>cmd==='rev-parse'&&id===head+':scripts/test-main181-zero-proposal-native-browser.mjs',()=> '0'.repeat(40),/protected source drift/],
 ['reject changed real Worker',(cmd,id)=>cmd==='rev-parse'&&id===head+':public/outfit-worker-p94.mjs',()=> '0'.repeat(40),/protected source drift/],
 ['reject changed strengthened source lease',(cmd,id)=>cmd==='rev-parse'&&id===head+':public/native-outfit-source-plan-p99.mjs',()=> '0'.repeat(40),/protected source drift/]
])test(title,()=>assert.throws(()=>run(override(condition,make)),regex));
for(const path of Object.keys(pinned)){
 test('immutable source pin '+path,()=>assert.throws(()=>run(override((cmd,id)=>cmd==='rev-parse'&&id===head+':'+path,()=> 'f'.repeat(40))),/protected source drift/));
}
