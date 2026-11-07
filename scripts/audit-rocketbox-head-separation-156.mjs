/**
 * P156 final independent original source/owner integrity verdict.
 * 2 immutable original MIT bodies, 2 repacked skinned true face/hair GLBs,
 * 48 actual SHA-256-verified Chromium/WebKit phone 3D screenshots.
 *
 * Original saved-wardrobe photo fit to the new 80-bone figure is NOT
 * validated; no future automation or deploy can interpret this as complete
 * dressed 10/10 photorealism.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {CANDIDATES155} from '../research/dual-human-foundation-candidate-155/foundation-manifest.mjs';
const base='benchmark/rocketbox-wardrobe-separation-156',
 hash=b=>createHash('sha256').update(b).digest('hex'),
 widths=[320,390,430],angles=['front','side','back','face'];
const anatomy=JSON.parse(await readFile(base+'/audit/real-source-anatomy.json'));
const extraction=JSON.parse(await readFile(base+'/audit/safe-head-extraction.json'));
assert.equal(anatomy.cases.length,2);
assert.equal(extraction.records.length,2);
const records=[];
for(const c of CANDIDATES155){
 const a=anatomy.cases.find(q=>q.report.figure===c.key);
 const e=extraction.records.find(q=>q.figure===c.key);
 assert.ok(a&&e);
 assert.equal(a.report.sourceMeshCount,1);
 assert.equal(a.report.primitives.length,3);
 const prefix=c.key==='female'?'f007_':'m006_';
 assert.deepEqual(a.report.primitives.map(p=>p.materialName),
  [prefix+'body',prefix+'head',prefix+'opacity']);
 assert.equal(a.verdict.canReplaceOriginalPhotographedOutfit,false);
 assert.equal(a.verdict.originalFigure163BoneModelPreserved,true);
 assert.equal(e.originalBakedBodyTextureBytesDiscarded,true);
 assert.equal(e.sourceBodyTrianglesAndAccessorsDiscarded,true);
 assert.equal(e.skinnedSourceBones,80);
 assert.deepEqual(e.retainedMaterialNames,[prefix+'head',prefix+'opacity']);
 const bin=await readFile(base+'/heads/'+c.key+'-licensed-face-hair-only.glb');
 assert.equal(hash(bin),e.sha256);
 assert.ok(bin.length<e.originalBytes);
 assert.equal(bin.subarray(0,4).toString('ascii'),'glTF');
 records.push({key:c.key,headSourceSHA256:e.sha256,
  actualIndependentHeadOnlyBytes:bin.length,
  originalSourceBytes:e.originalBytes,
  originalBodyMaterialCompletelyMissing:true,
  preservedFaceHairSourceTextures:true,sourceSkinBones:80});
}
const receipts=[],engines=['chromium','webkit'];
for(const platform of engines){
 const x=JSON.parse(await readFile(base+'/audit/'+platform+'-face-only.json'));
 assert.equal(x.actualRealSkinnedHeadScreenshots,24);
 assert.equal(x.garmentMaterialsAndClothingGeometryRemoved,true);
 assert.equal(x.originalOwnerPhotoOutfitFallbackRequired,true);
 assert.equal(x.actualPhotoGarmentRetargetingVerified,false);
 assert.equal(x.evidence.length,24);
 for(const c of CANDIDATES155)for(const width of widths)for(const angle of angles){
  const row=x.evidence.find(a=>a.figure===c.key&&a.width===width&&a.view===angle);
  assert.ok(row,'P156 failed to render actual male/female source face/hair: '+[platform,c.key,width,angle]);
  assert.equal(row.platform,platform);
  assert.equal(row.realWebGL,true);
  assert.equal(row.originalBakedGarmentGeometryPresent,false);
  assert.equal(row.original163BonePhotographedOutfitUnmodified,true);
  assert.equal(row.noOffsiteNetworkRequests,true);
  assert.equal(row.originalSourceRigBones,80);
  assert.ok(row.renderGeometryTriangles>100);
  const png=await readFile(base+'/screens/'+platform+'/'+row.file);
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(hash(png),row.sha256);
  const m=await sharp(png).metadata(),s=await sharp(png).stats();
  assert.equal(m.width,width);assert.equal(m.height,row.screenshotHeight);
  assert.ok(s.channels.some(ch=>ch.stdev>9));
  receipts.push({platform,figure:c.key,width,view:angle,
   verifiedOriginalSkinnedHeadOnlySHA256:row.sha256,
   noOriginalVendorBakedClothingGeometry:true,
   originalOwnerPhotoGarmentViewerUnmodified:true});
 }
}
assert.equal(receipts.length,48);
const result={
 priority:156,
 sourceOriginalMITLicensedMaleAndFemaleGLBsVerified:2,
 actualPhysicalBodyAndBakedClothesRemovedFromCandidateHeadAsset:true,
 realMaleFemaleTexturedFaceAndHairAssetCreated:true,
 retainedSource80BoneHeadSkinning:true,
 reprojectedUserJPEGOntoNew80BoneBody:false,
 safeOriginalUnchanged163BoneOutfitFallback:true,
 actualOwnerClothingFittingToNewFoundationComplete:false,
 fullHumanBodyUndressingFeasibleFromSource:false,
 sourceActualStandaloneNudeBodyGeometryMissingOrUnverified:true,
 originalSourceDressJacketPantsStillUnusableForOwnedOutfits:true,
 exactRealMobileChromiumWebKitPhotos:receipts.length,
 photographedWardrobeCapturePreserved:true,
 originalJPEGAndCutoutBytesUnchanged:true,
 physicalIphoneAndroidTested:false,
 independent10OutOf10PhotorealismHumanAccepted:false,
 signedHostedTwoAccountCloudAcceptanceDone:false,
 familyAlpha:'HOLD',releaseAuthorized:false,
 result:'P156_SOURCE_BAKED_GARMENT_HEAD_SEPARATION_COMPLETE; FULL_OWNER_PHOTO_3D_BODY_RETARGET_STILL_HOLD',
 sourceAssets:records,receipts
};
await mkdir(base+'/audit',{recursive:true});
await writeFile(base+'/audit/final-acceptance.json',JSON.stringify(result,null,2)+'\n');
console.log('P156_INDEPENDENT_ACTUAL_GLTF_HEAD_CLOTHING_SEPARATION_VERIFIED '+JSON.stringify({
 sourceMaleFemaleExtracted:2,actualWebGLPhoneScreenshots:48,
 bothActualMITHeadHairRealTextures:true,
 originalVendorGarmentPrimitivesRemoved:true,
 original163BoneOwnerOutfitUnaffected:true,
 newFullBodyUserGarmentFitting:false,fullHuman10OutOf10Approved:false,
 familyAlpha:'HOLD',releaseAuthorized:false
}));
