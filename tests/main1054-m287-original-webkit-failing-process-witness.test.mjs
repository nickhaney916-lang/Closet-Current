import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceGate,branch,added,fixed,assessTrial,adjudicate}
 from '../research/main1054/m287-original-webkit-failing-process-witness.mjs';
test('freeze one original model, exact first attempt and historical authentic red',()=>{
 assert.equal(fixed.engine,'webkit');assert.equal(fixed.width,430);
 assert.equal(fixed.attempts,72);
 assert.equal(fixed.shards*fixed.perShard,fixed.attempts);
 assert.equal(fixed.originalHistoricalFailRun,44640727828);
 assert.equal(fixed.originalHistoricalFailJob,135971719127);
 assert.deepEqual(fixed.originalHistoricalNativeFrames,[4846,1384,11276,7427]);
 assert.equal(fixed.originalHistoricalTrapOffset,null);
 assert.equal(fixed.originalModelBytes,15199746);
 assert.equal(fixed.originalJsepSha256,
  'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39');
});
test('missing original process log is blocked, not a faked WebKit native exception',()=>{
 const r=assessTrial('sanitized blank',1,{engine:'webkit',width:430,shard:2,ordinal:1});
 assert.equal(r.verdict,'ORIGINAL_UNATTRIBUTED_RED_OR_BLOCKED');
 assert.equal(r.genuineOriginalOrtCreateSessionBoundsRed,false);
 assert.equal(r.sameFailingProcessOriginalJsepSHA256Attested,false);
 assert.equal(r.exactOriginalWasmInstructionOffset,null);
});
test('browser process exit 0 without genuine owner source never becomes pass',()=>{
 const r=assessTrial('P91_FULL_JOURNEY_PASS fake',0,{engine:'webkit',width:430,shard:1,ordinal:2});
 assert.equal(r.verdict,'ORIGINAL_UNATTRIBUTED_RED_OR_BLOCKED');
});
test('forged single native model pointer marker is not original model red',()=>{
 const fake={phase:'throw',modelPointer:8933688,modelLength:15199746,
  modelEnd:24133434,modelRangeWithinLiveMemory:true,
  wasmFunctionOffsets:[{functionIndex:4846,offset:null}]};
 const r=assessTrial('M279_NATIVE_MODEL_BOUNDS '+JSON.stringify(fake),1,
  {engine:'webkit',width:430,shard:2,ordinal:3});
 assert.equal(r.genuineOriginalOrtCreateSessionBoundsRed,false);
 assert.equal(r.sameFailingProcessOriginalJsepSHA256Attested,false);
});
test('unsupported engine, source width, ordinal or nonintegral exit fail closed',()=>{
 for(const meta of [{engine:'chromium'}, {width:390},{shard:0},{shard:13},
  {ordinal:0},{ordinal:7}]){
  assert.throws(()=>assessTrial('abc',1,{engine:'webkit',width:430,shard:1,ordinal:1,...meta}),
   /M287 BLOCKED/);
 }
 assert.throws(()=>assessTrial('abc',-1,{engine:'webkit',width:430,shard:1,ordinal:1}),
  /M287 BLOCKED/);
 assert.throws(()=>assessTrial('a'.repeat(3000001),1,
  {engine:'webkit',width:430,shard:1,ordinal:1}),/M287 BLOCKED/);
});
const safe={
 schema:'M287_ORIGINAL_NATIVE_SAME_PROCESS_RED_WITNESS_V1',engine:'webkit',width:430,
 firstAttempt:true,verdict:'ORIGINAL_UNATTRIBUTED_RED_OR_BLOCKED',
 genuineOriginalOrtCreateSessionBoundsRed:false,
 sameFailingProcessOriginalJsepSHA256Attested:false,
 sameProcessJsepShaVerified:false,exactOriginalWasmInstructionOffset:null,
 sourceLevelCxxStatement:null,actualCausalFixDemonstrated:false,
 originalRuntimeOrModelChanged:false,releaseAllowed:false,familyAlpha:'HOLD'
};
test('never claim a WebKit trap PC, C++ line, fixed runtime, or lift HOLD',()=>{
 assert.equal(adjudicate(safe),safe);
 for(const patch of [{exactOriginalWasmInstructionOffset:44},
  {sourceLevelCxxStatement:'allocator.cc:10'},{actualCausalFixDemonstrated:true},
  {originalRuntimeOrModelChanged:true},{releaseAllowed:true},{familyAlpha:'GO'},
  {engine:'chromium'},{width:390},{firstAttempt:false},
  {verdict:'NATIVE_TRAP_FIXED'},
  {genuineOriginalOrtCreateSessionBoundsRed:true},
  {sameFailingProcessOriginalJsepSHA256Attested:true}])
  assert.throws(()=>adjudicate({...safe,...patch}),/M287 BLOCKED/);
});
test('a bounds RED may only attest binary from SAME failing process',()=>{
 const r={...safe,verdict:'GENUINE_ORIGINAL_NATIVE_WASM_BOUNDS_RED',
  genuineOriginalOrtCreateSessionBoundsRed:true,
  sameFailingProcessOriginalJsepSHA256Attested:true,sameProcessJsepShaVerified:true};
 assert.equal(adjudicate(r).exactOriginalWasmInstructionOffset,null);
 assert.throws(()=>adjudicate({...r,sameProcessJsepShaVerified:false}),/M287 BLOCKED/);
});
test('source gate rejects modified original Worker, unauthorized reruns, and extra files',()=>{
 const sha='a'.repeat(40),pins={
  'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
  'research/main1054/m285-original-heap-view-witness.mjs':'46127fd4e1cf23426473235e0b6b929ce3d5832f',
  'research/main1054/m283-real-jsep-instantiation.mjs':'6c4ad406643871851c9c21e6b324d67ef9d992a9',
  'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11',
  'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41'
 };
 const g=(cmd,...args)=>{
  if(cmd==='rev-parse')return args[0]==='HEAD'?sha:pins[args[0].slice(sha.length+1)]||'missing';
  if(cmd==='merge-base')return '';
  if(cmd==='diff-tree')return added.map(p=>'A\0'+p+'\0').join('');
  if(cmd==='ls-tree')return '100644 blob '+'b'.repeat(40);
  throw Error('bad stub');
 };
 const event={name:'push',ref:branch,attempt:'1',sha};
 assert.equal(sourceGate(g,event).originalNativeWasmUnchanged,true);
 for(const patch of [{name:'pull_request_target'},{ref:'refs/heads/main'},
  {attempt:'2'},{sha:''}])
  assert.throws(()=>sourceGate(g,{...event,...patch}),/M287 BLOCKED/);
 assert.throws(()=>sourceGate((...x)=>x[0]==='diff-tree'?
  'M\0public/outfit-worker-p94.mjs\0':g(...x),event),/M287 BLOCKED/);
 assert.throws(()=>sourceGate((...x)=>x[0]==='rev-parse'&&
  x[1]===sha+':public/outfit-worker-p94.mjs'?'0'.repeat(40):g(...x),event),
  /M287 BLOCKED/);
});
test('the original application and research M285 code remain byte-untouched',()=>{
 const original=readFileSync('public/outfit-worker-p94.mjs','utf8');
 const native=readFileSync('research/main1054/m285-original-heap-view-witness.mjs','utf8');
 assert.doesNotMatch(original,/M287_/);
 assert.doesNotMatch(native,/M287_/);
});
