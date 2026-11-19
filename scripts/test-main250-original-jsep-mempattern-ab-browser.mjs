/**
 * M250 fixed original model/owner JSEP session-options comparison.
 * Every sample is a fresh Node OS process and a fresh genuine browser.
 * The only experimental model-source difference is a supported API REQUEST
 * session_options.enableMemPattern:false. Never claim native ABI changed.
 * Natural original model RED is never retried to green or counted as success.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {
 requireArm,injectOriginalResearchArm,configuredOriginalWorker,
 m250ClassifyOriginal,m250Summarize
} from './main250-original-jsep-mempattern-study.mjs';

const blob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const paths=[
 ['scripts/test-main249-original-failed-jsep-browser.mjs','c6f4d42e9e0b26c7adb727b1d1ff1c5999565def'],
 ['scripts/test-main247-real-p94-jsep-model-heap-browser.mjs','92670c115a42f6408577de4d08d8dea24c263cd2'],
 ['scripts/main247-original-worker-jsep-heap-observer.mjs','ea461a2cc7d06b8b03db0f245f0911c5d4695a20'],
 ['scripts/test-parallel94-native-p88-browser.mjs','4f75a40cf153fa4b4d139d782b202dbe7bc55e41'],
 ['public/outfit-worker-p94.mjs','d66651b616de54c51eb7ef986324b30f1580888f']
];
for(const [path,expected] of paths){
 assert.equal(blob(await readFile(path)),expected,'Original research source/body drifted: '+path);
}
const engine=process.env.M250_ENGINE||'webkit';
const width=Number(process.env.M250_WIDTH||320);
const arm=requireArm(process.env.M250_ARM||'baseline');
const expected=Number(process.env.M250_COUNT||(engine==='webkit'&&width===320?3:2));
assert.ok(['webkit','chromium'].includes(engine),'Real native browser required');
assert.ok([320,390].includes(width),'Only original native viewports for M250');
assert.equal(expected,engine==='webkit'&&width===320?3:2,
 'M250 precommitted A/B sample size cannot be reduced or rerun to green');
const worker=await readFile('public/outfit-worker-p94.mjs','utf8');
const configured=configuredOriginalWorker(worker,arm);
assert.ok(configured.includes("device:'wasm',dtype:'fp32'"));
const original=await readFile('scripts/test-main249-original-failed-jsep-browser.mjs','utf8');
const adapted=injectOriginalResearchArm(original);
assert.ok(adapted.includes('M250 original model-options call drift'));
const temp=resolve('scripts/.m250-original-jsep-session-option-research.mjs');
try{
 await writeFile(temp,adapted,{flag:'wx'});
 const check=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});
 if(check.error)throw check.error;
 assert.equal(check.status,0,'M250 modified research driver syntax RED: '+String(check.stderr||'').slice(0,500));
 // Actually execute the full source derivation and exact original Worker
 // Git blob guard in the parent. It compiles the disposable original source;
 // source-only must never pretend that a native model/owner attempt ran.
 if(process.env.M250_SOURCE_ONLY==='1'){
  const sourceRun=spawnSync(process.execPath,[temp],{
   env:{...process.env,M249_SOURCE_ONLY:'1',M249_ENGINE:engine,
    M249_WIDTH:String(width),M249_CONTROL:'none',M250_ARM:arm},
   encoding:'utf8',timeout:30000,maxBuffer:3*1024*1024
  });
  if(sourceRun.error)throw sourceRun.error;
  assert.equal(sourceRun.status,0,'M250 original M249/M247 source derivation RED: '+String(sourceRun.stderr||'').slice(0,500));
  assert.ok((sourceRun.stdout||'').includes('M249_ORIGINAL_SOURCE_LOCKED'),
   'Original browser/Worker source-lock receipt missing');
  console.log('M250_SESSION_ARM_SOURCE_LOCKED',JSON.stringify({
   engine,width,arm,expected,requestedSessionOptionsOnly:arm==='pattern_off',
   noProductRuntimeOrOriginalWorkerChange:true,
   modelWorkerOriginalJsepOnly:true,originalPhotoOwner2DV4Protected:true,
   nativeMemoryOptionForwardingUnproven:true,
   realBrowserExecuted:false,hold:true,releaseAuthorized:false
  }));
 }else{
  const results=[];
  for(let attempt=1;attempt<=expected;attempt++){
   // The next attempt is a DIFFERENT precommitted process, never a retry.
   const run=spawnSync(process.execPath,[temp],{
    env:{...process.env,M249_SOURCE_ONLY:'0',M249_ENGINE:engine,
     M249_WIDTH:String(width),M249_CONTROL:'none',M250_ARM:arm},
    encoding:'utf8',timeout:14*60*1000,maxBuffer:16*1024*1024
   });
   let report;
   try{
    report=m250ClassifyOriginal({
     arm,engine,width,attempt,status:run.status,signal:run.signal,
     stdout:typeof run.stdout==='string'?run.stdout:''
    });
   }catch{
    report={
     schema:'M250_ORIGINAL_MODEL_SESSION_OPTION_AB/v1',arm,engine,width,attempt,
     freshRealBrowserAndNodeProcess:true,positive:false,
     category:'missing_ambiguous_or_unparseable_original_receipt',
     optionRequestOnly:arm==='pattern_off'?'enableMemPattern:false':'original_default',
     optionReachedNativeCAbiProven:false,
     allocatorRootCauseProven:false,permanentRepairProven:false,
     familyAlphaHold:true,releaseAuthorized:false
    };
   }
   results.push(report);
   // No raw error/owner/photo/model/WASM bytes or URL logging.
   console.log('M250_GENUINE_ORIGINAL_JSEP_ARM_ATTEMPT',JSON.stringify(report));
  }
  const summary=m250Summarize(results,{arm,engine,width,expected});
  console.log('M250_GENUINE_ORIGINAL_JSEP_ARM_SAMPLE',JSON.stringify(summary));
  if(!summary.allPass)process.exitCode=1;
 }
}finally{await rm(temp,{force:true});}
