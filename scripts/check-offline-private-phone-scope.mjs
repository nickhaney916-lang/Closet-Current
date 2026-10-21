// Private pilot handoff only: no physical-phone claims, customer logic, Auth or cloud writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const BASE='623eb4af070b6caece11247e79eb3494d8450f98';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20000000}).trim();
assert.equal(git('merge-base','HEAD',BASE),BASE,'Not based on verified native-camera draft PR125');
const allowed=new Set([
 'scripts/offline-private-phone-coordinator.mjs',
 'tests/offline-private-phone-coordinator.test.mjs',
 'scripts/test-offline-private-phone-coordinator-browsers.mjs',
 'scripts/check-offline-private-phone-scope.mjs',
 '.github/workflows/offline-private-phone-qa.yml',
 'docs/OFFLINE-PRIVATE-PHONE-PILOT-20261021.md',
 'docs/PROGRESS-CHECKPOINT.md']);
for(const p of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))
 assert.ok(allowed.has(p),'Unreviewed customer app, model or owner data change: '+p);
for(const p of [
 'public/app.js','public/recognition-engine.mjs','public/recognition-photo.mjs','public/photo-import.js',
 'public/device-check-engine.js','public/cloud-backup.js','public/auth.js','public/photo-color.js',
 'public/closet-stylist.js','public/outfit-board.js','public/saved-closet-audit.html',
 'benchmark/review-phone-pilot-reports.mjs','benchmark/private-end-to-end-pilot-review.mjs',
 'scripts/review-private-pilot-evidence.mjs','scripts/compare-private-phone-pilot-reports.mjs',
 'benchmark/independent-source-holdout/locked.json','supabase/cloud-backup.sql',
 'scripts/source-holdout-human-review.mjs'])
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),
  'Existing private-phone review, app or cloud security source changed: '+p);
const old=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(old),'Checkpoint history modified');
const coordinator=fs.readFileSync('scripts/offline-private-phone-coordinator.mjs','utf8');
assert.ok(coordinator.includes('const injected=')&&
 coordinator.includes("original.replace(expected,'').replace(")&&
 coordinator.includes('function comparePrivatePhonePilotReports('),
 'Coordinator must embed canonical validator source unchanged');
const x=reconcile(packetFromLock(fs.readFileSync(LOCK)),[]);
assert.equal(x.suppliedSubmissions,0);assert.equal(x.approvedModelAccuracy,null);
assert.equal(x.productionPromotion,'BLOCKED');
console.log(JSON.stringify({scope:'OFFLINE_PRIVATE_PHONE_COORDINATOR_ONLY',
 frozenCustomerSources:true,frozenCanonicalPhoneValidation:true,
 realPhysicalPhoneReports:0,sourceAccuracy:null,productionReleaseApproved:false,
 modelPromotion:'BLOCKED',merged:false,deployed:false}));
