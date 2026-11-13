'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const app=readFileSync('public/app.js','utf8');
const importSource=readFileSync('public/native-default-atomic-import-m3.mjs','utf8');
const exportSource=readFileSync('public/native-default-verified-backup-export-m3.mjs','utf8');
const v4Source=readFileSync('public/native-lossless-v4-owner-acceptance-m3.mjs','utf8');
const extract=(before,after)=>{
 const a=app.indexOf(before),b=app.indexOf(after,a);assert.ok(a>=0&&b>a,'Missing integrated live source: '+before);return app.slice(a,b);
};
test('default export uses durable owner snapshot and does not silently omit unfinished originals',()=>{
 const source=extract("$('export').onclick=async()=>{","$('import').onchange=async");
 assert.match(source,/ownerWardrobeMutationLease\(\)/);
 assert.match(source,/exportDurableOwnerBackupM3/);
 assert.match(source,/if\(!idle\(\)\)throw Error/);
 assert.match(source,/pendingWrites=writes/);
 assert.match(source,/v3 backup cannot restore unfinished Photo results/);
});
test('unflagged import is an owner-lease, confirmed, single-transaction original-preserving import',()=>{
 const source=extract("$('import').onchange=async","window.addEventListener('beforeunload'");
 assert.match(source,/prepareDefaultAtomicM3/);
 assert.match(source,/commitDefaultAtomicM3/);
 assert.match(source,/ownerWardrobeMutationLease\(\)/);
 assert.match(source,/assertImport\(\)/);
 assert.match(source,/Original photos and outfits|original photos and outfits/);
});
test('v4 full-original backup is separately research gated and never a v3 success claim',()=>{
 const source=extract("$('export').onclick=async()=>{","$('import').onchange=async");
 assert.match(source,/get\('losslessV4M3'\)==='research'/);
 assert.match(source,/exportLosslessV4M3/);
 assert.match(source,/unfinished photographs/);
 assert.match(source,/original JPEGs intact/);
 assert.match(source,/get\('restoreAtomic01'\)==='research'/);
});
test('v4 import confirms original pending photo replacement before atomic restore',()=>{
 const source=extract("$('import').onchange=async","window.addEventListener('beforeunload'");
 assert.match(source,/get\('losslessV4M3'\)==='research'&&data\?\.version===4/);
 assert.match(source,/restoreLosslessV4M3/);
 assert.match(source,/incomingDrafts/);
 assert.match(source,/if\(restored\.cancelled\)/);
 assert.match(source,/Full v4 backup restored on this device/);
});
test('all three modules retain owner, JPEG, SHA and atomic transaction enforcement',()=>{
 for(const s of [importSource,exportSource,v4Source]){
  assert.match(s,/ownerId/);
  assert.match(s,/ownerDB/);
  assert.match(s,/assertLease/);
 }
 assert.match(importSource,/transaction\(/);
 assert.match(exportSource,/transaction\(/);
 assert.match(v4Source,/sourceSHA256/);
 assert.match(v4Source,/pendingOriginals/);
});
test('integrated account-session action gates, v4 and family HOLD all remain in one source',()=>{
 assert.match(app,/function ownerStyleCardActionLease\(item\)/);
 assert.match(app,/function ownerFailedPhotoRetryLease\(item\)/);
 assert.match(app,/lease=ownerWardrobeMutationLease\(\)/);
 assert.match(app,/familyAlpha:'HOLD',releaseAuthorized:false/);
});
