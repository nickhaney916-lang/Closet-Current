import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {MODEL_ID,MODEL_REVISION,MODEL_PATH,parsePinnedHfMetadata,
 locateNativeModelSessionCall,instrumentOriginalGraphSession}
 from '../scripts/main243-original-segformer-native-abi.mjs';

const hash=s=>createHash('sha256').update(s).digest('hex');
const fixture='const p=wasm._OrtCreateSessionOptions(0,!!options.enableCpuMemArena,!!options.enableMemPattern,0);return wasm._OrtCreateSession(1,2,p);';
function withReceipts(run){
 const a=globalThis.__m242OrtAbiCalls,b=globalThis.__m243SessionCalls;
 try{
  globalThis.__m242OrtAbiCalls=[];globalThis.__m243SessionCalls=[];
  return run();
 }finally{
  if(a===undefined)delete globalThis.__m242OrtAbiCalls;else globalThis.__m242OrtAbiCalls=a;
  if(b===undefined)delete globalThis.__m243SessionCalls;else globalThis.__m243SessionCalls=b;
 }
}
test('M243 original SegFormer model ID/revision/ONNX graph remain immutable',()=>{
 assert.equal(MODEL_ID,'Xenova/segformer_b0_clothes');
 assert.equal(MODEL_REVISION,'a2489ea8e7ec1ee912190546bad31a4906ccca76');
 assert.equal(MODEL_PATH,'onnx/model.onnx');
});
test('M243 metadata must source-attest the EXACT original model LFS SHA256 and bounds',()=>{
 const valid={path:MODEL_PATH,size:9000000,lfs:{sha256:'a'.repeat(64)}};
 assert.deepEqual(parsePinnedHfMetadata([valid]),{path:MODEL_PATH,size:9000000,sha256:'a'.repeat(64)});
 assert.throws(()=>parsePinnedHfMetadata([{...valid,lfs:{}}]),/SHA256 unavailable/);
 assert.throws(()=>parsePinnedHfMetadata([valid,valid]),/ambiguous/);
 assert.throws(()=>parsePinnedHfMetadata([{...valid,size:1}]),/Unexpected/);
 assert.throws(()=>parsePinnedHfMetadata([{...valid,path:'onnx/model_quantized.onnx'}]),/missing/);
});
test('M243 only one actual original WASM native session export call qualifies',()=>{
 assert.equal(locateNativeModelSessionCall(fixture).receiver,'wasm');
 assert.throws(()=>locateNativeModelSessionCall(fixture+fixture),/one and only one/);
 assert.throws(()=>locateNativeModelSessionCall(fixture.replace('_OrtCreateSession(', '_OrtCreateSessionXXX(')),/one and only one/);
});
test('M243 both native options and session exported functions invoked; real return untouched',()=>withReceipts(()=>{
 const derived=instrumentOriginalGraphSession(fixture,hash(fixture));
 let n=0;
 const wasm={
  _OrtCreateSessionOptions(...args){n++;assert.equal(args[1],true);assert.equal(args[2],false);return 42;},
  _OrtCreateSession(...args){n++;assert.deepEqual(args,[1,2,42]);return 99;}
 };
 const returnValue=new Function('wasm','options',derived.content)(wasm,
  {enableCpuMemArena:true,enableMemPattern:false});
 assert.equal(returnValue,99);
 assert.equal(n,2);
 assert.equal(globalThis.__m242OrtAbiCalls.length,1);
 assert.equal(globalThis.__m242OrtAbiCalls[0].memPatternFlag,false);
 assert.equal(globalThis.__m243SessionCalls.length,1);
 assert.equal(globalThis.__m243SessionCalls[0].returnedHandle,true);
 assert.equal(derived.audit.CAllocatorStateObserved,false);
}));
test('M243 original native session error identity remains unchanged and RED',()=>withReceipts(()=>{
 const e=new WebAssembly.RuntimeError('controlled synthetic original model create failed');
 const source=instrumentOriginalGraphSession(fixture,hash(fixture)).content;
 const wasm={_OrtCreateSessionOptions(){return 3;},_OrtCreateSession(){throw e;}};
 assert.throws(()=>new Function('wasm','options',source)(wasm,
  {enableCpuMemArena:true,enableMemPattern:true}),x=>x===e);
 assert.equal(globalThis.__m243SessionCalls[0].threw,true);
 assert.equal(globalThis.__m243SessionCalls[0].errorName,'RuntimeError');
 assert.equal(globalThis.__m243SessionCalls[0].returnedHandle,false);
 assert.ok(!JSON.stringify(globalThis.__m243SessionCalls).includes(e.message));
}));
test('M243 cannot silently change original consumer or claim a WebKit fix',async()=>{
 const src=await readFile('scripts/test-main243-original-segformer-native-session-browser.mjs','utf8');
 assert.ok(src.includes('Original pinned SegFormer WASM model session failed, preserve genuine RED'));
 assert.ok(src.includes('originalOwnerPhotoJourneyNotRun:true'));
 assert.ok(src.includes('permanentWebkitFixClaim:false'));
 assert.ok(src.includes('CAllocatorStateObserved:false'));
 assert.ok(!src.includes('sessionOptions.enableMemPattern=true'));
});
