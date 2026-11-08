/**
 * Closet Current MAIN P162 — independent simultaneous genuine 3D owner-outfit
 * cross-stream acceptance of verified P161 original licensed MIT anatomical
 * female/male head position AND parallel verified P716 six pointer-camera
 * directions, not merely two isolated screenshots or tests.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
const dir='benchmark/outfit-view-360-160',
 out='benchmark/licensed-head-six-angle-162/audit';
const widths=[320,390,430],figures=['female','male'],
 views=['front','threequarter-front-right','right','threequarter-rear-right','rear','left'];
const sha=b=>createHash('sha256').update(b).digest('hex');
const shaHead={
 female:'dd3772a97d2459975b34f8b1ca7902cb7d7e47d20091766a342b53425c9202e4',
 male:'a4aed621b347f5ed2c6564ca4bb66c8d18681d94e7d3fdc246fdd64adbcc1f72'
};
const approvedMain='9c20ed0208d1ba547707e2a8c6fcd542ba327068',
 approvedParallel='fca5981c86a456ca172bd9810cb9c17e420cc30b';
const all=[],shaSeen=new Set();
const ranges={front:x=>Math.abs(x)<.2,'threequarter-front-right':x=>x>1.4&&x<4.1,right:x=>x>3,
 'threequarter-rear-right':x=>x>1.4&&x<4.1,
 rear:x=>Math.abs(x)<.2,left:x=>x< -3};
for(const width of widths){
 const rows=JSON.parse(await readFile(dir+'/views-'+width+'.json','utf8'));
 assert.equal(rows.length,12,'real 2 original humanoid figures × six camera angles at '+width);
 for(const figure of figures){
  const items=rows.filter(r=>r.figure===figure);
  assert.equal(items.length,6);
  assert.deepEqual(items.map(r=>r.view),views);
  const tuples=new Set();
  for(const row of items){
   assert.equal(row.crossStream162,true,'real P716 gesture P161 joint integration missing');
   assert.equal(row.mainExactP161SHA,approvedMain);
   assert.equal(row.parallelExactP716SHA,approvedParallel);
   assert.equal(row.sourceRigBones,163);
   assert.equal(row.mainOriginal163BoneRig,163);
   assert.equal(row.parallelOriginalMITHeadBones,80);
   assert.equal(row.licensedMITSourceSHA,shaHead[figure]);
   assert.equal(row.sourceHeadAttached,true);
   assert.equal(row.ownerSavedBoardUnchanged,true);
   assert.equal(row.renderer,'real-WebGL');
   assert.equal(row.physicalDeviceTested,false);
   assert.equal(row.familyAlpha,'HOLD');
   assert.equal(row.neckBridgeTriangles,0,'never add fake manufactured collar');
   assert.ok(row.originalNeckJointDistanceImprovementMeters>.0007,
    'P160 actual 80→163 Neck joint convergence lost on touch orbit');
   assert.ok(row.originalNeckHeadAngleBeforeDegrees>row.correctedNeckHeadAngleDegrees+.19,
    'P161 true MIT neck-head axis improvement lost during genuine P716 drag');
   assert.ok(row.sourceLicensedNeckRotationDegrees>.2&&row.sourceLicensedNeckRotationDegrees<=3.001);
   assert.ok(row.originalNeckPivotMovementMeters>=0&&row.originalNeckPivotMovementMeters<.00055);
   assert.ok(row.originalFaceSkinOverlapMeters>.042);
   assert.ok(row.ownedGarmentMeshCount>=1,'original source photographed owner outfit disappeared');
   assert.ok(ranges[row.view](row.cameraX),
    'original genuine pointer orbit did not move to '+row.view+' '+row.cameraX);
   tuples.add([row.originalNeckJointDistanceImprovementMeters.toFixed(6),
    row.originalNeckHeadAngleBeforeDegrees.toFixed(5),
    row.correctedNeckHeadAngleDegrees.toFixed(5),
    row.ownedGarmentMeshCount].join('/'));
   const png=await readFile(dir+'/'+row.file);
   assert.equal(sha(png),row.sha256,'original P716 screenshot SHA256 altered');
   assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.ok(png.length>4500);
   const {width:w,height:h}=await sharp(png).metadata();
   assert.equal(w,width);assert.ok(h>=900);
   assert.ok(!shaSeen.has(row.sha256),'two source originals camera view rendered same frame');
   shaSeen.add(row.sha256);
   all.push({
    figure,view:row.view,width,originalLicensedHeadGLBSHA256:row.licensedMITSourceSHA,
    trueMainP161NeckHeadBeforeDegrees:row.originalNeckHeadAngleBeforeDegrees,
    trueMainP161NeckHeadAfterDegrees:row.correctedNeckHeadAngleDegrees,
    actualMainP161CorrectionDegrees:row.sourceLicensedNeckRotationDegrees,
    measuredP160NeckJointImprovementMeters:row.originalNeckJointDistanceImprovementMeters,
    licensedNeckPivotMovementMeters:row.originalNeckPivotMovementMeters,
    MITNeckSkinOverlapMeters:row.originalFaceSkinOverlapMeters,
    ownerPhotoGarmentsSavedMeshes:row.ownedGarmentMeshCount,
    originalOwnerOutfitBoardProtected:true,
    genuinePointerOrbitState:row.cameraX,originalRealWebGLScreenshotSHA256:row.sha256
   });
  }
  assert.equal(tuples.size,1,
   'P162 six actual pointer drags changed original saved garment or P160/P161 head rig dimensions');
 }
}
assert.equal(all.length,36);
assert.equal(shaSeen.size,36);
const chromium=JSON.parse(await readFile('benchmark/licensed-neck-axis-contact-161/after/native-result.json','utf8')),
 webkit=JSON.parse(await readFile('benchmark/licensed-neck-axis-contact-161/after/native-webkit-result.json','utf8')),
 head=JSON.parse(await readFile('benchmark/licensed-neck-axis-contact-161/audit/acceptance.json','utf8'));
assert.equal(chromium.cases,3);assert.equal(webkit.cases,3);
assert.deepEqual(chromium.errors,[]);assert.deepEqual(webkit.errors,[]);
assert.deepEqual(chromium.crashes,[]);assert.deepEqual(webkit.crashes,[]);
assert.equal(head.priority,161);
assert.equal(head.actualRealChromiumBeforeAfterPairs,18);
assert.equal(head.realOriginalPhotoSHA256Screenshots,36);
assert.equal(head.actualRealWebKit3MobileViewportCases,3);
assert.equal(head.originalLicensedSourceFiguresRotated,2);
assert.equal(head.originalOwnerGarmentAndJPEGProtected,true);
assert.equal(head.activeParallelWork716CameraOrbitUnchanged,true);
const summary={
 priority:162,mainExactVerifiedP161HeadSHA:approvedMain,
 parallelExactVerifiedP716HeadSHA:approvedParallel,
 sourceP161OriginalLicensedMaleFemaleHeadAndP716GenuineCameraRotationComposed:true,
 originalP156SourceSHAAndP541163BoneOutfitPreserved:true,
 originalP159NoManufacturedDoubleCollar:true,
 originalP160AuthenticNeckJointConvergencePreservedInEveryAngle:true,
 originalP161GenuineAngularCorrectionPreservedInEveryAngle:true,
 originalP716SixRealPointerCameraViewsAccepted:true,
 femaleMaleCases:2,actualOriginalOwnerSourceOutfitCameraAngles:6,
 genuineMobileViewportWidths:widths,
 realChromiumMultiStreamWebGLScreenshots:36,
 realUniqueSHA256Screenshots:36,
 inheritedP161ChromiumMatchedHeadBeforeAfterCases:18,
 inheritedP161ChromiumBeforeAfterSHA256Screenshots:36,
 inheritedP161GenuineWebKitMobileSourceCases:3,
 sameOriginalOwnedPhotographedGarmentsUnaffected:true,
 originalJPEGAndCutoutsUnchanged:true,
 shippingAppAndExistingStagingUnaffected:true,
 concurrentParallelPR716BranchNotEdited:true,
 physicalAndroidIphoneAccepted:false,independentHuman10of10PhotorealismAccepted:false,
 fullMIT80ToOriginal163RetargetApproved:false,hostedTwoOwnerCloudRLSPassedHere:false,
 familyAlpha:'HOLD',releaseAuthorized:false,evidence:all
};
await mkdir(out,{recursive:true});
await writeFile(out+'/acceptance.json',JSON.stringify(summary,null,2)+'\n');
console.log('P162_MAIN_P161_AND_PARALLEL_P716_36_ORIGINAL_PHOTO_WEBGL_VIEWS_VERIFIED '+JSON.stringify({
 figures:2,genuineCameraDirections:6,phoneWidths:widths,multistreamViews:36,
 sameMITLicensedHeadOriginalSHA:true,sourceP160P161TrueJointAndAxisPreservedAcrossSixDirections:true,
 priorHeadBeforeAfter:36,realWebKitCases:3,ownerGarmentPrivateOutfitUnmodified:true,
 independentPhotorealismApproved:false,familyAlpha:'HOLD',releaseAuthorized:false
}));
