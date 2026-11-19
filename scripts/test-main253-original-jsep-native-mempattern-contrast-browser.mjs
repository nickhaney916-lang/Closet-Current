/**
 * M253 one original fresh-process P94+JSEP+owner browser per CI matrix case.
 * No retries. A real failure remains RED with sanitized same-attempt evidence.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {
 M253_ARMS,M253_BROWSER_BLOB,M253_PROBE_BLOB,M253_CONSUMER_BLOB,
 deriveM253Probe,deriveM253Browser,classifyM253SameAttempt
} from './main253-original-jsep-native-mempattern-contrast.mjs';

const blob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const immutable=[
 ['scripts/test-main251-original-jsep-native-option-browser.mjs',M253_BROWSER_BLOB],
 ['scripts/main251-original-jsep-abi-probe.mjs',M253_PROBE_BLOB],
 ['public/outfit-worker-p94.mjs',M253_CONSUMER_BLOB],
 ['scripts/test-parallel94-native-p88-browser.mjs','4f75a40cf153fa4b4d139d782b202dbe7bc55e41'],
 ['scripts/test-main247-real-p94-jsep-model-heap-browser.mjs','92670c115a42f6408577de4d08d8dea24c263cd2']
];
const bytes=await Promise.all(immutable.map(([path])=>readFile(path)));
for(let i=0;i<immutable.length;i++){
 assert.equal(blob(bytes[i]),immutable[i][1],'Pinned original product or native research source drift: '+immutable[i][0]);
}
const engine=process.env.M253_ENGINE||'webkit';
const arm=process.env.M253_ARM||'pattern_on';
const sourceOnly=process.env.M253_SOURCE_ONLY==='1';
assert.ok(['webkit','chromium'].includes(engine),'M253 genuine native browser required');
assert.ok(M253_ARMS.includes(arm),'M253 arm is original baseline, off, or on only');
const probe=deriveM253Probe(bytes[1].toString('utf8'));
const browser=deriveM253Browser(bytes[0].toString('utf8'));
const generatedProbe=resolve('scripts/.m253-native-abi-probe.disposable.mjs');
const generatedBrowser=resolve('scripts/.m253-native-browser.disposable.mjs');
let madeProbe=false,madeBrowser=false;
try{
 await writeFile(generatedProbe,probe,{flag:'wx'});madeProbe=true;
 await writeFile(generatedBrowser,browser,{flag:'wx'});madeBrowser=true;
 for(const path of [generatedProbe,generatedBrowser]){
  const lint=spawnSync(process.execPath,['--check',path],{encoding:'utf8',timeout:30000});
  if(lint.error)throw lint.error;
  assert.equal(lint.status,0,'M253 pinned source-derived research JS invalid: '+String(lint.stderr||'').slice(0,400));
 }
 if(sourceOnly){
  const source=spawnSync(process.execPath,[generatedBrowser],{
   env:{...process.env,M247_SOURCE_ONLY:'1',M251_ARM:arm,M247_ENGINE:engine},
   encoding:'utf8',timeout:90000,maxBuffer:1024*1024
  });
  if(source.error)throw source.error;
  assert.equal(source.status,0,'M253 pinned original browser source-only failed: '+String(source.stderr||'').slice(0,450));
  assert.ok(source.stdout.includes('M247_PINNED_ORIGINAL_JSEP_PROBE_READY'));
  assert.ok(!source.stdout.includes('M251_REAL_ORIGINAL_JSEP_NATIVE_ABI'));
  console.log('M253_ORIGINAL_SOURCE_DERIVATION_ONLY',JSON.stringify({
   engine,arm,pinnedOriginalWorker:true,pinnedOriginalBrowser:true,
   trueArmChangesOnlyTestDerivedFromPretrainedOptions:true,
   actualNativeExportNotYetExecuted:true,realBrowserExecuted:false,
   nativeAllocatorNotInspected:true,releaseAuthorized:false,familyAlphaHold:true
  }));
 }else{
  const run=spawnSync(process.execPath,[generatedBrowser],{
   env:{...process.env,M247_SOURCE_ONLY:'0',M251_ARM:arm,M247_ENGINE:engine},
   encoding:'utf8',timeout:25*60*1000,maxBuffer:16*1024*1024
  });
  let data;
  try{
   data=classifyM253SameAttempt({
    engine,arm,status:run.status,signal:run.signal,stdout:String(run.stdout||'')
   });
  }catch{
   data={
    schema:'M253_ORIGINAL_JSEP_NATIVE_MEMPATTERN_CONTRAST/v1',engine,arm,
    category:'missing_duplicate_oversized_or_unparseable_original_native_receipt',
    actualCompiledWasmExportEventObserved:false,
    originalFullModelOwnerAndNativePass:false,
    originalChildExit:run.status===0?0:run.status===null?null:1,
    actualNativeCppAllocatorStateRead:false,
    naturalIntermittentWebkitRepairProven:false,
    causalRepeatedRedBeforeGreenAfterProven:false,
    releaseAuthorized:false,familyAlphaHold:true
   };
  }
  console.log('M253_ORIGINAL_JSEP_NATIVE_CONTRAST_ACTUAL',JSON.stringify(data));
  // No fallback, no retries, no owner/private success if native/test path RED.
  if(run.error||!data.originalFullModelOwnerAndNativePass)process.exitCode=1;
 }
}finally{
 if(madeBrowser)await rm(generatedBrowser,{force:true});
 if(madeProbe)await rm(generatedProbe,{force:true});
}
