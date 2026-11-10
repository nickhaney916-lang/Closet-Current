/**
 * P780 physical-phone-sized BROWSER QA, but NOT physical-phone verification.
 * One genuine decoded 4032x3024 JPEG per Chromium/WebKit, entirely synthetic
 * source bytes and simulated pointer inputs. No real garment/human rights.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';

const width=4032,height=3024,viewport=390;
const sha=b=>createHash('sha256').update(b).digest('hex');
const jpeg=await sharp({create:{width,height,channels:3,
 background:{r:40,g:90,b:160}}}).jpeg({quality:70}).toBuffer();
assert.equal((await sharp(jpeg).metadata()).width,width);
assert.equal((await sharp(jpeg).metadata()).height,height);
assert.ok(jpeg.length<8*1024*1024);
const digest=sha(jpeg);
const id='hold-synthetic-12mp-web-browser';
const seal={schema:'closet-current-prospective-holdout/v1',
 sealSHA256:'a'.repeat(64),
 photos:[{id,image:'original-12mp-synthetic-ci.jpg',
  sha256:digest,width,height}]};
const directory='benchmark/m1-human-reviewer-ui-774';
await mkdir(directory,{recursive:true});
const summary=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({
   viewport:{width:viewport,height:844},isMobile:true,hasTouch:true,
   serviceWorkers:'block',acceptDownloads:true});
  try{
   const page=await context.newPage(),external=[],errors=[];
   page.setDefaultTimeout(70000);
   page.on('request',r=>{if(/^https?:/i.test(r.url()))external.push(r.url());});
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(resolve('research/mission1-reviewer-774/offline-photo-polygon-review.html')).href);
   await page.locator('#cohort').setInputFiles({
    name:'sealed-12mp-synthetic-fixture.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(seal))
   });
   await page.locator('#original').setInputFiles({
    name:'unaltered-12mp-synthetic-original.jpg',mimeType:'image/jpeg',buffer:jpeg
   });
   await page.locator('#verify').click();
   await page.getByText(/Exact original JPEG SHA-256 and dimensions VERIFIED/).waitFor({timeout:70000});
   const actualDimensions=await page.locator('#drawing').evaluate(c=>[c.width,c.height]);
   assert.deepEqual(actualDimensions,[width,height],'do not downsample original canvas source');
   assert.equal(await page.locator('#export').isDisabled(),true);
   const targets=[[650,500],[3200,500],[3200,2700],[650,2700]];
   const canvas=page.locator('#drawing');
   await canvas.scrollIntoViewIfNeeded();
   for(const [i,[x,y]] of targets.entries()){
    const rect=await canvas.boundingBox();assert.ok(rect&&rect.width>100);
    await canvas.click({position:{x:rect.width*x/width,y:rect.height*y/height},timeout:70000});
    await page.waitForFunction(n=>document.getElementById('points').textContent.startsWith(n+' unfinished points'),i+1);
   }
   await page.locator('#finish').click();
   await page.locator('#category').selectOption('Tops');
   await page.locator('#subtype').selectOption('Blouse');
   await page.locator('#color').selectOption('Blue');
   await page.locator('#add').click();
   assert.equal(await page.locator('#regions li').count(),1);
   assert.equal(await page.locator('#export').isEnabled(),true);
   const downloadReady=page.waitForEvent('download');
   await page.locator('#export').click();
   const download=await downloadReady;
   const stream=await download.createReadStream(),chunks=[];
   for await(const ch of stream)chunks.push(ch);
   const proof=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   assert.equal(proof.sourceId,id);
   assert.equal(proof.sourceSHA256,digest);
   assert.equal(proof.regions.length,1);
   assert.equal(proof.regions[0].polygons.length,1);
   assert.deepEqual(
    [proof.regions[0].category,proof.regions[0].subtype,proof.regions[0].primaryColor],
    ['Tops','Blouse','Blue']);
   assert.equal(proof.regions[0].polygons[0].length,4);
   for(let i=0;i<targets.length;i++){
    const [actualX,actualY]=proof.regions[0].polygons[0][i];
    assert.ok(Math.abs(actualX-targets[i][0])<25&&Math.abs(actualY-targets[i][1])<25,
     'exported human outline must stay in original high resolution pixel coordinates');
   }
   assert.deepEqual(external,[]);
   assert.deepEqual(errors,[]);
   await page.locator('#original').setInputFiles({
    name:'tampered-12mp.jpg',mimeType:'image/jpeg',
    buffer:Buffer.concat([jpeg.subarray(0,32),Buffer.from([jpeg[32]^15]),jpeg.subarray(33)])
   });
   await page.locator('#verify').click();
   await page.waitForFunction(()=>document.getElementById('status')?.textContent?.includes('differs from the immutable registered source SHA'));
   assert.equal(await page.locator('#export').isDisabled(),true);
   const screenshot=directory+'/synthetic-12mp-'+name+'-390-mobile-review.png';
   await page.screenshot({path:screenshot,fullPage:true});
   const bytes=await readFile(screenshot);
   summary.push({browser:name,viewport,fullResolution:[width,height],
    originalSHA256:digest,screenSHA256:sha(bytes),
    sourcePixelCoordinatesRoundTrip:true,tamperedOriginalRejected:true,
    actualIndependentHumanOrGarmentPhoto:false,
    physicalPhoneAcceptance:false,releaseAuthorized:false});
   console.log('M1_P780_FULLSIZE_REVIEWER_BROWSER_SYNTHETIC_ONLY',JSON.stringify(summary.at(-1)));
  }finally{await context.close();}
 }finally{await browser.close();}
}
assert.equal(summary.length,2);
await writeFile(directory+'/synthetic-12mp-original-mobile-browser-receipts.json',
 JSON.stringify({summary,cohort:'SYNTHETIC_NOT_HUMAN_OR_LICENSING_EVIDENCE',familyAlpha:'HOLD'},null,2)+'\n');
