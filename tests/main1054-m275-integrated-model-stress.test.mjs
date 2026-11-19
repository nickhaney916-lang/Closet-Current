import test from 'node:test';
import assert from 'node:assert/strict';
import {checkSource,classifyOriginal,summarize,immutable,changedFiles,
 ref,fixedParent,prior,sourceSHA} from '../scripts/main1054-m275-integrated-model-stress.mjs';

// Synthetic UNIT-PARSER fixtures. NOT model outcomes. This test suite never
// asserts that native original recognition or a WebKit reliability repair passed.
const head='1'.repeat(40);
const event={name:'push',ref,sha:head,attempt:'1'};
const diff=changedFiles.map(x=>'A\0'+x+'\0').join('');
const lineage=new Set(prior);
function git(command,...args){
 if(command==='rev-parse'){
  if(args[0]==='HEAD')return head;
  if(args[0].startsWith(head+':'))return immutable[args[0].slice(41)]||'2'.repeat(40);
  throw Error('unseen git SHA lookup');
 }
 if(command==='merge-base'){
  assert.equal(args[0],'--is-ancestor');assert.ok(lineage.has(args[1]));return '';
 }
 if(command==='diff-tree')return diff;
 if(command==='ls-tree')return '100644 blob '+ '2'.repeat(40);
 throw Error('unexpected Git command '+command);
}
const mutate=(predicate,replace)=>(...args)=>predicate(...args)?replace(git(...args)):git(...args);
test('original source gate never masquerades as native repair',()=>assert.deepEqual(checkSource(git,event),{
 source:'PASS',realNativeStress:'NOT_RUN_BY_SOURCE_GATE',nativeFix:'NOT_PROVEN',familyAlpha:'HOLD'
}));
for(const [name,mod,err] of [
 ['reject privileged pull_request_target',{name:'pull_request_target'},/event\/branch/],
 ['reject unrelated source branch',{ref:'refs/heads/main'},/event\/branch/],
 ['reject partial SHA',{sha:'x'},/event source head/],
 ['reject foreign HEAD',{sha:'f'.repeat(40)},/checkout\/source/],
 ['reject rerun to green',{attempt:'2'},/rerun/]
])test(name,()=>assert.throws(()=>checkSource(git,{...event,...mod}),err));
for(const [name,when,replace,err] of [
 ['reject changed 3D product',(cmd)=>cmd==='diff-tree',x=>x+'M\0public/outfit-board.js\0',/modified\/omitted/],
 ['reject changed original model',(cmd)=>cmd==='diff-tree',x=>x+'M\0public/outfit-worker-p94.mjs\0',/modified\/omitted/],
 ['reject changed owner accounts',(cmd)=>cmd==='diff-tree',x=>x+'M\0public/auth.js\0',/modified\/omitted/],
 ['reject changed fail-closed M181 source',(cmd)=>cmd==='diff-tree',x=>x+'M\0public/outfit-capture.js\0',/modified\/omitted/],
 ['reject rewritten original source photo',(cmd)=>cmd==='diff-tree',x=>x+'M\0benchmark/fixtures/commons-0003.jpg\0',/modified\/omitted/],
 ['reject missing gate',(cmd)=>cmd==='diff-tree',()=>'',/modified\/omitted/],
 ['reject unreviewed symlink',(cmd)=>cmd==='ls-tree',()=> '120000 blob pointer',/regular/],
 ['reject broken protected lineage',(cmd)=>cmd==='merge-base',()=> 'not ancestor',/ancestry/]
])test(name,()=>assert.throws(()=>checkSource(mutate(when,replace),event),err));
for(const key of Object.keys(immutable)){
 test('original blob pin catches drift in '+key,()=>assert.throws(()=>checkSource(mutate(
  (cmd,arg)=>cmd==='rev-parse'&&arg===head+':'+key,()=> 'f'.repeat(40)
 ),event),/source pin drift/));
}
const meta={engine:'webkit',width:390,ordinal:1,count:8,runAttempt:1,head,runId:'12345678901'};
function originalMarkers(changes={}){
 const model={engine:'webkit',sourceSHA256:sourceSHA,realWorker:true,groups:2,modelRequests:9,saved:0,hold:true,...changes.model};
 const owner={engine:'webkit',modelExecuted:true,manualSyntheticOwnerConfirmed:true,
  ownerPrivateSaved:1,exactOriginalSHA256:sourceSHA,realNativeOutfit:true,
  savedOutfitOwnerAction:true,restoredSavedOutfitCount:1,
  actualV4BrowserDownload:true,tamperDenied:true,otherOwnerDenied:true,
  cancelledRestoreUnchanged:true,atomicRestore:true,
  restoredOriginalPhotoGallery:true,threeDAuthorized:false,
  hostedRLS:false,physicalPhone:false,familyAlpha:'HOLD',releaseAuthorized:false,...changes.owner};
 const life={engine:'webkit',uninterruptedSourceExportRestore:true,
  originalPhotoByteTamperRefused:true,ownerRecovery:true,familyAlpha:'HOLD',
  releaseAuthorized:false,...changes.life};
 return [
  'M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW '+JSON.stringify(model),
  'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS '+JSON.stringify(owner),
  'P91_FULL_JOURNEY_PASS '+JSON.stringify(life)
 ].join('\n');
}
const clean={status:0,signal:null,timedOut:false};
test('valid synthetic UNIT marker parser is a bounded receipt, not a real model pass',()=>{
 const r=classifyOriginal(originalMarkers(),clean,meta);
 assert.equal(r.result,'PASS');assert.equal(r.permanentWebKitFixProven,false);
 assert.equal(r.zeroProposalMockForbidden,true);
 assert.equal(r.originalSourceSHA,sourceSHA);
 assert.equal(r.familyAlpha,'HOLD');
});
const invalid=[
 ['true model no-proposal mocked zero cannot pass','',clean,'MISSING_OR_INVALID_REAL_MODEL'],
 ['original native model RED remains RED','M58_REAL_P88_WORKER_FAIL {"stage":"model-session-load"}', {status:1,signal:null,timedOut:false},'ORIGINAL_WORKER_FAILURE'],
 ['WebKit timeout preserved',originalMarkers(),{status:null,signal:'SIGTERM',timedOut:true},'TIMEOUT'],
 ['nonzero exit even with forged positive',originalMarkers(),{status:1,signal:null,timedOut:false},'NONZERO_EXIT'],
 ['worker says silent save',originalMarkers({model:{saved:1}}),clean,'MISSING_OR_INVALID_REAL_MODEL'],
 ['wrong photo SHA',originalMarkers({model:{sourceSHA256:'f'.repeat(64)}}),clean,'MISSING_OR_INVALID_REAL_MODEL'],
 ['wrong owner SHA',originalMarkers({owner:{exactOriginalSHA256:'f'.repeat(64)}}),clean,'MISSING_OR_INVALID_OWNER'],
 ['denied 3D check disabled',originalMarkers({owner:{threeDAuthorized:true}}),clean,'MISSING_OR_INVALID_OWNER'],
 ['foreign owner allowed',originalMarkers({owner:{otherOwnerDenied:false}}),clean,'MISSING_OR_INVALID_OWNER'],
 ['model did not execute',originalMarkers({owner:{modelExecuted:false}}),clean,'MISSING_OR_INVALID_OWNER'],
 ['owner restored without byte validation',originalMarkers({life:{originalPhotoByteTamperRefused:false}}),clean,'MISSING_OR_INVALID_LIFECYCLE'],
 ['release authorization forged',originalMarkers({owner:{releaseAuthorized:true}}),clean,'MISSING_OR_INVALID_OWNER'],
 ['duplicate model event',originalMarkers()+'\n'+originalMarkers().split('\n')[0],clean,'MISSING_OR_INVALID_REAL_MODEL']
];
for(const [name,log,exit,reason] of invalid)test(name,()=>{
 const r=classifyOriginal(log,exit,meta);assert.equal(r.result,'FAIL');assert.equal(r.reason,reason);
 assert.equal(r.permanentWebKitFixProven,false);
});
test('preserve allowed native error STAGE only and never raw stack/error',()=>{
 const log='M58_REAL_P88_WORKER_FAIL '+JSON.stringify({stage:'model-session-load',error:'private data; should never serialize'});
 const result=classifyOriginal(log,{status:1,signal:null,timedOut:false},meta);
 assert.equal(result.nativeStage,'model-session-load');
 assert.ok(!JSON.stringify(result).includes('private data'));
});
test('aggregate preserves every original failure and fails entire cohort',()=>{
 const rows=Array.from({length:8},(_,i)=>classifyOriginal(originalMarkers(),clean,{...meta,ordinal:i+1}));
 rows[4]=classifyOriginal('M58_REAL_P88_WORKER_FAIL {"stage":"model-session-load"}',
  {status:1,signal:null,timedOut:false},{...meta,ordinal:5});
 const total=summarize(rows,{engine:'webkit',width:390,head,runId:meta.runId,count:8});
 assert.equal(total.realOriginalPositive,7);
 assert.equal(total.genuineRed,1);
 assert.equal(total.verdict,'FAIL');
 assert.equal(total.nativeFixProven,false);
 assert.throws(()=>summarize(rows.filter(x=>x.result==='PASS'),
  {engine:'webkit',width:390,head,runId:meta.runId,count:8}),/missing processes/);
});
test('duplicate or changed protected process receipt cannot yield success',()=>{
 const rows=Array.from({length:8},(_,i)=>classifyOriginal(originalMarkers(),clean,{...meta,ordinal:i+1}));
 rows[2]={...rows[1]};assert.throws(()=>summarize(rows,{engine:'webkit',width:390,head,runId:meta.runId,count:8}),/duplicate/);
 rows[2]={...rows[2],ordinal:3,familyAlpha:'READY'};assert.throws(()=>summarize(rows,{engine:'webkit',width:390,head,runId:meta.runId,count:8}),/spoofed/);
});
test('untrusted browser width, process count, rerun rejected',()=>{
 assert.throws(()=>classifyOriginal('',clean,{...meta,width:450}),/viewport/);
 assert.throws(()=>classifyOriginal('',clean,{...meta,count:0}),/ordinal|cohort/);
 assert.throws(()=>classifyOriginal('',clean,{...meta,runAttempt:2}),/first attempt/);
});
