import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {M239_WORKER_PROBE} from '../scripts/main239-grow-target-memory-fixture.mjs';
import {M240_WORKER_PROBE} from '../scripts/main240-webkit-memory-checkpoint-fixture.mjs';
import {m238SyntheticWasm} from '../scripts/main238-wasm-memory-observer-fixture.mjs';

function observer(receipts){
 let callback=null,cleared=false;
 const self={postMessage:x=>receipts.push(x)};
 const hooks=new Function('self','WebAssembly','setInterval','clearInterval','performance',
  M239_WORKER_PROBE+M240_WORKER_PROBE+'\nreturn {p239Attach,p240Start,p240Finish};')(
   self,WebAssembly,cb=>{callback=cb;return 7;},id=>{assert.equal(id,7);cleared=true;},performance);
 return {...hooks,tick:()=>{assert.ok(callback);callback();},wasCleared:()=>cleared};
}
const checkpoints=messages=>messages.filter(x=>x.phase==='p240_memory_checkpoint');

test('M240 retains original actual Memory object across JS and native WASM internal growth',
 {concurrency:false},async()=>{
 const original=WebAssembly.Memory.prototype.grow,receipts=[];
 try{
  const o=observer(receipts);o.p239Attach('synthetic');o.p240Start('synthetic');
  const bytes=m238SyntheticWasm(false);
  assert.equal(WebAssembly.validate(bytes),true);
  const result=await WebAssembly.instantiate(bytes);
  const memory=result.instance.exports.memory;
  assert.equal(memory.grow(1),1);
  o.tick();
  const inFlight=checkpoints(receipts).at(-1);
  assert.equal(inFlight.watchTargetRefs,1);
  assert.equal(inFlight.watchPages,2);
  assert.equal(inFlight.watchJsCalls,1);
  assert.equal(inFlight.watchTerminal,false);
  result.instance.exports.grow();
  o.p240Finish('synthetic');
  const last=checkpoints(receipts).at(-1);
  assert.equal(last.watchPages,3);
  assert.equal(last.watchAfterJsPages,2);
  assert.equal(last.watchTerminal,true);
  assert.ok(o.wasCleared());
 }finally{WebAssembly.Memory.prototype.grow=original;}
});

test('M240 preserves original error identity and keeps last bounded snapshot',
 {concurrency:false},()=>{
 const original=WebAssembly.Memory.prototype.grow,receipts=[];
 const signal=new WebAssembly.RuntimeError('controlled synthetic memory fault');
 try{
  const o=observer(receipts);o.p239Attach('negative');o.p240Start('negative');
  const memory=new WebAssembly.Memory({initial:1,maximum:5});
  memory.grow(1);
  assert.throws(()=>{try{throw signal;}finally{o.p240Finish('negative');}},e=>e===signal);
  const last=checkpoints(receipts).at(-1);
  assert.equal(last.watchPages,2);
  assert.equal(last.watchTerminal,true);
  assert.equal(receipts.some(x=>JSON.stringify(x).includes(signal.message)),false);
 }finally{WebAssembly.Memory.prototype.grow=original;}
});

test('M240 timeout/blocked event-loop must not fabricate intermediate checkpoints',
 {concurrency:false},()=>{
 const original=WebAssembly.Memory.prototype.grow,receipts=[];
 try{
  const o=observer(receipts);o.p239Attach('blocked');o.p240Start('blocked');
  const memory=new WebAssembly.Memory({initial:1,maximum:3});
  memory.grow(1);
  // No timer callback: synthetic model thread is blocked.
  assert.equal(checkpoints(receipts).length,1);
  o.p240Finish('blocked');
  assert.equal(checkpoints(receipts).length,2);
  assert.equal(checkpoints(receipts)[1].watchPages,2);
  assert.ok(o.wasCleared());
 }finally{WebAssembly.Memory.prototype.grow=original;}
});

test('M240 telemetry retains only bounded scalar metadata, no memory bytes or private source',()=>{
 for(const secret of ['Uint8Array','DataView','getUint8','stack','error.message',
  'sourceSHA256','originalPhoto','modelWeights','accountId','localStorage']){
  assert.equal(M240_WORKER_PROBE.includes(secret),false,secret);
 }
 assert.ok(M240_WORKER_PROBE.includes('p239Pages(entry.memory)'));
 assert.ok(M240_WORKER_PROBE.includes('setInterval'));
 const source=readFile('scripts/test-main240-original-webkit-memory-failure-browser.mjs','utf8');
 return source.then(s=>{
  assert.ok(s.includes('P101 true P94 model/owner failure; preserve RED'));
  assert.ok(s.includes('state.cards>0&&state.cards<=12'));
  assert.ok(s.includes('M240_FAILURE_BOUNDARY_MEMORY'));
  assert.ok(!s.includes('process.exit(0)'));
 });
});
