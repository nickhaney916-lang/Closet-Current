// This branch adds ONLY private offline pilot evidence tools. No app mutation.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const BASE='214b5ef9ac6ace22dcb81b25e7761bc4439eca61';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
execFileSync('git',['merge-base','--is-ancestor',BASE,'HEAD']);
const allowed=new Set([
 'scripts/offline-pilot-cohort-organizer.mjs',
 'scripts/test-offline-pilot-cohort-browser.mjs',
 'scripts/check-offline-pilot-organizer-scope.mjs',
 'tests/offline-pilot-cohort-organizer.test.mjs',
 '.github/workflows/offline-pilot-cohort-qa.yml',
 'docs/OFFLINE-PILOT-COHORT-REVIEW-20261021.md',
 'docs/PROGRESS-CHECKPOINT.md'
]);
for(const f of git('diff','--name-only',BASE,'HEAD','--').split('\n').filter(Boolean)){
 assert.ok(allowed.has(f),'Protected customer/runtime/hosting file edited: '+f);
 if(f==='docs/PROGRESS-CHECKPOINT.md'){
  assert.ok(readFileSync(f,'utf8').endsWith(git('show',BASE+':'+f)+'\n'),
   'Previous checkpoint rewritten');
 }else assert.equal(git('ls-tree',BASE,'--',f),'','Existing source replaced');
}
for(const p of [
 'public/app.js','public/index.html','public/photo-import.js','public/sw.js',
 'public/saved-closet-audit-engine.js','public/phone-photo-benchmark.mjs',
 'public/device-check-engine.js','public/auth.js',
 'benchmark/private-pilot-cohort-consistency.mjs',
 'benchmark/private-end-to-end-pilot-review.mjs','benchmark/private-saved-closet-review.mjs',
 'benchmark/independent-source-holdout/locked.json',
 'supabase/cloud-backup.sql','.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml'
])assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),
 'Original app/model/hosting changed: '+p);
const evidence=reconcile(packetFromLock(readFileSync(LOCK)),[]);
assert.equal(evidence.suppliedSubmissions,0);
assert.equal(evidence.approvedModelAccuracy,null);
assert.equal(evidence.productionPromotion,'BLOCKED');
console.log(JSON.stringify({status:'OFFLINE_COHORT_SOURCE_PROTECTED',
 parentSHA:BASE,hardwareTests:0,realGoldAccuracy:null,productionPromotion:'BLOCKED'}));
