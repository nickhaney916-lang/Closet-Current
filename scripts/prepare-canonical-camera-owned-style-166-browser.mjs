/**
 * P166: Research-only exact Work719 real-style + PHOTO119 canonical original
 * camera JPEG integration. This edits a disposable browser runner only.
 * NO production, no staging, no Work719 or P165 source branch edits.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const [input,output]=process.argv.slice(2);
assert.ok(input&&output&&input!==output);
let s=await readFile(input,'utf8');
function patch(needle,replacement,label){
 const a=s.split(needle);
 assert.equal(a.length,2,'P166 upstream '+label+' drifted');
 s=a.join(replacement);
}
patch(
 "+'/public/index.html?ownerReview145=research'",
 "+'/public/index.html?ownerReview145=research&captureProof01=after&index04=after&reviewedSave120=research'",
 'original JPEG human review flags');
patch(
 "if(!/^\\/public\\/[a-zA-Z0-9_./-]+$/.test(path)||path.split('/').includes('..'))throw Error('forbidden path');",
 "if(!/^\\/(?:public|research)\\/[a-zA-Z0-9_./-]+$/.test(path)||path.split('/').includes('..'))throw Error('forbidden path');",
 'exact research-only P119 local modules HTTP serving');
patch(
 "if(!file.startsWith(root+'/public/'))throw Error('outside public app');",
 "if(!file.startsWith(root+'/public/')&&!file.startsWith(root+'/research/'))throw Error('outside test research app');",
 'allow only same-origin checked in original research source modules');
patch(
 "await page.evaluate(image=>{if(!candidate(image))throw Error('Synthetic camera frame was not accepted');batch.at(-1).importFilename='new-reviewed-blouse.jpg';finishScan();},cameraFrame);",
 "await page.evaluate(async image=>{const owner=window.closetAuth.user.id;const proof=await captureProofFromJPEG(image,{width:240,height:320,origin:'synthetic-CI-camera-frame'},owner);if(!candidate(image,{sourceProof:proof}))throw Error('Canonical synthetic camera frame refused');batch.at(-1).importFilename='new-reviewed-blouse.jpg';finishScan();},cameraFrame);",
 'actual proof source captured before draft');
patch(
 "await page.locator('dialog.photo-adjust input[aria-label=\"Color\"]').fill('Green');",
 "await page.locator('dialog.photo-adjust input[aria-label=\"Color\"]').fill('Green');\n     await page.locator('dialog.photo-adjust input[aria-label=\"I verified the category, clothing type and color\"]').check();\n     await page.locator('dialog.photo-adjust input[aria-label=\"I confirmed this photo shows one garment\"]').check();",
 'explicit owner reviewed category type color and source');
patch(
 "const cameraFrame='data:image/jpeg;base64,'+capturePhoto.toString('base64');",
 "const cameraFrame='data:image/jpeg;base64,'+capturePhoto.toString('base64');\nconst exactP166SHA=createHash('sha256').update(capturePhoto).digest('hex');",
 'independent original jpeg SHA');
patch(
 "     assert.ok(focusedId);",
 "     assert.ok(focusedId);\n     const saved166=await page.evaluate(async id=>{const row=(await readAll()).find(x=>x.id===id);const data=row?.originalPhoto?.image;const bytes=data?new Uint8Array(await(await fetch(data)).arrayBuffer()):null;const sha=bytes?[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join(''):null;return {id:row?.id,ownerId:row?.ownerId,dbName:db.name,sourceSHA256:row?.sourceSHA256,actualOriginalSHA:sha,originalUnchanged:row?.image===data,ownerReviewed:row?.ownerReviewed,humanReviewedSource:row?.humanReviewedSource,sourcePhotoOriginal:row?.sourcePhotoOriginal,sourceHashVerified:row?.sourceHashVerified,userAdjusted:row?.userAdjusted,reviewProvenance:row?.reviewProvenance};},focusedId);\n     assert.equal(saved166.id,focusedId);\n     assert.equal(saved166.ownerId,owner);\n     assert.equal(saved166.dbName,'closet-current-user-'+owner);\n     assert.equal(saved166.sourceSHA256,exactP166SHA);\n     assert.equal(saved166.actualOriginalSHA,exactP166SHA);\n     assert.equal(saved166.originalUnchanged,true);\n     for(const flag of ['ownerReviewed','humanReviewedSource','sourcePhotoOriginal','sourceHashVerified','userAdjusted'])assert.equal(saved166[flag],true,flag);\n     assert.equal(saved166.reviewProvenance,'explicit-owner-claim-not-independent-review-evidence');",
 'durable saved private original and owner human review verification');
patch(
 "     assert.equal(mounted.initialItemsUnchanged,true);",
 "     assert.equal(mounted.initialItemsUnchanged,true);\n     assert.equal(mounted.sourceHashVerified,true);\n     assert.equal(mounted.sourcePhotoOriginal,true);\n     assert.equal(mounted.sourceImageKind,'canonical-originalPhoto');",
 'P165 widget is real canonical photo');
patch(
 "     assert.equal(sourceEvidence.srcMatchesOriginal,true);",
 "     assert.equal(sourceEvidence.srcMatchesOriginal,true);\n     assert.equal(sourceEvidence.mode,'verified-original-photo-2d');\n     assert.equal(sourceEvidence.imageSHA,exactP166SHA);",
 'actual owner visible original SHA photo');
patch(
 "     assert.equal(sourceEvidence.photoVisible,true);",
 "     assert.equal(sourceEvidence.photoVisible,true);\n     assert.equal(sourceEvidence.fitted,'false');",
 'never claim fake humanoid blouse');
await writeFile(output,s);
console.log('P166_DISPOSABLE_CANONICAL_WORK719_P119_P165_BROWSER_COMPOSED_NO_OWNER_DATA_WRITE');
