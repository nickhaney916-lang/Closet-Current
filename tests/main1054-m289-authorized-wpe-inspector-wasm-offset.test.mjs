import test from 'node:test';
import assert from 'node:assert/strict';
import {
 parent,branch,paths,pins,pinnedEnvironment,sourceGate,parseLocalInspectorPaths,
 classifyInspectorPause,adjudicate
} from '../research/main1054/m289-authorized-wpe-inspector-wasm-offset.mjs';
const receipt={
 schema:'M289_PINNED_WEBKIT_READONLY_INSPECTOR_CAPABILITY_V1',
 browser:'playwright@1.56.1',nativeWebkit:'26.0',
 inspectorBoundToLoopback:true,syntheticOnly:true,originalModelExecuted:false,
 syntheticTrapObserved:true,syntheticNativeFunctionIndex:0,
 knownOriginalTinyLoadFileOffset:44,
 inspectorHttpReachable:false,inspectorWebSocketConnected:false,
 inspectorDebuggerEnabled:false,inspectorExceptionPauseObserved:false,
 syntheticInspectorFileOffset:null,nativeMachinePcCaptured:false,
 sameProcessOriginalJsepAttested:false,
 realOriginalOrtCreateSessionWasmRedObserved:false,
 originalOrtTrapByteOffset:null,originalCxxSourceStatement:null,
 nativeCausalFixProven:false,releaseAllowed:false,familyAlpha:'HOLD'
};
test('M289 is only original pinned WebKit, local-only inspector and known synthetic file opcode',()=>{
 assert.equal(pinnedEnvironment.browser,'playwright@1.56.1');
 assert.equal(pinnedEnvironment.nativeWebkit,'26.0');
 assert.equal(pinnedEnvironment.inspectorLoopback,'127.0.0.1:17651');
 assert.equal(pinnedEnvironment.syntheticWasmbinaryBytes,48);
 assert.equal(pinnedEnvironment.syntheticKnownLoadFileOffset,44);
 assert.equal(adjudicate(receipt),receipt);
});
test('read-only HTTP target extraction only permits bounded local /socket names',()=>{
 const doc='<a href="/socket/12/34/page">wpe</a><a href="/socket/12/34/page">same</a>'+
 '<a href="http://attacker.test/socket/5">bad</a>'+
 '<a href="/socket/../../secret">invalid</a>'+
 '<a href="/socket/hello?host=remote">invalid</a>';
 assert.deepEqual(parseLocalInspectorPaths(doc),['/socket/12/34/page']);
 assert.deepEqual(parseLocalInspectorPaths(''),[]);
 assert.throws(()=>parseLocalInspectorPaths('x'.repeat(65537)),/M289 FAIL-CLOSED/);
 assert.throws(()=>parseLocalInspectorPaths(null),/M289 FAIL-CLOSED/);
});
test('synthetic WebInspector exception reason/locations are not an actual original native PC',()=>{
 const event={method:'Debugger.paused',params:{reason:'exception',callFrames:[
  {functionName:'wasm-function[0]',url:'wasm://wasm/module',location:{
   lineNumber:0,columnNumber:44
  }}
 ]}};
 const p=classifyInspectorPause(event);
 assert.equal(p.wasmFramePresented,true);
 assert.equal(p.actualSyntheticOpcodeOffsetVerified,44);
 assert.equal(p.nativeMachinePcCaptured,false);
 assert.equal(p.originalOrtCreateSessionTrapPc,null);
 assert.equal(classifyInspectorPause({method:'Debugger.resumed'}),null);
});
test('an arbitrary JS line 44 does not prove native WASM instruction offset',()=>{
 const p=classifyInspectorPause({method:'Debugger.paused',params:{reason:'exception',
  callFrames:[{functionName:'plain-js',url:'https://example.test/a.js',
   location:{lineNumber:44,columnNumber:1}}]}});
 assert.equal(p.actualSyntheticOpcodeOffsetVerified,null);
 assert.equal(p.wasmFramePresented,false);
});
test('wrong synthetic instruction, missing real debugger pause or arbitrary offset fail closed',()=>{
 for(const patch of [{syntheticInspectorFileOffset:43},
  {syntheticInspectorFileOffset:44},{syntheticTrapObserved:false},
  {syntheticNativeFunctionIndex:4846},
  {nativeWebkit:'27.0'},{browser:'playwright@latest'},
  {inspectorBoundToLoopback:false},{syntheticOnly:false},
  {originalModelExecuted:true}])
  assert.throws(()=>adjudicate({...receipt,...patch}),/M289 FAIL-CLOSED/);
 const proved={...receipt,inspectorHttpReachable:true,
  inspectorWebSocketConnected:true,inspectorDebuggerEnabled:true,
  inspectorExceptionPauseObserved:true,syntheticInspectorFileOffset:44};
 assert.equal(adjudicate(proved),proved);
});
test('native pc, original WASM trap, C++ line, causal fix, release never inferred from synthetic',()=>{
 for(const patch of [{nativeMachinePcCaptured:true},
  {sameProcessOriginalJsepAttested:true},
  {realOriginalOrtCreateSessionWasmRedObserved:true},
  {originalOrtTrapByteOffset:44},
  {originalCxxSourceStatement:'WasmMemory.cpp:10'},
  {nativeCausalFixProven:true},{releaseAllowed:true},{familyAlpha:'GO'}])
  assert.throws(()=>adjudicate({...receipt,...patch}),/M289 FAIL-CLOSED/);
});
test('exact first-attempt only source-gate holds original M287/M285/M281/Worker unmodified',()=>{
 const sha='a'.repeat(40),e={name:'push',ref:branch,attempt:'1',sha};
 const git=(command,...args)=>{
  if(command==='rev-parse')return args[0]==='HEAD'?sha:pins[args[0].slice(sha.length+1)]||'wrong';
  if(command==='merge-base')return '';
  if(command==='diff-tree')return paths.map(x=>'A\0'+x+'\0').join('');
  if(command==='ls-tree')return '100644 blob '+'b'.repeat(40);
  throw Error('bad git');
 };
 assert.deepEqual(sourceGate(git,e),{
  originalWebkitAndModelUnmodified:true,originalM279RedPreserved:true,
  noSandboxOrPtraceOverride:true,familyAlpha:'HOLD'});
 for(const patch of [{name:'pull_request_target'},{ref:'refs/heads/main'},
  {attempt:'2'},{sha:''}])
  assert.throws(()=>sourceGate(git,{...e,...patch}),/M289 FAIL-CLOSED/);
 assert.throws(()=>sourceGate((...a)=>a[0]==='diff-tree'?
  'M\0public/outfit-worker-p94.mjs\0':git(...a),e),/M289 FAIL-CLOSED/);
 assert.throws(()=>sourceGate((...a)=>a[0]==='rev-parse'&&
  a[1]===sha+':public/outfit-worker-p94.mjs'?'f'.repeat(40):git(...a),e),
  /M289 FAIL-CLOSED/);
});
test('synthetic-trap source never claims true original binary or permitted ptrace access',()=>{
 const r=adjudicate(receipt);
 assert.equal(r.realOriginalOrtCreateSessionWasmRedObserved,false);
 assert.equal(r.sameProcessOriginalJsepAttested,false);
 assert.equal(r.originalOrtTrapByteOffset,null);
});
