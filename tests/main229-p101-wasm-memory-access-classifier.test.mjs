/** M229: deterministic classification witness, no model, account, tokens or photos. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';

const source=await readFile('scripts/test-parallel101-real-p94-model-init-stage-browser.mjs','utf8');
const marker='let diagWorker=';
assert.equal(source.split(marker).length,2,'pinned diagnostic worker source construction moved');
const start=source.indexOf(marker)+marker.length;
const segment=source.slice(start);
const delimiter=`"+'\\n'+`;
const end=segment.indexOf(delimiter);
assert.ok(end>100,'expected first pure diagnostic classifier string missing');
const initial=JSON.parse(segment.slice(0,end+1));
assert.ok(initial.startsWith('const p101Classify=error=>'),'unexpected instrumented Worker helper');
assert.ok(initial.includes("const p101ErrorCode=error=>"),'missing shared runtime classifier');

const evaluate=runInNewContext(initial+
  "\nconst p101ExceptionText=e=>typeof e==='string'?e:(typeof e?.message==='string'?e.message:'');"+
  "\n({run(error){return {category:p101Classify(error),code:p101ErrorCode(error),name:p101ErrorName(error)};}})",
  Object.create(null),{timeout:1000});

test('actual WebKit RuntimeError memory access is distinguished from out-of-memory',()=>{
  assert.equal(source.includes("'wasm_memory_access','wasm_compile'"),true,'Worker message allowlist must relay new safe code');
  for(const message of ['memory access out of bounds','WebAssembly memory access','out of bounds']) {
    const got=evaluate.run({name:'RuntimeError',message});
    assert.equal(got.category,'memory');
    assert.equal(got.code,'wasm_memory_access');
    assert.equal(got.name,'RuntimeError');
  }
});
test('real allocation exhaustion remains separate and fail-closed',()=>{
  for(const message of ['out of memory','allocation failed','memory limit exceeded']){
    const got=evaluate.run({name:'RuntimeError',message});
    assert.equal(got.code,'memory_allocation');
  }
});
test('network, session and benign runtime classes are not recategorized as memory access',()=>{
  assert.equal(evaluate.run({name:'NetworkError',message:'network stream closed'}).code,'network_stream');
  assert.equal(evaluate.run({name:'Error',message:'inference session failed'}).code,'ort_session');
  assert.equal(evaluate.run({name:'Error',message:'unclassified harmless category'}).code,'other');
});
test('no raw error message, stack, private data or model inputs are emitted by diagnostic event',()=>{
  assert.ok(source.includes("messageCode:p101ErrorCode(error)"));
  assert.ok(!source.includes("message:error?.message"));
  assert.ok(!source.includes("stack:error?.stack"));
  assert.ok(source.includes("assert.ok(state.cards>0&&state.cards<=12"));
  assert.ok(source.includes("actualWorkerSourceBlob:'parallel101-init-stage-instrumented-from-"));
});
