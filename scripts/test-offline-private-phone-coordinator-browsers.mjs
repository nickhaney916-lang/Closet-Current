// Synthetic browser QA of OFFLINE organizer, never actual Android/iPhone submissions.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium,webkit} from 'playwright';
import engine from '../public/device-check-engine.js';
import {comparePrivatePhonePilotReports} from '../benchmark/review-phone-pilot-reports.mjs';
const {deviceCheckSteps,deviceCheckReport}=engine;
const [folder,output]=process.argv.slice(2);
assert.ok(folder&&output,'Expected coordinator directory and evidence output path');
const all=Object.fromEntries(deviceCheckSteps.map(([id])=>[id,'pass']));
const build='123456abcdef';
const a=deviceCheckReport({enabled:false,steps:all,events:[]},build,'Android');
const i=deviceCheckReport({enabled:false,steps:all,events:[]},build,'iPhone/iPad');
const expected=comparePrivatePhonePilotReports(a,i);
const cases=[['mismatched build',{...i,appRelease:'bbbbbbbbbbbb'},true],
 ['partial checklist',deviceCheckReport({enabled:false,steps:{capture:'fail',login:'pass'},events:[]},build,'iPhone/iPad'),true],
 ['extra sensitive email',{...i,email:'private@example.test'},false],
 ['injected image',{...i,photos:'data:image/jpeg;base64,SECRET'},false],
 ['faked hardware',{...i,hardwareVerified:true},false],
 ['wrong platform',{...i,platform:'Android'},false],
 ['corrupt summary',{...i,summary:{...i.summary,checked:16}},false],
 ['wrong event code',{...i,events:[{type:'scanner_error',code:'not-a-real-code'}]},false]];
const results=[];
for(const [browserName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],blocked=[];
  page.on('pageerror',err=>errors.push(err.message));
  await context.route('**/*',route=>{
   if(/^(file:|blob:|data:)/.test(route.request().url()))return route.continue();
   blocked.push(route.request().url());return route.abort();
  });
  await page.goto(pathToFileURL(path.resolve(folder,'OPEN-PHONE-COORDINATOR.html')).href);
  const upload=(id,record)=>page.locator('#'+id).setInputFiles({
   name:id+'-private-device-check.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(record))});
  await page.locator('#check').click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Report not accepted.'));
  assert.equal(await page.locator('#results').isHidden(),true);
  await upload('android',a);await upload('iphone',i);
  await page.locator('#check').click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Both JSON structures validated.')||
   document.querySelector('#status').textContent.startsWith('Report not accepted.'));
  assert.match(await page.locator('#status').innerText(),/Both JSON structures validated/);
  assert.equal(await page.locator('#summary').innerText(),
   'Android: 17/17 checked; iPhone: 17/17 checked. Same reported app build: '+build+
   '. Status: manual-human-evidence-review-required. This is not hardware or launch approval.');
  await page.locator('#export').click();
  await page.waitForFunction(()=>document.querySelector('#download').href.startsWith('blob:'));
  const report=await page.evaluate(async()=>JSON.parse(await (await fetch(document.querySelector('#download').href)).text()));
  assert.deepEqual(report,expected,'Browser generated redacted summary must exactly match canonical Node engine');
  assert.equal(report.productionReleaseApproved,false);
  assert.equal(report.independentPhysicalDevicesConfirmed,false);
  assert.equal(JSON.stringify(report).includes('private@example.test'),false);
  const dlVisible=await page.locator('#download').isVisible();assert.equal(dlVisible,true);
  for(const [name,caseReport,valid]of cases){
   await upload('iphone',caseReport);
   assert.equal(await page.locator('#download').isHidden(),true,'Prior audit must immediately disappear after changed upload '+name);
   await page.locator('#check').click();
   await page.waitForFunction(()=>['Both JSON structures validated.','Report not accepted.'].some(x=>document.querySelector('#status').textContent.startsWith(x)));
   assert.equal((await page.locator('#status').innerText()).startsWith('Both JSON structures validated.'),valid,name);
   if(valid){
    const authoritative=comparePrivatePhonePilotReports(a,caseReport);
    await page.locator('#export').click();
    await page.waitForFunction(()=>document.querySelector('#download').href.startsWith('blob:'));
    const got=await page.evaluate(async()=>JSON.parse(await (await fetch(document.querySelector('#download').href)).text()));
    assert.deepEqual(got,authoritative,'Partial or mismatched reports must preserve valid blocker results');
   }else{
    assert.equal(await page.locator('#results').isHidden(),true);
    assert.equal(await page.locator('#download').isHidden(),true);
   }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
  results.push({engine:browserName,syntheticTests:cases.length+1,canonicalNodeParity:true,
   noRemoteRequests:true,realPhoneHardwareVerified:false,
   privateReportUploads:0,productionReleaseApproved:false});
  console.log(browserName+': canonical Node agreement; '+cases.length+' tampered and incomplete cases; zero real hardware reports.');
 }finally{await browser.close();}
}
fs.writeFileSync(output,JSON.stringify({technicalQA:'PASS',realPhoneReports:0,actualPhoneHardwareVerified:false,
 recognitionAccuracy:null,productionReleaseApproved:false,results},null,2)+'\n');
