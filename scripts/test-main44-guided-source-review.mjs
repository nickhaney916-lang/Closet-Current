/**
 * M44 actually loads original licensed Commons-0053/P93 in offline Chromium
 * and WebKit, tests region navigation does NOT modify annotated alpha, and
 * reuses exact source-pinned M43 JSON export (synthetic click only).
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium,webkit} from 'playwright';
const engine=process.env.M44_ENGINE||'chromium';
assert.ok(['chromium','webkit'].includes(engine));
const dir=resolve('benchmark/main44-guided-source-review');
const targets=JSON.parse(await readFile(resolve(dir,'licensed-review-targets.json'),'utf8'));
assert.equal(targets.totalFlaggedWarmEdgeSamples,301);
assert.equal(targets.tilesCount,14);
assert.equal(targets.targets.reduce((a,x)=>a+x.flaggedSourceSamples,0),301);
assert.equal(targets.releaseAuthorized,false);
const browser=await ({chromium,webkit})[engine].launch({headless:true});
const page=await browser.newPage({viewport:{width:1366,height:900},acceptDownloads:true});
const network=[],pageErrors=[],consoleErrors=[];
page.on('request',r=>{if(/^https?:/i.test(r.url()))network.push(r.url());});
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
try{
 await page.goto(pathToFileURL(resolve(dir,'guided-original-photo-review.html')).href);
 await page.waitForFunction(()=>window.M44_RESEARCH_TEST?.state().ready,
  null,{timeout:45000});
 const initial=await page.evaluate(()=>({
  nav:window.M44_RESEARCH_TEST.state(),
  editor:window.M43_RESEARCH_TEST.state()
 }));
 assert.equal(initial.nav.total,14);
 assert.equal(initial.nav.flaggedSourceSamples,301);
 assert.equal(initial.nav.consumer3DAdmitted,false);
 assert.equal(initial.editor.marked,0);
 assert.equal(await page.locator('#targetSelect option').count(),14);
 assert.equal(await page.locator('#targetNext').isEnabled(),true);
 assert.equal(await page.locator('#targetPrevious').isDisabled(),true);
 const image=await page.locator('img[alt*="Genuine original JPEG"]').evaluate(img=>({
  loaded:img.complete&&img.naturalWidth>0,width:img.naturalWidth
 }));
 assert.equal(image.loaded,true);
 assert.equal(image.width,960);
 await page.locator('#targetNext').click();
 assert.equal((await page.evaluate(()=>window.M44_RESEARCH_TEST.state())).index,1);
 assert.equal((await page.evaluate(()=>window.M43_RESEARCH_TEST.state())).marked,0,
  'navigation must never create mask edits');
 await page.locator('#targetSelect').selectOption('13');
 assert.equal((await page.evaluate(()=>window.M44_RESEARCH_TEST.state())).index,13);
 assert.equal(await page.locator('#targetNext').isDisabled(),true);
 await page.locator('#targetPrevious').click();
 assert.equal((await page.evaluate(()=>window.M44_RESEARCH_TEST.state())).index,12);
 assert.equal((await page.evaluate(()=>window.M43_RESEARCH_TEST.state())).marked,0);
 assert.match(await page.locator('#targetStatus').textContent(),/NOT verified defects|NOT proof|NOT verified|not|candidate inspection/i);
 await page.locator('#mode').selectOption('restore');
 await page.locator('#brush').selectOption('1');
 const p=await page.evaluate(()=>window.M43_RESEARCH_TEST.findEditable('restore'));
 assert.ok(p&&Number.isInteger(p.x)&&Number.isInteger(p.y));
 await page.locator('#edited').scrollIntoViewIfNeeded();
 const xy=await page.evaluate(p=>window.M43_RESEARCH_TEST.focusOn(p.x,p.y),p);
 await page.mouse.click(xy.clientX,xy.clientY);
 await page.waitForFunction(()=>window.M43_RESEARCH_TEST.state().marked>0);
 const dlWait=page.waitForEvent('download');
 await page.locator('#export').click();
 const dl=await dlWait;
 assert.equal(dl.suggestedFilename(),'main43-UNVERIFIED-original-contour-annotation.json');
 const patch=JSON.parse(await readFile(await dl.path(),'utf8'));
 assert.equal(patch.schema,'MAIN1054_M43_UNVERIFIED_MANUAL_CONTOUR_PATCH/v1');
 assert.ok(patch.changes.length>=1&&patch.changes.length<=2500);
 assert.equal(patch.independentHumanReviewAccepted,false);
 assert.equal(patch.reviewerIdentityIndependentlyVerified,false);
 assert.equal(patch.releaseAuthorized,false);
 assert.equal(patch.consumer3DAdmitted,false);
 assert.equal(patch.familyAlpha,'HOLD');
 assert.deepEqual(network,[]);
 assert.deepEqual(pageErrors,[]);
 const file='SYNTHETIC-M44-GUIDED-TEST-NOT-HUMAN-'+engine+'.json';
 await writeFile(resolve(dir,file),JSON.stringify(patch,null,2)+'\n',{flag:'wx'});
 await page.screenshot({path:resolve(dir,engine+'-genuine-source-guided-review-SYNTHETIC.png'),
  fullPage:false,animations:'disabled'});
 await page.locator('#reset').click();
 assert.equal((await page.evaluate(()=>window.M43_RESEARCH_TEST.state())).marked,0);
 const result={schema:'MAIN1054_M44_BROWSER_GUIDE_NAVIGATION_RESEARCH_ONLY/v1',
  engine,realSourcePhotoAndP93:true,priorityTargets:14,ambiguousWarmSamples:301,
  sourcePixelsApprovedForDeletion:0,independentHumanReview:false,
  navigatedFirstNextLastPrevious:true,sourceMaskUnaffectedByNavigation:true,
  pointerTestOnly:true,sourceLockedPatchExported:true,originalPhotoAltered:false,
  network,pageErrors,consoleErrors,consumer3DAdmitted:false,
  releaseAuthorized:false,familyAlpha:'HOLD'};
 await writeFile(resolve(dir,engine+'-guided-source-review-browser.json'),
  JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log('MAIN44_GENUINE_SOURCE_REVIEW_GUIDE_NOT_3D_ACCEPTED',
 JSON.stringify({engine,targets:14,candidates:301,
  navigationMaskEdits:0,syntheticManualPixels:patch.changes.length,
  network:0,independentHumanApproved:false,
  consumer3D:false,familyAlpha:'HOLD'}));
}finally{await page.close();await browser.close();}
