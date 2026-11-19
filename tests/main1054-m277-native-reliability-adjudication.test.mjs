import assert from 'node:assert/strict';
import test from 'node:test';
import {sourceGate,adjudicate,markers,parent,ref,additions,witnesses,original,cohort,pinned} from '../scripts/main1054-m277-native-reliability-adjudication.mjs';
const head='1'.repeat(40),evt={name:'push',ref,sha:head,attempt:'1'};
const c={...witnesses};
function git(cmd,...args){
 if(cmd==='rev-parse'){
  if(args[0]==='HEAD')return head;
  const [commit,file]=args[0].split(':');
  if(commit===head)return pinned[file]??'2'.repeat(40);
  for(const w of Object.values(c))if(w.head===commit){
   if(pinned[file])return pinned[file];
   const index=w.files.indexOf(file);
   return index>=0?w.pins[index]:'2'.repeat(40);
  }
  throw Error('unexpected revision');
 }
 if(cmd==='merge-base')return '';
 if(cmd==='ls-tree')return '100644 blob '+ '2'.repeat(40);
 if(cmd==='diff-tree'){
  const from=args.at(-2),to=args.at(-1);
  assert.equal(from,parent);
  const paths=to===head?additions:Object.values(c).find(w=>w.head===to)?.files;
  assert.ok(paths,'missing authorized branch');
  return paths.map(p=>'A\0'+p+'\0').join('');
 }
 throw Error('unknown source git invocation '+cmd);
}
const mode=(match,change)=>(...args)=>match(args)?change(git(...args)):git(...args);
const okSource={source:'PASS',siblings:'ATTESTED_NOT_MERGED',nativeFix:'NOT_PROVEN',hold:true};
test('fixed immutable candidate and sibling scopes preserve native RED',()=>assert.deepEqual(sourceGate(git,evt),okSource));
for(const [name,mod,regex] of [
 ['wrong branch',{ref:'refs/heads/main'},/event\/ref/],
 ['untrusted PR',{name:'pull_request_target'},/event\/ref/],
 ['CI rerun',{attempt:'2'},/first attempt/],
 ['bad hash',{sha:'bad'},/invalid head/],
 ['foreign SHA',{sha:'f'.repeat(40)},/checkout mismatch/]
])test(name,()=>assert.throws(()=>sourceGate(git,{...evt,...mod}),regex));
for(const [name,match,change,regex] of [
 ['untrusted candidate app file',a=>a[0]==='diff-tree'&&a.at(-1)===head,v=>v+'M\0public/app.js\0',/unexpected source/],
 ['unreviewed sibling P94 Worker change',a=>a[0]==='diff-tree'&&a.at(-1)===c.green.head,v=>v+'M\0public/outfit-worker-p94.mjs\0',/unexpected source/],
 ['removed sibling native RED gate',a=>a[0]==='diff-tree'&&a.at(-1)===c.red.head,()=>'',/unexpected source/],
 ['forged old compiled P94 Worker',a=>a[0]==='rev-parse'&&a[1]===head+':public/outfit-worker-p94.mjs',()=> 'f'.repeat(40),/original candidate drift/],
 ['changed source lease on M275',a=>a[0]==='rev-parse'&&a[1]===c.green.head+':public/native-outfit-source-plan-p99.mjs',()=> 'f'.repeat(40),/source changed/],
 ['changed M276 native evidence parser',a=>a[0]==='rev-parse'&&a[1]===c.red.head+':scripts/main1054-m276-ortcreate-session-evidence.mjs',()=> 'f'.repeat(40),/witness code/],
 ['symlinked gate',a=>a[0]==='ls-tree',()=> '120000 blob x',/nonregular/],
 ['untrusted ancestry',a=>a[0]==='merge-base',()=> 'not ancestor',/descendant/]
])test(name,()=>assert.throws(()=>sourceGate(mode(match,change),evt),regex));
const date='2026-11-19T22:18:56.1803445Z ';
const emit=(label,obj)=>date+label+' '+JSON.stringify(obj)+'\n';
const nativeName=j=>'m275-fresh-original-native-positive ('+j.engine+', '+j.width+', '+j.count+')';
const oldWitness=Array.from({length:5},(_,i)=>({
 ordinal:i+1,originalResult:i?'PASS':'FAIL',failingOperation:i?null:'OrtCreateSession',
 successfulOrtRun:!!i,throwFrameCount:i?null:0,observedNativeOperations:i?12:6
}));
const nativeRed={
 schema:'MAIN1054_M276_HISTORICAL_ORIGINAL_ORTCREATESESSION_V1',
 originalRunId:original.runId,originalJobId:original.jobId,
 originalSourceSHA:original.head,originalRunAttempt:1,
 originalExpectedFreshProcesses:5,originalObservedFreshProcesses:5,
 originalGenuineNativeRed:1,originalGenuineNativePassed:4,
 browser:'webkit',viewportWidth:390,originalArm:'baseline',
 nativeFailureOperation:'OrtCreateSession',failedBeforeInference:true,
 wasmFramesFromFailingThrow:0,causeIdentified:false,allocatorBugVerified:false,
 permanentWebKitFixProven:false,releaseAllowed:false,familyAlpha:'HOLD',
 processWitness:oldWitness
};
const makeLog=j=>{
 const rows=Array.from({length:j.count},(_,i)=>emit('M275_ORIGINAL_FIRST_ATTEMPT',{
  engine:j.engine,width:j.width,ordinal:i+1,result:'PASS',reason:'NONE',
  runId:String(c.green.runId),head:c.green.head,hold:true
 }));
 rows.push(emit('M275_ORIGINAL_INTEGRATED_SUMMARY',{
  schema:'MAIN1054_M275_INTEGRATED_GENUINE_NATIVE_COHORT_V1',
  head:c.green.head,runId:String(c.green.runId),engine:j.engine,width:j.width,
  expected:j.count,observed:j.count,realOriginalPositive:j.count,genuineRed:0,
  verdict:'PASS',nativeFixProven:false,releaseAllowed:false,familyAlpha:'HOLD'
 }));
 return rows.join('');
};
const run=(w)=>({id:w.runId,head_sha:w.head,run_attempt:1,
 status:'completed',conclusion:'success',event:'push'});
const job=(id,name,runId)=>({id,name,run_id:runId,status:'completed',conclusion:'success'});
function fixtures(){
 return {
  runs:{green:run(c.green),red:run(c.red)},
  jobs:{
   green:[job(135917673260,'m275-original-model-source-and-node',c.green.runId),
    ...cohort.map(j=>job(j.id,nativeName(j),c.green.runId))],
   red:[job(135923706769,'m276-source-and-parser',c.red.runId),
    job(135923812650,'m276-replay-authentic-old-red',c.red.runId)]
  },
  oldRun:{id:original.runId,head_sha:original.head,run_attempt:1,
   status:'completed',conclusion:'failure'},
  oldJob:{id:original.jobId,run_id:original.runId,
   name:'trace (webkit, 390, baseline, 5)',status:'completed',conclusion:'failure'},
  logs:{...Object.fromEntries(cohort.map(j=>[j.id,makeLog(j)])),
   red:emit('M276_VERIFIED_ORIGINAL_NATIVE_RED',nativeRed)}
 };
}
test('live-shaped first-attempt 36 native positives retain historical true RED and no release',()=>{
 const x=adjudicate(fixtures());
 assert.deepEqual(x.m275.originalModelFirstAttemptPass,{webkit:24,chromium:12});
 assert.equal(x.m276.nativeHistoricalFirstAttemptRed,1);
 assert.equal(x.m276.failedOperation,'OrtCreateSession');
 assert.equal(x.permanentWebKitJsepRepair,'BLOCKED_REAL_NATIVE_RED');
 assert.equal(x.redBeforeGreenAfterFix,false);
 assert.equal(x.releaseAllowed,false);
 assert.equal(x.familyAlpha,'HOLD');
});
test('timestamp/ANSI log parsing never changes result',()=>{
 assert.equal(markers(emit('M275_ORIGINAL_FIRST_ATTEMPT',{ordinal:1}),'M275_ORIGINAL_FIRST_ATTEMPT')[0].ordinal,1);
});
for(const [name,alter,regex] of [
 ['new CI rerun cannot replace first attempt',e=>{e.runs.green.run_attempt=2},/run status/],
 ['wrong native source SHA',e=>{e.runs.green.head_sha='f'.repeat(40)},/run status/],
 ['historical native CI cannot change to green',e=>{e.oldRun.conclusion='success'},/failed run/],
 ['historical original job cannot be erased',e=>{e.oldJob.conclusion='success'},/failed job/],
 ['missing one real browser job',e=>{e.jobs.green.pop()},/missing\/extra/],
 ['wrong width browser cell',e=>{e.jobs.green[1].name='fake'},/job/],
 ['simulated model cannot replace original',e=>{e.logs[cohort[0].id]=e.logs[cohort[0].id].replace('"PASS"','"FAIL"')},/genuine original RED/],
 ['skipped real original-model ordinal',e=>{e.logs[cohort[0].id]=e.logs[cohort[0].id].replace(/.*M275_ORIGINAL_FIRST_ATTEMPT .*?\n/,'')},/processes/],
 ['false count on original WebKit',e=>{e.logs[cohort[0].id]=e.logs[cohort[0].id].replace('"genuineRed":0','"genuineRed":1')},/finite cohort/],
 ['false native permanent repair on positive cohort',e=>{e.logs[cohort[0].id]=e.logs[cohort[0].id].replace('"nativeFixProven":false','"nativeFixProven":true')},/finite cohort/],
 ['missing historical original RED receipt',e=>{e.logs.red='nothing'},/native red attestation/],
 ['native failure cannot be labeled PASS',e=>{e.logs.red=e.logs.red.replace('"originalGenuineNativeRed":1','"originalGenuineNativeRed":0')},/failure erased/],
 ['original failed op cannot be changed',e=>{e.logs.red=e.logs.red.replace('"OrtCreateSession"','"OrtRun"')},/failure erased/],
 ['original ordinal one must remain FAIL',e=>{e.logs.red=e.logs.red.replace('"originalResult":"FAIL"','"originalResult":"PASS"')},/failed ordinal/],
 ['missing native frames cannot be fabricated',e=>{e.logs.red=e.logs.red.replace('"wasmFramesFromFailingThrow":0','"wasmFramesFromFailingThrow":2')},/failure erased/],
 ['missing exact run CI',e=>{delete e.runs.red},/run status/],
 ['CI tamper to change family HOLD',e=>{e.logs.red=e.logs.red.replace('"familyAlpha":"HOLD"','"familyAlpha":"READY"')},/failure erased/]
]){
 test(name,()=>{
  const f=fixtures();alter(f);
  assert.throws(()=>adjudicate(f),regex);
 });
}
