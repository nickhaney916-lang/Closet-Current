import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {locateActualAbiCall,instrumentExactPinnedModule,PINNED_ORT,
 PINNED_SHA256,ORIGINAL_WORKER_GIT_BLOB} from '../scripts/main242-ort-session-abi-trace.mjs';

const hash=s=>createHash('sha256').update(s).digest('hex');
const fixture='const r=wasm._OrtCreateSessionOptions(0,!!options.enableCpuMemArena,!!options.enableMemPattern,0);return r;';
test('M242 exact pinned package and consumer Worker identity',()=>{
 assert.equal(PINNED_ORT,'1.22.0-dev.20250409-89f8206ba4');
 assert.equal(PINNED_SHA256,'98fe788f08034b3417c1fa94493a9dd0089485e53fa7010b13f7a137977549fa');
 assert.equal(ORIGINAL_WORKER_GIT_BLOB,'d66651b616de54c51eb7ef986324b30f1580888f');
});
test('M242 only a SINGLE original ABI call with memory-pattern argument qualifies',()=>{
 assert.equal(locateActualAbiCall(fixture).instance,'wasm');
 assert.throws(()=>locateActualAbiCall(fixture.replace('!!options.enableMemPattern','true')),/memory pattern/);
 assert.throws(()=>locateActualAbiCall(fixture+fixture),/exactly one/);
});
test('M242 disposable pass-through calls actual export once per true/false option and records only flags',()=>{
 const instrumented=instrumentExactPinnedModule(fixture,hash(fixture)).content;
 const receipts=globalThis.__m242OrtAbiCalls;
 try{
  globalThis.__m242OrtAbiCalls=[];
  let calls=0;
  const wasm={_OrtCreateSessionOptions(...args){calls++;assert.equal(args.length,4);return 1234;}};
  const execute=new Function('wasm','options',instrumented);
  assert.equal(execute(wasm,{enableCpuMemArena:true,enableMemPattern:true}),1234);
  assert.equal(execute(wasm,{enableCpuMemArena:true,enableMemPattern:false}),1234);
  assert.equal(calls,2);
  assert.deepEqual(globalThis.__m242OrtAbiCalls.map(x=>x.memPatternFlag),[true,false]);
  assert.deepEqual(globalThis.__m242OrtAbiCalls.map(x=>x.arenaFlag),[true,true]);
  assert.ok(globalThis.__m242OrtAbiCalls.every(x=>x.actualCall&&x.handleReturned));
  assert.ok(globalThis.__m242OrtAbiCalls.every(x=>!('modelBytes' in x||'account' in x)));
 }finally{if(receipts===undefined)delete globalThis.__m242OrtAbiCalls;else globalThis.__m242OrtAbiCalls=receipts;}
});
test('M242 thrown native error is preserved identically, never changed into success',()=>{
 const e=new WebAssembly.RuntimeError('controlled synthetic native fault');
 const code=instrumentExactPinnedModule(fixture,hash(fixture)).content;
 const previous=globalThis.__m242OrtAbiCalls;
 try{
  globalThis.__m242OrtAbiCalls=[];
  assert.throws(()=>new Function('wasm','options',code)(
   {_OrtCreateSessionOptions(){throw e;}},{enableCpuMemArena:true,enableMemPattern:false}),x=>x===e);
  assert.equal(globalThis.__m242OrtAbiCalls[0].handleReturned,false);
 }finally{if(previous===undefined)delete globalThis.__m242OrtAbiCalls;else globalThis.__m242OrtAbiCalls=previous;}
});
test('M242 never promotes JS entry call to read native C allocator state',async()=>{
 const src=await readFile('scripts/main242-ort-session-abi-trace.mjs','utf8');
 assert.ok(src.includes('directCAllocatorStateObserved:false'));
 for(const denied of ['HEAPU8[','memory.buffer','sessionOptions.enableMemPattern=true',
    'writeFile('])assert.equal(src.includes(denied),false,denied);
 assert.throws(()=>instrumentExactPinnedModule(fixture,'0'.repeat(64)),/bytes changed/);
});
