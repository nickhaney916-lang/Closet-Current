/**
 * P2-C57 native source photographed 3D dress pixel measurement.
 * Offline, license-pinned original research screenshot artifacts only.
 * Uses exactly P2-C56 immutable 5-phase 3-width source receipts.
 * Does not export images, individual source vertices or owner data.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {
 PHASES57,WIDTHS57,STAGES57,
 comparePhotoPhaseRGB57,summarizeMeasuredPhasePixels57
} from '../research/mission2-source-length/photo-phase-pixel-diff57.mjs';
const folder='benchmark/mission2-real-photo-phases56';
const original=await Promise.all(PHASES57.map(async phase=>{
 const name=folder+'/phase-'+String(phase).replace('.','_')+'.json';
 return JSON.parse(await readFile(name,'utf8'));
}));
for(let i=0;i<PHASES57.length;i++){
 const e=original[i];
 assert.equal(e.schema,'M2-C56-sampled-licensed-original-dress-source-phase');
 assert.equal(e.phase,PHASES57[i]);
 assert.deepEqual(e.actualNativeWebGLWidths,WIDTHS57);
 assert.equal(e.originalDressSourceSHAValidatedByNativeLoader,true);
 assert.equal(e.originalPhotoAndShaderRestUntouched,true);
 assert.equal(e.noReleaseAuthorization,true);
 assert.equal(e.continuousPoseCollisionCertified,false);
 assert.equal(e.physicallySewnSeamsCertified,false);
 assert.equal(e.sourceGeometryReceipts.length,3);
}
const c56=JSON.parse(await readFile(folder+'/five-phase-summary.json','utf8'));
assert.equal(c56.schema,'M2-C56-authentic-licensed-163bone-five-phase-audit');
assert.deepEqual(c56.sampledPhases,PHASES57);
assert.equal(c56.sampledPoseGuardPassed56,true,
 'P2-C57 photographic visual evidence cannot override failed original cloth collision source-phase gate');
assert.equal(c56.releaseAuthorized,false);
const phaseDir=p=>folder+'/screens/phase-'+String(p);
const getReceipt=(phase,width,stage)=>{
 const entry=original[PHASES57.indexOf(phase)].sourceGeometryReceipts.find(
  r=>r.width===width);
 assert.ok(entry);
 const hash=entry.screenshotSHA256[stage];
 assert.match(hash,/^[a-f\d]{64}$/i);
 return hash;
};
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
async function decodedSourcePhotoView(phase,width,stage){
 const path=phaseDir(phase)+'/chromium-'+width+'-'+stage+'.png';
 const bytes=await readFile(path);
 assert.equal(digest(bytes),getReceipt(phase,width,stage),
  'C57 actual SHA-verified native photographed WebGL source frame required');
 const raw=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(raw.info.width,width);
 assert.ok(raw.info.height>=880&&raw.info.height<=8192);
 assert.equal(raw.info.channels,3);
 assert.equal(raw.data.length,raw.info.width*raw.info.height*3);
 return raw;
}
const rows=[];
for(const width of WIDTHS57)
 for(const stage of STAGES57){
  const before=await decodedSourcePhotoView(0,width,stage);
  for(const phase of PHASES57.slice(1)){
   const after=await decodedSourcePhotoView(phase,width,stage);
   assert.equal(after.info.height,before.info.height);
   const diff=comparePhotoPhaseRGB57(before.data,after.data,
    width,before.info.height,{threshold:8});
   rows.push({phase,width,stage,...diff});
  }
 }
const summary=summarizeMeasuredPhasePixels57(rows);
await writeFile(folder+'/five-phase-RGB-difference57.json',
 JSON.stringify(summary,null,2)+'\n');
console.log('M2_C57_REAL_PHOTO_FIVE_PHASE_PIXEL_COUNTS',JSON.stringify({
 viewComparisons:summary.actualSourcePhaseComparisons,
 changedViews:summary.changedSourcePhotoViews,
 changedSideRear:summary.changedSideRearSourcePhotoViews,
 changedFront:summary.changedFrontSourcePhotoViews,
 widthsWithMotion:summary.widthsWithVerifiedMovingSideRear,
 largestChangedRGBPixelsAbove8:summary.largestRGBPixelsChangedAbove8,
 originalPhotoSourceShasVerified:true,releaseAuthorized:false
}));
assert.equal(summary.widthsWithVerifiedMovingSideRear,3,
 'No measured movement at all mobile-width source side/rear views; refuse any alleged cloth motion');
assert.ok(summary.changedSideRearSourcePhotoViews>=3,
 'C57 real photographed source-dress 3D movement must be visibly non-identical on original side/rear screenshots');
