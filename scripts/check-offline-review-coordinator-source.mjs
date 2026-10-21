// Additive offline post-review coordinator. No change to user-facing app, reviewer, or human-gold evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const BASE='62eb7bf4775adbb016091914daffc8d3c9a74e1a';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:15_000_000}).trim();
assert.equal(git('merge-base','HEAD',BASE),BASE,'Not descended from tested PR121 draft');
const allowed=new Set([
 'scripts/offline-review-coordinator.mjs','tests/offline-review-coordinator.test.mjs',
 'scripts/test-offline-review-coordinator-browsers.mjs','scripts/check-offline-review-coordinator-source.mjs',
 '.github/workflows/offline-review-coordinator-qa.yml','docs/OFFLINE-TWO-REVIEWER-INTAKE-20261021.md',
 'docs/PROGRESS-CHECKPOINT.md','scripts/check-one-click-review-source.mjs',
 'scripts/check-human-review-cloud-bridge.mjs','scripts/check-blind-photo-cloud-integration.mjs',
 'public/photo-import.js',
 'tests/photo-import-untyped-and-timeout.test.cjs',
 'scripts/test-import-detail-budget-browsers.mjs',
 'scripts/check-import-detail-budget-scope.mjs',
 '.github/workflows/import-detail-budget-qa.yml',
 'docs/IMPORTED-PHOTO-DETAIL-FIRST-20261021.md',
 'scripts/verify-camera-cloud-integration.mjs']);
for(const p of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))
 assert.ok(allowed.has(p),'Unexpected customer/reviewer/recognition change: '+p);
for(const p of [
 'scripts/one-click-human-review.mjs','scripts/source-holdout-human-review.mjs',
 'scripts/test-one-click-human-review-browsers.mjs','scripts/human-original-review-readiness.mjs',
 'tests/one-click-human-review.test.mjs','benchmark/independent-source-holdout/locked.json',
 'public/app.js','public/cloud-backup.js','public/auth.js','public/recognition-engine.mjs',
 'public/recognition-photo.mjs','public/photo-color.js','public/closet-stylist.js','public/outfit-board.js',
 'supabase/cloud-backup.sql'])
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),'Frozen original/customer source changed: '+p);
const prior=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(prior),'Historical checkpoint rewritten');
const packet=packetFromLock(fs.readFileSync(LOCK)),unreviewed=reconcile(packet,[]);
assert.equal(packet.photos.length,13);
assert.equal(unreviewed.suppliedSubmissions,0);
assert.equal(unreviewed.approvedModelAccuracy,null);
assert.equal(unreviewed.productionPromotion,'BLOCKED');
console.log(JSON.stringify({scope:'SOURCE_LOCKED_COORDINATOR_ONLY',originalPhotos:13,
 frozenReviewerAndCoreCustomerApp:true,intentionalPhotoImportQualityException:true,realIndependentSubmissions:0,humanAccuracy:null,
 productionPromotion:'BLOCKED',merged:false,deployed:false}));
