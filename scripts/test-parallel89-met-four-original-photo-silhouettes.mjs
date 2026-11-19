/**
 * Genuine museum 70759 original gallery, four immutable source RGB pixels,
 * distinct JPEG actual-byte receipts, seven source chromatic textile bands.
 *
 * CDN has been OBSERVED giving two byte-distinct 2551408 JPEGs that decoded
 * to *exactly identical* full 1200x978 RGB pixels. Preserve every actual
 * JPEG digest and require canonical decoded RGB SHA256, not fragile encodings.
 *
 * No external image, owner data, fabricated alpha, real camera or wearable
 * 3D is admitted; this is a source-specific independent museum benchmark.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {MET_70759_89 as source}
 from '../research/parallel89/met-70759-source-intake89.mjs';
import {MET70759_GALLERY_VIEW_NOTES89 as gallery,
 measureMet70759ColorFabricProjection89 as measure}
 from '../research/parallel89/met-four-photo-chromatic-silhouette89.mjs';
const out='benchmark/parallel89-met70759-four-photo-research';
await mkdir(out,{recursive:true});
const observedExactEncodings=Object.freeze({
 2551406:Object.freeze(['780b082ff1408bc838d525364d95f455139e4c3c817fc39fe5dc1b756caca5c6']),
 2551407:Object.freeze(['bf94c650d1ce964f8b1cacc71d1d267dfe0c7edabe7ca91541433786f6f732c7']),
 2551408:Object.freeze([
  source.publishedPhotoSHA256[0],
  'f2e83d99e39ef472e834189ef6541760973bc2ef2d6cc4786cc9123b58140c06'
 ]),
 2551409:Object.freeze([source.publishedPhotoSHA256[1]])
});
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const records=[],profiles=[],seen=new Set();
for(const view of gallery){
 const id=view.id,url='https://collectionapi.metmuseum.org/api/collection/v1/iiif/70759/'+id+'/main-image';
 const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(50000),
  headers:{accept:'image/jpeg'}});
 assert.equal(response.status,200,'Met source HTTP error '+id);
 const host=new URL(response.url).hostname;
 assert.ok(['collectionapi.metmuseum.org','images.metmuseum.org'].includes(host));
 const type=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
 assert.equal(type,'image/jpeg');
 const bytes=new Uint8Array(await response.arrayBuffer());
 assert.ok(bytes.byteLength>10000&&bytes.byteLength<40000000);
 assert.deepEqual(Array.from(bytes.subarray(0,3)),[255,216,255]);
 const jpegSHA256=digest(bytes);
 const raw=await sharp(bytes,{failOn:'error'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(raw.info.channels,3,'genuine original RGB JPEG image required');
 assert.equal(raw.info.width,1200,'source-genuine four original gallery images require 1200-pixel JPEG');
 assert.ok(raw.info.height>=900&&raw.info.height<=1000);
 const decodedRGBSHA256=digest(raw.data);
 // This museum CDN may re-encode the same photograph into different
 // JPEG bytes. Content identity is established by the independently hashed
 // full decoded RGB image compared with the canonical verified image digest,
 // not by pretending its compressed bytes must always be identical.
 console.log('MET_GALLERY_SOURCE_JPEG_RECEIPT '+JSON.stringify({
  id,jpegSHA256,decodedRGBSHA256,expectedDecodedRGBSHA256:view.canonicalDecodedRGBSHA256,
  jpegEncodingPreviouslyObserved:observedExactEncodings[id].includes(jpegSHA256),
  width:raw.info.width,height:raw.info.height,bytes:bytes.length
 }));
 assert.equal(decodedRGBSHA256,view.canonicalDecodedRGBSHA256,
  'true published museum garment pixels changed; do not silently trust a JPEG URL or CDN encoding');
 assert.ok(!seen.has(decodedRGBSHA256),'all four gallery views must have different real pixels');
 seen.add(decodedRGBSHA256);
 // A novel byte encoding is recorded explicitly in the receipt, never
 // interpreted as an image/content change if exact decoded RGB is identical.
 const profile=measure({
  imageId:id,sourceSHA256:jpegSHA256,expectedSourceSHA256:jpegSHA256,
  decodedRGBSHA256,originalMuseumObjectNumber:source.objectNumber,
  actualOriginalJPEGAttested:true,
  actualDecodedRGBHashIndependentlyChecked:true,
  width:raw.info.width,height:raw.info.height,
  rgb:new Uint8Array(raw.data)
 });
 assert.equal(profile.status,
  'ORIGINAL_MUSEUM_TEXTILE_COLOR_REGION_MEASURED_RESEARCH_ONLY',
  'genuine Met published cloth pixel regions missing '+id+': '+profile.reason);
 assert.equal(profile.sevenMeasuredChromaticImageBands.length,7);
 assert.equal(profile.sourceImageCountInOfficialGallery,4);
 assert.equal(profile.mayCalibrateOriginalHonoluluGarment,false);
 assert.equal(profile.catalogDimensionCannotConvertObservedPixelsWithoutCameraAndFlattening,true);
 assert.equal(profile.consumer3DAdmitted,false);
 assert.equal(profile.releaseAuthorized,false);
 assert.equal(profile.physicalClothFitCertified,false);
 const receipt={
  originalMuseumObjectId:70759,originalMuseumAccession:'1983.21a, b',
  sourceUrl:url,sourceInstitutionalHost:host,imageId:id,
  actualJPEGByteSHA256:jpegSHA256,
  exactDecodedRGBSHA256:decodedRGBSHA256,
  imageWidthPixels:raw.info.width,imageHeightPixels:raw.info.height,
  originalJpegByteLength:bytes.length,
  jpegEncodingPreviouslyObserved:observedExactEncodings[id].includes(jpegSHA256),
  independentActualByteDigestChecked:true,
  originalExactSourcePixelsVerified:true,
  proposedPart:view.part,
  provisionalGalleryViewLabel:view.researchViewLabel,
  viewCaptionMuseumVerified:view.sourcePartViewVerified,
  museumExactCaption:view.catalogCaptionExact,
  humanFullGarmentSegmentationApproved:false,
  sourcePhoto2DFallbackRequired:true,
  originalHonoluluFitOrCameraCalibrationAllowed:false
 };
 records.push(receipt);profiles.push(profile);
 // Exact Sharp-decoded original RGB bytes for subsequent research-only
 // independent mask estimator. Already SHA-256 authenticated above, and
 // never handed to an app, user library, or persistent consumer asset.
 await writeFile(out+'/met-70759-gallery-'+id+'.rgb',raw.data);
 await writeFile(out+'/met-70759-gallery-'+id+'.jpg',bytes);
}
assert.equal(records.length,4);
assert.equal(profiles.length,4);
assert.equal(records.filter(x=>x.viewCaptionMuseumVerified).length,1,
 'Only the official a) front caption is independently source-grounded');
assert.equal(records[0].museumExactCaption,'a) front');
assert.deepEqual(records.map(x=>x.imageId),[2551406,2551407,2551408,2551409]);
const publishedCatalog=source.parts.map(x=>({
 part:x.part,recordedLengthMm:x.lengthInches*25.4,
 recordedWidthAtBottomMm:x.widthAtBottomInches*25.4,
 recordedWaistbandFlatWidthExcludingFastenerMm:
  x.waistbandWidthWithoutLoopButtonInches*25.4,
 physicalWearerWaistCircumferenceMeasured:false,
 catalogDimensionsNotPerspectiveCalibratedPhotoScale:true
}));
const report={
 schema:'M2-genuine-met-70759-four-view-color-fabric-envelope/v1',
 sourcePage:source.repositorySource,
 objectNumber:source.objectNumber,museumCatalogMeasuredGarmentParts:publishedCatalog,
 originalPhotographReceipts:records,
 sourcePhotoChromaticProjectionAudits:profiles,
 realFourDistinctOriginalPhotoDecodedPixels:true,
 aFrontCaptionDirectMuseumEvidence:true,
 otherThreeViewLabelsStillVisualProposals:true,
 allFourViewsAreFlattenedPhotographsNotWornGarments:true,
 actualCameraNotCalibrated:true,completeGarmentAlphaNotApproved:true,
 physical3DClothOrAvatarFitNotApproved:true,
 originalHonoluluSourceOrSizeNotAltered:true,
 originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
};
await writeFile(out+'/met-70759-four-view-source-color-bands.json',
 JSON.stringify(report,null,2)+'\n');
console.log('P89_GENUINE_MET_FOUR_GALLERY_COLOR_BANDS_HOLD '+JSON.stringify({
 source:report.sourcePage,images:records.map((x,i)=>({
  id:x.imageId,partViewLabel:x.provisionalGalleryViewLabel,
  museumCaptionVerified:x.viewCaptionMuseumVerified,
  jpegSHA256:x.actualJPEGByteSHA256,decodedRGBSHA256:x.exactDecodedRGBSHA256,
  bands:profiles[i].sevenMeasuredChromaticImageBands.map(b=>
   b.observedColorFabricWidthPixels)
 })),only2DColorFabricMeasured:true,onlyProvisionalViewsExceptAFront:true,
 metricCameraScaleStillUnknown:true,releaseAuthorized:false,familyAlpha:'HOLD'
}));
