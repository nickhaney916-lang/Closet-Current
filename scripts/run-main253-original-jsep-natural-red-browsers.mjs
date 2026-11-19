/**
 * M253 original native P94 Worker / original pinned JSEP browser cohort.
 * Genuine fresh OS process, WebKit/Chromium engine, no synthetic logits.
 * Every sample is attempted, every RED remains nonzero. NO RETRIES.
 * The only generated source changes are observational/viewport/guard.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {m253Config,deriveM253ObservableRunner,m253Classify,m253Summary}
 from './main253-natural-jsep-native-failure-cohort.mjs';
const engine=process.env.M253_ENGINE||'webkit';
const width=Number(process.env.M253_WIDTH||320);
const count=Number(process.env.M253_COUNT||(engine==='webkit'?8:2));
m253Config(engine,width,count);
const original=await readFile('scripts/test-main251-original-jsep-native-option-browser.mjs','utf8');
let derived=deriveM253ObservableRunner(original);
// Native browser model and original JSEP bytes unchanged. Limit each first
// original attempt's *terminal guard* to seven minutes (rather than 24) so
// an actual hang is preserved, logged as timed out and not retried.
const swapOnce=(before,after,label)=>{
 assert.equal(derived.split(before).length,2,'Original M251 '+label+' source moved');
 derived=derived.replace(before,after);
};
swapOnce("timeout:24*60*1000","timeout:7*60*1000",'original session guard');
swapOnce("const temporary=resolve('scripts/.m251-original-jsep-native-option-browser.mjs');",
 "const temporary=resolve('scripts/.m253-original-jsep-native-browser-'+process.env.M253_ENGINE+'-'+process.env.M253_WIDTH+'-'+process.env.M253_ATTEMPT+'.mjs');",
 'temporary exact-source browser path');
assert.ok(derived.includes('M253_THIS_ATTEMPT_ORIGINAL_BROWSER_JSEP'));
assert.ok(derived.includes('M253_THIS_ATTEMPT_NATIVE_OPTION'));
assert.ok(derived.includes('M58_REAL_P88_WORKER_FAIL'));
const filename=resolve('scripts/.m253-cohort-derived-original-source-'+engine+'-'+width+'.mjs');
try{
 await writeFile(filename,derived,{flag:'wx'});
 const syntax=spawnSync(process.execPath,['--check',filename],{
  encoding:'utf8',timeout:30000
 });
 if(syntax.error)throw syntax.error;
 assert.equal(syntax.status,0,'Source-only original M251 model browser derivation syntax failed');
 if(process.env.M253_SOURCE_ONLY==='1'){
  // Source-only test must never be counted as a real native browser run.
  const r=spawnSync(process.execPath,[filename],{
   env:{...process.env,M247_SOURCE_ONLY:'1',M247_ENGINE:engine,
    M251_ARM:'baseline',M253_WIDTH:String(width),M253_ATTEMPT:'1'},
   encoding:'utf8',timeout:30000,maxBuffer:1024*1024
  });
  if(r.error)throw r.error;
  assert.equal(r.status,0,'Derived original P94 Worker source check RED');
  assert.ok(r.stdout.includes('M247_PINNED_ORIGINAL_JSEP_PROBE_READY'));
  console.log('M253_ORIGINAL_JSEP_SOURCE_ONLY',JSON.stringify({
   sourcePinned:true,engine,width,attemptedNativeBrowser:false,
   originalProductModelUntouched:true,originalSourcePrivateOwnerUntouched:true,
   noWorkaroundOrRelease:true,familyAlphaHold:true
  }));
 }else{
  const records=[];
  for(let attempt=1;attempt<=count;attempt++){
   // Each process launches the REAL browser and original full photo/owner flow.
   // No attempt reruns after a genuine model failure or native process timeout.
   const run=spawnSync(process.execPath,[filename],{
    env:{...process.env,M247_SOURCE_ONLY:'0',M247_ENGINE:engine,
     M251_ARM:'baseline',M253_ENGINE:engine,M253_WIDTH:String(width),
     M253_ATTEMPT:String(attempt)},
    encoding:'utf8',timeout:8*60*1000,maxBuffer:24*1024*1024
   });
   let evidence;
   try{
    evidence=m253Classify({
     engine,width,attempt,exitCode:run.status,signal:run.signal,
     stdout:typeof run.stdout==='string'?run.stdout:'',
     stderr:typeof run.stderr==='string'?run.stderr:''
    });
   }catch{
    // Preserve missing/ambiguous receipts as a first-attempt failure, never
    // claim a model ready, owner save, or native option result.
    evidence={
     schema:'M253_ORIGINAL_JSEP_NATIVE_FRESH_ATTEMPT/v1',engine,width,attempt,
     separateOriginalOsProcess:true,arm:'original_default',positive:false,
     originalNonzeroExit:run.status!==0||!!run.signal,
     naturalPostNativeModelFailureCandidate:false,
     errorClass:'INVALID_OR_MISSING_ORIGINAL_ATTEMPT_EVIDENCE',
     errorSpecificNativeCppRootCauseVerified:false,
     originalProductNaturalRedToGreenFixProven:false,
     releaseAuthorized:false,familyAlphaHold:true
    };
   }
   records.push(evidence);
   // Allowlist only numeric/boolean source evidence. DO NOT echo raw model
   // errors, CDN URLs, original photo, JWT, owner IDs, heap or tensor data.
   console.log('M253_GENUINE_ORIGINAL_JSEP_FIRST_ATTEMPT',JSON.stringify(evidence));
   // Clean stale disposable browser module if the guarded child exited early.
   // No source model/worker/original fixtures are removed.
   await rm(resolve('scripts/.m253-original-jsep-native-browser-'+engine+'-'+width+'-'+attempt+'.mjs'),{force:true});
  }
  const summary=m253Summary(records,{engine,width,count});
  console.log('M253_FIXED_GENUINE_ORIGINAL_JSEP_COHORT',JSON.stringify(summary));
  if(!summary.wholeCohortPass)process.exitCode=1;
 }
}finally{
 await rm(filename,{force:true});
}
