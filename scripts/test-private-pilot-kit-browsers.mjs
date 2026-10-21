import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium,webkit} from 'playwright';
import {writePrivatePilotKit} from './build-private-pilot-kit.mjs';
import {blankSession,parseSession} from './private-pilot-session.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'closet-kit-browser-'));
try{
 const output=path.join(root,'kit');writePrivatePilotKit(output);
 for(const [name,type]of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await type.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true,serviceWorkers:'block'});
   const external=[],errors=[];await context.route('**/*',route=>{if(/^(file:|blob:|data:)/.test(route.request().url()))return route.continue();external.push(route.request().url());return route.abort();});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.join(output,'START-HERE.html')).href);
   await page.locator('#platform').selectOption(name.startsWith('Android')?'Android':'iPhone');await page.locator('#release').fill('abcdef123456');
   await page.locator('#phone-capture').selectOption('pass');await page.locator('#phone-cloud').selectOption('fail');await page.locator('#review').click();
   assert.match(await page.locator('#summary').innerText(),/phone: 1\/10.*1 fail/);assert.match(await page.locator('#summary').innerText(),/Deployment: BLOCKED/);
   const pending=page.waitForEvent('download');await page.locator('#download').click();const download=await pending;const report=parseSession(fs.readFileSync(await download.path(),'utf8'));assert.equal(report.checks.phone.cloud,'fail');assert.equal(report.physicalHardwareVerified,false);
   await page.locator('#phone-cloud').selectOption('pass');assert.equal(await page.locator('#download').isVisible(),false);
   const secret=JSON.stringify({...blankSession(),email:'DO_NOT_DISPLAY_PRIVATE',photo:'data:image/jpeg;base64,PRIVATE'});
   await page.locator('#import').setInputFiles({name:'report.json',mimeType:'application/json',buffer:Buffer.from(secret)});await page.waitForFunction(()=>document.getElementById('summary').textContent.includes('Report rejected'));
   assert.doesNotMatch(await page.locator('body').innerText(),/DO_NOT_DISPLAY_PRIVATE|data:image/);
   await page.locator('#import').setInputFiles({name:'report.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(report))});await page.waitForFunction(()=>document.getElementById('summary').textContent.includes('phone: 1/10'));
   assert.equal(await page.locator('#download').isVisible(),false);await page.locator('#reset').click();assert.equal(await page.locator('#phone-capture').inputValue(),'unknown');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'no horizontal overflow');
   await page.locator('a[href="review/OPEN-PRIVATE-PILOT-REVIEW.html"]').click();assert.match(await page.title(),/pilot|cohort/i);
   assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
   console.log(JSON.stringify({browser:name,offlineKit:'PASS',downloadImportPrivacyAndInvalidation:'PASS',externalRequests:0,physicalHardwareVerified:false}));await context.close();
  }finally{await browser.close();}
 }
}finally{fs.rmSync(root,{recursive:true,force:true});}
