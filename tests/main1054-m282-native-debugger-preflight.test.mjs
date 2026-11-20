import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceGate,branch,additions,pins,classifyAttach,adjudicate,isWebKitContentProcess}
 from '../research/main1054/m282-native-debugger-preflight.mjs';
const sha='a'.repeat(40),event={name:'push',ref:branch,attempt:'1',sha};
function git(cmd,...args){
 if(cmd==='rev-parse')return args[0]==='HEAD'?sha:pins[args[0].slice(sha.length+1)]??'not-pinned';
 if(cmd==='merge-base')return '';
 if(cmd==='diff-tree')return additions.map(p=>'A\0'+p+'\0').join('');
 if(cmd==='ls-tree')return '100644 blob '+'b'.repeat(40);
 throw Error('unexpected git stub');
}
test('immutable original WASM, Worker, M279 fail and M281 source stay unchanged',()=>{
 assert.deepEqual(sourceGate(git,event),{exactOriginalSourcePreserved:true,
  familyAlpha:'HOLD',permanentWebKitRepair:false});
});
test('deny unapproved branch, rerun, unexpected source changes or worker drift',()=>{
 for(const changed of [{name:'pull_request_target'},{ref:'refs/heads/main'},{attempt:'2'},{sha:''}])
  assert.throws(()=>sourceGate(git,{...event,...changed}),/M282 BLOCKED/);
 assert.throws(()=>sourceGate((...a)=>a[0]==='diff-tree'?'M\0public/outfit-worker-p94.mjs\0':git(...a),event),/unexpected protected/);
 assert.throws(()=>sourceGate((...a)=>a[0]==='ls-tree'?'120000 blob symlink':git(...a),event),/unsafe research path/);
 assert.throws(()=>sourceGate((...a)=>a[0]==='rev-parse'&&a[1]===sha+':public/outfit-worker-p94.mjs'?'0'.repeat(40):git(...a),event),/source drift/);
});
test('Linux WebKitWebProcess executable truncated in /proc/comm is discoverable',()=>{
 assert.equal(isWebKitContentProcess('WebKitWebProces','',''),true);
 assert.equal(isWebKitContentProcess('','/ms-playwright/webkit/ WebKitWebProcess',''),false);
 assert.equal(isWebKitContentProcess('','/ms-playwright/webkit/WebKitWebProcess --token=none',''),true);
 assert.equal(isWebKitContentProcess('','', '/ms-playwright/webkit/WebKitWebProcess'),true);
 assert.equal(isWebKitContentProcess('node','node research/main1054/m282-native-debugger-preflight.mjs','/usr/bin/node'),false);
 assert.equal(isWebKitContentProcess('WebKitNetworkPro','',''),false);
});
test('gdb denied ptrace stays an explicit blocker, never calls this a fix',()=>{
 const x=classifyAttach('ptrace: Operation not permitted.\n',1,null);
 assert.equal(x.className,'PERMISSION_DENIED');
 assert.equal(x.permissionDenied,true);
 assert.equal(x.attachmentPossible,false);
 assert.equal(x.originalFailureInstructionOffset,null);
});
test('idle native attachment does not establish original WASM fault offset',()=>{
 const x=classifyAttach('rip 0x00007fefab123456\nDetaching from program: /test',0,null);
 assert.equal(x.className,'IDLE_ATTACH_AVAILABLE');
 assert.equal(x.attachmentPossible,true);
 assert.equal(x.genuineWasmTrapSiteCaptured,false);
 assert.equal(x.originalFaultingAddress,null);
});
test('unsupported/missing/timed-out debugger is not quietly marked positive',()=>{
 assert.equal(classifyAttach('no such file or directory',1,null).className,'DEBUGGER_OR_TARGET_UNAVAILABLE');
 assert.equal(classifyAttach('nothing reported',null,'SIGTERM').className,'ATTACH_TIMED_OUT');
 assert.equal(classifyAttach('nothing reported',1,null).className,'ATTACH_UNVERIFIED');
});
const clean={
 schema:'M282_PINNED_WEBKIT_DEBUGGER_PREFLIGHT_V1',nativeAttachClass:'PERMISSION_DENIED',
 originalModelExecuted:false,syntheticOnly:true,
 syntheticWasmTrapObserved:true,syntheticWasmFrameIndex:0,
 genuineWasmTrapSiteCaptured:false,originalFailureInstructionOffset:null,
 permanentRepairProven:false,familyAlpha:'HOLD'
};
test('separate synthetic WASM control is never original-model proof',()=>{
 assert.deepEqual(adjudicate(clean),clean);
 for(const x of [{...clean,originalModelExecuted:true},{...clean,syntheticOnly:false},
  {...clean,genuineWasmTrapSiteCaptured:true},
  {...clean,originalFailureInstructionOffset:123},
  {...clean,permanentRepairProven:true},{...clean,familyAlpha:'OPEN'},
  {...clean,syntheticWasmFrameIndex:4846},
  {...clean,nativeAttachClass:'TRUE_NATIVE_FIX'}])
  assert.throws(()=>adjudicate(x),/M282 BLOCKED/);
});
