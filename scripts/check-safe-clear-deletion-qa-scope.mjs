// Integration of issue196 TESTS only into the safe-clear staging candidate.
// Guard is purposely scoped to the exact original PR197 staging source.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const BASE='e29aaad4b604b7b451cf4535309012082016c279';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
git('merge-base','--is-ancestor',BASE,'HEAD');
const allowed=new Set([
 'docs/ISSUE-196-OFFLINE-DELETION-PROOF.md',
 'docs/INTEGRATED-SAFE-CLEAR-DELETION-QA.md',
 'tests/helpers/issue196-deletion-fixture.mjs',
 'tests/helpers/issue196-no-network.cjs',
 'tests/issue196-network-denial.test.mjs',
 'tests/issue196-offline-deletion-lifecycle.test.mjs',
 'scripts/check-safe-clear-deletion-qa-scope.mjs',
 '.github/workflows/safe-clear-deletion-offline-qa.yml'
]);
const changed=git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean);
assert.ok(changed.length>=7,'Deletion QA integration was incomplete');
for(const path of changed)assert.ok(allowed.has(path),'Unexpected app/hosted change: '+path);
for(const essential of ['tests/issue196-offline-deletion-lifecycle.test.mjs','tests/issue196-network-denial.test.mjs','tests/clear-draft-durability.test.cjs']){
 if(essential.startsWith('tests/issue196'))
  assert.ok(changed.includes(essential),'Missing independent deletion case: '+essential);
 else assert.ok(readFileSync(essential,'utf8').includes('test('),'Missing safe-clear regression');
}
for(const basePath of ['public','supabase','scripts/build-restricted-staging.mjs',
 'scripts/build-connected-staging-candidate.mjs','.github/workflows/safe-clear-staging-package.yml',
 'tests/clear-draft-durability.test.cjs']){
 assert.equal(git('rev-parse','HEAD:'+basePath),git('rev-parse',BASE+':'+basePath),
  'Safe-clear app/backend/release package unexpectedly changed: '+basePath);
}
const endpoint=readFileSync('supabase/functions/account-delete/index.ts','utf8');
assert.match(endpoint,/status:\s*503/,'Deletion endpoint must remain disabled 503');
assert.match(endpoint,/deletionCompleted:\s*false/,'Cannot claim deletion completion');
const workflow=readFileSync('.github/workflows/safe-clear-deletion-offline-qa.yml','utf8');
assert.doesNotMatch(workflow,/secrets\.|id-token:\s*write|supabase\s+(start|db|functions)|wrangler|cloudflare|deploy/i,
 'QA workflow may never deploy, use live cloud secrets or run Supabase CLI');
console.log('SAFE_CLEAR_DELETION_QA_SCOPE_PASS '+JSON.stringify({
base:BASE,changedPaths:changed.length,appCodeUnchanged:true,
cloudCodeUnchanged:true,existingStagingPackageUnchanged:true,
safeClearPreserved:true,deletionHTTP503:true,realDeletionEnabled:false,
hostedDataUsed:false,productionReleaseApproved:false
}));
