import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {
 deriveM253OriginalRunner,verifiedM253OriginalRunner,
 verifyM253ActualOptionReceipt,require253Arm,
 classifyM253NativeAttempt,ORIGINAL_JSEP_SHA253,ORIGINAL_PHOTO_SHA253
} from './main253-jsep-contrast-helper.mjs';
const fake=(label,x)=>label+' '+JSON.stringify(x);
const native=arm=>({
 schema:'M253_GENUINE_ORIGINAL_JSEP_WASM_NATIVE_MEMPATTERN_CONTRAST/v1',
 engine:'webkit',arm,actualCompiledWasmExportInvoked:true,
 nativeMemPatternFlagObserved:arm==='pattern_on',
 nativeCpuArenaFlagObserved:false,
 tenOriginalWasmAbiArgumentsForwarded:true,
 genuineNativeOptionsHandleReturned:true
});
function source(arm,alter={}){
 const x=[
  fake('M253_REAL_ORIGINAL_JSEP_NATIVE_ABI',{...native(arm),...alter}),
  fake('M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY',{
   originalJsepWasmSha256:ORIGINAL_JSEP_SHA253,
   originalModelSessionReady:true,actualOriginalBrowserJsepBodyHash:true
  }),
  fake('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',{
   engine:'webkit',modelExecuted:true,manualSyntheticOwnerConfirmed:true,
   ownerPrivateSaved:1,exactOriginalSHA256:ORIGINAL_PHOTO_SHA253,
   tamperDenied:true,otherOwnerDenied:true,
   atomicRestore:true,actualV4BrowserDownload:true,
   hostedRLS:false,releaseAuthorized:false
  }),
  fake('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',{
   engine:'webkit',realWorkerFirst:true,ownerBPrivateRows:0,
   ownerAOriginalNotVisibleToB:true,ownerAOutfitNotVisibleToB:true
  }),
  fake('M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT',{
   outcome:'ready',growCalls:5,growErrors:0
  })
 ];
 return x.join('\n');
}
const classify=(arm,stdout=source(arm),more={})=>classifyM253NativeAttempt({
 stdout,status:0,signal:null,arm,engine:'webkit',width:320,attempt:1,...more
});
test('M253 genuine pinned source is derived and never alters shipped original Worker/JSEP',async()=>{
 const s=await verifiedM253OriginalRunner();
 assert.ok(s.includes('session_options:{enableMemPattern:true}'));
 assert.ok(s.includes('session_options:{enableMemPattern:false}'));
 assert.ok(s.includes('verifyM253ActualOptionReceipt'));
 assert.ok(s.includes('M253_REAL_ORIGINAL_JSEP_NATIVE_ABI'));
 assert.ok(s.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS'));
 assert.ok(s.includes("P94_WIDTH:String(process.env.M253_WIDTH||'390')"));
 const original=await readFile('scripts/test-main251-original-jsep-native-option-browser.mjs','utf8');
 assert.notEqual(s,original);
 assert.throws(()=>deriveM253OriginalRunner(original.replace('M251_ARM','M999_ARM')));
 assert.throws(()=>deriveM253OriginalRunner(original+' // forged'));
});
test('M253 source-only original generator proves no native model or private claim',()=>{
 for(const arm of ['pattern_off','pattern_on']){
  const r=spawnSync(process.execPath,['scripts/test-main253-original-jsep-contrast-browser.mjs'],{
   env:{...process.env,M253_SOURCE_ONLY:'1',M253_ENGINE:'webkit',
    M253_ARM:arm,M253_WIDTH:'320',M253_COUNT:'2'},
   encoding:'utf8',timeout:30000,maxBuffer:3*1024*1024
  });
  assert.equal(r.status,0,'Source-lock or disposable browser generator RED: '+String(r.stderr||'').slice(0,800));
  assert.ok(r.stdout.includes('M253_SOURCE_ONLY_PINNED'));
  assert.ok(!r.stdout.includes('M253_GENUINE_ORIGINAL_FIRST_PROCESS'));
 }
});
test('M253 compiled native WASM flag ON versus OFF is strictly observed (not guessed)',()=>{
 for(const arm of ['pattern_off','pattern_on']){
  const proof=verifyM253ActualOptionReceipt({
   phase:'m251_native_option',actualExportCalled:true,argCount:10,
   handleReturned:true,cpuArena:false,memPattern:arm==='pattern_on'
  },{engine:'webkit',arm});
  assert.equal(proof.nativeMemPatternFlagObserved,arm==='pattern_on');
  assert.equal(proof.actualCompiledWasmExportInvoked,true);
  assert.equal(proof.nativeCppHeapPolicyRead,false);
  assert.equal(proof.permanentWebkitRepairProven,false);
 }
});
test('M253 actual original model/JSEP/owner/privacy receipt must pass all strict terms',()=>{
 for(const arm of ['pattern_off','pattern_on']){
  const x=classify(arm);
  assert.equal(x.originalModelPositive,true);
  assert.equal(x.observedNativeFlag,arm==='pattern_on');
  assert.equal(x.actualBrowserJsepBodyShaVerified,true);
  assert.equal(x.genuineSourcePhotoAndPrivateOwner2DV4,true);
  assert.equal(x.permanentRepairProven,false);
 }
});
test('M253 falsifications preserve genuine original RED; reject no-op, wrong native call, owner leak or forged source',()=>{
 const s=source('pattern_on');
 const cases=[
  s.replace('"nativeMemPatternFlagObserved":true','"nativeMemPatternFlagObserved":false'),
  s.replace('"actualCompiledWasmExportInvoked":true','"actualCompiledWasmExportInvoked":false'),
  s.replace('"genuineNativeOptionsHandleReturned":true','"genuineNativeOptionsHandleReturned":false'),
  s.replace('"tenOriginalWasmAbiArgumentsForwarded":true','"tenOriginalWasmAbiArgumentsForwarded":false'),
  s.replace(ORIGINAL_JSEP_SHA253,'0'.repeat(64)),
  s.replace(ORIGINAL_PHOTO_SHA253,'f'.repeat(64)),
  s.replace('"actualOriginalBrowserJsepBodyHash":true','"actualOriginalBrowserJsepBodyHash":false'),
  s.replace('"ownerPrivateSaved":1','"ownerPrivateSaved":0'),
  s.replace('"otherOwnerDenied":true','"otherOwnerDenied":false'),
  s.replace('"ownerBPrivateRows":0','"ownerBPrivateRows":1'),
  s.replace('"growErrors":0','"growErrors":1'),
  s.replace('M253_REAL_ORIGINAL_JSEP_NATIVE_ABI','M253_FAKE_NATIVE'),
  s+'\n'+s
 ];
 for(const bad of cases){
  const x=classify('pattern_on',bad);
  assert.equal(x.originalModelPositive,false);
  assert.equal(x.originalFailurePreserved,true);
 }
 const x=classify('pattern_on',s,{status:1});
 assert.equal(x.originalModelPositive,false);
 assert.equal(x.originalFailurePreserved,true);
 assert.throws(()=>require253Arm('baseline'));
 assert.throws(()=>require253Arm('fake'));
});
