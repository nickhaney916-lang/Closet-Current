/**
 * M275 Mission 4 integrated original-model reliability, no deploy / HOLD.
 * True positive test is the UNMODIFIED shipped P94 actual SegFormer/JSEP Worker
 * plus unchanged private owner/photo/2D/v4/negative assertions. The separate
 * M181 zero-proposal mocked NEGATIVE is never eligible as a positive.
 * All original first-attempt failures are terminal RED, even if later runs pass.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

export const fixedParent='fea8522d76f9397b1afb765bcc7999ed4d70ff94';
export const prior=[
 'f2befed4c776786dc11843b98fafec72f2d9c202',
 'a16f55d2230afab907957ddffa8c5af968b39f20',
 'da9b8c81d8d7368f882489b439431e1d4a6871b4',
 '03361ef1c3fd5489dfd74c0a29deb9716b2da96d',
 '6eea610666a2d145037db54cc1e82bb106129735',
 '408859405223bff95265aa1d053ae11a04a3653f',
 fixedParent
];
export const ref='refs/heads/research/main1054-m275-integrated-original-webkit-reliability-HOLD';
export const changedFiles=[
 '.github/workflows/main1054-m275-integrated-model-stress-no-deploy.yml',
 'scripts/main1054-m275-integrated-model-stress.mjs',
 'tests/main1054-m275-integrated-model-stress.test.mjs'
];
export const immutable=Object.freeze({
 '.github/workflows/main1054-m274-m181-zero-proposal-no-deploy.yml':'ee7c827c4e815ccf2d942c44bcd29f0d41ce59c1',
 'scripts/main1054-m274-m181-source-gate.mjs':'81e5e42840330a9c7a05d084f64b4297b09d9b0e',
 'tests/main1054-m274-m181-source-gate.test.mjs':'d4cce3548ada5299a8635ad3f73a0b8252ddcc3c',
 '.github/workflows/main1054-m273-m180-firstload-no-deploy.yml':'53dfb2a6ca0d94f76f0cbdae2b3bed85768002f9',
 '.github/workflows/main1054-m272-m173-unflagged-24mp-no-deploy.yml':'79e81aa69bf303070b355dcc92b0d893716e3dfc',
 '.github/workflows/main1054-m271-m58-successor-no-deploy.yml':'1633a2aca790d27355edbbcc7793f8f0861f0d07',
 '.github/workflows/main181-zero-proposal-native-no-deploy.yml':'3cd39fb4fa69b859f182f746fa2993f8f09317ee',
 '.github/workflows/main180-unmodified-webkit-firstload-no-deploy.yml':'1dc421e71cb726b5884da4df39950b9e0c234cf4',
 '.github/workflows/main173-unflagged-owner-24mp-no-deploy.yml':'10cb88c8915521edf2cb847d716709304182a8a4',
 '.github/workflows/main183-outfit-session-epoch-no-deploy.yml':'3db5de8d585ae1d805882ba9038f1d66d8fc8bc9',
 'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41',
 'scripts/test-main181-zero-proposal-native-browser.mjs':'ea1a5bdb7f0617c71695f9b0382afd6ff7d5f089',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'public/outfit-capture.js':'8d55715ef09e34086d3c401ec38340bfc25f5fe8',
 'public/outfit-board.js':'b8ed5ebe18e81ec3f8f5659257289b8217a6877b',
 'public/native-outfit-source-plan-p99.mjs':'62ebfaad2fb14a965cd7ef386c383e849f511463',
 'public/auth.js':'3b9a9d6d7f39b489015cfd9160afe14b6d6f8df0',
 'public/native-photo-3d-veto-p99.mjs':'82b93d12d2fbcba146a190f5dce87a6ac5fc44af',
 'public/native-2d-preview-p99.mjs':'52d2b6d8834f27d9114e022fe8574947eda85206',
 'tests/outfit-capture.test.cjs':'b254c78302136761e1edf336056f8b949832c0ec'
});
export const sourceSHA='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const refuse=(cond,message)=>{if(!cond)throw Error('M275 source/evidence refusal: '+message);};
export function checkSource(git,event){
 refuse(event?.name==='push' && event?.ref===ref,'incorrect unprivileged event/branch');
 refuse(event.attempt==='1','rerun not eligible for original first-attempt evidence');
 refuse(/^[a-f0-9]{40}$/.test(event.sha||''),'missing exact event source head');
 const head=git('rev-parse','HEAD');
 refuse(head===event.sha,'checkout/source SHA mismatch');
 for(let i=0;i<prior.length-1;i++){
  refuse(git('merge-base','--is-ancestor',prior[i],prior[i+1])==='','frozen ancestry drift');
 }
 refuse(git('merge-base','--is-ancestor',fixedParent,head)==='','unapproved candidate parent');
 const diff=git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',fixedParent,head);
 refuse(diff===changedFiles.map(p=>'A\0'+p+'\0').join(''),'unexpected modified/omitted source');
 for(const p of changedFiles){
  refuse(git('ls-tree',head,'--',p).startsWith('100644 blob '),'non regular new gate file');
 }
 for(const [path,sha] of Object.entries(immutable)){
  refuse(git('rev-parse',head+':'+path)===sha,'source pin drift '+path);
 }
 return {source:'PASS',realNativeStress:'NOT_RUN_BY_SOURCE_GATE',nativeFix:'NOT_PROVEN',familyAlpha:'HOLD'};
}
function oneLog(log,prefix){
 const markers=String(log).split(/\r?\n/).filter(line=>line.startsWith(prefix+' '));
 if(markers.length!==1)return null;
 try{return JSON.parse(markers[0].slice(prefix.length+1));}catch{return null;}
}
function safeStage(log){
 const f=oneLog(log,'M58_REAL_P88_WORKER_FAIL');
 return /^[a-z][a-z0-9-]{0,75}$/i.test(f?.stage||'')?f.stage:null;
}
export function classifyOriginal(log,exit,meta){
 const {engine,width,ordinal,runAttempt,head,runId,count}=meta;
 refuse(engine==='webkit'||engine==='chromium','invalid native browser engine');
 refuse([320,390,430].includes(width),'unknown viewport');
 refuse(Number.isInteger(ordinal)&&ordinal>=1&&ordinal<=count,'invalid process ordinal');
 refuse(Number.isInteger(count)&&count>0&&count<=16,'unbounded process cohort');
 refuse(runAttempt===1,'not first attempt');
 refuse(typeof head==='string'&&/^[a-f0-9]{40}$/.test(head),'missing exact head');
 refuse(typeof runId==='string'&&/^[0-9]{5,30}$/.test(runId),'missing source run ID');
 const model=oneLog(log,'M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW');
 const owner=oneLog(log,'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS');
 const lifecycle=oneLog(log,'P91_FULL_JOURNEY_PASS');
 const originalFailure=oneLog(log,'M58_REAL_P88_WORKER_FAIL');
 const modelValid=model?.engine===engine &&
  model.sourceSHA256===sourceSHA && model.realWorker===true &&
  Number.isInteger(model.groups) && model.groups>=1 && model.groups<=12 &&
  Number.isInteger(model.modelRequests) && model.modelRequests>0 &&
  model.saved===0 && model.hold===true;
 const ownerValid=owner?.engine===engine && owner.modelExecuted===true &&
  owner.manualSyntheticOwnerConfirmed===true && owner.ownerPrivateSaved===1 &&
  owner.exactOriginalSHA256===sourceSHA && owner.realNativeOutfit===true &&
  owner.savedOutfitOwnerAction===true && owner.restoredSavedOutfitCount===1 &&
  owner.actualV4BrowserDownload===true && owner.tamperDenied===true &&
  owner.otherOwnerDenied===true && owner.cancelledRestoreUnchanged===true &&
  owner.atomicRestore===true && owner.restoredOriginalPhotoGallery===true &&
  owner.threeDAuthorized===false && owner.hostedRLS===false &&
  owner.physicalPhone===false && owner.familyAlpha==='HOLD' &&
  owner.releaseAuthorized===false;
 const lifecycleValid=lifecycle?.engine===engine &&
  lifecycle.uninterruptedSourceExportRestore===true &&
  lifecycle.originalPhotoByteTamperRefused===true &&
  lifecycle.ownerRecovery===true && lifecycle.familyAlpha==='HOLD' &&
  lifecycle.releaseAuthorized===false;
 const pass=exit.status===0 && !exit.timedOut && !exit.signal && !originalFailure &&
  modelValid && ownerValid && lifecycleValid;
 let reason='NONE';
 if(!pass){
  if(exit.timedOut)reason='TIMEOUT';
  else if(exit.signal)reason='PROCESS_SIGNAL';
  else if(originalFailure)reason='ORIGINAL_WORKER_FAILURE';
  else if(exit.status!==0)reason='NONZERO_EXIT';
  else if(!modelValid)reason='MISSING_OR_INVALID_REAL_MODEL';
  else if(!ownerValid)reason='MISSING_OR_INVALID_OWNER';
  else reason='MISSING_OR_INVALID_LIFECYCLE';
 }
 return {
  schema:'MAIN1054_M275_ORIGINAL_MODEL_STRESS_PROCESS_V1',
  head,runId,runAttempt,engine,width,ordinal,count,
  result:pass?'PASS':'FAIL',reason,
  nativeStage:pass?null:safeStage(log),
  exitCode:Number.isInteger(exit.status)?exit.status:null,
  signal:exit.signal?String(exit.signal).slice(0,16):null,
  originalSourceSHA:pass?sourceSHA:null,
  realModelProposals:pass?model.groups:null,
  originalNativeWorker:true,
  realModelRequired:true,
  zeroProposalMockForbidden:true,
  syntheticOwnerOnly:true,
  autoSavedWithoutConsent:pass?0:null,
  physicalDevice:false,hostedRLS:false,
  permanentWebKitFixProven:false,releaseAllowed:false,familyAlpha:'HOLD'
 };
}
export function summarize(rows,{engine,width,head,runId,count}){
 refuse(Array.isArray(rows)&&rows.length===count,'missing processes, do not replace with all green subset');
 const seen=new Set();let success=0,fail=0;
 for(const r of rows){
  refuse(r?.schema==='MAIN1054_M275_ORIGINAL_MODEL_STRESS_PROCESS_V1' &&
   r.head===head && r.runId===runId && r.runAttempt===1 &&
   r.engine===engine && r.width===width && r.count===count &&
   Number.isInteger(r.ordinal)&&r.ordinal>=1&&r.ordinal<=count &&
   !seen.has(r.ordinal) &&
   (r.result==='PASS'||r.result==='FAIL') &&
   r.realModelRequired===true && r.zeroProposalMockForbidden===true &&
   r.originalNativeWorker===true && r.releaseAllowed===false &&
   r.familyAlpha==='HOLD' && r.permanentWebKitFixProven===false &&
   r.syntheticOwnerOnly===true && r.hostedRLS===false &&
   r.physicalDevice===false,'stale, missing, spoofed or duplicate original first-attempt witness');
  seen.add(r.ordinal);
  if(r.result==='PASS')success++;
  else fail++;
 }
 return {
  schema:'MAIN1054_M275_INTEGRATED_GENUINE_NATIVE_COHORT_V1',
  head,runId,engine,width,expected:count,observed:rows.length,
  realOriginalPositive:success,genuineRed:fail,
  verdict:fail?'FAIL':'PASS',
  nativeFixProven:false,releaseAllowed:false,familyAlpha:'HOLD'
 };
}
function nativeGit(...args){return execFileSync('git',['-c','safe.directory='+process.cwd(),...args],{encoding:'utf8'}).replace(/\n$/,'');}
function event(){
 return {name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
  sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT};
}
function runCohort(){
 const source=checkSource(nativeGit,event());
 const engine=process.env.M275_ENGINE,width=Number(process.env.M275_WIDTH);
 const count=Number(process.env.M275_COUNT),runId=String(process.env.GITHUB_RUN_ID||'');
 refuse(['chromium','webkit'].includes(engine),'engine not pinned');
 refuse([320,390,430].includes(width),'invalid browser viewport');
 refuse(count===(engine==='webkit'?8:4),'precommitted original process count changed');
 refuse(/^[0-9]{5,30}$/.test(runId),'missing original run ID');
 const out=join('benchmark','main275-original-integrated-model-stress',engine,String(width));
 mkdirSync(out,{recursive:true});
 const rows=[];
 for(let ordinal=1;ordinal<=count;ordinal++){
  // Each call is a fresh Node process + fresh Playwright browser. Never reuse
  // successes to replace failing ordinals; keep all failures, continue finite
  // precommitted cohort. NO silent WebKit retries and NO model substitution.
  const child=spawnSync(process.execPath,['scripts/test-parallel94-native-p88-browser.mjs'],{
   encoding:'utf8',timeout:210000,maxBuffer:6*1024*1024,
   env:{...process.env,M58_ENGINE:engine,P94_WIDTH:String(width)}
  });
  const log=String(child.stdout||'');
  const meta={engine,width,ordinal,count,head:event().sha,runId,runAttempt:1};
  let result;
  try{
   result=classifyOriginal(log,{
    status:child.status,timedOut:child.error?.code==='ETIMEDOUT',signal:child.signal
   },meta);
  }catch{
   // Invalid diagnostic data itself is a FAIL, never rescued as positive.
   result=classifyOriginal('',{status:1,timedOut:false,signal:child.signal},meta);
  }
  rows.push(result);
  writeFileSync(join(out,'process-'+ordinal+'.json'),JSON.stringify(result,null,2)+'\n');
  console.log('M275_ORIGINAL_FIRST_ATTEMPT',JSON.stringify({
   engine,width,ordinal,result:result.result,reason:result.reason,
   nativeStage:result.nativeStage,runId,head:meta.head,hold:true
  }));
 }
 const summary=summarize(rows,{engine,width,head:event().sha,runId,count});
 writeFileSync(join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
 console.log('M275_ORIGINAL_INTEGRATED_SUMMARY',JSON.stringify(summary));
 if(summary.verdict!=='PASS')process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  if(process.argv[2]==='source') console.log('M275_SOURCE',JSON.stringify(checkSource(nativeGit,event())));
  else if(process.argv[2]==='cohort')runCohort();
  else throw Error('Expected source or cohort');
 }catch(error){
  console.error('M275_FAIL_CLOSED',String(error.message).slice(0,180));
  process.exitCode=1;
 }
}
