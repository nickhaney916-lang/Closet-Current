/**
 * M248 fixed, no-retry independently fresh real P94 original-model browser
 * research sample. Every process executes the ORIGINAL M247 original P101
 * installed Worker / original public JPEG / fp32 SegFormer JSEP / owner-private
 * outfit v4 acceptance. Never count manual fallback or repeated green as repair.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {
 classifyFreshOriginalAttempt,summarizeIndependentShard,singleOriginalReceipt
} from './main248-fresh-original-jsep-evidence.mjs';
const hash=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
for(const [path,expected] of [
 ['public/outfit-worker-p94.mjs','d66651b616de54c51eb7ef986324b30f1580888f'],
 ['scripts/test-main247-original-jsep-phase-browser.mjs','f43fc837d485d82e058efc07180ecdd3bb21e313'],
 ['scripts/main247-original-jsep-phase-evidence.mjs','d4fef4bf389473d6f3937f409314fae7d9ed69ba'],
 ['scripts/test-parallel101-real-p94-model-init-stage-browser.mjs','ad8ab0eb33322a34f8cc3f45a1fe26feff87b2ab'],
 ['scripts/test-parallel94-native-p88-browser.mjs','4f75a40cf153fa4b4d139d782b202dbe7bc55e41']
]){
 assert.equal(hash(await readFile(path)),expected,'M248 immutable original source moved: '+path);
}
const engine=process.env.M248_ENGINE||'webkit';
const width=Number(process.env.M248_WIDTH||390);
const shard=Number(process.env.M248_SHARD||0);
const expected=Number(process.env.M248_COUNT||(engine==='webkit'?4:2));
assert.ok(['webkit','chromium'].includes(engine),'Original browser engine unsupported');
assert.ok([320,390,430].includes(width),'Original viewport unsupported');
assert.ok(Number.isInteger(shard)&&shard>=0&&shard<2,'Only two independent WebKit shards per width');
assert.equal(expected,engine==='webkit'?4:2,'M248 exact sample count cannot be reduced');
const source=spawnSync(process.execPath,
 ['scripts/test-main247-original-jsep-phase-browser.mjs'],{
  env:{...process.env,M247_SOURCE_ONLY:'1',M247_ENGINE:engine,M247_WIDTH:String(width),
   P101_TEST_FAULT:'none'},encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024
 });
assert.equal(source.status,0,'Pinned original M247 research harness source guard RED');
assert.ok(singleOriginalReceipt(source.stdout,'M247_ORIGINAL_P101_JSEP_SOURCE_READY')?.sourceLocked===true,
 'Original JSEP research harness source verification absent');
if(process.env.M248_SOURCE_ONLY==='1'){
 console.log('M248_PINNED_FRESH_PROCESS_SOURCE_READY',JSON.stringify({
  engine,width,shard,expected,originalWorkerLocked:true,
  originalP101OwnerAndJsepLocked:true,neverRetryNaturalRed:true,
  originalRealBrowserNotExecutedInSourceOnly:true,
  permanentRepairProven:false,releaseAuthorized:false,hold:true
 }));
 process.exit(0);
}
const results=[];
for(let attempt=1;attempt<=expected;attempt++){
 // A separate Node OS process starts an independently launched REAL fresh
 // WebKit/Chromium browser. Never reuse contexts, cache or a model session.
 // No automatic retry after a failure; still measure remaining precommitted
 // independently fresh samples, preserving every genuine original RED.
 const r=spawnSync(process.execPath,
  ['scripts/test-main247-original-jsep-phase-browser.mjs'],{
   env:{...process.env,M247_ENGINE:engine,M247_WIDTH:String(width),
    P101_TEST_FAULT:'none',P101_CACHE_MODE:'baseline',P101_SESSION_MODE:'baseline',
    M248_FRESH_PROCESS_ATTEMPT:String(attempt)},
   encoding:'utf8',timeout:18*60*1000,maxBuffer:32*1024*1024
  });
 let observation;
 try{
  observation=classifyFreshOriginalAttempt({
   engine,width,shard,attempt,exitCode:r.status,signal:r.signal,
   timedOut:r.error?.code==='ETIMEDOUT',stdout:typeof r.stdout==='string'?r.stdout:''
  });
 }catch{
  // Malformed or repeated attestation is RED, never an ignored measurement.
  observation={
   schema:'M248_INDEPENDENT_ORIGINAL_JSEP_ATTEMPT/v1',engine,width,shard,attempt,
   freshBrowserProcess:true,originalPinnedPhotoModelWorker:true,
   passed:false,category:'falsified_or_unparseable_original_receipt',
   childExitedZero:r.status===0,timedOut:r.error?.code==='ETIMEDOUT',
   terminatedBySignal:!!r.signal,
   originalJsepDirectBrowserBinarySHA256:null,
   genuineOriginalNativeMemoryFaultWitness:false,
   originalModelSessionElapsedMs:null,firstInferenceElapsedMs:null,
   originalMemoryRepairProven:false,releaseAuthorized:false,familyAlphaHold:true
  };
 }
 results.push(observation);
 // Print ONLY bounded category, pages/times/binary identity booleans.
 // NEVER forward child stdout/stderr, original JPEG, model, tokens or raw errors.
 console.log('M248_REAL_FRESH_ORIGINAL_JSEP_ATTEMPT',JSON.stringify(observation));
}
const summary=summarizeIndependentShard(results,{engine,width,shard,expected});
console.log('M248_FIXED_FRESH_ORIGINAL_JSEP_SHARD',JSON.stringify(summary));
if(!summary.allPass)process.exitCode=1;
