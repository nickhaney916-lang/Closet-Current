// Two-parent integration contract: all imported staging access files are byte identical.
// The hosted Cloudflare policy and physical phone results remain unverified.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const PHONE='89216b5fa2568c5254e6c8693aa1887c799b4f9d', ACCESS='53c2f49517d89ef6074cdfa0eee99c4fb5fbba2d';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:9000000}).trim();
for(const sha of [PHONE,ACCESS])execFileSync('git',['merge-base','--is-ancestor',sha,'HEAD']);
const imported=[
 ".github/workflows/staging-all-assets-access-qa.yml",
 "docs/STAGING-ALL-ASSETS-ACCESS-20261021.md",
 "scripts/check-staging-anonymous-access.mjs",
 "tests/staging-anonymous-access.test.mjs",
 "tests/staging-anonymous-full-bundle.test.mjs"
];
for(const p of imported)assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',ACCESS+':'+p),
 'Staging security file differs from audited PR #165: '+p);
const permitted=new Set([...imported,
 'scripts/test-staging-runtime-browsers.mjs',
 'scripts/check-integrated-security-mobile-staging.mjs',
 'scripts/check-linked-phone-trial-scope.mjs',
 'scripts/check-integrated-phone-staging-scope.mjs',
 'docs/INTEGRATED-PHONE-STAGING-20261021.md',
 'docs/PROGRESS-CHECKPOINT.md',
 '.github/workflows/integrated-phone-staging-all-assets-qa.yml']);
for(const p of git('diff','--name-only',PHONE,'HEAD').split('\n').filter(Boolean))
 assert.ok(permitted.has(p),'Unauthorized change since phone validation #167: '+p);
for(const p of ['public','supabase','scripts/linked-phone-garment-evidence.mjs',
 'scripts/build-linked-phone-evidence.mjs','scripts/check-private-pilot-kit-scope.mjs',
 'scripts/build-restricted-staging.mjs','scripts/staging-asset-seal.mjs',
 '.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml'])
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',PHONE+':'+p),
 'Previously verified customer, phone, cloud or build source modified: '+p);
const log=readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8');
assert.ok(log.includes(git('show',PHONE+':docs/PROGRESS-CHECKPOINT.md')),
 'PR #167 original phone provenance missing');
assert.ok(log.includes(git('show',ACCESS+':docs/PROGRESS-CHECKPOINT.md').split('\n---\n')[0]),
 'PR #165 full-bundle access provenance missing');
const qa=readFileSync('.github/workflows/integrated-phone-staging-all-assets-qa.yml','utf8');
for(const word of ['check-integrated-phone-staging-scope.mjs',
 'staging-anonymous-full-bundle.test.mjs','pathsFromVerifiedStaging',
 'test-disposable-supabase-security.mjs','test-linked-phone-evidence-browsers.mjs',
 'test-staging-installed-pwa-chromium.mjs','actions/upload-artifact@v4'])
 assert.ok(qa.includes(word),'Consolidated offline security/phone CI missing: '+word);
console.log(JSON.stringify({result:'TWO_PARENT_PHONE_STAGING_ACCESS_SOURCE_PINNED',
 phoneSource:PHONE,accessSource:ACCESS,assetFilesByteIdentical:imported.length,
 originalPhotoBeforeCropPreserved:true,actualPhysicalPhoneTests:0,
 independentHumanOriginalReviews:0,verifiedRecognitionAccuracy:null,
 cloudflareHostedAccessPolicyVerified:false,productionPromotion:'BLOCKED'}));
