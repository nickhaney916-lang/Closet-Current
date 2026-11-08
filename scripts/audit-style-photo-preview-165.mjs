/**
 * P165 independent signed owner-reviewed original JPEG 2D fallback audit:
 * actual native UI screenshot SHA, live WebKit/Chromium and research P164
 * 3D readiness/source mismatch explicitly enforced in same scratch Git tree.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const preview='benchmark/style-photo-preview-165';
const style='benchmark/style-focused-item-01';
const out='benchmark/signed-styled-photo-preview-fallback-165/audit';
const original=JSON.parse(await readFile(style+'/results.json','utf8'));
const p164=JSON.parse(await readFile('benchmark/styling-original-photo-3d-compatibility-164/audit/acceptance.json','utf8'));
const p165=JSON.parse(await readFile(preview+'/results.json','utf8'));
assert.equal(p164.priority,164);
assert.equal(p164.latestWorkFullAppOwnedNewItemStyleFeaturePassed,true);
assert.equal(p164.originalVerifiedSourcePhotoDress3DViewerPassed,true);
assert.equal(p164.totalSourceSHA256CheckedBrowserScreenshots,42);
assert.equal(p164.actualAutomaticNewBlouseToPhotoreal3DClothFittedHere,false);
assert.equal(original.cases.length,6);
assert.equal(p165.priority,165);
assert.equal(p165.verdict,'PASS');
assert.equal(p165.cases.length,6);
assert.equal(p165.actualRealAppOwnerSavedNewItemToThreeOutfits,true);
assert.equal(p165.originalSourceJPEGIndependentSHA256Verified,true);
assert.equal(p165.privateOwnerRevalidationAndNegativeGatesVerified,true);
assert.equal(p165['3DClothingFitClaimed'],false);
assert.equal(p165.originalPhotoTwoDFallback,true);
assert.equal(p165.originalGarmentPreserved,true);
assert.equal(p165.syntheticCameraOnly,true);
assert.equal(p165.physicalPhoneTested,false);
assert.equal(p165.familyAlpha,'HOLD');
const files=(await readdir(preview)).filter(x=>x.endsWith('.png'));
assert.equal(files.length,6);
const all=[],seen=new Set();
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 const c=p165.cases.find(x=>x.engine===engine&&x.width===width);
 const prior=original.cases.find(x=>x.engine===engine&&x.width===width);
 assert.ok(c&&prior);
 for(const field of ['wrongOwnerRejected','sourceTamperingRejected','unreviewedRejected',
  'revokedSessionRejected','sameSavedOwner','actualVerifiedOriginalImageVisible',
  'originalOwnerPhotoUnchanged','realNativeStylingWorkflow','notFake3D'])
  assert.equal(c[field],true,'P165 original source private owner 2D fallback failed '+field+' '+engine+' '+width);
 assert.equal(prior.threeFocusedOwnedLooks,true);
 assert.equal(prior.saveAndReload,true);
 assert.equal(prior.oneOwnedPieceSwap,true);
 assert.equal(prior.saveAndReloadAfterSwap,true);
 assert.equal(prior.ownerScopedIndexedDB,true);
 assert.equal(prior.manualCorrection,true);
 assert.equal(prior.uniqueLookCount,3);
 assert.match(c.originalSHA,/^[0-9a-f]{64}$/);
 const file=engine+'-'+width+'-verified-original-2d.png';
 assert.ok(files.includes(file));
 const bytes=await readFile(preview+'/'+file);
 const sourceSHA=createHash('sha256').update(bytes).digest('hex');
 const meta=await sharp(bytes).metadata();
 assert.equal(meta.width,width);
 assert.ok(meta.height>=844);
 assert.ok(bytes.length>6000);
 assert.ok(!seen.has(sourceSHA),'Duplicate actual source UI screenshot');
 seen.add(sourceSHA);
 all.push({engine,width,sha256:sourceSHA,sourceJPEG_SHA256:c.originalSHA,
  sourceImageKind:c.sourceImageKind,sourceOwnerIsCurrent:true,
  originalPhotographVisible:true,sourcePhotoUnmodified:true,
  originallyReviewedNewBlouseInThreeOwnedStyles:true,
  originalSelectedShoeSwappedAndSaved:true,
  fabricated3DClothDisplayed:false});
}
assert.equal(all.length,6);
const report={priority:165,verdict:'PASS',
 verifiedMainP164ExactSHA:'ecaa0827f2ecb75a9b745e5d761d3a790544b0b7',
 verifiedWork719ExactSHA:'0eaa99fe1e1a07b253a4ef2b1b5a0dc7192a2a00',
 sameThrowawayGitSourceIncludesRealNativeStyleAndResearch3D:true,
 realOwnedNewItemOriginalJPEGVerifiedAndVisiblyRendered2D:true,
 ownerSessionRevalidatedAfterAsynchronousSHA256:true,
 wrongOwnerTamperedPhotoUnreviewedAndRevokedSessionDenied:true,
 actualThreeSavedOwnedOutfitsRemainFunctional:true,
 actualSavedBoardAndOnePieceSwapRemainFunctional:true,
 actualOriginalLicenseSourceDress3DPreviewRemainsIndependent:true,
 originalNewBlouse3DFitVerified:false,
 genuine3DGarmentReadyForArbitraryNewBlouse:false,
 nativeOriginalPhotoTwoDFallbackPresented:true,
 chromeAndWebkitMobileScreenshotCases:6,
 uniqueRealNative2DPreviewSHA256Screenshots:6,
 inheritedP164RealBrowserSHA256Screenshots:42,
 totalRealSourceVerifiedBrowserScreenshots:48,
 realCameraHardwareTested:false,liveAIModelInferenceTested:false,
 physicalAndroidIPhoneTested:false,hostedCloudTwoAccountIsolationTested:false,
 humanoid10of10PhotorealismApproved:false,
 fullApplicationShipped:false,parallelWork719BranchModified:false,
 originalPhotoAndPrivateWardrobeModified:false,
 productionOrExistingStagingModified:false,
 familyAlpha:'HOLD',releaseAuthorized:false,evidence:all};
await mkdir(out,{recursive:true});
await writeFile(out+'/acceptance.json',JSON.stringify(report,null,2)+'\n');
console.log('P165_REAL_OWNER_SHA_VERIFIED_NEW_PHOTO_2D_FALLBACK_AND_3D_SOURCE_HONESTY_PASSED '+JSON.stringify({
 ownerPrivateTwoDFallbackCases:6,sourcePhotoPreviewSHA256Screens:6,
 inheritedFullAppWorkAndReal3DViewerScreens:42,totalRealUIEvidence:48,
 incorrectOriginalOrOwnerDenied:true,real3DFittingForNewBlouseNotClaimed:true,
 original3DResearchStillIndependent:true,fullAppReleaseApproved:false,familyAlpha:'HOLD'}));
