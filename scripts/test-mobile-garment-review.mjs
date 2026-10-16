import {chromium} from 'playwright';import assert from 'node:assert/strict';import {resolve} from 'node:path';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+resolve('benchmark/review-pack/START-REVIEW.html'));
 await page.locator('#garment').getByText('Orange shorts').waitFor();
 await page.locator('#preview').evaluate(async c=>{if(!c.width||!c.height)throw Error('Canvas not loaded');});
 assert.equal(await page.locator('#count').textContent(),'1 / 6');
 const nativeSize=await page.locator('#preview').evaluate(c=>[c.width,c.height]);
 await page.locator('#inspect').click();
 assert.equal(await page.locator('#inspect').getAttribute('aria-pressed'),'true');
 assert.deepEqual(await page.locator('#preview').evaluate(c=>[c.width,c.height]),nativeSize);
 await page.locator('#inspect').click();
 assert.equal(await page.locator('#inspect').getAttribute('aria-pressed'),'false');
 await page.locator('#original').click();assert.equal(await page.locator('#original').getAttribute('aria-pressed'),'true');
 await page.locator('#cutout').click();assert.equal(await page.locator('#cutout').getAttribute('aria-pressed'),'true');
 await page.locator('#good').click();assert.equal(await page.locator('#count').textContent(),'2 / 6');
 await page.locator('#bad').click();assert.equal(await page.locator('#count').textContent(),'2 / 6');
 await page.locator('[data-issue="Missing fabric"]').click();
 await page.locator('#confirm').click();assert.equal(await page.locator('#count').textContent(),'3 / 6');
 const p=page.waitForEvent('download');await page.locator('#export').click();const d=await p;
 const fs=await import('node:fs/promises');const feedback=JSON.parse(await fs.readFile(await d.path(),'utf8'));
 assert.equal(feedback.kind,'visual-feedback-not-ground-truth');
 assert.deepEqual(feedback.results.slice(0,3).map(x=>x.assessment),['good','bad','not-reviewed']);
 assert.equal(feedback.results[1].issue,'Missing fabric');
 assert.deepEqual(errors,[]);
 console.log('MOBILE_REVIEW_SMOKE '+JSON.stringify({cases:feedback.results.length,decisions:2,pageErrors:errors.length,status:'passed'}));
}finally{await browser.close();}
