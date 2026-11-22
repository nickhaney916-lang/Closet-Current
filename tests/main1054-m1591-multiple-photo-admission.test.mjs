import {classifyM1591ErrorReason,parseM1591WasmStackFrames} from '../research/main1054/m1591-error-reason-classifier.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sources=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const source=readFileSync('research/main1054/m1591-original-p94-photo-plain-wasm-ab.mjs','utf8');
const hash=b=>createHash('sha256').update(b).digest('hex');
const allowed=['commons-0003','commons-0001','commons-0014','commons-0021','commons-0049'];
test('original plus four licensed category fixtures each independently pinned',()=>{
 for(const id of allowed){
  const matching=sources.filter(x=>x.id===id);
  assert.equal(matching.length,1);
  const row=matching[0];
  assert.equal(row.verified,true);
  assert.equal(row.image,id+'.jpg');
  assert.ok(row.attribution?.license);
  const bytes=readFileSync('benchmark/fixtures/'+row.image);
  assert.equal(hash(bytes),row.sha256);
  assert.ok(bytes.length>1024&&bytes.length<=3000000);
  assert.equal(bytes[0],0xff);assert.equal(bytes[1],0xd8);
 }
});
test('fail-closed selector protects against unknown paths, private photos and source modification',()=>{
 assert.ok(source.includes('fixtureAllowlist.has(fixtureId)'));
 assert.ok(source.includes("matches.length!==1"));
 assert.ok(source.includes("hash(photo)!==photoSha"));
 assert.ok(source.includes("if(!fileAllow.has(u.pathname))throw Error('not-allowed')"));
 assert.ok(source.includes("const original=readFileSync('public/outfit-worker-p94.mjs','utf8')"));
 assert.ok(source.includes("original.replace(needle[0],alternative)"));
 assert.ok(source.includes("mode==='plain'?adapted:original"));
 assert.ok(source.includes("nativeTrapPc:null,wasmFileOffset:null,causalFixProven:false"));
 assert.ok(source.includes("releaseAllowed:false,familyAlpha:'HOLD'"));
});
test('comparison cannot silently treat zero pieces or malformed piece hashes as green',()=>{
 assert.ok(source.includes("safe.terminal==='done'&&safe.pieceCount>0"));
 assert.ok(source.includes("safe.originalDoneCount===safe.pieceCount"));
 assert.ok(source.includes("safe.outputPieceHashes.every"));
 assert.ok(source.includes("if(!good)process.exitCode=1"));
});

test('M1591 original Worker error category keeps WebAssembly failures distinguishable',()=>{
 const classify=classifyM1591ErrorReason;
 assert.equal(classify('RuntimeError','memory access out of bounds'),'WASM_MEMORY_BOUNDS');
 assert.equal(classify('RuntimeError','Out of bounds memory access'),'WASM_MEMORY_BOUNDS');
 assert.equal(classify('RuntimeError','table index 7 out of bounds'),'WASM_TABLE_BOUNDS');
 assert.equal(classify('RuntimeError','unreachable'),'WASM_UNREACHABLE');
 assert.equal(classify('RangeError','Maximum call stack size exceeded'),'STACK_EXHAUSTED');
 assert.equal(classify('RuntimeError','failed to allocate memory'),'MEMORY_RESOURCE');
 assert.equal(classify('RuntimeError','some unrecognized error'),'RUNTIME_OTHER');
 assert.equal(classify('Error','other sensitive error with internal URL'),'NON_RUNTIME_OTHER');
 assert.equal(classify(null,null),'NON_RUNTIME_OTHER');
});
test('error classes fail closed and no raw errors are printed',()=>{
 const source=readFileSync('research/main1054/m1591-original-cpu-ort-bundle-ab.mjs','utf8');
 assert.ok(source.includes('classifyM1591ErrorReason.toString()'));
 assert.ok(source.includes('workerErrorReasonClass:'));
 assert.ok(source.includes('workerWasmBoundsTextObserved:result?.boundsMessage===true'));
 assert.ok(!source.includes('workerErrorMessage:'));
 assert.ok(!source.includes('rawError:'));
 assert.ok(source.includes('originalNativeRedObserved:false'));
 assert.ok(source.includes('causalFixProven:false'));
});

test('original numeric WASM frames preserve uncertainty about native PC',()=>{
 const observed=parseM1591WasmStackFrames('RuntimeError: memory access out of bounds\n at wasm-function[4846]\n at wasm-function[1384]');
 assert.deepEqual(observed,[{functionIndex:4846,stackLocationUnverified:null},{functionIndex:1384,stackLocationUnverified:null}]);
 assert.deepEqual(parseM1591WasmStackFrames('wasm-function[4846]:0x12a'),[{functionIndex:4846,stackLocationUnverified:298}]);
 assert.deepEqual(parseM1591WasmStackFrames('https://example.invalid/private/writer.js:42:1'),[]);
 assert.deepEqual(parseM1591WasmStackFrames('wasm-function[9999999]'),[]);
 assert.equal(parseM1591WasmStackFrames(Array.from({length:9},(_,i)=>'wasm-function['+i+']').join('\n')).length,6);
 assert.deepEqual(parseM1591WasmStackFrames(null),[]);
});
test('stack frame evidence is numeric, bounded, and cannot claim bytecode PC',()=>{
 const src=readFileSync('research/main1054/m1591-original-cpu-ort-bundle-ab.mjs','utf8');
 assert.ok(src.includes('parseM1591WasmStackFrames.toString()'));
 assert.ok(src.includes('reportedWasmStackFramesUnverified:'));
 assert.ok(src.includes('nativeTrapPc:null,wasmFileOffset:null'));
 assert.ok(!src.includes('rawStack:'));
 assert.ok(!src.includes('workerErrorStack:'));
});
