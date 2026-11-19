import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {
 deriveM254PinnedM251Runner,classifyM254SameBrowser,
 M254_M251_BLOB,M254_ORIGINAL_BROWSER_BLOB,M254_ORIGINAL_WORKER_BLOB,M254_JSEP_SHA
} from '../scripts/main254-original-jsep-same-browser-recycle.mjs';

function make({engine='webkit',width=390,cycles=2,change={}}={}){
 const line=(marker,obj)=>marker+' '+JSON.stringify(obj);
 const parts=[];
 for(let i=1;i<=cycles;i++){
  let start={engine,width,cycle:i,sameBrowserProcess:true,
   originalWorkerAltered:false,releaseAuthorized:false,familyAlphaHold:true};
  let pass={engine,width,cycle:i,sameBrowserProcess:true,
   originalOwnerV4Reached:true,contextClosedAfterRealOwnerJourney:true,
   releaseAuthorized:false,familyAlphaHold:true};
  let native={engine,arm:'baseline',realWasmExportInvoked:true,
   nativeMemPatternFlag:false,genuineReturnedOptionsHandle:true,
   actualNativeCppMemoryPolicyObserved:false,
   originalJsepMemoryFailureFixed:false,releaseAuthorized:false,familyAlphaHold:true};
  let jsep={originalModelSessionReady:true,originalJsepWasmSha256:M254_JSEP_SHA,
   actualOriginalBrowserJsepBodyHash:engine==='webkit'};
  let owner={engine,modelExecuted:true,manualSyntheticOwnerConfirmed:true,
   ownerPrivateSaved:1,otherOwnerDenied:true,tamperDenied:true,atomicRestore:true,
   hostedRLS:false,releaseAuthorized:false};
  let privacy={engine,ownerBPrivateRows:0,ownerAOriginalNotVisibleToB:true,
   ownerAOutfitNotVisibleToB:true,hostedRLS:false,releaseAllowed:false};
  const scope={start,pass,native,jsep,owner,privacy};
  if(change.marker&&change.cycle===i){
   scope[change.marker]={...scope[change.marker],...change.fields};
  }
  for(const [marker,payload] of [
   ['M254_ORIGINAL_BROWSER_CYCLE_START',scope.start],
   ['M251_REAL_ORIGINAL_JSEP_NATIVE_ABI',scope.native],
   ['M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY',scope.jsep],
   ['M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',scope.owner],
   ['M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',scope.privacy],
   ['M254_ORIGINAL_BROWSER_CYCLE_PASS',scope.pass]
  ])parts.push(line(marker,payload));
 }
 return parts.join('\n');
}
const evaluateTrial=({engine='webkit',width=390,stdout=make({engine,width}),status=0,signal=null}={})=>
 classifyM254SameBrowser({engine,width,stdout,status,signal});

test('M254 installed genuine original WebKit P94 native/JSEP owner fixture source is immutable',async()=>{
 const [m251,owner,worker]=await Promise.all([
  readFile('scripts/test-main251-original-jsep-native-option-browser.mjs'),
  readFile('scripts/test-parallel94-native-p88-browser.mjs'),
  readFile('public/outfit-worker-p94.mjs')
 ]);
 const crypto=await import('node:crypto');
 const blob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
 assert.equal(blob(m251),M254_M251_BLOB);
 assert.equal(blob(owner),M254_ORIGINAL_BROWSER_BLOB);
 assert.equal(blob(worker),M254_ORIGINAL_WORKER_BLOB);
 const script=deriveM254PinnedM251Runner(m251.toString('utf8'));
 assert.ok(script.includes('deriveM254SameBrowserFixture(source)'));
 assert.ok(script.includes('M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY'));
 assert.ok(script.includes('M251_REAL_ORIGINAL_JSEP_NATIVE_ABI'));
 assert.ok(script.includes('instrumentM251OriginalJsepGlue'));
 assert.ok(!worker.toString('utf8').includes('m254Cycle'));
 assert.throws(()=>deriveM254PinnedM251Runner(m251.toString('utf8')+' // forged'),
  /modified/);
});

test('M254 two sequential original source-locked WebKit native, private-owner and v4 contexts are required',()=>{
 const r=evaluateTrial();
 assert.equal(r.fullOriginalSameProcessRecreationPass,true);
 assert.equal(r.independentBrowserProcesses,1);
 assert.equal(r.originalCycleStarts,2);
 assert.equal(r.originalCyclePasses,2);
 assert.equal(r.originalNativeExportReceipts,2);
 assert.equal(r.originalModelJsepReceipts,2);
 assert.equal(r.originalPrivateV4OwnerReceipts,2);
 assert.equal(r.originalCppAllocatorStateRead,false);
 assert.equal(r.naturalIntermittentWebkitRootCauseFixed,false);
 assert.equal(r.releaseAuthorized,false);
});

test('M254 Chromium must not borrow direct WebKit JSEP body hashing',()=>{
 const c=evaluateTrial({engine:'chromium',stdout:make({engine:'chromium'})});
 assert.equal(c.fullOriginalSameProcessRecreationPass,true);
 assert.equal(c.originalJsepWasmAndSameBrowserIdentityVerified,true);
 const falsified=evaluateTrial({engine:'webkit',stdout:make({
  change:{marker:'jsep',cycle:2,fields:{actualOriginalBrowserJsepBodyHash:false}}
 })});
 assert.equal(falsified.fullOriginalSameProcessRecreationPass,false);
});

test('M254 first journey green never hides a second-context model/owner RED',()=>{
 assert.equal(evaluateTrial({stdout:make({cycles:1})}).fullOriginalSameProcessRecreationPass,false);
 assert.equal(evaluateTrial({stdout:make({cycles:1}),status:1}).fullOriginalSameProcessRecreationPass,false);
 assert.equal(evaluateTrial({stdout:make(),status:1}).fullOriginalSameProcessRecreationPass,false);
 assert.equal(evaluateTrial({stdout:make(),status:null,signal:'SIGKILL'}).fullOriginalSameProcessRecreationPass,false);
});

test('M254 false native memory flag, cloned cycle number or bad source identity rejected',()=>{
 for(const change of [
  {marker:'native',cycle:2,fields:{nativeMemPatternFlag:true}},
  {marker:'native',cycle:2,fields:{realWasmExportInvoked:false}},
  {marker:'jsep',cycle:2,fields:{originalJsepWasmSha256:'fake'}},
  {marker:'pass',cycle:2,fields:{cycle:1}},
  {marker:'start',cycle:2,fields:{sameBrowserProcess:false}},
  {marker:'owner',cycle:2,fields:{ownerPrivateSaved:0}},
  {marker:'privacy',cycle:2,fields:{ownerBPrivateRows:1}},
  {marker:'pass',cycle:2,fields:{contextClosedAfterRealOwnerJourney:false}},
  {marker:'native',cycle:2,fields:{actualNativeCppMemoryPolicyObserved:true}},
  {marker:'start',cycle:1,fields:{originalWorkerAltered:true}}
 ]){
  const value=evaluateTrial({stdout:make({change})});
  assert.equal(value.fullOriginalSameProcessRecreationPass,false,
   'Forged native/owner/context source incorrectly passed: '+JSON.stringify(change));
 }
});

test('M254 duplicate or oversized native receipts fail closed',()=>{
 assert.throws(()=>evaluateTrial({stdout:make()+
  '\nM251_REAL_ORIGINAL_JSEP_NATIVE_ABI {}'}),/Duplicated/);
 assert.throws(()=>evaluateTrial({stdout:make()+'\nM254_ORIGINAL_BROWSER_CYCLE_START '+
  'x'.repeat(6000)}),/Duplicated|exceeds/);
 assert.throws(()=>evaluateTrial({engine:'fake',stdout:make()}),/browser/);
});

test('M254 actual source-only original native P94 derivation executes without pretending browser acceptance',()=>{
 const run=spawnSync(process.execPath,
  ['scripts/run-main254-original-jsep-same-browser-recycle.mjs'],{
   env:{...process.env,M254_SOURCE_ONLY:'1',M254_ENGINE:'webkit',M254_WIDTH:'390'},
   encoding:'utf8',timeout:90000,maxBuffer:3*1024*1024
  });
 assert.equal(run.status,0,'Original same-process fixture/source derivation RED: '+String(run.stderr||'').slice(0,900));
 assert.ok(run.stdout.includes('M254_SAME_BROWSER_SOURCE_ONLY'));
 assert.ok(!run.stdout.includes('M254_ACTUAL_ORIGINAL_SAME_BROWSER_TWO_CONTEXTS'));
});
