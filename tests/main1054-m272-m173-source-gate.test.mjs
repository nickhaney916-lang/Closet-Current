import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyM272,sourcePins,addedPaths,acceptedRef,frozenM271,frozenM183,frozenM256,originalConsumer} from '../scripts/main1054-m272-m173-source-gate.mjs';

const head='1'.repeat(40);
const event={name:'push',ref:acceptedRef,sha:head,attempt:'1'};
const files=addedPaths.map(path=>'A\0'+path+'\0').join('');
const parents=new Set([originalConsumer,frozenM256,frozenM183,frozenM271]);
function fakeGit(command,...args){
 switch(command){
  case 'rev-parse': {
   const target=args.at(-1);
   if(target==='HEAD')return head;
   if(target?.startsWith(head+':'))return sourcePins[target.slice(head.length+1)]??'2'.repeat(40);
   throw Error('Unexpected git object lookup '+target);
  }
  case 'merge-base': {
   assert.equal(args[0],'--is-ancestor');
   assert.ok(parents.has(args[1]));
   return '';
  }
  case 'diff-tree': return files;
  case 'ls-tree': return '100644 blob '+ '2'.repeat(40);
  default: throw Error('Unexpected Git command '+command);
 }
}
const accepted={candidateSource:'PASS',legacyM173:'UNCHANGED',browserResult:'NOT_VERIFIED_BY_SOURCE_GATE',release:'HOLD'};
test('verified exact source is not a browser or release claim',()=>assert.deepEqual(verifyM272(fakeGit,event),accepted));
for(const [title,mutation,pattern] of [
 ['no untrusted PR target',{name:'pull_request_target'},/event or branch/],
 ['wrong branch',{ref:'refs/heads/main'},/event or branch/],
 ['missing SHA',{sha:undefined},/event head/],
 ['foreign SHA',{sha:'f'.repeat(40)},/checked-out source/],
 ['rerun',{attempt:'2'},/rerun/],
 ['cancelled run cannot pass as first attempt',{attempt:'3'},/rerun/],
])test(title,()=>assert.throws(()=>verifyM272(fakeGit,{...event,...mutation}),pattern));
function mutated(predicate,transform){
 return (...args)=>{
  const v=fakeGit(...args);
  return predicate(args)?transform(v):v;
 };
}
for(const [title,predicate,transform,pattern] of [
 ['reject new application edit',(a)=>a[0]==='diff-tree',v=>v+'M\0public/app.js\0',/unreviewed/],
 ['reject modified reviewed owner session',(a)=>a[0]==='diff-tree',v=>v+'M\0public/native-outfit-source-plan-p99.mjs\0',/unreviewed/],
 ['reject changed ONNX worker',(a)=>a[0]==='diff-tree',v=>v+'M\0public/outfit-worker-p94.mjs\0',/unreviewed/],
 ['reject removed EXIF test',(a)=>a[0]==='diff-tree',v=>v+'D\0tests/parallel96-highres-source-derivative.test.mjs\0',/unreviewed/],
 ['reject missing workflow',(a)=>a[0]==='diff-tree',()=>'',/unreviewed/],
 ['reject symlink source verifier',(a)=>a[0]==='ls-tree',()=> '120000 blob dead',/non-regular/],
 ['reject old legacy M173 modifications',(a)=>a[0]==='rev-parse'&&a[1]===head+':.github/workflows/main173-unflagged-owner-24mp-no-deploy.yml',()=> '0'.repeat(40),/pin drift/],
 ['reject M271 changed gate',(a)=>a[0]==='rev-parse'&&a[1]===head+':.github/workflows/main1054-m271-m58-successor-no-deploy.yml',()=> '0'.repeat(40),/pin drift/],
 ['reject original P99 test bypass',(a)=>a[0]==='rev-parse'&&a[1]===head+':scripts/test-parallel99-normal-app-browser.mjs',()=> '0'.repeat(40),/pin drift/],
 ['reject original highres test bypass',(a)=>a[0]==='rev-parse'&&a[1]===head+':scripts/test-parallel96-native-highres-browser.mjs',()=> '0'.repeat(40),/pin drift/],
 ['reject real original photo substitution',(a)=>a[0]==='rev-parse'&&a[1]===head+':benchmark/fixtures/commons-artist-cowrie-original-4000x6000-cc-by-sa-4.0.jpg',()=> '0'.repeat(40),/pin drift/],
 ['reject signed-owner assertCurrent deletion',(a)=>a[0]==='rev-parse'&&a[1]===head+':public/native-outfit-source-plan-p99.mjs',()=> '58a2a1a81ad19e2341cebcdee83005296cd1d3a8',/pin drift/],
 ['reject M58 model Worker changes',(a)=>a[0]==='rev-parse'&&a[1]===head+':public/outfit-worker-p94.mjs',()=> '0'.repeat(40),/pin drift/],
 ['reject original 3D veto changes',(a)=>a[0]==='rev-parse'&&a[1]===head+':public/native-photo-3d-veto-p99.mjs',()=> '0'.repeat(40),/pin drift/],
 ['reject original 24MP source changes',(a)=>a[0]==='rev-parse'&&a[1]===head+':research/parallel96-highres/source-derivative-intake96.mjs',()=> '0'.repeat(40),/pin drift/],
 ['reject changed cross-owner save',(a)=>a[0]==='rev-parse'&&a[1]===head+':public/app.js',()=> '0'.repeat(40),/pin drift/],
 ['reject broken lineage',(a)=>a[0]==='merge-base',()=> 'not an ancestor',/ancestry/],
])test(title,()=>assert.throws(()=>verifyM272(mutated(predicate,transform),event),pattern));
for(const [path,pin] of Object.entries(sourcePins)){
 test('source pin blocks unauthorized drift in '+path,()=>{
  assert.equal(typeof pin,'string');assert.match(pin,/^[0-9a-f]{40}$/);
  assert.throws(()=>verifyM272(mutated(a=>a[0]==='rev-parse'&&a[1]===head+':'+path,()=> 'f'.repeat(40)),event),/pin drift/);
 });
}
