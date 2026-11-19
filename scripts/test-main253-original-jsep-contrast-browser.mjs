/**
 * Genuine M253 original product P94 SegFormer JSEP source-owner journey:
 * explicitly different native ON/OFF options, independent processes.
 * A natural original failure is never retried or counted as green.
 */
import assert from 'node:assert/strict';
import {writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {
 verifiedM253OriginalRunner,require253Arm,classifyM253NativeAttempt
} from './main253-jsep-contrast-helper.mjs';
const engine=process.env.M253_ENGINE||'webkit';
const arm=require253Arm(process.env.M253_ARM||'pattern_on');
const width=Number(process.env.M253_WIDTH||320);
const count=Number(process.env.M253_COUNT||(engine==='webkit'?2:1));
assert.ok(['webkit','chromium'].includes(engine),'Only actual original native browser engines');
assert.ok([320,390].includes(width),'Original 320/390 mobile viewport');
assert.equal(count,engine==='webkit'?2:1,'Precommitted samples cannot be lowered');
const derived=await verifiedM253OriginalRunner();
assert.ok(derived.includes('verifyM253ActualOptionReceipt'));
assert.ok(derived.includes('M253_REAL_ORIGINAL_JSEP_NATIVE_ABI'));
const temporary=resolve('scripts/.m253-original-jsep-contrast-experiment.mjs');
try{
 await writeFile(temporary,derived,{flag:'wx'});
 const syntax=spawnSync(process.execPath,['--check',temporary],{
  encoding:'utf8',timeout:30000,maxBuffer:1024*1024
 });
 if(syntax.error)throw syntax.error;
 assert.equal(syntax.status,0,'Original source derived M253 syntax RED: '+String(syntax.stderr||'').slice(0,300));
 if(process.env.M253_SOURCE_ONLY==='1'){
  const check=spawnSync(process.execPath,[temporary],{
   encoding:'utf8',timeout:30000,maxBuffer:2*1024*1024,
   env:{...process.env,M247_SOURCE_ONLY:'1',M247_ENGINE:engine,
    M251_ARM:arm,M253_WIDTH:String(width)}
  });
  if(check.error)throw check.error;
  assert.equal(check.status,0,'Original native source-only derivation RED: '+String(check.stderr||'').slice(0,350));
  assert.ok(check.stdout.includes('M247_PINNED_ORIGINAL_JSEP_PROBE_READY'),
   'No source-lock receipt');
  assert.ok(!check.stdout.includes('M253_REAL_ORIGINAL_JSEP_NATIVE_ABI'),
   'Source-only may never claim native execution');
  console.log('M253_SOURCE_ONLY_PINNED',JSON.stringify({
   engine,arm,width,count,sourceDerived:true,realBrowserExecuted:false,
   actualNativeFlagObserved:false,repaired:false,hold:true
  }));
 }else{
  const results=[];
  for(let attempt=1;attempt<=count;attempt++){
   const run=spawnSync(process.execPath,[temporary],{
    encoding:'utf8',timeout:22*60*1000,maxBuffer:16*1024*1024,
    env:{...process.env,M247_SOURCE_ONLY:'0',M247_ENGINE:engine,
     M251_ARM:arm,M253_WIDTH:String(width)}
   });
   const record=classifyM253NativeAttempt({
    stdout:run.stdout||'',status:run.status,signal:run.signal,
    arm,engine,width,attempt
   });
   results.push(record);
   console.log('M253_GENUINE_ORIGINAL_FIRST_PROCESS',JSON.stringify(record));
   // Genuine original nonzero is durable RED, not retried. Next precommitted
   // process may still run, but no failed attempt can be erased.
  }
  const passed=results.filter(x=>x.originalModelPositive).length;
  const summary={
   schema:'M253_PRECOMMITTED_GENUINE_NATIVE_CONTRAST_SAMPLE/v1',
   engine,arm,width,attempts:count,genuineOriginalModelOwnerPositive:passed,
   genuineOriginalRed:count-passed,
   expectedNativeMemoryPattern:arm==='pattern_on',
   allPass:passed===count,
   causalWebkitRepairEstablished:false,nativeCppHeapNotRead:true,
   anyOriginalRedPreserved:count!==passed,
   hold:true,releaseAuthorized:false
  };
  console.log('M253_GENUINE_ORIGINAL_NATIVE_CONTRAST_SAMPLE',JSON.stringify(summary));
  if(!summary.allPass)process.exitCode=1;
 }
}finally{
 await rm(temporary,{force:true});
}
