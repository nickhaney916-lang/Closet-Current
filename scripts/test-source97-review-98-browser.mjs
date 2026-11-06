#!/usr/bin/env node
/**
 * Actual Chromium/WebKit evidence ONLY for SOURCE98 offline local reviewer UX.
 * Clicks and polygon labels are AUTOMATED QA, never independent human truth.
 * Source originals, screenshots and exports are NEVER uploaded as artifacts.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {chromium,webkit} from 'playwright';
import {readonlyReviewServer98} from './prepare-source97-review-98.mjs';

const where=process.env.SOURCE98_RECEIPT;
if(!where)throw Error('SOURCE98_RECEIPT required from --build; no simulated sources');
const evidence=JSON.parse(await readFile(where,'utf8'));
if(evidence.originalPhotoCount!==7||evidence.sourceSHA256Verified!==7||
 evidence.familyAlpha!=='HOLD'||evidence.scientificallyAccepted!==0)
 throw Error('SOURCE98 source-original research HOLD not preserved');
const results=[],engines=[['Chromium',chromium],['WebKit',webkit]];
for(const [engine,browserType] of engines){
 const browser=await browserType.launch({headless:true});
 try{
  for(const [n,width] of [320,390,430].entries()){
   const role=['A','B','C'][n],dir=evidence.roles[role].directory;
   const {server,listen}=readonlyReviewServer98({roleDir:dir,port:0});
   const addr=await listen();
   try{
    const ctx=await browser.newContext({viewport:{width,height:800},
     deviceScaleFactor:1,acceptDownloads:true,isMobile:true,hasTouch:true});
    try{
     const page=await ctx.newPage();
     const sourceURL='http://127.0.0.1:'+addr.port+'/research/independent-instance-ground-truth-94/annotate.html';
     await page.goto(sourceURL,{waitUntil:'domcontentloaded'});
     await page.locator('#packetFile').setInputFiles(join(dir,'packet-'+role+'.json'));
     await page.locator('#sourceStatus').getByText('Verified actual original JPEG bytes',{exact:false})
      .waitFor({timeout:35000});
     const pixel=await page.locator('#photoCanvas').evaluate(canvas=>{
      const ctx=canvas.getContext('2d');
      const d=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let nonGray=0;
      for(let k=0;k<d.length;k+=4)if(d[k]!==d[k+1]||d[k+1]!==d[k+2])nonGray++;
      return {width:canvas.width,height:canvas.height,nonGray};
     });
     if(pixel.nonGray<100)throw Error('No actual original-photo pixel content rendered');
     const shot=await page.screenshot();
     if(shot.length<8000||shot.readUInt32BE(16)!==width)
      throw Error('Actual mobile viewport screenshot corrupt');
     // QA-only polygon clicks. Never store/export as a human record artifact.
     await page.locator('#reviewerId').fill('qa-robot-'+engine.toLowerCase()+'-'+width);
     await page.locator('#independent').check();
     await page.locator('#category').selectOption('Tops');
     const subtype=await page.locator('#itemType option').nth(1).getAttribute('value');
     if(!subtype)throw Error('Individual garment subtype UI did not populate');
     await page.locator('#itemType').selectOption(subtype);
     const color=await page.locator('#primaryColor option').nth(1).getAttribute('value');
     await page.locator('#primaryColor').selectOption(color);
     const canvas=page.locator('#photoCanvas');
     const bounds=await canvas.boundingBox();
     if(!bounds)throw Error('No image canvas hit target');
     for(const [x,y] of [[.2,.2],[.8,.25],[.65,.75],[.25,.7]])
      await canvas.click({position:{x:bounds.width*x,y:bounds.height*y}});
     await page.locator('#closeMask').click();
     const text=await page.locator('#savedMasks').textContent();
     if(!text.startsWith('1 individual garment polygon'))throw Error('Mask not recorded');
     await page.locator('#record').click();
     if(!(await page.locator('#progress').textContent()).includes('1 / 7'))
      throw Error('Human-review UI cannot record a QA test observation');
     const [download]=await Promise.all([
      page.waitForEvent('download',{timeout:15000}),page.locator('#export').click()
     ]);
     const exportBuffer=await readFile(await download.path());
     const review=JSON.parse(exportBuffer.toString('utf8'));
     if(review.rows.length!==1||review.rows[0].instances.length!==1||
      review.rows[0].sourceSHA256!==JSON.parse(await readFile(join(dir,'packet-'+role+'.json'),'utf8')).items[0].sourceSHA256)
      throw Error('QA-only reviewer JSON not source-bound to original JPEG');
     // Exported QA JSON is never written to an artifact, git or human corpus.
     results.push({engine,width,role,originalBytesSourced:true,
      firstSourceSHAPassed:true,canvasGenuineNonGrayPixels:pixel.nonGray,
      screenshotSHA256:createHash('sha256').update(shot).digest('hex'),
      screenshotWidth:shot.readUInt32BE(16),screenshotHeight:shot.readUInt32BE(20),
      originalPhotoVerifiedBeforeQAAnnotation:true,
      sourceBoundQAOnlyExport:true,humanReviewer:false,reviewAcceptedForScience:false});
    }finally{await ctx.close();}
   }finally{await new Promise(resolve=>server.close(resolve));}
  }
 }finally{await browser.close();}
}
if(results.length!==6)throw Error('SOURCE98 expected six real browser mobile-width workflows');
const result={schema:'source97-human-handoff-98/browser-qa-v1',
 researchOnly:true,originalPhotoCount:7,browserCases:results.length,
 browserEngines:['Chromium','WebKit'],mobileCSSWidths:[320,390,430],
 qaSimulatedPolygonReviews:6,verifiedIndependentActualHumanReviews:0,
 independentMasksAccepted:0,scientificInstanceIoU:null,
 sourcePoolScientificAcceptance:0,physicalAndroidIPhoneTested:false,
 releaseAuthorized:false,familyAlpha:'HOLD',results};
const folder='benchmark/source97-human-handoff-98';
await mkdir(folder,{recursive:true});
await writeFile(join(folder,'browser-audit.json'),JSON.stringify(result,null,2)+'\n');
console.log('SOURCE98 six actual Chromium/WebKit original-JPEG mobile browser cases PASS; QA clicks ARE NOT HUMAN REVIEWS; Family Alpha HOLD. '+JSON.stringify(result));
