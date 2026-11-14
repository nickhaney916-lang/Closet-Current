/**
 * MAIN1054 M43 actual, pinned Commons-0053 original-photo review station.
 * Uses M42's completed exact-SHA original JPEG/Work47/P93 provenance.
 * Embeds only public licensed files as data URLs for a secure OFFLINE local
 * file:// browser (no file origin canvas taint, no user/cloud private data).
 * No source/file, consumer app or 3D approval can be written by this build.
 */
import assert from 'node:assert/strict';
import {readFile,copyFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {M43_SOURCE} from '../research/main1054-mask43/source-annotation-contract.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const inDir='benchmark/main42-source-fringe',outDir='benchmark/main43-contour-editor';
const a='original-source.jpg',b='baseline-provisional-cutout.png',
 c='P93-alpha-only-proposal-NOT-APPROVED.png';
const [jpeg,baseline,p93]=await Promise.all([a,b,c].map(s=>readFile(join(inDir,s))));
assert.equal(sha(jpeg),M43_SOURCE.originalJpegSHA256,'licensed original JPEG SHA mismatch');
assert.equal(sha(baseline),M43_SOURCE.baselinePngSHA256,'unmodified Work47 RGB cutout SHA mismatch');
assert.equal(sha(p93),M43_SOURCE.p93ProposalSHA256,'unapproved original P93 mask SHA mismatch');
const inputReceipt=JSON.parse(await readFile(join(inDir,'numeric-source-fringe-trial.json'),'utf8'));
assert.equal(inputReceipt.sourceJpegSHA256,M43_SOURCE.originalJpegSHA256);
assert.equal(inputReceipt.originalPublicLicense,'CC BY 4.0');
assert.ok(inputReceipt.originalPublicSource?.startsWith('https://commons.wikimedia.org/'));
const originalPreview=await sharp(jpeg).rotate().ensureAlpha().png().toBuffer();
for(const data of [originalPreview,baseline,p93]){
 const meta=await sharp(data).metadata();
 assert.equal(meta.width,M43_SOURCE.width);
 assert.equal(meta.height,M43_SOURCE.height);
}
const payload={
 originalJpegSHA256:M43_SOURCE.originalJpegSHA256,
 baselinePngSHA256:M43_SOURCE.baselinePngSHA256,
 p93ProposalSHA256:M43_SOURCE.p93ProposalSHA256,
 sourceId:'commons-0053',
 actualOriginalJpegPreserved:true,
 original:'data:image/png;base64,'+originalPreview.toString('base64'),
 baseline:'data:image/png;base64,'+baseline.toString('base64'),
 p93:'data:image/png;base64,'+p93.toString('base64')
};
await mkdir(outDir,{recursive:true});
for(const s of [a,b,c])await copyFile(join(inDir,s),join(outDir,s));
for(const [src,target] of [
 ['research/main1054-mask43/offline-human-contour-editor.html','offline-human-contour-editor.html'],
 ['research/main1054-mask43/manual-contour-editor.js','manual-contour-editor.js'],
 [join(inDir,'M42-source-before-p93-trial-4up.jpg'),'original-work47-p93-M42-for-reference.jpg']
])await copyFile(src,join(outDir,target));
const script='/* M43 licensed public photo only; never a user-private wardrobe */\n'+
 'window.M43_ORIGINAL_LICENSED_SOURCES=Object.freeze('+
 JSON.stringify(payload)+');\n';
await writeFile(join(outDir,'licensed-original-data.js'),script,{flag:'wx'});
const receipt={
 schema:'MAIN1054_M43_EXACT_PUBLIC_ORIGINAL_OFFLINE_EDITOR_NOT_REVIEWED/v1',
 sourceId:payload.sourceId,sourceJpegSHA256:payload.originalJpegSHA256,
 baselinePngSHA256:payload.baselinePngSHA256,
 p93ProposalSHA256:payload.p93ProposalSHA256,
 actualOriginalJpegNotModified:true,
 sourcePhotoLicense:inputReceipt.originalPublicLicense,
 sourcePhotoCredit:inputReceipt.originalPublicAttribution,
 sourcePhotoURL:inputReceipt.originalPublicSource,
 localPhotoPreviewDecodesGenuineJpegPixelsToLosslessPng:true,
 embeddedPublicOnlyImageBytes:script.length,
 offlineOriginalSourceAppEdits:false,
 syntheticPointerTestsAreNotHumanReview:true,
 candidateSegmentationAccepted:false,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
};
await writeFile(join(outDir,'immutable-public-source-receipt.json'),
 JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log('MAIN43_REAL_LICENSED_SOURCE_INTERACTIVE_REVIEW_BUILT',JSON.stringify({
 originalExact:true,baselineExact:true,p93Exact:true,
 originalDimensions:[M43_SOURCE.width,M43_SOURCE.height],
 editorEmbeddedPublicOnly:true,realHumanReview:false,
 accepted3D:false,releaseAuthorized:false,familyAlpha:'HOLD'
}));
