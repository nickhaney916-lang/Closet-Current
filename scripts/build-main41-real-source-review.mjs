/**
 * MAIN1054 M41 — actual, source-locked P93 original JPEG / Work47 cutout /
 * alpha-only candidate -> independently inspectable offline review packet.
 *
 * Assumes a disposable exact commit P541 Work47 donor was built, and P93
 * exact-source runner independently produced its unchanged source files.
 * Nothing writes owner/private clothing, public application, Supabase or rigs.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {auditSourceAlphaContours41} from '../research/main1054-mask41/original-rgb-alpha-audit.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
const source='benchmark/mission2-p93/real-licensed-commons-0053',out='benchmark/main41-source-review';
const orig='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const old='ab7c7caa43fe32b1e0ba5c58e64a59ba49e5a9fe881a3a7a7791c20aab9007c4';
const trial='caf1e8b5e292e9397262333ba6a3d2f673bd6c81b6b1694b5abf69aa90676a31';
const names=['original-source.jpg','baseline-provisional-cutout.png','P93-alpha-only-proposal-NOT-APPROVED.png'];
const bytes=await Promise.all(names.map(n=>readFile(join(source,n))));
assert.equal(digest(bytes[0]),orig,'original licensed JPEG hash changed');
assert.equal(digest(bytes[1]),old,'original RGB Work47 cutout hash changed');
assert.equal(digest(bytes[2]),trial,'exact P93 trial alpha derivative changed');
const actual=JSON.parse(await readFile(join(source,'numeric-receipt.json'),'utf8'));
assert.equal(actual.originalSourceJPEGSHA256,orig);
assert.equal(actual.originalWork47ProvisionalPNG_SHA256,old);
assert.equal(actual.proposedAlphaOnlyPNG_SHA256,trial);
assert.equal(actual.releaseAuthorized,false);
assert.equal(actual.humanCutoutAcceptance,'UNREVIEWED');
const raw=await Promise.all(bytes.map((x,i)=>
 sharp(x)[i===0?'rotate':'ensureAlpha']().ensureAlpha().raw().toBuffer({resolveWithObject:true})));
const [{data:rgb,info:ri},{data:oldRgba,info:oi},{data:trialRgba,info:ti}]=raw;
assert.equal(ri.width,1920);assert.equal(ri.height,2880);
assert.equal(ri.channels,4);assert.equal(oi.channels,4);assert.equal(ti.channels,4);
assert.equal(oi.width,ri.width);assert.equal(oi.height,ri.height);
assert.equal(ti.width,ri.width);assert.equal(ti.height,ri.height);
const measured=auditSourceAlphaContours41({
 sourceRGBA:rgb,baselineRGBA:oldRgba,candidateRGBA:trialRgba,
 width:ri.width,height:ri.height
});
assert.equal(measured.candidateChangedAlphaPixels,12961,
 'exact original-P93 alpha trial removal changed unexpectedly');
assert.equal(measured.removedComponents>0,true);
assert.equal(measured.independentHumanSourceFidelityAccepted,false);
await mkdir(out,{recursive:true});
for(let i=0;i<names.length;i++)await copyFile(join(source,names[i]),join(out,names[i]));
// A diagnostic with opaque translucent overlay of the actual alpha difference;
// use the baseline RGB/alpha, not invented material or regenerated "fabric".
const overlay=Buffer.alloc(ri.width*ri.height*4);
for(let i=0;i<ri.width*ri.height;i++){
 const p=i*4;
 if(oldRgba[p+3]!==trialRgba[p+3]){
  overlay[p]=255;overlay[p+1]=31;overlay[p+2]=148;overlay[p+3]=207;
 }
}
const rgbaInfo={raw:{width:ri.width,height:ri.height,channels:4}};
const overlayPng=await sharp(overlay,rgbaInfo).png().toBuffer();
const composed=await sharp(bytes[1]).flatten({background:'#aab4bc'})
 .composite([{input:overlayPng,blend:'over'}]).png().toBuffer();
await writeFile(join(out,'removed-alpha-overlay.png'),composed,{flag:'wx'});
// Crop must retain the actual source image frame: no fake rear silhouette or
// altered "better" mask is introduced.
const y=Math.max(0,Math.floor(ri.height*.10));
const cropH=Math.min(ri.height-y,Math.floor(ri.height*.36));
const cropFrames=[];
for(let i=0;i<3;i++){
 let v=sharp(bytes[i]).extract({left:0,top:y,width:ri.width,height:cropH});
 if(i!==0)v=v.flatten({background:'#aab4bc'});
 cropFrames.push(await v.resize({width:610}).removeAlpha().png().toBuffer());
}
const height=Math.round(cropH*610/ri.width);
const comparison=await sharp({
 create:{width:610*3,height,channels:3,background:'#aab4bc'}
}).composite(cropFrames.map((input,i)=>({input,left:i*610,top:0})))
 .png().toBuffer();
await writeFile(join(out,'neckline-comparison.jpg'),
 await sharp(comparison).jpeg({quality:92}).toBuffer(),{flag:'wx'});
const page=await readFile('research/main1054-mask41/offline-source-quality-review.html');
await writeFile(join(out,'offline-source-quality-review.html'),page,{flag:'wx'});
const safe={
 ...measured,
 sourceId:'commons-0053',
 originalJpegSha256:orig,
 baselineProvisionalPngSha256:old,
 p93UnacceptedCandidatePngSha256:trial,
 outputImageSha256:Object.fromEntries([
  ['original-source.jpg',orig],
  ['baseline-provisional-cutout.png',old],
  ['P93-alpha-only-proposal-NOT-APPROVED.png',trial],
  ['removed-alpha-overlay.png',digest(composed)],
  ['neckline-comparison.jpg',digest(await readFile(join(out,'neckline-comparison.jpg')))]
 ]),
 originalPublicLicense:'CC BY 4.0',
 originalPublicSource:'https://commons.wikimedia.org/wiki/File:Ordnance_Officer%27s_Dress_Uniform%2C_1831_%28Malm%C3%B6_Museum%29.JPG',
 sourceCredit:'Use attribution/license from original Commons-0053 Work47 manifest; not independently human-certified by this packet.',
 derivativeSourceOnly:true,
 reviewerSelectionsAreNotIndependentQualityApproval:true
};
await writeFile(join(out,'measured-source-contour-receipt.json'),
 JSON.stringify(safe,null,2)+'\n',{flag:'wx'});
console.log('MAIN41_REAL_P93_SOURCE_ALPHA_REVIEW_CREATED',JSON.stringify({
 changed:measured.candidateChangedAlphaPixels,
 connectedComponents:measured.removedComponents,
 residualWarmSuspectSamples:measured.possibleWarmContourResidues,
 whiteLogoPixelsRemoved:measured.removedProtectedNearWhiteSamples,
 rgbChanged:measured.candidateOriginalRGBMismatchPixels,
 humanAccepted:false,consumer3D:false,familyAlpha:'HOLD'
}));
