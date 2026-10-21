// Strict successor integration guard: this branch only adds offline aggregate triage.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const BASE='15b84821c8ecd3c7ce76baf2c5835ab5742ca6ac';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:9000000}).trim();
execFileSync('git',['merge-base','--is-ancestor',BASE,'HEAD']);
const allowed=new Set([
 'scripts/phone-recognition-triage.mjs',
 'scripts/build-phone-recognition-triage.mjs',
 'scripts/test-phone-recognition-triage-browsers.mjs',
 'scripts/check-phone-triage-scope.mjs',
 'tests/phone-recognition-triage.test.mjs',
 'docs/PHONE-RECOGNITION-TRIAGE-20261021.md',
 'scripts/check-integrated-security-mobile-staging.mjs',
 'scripts/check-linked-phone-trial-scope.mjs',
 'scripts/check-integrated-phone-staging-scope.mjs',
 '.github/workflows/integrated-phone-staging-all-assets-qa.yml'
]);
for(const path of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))
 assert.ok(allowed.has(path),'Unapproved customer/cloud/security change: '+path);
for(const path of ['public','supabase','benchmark','scripts/linked-phone-garment-evidence.mjs',
 'scripts/build-linked-phone-evidence.mjs','scripts/staging-asset-seal.mjs',
 'scripts/build-restricted-staging.mjs','scripts/check-staging-anonymous-access.mjs',
 'tests/staging-anonymous-full-bundle.test.mjs','scripts/private-pilot-session.mjs',
 'scripts/build-private-pilot-kit.mjs',
 '.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml'])
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',BASE+':'+path),
 'Previously verified original-first, customer, Access or staging source changed: '+path);
const wf=readFileSync('.github/workflows/integrated-phone-staging-all-assets-qa.yml','utf8');
for(const piece of ['test-phone-recognition-triage-browsers.mjs',
 'build-phone-recognition-triage.mjs','PHONE-TRIAGE.html',
 'check-phone-triage-scope.mjs','tests/*.test.mjs',
 'test-disposable-supabase-security.mjs',
 'test-linked-phone-evidence-browsers.mjs',
 'test-staging-installed-pwa-chromium.mjs',
 'pathsFromVerifiedStaging','actions/upload-artifact@v4'])
 assert.ok(wf.includes(piece),'Expected inherited/new QA missing: '+piece);
console.log(JSON.stringify({status:'PHONE_RECOGNITION_TRIAGE_SCOPE_PINNED',
 originalFirstRecognitionPreserved:true,independentHardwareVerified:false,
 genuinelyIndependentlyLabeledScenes:0,verifiedAccuracy:null,
 realAccessProtectedStagingVerified:false,productionPromotion:'BLOCKED'}));
