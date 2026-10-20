// Proves EXTRACTED offline first and second reviewer archives open on
// phone-width Chromium/WebKit with all twelve SHA-locked JPGs and correct editor
// links. No real human annotation or signed rights are created here.
import {chromium,webkit} from 'playwright';
import {resolve} from 'node:path';
import {existsSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const root=resolve('artifacts/private-human-review/offline-browser-packets');
const first=resolve(root,'first');
const second=resolve(root,'second');
const stats=[];
assert.ok(existsSync(resolve(first,'FIRST-REVIEW.html')));
assert.ok(existsSync(resolve(second,'SECOND-REVIEW.html')));

for(const [browserName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 const browser=await engine.launch({headless:true,...(browserName==='Chromium'?{args:['--no-sandbox']}:{})});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
  const page=await context.newPage();
  const errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith('file://'))remote.push(r.url())});
  await page.goto('file://'+resolve(first,'FIRST-REVIEW.html'));
  const originals=await page.locator('article img').count();
  assert.equal(originals,12,'offline original-photo roster must include all twelve');
  // The offline source page lazily loads full-resolution JPEGs. Decoding all
  // twelve offscreen images at once can hang or spike memory in WebKit.
  // Navigate exactly like a human, loading each original individually.
  const images=[];
  for(let i=0;i<originals;i++){
   const img=page.locator('article img').nth(i);
   await img.scrollIntoViewIfNeeded();
   const data=await img.evaluate(async el=>{
    const bounded=new Promise((_,reject)=>setTimeout(()=>reject(Error('Offline original JPEG did not decode')),12000));
    await Promise.race([el.decode(),bounded]);
    return {complete:el.complete,w:el.naturalWidth,h:el.naturalHeight,src:el.getAttribute('src')};
   });
   images.push(data);
  }
  assert.ok(images.every(im=>im.complete&&im.w>0&&im.h>0&&im.src.startsWith('originals/')),
   'offline archive must contain every same-directory original source');
  assert.equal(await page.locator('a[href="FIRST-ANNOTATE.html"]').count(),1);
  await page.locator('a[href="FIRST-ANNOTATE.html"]').click();
  await page.waitForURL(/FIRST-ANNOTATE.html$/);
  assert.equal(await page.locator('#photo').count(),1);
  assert.equal(await page.locator('#download').isDisabled(),true);
  assert.equal(await page.locator('#prediction').isDisabled(),true);
  assert.ok((await page.locator('#status').textContent()).includes('Choose a source image'));
  // Absence is necessary, but only role delivery practices can guarantee
  // first reviewers never see a separately sent second reviewer package.
  assert.equal(existsSync(resolve(first,'SECOND-APPROVE.html')),false);
  assert.equal(existsSync(resolve(first,'RIGHTS-AUDIT.json')),false);
  await page.goto('file://'+resolve(second,'SECOND-REVIEW.html'));
  assert.equal(await page.locator('article').count(),12);
  assert.equal(await page.locator('a[href="SECOND-APPROVE.html"]').count(),1);
  await page.locator('a[href="SECOND-APPROVE.html"]').click();
  await page.waitForURL(/SECOND-APPROVE.html$/);
  assert.equal(await page.locator('#photo').count(),1);
  assert.equal(await page.locator('#approve').isDisabled(),true);
  assert.equal(existsSync(resolve(second,'FIRST-ANNOTATE.html')),false);
  const firstManifest=JSON.parse(readFileSync(resolve(first,'PACKAGE-MANIFEST.json')));
  const secondManifest=JSON.parse(readFileSync(resolve(second,'PACKAGE-MANIFEST.json')));
  assert.equal(firstManifest.independentlyApprovedMasks,0);
  assert.equal(secondManifest.independentlyApprovedMasks,0);
  assert.deepEqual(errors,[]);
  assert.deepEqual(remote,[]);
  stats.push({browser:browserName,viewport:'390x844',decodedOriginalJpegs:images.length,
   blindFirstEditorOpened:true,separateSecondEditorOpened:true,
   roleMixingDetected:false,unapprovedHumanMasks:0,remoteRequests:0,physicalPhoneRuns:0});
  await context.close();
 }finally{await browser.close();}
}
console.log('OFFLINE_ROLE_PACKET_BROWSER '+JSON.stringify(stats));
