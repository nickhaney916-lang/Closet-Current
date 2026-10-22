// Independent private-phone evidence workflow only; cannot mutate customer UI,
// real photos, account/cloud state or production/deployment infrastructure.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const BASE='8312fc81f0f24e074b3919303a869eeaa4ca97ef';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:10000000}).trim();
execFileSync('git',['merge-base','--is-ancestor',BASE,'HEAD']);
const allowed=new Set([
 'scripts/linked-phone-garment-evidence.mjs',
 'scripts/build-linked-phone-evidence.mjs',
 'scripts/test-linked-phone-evidence-browsers.mjs',
 'scripts/test-guided-linked-phone-evidence-browsers.mjs',
 'tests/guided-linked-phone-evidence.test.mjs',
 'docs/LINKED-PHONE-EVIDENCE-20261021.md',
 'scripts/check-guided-original-phone-scope.mjs',
 '.github/workflows/guided-original-first-phone-qa.yml'
]);
const changed=git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean);
for(const path of changed)assert.ok(allowed.has(path),'Unexpected change: '+path);
assert.equal(changed.length,allowed.size,'Guided phone scope is missing or changed');
for(const dir of ['public','supabase','benchmark','.github/workflows/pages.yml',
 '.github/workflows/cloudflare-pages.yml',
 'scripts/build-restricted-staging.mjs','scripts/verify-restricted-staging-bundle.mjs',
 'scripts/check-staging-anonymous-access.mjs','scripts/build-phone-recognition-triage.mjs',
 'scripts/phone-recognition-triage.mjs',
 'docs/RESTRICTED-STAGING-SETUP-20261021.md'])
 assert.equal(git('rev-parse','HEAD:'+dir),git('rev-parse',BASE+':'+dir),
  'Protected production/photo/recognition/staging code changed: '+dir);
const a=readFileSync('.github/workflows/guided-original-first-phone-qa.yml','utf8');
for(const needle of ['test-guided-linked-phone-evidence-browsers.mjs',
 'test-linked-phone-evidence-browsers.mjs','check-guided-original-phone-scope.mjs',
 'node --test tests/*.test.cjs tests/*.test.mjs','test-disposable-supabase-security.mjs',
 'test-staging-installed-pwa-chromium.mjs'])
 assert.ok(a.includes(needle),'Expected regression path missing: '+needle);
const html=readFileSync('scripts/build-linked-phone-evidence.mjs','utf8');
assert.ok(html.includes('connect-src &#39;none&#39;'));
assert.ok(html.includes('Next unfinished garment on this phone'));
assert.ok(html.includes('Nothing saves automatically.'));
console.log(JSON.stringify({scope:'GUIDED_LINKED_PHONE_REVIEW_ONLY',parent:BASE,
 changedPaths:changed,originalSourceBeforeCropUnchanged:true,
 customerAuthStorageAndPhotosUnchanged:true,workStagingUntouched:true,
 genuinePhysicalPhonesTested:0,productionPromotion:'BLOCKED'}));
