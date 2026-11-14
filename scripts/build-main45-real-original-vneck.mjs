/**
 * M45 real licensed source 1920×2880 original JPEG V-neck photo candidate.
 * Hashes the ORIGINAL bytes, independently recreates separate PNG alpha-only
 * proposal and review images. Never edits original photographer source, P93,
 * product images, owner/private storage, or emits consumer 3D authority.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {
 M45_LOCK,proposeOriginalVNeckSourceMatte45
} from '../research/main1054-mask45/vneck-source-region-trial.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const from='benchmark/main44-guided-source-review';
const out='benchmark/main45-licensed-vneck-photo-candidate';
const originals=[
 ['original-source.jpg',M45_LOCK.originalJpegSHA256],
 ['baseline-provisional-cutout.png',M45_LOCK.work47PngSHA256],
 ['P93-alpha-only-proposal-NOT-APPROVED.png',M45_LOCK.p93PngSHA256]
];
const raws=await Promise.all(originals.map(([p])=>readFile(join(from,p))));
for(let i=0;i<originals.length;i++)
 assert.equal(sha(raws[i]),originals[i][1],'source photograph/P93 SHA changed');
const sourceReceipt=JSON.parse(await readFile(join(from,'immutable-public-source-receipt.json'),'utf8'));
const m44Review=JSON.parse(await readFile(join(from,'licensed-review-targets.json'),'utf8'));
assert.equal(sourceReceipt.sourcePhotoLicense,'CC BY 4.0');
assert.ok(sourceReceipt.sourcePhotoURL?.startsWith('https://commons.wikimedia.org/'));
assert.equal(m44Review.totalFlaggedWarmEdgeSamples,301);
assert.equal(m44Review.tilesCount,14);
const decoded=await Promise.all(raws.map((b,i)=>
 sharp(b)[i===0?'rotate':'ensureAlpha']().ensureAlpha().raw()
 .toBuffer({resolveWithObject:true})));
for(const r of decoded)assert.deepEqual(
 [r.info.width,r.info.height,r.info.channels],[1920,2880,4]);
const {candidateRGBA,receipt}=proposeOriginalVNeckSourceMatte45({
 sourceRGBA:decoded[0].data,
 baselineRGBA:decoded[1].data,p93RGBA:decoded[2].data,
 width:1920,height:2880,
 sourceJpegSHA256:M45_LOCK.originalJpegSHA256,
 baselinePngSHA256:M45_LOCK.work47PngSHA256,
 p93PngSHA256:M45_LOCK.p93PngSHA256
});
assert.equal(receipt.originalSourceRGBPixelsChanged,0);
assert.equal(receipt.protectedOriginalBrightPipingOrLogoPixelsRemoved,0);
assert.equal(receipt.sourceOrP93AlphaIncreasedPixels,0);
assert.equal(receipt.offVNeckOriginalSourcePixelsChanged,0);
assert.equal(receipt.humanMaskAccepted,false);
assert.equal(receipt.approved3D,false);
assert.equal(receipt.releaseAuthorized,false);
assert.equal(receipt.consumer3DAdmitted,false);
assert.ok(receipt.additionallyTransparentOriginalOpaquePixels>=100);
assert.ok(receipt.additionallyTransparentOriginalOpaquePixels<=7500);
await mkdir(out,{recursive:true});
for(let i=0;i<originals.length;i++)
 await copyFile(join(from,originals[i][0]),join(out,originals[i][0]));
const png=await sharp(candidateRGBA,{
 raw:{width:1920,height:2880,channels:4}
}).png({compressionLevel:9}).toBuffer();
const decodedPNG=await sharp(png).ensureAlpha().raw().toBuffer();
assert.equal(Buffer.compare(decodedPNG,Buffer.from(candidateRGBA)),0,
 'the separate candidate PNG must retain every original RGB byte and alpha');
const filename='M45-vneck-local-tone-proposal-UNAPPROVED.png';
await writeFile(join(out,filename),png,{flag:'wx'});
// The four-way crop displays ORIGINAL, the P93 mask on matte, M45 on the
// same matte and an accurate magenta overlay of newly transparent pixels.
const rect={left:750,top:395,width:520,height:390},width=650;
const pale='#aab4bc';
const rows=[
 await sharp(raws[0]).rotate().extract(rect).resize({width}).removeAlpha().png().toBuffer(),
 await sharp(raws[2]).extract(rect).flatten({background:pale})
  .resize({width}).removeAlpha().png().toBuffer(),
 await sharp(png).extract(rect).flatten({background:pale})
  .resize({width}).removeAlpha().png().toBuffer()
];
const overlay=new Uint8Array(rect.width*rect.height*4);
let extraWithinCrop=0;
for(let y=0;y<rect.height;y++)for(let x=0;x<rect.width;x++){
 const at=((rect.top+y)*1920+rect.left+x)*4;
 if(decoded[2].data[at+3]===candidateRGBA[at+3])continue;
 const p=(y*rect.width+x)*4;
 overlay[p]=255;overlay[p+1]=38;overlay[p+2]=144;overlay[p+3]=205;
 extraWithinCrop++;
}
assert.equal(extraWithinCrop,receipt.additionallyTransparentOriginalOpaquePixels,
 'all candidate differences must live inside source-only review crop');
const overlayPng=await sharp(overlay,{
 raw:{width:rect.width,height:rect.height,channels:4}
}).png().toBuffer();
const overlayImage=await sharp(raws[0]).rotate().extract(rect)
 .composite([{input:overlayPng,blend:'over'}])
 .resize({width}).removeAlpha().png().toBuffer();
rows.push(overlayImage);
const h=Math.round(rect.height*width/rect.width);
const board=await sharp({create:{
 width:width*4,height:h,channels:3,background:pale
}}).composite(rows.map((input,i)=>({input,left:i*width,top:0})))
 .jpeg({quality:92}).toBuffer();
await writeFile(join(out,'actual-original-vneck-P93-M45-difference-4up.jpg'),
 board,{flag:'wx'});
const sheets=[
 await sharp(raws[0]).rotate().resize({width:420}).removeAlpha().png().toBuffer(),
 await sharp(raws[2]).flatten({background:pale}).resize({width:420}).removeAlpha().png().toBuffer(),
 await sharp(png).flatten({background:pale}).resize({width:420}).removeAlpha().png().toBuffer()
];
const fullh=Math.round(2880*420/1920);
const full=await sharp({create:{width:1260,height:fullh,
 channels:3,background:pale
}}).composite(sheets.map((input,i)=>({input,left:i*420,top:0})))
 .jpeg({quality:90}).toBuffer();
await writeFile(join(out,'actual-full-dress-original-P93-M45-3up.jpg'),full,{flag:'wx'});
await copyFile('research/main1054-mask45/offline-actual-original-vneck-review.html',
 join(out,'offline-actual-original-vneck-review.html'));
const evidence={
 ...receipt,
 sourcePhotoLicense:sourceReceipt.sourcePhotoLicense,
 sourcePhotoCredit:sourceReceipt.sourcePhotoCredit,
 sourcePhotoURL:sourceReceipt.sourcePhotoURL,
 originalSourcePublicJpegSha256:M45_LOCK.originalJpegSHA256,
 originalP93SourceUnmodifiedSha256:M45_LOCK.p93PngSHA256,
 separateUnapprovedCandidatePNG_SHA256:sha(png),
 realOriginalSourceReviewCropSHA256:sha(board),
 realFullDressComparison_SHA256:sha(full),
 originalPixelDifferenceInBounds:extraWithinCrop,
 m44PriorAmbiguousEdgeSamples:301,
 m44PriorSourceReviewRegions:14,
 originalLicensedImageNeverModified:true,
 unobservedPhotographicBacksideStillUnavailable:true,
 sourceFrontOnly:true,
 notAReviewedOrApprovedClothingImage:true,
 distinctFromParallel89SkirtSourceId:'commons-0043',
 noHumanMaskReview:true,
 noOriginalPhotoReconstructionHumanAcceptance:true,
 privacyHostedAccountOrPhysicalPhoneNotExercised:true,
 consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
};
await writeFile(join(out,'actual-source-candidate-metrics-NOT-APPROVED.json'),
 JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
console.log('MAIN45_REAL_ORIGINAL_PHOTO_VNECK_REGION_PROPOSAL_NOT_APPROVED',
 JSON.stringify({extraTransparent:receipt.additionallyTransparentOriginalOpaquePixels,
  originalP93Removed:receipt.originalP93AlphaRemoved,
  RGBChanged:receipt.originalSourceRGBPixelsChanged,
  protectedWhitePipingRemoved:receipt.protectedOriginalBrightPipingOrLogoPixelsRemoved,
  alphaIncreased:receipt.sourceOrP93AlphaIncreasedPixels,
  sourceBound:receipt.changedPixelBounds,
  originalShaVerified:true,
  humanAccepted:false,consumer3D:false,familyAlpha:'HOLD'}));
