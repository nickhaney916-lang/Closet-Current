/** M253 pure, dependency-free adversarial receipt/source test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 PARENT_RUNNER_BLOB253,ORIGINAL_JSEP_SHA253,ORIGINAL_JSEP_BYTES253,
 blob253,m253Config,deriveM253ObservableRunner,receipt253,m253Classify,m253Summary
} from './main253-natural-jsep-native-failure-cohort.mjs';
const line=(name,value)=>name+' '+JSON.stringify(value);
const mk=({native=true,hash=true,modelReady=true,exitCode=0,engine='webkit',width=320}={})=>{
 const r=[
  line('M253_THIS_ATTEMPT_ORIGINAL_BROWSER_JSEP',{kind:'onnx-wasm',
   name:'ort-wasm-simd-threaded.jsep.wasm',status:200,available:hash,
   sha256:hash?ORIGINAL_JSEP_SHA253:null,bytes:hash?ORIGINAL_JSEP_BYTES253:null}),
  ...(native?[line('M253_THIS_ATTEMPT_NATIVE_OPTION',{phase:'m251_native_option',
   actualExportCalled:true,argCount:10,handleReturned:true,cpuArena:false,memPattern:false})]:[]),
  line('M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT',{phase:'m247_jsep_memory',
   outcome:modelReady?'ready':'error',growCalls:5,growErrors:0,
   terminalPages:767,firstPages:256}),
  ...(modelReady?[
   line('M251_REAL_ORIGINAL_JSEP_NATIVE_ABI',{engine,arm:'baseline',realWasmExportInvoked:true}),
   line('M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY',{originalModelSessionReady:true,
    originalJsepWasmSha256:ORIGINAL_JSEP_SHA253}),
   line('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',{
    engine,modelExecuted:true,manualSyntheticOwnerConfirmed:true,
    ownerPrivateSaved:1,otherOwnerDenied:true,tamperDenied:true,atomicRestore:true}),
   line('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',{
    engine,ownerBPrivateRows:0,ownerAOriginalNotVisibleToB:true,ownerAOutfitNotVisibleToB:true})
  ]:[])
 ].join('\n');
 return {engine,width,attempt:1,exitCode,signal:null,stdout:r,stderr:''};
};
test('M253 exact original M251 observer source derives ONLY bounded original browser native/JSEP evidence',async()=>{
 const base=await readFile('scripts/test-main251-original-jsep-native-option-browser.mjs','utf8');
 assert.equal(blob253(base),PARENT_RUNNER_BLOB253);
 const mod=deriveM253ObservableRunner(base);
 assert.ok(mod.includes("P94_WIDTH:String(process.env.M253_WIDTH||'390')"));
 assert.ok(mod.includes('M253_THIS_ATTEMPT_ORIGINAL_BROWSER_JSEP'));
 assert.ok(mod.includes('M253_THIS_ATTEMPT_NATIVE_OPTION'));
 assert.ok(mod.includes('M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY'));
 assert.ok(mod.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS'));
 assert.ok(mod.includes('M58_REAL_P88_WORKER_FAIL'));
 assert.notEqual(mod,base);
 assert.throws(()=>deriveM253ObservableRunner(base.replace("P94_WIDTH:'390'","P94_WIDTH:'430'")));
});
test('M253 real original WebKit positive must attest original WASM, actual option, model and privacy',()=>{
 const a=m253Classify(mk());
 assert.equal(a.positive,true);assert.equal(a.actualSameFailedBrowserResponseHashVerified,true);
 assert.equal(a.actualOriginalNativeAbiObserved,true);assert.equal(a.nativeDefaultMemPatternFlag,false);
 assert.equal(a.originalPrivateOwnerAndSourceV4,true);
 assert.equal(a.originalProductNaturalRedToGreenFixProven,false);assert.equal(a.familyAlphaHold,true);
});
test('M253 Chromium cannot assert unreadable original browser body, but preserves genuine model positives',()=>{
 const a=m253Classify(mk({engine:'chromium',width:390,hash:false}));
 assert.equal(a.positive,true);
 assert.equal(a.actualSameFailedBrowserResponseHashVerified,false);
 assert.equal(a.actualOriginalWasmResponseBodyNotAvailable,true);
});
test('M253 original genuine RED is NEVER promoted by a successful sibling or missing same-failed-run hash',()=>{
 const failed=m253Classify(mk({exitCode:1,modelReady:false}));
 assert.equal(failed.positive,false);
 assert.equal(failed.naturalPostNativeModelFailureCandidate,true);
 const hashMissing=m253Classify(mk({exitCode:1,modelReady:false,hash:false}));
 assert.equal(hashMissing.positive,false);
 assert.equal(hashMissing.naturalPostNativeModelFailureCandidate,false);
 assert.equal(hashMissing.actualSameFailedBrowserResponseHashVerified,false);
 const fakeNative=m253Classify(mk({exitCode:1,modelReady:false,native:false}));
 assert.equal(fakeNative.naturalPostNativeModelFailureCandidate,false);
 assert.equal(fakeNative.errorSpecificNativeCppRootCauseVerified,false);
});
test('M253 true source-only browser model/owner receipts reject wrong JSEP bytes, missing owner and forged native',()=>{
 const base=mk();
 for(const changed of [
  base.stdout.replace(ORIGINAL_JSEP_SHA253,'f'.repeat(64)),
  base.stdout.replace('21596019','11133407'),
  base.stdout.replace('"memPattern":false','"memPattern":true'),
  base.stdout.replace('"argCount":10','"argCount":9'),
  base.stdout.replace('"ownerPrivateSaved":1','"ownerPrivateSaved":0'),
  base.stdout.replace('"ownerBPrivateRows":0','"ownerBPrivateRows":1'),
  base.stdout.replace('"originalModelSessionReady":true','"originalModelSessionReady":false'),
  base.stdout.replace('M251_REAL_ORIGINAL_JSEP_NATIVE_ABI','M251_MISSING_NATIVE'),
 ]){
  assert.equal(m253Classify({...base,stdout:changed}).positive,false);
 }
});
test('M253 original cohort exact samples preserve all failed attempts and reject repeated/missing counts',()=>{
 const records=[1,2,3,4,5,6,7,8].map(i=>({...m253Classify(mk()),attempt:i}));
 const ok=m253Summary(records,{engine:'webkit',width:320,count:8});
 assert.equal(ok.genuineCompleteOriginalOwnerPositives,8);
 const failed=[...records];failed[5]={...failed[5],positive:false,originalNonzeroExit:true};
 const s=m253Summary(failed,{engine:'webkit',width:320,count:8});
 assert.equal(s.authenticOriginalNonzeroOrIncomplete,1);assert.equal(s.wholeCohortPass,false);
 assert.throws(()=>m253Summary(records.slice(1),{engine:'webkit',width:320,count:8}));
 assert.throws(()=>m253Summary(records,{engine:'webkit',width:390,count:8}));
 assert.throws(()=>m253Config('webkit',320,7));
 assert.throws(()=>m253Config('chromium',430,8));
});
test('M253 rejects duplicate or malformed direct original evidence, timeout and missing private owner are RED',()=>{
 const original=mk();
 assert.throws(()=>receipt253(original.stdout+'\n'+original.stdout,
  'M253_THIS_ATTEMPT_ORIGINAL_BROWSER_JSEP'));
 assert.throws(()=>receipt253('M253_THIS_ATTEMPT_ORIGINAL_BROWSER_JSEP null',
  'M253_THIS_ATTEMPT_ORIGINAL_BROWSER_JSEP'));
 assert.throws(()=>receipt253('', 'M999_FAKE'));
 const timeout=m253Classify({...original,exitCode:null,signal:'SIGTERM',stdout:''});
 assert.equal(timeout.positive,false);assert.equal(timeout.originalNonzeroExit,true);
 assert.equal(timeout.errorSpecificNativeCppRootCauseVerified,false);
});
