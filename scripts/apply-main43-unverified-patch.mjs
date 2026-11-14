/**
 * Run LOCALLY ONLY after an unverified M43 browser JSON export:
 * node scripts/apply-main43-unverified-patch.mjs /path/to/manual-annotations.json
 *
 * Rebuilds exact original-JPEG RGB and Work47/P93 alpha, applies bounded
 * pixel edits and writes a separate UNAPPROVED local candidate PNG + receipt.
 * This tool never imports it into Closet Current, verifies reviewer identity,
 * enables 3D or touches a private wardrobe/cloud/production database.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {
 M43_SOURCE,applyUnverifiedSourceAnnotations43
} from '../research/main1054-mask43/source-annotation-contract.mjs';
const input=process.argv[2];
if(!input||process.argv.length!==3)
 throw Error('Pass exactly one local M43 source-annotation JSON path');
const out='benchmark/main43-contour-editor';
const paths=['original-source.jpg','baseline-provisional-cutout.png',
 'P93-alpha-only-proposal-NOT-APPROVED.png'];
const raw=await Promise.all(paths.map(x=>readFile(join(out,x))));
const hashes=[M43_SOURCE.originalJpegSHA256,
 M43_SOURCE.baselinePngSHA256,M43_SOURCE.p93ProposalSHA256];
for(let i=0;i<3;i++)assert.equal(
 createHash('sha256').update(raw[i]).digest('hex'),hashes[i],
 'M43 refused changed original licensed photo/Work47/P93 PNG');
const patch=JSON.parse(await readFile(input,'utf8'));
const imgs=await Promise.all(raw.map((b,i)=>
 sharp(b)[i===0?'rotate':'ensureAlpha']().ensureAlpha().raw().toBuffer({resolveWithObject:true})));
for(const {info} of imgs){
 assert.equal(info.width,M43_SOURCE.width);assert.equal(info.height,M43_SOURCE.height);
 assert.equal(info.channels,4);
}
const {candidateRGBA,receipt}=applyUnverifiedSourceAnnotations43({
 patch,sourceRGBA:imgs[0].data,baselineRGBA:imgs[1].data,
 p93RGBA:imgs[2].data,width:M43_SOURCE.width,height:M43_SOURCE.height
});
const png=await sharp(candidateRGBA,{raw:{
 width:M43_SOURCE.width,height:M43_SOURCE.height,channels:4
}}).png({compressionLevel:9}).toBuffer();
const decoded=await sharp(png).ensureAlpha().raw().toBuffer();
assert.equal(Buffer.compare(decoded,Buffer.from(candidateRGBA)),0,
 'PNG encode/decode must retain every exact original RGB and proposed alpha byte');
const pngName='M43-LOCAL-ANNOTATION-CANDIDATE-NOT-APPROVED.png';
await writeFile(join(out,pngName),png,{flag:'wx'});
const output={
 ...receipt,
 originalLicensedPhotoSHA256:M43_SOURCE.originalJpegSHA256,
 unapprovedSeparatePngSHA256:createHash('sha256').update(png).digest('hex'),
 annotationsFromRealIndependentlyAuthenticatedReviewer:false,
 annotationFileMayBeFromSyntheticBrowserTest:true,
 mayNotBeImportedIntoConsumerOutfitBuilder:true,
 independentlyVerifiedHumanGarmentContour:false,
 photorealisticMeshPermission:false,
 physicalMobileAcceptance:false,
 releaseAuthorized:false,consumer3DAdmitted:false,familyAlpha:'HOLD'
};
await writeFile(join(out,'M43-LOCAL-ANNOTATION-CANDIDATE-NOT-APPROVED.json'),
 JSON.stringify(output,null,2)+'\n',{flag:'wx'});
console.log('MAIN43_ACTUAL_PUBLIC_ORIGINAL_ANNOTATION_RECONSTRUCTED_STILL_HOLD',
 JSON.stringify({
 changed:receipt.totalUserAnnotatedPixels,restored:receipt.p93PixelsRestoredFromOriginalBaseline,
 removed:receipt.manuallyRemovedPixels,originalRgbChanged:receipt.originalRGBChangedPixels,
 candidatePngCreated:true,realHumanReviewed:false,
 consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 }));
