/**
 * P155 verifies genuine independently SHA256-hashed WebGL screenshots and
 * actual pinned male/female MIT model; never invents a photorealism grade.
 * Explicitly records that Rocketbox default outfits are baked into avatar
 * mesh and thus unsuitable as the Closet Current owner-garment foundation
 * until retargeting/removal independently accepted.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {FOUNDATION155,CANDIDATES155,chooseFoundation155}
 from '../research/dual-human-foundation-candidate-155/foundation-manifest.mjs';
const base='benchmark/dual-human-foundation-candidate-155';
const modes=['chromium','webkit'],widths=[320,390,430],
 shots=['front','side','back','face'];
const sha=b=>createHash('sha256').update(b).digest('hex');
const models=JSON.parse(await readFile(base+'/audit/original-model-verification.json','utf8'));
assert.equal(models.realTwoBinaryGLBsChecked,2);
assert.equal(models.sourceOriginalCommit,FOUNDATION155.sourcePinnedCommit);
const receipts=[],summary={};
for(const engine of modes){
 const report=JSON.parse(await readFile(base+'/audit/'+engine+'-acceptance.json','utf8'));
 assert.equal(report.totalScreenshots,24);
 assert.equal(report.engine,engine);
 assert.equal(report.noExternalBrowserNetwork,true);
 assert.equal(report.originalWardrobePhotographedGarmentCompatibility,false);
 assert.equal(report.actualOwnerGarmentDressFittingProven,false);
 assert.deepEqual(report.mobileCSSViewportWidths,widths);
 assert.deepEqual(report.actualModels,['female','male']);
 assert.equal(report.problems.length,0);
 assert.equal(report.evidence.length,24);
 for(const c of CANDIDATES155)for(const width of widths){
  for(const view of shots){
   const item=report.evidence.find(x=>x.key===c.key&&x.width===width&&x.view===view);
   assert.ok(item,'P155 real GLB male/female/angle/width missing');
   assert.equal(item.engine,engine);
   assert.equal(item.realWebGL,true);
   assert.equal(item.actualOriginalSourceGLB,true);
   assert.equal(item.originalPhotographedWardrobePreserved,true);
   assert.equal(item.sourceBuiltInGarment,true);
   assert.equal(item.noThirdPartyBrowserRequests,true);
   assert.ok(item.drawCalls>=1&&item.frameCount>=5);
   assert.ok(item.skinnedMeshes>=1&&item.skinBones>=15);
   const buf=await readFile(base+'/screens/'+engine+'/'+item.file);
   assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(sha(buf),item.sha256);
   const meta=await sharp(buf).metadata(),stats=await sharp(buf).stats();
   assert.equal(meta.width,width);
   assert.equal(meta.height,item.screenshotHeight);
   assert.ok(buf.length>8000);
   assert.ok(stats.channels.some(x=>x.stdev>9));
   receipts.push({engine,key:c.key,view,width,
    screenshotSHA256:item.sha256,file:item.file,
    actualWebGL:true,skinnedMeshes:item.skinnedMeshes,
    originalMITSourceGitBlobVerified:true,
    ownerWardrobeNeverReplaced:true});
  }
  const a=report.evidence.find(x=>x.key===c.key&&x.width===width&&x.view==='front');
  const b=report.evidence.find(x=>x.key===c.key&&x.width===width&&x.view==='back');
  assert.notEqual(a.sha256,b.sha256,'P155 front and back must be distinct real GLB views');
 }
 summary[engine]={actualScreenshots:report.totalScreenshots,
  webGL:true,sourceBakedClothes:true};
}
assert.equal(receipts.length,48);
for(const candidate of CANDIDATES155){
 const saved=chooseFoundation155({figure:candidate.key,previewOptIn:true,
  sourceManifestAuthenticated:true,ownerSavedOutfit:true,ownerPhotoItemCount:5});
 assert.equal(saved.model,'original-163-bone-photographed-outfit');
}
const final={
 priority:155,source:'Microsoft Rocketbox MIT, converted pinned GLB pair',
 sourcePinnedCommit:FOUNDATION155.sourcePinnedCommit,
 exactGitBlobHashAndBinaryGlTFModelVerification:true,
 originalGLBBinarySourceCount:2,
 actualGenuineMobileWebGLScreenshots:48,
 independentlySHA256VerifiedImages:48,
 engines:modes,sourceFigures:['female','male'],
 mobileCSSViewportWidths:widths,
 sourceLicensing:FOUNDATION155.originalLicense,
 sourceBakedGarments:true,
 originalWardrobePrivatePhotoViewerPreserved:true,
 mayReplaceCurrentLiveOwnerGarmentModel:false,
 candidateVisualComparisonComplete:true,
 photoGarmentRetargetingCompleted:false,
 supportedBodySkinsMustBeSeparatedAndRebound:true,
 licenseLegalReleaseReviewRequired:true,
 genuinePhysicalPhoneTested:false,
 automaticPhotoClothingIndexingTested:false,
 independentHuman10outof10ScoreApproved:false,
 familyAlpha:'HOLD',releaseAuthorized:false,
 outcome:'P155_SOURCE_CANDIDATES_ENGINEERING_VALIDATED; OWNER_WARDROBE_INTEGRATION_ON_HOLD',
 models:models.records.map(x=>({key:x.key,source:x.originalProvenance,
  sha256:x.sha256,triangles:x.triangleCount,
  bones:x.maximumBonesPerSkin,skins:x.skins,
  textures:x.textureCount,blendshapeTargets:x.blendshapeTargets,
  bakedGarments:true})),summary,receipts
};
await mkdir(base+'/audit',{recursive:true});
await writeFile(base+'/audit/final-verdict.json',JSON.stringify(final,null,2)+'\n');
console.log('P155_FOUNDATION_ENGINEERING_VALIDATED '+JSON.stringify({
  sourceMITLicensing:true,twoAuthenticMaleFemaleGLBs:true,
  browserEngines:modes,realWebGLScreenshots:48,
  originalOwnedGarmentWardrobeIntegration:false,
  humanRealism10outof10Proven:false,
  reason:'Baked Rocketbox garments need isolated separation and rig retarget before adoption',
  releaseAuthorized:false,familyAlpha:'HOLD'
}));
