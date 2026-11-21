import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {sourceGate,parent,branch,added,originalModelCopyObserver,
 classifyCopyViews,instrument,deriveM285,assessProcess} from '../research/main1054/m285-original-heap-view-witness.mjs';

const row=(phase='enter')=>({
 phase,copyCount:1,expectedOriginalModelByteLength:15199746,
 capturedOffset:8933688,originalModelPointer:8933688,copyOffsetMatchesPointer:true,
 targetBytesAtCopy:24182784,targetBytesAtNativePhase:24182784,
 liveWasmBytes:24182784,targetIsLiveWasmBuffer:true,
 originalWasmTrapInstructionOffset:null,causalFixProven:false
});
test('matching source copy and live entry/terminal are true observations, never a fixed runtime',()=>{
 const r=classifyCopyViews([row(),row('return')]);
 assert.equal(r.observedTwoPhases,true);
 assert.equal(r.originalModelCopyProven,true);
 assert.equal(r.nativeTerminalPhase,'return');
 assert.equal(r.causalFixProven,false);
 assert.equal(r.nativeTrapOffset,null);
});
test('native memory grew after original copy does not by itself establish a bug',()=>{
 const later={...row('throw'),targetBytesAtNativePhase:0,
  liveWasmBytes:50266112,targetIsLiveWasmBuffer:false};
 const r=classifyCopyViews([row(),later]);
 assert.equal(r.originalModelCopyProven,true);
 assert.equal(r.copyBufferDetachedAtNativeTerminal,true);
 assert.equal(r.nativeTerminalPhase,'throw');
 assert.equal(r.causalFixProven,false);
});
test('missing or ambiguous native model copy is unknown, not silently assumed current',()=>{
 const empty=classifyCopyViews([]);
 assert.equal(empty.originalModelCopyProven,false);
 assert.equal(empty.copiedHeapViewCurrentAtNativeEntry,null);
 assert.equal(classifyCopyViews([{...row(),copyCount:2},row('return')]).originalModelCopyProven,false);
 assert.equal(classifyCopyViews([{...row(),copyOffsetMatchesPointer:false},row('return')]).originalModelCopyProven,false);
 assert.equal(classifyCopyViews([{...row(),targetIsLiveWasmBuffer:false},row('return')]).originalModelCopyProven,false);
});
test('missing native start/end, duplicate and contradictory metadata are blocked',()=>{
 assert.throws(()=>classifyCopyViews([row()]),/missing or inconsistent/);
 assert.throws(()=>classifyCopyViews([row(),row('return'),row('return')]),/unbounded/);
 assert.throws(()=>classifyCopyViews([row('throw'),row('enter')]),/missing or inconsistent/);
 assert.throws(()=>classifyCopyViews([row(),{...row('throw'),capturedOffset:42}]),/copy changed/);
 assert.throws(()=>classifyCopyViews([{...row(),copyCount:-1},row('return')]),/copy count/);
 assert.throws(()=>classifyCopyViews([{...row(),originalModelPointer:-1},row('return')]),/invalid scalar/);
});
test('never convert synthetic positive, falsified PC or claimed causal fix into native proof',()=>{
 assert.throws(()=>classifyCopyViews([{...row(),originalWasmTrapInstructionOffset:99},row('return')]),/fabricated/);
 assert.throws(()=>classifyCopyViews([{...row(),causalFixProven:true},row('return')]),/fabricated/);
 assert.throws(()=>classifyCopyViews([{...row(),targetIsLiveWasmBuffer:'yes'},row('return')]),/tri-state/);
 assert.throws(()=>classifyCopyViews([{...row(),expectedOriginalModelByteLength:100},row('return')]),/source size/);
 assert.throws(()=>classifyCopyViews([{...row(),copyCount:0},row('return')]),/missing model copy/);
 assert.throws(()=>assessProcess('M285_ORIGINAL_MODEL_COPY_VIEW '+JSON.stringify(row()),0,
  {engine:'webkit',width:430,ordinal:1}),/missing or inconsistent|M285 BLOCKED|original/i);
});
test('the test-only Uint8Array.set observer preserves actual original result and source bytes',()=>{
 const sandbox={
  Uint8Array,Number,Reflect,JSON,console:{info:()=>{}},
  __ccNativeMemory:null
 };
 vm.runInNewContext(originalModelCopyObserver,sandbox,{timeout:1000});
 const source=new Uint8Array(15199746);source[0]=77;source[source.length-1]=91;
 const target=new Uint8Array(15199800);
 const result=target.set(source,10);
 assert.equal(result,undefined);
 assert.equal(target[10],77);assert.equal(target[10+source.length-1],91);
 assert.equal(source[0],77);
 // The test globally replaces Uint8Array.prototype.set, so restore by using
 // a sandbox-local subclass in future code rather than retaining a mutation.
});
test('original test-only JS source derives, native 3-argument ABI untouched and both app inputs unchanged',()=>{
 const browser=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
 const worker=readFileSync('public/outfit-worker-p94.mjs','utf8');
 const generated=deriveM285(browser,worker);
 assert.match(generated,/M285_ORIGINAL_MODEL_COPY_VIEW/);
 assert.match(generated,/M283_NATIVE_WASM_SHA/);
 assert.match(generated,/M279_NATIVE_MODEL_BOUNDS/);
 assert.match(generated,/cc-m285|__cc_ort_trace/);
 assert.equal(browser.includes('M285_ORIGINAL_MODEL_COPY_VIEW'),false);
 assert.equal(worker.includes('M285_ORIGINAL_MODEL_COPY_VIEW'),false);
 assert.throws(()=>instrument('ort-wasm-simd-threaded.jsep.mjs',
  Buffer.from('not original'),'http://example.test'),/SHA mismatch/);
});
test('source gate prevents wrong ref, run attempt, protected Worker drift or new source',()=>{
 const sha='a'.repeat(40), protectedFiles={
  'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
  'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11',
  'research/main1054/m283-real-jsep-instantiation.mjs':'6c4ad406643871851c9c21e6b324d67ef9d992a9',
  'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41'
 };
 const git=(cmd,...a)=>{
  if(cmd==='rev-parse')return a[0]==='HEAD'?sha:protectedFiles[a[0].slice(sha.length+1)]??'unknown';
  if(cmd==='merge-base')return '';
  if(cmd==='diff-tree')return added.map(p=>'A\0'+p+'\0').join('');
  if(cmd==='ls-tree')return '100644 blob '+'b'.repeat(40);
  throw Error('unexpected git');
 };
 const e={name:'push',ref:branch,attempt:'1',sha};
 assert.equal(sourceGate(git,e).originalRuntimeModified,false);
 for(const patch of [{ref:'refs/heads/main'},{attempt:'2'},{name:'pull_request_target'},{sha:''}])
  assert.throws(()=>sourceGate(git,{...e,...patch}),/M285 BLOCKED/);
 assert.throws(()=>sourceGate((...x)=>x[0]==='diff-tree'?'M\0public/outfit-worker-p94.mjs\0':git(...x),e),/original/);
 assert.throws(()=>sourceGate((...x)=>x[0]==='rev-parse'&&x[1]===sha+':public/outfit-worker-p94.mjs'?
  'f'.repeat(40):git(...x),e),/source drift/);
});
