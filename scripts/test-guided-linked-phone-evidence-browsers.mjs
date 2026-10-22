// Touch-capable mobile-browser QA of the actual offline guided trial worksheet.
// Chromium/WebKit emulation is NEVER evidence of a physical Android/iPhone.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium,webkit} from 'playwright';
import {writeLinkedPhoneHTML} from './build-linked-phone-evidence.mjs';
import {parseTrial,trialPlatformProgress} from './linked-phone-garment-evidence.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc-guided-phone-'));
try{
 const pagePath=path.join(dir,'PHONE-ORIGINALS.html');writeLinkedPhoneHTML(pagePath);
 for(const [label,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    acceptDownloads:true,serviceWorkers:'block'});
   const urls=[],errors=[];
   await ctx.route('**/*',route=>{
    if(/^(file:|blob:|data:)/.test(route.request().url()))return route.continue();
    urls.push(route.request().url());return route.abort();
   });
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(pagePath).href);
   assert.match(await page.locator('#progress').innerText(),/Android: 0\/15/);
   assert.match(await page.locator('#progress').innerText(),/iPhone: 0\/15/);
   assert.equal(await page.locator('#next').isEnabled(),true);
   await page.locator('#phone').selectOption('Android');
   await page.locator('#build').fill('aabbccddeeff');
   await page.locator('#truthCategory').selectOption('sneakers');
   await page.locator('#truthColor').selectOption('black');
   await page.locator('#lock').click();
   assert.equal(await page.locator('#truthCategory').isDisabled(),true);
   await page.locator('#modelCategory').selectOption('sneakers');
   await page.locator('#modelColor').selectOption('black');
   await page.locator('#savedCategory').selectOption('sneakers');
   await page.locator('#savedColor').selectOption('black');
   await page.locator('#savedPhoto').selectOption('clear');
   await page.locator('#record').tap();
   assert.equal(await page.locator('#scene').inputValue(),'boots','Record advances to next unfinished');
   assert.equal(await page.locator('#garment').inputValue(),'1');
   assert.match(await page.locator('#progress').innerText(),/Android: 1\/15/);
   assert.match(await page.locator('#progress').innerText(),/iPhone: 0\/15/);
   assert.equal(await page.locator('#truthCategory').isEnabled(),true,
    'Unreviewed original must remain hidden from model outcome');

   // Explicit backup -> file download -> reload -> imported resume; no persistence.
   await page.locator('#export').click();
   const d=page.waitForEvent('download');await page.locator('#download').click();
   const file=await d;const saved=parseTrial(fs.readFileSync(await file.path(),'utf8'));
   assert.equal(saved.rows[0].phase,'recorded');
   assert.equal(trialPlatformProgress(saved)[0].recorded,1);
   await page.reload();
   assert.match(await page.locator('#progress').innerText(),/Android: 0\/15/,
    'Private fixed-choice results are not silently stored in browser');
   await page.locator('#import').setInputFiles({name:'resume.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(saved))});
   await page.waitForFunction(()=>document.getElementById('message').textContent.includes('Validated private report loaded'));
   await page.locator('#next').tap();
   assert.equal(await page.locator('#scene').inputValue(),'boots');
   assert.match(await page.locator('#progress').innerText(),/Android: 1\/15/);
   await page.locator('#phone').selectOption('iPhone');
   assert.match(await page.locator('#progress').innerText(),/iPhone: 0\/15/);
   assert.equal(await page.locator('#next').isEnabled(),true);
   await page.locator('#scene').selectOption('whole-outfit');
   assert.match(await page.locator('#note').innerText(),/scene 12\/12/);
   for(let i=1;i<=3;i++){
    await page.locator('#garment').selectOption(String(i));
    await page.locator('#truthCategory').selectOption('top');
    await page.locator('#truthColor').selectOption('blue');
    await page.locator('#lock').tap();
    await page.locator('#modelCategory').selectOption('top');
    await page.locator('#modelColor').selectOption('blue');
    await page.locator('#savedCategory').selectOption('top');
    await page.locator('#savedColor').selectOption('blue');
    await page.locator('#savedPhoto').selectOption('clear');
    // Don't record here: test that the whole-scene denominator does not inflate.
    if(i<3){
     await page.locator('#record').tap();
     await page.locator('#scene').selectOption('whole-outfit');
    }
   }
   assert.match(await page.locator('#progress').innerText(),/iPhone: 2\/15/);
   assert.match(await page.locator('#progress').innerText(),/0\/12 scenes complete/,
    'Multiple garments from one source must not be counted as completed scene');
   assert.match(await page.locator('#progress').innerText(),/Verified actual phones: ZERO/);
   await page.locator('#export').click();
   assert.equal(await page.locator('#download').isVisible(),true);
   await page.locator('#phone').selectOption('Android');
   assert.equal(await page.locator('#download').isVisible(),false,'Stale prepared download invalidated');
   assert.deepEqual(errors,[]);
   assert.deepEqual(urls,[]);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   console.log('GUIDED_ORIGINAL_FIRST_OFFLINE_BROWSER_QA '+JSON.stringify({
    engine:label,result:'PASS',devicePhysicallyVerified:false,independentSourcePhotosVerified:0,
    privatePhotosUploaded:0,externalRequests:0,operatorSelfReportNotAccuracy:true}));
   await ctx.close();
  }finally{await browser.close();}
 }
}finally{fs.rmSync(dir,{recursive:true,force:true});}
