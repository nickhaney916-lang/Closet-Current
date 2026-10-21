// Isolated manual phone still JPEG quality-budget change; does not certify hardware.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20_000_000}).trim();
const BASE='61e4a87672ec603e29d9f10763d25d803ecbb801',APP_SHA='2bac7dae8c9d13f7b8ed1baf9d41750bb0878b48';
assert.equal(git('merge-base','HEAD',BASE),BASE,'Not descended from verified import PR123');
assert.equal(git('rev-parse','HEAD:public/app.js'),APP_SHA,'Unapproved customer source change');
const allowed=new Set([
 'public/app.js','tests/photo-native-still.test.cjs','scripts/test-native-still-detail-budget-browsers.mjs',
 'scripts/check-native-still-detail-budget-scope.mjs','.github/workflows/native-still-detail-budget-qa.yml',
 'docs/NATIVE-STILL-DETAIL-FIRST-20261021.md','docs/PROGRESS-CHECKPOINT.md',
 'scripts/check-import-detail-budget-scope.mjs','scripts/check-offline-review-coordinator-source.mjs',
 'scripts/check-one-click-review-source.mjs','scripts/check-human-review-cloud-bridge.mjs',
 'scripts/check-blind-photo-cloud-integration.mjs','scripts/verify-camera-cloud-integration.mjs']);
for(const p of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))
 assert.ok(allowed.has(p),'Unrelated customer or source review modification: '+p);
for(const p of ['public/photo-import.js','public/auth.js','public/recognition-engine.mjs','public/recognition-photo.mjs',
 'public/photo-color.js','public/photo-check.js','public/cloud-backup.js','public/closet-stylist.js','public/outfit-board.js',
 'supabase/cloud-backup.sql','benchmark/independent-source-holdout/locked.json',
 'scripts/source-holdout-human-review.mjs','scripts/one-click-human-review.mjs',
 'scripts/offline-review-coordinator.mjs'])
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),'Protected customer or human source changed: '+p);
const old=[
 "   // Every retry draws from original decoded RGB, never a previous JPEG.",
 "   context.drawImage(bitmap,0,0,canvas.width,canvas.height);",
 "   const jpeg=canvas.toDataURL('image/jpeg',.94);",
 "   if(!jpeg||jpeg==='data:,')throw Error('Unable to encode camera photo.');",
 "   if(jpeg.length<=2850000)return jpeg;"].join('\n');
const updated=[
 "   // Every pixel-size retry draws from original decoded RGB, never a previous JPEG.",
 "   context.drawImage(bitmap,0,0,canvas.width,canvas.height);",
 "   // Preserve cuff, sole and seam resolution when slight JPEG compression fits.",
 "   // Do not redraw or downscale until all bounded same-size encodings fail.",
 "   for(const quality of [.94,.88,.82]){",
 "    if(!isCurrent())throw Error('Camera session ended while preparing photo.');",
 "    const jpeg=canvas.toDataURL('image/jpeg',quality);",
 "    if(!jpeg||jpeg==='data:,')throw Error('Unable to encode camera photo.');",
 "    if(jpeg.length<=2850000)return jpeg;",
 "   }"].join('\n');
const base=execFileSync('git',['show',BASE+':public/app.js'],{encoding:'utf8',maxBuffer:20_000_000});
assert.ok(base.includes(old)&&!base.includes(updated),'Original camera source unexpectedly changed');
assert.equal(fs.readFileSync('public/app.js','utf8'),base.replace(old,updated),
 'Native camera source has changes outside its bounded photo encoder');
const prior=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(prior),'Prior checkpoint history rewritten');
const human=reconcile(packetFromLock(fs.readFileSync(LOCK)),[]);
assert.equal(human.suppliedSubmissions,0);assert.equal(human.approvedModelAccuracy,null);
assert.equal(human.productionPromotion,'BLOCKED');
console.log(JSON.stringify({scope:'ONLY_NATIVE_STILL_JPEG_QUALITY_LADDER',appBlob:APP_SHA,
 qualityAttempts:[.94,.88,.82],pixelLimits:[3072,2560,2048,1536,1024],dataURLLimit:2850000,
 originalRgbRecognitionBeforeMaskUnchanged:true,ownerCloudSourceUnchanged:true,actualHumanReviews:0,
 accuracy:null,productionPromotion:'BLOCKED',physicalPhoneValidated:false,merged:false,deployed:false}));
