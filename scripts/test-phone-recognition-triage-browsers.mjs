// Mobile browser engines only. No physical device or hosted network is involved.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium,webkit} from 'playwright';
import {blankTrial} from './linked-phone-garment-evidence.mjs';
import {writePhoneTriageHTML} from './build-phone-recognition-triage.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'closet-phone-triage-browser-'));
try{
 const output=path.join(root,'PHONE-TRIAGE.html');
 writePhoneTriageHTML(output);
 for(const [platform,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,
    hasTouch:true,acceptDownloads:true,serviceWorkers:'block'});
   const unexpected=[],errors=[];
   await context.route('**/*',route=>{
    if(/^(file:|blob:|data:)/.test(route.request().url()))return route.continue();
    unexpected.push(route.request().url());return route.abort();
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(output).href);
   assert.equal(await page.locator('#downloadButton').isDisabled(),true);
   const t=blankTrial(),row=t.rows[0];
   Object.assign(row,{phase:'recorded',truthCategory:'sneakers',truthColor:'black',
    modelCategory:'boots',modelColor:'black',savedCategory:'sneakers',
    savedColor:'black',savedPhoto:'pixelated'});
   await page.locator('#source').setInputFiles({name:'fixed-report.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(t))});
   await page.locator('#review').click();
   await page.waitForFunction(()=>document.getElementById('downloadButton').disabled===false);
   assert.match(await page.locator('#summary').innerText(),/1\/30 garment observations/);
   assert.match(await page.locator('#summary').innerText(),/clear image/);
   assert.match(await page.locator('#problems').innerText(),/Incorrect initial garment category/);
   await page.locator('#downloadButton').click();
   assert.equal(await page.locator('#download').isVisible(),true);
   const onDownload=page.waitForEvent('download');
   await page.locator('#download').click();
   const download=await onDownload;
   const saved=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
   assert.equal(saved.format,'closet-current-phone-triage-aggregate');
   assert.equal(saved.totals.recorded,1);
   assert.equal(saved.totals.usableCorrectlySaved,0);
   assert.equal(saved.verification.verifiedRecognitionAccuracy,null);
   assert.ok(!JSON.stringify(saved).includes('Android/sneakers/1'),'Per-original ID leaked');
   assert.ok(!JSON.stringify(saved).includes('truthCategory'),'Truth label leaked');
   await page.locator('#source').setInputFiles({name:'private.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify({...t,email:'private@example.invalid'}))});
   assert.equal(await page.locator('#download').isVisible(),false,'Stale download remains active');
   assert.equal(await page.locator('#downloadButton').isDisabled(),true);
   await page.locator('#review').click();
   await page.waitForFunction(()=>document.getElementById('status').textContent.includes('rejected'));
   assert.match(await page.locator('#status').innerText(),/rejected/);
   assert.doesNotMatch(await page.locator('body').innerText(),/private@example.invalid/);
   assert.deepEqual(unexpected,[],'Offline page accessed the network');
   assert.deepEqual(errors,[],'Browser script error');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   console.log('PHONE_RECOGNITION_TRIAGE_BROWSER_QA '+JSON.stringify({engine:platform,
    result:'PASS',noPerPhotoOutput:true,staleDownloadRevoked:true,
    externalRequests:0,physicalHardwareVerified:false,independentAccuracyVerified:false}));
   await context.close();
  }finally{await browser.close();}
 }
}finally{fs.rmSync(root,{recursive:true,force:true});}
