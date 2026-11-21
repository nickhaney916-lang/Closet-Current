import test from 'node:test';
import assert from 'node:assert/strict';
import {
 parent,branch,additions,pinned,sourceGate,originalRed,expectedWpePath,
 processKind,classifyContentProcess,candidateDecision,classifyGdbTranscript,adjudicate
} from '../research/main1054/m284-wpe-native-process-discovery.mjs';
const sha='a'.repeat(40),e={name:'push',ref:branch,sha,attempt:'1'};
function git(cmd,...args){
 if(cmd==='rev-parse')return args[0]==='HEAD'?sha:(pinned[args[0].slice(sha.length+1)]||'b'.repeat(40));
 if(cmd==='merge-base')return '';
 if(cmd==='diff-tree')return additions.map(p=>'A\0'+p+'\0').join('');
 if(cmd==='ls-tree')return '100644 blob '+'b'.repeat(40);
 throw Error('unplanned git command');
}
const changed=(check,answer)=>(...args)=>check(...args)?answer:git(...args);
test('original M279 RED and protected real app/workers unchanged; repair not claimed',()=>{
 assert.deepEqual(sourceGate(git,e),{source:'PASS',genuineHistoricalRedPreserved:true,
  originalWorkerUnchanged:true,nativeOriginalTrapOffsetKnown:false,
  causalFixProven:false,familyAlpha:'HOLD'});
 assert.equal(originalRed.originalRunId,44640727828);
 assert.equal(originalRed.originalFailingJobId,135971719127);
 assert.deepEqual(originalRed.functionIndices,[4846,1384,11276,7427]);
 assert.equal(originalRed.originalTrapOffset,null);
});
test('source guard rejects reruns, wrong branch, edits, unsafe modes and changed worker',()=>{
 for(const change of [{name:'pull_request_target'},{ref:'refs/heads/main'},
  {sha:'0'.repeat(40)},{attempt:'2'},{sha:''}])
  assert.throws(()=>sourceGate(git,{...e,...change}),/M284 FAIL-CLOSED/);
 assert.throws(()=>sourceGate(changed((cmd)=>cmd==='merge-base','bad'),e),/source parent/);
 assert.throws(()=>sourceGate(changed((cmd)=>cmd==='diff-tree','M\0public/outfit-worker-p94.mjs\0'),e),/protected source/);
 assert.throws(()=>sourceGate(changed((cmd)=>cmd==='ls-tree','120000 blob fake'),e),/unsafe/);
 assert.throws(()=>sourceGate(changed((cmd,arg)=>cmd==='rev-parse'&&arg===sha+':public/outfit-worker-p94.mjs','0'.repeat(40)),e),/source drift/);
});
test('new WPE headless WebContent is recognized; original GTK matcher is not used blindly',()=>{
 assert.equal(processKind('WPEWebProcess',expectedWpePath),'WPE_WEB_CONTENT');
 assert.equal(processKind('WebKitWebProces','/other/WebKitWebProcess'),'GTK_WEB_CONTENT');
 assert.equal(processKind('WebKitWebProcess','/other/WebKitWebProcess'),'GTK_WEB_CONTENT');
 for(const [comm,exe] of [
  ['WPEWebProcess','/bad/WPEWebProcessFake'],['WPEWebProc','/bad/WPEWebProcess'],
  ['WPEWebProcess','/bad/WebKitWebProcess'],['WPENetworkProcess','/bad/WPENetworkProcess'],
  ['WPEWebProcess','/bad/WPEWebProcess2'],['node','/usr/bin/node'],
  ['','/ms-playwright/webkit/WPEWebProcess']])
  assert.equal(processKind(comm,exe),null,comm);
});
test('only a newly spawned exact pinned WPE binary is eligible for debugger',()=>{
 const w={pid:311,comm:'WPEWebProcess',exe:expectedWpePath};
 const seen=new Set([21]);
 assert.deepEqual(classifyContentProcess(w,seen),{
  kind:'WPE_WEB_CONTENT',present:true,fresh:true,pinnedWpe:true,eligible:true
 });
 assert.equal(classifyContentProcess(w,new Set([311])).eligible,false);
 assert.equal(classifyContentProcess({...w,exe:'/usr/bin/WPEWebProcess'},seen).eligible,false);
 assert.equal(classifyContentProcess({...w,pid:0},seen).eligible,false);
 assert.equal(classifyContentProcess({...w,comm:'WebKitWebProces',exe:'/usr/bin/WebKitWebProcess'},seen).eligible,false);
});
test('new correctly pinned process selected; never attach to ambiguous, old or unrelated',()=>{
 const w={pid:311,comm:'WPEWebProcess',exe:expectedWpePath};
 const old={...w,pid:21},unknown={pid:998,comm:'WPEWebProcess',exe:'/tmp/WPEWebProcess'};
 const ready=candidateDecision([w,old,unknown],new Set([21]));
 assert.equal(ready.classification,'UNIQUE_PINNED_WPE_CONTENT');
 assert.deepEqual(ready.eligible,[w]);
 assert.equal(ready.kinds.wpe,3);
 assert.equal(ready.kinds.missingPinnedBinary,1);
 assert.equal(candidateDecision([w,{...w,pid:312}],new Set()).classification,'AMBIGUOUS_PINNED_CONTENT');
 assert.equal(candidateDecision([unknown],new Set()).classification,'WPE_PRESENT_BUT_UNATTESTED');
 assert.equal(candidateDecision([],new Set()).classification,'NO_WEBKIT_CONTENT_PROCESS');
 assert.throws(()=>candidateDecision([],{}),/unsafe process list/);
});
const receipt={
 schema:'M284_PINNED_WEBKIT_WPE_RENDERER_NATIVE_DEBUG_V1',
 pinnedBrowser:'playwright@1.56.1',browserVersion:'26.0',
 discoveryClass:'UNIQUE_PINNED_WPE_CONTENT',nativeAttachClass:'PERMISSION_DENIED',
 originalModelExecuted:false,syntheticOnly:true,syntheticWasmTrapObserved:true,
 syntheticWasmFrameIndex:0,originalM279WebKitFunctionIndex:4846,
 originalM279WasmTrapInstructionOffset:null,
 originalWasmBinaryVerifiedInThisFailingProcess:false,
 genuineOriginalWasmTrapPcCaptured:false,nativeCausalFixProven:false,
 releaseAllowed:false,familyAlpha:'HOLD'
};
test('permission-denied diagnosis remains a BLOCKER, not native fix',()=>{
 assert.deepEqual(adjudicate(receipt),receipt);
 for(const patch of [
  {originalModelExecuted:true},{syntheticOnly:false},{syntheticWasmFrameIndex:4846},
  {originalM279WasmTrapInstructionOffset:77},{originalWasmBinaryVerifiedInThisFailingProcess:true},
  {genuineOriginalWasmTrapPcCaptured:true},{nativeCausalFixProven:true},
  {releaseAllowed:true},{familyAlpha:'OPEN'},{pinnedBrowser:'playwright@1.65.0'},
  {discoveryClass:'READY_AND_REPAIRED'},{nativeAttachClass:'NATIVE_TRAP_REPAIRED'}])
  assert.throws(()=>adjudicate({...receipt,...patch}),/M284 FAIL-CLOSED/);
});
test('never connect to WPE process that was not verified as pinned and uniquely new',()=>{
 for(const discoveryClass of ['NO_WEBKIT_CONTENT_PROCESS',
  'WPE_PRESENT_BUT_UNATTESTED','AMBIGUOUS_PINNED_CONTENT']){
  assert.deepEqual(adjudicate({...receipt,discoveryClass,nativeAttachClass:'NOT_ATTEMPTED'}),
   {...receipt,discoveryClass,nativeAttachClass:'NOT_ATTEMPTED'});
  assert.throws(()=>adjudicate({...receipt,discoveryClass,nativeAttachClass:'IDLE_ATTACH_AVAILABLE'}),
   /attached to unknown/);
 }
});
test('even a successful real idle attach never proves actual original WASM trap PC',()=>{
 const r=adjudicate({...receipt,nativeAttachClass:'IDLE_ATTACH_AVAILABLE'});
 assert.equal(r.genuineOriginalWasmTrapPcCaptured,false);
 assert.equal(r.nativeCausalFixProven,false);
 assert.equal(r.originalM279WasmTrapInstructionOffset,null);
});


test('GDB outputs become bounded scalar causal blockers, not exposed native stacks',()=>{
 const denied=classifyGdbTranscript('Attaching to process 311\nwarning: ptrace_scope=1\n',1,null);
 assert.equal(denied.ptraceRestrictionMentioned,true);
 assert.equal(denied.targetExitedMentioned,false);
 assert.equal(denied.exitStatus,1);
 assert.equal(denied.unresolvedNativePC,true);
 assert.ok(!JSON.stringify(denied).includes('311'));
 const gone=classifyGdbTranscript('No such process.\n',1,null);
 assert.equal(gone.targetExitedMentioned,true);
 assert.equal(gone.ptraceRestrictionMentioned,false);
 const good=classifyGdbTranscript('rip 0x7fff12345678\nDetaching from program\n',0,null);
 assert.equal(good.registerRipObserved,true);
 assert.equal(good.detachObserved,true);
 assert.equal(good.unresolvedNativePC,true);
 const unverified=classifyGdbTranscript('Unexpected gdb output',1,null);
 assert.equal(unverified.registerRipObserved,false);
 assert.equal(unverified.ptraceRestrictionMentioned,false);
 assert.throws(()=>classifyGdbTranscript('secret'.repeat(40000),1,null),/unbounded/);
});
test('GDB scalar receipt rejects arbitrary fake registers, leaked addresses or implied fix',()=>{
 const safe=classifyGdbTranscript('cannot attach to process due to ptrace_scope',1,null);
 assert.equal(adjudicate({...receipt,safeGdbEvidence:safe}).nativeCausalFixProven,false);
 assert.throws(()=>adjudicate({...receipt,safeGdbEvidence:{...safe,rawStack:'secret'}}),/unbounded or forged/);
 assert.throws(()=>adjudicate({...receipt,safeGdbEvidence:{...safe,unresolvedNativePC:false}}),/unbounded or forged/);
});
