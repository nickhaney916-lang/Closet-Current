import assert from 'node:assert/strict';
import test from 'node:test';
import {sourceGate,branch,parent,added,pins,classifyNativeError,pages,
 classifyRun,instrument,deriveM278} from '../research/main1054/m278-native-session-memory-class.mjs';
const head='1'.repeat(40);
const event={name:'push',ref:branch,sha:head,attempt:'1'};
const safeDiff=added.map(p=>'A\0'+p+'\0').join('');
function git(c,...args){
 if(c==='rev-parse')return args[0]==='HEAD'?head:pins[args[0].slice(head.length+1)]??'2'.repeat(40);
 if(c==='diff-tree')return safeDiff;
 if(c==='merge-base')return '';
 if(c==='ls-tree')return '100644 blob '+ '2'.repeat(40);
 throw Error('bad fake git invocation');
}
const wrap=(pred,f)=>(...args)=>pred(...args)?f(git(...args)):git(...args);
test('never call original native model repaired or release authorized from source pin',()=>{
 assert.deepEqual(sourceGate(git,event),{
  source:'PASS',nativeCodeModified:false,originalPositiveAssertions:'UNCHANGED',
  permanentWebKitFix:'UNPROVEN',familyAlpha:'HOLD'});
});
for(const [title,delta,regex] of [
 ['forbid default branch',{ref:'refs/heads/main'},/event\/branch/],
 ['forbid privileged PR',{name:'pull_request_target'},/event\/branch/],
 ['forbid retries',{attempt:'2'},/rerun/],
 ['forbid wrong checkout',{sha:'f'.repeat(40)},/checkout mismatch/],
 ['forbid blank source',{sha:''},/source SHA/]
])test(title,()=>assert.throws(()=>sourceGate(git,{...event,...delta}),regex));
for(const [name,where,mutate,regex] of [
 ['reject modified Worker',c=>c==='diff-tree',s=>s+'M\0public/outfit-worker-p94.mjs\0',/unexpected/],
 ['reject changed original tracing module',(c,x)=>c==='rev-parse'&&x===head+':research/main1054/original-ort-native-trace.mjs',()=> '0'.repeat(40),/original/],
 ['reject swapped P94 owner runner',(c,x)=>c==='rev-parse'&&x===head+':scripts/test-parallel94-native-p88-browser.mjs',()=> '0'.repeat(40),/original/],
 ['reject missing source',(c)=>c==='diff-tree',()=>'',/unexpected/],
 ['reject symlinked workflow',(c)=>c==='ls-tree',()=> '120000 blob x',/file mode/],
 ['reject wrong ancestor',(c)=>c==='merge-base',()=> 'not ancestor',/ancestry/],
])test(name,()=>assert.throws(()=>sourceGate(wrap(where,mutate),event),regex));
test('categorize native WASM bounds distinctly from allocation/abort without revealing message',()=>{
 assert.equal(classifyNativeError(new WebAssembly.RuntimeError('memory access out of bounds at secret')), 'wasm-bounds');
 assert.equal(classifyNativeError(new WebAssembly.RuntimeError('out of memory')), 'oom-or-alloc');
 assert.equal(classifyNativeError(new WebAssembly.RuntimeError('unreachable')), 'abort');
 assert.equal(classifyNativeError(new WebAssembly.RuntimeError('misc')), 'wasm-runtime-other');
 assert.equal(classifyNativeError(new TypeError('bad type')), 'js-type');
 assert.equal(classifyNativeError(new Error('unmatched')), 'other');
});
test('page accounting is explicit and bounded',()=>{
 assert.equal(pages(256*65536),256);
 assert.equal(pages(767*65536),767);
 assert.equal(pages(null),null);
 assert.equal(pages(4),null);
 assert.equal(pages(-65536),null);
 assert.equal(pages(4_294_967_296+65536),null);
});
const meta={engine:'webkit',width:390,ordinal:1};
const mark=(name,x)=>name+' '+JSON.stringify(x)+'\n';
const redTrace=mark('CC_NATIVE_ORT_TRACE',{asset:'ort-wasm-simd-threaded.jsep.mjs',id:6,operation:'OrtCreateSession',phase:'throw',value:[]});
const redEvent=mark('M278_NATIVE_SESSION_THROW',{kind:'wasm-bounds',wasmRuntime:true,
 beforePages:364,afterPages:756,visibleGrows:4,wasmFrames:0});
test('a real session exception remains RED even if private owner fallback worked',()=>{
 const r=classifyRun(redTrace+redEvent,1,meta);
 assert.equal(r.originalJourneyRed,true);
 assert.equal(r.originalModelPositive,false);
 assert.equal(r.nativeSessionThrew,true);
 assert.equal(r.nativeExceptionType,'wasm-bounds');
 assert.equal(r.heapPagesBefore,364);
 assert.equal(r.heapPagesAfter,756);
 assert.equal(r.memoryAttributionProven,false);
 assert.equal(r.permanentFixProven,false);
 assert.equal(r.familyAlpha,'HOLD');
 assert.ok(!JSON.stringify(r).includes('secret'));
});
test('original native success requires P91 and actual OrtRun return 0',()=>{
 const good=mark('CC_NATIVE_ORT_TRACE',{asset:'ort-wasm-simd-threaded.jsep.mjs',id:12,
 operation:'OrtRun',phase:'return',value:0})+
  mark('M278_NATIVE_SESSION_MEMORY',{beforePages:364,afterPages:756,visibleGrows:4})+
  mark('P91_FULL_JOURNEY_PASS',{engine:'webkit'});
 const r=classifyRun(good,0,meta);
 assert.equal(r.originalModelPositive,true);
 assert.equal(r.nativeSessionThrew,false);
 assert.equal(r.nativeExceptionType,null);
 assert.equal(r.heapPagesAfter,756);
});
test('a native OrtCreateSession throw cannot be promoted by a fabricated P91 pass',()=>{
 const bad=redTrace+redEvent+mark('CC_NATIVE_ORT_TRACE',{asset:'ort-wasm-simd-threaded.jsep.mjs',id:12,
  operation:'OrtRun',phase:'return',value:0})+mark('P91_FULL_JOURNEY_PASS',{engine:'webkit'});
 assert.throws(()=>classifyRun(bad,0,meta),/cannot be a PASS/);
});
test('reject duplicate or mutually contradictory session markers',()=>{
 assert.throws(()=>classifyRun(redTrace+redEvent+redEvent,1,meta),/duplicated/);
 assert.throws(()=>classifyRun(redTrace+redEvent+mark('M278_NATIVE_SESSION_MEMORY',{
  beforePages:364,afterPages:756,visibleGrows:4}),1,meta),/contradictory/);
});
test('missing native typed marker never invents WASM-bound error',()=>{
 const r=classifyRun(redTrace,1,meta);
 assert.equal(r.nativeSessionThrew,true);
 assert.equal(r.nativeExceptionType,null);
 assert.equal(r.heapPagesBefore,null);
});
test('reject invalid numeric pages, visibility or exception classification',()=>{
 for(const m of [
  {kind:'other',wasmRuntime:true,beforePages:-1,afterPages:756,visibleGrows:0,wasmFrames:0},
  {kind:'unsafe',wasmRuntime:false,beforePages:364,afterPages:756,visibleGrows:0,wasmFrames:0},
  {kind:'wasm-bounds',wasmRuntime:true,beforePages:364,afterPages:756,visibleGrows:Infinity,wasmFrames:0},
  {kind:'wasm-bounds',wasmRuntime:true,beforePages:364,afterPages:756,visibleGrows:4,wasmFrames:30}
 ])assert.throws(()=>classifyRun(redTrace+mark('M278_NATIVE_SESSION_THROW',m),1,meta));
});
test('upstream exact asset SHA rejects substituted fake ORT glue',()=>{
 assert.throws(()=>instrument('ort-wasm-simd-threaded.jsep.mjs',Buffer.from('mock'),'http://localhost/x'),/SHA mismatch/);
});
test('upstream original-browser source pin rejects fake model/owner test',()=>{
 assert.throws(()=>deriveM278('fake runner','fake worker'),/source SHA drift|Git blob drift/);
});
