// Controlled, draft-only combination of exact PR #114 customer code
// and PR #113 source-locked reviewed benchmark files. Never authorizes deployment.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile} from './source-holdout-human-review.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20_000_000}).trim();
const CUSTOMER='05f1bdf071a75e2bac2eaf9ecb66c2f1e63d7132';
const BENCHMARK='71053247402d2e428044ef38b359057011335823';
const priorLocked='0ba1fae03ac1021d6ae58ccf17cd32026aabaa73364cf78618ce1cf7212581d9';
const imported={
  ".github/workflows/independent-source-holdout.yml": "4c050d576827e093f23fbef89faa61fa25424e5f",
  ".github/workflows/source-holdout-human-review.yml": "d2d3bc23f8994a9917484381cd7b1cee6ab05fbc",
  "benchmark/independent-source-holdout/candidates.json": "c12820484deeb166bb25e5b5501a50baec3ff0e9",
  "benchmark/independent-source-holdout/locked.json": "45333f6417ce58e3718202cf6e1aeaa8a80dd034",
  "benchmark/independent-source-holdout/measurement-39538590277.json": "cd5fac3486e8d707c96e406e7dffe2cdf15221c6",
  "docs/INDEPENDENT-SOURCE-HOLDOUT-20261020.md": "c52e0d1133fd6389fea24fa546342e851fdacd99",
  "docs/SOURCE-HOLDOUT-HUMAN-REVIEW.md": "056db0f1739411446daee96939a1a96ec2f98bcf",
  "scripts/independent-source-holdout.mjs": "9805fbf25660eb59a3d645838e07c7b20fbefc10",
  "scripts/source-holdout-human-review.mjs": "d62f5a99aefb704f110a618bbf56e051ad6b5189",
  "scripts/test-source-holdout-human-review-browser.mjs": "9863caabcd60f043c45a71a90c907661e53570df",
  "tests/independent-source-holdout.test.mjs": "d2b6f8d55926e52131a8f7cf5f0660774841b98a",
  "tests/source-holdout-human-review.test.mjs": "940cb3317e1bcbf802f4c6b5b7ebd705912e02a0"
};
assert.equal(git('merge-base','HEAD',CUSTOMER),CUSTOMER,'Not descended from verified customer branch');
const approvedImported=new Set(Object.keys(imported));
assert.equal(approvedImported.size,12,'Unexpected independent source file count');
for(const [path,expected] of Object.entries(imported)){
 assert.equal(git('rev-parse','HEAD:'+path),expected,'Imported benchmark source modified: '+path);
 assert.equal(git('rev-parse',BENCHMARK+':'+path),expected,'Source branch changed from pinned audit: '+path);
 assert.equal(git('ls-tree','-r','--name-only',CUSTOMER,'--',path),'','Independent source unexpectedly existed in customer branch: '+path);
}
const protectedRuntime=[
 'public/app.js','public/photo-crop-editor.js','public/recognition-photo.mjs',
 'public/photo-color.js','public/recognition-engine.mjs','public/clothing-details.js',
 'public/outfit-board.js','public/closet-stylist.js',
 'public/cloud-backup-engine.js','public/cloud-backup-bridge.js','public/index.html',
 'public/auth.js','public/reusable-figure-preview.js',
 'scripts/check-dual-parent-review-integration.mjs','scripts/check-customer-pilot-release-gates.mjs',
 'supabase/cloud-backup.sql','supabase/design/backup-rpc-only-writes.DRAFT.sql'
];
// Exactly one intentionally modified customer source: conflict-retry state.
// Cloud auth, private bucket paths, source capture, owner binding, and the
// historical photo/model evidence remain frozen in the reviewed source.
assert.equal(git('rev-parse','HEAD:public/cloud-backup.js'),
 git('rev-parse','9137b448d24b4904c0477b2f854171c546b25a16:public/cloud-backup.js'),
 'Unreviewed cloud conflict recovery runtime change');
for(const path of protectedRuntime)
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',CUSTOMER+':'+path),
  'Customer or cloud security source changed during isolated integration: '+path);
const permittedExtra=new Set([
 ...approvedImported,'scripts/check-blind-photo-cloud-integration.mjs',
 '.github/workflows/cloud-blind-photo-integration-qa.yml',
 'docs/CLOUD-BLIND-PHOTO-RELEASE-CANDIDATE-20261020.md',
 'docs/PROGRESS-CHECKPOINT.md',
 'scripts/verify-camera-cloud-integration.mjs',
 'public/cloud-backup.js',
 'tests/cloud-conflict-retry.test.cjs',
 'scripts/test-cloud-conflict-retry-browsers.mjs',
 '.github/workflows/cloud-conflict-retry-qa.yml',
 'docs/CLOUD-CONFLICT-RETRY-RECOVERY-20261020.md'
]);
const changed=git('diff','--name-only',CUSTOMER,'HEAD').split('\n').filter(Boolean);
for(const path of changed)
 assert.ok(permittedExtra.has(path),'Unreviewed file in integration branch: '+path);
for(const path of approvedImported)
 assert.ok(changed.includes(path),'Dropped reviewed photo benchmark source: '+path);
const bytes=fs.readFileSync('benchmark/independent-source-holdout/locked.json');
assert.equal(createHash('sha256').update(bytes).digest('hex'),priorLocked,'Original discovery labels changed');
const packet=packetFromLock(bytes),review=reconcile(packet,[]);
assert.equal(packet.photos.length,13);
assert.equal(review.suppliedSubmissions,0);
assert.equal(review.independentHumanGoldLabels,false);
assert.equal(review.productionPromotion,'BLOCKED');
assert.equal(review.approvedModelAccuracy,null);
const measured=JSON.parse(fs.readFileSync('benchmark/independent-source-holdout/measurement-39538590277.json'));
assert.equal(measured.report.independentHumanGoldLabels,false);
assert.equal(measured.report.productionPromotion,'BLOCKED');
console.log('BLIND_PHOTO_CLOUD_INTEGRATION '+JSON.stringify({
 verifiedCustomerBase:CUSTOMER,verifiedBenchmarkSource:BENCHMARK,
 exactImportedBlobs:approvedImported.size,protectedRuntimeFiles:protectedRuntime.length,
 untouchedDiscoveryLabels:true,photos:packet.photos.length,humanReviewSubmissions:0,
 regressionGuarded:true,modelPromotion:'BLOCKED',
 authAndCloudRuntimeIdentical:true,mergedMain:false,deployed:false,productionAuthorized:false
}));
