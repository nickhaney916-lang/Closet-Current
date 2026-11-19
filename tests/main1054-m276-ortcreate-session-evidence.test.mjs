import test from 'node:test';
import assert from 'node:assert/strict';
import {verifySource,attestHistorical,historical,sourcePins,changes,parent,branch} from '../scripts/main1054-m276-ortcreate-session-evidence.mjs';

const head='f'.repeat(40);
const event={name:'push',ref:branch,sha:head,attempt:'1'};
const expectedDiff=changes.map(x=>'A\0'+x+'\0').join('');
const mockGit=(name,...args)=>{
 if(name==='rev-parse'){
  if(args[0]==='HEAD')return head;
  if(args[0].startsWith(head+':'))return sourcePins[args[0].slice(41)]??'0'.repeat(40);
 }
 if(name==='merge-base'){assert.deepEqual(args,['--is-ancestor',parent,head]);return '';}
 if(name==='diff-tree')return expectedDiff;
 if(name==='ls-tree')return '100644 blob '+'2'.repeat(40);
 throw Error('unexpected git command '+name);
};
const mutGit=(predicate,convert)=>(...args)=>predicate(...args)?convert(mockGit(...args)):mockGit(...args);
const run={id:historical.runId,head_sha:historical.sourceSHA,
 run_attempt:1,status:'completed',conclusion:'failure'};
const job={id:historical.jobId,run_id:historical.runId,name:historical.jobName,
 status:'completed',conclusion:'failure'};

function call(id,operation,terminal,value){
 return [
  'CC_NATIVE_ORT_TRACE '+JSON.stringify({asset:'ort-wasm-simd-threaded.jsep.mjs',id,operation,phase:'enter',value:null}),
  'CC_NATIVE_ORT_TRACE '+JSON.stringify({asset:'ort-wasm-simd-threaded.jsep.mjs',id,operation,phase:terminal,value}),
 ];
}
function processRows(i,fail=i===1){
 let lines=[
  ...call(1,'OrtInit','return',0),
  ...call(2,'malloc','return',1),
  ...call(3,'OrtCreateSessionOptions','return',1),
  ...call(4,'malloc','return',1),
  ...call(5,'malloc','return',1),
  ...call(6,'OrtCreateSession',fail?'throw':'return',fail?[]:1)
 ];
 if(!fail)lines=[
  ...lines,
  ...call(7,'OrtGetInputOutputCount','return',0),
  ...call(8,'OrtGetInputOutputMetadata','return',0),
  ...call(9,'OrtGetInputOutputMetadata','return',0),
  ...call(10,'malloc','return',1),
  ...call(11,'OrtCreateTensor','return',1),
  ...call(12,'OrtRun','return',0)
 ];
 return [
  '2026-11-19T20:36:11.4632668Z checkout='+historical.sourceSHA+' run='+historical.runId+' attempt=1 engine=webkit width=390 arm=baseline exit='+(fail?1:0),
  ...lines.map(x=>'2026-11-19T20:36:11.4633408Z '+x),
  '2026-11-19T20:36:11.4633408Z ORIGINAL_JOURNEY_'+(fail?'FAIL':'PASS')
 ];
}
const fakeLog=Array.from({length:5},(_,k)=>processRows(k+1)).flat().join('\n');
test('SOURCE: one exact branch, read-only tested but not native fix',()=>assert.deepEqual(verifySource(mockGit,event),{
 source:'PASS',originalTraceReplay:'NOT_YET_VERIFIED',nativeRuntimePatch:false,familyAlpha:'HOLD'
}));
for(const [name,difference,re] of [
 ['pull_request_target never allowed',{name:'pull_request_target'},/untrusted event/],
 ['wrong branch',{ref:'refs/heads/main'},/untrusted event/],
 ['bad SHA',{sha:'f'.repeat(39)},/bad event SHA/],
 ['wrong exact HEAD',{sha:'1'.repeat(40)},/HEAD mismatch/],
 ['rerun rejects green washing',{attempt:'2'},/rerun/]
])test('SOURCE '+name,()=>assert.throws(()=>verifySource(mockGit,{...event,...difference}),re));
for(const [name,where,change,re] of [
 ['product Worker modified',(cmd)=>cmd==='diff-tree',x=>x+'M\0public/outfit-worker-p94.mjs\0',/unreviewed/],
 ['trace parser file omitted',(cmd)=>cmd==='diff-tree',()=>'',/unreviewed/],
 ['unreviewed symlink',(cmd)=>cmd==='ls-tree',()=> '120000 blob fail',/nonregular/],
 ['divergent parent',(cmd)=>cmd==='merge-base',()=> 'no',/ancestry/]
])test('SOURCE '+name,()=>assert.throws(()=>verifySource(mutGit(where,change),event),re));
for(const p of Object.keys(sourcePins)){
 test('SOURCE reject changed '+p,()=>assert.throws(()=>verifySource(mutGit(
  (cmd,arg)=>cmd==='rev-parse'&&arg===head+':'+p,()=> '0'.repeat(40)),event),/source drift/));
}
test('AUTH original sequence distinguishes one native RED and four PASS, no causal fix claim',()=>{
 const x=attestHistorical(fakeLog,run,job);
 assert.equal(x.originalGenuineNativeRed,1);
 assert.equal(x.originalGenuineNativePassed,4);
 assert.equal(x.nativeFailureOperation,'OrtCreateSession');
 assert.equal(x.wasmFramesFromFailingThrow,0);
 assert.equal(x.failedBeforeInference,true);
 assert.equal(x.causeIdentified,false);
 assert.equal(x.allocatorBugVerified,false);
 assert.equal(x.permanentWebKitFixProven,false);
 assert.equal(x.releaseAllowed,false);
 assert.equal(x.familyAlpha,'HOLD');
 assert.equal(x.processWitness.length,5);
 assert.equal(x.processWitness[0].failingOperation,'OrtCreateSession');
});
const att=(text=fakeLog,runValue=run,jobValue=job)=>attestHistorical(text,runValue,jobValue);
for(const [name,changed] of [
 ['different run ID',{id:44610116085}],
 ['different original source SHA',{head_sha:'0'.repeat(40)}],
 ['run rerun',{run_attempt:2}],
 ['run magically marked green',{conclusion:'success'}],
 ['unfinished run',{status:'in_progress'}]
])test('AUTH rejects '+name,()=>assert.throws(()=>att(fakeLog,{...run,...changed},job),/original immutable/));
for(const [name,changed] of [
 ['different job',{id:135864150427}],
 ['different job source',{run_id:44610116085}],
 ['unreviewed job',{name:'trace (webkit, 430, baseline, 5)'}],
 ['job made green',{conclusion:'success'}],
 ['incomplete native job',{status:'in_progress'}]
])test('AUTH rejects '+name,()=>assert.throws(()=>att(fakeLog,run,{...job,...changed}),/failed job identity/));
for(const [name,log] of [
 ['missing first RED',Array.from({length:5},(_,k)=>processRows(k+1,false)).flat().join('\n')],
 ['omitted original failure marker',fakeLog.split('\n').filter(line=>!line.includes('ORIGINAL_JOURNEY_FAIL')).join('\n')],
 ['original RED reclassified PASS',fakeLog.replace('ORIGINAL_JOURNEY_FAIL','ORIGINAL_JOURNEY_PASS')],
 ['original RED exit falsified',fakeLog.replace('arm=baseline exit=1','arm=baseline exit=0')],
 ['original fail operation disguised',fakeLog.replace('"operation":"OrtCreateSession","phase":"throw"','"operation":"OrtRun","phase":"throw"')],
 ['remove native throw marker',fakeLog.split('\n').filter(x=>!x.includes('"operation":"OrtCreateSession","phase":"throw"')).join('\n')],
 ['dummy native operation',fakeLog.replace('"operation":"OrtCreateSession"','"operation":"FakeOrt"')],
 ['unknown external library',fakeLog.replace('"asset":"ort-wasm-simd-threaded.jsep.mjs"','"asset":"unknown.js"')],
 ['duplicated terminal',fakeLog.replace('2026-11-19T20:36:11.4633408Z ORIGINAL_JOURNEY_FAIL',
   '2026-11-19T20:36:11.4633408Z CC_NATIVE_ORT_TRACE '+JSON.stringify({asset:'ort-wasm-simd-threaded.jsep.mjs',id:6,operation:'OrtCreateSession',phase:'throw',value:[]})+'\n2026-11-19T20:36:11.4633408Z ORIGINAL_JOURNEY_FAIL')],
 ['wrong engine',fakeLog.replace('engine=webkit width=390','engine=chromium width=390')],
 ['wrong width',fakeLog.replace('width=390 arm=baseline','width=430 arm=baseline')],
 ['wrong runtime arm',fakeLog.replace('arm=baseline exit=1','arm=graph_opt_disabled exit=1')],
 ['retry ordinal',fakeLog.replace('attempt=1 engine=webkit','attempt=2 engine=webkit')],
 ['loss of process',Array.from({length:4},(_,k)=>processRows(k+1)).flat().join('\n')],
 ['unexpected actual post-failure inference',fakeLog.replace('2026-11-19T20:36:11.4633408Z ORIGINAL_JOURNEY_FAIL',
   call(7,'OrtRun','return',0).map(x=>'2026-11-19T20:36:11.4633408Z '+x).join('\n')+'\n2026-11-19T20:36:11.4633408Z ORIGINAL_JOURNEY_FAIL')],
 ['untrusted WASM frame',fakeLog.replace('"phase":"throw","value":[]','"phase":"throw","value":["/users/secret/path"]')],
 ['incorrect true positive terminal',fakeLog.replace('ORIGINAL_JOURNEY_PASS','ORIGINAL_JOURNEY_FAIL')],
])test('TRACE rejects '+name,()=>assert.throws(()=>att(log)));
