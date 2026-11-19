/**
 * M249 follow-through: never conflate an intentionally aborted ONNX request
 * with the INTERMITTENT natural original WebKit/JSEP model-load defect.
 *
 * This test runs M249 source-locked ORIGINAL P94 SegFormer/JSEP real source and
 * owner/private 2D/v4 verification independently in NEW OS browser processes.
 * A real RED is retained (not retried), recorded and causes CI failure.
 * Private JPEG, owner, raw error messages and WASM memory are NOT copied.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {classifyOneRealOriginalAttempt,aggregateRealOriginalAttempts}
 from './main249-original-jsep-natural-red-ledger.mjs';
const gitBlob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
assert.equal(gitBlob(await readFile('scripts/test-main249-original-failed-jsep-browser.mjs')),
 'c6f4d42e9e0b26c7adb727b1d1ff1c5999565def','Exact verified M249 original model browser changed');
assert.equal(gitBlob(await readFile('scripts/main249-original-failed-jsep-source-witness.mjs')),
 'b2fa286f3214d49b9352d95c236bda7ca11cab9a','M249 original failure classifier changed');
assert.equal(gitBlob(await readFile('public/outfit-worker-p94.mjs')),
 'd66651b616de54c51eb7ef986324b30f1580888f','Protected original Worker changed');
// Disposable exact-M249 research-only original browser runner: only pass the
// genuine requested mobile viewport through the source-locked M247 wrapper.
// The original M247 harness hardcodes 390px, which would invalidate 320/430 evidence.
const originalRunner=await readFile('scripts/test-main249-original-failed-jsep-browser.mjs','utf8');
const widthSourceAnchor="let source=original.toString('utf8');";
assert.equal(originalRunner.split(widthSourceAnchor).length,2,'M249 runner derivation anchor changed');
const viewportDerived=originalRunner.replace(widthSourceAnchor,widthSourceAnchor+"\n"+
 "const nativeWidthAnchor=\"P94_WIDTH:'390'\";\n"+
 "assert.equal(source.split(nativeWidthAnchor).length,2,'M247 native viewport hardcode changed');\n"+
 "source=source.replace(nativeWidthAnchor,'P94_WIDTH:process.env.M249_WIDTH');");
const disposableRunner=resolve('scripts/.m249-cohort-actual-mobile-viewport.mjs');
await writeFile(disposableRunner,viewportDerived,{flag:'wx'});
const engine=process.env.M249_STRESS_ENGINE||'webkit';
const width=Number(process.env.M249_STRESS_WIDTH||320);
const count=Number(process.env.M249_STRESS_COUNT||4);
const batch=process.env.M249_STRESS_BATCH||'A';
assert.ok(['webkit','chromium'].includes(engine));
assert.ok([320,390,430].includes(width));
assert.ok(Number.isInteger(count)&&count>=1&&count<=8);
assert.match(batch,/^[a-zA-Z0-9_-]{1,16}$/);
if(process.env.M249_STRESS_SOURCE_ONLY==='1'){
 const s=spawnSync(process.execPath,[disposableRunner],{
  env:{...process.env,M249_SOURCE_ONLY:'1',M249_ENGINE:engine,M249_WIDTH:String(width),M249_CONTROL:'none'},
  timeout:45000,encoding:'utf8',maxBuffer:1024*1024
 });
 if(s.error)throw s.error;
 assert.equal(s.status,0,'Source-only M249 native test drift');
 assert.match(s.stdout,/M249_ORIGINAL_SOURCE_LOCKED/);
 console.log('M249_NATURAL_JSEP_SOURCE_READY',JSON.stringify({
  engine,width,count,batch,sourceWorkerAndErrorTaxonomyPinned:true,
  realNativeTrialNotYetRun:true,permanentRepairProven:false,hold:true}));
 await rm(disposableRunner,{force:true});
 process.exit(0);
}
try {
const trials=[];
for(let attempt=1;attempt<=count;attempt++){
 const run=spawnSync(process.execPath,[disposableRunner],{
  env:{...process.env,M249_ENGINE:engine,M249_WIDTH:String(width),M249_CONTROL:'none'},
  encoding:'utf8',timeout:13*60*1000,maxBuffer:16*1024*1024
 });
 let one;
 try{
  one=classifyOneRealOriginalAttempt({
   engine,width,attempt,exitCode:run.status,
   signal:run.signal||null,timedOut:run.error?.code==='ETIMEDOUT',
   stdout:run.stdout||''
  });
 }catch{
  // A counterfeit/missing receipt on a real browser is UNCLASSIFIED RED.
  // Do not leak child exception, stdout or stderr.
  one={schema:'M249_ORIGINAL_JSEP_NATURAL_ATTEMPT/v1',engine,width,attempt,
   outcome:'INVALID_EVIDENCE_RED',originalNativeAttempted:true,
   originalPrivate2DV4Accepted:false,directOriginalWebkitJsepHash:false,
   reportedWorkerExceptionName:'UNKNOWN',reportedWorkerExceptionCategory:'UNKNOWN',
   realNativeAllocatorRootCauseProven:false,permanentFixProven:false,
   releaseAuthorized:false,hold:true};
 }
 trials.push(one);
 console.log('M249_REAL_ORIGINAL_JSEP_ATTEMPT',JSON.stringify({...one,batch}));
}
const summary=aggregateRealOriginalAttempts(trials,{engine,width,batch,expected:count});
const dir=resolve('benchmark/main249-original-jsep-native-errors');
await mkdir(dir,{recursive:true});
await writeFile(join(dir,engine+'-'+width+'-'+batch+'.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
console.log('M249_REAL_ORIGINAL_JSEP_COHORT',JSON.stringify(summary));
assert.equal(summary.red,0,
 'Genuine original WebKit/JSEP red occurred or evidence invalid: preserve this failed job and its error taxonomy; do not retry to green');

} finally {await rm(disposableRunner,{force:true});}
