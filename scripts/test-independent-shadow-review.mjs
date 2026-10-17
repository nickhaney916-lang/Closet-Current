import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {validateShadowAnnotation} from '../benchmark/shadow-annotation-validator.mjs';

// Browser UI smoke test only. Polygon coordinates below are arbitrary fixtures.
// NEVER save or publish its fake approval as independently reviewed ground truth.
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const pageFile=pathToFileURL(resolve('benchmark/review-shadow-outlines.html')).href;
const dir=await mkdtemp(join(tmpdir(),'closet-second-review-'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({acceptDownloads:true});
 await page.goto(pageFile);
 const entry=manifest.cases.find(item=>item.id==='commons-0079');
 const draft={schemaVersion:1,imageId:entry.id,sourceSha256:entry.sourceSha256,reviewStatus:'draft',regions:{
  garment:[[[.1,.1],[.5,.1],[.5,.5],[.1,.5]]],
  shadow:[[[.6,.1],[.9,.1],[.9,.5],[.6,.5]]]
 }};
 const draftPath=join(dir,'synthetic-draft.json');
 await writeFile(draftPath,JSON.stringify(draft));
 await page.locator('#photo').setInputFiles('benchmark/photos/'+entry.image);
 await page.locator('#draft').setInputFiles(draftPath);
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Photo and draft match')||document.querySelector('#status').textContent.includes('Cannot begin review'));
 if(!(await page.locator('#status').textContent()).includes('Photo and draft match'))throw Error('Valid test fixture rejected');
 if(await page.locator('#approve').isEnabled())throw Error('Approval enabled without independent reviewer');
 await page.locator('#firstReviewer').fill('Reviewer A');
 await page.locator('#secondReviewer').fill('reviewer a');
 for(const id of ['checkedPhoto','checkedGarment','checkedShadow','independent'])await page.locator('#'+id).check();
 if(await page.locator('#approve').isEnabled())throw Error('Same reviewer could approve their own draft');
 await page.locator('#secondReviewer').fill('Reviewer B');
 if(!await page.locator('#approve').isEnabled())throw Error('Independent attestation failed to enable export');
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#approve').click()]);
 const approved=JSON.parse(await readFile(await download.path(),'utf8'));
 if(approved.reviewStatus!=='approved'||approved.reviewer!=='Reviewer A'||approved.approvedBy!=='Reviewer B'||!validateShadowAnnotation(approved,entry).valid)throw Error('Exported schema/identities invalid');
 if(approved.regions.garment.length!==1||approved.regions.shadow.length!==1)throw Error('Export altered polygons');
 // Changing just the draft identity must invalidate the matching original.
 await writeFile(draftPath,JSON.stringify({...draft,imageId:'commons-0094'}));
 await page.locator('#draft').setInputFiles(draftPath);
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Cannot begin review'));
 if(await page.locator('#approve').isEnabled())throw Error('Mismatched image was allowed for approval');
 console.log('SECOND_REVIEW_UI_SMOKE '+JSON.stringify({testedImage:entry.id,checksumVerified:true,selfApprovalRejected:true,explicitChecklistRequired:true,exportValidated:true,mismatchedSourceRejected:true,syntheticFixturesOnly:true}));
}finally{await browser.close();await rm(dir,{recursive:true,force:true})}
