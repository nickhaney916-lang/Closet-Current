import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync('.github/workflows/styling-photo3d-compatibility-164-no-deploy.yml','utf8');
const audit=readFileSync('scripts/audit-styling-photo3d-compatibility-164.mjs','utf8');
const report=readFileSync('research/styling-original-photo-3d-compatibility-164/REPORT.md','utf8');
test('P164 bases exact main P163 and pins last verified PR719 without modifying active branch, default, staging or production',()=>{
 for(const sha of ['d358e6e0ae1eaf65febf57a50a3654bf996b15a5',
  '0eaa99fe1e1a07b253a4ef2b1b5a0dc7192a2a00',
  '9c20ed0208d1ba547707e2a8c6fcd542ba327068'])
   assert.ok(workflow.includes(sha),'missing exact independently verified source '+sha);
 assert.ok(workflow.includes('test "$(wc -l </tmp/p164-files)" -eq 4'));
 assert.match(workflow,/git diff --exit-code "\$BASE" HEAD -- public supabase package\.json/);
 assert.ok(report.includes('FAMILY ALPHA')||report.includes('Family Alpha'));
});
test('P164 composes both source streams into a SINGLE real ephemeral Git checkout; no persistent PR merge',()=>{
 assert.equal(workflow.split('merge --no-commit --no-ff "$WORK"').length,3,
  'both original code and original 3D job must test real scratch source merge');
 assert.equal(workflow.split('test "$(git rev-parse -q --verify MERGE_HEAD)" = "$WORK"').length,3);
 assert.equal(workflow.split('test -z "$(git ls-files -u)"').length,3);
 assert.equal(workflow.split('test -z "$(comm -12 <(sort /tmp/p164-work719-source-changes)').length,5,
  'two jobs independently check Work diff against source P163 and unmerged four P164 new files');
 assert.match(workflow,/public\/closet-stylist-engine\.js\|public\/closet-stylist\.js/);
 assert.match(workflow,/tests\/closet-stylist\.test\.cjs/);
});
test('P164 actual combined mobile app tests exercise 3 distinct owned outfits, one owned shoe swap and both boards persisted after synthetic camera review',()=>{
 assert.match(workflow,/node scripts\/test-style-focused-item-browser\.mjs/);
 assert.match(workflow,/node scripts\/build\.mjs/);
 for(const s of ['style.verdict','style.cases.length,6','c.uniqueLookCount,3',
  "'threeFocusedOwnedLooks'","'oneOwnedPieceSwap'","'saveAndReloadAfterSwap'",
  'c.cameraCapture','ownerScopedIndexedDB','offHostCallsBlocked'])
  assert.ok(audit.includes(s),'actual application workflow mandatory: '+s);
 assert.match(audit,/assert\.equal\(meta.width,width\)/);
 assert.match(audit,/assert\.equal\(screens.length,6/);
});
test('P164 source 3D regression uses same disposable Work app tree, 36 genuine license SHA photo images and original 163-bone garments and corrected MIT head',()=>{
 assert.match(workflow,/node scripts\/audit-source-garment-360-163\.mjs/);
 assert.match(workflow,/node scripts\/audit-styling-photo3d-compatibility-164\.mjs/);
 assert.match(audit,/assert\.equal\(p162\.realChromiumMultiStreamWebGLScreenshots,36\)/);
 assert.match(audit,/assert\.equal\(fabric\.realSixAngleImages,36\)/);
 assert.match(audit,/assert\.equal\(renderChecks.length,36\)/);
 assert.match(audit,/assert\.equal\(new Set\(renderChecks\.map\(r=>r\.realWebGLSHA256\)\)\.size,36\)/);
 for(const field of ['x.sourceRigBones,163','x.sourceLicensedNeckRotationDegrees>.2','x.neckBridgeTriangles,0',
  'matching.originalDarkDressPixels>3900','matching.skirtSilhouetteWidth>=61','assert.equal(auditSHA(img),x.sha256)'])
   assert.ok(audit.includes(field),'genuine P163 original photo garment visual proof missing '+field);
});
test('P164 never fabricates direct new blouse 3D garment fitting, live inference, physical smartphone or two owner cloud',()=>{
 for(const field of ['actualAutomaticNewBlouseToPhotoreal3DClothFittedHere:false','ownerToThreeDGarmentRenderingEndToEndHere:false',
  'stylesSyntheticCameraFixtureOnly:true','originalDarkDressBenchmarkIsDifferentPhotographFromReviewedNewBlouse:true',
  'realCameraHardwareTested:false','liveAIModelInferenceTested:false','physicalAndroidIPhoneTested:false',
  'hostedSignedTwoOwnerCloudTested:false','humanTenOutOfTenPhotorealismApproved:false',
  "familyAlpha:'HOLD',releaseAuthorized:false"])
  assert.ok(audit.includes(field),'false cross-stream release or photorealism claim risk '+field);
 assert.ok(report.includes('UNVERIFIED INFERRED NEUTRAL'));
});
test('P164 exact-head CI retains inherited source-original UI 6 + WebGL 36 and artifacts; both Work branch and parallel cloth unmodified',()=>{
 assert.match(workflow,/benchmark\/style-focused-item-01\//);
 assert.match(workflow,/benchmark\/source-garment-360-visual-integrity-163\/audit\/garment-silhouette-acceptance\.json/);
 assert.match(workflow,/benchmark\/styling-original-photo-3d-compatibility-164\/audit\/acceptance\.json/);
 assert.match(workflow,/totalSourceSHA256CheckedBrowserScreenshots,42/);
 assert.match(audit,/parallelWork719BranchModified:false/);
 assert.match(audit,/parallelWork716BranchModified:false/);
 assert.match(audit,/existingStagingProductionModified:false/);
 assert.match(audit,/branchMerged:false/);
});
