/**
 * M276 original-WebKit OrtCreateSession failure evidence adjudication.
 *
 * Replay ONLY the actual historical first-attempt GitHub job log; this DOES NOT
 * reproduce or fix a native failure. All raw logs remain transient in CI.
 * The original #1490 native trace owner retains instrument/repair scope.
 */
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const parent='fea8522d76f9397b1afb765bcc7999ed4d70ff94';
export const branch='refs/heads/research/main1054-m276-native-session-evidence-HOLD';
export const changes=[
 '.github/workflows/main1054-m276-ortcreate-session-evidence-no-deploy.yml',
 'scripts/main1054-m276-ortcreate-session-evidence.mjs',
 'tests/main1054-m276-ortcreate-session-evidence.test.mjs'
];
export const sourcePins=Object.freeze({
 '.github/workflows/main1054-m274-m181-zero-proposal-no-deploy.yml':'ee7c827c4e815ccf2d942c44bcd29f0d41ce59c1',
 'scripts/main1054-m274-m181-source-gate.mjs':'81e5e42840330a9c7a05d084f64b4297b09d9b0e',
 'tests/main1054-m274-m181-source-gate.test.mjs':'d4cce3548ada5299a8635ad3f73a0b8252ddcc3c',
 '.github/workflows/main1054-m273-m180-firstload-no-deploy.yml':'53dfb2a6ca0d94f76f0cbdae2b3bed85768002f9',
 '.github/workflows/main1054-m272-m173-unflagged-24mp-no-deploy.yml':'79e81aa69bf303070b355dcc92b0d893716e3dfc',
 '.github/workflows/main1054-m271-m58-successor-no-deploy.yml':'1633a2aca790d27355edbbcc7793f8f0861f0d07',
 '.github/workflows/main181-zero-proposal-native-no-deploy.yml':'3cd39fb4fa69b859f182f746fa2993f8f09317ee',
 '.github/workflows/main180-unmodified-webkit-firstload-no-deploy.yml':'1dc421e71cb726b5884da4df39950b9e0c234cf4',
 '.github/workflows/main173-unflagged-owner-24mp-no-deploy.yml':'10cb88c8915521edf2cb847d716709304182a8a4',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'public/outfit-capture.js':'8d55715ef09e34086d3c401ec38340bfc25f5fe8',
 'public/native-outfit-source-plan-p99.mjs':'62ebfaad2fb14a965cd7ef386c383e849f511463',
 'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41'
});
export const historical=Object.freeze({
 runId:44610116084,
 jobId:135864150426,
 sourceSHA:'d3fabd1e5a576271190781830f9e2f1819ef1be0',
 jobName:'trace (webkit, 390, baseline, 5)',
 engine:'webkit',width:390,arm:'baseline',expected:5
});
const requireTruth=(test,why)=>{if(!test)throw Error('M276 evidence refused: '+why);};
export function verifySource(git,event){
 requireTruth(event?.name==='push'&&event?.ref===branch,'untrusted event/branch');
 requireTruth(event.attempt==='1','rerun cannot replace first attempt');
 requireTruth(typeof event.sha==='string'&&/^[a-f0-9]{40}$/.test(event.sha),'bad event SHA');
 const head=git('rev-parse','HEAD');
 requireTruth(head===event.sha,'source HEAD mismatch');
 requireTruth(git('merge-base','--is-ancestor',parent,head)==='','wrong integration ancestry');
 const diff=git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,head);
 requireTruth(diff===changes.map(path=>'A\0'+path+'\0').join(''),'unreviewed or missing paths');
 for(const path of changes)requireTruth(git('ls-tree',head,'--',path).startsWith('100644 blob '),'nonregular added file');
 for(const [path,sha] of Object.entries(sourcePins)){
  requireTruth(git('rev-parse',head+':'+path)===sha,'original protected source drift: '+path);
 }
 return {source:'PASS',originalTraceReplay:'NOT_YET_VERIFIED',nativeRuntimePatch:false,familyAlpha:'HOLD'};
}
const terms=new Set(['OrtInit','OrtCreateSessionOptions','malloc','OrtCreateSession',
 'OrtGetInputOutputCount','OrtGetInputOutputMetadata','OrtCreateTensor','OrtRun',
 'OrtRunWithBinding','OrtGetLastError']);
const unwrap=s=>s.replace(/\x1b\[[0-9;]*m/g,'')
 .replace(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d+Z\s+/,'').trimEnd();
function parseTraceRow(s){
 const row=JSON.parse(s);
 requireTruth(row&&typeof row==='object'&&!Array.isArray(row),'malformed trace');
 requireTruth(row.asset==='ort-wasm-simd-threaded.jsep.mjs','unverified JSEP instrumented asset');
 requireTruth(Number.isSafeInteger(row.id)&&row.id>0&&row.id<=20000,'malformed native call ID');
 requireTruth(terms.has(row.operation),'unknown native operation');
 requireTruth(['enter','return','throw','status'].includes(row.phase),'unknown native phase');
 if(row.phase==='enter')requireTruth(row.value===null,'enter leaked native pointers');
 if(row.phase==='return'||row.phase==='status')
  requireTruth(Number.isInteger(row.value)&&Math.abs(row.value)<=100,'unbounded return value');
 if(row.phase==='throw')
  requireTruth(Array.isArray(row.value)&&row.value.length<=12&&row.value.every(x=>typeof x==='string'&&
   /^wasm-function\[\d+\](?::0x[0-9a-f]+)?$/i.test(x)),'untrusted native frames');
 return {id:row.id,operation:row.operation,phase:row.phase,value:row.value};
}
function inspectProcess(p,expectedIndex){
 requireTruth(p.ordinal===expectedIndex,'lost/reordered first-attempt process');
 requireTruth(p.trace.length>=10&&p.trace.length<=150,'missing or oversized native trace');
 requireTruth(p.result==='PASS'||p.result==='FAIL','missing original verdict');
 requireTruth(p.exit===(p.result==='FAIL'?1:0),'improper original model process exit');
 const calls=new Map();
 for(const row of p.trace){
  let item=calls.get(row.id);
  if(row.phase==='enter'){
   requireTruth(!item,'duplicate native operation ID');
   calls.set(row.id,{name:row.operation,start:true,terminal:null,terminalValue:null});
  }else{
   requireTruth(item&&item.name===row.operation,'native operation not preceded by correct enter');
   requireTruth(item.terminal===null,'duplicated native operation terminal');
   item.terminal=row.phase;item.terminalValue=row.value;
  }
 }
 for(const c of calls.values())requireTruth(c.terminal,'open native operation without terminal');
 const find=op=>[...calls.values()].filter(c=>c.name===op);
 const completed=(op,value)=>find(op).some(c=>c.terminal==='return'&&c.terminalValue===value);
 requireTruth(completed('OrtInit',0),'OrtInit not successfully called');
 requireTruth(completed('OrtCreateSessionOptions',1),'original session options not created');
 const session=find('OrtCreateSession');
 requireTruth(session.length===1,'original native session operation missing or repeated');
 requireTruth(find('malloc').length>=1,'native allocator calls missing');
 if(p.result==='FAIL'){
  requireTruth(session[0].terminal==='throw','original RED did not throw inside OrtCreateSession');
  requireTruth(find('OrtRun').length===0,'original failure was after model inference');
  requireTruth(p.trace.at(-1)?.operation==='OrtCreateSession'&&
    p.trace.at(-1)?.phase==='throw','unrelated later native trace after session exception');
 }else{
  requireTruth(session[0].terminal==='return'&&session[0].terminalValue===1,'successful session not returned');
  requireTruth(completed('OrtRun',0),'no verified original inference on passing process');
  requireTruth(!p.trace.some(x=>x.phase==='throw'),'unexpected native exception in passing process');
 }
 return {ordinal:p.ordinal,originalResult:p.result,
  failingOperation:p.result==='FAIL'?'OrtCreateSession':null,
  throwFrameCount:p.result==='FAIL'?session[0].terminalValue.length:null,
  successfulOrtRun:p.result==='PASS',
  observedNativeOperations:calls.size};
}
export function attestHistorical(log,run,job){
 requireTruth(run?.id===historical.runId&&run.head_sha===historical.sourceSHA&&
   run.run_attempt===1&&run.status==='completed'&&run.conclusion==='failure',
   'original immutable first-attempt run cannot be authenticated');
 requireTruth(job?.id===historical.jobId&&job.run_id===historical.runId&&
   job.name===historical.jobName&&job.status==='completed'&&job.conclusion==='failure',
   'original failed job identity/status cannot be authenticated');
 requireTruth(typeof log==='string'&&log.length>500&&log.length<3_000_000,
   'missing/unbounded original job log');
 const records=[],header=/^checkout=([a-f0-9]{40}) run=(\d+) attempt=(\d+) engine=([a-z]+) width=(\d+) arm=([a-z_]+) exit=(\d+)$/;
 let current=null;
 for(const original of log.split(/\r?\n/)){
  const line=unwrap(original);
  const h=header.exec(line);
  if(h){
   requireTruth(h[1]===historical.sourceSHA&&+h[2]===historical.runId&&+h[3]===1&&
     h[4]===historical.engine&&+h[5]===historical.width&&h[6]===historical.arm,
     'altered original trace source/browser/run');
   requireTruth(records.length<historical.expected,'unbounded/duplicated historical process');
   current={ordinal:records.length+1,exit:+h[7],result:null,trace:[]};
   records.push(current);
  }else if(line.startsWith('CC_NATIVE_ORT_TRACE ')){
   requireTruth(current!==null,'native call without original process identity');
   current.trace.push(parseTraceRow(line.slice('CC_NATIVE_ORT_TRACE '.length)));
  }else if(line==='ORIGINAL_JOURNEY_PASS'||line==='ORIGINAL_JOURNEY_FAIL'){
   requireTruth(current&&current.result===null,'duplicated/stale original process terminal');
   current.result=line==='ORIGINAL_JOURNEY_PASS'?'PASS':'FAIL';
  }
 }
 requireTruth(records.length===historical.expected,'original first-attempt cohort incomplete');
 const results=records.map((p,i)=>inspectProcess(p,i+1));
 requireTruth(results[0].originalResult==='FAIL'&&results[0].throwFrameCount===0,
  'lost authentic native failure/no available WASM frames');
 requireTruth(results.slice(1).every(x=>x.originalResult==='PASS'),
  'original genuine later passes omitted or changed');
 return {
  schema:'MAIN1054_M276_HISTORICAL_ORIGINAL_ORTCREATESESSION_V1',
  originalRunId:historical.runId,originalJobId:historical.jobId,
  originalSourceSHA:historical.sourceSHA,originalRunAttempt:1,
  browser:'webkit',viewportWidth:390,originalArm:'baseline',
  originalExpectedFreshProcesses:5,originalObservedFreshProcesses:results.length,
  originalGenuineNativeRed:1,originalGenuineNativePassed:4,
  nativeFailureOperation:'OrtCreateSession',failedBeforeInference:true,
  wasmFramesFromFailingThrow:0,
  causeIdentified:false,allocatorBugVerified:false,modelWeightsCompiledProven:false,
  permanentWebKitFixProven:false,releaseAllowed:false,familyAlpha:'HOLD',
  processWitness:results
 };
}
function nativeGit(...args){return execFileSync('git',['-c','safe.directory='+process.cwd(),...args],{encoding:'utf8'}).replace(/\n$/,'');}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const evt={name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT};
  const source=verifySource(nativeGit,evt);
  if(process.argv[2]==='source')console.log('M276_SOURCE',JSON.stringify(source));
  else if(process.argv[2]==='attest'){
   const result=attestHistorical(readFileSync(process.argv[3],'utf8'),
    JSON.parse(readFileSync(process.argv[4],'utf8')),
    JSON.parse(readFileSync(process.argv[5],'utf8')));
   console.log('M276_VERIFIED_ORIGINAL_NATIVE_RED',JSON.stringify(result));
   if(process.argv[6])await import('node:fs/promises').then(fs=>fs.writeFile(process.argv[6],JSON.stringify(result,null,2)+'\n'));
  }else throw Error('Expected source or attest');
 }catch(err){console.error('M276_FAIL_CLOSED',String(err.message).slice(0,220));process.exitCode=1;}
}
