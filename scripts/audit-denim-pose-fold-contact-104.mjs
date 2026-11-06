/**
 * PHOTO104 independent research-only screenshot evidence audit. Only actual
 * original licensed jeans on 163-bone WebGL, not fake visual frames.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const folder='benchmark/three-d-104';
const r=JSON.parse(await readFile(folder+'/acceptance.json','utf8'));
const photos={
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
};
assert.equal(r.priority,'PHOTO-DENIM-POSE-FOLD-CONTACT-104');
assert.equal(r.realWebGL,true);
assert.equal(r.originalRigBones,163);
assert.equal(r.originalPublicLicensedDenimPhotos,2);
assert.equal(r.sourcePhotographedShirtPreserved,true);
assert.equal(r.maleFemaleOriginalAnatomicalModels,true);
assert.equal(r.viewportCSSWidth,390);
assert.deepEqual(r.angles,[0,8,16]);
assert.deepEqual(r.views,[45,90]);
assert.equal(r.screenshotsCount,48);
assert.equal(r.actualVertexDeformationOnSourceNeutralRear,true);
assert.equal(r.sourceJPEGAndVisiblePhotoFrontUnchanged,true);
assert.equal(r.trueSkinnedBodyTriangleContactsSampled,true);
assert.equal(r.poseRestorationExactPixels,true);
assert.equal(r.realTimeMassSpringClothSimulated,false);
assert.equal(r.continuousSweptCollisionVerified,false);
assert.equal(r.customerOwnedGarmentFitVerified,false);
assert.equal(r.independentHumanVisualPhotorealismApproved,false);
assert.equal(r.physicalPhonesVerified,false);
assert.equal(r.realSignedSupabaseCloudVerified,false);
assert.equal(r.releaseAuthorized,false);
assert.equal(r.familyAlpha,'HOLD');
assert.deepEqual(r.browserErrors,[]);
assert.deepEqual(r.externalRequests,[]);
assert.deepEqual(r.crashes,[]);
assert.equal(r.scenarios.length,4);
assert.equal(r.screenshots.length,48);
const combinations=new Set();
for(const c of r.scenarios){
 const combo=c.figure+'-'+c.denim;
 assert.ok(['female','male'].includes(c.figure));
 assert.ok(['public','second'].includes(c.denim));
 assert.ok(!combinations.has(combo));combinations.add(combo);
 assert.equal(c.sourceSHA256,photos[c.denim]);
 assert.deepEqual(c.cases.map(x=>x.degrees),[0,8,16]);
 assert.equal(c.originalSourceRestorationChangedPixels,0);
 assert.equal(c.originalPhotographicFrontUntouched,true);
 assert.equal(c.noUnsupportedRearImage,true);
 assert.equal(c.independentVisualAssessment,'PENDING');
 for(const x of c.cases){
  assert.equal(x.sourcePhotoSHA256,photos[c.denim]);
  assert.equal(x.actualBodyCrossingsAfter<=x.actualBodyCrossingsBefore,true);
  assert.equal(x.originalPhotoAndSkinUnchanged,true);
  if(x.degrees===0){
   assert.equal(x.foldMovedVertices,0);
   assert.equal(x.pixelDelta['45'],0);
   assert.equal(x.pixelDelta['90'],0);
  }else{
   assert.ok(x.foldMovedVertices>=8);
   assert.ok(x.foldMaxWorldShift>.0002&&x.foldMaxWorldShift<=.011001);
   assert.ok(x.originalPhotoFrontVerticesGuarded>=70);
   assert.ok(x.sourceNeutralRearVerticesAffected>=8);
   assert.ok([1,.5,.25].includes(x.foldAmplitudeMultiplier));
   assert.ok(x.pixelDelta['45']>15||x.pixelDelta['90']>15);
  }
 }
}
assert.equal(combinations.size,4);
const unique=new Set(),receipts=[];
for(const shot of r.screenshots){
 assert.match(shot.file,/^(male|female)-(public|second)-knee-(?:0|8|16)-(?:source|fold)-(?:45|90)\.png$/);
 assert.equal(shot.sourceSHA256,photos[shot.denim]);
 assert.ok(['female','male'].includes(shot.figure));
 assert.ok(['source','fold'].includes(shot.kind));
 assert.ok([0,8,16].includes(shot.degrees));
 assert.ok([45,90].includes(shot.view));
 assert.ok(!unique.has(shot.file));unique.add(shot.file);
 const bytes=await readFile(folder+'/'+shot.file);
 assert.ok(bytes.length>3000);
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),shot.sha256);
 const meta=await sharp(bytes).metadata();
 const stats=await sharp(bytes).stats();
 assert.equal(meta.format,'png');
 assert.equal(meta.width,shot.width);
 assert.equal(meta.height,shot.height);
 assert.ok(shot.width>=200&&shot.height>=300);
 assert.ok(stats.channels.some(x=>x.stdev>7),'Original 3D image blank');
 receipts.push({file:shot.file,sourceSHA256:shot.sourceSHA256,
  realKneeDegrees:shot.degrees,view:shot.view,
  originalJPEGUnchanged:true,width:shot.width,height:shot.height,
  sha256:shot.sha256});
}
assert.equal(unique.size,48);
const report={
 schema:'closet-current-photo104-original-163-bone-knee-fold-contact/audit-v1',
 independentlyAuditedWebGLScreenshots:48,
 originalSourceDenimImages:2,figureModels:2,realSkinnedBones:163,
 poseConditionedActualNeutralRearVertices:true,
 immutableOriginalPhotographedFrontUVAndPixels:true,
 sampledRealSkinnedBodyContactNotWorsened:true,
 deterministicSourcePoseReset:true,
 continuousPhysics:false,sweptCollisionFreeProof:false,
 genuineUnphotographedRearArtAvailable:false,
 independentHumanVisualApproved:false,physicalPhonesTested:false,
 actualSignedCloudRLSVerified:false,releaseAuthorized:false,
 familyAlpha:'HOLD',screenshotReceipts:receipts
};
await mkdir('benchmark/three-d-104-audit',{recursive:true});
await writeFile('benchmark/three-d-104-audit/acceptance.json',JSON.stringify(report,null,2)+'\n');
console.log('PHOTO104 48/48 REAL ORIGINAL PUBLIC PHOTO JEANS Chromium 163-bone WebGL sample-fold screenshots SHA/dimension/nonblank PASS; actual nonworsening sampled triangle contacts and source reset PASS. Human visual/fabric physics/phones NOT certified. HOLD.');
