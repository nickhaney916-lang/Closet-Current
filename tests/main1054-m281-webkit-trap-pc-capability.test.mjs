import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceGate,branch,parent,added,pins,syntheticWasmBytes,parseFrame,classifyProbe}
 from '../research/main1054/m281-webkit-trap-pc-capability.mjs';
const HEAD='a'.repeat(40),event={name:'push',ref:branch,attempt:'1',sha:HEAD};
const modified=added.map(p=>'A\0'+p+'\0').join('');
function git(command,...args){
 if(command==='rev-parse')return args[0]==='HEAD'?HEAD:pins[args[0].slice(HEAD.length+1)]||'b'.repeat(40);
 if(command==='merge-base')return '';
 if(command==='diff-tree')return modified;
 if(command==='ls-tree')return '100644 blob '+'b'.repeat(40);
 throw Error('Unexpected mock git call');
}
const tamper=fn=>(...args)=>fn(...args)??git(...args);
test('M281 source exactly preserves genuine failed original WebKit and immutable model',()=>{
 const s=sourceGate(git,event);
 assert.deepEqual(s,{source:'PASS',originalModelAndJsepUnchanged:true,
  originalM279RedPreserved:true,authenticOriginalTrapInstructionOffset:null,
  originalWebKitFixProven:false,familyAlpha:'HOLD'});
});
test('wrong event, rerun, original source tamper or altered original Worker fails closed',()=>{
 for(const e of [{name:'pull_request_target'},{ref:'refs/heads/main'},{sha:''},{attempt:'2'}])
  assert.throws(()=>sourceGate(git,{...event,...e}),/fail-closed/);
 assert.throws(()=>sourceGate(tamper((x,y)=>x==='rev-parse'&&y==='HEAD'?'f'.repeat(40):null),event),/HEAD mismatch/);
 assert.throws(()=>sourceGate(tamper(x=>x==='diff-tree'?'M\0public\/outfit-worker-p94.mjs\0':null),event),/original modification/);
 assert.throws(()=>sourceGate(tamper(x=>x==='ls-tree'?'120000 blob c':null),event),/nonregular/);
 assert.throws(()=>sourceGate(tamper((x,y)=>x==='rev-parse'&&y===HEAD+':public/outfit-worker-p94.mjs'?'0'.repeat(40):null),event),/protected original/);
});
test('tiny test-only WebAssembly module is VALID and performs a true out-of-bounds trap',async()=>{
 const bytes=new Uint8Array(syntheticWasmBytes);
 assert.equal(bytes.byteLength,44);
 assert.equal(WebAssembly.validate(bytes),true);
 const obj=await WebAssembly.instantiate(bytes);
 assert.throws(()=>obj.instance.exports.run(),WebAssembly.RuntimeError);
});
test('WebKit frame index is not a wasm bytecode offset',()=>{
 assert.deepEqual(parseFrame('foo wasm-function[4846] [wasm code]'),{functionIndex:4846,rawInstructionOffset:null});
 assert.deepEqual(parseFrame('wasm-function[4846]:0x2a'),{functionIndex:4846,rawInstructionOffset:42});
 assert.deepEqual(parseFrame('code not a native frame'),{functionIndex:null,rawInstructionOffset:null});
 assert.deepEqual(parseFrame('a'.repeat(8001)),{functionIndex:null,rawInstructionOffset:null});
});
const row=(frame=null)=>'M281_SYNTHETIC_WEBKIT_TRAP '+JSON.stringify({
 browser:'webkit',browserVersion:'26.0',moduleBytes:44,syntheticOnly:true,
 exceptionName:'RuntimeError',exceptionIsMemoryAccess:true,functionIndex:0,rawInstructionOffset:frame})+'\n';
test('synthetic WebKit trap is explicitly segregated from authentic original M279',()=>{
 const r=classifyProbe(row(null));
 assert.equal(r.syntheticOnly,true);
 assert.equal(r.originalModelWasExecuted,false);
 assert.equal(r.webKitReportsSyntheticOffset,false);
 assert.equal(r.originalM279WebKitInstructionOffset,null);
 assert.equal(r.originalNativeFaultingAddressKnown,false);
 assert.equal(r.nativeOriginalRepairProven,false);
 assert.equal(r.familyAlpha,'HOLD');
});
test('even if synthetic crash exposes PC, never misattribute it to real original fail',()=>{
 const r=classifyProbe('JSC_enableWasmDebugger=true\nJSC_traceWasmIPIntExecution=0\n'+row(42));
 assert.equal(r.webKitReportsSyntheticOffset,true);
 assert.equal(r.syntheticInstructionOffset,42);
 assert.equal(r.runtimeReportsWasmDebuggerOption,true);
 assert.equal(r.runtimeReportsWasmTraceOption,true);
 assert.equal(r.originalM279WebKitInstructionOffset,null);
 assert.equal(r.nativeOriginalRepairProven,false);
});
test('reject misleading positive when synthetic trap did not actually occur',()=>{
 assert.throws(()=>classifyProbe('M281_SYNTHETIC_WEBKIT_TRAP '+JSON.stringify({
  browser:'webkit',browserVersion:'26.0',moduleBytes:44,syntheticOnly:true,
  exceptionName:null,exceptionIsMemoryAccess:false,functionIndex:null,rawInstructionOffset:null
 })),/spoofed/);
});
test('missing or contradictory probe cannot be interpreted as success',()=>{
 assert.throws(()=>classifyProbe('some normal log'),/missing/);
 assert.throws(()=>classifyProbe(row(null)+row(42)),/missing\/duplicated/);
 assert.throws(()=>classifyProbe(row(null).replace('"browser":"webkit"','"browser":"chromium"')),/spoofed/);
 assert.throws(()=>classifyProbe(row(-42)),/spoofed/);
});
