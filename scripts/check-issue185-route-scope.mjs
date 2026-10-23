// Strict isolation from production, original PR181, Auth #183 and outfit #184.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const base='a42894cd2c7bf3ebc0019f69ba7112888e8fb04c';
execFileSync('git',['merge-base','--is-ancestor',base,'HEAD']);
const allowed=new Set([
 'scripts/build-restricted-staging.mjs','scripts/staging-support-navigation.mjs',
 'scripts/audit-staging-support-routes.mjs','scripts/test-staging-support-navigation-browser.mjs',
 'scripts/check-issue185-route-scope.mjs','tests/staging-support-navigation.test.mjs',
 '.github/workflows/issue-185-staging-support-routes-qa.yml',
 'docs/ISSUE-185-STAGING-SUPPORT-ROUTES.md','docs/PROGRESS-CHECKPOINT.md',
 'benchmark/issue185-original-route-inventory.json','benchmark/issue185-anonymous-route-observations.json'
]);
const paths=execFileSync('git',['diff','--name-only',base,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
for(const path of paths)assert.ok(allowed.has(path),'Out of issue185 staging-only scope: '+path);
assert.ok(paths.length>0);console.log('ISSUE185_STAGING_ONLY_SCOPE '+JSON.stringify({changedPaths:paths.length,customerSourceUnchanged:true,supabaseUnchanged:true,originalPackagingWorkflowUnchanged:true,productionDeploymentWorkflowsUnchanged:true,deployAuthorized:false}));
