/**
 * M42 actual immutable Commons-0053 licensed original -> separate fringe
 * hypothesis, 4-way review and real-pixel quantitative comparison.
 * No source modification, owner data, consumer app install or human approval.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {
 proposeSourceConservativeFringe42,
 M42_SOURCE_SHA,M42_BASELINE_SHA,M42_P93_TRIAL_SHA
} from '../research/main1054-mask42/conservative-fringe-trial.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const from='benchmark/main41-source-review',dir='benchmark/main42-source-fringe';
const files=['original-source.jpg','baseline-provisional-cutout.png',
 'P93-alpha-only-proposal-NOT-APPROVED.png'];
const raw=await Promise.all(files.map(f=>readFile(join(from,f))));
for(let i=0;i<3;i++)assert.equal(sha(raw[i]),
 [M42_SOURCE_SHA,M42_BASELINE_SHA,M42_P93_TRIAL_SHA][i],
 'genuine exact original RGB P93 / JPEG source bytes required');
const decoded=await Promise.all(raw.map(async(bytes,i)=>
 sharp(bytes)[i===0?'rotate':'ensureAlpha']().ensureAlpha().raw().toBuffer({resolveWithObject:true})));
const [{data:source,info:si},{data:baseline,info:bi},{data:p93,info:pi}]=decoded;
assert.equal(si.width,1920);assert.equal(si.height,2880);
assert.equal(si.channels,4);assert.equal(bi.channels,4);assert.equal(pi.channels,4);
assert.equal(bi.width,si.width);assert.equal(bi.height,si.height);
assert.equal(pi.width,si.width);assert.equal(pi.height,si.height);
const receipt=proposeSourceConservativeFringe42({
 sourceRGBA:source,baselineRGBA:baseline,p93RGBA:p93,
 width:si.width,height:si.height,
 originalJpegSHA256:M42_SOURCE_SHA,
 baselinePngSHA256:M42_BASELINE_SHA,
 p93ProposalSHA256:M42_P93_TRIAL_SHA
});
assert.equal(receipt.releaseAuthorized,false);
assert.equal(receipt.consumer3DAdmitted,false);
assert.equal(receipt.humanContourAccepted===true,false);
assert.ok([
 'SOURCE_CONTINUOUS_FRINGE_CANDIDATE_UNREVIEWED',
 'NO_SOURCE_CONTINUOUS_SAFE_EXTRA_PIXEL_FOUND',
 'TRIAL_REFUSED_OVERLARGE_UNCERTAIN_FRINGE'
].includes(receipt.status));
const candidate=receipt.candidateRGBA;
let verifiedRGBDifferences=0,extra=0,alphaIncreases=0,oldP93Changes=0;
for(let p=0;p<si.width*si.height;p++){
 const i=p*4;
 for(let c=0;c<3;c++)if(candidate[i+c]!==source[i+c])verifiedRGBDifferences++;
 if(candidate[i+3]>p93[i+3])alphaIncreases++;
 if(p93[i+3]!==baseline[i+3])oldP93Changes++;
 if(p93[i+3]!==candidate[i+3])extra++;
}
assert.equal(verifiedRGBDifferences,0);
assert.equal(alphaIncreases,0);
assert.equal(oldP93Changes,12961);
assert.equal(extra,receipt.additionalAlphaPixelsProposed??0);
await mkdir(dir,{recursive:true});
for(let i=0;i<3;i++)await copyFile(join(from,files[i]),join(dir,files[i]));
const candidatePNG=await sharp(candidate,{
 raw:{width:si.width,height:si.height,channels:4}
}).png({compressionLevel:9}).toBuffer();
const candidateFilename='M42-conservative-fringe-UNAPPROVED.png';
await writeFile(join(dir,candidateFilename),candidatePNG,{flag:'wx'});
const verify=await sharp(candidatePNG).ensureAlpha().raw().toBuffer();
assert.equal(Buffer.compare(verify,Buffer.from(candidate)),0,
 'decoded candidate PNG RGBA bytes must match the exact calculated source pixels');
const overlay=Buffer.alloc(candidate.length);
for(let p=0;p<si.width*si.height;p++){
 const i=p*4;
 if(p93[i+3]!==candidate[i+3]){
  overlay[i]=5;overlay[i+1]=239;overlay[i+2]=238;overlay[i+3]=224;
 }
}
const overlayPng=await sharp(overlay,{raw:{
 width:si.width,height:si.height,channels:4}}).png().toBuffer();
const baseOverlay=await sharp(raw[2]).flatten({background:'#aab4bc'})
 .composite([{input:overlayPng,blend:'over'}]).png().toBuffer();
await writeFile(join(dir,'M42-extra-alpha-highlight.png'),baseOverlay,{flag:'wx'});
const sourcePic=[raw[0],raw[1],raw[2],candidatePNG];
const frameWidth=470;
const frames=[];
for(let i=0;i<sourcePic.length;i++){
 let q=sharp(sourcePic[i]);
 if(i>0)q=q.flatten({background:'#aab4bc'});
 frames.push(await q.resize({width:frameWidth})
  .removeAlpha().jpeg({quality:92}).toBuffer());
}
const h=Math.round(si.height*frameWidth/si.width);
const comparison=await sharp({create:{
 width:frameWidth*4,height:h,channels:3,background:'#aab4bc'
}}).composite(frames.map((input,i)=>({input,left:i*frameWidth,top:0})))
 .jpeg({quality:90}).toBuffer();
await writeFile(join(dir,'M42-source-before-p93-trial-4up.jpg'),comparison,{flag:'wx'});
const html=await readFile('research/main1054-mask42/offline-four-way-review.html');
await writeFile(join(dir,'offline-four-way-review.html'),html,{flag:'wx'});
const report={...receipt};delete report.candidateRGBA;
const record={
 ...report,
 originalSourceId:'commons-0053',
 sourceJpegSHA256:M42_SOURCE_SHA,
 work47PngSHA256:M42_BASELINE_SHA,
 p93ProvisionalPngSHA256:M42_P93_TRIAL_SHA,
 newUnapprovedPngSHA256:sha(candidatePNG),
 explicitPixelVerification:{oldP93Removed:oldP93Changes,extraAlphaRemoved:extra,
  originalSourceRGBChanged:verifiedRGBDifferences,alphaIncreased:alphaIncreases},
 fileSHA256:Object.fromEntries([
  [candidateFilename,sha(candidatePNG)],
  ['M42-extra-alpha-highlight.png',sha(baseOverlay)],
  ['M42-source-before-p93-trial-4up.jpg',sha(comparison)]
 ]),
 trueSourcePhotoOriginalUnchanged:true,
 independentHumanAccepted:false,visualQualityImprovementNotProven:true,
 familyAlpha:'HOLD',releaseAuthorized:false,consumer3DAdmitted:false
};
await writeFile(join(dir,'numeric-source-fringe-trial.json'),
 JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log('MAIN42_ACTUAL_LICENSED_SOURCE_FRINGE_TRIAL_NOT_APPROVED',JSON.stringify({
 status:receipt.status,originalP93Removed:oldP93Changes,
 additionalAlphaRemoved:extra,originalRGBChanged:verifiedRGBDifferences,
 originalPhotoAndP93Untouched:true,originalSourcesExactSHA:true,
 humanAccepted:false,consumer3D:false,familyAlpha:'HOLD'
}));
