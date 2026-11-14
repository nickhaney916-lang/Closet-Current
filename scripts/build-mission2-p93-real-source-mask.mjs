/**
 * P93 source-safe ORIGINAL real JPEG / Work47 PNG -> alpha-only draft.
 * No product, staging, Supabase, privacy or original source writes.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import sharp from 'sharp';
import {
 proposeAlphaOnlyLicensedDress93,P93_PARAMETERS,
 LOCKED_P93_SOURCE,LOCKED_P93_CUTOUT
} from '../research/mission2-p93/alpha-only-source-warm-edge.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const root=resolve('.');
const donor=resolve('.native05-donor-541');
assert.notEqual(donor,root);
const from=join(donor,'benchmark/work47/assets');
const output=join(root,'benchmark/mission2-p93/real-licensed-commons-0053');
await mkdir(output,{recursive:true});
const manifest=JSON.parse(await readFile(join(donor,'benchmark/work47/manifest.json'),'utf8'));
const m=manifest.rows?.find(x=>x.id==='commons-0053');
assert.equal(m?.sourceSHA256,LOCKED_P93_SOURCE);
assert.equal(m?.cutoutSHA256,LOCKED_P93_CUTOUT);
assert.equal(m?.ownerApproved,false);
assert.equal(m?.hasCutout,true);
assert.equal(m?.attribution?.license,'CC BY 4.0');
const originalFile=join(from,'commons-0053.jpg');
const cutoutFile=join(from,'commons-0053.png');
const originalBytes=await readFile(originalFile),cutoutBytes=await readFile(cutoutFile);
assert.equal(sha(originalBytes),LOCKED_P93_SOURCE,'locked licensed JPEG bytes changed');
assert.equal(sha(cutoutBytes),LOCKED_P93_CUTOUT,'locked provisional Work47 RGBA changed');
const [{data:source,info:oi},{data:rgba,info:ci}]=await Promise.all([
 sharp(originalBytes).rotate().ensureAlpha().raw().toBuffer({resolveWithObject:true}),
 sharp(cutoutBytes).ensureAlpha().raw().toBuffer({resolveWithObject:true})
]);
assert.equal(oi.channels,4);assert.equal(ci.channels,4);
assert.equal(oi.width,ci.width);assert.equal(oi.height,ci.height);
let originalRGBMismatch=0;
for(let i=0;i<rgba.length;i+=4){
 for(let c=0;c<3;c++)if(source[i+c]!==rgba[i+c]){originalRGBMismatch++;break;}
}
assert.equal(originalRGBMismatch,0,'original source RGB from real photo differs from provisional cutout');
const m93=proposeAlphaOnlyLicensedDress93({
 rgba,width:ci.width,height:ci.height,
 sourceSHA256:LOCKED_P93_SOURCE,cutoutSHA256:LOCKED_P93_CUTOUT
});
assert.ok(m93.proposedAlphaPixelsRemoved>=1000);
assert.ok(m93.proposedAlphaPixelsRemoved<=Math.round(m93.originalVisiblePixels*.025));
assert.equal(m93.sourceRGBChangedPixels,0);
assert.equal(m93.sourceAlphaIncreasedPixels,0);
assert.equal(m93.changedOutsideConservativeUpperRegion,0);
assert.equal(m93.noHumanOriginalPhotoApproval,true);
const amended=Buffer.from(m93.candidateRGBA);
const newPng=await sharp(amended,{
 raw:{width:ci.width,height:ci.height,channels:4}
}).png({compressionLevel:9}).toBuffer();
const derivativeSha=sha(newPng);
await copyFile(originalFile,join(output,'original-source.jpg'));
await copyFile(cutoutFile,join(output,'baseline-provisional-cutout.png'));
await writeFile(join(output,'P93-alpha-only-proposal-NOT-APPROVED.png'),newPng,{flag:'wx'});
// A/B and diagnostic red mask are SOURCE data visualizations, not
// photo-like invented material; original/source pixels preserved.
const originalJpg=await sharp(originalBytes).rotate().resize({width:640})
 .removeAlpha().jpeg({quality:92}).toBuffer();
const firstCutout=await sharp(cutoutBytes)
 .flatten({background:{r:195,g:208,b:216}}).resize({width:640})
 .jpeg({quality:92}).toBuffer();
const candidateCutout=await sharp(newPng)
 .flatten({background:{r:195,g:208,b:216}}).resize({width:640})
 .jpeg({quality:92}).toBuffer();
const md=await sharp(originalBytes).metadata();
const h=Math.round(oi.height*640/oi.width);
const comparison=await sharp({
 create:{width:1920,height:h,channels:3,background:'#d9e0e5'}
}).composite([
 {input:originalJpg,left:0,top:0},
 {input:firstCutout,left:640,top:0},
 {input:candidateCutout,left:1280,top:0}
]).jpeg({quality:88}).toBuffer();
await writeFile(join(output,'source-before-proposal-full.jpg'),comparison,{flag:'wx'});
const cropTop=Math.max(0,Math.floor(oi.height*.10));
const cropHeight=Math.min(oi.height-cropTop,Math.floor(oi.height*.37));
const frames=[];
for(const img of [originalBytes,cutoutBytes,newPng]){
 let q=sharp(img).extract({left:0,top:cropTop,width:ci.width,height:cropHeight});
 if(frames.length)q=q.flatten({background:{r:195,g:208,b:216}});
 frames.push(await q.resize({width:640}).removeAlpha().jpeg({quality:92}).toBuffer());
}
const previewHeight=Math.round(cropHeight*640/ci.width);
const closeup=await sharp({create:{width:1920,height:previewHeight,channels:3,background:'#d9e0e5'}})
 .composite(frames.map((input,i)=>({input,left:i*640,top:0})))
 .jpeg({quality:91}).toBuffer();
await writeFile(join(output,'source-neckline-before-proposal.jpg'),closeup,{flag:'wx'});
const receipt={...m93};delete receipt.candidateRGBA;
const report=Object.freeze({
 ...receipt,originalSourceRawRGBMismatchPixels:originalRGBMismatch,
 originalSourceJPEGSHA256:LOCKED_P93_SOURCE,
 originalWork47ProvisionalPNG_SHA256:LOCKED_P93_CUTOUT,
 proposedAlphaOnlyPNG_SHA256:derivativeSha,
 originalJPEGRetained:true,originalCutoutPNGStillUntouched:true,
 fullOriginalRGBProtected:true,
 humanCutoutAcceptance:'UNREVIEWED',
 researchDerivativeNeverUploadedToConsumer:true,
 sourceMaskQualityClaim:'PROPOSAL_NEEDS_INDEPENDENT_HUMAN_REVIEW',
 exactBenchmarkTestStatus:'REAL_LICENSED_SOURCE_ALPHA_DERIVATIVE_UNREVIEWED_NOT_RELEASE',
 parameters:P93_PARAMETERS,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
await writeFile(join(output,'numeric-receipt.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log('M2_P93_ORIGINAL_SOURCE_ALPHA_RESEARCH',JSON.stringify({
 status:report.exactBenchmarkTestStatus,
 sourceSHA256:report.originalSourceJPEGSHA256,
 oldCutoutSHA256:report.originalWork47ProvisionalPNG_SHA256,
 proposedCutoutSHA256:report.proposedAlphaOnlyPNG_SHA256,
 changedAlphaPixels:report.proposedAlphaPixelsRemoved,
 changedRGBPixels:report.sourceRGBChangedPixels,
 warmBoundaryComponents:report.selectedBoundaryConnectedComponents,
 sourcePipingLogoNeutralPixelsProtected:report.unchangedHighBrightnessNeutralPipingLogoSamples,
 fullPhotoAndUpperCloseupsCreated:true,humanApproval:false,releaseAuthorized:false,
 familyAlpha:'HOLD'
}));
