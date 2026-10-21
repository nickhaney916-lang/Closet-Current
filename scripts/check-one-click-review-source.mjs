// Fail-closed source scope: offline reviewer only, not customer recognition.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:15_000_000}).trim();
const BASE='453e13aacb8614d98c2241df1cb6c882a539d8f4';
assert.equal(git('merge-base','HEAD',BASE),BASE,'Not based on verified integrated PR119');
const changedAllowed=new Set([
 'scripts/one-click-human-review.mjs','tests/one-click-human-review.test.mjs',
 'scripts/test-one-click-human-review-browsers.mjs','.github/workflows/one-click-human-review-qa.yml',
 'docs/ONE-CLICK-HUMAN-REVIEW-20261021.md','scripts/check-one-click-review-source.mjs',
 'docs/PROGRESS-CHECKPOINT.md','scripts/check-human-review-cloud-bridge.mjs',
 'scripts/check-blind-photo-cloud-integration.mjs','scripts/verify-camera-cloud-integration.mjs']);
const changed=git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean);
for(const p of changed)assert.ok(changedAllowed.has(p),'Unexpected file modification: '+p);
for(const p of ['public/app.js','public/cloud-backup.js','public/auth.js','public/recognition-engine.mjs',
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
 humanAccuracy:null,productionPromotion:'BLOCKED',appRuntimeUntouched:true,merged:false,deployed:false}));
