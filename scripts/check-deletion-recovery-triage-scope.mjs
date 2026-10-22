// Fail-closed read-only incident assessment development branch audit.
// A green result does NOT make a production or hosted recovery endpoint safe.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const BASE='0ec8727f24c8ac6df249527120a7bdb4a3cc2dd2';
const MAIN='54c9e29ede069a05d1268e003f80cbda043c7d6a';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:9500000}).trim();
execFileSync('git',['merge-base','--is-ancestor',BASE,'HEAD']);
assert.equal(git('rev-parse','origin/main'),MAIN,'Live main changed: pause and review');
const allowed=[
 'supabase/functions/account-delete/recovery-assessor.mjs',
 'supabase/design/account-deletion-write-barrier.DRAFT.sql',
 'tests/account-deletion-recovery-assessor.test.mjs',
 'tests/account-deletion-lock-postgres.sql',
 'docs/ACCOUNT-DELETION-RECOVERY-TRIAGE-20261022.md',
 'scripts/check-deletion-recovery-triage-scope.mjs',
 '.github/workflows/account-recovery-triage-main-qa.yml',
 '.github/workflows/account-recovery-triage-postgres-qa.yml'
];
const changed=git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean);
assert.deepEqual(changed.sort(),allowed.sort(),'Unexpected modifications outside approved recovery assessment scope');
for(const path of ['public','benchmark','supabase/cloud-backup.sql',
 'supabase/functions/account-delete/index.ts',
 'supabase/functions/account-delete/deletion-coordinator.mjs',
 'supabase/functions/account-delete/supabase-adapters.mjs',
 'scripts/build-restricted-staging.mjs',
 'docs/RESTRICTED-STAGING-SETUP-20261021.md',
 '.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml'])
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',BASE+':'+path),
  'Production endpoint, user data, photo or app source altered: '+path);
const entry=readFileSync('supabase/functions/account-delete/index.ts','utf8');
assert.match(entry,/status:503/);assert.match(entry,/deletionCompleted:false/);
assert.doesNotMatch(entry,/recovery-assessor|createDeletionRecoveryAssessor/);
const observer=readFileSync('supabase/functions/account-delete/recovery-assessor.mjs','utf8');
assert.match(observer,/enabled=false/);assert.match(observer,/authorizeOperator/);
for(const denial of ['mayResumeAutomatically:false','mayReleaseTombstone:false',
 'mayStartCleanupWorker:false','mayChangeAuth:false'])
 assert.ok(observer.includes(denial),'Unsafe missing recovery denial: '+denial);
assert.doesNotMatch(observer,/storage\.remove|deleteUser\(|removePhotos\(|Deno\.serve/);
const sql=readFileSync('supabase/design/account-deletion-write-barrier.DRAFT.sql','utf8');
assert.match(sql,/create or replace function closet_internal\.inspect_deletion_claim_status/);
assert.match(sql,/security invoker/);
assert.match(sql,/grant execute on function closet_internal\.inspect_deletion_claim_status\(uuid\)\s+to service_role/);
for(const [workflow,needles] of [
 ['.github/workflows/account-recovery-triage-main-qa.yml',
  ['check-deletion-recovery-triage-scope.mjs','node --test tests/*.test.cjs tests/*.test.mjs',
   'test-disposable-supabase-security.mjs','test-guided-linked-phone-evidence-browsers.mjs']],
 ['.github/workflows/account-recovery-triage-postgres-qa.yml',
  ['tests/account-deletion-lock-postgres.sql','test-account-deletion-lock-race.mjs',
   'tests/account-deletion-recovery-assessor.test.mjs']]
 ]){
 const w=readFileSync(workflow,'utf8');
 for(const needle of needles)assert.ok(w.includes(needle),'Missing QA coverage: '+needle);
}
console.log(JSON.stringify({status:'READ_ONLY_RECOVERY_ASSESSMENT_SCOPE_PASS',
 verifiedParent:BASE,changedPaths:changed.length,liveMainUntouched:true,
 accountDeletionHttpEndpointStill503:true,
 publicSourceOriginalPhotosUnchanged:true,draftPrivateSqlOnly:true,
 incidentAssessorDeployed:false,workerResumeAuthorized:false,
 actualPhysicalPhonesVerified:0,pilotAndProduction:'BLOCKED'}));
