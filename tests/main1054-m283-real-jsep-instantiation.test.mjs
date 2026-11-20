import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {sourceGate,parent,branch,added,expectedSha,expectedBytes,
 adjudicateWitnesses,assessProcess,deriveM283,instrument,prelude}
 from '../research/main1054/m283-real-jsep-instantiation.mjs';

const good=()=>({operation:'instantiateStreaming',phase:'instantiated',
 bytes:expectedBytes,sha256:expectedSha});
test('original JSEP canonical 21.6MB SHA reference remains exact',()=>{
 assert.equal(expectedBytes,21596019);
 assert.equal(expectedSha,'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39');
});
test('only actual native instantiated original WASM bytes can be identity-positive',()=>{
 const r=adjudicateWitnesses([good()]);
 assert.equal(r.exactInstanceProven,true);
 assert.equal(r.originalModelCausalFixProven,false);
});
test('fetch-only, compile-only, missing or unverified instantiation is NOT proof',()=>{
 assert.equal(adjudicateWitnesses([]).exactInstanceProven,false);
 assert.equal(adjudicateWitnesses([{...good(),phase:'unverified',sha256:null}]).exactInstanceProven,false);
 for(const op of ['fetch','download','compile','owner-save'])
  assert.throws(()=>adjudicateWitnesses([{...good(),operation:op}]),/not native instance/);
});
test('corrupted source original SHA is rejected instead of rebranded positive',()=>{
 assert.throws(()=>adjudicateWitnesses([{...good(),sha256:'0'.repeat(64)}]),/identity mismatch/);
 assert.throws(()=>adjudicateWitnesses([good(),{...good(),sha256:'a'.repeat(64)}]),/identity mismatch/);
});
test('duplicates, unrelated events, forged bytes and invalid hashes must fail closed',()=>{
 assert.equal(adjudicateWitnesses([good(),good()]).exactInstanceProven,false);
 assert.equal(adjudicateWitnesses([{...good(),bytes:99}]).exactInstanceProven,false);
 assert.throws(()=>adjudicateWitnesses([{...good(),bytes:-1}]),/byte size/);
 assert.throws(()=>adjudicateWitnesses([{...good(),sha256:'wrong'}]),/digest/);
 assert.throws(()=>adjudicateWitnesses([good(),good(),good(),good()]),/oversize/);
});
test('pass-through original browser instrumentation is valid JavaScript, no source-original changes',()=>{
 assert.doesNotThrow(()=>new vm.Script(prelude));
 const browser=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
 const worker=readFileSync('public/outfit-worker-p94.mjs','utf8');
 const out=deriveM283(browser,worker);
 assert.match(out,/M283_NATIVE_WASM_SHA/);
 assert.match(out,/M279_NATIVE_MODEL_BOUNDS/);
 assert.match(out,/instrument/);
 assert.match(out,/cc-m283|__cc_ort_trace/);
 assert.equal(browser.includes('M283_NATIVE_WASM_SHA'),false);
 assert.equal(worker.includes('M283_NATIVE_WASM_SHA'),false);
 assert.throws(()=>instrument('ort-wasm-simd-threaded.jsep.mjs',Buffer.from('mismatch'),'/x'),/SHA mismatch/);
});
test('unbound or fabricated positive log cannot be accepted as original model',()=>{
 assert.throws(()=>assessProcess('M283_NATIVE_WASM_SHA '+JSON.stringify(good()),0,
  {engine:'webkit',width:430,ordinal:1}),/BLOCKED|invalid|original|trace/i);
});
test('strict source ancestry + only three additive files + no retries/source drift',()=>{
 const sha='a'.repeat(40),old={
  'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
  'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11',
  'research/main1054/m280-original-jsep-function-map.mjs':'c52b967bc80ce8ba4c2c69bc2ea09c70e50bb332',
  'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41'
 };
 const git=(cmd,...args)=>{
  if(cmd==='rev-parse')return args[0]==='HEAD'?sha:old[args[0].slice(sha.length+1)]||'missing';
  if(cmd==='merge-base')return '';
  if(cmd==='diff-tree')return added.map(x=>'A\0'+x+'\0').join('');
  if(cmd==='ls-tree')return '100644 blob '+sha;
  throw Error('unexpected git command');
 };
 const e={name:'push',ref:branch,attempt:'1',sha};
 assert.equal(sourceGate(git,e).originalWasmModified,false);
 for(const bad of [{ref:'refs/heads/main'},{attempt:'2'},{name:'pull_request_target'},{sha:''}])
  assert.throws(()=>sourceGate(git,{...e,...bad}),/M283 BLOCKED/);
 assert.throws(()=>sourceGate((...x)=>x[0]==='diff-tree'?'M\0public/outfit-worker-p94.mjs\0':git(...x),e),
  /original source changed/);
 assert.throws(()=>sourceGate((...x)=>x[0]==='rev-parse'&&x[1]===sha+':public/outfit-worker-p94.mjs'?
  'c'.repeat(40):git(...x),e),/source drift/);
});
