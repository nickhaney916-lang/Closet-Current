// Offline-only browser QA. Synthetic colored JPEG canvases are NOT real
// garment evidence; this exercises file hash checks, user flow and exports.
// Both engines emulate phones: no actual Android/iOS hardware is tested.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {validateBlindOriginalSubmission} from '../benchmark/blind-original-review-submissions.mjs';
const pageBytes=await readFile(resolve('benchmark/blind-original-photo-review.html'));
const server=createServer((req,res)=>{
 if(req.url!=='/'&&req.url!=='/blind-original-photo-review.html'){
  res.writeHead(404);res.end();return;
 }
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
 res.end(pageBytes);
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port+'/';
const report=[];
try{
 for(const [label,engine] of [['Pixel Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox']}: {})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},
    hasTouch:true,isMobile:true,acceptDownloads:true,serviceWorkers:'block'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(String(error)));
   await context.route('**/*',route=>{
    const target=route.request().url();
    // Local blob images are source bytes verified in memory, not Internet.
    if(target.startsWith(url)||target.startsWith('blob:')||target.startsWith('data:'))
     return route.continue();
    return route.abort('internetdisconnected');
   });
   await page.goto(url);
   const photos=await page.evaluate(()=>{
    const results=[];
    for(const [i,color] of [[1,'#ce3676'],[2,'#1668ad']]){
     const c=document.createElement('canvas');c.width=24;c.height=24;
     const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,24,24);
     ctx.fillStyle='white';ctx.fillRect(i*2,4,6,10);
     results.push({base64:c.toDataURL('image/jpeg',.9).split(',')[1]});
    }
    return results;
   });
   const ids=['commons-0078','commons-0059'];
   const originals=photos.map((p,i)=>({
    sourceId:ids[i],image:ids[i]+'.jpg',
    sourceSha256:createHash('sha256').update(Buffer.from(p.base64,'base64')).digest('hex'),
    license:'CC0'
   }));
   const packet={schemaVersion:1,reviewType:'independent-blind-original-photo-inventory',
    reviewerSlot:'first',modelPredictionsIncluded:false,manifestCategoryLabelsIncluded:false,
    originalPhotosCopiedOrReencoded:false,independentlyReviewed:false,allGarmentFormsVerified:false,
    photoCount:originals.length,originals};
   await page.locator('#packet').setInputFiles({
    name:'blind-first-reviewer.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(packet))
   });
   await assert.doesNotReject(()=>page.locator('#workspace').waitFor({state:'visible'}));
   // One missing JPEG must prevent any export despite a user selecting a name.
   await page.locator('#jpegFiles').setInputFiles([{
    name:originals[0].image,mimeType:'image/jpeg',buffer:Buffer.from(photos[0].base64,'base64')
   }]);
   await page.locator('#reviewer').fill('QA person '+label);
   await page.locator('#blind').check();
   assert.equal(await page.locator('#export').isDisabled(),true);
   await page.locator('#jpegFiles').setInputFiles(originals.map((o,i)=>({
    name:o.image,mimeType:'image/jpeg',buffer:Buffer.from(photos[i].base64,'base64')
   })));
   await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('2 of 2 original JPEG hashes verified'));
   for(const [index,c,form] of [[0,'Shoes','Sneakers'],[1,'Dresses','Dress']]){
    await page.locator('#source').selectOption(ids[index]);
    await page.waitForFunction(()=>{
      const image=document.getElementById('photo');
      return image.complete&&image.naturalWidth>0&&image.naturalHeight>0;
    },null,{timeout:10000});
    await page.locator('#add').click();
    await page.locator('#items .item').first().locator('select.category').selectOption(c);
    await page.locator('#items .item').first().locator('input.form').fill(form);
    await page.locator('#items .item').first().locator('textarea.evidence').fill('Full original canvas inspected; distinct visible outline');
    await page.locator('#inspected').check();
    await page.locator('#allRecorded').check();
    await page.locator('#save').click();
    assert.match(await page.locator('#status').innerText(),/Saved independent inventory/);
   }
   assert.equal(await page.locator('#export').isEnabled(),true);
   const event=page.waitForEvent('download');
   await page.locator('#export').click();
   const download=await event;
   const path=await download.path();
   assert.ok(path);
   const exported=JSON.parse(await readFile(path,'utf8'));
   const checked=validateBlindOriginalSubmission(packet,exported);
   assert.equal(checked.sourcePhotos,2);
   assert.equal(checked.visibleItemObservations,2);
   assert.equal(checked.independentGarmentGroundTruth,false);
   assert.ok(exported.sourceInventories.every(x=>x.originalJpegShaVerified===true));
   assert.deepEqual(errors,[]);
   report.push({engine:label,simulatedJpegs:2,fullHashChecks:true,
    missingOriginalBlocked:true,blindLabelsHidden:true,sourcePhotos:2,
    independentlyReviewedHumans:0,physicalMaskMetrics:null,
    paidModelCalls:0,actualPhoneHardware:false});
   await context.close();
  }finally{await browser.close();}
 }
 console.log('BLIND_ORIGINAL_REVIEW_BROWSER_QA '+JSON.stringify(report));
}finally{server.close();}
