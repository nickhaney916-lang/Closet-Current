// M277: read-only, fail-closed reconciliation of verified finite native green
// versus a genuine first-attempt WebKit OrtCreateSession RED. Never a repair.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
export const parent='fea8522d76f9397b1afb765bcc7999ed4d70ff94';
export const ref='refs/heads/research/main1054-m277-native-reliability-adjudication-HOLD';
export const additions=[
 '.github/workflows/main1054-m277-native-reliability-adjudication-no-deploy.yml',
 'scripts/main1054-m277-native-reliability-adjudication.mjs',
 'tests/main1054-m277-native-reliability-adjudication.test.mjs'
];
export const witnesses={
 green:{runId:44625384381,head:'a279d0cde64c8bdfe153ddfce79ba220c37fda27',
  files:[
   '.github/workflows/main1054-m275-integrated-model-stress-no-deploy.yml',
   'scripts/main1054-m275-integrated-model-stress.mjs',
   'tests/main1054-m275-integrated-model-stress.test.mjs'],
  pins:['e04ed6811e529fbf052cb7972f7bef193c0542a5',
   'aa73ea532363d207ede847e6c5e3834e6ccd3ae6',
   'aae7685695af51daad7d327ec36dca28a51d5030']},
 red:{runId:44627097683,head:'f3ca9a0da28d71d1caf901a34bde9be586f06fb8',
  files:[
   '.github/workflows/main1054-m276-ortcreate-session-evidence-no-deploy.yml',
   'scripts/main1054-m276-ortcreate-session-evidence.mjs',
   'tests/main1054-m276-ortcreate-session-evidence.test.mjs'],
  pins:['6bc6703b410785efd74b084a0248b31cebc83f56',
   'cdf5f6f946cbb61b9e9f1402fc23dfc45afc24ed',
   '405246847719068d16a7001ff794c9f9c885d62b']}
};
export const original={runId:44610116084,jobId:135864150426,
 head:'d3fabd1e5a576271190781830f9e2f1819ef1be0'};
export const cohort=[
 {id:135919127480,engine:'webkit',width:320,count:8},
 {id:135919127420,engine:'webkit',width:390,count:8},
 {id:135919127564,engine:'webkit',width:430,count:8},
 {id:135919127344,engine:'chromium',width:320,count:4},
 {id:135919127500,engine:'chromium',width:390,count:4},
 {id:135919127513,engine:'chromium',width:430,count:4}
];
export const pinned={
 '.github/workflows/main1054-m274-m181-zero-proposal-no-deploy.yml':'ee7c827c4e815ccf2d942c44bcd29f0d41ce59c1',
 'scripts/main1054-m274-m181-source-gate.mjs':'81e5e42840330a9c7a05d084f64b4297b09d9b0e',
 '.github/workflows/main1054-m273-m180-firstload-no-deploy.yml':'53dfb2a6ca0d94f76f0cbdae2b3bed85768002f9',
 '.github/workflows/main1054-m272-m173-unflagged-24mp-no-deploy.yml':'79e81aa69bf303070b355dcc92b0d893716e3dfc',
 '.github/workflows/main1054-m271-m58-successor-no-deploy.yml':'1633a2aca790d27355edbbcc7793f8f0861f0d07',
 '.github/workflows/main181-zero-proposal-native-no-deploy.yml':'3cd39fb4fa69b859f182f746fa2993f8f09317ee',
 '.github/workflows/main180-unmodified-webkit-firstload-no-deploy.yml':'1dc421e71cb726b5884da4df39950b9e0c234cf4',
 '.github/workflows/main173-unflagged-owner-24mp-no-deploy.yml':'10cb88c8915521edf2cb847d716709304182a8a4',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'public/native-outfit-source-plan-p99.mjs':'62ebfaad2fb14a965cd7ef386c383e849f511463',
 'public/outfit-capture.js':'8d55715ef09e34086d3c401ec38340bfc25f5fe8',
 'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41'
};
const ok=(yes,reason)=>{if(!yes)throw Error('M277 refusal: '+reason);};
const exact3=(git,from,to,files)=>{
 ok(git('merge-base','--is-ancestor',from,to)==='','not a frozen descendant');
 ok(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',from,to)===
 files.map(p=>'A\0'+p+'\0').join(''),'unexpected source changes');
};
export function sourceGate(git,e){
 ok(e?.name==='push'&&e.ref===ref,'untrusted event/ref');
 ok(e.attempt==='1','not original first attempt');
 ok(/^[a-f0-9]{40}$/.test(e.sha||''),'invalid head');
 const head=git('rev-parse','HEAD');
 ok(head===e.sha,'checkout mismatch');
 exact3(git,parent,head,additions);
 for(const file of additions)ok(git('ls-tree',head,'--',file).startsWith('100644 blob '),'nonregular gate');
 for(const [n,w] of Object.entries(witnesses)){
  exact3(git,parent,w.head,w.files);
  w.files.forEach((f,i)=>ok(git('rev-parse',w.head+':'+f)===w.pins[i],n+' unreviewed witness code'));
  for(const [f,p] of Object.entries(pinned))
   ok(git('rev-parse',w.head+':'+f)===p,n+' original source changed '+f);
 }
 for(const [f,p] of Object.entries(pinned))
  ok(git('rev-parse',head+':'+f)===p,'original candidate drift '+f);
 return {source:'PASS',siblings:'ATTESTED_NOT_MERGED',nativeFix:'NOT_PROVEN',hold:true};
}
export function markers(log,kind){
 ok(typeof log==='string'&&log.length>0&&log.length<5_000_000,'missing or oversized job log');
 return log.split(/\r?\n/).map(line=>line.replace(/\x1b\[[0-9;]*m/g,'')
  .replace(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d+Z\s+/,'').trim())
  .filter(line=>line.startsWith(kind+' ')).map(line=>{
   try{return JSON.parse(line.slice(kind.length+1));}catch{throw Error('M277 malformed '+kind);}
  });
}
function successfulRun(run,w){
 ok(run?.id===w.runId&&run.head_sha===w.head&&run.run_attempt===1&&
 run.status==='completed'&&run.conclusion==='success'&&run.event==='push','wrong run status, SHA, event or retry');
}
function jobsPass(jobs,expected,runId){
 ok(Array.isArray(jobs)&&jobs.length===expected.length,'missing/extra CI job');
 const used=new Set();
 for(const j of jobs){
  const wanted=expected.find(e=>e.id===j.id);
  ok(wanted&&!used.has(j.id)&&j.name===wanted.name&&j.run_id===runId&&
   j.status==='completed'&&j.conclusion==='success','stale/failed/forged CI job');
  used.add(j.id);
 }
}
function originalPositive(j,log){
 const rows=markers(log,'M275_ORIGINAL_FIRST_ATTEMPT');
 ok(rows.length===j.count,'missing true original-model processes');
 const ord=new Set();
 for(const x of rows){
  ok(x?.engine===j.engine&&x.width===j.width&&x.runId===String(witnesses.green.runId)&&
   x.head===witnesses.green.head&&x.result==='PASS'&&x.reason==='NONE'&&
   x.hold===true&&Number.isInteger(x.ordinal)&&x.ordinal>=1&&x.ordinal<=j.count&&
   !ord.has(x.ordinal),'genuine original RED or fabricated success');
  ord.add(x.ordinal);
 }
 const sums=markers(log,'M275_ORIGINAL_INTEGRATED_SUMMARY');
 ok(sums.length===1,'missing/duplicate original summary');
 const s=sums[0];
 ok(s.schema==='MAIN1054_M275_INTEGRATED_GENUINE_NATIVE_COHORT_V1'&&
  s.head===witnesses.green.head&&s.runId===String(witnesses.green.runId)&&
  s.engine===j.engine&&s.width===j.width&&s.expected===j.count&&s.observed===j.count&&
  s.realOriginalPositive===j.count&&s.genuineRed===0&&s.verdict==='PASS'&&
  s.nativeFixProven===false&&s.releaseAllowed===false&&s.familyAlpha==='HOLD',
  'original model finite cohort cannot authorize release');
 return {engine:j.engine,width:j.width,count:ord.size};
}
function nativeRed(log){
 const rows=markers(log,'M276_VERIFIED_ORIGINAL_NATIVE_RED');
 ok(rows.length===1,'missing/duplicate historical native red attestation');
 const r=rows[0];
 ok(r.schema==='MAIN1054_M276_HISTORICAL_ORIGINAL_ORTCREATESESSION_V1'&&
 r.originalRunId===original.runId&&r.originalJobId===original.jobId&&
 r.originalSourceSHA===original.head&&r.originalRunAttempt===1&&
 r.originalExpectedFreshProcesses===5&&r.originalObservedFreshProcesses===5&&
 r.originalGenuineNativeRed===1&&r.originalGenuineNativePassed===4&&
 r.nativeFailureOperation==='OrtCreateSession'&&r.failedBeforeInference===true&&
 r.wasmFramesFromFailingThrow===0&&r.causeIdentified===false&&
 r.allocatorBugVerified===false&&r.permanentWebKitFixProven===false&&
 r.releaseAllowed===false&&r.familyAlpha==='HOLD','original real failure erased/misclassified');
 ok(r.browser==='webkit'&&r.viewportWidth===390&&r.originalArm==='baseline'&&
  Array.isArray(r.processWitness)&&r.processWitness.length===5,'native evidence not same original');
 r.processWitness.forEach((p,i)=>ok(p.ordinal===i+1&&
  p.originalResult===(i===0?'FAIL':'PASS')&&
  p.failingOperation===(i===0?'OrtCreateSession':null)&&
  p.successfulOrtRun===(i!==0)&&p.throwFrameCount===(i===0?0:null),
  'historical failed ordinal substituted'));
 return {failed:1,laterPassed:4,operation:'OrtCreateSession'};
}
export function adjudicate(e){
 const green=witnesses.green,red=witnesses.red;
 successfulRun(e.runs.green,green);successfulRun(e.runs.red,red);
 jobsPass(e.jobs.green,[{id:135917673260,name:'m275-original-model-source-and-node'},
  ...cohort.map(j=>({id:j.id,name:'m275-fresh-original-native-positive ('+
  j.engine+', '+j.width+', '+j.count+')'}))],green.runId);
 jobsPass(e.jobs.red,[
  {id:135923706769,name:'m276-source-and-parser'},
  {id:135923812650,name:'m276-replay-authentic-old-red'}],red.runId);
 ok(e.oldRun?.id===original.runId&&e.oldRun.head_sha===original.head&&
  e.oldRun.run_attempt===1&&e.oldRun.status==='completed'&&
  e.oldRun.conclusion==='failure','original failed run absent');
 ok(e.oldJob?.id===original.jobId&&e.oldJob.run_id===original.runId&&
  e.oldJob.status==='completed'&&e.oldJob.conclusion==='failure'&&
  e.oldJob.name==='trace (webkit, 390, baseline, 5)','original failed job absent');
 const observed=cohort.map(j=>originalPositive(j,e.logs[j.id]));
 const totals={webkit:0,chromium:0};
 for(const o of observed)totals[o.engine]+=o.count;
 ok(totals.webkit===24&&totals.chromium===12,'incomplete original-model positive cohort');
 const historical=nativeRed(e.logs.red);
 return {schema:'MAIN1054_M277_REAL_NATIVE_READINESS_V1',
  immutableParent:parent,m275:{runId:green.runId,head:green.head,
   originalModelFirstAttemptPass:totals,finiteStress:'PASS'},
  m276:{runId:red.runId,head:red.head,nativeHistoricalFirstAttemptRed:historical.failed,
   laterPass:historical.laterPassed,failedOperation:historical.operation},
  sourceBranchesUnmerged:true,modelUnchanged:true,
  nativeCausalAllocatorProof:false,redBeforeGreenAfterFix:false,
  permanentWebKitJsepRepair:'BLOCKED_REAL_NATIVE_RED',
  candidateResearchAcceptance:'PASS_FINITE_ONLY',releaseAllowed:false,familyAlpha:'HOLD'};
}
function git(...args){return execFileSync('git',['-c','safe.directory='+process.cwd(),...args],{encoding:'utf8'}).replace(/\n$/,'');}
function json(path){return JSON.parse(readFileSync(path,'utf8'));}
function log(path){
 const b=readFileSync(path);
 ok(b.length>0&&b.length<5_000_000,'missing/big raw job log');
 if(b[0]===0x50&&b[1]===0x4b)return execFileSync('unzip',['-p',path],{encoding:'utf8',maxBuffer:5_000_000});
 return b.toString('utf8');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  if(process.argv[2]==='source')console.log('M277_SOURCE_PASS');
  else if(process.argv[2]==='reconcile'){
   const dir=process.argv[3];
   ok(dir?.startsWith('/'),'evidence outside ephemeral runner');
   const e={runs:{green:json(join(dir,'green-run.json')),red:json(join(dir,'red-run.json'))},
    jobs:{green:json(join(dir,'green-jobs.json')).jobs,red:json(join(dir,'red-jobs.json')).jobs},
    oldRun:json(join(dir,'old-run.json')),oldJob:json(join(dir,'old-job.json')),
    logs:Object.fromEntries([...cohort.map(j=>[j.id,log(join(dir,j.id+'.bin'))]),
     ['red',log(join(dir,'135923812650.bin'))]])};
   const out=adjudicate(e);
   writeFileSync(join(dir,'m277-sanitized.json'),JSON.stringify(out,null,2)+'\n',{mode:0o600,flag:'wx'});
   console.log('M277_AUTHENTIC_FINITE_GREEN_WITH_NATIVE_RED',JSON.stringify(out));
  }else throw Error('expected source/reconcile');
 }catch(error){console.error('M277_BLOCKED',String(error.message).slice(0,160));process.exitCode=1;}
}
