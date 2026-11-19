import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stageLedger,originalJsepReceipt,ORIGINAL_JSEP_NAME,ORIGINAL_JSEP_SHA,
 ORIGINAL_NON_JSEP_SHA} from '../scripts/main247-original-jsep-phase-evidence.mjs';

const wasm=(available=true)=>({name:ORIGINAL_JSEP_NAME,kind:'onnx-wasm',status:200,
 bodyAvailable:available,sha256:available?ORIGINAL_JSEP_SHA:null,
 bytes:available?21596019:null});
const stage=(phase,outcome,extra={})=>({type:'diagnostic',phase,outcome,...extra});
const goodEvents=()=>[
 stage('wasm_instantiateStreaming','start'),
 stage('wasm_instantiateStreaming','ok'),
 stage('model_session_load','start'),
 stage('model_session_load','ok'),
 stage('first_inference','start'),stage('first_inference','ok')
];
const original=()=>({
 engine:'webkit',width:390,network:[wasm()],events:goodEvents(),
 originalWorkerSeen:true,originalModelAttempted:true,cards:2
});
test('M247 source-locked original WebKit JSEP real-positive phase proof',()=>{
 const x=originalJsepReceipt(original());
 assert.equal(x.originalJsepWasmHttp200,true);
 assert.equal(x.originalJsepWasmResponseBodySHA256Verified,true);
 assert.equal(x.originalJsepDirectBrowserBinarySHA256,ORIGINAL_JSEP_SHA);
 assert.equal(x.originalPositiveJourneyStillRequired,true);
 assert.equal(x.modelSessionTerminal,'ok');
 assert.equal(x.genuineOriginalPostWasmSessionMemoryFaultWitness,false);
 assert.equal(x.permanentRepairProven,false);
 assert.equal(x.familyAlphaHold,true);
});
test('M247 unreadable Playwright browser body must never be upgraded to directly verified SHA',()=>{
 const x=original();x.network=[wasm(false)];
 const r=originalJsepReceipt(x);
 assert.equal(r.originalJsepWasmHttp200,true);
 assert.equal(r.originalJsepWasmResponseBodySHA256Verified,false);
 assert.equal(r.originalJsepDirectBrowserBinarySHA256,null);
});
test('M247 detects only genuine stage-specific post-WASM pre-inference memory witness',()=>{
 const events=[
  stage('wasm_instantiateStreaming','ok'),
  stage('model_session_load','start'),
  stage('model_session_load','error',{errorName:'RuntimeError',messageCode:'wasm_memory_access'})
 ];
 const r=stageLedger(events);
 assert.equal(r.genuineOriginalPostWasmSessionMemoryFaultWitness,true);
 assert.equal(r.nativeAllocatorRootCauseProven,false);
 for(const changed of [
  events.filter(x=>x.phase!=='wasm_instantiateStreaming'),
  [...events,stage('first_inference','start')],
  events.map(x=>x.phase==='model_session_load'&&x.outcome==='error'?{...x,errorName:'RangeError'}:x),
  events.map(x=>x.phase==='model_session_load'&&x.outcome==='error'?{...x,messageCode:'memory_allocation'}:x),
  events.map(x=>x.phase==='model_session_load'&&x.outcome==='error'?{...x,outcome:'ok'}:x)
 ])assert.equal(stageLedger(changed).genuineOriginalPostWasmSessionMemoryFaultWitness,false);
});
test('M247 cannot silently replace original JSEP positive with non-JSEP, missing or duplicate WASM',()=>{
 const g=original();
 for(const bad of [
  {...g,network:[]},
  {...g,network:[wasm(),wasm()]},
  {...g,network:[{...wasm(),sha256:ORIGINAL_NON_JSEP_SHA}]},
  {...g,network:[{...wasm(),name:'ort-wasm-simd-threaded.wasm'}]},
  {...g,network:[{...wasm(),status:503}]},
  {...g,network:[{...wasm(false),sha256:'a'.repeat(64)}]},
  {...g,network:[{...wasm(false),bytes:21596019}]}
 ])assert.throws(()=>originalJsepReceipt(bad));
});
test('M247 source/photo/owner and genuine model positive cannot be forged with fixture-only receipts',()=>{
 const g=original();
 for(const bad of [
  {...g,originalWorkerSeen:false},
  {...g,originalModelAttempted:false},
  {...g,cards:13},
  {...g,cards:2,events:[stage('model_session_load','start')]},
  {...g,width:500},
  {...g,engine:'synthetic'}
 ])assert.throws(()=>originalJsepReceipt(bad));
});
test('M247 intentional model network interruption is negative, never a successful original model',()=>{
 const neg={...original(),cards:0,network:[],events:[stage('model_session_load','start'),
  stage('model_session_load','error',{errorName:'Error',messageCode:'network_stream'})],
  intentionalNegative:true};
 const r=originalJsepReceipt(neg);
 assert.equal(r.originalJsepWasmHttp200,false);
 assert.equal(r.originalPositiveJourneyStillRequired,false);
 assert.equal(r.genuineOriginalPostWasmSessionMemoryFaultWitness,false);
 assert.throws(()=>originalJsepReceipt({...neg,cards:2}));
});
test('M247 private data and runtime identity cannot leak through diagnostic schema',()=>{
 const r=originalJsepReceipt(original());
 const text=JSON.stringify(r);
 assert.ok(!text.includes('authToken')&&!text.includes('ownerId'));
 assert.ok(!text.includes('photoBytes')&&!text.includes('modelWeights'));
 assert.equal(r.originalSourceOwnerBackupAcceptanceNotInThisReceipt,true);
});
test('M247 source pins entire original P101 Worker journey and no silent-save checks',async()=>{
 const driver=await readFile('scripts/test-main247-original-jsep-phase-browser.mjs','utf8');
 const originalSource=await readFile('scripts/test-parallel101-real-p94-model-init-stage-browser.mjs','utf8');
 const worker=await readFile('public/outfit-worker-p94.mjs','utf8');
 assert.ok(driver.includes('ad8ab0eb33322a34f8cc3f45a1fe26feff87b2ab'));
 assert.ok(driver.includes('d66651b616de54c51eb7ef986324b30f1580888f'));
 assert.ok(driver.includes('P101_CONTROLLED_PUBLIC_ONNX_ABORT_FALLBACK_PASS'));
 assert.ok(driver.includes('state.cards>0&&state.cards<=12'));
 assert.ok(driver.includes('M247_REAL_ORIGINAL_JSEP_PHASE'));
 assert.ok(driver.includes('assert.equal(run.status,0'));
 assert.ok(originalSource.includes('P101 true P94 model/owner failure; preserve RED'));
 assert.ok(originalSource.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS')===false);
 assert.ok(worker.includes("device:'wasm',dtype:'fp32'"));
});
