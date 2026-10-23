// QA-only branch guard. Never modifies repository or invokes external services.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const base='50223902df0ae54ff15bb89bd9100ddc76bb3581';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
git('merge-base','--is-ancestor',base,'HEAD');
const allowed=new Set([
 'tests/helpers/issue196-deletion-fixture.mjs',
 'tests/helpers/issue196-no-network.cjs',
 'tests/issue196-offline-deletion-lifecycle.test.mjs',
 'tests/issue196-network-denial.test.mjs',
 'scripts/check-issue196-offline-scope.mjs',
 '.github/workflows/issue196-offline-deletion-qa.yml',
 'docs/ISSUE-196-OFFLINE-DELETION-PROOF.md',
 'docs/PROGRESS-CHECKPOINT.md'
]);
const changed=git('diff','--name-only',base).split('\n').filter(Boolean);
assert.ok(changed.length>0);
for(const path of changed)assert.ok(allowed.has(path),'Out of issue196 QA-only scope: '+path);
// Explicitly pin complete app, all active and draft backend code, existing tests,
// builders and original workflows via the repository-wide diff allowlist above.
const prior=execFileSync('git',['show',base+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(prior),'Historical checkpoint must be preserved');
const workflow=readFileSync('.github/workflows/issue196-offline-deletion-qa.yml','utf8');
assert.doesNotMatch(workflow,/secrets\.|id-token:\s*write|supabase\s+(?:start|db|functions)|wrangler|upload-artifact/);
assert.match(readFileSync('supabase/functions/account-delete/index.ts','utf8'),/status:503/);
console.log('ISSUE196_QA_ONLY_SCOPE '+JSON.stringify({base,changedPaths:changed.length,applicationUnchanged:true,allSupabaseCodeUnchanged:true,existingWorkflowsUnchanged:true,endpointDisabled:true,realServiceTested:false,deployAuthorized:false}));
