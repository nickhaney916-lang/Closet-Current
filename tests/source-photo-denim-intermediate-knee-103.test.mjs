import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePhotographedDenimKnees103,KNEE_ANGLES_103}
 from '../research/source-photo-denim-intermediate-knee-103/knee-angles-policy.mjs';

test('PHOTO103 source-relative actual kneecap range is fixed at 0,4,8,12,16 degrees',()=>{
 assert.deepEqual(KNEE_ANGLES_103,[0,4,8,12,16]);
 assert.equal(Object.isFrozen(KNEE_ANGLES_103),true);
 for(const angle of KNEE_ANGLES_103){
  const x=validatePhotographedDenimKnees103(angle,0);
  assert.equal(x.leftDegrees,angle);
  assert.equal(x.rightDegrees,0);
  assert.equal(x.sourcePoseRelative,true);
  assert.equal(x.maximumDegrees,16);
  assert.equal(x.releaseAuthorized,false);
 }
});
test('PHOTO103 independently sampled bilateral right and left knee angles never exceed verified 16° envelope',()=>{
 for(const [l,r] of [[0,0],[0,16],[16,0],[16,16],[3.5,12.25]]){
  const x=validatePhotographedDenimKnees103(l,r);
  assert.equal(x.leftDegrees,l);assert.equal(x.rightDegrees,r);
  assert.equal(x.continuousFabricMotionCertified,false);
  assert.equal(x.fullSweptCollisionCertified,false);
  assert.equal(x.physicalPhoneVerified,false);
  assert.equal(x.humanPhotorealismApproved,false);
  assert.equal(Object.isFrozen(x),true);
 }
});
test('PHOTO103 never accepts negative or >16° source-misaligned leg flex',()=>{
 for(const [l,r] of [[-0.01,0],[0,-1],[16.001,0],[0,16.001],[-25,10],[180,180]])
  assert.throws(()=>validatePhotographedDenimKnees103(l,r),/3D103 only finite/);
});
test('PHOTO103 never accepts nan/inf/strings/null/undefined/object or array as exact anatomical degrees',()=>{
 for(const v of [NaN,Infinity,-Infinity,'4',null,undefined,{},[],true]){
  assert.throws(()=>validatePhotographedDenimKnees103(v,0),/3D103 only finite/);
  assert.throws(()=>validatePhotographedDenimKnees103(0,v),/3D103 only finite/);
 }
});
test('PHOTO103 original source original JPEG SHA names are correct genuine sources, never arbitrary wardrobe',()=>{
 const s=readFileSync('research/source-photo-denim-intermediate-knee-103/actual-skinned-denim-103.mjs','utf8');
 assert.match(s,/commons-public-domain-jeans-2005.*b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c/);
 assert.match(s,/commons-cc-by-sa-denimjeans2-2008.*aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a/);
 assert.match(s,/isSourceVerifiedDenimId\(pants\.stats\?\.sourceId\)/);
 assert.match(s,/pants\.stats\?\.sourceSHA256!==source\[pants\.stats\.sourceId\]/);
 assert.doesNotMatch(s,/camera|getUserMedia|supabase|storage\.setItem|fetch\(/i);
});
test('PHOTO103 physical skinned joint movement resets to source first, no accumulated pose quaternion drift',()=>{
 const s=readFileSync('research/source-photo-denim-intermediate-knee-103/actual-skinned-denim-103.mjs','utf8');
 assert.match(s,/setFashionPose\(root,'source'\)/);
 assert.match(s,/findOriginalLowerLegBones78\(root,pants\)/);
 assert.match(s,/quaternion\.multiply\(new T\.Quaternion\(\)\.setFromAxisAngle/);
 assert.match(s,/T\.MathUtils\.degToRad\(degrees\)/);
 assert.match(s,/root\.traverse\(o=>\{if\(o\.isSkinnedMesh\)o\.skeleton\.update\(\);\}\)/);
 assert.match(s,/return Object\.freeze\(/);
});
test('PHOTO103 original mapped garment rest, UV, source-front and skin attributes never move',()=>{
 const s=readFileSync('research/source-photo-denim-intermediate-knee-103/actual-skinned-denim-103.mjs','utf8');
 for(const token of ['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight',
  "originalPhotoUVRestAndSkinPreserved:true","sourcePoseRelative:true"])
  assert.ok(s.includes(token),'missing protected original source field '+token);
 assert.match(s,/snapshots=new Map\(protectedAttrs/);
 assert.match(s,/arr\.every\(\(v,i\)=>v===old\[i\]\)/);
 assert.match(s,/source-true photographed garment/i);
});
test('PHOTO103 measured *actual* skinned triangle crossing counts for each sampled pose; never claims swept collision-free',()=>{
 const s=readFileSync('research/source-photo-denim-intermediate-knee-103/actual-skinned-denim-103.mjs','utf8');
 assert.match(s,/auditTrueSkinnedPhotographedDenimContact77\(pants,root/);
 assert.match(s,/actualSkinnedDenimBodyCrossingSegments77/);
 assert.match(s,/intermediateKneeCrossings103:segments/);
 assert.match(s,/sampleOnlyNoContinuousPhysics103:true/);
 assert.match(s,/fullSweptCollisionCertified:false/);
 assert.match(s,/setFashionPose\(root,'source'\);root\.updateMatrixWorld\(true\)/);
});
test('PHOTO103 installer accepts only the exact donor and upgrades actual Outfit Controller and WebGL without production changes',()=>{
 const s=readFileSync('scripts/install-photographed-denim-knee-103.mjs','utf8');
 assert.match(s,/target!=='.photo103-donor-541'/);
 assert.match(s,/df6885d6011cb33fb22dceb81a08f35a0ac4dd61/);
 for(const item of ['research/three-d-78/genuine-skinned-denim-knee-poses.mjs',
  'research/three-d-15/outfit-controller.mjs','research/three-d-15/showroom.mjs',
  'research/three-d-69/index-to-real-garment-demo.mjs','auditKneePose103',
  'cc103KneeStep','research/three-d-103'])
  assert.ok(s.includes(item),item);
 assert.doesNotMatch(s,/main\.push|git push|git commit|deployment|supabase\.co/);
});
test('PHOTO103 original Chromium photos show actual intermediate, source-return and two-source original SHA checks',()=>{
 const s=readFileSync('scripts/test-photographed-denim-knee-103-browser.mjs','utf8');
 for(const t of [
  "window.cc103KneeStep(a,0)","window.cc103KneeStep(16,16)",
  "window.cc103KneeStep(0,0)","window.cc69SetView(a)",
  "for(const angle of [0,4,8,12,16])",
  "for(const view of [45,90])",
  'p.actualSkinnedDenimBodyCrossingCategories77.reviewedSegments',
  "page.locator('#avatar').screenshot",
  'originalPhotoUVRestFrontSkinPositionsBytePreserved77',
  'assert.equal(photos.length,44)',
  'resetChanged<1000',
  'change016>30'
 ])assert.ok(s.includes(t),'missing actual original-photo WebGL case '+t);
});
test('PHOTO103 independent visual auditor requires all SHA/dimensions/nonblank and does NOT claim physics',()=>{
 const s=readFileSync('scripts/audit-photographed-denim-knee-103.mjs','utf8');
 for(const t of ['r.screenshots.length,44', "createHash('sha256')",
  "stats.channels.some", 'contactsAcrossEntireSweptIntervalCertified,false',
  'physicallySimulatedGravityCloth,false',
  'humanPhotorealismApproved,false','actualSignedCloudRLSVerified:false',
  "familyAlpha:'HOLD'"])
  assert.ok(s.includes(t),'missing independent audit '+t);
});
test('PHOTO103 full inherited no-deploy CI exact green P102 parent and real pinned GLB research accepts no product files',()=>{
 const ci=readFileSync('.github/workflows/source-photo-denim-intermediate-knee-103-no-deploy.yml','utf8');
 assert.match(ci,/BASE=76b73ffdc17ab75e6ac98a795758219b82ed1bcd/);
 assert.match(ci,/node --test tests\/\*\.test\.cjs tests\/\*\.test\.mjs/);
 assert.match(ci,/node scripts\/install-photographed-denim-knee-103\.mjs \.photo103-donor-541/);
 assert.match(ci,/node scripts\/test-photographed-denim-knee-103-browser\.mjs/);
 assert.match(ci,/node scripts\/audit-photographed-denim-knee-103\.mjs/);
  assert.equal(ci.includes('test "$(wc -l </tmp/photo103-allowed)" -eq 8'),true);
 assert.doesNotMatch(ci,/gh-pages|deploy-pages|npm publish/);
});
