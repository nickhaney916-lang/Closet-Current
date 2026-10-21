// Narrow single-block video uploader safety change, stacked on exact verified PR131.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20000000}).trim();
const BASE='7566b59e7377d77d8503c7c599aabe32fd3959dc',APP='2b02c4c0f7bbdb0e2e9166d7c113f8e21064af9d';
assert.equal(git('merge-base','HEAD',BASE),BASE,'Not descended from verified PR131');
assert.equal(git('rev-parse','HEAD:public/app.js'),APP,'Unreviewed customer application change');
const allowed=new Set(['public/app.js','tests/video-import-bounded-owner.test.cjs',
 'scripts/check-video-import-bounded-scope.mjs','.github/workflows/video-import-bounded-qa.yml',
 'docs/VIDEO-IMPORT-BOUNDED-20261021.md','docs/PROGRESS-CHECKPOINT.md',
 'scripts/test-video-import-bounded-mobile.mjs']);
for(const p of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))
 assert.ok(allowed.has(p),'Unexpected app or protected source change: '+p);
for(const p of ['public/photo-import.js','public/auth.js','public/recognition-engine.mjs',
 'public/recognition-photo.mjs','public/photo-color.js','public/trends.js',
 'public/index.html','public/outfit-board.js','public/closet-stylist.js',
 'public/cloud-backup.js','public/device-check-engine.js','public/photo-check.js',
 'benchmark/independent-source-holdout/locked.json','supabase/cloud-backup.sql',
 'scripts/source-holdout-human-review.mjs'])
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),
  'Protected photo, owner, recognition, source packet or cloud logic edited: '+p);
const previous=execFileSync('git',['show',BASE+':public/app.js'],{encoding:'utf8'});
const current=fs.readFileSync('public/app.js','utf8');
function strip(source){
 const a=source.indexOf('function waitEvent(');
 const b=source.indexOf("$('upload').onchange=",a);
 assert.ok(a>=0&&b>a,'Expected uploader boundaries not found');
 return source.slice(0,a)+'/* audited bounded owner-safe video import */\n'+source.slice(b);
}
assert.equal(strip(current),strip(previous),
 'Unexpected changes outside existing single video upload section');
for(const marker of [
 'function videoSampleTimes(duration,requestedSeconds)',
 'times.length<20','const owner=window.closetAuth?.user?.id;',
 'if(!sameOwner())throw Error','const seek=waitEvent(video',
 "candidate(snap());","const added=batch.length-startLength",
 'video.pause?.();video.removeAttribute'
])assert.ok(current.includes(marker),'Bounded video safety check missing: '+marker);
const original=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(original),'Checkpoint history overwritten');
const gold=reconcile(packetFromLock(fs.readFileSync(LOCK)),[]);
assert.equal(gold.suppliedSubmissions,0);assert.equal(gold.approvedModelAccuracy,null);
assert.equal(gold.productionPromotion,'BLOCKED');
console.log(JSON.stringify({scope:'VIDEO_ONLY_BOUNDED_OWNER_CHECKED',videoSamplesMax:20,
 originalGarmentRecognitionUnchanged:true,tenantCloudUnchanged:true,humanReviewEvidenceFrozen:true,
 actualPhoneTests:0,realAccuracy:null,productionPromotion:'BLOCKED'}));
