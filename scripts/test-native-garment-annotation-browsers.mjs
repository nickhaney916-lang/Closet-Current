// Synthetic in-browser workflow proof ONLY: no real garment approvals.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const metrics={sourceWidth:960,sourceHeight:1100,
  firstReviewerDrafts:0,secondReviewerSyntheticApprovals:0,
  realHumanApprovals:0,physicalPhones:0,customerPhotos:0,
  aiMaskSeeds:0,realPhotoMaskQualityPasses:0,realOriginalDecodeChecks:0,
  originalGridsSupported:0,originalGridsHeldForSize:0};
try{
 const first=await browser.newPage({viewport:{width:1180,height:800},acceptDownloads:true});
 const jsErrors=[];
 first.on('pageerror',e=>jsErrors.push(e.message));
 await first.goto('file://'+resolve('benchmark/annotate-garment-native.html'));
 const base64=await first.evaluate(()=>{
  const c=document.createElement('canvas');
  c.width=960;c.height=1100;
  const x=c.getContext('2d');
  x.fillStyle='#ededed';x.fillRect(0,0,c.width,c.height);
  x.fillStyle='#ac234b';x.fillRect(160,180,610,650);
  return c.toDataURL('image/png').split(',')[1];
 });
 const png=Buffer.from(base64,'base64');
 const file={name:'validation-0001.jpg',mimeType:'image/png',buffer:png};
 await first.locator('#photo').setInputFiles(file);
 await first.waitForFunction(()=>canvas.width===960&&canvas.height===1100&&mask?.length===1056000);
 assert.equal(await first.locator('#prediction').isDisabled(),true);
 assert.equal(await first.locator('#download').isDisabled(),true);
 const native=await first.evaluate(()=>({
   w:canvas.width,h:canvas.height,originalW:source.photo.naturalWidth,
   originalH:source.photo.naturalHeight,pixelCount:mask.length
 }));
 assert.deepEqual(native,{w:960,h:1100,originalW:960,originalH:1100,pixelCount:1056000});
 // An original-grid draft cannot be exported without manually identifying
 // the actual garment in the scene, regardless of what a model might predict.
 await first.locator('#reviewer').fill('Synthetic First Human');
 await first.locator('#inventoryMode').check();
 await first.locator('#inventoryId').fill('validation-0001-item-01');
 await first.locator('#inventoryCategory').selectOption('Tops');
 await first.locator('#targetGarment').fill('Visible magenta synthetic top');
 const bound=await first.locator('#canvas').boundingBox();
 assert.ok(bound);
 await first.mouse.click(bound.x+bound.width*.50,bound.y+bound.height*.42);
 assert.equal(await first.locator('#download').isDisabled(),false);
 const pendingDraft=first.waitForEvent('download');
 await first.locator('#download').click();
 const draft=JSON.parse(await fs.readFile(await(await pendingDraft).path(),'utf8'));
 metrics.firstReviewerDrafts++;
 assert.equal(draft.image,'validation-0001.jpg');
 assert.equal(draft.width,960);assert.equal(draft.height,1100);
 assert.equal(draft.nativeSourceGrid,true);
 assert.equal(draft.annotationGrid,'exact-original-pixels');
 assert.equal(draft.reviewStatus,'draft');
 assert.equal(draft.seedModel,null);
 assert.equal(draft.modelProposalId,undefined);
 assert.equal(draft.physicalTargetId,'validation-0001-item-01');
 assert.equal(draft.humanForm,'top');
 assert.equal(draft.runs.reduce((a,b)=>a+b,0),1056000);
 assert.match(draft.sourceSha256,/^[a-f0-9]{64}$/);
 const second=await browser.newPage({viewport:{width:1100,height:800},acceptDownloads:true});
 second.on('pageerror',e=>jsErrors.push(e.message));
 await second.goto('file://'+resolve('benchmark/approve-garment-mask-native.html'));
 await second.locator('#photo').setInputFiles(file);
 await second.locator('#draft').setInputFiles({
   name:'first-draft.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(draft))
 });
 await second.waitForFunction(()=>source!==null&&draft!==null&&mask?.length===1056000);
 assert.equal(await second.locator('#approve').isDisabled(),true);
 await second.locator('#approver').fill('Synthetic Second Human');
 await second.locator('#verified').check();
 assert.equal(await second.locator('#approve').isDisabled(),false);
 const humanApproval=second.waitForEvent('download');
 await second.locator('#approve').click();
 const approved=JSON.parse(await fs.readFile(await(await humanApproval).path(),'utf8'));
 metrics.secondReviewerSyntheticApprovals++;
 assert.equal(approved.width,960);
 assert.equal(approved.height,1100);
 assert.equal(approved.nativeSourceGrid,true);
 assert.equal(approved.annotationGrid,'exact-original-pixels');
 assert.equal(approved.verifiedSourceWidth,960);
 assert.equal(approved.verifiedSourceHeight,1100);
 assert.equal(approved.sourceSha256,draft.sourceSha256);
 assert.equal(approved.reviewStatus,'approved');
 // This is test-only synthetic output; never write it to the repo or
 // original real-photo registry, never pretend a human has performed review.
 const stale={...draft,width:768,height:640,runs:[0,1,768*640-1]};
 await second.locator('#draft').setInputFiles({
   name:'resized-legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(stale))
 });
 await second.locator('#status').getByText(/original source pixels/).waitFor();
 assert.equal(await second.locator('#approve').isDisabled(),true);
 const seeded={...draft,seedModel:'pretend-model'};
 await second.locator('#draft').setInputFiles({
  name:'ai-seeded.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(seeded))
 });
 await second.locator('#status').getByText(/Invalid or non-draft outline/).waitFor();
 assert.equal(await second.locator('#approve').isDisabled(),true);
 const wrong={...draft,sourceSha256:'0'.repeat(64)};
 await second.locator('#draft').setInputFiles({
  name:'wrong-source.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(wrong))
 });
 await second.locator('#status').getByText(/checksum mismatch/).waitFor();
 assert.equal(await second.locator('#approve').isDisabled(),true);
 // The 12 existing licensed originals (never any customer uploads) must
 // load at their ACTUAL source grid, or be explicitly held for a size cap.
 // This is source-loading QA, not human annotation or quality scoring.
 const originals=JSON.parse(await fs.readFile('artifacts/independent-mask-review/BLIND-FIRST-SOURCES.json','utf8'));
 assert.equal(originals.sourceOriginals.length,12);
 const originalPage=await browser.newPage({viewport:{width:1080,height:800}});
 originalPage.on('pageerror',e=>jsErrors.push(e.message));
 await originalPage.goto('file://'+resolve('benchmark/annotate-garment-native.html'));
 for(const record of originals.sourceOriginals){
  const raw=await fs.readFile(resolve('benchmark/fixtures',record.image));
  assert.equal(createHash('sha256').update(raw).digest('hex'),record.sourceSha256);
  await originalPage.locator('#photo').setInputFiles({
   name:record.image,mimeType:'image/jpeg',buffer:raw
  });
  // File and SHA are checked at load; no AI mask and no export is possible.
  await originalPage.waitForFunction((photoName)=>
   (source?.fileName===photoName&&mask?.length===source.photo.naturalWidth*source.photo.naturalHeight)||
   (source===null&&document.querySelector('#status').textContent.includes('Cannot annotate at original resolution')),
   record.image,{timeout:30000});
  const observed=await originalPage.evaluate(()=>({
   decodedWidth:source?.photo?.naturalWidth||null,
   decodedHeight:source?.photo?.naturalHeight||null,
   workingWidth:source?canvas.width:null,workingHeight:source?canvas.height:null,
   maskPixels:mask?.length??0,seed:seedModel,
   enabled:!download.disabled,status:status.textContent
  }));
  if(record.nativeGridReviewSupported){
   assert.equal(observed.workingWidth,record.width,record.id);
   assert.equal(observed.workingHeight,record.height,record.id);
   assert.equal(observed.decodedWidth,record.width,record.id);
   assert.equal(observed.decodedHeight,record.height,record.id);
   assert.equal(observed.maskPixels,record.width*record.height,record.id);
   assert.equal(observed.seed,null,record.id);
   metrics.originalGridsSupported++;
  }else{
   assert.equal(observed.workingWidth,null,record.id);
   assert.match(observed.status,/safety limit/i,record.id);
   metrics.originalGridsHeldForSize++;
  }
  assert.equal(observed.enabled,false,record.id);
  metrics.realOriginalDecodeChecks++;
 }
 assert.deepEqual(jsErrors,[]);
 console.log('NATIVE_PIXEL_MASK_BROWSER_QA '+JSON.stringify(metrics));
}finally{
 await browser.close();
}
