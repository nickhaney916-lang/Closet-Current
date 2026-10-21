// Protect the exact verified PR #141 source while adding private audit tooling.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const BASE='de05f2a9dc23a02acebd74dfed11b979a59b15a6';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
execFileSync('git',['merge-base','--is-ancestor',BASE,'HEAD']);
const allowed=new Set([
 'benchmark/private-pilot-cohort-consistency.mjs',
 'scripts/review-private-pilot-cohort.mjs',
 'scripts/check-private-pilot-cohort-scope.mjs',
 'tests/private-pilot-cohort.test.mjs',
 'tests/private-pilot-cohort-cli.test.mjs',
 '.github/workflows/private-pilot-cohort-qa.yml',
 'docs/PRIVATE-PILOT-COHORT-20261021.md',
 'docs/PROGRESS-CHECKPOINT.md'
]);
for(const path of git('diff','--name-only',BASE,'HEAD','--').split('\n').filter(Boolean)){
 assert.ok(allowed.has(path),'Unexpected production or reviewer source edit: '+path);
 if(path==='docs/PROGRESS-CHECKPOINT.md'){
  assert.ok(readFileSync(path,'utf8').endsWith(git('show',BASE+':'+path)+'\n'),
   'Earlier verified checkpoint entries were rewritten');
 }else assert.equal(git('ls-tree',BASE,'--',path),'','Existing source file replaced: '+path);
}
for(const path of [
 'public/index.html','public/app.js','public/photo-import.js',
 'public/device-check-engine.js','public/device-check.js',
 'public/saved-closet-audit-engine.js','public/phone-photo-benchmark.mjs',
 'public/sw.js','scripts/build.mjs',
 'benchmark/private-end-to-end-pilot-review.mjs',
 'benchmark/private-saved-closet-review.mjs',
 'benchmark/review-phone-pilot-reports.mjs',
 '.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml',
 'supabase/cloud-backup.sql','benchmark/independent-source-holdout/locked.json'
]){
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',BASE+':'+path),
  'Protected previous tested source modified: '+path);
}
const review=reconcile(packetFromLock(readFileSync(LOCK)),[]);
assert.equal(review.suppliedSubmissions,0);
assert.equal(review.approvedModelAccuracy,null);
assert.equal(review.productionPromotion,'BLOCKED');
console.log(JSON.stringify({
 status:'PRIVATE_COHORT_SCOPE_PROTECTED',
 priorVerifiedSource:BASE,
 customerRuntimeUnchanged:true,
 noHostedOrProductionChanges:true,
 realPhysicalPhonesTested:0,
 goldRecognitionAccuracy:null,
 productionPromotion:'BLOCKED'
}));
