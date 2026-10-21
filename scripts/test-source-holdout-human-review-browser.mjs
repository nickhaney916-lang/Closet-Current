// Synthetic colored JPEGs and made-up submissions test SOFTWARE ONLY.
// These are not garment photographs, human reviews, inference or phone hardware.
import {chromium,webkit} from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {packetFromLock,reviewHTML,validateSubmission,hash,LOCK,attestations} from './source-holdout-human-review.mjs';
const out=fs.mkdtempSync(path.join(os.tmpdir(),'holdout-offline-browser-'));
try{
 for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,acceptDownloads:true,serviceWorkers:'block'});
   await context.route('**/*',route=>route.request().url().startsWith('file:')?route.continue():route.abort());
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const encoded=await page.evaluate(()=>['red','blue'].map(color=>{const c=document.createElement('canvas');c.width=64;c.height=96;c.getContext('2d').fillStyle=color;c.getContext('2d').fillRect(0,0,64,96);return c.toDataURL('image/jpeg').split(',')[1];}));
   const buffers=encoded.map(s=>Buffer.from(s,'base64')),packet=packetFromLock(fs.readFileSync(LOCK));
   packet.photos=packet.photos.slice(0,2).map((p,i)=>({...p,sha256:hash(buffers[i])}));
   const file=path.join(out,name+'.html');fs.writeFileSync(file,reviewHTML(packet));await page.goto(pathToFileURL(file).href);
   assert.equal(await page.locator('#export').isDisabled(),true);
   await page.locator('#reviewer').fill('Synthetic browser fixture '+name);
   for(const key of attestations)await page.locator('#'+key).check();
   const input=packet.photos.map((p,i)=>({name:p.image,mimeType:'image/jpeg',buffer:buffers[i]}));
   await page.locator('#files').setInputFiles(input.slice(0,1));
   await page.getByRole('status').filter({hasText:'Select every original'}).waitFor();
   assert.equal(await page.locator('#export').isDisabled(),true);
   await page.locator('#files').setInputFiles(input);
   await page.getByRole('status').filter({hasText:'2 original JPEG hashes verified'}).waitFor();
   for(const p of packet.photos){
    await page.locator('#source').selectOption(p.id);
    await page.waitForFunction(()=>document.querySelector('#photo').naturalWidth===64);
    await page.locator('#family').selectOption('uncertain');await page.locator('#uncertainty').selectOption('false');
    await page.locator('#evidence').fill('Synthetic colored pixels, no real garment evidence.');await page.locator('#record').click();
    await page.getByRole('status').filter({hasText:'unknown must be uncertain'}).waitFor();
    await page.locator('#uncertainty').selectOption('true');await page.locator('#record').click();
   }
   assert.equal(await page.locator('#export').isDisabled(),false);
   // Editing a recorded observation must invalidate it until explicitly recorded again.
   await page.locator('#evidence').fill('Edited synthetic fixture evidence, not a real reviewer.');
   assert.equal(await page.locator('#export').isDisabled(),true);await page.locator('#record').click();
   await page.locator('#noProposedLabelsSeen').uncheck();assert.equal(await page.locator('#export').isDisabled(),true);await page.locator('#noProposedLabelsSeen').check();
   const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;
   const submission=JSON.parse(fs.readFileSync(await download.path(),'utf8'));validateSubmission(packet,submission);
   assert.ok(submission.photos.every(p=>p.uncertain&&p.observedFamily==='uncertain'));
   const changed=input.map(x=>({...x}));changed[0].buffer=Buffer.from('not original');await page.locator('#files').setInputFiles(changed);
   await page.getByRole('status').filter({hasText:'Original hash mismatch'}).waitFor();assert.equal(await page.locator('#export').isDisabled(),true);
   for(const width of [320,390,430]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
   assert.deepEqual(errors,[]);console.log(name+': review upload/hash/uncertainty/edit/export/tamper/mobile checks passed (synthetic only).');
  }finally{await browser.close();}
 }
}finally{fs.rmSync(out,{recursive:true,force:true});}
