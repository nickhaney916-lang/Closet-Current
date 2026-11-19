/** Genuine Chromium/WebKit OFFLINE interactive annotation acceptance.
 * Distinct from original P541 source humanoid regression. Test actual
 * SHA-attested original four-photo review portal from current exact-head CI.
 * No network, no user approval and NO consumer release.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium,webkit} from 'playwright';
import {MET70759_GALLERY_VIEW_NOTES89 as gallery, assessMet70759PhotoPartViewEvidence89 as verifyRole} from '../research/parallel89/met-four-photo-chromatic-silhouette89.mjs';

const engine=process.env.P89_BROWSER;
assert.ok(['chromium','webkit'].includes(engine),'real browser engine required');
const pagePath=resolve(
 'benchmark/parallel89-met70759-OFFLINE-boundary-review-HOLD',
 'met-70759-OFFLINE-review-source-locked-UNAPPROVED.html');
const browser=await ({chromium,webkit})[engine].launch({headless:true,
 args:engine==='chromium'?['--no-sandbox']:[]});
let page;
try{
 page=await browser.newPage({acceptDownloads:true,viewport:{width:1330,height:1000}});
 const external=[];
 page.on('request',r=>{if(/^https?:/i.test(r.url()))external.push(r.url());});
 page.on('pageerror',e=>{throw e;});
 await page.goto(pathToFileURL(pagePath).href,{waitUntil:'load'});
 await page.waitForFunction(()=>document.getElementById('region').options.length>0);
 await page.waitForFunction(()=>document.getElementById('original').height>150);
 assert.match(await page.title(),/UNAPPROVED/i);
 assert.equal(await page.locator('#photo option').count(),4);
 assert.equal(await page.locator('#photo').inputValue(),'2551406');
 assert.equal(await page.locator('#region').inputValue(),'2551406-region-1');
 assert.match(await page.locator('#coords').innerText(),/13180 disputed pixels/);
 const controls=await page.evaluate(()=>{
  const data=JSON.parse(document.getElementById('source-packet').textContent);
  const i=data.images.find(x=>x.imageId===2551406);
  const region=i.regions[0],a=data.embeddedOriginalSourcePhotoAssets;
  return {r:region,image:i,
   assets:a.length,
   originalUrls:a.every(x=>x.originalSourceLosslessPNG.startsWith('data:image/png;base64,')),
   stillUnapproved:data.externalQualifiedAnnotatorApprovalAlreadyObtained===false};
 });
 assert.equal(controls.assets,4);
 assert.equal(controls.originalUrls,true);
 assert.equal(controls.stillUnapproved,true);
  // Genuine museum-original download/hash is verified independently by CI.
  // Here the four original offline-review source images must agree with the
  // institutional-caption gate. Provisional parts are never 3D authority.
  const photoSources=await page.evaluate(()=>JSON.parse(
   document.getElementById('source-packet').textContent)
   .embeddedOriginalSourcePhotoAssets.map(x=>({
    id:x.imageId,rgbSha:x.sourceOriginalDecodedRGBSHA256
   })));
  assert.deepEqual(photoSources.map(x=>x.id),[2551406,2551407,2551408,2551409]);
  for(const photo of photoSources){
   const view=gallery.find(v=>v.id===photo.id);
   assert.equal(photo.rgbSha,view.canonicalDecodedRGBSHA256);
   const v=verifyRole({
    imageId:photo.id,decodedRGBSHA256:photo.rgbSha,
    originalMuseumObjectNumber:'1983.21a, b',
    actualOriginalJPEGAttested:true,
    actualDecodedRGBHashIndependentlyChecked:true
   });
   assert.equal(v.museumCaptionVerified,photo.id===2551406);
   assert.equal(v.institutionallyVerifiedPart,photo.id===2551406?'a':null);
   assert.equal(v.institutionallyVerifiedSide,photo.id===2551406?'front':null);
   assert.equal(v.source2DPhotographFallbackRequired,true);
   assert.equal(v.consumer3DAdmitted,false);
   assert.equal(v.releaseAuthorized,false);
   const forged=verifyRole({
    imageId:photo.id,decodedRGBSHA256:'0'.repeat(64),
    originalMuseumObjectNumber:'1983.21a, b',
    actualOriginalJPEGAttested:true,
    actualDecodedRGBHashIndependentlyChecked:true,
    catalogCaptionExact:'a) front',part:'a',museumVerifiedSide:'front'
   });
   assert.equal(forged.museumCaptionVerified,false);
   assert.equal(forged.source2DPhotographAllowed,false);
   assert.equal(forged.consumer3DAdmitted,false);
  }

 assert.equal(controls.r.sourceOriginalRGBSHA256,
  'e0b7738db57ac4b7c27d4f03f724442f53c8e85f09f7a139839dfaa04c86cbec');
 // Source-attested original RGB and mask pixels, alternative machine method only.
 const labOriginal=await page.evaluate(()=>{
  const p=JSON.parse(document.getElementById('source-packet').textContent);
  return p.embeddedOriginalSourcePhotoAssets.map(x=>({
   id:x.imageId,diag:x.independentSourceLabBoundary}));
 });
 assert.deepEqual(labOriginal.filter(x=>x.diag).map(x=>x.id),[2551406,2551408]);
 const d6=labOriginal.find(x=>x.id===2551406).diag;
 assert.equal(d6.sourceOriginalRGBSHA256,controls.r.sourceOriginalRGBSHA256);
 assert.equal(d6.sourceOriginalCoreMaskSHA256,controls.r.originalMaskCoreSHA256);
 assert.equal(d6.originalRegionId,'2551406-region-1');
 assert.equal(d6.originalConnectedDisputedPixelCount,13180);
 assert.equal(d6.allSmoothingClothVotePixels,2);
 assert.equal(d6.allSmoothingBackgroundVotePixels,11777);
 assert.equal(d6.smoothingSensitiveMixedVotePixels,1401);
 assert.equal(d6.humanAlphaBoundaryApproved,false);
 assert.equal(d6.consumer3DAdmitted,false);
 assert.equal(d6.releaseAuthorized,false);
 assert.equal(d6.fourScalesSameAlgorithmNotIndependentModelVotes,true);
 assert.equal(d6.coreAndExteriorPriorsNotIndependentExpertGroundTruth,true);
 await page.waitForFunction(()=>document.getElementById('labStats').textContent.includes('13180 disputed px'));
 assert.match(await page.locator('#labStats').innerText(),/NO expert truth, NO accepted pixels or 3D/);
 assert.ok(await page.locator('#lab').evaluate(c=>c.height>0));
 await page.locator('#decision').selectOption('propose_add_garment_fabric');
 await page.locator('#comment').fill('Original source region appears to need a drawn contour; review only.');
 const clicks=await page.evaluate(()=>{
  const reg=JSON.parse(document.getElementById('source-packet').textContent)
    .images[0].regions[0];
  const b=reg.bboxOriginalPixels,p=65,
   x=Math.max(0,b[0]-p),y=Math.max(0,b[1]-p),
   rx=Math.min(1200,b[2]+p+1),ry=Math.min(933,b[3]+p+1),
   rect=document.getElementById('original').getBoundingClientRect();
  return [[890,200],[1020,225],[950,400]].map(([ox,oy])=>({
   x:rect.left+(ox-x)/(rx-x)*rect.width,
   y:rect.top+(oy-y)/(ry-y)*rect.height
  }));
 });
 for(const p of clicks)await page.mouse.click(p.x,p.y);
 assert.match(await page.locator('#pointCount').innerText(),/3 original-pixel/);
 await page.locator('#save').click();
 assert.match(await page.locator('#progress').innerText(),/1 \/ /);
 const download1=page.waitForEvent('download');
 await page.locator('#export').click();
 const exported1=await download1;
 assert.match(exported1.suggestedFilename(),/NOT-APPROVED\.json/);
 const value1=JSON.parse(await readFile(await exported1.path(),'utf8'));
 assert.equal(value1.schema,'M2-met70759-original-photo-boundary-review-proposal/v1');
 assert.equal(value1.proposedRegionDecisions.length,1);
 const ann=value1.proposedRegionDecisions[0];
 assert.equal(ann.regionId,'2551406-region-1');
 assert.equal(ann.originalMaskSHA256,controls.r.originalMaskCoreSHA256);
 assert.equal(ann.originalRGBSHA256,controls.r.sourceOriginalRGBSHA256);
 assert.equal(ann.polygonOriginalPixels.length,3);
 assert.equal(ann.decision,'propose_add_garment_fabric');
 assert.equal(value1.qualifiedReviewerVerified,false);
 assert.equal(value1.sourceMaskHumanApproved,false);
 assert.equal(value1.consumer3DAdmitted,false);
 assert.equal(value1.releaseAuthorized,false);
 assert.equal(value1.familyAlpha,'HOLD');
 await page.locator('#photo').selectOption('2551408');
 await page.waitForFunction(()=>document.getElementById('region').value==='2551408-region-1');
 assert.match(await page.locator('#metrics').innerText(),/not independently verified/);
 const d8=labOriginal.find(x=>x.id===2551408).diag;
 assert.equal(d8.originalRegionId,'2551408-region-1');
 assert.equal(d8.originalConnectedDisputedPixelCount,549);
 assert.equal(d8.allSmoothingClothVotePixels,168);
 assert.equal(d8.allSmoothingBackgroundVotePixels,214);
 assert.equal(d8.smoothingSensitiveMixedVotePixels,167);
 await page.waitForFunction(()=>document.getElementById('labStats').textContent.includes('549 disputed px'));
 assert.match(await page.locator('#labStats').innerText(),/168 cloth-like, 214 background-like, 167 unstable/);
 await page.locator('#photo').selectOption('2551407');
 await page.waitForFunction(()=>document.getElementById('labStats').textContent.includes('No alternative Lab method evaluated'));
 assert.equal(labOriginal.find(x=>x.id===2551407).diag,null);
 assert.equal(labOriginal.find(x=>x.id===2551409).diag,null);
 await page.locator('#photo').selectOption('2551408');
 await page.waitForFunction(()=>document.getElementById('labStats').textContent.includes('549 disputed px'));
 await page.locator('#decision').selectOption('uncertain_request_more_evidence');
 await page.locator('#comment').fill('Original waist seam needs independent qualified pixel review');
 await page.locator('#save').click();
 assert.match(await page.locator('#progress').innerText(),/2 \/ /);
 const download2=page.waitForEvent('download');
 await page.locator('#export').click();
 const value2=JSON.parse(await readFile(await (await download2).path(),'utf8'));
 assert.deepEqual(value2.proposedRegionDecisions.map(v=>v.regionId),
  ['2551406-region-1','2551408-region-1']);
 assert.equal(value2.consumer3DAdmitted,false);
 assert.equal(value2.sourceMaskHumanApproved,false);
 // Complete the actual offline export->source-locked IMPORT->uncertainty-only
 // preview round-trip; it must never become an accepted alpha mask.
 await page.locator('#importFile').setInputFiles({
  name:'source-review-PROPOSED-NOT-APPROVED.json',
  mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(value2),'utf8')
 });
 await page.locator('#importReview').click();
 await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Imported 2'));
 assert.match(await page.locator('#status').innerText(),/ZERO original mask edits/);
 assert.equal(await page.locator('#photo').inputValue(),'2551406');
 assert.match(await page.locator('#previewStats').innerText(),/NOT ACCEPTED \/ NOT 3D/);
 const proposed=Number((await page.locator('#previewStats').innerText()).split(' ')[0]);
 assert.ok(proposed>0,'actual old disputed pixels should be previewed locally');
 // A forged qualified review or cross-museum original-image hash must be
 // visibly REJECTED and preserve existing source-bound preview state.
 for(const forged of [
  {...value2,qualifiedReviewerVerified:true},
  {...value2,proposedRegionDecisions:[
   {...value2.proposedRegionDecisions[0],originalRGBSHA256:'0'.repeat(64)},
   value2.proposedRegionDecisions[1]
  ]}
 ]){
  await page.locator('#importFile').setInputFiles({
   name:'forged-not-accepted.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(forged),'utf8')
  });
  await page.locator('#importReview').click();
  await page.waitForFunction(()=>document.getElementById('status').textContent.includes('REJECTED'));
  assert.match(await page.locator('#status').innerText(),/REJECTED proposed review import/);
  assert.match(await page.locator('#progress').innerText(),/2 \/ /);
  const unchanged=Number((await page.locator('#previewStats').innerText()).split(' ')[0]);
  assert.equal(unchanged,proposed,'invalid import mutated previous source candidate');
 }
 assert.deepEqual(external,[],'reviewer page must not make network requests');
 console.log('P89_TRUE_MET_REVIEW_OFFLINE_BROWSER_NOT_EXPERT_APPROVED '+JSON.stringify({
  engine,sourceImageCount:4,originalSourcePixelDigestsPresent:true,
  sourceRegionCount:controls.r.disputedPixelCount,
  actualMouseDrawnOriginalPixelPolygonCount:3,
  exportedSourceBoundProposals:2,
  importedExactSourceProposalPreviewPixels:proposed,
  adversarialForgedHumanAndWrongPhotoImportsRejected:2,
   original1406And1408LabDisagreementsRendered:true,
   unstudiedMuseumPhotosNeverInferred:true,
  originalMaskAndUncertaintyUnionUnmodified:true,
  externalRequests:external.length,
  originalGarmentMaskModified:false,sourceMaskHumanApproved:false,
  consumer3DAdmitted:false,familyAlpha:'HOLD'
 }));
}finally{
 await page?.close();
 await browser.close();
}
