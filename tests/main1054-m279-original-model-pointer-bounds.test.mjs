import assert from 'node:assert/strict';
import test from 'node:test';
import {
 sourceGate,ref,parent,newPaths,pinned,expectedOriginalModelLength,
 assessPointerRange,attachPointerObservation,deriveM279,adjudicateProcess
} from '../research/main1054/m279-original-model-pointer-bounds.mjs';
const head='1'.repeat(40),event={name:'push',ref,sha:head,attempt:'1'};
function git(command,...args){
 if(command==='rev-parse'){
  if(args[0]==='HEAD')return head;
  return pinned[args[0].slice(head.length+1)]||'2'.repeat(40);
 }
 if(command==='merge-base')return '';
 if(command==='diff-tree')return newPaths.map(p=>'A\0'+p+'\0').join('');
 if(command==='ls-tree')return '100644 blob '+ '2'.repeat(40);
 throw Error('Unplanned Git operation');
}
const tamper=(where,edit)=>(...args)=>where(...args)?edit(git(...args)):git(...args);
test('source gate is additive and cannot authorize native fix',()=>{
 const r=sourceGate(git,event);
 assert.equal(r.source,'PASS');
 assert.equal(r.permanentNativeWebKitRepair,'UNPROVEN');
 assert.equal(r.familyAlpha,'HOLD');
});
for(const [name,change,regex] of [
 ['reject wrong ref',{ref:'refs/heads/main'},/event\/ref/],
 ['reject untrusted PR',{name:'pull_request_target'},/event\/ref/],
 ['reject rerun',{attempt:'2'},/rerun/],
 ['reject missing sha',{sha:''},/SHA/],
 ['reject foreign head',{sha:'f'.repeat(40)},/checkout/]
])test(name,()=>assert.throws(()=>sourceGate(git,{...event,...change}),regex));
for(const [title,where,alter,match] of [
 ['reject modified model Worker',c=>c==='diff-tree',x=>x+'M\0public/outfit-worker-p94.mjs\0',/protected/],
 ['reject source gate missing',c=>c==='diff-tree',()=>'',/protected/],
 ['reject foreign ancestry',c=>c==='merge-base',()=> 'not ancestor',/ancestry/],
 ['reject changed exact original model', (c,a)=>c==='rev-parse'&&a===head+':public/outfit-worker-p94.mjs',()=> '0'.repeat(40),/drift/],
 ['reject changed original operation tracer',(c,a)=>c==='rev-parse'&&a===head+':research/main1054/original-ort-native-trace.mjs',()=> '0'.repeat(40),/drift/],
 ['reject changed M278 private owner test',(c,a)=>c==='rev-parse'&&a===head+':scripts/test-parallel94-native-p88-browser.mjs',()=> '0'.repeat(40),/drift/],
 ['reject symlinked workflow',(c)=>c==='ls-tree',()=> '120000 blob x',/nonregular/]
])test(title,()=>assert.throws(()=>sourceGate(tamper(where,alter),event),match));
test('the model byte length and exact positive pointer range fit in 369 WASM pages',()=>{
 const b=assessPointerRange(3100000,expectedOriginalModelLength,369*65536,369*65536,1450000);
 assert.equal(b.modelPointer,3100000);
 assert.equal(b.modelLength,15199746);
 assert.equal(b.modelEnd,18299746);
 assert.equal(b.modelRangeWithinLiveMemory,true);
 assert.equal(b.modelRangeWithinHeapView,true);
 assert.equal(b.heapViewLagDetected,false);
 assert.equal(b.originalFP32ModelLengthMatches,true);
});
test('reject one-byte OOB pointer, buffer overflow and 32-bit integer wrap',()=>{
 const heap=369*65536;
 assert.equal(assessPointerRange(heap-expectedOriginalModelLength+1,expectedOriginalModelLength,heap,heap,1).modelRangeWithinLiveMemory,false);
 assert.equal(assessPointerRange(4294967290,100,heap,heap,1).modelEnd,null);
 assert.equal(assessPointerRange(-1,expectedOriginalModelLength,heap,heap,1).modelPointer,null);
 assert.equal(assessPointerRange(10,-1,heap,heap,1).modelLength,null);
});
test('report stale Emscripten heap view distinctly from live WASM linear memory',()=>{
 const b=assessPointerRange(3100000,expectedOriginalModelLength,767*65536,369*65536,1450000);
 assert.equal(b.heapViewLagDetected,true);
 assert.equal(b.modelRangeWithinLiveMemory,true);
 assert.equal(b.modelRangeWithinHeapView,true);
 const a=assessPointerRange(45000000,100000,767*65536,369*65536,3);
 assert.equal(a.modelRangeWithinLiveMemory,true);
 assert.equal(a.modelRangeWithinHeapView,false);
});
test('unknown true linear memory is never reported as proven in-bounds',()=>{
 assert.equal(assessPointerRange(3,15199746,null,null,0).modelRangeWithinLiveMemory,null);
 assert.equal(assessPointerRange(0,15199746,369*65536,369*65536,0).modelRangeWithinLiveMemory,null);
});
test('the original three-argument call is wrapped without modifying its pointer, length or options',()=>{
 const fake='let __ccNativeMemory=null,__ccNativeGrowCount=0;\nconst Z=__ccNativeWrap(K.Ma,"OrtCreateSession","handle",K))';
 const patched=attachPointerObservation(fake);
 assert.match(patched,/Reflect\.apply\(native,this,args\)/);
 assert.match(patched,/__ccM279BoundWrap\(__ccNativeWrap\(K.Ma,"OrtCreateSession","handle",K\),K\)/);
 assert.match(patched,/M279_NATIVE_MODEL_BOUNDS/);
 assert.equal(patched.includes('_OrtCreateSession('),false);
 assert.throws(()=>attachPointerObservation('wrong source'),/ambiguous/);
});
const mk=(kind,o)=>kind+' '+JSON.stringify(o)+'\n';
const meta={engine:'webkit',width:390,shard:1,ordinal:1};
const base={
 argc:3,modelPointer:3100000,modelLength:15199746,modelEnd:18299746,
 originalFP32ModelLengthMatches:true,liveLinearMemoryBytes:369*65536,
 heapViewBytes:369*65536,modelRangeWithinLiveMemory:true,
 modelRangeWithinHeapView:true,heapViewLagDetected:false,
 sessionOptionsPointer:1450000,optionsPointerWithinLiveMemory:true
};
const entry=mk('M279_NATIVE_MODEL_BOUNDS',{phase:'enter',...base});
const done=mk('M279_NATIVE_MODEL_BOUNDS',{phase:'return',...base,
 liveLinearMemoryBytes:767*65536,heapViewBytes:767*65536});
const originalPositive=mk('CC_NATIVE_ORT_TRACE',{asset:'ort-wasm-simd-threaded.jsep.mjs',
 id:12,operation:'OrtRun',phase:'return',value:0})+
 mk('P91_FULL_JOURNEY_PASS',{engine:'webkit'});
const origRed=mk('CC_NATIVE_ORT_TRACE',{asset:'ort-wasm-simd-threaded.jsep.mjs',
 id:6,operation:'OrtCreateSession',phase:'throw',value:[]});
const red=mk('M279_NATIVE_MODEL_BOUNDS',{phase:'throw',...base,liveLinearMemoryBytes:767*65536,
 heapViewBytes:767*65536,exceptionClass:'wasm-bounds',
 wasmFunctionOffsets:[{functionIndex:345,offset:2345}]});
test('an original native success requires exact original model range and owner positive',()=>{
 const r=adjudicateProcess(entry+done+originalPositive,0,meta);
 assert.equal(r.originalJourneyPositive,true);
 assert.equal(r.entryRangeWithinHeap,true);
 assert.equal(r.modelPointer,3100000);
 assert.equal(r.modelLength,expectedOriginalModelLength);
 assert.equal(r.modelEnd,18299746);
 assert.equal(r.nativeCausalFixProven,false);
 assert.equal(r.familyAlpha,'HOLD');
});
test('an authentic native original throw with valid model range remains RED and preserves numeric wasm function offset',()=>{
 const r=adjudicateProcess(entry+red+origRed,1,meta);
 assert.equal(r.originalRealRed,true);
 assert.equal(r.originalOrtCreateSessionThrew,true);
 assert.equal(r.entryRangeWithinHeap,true);
 assert.equal(r.exitRangeWithinHeap,true);
 assert.equal(r.nativeErrorClass,'wasm-bounds');
 assert.deepEqual(r.nativeFunctionOffsets,[{functionIndex:345,offset:2345}]);
 assert.equal(r.nativeErrorPointerRootCauseProven,false);
 assert.equal(r.releaseAllowed,false);
});
test('an original failing process with no native events is never fabricated as valid',()=>{
 const r=adjudicateProcess(origRed,1,meta);
 assert.equal(r.originalRealRed,true);
 assert.equal(r.entryRangeWithinHeap,null);
 assert.equal(r.nativeFunctionOffsets.length,0);
});
test('no positive result without original native pointer/owner receipt',()=>{
 assert.throws(()=>adjudicateProcess(originalPositive,0,meta),/invented/);
 assert.throws(()=>adjudicateProcess(entry+originalPositive,0,meta),/invented/);
});
for(const [name,changes,match] of [
 ['wrong original count',{modelLength:15199745,originalFP32ModelLengthMatches:false},/original SegFormer/],
 ['out of bounds model range',{modelRangeWithinLiveMemory:false},/not proven/],
 ['missing model pointer',{modelPointer:null},/original model/],
 ['unknown ABI argc',{argc:2},/argument count/]
]){
 test(name,()=>assert.throws(()=>adjudicateProcess(
  mk('M279_NATIVE_MODEL_BOUNDS',{phase:'enter',...base,...changes})+done+originalPositive,0,meta),match));
}
test('a true native RED may not be converted to green through a forged owner success',()=>{
 const r=adjudicateProcess(entry+red+origRed+originalPositive,1,meta);
 assert.equal(r.originalRealRed,true);
 assert.equal(r.originalJourneyPositive,false);
 assert.equal(r.releaseAllowed,false);
});
test('no raw stack or original model bytes appear in the sanitized receipt',()=>{
 const r=adjudicateProcess(entry+red+origRed,1,meta);
 const text=JSON.stringify(r);
 assert.ok(!text.includes('stack'));
 assert.ok(!text.includes('onnx/model.onnx'));
 assert.ok(!text.includes('originalData'));
});
test('pinned original runner refuses fake source before derive',()=>{
 assert.throws(()=>deriveM279('fake','fake'),/source SHA drift|Git blob drift/);
});
