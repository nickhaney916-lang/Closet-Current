/**
 * MAIN230: deterministic, synthetic native-API pass-through receipt.
 * No garment/model data, real-family account or inference is ever mocked
 * into a successful source-positive native browser acceptance.
 * Only the installed, isolated P101 diagnostic Worker is exercised here.
 */
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source=readFileSync('scripts/test-parallel101-real-p94-model-init-stage-browser.mjs','utf8');
const startMarker='const p101MemoryProbeSource=String.raw`';
const endMarker='`;'+'\nlet diagWorker=';
assert.equal(source.split(startMarker).length,2,'single source-injected pass-through observer required');
const start=source.indexOf(startMarker)+startMarker.length;
const end=source.indexOf(endMarker,start);
assert.ok(end>start+200,'literal source observer missing');
const snippet=source.slice(start,end);
function install(Memory){
 const receipts=[];
 const context={WebAssembly:{Memory},self:{postMessage:x=>receipts.push(x)},Math,Number,Reflect};
 const make=runInNewContext(snippet+'\np101MemoryProbe',context,{timeout:1000});
 return {make,receipts};
}
test('M230 observer preserves native this, return, argument and exact thrown exception',()=>{
 const sentinel=new Error('synthetic grow rejected');
 const calls=[];
 class Memory {
  constructor(){this.pages=1;}
  grow(n,extra){
   calls.push({self:this,n,extra});
   if(n===9)throw sentinel;
   const prior=this.pages;this.pages+=n;return prior;
  }
 }
 const {make,receipts}=install(Memory);
 const finish=make('synthetic-request');
 const a=new Memory();
 assert.equal(a.grow(2,'kept'),1);
 assert.equal(a.pages,3);
 assert.throws(()=>a.grow(9,'error-kept'),error=>error===sentinel);
 finish();
 assert.equal(calls.length,2);
 assert.equal(calls[0].self,a);
 assert.equal(calls[0].n,2);
 assert.equal(calls[0].extra,'kept');
 assert.equal(calls[1].self,a);
 assert.equal(calls[1].extra,'error-kept');
 assert.equal(receipts.length,1);
 assert.deepEqual(Object.keys(receipts[0]).sort(),
  ['growCalls','growErrors','id','maxDeltaPages','outcome','phase','type'].sort());
 assert.equal(receipts[0].phase,'wasm_js_memory_grow_summary');
 assert.equal(receipts[0].growCalls,2);
 assert.equal(receipts[0].growErrors,1);
 assert.equal(receipts[0].maxDeltaPages,9);
 assert.equal(receipts[0].outcome,'error');
});
test('M230 zero JS grow calls does not invent memory safety or allocation success',()=>{
 class Memory {grow(n){return n;}}
 const {make,receipts}=install(Memory);
 make('synthetic-request')();
 assert.equal(receipts[0].growCalls,0);
 assert.equal(receipts[0].growErrors,0);
 assert.equal(receipts[0].maxDeltaPages,0);
 assert.equal(receipts[0].outcome,'ok');
});
test('M230 absent JS grow method has safe bounded unsupported receipt',()=>{
 class Memory {}
 const {make,receipts}=install(Memory);
 make('synthetic-request')();
 assert.equal(receipts[0].outcome,'error');
 assert.equal(receipts[0].growCalls,0);
 assert.equal(receipts[0].growErrors,0);
});
test('M230 worker observer logs bounded scalars only and retains strict original positives',()=>{
 assert.ok(source.includes("assert.ok(state.cards>0&&state.cards<=12"));
 assert.ok(source.includes("p101MemorySummary();"));
 assert.ok(source.includes("p101WasmProbe(requestId)"));
 assert.ok(source.includes("errorCategory:p101Classify(error)"));
 assert.ok(source.includes("growCalls:Number.isSafeInteger(safe.growCalls)"));
 assert.ok(!snippet.includes('photo'));
 assert.ok(!snippet.includes('token'));
 assert.ok(!snippet.includes('password'));
 assert.ok(!snippet.includes('.buffer'));
 assert.ok(!snippet.includes('.stack'));
 assert.ok(!snippet.includes('console.'));
 assert.ok(!snippet.includes('setTimeout'));
 assert.ok(!snippet.includes('retry'));
});
