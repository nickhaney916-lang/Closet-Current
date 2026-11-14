/**
 * MAIN1054 M42: four-source authentic offline unapproved fringe comparison.
 * Synthetic button choices are NOT human ratings. No network, login, or 3D.
 */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const engine=process.env.M42_ENGINE||'chromium';
assert.ok(['chromium','webkit'].includes(engine));
const browser=await ({chromium,webkit})[engine].launch({headless:true});
const dir=resolve('benchmark/main42-source-fringe');
const page=await browser.newPage({viewport:{width:1200,height:900},
 acceptDownloads:true});
const external=[],errors=[],consoleErrors=[];
page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',e=>{if(e.type()==='error')consoleErrors.push(e.text());});
try{
 await page.goto(pathToFileURL(resolve(dir,'offline-four-way-review.html')).href);
 const assets=await page.locator('figure img').evaluateAll(all=>all.map(x=>({
  id:x.id,loaded:x.complete&&x.naturalWidth>0,width:x.naturalWidth
 })));
 assert.equal(assets.length,8,'actual original + P93 proposal source images missing');
 assert.ok(assets.every(x=>x.loaded&&x.width>500),
  'actual source/mask comparison or diagnostic pixel evidence failed to decode');
 assert.match(await page.locator('.notice').first().innerText(),/FAMILY ALPHA HOLD/);
 assert.deepEqual(external,[]);
 // A missing response must NOT export a manufactured approval.
 await page.locator('#export').click();
 assert.match(await page.locator('#result').innerText(),/answer all three questions/);
 for(const [id,v] of [['neckline','needs-work'],['piping','pass'],['silhouette','reject']]){
  await page.locator('#'+id).selectOption(v);
 }
 await page.locator('#remarks').fill('Synthetic browser smoke selection: no real human present.');
 const downloadEvent=page.waitForEvent('download');
 await page.locator('#export').click();
 const d=await downloadEvent;
 assert.equal(d.suggestedFilename(),'main42-unverified-source-review.json');
 const verdict=JSON.parse(await readFile(await d.path(),'utf8'));
 assert.equal(verdict.schema,'MAIN1054_M42_UNVERIFIED_P93_VS_M42_HUMAN_REVIEW/v1');
 assert.equal(verdict.judgments.neckline,'needs-work');
 assert.equal(verdict.judgments.piping,'pass');
 assert.equal(verdict.judgments.silhouette,'reject');
 assert.equal(verdict.reviewerIdentityIndependentlyVerified,false);
 assert.equal(verdict.originalSourceFidelityIndependentlyAccepted,false);
 assert.equal(verdict.rendered3DFitIndependentlyAccepted,false);
 assert.equal(verdict.qualifiesForAutomatedMaskAdoption,false);
 assert.equal(verdict.qualifiesForConsumer3D,false);
 assert.equal(verdict.familyAlpha,'HOLD');
 assert.equal(verdict.releaseAuthorized,false);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await page.screenshot({path:resolve(dir,engine+'-source-review-workstation.png'),
  fullPage:false,animations:'disabled'});
 const result={engine,actualImagesLoaded:assets,
  localFileReviewBrowser:true,localSyntheticChoicesOnly:true,
  humanOriginalFidelityIndependentlyAccepted:false,
  ownerDataAccessed:false,networkRequests:external,
  pageErrors:errors,consoleErrors,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'};
 await writeFile(resolve(dir,engine+'-offline-review-browser.json'),
  JSON.stringify(result,null,2)+'\n');
 console.log('MAIN42_OFFLINE_REAL_SOURCE_FOUR_WAY_NOT_HUMAN_APPROVAL',
  JSON.stringify({engine,images:assets.length,networkRequests:0,
   humanAccepted:false,consumer3D:false,familyAlpha:'HOLD'}));
}finally{
 await page.close();await browser.close();
}
