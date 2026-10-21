import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const WORK='55ac1688cac4dd277ee82ee9c73c4df9cefcb77c',ARTIFACT='3e594a5714b7822ada852cd74d8bc5dc2d51c6ad',LOCK='e67edcaa34e6c4ed9f93cc8edd6c204a7b15db80';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:5000000}).trim();
for(const sha of [WORK,ARTIFACT,LOCK])execFileSync('git',['merge-base','--is-ancestor',sha,'HEAD']);
const changes=git('diff','--name-only',LOCK,ARTIFACT).split('\n').filter(Boolean);
const special=new Set(['docs/PROGRESS-CHECKPOINT.md','scripts/check-staging-preflight-scope.mjs']);
const exact=changes.filter(path=>!special.has(path));
for(const path of ['scripts/check-staging-artifact-integrity.mjs','tests/staging-artifact-integrity.test.mjs','scripts/verify-restricted-staging-bundle.mjs','tests/restricted-staging-integration.test.mjs'])
 assert.ok(exact.includes(path),'Missing required artifact verifier provenance: '+path);
for(const path of exact)assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',ARTIFACT+':'+path),
 'Verified PR #160 source changed: '+path);
for(const path of ['public','supabase','.github/workflows/pages.yml',
 '.github/workflows/cloudflare-pages.yml','scripts/atomic-staging-output.mjs',
 'tests/atomic-staging-output.test.mjs'])
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',WORK+':'+path),
 'Verified security/camera/cloud/build-lock source overwritten: '+path);
const scope=readFileSync('scripts/check-staging-preflight-scope.mjs','utf8');
assert.match(scope,/check-integrated-security-mobile-staging\.mjs/);
assert.match(scope,/check-final-integrated-artifact-review\.mjs/);
const existing=readFileSync('scripts/check-integrated-security-mobile-staging.mjs','utf8');
assert.match(existing,/PINNED_VERIFIED_PARENTS/);
const log=readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8');
const workLog=git('show',WORK+':docs/PROGRESS-CHECKPOINT.md');
const artifactLog=git('show',ARTIFACT+':docs/PROGRESS-CHECKPOINT.md');
const stanza=artifactLog.split('\n---\n')[0];
assert.ok(stanza.includes('Draft PR #160')&&log.includes(stanza),'PR #160 evidence missing');
assert.ok(log.includes(workLog),'PR #159 checkpoint history missing');
const verifier=readFileSync('scripts/verify-restricted-staging-bundle.mjs','utf8');
assert.match(verifier,/checkStagingArtifactIntegrity\(dir\)/);
console.log(JSON.stringify({status:'INTEGRATED_ARTIFACT_SOURCES_PINNED',
 work:WORK,artifact:ARTIFACT,byteIdenticalArtifactFiles:exact.length,
 customerSourceByteIdentical:true,liveDatabaseModified:false,
 productionDeploymentApproved:false,physicalPhoneVerified:false,
 productionPromotion:'BLOCKED'}));
