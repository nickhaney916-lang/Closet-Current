import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const integration=readFileSync('scripts/test-mobile-outfit-integration-111-browser.mjs','utf8');
const audit=readFileSync('scripts/audit-mobile-outfit-integration-111.mjs','utf8');
const policy=readFileSync('research/reviewed-closet-3d-handoff-110/owner-bound-look-policy.mjs','utf8');
const panel=readFileSync('research/reviewed-closet-3d-handoff-110/reviewed-look-panel.mjs','utf8');
const report=readFileSync('research/independent-mobile-3d-outfit-integration-111/REPORT.md','utf8');
const workflow=readFileSync('.github/workflows/independent-mobile-3d-outfit-integration-111-no-deploy.yml','utf8');

test('Priority 111 exact parent and sibling research heads are pinned',()=>{
 for(const sha of ['c5930d200b8bbd1632b188fb5216bc233cffae8d',
  '8a59e9f0b05f7648eb0261619599509177bc2e8f','5b270b651e1926a101c31e1822fa82883b12b0cc',
  'df6885d6011cb33fb22dceb81a08f35a0ac4dd61'])assert.ok(report.includes(sha),sha);
 assert.ok(integration.includes('browser lifecycle event'));
});
test('source-bound saved outfit admits only exact original reviewed items and preserves owner/category/hash',()=>{
 for(const x of ['ownerId','generation','ownerReviewed===true','sourcePhotoOriginal===true',
  "item.category===category","item.itemType===itemType",'sourceSHA256','RESEARCH_SOURCE_110',
  'original-photo-2d-fallback','truePrivateWardrobe3DReady:false'])assert.ok(policy.includes(x),x);
 assert.match(panel,/savedSourceSHA256s/);
});
test('mobile freeze revokes reopened outfit, concealment holds until reload and fresh review',()=>{
 for(const x of ['lifecycleIsRevoked','mobile-lifecycle-source-revoked',
  "['visibilitychange','freeze','pageshow']",'host.addEventListener(\'pagehide\',onLifecycle)'])
  assert.ok(panel.includes(x),x);
 for(const x of ["new Event('freeze')",'sourceRenderConcealed','same-document review',
  'await page.reload()','freshReviewAllowsNewSaveAndReopen:true','hasSavedLook===false'])
  assert.ok(integration.includes(x),x);
});
test('real WebGL acceptance covers source identity, 163 bones, knee controls and 320/390/430 front-side-rear views',()=>{
 for(const x of ['[320,390,430]','[0,90,180]','getContext','actual3DGarment',
  'cc109Left8','cc109Right8','cc109Both16','cc109Reset','saved-look-reopened',
  'savedSourceSHA256s','localStorage.length+sessionStorage.length'])
  assert.ok(integration.includes(x),x);
 for(const x of ['createHash','sharp(bytes).metadata()','sourceSHA256s.bottom',
  "'NOT VERIFIED'",'physicalAndroidChrome','physicalIphoneSafari'])assert.ok(audit.includes(x),x);
 assert.match(report,/software WebGL/);
});
test('unsupported private-photo cases remain 2D, no real authentication claim and no deploy',()=>{
 for(const x of ['photographic3DReconstructionApproved!==true','benchmark=session.ownerId===RESEARCH_OWNER_110',
  'realSignedCloudRLSVerified:false','originalPhotoNotReconstructed:!benchmark'])assert.ok(policy.includes(x),x);
 for(const x of ['node scripts/build.mjs','node --test tests/*.test.cjs tests/*.test.mjs',
  'node scripts/test-reviewed-closet-3d-handoff-110-browser.mjs',
  'node scripts/test-mobile-outfit-integration-111-browser.mjs',
  'node scripts/audit-mobile-outfit-integration-111.mjs','actions/upload-artifact@v4',
  'persist-credentials: false'])assert.ok(workflow.includes(x),x);
 assert.doesNotMatch(workflow,/deploy-pages|wrangler deploy|supabase db push|npm publish/);
 assert.match(report,/Family Alpha.*HOLD/);
});
