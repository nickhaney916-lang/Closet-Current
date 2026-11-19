/**
 * M248: bounded genuine fresh-process original P94 / SegFormer JSEP stress.
 * Same REAL model, same original public photo, same explicit synthetic owner
 * and 2D/v4 private restore; only a temporary copy of M247's diagnostic
 * browser-wrapper selects requested mobile viewport. No retry, no mock.
 *
 * A naturally failing model remains RED. Result summaries contain only
 * bounded classifications; no owner/source/JWT/raw memory/error text.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {classifyOriginalProcess,summarizeFreshAttempts}
 from './main248-original-jsep-trial-ledger.mjs';
const input='scripts/test-main247-real-p94-jsep-model-heap-browser.mjs';
const raw=await readFile(input);
const gitBlob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
assert.equal(gitBlob(raw),'92670c115a42f6408577de4d08d8dea24c263cd2','M247 genuine original browser+memory diagnostic changed');
assert.equal(gitBlob(await readFile('public/outfit-worker-p94.mjs')),
 'd66651b616de54c51eb7ef986324b30f1580888f','Original installed P94 Worker changed');
assert.equal(gitBlob(await readFile('scripts/test-parallel94-native-p88-browser.mjs')),
 '4f75a40cf153fa4b4d139d782b202dbe7bc55e41','Original browser/owner JSEP fixture changed');
const width=Number(process.env.M248_WIDTH||390);
const engine=process.env.M248_ENGINE||'webkit';
const count=Number(process.env.M248_COUNT||1);
const batch=process.env.M248_BATCH||'a';
assert.ok([320,390,430].includes(width));
assert.ok(['webkit','chromium'].includes(engine));
assert.ok(Number.isInteger(count)&&count>=1&&count<=8);
assert.match(batch,/^[a-zA-Z0-9_-]{1,16}$/);
let derived=raw.toString('utf8');
const sourceNeedle="P94_WIDTH:'390'";
assert.equal(derived.split(sourceNeedle).length,2,'Original M247 width anchor drift');
derived=derived.replace(sourceNeedle,'P94_WIDTH:process.env.M248_WIDTH');
assert.ok(derived.includes('M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY'));
assert.ok(derived.includes('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY'));
assert.ok(derived.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS'));
assert.ok(derived.includes('deriveOriginalP94JsepObserver'));
const temporary=resolve('scripts/.main248-original-jsep-viewport-selection.mjs');
const evidenceDir=resolve('benchmark/main248-fresh-jsep-cohort');
const runID=engine+'-'+width+'-'+batch;
try{
 await writeFile(temporary,derived,{flag:'wx'});
 const syntax=spawnSync(process.execPath,['--check',temporary],{encoding:'utf8',timeout:30000});
 if(syntax.error)throw syntax.error;
 assert.equal(syntax.status,0,'Temporary original viewport runner not valid');
 const env={...process.env,M247_ENGINE:engine,M248_WIDTH:String(width)};
 if(process.env.M248_SOURCE_ONLY==='1'){
  const check=spawnSync(process.execPath,[temporary],{
   env:{...env,M247_SOURCE_ONLY:'1'},encoding:'utf8',timeout:45000,maxBuffer:4*1024*1024
  });
  if(check.error)throw check.error;
  assert.equal(check.status,0,'Source-only original JSEP probe refused invalid source');
  assert.match(check.stdout,/M247_PINNED_ORIGINAL_JSEP_PROBE_READY/);
  console.log('M248_EXACT_SOURCE_READY',JSON.stringify({
   engine,width,batch,originalBrowserWorkerAndModelSourcePinned:true,
   actualNativeTrialPending:true,causalFixProven:false,hold:true}));
 }else{
  const trials=[];
  for(let i=1;i<=count;i++){
   // Every attempt launches its OWN node process, browser process, Worker
   // and original SegFormer session; never retry a failing sample.
   const run=spawnSync(process.execPath,[temporary],{
    encoding:'utf8',env,maxBuffer:16*1024*1024,timeout:13*60*1000
   });
   const trial=classifyOriginalProcess({
    engine,width,slot:i,exitCode:run.status,signal:run.signal,
    timedOut:run.error?.code==='ETIMEDOUT',
    stdout:run.stdout||'',stderr:run.stderr||''
   });
   // Preserve each observed RED as RED while continuing other INDEPENDENT
   // samples; never overwrite it with a later green "retry".
   trials.push(trial);
   console.log('M248_FRESH_ORIGINAL_PROCESS',JSON.stringify({...trial,batch}));
  }
  const cohort=summarizeFreshAttempts(trials,{engine,width,batch,requested:count});
  await mkdir(evidenceDir,{recursive:true});
  const dest=join(evidenceDir,runID+'.json');
  await writeFile(dest,JSON.stringify(cohort,null,2)+'\n',{flag:'wx'});
  console.log('M248_ORIGINAL_JSEP_COHORT',JSON.stringify(cohort));
  assert.equal(cohort.originalModelReds,0,
   'A real original JSEP process was RED: preserve exact original model failure; do not retry to green or claim fixed');
 }
}finally{
 await rm(temporary,{force:true});
}
