// Actual Android Chromium and iPhone WebKit engines; NOT physical hardware.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium,webkit} from 'playwright';
import {writeLinkedPhoneHTML} from './build-linked-phone-evidence.mjs';
import {parseTrial,summarizeTrial} from './linked-phone-garment-evidence.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'cc-linked-phone-browser-'));
try{
 const name=path.join(root,'PHONE-ORIGINALS.html');writeLinkedPhoneHTML(name);
 for(const [platform,engine] of [['Android',chromium],['iPhone',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,
    hasTouch:true,acceptDownloads:true,serviceWorkers:'block'});
   const external=[],errors=[];
   await context.route('**/*',route=>{
    if(/^(file:|blob:|data:)/.test(route.request().url()))return route.continue();
    external.push(route.request().url());return route.abort();
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(name).href);
   await page.locator('#phone').selectOption(platform);
   await page.locator('#build').fill('abcdef123456');
   await page.locator('#truthCategory').selectOption('sneakers');
   await page.locator('#truthColor').selectOption('black');
   await page.locator('#lock').click();
   assert.equal(await page.locator('#truthCategory').isDisabled(),true);
   assert.equal(await page.locator('#results').isVisible(),true);
   await page.locator('#modelCategory').selectOption('boots');
   await page.locator('#modelColor').selectOption('black');
   await page.locator('#savedCategory').selectOption('sneakers');
   await page.locator('#savedColor').selectOption('black');
   await page.locator('#savedPhoto').selectOption('clear');
   await page.locator('#record').click();
   assert.match(await page.locator('#progress').innerText(),/1\/30 garment entries/);
   const trigger=page.waitForEvent('download');
   await page.locator('#export').click();await page.locator('#download').click();
   const download=await trigger;
   const data=parseTrial(fs.readFileSync(await download.path(),'utf8'));
   const first=data.rows.find(row=>row.id===platform+'/sneakers/1');
   assert.equal(first.truthCategory,'sneakers');
   assert.equal(first.modelCategory,'boots');
   assert.equal(first.savedCategory,'sneakers');
   const metrics=summarizeTrial(data);
   assert.equal(metrics.modelCategoryColorExact,0);
   assert.equal(metrics.savedCategoryColorExact,1);
   assert.equal(metrics.verifiedRecognitionAccuracy,null);
   await page.locator('#scene').selectOption('boots');
   assert.equal(await page.locator('#download').isVisible(),false,'Stale export not revoked after scene change');
   const privatePayload=JSON.stringify({...data,email:'private@example.invalid',photo:'data:image/jpeg;base64,SECRET'});
   await page.locator('#import').setInputFiles({name:'unsafe.json',mimeType:'application/json',buffer:Buffer.from(privatePayload)});
   await page.waitForFunction(()=>document.getElementById('message').textContent.includes('rejected'));
   assert.match(await page.locator('#message').innerText(),/rejected/i);
   assert.doesNotMatch(await page.locator('body').innerText(),/private@example|data:image/);
   await page.locator('#import').setInputFiles({name:'safe.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
   await page.waitForFunction(()=>document.getElementById('message').textContent.includes('Validated private report loaded'));
   assert.match(await page.locator('#message').innerText(),/Validated private report loaded/);
   assert.equal(await page.locator('#truthCategory').isDisabled(),true);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
   assert.deepEqual(errors,[],'Runtime errors');
   assert.deepEqual(external,[],'External network requests');
   console.log('LINKED_PHONE_GARMENT_BROWSER_QA '+JSON.stringify({engine:platform==='Android'?'Android Chromium':'iPhone WebKit',
    result:'PASS',linkedOriginalPredictionAndSavedOutcome:true,
    noPrivateDataEcho:true,offlineOnly:true,externalRequests:0,
    physicalHardwareVerified:false,independentAccuracyVerified:false}));
   await context.close();
  }finally{await browser.close();}
 }
}finally{fs.rmSync(root,{recursive:true,force:true});}
