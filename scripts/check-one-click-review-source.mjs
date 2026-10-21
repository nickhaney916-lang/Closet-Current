// Fail-closed source scope: offline reviewer only, not customer recognition.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:15_000_000}).trim();
assert.equal(git('rev-parse','HEAD:public/app.js'),'2bac7dae8c9d13f7b8ed1baf9d41750bb0878b48',
 'Native still exception must match exact independently reviewed camera app blob');
const BASE='453e13aacb8614d98c2241df1cb6c882a539d8f4';
assert.equal(git('merge-base','HEAD',BASE),BASE,'Not based on verified integrated PR119');
const changedAllowed=new Set([
 'scripts/one-click-human-review.mjs','tests/one-click-human-review.test.mjs',
 'scripts/test-one-click-human-review-browsers.mjs','.github/workflows/one-click-human-review-qa.yml',
 'docs/ONE-CLICK-HUMAN-REVIEW-20261021.md','scripts/check-one-click-review-source.mjs',
 'scripts/offline-review-coordinator.mjs',
 'tests/offline-review-coordinator.test.mjs',
 'scripts/test-offline-review-coordinator-browsers.mjs',
 'scripts/check-offline-review-coordinator-source.mjs',
 '.github/workflows/offline-review-coordinator-qa.yml',
 'docs/OFFLINE-TWO-REVIEWER-INTAKE-20261021.md',
 'docs/PROGRESS-CHECKPOINT.md','scripts/check-human-review-cloud-bridge.mjs',
 'public/photo-import.js',
 'tests/photo-import-untyped-and-timeout.test.cjs',
 'scripts/test-import-detail-budget-browsers.mjs',
 'scripts/check-import-detail-budget-scope.mjs',
 '.github/workflows/import-detail-budget-qa.yml',
 'docs/IMPORTED-PHOTO-DETAIL-FIRST-20261021.md',
 'public/app.js',
 'tests/photo-native-still.test.cjs',
 'scripts/test-native-still-detail-budget-browsers.mjs',
 'scripts/check-native-still-detail-budget-scope.mjs',
 '.github/workflows/native-still-detail-budget-qa.yml',
 'docs/NATIVE-STILL-DETAIL-FIRST-20261021.md',
 'scripts/check-blind-photo-cloud-integration.mjs','scripts/verify-camera-cloud-integration.mjs']);
const changed=git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean);
for(const p of changed)assert.ok(changedAllowed.has(p),'Unexpected file modification: '+p);
for(const p of ['public/cloud-backup.js','public/auth.js','public/recognition-engine.mjs',
 'public/recognition-photo.mjs','public/photo-color.js','public/closet-stylist.js','public/outfit-board.js',
 'scripts/source-holdout-human-review.mjs','scripts/human-original-review-readiness.mjs',
 'scripts/test-human-original-review-readiness.mjs','benchmark/independent-source-holdout/locked.json',
 'tests/human-original-review-readiness.test.mjs','supabase/cloud-backup.sql'])
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),'Protected source was modified: '+p);
const old=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(old),'Historical checkpoints altered');
const packet=packetFromLock(fs.readFileSync(LOCK)),report=reconcile(packet,[]);
assert.equal(packet.photos.length,13);
assert.equal(report.suppliedSubmissions,0);
assert.equal(report.approvedModelAccuracy,null);
assert.equal(report.productionPromotion,'BLOCKED');
console.log(JSON.stringify({sourceScope:'ONE_CLICK_REVIEW_ONLY',sourcePhotos:13,actualHumanReviews:0,
 humanAccuracy:null,productionPromotion:'BLOCKED',protectedAppRuntimeUntouched:true,intentionalImportCompressionException:true,merged:false,deployed:false}));
