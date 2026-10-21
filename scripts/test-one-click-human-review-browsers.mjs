// Real source-locked original JPEGs in Chromium and WebKit; never fabricates a reviewer.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {packetFromLock,LOCK} from './source-holdout-human-review.mjs';
const [folder,reportPath]=process.argv.slice(2);
assert.ok(folder&&reportPath,'Usage: ... DIRECTORY REPORT.json');
const packet=packetFromLock(fs.readFileSync(LOCK)),photos=[],originals=process.env.ORIGINALS||folder;
for(const p of packet.photos){
 const meta=await sharp(fs.readFileSync(path.join(originals,p.image))).metadata();
 const rotated=[5,6,7,8].includes(meta.orientation);
 photos.push({id:p.id,sha256:p.sha256,width:rotated?meta.height:meta.width,height:rotated?meta.width:meta.height});
}
const results=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,acceptDownloads:true,serviceWorkers:'block'});
  const errors=[],denied=[];
  await context.route('**/*',route=>{if(/^(file:|blob:|data:)/.test(route.request().url()))return route.continue();denied.push(route.request().url());return route.abort();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(folder,'OPEN-REVIEW.html')).href,{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>verified&&urls.size===13&&document.querySelector('#status').textContent.includes('13 original JPEG hashes verified'),null,{timeout:120000});
  assert.equal(await page.locator('#files').isVisible(),false,'No reviewer file picker');
  const inspected=[];
  for(const p of photos){
   await page.locator('#source').selectOption(p.id);
   await page.waitForFunction(()=>selectedOriginalIsDisplayed(),null,{timeout:45000});
   const got=await page.locator('#photo').evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight}));
   assert.deepEqual(got,{width:p.width,height:p.height});
   assert.equal(await page.locator('#record').isDisabled(),false);
   inspected.push({id:p.id,sha256:p.sha256,...got});
  }
  await page.locator('#next').click();
  assert.equal(await page.locator('#position').innerText(),'Photo 1 of 13');
  await page.locator('#previous').click();
  assert.equal(await page.locator('#position').innerText(),'Photo 13 of 13');
  await page.waitForFunction(()=>selectedOriginalIsDisplayed());
  await page.locator('#record').click(); // blank required fields; cannot fabricate human labels.
  assert.equal(await page.evaluate(()=>rows.size),0);
  // Synthetic partial draft fixture only. This is NOT an independent human review.
  await page.locator('#source').selectOption(packet.photos[0].id);
  await page.waitForFunction(()=>selectedOriginalIsDisplayed());
  await page.locator('#family').selectOption('sneakers');
  await page.locator('#uncertainty').selectOption('false');
  await page.locator('#evidence').fill('A visible canvas high-top sneaker with a rubber sole and laces.');
  await page.locator('#record').click();
  assert.equal(await page.evaluate(()=>rows.size),1);
  const downloadEvent=page.waitForEvent('download');
  await page.locator('#saveDraft').click();
  const download=await downloadEvent;
  assert.equal(download.suggestedFilename(),'review-draft.json');
  const draftBytes=fs.readFileSync(await download.path()),draft=JSON.parse(draftBytes);
  assert.equal(draft.status,'DRAFT_UNREVIEWED');
  assert.equal(draft.photos.length,1);
  assert.equal(draft.packetSha256,(await page.evaluate(()=>blank.packetSha256)));
  assert.equal(Object.hasOwn(draft,'attestations'),false);
  await page.reload({waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>verified&&urls.size===13&&document.querySelector('#status').textContent.includes('13 original JPEG hashes verified'),null,{timeout:120000});
  assert.equal(await page.evaluate(()=>rows.size),0,'A closed page has no undocumented automatic persistence');
  await page.locator('#humanReviewer').check();
  await page.locator('#draftImport').setInputFiles({name:'review-draft.json',mimeType:'application/json',buffer:draftBytes});
  await page.waitForFunction(()=>document.querySelector('#draftStatus').textContent.includes('Recovered 1 of 13'));
  assert.equal(await page.evaluate(()=>rows.size),1);
  assert.equal(await page.locator('#humanReviewer').isChecked(),false,'Imported draft must not authorize past human attestations');
  assert.equal(await page.locator('#export').isDisabled(),true,'Draft must never be final submission');
  // Poison packet hash and observation family separately. Both rejected atomically.
  for(const poisoned of [{...draft,packetSha256:'bad'},{
    ...draft,photos:draft.photos.map(x=>({...x,observedFamily:'blazer-model-output'}))
  },{
    ...draft,photos:[...draft.photos,draft.photos[0]]
  }]){
    await page.locator('#draftImport').setInputFiles({
      name:'tampered-review-draft.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(poisoned))
    });
    await page.waitForFunction(()=>document.querySelector('#draftStatus').textContent.includes('Draft not loaded'));
    assert.equal(await page.evaluate(()=>rows.size),1,'Invalid imported draft must preserve prior observations');
    assert.equal(await page.locator('#export').isDisabled(),true);
  }
  await page.evaluate(()=>{rows.clear();update();});
  assert.equal(await page.evaluate(()=>rows.size),0);
  await page.waitForFunction(()=>selectedOriginalIsDisplayed());
  await page.locator('#photo').evaluate(img=>{Object.defineProperty(img,'complete',{configurable:true,value:false});img.dispatchEvent(new Event('load'));});
  assert.equal(await page.locator('#record').isDisabled(),true);
  await page.locator('#record').evaluate(b=>{b.disabled=false;b.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
  assert.equal(await page.evaluate(()=>rows.size),0);
  assert.ok((await page.locator('#status').innerText()).includes('Wait for the selected verified original'));
  assert.equal(await page.locator('#export').isDisabled(),true);
  assert.deepEqual(errors,[]);assert.deepEqual(denied,[]);
  results.push({engine:name,originalsDisplayed:inspected.length,photos:inspected,
   noManualPhotoSelection:true,noAutomatedHumanLabels:true,syntheticDraftRecoveryPassed:true,blankExportBlocked:true,
   failedDisplayRejected:true,physicalPhoneValidated:false});
  console.log(name+': 13 real originals displayed without file picker; missing labels and failed display blocked; 0 human submissions.');
 }finally{await browser.close();}
}
fs.writeFileSync(reportPath,JSON.stringify({status:'SOFTWARE_READY_AWAITING_REAL_HUMANS',engines:results,
 actualHumanSubmissions:0,independentHumanAccuracy:null,productionPromotion:'BLOCKED'},null,2)+'\n');
