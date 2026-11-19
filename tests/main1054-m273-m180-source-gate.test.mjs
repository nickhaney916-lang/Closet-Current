import assert from 'node:assert/strict';
import test from 'node:test';
import {verifyM273,ref,onlyAdditions,pinned,donorP88,donorAssets,heldConsumer,parentM256,parentM183,parentM271,parentM272} from '../scripts/main1054-m273-m180-source-gate.mjs';

const head='1'.repeat(40);
const event={name:'push',ref,sha:head,attempt:'1'};
const expectedDiff=onlyAdditions.map(path=>'A\0'+path+'\0').join('');
const accepted={source:'PASS',firstLoad:'UNTESTED_BY_GATE',webKitNativeRootCause:'UNRESOLVED',familyAlpha:'HOLD'};
const lineage=new Set([heldConsumer,parentM256,parentM183,parentM271,parentM272]);
function fixture(command,...args){
 if(command==='rev-parse'){
  const id=args[0];
  if(id==='HEAD')return head;
  if(id.startsWith(head+':'))return pinned[id.slice(head.length+1)]||'2'.repeat(40);
  if(id.startsWith(donorP88+':'))return donorAssets[id.slice(donorP88.length+1)]||'2'.repeat(40);
  throw Error('unknown git read');
 }
 if(command==='merge-base'){
  assert.equal(args[0],'--is-ancestor');
  assert.ok(lineage.has(args[1]));
  return '';
 }
 if(command==='diff-tree')return expectedDiff;
 if(command==='ls-tree')return '100644 blob '+ '2'.repeat(40);
 throw Error('unexpected git command '+command);
}
const run=(git=fixture,ev=event)=>verifyM273(git,ev);
test('pins original source but does NOT claim real WebKit or release success',()=>assert.deepEqual(run(),accepted));
for(const [name,change,match] of [
 ['wrong ref',{ref:'refs/heads/main'},/event\/branch/],
 ['wrong event',{name:'pull_request_target'},/event\/branch/],
 ['rerun',{attempt:'2'},/retry/],
 ['no attempt',{attempt:undefined},/retry/],
 ['no SHA',{sha:undefined},/exact source SHA/],
 ['forged event head',{sha:'f'.repeat(40)},/SHA mismatch/]
])test(name,()=>assert.throws(()=>run(fixture,{...event,...change}),match));
function mutate(pred,change){return (...args)=>{const result=fixture(...args);return pred(...args)?change(result):result;};}
for(const [name,pred,change,error] of [
 ['different protected ancestor',(cmd)=>cmd==='merge-base',()=> 'no',/ancestry/],
 ['surprise app mutation',(cmd)=>cmd==='diff-tree',v=>v+'M\0public/app.js\0',/unreviewed/],
 ['original Worker changed',(cmd)=>cmd==='diff-tree',v=>v+'M\0public/outfit-worker-p94.mjs\0',/unreviewed/],
 ['M180 old workflow changed',(cmd)=>cmd==='diff-tree',v=>v+'M\0.github/workflows/main180-unmodified-webkit-firstload-no-deploy.yml\0',/unreviewed/],
 ['unexpected superfluous output',(cmd)=>cmd==='diff-tree',v=>v+'A\0public/fake-model.mjs\0',/unreviewed/],
 ['M181 guard removed',(cmd)=>cmd==='diff-tree',v=>v+'D\0tests/outfit-capture.test.cjs\0',/unreviewed/],
 ['missing new workflow',(cmd)=>cmd==='diff-tree',()=>'',/unreviewed/],
 ['symlinked test file',(cmd)=>cmd==='ls-tree',()=> '120000 blob x',/file type/],
 ['altered donor P88 original',(cmd,arg)=>cmd==='rev-parse'&&arg===donorP88+':public/outfit-worker.mjs',()=> 'f'.repeat(40),/donor/],
 ['altered donor segmentation',(cmd,arg)=>cmd==='rev-parse'&&arg===donorP88+':public/outfit-segmentation.mjs',()=> 'f'.repeat(40),/donor/]
])test(name,()=>assert.throws(()=>run(mutate(pred,change)),error));
for(const path of Object.keys(pinned)){
 test('reject immutable inherited blob drift: '+path,()=>{
  const on=(cmd,arg)=>cmd==='rev-parse'&&arg===head+':'+path;
  assert.throws(()=>run(mutate(on,()=> 'f'.repeat(40))),/inherited source changed/);
 });
}
test('hold remains, no permission to turn native warm pass into permanent repair',()=>{
 assert.equal(run().familyAlpha,'HOLD');
 assert.equal(run().webKitNativeRootCause,'UNRESOLVED');
 assert.equal(run().firstLoad,'UNTESTED_BY_GATE');
});
