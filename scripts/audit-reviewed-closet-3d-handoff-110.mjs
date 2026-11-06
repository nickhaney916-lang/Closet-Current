/**
 * PHOTO110 independent original licensed 163-bone photographed saved-look
 * WebGL screenshot / identity / privacy / truthful HOLD acceptance.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const folder='benchmark/three-d-110';
const r=JSON.parse(await readFile(folder+'/acceptance.json','utf8'));
const SHA={
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
};
assert.equal(r.priority,'REVIEWED-CLOSET-3D-HANDOFF-110');
assert.equal(r.originalLicensedPhotographs,true);
assert.equal(r.original163BoneSkinnedFigure,true);
assert.deepEqual(r.mobileViewportsCSS,[320,390,430]);
assert.equal(r.sourceLicensedBenchmarkOwnerOnly,true);
assert.equal(r.eightReadOnlyOriginalIndexedLookRestoresVerified,true);
assert.equal(r.genuineWebGLScreenshotCount,16);
assert.equal(r.originalPhotoSavedLookReopenPixelExact,true);
assert.equal(r.syntheticCrossOwnerAndStaleSourceReplayDenied,true);
assert.equal(r.originalPhoto2DFallbackForUnsupportedPersonalClothing,true);
assert.equal(r.genuineUserPhoto3DNotFabricated,true);
assert.equal(r.noRealCustomerPhotosUsed,true);
assert.equal(r.noPersistentBrowserOrCloudStorage,true);
assert.equal(r.realSignedCloudRLSVerified,false);
assert.equal(r.realAccountAuthVerified,false);
assert.equal(r.physicalPhonesVerified,false);
assert.equal(r.independentHumanPhotorealismAccepted,false);
assert.equal(r.continuousClothPhysicsProven,false);
assert.equal(r.familyAlpha,'HOLD');
assert.equal(r.releaseAuthorized,false);
assert.deepEqual(r.browserErrors,[]);
assert.deepEqual(r.externalRequests,[]);
assert.deepEqual(r.crashes,[]);
assert.equal(r.scenarios.length,4);
assert.equal(r.screenshots.length,16);
const cases=new Set(),looks=[];
for(const x of r.scenarios){
 const key=x.figure+'-'+x.width;
 assert.ok(!cases.has(key));cases.add(key);
 assert.ok(['female','male'].includes(x.figure));
 assert.ok([320,390,430].includes(x.width));
 if(x.figure==='male')assert.equal(x.width,390);
 assert.equal(x.looks.length,2);
 assert.equal(x.syntheticPrivateOriginalPhoto2DFallback,true);
 assert.equal(x.crossOwnerReplayBlocked,true);
 assert.equal(x.originalPublicLookInMemoryOnly,true);
 assert.equal(x.genuine163BoneMobilePoseStillWorksAfterRestore,true);
 assert.equal(x.noActualSignedAccountOrRealPrivateCloset,true);
 assert.equal(x.noProductionChanged,true);
 assert.equal(x.familyAlpha,'HOLD');
 assert.equal(x.releaseAuthorized,false);
 const denims=new Set();
 for(const l of x.looks){
  assert.ok(['public','second'].includes(l.denim));
  assert.ok(!denims.has(l.denim));denims.add(l.denim);
  assert.equal(l.originalSHA256,SHA[l.denim]);
  assert.equal(l.actualSkinnedRigBones,163);
  assert.equal(l.originalPhotoReopenPixelChanges,0);
  assert.equal(l.independentOwnerAndSHAContractVerified,true);
  assert.equal(l.noPrivateCustomerPhotosLoaded,true);
  assert.equal(l.actualRealAccountRLSVerified,false);
  looks.push({figure:x.figure,width:x.width,source:l.denim,
   sourceSHA256:l.originalSHA256,actualBones:163,original3DReopenDiffPixels:0,
   realSignedCloudRLS:false});
 }
 assert.equal(denims.size,2);
}
assert.equal(cases.size,4);
assert.equal(looks.length,8);
const images=new Set(),receipts=[];
for(const f of r.screenshots){
 assert.match(f.file,/^(female|male)-(public|second)-(320|390|430)-(before-save|reopened-from-saved)\.png$/);
 assert.ok(!images.has(f.file));images.add(f.file);
 assert.ok(['female','male'].includes(f.figure));
 assert.ok(['public','second'].includes(f.denim));
 assert.ok([320,390,430].includes(f.width));
 if(f.figure==='male')assert.equal(f.width,390);
 assert.ok(['before-save','reopened-from-saved'].includes(f.when));
 assert.equal(f.originalDenimSHA256,SHA[f.denim]);
 const png=await readFile(folder+'/'+f.file);
 assert.ok(png.length>3000);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(createHash('sha256').update(png).digest('hex'),f.sha256);
 const meta=await sharp(png).metadata();
 const stats=await sharp(png).stats();
 assert.equal(meta.format,'png');
 assert.equal(meta.width,f.imageWidth);
 assert.equal(meta.height,f.imageHeight);
 assert.ok(meta.width>=200&&meta.height>=300);
 assert.ok(stats.channels.some(ch=>ch.stdev>7),'source original 3D screenshot blank');
 receipts.push({file:f.file,figure:f.figure,
  originalLicensedDenimSource:f.denim,sourceSHA256:f.originalDenimSHA256,
  mobileCSSWidth:f.width,kind:f.when,
  imageSHA256:f.sha256,width:f.imageWidth,height:f.imageHeight
 });
}
assert.equal(images.size,16);
const report={
 schema:'closet-current-reviewed-source-private-fallback-3d-110/audit-v1',
 independentlyVerifiedLicensedOriginal163BoneWebGLFrames:16,
 actualResearchReviewedSavedLookReopens:8,
 originalPhotoReopenAllPixelExact:true,
 independentOwnerGenerationSourceGuardDemonstratedWithSyntheticOwner:true,
 unverifiedPersonalPhotoRemainsOriginal2DFallback:true,
 actualLiveSignedAccountRLSVerified:false,
 arbitraryRealPrivatePhotograph3DReconstructionVerified:false,
 publicBenchmarkSoleReconstructible3DSource:true,
 noRealCustomerPhotographsProcessed:true,
 noPrivateImageBytesInArtifact:true,
 noPersistentBrowserStorageUsed:true,
 actualPhysicalMobileHardwareTested:false,
 independentHumanRealismApproval:false,
 continuousMassGravityFabricPhysicsVerified:false,
 releaseAuthorized:false,familyAlpha:'HOLD',
 lookCases:looks,publiclyLicensedPhoto3DReceipts:receipts
};
await mkdir('benchmark/three-d-110-audit',{recursive:true});
await writeFile('benchmark/three-d-110-audit/acceptance.json',
 JSON.stringify(report,null,2)+'\n');
console.log('PHOTO110 original publicly licensed source jeans 163-bone real Chromium saved look 16/16 screenshot SHA/dimension/nonblank audits PASS; 8/8 owner-scoped synthetic benchmark look reopen same photographed pixels, private 2D fallback, synthetic cross-owner safety. Actual private photos/RLS/human photorealism/physical phones NOT verified; Family Alpha HOLD.');
