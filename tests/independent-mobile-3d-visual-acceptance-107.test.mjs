import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const script=readFileSync('scripts/test-mobile-3d-visual-107.mjs','utf8');
const audit=readFileSync('scripts/audit-mobile-3d-visual-107.mjs','utf8');
const report=readFileSync('research/independent-mobile-3d-visual-acceptance-107/REPORT.md','utf8');
const workflow=readFileSync('.github/workflows/independent-mobile-3d-visual-acceptance-107-no-deploy.yml','utf8');
test('P107 exact accepted baseline and source originals stay pinned',()=>{
 for(const x of ['9d7782e358edb20672685fe97af255aca8d0d8b1',
  'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
  'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'])assert.ok(script.includes(x));
 assert.match(report,/this benchmark now independently incorporates and retests it/);
});
test('P107 covers all requested camera angles, mobile widths, humanoids, garments and poses',()=>{
 for(const x of ['[0,45,90,135,180,225,270,315]','[320,390,430]','[0,16]',
  "['female','male']","['public','second']",'384'])assert.ok(script.includes(x),x);
 assert.match(script,/for\(let cycle=0;cycle<2;cycle\+\+\)/);
 assert.match(script,/cameraDegrees:view/);assert.match(script,/viewportCSSWidth:width/);
});
test('P107 verifies genuine WebGL, photographed source, swaps, pose restore, resize and cleanup',()=>{
 for(const x of ['getContext(\'webgl2\')||c.getContext(\'webgl\')','cc105KneeStep','cc106CalfDrape',
  'photographedDenimCalfDrapeGeometry106','originalSourcePhotographAndUVRestSkinProtected106',
  'p105BaselineBodyCrossingSegments','page.locator(\'#swap\')','setViewportSize','sceneClosed:true','context.close()'])
  assert.ok(script.includes(x),x);
 assert.match(script,/root\.matches\('canvas'\)\?root:root\.querySelector\('canvas'\)/);
 assert.match(script,/page\.mouse\.move\(box\.x\+box\.width\*\.72/);
 assert.match(script,/page\.mouse\.wheel\(0,-180\)/);
 assert.match(script,/cameraDistance:app\.getState\(\)\.cameraDistance/);
 assert.match(script,/calf\.contactBefore,baseline\.actualSkinnedDenimBodyCrossingSegments77/);
});
test('P107 does not send external photo requests or represent phones/human ratings as verified',()=>{
 assert.match(script,/if\(!r\.url\(\)\.startsWith\(host\)/);
 for(const x of ['humanVisualAcceptance:\'NOT YET VERIFIED\'','physicalAndroidAndIphone:\'NOT VERIFIED\'',
  'liveSignedCloudRLS:\'NOT VERIFIED\'','releaseAuthorized:false','familyAlpha:\'HOLD\''])assert.ok(script.includes(x),x);
 assert.match(audit,/independentlyHashedGenuineWebGLScreenshots/);
 assert.match(audit,/bodyIntersectionCountsNotWorsenedVsP105BaselineAtEverySample:true/);
 assert.match(audit,/blindedReviewPairs:review\.cases\.length/);
 assert.match(report,/No reviewer results are included or fabricated/);
});
test('P107 no-deploy workflow is exact-parent strict research-only and never invokes deploy',()=>{
 for(const x of ['BASE=9d7782e358edb20672685fe97af255aca8d0d8b1','git merge-base --is-ancestor',
  'npm install --no-save --no-package-lock','node --test tests/*.test.cjs tests/*.test.mjs',
  'node scripts/test-mobile-3d-visual-107.mjs','node scripts/audit-mobile-3d-visual-107.mjs',
  'node scripts/install-photo-denim-calf-106.mjs .photo103-donor-541',
  'node scripts/test-photo-denim-calf-106-browser.mjs','node scripts/audit-photo-denim-calf-106.mjs',
  'assert.equal(calf.independentlyVerifiedGenuineWebGLFrames,84)',
  'assert.equal(x.blindedHumanReviewPackage.pairedCases,64)',
  'P107-blinded-64-case-PHOTO105-PHOTO106-human-review-packet',
  'P107-separate-review-unblinding-key-DO-NOT-SHARE-WITH-REVIEWERS',
  'persist-credentials: false','actions/upload-artifact@v4'])assert.ok(workflow.includes(x),x);
 assert.doesNotMatch(workflow,/deploy-pages|wrangler deploy|supabase db push|npm publish/);
});
test('P107 human intake is blank and private reviewer identity is explicitly excluded',()=>{
 const x=JSON.parse(readFileSync('research/independent-mobile-3d-visual-acceptance-107/review/scorecard.json','utf8'));
 assert.equal(x.status,'BLANK_INTAKE_NO_REVIEWS_COLLECTED');
 assert.equal(x.humanAcceptanceDecision,'NOT YET VERIFIED');
 assert.equal(x.ratings.overallRealism,null);assert.equal(x.reviewerRecord.includes('access-controlled'),true);
});
