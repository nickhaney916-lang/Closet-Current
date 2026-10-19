// Chromium/WebKit emulation with SYNTHETIC image and synthetic reviewer
// inputs. Verifies workflow mechanics ONLY, never claims genuine human truth.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {prepareIndependentAdjudication,checkThirdIndependentSubmission} from '../benchmark/independent-photo-adjudication.mjs';
import assert from 'node:assert/strict';
const html=await readFile('benchmark/blind-original-photo-review.html');
const server=createServer((req,res)=>{
 if(req.url!=='/') {res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port+'/';
const sourceId='commons-0078',results=[];
const makePacket=(slot,sha)=>({
 schemaVersion:1,reviewType:'independent-blind-original-photo-inventory',
 reviewerSlot:slot,reviewerAlias:null,reviewedAt:null,modelPredictionsIncluded:false,
 manifestCategoryLabelsIncluded:false,originalPhotosCopiedOrReencoded:false,
 independentlyReviewed:false,allGarmentFormsVerified:false,photoCount:1,
 originals:[{sourceId,image:sourceId+'.jpg',sourceSha256:sha,license:'CC0'}]
});
const submitted=(slot,alias,sha,form)=>({
 schemaVersion:1,reviewType:'independent-blind-source-submission',
 reviewerSlot:slot,reviewerAlias:alias,reviewedAt:'2026-10-19T10:00:00-07:00',
 originalJpegsVerified:true,modelAnswersNotShown:true,
 sourceInventories:[{sourceId,sourceSha256:sha,originalJpegShaVerified:true,
  fullSourceInspected:true,allVisibleItemsRecorded:true,uncertaintyNotes:'',
  items:[{localItemId:'g01',category:'Shoes',form,visibility:'visible',
   evidence:'Visible shoe shape'}]}]
});
try{
 for(const [name,engine] of [['Pixel Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox']}: {})});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,
    isMobile:true,acceptDownloads:true});
   await ctx.route('**/*',route=>{
    const requested=route.request().url();
    return requested.startsWith(url)||requested.startsWith('blob:')||
     requested.startsWith('data:')?route.continue():route.abort('internetdisconnected');
   });
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(url);
   const base64=await page.evaluate(()=>{
    const c=document.createElement('canvas');c.width=28;c.height=24;
    const t=c.getContext('2d');t.fillStyle='#20a7b4';t.fillRect(0,0,28,24);
    t.fillStyle='#ffafc9';t.fillRect(4,5,12,17);
    return c.toDataURL('image/jpeg',.89).split(',')[1];
   });
   const bytes=Buffer.from(base64,'base64'),sha=createHash('sha256').update(bytes).digest('hex');
   const handoff=prepareIndependentAdjudication(
    makePacket('first',sha),submitted('first','synthetic-person-A',sha,'Sneakers'),
    makePacket('second',sha),submitted('second','synthetic-person-B',sha,'Ankle boots'));
   assert.equal(handoff.thirdBlindPacket.photoCount,1);
   const encoded=JSON.stringify(handoff.thirdBlindPacket);
   assert.equal(encoded.includes('Sneakers'),false);
   assert.equal(encoded.includes('Ankle boots'),false);
   await page.locator('#packet').setInputFiles({name:'third-blind-source-only.json',mimeType:'application/json',
    buffer:Buffer.from(encoded)});
   await page.locator('#jpegFiles').setInputFiles([{name:sourceId+'.jpg',mimeType:'image/jpeg',buffer:bytes}]);
   await page.waitForFunction(()=>document.getElementById('status').textContent.includes('1 of 1 original JPEG hashes verified'));
   await page.waitForFunction(()=>{
    const img=document.getElementById('photo');
    return img.complete&&img.naturalWidth>0&&img.naturalHeight>0;
   });
   await page.locator('#reviewer').fill('synthetic-person-C');
   await page.locator('#blind').check();
   await page.locator('#add').click();
   await page.locator('#items select.category').selectOption('Shoes');
   await page.locator('#items input.form').fill('Sneakers');
   await page.locator('#items textarea.evidence').fill('Synthetic fixture with visible upper');
   await page.locator('#inspected').check();
   await page.locator('#allRecorded').check();
   await page.locator('#save').click();
   assert.match(await page.locator('#status').textContent(),/Saved independent inventory/);
   const promised=page.waitForEvent('download');
   await page.locator('#export').click();
   const file=await promised;const fullPath=await file.path();
   const submission=JSON.parse(await readFile(fullPath,'utf8'));
   const checked=checkThirdIndependentSubmission(handoff,submission);
   assert.equal(checked.thirdSourceCount,1);
   assert.equal(checked.productionModelChangeAllowed,false);
   assert.equal(checked.physicalGarmentRecall,null);
   assert.deepEqual(errors,[]);
   results.push({engine:name,syntheticOriginals:1,sourceSHAverified:true,
    inheritedHumanAnswers:0,pixelMasksApproved:0,actualIndependentHumans:0,
    physicalPhoneHardwareTested:false,paidInferenceCalls:0});
   await ctx.close();
  }finally{await browser.close();}
 }
 console.log('THIRD_BLIND_REVIEW_EMULATION '+JSON.stringify(results));
}finally{server.close();}
