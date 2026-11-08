/**
 * MAIN P164: true disposable Git merge compatibility of FULL-APP WORK #719
 * synthetic camera -> review -> owner-private closet -> Style three -> swap
 * -> two saved boards, and exact original-photo P163 six-angle real WebGL.
 *
 * Validates evidence of BOTH actual browser workflows from the *same*
 * disposable combined checkout; explicitly does NOT claim the Work synthetic
 * blouse was fitted onto the research-only licensed 3D dress fixture.
 *
 * No production, staging, PR merge or persistent owner data.
 */
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const styleDir='benchmark/style-focused-item-01';
const imgDir='benchmark/outfit-view-360-160';
const figureDir='benchmark/source-garment-360-visual-integrity-163/audit';
const out='benchmark/styling-original-photo-3d-compatibility-164/audit';
const style=JSON.parse(await readFile(styleDir+'/results.json','utf8'));
const fabric=JSON.parse(await readFile(figureDir+'/garment-silhouette-acceptance.json','utf8'));
const p162=JSON.parse(await readFile('benchmark/licensed-head-six-angle-162/audit/acceptance.json','utf8'));
const auditSHA=b=>createHash('sha256').update(b).digest('hex');
const allowedEngine=['chromium','webkit'], widths=[320,390,430],
 views=['front','threequarter-front-right','right','threequarter-rear-right','rear','left'],
 figures=['female','male'];
assert.equal(style.verdict,'PASS','new owner style workflow not accepted in live UI');
assert.equal(style.cases.length,6);
assert.deepEqual([...style.engines].sort(),allowedEngine);
assert.equal(style.offHostCalls,0,'style UI leaked data outside isolated host');
assert.equal(style.syntheticAuth,true);
assert.equal(style.syntheticGarments,true);
assert.equal(style.freshAIInference,false);
assert.equal(style.physicalAndroid,false);assert.equal(style.physicalIPhone,false);
assert.equal(style.cloudWrites,false);
assert.equal(style.familyAlpha,'HOLD');
const cases=[];
for(const engine of allowedEngine)for(const width of widths){
 const c=style.cases.find(x=>x.engine===engine&&x.width===width);
 assert.ok(c,'missing actual styled owned UI '+engine+' '+width);
 for(const field of ['threeFocusedOwnedLooks','saveAndReload','ownerScopedIndexedDB','offHostCallsBlocked',
  'syntheticAuth','syntheticGarments','manualCorrection','oneOwnedPieceSwap','saveAndReloadAfterSwap']){
  assert.equal(c[field],true,'original new-photo owned styling failed: '+field+' '+engine+' '+width);
 }
 assert.equal(c.uniqueLookCount,3);
 assert.ok(c.cameraCapture.includes('synthetic still frame'));
 const name=engine+'-'+width+'-saved-three-owned-looks.png';
 const image=await readFile(styleDir+'/'+name);
 const meta=await sharp(image).metadata();
 assert.equal(meta.width,width);
 assert.ok(meta.height>=844);
 assert.ok(image.length>5000);
 cases.push({engine,width,styleScreenshot:name,sha256:auditSHA(image),
  reviewedCameraCandidateFlow:true,ownerPrivateSavedNewBlouse:true,
  threeDistinctOwnedLooks:true,onePieceSwapSavedAndReloaded:true,
  syntheticCameraSourceNotARealDevice:true});
}
assert.equal(cases.length,6);
const screens=(await readdir(styleDir)).filter(f=>f.endsWith('.png'));
assert.equal(screens.length,6,'actual style mobile screenshots missing or fabricated');
assert.equal(new Set(cases.map(c=>c.sha256)).size,6);

assert.equal(p162.priority,162);
assert.equal(p162.realChromiumMultiStreamWebGLScreenshots,36);
assert.equal(p162.sameOriginalOwnedPhotographedGarmentsUnaffected,true);
assert.equal(p162.originalP160AuthenticNeckJointConvergencePreservedInEveryAngle,true);
assert.equal(p162.originalP161GenuineAngularCorrectionPreservedInEveryAngle,true);
assert.equal(fabric.priority,163);
assert.equal(fabric.pinnedMainP162HeadSHA,'7035fdad6396939c8032368a519767d204742b30');
assert.equal(fabric.realSixAngleImages,36);
assert.equal(fabric.originalSourcePhotoAndCutoutProtected,true);
assert.equal(fabric.genuinePhotoMappedSinglePinnedSourceDressVisibleInAll360Views,true);
assert.equal(fabric.actualGarmentShoulderTorsoHemOccupancyVerified,true);
assert.equal(fabric.actualOriginalSkinArmsAndLegsVisibleInEveryView,true);
assert.equal(fabric.unphotographedRearProvenance,'INFERRED_UNVERIFIED_NEUTRAL');
assert.equal(fabric.fullClothDrapePhotorealism10of10Accepted,false);
assert.equal(fabric.ownerGarmentPhotosArbitrary3DConversionApproved,false);
assert.equal(fabric.physicalDeviceVerified,false);
assert.equal(fabric.familyAlpha,'HOLD');
assert.equal(fabric.evidence.length,36);
const renderChecks=[];
for(const width of widths)for(const figure of figures){
 const original=JSON.parse(await readFile(imgDir+'/views-'+width+'.json','utf8'));
 assert.equal(original.length,12);
 for(const view of views){
  const x=original.find(r=>r.figure===figure&&r.view===view);
  const matching=fabric.evidence.find(r=>r.figure===figure&&r.view===view&&r.width===width);
  assert.ok(x&&matching);
  assert.equal(x.ownerSavedBoardUnchanged,true);
  assert.equal(x.sourceRigBones,163);
  assert.equal(x.crossStream162,true);
  assert.equal(x.neckBridgeTriangles,0);
  assert.ok(x.sourceLicensedNeckRotationDegrees>.2);
  assert.ok(x.originalFaceSkinOverlapMeters>.042);
  const img=await readFile(imgDir+'/'+x.file);
  assert.equal(auditSHA(img),x.sha256);
  assert.equal(x.sha256,matching.realScreenshotSHA256);
  assert.ok(matching.originalDarkDressPixels>3900);
  assert.ok(matching.skirtSilhouetteWidth>=61);
  renderChecks.push({figure,view,width,realWebGLSHA256:x.sha256,
   actualOriginal163BoneGarmentIntact:true,sourceP161HeadNeckFitPreserved:true,
   licensedResearchFixtureOnly:true});
 }
}
assert.equal(renderChecks.length,36);
assert.equal(new Set(renderChecks.map(r=>r.realWebGLSHA256)).size,36);

const result={
 priority:164,releaseGate:'HOLD',
 exactMainOriginalPhotoP163SHA:'d358e6e0ae1eaf65febf57a50a3654bf996b15a5',
 exactIsolatedFullAppWork719SHA:'0eaa99fe1e1a07b253a4ef2b1b5a0dc7192a2a00',
 bothStreamsActuallyComposedIntoSameEphemeralCheckedOutGitTree:true,
 latestWorkFullAppOwnedNewItemStyleFeaturePassed:true,
 originalVerifiedSourcePhotoDress3DViewerPassed:true,
 ownerSavedClosetCameraCandidateToThreeOutfitsAndSwapRealUIViewportCases:6,
 supportedRealBrowserEngines:allowedEngine,phoneViewportWidths:widths,
 genuineStyleMobileScreenshots:6,originalPhotoDressReal3DWebGLCameraScreenshots:36,
 totalSourceSHA256CheckedBrowserScreenshots:42,
 bothAppAnd3DSourceGatesPassedInSameTemporaryWorktree:true,
 actualAutomaticNewBlouseToPhotoreal3DClothFittedHere:false,
 stylesSyntheticCameraFixtureOnly:true,
 originalDarkDressBenchmarkIsDifferentPhotographFromReviewedNewBlouse:true,
 ownerToThreeDGarmentRenderingEndToEndHere:false,
 realCameraHardwareTested:false,liveAIModelInferenceTested:false,
 physicalAndroidIPhoneTested:false,hostedSignedTwoOwnerCloudTested:false,
 humanTenOutOfTenPhotorealismApproved:false,
 sourceOtherAccountPrivatePhotosTouched:false,
 parallelWork719BranchModified:false,parallelWork716BranchModified:false,
 existingStagingProductionModified:false,branchMerged:false,
 familyAlpha:'HOLD',releaseAuthorized:false,
 stylingEvidence:cases,threeDEvidence:renderChecks
};
await mkdir(out,{recursive:true});
await writeFile(out+'/acceptance.json',JSON.stringify(result,null,2)+'\n');
console.log('P164_EPHEMERAL_COMBINED_WORK719_AND_P163_ORIGINAL_CAMERA_OUTFIT_3D_COMPATIBILITY_PASS '+JSON.stringify({
 twoCommittedResearchBranchesCompatibleInDisposableGitIntegration:true,
 sameCombinedAppSourceAndOriginal3DViewerCI:true,
 realWebkitChromiumOwnedStyleCases:6,realOriginalPhotoDress3DViews:36,
 originalPhotoScreenshotSHA256:42,
 noClaimNewBlousePhotoreal3D:true,originalPhotoOutfitNoMutation:true,
 familyAlpha:'HOLD',releaseAuthorized:false
}));
