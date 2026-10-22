// Pin both completed development parents and preserve every inherited source.
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const STAGING='c0fecc398ea927418c5e083607bdc1cf6ea77527';
const SECURITY='cca2f7c98f69d5aad416e6174182ac3f66b9b951';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:4000000}).trim();
for(const sha of [STAGING,SECURITY])execFileSync('git',['merge-base','--is-ancestor',sha,'HEAD']);
const LOCKING='e67edcaa34e6c4ed9f93cc8edd6c204a7b15db80';
const PRIOR_INTEGRATION='232a735f99af0da73df2e7095508c2a99e8df6da';
const withLock=spawnSync('git',['merge-base','--is-ancestor',LOCKING,'HEAD']).status===0;
if(withLock)execFileSync('git',['merge-base','--is-ancestor',PRIOR_INTEGRATION,'HEAD']);
const lockFiles=new Set(withLock?git('diff','--name-only',STAGING,LOCKING).split('\n'):[]);
const common=git('merge-base',STAGING,SECURITY);
const incoming=new Set(git('diff','--name-only',common,SECURITY).split('\n'));
const own=new Set(['scripts/check-integrated-security-mobile-staging.mjs',
 'scripts/check-staging-preflight-scope.mjs','docs/PROGRESS-CHECKPOINT.md',
 'docs/INTEGRATED-SECURITY-MOBILE-STAGING-20261021.md',
 '.github/workflows/integrated-security-mobile-staging-qa.yml']);
if(withLock)for(const path of ['docs/FINAL-INTEGRATED-STAGING-BUILD-20261021.md',
 '.github/workflows/final-integrated-staging-build-qa.yml'])own.add(path);
for(const path of [".github/workflows/staging-artifact-integrity-qa.yml","docs/STAGING-ARTIFACT-REVIEW-20261021.md","scripts/check-staging-artifact-integrity.mjs","scripts/verify-restricted-staging-bundle.mjs","tests/staging-artifact-integrity.test.mjs","tests/restricted-staging-integration.test.mjs","scripts/check-staging-preflight-scope.mjs","docs/PROGRESS-CHECKPOINT.md","scripts/check-final-integrated-artifact-review.mjs",".github/workflows/final-integrated-artifact-review-qa.yml","docs/FINAL-INTEGRATED-ARTIFACT-REVIEW-20261021.md"])own.add(path);
for(const path of [".github/workflows/staging-asset-seal-qa.yml","docs/STAGING-ASSET-SEAL-20261021.md","scripts/build-restricted-staging.mjs","scripts/staging-asset-seal.mjs","scripts/verify-restricted-staging-bundle.mjs","tests/restricted-staging-integration.test.mjs","tests/staging-asset-seal.test.mjs","scripts/check-integrated-security-mobile-staging.mjs","scripts/check-final-integrated-artifact-review.mjs","scripts/check-integrated-asset-seal.mjs","scripts/check-staging-preflight-scope.mjs","docs/PROGRESS-CHECKPOINT.md","docs/FINAL-INTEGRATED-ASSET-SEAL-20261021.md",".github/workflows/final-integrated-asset-seal-qa.yml"])own.add(path);
if(spawnSync('git',['merge-base','--is-ancestor','1572145211fbeef582f4286dd3bcb796e7ccc191','HEAD']).status===0){
 const pilot=await import('./check-private-pilot-kit-scope.mjs');
 pilot.checkPilotScope();
 for(const path of pilot.pilotFiles)own.add(path);
}
for(const path of ['docs/FINAL-INTEGRATED-PILOT-VALIDATION-20261021.md',
 '.github/workflows/final-integrated-pilot-validation-qa.yml',
 'scripts/check-final-integrated-pilot-validation.mjs'])own.add(path);
for(const path of ["scripts/linked-phone-garment-evidence.mjs","scripts/build-linked-phone-evidence.mjs","scripts/test-linked-phone-evidence-browsers.mjs","scripts/check-linked-phone-trial-scope.mjs","tests/linked-phone-garment-evidence.test.mjs","tests/build-linked-phone-evidence.test.mjs","docs/LINKED-PHONE-EVIDENCE-20261021.md",".github/workflows/linked-phone-evidence-qa.yml"])own.add(path);
for(const path of [".github/workflows/staging-all-assets-access-qa.yml","docs/STAGING-ALL-ASSETS-ACCESS-20261021.md","scripts/check-staging-anonymous-access.mjs","tests/staging-anonymous-access.test.mjs","tests/staging-anonymous-full-bundle.test.mjs","docs/INTEGRATED-PHONE-STAGING-20261021.md",".github/workflows/integrated-phone-staging-all-assets-qa.yml","scripts/check-integrated-phone-staging-scope.mjs"])own.add(path);
own.add('scripts/test-staging-runtime-browsers.mjs');
for(const path of ["scripts/phone-recognition-triage.mjs","scripts/build-phone-recognition-triage.mjs","scripts/test-phone-recognition-triage-browsers.mjs","tests/phone-recognition-triage.test.mjs","docs/PHONE-RECOGNITION-TRIAGE-20261021.md","scripts/check-phone-triage-scope.mjs"])own.add(path);
for(const path of ["docs/RESTRICTED-STAGING-SETUP-20261021.md","tests/staging-root-preview-access-coverage.test.mjs"])own.add(path);
const pinnedLock=path=>withLock&&lockFiles.has(path)&&!own.has(path);
const checkLock=path=>assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',LOCKING+':'+path),'Verified build locking source overwritten: '+path);
if(withLock)for(const path of git('diff','--name-only',PRIOR_INTEGRATION,'HEAD').split('\n').filter(Boolean)){
 if(own.has(path))continue;
 assert.ok(pinnedLock(path),'Unexpected change relative to verified #157: '+path);checkLock(path);
}
for(const path of git('diff','--name-only',STAGING,'HEAD').split('\n').filter(Boolean)){
 if(own.has(path))continue;
 if(pinnedLock(path)){checkLock(path);continue;}
 assert.ok(incoming.has(path),'Unexpected integration change: '+path);
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',SECURITY+':'+path),'Verified security source overwritten: '+path);
}
for(const path of git('diff','--name-only',SECURITY,'HEAD').split('\n').filter(Boolean)){
 if(own.has(path))continue;
 if(pinnedLock(path)){checkLock(path);continue;}
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',STAGING+':'+path),'Verified staging/mobile source overwritten: '+path);
}
assert.equal(git('rev-parse','HEAD:public'),git('rev-parse',STAGING+':public'));
assert.equal(git('rev-parse','HEAD:public'),git('rev-parse',SECURITY+':public'));
assert.equal(git('rev-parse','HEAD:supabase'),git('rev-parse',SECURITY+':supabase'));
for(const p of ['supabase/cloud-backup.sql','supabase/migrations','supabase/functions',
 '.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml'])
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',STAGING+':'+p),'Production source changed: '+p);
// Preserve both conflicting checkpoint histories; store the common suffix once.
const a=execFileSync('git',['show',STAGING+':docs/PROGRESS-CHECKPOINT.md']);
const b=execFileSync('git',['show',SECURITY+':docs/PROGRESS-CHECKPOINT.md']);
let n=0;while(n<Math.min(a.length,b.length)&&a[a.length-1-n]===b[b.length-1-n])n++;
const log=readFileSync('docs/PROGRESS-CHECKPOINT.md');
assert.ok(n>1000&&log.includes(a.subarray(0,a.length-n))&&log.includes(b.subarray(0,b.length-n))&&log.subarray(-n).equals(a.subarray(-n)),'Checkpoint history lost');
assert.doesNotMatch(log.toString(),/^(<<<<<<<|=======|>>>>>>>) /m);
if(withLock){
 const c=execFileSync('git',['show',PRIOR_INTEGRATION+':docs/PROGRESS-CHECKPOINT.md']);
 const d=execFileSync('git',['show',LOCKING+':docs/PROGRESS-CHECKPOINT.md']);
 let m=0;while(m<Math.min(c.length,d.length)&&c[c.length-1-m]===d[d.length-1-m])m++;
 assert.ok(m>1000&&log.includes(c.subarray(0,c.length-m))&&log.includes(d.subarray(0,d.length-m))&&log.subarray(-m).equals(c.subarray(-m)),'Final candidate history lost');
 assert.equal(git('rev-parse','HEAD:public'),git('rev-parse',LOCKING+':public'));
}
console.log(JSON.stringify({integration:'PINNED_VERIFIED_PARENTS',staging:STAGING,security:SECURITY,
 buildLocking:withLock?LOCKING:null,priorIntegration:withLock?PRIOR_INTEGRATION:null,
 customerRuntimeChanged:false,fullResolutionOriginalRecognitionPreserved:true,
 securityAndMobileSourcesPreserved:true,hostedStagingVerified:false,physicalPhonesVerified:false,productionPromotion:'BLOCKED'}));
