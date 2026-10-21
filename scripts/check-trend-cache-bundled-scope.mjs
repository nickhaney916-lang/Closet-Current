// Exact-substring isolated trend cache reliability fix. No clothing sources, auth, model, network grant or data changes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const BASE='46f9c521466976b4ec238d24b1eb1d7871e3bffb', BOARD_SHA='f4a3d74c8a1cd35d78cfc0b1493b8119bee5cae4';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:18000000}).trim();
assert.equal(git('merge-base','HEAD',BASE),BASE,'Must start from fully verified PR127 original');
assert.equal(git('rev-parse','HEAD:public/outfit-board.js'),BOARD_SHA,'Unexpected styling runtime modification');
const allowed=new Set(['public/outfit-board.js','tests/trend-cache-bundled-fallback.test.cjs',
 'scripts/test-trend-cache-fallback-browsers.mjs','scripts/check-trend-cache-bundled-scope.mjs',
 '.github/workflows/trend-cache-bundled-qa.yml','docs/TREND-OFFLINE-BUNDLED-FALLBACK-20261021.md',
 'docs/PROGRESS-CHECKPOINT.md']);
for(const p of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))
 assert.ok(allowed.has(p),'Unauthorized app/photo/security/human review change: '+p);
for(const p of ['public/app.js','public/photo-import.js','public/photo-color.js','public/recognition-engine.mjs',
 'public/recognition-photo.mjs','public/auth.js','public/cloud-backup.js','public/trend-library.js',
 'public/trend-data.json','public/closet-stylist.js','public/outfit-board-engine.js',
 'public/saved-closet-audit.html','public/device-check-engine.js','supabase/cloud-backup.sql',
 'benchmark/independent-source-holdout/locked.json',
 'benchmark/review-phone-pilot-reports.mjs','scripts/source-holdout-human-review.mjs'])
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),'Frozen app/model/cloud/privacy/trend source modified: '+p);
const old=execFileSync('git',['show',BASE+':public/outfit-board.js'],{encoding:'utf8'});
const oldRemote="if(!activeTrendLibrary||Date.parse(library.updatedAt)>=Date.parse(activeTrendLibrary.updatedAt)){applyLoadedTrendLibrary(data);try{localStorage.setItem(TREND_CACHE,JSON.stringify(data));}catch{}}";
const newRemote="if(!activeTrendLibrary||Date.parse(library.updatedAt)>Date.parse(activeTrendLibrary.updatedAt)){applyLoadedTrendLibrary(data);try{localStorage.setItem(TREND_CACHE,JSON.stringify(data));}catch{}}";
const oldBundle=" if(!activeTrendLibrary){try{const response=await fetch('./trend-data.json');if(response.ok)applyLoadedTrendLibrary(await response.json());}catch{}}";
const newBundle=[
 " // An older but valid phone cache must not hide a newer library shipped with this build.",
 " // Always inspect the bundled library, including when the phone is offline or the",
 " // GitHub background refresh cannot be reached. Never replace newer cache data.",
 " try{",
 "  const response=await fetch('./trend-data.json');",
 "  if(response.ok){const data=await response.json(),library=normalizeTrendLibrary(data);",
 "   if(!activeTrendLibrary||Date.parse(library.updatedAt)>Date.parse(activeTrendLibrary.updatedAt)){",
 "    applyLoadedTrendLibrary(data);",
 "    try{localStorage.setItem(TREND_CACHE,JSON.stringify(data));}catch{}",
 "   }",
 "  }",
 " }catch{}"
].join('\n');
assert.ok(old.includes(oldRemote)&&old.includes(oldBundle));
assert.equal(fs.readFileSync('public/outfit-board.js','utf8'),old.replace(oldRemote,newRemote).replace(oldBundle,newBundle),
 'Unreviewed changes outside exact two trend freshness branches');
const previous=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(previous),'Prior checkpoint record overwritten');
const human=reconcile(packetFromLock(fs.readFileSync(LOCK)),[]);
assert.equal(human.suppliedSubmissions,0);assert.equal(human.approvedModelAccuracy,null);
assert.equal(human.productionPromotion,'BLOCKED');
console.log(JSON.stringify({scope:'TREND_CACHE_BUNDLE_OFFLINE_PRIORITY_ONLY',existingTrendResearchSourceUnchanged:true,
 newDataFetchOrigins:0,physicalPhoneValidated:false,humanReviews:0,recognitionAccuracy:null,
 cloudAndOwnedClosetUnchanged:true,paidAI:false,productionPromotion:'BLOCKED',merged:false,deployed:false}));
