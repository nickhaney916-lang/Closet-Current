import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const BASE='fd70faa88fb6245e4b065aae3158531b715498e9';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
execFileSync('git',['merge-base','--is-ancestor',BASE,'HEAD']);
const allow=new Set([
 'scripts/test-staging-runtime-browsers.mjs',
 '.github/workflows/staging-runtime-browser-qa.yml',
 'docs/STAGING-RUNTIME-BROWSERS-20261021.md',
 'scripts/check-staging-anonymous-access.mjs',
 'tests/staging-anonymous-access.test.mjs',
 'docs/STAGING-ANONYMOUS-ACCESS-20261021.md',
 '.github/workflows/staging-anonymous-access-qa.yml',
 'tests/restricted-staging-integration.test.mjs',
 '.github/workflows/restricted-staging-integration-qa.yml',
 'docs/RESTRICTED-STAGING-INTEGRATION-20261021.md',
 'scripts/build-restricted-staging.mjs',
 'scripts/atomic-staging-output.mjs',
 'tests/atomic-staging-output.test.mjs',
 'docs/ATOMIC-RESTRICTED-STAGING-OUTPUT-20261021.md',
 'scripts/verify-restricted-staging-bundle.mjs',
 'scripts/test-staging-sw-cache.mjs',
 'scripts/test-staging-installed-pwa-chromium.mjs',
 '.github/workflows/staging-installed-pwa-browser-qa.yml',
 '.github/workflows/staging-build-lock-qa.yml',
 'docs/STAGING-BUILD-LOCK-RECOVERY-20261021.md',
 'docs/STAGING-INSTALLED-PWA-BROWSER-20261021.md',
 '.github/workflows/staging-pwa-cache-qa.yml',
 'docs/STAGING-PWA-CACHE-20261021.md',
 'scripts/check-staging-preflight-scope.mjs',
 'tests/restricted-staging-preflight.test.mjs',
 '.github/workflows/restricted-staging-prepare-qa.yml',
 'docs/RESTRICTED-STAGING-SETUP-20261021.md',
 'docs/PROGRESS-CHECKPOINT.md'
]);
// A combined candidate uses a stricter two-parent source pin instead of
// treating verified security dependencies as unreviewed staging-only edits.
const integrated=['c0fecc398ea927418c5e083607bdc1cf6ea77527','cca2f7c98f69d5aad416e6174182ac3f66b9b951']
 .every(sha=>spawnSync('git',['merge-base','--is-ancestor',sha,'HEAD']).status===0);
if(integrated){
 execFileSync(process.execPath,['scripts/check-integrated-security-mobile-staging.mjs'],{stdio:'inherit'});
 if(spawnSync('git',['merge-base','--is-ancestor','3e594a5714b7822ada852cd74d8bc5dc2d51c6ad','HEAD']).status===0)
  execFileSync(process.execPath,['scripts/check-final-integrated-artifact-review.mjs'],{stdio:'inherit'});
 if(spawnSync('git',['merge-base','--is-ancestor','a62f12448671eaa5a85bd2d45bd1382d1fd699f4','HEAD']).status===0)
  execFileSync(process.execPath,['scripts/check-integrated-asset-seal.mjs'],{stdio:'inherit'});
}
else for(const path of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean)){
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
