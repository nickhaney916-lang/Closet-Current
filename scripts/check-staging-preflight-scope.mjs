import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const BASE='fd70faa88fb6245e4b065aae3158531b715498e9';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
execFileSync('git',['merge-base','--is-ancestor',BASE,'HEAD']);
const allow=new Set([
 'scripts/build-restricted-staging.mjs',
 'scripts/verify-restricted-staging-bundle.mjs',
 'scripts/check-staging-preflight-scope.mjs',
 'tests/restricted-staging-preflight.test.mjs',
 '.github/workflows/restricted-staging-prepare-qa.yml',
 'docs/RESTRICTED-STAGING-SETUP-20261021.md',
 'docs/PROGRESS-CHECKPOINT.md'
]);
for(const path of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean)){
 assert.ok(allow.has(path),'Unapproved production or hosted service edit '+path);
 if(path==='docs/PROGRESS-CHECKPOINT.md')
  assert.ok(readFileSync(path,'utf8').endsWith(git('show',BASE+':'+path)+'\n'),
   'Historical checkpoint overwritten');
 else assert.equal(git('ls-tree',BASE,'--',path),'','Existing service or app source edited');
}
for(const p of [
 'public/auth.js','public/cloud-backup.js','public/ai-tryon.js',
 'public/app.js','public/index.html','public/sw.js',
 'public/recognition-vectors.json','supabase/cloud-backup.sql',
 '.github/workflows/cloudflare-pages.yml','.github/workflows/pages.yml'
])assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),
 'Production or source evidence unexpectedly changed: '+p);
const human=reconcile(packetFromLock(readFileSync(LOCK)),[]);
assert.equal(human.suppliedSubmissions,0);
assert.equal(human.approvedModelAccuracy,null);
assert.equal(human.productionPromotion,'BLOCKED');
console.log(JSON.stringify({status:'RESTRICTED_STAGING_PREPARATION_SOURCE_SAFE',
 previousSource:BASE,changedExistingProductFiles:0,
 newRemoteStagingDeployed:false,
 realPhysicalPhoneChecks:0,productionPromotion:'BLOCKED'}));
