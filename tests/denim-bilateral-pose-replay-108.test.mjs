import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateBilateralSourcePose108,SOURCE_BILATERAL_SEQUENCE_108}
 from '../research/denim-bilateral-pose-replay-108/bilateral-pose-policy.mjs';
import {verifyPhotographedBilateralDenim108}
 from '../research/denim-bilateral-pose-replay-108/real-source-bilateral-audit.mjs';
test('PHOTO108 immutable source relative 10-sample two-leg pose sequence tests both legs and revisits source',()=>{
 assert.deepEqual(SOURCE_BILATERAL_SEQUENCE_108,[
  [0,0],[4,0],[8,0],[16,0],[16,16],[0,16],[0,8],[0,0],[16,0],[0,0]
 ]);
 assert.equal(Object.isFrozen(SOURCE_BILATERAL_SEQUENCE_108),true);
 for(const p of SOURCE_BILATERAL_SEQUENCE_108)assert.equal(Object.isFrozen(p),true);
});
test('PHOTO108 finite per-leg physical 0..16 original anatomical degrees independently validated',()=>{
 for(const [left,right] of [...SOURCE_BILATERAL_SEQUENCE_108,[0,4],[4,4],[12.5,3.5]]){
  const p=validateBilateralSourcePose108(left,right);
  assert.equal(p.leftDegrees,left);assert.equal(p.rightDegrees,right);
  assert.equal(p.alwaysRebuildFromSource,true);
  assert.equal(p.isSourceRelative,true);
  assert.equal(p.acceptsAutoAnimation,false);
  assert.equal(p.releaseAuthorized,false);
  assert.equal(Object.isFrozen(p),true);
 }
});
test('PHOTO108 non-finite unmeasured original anatomical knee bending fails closed',()=>{
 for(const invalid of [null,undefined,{},[],true,'8',NaN,Infinity,-Infinity,-.001,16.001,180]){
  assert.throws(()=>validateBilateralSourcePose108(invalid,0),/PHOTO108/);
  assert.throws(()=>validateBilateralSourcePose108(0,invalid),/PHOTO108/);
 }
});
test('PHOTO108 does not substitute invented photographic back or user wardrobe for original licensed source',()=>{
 const s=readFileSync('research/denim-bilateral-pose-replay-108/real-source-bilateral-audit.mjs','utf8');
 for(const t of [
  'commons-public-domain-jeans-2005',
  'commons-cc-by-sa-denimjeans2-2008',
  'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
  'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a',
  's.sourceSHA256!==LICENSED_SOURCE_SHA[s.sourceId]',
  'mesh.skeleton?.bones?.length!==163',
  'auditedTrueSkinnedBodyToSourcePhotoDenim77',
  'originalSourcePhotographAndUVRestSkinProtected106'
 ])assert.ok(s.includes(t),t);
 assert.doesNotMatch(s,/getUserMedia|localStorage|sessionStorage|supabase|fetch\(/);
});
test('PHOTO108 never accepts unvetted 3D/missing original photo/source for bilateral replay',()=>{
 for(const p of [null,undefined,{},[],{meshes:[]},{meshes:[{isSkinnedMesh:false}]}]){
  assert.throws(()=>verifyPhotographedBilateralDenim108(p,{left:0,right:0}),/PHOTO108/);
 }
 assert.throws(()=>verifyPhotographedBilateralDenim108({},{
  left:Infinity,right:0
 }),/PHOTO108/);
});
test('PHOTO108 admission requires actual source-authentic per-leg geometry, unchanged photo UV, vertex and skin attributes',()=>{
 const s=readFileSync('research/denim-bilateral-pose-replay-108/real-source-bilateral-audit.mjs','utf8');
 for(const t of [
  "s.real163BoneSampledKnee103?.leftDegrees!==pose.leftDegrees",
  "s.real163BoneSampledKnee103?.rightDegrees!==pose.rightDegrees",
  's.sourceNeutralRearCalfDrape106',
  'f.rightLegMoved>=8','f.leftLegMoved>=8',
  "getAttribute('pantsRest')",
  "getAttribute('pantsSourceUV')",
  "getAttribute('pantsSourceFront')",
  "getAttribute('skinIndex')",
  "getAttribute('skinWeight')",
  'perLegCalfVertexMovement108',
  'originalPhotoAndUVSkinAndFrontPreserved108:true'
 ])assert.ok(s.includes(t),'missing true source safety '+t);
});
test('PHOTO108 actual posed original 163-bone body triangles remain never worse and truthful HOLD always',()=>{
 const s=readFileSync('research/denim-bilateral-pose-replay-108/real-source-bilateral-audit.mjs','utf8');
 for(const t of [
  'actual!==f.contactAfter||f.contactAfter>f.contactBefore',
  'f.maxShift>.012001',
  "f.moved!==0||f.maxShift!==0||f.factor!==0",
  'fullMovementSweepCollisionVerified108:false',
  'photorealisticPhysicalClothDynamicsVerified108:false',
  'independentHumanVisualApproval108:false',
  'actualAndroidIphoneDeviceTested108:false',
  'realSignedMultiAccountRLSVerified108:false',
  'productionDeploymentAuthorized108:false',
  "familyAlpha:'HOLD',releaseAuthorized:false"
 ])assert.ok(s.includes(t),'missing scientific fail-closed proof '+t);
});
test('PHOTO108 research overlay strictly on detached authenticated original donor and original actual controller',()=>{
 const s=readFileSync('scripts/install-denim-bilateral-108.mjs','utf8');
 for(const t of [
  "arg!=='.photo103-donor-541'",
  'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
  'research/three-d-15/outfit-controller.mjs',
  'research/three-d-15/showroom.mjs',
  'research/three-d-69/index-to-real-garment-demo.mjs',
  'auditKneePose108','cc108BilateralPose',
  'research/three-d-108',
  'verifyPhotographedBilateralDenim108'
 ])assert.ok(s.includes(t),t);
 assert.doesNotMatch(s,/git push|deploy-pages|public\/app|supabase\/migrations/);
});
test('PHOTO108 genuine original 163-bone photographed mobile WebGL tests both legs in alternating and both bend and source-pose replay',()=>{
 const s=readFileSync('scripts/test-denim-bilateral-108-browser.mjs','utf8');
 for(const t of [
  "for(const figure of ['female','male'])",
  "for(const denim of ['public','second'])",
  'SOURCE_BILATERAL_SEQUENCE_108.length',
  'window.cc108BilateralPose(l,r)',
  'for(const view of [90,270])',
  "page.locator('#avatar').screenshot",
  '[0,7,', // source reset comparison
  "'left16-after-both-and-right'",
  'assert.equal(difference,0',
  'assert.equal(frames.length,80)',
  'originalPhotoSHA256s.bottom',
  'independentHumanVisualRealismApproved:false'
 ])assert.ok(s.includes(t),'missing genuine bilateral browser acceptance '+t);
});
test('PHOTO108 independent 80-photo source SHA nonblank bilateral audit enforces zero image drift and true-body contacts',()=>{
 const s=readFileSync('scripts/audit-denim-bilateral-108.mjs','utf8');
 for(const t of [
  'assert.equal(x.frames.length,80)',
  'assert.equal(x.cases.length,4)',
  "createHash('sha256')",
  "stat.channels.some",
  'sourceRelativeExactReplayComparisons.length,6',
  'assert.equal(y.pixelDelta,0)',
  'sample.contactAfter<=sample.contactBefore',
  'independentGenuineOriginalPhotoWebGLScreenshots:80',
  'physicalPhoneNotTested:true',
  'independentHumanPhotorealismNotApproved:true',
  "familyAlpha:'HOLD'"
 ])assert.ok(s.includes(t),'missing independent evidence '+t);
});
test('PHOTO108 strict no-deploy CI exact P106 parent and all inherited real photographed browser evidence',()=>{
 const s=readFileSync('.github/workflows/denim-bilateral-pose-replay-108-no-deploy.yml','utf8');
 for(const t of [
  'BASE=9d7782e358edb20672685fe97af255aca8d0d8b1',
  'node --test tests/*.test.cjs tests/*.test.mjs',
  'node scripts/install-photographed-denim-knee-103.mjs .photo103-donor-541',
  'node scripts/install-denim-pose-fold-contact-104.mjs .photo103-donor-541',
  'node scripts/install-denim-panel-normal-105.mjs .photo103-donor-541',
  'node scripts/install-photo-denim-calf-106.mjs .photo103-donor-541',
  'node scripts/install-denim-bilateral-108.mjs .photo103-donor-541',
  'node scripts/test-photo-denim-calf-106-browser.mjs',
  'node scripts/test-denim-bilateral-108-browser.mjs',
  'node scripts/audit-denim-bilateral-108.mjs',
  'test "$(wc -l </tmp/photo108-allowed)" -eq 8'
 ])assert.ok(s.includes(t),'missing independent original source CI '+t);
 assert.doesNotMatch(s,/deploy-pages|gh-pages|npm publish/);
});
