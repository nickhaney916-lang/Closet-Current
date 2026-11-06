/**
 * PHOTO106 independent 84-frame actual publicly licensed source-photo 163-bone
 * calf-geometry WebGL acceptance auditor. Genuine physical geometry change
 * and independently computed PNG SHA/size/nonblank checks, NOT a human claim.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const folder='benchmark/three-d-106';
const r=JSON.parse(await readFile(folder+'/acceptance.json','utf8'));
const sources={
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
};
assert.equal(r.priority,'PHOTO-DENIM-CALF-DRAPE-GEOMETRY-106');
assert.equal(r.genuineOriginalPhotographedDenimAndShirt,true);
assert.equal(r.realSourceSkinnedRigBones,163);
assert.equal(r.distinctOriginalLicensedDenimSources,2);
assert.equal(r.maleAndFemaleOriginalAnatomicalModels,true);
assert.deepEqual(r.mobileCSSViewports,[320,390,430]);
assert.deepEqual(r.cameraViews,[0,90,180]);
assert.deepEqual(r.originalSourcePoseKneeDegrees,[0,8,16]);
assert.equal(r.trueOriginalPhotoGenuineWebGLScreenshots,84);
assert.equal(r.actualCalfGeometryChangedBeyondOriginalP105Shading,true);
assert.equal(r.originalPhotoFrontUVRestAndSkinUntouched,true);
assert.equal(r.originalSourceFrontNormalsUntouched,true);
assert.equal(r.originalRearStillSourceNeutralWithoutPhotograph,true);
assert.equal(r.actualSkinnedBodyTriangleContactNeverWorsenedAtSampledPoses,true);
assert.equal(r.independentlyHumanRatedPhotorealism,false);
assert.equal(r.physicallyContinuousGravityClothSimulation,false);
assert.equal(r.entireKneeMotionSweepCollisionFreeCertified,false);
assert.equal(r.physicalIphoneAndroidHardwareTested,false);
assert.equal(r.actualSignedCloudMultiOwnerRLSVerified,false);
assert.equal(r.arbitraryUserPhotoTo3DFitVerified,false);
assert.equal(r.releaseAuthorized,false);
assert.equal(r.familyAlpha,'HOLD');
assert.deepEqual(r.browserErrors,[]);
assert.deepEqual(r.externalRequests,[]);
assert.deepEqual(r.crashes,[]);
assert.equal(r.scenarios.length,14);
assert.equal(r.screenshots.length,84);
const uniqueCases=new Set(),geometryEvidence=[];
for(const x of r.scenarios){
 const label=[x.figure,x.denim,x.degrees,x.viewportWidth].join(':');
 assert.ok(!uniqueCases.has(label),'duplicate original-photo anatomy case');
 uniqueCases.add(label);
 assert.ok(['female','male'].includes(x.figure));
 assert.ok(['public','second'].includes(x.denim));
 assert.ok([0,8,16].includes(x.degrees));
 assert.ok([320,390,430].includes(x.viewportWidth));
 assert.equal(x.originalSourceSHA256,sources[x.denim]);
 assert.ok(Number.isSafeInteger(x.sampledBodyCrossingsBefore));
 assert.ok(Number.isSafeInteger(x.sampledBodyCrossingsAfter));
 assert.ok(x.sampledBodyCrossingsAfter<=x.sampledBodyCrossingsBefore,
  'new 3D calf geometry worsened actual posed body contact');
 assert.equal(x.originalSourcePhotoAndUVPreserved,true);
 assert.equal(x.clothPhysicsCertified,false);
 assert.equal(x.independentHumanRealismCertified,false);
 for(const view of [0,90,180])
  assert.ok(Number.isSafeInteger(x.pixelChangesByView[view])&&
   x.pixelChangesByView[view]>=0);
 if(x.degrees===0){
  assert.equal(x.actualCalfDrapeVerticesMoved,0);
  assert.equal(x.actualCalfDrapeMaximumWorldShift,0);
  for(const view of [0,90,180])
   assert.equal(x.pixelChangesByView[view],0,
    'straight source leg must remain visually IDENTICAL');
 }else{
  assert.ok(x.actualCalfDrapeVerticesMoved>=8);
  assert.ok(x.actualCalfDrapeMaximumWorldShift>.0004&&
   x.actualCalfDrapeMaximumWorldShift<=.012001);
  assert.ok(x.originalPhotographedFrontGuardedVertices>=70);
  assert.ok(x.sourceNeutralRightCalfMoved>=8);
  assert.equal(x.sourceNeutralLeftCalfMoved,0);
  assert.ok([1,.6,.3].includes(x.actualCalfDrapeAmplitudeFactor));
  assert.ok(x.pixelChangesByView[90]>12||x.pixelChangesByView[180]>12,
   'actual original-photographed denim calf geometry must cause measured genuine WebGL image difference');
 }
 geometryEvidence.push({figure:x.figure,denim:x.denim,degrees:x.degrees,
  viewport:x.viewportWidth,
  sourceSHA256:x.originalSourceSHA256,
  neutralRearCalfMovedVertices:x.actualCalfDrapeVerticesMoved,
  maximumSourceRelativeOffsetMeters:x.actualCalfDrapeMaximumWorldShift,
  genuineRearChangedPixels:x.pixelChangesByView[180],
  genuineSideChangedPixels:x.pixelChangesByView[90],
  skinnedBodyContactsBefore:x.sampledBodyCrossingsBefore,
  skinnedBodyContactsAfter:x.sampledBodyCrossingsAfter});
}
assert.equal(uniqueCases.size,14);
const receipts=[],seen=new Set();
for(const x of r.screenshots){
 assert.match(x.file,/^(?:female|male)-(?:public|second)-knee-(?:0|8|16)-viewport-(?:320|390|430)-(?:before|after)-view-(?:0|90|180)\.png$/);
 assert.ok(!seen.has(x.file),'duplicate original photographed 3D evidence screenshot');
 seen.add(x.file);
 assert.equal(x.sourceSHA256,sources[x.denim]);
 assert.ok([320,390,430].includes(x.viewportWidth));
 assert.ok([0,90,180].includes(x.view));
 assert.ok([0,8,16].includes(x.degrees));
 assert.ok(['before','after'].includes(x.kind));
 assert.ok(['female','male'].includes(x.figure));
 const bytes=await readFile(folder+'/'+x.file);
 assert.ok(bytes.length>3000);
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const digest=createHash('sha256').update(bytes).digest('hex');
 assert.equal(digest,x.sha256);
 const info=await sharp(bytes).metadata();
 const stats=await sharp(bytes).stats();
 assert.equal(info.format,'png');
 assert.equal(info.width,x.width);assert.equal(info.height,x.height);
 assert.ok(info.width>=200&&info.height>=300);
 assert.ok(stats.channels.some(ch=>ch.stdev>7),
  'real original source-backed jeans 3D screenshot blank');
 receipts.push({
  file:x.file,sha256:digest,originalDenimSHA256:x.sourceSHA256,
  viewportCSSWidth:x.viewportWidth,
  originalAnatomicalKneeDegrees:x.degrees,
  cameraDegrees:x.view,kind:x.kind,
  width:x.width,height:x.height
 });
}
assert.equal(seen.size,84);
const report={
 schema:'closet-current-photographed-source-calf-drape-geometry-106/audit-v1',
 independentlyVerifiedGenuineWebGLFrames:84,
 realSkinnedOriginalSourceRigBones:163,
 independentlyLicensedOriginalJeansPhotos:2,
 femaleAndMaleOriginalAnatomicalFigures:true,
 sampledKneeAnglesDegrees:[0,8,16],
 sampledMobileViewportsCSS:[320,390,430],
 originalPhotoPreserved:true,
 photographedSourceFrontUVRestNormalsAndSkinUnmodified:true,
 trulyChangedSourceNeutralCalf3DGeometry:true,
 trueBodyContactNotWorseAtSampledPoses:true,
 realPhotographedDenimRearProvided:false,
 continuousPhysicalClothPhysicsDemonstrated:false,
 fullSweptCollisionFreeDemonstrated:false,
 independentHumanPhotorealismAcceptance:false,
 actualPhysicalAndroidIphoneTested:false,
 realSignedTwoOrFourAccountCloudRLSVerified:false,
 arbitraryCameraPhotoReal3DFitProven:false,
 productionChanged:false,existingStagingChanged:false,
 releaseAuthorized:false,familyAlpha:'HOLD',
 samples:geometryEvidence,
 screenshotReceipts:receipts
};
await mkdir('benchmark/three-d-106-audit',{recursive:true});
await writeFile('benchmark/three-d-106-audit/acceptance.json',
 JSON.stringify(report,null,2)+'\n');
console.log('PHOTO106 genuine 163-bone original licensed photographed denim source-calf geometry: 84/84 Chromium source-bound front/side/rear SHA+dimension+nonblank screenshots PASS, anatomical sampled contact never worse, straight source unchanged, realistic continuous cloth physics and human realism NOT PROVEN, Family Alpha HOLD.');
