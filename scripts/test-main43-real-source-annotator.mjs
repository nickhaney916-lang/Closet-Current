/**
 * M43 actual source image browser smoke, not independent human review.
 * Loads real original licensed JPEG as lossless decoded browser preview,
 * genuine Work47 / P93 RGBA from local data URLs; moves pointer on actual
 * canvas, undo/reset/export JSON, with zero external calls or 3D authority.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium,webkit} from 'playwright';
const engine=process.env.M43_ENGINE||'chromium';
assert.ok(['chromium','webkit'].includes(engine));
const out=resolve('benchmark/main43-contour-editor');
const browser=await ({chromium,webkit})[engine].launch({headless:true});
const page=await browser.newPage({viewport:{width:1366,height:900},acceptDownloads:true});
const network=[],errors=[],consoleErrors=[];
page.on('request',r=>{if(/^https?:/i.test(r.url()))network.push(r.url());});
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
try{
 await page.goto(pathToFileURL(resolve(out,'offline-human-contour-editor.html')).href);
 await page.waitForFunction(()=>window.M43_RESEARCH_TEST?.state().ready,
  null,{timeout:30000});
 assert.match(await page.locator('.warn').innerText(),/FAMILY ALPHA HOLD/);
 const before=await page.evaluate(()=>window.M43_RESEARCH_TEST.state());
 assert.equal(before.ready,true);
 assert.equal(before.marked,0);
 assert.equal(before.consumer3D,false);
 assert.equal(before.independentHumanAccepted,false);
 const p=await page.evaluate(()=>window.M43_RESEARCH_TEST.findEditable('restore'));
 assert.ok(p&&Number.isInteger(p.x)&&Number.isInteger(p.y),
  'No genuine original P93-removed pixel available for manual restoration');
 await page.locator('#mode').selectOption('restore');
 await page.locator('#brush').selectOption('1');
 await page.locator('#edited').scrollIntoViewIfNeeded();
 const xy=await page.evaluate(p=>window.M43_RESEARCH_TEST.focusOn(p.x,p.y),p);
 await page.mouse.click(xy.clientX,xy.clientY);
 await page.waitForFunction(()=>window.M43_RESEARCH_TEST.state().marked>0);
 const marked=await page.evaluate(()=>window.M43_RESEARCH_TEST.state().marked);
 assert.ok(marked>0&&marked<=2500);
 await page.locator('#undo').click();
 assert.equal((await page.evaluate(()=>window.M43_RESEARCH_TEST.state())).marked,0);
 await page.locator('#edited').scrollIntoViewIfNeeded();
 const point=await page.evaluate(p=>window.M43_RESEARCH_TEST.focusOn(p.x,p.y),p);
 await page.mouse.click(point.clientX,point.clientY);
 await page.waitForFunction(()=>window.M43_RESEARCH_TEST.state().marked>0);
 await page.locator('#notes').fill('Synthetic CI pointer test, NOT a real human review.');
 const event=page.waitForEvent('download');
 await page.locator('#export').click();
 const dl=await event;
 assert.equal(dl.suggestedFilename(),'main43-UNVERIFIED-original-contour-annotation.json');
 const exported=JSON.parse(await readFile(await dl.path(),'utf8'));
 assert.equal(exported.schema,'MAIN1054_M43_UNVERIFIED_MANUAL_CONTOUR_PATCH/v1');
 assert.equal(exported.sourceId,'commons-0053');
 assert.ok(exported.changes.length>0&&exported.changes.length<=2500);
 assert.ok(exported.changes.every(x=>x.operation==='restore'));
 assert.equal(exported.independentHumanReviewAccepted,false);
 assert.equal(exported.reviewerIdentityIndependentlyVerified,false);
 assert.equal(exported.consumer3DAdmitted,false);
 assert.equal(exported.releaseAuthorized,false);
 assert.equal(exported.familyAlpha,'HOLD');
 assert.equal(exported.syntheticClicksAreNotRealHumanReview,true);
 assert.deepEqual(network,[]);assert.deepEqual(errors,[]);
 const file='SYNTHETIC-TEST-NOT-HUMAN-annotations-'+engine+'.json';
 await writeFile(resolve(out,file),JSON.stringify(exported,null,2)+'\n',{flag:'wx'});
 await page.screenshot({path:resolve(out,engine+'-actual-source-annotator-SYNTHETIC-TEST.png'),
  fullPage:false,animations:'disabled'});
 await page.locator('#reset').click();
 assert.equal((await page.evaluate(()=>window.M43_RESEARCH_TEST.state())).marked,0);
 const result={engine,actualPublicOriginalLoaded:true,originalWork47AndP93Loaded:true,
  actualPointerSourcePixel:p,pointerExportedCount:exported.changes.length,
  canvasUndoAndReset:true,reviewerIdentityIndependentlyVerified:false,
  independentHumanOriginalFidelityAccepted:false,manualDrawReviewIsSyntheticTestOnly:true,
  network,errors,consoleErrors,consumer3DAdmitted:false,
  releaseAuthorized:false,familyAlpha:'HOLD'};
 await writeFile(resolve(out,engine+'-source-annotation-browser.json'),
  JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log('MAIN43_GENUINE_ORIGINAL_PHOTO_POINTER_DRAW_AND_NO_HUMAN_APPROVAL',
 JSON.stringify({engine,marked:exported.changes.length,
  validPublicOriginal:true,downloadsOnlySourceCoordinates:true,
  network:0,independentHumanAccepted:false,
  consumer3D:false,familyAlpha:'HOLD'}));
}finally{
 await page.close();await browser.close();
}
