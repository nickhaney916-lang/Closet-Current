import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {
 PINNED_JS,PINNED_WASM,PINNED_WORKER,M251_ABI_BRIDGE,
 M251_RESEARCH_NATIVE_BRIDGE,deriveM251NativeAbiJsep,
 probeM251NativeGlue,instrumentM251OriginalJsepGlue,
 verifyM251OriginalNativeOptionReceipt
} from '../scripts/main251-original-jsep-abi-probe.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const blob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const receipt=(arm='baseline')=>({
 phase:'m251_native_option',actualExportCalled:true,
 memPattern:false,cpuArena:false,argCount:10,handleReturned:true
});
test('M251 shipped original source and full original JSEP JS/WASM SHA locked',async()=>{
 const w=await readFile('public/outfit-worker-p94.mjs');
 const j=await readFile('node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.mjs');
 const wasm=await readFile('node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm');
 assert.equal(blob(w),PINNED_WORKER);
 assert.equal(sha(j),PINNED_JS);
 assert.equal(sha(wasm),PINNED_WASM);
 assert.equal(wasm.length,21596019);
 assert.equal(j.length,44484);
});
test('M251 pinned actual native JSEP bridge and ABI calls source is verified before ephemeral instrumentation',async()=>{
 const source=await readFile('node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.mjs','utf8');
 assert.equal(source.split(M251_ABI_BRIDGE).length,2);
 const modified=deriveM251NativeAbiJsep(source);
 assert.equal(modified.split(M251_ABI_BRIDGE).length,1);
 assert.equal(modified.split("phase:'m251_native_option'").length,2);
 assert.equal(modified.includes(M251_RESEARCH_NATIVE_BRIDGE),true);
 assert.ok(modified.includes('K.Ha)(a,b,c,d,f,g,h,l,m,p)'));
 assert.ok(modified.includes('e._OrtCreateSessionOptions=K.Ha'));
 assert.notEqual(modified,source);
 assert.equal(await instrumentM251OriginalJsepGlue(),modified);
});
test('M251 reject source version swap, duplicate bridge, non-JSEP shim, missing actual native export',async()=>{
 const raw=await readFile('node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.mjs','utf8');
 for(const s of [raw.replace(M251_ABI_BRIDGE,''),
  raw+M251_ABI_BRIDGE,raw.replace('K.Ha','K.Hb'),
  raw.replace(M251_ABI_BRIDGE,'e._OrtCreateSessionOptions=()=>1;')]){
  assert.throws(()=>deriveM251NativeAbiJsep(s));
 }
});
test('M251 observed WASM native bridge flag baseline must be actual TRUE and option-off FALSE',()=>{
 for(const arm of ['baseline','pattern_off']){
  const proof=verifyM251OriginalNativeOptionReceipt(receipt(arm),{engine:'webkit',arm});
  assert.equal(proof.realWasmExportInvoked,true);
  assert.equal(proof.nativeMemPatternFlag,false);
  assert.equal(proof.nativeCpuArenaFlag,false);
  assert.equal(proof.genuineReturnedOptionsHandle,true);
  assert.equal(proof.originalPinnedJsepGlueSourceSha256,PINNED_JS);
  assert.equal(proof.researchOnlyLoaderInstrumentation,true);
  assert.equal(proof.actualNativeCppMemoryPolicyObserved,false);
  assert.equal(proof.permanentRepairProven,false);
  assert.equal(proof.releaseAuthorized,false);
  assert.equal(proof.familyAlphaHold,true);
 }
});
test('M251 ORIGINAL P94 JSEP native default already OFF; request-OFF has no native value difference',()=>{
 const a=verifyM251OriginalNativeOptionReceipt(receipt('baseline'),{engine:'webkit',arm:'baseline'});
 const b=verifyM251OriginalNativeOptionReceipt(receipt('pattern_off'),{engine:'webkit',arm:'pattern_off'});
 assert.equal(a.nativeMemPatternFlag,false);
 assert.equal(b.nativeMemPatternFlag,false);
 assert.equal(a.originalDefaultMemPatternFlagWasAlreadyFalse,true);
 assert.equal(b.requestedMemPatternOff,true);
 assert.equal(a.actualNativeCppMemoryPolicyObserved,false);
 assert.equal(b.permanentRepairProven,false);
});
test('M251 strict falsification rejects missing/duplicate native return values or wrong native arm',()=>{
 for(const arm of ['baseline','pattern_off']){
  for(const edit of [
   x=>{x.phase='fake';},x=>{x.actualExportCalled=false;},
   x=>{x.memPattern=true;},x=>{x.memPattern=null;},
   x=>{x.cpuArena=true;},x=>{x.cpuArena=null;},
   x=>{x.argCount=9;},x=>{x.argCount=11;},
   x=>{x.handleReturned=false;}
  ]){
   const x=receipt(arm);edit(x);
   assert.throws(()=>verifyM251OriginalNativeOptionReceipt(x,{engine:'webkit',arm}));
  }
 }
 assert.throws(()=>verifyM251OriginalNativeOptionReceipt(receipt(),{engine:'fakewebkit',arm:'baseline'}));
 assert.throws(()=>verifyM251OriginalNativeOptionReceipt(receipt(),{engine:'webkit',arm:'fake'}));
});
test('M251 preflight detects original twice-installed BYTE-IDENTICAL JSEP rather than claiming a different runtime',async()=>{
 const r=await probeM251NativeGlue();
 assert.equal(r.originalConsumerWorkerImmutable,true);
 assert.equal(r.actualNativeAbiCallNotYetObserved,true);
 const js=r.files.filter(f=>f.exists&&f.sha256===PINNED_JS);
 const wasm=r.files.filter(f=>f.exists&&f.sha256===PINNED_WASM);
 assert.equal(js.length,2);
 assert.equal(wasm.length,2);
 assert.equal(r.nativeCAllocatorNotObserved,true);
});
test('M251 exact M247 original-owner source-derived JS compiles without fake browser pass',()=>{
 for(const arm of ['baseline','pattern_off']){
  const run=spawnSync(process.execPath,['scripts/test-main251-original-jsep-native-option-browser.mjs'],{
   env:{...process.env,M247_SOURCE_ONLY:'1',M247_ENGINE:'webkit',M251_ARM:arm},
   encoding:'utf8',timeout:30000});
  assert.equal(run.status,0,'Original source derivation invalid: '+String(run.stderr||'').slice(0,650));
  assert.ok(run.stdout.includes('M247_PINNED_ORIGINAL_JSEP_PROBE_READY'));
  assert.ok(!run.stdout.includes('M251_REAL_ORIGINAL_JSEP_NATIVE_ABI'));
 }
});
test('M251 disallow fake engine or unsupported product/workaround settings',()=>{
 for(const bad of [
  {M247_ENGINE:'notwebkit',M251_ARM:'baseline'},
  {M247_ENGINE:'webkit',M251_ARM:'gpu'},
  {M247_ENGINE:'webkit',M251_ARM:'arena_off'}
 ]){
  const run=spawnSync(process.execPath,['scripts/test-main251-original-jsep-native-option-browser.mjs'],{
   env:{...process.env,M247_SOURCE_ONLY:'1',...bad},
   encoding:'utf8',timeout:30000});
  assert.notEqual(run.status,0);
  assert.ok(!run.stdout.includes('M251_REAL_ORIGINAL_JSEP_NATIVE_ABI'));
 }
});
