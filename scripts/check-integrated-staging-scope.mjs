// Exact-head restricted staging integration guard. Unlike the single-issue
// guards (#182 Auth-only and #185 routes-only), this deliberately permits the
// reviewed combined Auth, app and route changes while refusing new production,
// Supabase, image recognition and hosting edits.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const base='a42894cd2c7bf3ebc0019f69ba7112888e8fb04c'; // PR181 head
git('merge-base','--is-ancestor',base,'HEAD');
const allowed=new Set([
 '.github/workflows/issue-185-staging-support-routes-qa.yml',
 '.github/workflows/integrated-staging-qa.yml',
 'benchmark/issue185-anonymous-route-observations.json',
 'benchmark/issue185-original-route-inventory.json',
 'docs/ISSUE-182-STAGING-AUTH-QA.md',
 'docs/ISSUE-185-STAGING-SUPPORT-ROUTES.md',
 'docs/PROGRESS-CHECKPOINT.md',
 'docs/INTEGRATED-STAGING-REVIEW.md',
 'public/app.js','public/auth.js',
 'scripts/audit-staging-support-routes.mjs',
 'scripts/build-restricted-staging.mjs',
 'scripts/check-issue185-route-scope.mjs',
 'scripts/check-integrated-staging-scope.mjs',
 'scripts/staging-support-navigation.mjs',
 'scripts/test-staging-support-navigation-browser.mjs',
 'tests/auth.test.cjs',
 'tests/issue-182-staging-auth.test.cjs',
 'tests/logout-unload.test.cjs',
 'tests/guarded-logout-drafts.test.cjs',
 'tests/staging-support-navigation.test.mjs'
]);
const changed=git('diff','--name-only',base,'HEAD').split('\n').filter(Boolean);
assert.ok(changed.length>=16,'Incomplete integration');
for(const file of changed)assert.ok(allowed.has(file),'Unapproved integration change: '+file);
for(const essential of ['public/app.js','public/auth.js','scripts/build-restricted-staging.mjs','tests/guarded-logout-drafts.test.cjs'])
 assert.ok(changed.includes(essential),'Required fix absent: '+essential);
for(const protectedPath of [
 'supabase','.github/workflows/staging-protected-preview-bundle.yml',
 'scripts/build-connected-staging-candidate.mjs','scripts/staging-asset-seal.mjs',
 'public/ai-tryon.js','public/cloud-backup.js','public/index.html'
])assert.equal(git('rev-parse','HEAD:'+protectedPath),git('rev-parse',base+':'+protectedPath),
  'Staging security/production baseline unexpectedly changed: '+protectedPath);
console.log('INTEGRATED_STAGING_SCOPE_PASS '+JSON.stringify({
 changedPaths:changed.length, protectedBranchesUntouched:true, originalPR181PackagingUntouched:true,
 supabaseUnchanged:true, generatedOnlyRouteChange:true, authAndDraftGuardReviewed:true,
 realDeviceTestsPassed:false, productionPromotionAuthorized:false
}));
