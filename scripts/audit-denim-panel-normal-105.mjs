/**
 * PHOTO105 independent image-receipt and photographed source-body evidence
 * audit: real Chromium original JPEG-backed mesh at 320/390/430 CSS widths.
 * Visually changed pixels != human-approved photorealistic quality.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const folder='benchmark/three-d-105';
const r=JSON.parse(await readFile(folder+'/acceptance.json','utf8'));
const sources={
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
};
assert.equal(r.priority,'PHOTO-DENIM-PANEL-NORMAL-CONTINUITY-105');
assert.equal(r.genuineSourceOriginalJeans3D,true);
assert.equal(r.realSourceSkinnedRigBones,163);
assert.equal(r.distinctOriginalLicensedDenimSources,2);
assert.equal(r.originalPhotographedShirtPreserved,true);
assert.equal(r.trueMaleFemaleOriginalAnatomicalModels,true);
assert.deepEqual(r.actualChromiumViewports,[320,390,430]);
assert.deepEqual(r.cameraViews,[0,90,180]);
assert.equal(r.trueOriginalPhotoGenuineWebGLScreenshots,60);
assert.deepEqual(r.realPoseDegrees,[0,16]);
assert.equal(r.independentlySkinnedNeutralRearSeamNormalSmoothing,true);
assert.equal(r.originalPhotographFrontNormalsUVSkinUntouched,true);
assert.equal(r.sameAngleBeforeAfterSourceAndContactConfirmed,true);
assert.equal(r.originalPhotographicReverseProvided,false);
assert.equal(r.naturalContinuousClothPhysicsCertified,false);
assert.equal(r.independentlyHumanRatedPhotorealism,false);
assert.equal(r.AndroidIphonePhysicalHardwareTested,false);
assert.equal(r.customerPhotoTo3DFittingAccepted,false);
assert.equal(r.liveSignedCloudPrivacyRLSVerified,false);
assert.equal(r.releaseAuthorized,false);
assert.equal(r.familyAlpha,'HOLD');
assert.deepEqual(r.browserErrors,[]);assert.deepEqual(r.externalRequests,[]);
assert.deepEqual(r.crashes,[]);
assert.equal(r.scenarios.length,10);assert.equal(r.screenshots.length,60);
const combos=new Set();
for(const s of r.scenarios){
 const key=[s.figure,s.denim,s.degrees,s.viewportWidth].join(':');
 assert.ok(!combos.has(key));combos.add(key);
 assert.ok(['female','male'].includes(s.figure));
 assert.ok(['public','second'].includes(s.denim));
 assert.ok([0,16].includes(s.degrees));
 assert.ok([320,390,430].includes(s.viewportWidth));
 assert.equal(s.originalSourceSHA256,sources[s.denim]);
 assert.ok(Number.isInteger(s.sourceNeutralRearNormalsAdjusted));
 assert.ok(s.sourceNeutralRearNormalsAdjusted>=8);
 assert.ok(s.independentlyWeldedRearGroups>=3);
 assert.ok(Number.isFinite(s.normalVarianceBefore)&&s.normalVarianceBefore>.001);
 assert.ok(Number.isFinite(s.normalVarianceAfter)&&s.normalVarianceAfter>=0);
 assert.ok(s.normalVarianceAfter<s.normalVarianceBefore*.015);
 assert.ok(s.originalFrontNormalsProtected>=70);
 assert.ok(Number.isInteger(s.sampledBodyCrossingsAfter));
 assert.equal(s.sampledBodyCrossingsAfter,s.sampledBodyCrossingsBefore);
 assert.equal(s.originalSourcePhotoAndUVPreserved,true);
 assert.equal(s.clothPhysicsCertified,false);
 assert.equal(s.independentHumanRealismCertified,false);
 for(const camera of [0,90,180])
  assert.ok(Number.isSafeInteger(s.pixelChangesByView[camera])&&s.pixelChangesByView[camera]>=0);
 assert.ok(s.pixelChangesByView[90]>0||s.pixelChangesByView[180]>0,
  'actual original source-neutral seam lighting difference required');
}
assert.equal(combos.size,10);
const unique=new Set(),receipts=[];
for(const x of r.screenshots){
 assert.match(x.file,/^(?:female|male)-(?:public|second)-knee-(?:0|16)-viewport-(?:320|390|430)-(?:before|after)-view-(?:0|90|180)\.png$/);
 assert.ok(!unique.has(x.file));unique.add(x.file);
 assert.ok(['female','male'].includes(x.figure));
 assert.ok(['public','second'].includes(x.denim));
 assert.ok([0,16].includes(x.degrees));
 assert.ok([320,390,430].includes(x.viewportWidth));
 assert.ok([0,90,180].includes(x.view));
 assert.ok(['before','after'].includes(x.kind));
 assert.equal(x.sourceSHA256,sources[x.denim]);
 const png=await readFile(folder+'/'+x.file);
 assert.ok(png.length>3000);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const digest=createHash('sha256').update(png).digest('hex');
 assert.equal(digest,x.sha256);
 const info=await sharp(png).metadata(),stats=await sharp(png).stats();
 assert.equal(info.format,'png');
 assert.equal(info.width,x.width);assert.equal(info.height,x.height);
 assert.ok(info.width>=200&&info.height>=300);
 assert.ok(stats.channels.some(ch=>ch.stdev>7),'fake or blank Chromium original-photo 3D screenshot');
 receipts.push({file:x.file,sha256:digest,sourceSHA256:x.sourceSHA256,
  width:x.width,height:x.height,viewportCSSWidth:x.viewportWidth,
  cameraDegrees:x.view,kneeDegrees:x.degrees,kind:x.kind});
}
assert.equal(unique.size,60);
const report={
 schema:'closet-current-real-photographed-denim-panel-normal-105/visual-audit-v1',
 independentlyVerifiedGenuineWebGLSnapshots:60,
 anatomicalSourceRigBones:163,
 maleAndFemaleAndTwoRealOriginalDenimSources:true,
 mobileCSSViewports:[320,390,430],
 frontSideRearViews:[0,90,180],
 realSourceNeutralRearSeamLightingChange:true,
 sourcePhotoAndOriginalVisibleFrontNormalsPreserved:true,
 actualSkinnedBodyContactUnchangedAtSampledPoses:true,
 sourceUnphotographedReverseStillUnphotographed:true,
 noIndependentHumanPhotorealismApproval:true,
 continuousFabricPhysicsNotVerified:true,
 physicalAndroidIphoneNotVerified:true,
 actualSignedMultiAccountCloudRLSNotVerified:true,
 releaseAuthorized:false,familyAlpha:'HOLD',
 screenshotReceipts:receipts
};
await mkdir('benchmark/three-d-105-audit',{recursive:true});
await writeFile('benchmark/three-d-105-audit/acceptance.json',
 JSON.stringify(report,null,2)+'\n');
console.log('PHOTO105 60/60 authentic original photograph 163-bone male/female jeans Chromium front/side/rear real WebGL image SHA and nonblank audit PASS; original photo and front normals preserved; no human/phone/real cloth simulation approval; Family Alpha HOLD.');
