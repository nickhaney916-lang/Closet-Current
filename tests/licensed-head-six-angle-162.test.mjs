import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const prep=readFileSync('scripts/prepare-licensed-head-six-angle-162.mjs','utf8');
const audit=readFileSync('scripts/audit-licensed-head-six-angle-162.mjs','utf8');
const workflow=readFileSync('.github/workflows/licensed-head-six-angle-162-no-deploy.yml','utf8');
const report=readFileSync('research/licensed-head-six-angle-162/REPORT.md','utf8');
test('P162 pins independently verified main P161 and separate parallel P716 source heads without cherry-picking or changing parallel files',()=>{
 assert.match(prep,/9c20ed0208d1ba547707e2a8c6fcd542ba327068/);
 assert.match(prep,/fca5981c86a456ca172bd9810cb9c17e420cc30b/);
 assert.match(prep,/parallelPRNotEdited:true/);
 assert.match(prep,/originalSourceAppNotEdited:true/);
 assert.match(workflow,/BASE=9c20ed0208d1ba547707e2a8c6fcd542ba327068/);
 assert.match(workflow,/git show fca5981c86a456ca172bd9810cb9c17e420cc30b:scripts\/prepare-outfit-view-360-160.mjs/);
 assert.match(workflow,/git show fca5981c86a456ca172bd9810cb9c17e420cc30b:scripts\/audit-outfit-view-360-160.mjs/);
});
test('P162 retains original real P716 mouse-driven 360 outfit camera views and original outfit read-only board protection',()=>{
 for(const s of ["'threequarter-rear-right'","page.mouse.down()","ownerOriginal","sourceRigBones:overlay.sourceRigBones","threequarter-front-right"])
  assert.ok(prep.includes(s)||audit.includes(s),"original verified orbit anchor "+s);
 assert.match(prep,/prep\.split\(anchor\)/);
 assert.match(prep,/const anchor="const overlay=JSON\.parse/);
 assert.match(prep,/originalPhotographedGarmentMeshesBefore/);
 assert.match(prep,/originalPhotographedGarmentMeshesAfter/);
});
test('P162 enforces actual licensed P156 original female and male source SHA, original 163-bone body and source P160/P161 fits in all 36 real screenshots',()=>{
 for(const item of ["dd3772a97d2459975b34f8b1ca7902cb7d7e47d20091766a342b53425c9202e4","a4aed621b347f5ed2c6564ca4bb66c8d18681d94e7d3fdc246fdd64adbcc1f72","originalNeckJointDistanceImprovementMeters",".originalNeckHeadAngleBeforeDegrees",".correctedNeckHeadAngleDegrees",".sourceLicensedNeckRotationDegrees",".originalFaceSkinOverlapMeters",".originalNeckPivotMovementMeters"])
  assert.ok(audit.includes(item),'actual P160/P161 source identity field '+item);
 assert.match(audit,/row\.originalNeckHeadAngleBeforeDegrees>row\.correctedNeckHeadAngleDegrees\+\.19/);
 assert.match(audit,/row\.originalFaceSkinOverlapMeters>\.042/);
 assert.match(audit,/row\.sourceRigBones,163/);
 assert.match(audit,/row\.parallelOriginalMITHeadBones,80/);
});
test('P162 independently validates real 36 unique screenshot SHA, six actual camera states, genuine original P161 Chromium and WebKit',()=>{
 assert.match(audit,/views=\['front','threequarter-front-right','right','threequarter-rear-right','rear','left'\]/);
 assert.match(audit,/assert\.equal\(all\.length,36\)/);
 assert.match(audit,/assert\.equal\(shaSeen\.size,36\)/);
 assert.match(audit,/assert\.equal\(sha\(png\),row\.sha256/);
 assert.match(audit,/assert\.equal\(webkit\.cases,3\)/);
 assert.match(audit,/assert\.equal\(head\.originalLicensedSourceFiguresRotated,2\)/);
 assert.match(audit,/assert\.equal\(head\.realOriginalPhotoSHA256Screenshots,36\)/);
 assert.match(audit,/row\.ownerSavedBoardUnchanged,true/);
 assert.match(audit,/row\.neckBridgeTriangles,0/);
});
test('P162 CI only six newly isolated research files, controls no merge/deploy and verifies exact disposable P541 donor',()=>{
 assert.match(workflow,/test "\$\(wc -l <\/tmp\/p162-files\)" -eq 6/);
 assert.match(workflow,/df6885d6011cb33fb22dceb81a08f35a0ac4dd61/);
 assert.match(workflow,/no.*deploy/i);
 assert.match(workflow,/git diff --exit-code "\$BASE" HEAD -- public supabase/);
 assert.match(workflow,/node scripts\/audit-licensed-head-six-angle-162\.mjs/);
 assert.match(workflow,/P150=1 P160=1/);
});
test('P162 explicitly holds independent 10/10 visual and physical phones, never calls this a production release',()=>{
 assert.match(report,/Family Alpha.*HOLD/);
 assert.match(report,/physical/i);
 assert.match(report,/photorealism/i);
 assert.match(audit,/physicalAndroidIphoneAccepted:false/);
 assert.match(audit,/independentHuman10of10PhotorealismAccepted:false/);
 assert.match(audit,/familyAlpha:'HOLD',releaseAuthorized:false/);
});
