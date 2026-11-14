/**
 * P92 actual OFFLINE local-file independent-review browser smoke.
 * Synthetic interaction ONLY. This is never a human reviewer or release pass.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium,webkit} from 'playwright';

const engine=process.env.P87_ENGINE??process.argv[2]??'chromium';
assert.ok(['chromium','webkit'].includes(engine));
const root=resolve('benchmark/mission2-p92/review-'+engine);
const packet=JSON.parse(await readFile(join(root,'packet.json'),'utf8'));
assert.equal(packet.engine,engine);
assert.equal(packet.cases.length,30);
assert.equal(packet.sourceFidelityHumanAcceptance,'UNREVIEWED');
assert.equal(packet.releaseAuthorized,false);
const errors=[],requests=[];
let browser;
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true,
  ...(engine==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})
 });
 const page=await browser.newPage({viewport:{width:1100,height:850},acceptDownloads:true});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',q=>requests.push(q.url()));
 await page.goto(pathToFileURL(join(root,'index.html')).href,{waitUntil:'load'});
 await page.waitForFunction(()=>document.querySelectorAll('section.case').length===30);
 assert.equal(await page.locator('section.case').count(),30);
 assert.equal(await page.locator('main figure img').count(),60);
 assert.equal(await page.locator('.source img').count(),2);
 assert.equal(await page.locator('#attribution').textContent().then(x=>x.includes('CC BY 4.0')),true);
 await page.evaluate(()=>{for(const img of document.images)img.loading='eager';});
 await page.waitForFunction(()=>Array.from(document.images).length===62&&
  Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0),null,{timeout:45000});
 assert.equal(await page.locator('#status').textContent(),'Nothing has been reviewed or submitted.');
 assert.ok(!(await page.locator('main').textContent()).includes('P90 baseline'));
 assert.ok(!(await page.locator('main').textContent()).includes('P91 hem trial'));
 await page.screenshot({path:join(root,'offline-source-reference-smoke.png')});
 await page.locator('section.case').first().screenshot({path:join(root,'offline-first-blinded-pair-smoke.png')});
 await page.locator('#reviewer').fill('automated-smoke-not-a-person');
 await page.locator('#pick0').selectOption('UNKNOWN');
 const [one]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
 const first=JSON.parse(await readFile(await one.path(),'utf8'));
 assert.equal(first.cases.length,30);
 assert.equal(first.cases[0].choice,'UNKNOWN');
 assert.equal(first.completedAllCases,false);
 assert.equal(first.humanReviewIdentityIndependentlyVerified,false);
 assert.equal(first.sourceFidelityAccepted,false);
 assert.equal(first.releaseAuthorized,false);
 // All 30 are synthetic form interactions; never import this as human opinion.
 await page.locator('select').evaluateAll(nodes=>nodes.forEach(node=>{
  node.value='UNKNOWN';
  node.dispatchEvent(new Event('change',{bubbles:true}));
 }));
 const [two]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
 const testReceipt=JSON.parse(await readFile(await two.path(),'utf8'));
 assert.equal(testReceipt.completedAllCases,true);
 assert.equal(testReceipt.humanReviewIdentityIndependentlyVerified,false);
 assert.equal(testReceipt.sourceFidelityAccepted,false);
 assert.equal(testReceipt.releaseAuthorized,false);
 assert.equal(testReceipt.familyAlpha,'HOLD');
 assert.equal(testReceipt.cases.length,30);
 assert.ok(requests.every(url=>/^(file:|blob:|data:)/.test(url)),
  'offline review unexpectedly contacted network');
 assert.deepEqual(errors,[],'offline reviewer JS errors');
 console.log('M2_P92_OFFLINE_REVIEW_SMOKE',JSON.stringify({
  engine,loadedOriginalSourceAnd3DImages:62,blindCases:30,
  originalPhotographicLicenseVisible:true,
  openedLocalOfflineFile:true,
  exportedSyntheticSmokeWithThirtySelections:true,
  reviewerIsRealHuman:false,reviewOutcomeAccepted:false,
  networkRequestsOutsideLocalFiles:0,javascriptErrors:errors.length,
  releaseAuthorized:false,familyAlpha:'HOLD'
 }));
}catch(error){
 console.error('M2_P92_OFFLINE_REVIEW_SMOKE_BLOCKED '+String(error?.stack||error).slice(0,1800));
 process.exitCode=1;
}finally{await browser?.close();}
