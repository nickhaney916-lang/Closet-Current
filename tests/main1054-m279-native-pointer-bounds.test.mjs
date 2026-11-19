import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {abiSnapshot,numericNativeFrame,classifyRun,sourceGate,branch,parent,added,originalPins,deriveM279} from
 '../research/main1054/m279-native-pointer-bounds.mjs';
const HEAD='a'.repeat(40), event={name:'push',ref:branch,attempt:'1',sha:HEAD};
const diff=added.map(p=>'A\0'+p+'\0').join('');
function git(...args){
 const [op,...rest]=args;
 if(op==='rev-parse')return rest[0]==='HEAD'?HEAD:originalPins[rest[0].slice(HEAD.length+1)]??'b'.repeat(40);
 if(op==='merge-base')return '';
 if(op==='diff-tree')return diff;
 if(op==='ls-tree')return '100644 blob '+'b'.repeat(40);
 throw Error('unexpected mock git op '+op);
}
const mock=(f)=>(...args)=>f(...args)??git(...args);
test('source gate protects model, JSEP, Worker, original owner and HOLD',()=>{
 assert.deepEqual(sourceGate(git,event),{
  originalWorker:'UNCHANGED',model:'ORIGINAL',wasm:'ORIGINAL',
  derivedObserverOnly:true,permanentRepair:'NOT_PROVEN',familyAlpha:'HOLD'
 });
});
test('never admit untrusted event, branch, retry, or checkout',()=>{
 for(const changed of [{ref:'refs/heads/main'},{name:'pull_request_target'},{attempt:'2'},{sha:''}]){
  assert.throws(()=>sourceGate(git,{...event,...changed}),/M279 fail-closed/);
 }
 assert.throws(()=>sourceGate(mock((x,y)=>x==='rev-parse'&&y==='HEAD'?'f'.repeat(40):null),event),/checkout/);
});
test('reject altered original Worker/trace or extra files, symlink, wrong ancestry',()=>{
 assert.throws(()=>sourceGate(mock(x=>x==='diff-tree'?diff+'M\0public/outfit-worker-p94.mjs\0':null),event),/unexpected/);
 assert.throws(()=>sourceGate(mock((x,y)=>x==='rev-parse'&&
  y===HEAD+':public/outfit-worker-p94.mjs'?'0'.repeat(40):null),event),/original protected/);
 assert.throws(()=>sourceGate(mock(x=>x==='ls-tree'?'120000 blob abc':null),event),/unsafe/);
 assert.throws(()=>sourceGate(mock(x=>x==='merge-base'?'wrong':null),event),/ancestry/);
});
test('model ptr/len range is true only within native linear-memory bounds',()=>{
 assert.deepEqual(abiSnapshot([0x2000,0x1000,30],65536,65536),{
  nativeArgumentCount:3,modelPointer:8192,modelLengthBytes:4096,
  modelEndExclusive:12288,sessionOptionsHandlePresent:true,
  linearMemoryBytes:65536,heapViewBytes:65536,modelRangeInLinearMemory:true,heapViewStale:false
 });
 assert.equal(abiSnapshot([65000,2000,30],65536,65536).modelRangeInLinearMemory,false);
 assert.equal(abiSnapshot([0,500,30],65536,65536).modelRangeInLinearMemory,false);
 assert.equal(abiSnapshot([100,0,30],65536,65536).modelRangeInLinearMemory,false);
 assert.equal(abiSnapshot([100,120,30],null,null).modelRangeInLinearMemory,null);
 assert.equal(abiSnapshot([100,120,30],65536,32768).heapViewStale,true);
 assert.equal(abiSnapshot([0xffffffff,2,30],65536,65536).modelRangeInLinearMemory,false);
 assert.equal(abiSnapshot([-1,2,30],65536,65536).modelPointer,4294967295);
});
test('report numeric wasm function+offset only; no raw stack or message',()=>{
 assert.deepEqual(numericNativeFrame('RuntimeError\n at wasm-function[978]:0x1a2b3'),{
  functionIndex:978,wasmOffset:107187
 });
 assert.deepEqual(numericNativeFrame('wasm-function[123]@[wasm code]'),{
  functionIndex:123,wasmOffset:null
 });
 assert.deepEqual(numericNativeFrame('sensitive text without wasm frame'),{
  functionIndex:null,wasmOffset:null
 });
 assert.equal(JSON.stringify(numericNativeFrame('private text')).includes('private'),false);
});
test('real pinned original-browser derive yields instrumented disposable runner',()=>{
 const s=deriveM279(readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8'),
  readFileSync('public/outfit-worker-p94.mjs','utf8'));
 assert.ok(s.includes('m279-native-pointer-bounds.mjs'));
 assert.ok(s.includes('M279_NATIVE_ABI '));
 assert.ok(s.includes('context.on('));
 assert.ok(s.includes('P91_FULL_JOURNEY_PASS'));
});
const receipt=(phase,entry,exit,frame={functionIndex:null,wasmOffset:null})=>
 'M279_NATIVE_ABI '+JSON.stringify({phase,entry,exit,frame})+'\n';
const trace=(phase)=>'CC_NATIVE_ORT_TRACE '+JSON.stringify({
 asset:'ort-wasm-simd-threaded.jsep.mjs',id:6,operation:'OrtCreateSession',
 phase,value:phase==='throw'?[]:phase==='enter'?null:1
})+'\n';
const run='CC_NATIVE_ORT_TRACE '+JSON.stringify({
 asset:'ort-wasm-simd-threaded.jsep.mjs',id:12,operation:'OrtRun',phase:'return',value:0
})+'\n';
const meta={engine:'webkit',width:390,ordinal:1};
const entry=abiSnapshot([8192,4096,7],369*65536,369*65536);
const exit=abiSnapshot([8192,4096,7],767*65536,767*65536);
test('original true throw includes entry/exit pointer and native frame, remains RED',()=>{
 const log=trace('enter')+trace('throw')+receipt('throw',entry,exit,{functionIndex:978,wasmOffset:107187});
 const r=classifyRun(log,1,meta);
 assert.equal(r.ortCreateSessionOutcome,'throw');
 assert.equal(r.originalFailure,true);assert.equal(r.originalPositive,false);
 assert.equal(r.pointer,8192);assert.equal(r.length,4096);
 assert.equal(r.inBoundsAtEntry,true);assert.equal(r.inBoundsAtExit,true);
 assert.equal(r.nativeFunctionIndex,978);assert.equal(r.wasmInstructionOffset,107187);
 assert.equal(r.failingNativeInstructionProven,true);
 assert.equal(r.causalRepairProven,false);assert.equal(r.familyAlpha,'HOLD');
});
test('successful original owner journey has original OrtRun return and cannot imply fix',()=>{
 const log=trace('enter')+trace('return')+receipt('return',entry,exit)+run+
  'P91_FULL_JOURNEY_PASS {"ok":true}\n';
 const r=classifyRun(log,0,meta);
 assert.equal(r.originalPositive,true);assert.equal(r.originalFailure,false);
 assert.equal(r.failingNativeInstructionProven,false);
 assert.equal(r.causalRepairProven,false);
});
test('forged positive with real native throw cannot be approved',()=>{
 const log=trace('enter')+trace('throw')+receipt('throw',entry,exit)+run+'P91_FULL_JOURNEY_PASS {}\n';
 assert.throws(()=>classifyRun(log,0,meta),/THROW/);
});
test('missing, duplicated, contradictory, unvalidated ABI cannot become success',()=>{
 assert.throws(()=>classifyRun(trace('enter')+trace('return')+run+'P91_FULL_JOURNEY_PASS {}\n',0,meta),/missing/);
 assert.throws(()=>classifyRun(trace('enter')+trace('throw')+
  receipt('return',entry,exit),1,meta),/phase mismatch/);
 assert.throws(()=>classifyRun(trace('enter')+trace('return')+
  receipt('return',entry,exit)+receipt('return',entry,exit),0,meta),/duplicate/);
 const corrupt={...entry,modelRangeInLinearMemory:false};
 assert.throws(()=>classifyRun(trace('enter')+trace('throw')+receipt('throw',corrupt,exit),1,meta),
  /inconsistent/);
 assert.throws(()=>classifyRun(trace('enter')+trace('throw')+
  receipt('throw',{...entry,nativeArgumentCount:2},exit),1,meta),/invalid native ABI/);
});
test('failure before native entry is preserved, NOT silently a green or native proof',()=>{
 const r=classifyRun('P94_FAILED_ORIGINAL_MODEL before native entry\n',1,meta);
 assert.equal(r.originalFailure,true);
 assert.equal(r.ortCreateSessionOutcome,'UNOBSERVED');
 assert.equal(r.pointer,null);
 assert.equal(r.failingNativeInstructionProven,false);
});
