// Strict audit: draft exclusive deletion claim ONLY, never production/account data.
// A green test is NOT authorization to activate deletion or deploy SQL.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const BASE='c3d6284e9f17435b99f672bcb0473c68d63dac4f';
const MAIN='54c9e29ede069a05d1268e003f80cbda043c7d6a';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:9e6}).trim();
execFileSync('git',['merge-base','--is-ancestor',BASE,'HEAD']);
assert.equal(git('rev-parse','origin/main'),MAIN,
 'Production main changed; abort pending independent reconciliation');
const allowed=new Set([
 'supabase/functions/account-delete/deletion-coordinator.mjs',
 'supabase/functions/account-delete/supabase-adapters.mjs',
 'supabase/design/account-deletion-write-barrier.DRAFT.sql',
 'tests/account-deletion-coordinator.test.mjs',
 'tests/account-deletion-supabase-adapters.test.mjs',
 'tests/account-deletion-lock-postgres.sql',
 'scripts/test-local-supabase-storage-deletion.mjs',
 'scripts/test-local-supabase-sdk-account-deletion.mjs',
 'docs/ACCOUNT-DELETION-DEVELOPMENT-GATE-20261018.md',
 'scripts/check-exclusive-account-deletion-scope.mjs',
 '.github/workflows/account-cleanup-exclusive-main-qa.yml',
 '.github/workflows/account-cleanup-exclusive-postgres-qa.yml',
 '.github/workflows/account-cleanup-exclusive-sdk-qa.yml'
]);
const changed=git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean);
assert.deepEqual(changed.sort(),[...allowed].sort(),'Unapproved or missing source change');
for(const protectedPath of ['public','benchmark','.github/workflows/pages.yml',
 '.github/workflows/cloudflare-pages.yml','supabase/cloud-backup.sql',
 'supabase/functions/account-delete/index.ts',
 'docs/RESTRICTED-STAGING-SETUP-20261021.md',
 'scripts/build-restricted-staging.mjs',
 'scripts/check-staging-anonymous-access.mjs']){
 assert.equal(git('rev-parse','HEAD:'+protectedPath),
  git('rev-parse',BASE+':'+protectedPath),
  'Protected account, image, SQL, site or production source changed: '+protectedPath);
}
const entry=readFileSync('supabase/functions/account-delete/index.ts','utf8');
assert.match(entry,/status:503/);
assert.match(entry,/deletionCompleted:false/);
assert.doesNotMatch(entry,/createSupabaseDeletionAdapters|createAccountDeletionCoordinator|Deno\.env\.get/);
const coord=readFileSync('supabase/functions/account-delete/deletion-coordinator.mjs','utf8');
const sql=readFileSync('supabase/design/account-deletion-write-barrier.DRAFT.sql','utf8');
const adapter=readFileSync('supabase/functions/account-delete/supabase-adapters.mjs','utf8');
assert.match(coord,/claimCleanup\(uid\)/);
assert.match(coord,/if\(await claimCleanup\(uid\)!==true\)/);
assert.match(sql,/create table if not exists closet_internal\.deletion_cleanup_claims/);
assert.match(sql,/primary key/);
assert.match(sql,/on conflict\(owner_id\) do nothing/);
assert.match(sql,/revoke all on function public\.claim_closet_account_cleanup\(uuid\)/);
assert.match(adapter,/adminClient\.rpc\('claim_closet_account_cleanup'/);
const a=readFileSync('.github/workflows/account-cleanup-exclusive-main-qa.yml','utf8');
for(const required of ['check-exclusive-account-deletion-scope.mjs',
 'node --test tests/*.test.cjs tests/*.test.mjs',
 'test-disposable-supabase-security.mjs',
 'test-guided-linked-phone-evidence-browsers.mjs'])
 assert.ok(a.includes(required),'Missing inherited regression: '+required);
const b=readFileSync('.github/workflows/account-cleanup-exclusive-postgres-qa.yml','utf8');
for(const required of ['tests/account-deletion-lock-postgres.sql',
 'test-account-deletion-lock-race.mjs'])
 assert.ok(b.includes(required),'Missing true database check: '+required);
const c=readFileSync('.github/workflows/account-cleanup-exclusive-sdk-qa.yml','utf8');
for(const required of ['supabase/design/account-deletion-write-barrier.DRAFT.sql',
 'scripts/test-local-supabase-storage-deletion.mjs',
 'scripts/test-local-supabase-sdk-account-deletion.mjs'])
 assert.ok(c.includes(required),'Missing local Supabase SDK/Storage verification: '+required);
console.log(JSON.stringify({audit:'ACCOUNT_DELETION_EXCLUSIVE_CLAIM_ONLY',
 branchSource:BASE,changedPaths:changed.length,
 clientAppAndOriginalPhotoProcessingUnmodified:true,
 accountDeleteHttpEntrypoint503:true,
 draftSqlOnly:true,hostedMigrationsApplied:false,
 exclusiveClaimOnWorkerCrashRequiresManualRecovery:true,
 payForServices:false,realDeviceEvidence:0,release:'BLOCKED'}));
