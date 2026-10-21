// Only asynchronous owner checks around photo batch imports; no Auth, model, cloud or backup changes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const BASE='801b70926283ffe920cbfa2d05560288b3afaaf4';
const APP='84f56b259f471c87cc0144f9f1ec01a6c242e7ff',IMPORT='f9790cb80eb6b20eb744af3da4a553ccd5de513e';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20000000}).trim();
assert.equal(git('merge-base','HEAD',BASE),BASE,'Unexpected base');
assert.equal(git('rev-parse','HEAD:public/app.js'),APP,'Unapproved change to customer runtime');
assert.equal(git('rev-parse','HEAD:public/photo-import.js'),IMPORT,'Unapproved photo decoder change');
const allowed=new Set(['public/app.js','public/photo-import.js',
 'tests/photo-import.test.cjs','tests/photo-batch-owner-cancellation.test.cjs',
 'scripts/test-photo-batch-owner-mobile.mjs','scripts/check-photo-batch-owner-scope.mjs',
 '.github/workflows/photo-batch-owner-qa.yml',
 'docs/PHOTO-BATCH-ACCOUNT-SWITCH-20261021.md','docs/PROGRESS-CHECKPOINT.md']);
for(const p of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))
 assert.ok(allowed.has(p),'Unrelated model/cloud/auth/recognition edit: '+p);
for(const p of [
 'public/auth.js','public/cloud-backup.js','public/recognition-engine.mjs',
 'public/recognition-photo.mjs','public/trends.js','public/outfit-board.js',
 'public/taxonomy.js','public/photo-color.js','public/closet-stylist.js',
 'public/garment-display-preview.js','public/index.html',
 'public/trend-data.json','public/trend-library.js',
 'supabase/cloud-backup.sql','benchmark/independent-source-holdout/locked.json',
 'scripts/source-holdout-human-review.mjs'])
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),'Protected source changed: '+p);
const originalApp=execFileSync('git',['show',BASE+':public/app.js'],{encoding:'utf8'});
const newApp=fs.readFileSync('public/app.js','utf8');
const stripApp=src=>{
 const a=src.indexOf('async function importClothingPhotos('),b=src.indexOf("$('clothingPhotos').onchange=",a);
 assert.ok(a>=0&&b>a);return src.slice(0,a)+'/* isolated account-current photo import */\n'+src.slice(b);
};
assert.equal(stripApp(newApp),stripApp(originalApp),'Unexpected app edit beyond one photo batch handler');
const originalImport=execFileSync('git',['show',BASE+':public/photo-import.js'],{encoding:'utf8'});
const before='async function readPhotoBatch(';
assert.equal(
 fs.readFileSync('public/photo-import.js','utf8').split(before)[0],
 originalImport.split(before)[0],
 'Photo decoding, JPEG quality/order, source resolution or limits changed');
for(const fragment of [
 "const owner=window.closetAuth?.user?.id;",
 "const isCurrent=()=>owner===window.closetAuth?.user?.id;",
 "const result=await readPhotoBatch(files,photoToJPEG,",
 "},{isCurrent});",
 "result.cancelled",
 "window.__lastPhotoImportResult={added:0,errors:[],results:[],cancelled:true}",
 "if(!isCurrent()){cancelled=true;break;}",
 "const image=await decode(file);"
])assert.ok(newApp.includes(fragment)||fs.readFileSync('public/photo-import.js','utf8').includes(fragment),
 'Cancelled stale photo import protection changed: '+fragment);
const prior=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(prior),'Prior progress record edited');
const gold=reconcile(packetFromLock(fs.readFileSync(LOCK)),[]);
assert.equal(gold.suppliedSubmissions,0);assert.equal(gold.approvedModelAccuracy,null);
assert.equal(gold.productionPromotion,'BLOCKED');
console.log(JSON.stringify({scope:'PHOTO_IMPORT_ORIGINAL_OWNER_CANCELLATION',photoOriginalAndJpegUnchanged:true,
 classifierUnchanged:true,cloudAndAuthUnchanged:true,
 signedInOwnerCheckedAfterEachDecode:true,realPhysicalPhonesTested:0,
 verifiedHumanGold:0,actualRecognitionAccuracy:null,
 productionPromotion:'BLOCKED',merged:false,deployed:false}));
