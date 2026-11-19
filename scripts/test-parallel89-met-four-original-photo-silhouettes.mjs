/**
 * Real Met object 70759 four image original SHA acquisition and independent
 * per-photo chromatic textile envelope. No projection-to-mm or camera fit.
 * The first two gallery images 2551406/07 were not present in PR #1403.
 * A first acquisition run reports their hashes; final CI pins all four.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {MET_70759_89}
 from '../research/parallel89/met-70759-source-intake89.mjs';
const ids=[2551406,2551407,2551408,2551409];
const known=Object.freeze({
 2551408:MET_70759_89.publishedPhotoSHA256[0],
 2551409:MET_70759_89.publishedPhotoSHA256[1]
});
const out='benchmark/parallel89-met70759-four-photo-research';
await mkdir(out,{recursive:true});
const receipts=[];
for(const id of ids){
 const url='https://collectionapi.metmuseum.org/api/collection/v1/iiif/70759/'+id+'/main-image';
 const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(50000),
  headers:{'accept':'image/jpeg'}});
 assert.equal(response.status,200,'Met official original source missing '+id);
 const host=new URL(response.url).hostname;
 assert.ok(['collectionapi.metmuseum.org','images.metmuseum.org'].includes(host));
 const type=(response.headers.get('content-type')||'').split(';')[0].toLowerCase();
 assert.equal(type,'image/jpeg');
 const bytes=new Uint8Array(await response.arrayBuffer());
 assert.ok(bytes.length>10000&&bytes.length<40000000);
 assert.deepEqual(Array.from(bytes.subarray(0,3)),[255,216,255]);
 const meta=await sharp(bytes,{failOn:'error'}).metadata();
 assert.equal(meta.format,'jpeg');
 assert.ok(meta.width>=400&&meta.width<=18000&&meta.height>=400&&meta.height<=18000);
 const digest=createHash('sha256').update(bytes).digest('hex');
 assert.match(digest,/^[0-9a-f]{64}$/);
 console.log('MET_GALLERY_SOURCE_JPEG_RECEIPT '+JSON.stringify({
  id,sha256:digest,width:meta.width,height:meta.height,
  bytes:bytes.length,host,expectedPinnedSha256:known[id]??null
 }));
 if(known[id])assert.equal(digest,known[id],
  'existing pinned original museum image source unexpectedly changed');
 assert.ok(!receipts.some(r=>r.sha256===digest),'distinct Met gallery photos expected');
 await writeFile(out+'/met-70759-gallery-'+id+'.jpg',bytes);
 receipts.push({id,sha256:digest,bytes:bytes.length,width:meta.width,
  height:meta.height,sourceUrl:url,sourceHost:host,actualJpegDecoded:true,
  originalCollectionObjectId:70759,originalMuseumAccession:'1983.21a, b',
  previousImageSourcePinned:Boolean(known[id]),cameraCalibrated:false});
}
await writeFile(out+'/original-four-photos-provenance.json',
 JSON.stringify({schema:'M2-met-70759-original-four-image-discovery/v1',
  receipts,originalObjectPage:MET_70759_89.repositorySource,
  galleryFirstPublicCaption:'a) front',
  otherViewAndPartLabelsPendingIndependentEvidence:true,
  originalHonoluluCalibrationProhibited:true,
  physical3DAuthorized:false,consumer3DAdmitted:false,
  familyAlpha:'HOLD'},null,2)+'\n');
console.log('P89_MET_GENUINE_FOUR_IMAGE_IDENTITY_ACQUISITION '+JSON.stringify({
 images:receipts,photoViewsAuthoritativelyAnnotated:false,
 labelsBeyondMuseumFirstCaptionUnverified:true,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'}));
