// Bounded diagnostic comparison, NOT acceptance retries. Every independent
// historical-source trial is retained, including failures. Current-source
// acceptance runs separately and must pass without retries or skipped checks.
import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,mkdir,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
const legacy='a925e8b103ea262c352ee0eb9e58f9ba0ece6c87';
const runner='scripts/test-main58-actual-p88-wasm-browser.mjs';
const runnerBlob='7086f1a22b10ef0268dc9f2bff87c7c9b87c740f';
const donor='cc4554ef0104506a72bf0a28423fee52b6e4fff2';
const engine=process.env.M58_ENGINE;
assert.ok(['chromium','webkit'].includes(engine));
const root=process.cwd(),out=resolve('benchmark/main58-real-p88-browser-worker',engine);
await mkdir(out,{recursive:true});
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024}).trim();
assert.equal(git('rev-parse',legacy+':'+runner),runnerBlob);
const holder=await mkdtemp(join(tmpdir(),'p91-historical-'));
const worktree=join(holder,'source');
const trials=[];
let added=false;
try{
 git('worktree','add','--detach','--quiet',worktree,legacy);added=true;
 await symlink(join(root,'node_modules'),join(worktree,'node_modules'),'dir');
 const donorDir=join(worktree,'.m57-exact-p88-donor/public');await mkdir(donorDir,{recursive:true});
 for(const file of ['outfit-worker.mjs','outfit-segmentation.mjs','outfit-instance-review-840.mjs','photo-color.js']){
  const target=join(donorDir,file);
  await writeFile(target,execFileSync('git',['show',donor+':public/'+file],{cwd:root}));
  assert.equal(git('hash-object',target),git('rev-parse',donor+':public/'+file));
 }
 let source=await readFile(join(worktree,runner),'utf8');
 function instrument(before,after){
  assert.equal(source.split(before).length,2,'Historical diagnostic anchor changed');
  source=source.replace(before,after);
 }
 instrument('const navigationReasonsM69=[],mainFrameNavigationsM69=[];',
  'const navigationReasonsM69=[],mainFrameNavigationsM69=[],documentLifecycle91=[];');
 instrument("await cdp.send('Page.enable');",`await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  for(const event of ['Runtime.executionContextsCleared','Page.frameNavigated','Page.navigatedWithinDocument'])
   cdp.on(event,()=>documentLifecycle91.push({event,stage,elapsedMs:Math.round(performance.now()-started)}));`);
 instrument('navigationReasonsM69:navigationReasonsM69.slice(-12),',
  'documentLifecycle91:documentLifecycle91.slice(-40),navigationReasonsM69:navigationReasonsM69.slice(-12),');
 const instrumented=join(worktree,'scripts/test-p91-historical-instrumented.mjs');
 await writeFile(instrumented,source);
 for(let trial=1;trial<=3;trial++){
  const started=Date.now();
  const result=await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,[instrumented],{cwd:worktree,env:process.env,stdio:['ignore','pipe','pipe'],timeout:240000,killSignal:'SIGTERM'});
   let output='';
   const collect=chunk=>{output+=chunk.toString();if(output.length>4*1024*1024)child.kill('SIGTERM');};
   child.stdout.on('data',collect);child.stderr.on('data',collect);
   child.on('error',reject);child.on('close',(code,signal)=>resolve({code,signal,output}));
  });
  const lines=result.output.split('\n');
  const genuine=lines.some(line=>line.startsWith('M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW '));
  const failureLine=lines.find(line=>line.startsWith('M58_REAL_P88_WORKER_FAIL '));
  const failure=failureLine?JSON.parse(failureLine.slice('M58_REAL_P88_WORKER_FAIL '.length)):null;
  const categories=lines.filter(line=>line.startsWith('P91_PROTOCOL_ERROR_CATEGORY '))
   .map(line=>line.slice('P91_PROTOCOL_ERROR_CATEGORY '.length))
   .filter(value=>['Promise was collected','Cannot find context','Execution context was destroyed','Target closed','other-protocol-error'].includes(value));
  const record={trial,engine,legacySource:legacy,originalRunnerBlob:runnerBlob,
   elapsedMs:Date.now()-started,exitCode:result.code,signal:result.signal,
   genuineInferenceCompleted:genuine,wholeHistoricalJourneyPassed:result.code===0,
   failureStage:failure?.stage||null,
   genericContextError:/Execution context was destroyed|because of a navigation/.test(failure?.error||''),
   protocolCategories:categories,documentLifecycle:failure?.documentLifecycle91||[],
   navigationReasons:failure?.navigationReasonsM69||[]};
  trials.push(record);
  await writeFile(join(out,'P91-HISTORICAL-COMPARISON.json'),JSON.stringify({
   schema:'P91_HISTORICAL_DIAGNOSTIC_NOT_CURRENT_ACCEPTANCE/v1',engine,
   originalApplicationUnmodified:true,diagnosticRunnerOnly:true,trials,
   currentAcceptancePassed:false,familyAlpha:'HOLD'},null,2));
  console.log('P91_HISTORICAL_TRIAL',JSON.stringify(record));
  assert.ok(genuine,'Historical trial blocked before actual model inference; comparison incomplete');
  assert.equal(result.signal,null,'Historical trial did not finish normally');
 }
 console.log('P91_HISTORICAL_COMPARISON_COMPLETE',JSON.stringify({engine,
  trials:trials.length,passed:trials.filter(x=>x.wholeHistoricalJourneyPassed).length,
  failed:trials.filter(x=>!x.wholeHistoricalJourneyPassed).length,
  sameRestoreFailureReproduced:trials.some(x=>x.genericContextError&&
   x.failureStage==='same-real-worker-session-native-v4-atomic-restore'&&x.protocolCategories.length>0),
  archivedIncidentProtocolAvailable:false,
  currentAcceptancePassed:false,familyAlpha:'HOLD'}));
}finally{
 if(added)git('worktree','remove','--force',worktree);
 await rm(holder,{recursive:true,force:true});
}
