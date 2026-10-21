// Isolate a single source-derived JPEG encoding detail upgrade; no model or live release approvals.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:16000000}).trim();
const BASE='b174a50695ac958f6bc5ae0b705bd7064c094afd';
const IMPORT_BLOB='65f99345804558e14986c4c6f41cfe144d5c075a';
assert.equal(git('merge-base','HEAD',BASE),BASE,'Must branch from fully checked PR #122');
assert.equal(git('rev-parse','HEAD:public/photo-import.js'),IMPORT_BLOB,'Changed accepted image encoder without new independent QA');
assert.notEqual(git('rev-parse',BASE+':public/photo-import.js'),IMPORT_BLOB,'Import is not a real revision');
const permitted=new Set([
 'public/photo-import.js','tests/photo-import-untyped-and-timeout.test.cjs',
 'scripts/test-import-detail-budget-browsers.mjs','scripts/check-import-detail-budget-scope.mjs',
 '.github/workflows/import-detail-budget-qa.yml','docs/IMPORTED-PHOTO-DETAIL-FIRST-20261021.md',
 'docs/PROGRESS-CHECKPOINT.md','scripts/check-offline-review-coordinator-source.mjs',
 'scripts/check-one-click-review-source.mjs','scripts/check-human-review-cloud-bridge.mjs',
 'scripts/check-blind-photo-cloud-integration.mjs','scripts/verify-camera-cloud-integration.mjs']);
for(const p of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))
 assert.ok(permitted.has(p),'Unrelated customer/security/recognition change: '+p);
for(const p of ['public/app.js','public/auth.js','public/recognition-engine.mjs','public/recognition-photo.mjs',
 'public/photo-color.js','public/photo-crop-editor.js','public/photo-check.js',
 'public/cloud-backup.js','public/closet-stylist.js','public/outfit-board.js',
 'supabase/cloud-backup.sql','benchmark/independent-source-holdout/locked.json',
 'scripts/source-holdout-human-review.mjs','scripts/one-click-human-review.mjs',
 'scripts/offline-review-coordinator.mjs'])
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),'Protected customer/human source edited: '+p);
const historical=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(historical),'Prior checkpoints rewritten');
const encoding=fs.readFileSync('public/photo-import.js','utf8'),app=fs.readFileSync('public/app.js','utf8');
for(const expected of ["maxDimension=3072","quality=.94","maxDataURLLength=2850000","const qualities=[quality,...[.88,.82].filter(q=>q<quality)]",
 "if(jpeg.length<=maxDataURLLength)return jpeg"])
 assert.ok(encoding.includes(expected),'Broken bounded import budget: '+expected);
assert.ok(app.includes('function recognitionSourcePhoto(')&&app.includes('const sourcePhoto=recognitionSourcePhoto(item)'),
 'Original photo classification-before-masking guard changed');
const human=reconcile(packetFromLock(fs.readFileSync(LOCK)),[]);
assert.equal(human.suppliedSubmissions,0);
assert.equal(human.approvedModelAccuracy,null);
assert.equal(human.productionPromotion,'BLOCKED');
console.log(JSON.stringify({scope:'ONLY_IMPORT_JPEG_QUALITY_LADDER',originalRecognitionSourceUnchanged:true,
 privateCloudSchemaUnchanged:true,qualityAttempts:[.94,.88,.82],maxEncodedCharacters:2850000,
 sourceLockUnchanged:true,humanReviews:0,accuracy:null,productionPromotion:'BLOCKED',physicalPhoneValidated:false,
 merged:false,deployed:false}));
