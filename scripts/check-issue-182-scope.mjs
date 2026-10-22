// Independent QA is additive; preserve every runtime and hosting file at #180.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const base='083f9c234a0a0829476df25287ccf8ff638af937';
git('merge-base','--is-ancestor',base,'HEAD');
const allowed=['docs/PROGRESS-CHECKPOINT.md','docs/ISSUE-182-STAGING-AUTH-QA.md','tests/issue-182-staging-auth.test.cjs','scripts/check-issue-182-scope.mjs'];
const changed=git('diff','--name-only',base,'HEAD').split('\n').filter(Boolean);
assert.deepEqual(changed.sort(),allowed.sort());
for(const path of ['public','supabase','.github','scripts/build-restricted-staging.mjs','scripts/build-connected-staging-candidate.mjs'])assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',base+':'+path),path+' changed');
console.log('ISSUE_182_ADDITIVE_QA_SCOPE_PASS; production promotion BLOCKED');
