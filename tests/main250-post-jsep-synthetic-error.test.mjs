import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {deriveOriginalP94JsepObserver} from '../scripts/main247-original-worker-jsep-heap-observer.mjs';
import {addM249OriginalErrorWitness} from '../scripts/main249-original-failed-jsep-source-witness.mjs';
import {injectM250SyntheticGrowFailure,verifyM250ControlledPostJsepReceipt}
 from '../scripts/main250-synthetic-after-jsep-grow-witness.mjs';

const good=()=>({
 schema:'M249_ORIGINAL_FAILED_JSEP_SAME_ATTEMPT/v1',engine:'webkit',
 controlledPublicOnnxAbort:false,realOriginalP94ModelAttemptFailed:true,
 originalTestFailedNonzero:true,directOriginalJsepBrowserBodySHAProven:true,
 actualPublicRuntimeIdentity:'DIRECT_SAME_ATTEMPT_JSEP_SHA',
 publicWasmResponseCount:1,publicWasmStatus:200,
 exactOneObservedException:true,modelExceptionName:'RuntimeError',
 modelExceptionCategory:'wasm_memory_access',originalHeapTerminalSeen:true,
 observedGrowCalls:2,observedGrowErrors:1,
 observedFirstPages:256,observedTerminalPages:364,
 nativeCppAllocatorCauseProven:false,nativeMemoryAccessRootCauseProven:false,
 realRedToGreenFixProven:false,privatePhotoBytesLogged:false,
 releaseAuthorized:false,familyAlphaHold:true
});
test('M250 synthetic post-JSEP negative contract distinguishes real browser SHA from genuine native root cause',()=>{
 const result=verifyM250ControlledPostJsepReceipt(good());
 assert.equal(result.originalJsepDirectlyHashedInSameFailingWebkitBrowser,true);
 assert.equal(result.syntheticJavascriptGrowThrowVerified,true);
 assert.equal(result.actualOriginalModelStillFailed,true);
 assert.equal(result.syntheticFaultIsNaturalWebkitBug,false);
 assert.equal(result.nativeCppAllocatorCauseProven,false);
 assert.equal(result.realRedToGreenFixProven,false);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.familyAlphaHold,true);
});
test('M250 original runtime wrapper can report network_abort without proving any network cause',()=>{
 const wrapped=good();wrapped.modelExceptionCategory='network_abort';
 const proof=verifyM250ControlledPostJsepReceipt(wrapped);
 assert.equal(proof.originalReportedErrorCategory,'network_abort');
 assert.equal(proof.errorClassification,'SYNTHETIC_JAVASCRIPT_GROW_WITH_WRAPPED_RUNTIME_ERROR');
 assert.equal(proof.actualNetworkAbortCauseProven,false);
 assert.equal(proof.nativeCppAllocatorCauseProven,false);
 assert.equal(proof.syntheticFaultIsNaturalWebkitBug,false);
});
test('M250 refuses silent passing model, any fake same-failing-browser JSEP, missing heap or false native attribution',()=>{
 const edits=[
  x=>{x.schema='not-pinned';}, x=>{x.engine='chromium';},
  x=>{x.controlledPublicOnnxAbort=true;},
  x=>{x.realOriginalP94ModelAttemptFailed=false;},
  x=>{x.originalTestFailedNonzero=false;},
  x=>{x.directOriginalJsepBrowserBodySHAProven=false;},
  x=>{x.actualPublicRuntimeIdentity='UNVERIFIED_SAME_ATTEMPT_BROWSER_BODY';},
  x=>{x.publicWasmResponseCount=2;},
  x=>{x.publicWasmStatus=404;},
  x=>{x.exactOneObservedException=false;},
  x=>{x.modelExceptionName='NetworkError';},
  x=>{x.modelExceptionCategory='network';},
  x=>{x.originalHeapTerminalSeen=false;},
  x=>{x.observedGrowCalls=0;}, x=>{x.observedGrowCalls=-1;},
  x=>{x.observedGrowErrors=0;}, x=>{x.observedGrowErrors=-1;},
  x=>{x.observedFirstPages=0;},x=>{x.observedTerminalPages=0;},
  x=>{x.nativeCppAllocatorCauseProven=true;},
  x=>{x.nativeMemoryAccessRootCauseProven=true;},
  x=>{x.realRedToGreenFixProven=true;},
  x=>{x.privatePhotoBytesLogged=true;},
  x=>{x.releaseAuthorized=true;},x=>{x.familyAlphaHold=false;}
 ];
 for(const edit of edits){
  const receipt=good();edit(receipt);
  assert.throws(()=>verifyM250ControlledPostJsepReceipt(receipt),
   'Counterfeit original post-JSEP failure and false proof must reject');
 }
});
test('M250 changes ONLY a disposable original real-worker grow pass-through and preserves original throw',async()=>{
 const actual=await readFile('public/outfit-worker-p94.mjs','utf8');
 const m247=deriveOriginalP94JsepObserver(actual);
 const m249=addM249OriginalErrorWitness(m247);
 const injected=injectM250SyntheticGrowFailure(m249);
 assert.equal(actual.includes('m250'),false);
 assert.equal(m249.includes('m250Synthetic'),false);
 assert.equal(injected.includes("throw new WebAssembly.RuntimeError('memory access out of bounds');"),true);
 assert.equal(injected.split("if(m247Stats.calls>=2)").length,2);
 assert.equal(injected.split('    const result=Reflect.apply(nativeGrow,this,args);').length,2);
 assert.equal(injected.includes("m249ClassifyOriginal(error);m247Emit(requestId,'error');loader=null;throw error;"),true);
 assert.equal(injected.includes("device:'wasm',dtype:'fp32'"),true);
 assert.equal(injected.includes("self.postMessage({type:'piece'"),true);
 assert.equal(injected.includes("self.postMessage({type:'done'"),true);
 assert.equal(injected.includes("m247Stats.errors=Math.min(100000,m247Stats.errors+1);"),true);
 assert.notEqual(injected,m249);
 assert.notEqual(injected,actual);
});
test('M250 unsafe or fake Worker cannot be patched into synthetic native success',()=>{
 assert.throws(()=>injectM250SyntheticGrowFailure(''));
 assert.throws(()=>injectM250SyntheticGrowFailure('const result=Reflect.apply(nativeGrow,this,args)'));
});
function run(mode,engine='webkit',width='390'){
 return spawnSync(process.execPath,['scripts/test-main250-original-post-jsep-browser.mjs'],{
  env:{...process.env,M249_SOURCE_ONLY:'1',
   M249_ENGINE:engine,M249_WIDTH:width,M249_CONTROL:'none',M250_CONTROL:mode},
  encoding:'utf8',timeout:30000});
}
test('M250 source-only derived original owner/photo/JSEP fixtures remain fail-closed for both arms',()=>{
 const p=run('none');
 const a=run('after_jsep_grow_throw');
 for(const r of [p,a]){
  assert.equal(r.status,0,'Source derivation invalid: '+String(r.stderr||'').slice(0,550));
  assert.ok(r.stdout.includes('M249_ORIGINAL_SOURCE_LOCKED'));
  assert.ok(!r.stdout.includes('M250_SYNTHETIC_POST_JSEP_BROWSER_RED_PROOF'));
  assert.ok(!r.stdout.includes('M249_GENUINE_SOURCE_OWNER_PASS'));
 }
});
test('M250 original source audit refuses fake engine, new options, non-native viewport and fake synthetic Chromium',()=>{
 for(const args of [['wrong','webkit','390'],['after_jsep_grow_throw','chromium','390'],
  ['none','fakewebkit','390'],['none','webkit','768']]){
  const r=run(...args);
  assert.notEqual(r.status,0,'Illegal native research experiment accepted');
  assert.ok(!r.stdout.includes('M250_SYNTHETIC_POST_JSEP_BROWSER_RED_PROOF'));
 }
});
