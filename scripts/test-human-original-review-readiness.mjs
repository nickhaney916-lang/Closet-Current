// Real original-photo decoding; synthetic display-failure injection only.
// NEVER fills garment labels, reviewer identities, attestations or submissions.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {packetFromLock,blankSubmission,LOCK,hash} from './source-holdout-human-review.mjs';
const [directory,output]=process.argv.slice(2);assert.ok(directory&&output,'Usage: test-human-original-review-readiness.mjs HANDOFF OUTPUT.json');
const packet=packetFromLock(fs.readFileSync(LOCK));
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory,'packet.json'))),packet);
const blank=fs.readFileSync(path.join(directory,'review-template.json'));assert.deepEqual(JSON.parse(blank),blankSubmission(packet));
const originals=[];
for(const p of packet.photos){
 const bytes=fs.readFileSync(path.join(directory,p.image));assert.equal(hash(bytes),p.sha256);
 const metadata=await sharp(bytes).metadata();assert.equal(metadata.format,'jpeg');
 const rotated=[5,6,7,8].includes(metadata.orientation);
 originals.push({...p,bytes,expectedWidth:rotated?metadata.height:metadata.width,expectedHeight:rotated?metadata.width:metadata.height});
}
const checks=[];
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,acceptDownloads:true,serviceWorkers:'block'});
  const denied=[];await context.route('**/*',route=>{const url=route.request().url();if(/^(file:|blob:|data:)/.test(url))return route.continue();denied.push(url);return route.abort();});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(directory,'review.html')).href);
  assert.equal(await page.locator('#record').isDisabled(),true);
  await page.locator('#files').setInputFiles(originals.map(p=>({name:p.image,mimeType:'image/jpeg',buffer:p.bytes})));
  await page.getByRole('status').filter({hasText:'13 original JPEG hashes verified'}).waitFor({timeout:60000});
  const photos=[];
  for(const p of originals){
   await page.locator('#source').selectOption(p.id);
   await page.waitForFunction(()=>selectedOriginalIsDisplayed(),null,{timeout:30000});
   const dimensions=await page.locator('#photo').evaluate(async image=>{await image.decode();return {width:image.naturalWidth,height:image.naturalHeight};});
   assert.equal(dimensions.width,p.expectedWidth,p.id+' oriented width');assert.equal(dimensions.height,p.expectedHeight,p.id+' oriented height');
   assert.equal(await page.locator('#record').isDisabled(),false);
   photos.push({id:p.id,sha256:p.sha256,...dimensions,expectedWidth:p.expectedWidth,expectedHeight:p.expectedHeight});
  }
  // Simulate an incompletely displayed selected original, not a network timeout.
  await page.locator('#photo').evaluate(image=>{Object.defineProperty(image,'complete',{configurable:true,value:false});image.dispatchEvent(new Event('load'));});
  assert.equal(await page.locator('#record').isDisabled(),true);
  await page.locator('#record').evaluate(button=>{button.disabled=false;button.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
  assert.ok((await page.locator('#status').innerText()).includes('Wait for the selected verified original'));
  assert.equal(await page.evaluate(()=>rows.size),0);
  await page.locator('#photo').evaluate(image=>{delete image.complete;image.src='data:image/jpeg;base64,AAAA';});
  await page.waitForFunction(()=>!selectedOriginalIsDisplayed()&&document.querySelector('#photo').complete&&document.querySelector('#photo').naturalWidth===0);
  assert.equal(await page.locator('#record').isDisabled(),true);
  await page.locator('#record').evaluate(button=>{button.disabled=false;button.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
  assert.ok((await page.locator('#status').innerText()).includes('Wait for the selected verified original'));
  assert.equal(await page.evaluate(()=>rows.size),0);
  // Restore a genuine original after fault injection; no invented observations.
  await page.evaluate(()=>show());await page.waitForFunction(()=>selectedOriginalIsDisplayed());
  assert.equal(await page.locator('#export').isDisabled(),true);
  assert.equal(await page.evaluate(()=>rows.size),0);
  assert.deepEqual(errors,[]);assert.deepEqual(denied,[]);
  const blankTemplateUnchanged=Buffer.compare(blank,fs.readFileSync(path.join(directory,'review-template.json')))===0;assert.equal(blankTemplateUnchanged,true);
  checks.push({engine:engineName,photos,stalledImageBlocked:true,failedImageBlocked:true,observationsRecorded:0,blankExportBlocked:true,blankTemplateUnchanged});
  console.log(engineName+': all 13 hash-verified ORIGINAL photographs displayed at EXIF-oriented dimensions; injected incomplete/failed display blocked; zero human observations recorded.');
 }finally{await browser.close();}
}
fs.writeFileSync(output,JSON.stringify(checks,null,2)+'\n');
