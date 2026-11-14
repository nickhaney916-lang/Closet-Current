#!/usr/bin/env node
/** M32 CI: REAL source-pinned pretrained CPU dual-model owner browser protocol
 * over local HTTPS in desktop Chromium/WebKit. Any emulation is NOT a phone.
 */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import https from 'node:https';
import {webkit,chromium} from 'playwright';
import {auditLocalDeviceHandoff32} from '../research/master-consolidation-1054/physical-device-evidence-gate-m32.mjs';
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
const server=spawn(process.execPath,['scripts/serve-physical-device-m32.mjs'],{
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
const browsers={chromium,webkit};
const reports=[];
try{
 assert.equal(ok,true,'HTTPS research host did not start: '+stderr);
 assert.equal((await request('/device/manifest.json')).status,403,'untrusted device may not read source');
 assert.equal((await request('/','POST')).status,405,'server must reject all uploads/writes');
 for(const [name,engine]of Object.entries(browsers)){
  let browser;
  try{
   browser=await engine.launch({headless:true});
   const context=await browser.newContext({ignoreHTTPSErrors:true,
    viewport:{width:390,height:844},acceptDownloads:true,
    serviceWorkers:'block'});
   const page=await context.newPage();
   const failures=[],requests=[];
   page.on('pageerror',e=>failures.push(String(e.message).slice(0,220)));
   page.on('request',r=>{if(!r.url().startsWith(base+'/')&&
    !r.url().startsWith('blob:'+base+'/'))requests.push(r.url().slice(0,100));});
   await page.goto(base+'/?access='+token,{waitUntil:'load',timeout:30000});
   await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.
    includes('Ready for operator-controlled local testing'),{timeout:25000});
   assert.equal((await page.locator('#source').textContent()).includes(fullSourceCommit.slice(0,12)),true);
   await page.getByRole('button',{name:'Run 4 photos'}).click();
   await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.
    includes('Local browser completed requested research cases'),null,{timeout:180000});
   assert.equal(await page.locator('#rows li').count(),4,'4 genuine CPU native dual-model photos');
   await page.getByRole('button',{name:'Test model cancellation'}).click();
   await page.waitForFunction(()=>document.querySelector('#rows')?.children?.length===5,null,{timeout:90000});
   await page.getByRole('button',{name:'Test session lock'}).click();
   await page.waitForFunction(()=>document.querySelector('#rows')?.children?.length===6,null,{timeout:90000});
   const promise=page.waitForEvent('download',{timeout:30000});
   await page.getByRole('button',{name:'Export local research receipt'}).click();
   const downloaded=await promise;
   const receipt=JSON.parse(await readFile(await downloaded.path(),'utf8'));
   const audit=auditLocalDeviceHandoff32(receipt,{commit:fullSourceCommit,sourceHashes:sources});
   assert.equal(audit.status,'INCOMPLETE_PHYSICAL_DEVICE_ACCEPTANCE',
    JSON.stringify({status:audit.status,errors:audit.errors}));
   assert.equal(receipt.rows.filter(x=>x.result==='COMPLETE_UNSAVED').length,4);
   assert.equal(receipt.rows.filter(x=>x.result==='ONNX_INVOKED_ABORT_NO_RESULT').length,2);
   assert.equal(receipt.hardwareVerified,false);
   assert.equal(receipt.releaseAuthorized,false);
   assert.equal(audit.independentlyVerifiedPhysicalRuns,0);
   assert.ok(!JSON.stringify(receipt).includes('data:image/'),'photo bytes must never enter receipt');
   assert.ok(!JSON.stringify(receipt).includes('private-owner'),'private account must never enter receipt');
   assert.deepEqual(failures,[],'actual browser script failed');
   assert.deepEqual(requests,[],'no external network request');
   reports.push({browser:name,status:'RESEARCH_DESKTOP_HTTPS_CPU_NATIVE_REVIEW_PASS_NOT_PHONE',
    realPhotos:4,realInference:4,cancelLockCases:2,
    sourceDigestVerified:true,privateOwner:false,phoneVerified:false,
    releaseAuthorized:false,receiptResult:audit.status});
   console.log('MAIN1054_M32_GENUINE_HTTPS_BROWSER',JSON.stringify(reports.at(-1)));
   await context.close();
  }finally{await browser?.close();}
 }
 assert.equal(reports.length,2);
 console.log('MAIN1054_M32_LOCAL_HTTPS_SUMMARY',JSON.stringify({
  codeCommit:fullSourceCommit,results:reports,noDeploy:true,
  fakePhysicalClaims:0,releaseAuthorized:false,familyAlpha:'HOLD'
 }));
}finally{
 try{server.kill('SIGTERM');}catch{}
 await delay(200);
 if(server.exitCode===null)try{server.kill('SIGKILL');}catch{}
 await rm(tmp,{force:true,recursive:true});
}
