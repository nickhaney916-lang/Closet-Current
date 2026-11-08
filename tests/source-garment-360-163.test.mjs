import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('scripts/audit-source-garment-360-163.mjs','utf8');
const workflow=readFileSync('.github/workflows/source-garment-360-163-no-deploy.yml','utf8');
const report=readFileSync('research/source-garment-360-visual-integrity-163/REPORT.md','utf8');
test('P163 preserves exact verified P162 plus independently verified genuine six-angle female/male 3D original-photo fabric, no source changes',()=>{
 for(const x of ['7035fdad6396939c8032368a519767d204742b30',
  "benchmark/outfit-view-360-160","benchmark/licensed-head-six-angle-162/audit/acceptance.json",
  "sourceP161OriginalLicensedMaleFemaleHeadAndP716GenuineCameraRotationComposed",
  "ownerSavedBoardUnchanged","originalNeckHeadAngleBeforeDegrees",
  "originalFaceSkinOverlapMeters","neckBridgeTriangles"])
  assert.ok(source.includes(x),'must retain inherited true original P162 source proof: '+x);
 assert.ok(source.includes("const widths=[320,390,430],figures=['female','male']"));
 assert.ok(source.includes("'front','threequarter-front-right','right','threequarter-rear-right','rear','left'"));
});
test('P163 tests actual PNG bytes, not screenshots hashes alone; real source dress image contour, torso patch and non-collapsed hem',()=>{
 for(const x of ['sharp(png).removeAlpha().raw()',"assert.equal(hash(png),q.sha256)",
   "fabric>3900&&fabric<12000","bodySeamRows>=30","hemMedian>40",
   "skirtRows>=18","clothWidth>=61&&clothWidth<=150","skirtSilhouetteWidth"])
  assert.ok(source.includes(x),'real fabric shape source test missing '+x);
 assert.ok(!source.includes('createFakeScreenshot'));
});
test('P163 verifies actual body limbs remain exposed, preventing false garment clipping accept',()=>{
 for(const x of ['originalDarkDressPixels','visibleSourceSkinArmPixels',
   'visibleSourceSkinLegPixels','arms>650&&legs>950',
   'originalSourceGarmentFixture','sourceMITHeadSHA256'])
  assert.ok(source.includes(x),'must preserve original photodress and body source '+x);
});
test('P163 rejects viewport CSS-driven malformed garment size; cross-check all 12 identical six-view source at three phone widths',()=>{
 for(const x of ["assert.equal(metrics.length,36)","assert.equal(all.size,36)",
  'max/min<1.035','originalDarkDressPixels',
  'originalSourceHemWidthPixels','comparison:comparisons'])
  assert.ok(source.includes(x),'multi-viewport garment integrity missing '+x);
});
test('P163 source honesty: independently verified original front photo only; rear must remain neutral INFERRED and not claimed real',()=>{
 assert.ok(source.includes('e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019'));
 assert.ok(source.includes("originalRearClothPhotoEvidenceAvailable:false"));
 assert.ok(source.includes("originalRearSurfaceStatus:'unverified-neutral-inferred'"));
 assert.ok(source.includes("unphotographedRearProvenance:'INFERRED_UNVERIFIED_NEUTRAL'"));
 assert.ok(source.includes("fullClothDrapePhotorealism10of10Accepted:false"));
 assert.ok(report.includes('commons-0053'));
 assert.ok(report.includes('unverified-neutral'));
});
test('P163 is exactly four new research files only, no active parallel app work, owner photo, staged or production changes',()=>{
 for(const x of ['BASE=7035fdad6396939c8032368a519767d204742b30',
  'test "$(wc -l </tmp/p163-files)" -eq 4',
  'git diff --exit-code "$BASE" HEAD -- public supabase',
  'node scripts/audit-source-garment-360-163.mjs',
  'P163-real-photo-dress-six-view-coverage',
  "node --test tests/real-face-original-photo-body-graft-157.test.mjs"])
  assert.ok(workflow.includes(x),'exact branch scope, full test or independent silhouette gate missing '+x);
 assert.ok(report.includes('full-app Work PR #719'));
 assert.ok(workflow.includes("familyAlpha,'HOLD'"));
 assert.ok(source.includes("familyAlpha:'HOLD',releaseAuthorized:false"));
});
