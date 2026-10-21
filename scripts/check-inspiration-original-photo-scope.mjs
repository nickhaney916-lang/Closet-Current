// Only inspiration photo → owned closet handoff; full original source is temporary and account-bound.
// Neither recognition engine nor cloud/account/security nor original mask review may change.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20000000}).trim();
const BASE='df6dfa071838c054ac8f3f26a64985252e1050e0',APPROVED='5c152461570b5c3488e2db0724ac0ded49eab67c';
assert.equal(git('merge-base','HEAD',BASE),BASE,'Must descend from verified trend cache PR129');
assert.equal(git('rev-parse','HEAD:public/trends.js'),APPROVED,'Unexpected inspiration source changes');
const allowed=new Set([
 'public/trends.js','tests/inspiration-original-photo-transfer.test.cjs',
 'scripts/test-inspiration-original-photo-browsers.mjs',
 'scripts/check-inspiration-original-photo-scope.mjs',
 '.github/workflows/inspiration-original-photo-qa.yml',
 'docs/INSPIRATION-ORIGINAL-PHOTO-TRANSFER-20261021.md','docs/PROGRESS-CHECKPOINT.md'
]);
for(const p of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))
 assert.ok(allowed.has(p),'Unrelated customer/auth/model/data file modified: '+p);
for(const p of ['public/app.js','public/photo-import.js','public/photo-color.js',
 'public/recognition-engine.mjs','public/recognition-photo.mjs',
 'public/index.html','public/auth.js','public/cloud-backup.js',
 'public/outfit-board.js','public/closet-stylist.js','public/outfit-board-engine.js',
 'public/trend-data.json','public/trend-library.js','public/clothing-details.js',
 'public/saved-closet-audit.html','public/device-check-engine.js',
 'supabase/cloud-backup.sql','benchmark/independent-source-holdout/locked.json',
 'scripts/source-holdout-human-review.mjs'])
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),'Protected customer data or full-frame recognition changed: '+p);
const s=fs.readFileSync('public/trends.js','utf8');
for(const part of [
 'lookOriginalFile=null,lookOriginalOwner=null',
 'lookOriginalFile=file;lookOriginalOwner=selectedOwner;',
 "const image=await photoToJPEG(file);",
 "owner!==window.closetAuth?.user?.id",
 'selected!==lookPhotoSelection',
 "if(candidate(image)){switchView('review')",
 "canvas.toDataURL('image/jpeg',.8)",
 "lookImage=preview",
 "clearLookOriginal();activeLookId=look.id;"
])assert.ok(s.includes(part),'Source transfer/preview provenance guard missing: '+part);
const prior=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(prior),'Historical checkpoint rewritten');
const h=reconcile(packetFromLock(fs.readFileSync(LOCK)),[]);
assert.equal(h.suppliedSubmissions,0);
assert.equal(h.approvedModelAccuracy,null);
assert.equal(h.productionPromotion,'BLOCKED');
console.log(JSON.stringify({scope:'INSPIRATION_FULL_SOURCE_TO_CLOSET_ONLY',
 canonicalImportEncodingUnchanged:true,originalBeforeMaskUnchanged:true,
 inspirationPreviewLightweight:true,originalFileNotPersisted:true,
 ownerSeparationPreserved:true,privateCloudUnchanged:true,
 physicalPhoneValidated:false,humanReviews:0,realRecognitionAccuracy:null,
 productionPromotion:'BLOCKED',merged:false,deployed:false}));
