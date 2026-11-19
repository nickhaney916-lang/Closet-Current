import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {
 configuredOriginalWorker,disposableM247WorkerReplacement,
 injectOriginalResearchArm,m250ClassifyOriginal,m250Summarize,extractBoundedReceipt,
 requireArm,ORIGINAL_JSEP_SHA250,ORIGINAL_PHOTO_SHA250,
 M250_OPTION_ANCHOR,M250_OPTION_OFF
} from '../scripts/main250-original-jsep-mempattern-study.mjs';

const mk=(label,value)=>label+' '+JSON.stringify(value);
function positiveLog(engine='webkit',width=320){
 return [
 mk('M249_GENUINE_SOURCE_OWNER_PASS',{engine,width:String(width),trueNativeJsepWorker:true,originalModelAndOwner2DV4:true}),
 mk('M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY',{engine,originalJsepWasmSha256:ORIGINAL_JSEP_SHA250,
  originalModelSessionReady:true,actualOriginalBrowserJsepBodyHash:engine==='webkit'}),
 mk('M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT',{phase:'m247_jsep_memory',outcome:'ready',
  hookInstalled:true,growCalls:5,growErrors:0,firstPages:256,terminalPages:767}),
 mk('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',{
  engine,modelExecuted:true,manualSyntheticOwnerConfirmed:true,ownerPrivateSaved:1,
  exactOriginalSHA256:ORIGINAL_PHOTO_SHA250,tamperDenied:true,otherOwnerDenied:true,
  atomicRestore:true,actualV4BrowserDownload:true,hostedRLS:false,releaseAuthorized:false}),
 mk('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',{
  engine,realWorkerFirst:true,ownerBPrivateRows:0,ownerAOriginalNotVisibleToB:true,
  ownerAOutfitNotVisibleToB:true,hostedRLS:false,releaseAllowed:false})
 ].join('\n');
}
const att=(extra={})=>m250ClassifyOriginal({
 arm:'baseline',engine:'webkit',width:320,attempt:1,status:0,signal:null,
 stdout:positiveLog(),...extra
});
test('M250 baseline passes exact unchanged model caller; pattern_off changes only session option request',async()=>{
 const worker=await readFile('public/outfit-worker-p94.mjs','utf8');
 assert.equal(configuredOriginalWorker(worker,'baseline'),worker);
 const off=configuredOriginalWorker(worker,'pattern_off');
 assert.equal(worker.split(M250_OPTION_ANCHOR).length,2);
 assert.equal(off.split(M250_OPTION_OFF).length,2);
 assert.equal(off.replace(M250_OPTION_OFF,M250_OPTION_ANCHOR),worker);
 assert.ok(off.includes('session_options:{enableMemPattern:false}'));
 assert.ok(!off.includes('enableCpuMemArena:false'));
 assert.throws(()=>configuredOriginalWorker(worker,'fake_arena'));
 assert.throws(()=>configuredOriginalWorker(worker.replace(M250_OPTION_ANCHOR,'alternative'),'pattern_off'));
});
test('M250 source-only M249 original JSEP disposable harness remains immutable and correctly patched',async()=>{
 const parent=await readFile('scripts/test-main249-original-failed-jsep-browser.mjs','utf8');
 const generated=injectOriginalResearchArm(parent);
 assert.ok(generated.includes('M250 original model-options call drift'));
 assert.ok(generated.includes("P94_WIDTH:String(process.env.M249_WIDTH||'390')"));
 assert.ok(generated.includes('M249_ORIGINAL_FAILED_ATTEMPT_JSEP_EVIDENCE'));
 assert.ok(generated.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS'));
 assert.equal(parent.includes('M250 original model-options call drift'),false);
 assert.throws(()=>injectOriginalResearchArm('mock worker'));
 const replacement=disposableM247WorkerReplacement();
 assert.ok(replacement.includes('addM249OriginalErrorWitness'));
 assert.ok(replacement.includes("process.env.M250_ARM==='pattern_off'"));
 assert.ok(replacement.includes('m250Opt'));
});
test('M250 true WebKit original owner/photo/JSEP positive is strictly bounded and not permanent fix',()=>{
 const x=att();
 assert.equal(x.positive,true);
 assert.equal(x.originalJsepModelReady,true);
 assert.equal(x.actualOriginalJsepSameRunIdentity,true);
 assert.equal(x.actualOriginalBrowserResponseShaVerified,true);
 assert.equal(x.modelMemoryGrowCalls,5);
 assert.equal(x.modelMemoryTerminalPages,767);
 assert.equal(x.originalPhotoAndPrivate2DV4,true);
 assert.equal(x.originalSeparateOwnerIsolation,true);
 assert.equal(x.optionReachedNativeCAbiProven,false);
 assert.equal(x.permanentRepairProven,false);
 assert.equal(x.releaseAuthorized,false);
});
test('M250 Chromium cannot fabricate received browser JSEP binary digest',()=>{
 const x=att({arm:'pattern_off',engine:'chromium',width:390,stdout:positiveLog('chromium',390)});
 assert.equal(x.positive,true);
 assert.equal(x.actualOriginalBrowserResponseShaVerified,false);
 assert.equal(x.chromiumBrowserShaNotAsserted,true);
 assert.equal(x.optionRequestOnly,'enableMemPattern:false');
});
test('M250 only genuine original model/photo/owner/privacy and exact binary can be green',()=>{
 const s=positiveLog();
 const falsifications=[
  s.replace(ORIGINAL_JSEP_SHA250,'f'.repeat(64)),
  s.replace(ORIGINAL_PHOTO_SHA250,'0'.repeat(64)),
  s.replace('"actualOriginalBrowserJsepBodyHash":true','"actualOriginalBrowserJsepBodyHash":false'),
  s.replace('"originalModelSessionReady":true','"originalModelSessionReady":false'),
  s.replace('"growErrors":0','"growErrors":1'),
  s.replace('"ownerPrivateSaved":1','"ownerPrivateSaved":0'),
  s.replace('"ownerBPrivateRows":0','"ownerBPrivateRows":1'),
  s.replace('"atomicRestore":true','"atomicRestore":false'),
  s.replace('"trueNativeJsepWorker":true','"trueNativeJsepWorker":false'),
  s.replace('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',
    'M61_MISSING_PRIVATE_OWNER_SOURCE_V4')
 ];
 for(const out of falsifications){
  const x=att({stdout:out});
  assert.equal(x.positive,false,'Original model/source/owner proof was improperly promoted');
  assert.equal(x.permanentRepairProven,false);
 }
});
test('M250 genuine same attempt model RED is still RED; no sibling or independent JSEP hash',()=>{
 const failed=mk('M249_ORIGINAL_FAILED_ATTEMPT_JSEP_EVIDENCE',{
  engine:'webkit',realOriginalP94ModelAttemptFailed:true,originalTestFailedNonzero:true,
  directOriginalJsepBrowserBodySHAProven:false,
  modelExceptionName:'RuntimeError',modelExceptionCategory:'wasm_memory_access'});
 const x=att({status:1,stdout:failed});
 assert.equal(x.positive,false);
 assert.equal(x.category,'real_original_model_red_preserved');
 assert.equal(x.directlyVerifiedFailedBrowserJsepSha,false);
 assert.equal(x.modelCaughtExceptionName,'RuntimeError');
 assert.equal(x.modelCaughtExceptionCategory,'wasm_memory_access');
 assert.equal(x.allocatorRootCauseProven,false);
 assert.equal(x.permanentRepairProven,false);
});
test('M250 failed attempt remains a failure even if other positive receipts are present',()=>{
 const mixed=positiveLog()+'\n'+mk('M249_ORIGINAL_FAILED_ATTEMPT_JSEP_EVIDENCE',{
  modelExceptionName:'Error',modelExceptionCategory:'network'});
 const x=att({stdout:mixed});
 assert.equal(x.positive,false);
});
test('M250 missing, duplicate, invalid and unbounded receipts are rejected',()=>{
 assert.equal(extractBoundedReceipt('','M249_GENUINE_SOURCE_OWNER_PASS'),null);
 assert.throws(()=>extractBoundedReceipt('fake','M250_PRIVATE_DATA'));
 assert.throws(()=>extractBoundedReceipt(
  positiveLog()+'\n'+positiveLog(),'M249_GENUINE_SOURCE_OWNER_PASS'));
 assert.throws(()=>extractBoundedReceipt('M249_GENUINE_SOURCE_OWNER_PASS null','M249_GENUINE_SOURCE_OWNER_PASS'));
 assert.throws(()=>extractBoundedReceipt('M249_GENUINE_SOURCE_OWNER_PASS {'+'x'.repeat(4200),'M249_GENUINE_SOURCE_OWNER_PASS'));
});
test('M250 precommitted sample count includes genuine failures and refuses wrong arm/width',()=>{
 const pass=[1,2,3].map(attempt=>({...att(),attempt}));
 const v=m250Summarize(pass,{arm:'baseline',engine:'webkit',width:320,expected:3});
 assert.equal(v.genuinePositiveModelOwnerJourneys,3);
 assert.equal(v.naturalOrDiagnosticRed,0);
 assert.equal(v.causalRedBeforeGreenAfterProven,false);
 const one=pass.slice();
 one[1]={...one[1],positive:false,category:'real_original_model_red_preserved'};
 const r=m250Summarize(one,{arm:'baseline',engine:'webkit',width:320,expected:3});
 assert.equal(r.genuinePositiveModelOwnerJourneys,2);
 assert.equal(r.naturalOrDiagnosticRed,1);
 assert.equal(r.allPass,false);
 assert.throws(()=>m250Summarize(pass.slice(1),{arm:'baseline',engine:'webkit',width:320,expected:3}));
 assert.throws(()=>m250Summarize(pass,{arm:'pattern_off',engine:'webkit',width:320,expected:3}));
 assert.throws(()=>requireArm('synthetic'));
});
test('M250 actual source-only driver must not launch or claim a native positive',()=>{
 const run=spawnSync(process.execPath,['scripts/test-main250-original-jsep-mempattern-ab-browser.mjs'],{
  env:{...process.env,M250_SOURCE_ONLY:'1',M250_ENGINE:'webkit',M250_WIDTH:'320',
   M250_ARM:'pattern_off',M250_COUNT:'3'},
  encoding:'utf8',timeout:30000,maxBuffer:3*1024*1024
 });
 assert.equal(run.status,0,'Original source pin / derived browser harness syntax RED: '+String(run.stderr||'').slice(0,500));
 assert.ok(run.stdout.includes('M250_SESSION_ARM_SOURCE_LOCKED'));
 assert.equal(run.stdout.includes('M250_GENUINE_ORIGINAL_JSEP_ARM_ATTEMPT'),false);
 assert.equal(run.stdout.includes('M249_GENUINE_SOURCE_OWNER_PASS'),false);
});
