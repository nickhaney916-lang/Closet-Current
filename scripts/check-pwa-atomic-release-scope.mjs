// Exact PWA worker-only change: customer storage, authentication, recognition and release guard untouched.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const BASE='4474eb70890b53b4f48342bade5283fab131d93b';
const SW='708907d2688242f7eb80eb363f85b437ab2bd712';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:20000000}).trim();
assert.equal(git('merge-base','HEAD',BASE),BASE,'Must descend from completed verified PR #138');
assert.equal(git('rev-parse','HEAD:public/sw.js'),SW,'Unexpected release cache policy change');
const allowed=new Set([
 'public/sw.js','tests/pwa-atomic-release.test.mjs',
 'scripts/test-pwa-atomic-release-mobile.mjs',
 'scripts/check-pwa-atomic-release-scope.mjs',
 '.github/workflows/pwa-atomic-offline-release-qa.yml',
 'docs/PWA-ATOMIC-OFFLINE-RELEASE-20261021.md',
 'docs/PROGRESS-CHECKPOINT.md'
]);
for(const p of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))
 assert.ok(allowed.has(p),'Unapproved customer data or phone change: '+p);
for(const p of [
 'public/index.html','public/pwa.js','public/manifest.webmanifest',
 'public/app.js','public/auth.js','public/trends.js','public/outfit-board.js',
 'public/outfit-board-engine.js','public/photo-import.js','public/capture.js',
 'public/closet-stylist.js','public/cloud-backup.js','public/cloud-backup-engine.js',
 'public/recognition-engine.mjs','public/recognition-photo.mjs',
 'public/trend-data.json','public/trend-library.js',
 'public/recognition-vectors.json','scripts/build.mjs',
 '.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml',
 'supabase/cloud-backup.sql','benchmark/independent-source-holdout/locked.json',
 'scripts/source-holdout-human-review.mjs'
])assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),
 'Forbidden production, model, Auth, data or deploy change: '+p);
const sw=fs.readFileSync('public/sw.js','utf8');
for(const safety of [
 'cache.addAll(urls)',
 "event.request.method!=='GET'",
 "url.origin!==self.location.origin",
 'if(!isHome&&!allowed.has(url.href))return;',
 'const saved=await cache.match(isHome?index:event.request);',
 'if(saved)return saved;',
 'status:503',
 "'Cache-Control':'no-store'"
])assert.ok(sw.includes(safety),'Missing immutable offline version/source gate: '+safety);
assert.ok(!sw.includes('cache.put('),'Fetching must never rewrite an installed version cache');
assert.ok(!sw.includes('skipWaiting('),'Do not force activate new releases into open old-tab sessions');
assert.ok(!sw.includes('indexedDB'),'No service worker wardrobe persistence mutation');
const old=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(old),'Prior checkpoint tampered');
const human=reconcile(packetFromLock(fs.readFileSync(LOCK)),[]);
assert.equal(human.suppliedSubmissions,0);
assert.equal(human.approvedModelAccuracy,null);
assert.equal(human.productionPromotion,'BLOCKED');
console.log(JSON.stringify({
 scope:'ONLY_VERSION_PINNED_PWA_WORKER',
 sourcePhotoAndRecognitionUnchanged:true,authAndCloudUnchanged:true,
 customerIndexedDBUnchanged:true,pilotPrivacyUntouched:true,
 newWorkerInstallIsAtomic:true,activeWorkerNoRuntimeCacheMutation:true,
 realPhoneHardwareTested:false,independentHumanAccuracy:null,
 productionPromotion:'BLOCKED',mergeApproved:false,deployed:false}));
