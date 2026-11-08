import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('P166 scratch adapter uses native verified JPEG capture before real Work photo candidate',()=>{
 const s=readFileSync('scripts/prepare-canonical-camera-owned-style-166-browser.mjs','utf8');
 for(const needle of ['captureProofFromJPEG','sourceProof:proof',
  "width:240,height:320", 'original JPEG human review flags',
  'I verified the category, clothing type and color',
  'I confirmed this photo shows one garment',
  'sourcePhotoOriginal','sourceHashVerified','humanReviewedSource',
  'ownerReviewed','userAdjusted','saved166.actualOriginalSHA',
  "saved166.sourceSHA256,exactP166SHA","saved166.dbName,'closet-current-user-'+owner",
  "sourceEvidence.mode,'verified-original-photo-2d'",
  'sourceEvidence.imageSHA,exactP166SHA',
  'sourceEvidence.srcMatchesOriginal,true',
  "sourceEvidence.fitted,'false'"])
  assert.ok(s.includes(needle),'P166 canonical source acceptance missing '+needle);
 assert.equal(s.includes('innerHTML'),false,'no generated unsafe photo HTML');
 assert.equal(s.includes('new THREE.'),false,'no fabricated generic clothing on humanoid');
});

test('P166 exact descendant of P165 only adds four research paths and reuses pinned Work719 on throwaway CI checkout',()=>{
 const s=readFileSync('.github/workflows/canonical-camera-owned-style-166-no-deploy.yml','utf8');
 for(const needle of [
  'BASE=2b6d891367fd67cc8f7d054b1250600e0e13c323',
  'test "$(wc -l </tmp/p166-files)" -eq 4',
  '0eaa99fe1e1a07b253a4ef2b1b5a0dc7192a2a00',
  'git merge --no-commit --no-ff "$WORK"',
  'test -z "$(git ls-files -u)"',
  'scripts/prepare-style-photo-preview-165-browser.mjs',
  'scripts/prepare-canonical-camera-owned-style-166-browser.mjs',
  'scripts/test-canonical-camera-owned-style-166.mjs',
  'originalSourceClaimVerified:true',
  'newGarment3DFitVerified:false',
  'sourceWorkBranchUntouched:true',
  "familyAlpha:'HOLD',releaseAuthorized:false",
  'node --test tests/*.test.cjs tests/*.test.mjs',
  'node scripts/audit-source-garment-360-163.mjs',
  'node scripts/audit-style-photo-preview-165.mjs',
  'benchmark/canonical-camera-owned-style-166/'
 ])assert.ok(s.includes(needle),'P166 strict current-head genuine browser acceptance missing '+needle);
 assert.equal(s.includes('deploy-pages'),false);
 assert.equal(s.includes('npm publish'),false);
});

test('P166 explicit limitations cannot be silently mistaken for release or live device acceptance',()=>{
 const s=readFileSync('research/canonical-camera-owned-style-166/REPORT.md','utf8');
 for(const phrase of ['FAMILY ALPHA HOLD','synthetic camera','not a 3D fit',
  'full-app Work','SHA-256','human reviewed','Chromium','WebKit',
  'no production or existing staging'])assert.ok(s.toLowerCase().includes(phrase.toLowerCase()));
});
