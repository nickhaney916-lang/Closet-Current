/**
 * M248 executes EXACT M247 source-locked genuine ORIGINAL P94 JSEP/browser
 * model+owner+private2D/v4 journey, once per real browser/CI job.
 * It does not retry. A genuine model/session failure cannot become a PASS.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {
 M247_EXACT_BROWSER_GIT_BLOB,M247_EXACT_OBSERVER_GIT_BLOB,
 parseOriginalEvidence,classifyOriginalFailure,verifyPositiveOriginalFirstAttempt
} from './main248-original-jsep-first-red-ledger.mjs';

const engine=process.env.M248_ENGINE||'webkit';
const attempt=process.env.M248_ATTEMPT||'w01';
assert.ok(['webkit','chromium'].includes(engine));
assert.match(attempt,/^[wc][0-9]{2}$/);
assert.equal(attempt[0],engine==='webkit'?'w':'c','Attempt label/engine mismatch');

const gitBlob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
for(const [path,blob] of [
 ['scripts/test-main247-real-p94-jsep-model-heap-browser.mjs',M247_EXACT_BROWSER_GIT_BLOB],
 ['scripts/main247-original-worker-jsep-heap-observer.mjs',M247_EXACT_OBSERVER_GIT_BLOB],
 ['public/outfit-worker-p94.mjs','d66651b616de54c51eb7ef986324b30f1580888f'],
 ['scripts/test-parallel94-native-p88-browser.mjs','4f75a40cf153fa4b4d139d782b202dbe7bc55e41']
]){
 assert.equal(gitBlob(await readFile(path)),blob,'Original JSEP/M247/Worker source drift: '+path);
}
if(process.env.M248_SOURCE_ONLY==='1'){
 console.log('M248_EXACT_FIRST_ATTEMPT_SOURCE_LOCK_PASS',JSON.stringify({
  originalM247JsepHarnessExact:true,originalWorkerUnchanged:true,
  originalPublicModelUnchanged:true,originalOwnerPrivate2DV4Unchanged:true,
  genuineModelSessionPending:true,strictSingleFirstAttempt:true,
  noRetry:true,noSilentModelPositive:true,releaseAuthorized:false,familyAlphaHold:true
 }));
}else{
 const run=spawnSync(process.execPath,
  ['scripts/test-main247-real-p94-jsep-model-heap-browser.mjs'],{
   env:{...process.env,M247_ENGINE:engine,M247_ATTEMPT:attempt},
   encoding:'utf8',maxBuffer:24*1024*1024,timeout:26*60*1000
  });
 const status=run.error?null:run.status;
 const evidence=parseOriginalEvidence((run.stdout||'')+'\n'+(run.stderr||''));
 if(run.error||status!==0){
  // Deliberately emit ONLY bounded scalar info, never raw trace, URLs,
  // image/weights/private source/token/owner names or linear memory bytes.
  const red=classifyOriginalFailure(evidence,status,engine,attempt);
  console.error('M248_ORIGINAL_FIRST_ATTEMPT_RED',JSON.stringify({
   ...red,processErrorCode:run.error?String(run.error.code||'unknown').slice(0,30):null
  }));
  throw new Error('M248 FIRST ORIGINAL P94 JSEP attempt genuinely RED; no retry, no release');
 }
 const passed=verifyPositiveOriginalFirstAttempt(evidence,status,engine,attempt);
 console.log('M248_GENUINE_ORIGINAL_FIRST_ATTEMPT',JSON.stringify(passed));
}
