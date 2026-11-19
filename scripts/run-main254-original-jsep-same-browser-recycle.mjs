/**
 * M254: one independently launched real browser engine with TWO successive
 * complete original P94 model+owner journeys in clean contexts, no restarts.
 * A real first- or second-cycle RED never turns green via a retry.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {
 deriveM254PinnedM251Runner,classifyM254SameBrowser,
 M254_M251_BLOB,M254_ORIGINAL_BROWSER_BLOB,M254_ORIGINAL_WORKER_BLOB
} from './main254-original-jsep-same-browser-recycle.mjs';

const blob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const locks=[
 ['scripts/test-main251-original-jsep-native-option-browser.mjs',M254_M251_BLOB],
 ['scripts/test-parallel94-native-p88-browser.mjs',M254_ORIGINAL_BROWSER_BLOB],
 ['public/outfit-worker-p94.mjs',M254_ORIGINAL_WORKER_BLOB],
 ['scripts/main251-original-jsep-abi-probe.mjs','c1061567b01ec9f6ceb60c7336d38294d6c3f8a4']
];
const sources=await Promise.all(locks.map(([path])=>readFile(path)));
for(let i=0;i<locks.length;i++){
 assert.equal(blob(sources[i]),locks[i][1],'Source SHA changed: '+locks[i][0]);
}
const engine=process.env.M254_ENGINE||'webkit';
const width=Number(process.env.M254_WIDTH||390);
assert.ok(['webkit','chromium'].includes(engine));
assert.ok([320,390].includes(width));
const sourceOnly=process.env.M254_SOURCE_ONLY==='1';
const source=deriveM254PinnedM251Runner(sources[0].toString('utf8'));
const disposable=resolve('scripts/.m254-original-same-browser-runner-'+engine+'-'+width+'.mjs');
let created=false;
try{
 await writeFile(disposable,source,{flag:'wx'});created=true;
 const syntax=spawnSync(process.execPath,['--check',disposable],{
  encoding:'utf8',timeout:30000
 });
 if(syntax.error)throw syntax.error;
 assert.equal(syntax.status,0,'Original model+owner native runner derivation syntax failed: '+String(syntax.stderr||'').slice(0,350));
 const result=spawnSync(process.execPath,[disposable],{
  env:{...process.env,
   M247_ENGINE:engine,M251_ARM:'baseline',M247_SOURCE_ONLY:sourceOnly?'1':'0',
   M58_ENGINE:engine,P94_WIDTH:String(width),M254_ENGINE:engine,M254_WIDTH:String(width)},
  encoding:'utf8',maxBuffer:24*1024*1024,
  timeout:sourceOnly?90000:33*60*1000
 });
 if(sourceOnly){
  if(result.error)throw result.error;
  assert.equal(result.status,0,'M254 original derived source-only preflight failed: '+String(result.stderr||'').slice(0,1700));
  assert.ok(result.stdout.includes('M247_PINNED_ORIGINAL_JSEP_PROBE_READY'),
   'M251 real fixture did not complete source-only preflight');
  assert.ok(!result.stdout.includes('M254_ORIGINAL_BROWSER_CYCLE_PASS'));
  console.log('M254_SAME_BROWSER_SOURCE_ONLY',JSON.stringify({
   engine,width,originalPinnedWorkerAndOwnerBrowserImmutable:true,
   realBrowserExecuted:false,realOriginalInferenceExecuted:false,
   twoContextsSameProcessSourceVerified:true,
   browserNaturalFailureStillUnresolved:true,
   releaseAuthorized:false,familyAlphaHold:true
  }));
 }else{
  let proof;
  try{
   proof=classifyM254SameBrowser({
    engine,width,status:result.status,signal:result.signal,stdout:String(result.stdout||'')
   });
  }catch{
   proof={schema:'M254_REAL_ORIGINAL_JSEP_SAME_BROWSER_CONTEXT_RECYCLE/v1',
    engine,width,fullOriginalSameProcessRecreationPass:false,
    category:'missing_duplicate_or_malformed_original_model_owner_native_receipts',
    originalNonzeroOrTimeout:result.status!==0||!!result.signal,
    originalCppAllocatorStateRead:false,
    naturalIntermittentWebkitRootCauseFixed:false,
    noRetries:true,releaseAuthorized:false,familyAlphaHold:true};
  }
  // Preserve a bounded outcome; original uncaught model failures are never
  // retried, replaced with fake inference or printed with raw pixels/error.
  console.log('M254_ACTUAL_ORIGINAL_SAME_BROWSER_TWO_CONTEXTS',JSON.stringify(proof));
  if(result.error||!proof.fullOriginalSameProcessRecreationPass)process.exitCode=1;
 }
}finally{
 if(created)await rm(disposable,{force:true});
 // If the child process fails after creating its disposable exact-source
 // browser file, remove only that test-generated copy, never product inputs.
 await rm(resolve('scripts/.m254-original-jsep-same-browser-fixture.mjs'),{force:true});
}
