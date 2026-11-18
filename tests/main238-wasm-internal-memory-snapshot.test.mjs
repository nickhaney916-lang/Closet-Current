import test from 'node:test';
import assert from 'node:assert/strict';
import {M238_WORKER_PROBE,m238SyntheticWasm} from '../scripts/main238-wasm-memory-observer-fixture.mjs';

async function runNativeInternalGrowth(imported){
 const captured=[];
 const self={postMessage:entry=>captured.push(entry)};
 const nativeInstantiate=WebAssembly.instantiate;
 const nativeStreaming=WebAssembly.instantiateStreaming;
 const nativeGrow=WebAssembly.Memory.prototype.grow;
 let jsGrowCalls=0;
 try{
  const observer=new Function('self','WebAssembly',M238_WORKER_PROBE+
   '\nreturn {p238Install,p238Emit};')(self,WebAssembly);
  observer.p238Install('synthetic-m238');
  WebAssembly.Memory.prototype.grow=function(...args){
   jsGrowCalls++;
   return Reflect.apply(nativeGrow,this,args);
  };
  const memory=imported?new WebAssembly.Memory({initial:1,maximum:4}):null;
  const wasm=m238SyntheticWasm(imported);
  assert.ok(WebAssembly.validate(wasm),'native WASM synthetic program invalid');
  const {instance}=await WebAssembly.instantiate(wasm,imported?{env:{m:memory}}:undefined);
  const ref=imported?memory:instance.exports.memory;
  assert.ok(ref instanceof WebAssembly.Memory);
  assert.equal(ref.buffer.byteLength,65536);
  assert.equal(instance.exports.grow(),1,'native memory.grow returned wrong original page count');
  assert.equal(ref.buffer.byteLength,131072,'native memory.grow did not grow memory');
  observer.p238Emit('synthetic-m238');
  const receipt=captured.find(x=>x.phase==='p238_memory_snapshot');
  assert.ok(receipt,'bounded native observer produced no result');
  assert.equal(jsGrowCalls,0,'WASM memory.grow must bypass JS prototype hook');
  assert.equal(receipt.memorySnapshotHooks,2);
  assert.equal(receipt.memoryRefs,1);
  assert.equal(receipt.usableMemoryRefs,1);
  assert.equal(receipt.importedMemoryRefs,Number(imported));
  assert.equal(receipt.exportedMemoryRefs,Number(!imported));
  assert.equal(receipt.maxStartPages,1);
  assert.equal(receipt.maxEndPages,2);
  assert.equal(receipt.maxIncreasePages,1);
  assert.ok(Object.keys(receipt).every(k=>!/(owner|source|byte|path|photo|image|url|tensor|stack|model)/i.test(k)),
   'memory receipt contains private or model data');
 }finally{
  WebAssembly.instantiate=nativeInstantiate;
  WebAssembly.instantiateStreaming=nativeStreaming;
  WebAssembly.Memory.prototype.grow=nativeGrow;
 }
}
test('M238 detects WASM-internal memory.grow on an exported memory without JavaScript grow calls',
 {concurrency:false},async()=>runNativeInternalGrowth(false));
test('M238 detects WASM-internal memory.grow on an imported-only memory without JavaScript grow calls',
 {concurrency:false},async()=>runNativeInternalGrowth(true));
test('M238 source probe never reads raw memory contents or exposes private data',()=>{
 assert.ok(!M238_WORKER_PROBE.includes('Uint8Array'));
 assert.ok(!M238_WORKER_PROBE.includes('DataView'));
 assert.ok(!M238_WORKER_PROBE.includes('originalPhoto'));
 assert.ok(!M238_WORKER_PROBE.includes('sourceSHA256'));
 assert.ok(!M238_WORKER_PROBE.includes('modelWeights'));
 assert.ok(M238_WORKER_PROBE.includes('memory.buffer.byteLength'));
 assert.ok(M238_WORKER_PROBE.includes('Reflect.apply(native,WebAssembly,args)'));
});
