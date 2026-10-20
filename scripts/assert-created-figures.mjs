import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {checkCreatedPacket} from '../benchmark/figure-creation/created-figure-gate.mjs';
import {checkProceduralFootwear} from '../benchmark/figure-creation/footwear-contract.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),report=JSON.parse(fs.readFileSync('artifacts/figure-creation/results.json'));
for(const [p,h]of Object.entries(report.pipelineFiles))assert.equal(sha(fs.readFileSync(p)),h);
for(const f of report.figures)for(const [key,suffix]of [['master','-master.png'],['minimum','-1294.png'],['mobile','-mobile.webp'],['phone1x','-phone-647.webp'],['tablet2x','-tablet-1294.webp']])assert.equal(sha(fs.readFileSync('artifacts/figure-creation/delivery/'+f.id+suffix)),f.variants[key].sha256);
for(const candidate of report.figures)checkProceduralFootwear(candidate);
for(const candidate of report.figures){
 const hem=candidate.derivedClothingHem;
 assert.ok(hem&&hem.hemBoundaryVertices>=8&&hem.hemBoundaryMoved>=8,
  'both new figures require actual generated lower-shell hem edits');
 assert.equal(hem.derivedShellOnly,true);
 assert.equal(hem.bodySourceVerticesChanged,false);
 assert.equal(hem.independentAppearanceApproval,false);
 assert.ok(hem.hemZRangeAfter<hem.hemZRangeBefore,
  'measured generated hem contour must be flatter, not just visually asserted');
}
for(const candidate of report.figures){
 const rim=candidate.derivedClothingUpperRim;
 assert.ok(rim&&rim.upperRimVertices>=6&&rim.upperRimMoved>=6,
  'both 3D characters require real source-derived front upper shirt edits');
 assert.ok(rim.upperRimRoughnessBefore>rim.upperRimRoughnessAfter,
  'measured upper-edge local irregularity must actually be reduced');
 assert.ok(rim.upperRimMaxMove<=.0150001);
 assert.equal(rim.frontDerivedShellOnly,true);
 assert.equal(rim.sourceBodyChanged,false);
 assert.equal(rim.sleeveCuffsModified,false);
 assert.equal(rim.neckOpeningReconstructed,false);
 assert.equal(rim.independentAppearanceApproval,false);
}
for(const candidate of report.figures){
 const art=candidate.derivedClothingBinding;
 assert.ok(art&&art.frontSegments>=6&&art.frontSegments<1000,
  'a checked generated collar binding must follow true short shell boundary edges');
 assert.ok(art.bevelRadius>0&&art.bevelRadius<=.002);
 assert.equal(art.unreviewedOriginalArt,true);
 assert.equal(art.bodySourceVerticesChanged,false);
 assert.equal(art.sourcePhotoChanged,false);
 for(const [key,width,height] of [['phone1x',647,1199],['tablet2x',1294,2398]]){
  const asset=candidate.variants[key];
  assert.equal(asset.width,width);assert.equal(asset.height,height);
  assert.equal(asset.fidelity.alphaExact,true);
  assert.equal(asset.fidelity.visibleRgbExact,true);
  assert.equal(asset.fidelity.sourceMasterUnchanged,true);
  assert.equal(asset.iccProfilePresent,true);assert.equal(asset.borderClear,true);
 }
 assert.ok(candidate.variants.phone1x.smallerThanMobileBytes);
 assert.ok(candidate.variants.tablet2x.smallerThanPngBytes);
 assert.equal(candidate.responsiveClarityVerified,true);
}
for(const figure of report.figures){
 const cloth=figure.skinMaterialCorrection;
 assert.ok(cloth&&Number.isInteger(cloth.restoredFaces)&&cloth.restoredFaces>=0,
  'the native body must record corrected wrongly-gray region candidates');
 assert.ok(Number.isInteger(cloth.restoredArmMajorityFaces)&&cloth.restoredArmMajorityFaces>=0);
 assert.ok(cloth.restoredArmMajorityFaces<=cloth.restoredFaces);
 assert.equal(cloth.upstreamBodyTopologyChanged,false);
 assert.equal(cloth.clothFacesSelectedBeforeBodyMaterialRepair,true);
 assert.equal(cloth.onlyDistalRigApprovedSkin,true);
 assert.ok(cloth.restoredFaces>0,
   'both models must restore exposed distal-arm color without deleting the proximal shirt sleeve');
 const sleeve=figure.derivedShortSleeveCut;
 assert.ok(sleeve&&sleeve.sleeveCutFraction>=.6&&sleeve.sleeveCutFraction<=.9,
   'each original adult scene needs real shoulder-to-elbow-length derived sleeve cuts');
 assert.ok(sleeve.newCuffVerticesBySide.L>=8&&sleeve.newCuffVerticesBySide.R>=8,
   'both arms require native interpolated 3D cuff vertices');
 assert.ok(sleeve.newCuffBoundarySegments>=12);
 assert.ok(sleeve.derivedFacesAfter>0&&sleeve.removedOrSplitFaces>12);
 assert.ok(sleeve.derivedFacesAfter<=sleeve.derivedFacesBefore);
 assert.equal(sleeve.originalShellVerticesUnchanged,true);
 assert.equal(sleeve.upstreamBodyChanged,false);
 assert.equal(sleeve.independentFigureArtApproved,false);
 assert.equal(sleeve.cuffCurveOriginalArt,true);
 assert.ok(sleeve.cuffBevelRadius>0&&sleeve.cuffBevelRadius<=.003);
}
assert.deepEqual(report.summary,{fixedCharacters:2,native1941x3597Renders:2,minimum1294x2398Derivatives:2,productionApproved:0,independentVisualApprovals:0,physicalPhones:0,customerImagesUsed:0,externalInferenceCalls:0});
console.log('CREATED_FIGURE_GATE '+JSON.stringify(checkCreatedPacket(report)));
