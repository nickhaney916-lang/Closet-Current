/**
 * M44 source-locked genuine P93 ambiguous-edge review workstation.
 *
 * Reuses unchanged M43 photo and contour editor; produces only navigation,
 * never mask authority, auto-segmentation, owner wardrobe or 3D permission.
 */
import assert from 'node:assert/strict';
import {readFile,copyFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import sharp from 'sharp';
import {
 M44_SOURCE,locateOriginalSourceReviewRegions44
} from '../research/main1054-mask44/priority-source-review.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const inDir='benchmark/main43-contour-editor';
const out='benchmark/main44-guided-source-review';
const original='original-source.jpg';
const baseline='baseline-provisional-cutout.png';
const p93='P93-alpha-only-proposal-NOT-APPROVED.png';
const names=[original,baseline,p93];
const files=await Promise.all(names.map(n=>readFile(join(inDir,n))));
for(let i=0;i<3;i++)assert.equal(sha(files[i]),[
 M44_SOURCE.originalJpegSHA256,
 M44_SOURCE.baselinePngSHA256,
 M44_SOURCE.p93ProposalSHA256
][i],'actual original licensed JPEG/Work47/P93 SHA mismatch');
const decoded=await Promise.all(files.map((b,i)=>
 sharp(b)[i===0?'rotate':'ensureAlpha']().ensureAlpha().raw()
 .toBuffer({resolveWithObject:true})));
for(const r of decoded)assert.deepEqual([
 r.info.width,r.info.height,r.info.channels],[1920,2880,4]);
const report=locateOriginalSourceReviewRegions44({
 sourceRGBA:decoded[0].data,baselineRGBA:decoded[1].data,
 p93RGBA:decoded[2].data,width:1920,height:2880,
 originalJpegSHA256:M44_SOURCE.originalJpegSHA256,
 baselinePngSHA256:M44_SOURCE.baselinePngSHA256,
 p93ProposalSHA256:M44_SOURCE.p93ProposalSHA256
});
assert.equal(report.totalFlaggedWarmEdgeSamples,301,
 'actual licensed source warm edge count unexpectedly changed');
assert.equal(report.tilesCount,14,
 'actual licensed photo source review tile count unexpectedly changed');
assert.equal(report.removedP93AlphaPixels,12961);
assert.equal(report.noAlphaPixelsModified,true);
assert.equal(report.releaseAuthorized,false);
await mkdir(out,{recursive:true});
for(const n of [...names,'manual-contour-editor.js',
 'licensed-original-data.js','immutable-public-source-receipt.json',
 'original-work47-p93-M42-for-reference.jpg'
])await copyFile(join(inDir,n),join(out,n));
await copyFile('research/main1054-mask44/source-priority-guide.js',
 join(out,'source-priority-guide.js'));
const htmlSource=await readFile(join(inDir,'offline-human-contour-editor.html'),'utf8');
const anchor='<div class="sides">';
if(htmlSource.split(anchor).length!==2)
 throw Error('original source editor UI anchor missing or duplicated');
const guide=[
'<section class="controls" aria-label="Original source candidate edge region navigation">',
'<h2>Review the exact original-photo edge candidates — not approved mask changes</h2>',
'<p>301 possible warm-color pixels near the P93 transparent neckline have been grouped into 14 original-image regions. They may be genuine fabric. Moving between regions NEVER edits or approves pixels.</p>',
'<div class="row">',
'<label for="targetSelect">Review region</label>',
'<select id="targetSelect" disabled aria-label="Choose source-photo review region"></select>',
'<button id="targetPrevious" type="button" disabled>Previous region</button>',
'<button id="targetNext" type="button" disabled>Next region</button>',
'</div>',
'<p id="targetStatus" role="status" aria-live="polite">Checking immutable original-photo candidate locations…</p>',
'<figure>',
'<figcaption>Four highest-sample original-photo/P93 pairs — inspection only, not source approval</figcaption>',
'<img src="./priority-original-and-p93-crops.jpg" alt="Genuine original JPEG and P93 masks side-by-side at top ambiguous neckline regions" style="display:block;width:100%;max-width:960px;height:auto;object-fit:contain">',
'</figure>',
'<small>Navigation centers the two original/p93 canvases. Use M43 manual remove/restore brushes only after examining the actual photograph. A flagged sample is NOT proof of background.</small>',
'</section>'
].join('\n');
let html=htmlSource.replace(anchor,guide+'\n'+anchor);
const tag='<script src="./manual-contour-editor.js"></script>';
if(html.split(tag).length!==2)throw Error('original editor bootstrap changed');
html=html.replace(tag,tag+
 '\n<script src="./licensed-review-targets.js"></script>'+
 '\n<script src="./source-priority-guide.js"></script>');
html=html.replace('Closet Current M43 — manual original-photo neckline annotation',
 'Closet Current M44 — guided original-photo contour inspection');
html=html.replace('Real photographed dress — precise contour annotations',
 'Guided original-photo contour review — 14 unverified regions');
await writeFile(join(out,'guided-original-photo-review.html'),html,{flag:'wx'});
await writeFile(join(out,'licensed-review-targets.js'),
 '/* Real source color candidate points, not segmentation approval */\n'+
 'window.M44_PUBLIC_SOURCE_REVIEW_TARGETS=Object.freeze('+
 JSON.stringify(report)+');\n',{flag:'wx'});
await writeFile(join(out,'licensed-review-targets.json'),
 JSON.stringify(report,null,2)+'\n',{flag:'wx'});
const crop=240,realCrop=200,frames=[];
for(const t of report.targets.slice(0,4)){
 const left=Math.max(0,Math.min(1920-realCrop,t.x-Math.floor(realCrop/2)));
 const top=Math.max(0,Math.min(2880-realCrop,t.y-Math.floor(realCrop/2)));
 for(const rgba of [decoded[0].data,decoded[2].data]){
  frames.push(await sharp(rgba,{raw:{width:1920,height:2880,channels:4}})
   .extract({left,top,width:realCrop,height:realCrop})
   .flatten({background:'#aab4bc'})
   .resize(crop,crop).jpeg({quality:92}).toBuffer());
 }
}
const contact=await sharp({create:{
 width:crop*4,height:crop*2,channels:3,background:'#aab4bc'
}}).composite(frames.map((input,i)=>({
 input,left:(i%4)*crop,top:Math.floor(i/4)*crop
}))).jpeg({quality:92}).toBuffer();
await writeFile(join(out,'priority-original-and-p93-crops.jpg'),
 contact,{flag:'wx'});
await writeFile(join(out,'source-review-evidence.json'),JSON.stringify({
 exactOriginalPublicJpegSHA256:M44_SOURCE.originalJpegSHA256,
 exactOriginalBaselinePngSHA256:M44_SOURCE.baselinePngSHA256,
 exactUnapprovedP93PngSHA256:M44_SOURCE.p93ProposalSHA256,
 sourceRGBChangedPixels:0,p93AlphaChangedByM44:0,
 originalPhotoReviewerRegions:report.tilesCount,
 warmSamplesMayBeGenuineFabric:true,
 warmEdgeSamples:report.totalFlaggedWarmEdgeSamples,
 topFourCropPairsGenuineSource:true,
 contactSheetSha256:sha(contact),
 noIndependentHumanReviewer:true,
 noAutomaticMaskAcceptance:true,
 releaseAuthorized:false,consumer3DAdmitted:false,familyAlpha:'HOLD'
},null,2)+'\n',{flag:'wx'});
console.log('MAIN44_GENUINE_ORIGINAL_PHOTO_GUIDED_REVIEW_BUILT',
 JSON.stringify({groups:report.tilesCount,sourceWarmEdgeSamples:301,
 originalSourceRGBModified:0,unapprovedP93AlphaModified:0,
 topRegionCounts:report.targets.slice(0,4).map(x=>x.flaggedSourceSamples),
 independentHumanAccepted:false,consumer3D:false,familyAlpha:'HOLD'}));
