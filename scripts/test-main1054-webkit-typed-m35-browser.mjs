#!/usr/bin/env node
/** M35 CI: TYPED-PHASE REPEATED WEBKIT HTTPS REAL 16-photo source-pinned pretrained CPU dual-model owner browser protocol
 * over local HTTPS in desktop Chromium/WebKit. Any emulation is NOT a phone.
 */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import https from 'node:https';
import {webkit,chromium} from 'playwright';
import {auditLocalDeviceHandoff32} from '../research/master-consolidation-1054/physical-device-evidence-gate-m32.mjs';
import {snapshotBrowserProcessTree} from '../research/master-consolidation-1054/browser-process-memory.mjs';
const fullSourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const sources=Object.fromEntries(manifest.filter(x=>x.verified).map(x=>[x.id,x.sha256]));
const tmp=await mkdtemp(join(tmpdir(),'cc-m32-lab-'));
const cert=join(tmp,'dev-only-cert.pem'),key=join(tmp,'dev-only-key.pem');
const token='M32LocalOnlyDoNotReuseOrShareToken123456789abcdef';
const port=Number(process.env.M32_CI_PORT||18443);
assert.ok(port>1024&&port<65536);
execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes',
 '-keyout',key,'-out',cert,'-days','1','-subj','/CN=localhost'],{stdio:'ignore'});
const server=spawn(process.execPath,['scripts/serve-webkit-typed-m35.mjs'],{
 env:{...process.env,M32_ACCESS_TOKEN:token,M32_TLS_CERT:cert,M32_TLS_KEY:key,
  M32_PORT:String(port),M32_BIND:'127.0.0.1'},stdio:['ignore','pipe','pipe']
});
let stderr='',stdout='';
server.stderr.on('data',b=>stderr+=b.toString().slice(0,1000));
server.stdout.on('data',b=>stdout+=b.toString().slice(0,1000));
const base='https://127.0.0.1:'+port;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const request=(route,method='GET')=>new Promise((resolve,reject)=>{
 const req=https.request(base+route,{method,rejectUnauthorized:false},r=>{
  const chunks=[];r.on('data',v=>chunks.push(v));
  r.on('end',()=>resolve({status:r.statusCode,headers:r.headers,body:Buffer.concat(chunks).toString('utf8')}));
 });req.on('error',reject);req.end();
});
let ok=false;
for(let i=0;i<160;i++){
 if(server.exitCode!==null)throw Error('M32 HTTPS host exited '+stderr.slice(0,250));
 try{const res=await request('/');if(res.status===403){ok=true;break;}}catch{}
 await delay(250);
}
// Reproduce an intermittent genuine desktop HTTPS WebKit failure without
// changing native owner UI, CPU worker, models, HTTPS host or original photos.
const REPEATS=3;
const reports=[],diagnostics=[];
const out='benchmark/main1054-webkit-typed-phase-m35';
await mkdir(out,{recursive:true});
const save=async()=>writeFile(out+'/source-bound-numeric-diagnostics.json',
 JSON.stringify({schema:'main1054-webkit-typed-phase-m35-v1',
  sourceCommit:fullSourceCommit,repeatsTarget:REPEATS,diagnostics,
  verifiedPhysicalDevices:0,actualIPhoneSafari:false,actualAndroidChrome:false,
  familyAlpha:'HOLD',releaseAuthorized:false},null,2)+'\n');
try{
 assert.equal(ok,true,'HTTPS research host did not start: '+stderr);
 assert.equal((await request('/device/manifest.json')).status,403,'untrusted device may not read source');
 assert.equal((await request('/','POST')).status,405,'server must reject all uploads/writes');
 for(let repeat=1;repeat<=REPEATS;repeat++){
  const name='webkit',engine=webkit;
  let browser,browserServer,context,page,memoryTimer=null;
  let checkpoint='BEFORE_BROWSER_START';
  const telemetry={repeat,lastTypedFailureMark:'NONE',
   typedFailureEvents:0,workerCreated:0,workerClosed:0,
   pageCrashes:0,modelStageCounts:{verifying:0,first:0,second:0,onnxInvoked:0},
   lastModelStage:'NONE',maxSampledProcessTreePSSBytes:0,sampleCount:0,
   requestFailures:0,consoleErrors:0};
  try{
   // Playwright Browser has no public process() API. Use its supported
   // BrowserServer owner so Linux /proc sampling is pinned to that exact PID.
   browserServer=await engine.launchServer({headless:true});
   checkpoint='BROWSER_SERVER_LAUNCHED';
   const pid=browserServer.process()?.pid;
   assert.ok(Number.isSafeInteger(pid)&&pid>0,'M35_BROWSER_SERVER_PID_REQUIRED');
   browser=await engine.connect(browserServer.wsEndpoint());
   const sample=()=>{
    try{
     const reading=snapshotBrowserProcessTree(pid);
     const pss=reading?.proportionalTreePSSBytes;
     if(Number.isSafeInteger(pss)&&pss>0){
      telemetry.sampleCount++;
      telemetry.maxSampledProcessTreePSSBytes=Math.max(
       telemetry.maxSampledProcessTreePSSBytes,pss);
     }
    }catch{}
   };
   sample();memoryTimer=setInterval(sample,2000);
   context=await browser.newContext({ignoreHTTPSErrors:true,
    viewport:{width:390,height:844},acceptDownloads:true,
    serviceWorkers:'block'});
   page=await context.newPage();
   checkpoint='PAGE_CREATED';
   const failures=[],requests=[];
   page.on('worker',worker=>{
    telemetry.workerCreated++;
    worker.once('close',()=>telemetry.workerClosed++);
   });
   page.on('crash',()=>telemetry.pageCrashes++);
   page.on('console',msg=>{
    if(msg.type()==='error'){telemetry.consoleErrors++;return;}
    const t=msg.text();
    if(!t.startsWith('MASTER_REAL_MODEL_STAGE '))return;
    const stage=t.slice('MASTER_REAL_MODEL_STAGE '.length);
    if(/^M35_FAILURE_[A-Z_]{3,45}_[A-Z_]{3,45}$/.test(stage)){
     telemetry.lastTypedFailureMark=stage;
     telemetry.typedFailureEvents++;
    }
    let code='UNCLASSIFIED';
    if(stage==='Verifying local CPU runtime')code='verifying';
    else if(stage==='Comparing first model')code='first';
    else if(stage==='Comparing second model')code='second';
    else if(stage.includes('M28_CPU_ONNX_RUN_INVOKED_fashionclip'))code='onnxInvoked';
    if(code!=='UNCLASSIFIED'){telemetry.modelStageCounts[code]++;telemetry.lastModelStage=code;}
   });
   page.on('requestfailed',()=>telemetry.requestFailures++);
   page.on('pageerror',e=>failures.push(String(e.message).slice(0,220)));
   page.on('request',r=>{if(!r.url().startsWith(base+'/')&&
    !r.url().startsWith('blob:'+base+'/'))requests.push(r.url().slice(0,100));});
   await page.goto(base+'/?access='+token,{waitUntil:'load',timeout:30000});
   await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.
    includes('Ready for operator-controlled local testing'),{timeout:25000});
   assert.equal((await page.locator('#source').textContent()).includes(fullSourceCommit.slice(0,12)),true);
   checkpoint='BEFORE_REAL_16_PHOTOS';
   await page.getByRole('button',{name:'Run 16 photos'}).click();
   await page.waitForFunction(()=>{
    const s=document.querySelector('#status')?.textContent||'';
    return s.includes('Local browser completed requested research cases')||
      s.includes('BLOCKED:');
   },null,{timeout:180000});
   const state=(await page.locator('#status').textContent())||'';
   if(!/Local browser completed requested research cases/.test(state)){
    const diagnostic=await page.evaluate(()=>({
     finishedRows:document.querySelectorAll('#rows li').length,
     displayedBlockedState:document.querySelector('#status')?.textContent?.
      startsWith('BLOCKED:')===true,
     workerErrorCode:/^P82_[A-Z_]+$/.test(window.workerError1054||'')?
      window.workerError1054:'UNCLASSIFIED_OR_NOT_SET',
     stage:document.querySelector('[data-dual82] [role="status"]')?.textContent?.
      slice(0,45)||'NO_VISIBLE_STAGE'
    }));
    console.log('MAIN1054_M33_HTTPS_BLOCKED_DIAGNOSTIC',
     JSON.stringify({browser:name,...diagnostic,physicalDevice:false}));
    assert.fail('M33 exact sixteen-photo genuine owner HTTPS run BLOCKED: '+JSON.stringify(diagnostic));
   }
   assert.equal(await page.locator('#rows li').count(),16,'16 genuine CPU native dual-model photo reviews');
   checkpoint='AFTER_REAL_16_PHOTOS';
   checkpoint='BEFORE_OWNER_CANCEL';
   await page.getByRole('button',{name:'Test model cancellation'}).click();
   await page.waitForFunction(()=>document.querySelector('#rows')?.children?.length===17,null,{timeout:90000});
   checkpoint='BEFORE_SESSION_LOCK';
   await page.getByRole('button',{name:'Test session lock'}).click();
   await page.waitForFunction(()=>document.querySelector('#rows')?.children?.length===18,null,{timeout:90000});
   checkpoint='AFTER_SESSION_LOCK';
   const promise=page.waitForEvent('download',{timeout:30000});
   await page.getByRole('button',{name:'Export local research receipt'}).click();
   const downloaded=await promise;
   // Playwright Download.path() throws on BrowserType.connect() sessions.
   // saveAs() is its supported cross-connection API. Only locally generated
   // redacted research receipts enter this short-lived, auto-deleted temp dir.
   const receiptPath=join(tmp,'m35-public-receipt-'+repeat+'.json');
   await downloaded.saveAs(receiptPath);
   const receipt=JSON.parse(await readFile(receiptPath,'utf8'));
   checkpoint='AFTER_RECEIPT_EXPORTED';
   const audit=auditLocalDeviceHandoff32(receipt,{commit:fullSourceCommit,sourceHashes:sources});
   assert.equal(audit.status,'LOCAL_16_PLUS_CANCEL_LOCK_RECEIPT_REQUIRES_EXTERNAL_HARDWARE_REVIEW',
    JSON.stringify({status:audit.status,errors:audit.errors}));
   assert.equal(receipt.rows.filter(x=>x.result==='COMPLETE_UNSAVED').length,16);
   assert.equal(receipt.rows.filter(x=>x.result==='ONNX_INVOKED_ABORT_NO_RESULT').length,2);
   assert.equal(receipt.hardwareVerified,false);
   assert.equal(receipt.releaseAuthorized,false);
   assert.equal(audit.independentlyVerifiedPhysicalRuns,0);
   assert.ok(!JSON.stringify(receipt).includes('data:image/'),'photo bytes must never enter receipt');
   assert.ok(!JSON.stringify(receipt).includes('private-owner'),'private account must never enter receipt');
   checkpoint='AFTER_SOURCE_OWNER_GATE';
   assert.deepEqual(failures,[],'actual browser script failed');
   assert.deepEqual(requests,[],'no external network request');
   checkpoint='AFTER_PAGE_ERRORS_GATE';
   await delay(200);
   assert.equal(telemetry.workerCreated,18,'16 photo workers plus two real abort workers');
   assert.equal(telemetry.workerClosed,18,'leaked or hanging WebKit worker');
   assert.equal(telemetry.pageCrashes,0,'page crash in WebKit');
   assert.equal(telemetry.requestFailures,0,'failed resource request in HTTPS model');
   checkpoint='AFTER_WORKER_LIFECYCLE_GATE';
   reports.push({browser:name,repeat,
    telemetry:{...telemetry},
    status:'RESEARCH_DESKTOP_HTTPS_CPU_NATIVE_REVIEW_PASS_NOT_PHONE',
    realPhotos:16,realInference:16,cancelLockCases:2,
    sourceDigestVerified:true,privateOwner:false,phoneVerified:false,
    releaseAuthorized:false,receiptResult:audit.status});
   diagnostics.push({repeat,result:'SUCCESS',checkpoint,completedPhotos:16,
    ownerCancelLockCases:2,workerErrorCode:'NONE',
    ...telemetry,device:'DESKTOP_WEBKIT_ONLY'});
   console.log('MAIN1054_M35_WEBKIT_TYPED_REPEAT',JSON.stringify({
    repeat,result:'SUCCESS',photos:16,abortCases:2,...telemetry,
    phoneVerified:false,releaseAuthorized:false}));
   await save();
  }catch(e){
   let state=null;
   try{
    state=await page?.evaluate(()=>({
     completedPhotos:[...document.querySelectorAll('#rows li')].filter(
      el=>el.textContent?.includes('COMPLETE_UNSAVED')).length,
     lastPhotoId:document.querySelector('#rows li:last-child')?.textContent?.
      match(/commons-\d{4}/)?.[0]||'NONE',
     blocked:document.querySelector('#status')?.textContent?.
      startsWith('BLOCKED:')||false,
     errorCode:/^P82_[A-Z_]+$/.test(window.workerError1054||'')?
      window.workerError1054:'NO_SAFE_P82_ERROR'
    }));
   }catch{}
   const kind=telemetry.workerCreated===0?
    'HARNESS_INSTRUMENTATION_SETUP_FAILURE':
    String(e?.message||'').includes('MODEL_WORKER_REPORTED_FAILURE')?
    'MODEL_WORKER_REPORTED_FAILURE':
    e?.name==='TimeoutError'?'BROWSER_TIMEOUT':
    'SOURCE_OR_OWNER_ACCEPTANCE_FAILURE';
   diagnostics.push({repeat,result:'BLOCKED',checkpoint,failureClass:kind,
    completedPhotos:state?.completedPhotos??null,
    lastPhotoId:state?.lastPhotoId??'UNKNOWN',
    browserBlocked:state?.blocked??null,
    workerErrorCode:state?.errorCode??'UNKNOWN',
    ...telemetry,device:'DESKTOP_WEBKIT_ONLY'});
   console.log('MAIN1054_M35_WEBKIT_TYPED_REPEAT_BLOCKED',JSON.stringify(diagnostics.at(-1)));
   await save();
  }finally{
   clearInterval(memoryTimer);
   try{await context?.close();}catch{}
   try{await browser?.close();}catch{}
   try{await browserServer?.close();}catch{}
  }
 }
 await save();
 const successes=diagnostics.filter(r=>r.result==='SUCCESS').length;
 console.log('MAIN1054_M35_WEBKIT_TYPED_REPEAT_SUMMARY',JSON.stringify({
  codeCommit:fullSourceCommit,target:REPEATS,successes,
  failures:REPEATS-successes,
  maxObservedPSSBytes:Math.max(0,...diagnostics.map(r=>r.maxSampledProcessTreePSSBytes||0)),
  completeResearchOnly:true,physicalPhones:0,releaseAuthorized:false,
  familyAlpha:'HOLD'
 }));
 assert.equal(successes,REPEATS,'intermittent WebKit HTTPS worker failure persists: see sanitized numeric artifact');
}finally{
 try{server.kill('SIGTERM');}catch{}
 await delay(200);
 if(server.exitCode===null)try{server.kill('SIGKILL');}catch{}
 await rm(tmp,{force:true,recursive:true});
}
