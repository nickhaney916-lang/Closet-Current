import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {
 M251_WORKER_NATIVE_ABI_PROBE,M251_ORIGINAL_BROWSER_REPORT_EXTENSION,
 makeM251WorkerSource,instrumentM251OriginalM250Runner,
 classifyM251OriginalNative
} from '../scripts/main251-original-jsep-native-option-abi.mjs';
import {injectOriginalResearchArm} from '../scripts/main250-original-jsep-mempattern-study.mjs';

function actual({engine='webkit',arm='baseline',width=320,flag=1,originalPositive=true,changes={}}={}){
 const witness={
  schema:'M251_REAL_ORIGINAL_JSEP_NATIVE_OPTIONS_ABI/v1',
  engine,eventCount:1,phase:'m251_native_session_abi',outcome:'ready',
  hook:true,nativeExportsObserved:true,optionsCalls:1,sessionCalls:1,
  optionArgumentCount:6,memPatternFlag:flag,flagType:'number',
  optionsHandle:true,sessionHandle:true,nativeErrorClass:'none',
  nativeCppAllocatorStateObserved:false,permanentFixProven:false,
  releaseAuthorized:false,familyAlphaHold:true,...changes
 };
 return classifyM251OriginalNative({
  engine,width,arm,attempt:1,status:0,
  stdout:'M251_REAL_ORIGINAL_JSEP_NATIVE_ABI '+JSON.stringify(witness),
  originalM250:{
   positive:originalPositive,originalJsepModelReady:originalPositive,
   actualOriginalBrowserResponseShaVerified:engine==='webkit'
  }
 });
}
test('M251 baseline genuine original JSEP+source-owner pass requires exact native export ABI flag',()=>{
 const x=actual();
 assert.equal(x.modelAndOwnerAndAbiPass,true);
 assert.equal(x.nativeAbiMemoryPatternFlag,1);
 assert.equal(x.nativeAbiOptionMatchesRequest,true);
 assert.equal(x.originalNativeOptionTransportProven,true);
 assert.equal(x.actualNativeWebAssemblyOptionsExportCalled,true);
 assert.equal(x.actualNativeWebAssemblySessionExportCalled,true);
 assert.equal(x.permanentMemoryRepairProven,false);
 assert.equal(x.releaseAuthorized,false);
 assert.equal(x.familyAlphaHold,true);
});
test('M251 off request has separate expected actual original ABI false, never inferred from request',()=>{
 const x=actual({arm:'pattern_off',flag:0});
 assert.equal(x.modelAndOwnerAndAbiPass,true);
 assert.equal(x.nativeAbiMemoryPatternFlag,0);
 assert.equal(x.nativeAbiOptionMatchesRequest,true);
 assert.equal(x.nativeCppAllocatorInternalStateObserved,false);
 const ignored=actual({arm:'pattern_off',flag:1});
 assert.equal(ignored.originalNativeOptionTransportProven,true);
 assert.equal(ignored.nativeAbiOptionMatchesRequest,false);
 assert.equal(ignored.modelAndOwnerAndAbiPass,true,
  'Observed unchanged native ABI is scientific result, not a forged web failure');
});
test('M251 Chromium cannot claim it SHA-read actual browser WASM body',()=>{
 const x=actual({engine:'chromium',arm:'pattern_off',width:390,flag:0});
 assert.equal(x.modelAndOwnerAndAbiPass,true);
 assert.equal(x.originalDirectJsepWebkitResponseSha256Verified,false);
});
test('M251 rejects forged native handles, missing hooks, duplicate or fake flags',()=>{
 const negatives=[
  {hook:false},{nativeExportsObserved:false},{optionsCalls:0},
  {optionsCalls:2},{sessionCalls:0},{sessionCalls:2},
  {optionArgumentCount:2},{memPatternFlag:null},
  {memPatternFlag:4},{optionsHandle:false},{sessionHandle:false},
  {eventCount:0},{eventCount:2},{phase:'model_fake'},
  {outcome:'error'},{nativeCppAllocatorStateObserved:true},
  {permanentFixProven:true},{releaseAuthorized:true},{familyAlphaHold:false}
 ];
 for(const changes of negatives){
  const x=actual({changes});
  assert.equal(x.modelAndOwnerAndAbiPass,false,
   'Fake original native ABI was counted as actual flag proof');
  assert.equal(x.permanentMemoryRepairProven,false);
 }
});
test('M251 original successful source-owner journey required independently of ABI',()=>{
 assert.equal(actual({originalPositive:false}).modelAndOwnerAndAbiPass,false);
 assert.equal(actual({changes:{engine:'fakebrowser'}}).modelAndOwnerAndAbiPass,false);
 assert.throws(()=>classifyM251OriginalNative({
  engine:'synthetic',arm:'baseline',width:320,attempt:1,status:0,stdout:'',
  originalM250:{positive:true}
 }));
});
test('M251 native boundary pass-through scalar functions preserve arguments/return/exception',()=>{
 const posts=[];
 class NativeInstance{}
 Object.defineProperty(NativeInstance.prototype,'exports',{
  configurable:true,enumerable:true,get(){return this.nativeExports;}
 });
 const ctx={WebAssembly:{Instance:NativeInstance},self:{postMessage:d=>posts.push(d)},
  WeakMap,Map,Proxy,Reflect,Object,Number,Math};
 vm.runInNewContext(M251_WORKER_NATIVE_ABI_PROBE,ctx,{timeout:5000});
 const object=new NativeInstance();
 const invocations=[];
 object.nativeExports={
  _OrtCreateSessionOptions(...args){invocations.push({kind:'options',args});return 123;},
  _OrtCreateSession(...args){invocations.push({kind:'session',args});return 456;}
 };
 const first=object.exports,second=object.exports;
 assert.equal(first,second,'Actual export object identity must be preserved');
 assert.equal(first._OrtCreateSessionOptions(1,1,0,3,4,5),123);
 assert.equal(first._OrtCreateSession(10,20,30),456);
 assert.deepEqual(invocations.map(x=>x.kind),['options','session']);
 assert.deepEqual(invocations[0].args,[1,1,0,3,4,5]);
 assert.deepEqual(invocations[1].args,[10,20,30]);
 vm.runInNewContext("m251Emit('test-only','ready')",ctx,{timeout:5000});
 assert.equal(posts.length,1);
 const r=posts[0];
 assert.equal(r.type,'diagnostic');
 assert.equal(r.phase,'m251_native_session_abi');
 assert.equal(r.nativeExportsGetterHookInstalled,true);
 assert.equal(r.actualOrtExportsObserved,true);
 assert.equal(r.nativeOptionsCallCount,1);
 assert.equal(r.nativeSessionCallCount,1);
 assert.equal(r.nativeOptionsArgumentCount,6);
 assert.equal(r.nativeMemoryPatternOptionFlag,0);
 assert.equal(r.nativeOptionsHandleReturned,true);
 assert.equal(r.nativeSessionHandleReturned,true);
 assert.ok(!JSON.stringify(r).includes('123')&&!JSON.stringify(r).includes('456'),
  'Pointer/opaque result handles must never be logged');
});
test('M251 genuine model failure preserves native exception taxonomy and zero false owner success',()=>{
 const posts=[];
 class NativeInstance{}
 Object.defineProperty(NativeInstance.prototype,'exports',{configurable:true,get(){return this.nativeExports;}});
 const ctx={WebAssembly:{Instance:NativeInstance},self:{postMessage:d=>posts.push(d)},
  WeakMap,Map,Proxy,Reflect,Object,Number,Math};
 vm.runInNewContext(M251_WORKER_NATIVE_ABI_PROBE,ctx,{timeout:5000});
 const x=new NativeInstance();
 x.nativeExports={_OrtCreateSessionOptions(...args){throw new TypeError('private-model-message-must-not-leak')}};
 assert.throws(()=>x.exports._OrtCreateSessionOptions(1,1,1),/private-model-message/);
 vm.runInNewContext("m251Emit('test-only','error')",ctx,{timeout:5000});
 assert.equal(posts[0].nativeErrorClass,'TypeError');
 assert.ok(!JSON.stringify(posts[0]).includes('private-model-message'));
 assert.equal(posts[0].nativeOptionsHandleReturned,false);
});
test('M251 original generator must be anchored to immutable M250 and M249 source only',async()=>{
 const parent=(await readFile('scripts/test-main249-original-failed-jsep-browser.mjs')).toString('utf8');
 const original=injectOriginalResearchArm(parent);
 const changed=instrumentM251OriginalM250Runner(original);
 assert.ok(changed.includes('m251Build'));
 assert.ok(changed.includes('M251_REAL_ORIGINAL_JSEP_NATIVE_ABI'));
 assert.ok(changed.includes('M251 original model-ready native option export moved'));
 assert.ok(changed.includes('M249_ORIGINAL_FAILED_ATTEMPT_JSEP_EVIDENCE'));
 assert.ok(changed.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS'));
 assert.equal(original.includes('M251_REAL_ORIGINAL_JSEP_NATIVE_ABI'),false);
 assert.throws(()=>instrumentM251OriginalM250Runner('simulated owner'));
 assert.ok(makeM251WorkerSource().includes('m251Probe'));
 assert.ok(!M251_WORKER_NATIVE_ABI_PROBE.includes('memory.buffer'));
 assert.ok(!M251_WORKER_NATIVE_ABI_PROBE.includes('getUint8'));
 assert.ok(!M251_ORIGINAL_BROWSER_REPORT_EXTENSION.includes('ownerId'));
});
test('M251 generated original browser source-only can be safely checked without native success claims',()=>{
 const run=spawnSync(process.execPath,
  ['scripts/test-main251-original-jsep-native-option-abi-browser.mjs'],{
   env:{...process.env,M251_SOURCE_ONLY:'1',M251_ENGINE:'webkit',
    M251_WIDTH:'320',M251_ARM:'pattern_off'},
   encoding:'utf8',timeout:90000,maxBuffer:3*1024*1024
  });
 assert.equal(run.status,0,'M251 original source-only script invalid: '+String(run.stderr||'').slice(0,700));
 assert.ok(run.stdout.includes('M251_ORIGINAL_JSEP_NATIVE_ABI_SOURCE_READY'));
 assert.ok(!run.stdout.includes('M251_ORIGINAL_NATIVE_ABI_ACTUAL_JSEP'));
});
