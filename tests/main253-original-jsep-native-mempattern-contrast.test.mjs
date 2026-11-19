import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {
 deriveM253Probe,deriveM253Browser,classifyM253SameAttempt,M253_ARMS,
 M253_JS_GLUE_SHA,M253_WASM_SHA
} from '../scripts/main253-original-jsep-native-mempattern-contrast.mjs';

const [probe,browser]=await Promise.all([
 readFile('scripts/main251-original-jsep-abi-probe.mjs','utf8'),
 readFile('scripts/test-main251-original-jsep-native-option-browser.mjs','utf8')
]);

function sample({engine='webkit',arm='pattern_on',bit=1,status=0,withEvent=true,
 withProof=true,withOriginal=true}={}){
 const event={
  phase:'m251_native_option',actualExportCalled:true,argCount:10,
  handleReturned:true,cpuArena:false,memPattern:bit===1
 };
 const proof={
  schema:'M251_ORIGINAL_JSEP_NATIVE_OPTIONS_ABI/v1',
  engine,arm,realWasmExportInvoked:true,nativeMemPatternFlag:bit===1,
  genuineReturnedOptionsHandle:true,researchOnlyLoaderInstrumentation:true,
  pinnedOriginalBinaryUnchanged:true,actualNativeCppMemoryPolicyObserved:false,
  permanentRepairProven:false,familyAlphaHold:true,releaseAuthorized:false
 };
 const stdout=[
  withEvent?'M253_SAME_ATTEMPT_NATIVE_EVENT '+JSON.stringify(event):'',
  withProof?'M251_REAL_ORIGINAL_JSEP_NATIVE_ABI '+JSON.stringify(proof):'',
  ...(withOriginal?[
   'M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY {}',
   'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY {}',
   'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS {}'
  ]:[])
 ].filter(Boolean).join('\n');
 return classifyM253SameAttempt({engine,arm,status,stdout});
}

test('M253 source retains exact original real JSEP compiled export and original worker owner journey',()=>{
 const p=deriveM253Probe(probe);
 const b=deriveM253Browser(browser);
 assert.ok(p.includes('K.Ha)(a,b,c,d,f,g,h,l,m,p)'));
 assert.ok(b.includes('session_options:{enableMemPattern:true}'));
 assert.ok(b.includes('session_options:{enableMemPattern:false}'));
 assert.ok(b.includes('M253_SAME_ATTEMPT_NATIVE_EVENT'));
 assert.ok(b.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS'));
 assert.ok(b.includes("assert.equal(gitBlob(originalWorker),ORIGINAL_WORKER_BLOB"));
 assert.equal(b.split('session_options:{enableMemPattern:true}').length,2);
 assert.ok(M253_JS_GLUE_SHA.length===64&&M253_WASM_SHA.length===64);
 assert.deepEqual([...M253_ARMS],['baseline','pattern_off','pattern_on']);
});

test('M253 synthetic admission: one native true witness plus complete genuine-source marker required',()=>{
 const x=sample();
 assert.equal(x.sameBrowserNativeMemPatternBit,1);
 assert.equal(x.sameBrowserObservedNativeBitMatchesRequest,true);
 assert.equal(x.originalFullModelOwnerAndNativePass,true);
 assert.equal(x.actualNativeCppAllocatorStateRead,false);
 assert.equal(x.naturalIntermittentWebkitRepairProven,false);
 assert.equal(x.releaseAuthorized,false);
});

test('M253 default/off are both false; a true/false differential must not be invented from two false arms',()=>{
 for(const arm of ['baseline','pattern_off']){
  const x=sample({arm,bit:0});
  assert.equal(x.originalFullModelOwnerAndNativePass,true);
  assert.equal(x.sameBrowserNativeMemPatternBit,0);
 }
 assert.equal(sample({arm:'pattern_on',bit:0}).originalFullModelOwnerAndNativePass,false,
  'Unchanged false native flag cannot masquerade as true propagated setting');
 assert.equal(sample({arm:'pattern_off',bit:1}).originalFullModelOwnerAndNativePass,false);
});

test('M253 genuinely failed original model must stay RED despite a valid compiled export flag',()=>{
 const x=sample({status:1,withProof:false,withOriginal:false});
 assert.equal(x.actualCompiledWasmExportEventObserved,true);
 assert.equal(x.sameBrowserNativeMemPatternBit,1);
 assert.equal(x.originalFullModelOwnerAndNativePass,false);
 assert.equal(x.category,'native_export_observed_but_original_model_or_owner_red');
 assert.equal(x.causalRepeatedRedBeforeGreenAfterProven,false);
});

test('M253 fake, duplicate, missing or wrong owner-native proof cannot pass',()=>{
 for(const sampleCase of [
  {withEvent:false},{withProof:false},{withOriginal:false},
  {bit:0},{status:1}
 ]){
  assert.equal(sample(sampleCase).originalFullModelOwnerAndNativePass,false);
 }
 const a='M253_SAME_ATTEMPT_NATIVE_EVENT '+JSON.stringify({
  phase:'m251_native_option',actualExportCalled:true,argCount:10,
  handleReturned:true,cpuArena:false,memPattern:true
 });
 assert.throws(()=>classifyM253SameAttempt({
  engine:'webkit',arm:'pattern_on',status:0,stdout:a+'\n'+a
 }),/Duplicate/);
 assert.throws(()=>classifyM253SameAttempt({
  engine:'webkit',arm:'pattern_on',status:0,
  stdout:'M253_SAME_ATTEMPT_NATIVE_EVENT '+'{'.repeat(5000)
 }),/Oversized/);
 assert.throws(()=>classifyM253SameAttempt({
  engine:'fake',arm:'pattern_on',status:0,stdout:''
 }),/browser/);
});

test('M253 source drift and forged original true-arm implementation rejected',()=>{
 assert.throws(()=>deriveM253Probe(probe.replace(
  'assert.equal(record.memPattern,false,','assert.equal(record.memPattern,true,'
 )),/source anchor drift/);
 assert.throws(()=>deriveM253Browser(browser.replace(
  "session_options:{enableMemPattern:false}","session_options:{enableMemPattern:true}"
 )),/source anchor drift/);
 assert.throws(()=>deriveM253Browser('mocked model owner acceptance'),/source anchor drift/);
});

test('M253 exact source-only original P94 derivation is executable, never called browser evidence',()=>{
 const run=spawnSync(process.execPath,
  ['scripts/test-main253-original-jsep-native-mempattern-contrast-browser.mjs'],{
   env:{...process.env,M253_SOURCE_ONLY:'1',M253_ENGINE:'webkit',M253_ARM:'pattern_on'},
   encoding:'utf8',timeout:90000,maxBuffer:1024*1024
  });
 assert.equal(run.status,0,'Original derivation RED: '+String(run.stderr||'').slice(0,900));
 assert.ok(run.stdout.includes('M253_ORIGINAL_SOURCE_DERIVATION_ONLY'));
 assert.ok(!run.stdout.includes('M253_ORIGINAL_JSEP_NATIVE_CONTRAST_ACTUAL'));
});
