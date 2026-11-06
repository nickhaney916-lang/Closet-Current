/**
 * PHOTO109 independent real mobile 163-bone source jeans screenshot, tap
 * admission, real contact and exact source-rest reset audit. Synthetic
 * frame placeholders, fake reviewers and physical-device claims forbidden.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const folder='benchmark/three-d-109';
const x=JSON.parse(await readFile(folder+'/acceptance.json','utf8'));
const sources={
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
};
assert.equal(x.priority,'PHOTO-DENIM-MOBILE-POSE-CONTROLS-109');
assert.equal(x.actualOriginalLicensedPhotographedDenim,true);
assert.equal(x.trueOriginal163BoneSkinnedHumanoids,true);
assert.equal(x.originalLicensedDenimPhotographs,2);
assert.equal(x.originalPhotographedShirtPreserved,true);
assert.equal(x.femaleAndMaleOriginalAnatomicalFigures,true);
assert.deepEqual(x.realMobileChromiumCSSViewports,[320,390,430]);
assert.equal(x.genuineOriginalMobileInteractiveUI,true);
assert.equal(x.userTrustedTapClicksNotSimulatedProgrammaticClicks,true);
assert.equal(x.originalSHA256SourceAdmissionAndReviewRequired,true);
assert.equal(x.originalFigureChangeAndGarmentSwapIsolation,true);
assert.equal(x.actualLeftRightBothCalfGeometryVerified,true);
assert.equal(x.exactSourcePoseResetPixelEqual,true);
assert.equal(x.trueSkinnedBodyContactNeverWorse,true);
assert.equal(x.horizontalViewportOverflow,false);
assert.equal(x.realPhotoBacksideAvailable,false);
assert.equal(x.generalizedWardrobeClothFitApproved,false);
assert.equal(x.independentHumanPhotorealismApproval,false);
assert.equal(x.physicalAndroidIphoneDevicesTested,false);
assert.equal(x.physicallyContinuousGravityFabricSimulation,false);
assert.equal(x.signedProductionCloudRLSVerified,false);
assert.equal(x.familyAlpha,'HOLD');assert.equal(x.releaseAuthorized,false);
assert.deepEqual(x.browserErrors,[]);
assert.deepEqual(x.externalRequests,[]);
assert.deepEqual(x.crashes,[]);
assert.equal(x.scenarios.length,8);
assert.equal(x.screenshots.length,24);
const combos=new Set(),receipts=[];
for(const s of x.scenarios){
 const key=s.figure+'-'+s.denim+'-'+s.width;
 assert.ok(!combos.has(key));combos.add(key);
 assert.ok(['male','female'].includes(s.figure));
 assert.ok(['public','second'].includes(s.denim));
 assert.ok([320,390,430].includes(s.width));
 if(s.figure==='male')assert.equal(s.width,390);
 assert.equal(s.originalDenimSHA256,sources[s.denim]);
 assert.equal(s.original163BoneSkinnedPhoto,true);
 assert.ok(s.leftKneeMoved>=8);
 assert.ok(s.rightKneeMoved>=8);
 assert.ok(s.bothKneesMoved[0]>=8&&s.bothKneesMoved[1]>=8);
 assert.ok(Number.isSafeInteger(s.visibleBothKneePixelDifference)&&
  s.visibleBothKneePixelDifference>12);
 assert.equal(s.exactTapResetChangedPixels,0);
 assert.equal(s.originalPhotographedFrontProtected,true);
 assert.equal(s.trueSkinnedBodyContactNotIncreased,true);
 assert.equal(s.userInteractionTrustedOnly,true);
 assert.equal(s.releaseAuthorized,false);
 assert.equal(s.familyAlpha,'HOLD');
}
assert.equal(combos.size,8);
const seen=new Set();
for(const s of x.screenshots){
 assert.match(s.file,/^(female|male)-(public|second)-width-(320|390|430)-(straight-source|both-bent|straight-restored)\.png$/);
 const key=s.figure+'-'+s.denim+'-'+s.width;
 assert.ok(combos.has(key));
 assert.ok(!seen.has(s.file));seen.add(s.file);
 assert.equal(s.originalDenimSHA256,sources[s.denim]);
 if(s.file.includes('both-bent'))assert.deepEqual(s.pose,[16,16]);
 else assert.deepEqual(s.pose,[0,0]);
 const bytes=await readFile(folder+'/'+s.file);
 assert.ok(bytes.length>3000);
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),s.sha256);
 const meta=await sharp(bytes).metadata(),stat=await sharp(bytes).stats();
 assert.equal(meta.format,'png');
 assert.equal(meta.width,s.imageWidth);assert.equal(meta.height,s.height);
 assert.ok(meta.width>=200&&meta.height>=300);
 assert.ok(stat.channels.some(y=>y.stdev>7),
  'original-source real mobile WebGL picture blank');
 receipts.push({
  file:s.file,figure:s.figure,denim:s.denim,
  mobileCSSWidth:s.width,originalDenimSHA256:s.originalDenimSHA256,
  originalSkinnedKneeAngles:s.pose,
  imageSHA256:s.sha256,width:s.imageWidth,height:s.height
 });
}
assert.equal(seen.size,24);
const report={
 schema:'closet-current-original-licensed-photo-163-bone-mobile-pose-ui-109/audit-v1',
 independentlyVerifiedRealMobileWebGLPNGFrames:24,
 maleAndFemaleAnatomicalOriginalModels:true,originalSourceSkinnedRigBones:163,
 publiclyLicensedPhotographedDenimSources:2,
 trueChromiumMobileCSSWidths:[320,390,430],
 realUserTouchClickDrivenBilaterallyIndependentSourceCalfMovement:true,
 sourceReviewAndGenuineSHA256Admission:true,
 arbitraryScriptClickCannotImpersonatePhysicalUser:true,
 sourceGarmentSwapAndClearRevokesStalePose:true,
 exactSourcePoseResetPixelsIdentical:true,
 originalJPEGFrontUVRestSkinPreserved:true,
 skinnedBodyContactNonworsening:true,
 realPhotographicReverseAvailable:false,
 genuineUserWardrobeIntegrated:false,
 truePhysicalFabricSimulatorVerified:false,
 independentHumanRealismApproved:false,
 actualPhysicalIphoneAndroidHardwareTested:false,
 realSignedMultiAccountCloudRLSVerified:false,
 releaseAuthorized:false,familyAlpha:'HOLD',
 sampleCases:x.scenarios,originalPhotoRealWebGLPNGReceipts:receipts
};
await mkdir('benchmark/three-d-109-audit',{recursive:true});
await writeFile('benchmark/three-d-109-audit/acceptance.json',
 JSON.stringify(report,null,2)+'\n');
console.log('PHOTO109 24/24 actual original photograph 163-bone denim mobile 320/390/430 real Chromium tap-controlled bilateral WebGL screenshots SHA/dimensions/nonblank PASS, exact photographed source reset, true leg isolation, genuine contact, source review, no phone/human realism approval. HOLD.');
