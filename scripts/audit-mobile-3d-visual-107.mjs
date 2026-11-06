/** Independent source-photo, rendered screenshot, contact, and scope audit. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const folder='benchmark/three-d-107',report=JSON.parse(await readFile(folder+'/acceptance.json','utf8'));
const source={public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'};
assert.equal(report.priority,'INDEPENDENT-MOBILE-3D-VISUAL-ACCEPTANCE-107');
assert.equal(report.baseline,'9d7782e358edb20672685fe97af255aca8d0d8b1');
assert.deepEqual(report.cameraAnglesDegrees,[0,45,90,135,180,225,270,315]);
assert.deepEqual(report.kneeAnglesDegrees,[0,16]);assert.deepEqual(report.viewportWidthsCSS,[320,390,430]);
assert.equal(report.rigBones,163);assert.equal(report.originalPhotosPreserved,true);
assert.equal(report.photo106CalfGeometryExercised,true);
assert.equal(report.neutralRearIsUnphotographed,true);assert.equal(report.humanVisualAcceptance,'NOT YET VERIFIED');
assert.equal(report.physicalAndroidAndIphone,'NOT VERIFIED');assert.equal(report.liveSignedCloudRLS,'NOT VERIFIED');
assert.equal(report.releaseAuthorized,false);assert.equal(report.familyAlpha,'HOLD');
assert.ok(report.allScenarios>=384);const keys=new Set(),errors=[];
for(const cycle of report.browserCycles.filter(x=>x.browser==='chromium')){
 assert.equal(cycle.inputAcceptance.rotationResponded,true);
 assert.ok(cycle.inputAcceptance.rotationDeltaDegrees>1);
 assert.equal(cycle.inputAcceptance.zoomResponded,true);
 assert.ok(Math.abs(cycle.inputAcceptance.cameraDistanceAfter-cycle.inputAcceptance.cameraDistanceBefore)>.02);
}
for(const x of report.scenarios){
 const key=[x.browser,x.figure,x.denim,x.kneeDegrees,x.viewportCSSWidth,x.cameraDegrees,x.cycle].join(':');
 assert.ok(!keys.has(key),'duplicate camera/pose/viewport scenario');keys.add(key);
 assert.ok(['chromium','webkit'].includes(x.browser));assert.ok(['female','male'].includes(x.figure));
 assert.ok(['public','second'].includes(x.denim));assert.ok([0,16].includes(x.kneeDegrees));
 assert.ok([320,390,430].includes(x.viewportCSSWidth));assert.ok([0,45,90,135,180,225,270,315].includes(x.cameraDegrees));
 assert.equal(x.sourceSHA256,source[x.denim]);assert.equal(x.rigBones,163);
 assert.ok(x.bodyCrossingSegments<=x.p105BaselineBodyCrossingSegments);
 if(x.kneeDegrees===0){assert.equal(x.rearCalfVerticesMoved,0);assert.equal(x.maxCalfDisplacementMeters,0);}
 else {assert.ok(x.rearCalfVerticesMoved>=8);assert.ok(x.maxCalfDisplacementMeters<=.012001);}
 assert.equal(x.neutralReversePhotograph,false);
 assert.ok(Number.isFinite(x.frameTiming.meanMs)&&x.frameTiming.meanMs>0);
}
assert.equal(report.scenarios.length,report.screenshotReceipts.length);
const seen=new Set();
for(const x of report.screenshotReceipts){
 assert.ok(!seen.has(x.file));seen.add(x.file);
 assert.match(x.file,/^(chromium|webkit)-(female|male)-(public|second)-knee-(0|16)-w-(320|390|430)-angle-(0|45|90|135|180|225|270|315)-cycle-(0|1)\.png$/);
 assert.equal(x.sourceSHA256,source[x.denim]);assert.equal(x.webgl,true);assert.equal(x.renderer&&typeof x.renderer,'string');
 const data=await readFile(folder+'/'+x.file);assert.equal(createHash('sha256').update(data).digest('hex'),x.sha256);
 const img=await sharp(data).metadata(),stats=await sharp(data).stats();
 assert.equal(img.format,'png');assert.equal(img.width,x.width);assert.equal(img.height,x.height);
 assert.ok(img.width>=180&&img.height>=280&&stats.channels.some(c=>c.stdev>7));
}
const chromiumShots=report.screenshotReceipts.filter(x=>x.browser==='chromium');
assert.equal(chromiumShots.length,384);
const review=JSON.parse(await readFile(folder+'/review-manifest.json','utf8'));
assert.equal(review.cases.length,64);assert.match(review.disclosure,/Version labels are withheld/);
assert.equal(Object.hasOwn(review,'versionMapping'),false);
const pairs=new Set();
for(const pair of review.cases){
 assert.ok(!pairs.has(pair.id));pairs.add(pair.id);
 assert.equal(pair.kneeDegrees,16);assert.equal(pair.viewportCSSWidth,390);
 assert.ok([0,45,90,135,180,225,270,315].includes(pair.cameraDegrees));
 assert.equal(pair.sourceSHA256,source[pair.denim]);
 for(const [key,file,expected] of [['A',pair.fileA,pair.sha256A],['B',pair.fileB,pair.sha256B]]){
  assert.match(file,/^review-blinded\/case-\d{3}-[AB]\.png$/);
  const bytes=await readFile(folder+'/'+file);assert.equal(createHash('sha256').update(bytes).digest('hex'),expected);
  const meta=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
  assert.equal(meta.format,'png');assert.ok(meta.width>=180&&meta.height>=280);
  assert.ok(stats.channels.some(c=>c.stdev>7));
 }
}
const perf=report.scenarios.filter(x=>x.browser==='chromium').map(x=>x.frameTiming.meanMs).sort((a,b)=>a-b);
const median=perf[Math.floor(perf.length/2)],p95=perf[Math.floor(perf.length*.95)];
const result={schema:'closet-current-independent-mobile-3d-visual-acceptance-107/v1',
 independentlyHashedGenuineWebGLScreenshots:seen.size,chromiumScreenshots:chromiumShots.length,
 webkitScreenshots:report.screenshotReceipts.length-chromiumShots.length,
 blindedReviewPairs:review.cases.length,blindedReviewImages:review.cases.length*2,
 sourcePhotographs:[{key:'public',sha256:source.public},{key:'second',sha256:source.second}],
 anatomicalFigures:['female','male'],rigBones:163,cameraAnglesDegrees:report.cameraAnglesDegrees,
 kneeAnglesDegrees:report.kneeAnglesDegrees,viewportWidthsCSS:report.viewportWidthsCSS,
 bodyIntersectionCountsNotWorsenedVsP105BaselineAtEverySample:true,measuredPhoto106RearCalfGeometryRecorded:true,
 measuredChromiumAnimationFrameMs:{median:+median.toFixed(3),p95:+p95.toFixed(3),samples:perf.length},
 browserCrashes:report.browserCrashes,externalRequests:report.externalRequests,
 chromiumDirectDragAndZoomVerified:true,
 webglContextRecoveryOnPhysicalHardware:false,memoryGrowth:report.browserCycles.map(x=>({browser:x.browser,figure:x.figure,
  cycle:x.cycle,heapDeltaBytes:x.heapDeltaBytes,sceneClosed:x.sceneClosed})),
 photographedRearImageProvided:false,humanVisualAcceptance:'NOT YET VERIFIED',physicalPhones:'NOT VERIFIED',
 realSignedCloudRLS:'NOT VERIFIED',generalizedUserPhotoFitting:'NOT VERIFIED',continuousFabricPhysics:'NOT VERIFIED',
 releaseAuthorized:false,familyAlpha:'HOLD'};
await mkdir('benchmark/three-d-107-audit',{recursive:true});
await writeFile('benchmark/three-d-107-audit/acceptance.json',JSON.stringify(result,null,2)+'\n');
console.log('P107_INDEPENDENT_IMAGE_CONTACT_PERFORMANCE_AUDIT',JSON.stringify({
 screenshots:result.independentlyHashedGenuineWebGLScreenshots,chromium:result.chromiumScreenshots,webkit:result.webkitScreenshots,
 angles:result.cameraAnglesDegrees,viewports:result.viewportWidthsCSS,knees:result.kneeAnglesDegrees,
 measuredFrameMs:result.measuredChromiumAnimationFrameMs,contactRegression:false,familyAlpha:'HOLD'}));
