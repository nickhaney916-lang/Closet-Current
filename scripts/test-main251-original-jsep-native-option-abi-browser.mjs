/**
 * M251 EXACT source-locked original P94 JSEP model/native ABI experiment.
 * Disposable donor M250 (itself source-derived from M249/M247). Only source-
 * derived research Worker installs pass-through exported native ABI observer.
 * No consumer source/ONNX/JSEP/source-photo/owner/backup modification.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {instrumentM251OriginalM250Runner,classifyM251OriginalNative} from './main251-original-jsep-native-option-abi.mjs';

const blob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const pinned=[
 ['public/outfit-worker-p94.mjs','d66651b616de54c51eb7ef986324b30f1580888f'],
 ['scripts/test-parallel94-native-p88-browser.mjs','4f75a40cf153fa4b4d139d782b202dbe7bc55e41'],
 ['scripts/test-main247-real-p94-jsep-model-heap-browser.mjs','92670c115a42f6408577de4d08d8dea24c263cd2'],
 ['scripts/test-main249-original-failed-jsep-browser.mjs','c6f4d42e9e0b26c7adb727b1d1ff1c5999565def'],
 ['scripts/main247-original-worker-jsep-heap-observer.mjs','ea461a2cc7d06b8b03db0f245f0911c5d4695a20'],
 ['scripts/test-main250-original-jsep-mempattern-ab-browser.mjs','49abd4dc6c0c2f12e46174cf275ccda90d5e0171']
];
for(const [path,sha] of pinned){
 assert.equal(blob(await readFile(path)),sha,'Original consumer, photo, native/JSEP test donor changed: '+path);
}
const engine=process.env.M251_ENGINE||'webkit';
const width=Number(process.env.M251_WIDTH||320);
const arm=process.env.M251_ARM||'baseline';
assert.ok(['webkit','chromium'].includes(engine),'Genuine browser engine required');
assert.ok([320,390].includes(width),'Original mobile viewport required');
assert.ok(['baseline','pattern_off'].includes(arm),'Exactly two original runtime session options arms');
const original=(await readFile('scripts/test-main250-original-jsep-mempattern-ab-browser.mjs')).toString('utf8');
let derived=original;
const once=(value,label)=>assert.equal(derived.split(value).length,2,'Original donor '+label+' changed');
const importAnchor="import {\n requireArm,injectOriginalResearchArm,configuredOriginalWorker,";
once(importAnchor,'helper imports');
derived=derived.replace(importAnchor,"import {instrumentM251OriginalM250Runner} from './main251-original-jsep-native-option-abi.mjs';\n"+importAnchor);
const workerAnchor="const adapted=injectOriginalResearchArm(original);";
once(workerAnchor,'actual original M249/M250 model Worker');
derived=derived.replace(workerAnchor,"const adapted=instrumentM251OriginalM250Runner(injectOriginalResearchArm(original));");
const sampleAnchor="assert.equal(expected,engine==='webkit'&&width===320?3:2,";
once(sampleAnchor,'fixed original model sample assertion');
derived=derived.replace(sampleAnchor,"assert.equal(expected,1,");
const receiptAnchor="   results.push(report);";
once(receiptAnchor,'real original model-bound results');
const m251Emit=[
 "   const m251Marker='M251_REAL_ORIGINAL_JSEP_NATIVE_ABI ';",
 "   const m251Lines=String(run.stdout||'').split(/\\r?\\n/).filter(x=>x.startsWith(m251Marker));",
 "   assert.ok(m251Lines.length<=1,'Duplicate same-attempt original JSEP native ABI');",
 "   if(m251Lines.length===1)console.log(m251Lines[0].slice(0,2500));"
].join('\n');
derived=derived.replace(receiptAnchor,m251Emit+'\n'+receiptAnchor);
const tmp=resolve('scripts/.m251-original-jsep-abi-research-disposable.mjs');
try{
 await writeFile(tmp,derived,{flag:'wx'});
 const lint=spawnSync(process.execPath,['--check',tmp],{encoding:'utf8',timeout:30000});
 if(lint.error)throw lint.error;
 assert.equal(lint.status,0,'M251 generated source syntax RED: '+String(lint.stderr||'').slice(0,600));
 const sourceOnly=process.env.M251_SOURCE_ONLY==='1';
 const run=spawnSync(process.execPath,[tmp],{
  env:{...process.env,
   M250_SOURCE_ONLY:sourceOnly?'1':'0',
   M250_ENGINE:engine,M250_WIDTH:String(width),M250_ARM:arm,M250_COUNT:'1',
   M249_CONTROL:'none',M249_SOURCE_ONLY:sourceOnly?'1':'0'},
  encoding:'utf8',timeout:sourceOnly?90000:22*60*1000,maxBuffer:16*1024*1024
 });
 if(run.error)throw run.error;
 if(sourceOnly){
  assert.equal(run.status,0,'Real original research Worker/native ABI source derivation RED');
  assert.ok((run.stdout||'').includes('M250_SESSION_ARM_SOURCE_LOCKED'),
   'M251 exact source-only proof missing');
  console.log('M251_ORIGINAL_JSEP_NATIVE_ABI_SOURCE_READY',JSON.stringify({
   engine,width,arm,originalWorkerAndOriginalM249M250Pinned:true,
   nativeABINotYetExecuted:true,originalOwnerPrivacyRequired:true,
   nativeAllocatorRootCauseStillUnverified:true,
   releaseAuthorized:false,familyAlphaHold:true
  }));
 }else{
  // Only sanitized original M250+M251 source/model and ABI receipts are surfaced.
  const lines=String(run.stdout||'').split(/\r?\n/);
  const safeRows=lines.filter(x=>x.startsWith('M250_GENUINE_ORIGINAL_JSEP_ARM_ATTEMPT '));
  assert.ok(safeRows.length<=1,'Repeated genuine original source-owner receipt');
  let originalM250=null;
  if(safeRows.length===1){
   try{originalM250=JSON.parse(safeRows[0].slice('M250_GENUINE_ORIGINAL_JSEP_ARM_ATTEMPT '.length));}
   catch{}
  }
  let evidence;
  try{
   evidence=classifyM251OriginalNative({
    engine,width,arm,attempt:1,status:run.status,
    stdout:String(run.stdout||''),originalM250
   });
  }catch{
   evidence={schema:'M251_TRUE_ORIGINAL_JSEP_NATIVE_SESSION_ABI_GATE/v1',
    engine,width,arm,attempt:1,modelAndOwnerAndAbiPass:false,
    category:'original_native_abi_missing_ambiguous_or_invalid',
    originalNativeOptionTransportProven:false,
    nativeAbiMemoryPatternFlag:null,permanentMemoryRepairProven:false,
    releaseAuthorized:false,familyAlphaHold:true};
  }
  console.log('M251_ORIGINAL_NATIVE_ABI_ACTUAL_JSEP',JSON.stringify(evidence));
  if(!evidence.modelAndOwnerAndAbiPass)process.exitCode=1;
 }
}finally{await rm(tmp,{force:true});}
