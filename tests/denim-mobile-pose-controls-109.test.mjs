import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 mobileSourcePoseAdmission109,
 checkedMobileSourcePose109,
 mountSourceDenimMobilePoseControls109
} from '../research/denim-mobile-pose-controls-109/mobile-pose-controls.mjs';
const valid=Object.freeze({
 loaded:true,reviewed:true,figure:'female',selected:'public',
 rigBones:163,realPhoto:true,
 sourceDenimSHA:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 sourceShirtSHA:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
 hasPoseAdapter:true
});
test('PHOTO109 only original reviewed publicly licensed SOURCE photo and actual 163-bone clothed figure admitted',()=>{
 assert.equal(mobileSourcePoseAdmission109(valid),true);
 assert.equal(mobileSourcePoseAdmission109({...valid,figure:'male'}),true);
 assert.equal(mobileSourcePoseAdmission109({
  ...valid,selected:'second',
  sourceDenimSHA:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
 }),true);
});
test('PHOTO109 fail closed on invalid source/photo/identity/no review/rig/stale garment',()=>{
 for(const patch of [
  {loaded:false},{reviewed:false},{figure:'invented'},{figure:null},
  {selected:'third'},{selected:null},{rigBones:162},{rigBones:0},
  {realPhoto:false},{sourceDenimSHA:'bad'},{sourceShirtSHA:'bad'},
  {sourceDenimSHA:null},{sourceShirtSHA:null},{hasPoseAdapter:false}
 ])assert.equal(mobileSourcePoseAdmission109({...valid,...patch}),false,
  'unverified source must not allow any knee controls '+JSON.stringify(patch));
 assert.equal(mobileSourcePoseAdmission109({}),false);
});
test('PHOTO109 controls never impersonate physical cloth physics, human reviewer or production',()=>{
 for(const [left,right] of [[0,0],[8,0],[0,8],[8,8],[16,0],[0,16],[16,16]]){
  const pose=checkedMobileSourcePose109(left,right);
  assert.equal(Object.isFrozen(pose),true);
  assert.deepEqual([pose.left,pose.right],[left,right]);
  assert.equal(pose.sampledAnatomicalSourceOnly,true);
  assert.equal(pose.customerWardrobeAvailable,false);
  assert.equal(pose.physicallyContinuousCloth,false);
  assert.equal(pose.humanPhotorealismApproved,false);
  assert.equal(pose.physicalPhonesVerified,false);
  assert.equal(pose.releaseAuthorized,false);
  assert.equal(pose.familyAlpha,'HOLD');
 }
});
test('PHOTO109 refuses malformed/out-of-range/nonfinite physical skeletal knee poses',()=>{
 for(const x of [undefined,null,{},[],true,'8',NaN,Infinity,-Infinity,-.001,16.001])
  assert.throws(()=>checkedMobileSourcePose109(x,0),/PHOTO108/);
});
test('PHOTO109 no imported browser/UI mounts without an actual gated research document',()=>{
 assert.throws(()=>mountSourceDenimMobilePoseControls109(null,{}),/PHOTO109/);
 assert.throws(()=>mountSourceDenimMobilePoseControls109({},{}),/PHOTO109/);
});
test('PHOTO109 genuine mobile controls gate only localhost + unique research flag and physical source',()=>{
 const s=readFileSync('research/denim-mobile-pose-controls-109/mobile-pose-controls.mjs','utf8');
 for(const t of [
  "['localhost','127.0.0.1','[::1]']",
  "get('knee109')!=='on'",
  "getElementById('review')",
  "getElementById('avatar')",
  "getElementById('wear')",
  "getElementById('swap')",
  "mobileSourcePoseAdmission109(source())",
  "host.cc108BilateralPose(pose.left,pose.right)",
  'if(!event.isTrusted||!eligible())return',
  "stats?.sourceSHA256!==before.sourceDenimSHA",
  "stats?.bilateralDenimPoseReplayVerified108",
  "f.sampledTriangleCrossingsAfter>f.sampledTriangleCrossingsBefore",
  "stats?.familyAlpha!=='HOLD'"
 ])assert.ok(s.includes(t),'source mobile admission missing: '+t);
 assert.doesNotMatch(s.replace(/\/\*[\s\S]*?\*\//g,''),/getUserMedia|localStorage|sessionStorage|fetch\(|supabase|navigator\.sendBeacon|XMLHttpRequest/);
});
test('PHOTO109 original mobile knee presets have real independently bent/straight legs and accessible 48px targets',()=>{
 const s=readFileSync('research/denim-mobile-pose-controls-109/mobile-pose-controls.mjs','utf8');
 for(const t of [
  "id:'cc109Left8',left:8,right:0",
  "id:'cc109Right8',left:0,right:8",
  "id:'cc109Both8',left:8,right:8",
  "id:'cc109Left16',left:16,right:0",
  "id:'cc109Right16',left:0,right:16",
  "id:'cc109Both16',left:16,right:16",
  "id:'cc109Reset',left:0,right:0",
  "'#cc109PoseButtons button{min-height:48px",
  "role=\"group\"",
  'aria-live="polite"',
  'aria-pressed'
 ])assert.ok(s.includes(t),'mobile accessible source pose missing '+t);
});
test('PHOTO109 source photo selection and consent changes revoke old pose, clear on pagehide',()=>{
 const s=readFileSync('research/denim-mobile-pose-controls-109/mobile-pose-controls.mjs','utf8');
 for(const t of [
  "['wear','swap','clear']",
  "['review','model']",
  "const observer=new MutationObserver",
  "host.addEventListener('pagehide',onHide)",
  "host.addEventListener('pagehide',dispose,{once:true})",
  "doc.removeEventListener('change',onChange)",
  "doc.removeEventListener('click',onClick)",
  "root.remove();style.remove()",
  "if(host.cc109PoseUIState===report)delete host.cc109PoseUIState",
  "customerWardrobeIntegrated:false",
  "genuinePhotographedBackAvailable:false",
  "physicalMobilePhoneTested:false"
 ])assert.ok(s.includes(t),'no source privacy cleanup '+t);
});
test('PHOTO109 exact source-only original 163-bone donor UI is injected without changing default app or staging',()=>{
 const s=readFileSync('scripts/install-denim-mobile-pose-controls-109.mjs','utf8');
 for(const t of [
  "target!=='.photo103-donor-541'",
  'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
  'research/three-d-69/index.html',
  'research/three-d-109/mobile-pose-controls.mjs',
  'index-to-real-garment-demo.mjs',
  "throw Error('PHOTO109",
  'PHOTO109 genuine original licensed denim'
 ])assert.ok(s.includes(t),'incorrect original source research install: '+t);
 assert.doesNotMatch(s,/git push|deploy-pages|supabase\/migrations\/|public\/app/);
});
test('PHOTO109 real Chrome mobile tap and exact source-reset SHA tests cover all source/figure/width combinations',()=>{
 const s=readFileSync('scripts/test-denim-mobile-pose-controls-109-browser.mjs','utf8');
 for(const t of [
  "figure:'female',width:320",
  "figure:'female',width:390",
  "figure:'female',width:430",
  "figure:'male',width:390",
  "for(const denim of ['public','second'])",
  "page.locator('#cc109Left8')",
  "page.locator('#cc109Right8')",
  "page.locator('#cc109Both16')",
  "page.locator('#cc109Reset')",
  "document.getElementById('cc109Both16').click()",
  "page.locator('#wear').click()",
  "page.locator('#swap').click()",
  "page.locator('#clear').click()",
  'assert.equal(restorationPixels,0',
  'assert.equal(scenarios.length,8)',
  'assert.equal(frames.length,24)',
  'trueSkinnedBodyContactNeverWorse:true'
 ])assert.ok(s.includes(t),'source-true mobile WebGL tap acceptance missing '+t);
});
test('PHOTO109 independent 24 real original photo SHA screenshot audit refuses fake frames and approval claims',()=>{
 const s=readFileSync('scripts/audit-denim-mobile-pose-controls-109.mjs','utf8');
 for(const t of [
  'assert.equal(x.scenarios.length,8)',
  'assert.equal(x.screenshots.length,24)',
  "createHash('sha256')",
  "stat.channels.some",
  's.exactTapResetChangedPixels,0',
  'independentlyVerifiedRealMobileWebGLPNGFrames:24',
  'trueChromiumMobileCSSWidths:[320,390,430]',
  'sourceReviewAndGenuineSHA256Admission:true',
  'actualPhysicalIphoneAndroidHardwareTested:false',
  "familyAlpha:'HOLD'"
 ])assert.ok(s.includes(t),'independent audited source missing '+t);
});
test('PHOTO109 dedicated exact P108-parent CI must retain full P103-108 original WebGL before real UI 24-frame check',()=>{
 const s=readFileSync('.github/workflows/denim-mobile-pose-controls-109-no-deploy.yml','utf8');
 for(const t of [
  'BASE=c8e5140572cf00052c063b4e459e97b3a9ec35bf',
  'node --test tests/*.test.cjs tests/*.test.mjs',
  'node scripts/install-denim-bilateral-108.mjs .photo103-donor-541',
  'node scripts/install-denim-mobile-pose-controls-109.mjs .photo103-donor-541',
  'node scripts/test-denim-bilateral-108-browser.mjs',
  'node scripts/test-denim-mobile-pose-controls-109-browser.mjs',
  'node scripts/audit-denim-mobile-pose-controls-109.mjs',
  'test "$(wc -l </tmp/photo109-allowed)" -eq 7'
 ])assert.ok(s.includes(t),'missing exact staged 163-bone control provenance '+t);
 assert.doesNotMatch(s,/deploy-pages|gh-pages|npm publish/);
});
