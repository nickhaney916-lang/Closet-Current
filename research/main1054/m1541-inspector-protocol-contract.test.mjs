/** M1541: isolated offline adversarial protocol-contract checks. No browser, native debugger, original model or security changes. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLocalInspectorPaths,classifyInspectorPause,adjudicate,pinnedEnvironment} from './m289-authorized-wpe-inspector-wasm-offset.mjs';

const receipt=()=>({
 schema:'M289_PINNED_WEBKIT_READONLY_INSPECTOR_CAPABILITY_V1',
 browser:pinnedEnvironment.browser,nativeWebkit:pinnedEnvironment.nativeWebkit,
 inspectorBoundToLoopback:true,syntheticOnly:true,originalModelExecuted:false,
 syntheticTrapObserved:true,syntheticNativeFunctionIndex:0,knownOriginalTinyLoadFileOffset:44,
 inspectorHttpReachable:true,inspectorWebSocketConnected:true,
 inspectorDebuggerEnabled:false,inspectorExceptionPauseObserved:false,
 sameProcessOriginalJsepAttested:false,realOriginalOrtCreateSessionWasmRedObserved:false,
 nativeMachinePcCaptured:false,nativeCausalFixProven:false,releaseAllowed:false,
 originalOrtTrapByteOffset:null,originalCxxSourceStatement:null,familyAlpha:'HOLD',
 syntheticInspectorFileOffset:null
});
test('documented local WebPage socket is discoverable; absolute and remote URLs are not',()=>{
 assert.deepEqual(parseLocalInspectorPaths(`window.open('Main.html?ws=' + window.location.host + '/socket/12/34/WebPage')`),['/socket/12/34/WebPage']);
 assert.deepEqual(parseLocalInspectorPaths('https://example.com/socket/12/34/WebPage'),[]);
 // The parser returns a relative path only; callers must construct the loopback URL themselves.
 assert.deepEqual(parseLocalInspectorPaths('/socket/0/34/WebPage /socket/12/0/WebPage'),[]);
});
test('invalid or oversized inspector listing is rejected',()=>{
 assert.throws(()=>parseLocalInspectorPaths('x'.repeat(65537)),/FAIL-CLOSED/);
 assert.throws(()=>parseLocalInspectorPaths(null),/FAIL-CLOSED/);
});
test('non-pause events never become evidence',()=>{
 assert.equal(classifyInspectorPause({method:'Target.targetCreated',params:{}}),null);
 assert.equal(classifyInspectorPause({method:'Debugger.resumed'}),null);
});
test('synthetic line or column 44 never becomes a native WASM byte offset',()=>{
 const result=classifyInspectorPause({method:'Debugger.paused',params:{reason:'exception',callFrames:[{functionName:'wasm-function[0]',location:{lineNumber:44,columnNumber:44}}]}});
 assert.equal(result.actualSyntheticOpcodeOffsetVerified,44); // synthetic-only candidate, not original-model proof
 assert.equal(result.nativeMachinePcCaptured,false);
 assert.equal(result.originalOrtCreateSessionTrapPc,null);
});
test('malformed null debugger frame cannot fabricate native evidence',()=>{
 const result=classifyInspectorPause({method:'Debugger.paused',params:{callFrames:[null]}});
 assert.equal(result.actualSyntheticOpcodeOffsetVerified,null);
 assert.equal(result.nativeMachinePcCaptured,false);
 assert.equal(result.originalOrtCreateSessionTrapPc,null);
});
test('synthetic evidence passes only with native and release claims withheld',()=>{
 assert.equal(adjudicate(receipt()).familyAlpha,'HOLD');
 for(const [field,value] of [['nativeMachinePcCaptured',true],['releaseAllowed',true],['sameProcessOriginalJsepAttested',true],['originalOrtTrapByteOffset',44],['syntheticInspectorFileOffset',44],['inspectorBoundToLoopback',false]]){
  const candidate={...receipt(),[field]:value};
  assert.throws(()=>adjudicate(candidate),/FAIL-CLOSED/,field);
 }
});
