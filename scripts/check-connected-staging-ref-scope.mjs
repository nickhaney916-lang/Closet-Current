// Scope and safety gate for connected staging ref-only offline wrapper.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const BASE='21438017d98ffd199d81cf77b8ff98b072de2c01';
execFileSync('git',['merge-base','--is-ancestor',BASE,'HEAD']);
const allowed=[
 '.github/workflows/connected-staging-ref-qa.yml',
 'docs/CONNECTED-STAGING-SUPABASE-20261022.md',
 'scripts/build-connected-staging-candidate.mjs',
 'scripts/check-connected-staging-ref-scope.mjs',
 'tests/connected-staging-candidate.test.mjs'
];
const files=git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean);
assert.deepEqual(files.sort(),allowed.sort(),'Unexpected protected production, cloud or app modification');
for(const path of ['public','supabase','benchmark','scripts/build-restricted-staging.mjs',
 'scripts/verify-restricted-staging-bundle.mjs',
 '.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml']){
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',BASE+':'+path),
 'Stage wrapper must not change production/cloud/script: '+path);
}
const source=readFileSync('scripts/build-connected-staging-candidate.mjs','utf8');
assert.match(source,/fbnplztkbsteuzrmbgib/);
assert.match(source,/readyToDeploy:false/);
assert.match(source,/cloudflareAccessVerified:false/);
assert.match(source,/release:'BLOCKED'/);
assert.doesNotMatch(source,/wrangler pages deploy|create_project|apply_migration|execute_sql|service_role_/);
const workflow=readFileSync('.github/workflows/connected-staging-ref-qa.yml','utf8');
assert.match(workflow,/node --test tests\/\*\.test\.cjs tests\/\*\.test\.mjs/);
assert.match(workflow,/test-disposable-supabase-security\.mjs/);
console.log(JSON.stringify({status:'CONNECTED_STAGING_REF_PIN_ONLY',
 actualVerifiedBackendProjectRef:'fbnplztkbsteuzrmbgib',
 stageClientKeyNotReadFromHostedEnvironment:true,
 productionChanges:false,cloudflareAccessStillUnverified:true,
 realHostOperations:false,release:'BLOCKED'}));
