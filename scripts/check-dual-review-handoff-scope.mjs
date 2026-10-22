// CI scope guard: new code is a review-only design; NO live deletion,
// cloud migration, paid resources, production changes or customer access.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const BASE='d5770b1f3709aaf2ae5154d5cde10087e28befae';
const MAIN='54c9e29ede069a05d1268e003f80cbda043c7d6a';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:11000000}).trim();
execFileSync('git',['merge-base','--is-ancestor',BASE,'HEAD']);
assert.equal(git('rev-parse','origin/main'),MAIN,
 'Production main moved: abort and independently review ancestry');
const allowed=[
 'supabase/functions/account-delete/recovery-handoff.mjs',
 'tests/account-deletion-recovery-handoff.test.mjs',
 'docs/ACCOUNT-DELETION-DUAL-REVIEW-HANDOFF-20261022.md',
 'scripts/check-dual-review-handoff-scope.mjs',
 '.github/workflows/dual-review-handoff-security-qa.yml',
 '.github/workflows/dual-review-handoff-postgres-qa.yml'
];
const files=git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean);
assert.deepEqual(files.sort(),allowed.sort(),'Unapproved source change, branch must stay isolated');
for(const path of ['public','benchmark','supabase/cloud-backup.sql',
 'supabase/design/account-deletion-write-barrier.DRAFT.sql',
 'supabase/functions/account-delete/index.ts',
 'supabase/functions/account-delete/deletion-coordinator.mjs',
 'supabase/functions/account-delete/supabase-adapters.mjs',
 'supabase/functions/account-delete/recovery-assessor.mjs',
 'scripts/build-restricted-staging.mjs',
 'scripts/check-staging-anonymous-access.mjs',
 '.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml',
 'docs/RESTRICTED-STAGING-SETUP-20261021.md']){
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',BASE+':'+path),
  'Protected app, live deletion, Auth, photo recognition, staging or customer database changed: '+path);
}
const source=readFileSync('supabase/functions/account-delete/recovery-handoff.mjs','utf8');
assert.ok(source.includes('enabled=false')&&source.includes('authorizeIncident'));
assert.ok(source.includes("role:'incident_owner'"));
assert.ok(source.includes("role:'security_reviewer'"));
assert.ok(source.includes('verifyWorkerFenced')&&source.includes('snapshotState(second)'));
for(const deny of ['recoveryAuthorized:false','mayUnlock:false',
 'mayRemoveClaim:false','mayRetryCleanup:false',
 'mayDeleteStorage:false','mayDeleteAuth:false'])
 assert.ok(source.includes(deny),'Unsafe enabling permission in handoff: '+deny);
assert.doesNotMatch(source,/Deno\.serve|supabase\.rpc|storage\.remove|deleteUser\(|removePhotos\(|drop table/);
const entry=readFileSync('supabase/functions/account-delete/index.ts','utf8');
assert.match(entry,/status:503/);assert.match(entry,/deletionCompleted:false/);
assert.doesNotMatch(entry,/createDeletionRecoveryHandoff|recovery-handoff/);
const qa=readFileSync('.github/workflows/dual-review-handoff-security-qa.yml','utf8');
for(const item of ['check-dual-review-handoff-scope.mjs',
 'node --test tests/*.test.cjs tests/*.test.mjs',
 'test-disposable-supabase-security.mjs',
 'account-deletion-recovery-handoff.test.mjs'])
 assert.ok(qa.includes(item),'Missing inherited/new full security checks: '+item);
const pg=readFileSync('.github/workflows/dual-review-handoff-postgres-qa.yml','utf8');
for(const item of ['tests/account-deletion-lock-postgres.sql',
 'test-account-deletion-lock-race.mjs','account-deletion-recovery-handoff.test.mjs'])
 assert.ok(pg.includes(item),'Missing Postgres/worker-race coverage: '+item);
console.log(JSON.stringify({
 checkpoint:'DUAL_REVIEW_HANDOFF_DESIGN_ONLY',parentVerifiedDevelopment:BASE,
 sourceFilesChanged:files.length,publicAppAndPhotosUnchanged:true,
 productionDeletionHttpStill503:true,originalFirstFullResolutionRecognitionUnchanged:true,
 hostedMigrationApplied:false,actualAccountRecoveryEnabled:false,
 cloudflareAndDriveDuelUnchanged:true,
 validatedPhysicalPhones:0,independentOriginalScenes:0,
 release:'BLOCKED'
}));
