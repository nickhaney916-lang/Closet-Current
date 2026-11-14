/**
 * M45 true original-source 2D offline review-browser smoke. It does not
 * certify photographed-garment accuracy or actual independent human review.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium,webkit} from 'playwright';
const engine=process.env.M45_ENGINE||'chromium';
assert.ok(['chromium','webkit'].includes(engine));
const base=resolve('benchmark/main45-licensed-vneck-photo-candidate');
const browser=await ({chromium,webkit})[engine].launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:850},
 acceptDownloads:true});
const network=[],pageErrors=[],consoleErrors=[];
page.on('request',r=>{if(/^https?:/i.test(r.url()))network.push(r.url());});
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',e=>{if(e.type()==='error')consoleErrors.push(e.text());});
try{
 await page.goto(pathToFileURL(resolve(base,
  'offline-actual-original-vneck-review.html')).href);
 const images=await page.locator('figure img').evaluateAll(xs=>
  xs.map(x=>({alt:x.alt,complete:x.complete,
   naturalWidth:x.naturalWidth,naturalHeight:x.naturalHeight})));
 assert.equal(images.length,2);
 assert.ok(images.every(x=>x.complete&&x.naturalWidth>1200&&
  x.naturalHeight>400));
 assert.match(await page.locator('.notice').first().innerText(),
  /NOT APPROVED/);
 await page.locator('#export').click();
 assert.match(await page.locator('#status').innerText(),
  /answer all review questions/);
 await page.locator('#vneck').selectOption('uncertain');
 await page.locator('#piping').selectOption('uncertain');
 await page.locator('#speckle').selectOption('some');
 await page.locator('#notes').fill('SYNTHETIC CI form selection. No real human inspected this image.');
 const d=page.waitForEvent('download');
 await page.locator('#export').click();
 const down=await d;
 assert.equal(down.suggestedFilename(),'main45-UNVERIFIED-vneck-review.json');
 const record=JSON.parse(await readFile(await down.path(),'utf8'));
 assert.equal(record.schema,'MAIN1054_M45_UNVERIFIED_SOURCE_VNECK_REVIEW/v1');
 assert.equal(record.originalSource,'commons-0053');
 assert.equal(record.judgments.vneck,'uncertain');
 assert.equal(record.judgments.piping,'uncertain');
 assert.equal(record.judgments.speckle,'some');
 assert.equal(record.reviewerIndependentlyVerified,false);
 assert.equal(record.maskSegmentationApproved,false);
 assert.equal(record.approvedReal3D,false);
 assert.equal(record.consumer3DAdmitted,false);
 assert.equal(record.releaseAuthorized,false);
 assert.equal(record.familyAlpha,'HOLD');
 assert.deepEqual(network,[]);
 assert.deepEqual(pageErrors,[]);
 await page.screenshot({path:resolve(base,engine+
  '-genuine-original-vneck-comparison-NOT-APPROVED.png'),
  animations:'disabled',fullPage:false});
 const result={schema:'M45_GENUINE_ORIGINAL_VNECK_2D_REVIEW_RESEARCH_ONLY/v1',
  engine,realOriginalAndOriginalP93Loaded:true,
  sourcePhotoVerifiedOutOfBand:true,originalPhotoRGBNeverChanged:true,
  offlineImageDecoding:images.length,
  independentHumanReview:false,
  browserTestSelectionIsSynthetic:true,
  privateAccountAccessed:false,realPhoneTested:false,
  network,pageErrors,consoleErrors,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'};
 await writeFile(resolve(base,engine+'-source-vneck-review-browser.json'),
  JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log('MAIN45_TRUE_ORIGINAL_PHOTO_VNECK_BROWSER_REVIEW_UNAPPROVED',
 JSON.stringify({engine,images:images.length,network:0,errors:0,
  syntheticChoicesOnly:true,maskApproved:false,
  consumer3D:false,familyAlpha:'HOLD'}));
}finally{await page.close();await browser.close();}
