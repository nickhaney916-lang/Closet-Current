import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {attestJsepOriginalGraph,JSEP_SOURCE,JSEP_WASM}
 from '../scripts/main247-original-jsep-native-contract.mjs';
import {P94_JSEP,PINNED_LOCAL_NON_JSEP}
 from '../scripts/main246-local-ort-wasm-identity.mjs';
const MODEL='02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3';
const sha='1'.repeat(64);
const accepted=()=>({
 engine:'webkit',arm:'baseline',esmSha256:sha,
 model:{sha256:MODEL,bytes:15199746},
 identity:{localRuntimeName:JSEP_WASM,localRuntimeSha256:P94_JSEP,
  actualBrowserResponseBodyShaVerified:true,matchesP94OriginalWebkitJsepBinary:true,
  installedOriginalPinnedBinaryExactMatch:true},
 session:{success:true,nativeCalls:[{actualNativeExportCalled:true,returnedHandle:true}],
  apiCalls:[{memPatternFlag:true,arenaFlag:true}]}
});
test('M247 strict original JSEP-only acceptance never implies a WebKit repair',()=>{
 const r=attestJsepOriginalGraph(accepted());
 assert.equal(r.runtimeBinarySameAsOriginalWebkitP94,true);
 assert.equal(r.verifiedRealModelSession,true);
 assert.equal(r.originalOwnerWorkerNotExercised,true);
 assert.equal(r.originalFailureReproduced,false);
 assert.equal(r.permanentWebkitRepairProven,false);
 assert.equal(r.familyAlphaHold,true);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(JSEP_SOURCE,'ort.webgpu.mjs');
 assert.notEqual(P94_JSEP,PINNED_LOCAL_NON_JSEP);
});
test('M247 refuses local non-JSEP, faked network body, mismatched source and no native handle',()=>{
 const input=accepted();
 const mutate=[
  x=>{x.identity.localRuntimeSha256=PINNED_LOCAL_NON_JSEP;},
  x=>{x.identity.localRuntimeName='ort-wasm-simd-threaded.wasm';},
  x=>{x.identity.actualBrowserResponseBodyShaVerified=false;},
  x=>{x.identity.installedOriginalPinnedBinaryExactMatch=false;},
  x=>{x.identity.matchesP94OriginalWebkitJsepBinary=false;},
  x=>{x.model.sha256='0'.repeat(64);},
  x=>{x.model.bytes=24;},
  x=>{x.session.success=false;},
  x=>{x.session.nativeCalls[0].returnedHandle=false;},
  x=>{x.session.nativeCalls=[];},
  x=>{x.session.apiCalls=[];},
  x=>{x.session.apiCalls[0].arenaFlag=false;},
  x=>{x.engine='fake';},
  x=>{x.esmSha256=null;}
 ];
 for(const edit of mutate){
  const x=structuredClone(input);edit(x);
  assert.throws(()=>attestJsepOriginalGraph(x),'Counterfeit native JSEP acceptance');
 }
});
test('M247 native pattern-off must observe native option and refuse a swapped arm',()=>{
 const x=accepted();x.arm='pattern_off';x.session.apiCalls[0].memPatternFlag=false;
 assert.equal(attestJsepOriginalGraph(x).arm,'pattern_off');
 x.session.apiCalls[0].memPatternFlag=true;
 assert.throws(()=>attestJsepOriginalGraph(x));
});
test('M247 source-only guard preserves original M243 graph and fail-closed Worker',async()=>{
 const src=await readFile('scripts/test-main247-original-jsep-native-browser.mjs','utf8');
 const original=await readFile('scripts/test-main243-original-segformer-native-session-browser.mjs','utf8');
 assert.ok(src.includes('fdfb979ca3783cb362cb5eb909612902af0c3b70'));
 assert.ok(src.includes('d66651b616de54c51eb7ef986324b30f1580888f'));
 assert.ok(src.includes("assert.equal(run.status,0"));
 assert.ok(src.includes("M247_GENUINE_ORIGINAL_JSEP_NATIVE_GRAPH"));
 assert.ok(src.includes("originalOwnerPhotoJourneyNotRun:true"));
 assert.ok(original.includes("assert.equal(data.success,true,'Original pinned SegFormer WASM model session failed"));
 const run=spawnSync(process.execPath,['scripts/test-main247-original-jsep-native-browser.mjs'],{
  env:{...process.env,M247_SOURCE_ONLY:'1',M247_ENGINE:'webkit',M247_ARM:'baseline'},
  encoding:'utf8',timeout:30000});
 assert.equal(run.status,0,'Original native graph fixture changed: '+(run.stderr||'').slice(0,400));
 assert.ok(run.stdout.includes('M247_DISPOSABLE_JSEP_SOURCE_READY'));
 assert.ok(!run.stdout.includes('M247_GENUINE_ORIGINAL_JSEP_NATIVE_GRAPH'));
});
test('M247 rejects fake browsers and arbitrary non-matched options in source audit',()=>{
 for(const env of [{M247_ENGINE:'webkit-mock'},{M247_ARM:'new-setting'}]){
  const r=spawnSync(process.execPath,['scripts/test-main247-original-jsep-native-browser.mjs'],{
   env:{...process.env,M247_SOURCE_ONLY:'1',M247_ENGINE:'webkit',M247_ARM:'baseline',...env},
   encoding:'utf8',timeout:30000});
  assert.notEqual(r.status,0);
  assert.ok(!r.stdout.includes('M247_GENUINE_ORIGINAL_JSEP_NATIVE_GRAPH'));
 }
});
