import test from 'node:test';
import assert from 'node:assert/strict';
import {M239_WORKER_PROBE} from '../scripts/main239-grow-target-memory-fixture.mjs';
import {m238SyntheticWasm} from '../scripts/main238-wasm-memory-observer-fixture.mjs';

const hook=(messages)=>new Function('self','WebAssembly',
 M239_WORKER_PROBE+'\nreturn {p239Attach,p239Emit};')(
 {postMessage:value=>messages.push(value)},WebAssembly);

async function nativeAfterJsGrowth(imported){
 const native=WebAssembly.Memory.prototype.grow,receipts=[];
 try{
  const observer=hook(receipts);
  observer.p239Attach('native');
  const mem=imported?new WebAssembly.Memory({initial:1,maximum:6}):null;
  const bytes=m238SyntheticWasm(imported);
  assert.equal(WebAssembly.validate(bytes),true);
  const result=await WebAssembly.instantiate(bytes,imported?{env:{m:mem}}:undefined);
  const actual=imported?mem:result.instance.exports.memory;
  assert.equal(actual.buffer.byteLength,65536);
  assert.equal(actual.grow(1),1,'JS grow returned wrong previous pages');
  assert.equal(actual.buffer.byteLength,2*65536);
  assert.equal(result.instance.exports.grow(),2,'real WASM-internal grow returned wrong previous pages');
  assert.equal(actual.buffer.byteLength,3*65536);
  observer.p239Emit('native');
  const rec=receipts.find(v=>v.phase==='p239_target_memory_terminal');
  assert.ok(rec);
  assert.equal(rec.targetHookInstalled,true);
  assert.equal(rec.growTargetRefs,1);
  assert.equal(rec.validTargetRefs,1);
  assert.equal(rec.targetJsCalls,1);
  assert.equal(rec.targetJsErrors,0);
  assert.equal(rec.targetFirstPages,1);
  assert.equal(rec.targetAfterJsPages,2);
  assert.equal(rec.targetTerminalPages,3);
  assert.equal(rec.targetPostJsIncreasePages,1,
   'observer missed WASM-internal growth after last JS grow call');
 }finally{WebAssembly.Memory.prototype.grow=native;}
}
test('M239 observes native WASM memory.grow after a JS grow on exported memory',
 {concurrency:false},()=>nativeAfterJsGrowth(false));
test('M239 observes native WASM memory.grow after a JS grow on imported-only memory',
 {concurrency:false},()=>nativeAfterJsGrowth(true));

test('M239 does not misattribute JS-only growth to internal WASM', {concurrency:false},()=>{
 const native=WebAssembly.Memory.prototype.grow,receipts=[];
 try{
  const o=hook(receipts);
  o.p239Attach('js-only');
  const memory=new WebAssembly.Memory({initial:1,maximum:5});
  assert.equal(memory.grow(1),1);
  o.p239Emit('js-only');
  const r=receipts.find(v=>v.phase==='p239_target_memory_terminal');
  assert.equal(r.targetJsCalls,1);
  assert.equal(r.targetFirstPages,1);
  assert.equal(r.targetAfterJsPages,2);
  assert.equal(r.targetTerminalPages,2);
  assert.equal(r.targetPostJsIncreasePages,0);
 }finally{WebAssembly.Memory.prototype.grow=native;}
});

test('M239 transparently preserves thrown exception identity', {concurrency:false},()=>{
 const native=WebAssembly.Memory.prototype.grow,receipts=[];
 const sentinel=new RangeError('source-only controlled exception');
 try{
  WebAssembly.Memory.prototype.grow=function(){throw sentinel;};
  const o=hook(receipts);
  o.p239Attach('throws');
  const memory=new WebAssembly.Memory({initial:1,maximum:5});
  assert.throws(()=>memory.grow(1),e=>e===sentinel);
  o.p239Emit('throws');
  const r=receipts.find(v=>v.phase==='p239_target_memory_terminal');
  assert.equal(r.targetJsErrors,1);
  assert.equal(r.targetJsCalls,1);
  assert.equal(r.targetPostJsIncreasePages,0);
 }finally{WebAssembly.Memory.prototype.grow=native;}
});

test('M239 captures no model source, buffer bytes or owner data',()=>{
 for(const prohibited of ['Uint8Array','DataView','sourceSHA256','originalPhoto','modelWeights','stack','response.text()']){
  assert.equal(M239_WORKER_PROBE.includes(prohibited),false,prohibited);
 }
 assert.ok(M239_WORKER_PROBE.includes('memory.buffer.byteLength'));
 assert.ok(M239_WORKER_PROBE.includes('Reflect.apply(original,this,args)'));
});
