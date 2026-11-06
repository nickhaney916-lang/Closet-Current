#!/usr/bin/env node
/** PHOTO103 independent actual original photo denim 163-bone visual evidence.
 * The 44 Chromium PNGs prove bounded sampled pose response and intact
 * SHA-bound source mapping; NOT temporal physics or visual realism acceptance.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/three-d-103';
const r=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
const sha={
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
};
assert.equal(r.priority,'PHOTO-DENIM-INTERMEDIATE-KNEE-103');
assert.equal(r.genuineCC0Original3D,true);
assert.equal(r.actualAnatomicalBones,163);
assert.equal(r.originalDenimAndShirtSourcePhotosVerified,true);
assert.equal(r.originalPhotoBytesPreserved,true);
assert.equal(r.originalPhotoUVAndSkinPreserved,true);
assert.equal(r.realAnatomicalSkinnedPhotoDenimIntermediateMotion,true);
assert.equal(r.distinctOriginalDenimSources,2);
assert.equal(r.maleAndFemaleVerified,true);
assert.equal(r.viewportCSSWidth,390);
assert.deepEqual(r.sourcePosesDegrees,[0,4,8,12,16]);
assert.deepEqual(r.cameraAngles,[45,90]);
assert.equal(r.realBrowser,'Chromium');
assert.equal(r.screenshotCount,44);
assert.equal(r.realSkinnedBodyGarmentTriangleContactsMeasured,true);
assert.equal(r.contactsAcrossEntireSweptIntervalCertified,false);
assert.equal(r.physicallySimulatedGravityCloth,false);
assert.equal(r.humanPhotorealismApproved,false);
assert.equal(r.physicalAndroidIphoneTested,false);
assert.equal(r.realCustomerPhotosFitted,false);
assert.equal(r.realSignedCloudRLSVerified,false);
assert.equal(r.releaseAuthorized,false);
assert.equal(r.familyAlpha,'HOLD');
assert.deepEqual(r.browserErrors,[]);
assert.deepEqual(r.externalRequests,[]);
assert.deepEqual(r.rendererCrashes,[]);
assert.equal(r.rows.length,4);
assert.equal(r.comparisons.length,4);
assert.equal(r.screenshots.length,44);
for(const row of r.rows){
 assert.ok(['female','male'].includes(row.figure));
 assert.ok(['public','second'].includes(row.denim));
 assert.equal(row.sourceSHA256,sha[row.denim]);
 assert.equal(row.samples.length,5);
 assert.deepEqual(row.samples.map(x=>x.left),[0,4,8,12,16]);
 for(const s of row.samples){
  assert.equal(s.right,0);
  assert.equal(s.sourceSHA256,sha[row.denim]);
  assert.equal(s.originalUVUnchanged,true);
  assert.ok(Number.isSafeInteger(s.intersections)&&s.intersections>=0);
 }
 assert.ok(Number.isSafeInteger(row.bothKneesIntersectingSegments));
 assert.equal(row.fullSweptContactCertified,false);
 assert.equal(row.originalSourceUnchanged,true);
}
for(const pair of r.comparisons){
 assert.equal(pair.genuine163BoneSourceSkinnedMotion,true);
 assert.equal(pair.photographedSourceOriginalSHA256,sha[pair.denim]);
 assert.ok(pair.sourceToSixteenChangedPixels>30);
 assert.ok(pair.sourceRelativeResetChangedPixels<1000);
 assert.equal(pair.originalPhotoMappingBytePreserved,true);
 assert.equal(pair.humanRealismApproval,'PENDING');
}
const seen=new Set(),audit=[];
for(const p of r.screenshots){
 assert.match(p.file,/^(female|male)-(public|second)-(?:knee-(?:0|4|8|12|16)|both-16)-view-(?:45|90)\.png$/);
 assert.ok(!seen.has(p.file));seen.add(p.file);
 assert.ok(['female','male'].includes(p.figure));
 assert.equal(p.sourceSHA256,sha[p.denim]);
 assert.equal(p.view===45||p.view===90,true);
 const image=await readFile(dir+'/'+p.file);
 assert.ok(image.length>3000);
 assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(createHash('sha256').update(image).digest('hex'),p.sha256);
 const info=await sharp(image).metadata(),stats=await sharp(image).stats();
 assert.equal(info.format,'png');assert.equal(info.width,p.width);
 assert.equal(info.height,p.height);
 assert.ok(info.width>=200&&info.height>=300);
 assert.ok(stats.channels.some(ch=>ch.stdev>7),'Original source 3D screenshot blank');
 audit.push({file:p.file,sourceSHA256:p.sourceSHA256,
  pose:p.leftDegrees,view:p.view,width:p.width,height:p.height,sha256:p.sha256});
}
assert.equal(seen.size,44);
const report={
 schema:'closet-current-source-photo-163-bone-denim-knee-103/audit-v1',
 acceptedGenuineWebGLChromiumFrames:44,
 maleFemaleAndTwoGenuineSources:true,realRigBones:163,
 sampledIntermediatePoseAngles:[0,4,8,12,16],
 auditedRealBodySkinnedDenimTriangleContacts:true,
 noSweptCollisionClaims:true,noDynamicClothPhysicsClaims:true,
 noUnphotographedRearFabricInvented:true,originalSourceJPEGProtected:true,
 realHumanVisualAcceptance:false,physicalPhonesTested:false,
 actualSignedCloudRLSVerified:false,releaseAuthorized:false,
 familyAlpha:'HOLD',screenshotReceipts:audit
};
await mkdir('benchmark/three-d-103-audit',{recursive:true});
await writeFile('benchmark/three-d-103-audit/acceptance.json',JSON.stringify(report,null,2)+'\n');
console.log('PHOTO103 actual licensed original 163-bone photographed denim intermediate knee pose sampling: 44/44 Chromium screenshots SHA/dimensions/nonblank PASS; source photo unchanged, contact samples measured. No real visual/phone acceptance. HOLD.');
